/**
 * profile_aggregator — aggregates a list of MicroStance objects into a
 * CandidateProfile by grouping on (topic, dimension) and computing an average
 * score, a size-based confidence, and up to 3 deduplicated evidence samples.
 */

import type { MicroStance, Evidence } from "./stance_extractor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopicDimensionScore {
  topic: string;
  dimension: string;
  score: number;
  /** 0–1, grows with the number of supporting stances (saturates at 5). */
  confidence: number;
  evidenceSamples: Evidence[];
}

export interface CandidateProfile {
  candidateId: string;
  /** ISO 8601 timestamp set at aggregation time. */
  updatedAt: string;
  topicScores: TopicDimensionScore[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const MAX_EVIDENCE_SAMPLES = 3;

/**
 * Aggregate MicroStance objects into a CandidateProfile.
 *
 * @param candidateId  - Only stances whose `candidateId` matches are included.
 * @param microStances - Full list of stances (may span multiple candidates).
 * @returns A CandidateProfile with averaged scores, size-based confidence, and
 *          up to 3 deduplicated evidence samples per (topic, dimension) group.
 */
export function aggregateProfile(
  candidateId: string,
  microStances: MicroStance[],
): CandidateProfile {
  const own = microStances.filter((s) => s.candidateId === candidateId);

  // Group by "topic::dimension" key
  const groups = new Map<string, MicroStance[]>();
  for (const stance of own) {
    const key = `${stance.topic}::${stance.dimension}`;
    const group = groups.get(key);
    if (group) {
      group.push(stance);
    } else {
      groups.set(key, [stance]);
    }
  }

  const topicScores: TopicDimensionScore[] = [];

  for (const stances of groups.values()) {
    const count = stances.length;
    const score =
      stances.reduce((sum, s) => sum + s.stanceScore, 0) / count;
    const confidence = Math.min(1, count / 5);

    // Deduplicate evidence by url+quote, keep insertion order
    const seen = new Set<string>();
    const evidenceSamples: Evidence[] = [];
    for (const s of stances) {
      if (evidenceSamples.length >= MAX_EVIDENCE_SAMPLES) break;
      const key = `${s.evidence.url}|${s.evidence.quote}`;
      if (!seen.has(key)) {
        seen.add(key);
        evidenceSamples.push(s.evidence);
      }
    }

    topicScores.push({
      topic: stances[0].topic,
      dimension: stances[0].dimension,
      score,
      confidence,
      evidenceSamples,
    });
  }

  return {
    candidateId,
    updatedAt: new Date().toISOString(),
    topicScores,
  };
}
