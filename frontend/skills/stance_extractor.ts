/**
 * stance_extractor — StanceExtractor skill.
 *
 * DEFAULT BEHAVIOUR (all candidates / all topics):
 *   Deterministic keyword-rule matching on cleanedText.  No external calls.
 *
 * EXPERIMENTAL — OPUS BRANCH (strictly limited to control token spend):
 *   When ALL of the following are true:
 *     • candidateId === "ivan-cepeda"
 *     • topics includes "security"
 *     • content.language === "es"
 *     • 500 ≤ content.cleanedText.length ≤ 4000
 *   …the extractor calls Claude Opus 4.6 once to produce MicroStance[] for the
 *   "security" topic, and falls back to keyword rules on any error or when
 *   ANTHROPIC_API_KEY is absent.
 *
 *   This scope is intentionally narrow: one candidate + one topic = predictable
 *   cost and a well-defined evaluation surface before expanding coverage.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SourceContent } from "./content_extractor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single piece of evidence backing a stance. */
export interface Evidence {
  url: string;
  quote: string;
  date?: string;
  sourceName?: string;
}

/** The dimension of a candidate stance being described. */
export type StanceDimension = "policy" | "behavior" | "alliances" | "rhetoric";

/**
 * A granular, evidence-backed position extracted from a single source.
 * Multiple MicroStances are later aggregated into a full candidate profile.
 */
export interface MicroStance {
  candidateId: string;
  topic: string;
  dimension: StanceDimension;
  /** Alignment score in the range [-1, 1]. Negative = opposes, positive = supports. */
  stanceScore: number;
  /** Short natural-language summary of the stance, e.g. "Supports iron-fist security". */
  stanceLabel: string;
  evidence: Evidence;
}

// ---------------------------------------------------------------------------
// Keyword rules (default path)
// ---------------------------------------------------------------------------

interface KeywordRule {
  /** Regex that must match (case-insensitive) in the cleaned text. */
  pattern: RegExp;
  topic: string;
  dimension: StanceDimension;
  stanceScore: number;
  stanceLabel: string;
}

/**
 * Ordered list of keyword rules.  First match per topic wins so that more
 * specific phrases (e.g. "seguridad humana") are checked before broader ones
 * (e.g. "seguridad").
 */
