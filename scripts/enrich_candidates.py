"""
enrich_candidates.py — One-time candidate data enrichment script.

USAGE
-----
  # Install dependencies (run once):
  pip install -r scripts/requirements_enrich.txt

  # Dry-run (prints extracted data to stdout, writes nothing):
  python scripts/enrich_candidates.py --dry-run

  # Enrich a single candidate:
  python scripts/enrich_candidates.py --candidate claudia-lopez

  # Enrich all 6 candidates (writes candidates_canonical_enriched.json):
  python scripts/enrich_candidates.py

REVIEW & APPLY
--------------
  After the script finishes, review the diff summary it prints.
  Inspect candidates_canonical_enriched.json manually.
  When satisfied, rename/overwrite to apply:
    cp backend/data/candidates_canonical_enriched.json backend/data/candidates_canonical.json

WHAT IT DOES
------------
  1. Loads candidates_canonical.json (source of truth).
  2. For each candidate, fetches a list of pre-defined public URLs.
  3. Parses and cleans HTML → plain text using BeautifulSoup.
  4. Scores sentences per topic using keyword dictionaries.
  5. Detects candidate-attributed quote sentences (heuristic).
  6. Infers stance_score on 1–5 scale via polarity keywords.
  7. Adds/updates key_quotes, plain_language_summary, confidence, stance_score.
  8. Writes to candidates_canonical_enriched.json (never overwrites original).

HEURISTIC NOTES
---------------
  Stance inference: each topic has "left-leaning" and "right-leaning" keyword
  lists. Relative frequency of each set in the retrieved text produces a 1–5
  score: 1=far left position on that axis, 5=far right position.

  Quote detection: a sentence is treated as a candidate quote if:
  (a) it contains a Spanish speech verb (dijo, afirmó, etc.) AND
  (b) it contains the candidate's name or a first-person indicator, AND
  (c) it has ≥1 topic keyword.
  These are HEURISTIC – always verify manually before committing.
"""

import argparse
import copy
import json
import re
import sys
import time
from datetime import date
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies. Run: pip install -r scripts/requirements_enrich.txt")
    sys.exit(1)

# ── Paths ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
CANONICAL_PATH = ROOT / "backend" / "data" / "candidates_canonical.json"
OUTPUT_PATH    = ROOT / "backend" / "data" / "candidates_canonical_enriched.json"

# ── Topic keyword dictionaries ───────────────────────────────────────────────
# Each topic has a list of keywords for sentence relevance scoring.

TOPIC_KEYWORDS: dict[str, list[str]] = {
    "security": [
        "guerrilla", "paz", "farc", "eln", "militares", "policía", "crimen",
        "fuerza pública", "negociación", "armados", "violencia", "seguridad",
        "paramilitares", "combate", "orden público", "mano dura", "delincuencia",
        "narcotráfico", "terrorismo", "conflicto armado", "paz total",
    ],
    "economy": [
        "empleo", "inversión", "empresa", "impuesto", "pib", "crecimiento",
        "mercado", "reforma agraria", "tierras", "salario", "privatización",
        "economía", "desempleo", "industria", "comercio", "pobreza", "desigualdad",
        "libre mercado", "productividad", "desarrollo económico", "campo",
    ],
    "health": [
        "eps", "salud", "hospital", "medicamentos", "reforma salud",
        "sistema de salud", "universal", "clínica", "médico", "enfermedad",
        "atención médica", "cobertura", "paciente", "pensiones de salud",
    ],
    "energy_environment": [
        "petróleo", "fracking", "minería", "energía", "transición energética",
        "clima", "ambiente", "amazonía", "renovable", "carbón", "gas",
        "cambio climático", "solar", "eólica", "hidroeléctrica", "biodiversidad",
        "agua", "ecosistema", "combustibles fósiles",
    ],
    "fiscal": [
        "deuda", "gasto público", "tributaria", "pensiones", "afp", "austeridad",
        "déficit", "presupuesto", "reforma tributaria", "impuestos", "subsidios",
        "finanzas públicas", "regla fiscal", "colpensiones", "privatizar",
    ],
    "foreign_policy": [
        "venezuela", "estados unidos", "relaciones exteriores", "diplomacia",
        "oea", "celac", "maduro", "trump", "ee.uu.", "eeuu", "relaciones",
        "política exterior", "internacional", "migración", "tratado", "alianza",
    ],
    "anticorruption": [
        "corrupción", "transparencia", "procuraduría", "contraloría",
        "contratación", "clientelismo", "anticorrupción", "fiscal",
        "investigación", "escándalo", "peculado", "cohecho", "lavado",
        "irregularidades", "sanciones", "ética",
    ],
}

