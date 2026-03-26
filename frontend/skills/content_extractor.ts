/**
 * content_extractor — stub implementation of the ContentExtractor skill.
 *
 * Responsible for turning a Source into a SourceContent object with rawText,
 * cleanedText, language detection, and an optional English translation summary.
 *
 * The current version synthesises text from Source metadata (type, title,
 * snippet) instead of making real HTTP calls, so the rest of the pipeline can
 * be developed and tested without external dependencies.
 *
 * Replace synthesiseRawText (and the body of extractContent) with real
 * fetch/scrape calls when the pipeline is ready for production.
 */

import type { Source } from "./source_collector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourceContent {
  source: Source;
  rawText: string;
  cleanedText: string;
  language?: string;
  /** Present only when language === "es"; a short English summary. */
  translatedText?: string;
}

// ---------------------------------------------------------------------------
// Spanish word heuristic
// ---------------------------------------------------------------------------

/** Common Spanish function words used for language detection. */
const SPANISH_MARKERS = [
  "de", "la", "el", "en", "que", "y", "con", "del", "los", "las",
  "por", "para", "un", "una", "su", "al", "se", "le", "es", "como",
  "más", "pero", "fue", "han", "este", "esta", "son", "su", "también",
  "propone", "anuncia", "defiende", "insistió", "reiteró",
];

/**
 * Returns "es" when the text contains enough Spanish marker words,
 * otherwise "en".
 */
function detectLanguage(text: string): "es" | "en" {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordSet = new Set(words);
  const hits = SPANISH_MARKERS.filter((w) => wordSet.has(w)).length;
  return hits >= 3 ? "es" : "en";
}

// ---------------------------------------------------------------------------
// Raw-text synthesis
// ---------------------------------------------------------------------------

/** Labels used in the synthesised body per source type. */
const TYPE_LABELS: Record<string, string> = {
  speech: "Discurso / Speech",
  interview: "Entrevista / Interview",
  news: "Noticia / News article",
  opinion: "Opinión / Opinion piece",
  social: "Publicación en redes / Social media post",
  scandal: "Escándalo / Scandal report",
  program: "Programa de gobierno / Government program",
  other: "Fuente / Source",
};

/**
 * Builds a realistic-looking raw text string from the source's metadata.
 * This simulates what a real HTTP fetch + HTML stripping would produce.
 */
function synthesiseRawText(source: Source): string {
  const label = TYPE_LABELS[source.type] ?? TYPE_LABELS["other"];
  const outlet = source.sourceName ? `  ${source.sourceName}` : "";
  const date = source.date ? `  ${source.date}` : "";
  const title = source.title ?? source.url;
  const body = source.snippet
    ? source.snippet
    : "No se encontró contenido adicional en la fuente.";

  return (
    `[${label}]${outlet}${date}\n\n` +
    `${title}\n\n` +
    `${body}\n\n` +
    `Fuente original: ${source.url}`
  );
}

// ---------------------------------------------------------------------------
// cleanText
// ---------------------------------------------------------------------------

/**
 * Strips leading/trailing whitespace, collapses runs of internal whitespace
 * (including newlines) into a single space, and normalises line breaks.
 */
export function cleanText(raw: string): string {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Translation heuristic
// ---------------------------------------------------------------------------

/**
 * Returns a short English summary synthesised from the source metadata.
 * This is intentionally simple and deterministic — replace with a real
 * translation call when the pipeline goes to production.
 */
function buildEnglishSummary(source: Source): string {
  const type = source.type;
  const title = source.title ?? "untitled source";
  const outlet = source.sourceName ? ` (${source.sourceName})` : "";
  const date = source.date ? `, ${source.date}` : "";
  const snippet = source.snippet
    ? ` Key excerpt: "${source.snippet.slice(0, 120)}${source.snippet.length > 120 ? "…" : ""}"`
    : "";

  return `[${type}${outlet}${date}] ${title}.${snippet}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract and clean content for a single source.
 *
 * @param source - A Source object returned by the source_collector skill.
 * @returns A SourceContent object with rawText, cleanedText, and language.
 *          translatedText is always undefined (translation deferred to reduce
 *          token usage; re-enable buildEnglishSummary when ready).
 */
export async function extractContent(source: Source): Promise<SourceContent> {
  const rawText = synthesiseRawText(source);
  const cleanedText = cleanText(rawText);
  const language = detectLanguage(cleanedText);

  return { source, rawText, cleanedText, language, translatedText: undefined };
}