const KEYWORD_RULES: KeywordRule[] = [
  // ── security ──────────────────────────────────────────────────────────────
  {
    pattern: /seguridad\s+humana/i,
    topic: "security",
    dimension: "policy",
    stanceScore: 0.6,
    stanceLabel: "Favors human-security approach over militarization",
  },
  {
    pattern: /\bmano\s+dura\b/i,
    topic: "security",
    dimension: "policy",
    stanceScore: -0.7,
    stanceLabel: "Advocates iron-fist, hard-line security policy",
  },
  {
    pattern: /\bmilitar\b/i,
    topic: "security",
    dimension: "policy",
    stanceScore: -0.4,
    stanceLabel: "Emphasizes military force in security strategy",
  },
  {
    pattern: /\bseguridad\b/i,
    topic: "security",
    dimension: "policy",
    stanceScore: 0.3,
    stanceLabel: "References security policy without strong orientation",
  },

  // ── economy ───────────────────────────────────────────────────────────────
  {
    pattern: /\bimpuestos\b/i,
    topic: "economy",
    dimension: "policy",
    stanceScore: -0.5,
    stanceLabel: "Focuses on tax policy (likely reform or opposition to taxes)",
  },
  {
    pattern: /\beconom[ií]a\b/i,
    topic: "economy",
    dimension: "policy",
    stanceScore: 0.3,
    stanceLabel: "Addresses economic policy broadly",
  },
  {
    pattern: /\bgasto\s+p[úu]blico\b/i,
    topic: "economy",
    dimension: "policy",
    stanceScore: -0.4,
    stanceLabel: "Targets public spending as key economic lever",
  },

  // ── anticorruption ────────────────────────────────────────────────────────
  {
    pattern: /\bcorrupci[óo]n\b/i,
    topic: "anticorruption",
    dimension: "behavior",
    stanceScore: -0.6,
    stanceLabel: "Corruption mentioned — context may indicate scandal or criticism",
  },
  {
    pattern: /\btransparencia\b/i,
    topic: "anticorruption",
    dimension: "policy",
    stanceScore: 0.7,
    stanceLabel: "Advocates transparency as anticorruption measure",
  },

  // ── health ─────────────────────────────────────────────────────────────────
  {
    pattern: /reforma.*salud|salud.*reforma/i,
    topic: "health",
    dimension: "policy",
    stanceScore: 0.6,
    stanceLabel: "Advocates health system reform",
  },
  {
    pattern: /\bEPS\b/i,
    topic: "health",
    dimension: "policy",
    stanceScore: 0.3,
    stanceLabel: "Engages with health insurance system (EPS)",
  },
  {
    pattern: /\bhospitales?\b/i,
    topic: "health",
    dimension: "policy",
    stanceScore: 0.5,
    stanceLabel: "Focuses on hospital infrastructure",
  },
  {
    pattern: /\bsalud\b/i,
    topic: "health",
    dimension: "policy",
    stanceScore: 0.4,
    stanceLabel: "Addresses healthcare policy",
  },

  // ── environment ────────────────────────────────────────────────────────────
  {
    pattern: /transici[oó]n\s+energ[eé]tica/i,
    topic: "environment",
    dimension: "policy",
    stanceScore: 0.8,
    stanceLabel: "Advocates energy transition away from fossil fuels",
  },
  {
    pattern: /\bfracking\b/i,
    topic: "environment",
    dimension: "policy",
    stanceScore: -0.7,
    stanceLabel: "Addresses fracking (likely critical)",
  },
  {
    pattern: /\bdeforestaci[oó]n\b/i,
    topic: "environment",
    dimension: "policy",
    stanceScore: -0.4,
    stanceLabel: "Addresses deforestation threat",
  },
  {
    pattern: /\bpetr[oó]leo\b/i,
    topic: "environment",
    dimension: "policy",
    stanceScore: -0.3,
    stanceLabel: "Addresses oil sector (extraction debate)",
  },
  {
    pattern: /\bmedioambiente\b|\bmedio\s+ambiente\b/i,
    topic: "environment",
    dimension: "policy",
    stanceScore: 0.5,
    stanceLabel: "Engages with environmental policy",
  },
  {
    pattern: /\bambiente\b/i,
    topic: "environment",
    dimension: "policy",
    stanceScore: 0.4,
    stanceLabel: "References environmental concerns",
  },

  // ── fiscal ─────────────────────────────────────────────────────────────────
  {
    pattern: /disciplina\s+fiscal/i,
    topic: "fiscal",
    dimension: "policy",
    stanceScore: -0.7,
    stanceLabel: "Advocates strict fiscal discipline (austerity-aligned)",
  },
  {
    pattern: /\bausteridad\b/i,
    topic: "fiscal",
    dimension: "policy",
    stanceScore: -0.6,
    stanceLabel: "Advocates fiscal austerity",
  },
  {
    pattern: /reforma\s+tributaria/i,
    topic: "fiscal",
    dimension: "policy",
    stanceScore: 0.5,
    stanceLabel: "Proposes tax reform",
  },
  {
    pattern: /reforma\s+pensional/i,
    topic: "fiscal",
    dimension: "policy",
    stanceScore: 0.4,
    stanceLabel: "Addresses pension system reform",
  },
  {
    pattern: /\bd[eé]ficit\b/i,
    topic: "fiscal",
    dimension: "policy",
    stanceScore: -0.4,
    stanceLabel: "Addresses fiscal deficit",
  },
  {
    pattern: /\bfiscal\b/i,
    topic: "fiscal",
    dimension: "policy",
    stanceScore: -0.2,
    stanceLabel: "Mentions fiscal policy broadly",
  },

  // ── foreign-policy ─────────────────────────────────────────────────────────
  {
    pattern: /pol[íi]tica\s+exterior/i,
    topic: "foreign-policy",
    dimension: "policy",
    stanceScore: 0.3,
    stanceLabel: "Addresses foreign policy direction",
  },
  {
    pattern: /relaciones\s+internacionales/i,
    topic: "foreign-policy",
    dimension: "policy",
    stanceScore: 0.3,
    stanceLabel: "Addresses international relations",
  },
  {
    pattern: /\bVenezuela\b/i,
    topic: "foreign-policy",
    dimension: "policy",
    stanceScore: 0.2,
    stanceLabel: "Mentions Venezuela in foreign policy context",
  },

  // ── alliances / rhetoric ───────────────────────────────────────────────────
  {
    pattern: /\balianza\b|\bcoalici[óo]n\b/i,
    topic: "alliances",
    dimension: "alliances",
    stanceScore: 0.2,
    stanceLabel: "Forming or referencing a political alliance",
  },
];