# ── Stance polarity keywords (for 1–5 score inference) ──────────────────────
# "left" keywords push score toward 1; "right" keywords push toward 5.
# HEURISTIC: verify scores manually — keyword matching ≠ nuanced analysis.

STANCE_POLARITY: dict[str, dict[str, list[str]]] = {
    "security": {
        "left":  ["negociación", "paz", "diálogo", "derechos humanos", "víctimas",
                  "social", "paz total", "guerrilla", "farc", "eln"],
        "right": ["mano dura", "orden público", "fuerzas armadas", "combate",
                  "confrontación", "seguridad democrática", "policía", "militares",
                  "fuerza", "terrorismo"],
    },
    "economy": {
        "left":  ["estado", "reforma agraria", "redistribución", "campesinos",
                  "tierra", "desigualdad", "subsidio", "regulación", "intervención"],
        "right": ["empresa privada", "libre mercado", "inversión", "reducir impuestos",
                  "sector privado", "productividad", "confianza inversionista",
                  "emprendimiento"],
    },
    "health": {
        "left":  ["público", "universal", "reforma", "eps eliminar", "estado rector",
                  "gratuita", "derecho a la salud"],
        "right": ["eps", "libre elección", "privado", "competencia", "mantener eps",
                  "aseguradoras"],
    },
    "energy_environment": {
        "left":  ["transición energética", "renovable", "no al fracking", "amazonía",
                  "cambio climático", "ambiente", "solar", "eólica", "biodiversidad"],
        "right": ["petróleo", "fracking", "minería", "gas", "carbón",
                  "exploración", "explotación", "combustibles fósiles"],
    },
    "fiscal": {
        "left":  ["gasto social", "inversión pública", "subsidios", "progresivo",
                  "impuesto a ricos", "reforma tributaria", "colpensiones"],
        "right": ["austeridad", "déficit cero", "privatizar", "reducir gasto",
                  "regla fiscal", "eficiencia", "libre pensión", "afp"],
    },
    "foreign_policy": {
        "left":  ["venezuela", "maduro", "soberanía", "no intervención", "celac",
                  "multipolaridad", "latinoamérica", "anti-imperialista"],
        "right": ["estados unidos", "eeuu", "trump", "oea", "occidente",
                  "libre comercio", "tlc", "alianza"],
    },
    "anticorruption": {
        "left":  ["transparencia", "control ciudadano", "participación",
                  "veeduría", "reforma electoral"],
        "right": ["procuraduría", "contraloría", "fiscalía", "investigar",
                  "sancionar", "inhabilitar", "penas"],
    },
}

# ── Speech verbs for quote detection ─────────────────────────────────────────
SPEECH_VERBS = re.compile(
    r"\b(dijo|afirmó|señaló|declaró|sostuvo|manifestó|indicó|aseguró|explicó|"
    r"propuso|advirtió|añadió|destacó|subrayó|recalcó|enfatizó|apuntó|reveló|"
    r"anunció|prometió|planteó|expresó)\b",
    re.IGNORECASE,
)

# ── Per-candidate source URLs ─────────────────────────────────────────────────

