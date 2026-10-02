"""
Build frontend/data/election_results_2026.json — official results of the 2026
Colombian presidential election for the /eleccion-2026 page.

Source of record is the Registraduría Nacional del Estado Civil. Its results
site (resultados.registraduria.gov.co) went offline after the election, so the
second-round table by department is parsed from the English Wikipedia article,
which transcribes the Registraduría figures. Spot-checked against El Colombiano
(Antioquia, Boyacá, Huila, Valle, Cauca, Atlántico, Bolívar: exact match).

First-round figures are national only: Wikipedia's first-round department table
is internally inconsistent (row percentages summing to ~102 %, a 60,000-vote
typo in Córdoba), so it is not used.

Usage:
    python3 scripts/build_election_results.py            # fetch + build
    python3 scripts/build_election_results.py --wikitext path/to/raw.txt
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUTPUT_PATH = ROOT / "frontend" / "data" / "election_results_2026.json"

WIKI_ARTICLE = "https://en.wikipedia.org/wiki/2026_Colombian_presidential_election"
WIKI_RAW_URL = "https://en.wikipedia.org/w/index.php?title=2026_Colombian_presidential_election&action=raw"
SECOND_ROUND_HEADING = "==== Second round ===="

# Department totals may differ from the national total by a few hundred votes
# (late escrutinio corrections). Anything larger means a parsing or data error.
MAX_NATIONAL_DRIFT_RATIO = 0.0005
MAX_ROW_PCT_DRIFT = 0.15
EXPECTED_ROWS = 34  # 32 departments + Bogotá + votes abroad

ABROAD_KEY = "Consulates"

# Wikipedia name → (Spanish display name, NOMBRE_DPT in colombia-departments.json)
DEPARTMENTS: dict[str, tuple[str, str | None]] = {
    "Amazonas": ("Amazonas", "AMAZONAS"),
    "Antioquia": ("Antioquia", "ANTIOQUIA"),
    "Arauca": ("Arauca", "ARAUCA"),
    "Atlántico": ("Atlántico", "ATLANTICO"),
    "Bogotá": ("Bogotá D.C.", "SANTAFE DE BOGOTA D.C"),
    "Bolívar": ("Bolívar", "BOLIVAR"),
    "Boyacá": ("Boyacá", "BOYACA"),
    "Caldas": ("Caldas", "CALDAS"),
    "Caquetá": ("Caquetá", "CAQUETA"),
    "Casanare": ("Casanare", "CASANARE"),
    "Cauca": ("Cauca", "CAUCA"),
    "Cesar": ("Cesar", "CESAR"),
    "Chocó": ("Chocó", "CHOCO"),
    ABROAD_KEY: ("Colombianos en el exterior", None),
    "Córdoba": ("Córdoba", "CORDOBA"),
    "Cundinamarca": ("Cundinamarca", "CUNDINAMARCA"),
    "Guainía": ("Guainía", "GUAINIA"),
    "Guaviare": ("Guaviare", "GUAVIARE"),
    "Huila": ("Huila", "HUILA"),
    "La Guajira": ("La Guajira", "LA GUAJIRA"),
    "Magdalena": ("Magdalena", "MAGDALENA"),
    "Meta": ("Meta", "META"),
    "Nariño": ("Nariño", "NARIÑO"),
    "Norte de Santander": ("Norte de Santander", "NORTE DE SANTANDER"),
    "Putumayo": ("Putumayo", "PUTUMAYO"),
    "Quindío": ("Quindío", "QUINDIO"),
    "Risaralda": ("Risaralda", "RISARALDA"),
    "San Andrés and Providencia": (
        "San Andrés y Providencia",
        "ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA",
    ),
    "Santander": ("Santander", "SANTANDER"),
    "Sucre": ("Sucre", "SUCRE"),
    "Tolima": ("Tolima", "TOLIMA"),
    "Valle del Cauca": ("Valle del Cauca", "VALLE DEL CAUCA"),
    "Vaupés": ("Vaupés", "VAUPES"),
    "Vichada": ("Vichada", "VICHADA"),
}

# National totals (Registraduría, as transcribed by Wikipedia; second round
# cross-checked with El Tiempo and CNN en Español).
NATIONAL = {
    "round1": {
        "date": "2026-05-31",
        "registered": 41_421_973,
        "votes_cast": 23_978_304,
        "turnout_pct": 57.89,
        "blank": {"votes": 406_970, "pct": 1.72},
        "invalid": {"votes": 292_975, "pct": 1.22},
        "candidates": [
            {
                "name": "Abelardo de la Espriella",
                "id": "abelardo-de-la-espriella",
                "votes": 10_361_499,
                "pct": 43.75,
            },
            {
                "name": "Iván Cepeda",
                "id": "ivan-cepeda",
                "votes": 9_688_361,
                "pct": 40.90,
            },
            {
                "name": "Paloma Valencia",
                "id": "paloma-valencia",
                "votes": 1_639_685,
                "pct": 6.92,
            },
            {
                "name": "Sergio Fajardo",
                "id": "sergio-fajardo",
                "votes": 1_009_073,
                "pct": 4.26,
            },
            {
                "name": "Claudia López",
                "id": "claudia-lopez",
                "votes": 225_517,
                "pct": 0.95,
            },
            {"name": "Santiago Botero", "id": None, "votes": 206_140, "pct": 0.87},
            {"name": "Mauricio Lizcano", "id": None, "votes": 53_839, "pct": 0.23},
            {"name": "Miguel Uribe Londoño", "id": None, "votes": 28_657, "pct": 0.12},
            {"name": "Sondra Macollins", "id": None, "votes": 19_889, "pct": 0.08},
            {
                "name": "Roy Barreras",
                "id": "roy-barreras",
                "votes": 14_108,
                "pct": 0.06,
            },
            {"name": "Luis Gilberto Murillo", "id": None, "votes": 13_270, "pct": 0.06},
            {"name": "Carlos Caicedo", "id": None, "votes": 12_694, "pct": 0.05},
            {"name": "Gustavo Matamoros", "id": None, "votes": 5_627, "pct": 0.02},
        ],
    },
    "round2": {
        "date": "2026-06-21",
        "registered": 41_421_973,
        "votes_cast": 26_345_588,
        "turnout_pct": 63.60,
        "blank": {"votes": 426_848, "pct": 1.64},
        "invalid": {"votes": 250_262, "pct": 0.95},
        "candidates": [
            {
                "name": "Abelardo de la Espriella",
                "id": "abelardo-de-la-espriella",
                "votes": 12_960_166,
                "pct": 49.66,
            },
            {
                "name": "Iván Cepeda",
                "id": "ivan-cepeda",
                "votes": 12_708_312,
                "pct": 48.70,
            },
        ],
    },
    "inauguration": "2026-08-07",
}

SOURCES = [
    {
        "title": "2026 Colombian presidential election (resultados por departamento, transcritos de la Registraduría)",
        "publisher": "Wikipedia",
        "url": WIKI_ARTICLE,
    },
    {
        "title": "Resultados elecciones presidenciales Colombia 2026: De la Espriella, presidente electo",
        "publisher": "El Tiempo",
        "url": "https://www.eltiempo.com/politica/elecciones-colombia-2026/resultados-segunda-vuelta-presidencial-2026-siga-el-minuto-a-minuto-del-preconteo-de-la-registraduria-nacional-3565893",
    },
    {
        "title": "¿Qué tanto cambiaron las votaciones por departamento entre primera y segunda vuelta?",
        "publisher": "El Colombiano",
        "url": "https://www.elcolombiano.com/especiales/elecciones-2026/asi-cambiaron-votaciones-departamentos-segunda-vuelta-antioquia-clave-abelardo-espriella-JJ38020867",
    },
    {
        "title": "El mapa, municipio por municipio, de la segunda vuelta presidencial",
        "publisher": "El Tiempo",
        "url": "https://www.eltiempo.com/politica/elecciones-colombia-2026/el-mapa-municipio-por-municipio-de-la-segunda-vuelta-presidencial-abelardo-de-la-espriella-gano-en-758-mas-de-seis-de-cada-diez-en-el-pais-3566255",
    },
    {
        "title": "Resultado de la segunda vuelta en Colombia, en vivo",
        "publisher": "CNN en Español",
        "url": "https://cnnespanol.cnn.com/2026/06/21/colombia/live-news/segunda-vuelta-elecciones-presidenciales-resultado-cepeda-espriella-orix",
    },
]


def fetch_wikitext() -> str:
    request = urllib.request.Request(
        WIKI_RAW_URL, headers={"User-Agent": "colombia-matcher-data-build/1.0"}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def _clean_cell(line: str) -> str:
    cell = line.strip().removeprefix("|")
    cell = re.sub(r'^\s*(?:\w+="[^"]*"\s*)+\|', "", cell)  # drop inline styling
    cell = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", cell)  # unwrap links
    return cell.replace("'''", "").strip()


def _number(cell: str) -> int | float:
    raw = cell.replace(",", "").replace("%", "")
    return float(raw) if "." in raw else int(raw)


def parse_second_round(wikitext: str) -> list[list]:
    start = wikitext.index(SECOND_ROUND_HEADING)
    end = wikitext.index("\n|}", start)
    rows = []
    for block in wikitext[start:end].split("\n|-")[1:]:
        cells = [_clean_cell(l) for l in block.strip().split("\n") if l.startswith("|")]
        if not cells or cells[0].startswith("Source"):
            continue
        rows.append([cells[0], *(_number(c) for c in cells[1:])])
    return rows


def validate(rows: list[list]) -> None:
    if len(rows) != EXPECTED_ROWS:
        raise ValueError(f"Expected {EXPECTED_ROWS} rows, parsed {len(rows)}")
    for name, esp, esp_pct, cep, cep_pct, blank, _bp, valid, _vp, _inv, _ip in rows:
        if name not in DEPARTMENTS:
            raise ValueError(f"Unknown department '{name}' — add it to DEPARTMENTS")
        if esp + cep + blank != valid:
            raise ValueError(
                f"{name}: candidates + blank ({esp + cep + blank}) != valid ({valid})"
            )
        for label, votes, pct in (
            ("espriella", esp, esp_pct),
            ("cepeda", cep, cep_pct),
        ):
            if abs(100 * votes / valid - pct) > MAX_ROW_PCT_DRIFT:
                raise ValueError(
                    f"{name}: {label} {votes} votes does not match stated {pct}%"
                )

    national = {c["id"]: c["votes"] for c in NATIONAL["round2"]["candidates"]}
    for index, candidate_id in ((1, "abelardo-de-la-espriella"), (3, "ivan-cepeda")):
        total = sum(r[index] for r in rows)
        drift = abs(total - national[candidate_id]) / national[candidate_id]
        if drift > MAX_NATIONAL_DRIFT_RATIO:
            raise ValueError(
                f"{candidate_id}: departments sum {total} vs national {national[candidate_id]}"
            )


def build(rows: list[list]) -> dict:
    regions = []
    for (
        name,
        esp,
        esp_pct,
        cep,
        cep_pct,
        blank,
        blank_pct,
        valid,
        _vp,
        invalid,
        _ip,
    ) in rows:
        display, geo_name = DEPARTMENTS[name]
        regions.append(
            {
                "name": display,
                "geoName": geo_name,
                "abroad": name == ABROAD_KEY,
                "espriella": {"votes": esp, "pct": esp_pct},
                "cepeda": {"votes": cep, "pct": cep_pct},
                "blank": {"votes": blank, "pct": blank_pct},
                "valid": valid,
                "invalid": invalid,
            }
        )
    return {
        "meta": {
            "generated_at": date.today().isoformat(),
            "notes": (
                "Resultados oficiales de la Registraduría Nacional. Los totales por departamento "
                "(escrutinio) difieren del total nacional en menos de 0,01 %. Primera vuelta solo a nivel nacional."
            ),
            "sources": SOURCES,
        },
        "national": NATIONAL,
        "round2ByRegion": regions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--wikitext",
        type=Path,
        help="Use a saved raw wikitext file instead of fetching",
    )
    args = parser.parse_args()

    wikitext = (
        args.wikitext.read_text(encoding="utf-8") if args.wikitext else fetch_wikitext()
    )
    rows = parse_second_round(wikitext)
    try:
        validate(rows)
    except ValueError as exc:
        sys.exit(f"Validation failed: {exc}")

    OUTPUT_PATH.write_text(
        json.dumps(build(rows), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(rows)} regions → {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
