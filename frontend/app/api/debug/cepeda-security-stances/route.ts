/**
 * DEV-ONLY — internal research inspection endpoint.
 *
 * Runs the full mock research pipeline for ivan-cepeda restricted to the
 * "security" topic, allowing the Opus-based stance extraction branch to fire
 * when ANTHROPIC_API_KEY is present and the gate conditions are met.
 *
 * DO NOT expose this route in production.  It exists solely to inspect
 * Opus-generated stances during development.  Remove or gate behind an
 * env-var check (e.g. NODE_ENV !== "production") before any public deploy.
 *
 * Usage:
 *   curl http://localhost:3000/api/debug/cepeda-security-stances
 */

import { getCandidateProfile } from "@/services/profiles";

const EVIDENCE_QUOTE_LEN = 120;

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Detect whether the Opus branch had a chance to fire.
  // extractStances falls back silently, so we report based on key presence.
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  try {
    const profile = await getCandidateProfile("ivan-cepeda", ["security"], 30);

    const stances = profile.topicScores
      .filter((ts) => ts.topic === "security")
      .flatMap((ts) =>
        ts.evidenceSamples.map((ev) => ({
          topic: ts.topic,
          dimension: ts.dimension,
          stanceScore: ts.score,
          stanceLabel: `(aggregated — see raw MicroStances below; confidence: ${ts.confidence.toFixed(2)})`,
          evidence: {
            url: ev.url,
            quote:
              ev.quote.length > EVIDENCE_QUOTE_LEN
                ? ev.quote.slice(0, EVIDENCE_QUOTE_LEN) + "…"
                : ev.quote,
          },
        })),
      );

    return Response.json({
      candidateId: profile.candidateId,
      updatedAt: profile.updatedAt,
      mode: hasApiKey ? "opus" : "keyword_fallback",
      opusNote: hasApiKey
        ? "ANTHROPIC_API_KEY present — Opus branch may have fired for qualifying sources."
        : "ANTHROPIC_API_KEY not set — keyword rules were used for all sources.",
      stances,
      _raw: {
        topicScores: profile.topicScores.filter((ts) => ts.topic === "security"),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        error: "Research pipeline failed",
        detail: message,
        mode: "error",
      },
      { status: 500 },
    );
  }
}