// ---------------------------------------------------------------------------
// Keyword-extraction helpers (default path)
// ---------------------------------------------------------------------------

const MAX_QUOTE_LENGTH = 150;

function extractQuote(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);
  if (!match) return text.slice(0, MAX_QUOTE_LENGTH);
  const start = Math.max(0, match.index - 60);
  const end = Math.min(text.length, match.index + match[0].length + 60);
  const raw = text.slice(start, end).trim();
  return raw.length > MAX_QUOTE_LENGTH ? raw.slice(0, MAX_QUOTE_LENGTH) + "…" : raw;
}

function keywordExtractStances(
  candidateId: string,
  topics: string[],
  content: SourceContent,
): MicroStance[] {
  const text = content.cleanedText;
  if (!text) return [];

  const topicSet = new Set(topics);
  const seen = new Set<string>();
  const stances: MicroStance[] = [];

  for (const rule of KEYWORD_RULES) {
    if (!topicSet.has(rule.topic)) continue;
    if (seen.has(rule.topic)) continue;
    if (!rule.pattern.test(text)) continue;

    seen.add(rule.topic);

    const evidence: Evidence = {
      url: content.source.url,
      quote: extractQuote(text, rule.pattern),
      ...(content.source.date && { date: content.source.date }),
      ...(content.source.sourceName && { sourceName: content.source.sourceName }),
    };

    stances.push({
      candidateId,
      topic: rule.topic,
      dimension: rule.dimension,
      stanceScore: rule.stanceScore,
      stanceLabel: rule.stanceLabel,
      evidence,
    });
  }

  return stances;
}

// ---------------------------------------------------------------------------
// Opus branch — experimental, ivan-cepeda + security only
// ---------------------------------------------------------------------------

const OPUS_SYSTEM_PROMPT = `You are a political analyst extracting structured stance data from Spanish-language political texts.

You will receive a cleaned text excerpt about a Colombian presidential candidate and respond with ONLY a JSON array of MicroStance objects. No prose, no markdown, no explanation — only the JSON array.

Each MicroStance must strictly follow this schema (no extra keys allowed):
{
  "candidateId": string,       // the candidate ID provided
  "topic": "security",         // always "security" for this task
  "dimension": "policy" | "behavior" | "alliances" | "rhetoric",
  "stanceScore": number,       // float in [-1, 1]: negative = opposes progressive/human-security approach, positive = supports it
  "stanceLabel": string,       // ≤ 12 words in English summarising the stance
  "evidence": {
    "url": string,             // source URL provided
    "quote": string,           // verbatim excerpt (≤ 150 chars) from the text that most supports this stance
    "date": string | undefined,
    "sourceName": string | undefined
  }
}

Rules:
- Return between 0 and 3 MicroStance objects (0 if the text has no clear security stance).
- stanceScore scale: +1 = strongly favours human/social security; -1 = strongly favours militarised/punitive security.
- Each object must cover a distinct dimension or sub-stance.
- If you cannot find a security stance, return an empty array: []`;

/** Minimal shape we accept from the model before coercing to MicroStance[]. */
interface RawOpusStance {
  candidateId: unknown;
  topic: unknown;
  dimension: unknown;
  stanceScore: unknown;
  stanceLabel: unknown;
  evidence: {
    url: unknown;
    quote: unknown;
    date?: unknown;
    sourceName?: unknown;
  };
}

const VALID_DIMENSIONS = new Set<string>(["policy", "behavior", "alliances", "rhetoric"]);

