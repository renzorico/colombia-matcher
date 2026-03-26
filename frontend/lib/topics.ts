/**
 * topics.ts — Canonical topic definitions for Colombia Matcher.
 *
 * Single source of truth for topic IDs, Spanish labels, quiz weights,
 * and migration aliases.  Import from here wherever topic names are needed.
 *
 * Keep this file in sync with backend/topics.py.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Topic {
  /** Canonical snake_case ID used in JSON, API, and URL paths. */
  id: string;
  /** Spanish display label for UI. */
  labelEs: string;
  /** Short Spanish description for tooltips / info panels. */
  descriptionEs: string;
  /**
   * Relative weight in the overall affinity score.
   * All weights sum to 1.0.
   */
  quizWeight: number;
  /**
   * Legacy IDs or spellings that may appear in older data or API responses.
   * Treat any alias as equivalent to `id` when reading data.
   */
  aliases: readonly string[];
}

// ---------------------------------------------------------------------------
// Canonical topic list
// ---------------------------------------------------------------------------

export const TOPICS: readonly Topic[] = [
  {
    id: "security",
    labelEs: "Seguridad",
    descriptionEs:
      "Orden público, fuerzas militares, negociación con grupos armados y política antidrogas.",
    quizWeight: 0.25,
    aliases: ["seguridad"],
  },
  {
    id: "economy",
    labelEs: "Economía",
    descriptionEs:
      "Intervención del Estado, política comercial, empleo, reforma agraria y modelo productivo.",
    quizWeight: 0.20,
    aliases: ["economia"],
  },
  {
    id: "health",
    labelEs: "Salud",
    descriptionEs:
      "Sistema de salud, EPS, cobertura pública y acceso a medicamentos.",
    quizWeight: 0.15,
    aliases: ["salud"],
  },
  {
    id: "energy_environment",
    labelEs: "Energía y Medio Ambiente",
    descriptionEs:
      "Política energética, transición hacia renovables, fracking, minería y protección ambiental.",
    quizWeight: 0.15,
    // Legacy: candidates_v2.json stored these as two separate axes.
    // The canonical schema merges them. Both aliases are still valid
    // when reading older data or API responses.
    aliases: ["energy_oil", "environment", "energia_ambiente"],
  },
  {
    id: "fiscal",
    labelEs: "Política Fiscal",
    descriptionEs:
      "Impuestos, gasto público, déficit fiscal, pensiones y reforma tributaria.",
    quizWeight: 0.10,
    aliases: ["fiscal_policy"],
  },
  {
    id: "foreign_policy",
    labelEs: "Política Exterior",
    descriptionEs:
      "Relaciones con EE.UU., Venezuela, integración latinoamericana y política exterior.",
    quizWeight: 0.10,
    // Legacy: frontend previously used a hyphenated form.
    aliases: ["foreign-policy", "politica_exterior"],
  },
  {
    id: "anticorruption",
    labelEs: "Anticorrupción",
    descriptionEs:
      "Transparencia institucional, financiación de campañas, reforma judicial y lucha contra la corrupción.",
    quizWeight: 0.05,
    aliases: ["anti_corruption", "anticorrupcion"],
  },
] as const;

// ---------------------------------------------------------------------------
// Convenience lookups
// ---------------------------------------------------------------------------

/** Map canonical ID → Topic */
export const TOPICS_BY_ID: Readonly<Record<string, Topic>> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t]),
);

/** Map any alias (or canonical ID) → Topic */
const _aliasMap = new Map<string, Topic>();
for (const t of TOPICS) {
  _aliasMap.set(t.id, t);
  for (const alias of t.aliases) {
    _aliasMap.set(alias, t);
  }
}

/** Return the Topic for a canonical ID or any registered alias. */
export function getTopic(idOrAlias: string): Topic | undefined {
  return _aliasMap.get(idOrAlias);
}

/** Return the canonical topic ID for any ID or alias string. */
export function resolveTopicId(idOrAlias: string): string | undefined {
  return _aliasMap.get(idOrAlias)?.id;
}

/** Ordered list of canonical topic IDs (same order as TOPICS). */
export const TOPIC_IDS: readonly string[] = TOPICS.map((t) => t.id);

/** Quiz axis weights as a plain object (for scorer compatibility). */
export const AXIS_WEIGHTS: Readonly<Record<string, number>> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.quizWeight]),
);

/** Spanish labels as a plain object (for display compatibility). */
export const AXIS_LABELS_ES: Readonly<Record<string, string>> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.labelEs]),
);