CANDIDATE_SOURCES: dict[str, list[dict]] = {
    "ivan-cepeda": [
        {"url": "https://es.wikipedia.org/wiki/Iv%C3%A1n_Cepeda", "type": "wikipedia"},
        {"url": "https://ivancepedacastro.com/inicio/", "type": "official"},
        {"url": "https://cnnespanol.cnn.com/2025/10/27/colombia/quien-es-ivan-cepeda-propuestas-elecciones-2026-orix", "type": "news"},
        {"url": "https://www.infobae.com/colombia/2026/03/15/ivan-cepeda-provoco-polemica-tras-sus-senalamientos-hacia-antioquia-lo-llaman-cinico", "type": "news"},
        {"url": "https://www.infobae.com/colombia/2026/03/20/que-el-senor-cepeda-deje-la-cobardia-ivan-duque-exige-debates-y-cuestiona-candidatura", "type": "news"},
        {"url": "https://www.noticiasrcn.com/colombia/controversia-por-palabras-del-candidato-presidencial-ivan-cepeda-sobre-antioquia-1002549", "type": "news"},
    ],
    "abelardo-de-la-espriella": [
        {"url": "https://es.wikipedia.org/wiki/Abelardo_de_la_Espriella_Abogado", "type": "wikipedia"},
        {"url": "https://en.wikipedia.org/wiki/Abelardo_de_la_Espriella", "type": "wikipedia"},
        {"url": "https://estrelladigital.com.co/politica/abelardo-espriella-candidato-colombia/", "type": "news"},
        {"url": "https://www.radionacional.co/actualidad/abelardo-de-la-espriella-62-de-sus-firmas-serian-falsas-y-enfrenta-denuncia", "type": "news"},
    ],
    "sergio-fajardo": [
        {"url": "https://es.wikipedia.org/wiki/Sergio_Fajardo", "type": "wikipedia"},
        {"url": "https://en.wikipedia.org/wiki/Sergio_Fajardo", "type": "wikipedia"},
        {"url": "https://www.infobae.com/colombia/2025/07/20/sergio-fajardo-anuncia-su-candidatura-presidencial-para-2026", "type": "news"},
    ],
    "paloma-valencia": [
        {"url": "https://es.wikipedia.org/wiki/Paloma_Valencia", "type": "wikipedia"},
        {"url": "https://en.wikipedia.org/wiki/Paloma_Valencia", "type": "wikipedia"},
        {"url": "https://www.infobae.com/colombia/2025/12/16/ella-es-paloma-valencia-la-candidata-del-centro-democratico-y-el-uribismo-que-buscara-la-presidencia-en-2026", "type": "news"},
        {"url": "https://cnnespanol.cnn.com/2026/03/09/colombia/quien-es-paloma-valencia-consulta-derecha-orix", "type": "news"},
        {"url": "https://elpais.com/america-colombia/2025-12-15/paloma-valencia-es-la-candidata-presidencial-del-uribismo.html", "type": "news"},
    ],
    "roy-barreras": [
        {"url": "https://es.wikipedia.org/wiki/Roy_Barreras", "type": "wikipedia"},
        {"url": "https://en.wikipedia.org/wiki/Roy_Barreras", "type": "wikipedia"},
        {"url": "https://www.infobae.com/colombia/2025/10/21/roy-barreras-se-suma-a-la-contienda-por-la-presidencia-de-colombia-en-2026-asi-hizo-el-anuncio", "type": "news"},
    ],
    "claudia-lopez": [
        {"url": "https://es.wikipedia.org/wiki/Claudia_L%C3%B3pez_Hern%C3%A1ndez", "type": "wikipedia"},
        {"url": "https://en.wikipedia.org/wiki/Claudia_L%C3%B3pez", "type": "wikipedia"},
        {"url": "https://claudia-lopez.com/programa-de-gobierno-de-claudia-lopez/", "type": "official"},
        {"url": "https://claudia-lopez.com/cual-es-su-principal-propuesta/", "type": "official"},
        {"url": "https://www.lafm.com.co/politica/claudia-lopez-revela-tres-propuestas-para-ser-presidenta-colombia-2026-390421", "type": "news"},
        {"url": "https://www.infobae.com/colombia/2025/06/05/claudia-lopez-contesto-a-los-ataques-de-petro-por-apoyar-el-fracking-si-se-convierte-en-presidente-su-hipocresia-hace-mas-dano/", "type": "news"},
    ],
}