function isValidStance(obj: unknown): obj is RawOpusStance {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.candidateId === "string" &&
    typeof o.topic === "string" &&
    typeof o.dimension === "string" && VALID_DIMENSIONS.has(o.dimension) &&
    typeof o.stanceScore === "number" &&
    o.stanceScore >= -1 && o.stanceScore <= 1 &&
    typeof o.stanceLabel === "string" &&
    typeof o.evidence === "object" && o.evidence !== null &&
    typeof (o.evidence as Record<string, unknown>).url === "string" &&
    typeof (o.evidence as Record<string, unknown>).quote === "string"
  );
}

/**
 * Call Claude Opus 4.6 to extract security-topic MicroStances from a single
 * Spanish-language source.  Returns [] on any failure.
 *
 * Exported only for testing (stub injection); not part of the public skill API.
 */
export async function callOpusForSecurityStances(
  content: SourceContent,
  candidateId: string,
): Promise<MicroStance[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[stance_extractor] ANTHROPIC_API_KEY not set — skipping Opus branch");
    return [];
  }

  const client = new Anthropic({ apiKey });

  const userMessage = [
    `Candidate ID: ${candidateId}`,
    `Source URL: ${content.source.url}`,
    content.source.date ? `Date: ${content.source.date}` : null,
    content.source.sourceName ? `Outlet: ${content.source.sourceName}` : null,
    "",
    "--- Spanish text ---",
    content.cleanedText,
    content.translatedText ? `\n--- English summary ---\n${content.translatedText}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: OPUS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const raw: unknown = JSON.parse(textBlock.text.trim());
  if (!Array.isArray(raw)) return [];

  const stances: MicroStance[] = [];
  for (const item of raw) {
    if (!isValidStance(item)) continue;
    const ev = item.evidence as Record<string, unknown>;
    stances.push({
      candidateId: String(item.candidateId),
      topic: String(item.topic),
      dimension: item.dimension as StanceDimension,
      stanceScore: Number(item.stanceScore),
      stanceLabel: String(item.stanceLabel),
      evidence: {
        url: String(ev.url),
        quote: String(ev.quote),
        ...(ev.date !== undefined && { date: String(ev.date) }),
        ...(ev.sourceName !== undefined && { sourceName: String(ev.sourceName) }),
      },
    });
  }
  return stances;
}

// ---------------------------------------------------------------------------
// Guard: should we use the Opus branch for this call?
// ---------------------------------------------------------------------------

const OPUS_MIN_TEXT = 500;
const OPUS_MAX_TEXT = 4000;

function shouldUseOpusBranch(
  candidateId: string,
  topics: string[],
  content: SourceContent,
): boolean {
  return (
    candidateId === "ivan-cepeda" &&
    topics.includes("security") &&
    content.language === "es" &&
    content.cleanedText.length >= OPUS_MIN_TEXT &&
    content.cleanedText.length <= OPUS_MAX_TEXT
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract MicroStance objects from a single SourceContent.
 *
 * For most inputs this runs the deterministic keyword rules (synchronously
 * via a resolved Promise).  For ivan-cepeda + security + Spanish text of
 * appropriate length, it calls Claude Opus 4.6 instead — falling back to
 * keyword rules on any error.
 *
 * The signature is intentionally async to accommodate the Opus branch without
 * a breaking change; callers that only hit the keyword path pay no I/O cost.
 *
 * @param candidateId - The candidate this content belongs to.
 * @param topics      - Which topics to look for (e.g. ["security", "economy"]).
 * @param content     - Cleaned source content from the content_extractor skill.
 * @returns A promise resolving to an array of MicroStance objects.
 */
export async function extractStances(
  candidateId: string,
  topics: string[],
  content: SourceContent,
): Promise<MicroStance[]> {
  if (shouldUseOpusBranch(candidateId, topics, content)) {
    try {
      const opusStances = await callOpusForSecurityStances(content, candidateId);
      // Merge: Opus handles "security"; keyword rules handle remaining topics
      const remainingTopics = topics.filter((t) => t !== "security");
      const keywordStances =
        remainingTopics.length > 0
          ? keywordExtractStances(candidateId, remainingTopics, content)
          : [];
      return [...opusStances, ...keywordStances];
    } catch (err) {
      console.warn(
        "[stance_extractor] Opus call failed — falling back to keyword rules:",
        err instanceof Error ? err.message : err,
      );
      // Fall through to keyword extraction below
    }
  }

  return keywordExtractStances(candidateId, topics, content);
}