CANDIDATE_NAMES = {
    "ivan-cepeda":              "Iván Cepeda",
    "abelardo-de-la-espriella": "Abelardo de la Espriella",
    "sergio-fajardo":           "Sergio Fajardo",
    "paloma-valencia":          "Paloma Valencia",
    "roy-barreras":             "Roy Barreras",
    "claudia-lopez":            "Claudia López",
}

# Name variants used to detect attribution in articles
CANDIDATE_NAME_VARIANTS: dict[str, list[str]] = {
    "ivan-cepeda":              ["cepeda", "iván cepeda", "ivan cepeda"],
    "abelardo-de-la-espriella": ["espriella", "de la espriella", "abelardo"],
    "sergio-fajardo":           ["fajardo", "sergio fajardo"],
    "paloma-valencia":          ["paloma", "valencia", "paloma valencia"],
    "roy-barreras":             ["barreras", "roy barreras"],
    "claudia-lopez":            ["claudia", "lópez", "lopez", "claudia lópez"],
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ── HTTP fetch ────────────────────────────────────────────────────────────────

def fetch_url(url: str, timeout: int = 15) -> Optional[str]:
    """Fetch a URL and return HTML text, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp.text
        print(f"  [HTTP {resp.status_code}] {url}", file=sys.stderr)
        return None
    except requests.RequestException as e:
        print(f"  [FETCH ERROR] {url}: {e}", file=sys.stderr)
        return None

# ── HTML → clean text ─────────────────────────────────────────────────────────

def extract_text(html: str, url: str) -> str:
    """Parse HTML, strip boilerplate, return plain text article body."""
    soup = BeautifulSoup(html, "lxml")

    # Remove non-content elements
    for tag in soup.find_all(["script", "style", "nav", "header", "footer",
                               "aside", "form", "iframe", "noscript",
                               "figure", "figcaption"]):
        tag.decompose()

    # Prefer main article containers
    domain = urlparse(url).netloc.lower()
    article = None

    # Wikipedia: main content div
    if "wikipedia.org" in domain:
        article = soup.find("div", id="mw-content-text")
    else:
        # Try common article containers in priority order
        for selector in [
            ("article", {}),
            ("div", {"class": re.compile(r"article[-_]?(body|content|text)", re.I)}),
            ("div", {"class": re.compile(r"(story|post|entry)[-_]?(body|content)", re.I)}),
            ("div", {"itemprop": "articleBody"}),
            ("main", {}),
        ]:
            candidate = soup.find(*selector)
            if candidate and len(candidate.get_text(strip=True)) > 200:
                article = candidate
                break

    # Fallback: full body
    if not article:
        article = soup.find("body") or soup

    text = article.get_text(separator="\n", strip=True)

    # Remove lines that look like navigation / ads (very short or all-caps)
    lines = [
        ln.strip() for ln in text.splitlines()
        if len(ln.strip()) > 40
    ]
    return "\n".join(lines)


# ── Sentence utilities ────────────────────────────────────────────────────────

def split_sentences(text: str) -> list[str]:
    """Split text into sentences on period/question/exclamation boundaries."""
    # Split on sentence-ending punctuation followed by whitespace or newline
    raw = re.split(r"(?<=[.!?])\s+|\n+", text)
    sentences = []
    for s in raw:
        s = s.strip()
        if len(s) > 30:          # skip very short fragments
            sentences.append(s)
    return sentences


def keyword_score(sentence: str, topic: str) -> float:
    """Return how many topic keywords appear in a sentence (normalised)."""
    sl = sentence.lower()
    hits = sum(1 for kw in TOPIC_KEYWORDS.get(topic, []) if kw in sl)
    return hits


def is_candidate_quote(sentence: str, candidate_id: str) -> bool:
    """
    Heuristic: True if the sentence appears to attribute a statement to the
    candidate. Checks for speech verb + candidate name variant.
    """
    sl = sentence.lower()
    has_verb = bool(SPEECH_VERBS.search(sl))
    has_name = any(v in sl for v in CANDIDATE_NAME_VARIANTS.get(candidate_id, []))
    # Also treat first-person sentences from official sources as quotes
    is_first_person = re.search(r"\b(quiero|propongo|voy a|mi propuesta|mi gobierno|haré|haría)\b", sl) is not None
    return (has_verb and has_name) or is_first_person


# ── Stance score inference ────────────────────────────────────────────────────

def infer_stance(sentences: list[str], topic: str) -> tuple[float, float]:
    """
    Infer stance_score (1–5) and confidence (0–1) for a topic from sentences.

    Score heuristic:
      left_count  = sentences containing ≥1 left-polarity keyword
      right_count = sentences containing ≥1 right-polarity keyword
      raw = right_count / (left_count + right_count) if total > 0
      stance = 1 + raw * 4   (maps 0→1, 0.5→3, 1→5)

    Confidence: increases with more evidence sentences.
    """
    polarity = STANCE_POLARITY.get(topic, {"left": [], "right": []})
    left_kw  = polarity["left"]
    right_kw = polarity["right"]

    left_count  = 0
    right_count = 0
    total_topic = 0

    for s in sentences:
        sl = s.lower()
        ks = keyword_score(s, topic)
        if ks == 0:
            continue
        total_topic += 1
        has_left  = any(kw in sl for kw in left_kw)
        has_right = any(kw in sl for kw in right_kw)
        if has_left:
            left_count += 1
        if has_right:
            right_count += 1

    if left_count + right_count == 0:
        return 3.0, 0.0  # neutral / unknown

    raw   = right_count / (left_count + right_count)
    score = round(1.0 + raw * 4.0, 1)
    # Confidence: more evidence = more confident; cap at 0.9 (human review needed)
    conf  = min(0.9, 0.3 + 0.1 * total_topic)
    return score, round(conf, 2)


# ── Quote extraction ──────────────────────────────────────────────────────────

def extract_topic_quotes(
    sentences: list[str],
    topic: str,
    candidate_id: str,
    source_url: str,
    source_name: str,
    fetch_date: str,
    max_quotes: int = 3,
) -> list[dict]:
    """
    Return up to max_quotes candidate-attributed sentences for a topic,
    scored by keyword relevance.
    """
    scored = []
    for s in sentences:
        ks = keyword_score(s, topic)
        if ks == 0:
            continue
        if not is_candidate_quote(s, candidate_id):
            continue
        # Prefer shorter, focused sentences (trim very long ones)
        text = s[:300] + ("…" if len(s) > 300 else "")
        scored.append((ks, text))

    # Sort by score descending, deduplicate similar sentences
    scored.sort(key=lambda x: x[0], reverse=True)
    seen: set[str] = set()
    quotes: list[dict] = []
    for _, text in scored:
        fingerprint = re.sub(r"\W+", "", text.lower())[:50]
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        quotes.append({
            "text": text,
            "source": source_name,
            "url": source_url,
            "date": fetch_date,
            "heuristic": True,  # flag for manual review
        })
        if len(quotes) >= max_quotes:
            break
    return quotes


# ── Source name helper ────────────────────────────────────────────────────────

def source_name_from_url(url: str) -> str:
    domain = urlparse(url).netloc.lower().removeprefix("www.").removeprefix("es.").removeprefix("en.")
    KNOWN = {
        "wikipedia.org":         "Wikipedia",
        "infobae.com":           "Infobae Colombia",
        "noticiasrcn.com":       "RCN Noticias",
        "cnnespanol.cnn.com":    "CNN en Español",
        "lafm.com.co":           "La FM",
        "noticiascaracol.com":   "Noticias Caracol",
        "claudia-lopez.com":     "Claudia López (sitio oficial)",
        "ivancepedacastro.com":  "Iván Cepeda (sitio oficial)",
        "elpais.com":            "El País",
        "semana.com":            "Revista Semana",
        "eltiempo.com":          "El Tiempo",
        "caracol.com.co":        "Caracol Radio",
        "elespectador.com":      "El Espectador",
    }
    for pattern, name in KNOWN.items():
        if pattern in domain:
            return name
    return domain


# ── Per-candidate enrichment ──────────────────────────────────────────────────

def enrich_candidate(
    candidate_data: dict,
    dry_run: bool = False,
    verbose: bool = True,
) -> tuple[dict, dict]:
    """
    Fetch sources, extract quotes and infer stances for one candidate.

    Returns:
      (enriched_candidate_dict, stats_dict)
    """
    cid   = candidate_data["id"]
    cname = candidate_data.get("name", cid)
    sources = CANDIDATE_SOURCES.get(cid, [])
    today = date.today().isoformat()

    if verbose:
        print(f"\n{'='*60}")
        print(f"  Enriching: {cname}  ({len(sources)} sources)")
        print(f"{'='*60}")

    # --- Collect all sentences from all sources ---
    # sentences_by_source: list of (sentences, url, source_name)
    sentences_by_source: list[tuple[list[str], str, str]] = []
    fetch_ok = 0

    for src in sources:
        url  = src["url"]
        sname = source_name_from_url(url)
        if verbose:
            print(f"  Fetching {sname}: {url[:80]}")
        html = fetch_url(url)
        if html is None:
            if verbose:
                print(f"    → FAILED")
            continue
        text = extract_text(html, url)
        sents = split_sentences(text)
        sentences_by_source.append((sents, url, sname))
        fetch_ok += 1
        if verbose:
            print(f"    → OK ({len(sents)} sentences)")
        time.sleep(0.8)  # polite delay

    # Flatten all sentences for stance inference
    all_sentences = [s for (sents, _, _) in sentences_by_source for s in sents]

    if verbose:
        print(f"\n  Fetched {fetch_ok}/{len(sources)} sources, "
              f"{len(all_sentences)} total sentences")

    # --- Enrich each topic ---
    enriched = copy.deepcopy(candidate_data)
    stats = {
        "candidate": cid,
        "sources_fetched": fetch_ok,
        "topics_updated": 0,
        "quotes_added": 0,
    }

    for topic_obj in enriched.get("topics", []):
        tid = topic_obj["topic_id"]

        # Collect quotes from all sources
        all_quotes: list[dict] = []
        for (sents, url, sname) in sentences_by_source:
            quotes = extract_topic_quotes(
                sentences=sents,
                topic=tid,
                candidate_id=cid,
                source_url=url,
                source_name=sname,
                fetch_date=today,
            )
            all_quotes.extend(quotes)

        # Deduplicate and keep top 3
        seen_fp: set[str] = set()
        deduped: list[dict] = []
        for q in all_quotes:
            fp = re.sub(r"\W+", "", q["text"].lower())[:60]
            if fp not in seen_fp:
                seen_fp.add(fp)
                deduped.append(q)
        deduped = deduped[:3]

        # Infer stance
        new_score, new_conf = infer_stance(all_sentences, tid)

        # Only update stance if we have real evidence and it differs meaningfully
        old_score = float(topic_obj.get("stance_score") or 3.0)
        old_conf  = float(topic_obj.get("confidence") or 0.0)

        if deduped or (new_conf > 0.3 and abs(new_score - old_score) < 1.5):
            # Update key_quotes (merge with existing if present)
            existing_quotes = topic_obj.get("key_quotes", [])
            # Don't duplicate quotes we already have
            existing_texts = {q.get("text", "")[:80] for q in existing_quotes}
            new_unique = [q for q in deduped if q["text"][:80] not in existing_texts]
            topic_obj["key_quotes"] = existing_quotes + new_unique

            # Update stance score only if new evidence is stronger
            if new_conf > old_conf and new_conf > 0.4:
                topic_obj["stance_score"] = new_score
                topic_obj["confidence"]   = new_conf
                topic_obj["inferred_from"] = "heuristic_keyword_scan"

            topic_obj["updated_at"] = today
            stats["topics_updated"] += 1
            stats["quotes_added"]   += len(new_unique)

        if verbose and deduped:
            print(f"  [{tid}] {len(deduped)} quotes, "
                  f"inferred score={new_score} (was {old_score}), conf={new_conf}")

    return enriched, stats


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enrich candidates_canonical.json with fetched quotes and stance data."
    )
    parser.add_argument(
        "--candidate", "-c",
        help="Only enrich this candidate ID (e.g. claudia-lopez)",
        default=None,
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Print extracted data to stdout; do not write any files.",
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress per-source progress output.",
    )
    args = parser.parse_args()

    # Load canonical data
    if not CANONICAL_PATH.exists():
        print(f"ERROR: {CANONICAL_PATH} not found.", file=sys.stderr)
        sys.exit(1)

    with open(CANONICAL_PATH, encoding="utf-8") as f:
        canonical = json.load(f)

    candidates = canonical.get("candidates", [])
    if args.candidate:
        candidates = [c for c in candidates if c["id"] == args.candidate]
        if not candidates:
            print(f"ERROR: Candidate '{args.candidate}' not found in canonical data.",
                  file=sys.stderr)
            sys.exit(1)

    enriched_candidates = []
    all_stats = []

    for c in candidates:
        enriched_c, stats = enrich_candidate(
            c,
            dry_run=args.dry_run,
            verbose=not args.quiet,
        )
        enriched_candidates.append(enriched_c)
        all_stats.append(stats)

    # --- Print diff summary ---
    print("\n" + "="*60)
    print("  ENRICHMENT SUMMARY")
    print("="*60)
    total_quotes = 0
    total_topics = 0
    for s in all_stats:
        print(f"  {s['candidate']:<35} "
              f"sources: {s['sources_fetched']:>2}  "
              f"topics: {s['topics_updated']:>2}  "
              f"quotes: {s['quotes_added']:>2}")
        total_quotes += s["quotes_added"]
        total_topics += s["topics_updated"]
    print(f"\n  TOTAL  topics updated: {total_topics}  quotes added: {total_quotes}")

    if args.dry_run:
        print("\n[DRY RUN] Output:\n")
        for ec in enriched_candidates:
            print(json.dumps(ec, ensure_ascii=False, indent=2))
        return

    # --- Write output ---
    # Replace only the enriched candidates in the full canonical structure
    enriched_ids = {c["id"] for c in enriched_candidates}
    enriched_map  = {c["id"]: c for c in enriched_candidates}
    output_candidates = [
        enriched_map[c["id"]] if c["id"] in enriched_ids else c
        for c in canonical["candidates"]
    ]
    output = {**canonical, "candidates": output_candidates}
    output["generated_at"] = date.today().isoformat()

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\n  Written → {OUTPUT_PATH}")
    print("  Review the output, then copy over canonical to apply:")
    print(f"  cp {OUTPUT_PATH} {CANONICAL_PATH}")


if __name__ == "__main__":
    main()
