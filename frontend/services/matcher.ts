/**
 * matcher — compute citizen–candidate alignment from a CandidateProfile.
 *
 * Score bridge
 * ────────────
 * The quiz delivers user answers on a 1–5 scale (identical to the Python
 * backend).  CandidateProfile.topicScores carries scores in [-1, 1] from the
 * research pipeline.  We normalise the user answer into the same [-1, 1] space
 * before comparing:
 *
 *   userNorm = (answer - 3) / 2   →  1→-1, 3→0, 5→+1
 *
 * Agreement per topic:
 *   agreement = 1 - |userNorm - candidateScore| / 2
 *
 * (max possible gap between two [-1,1] values is 2, so this keeps the result
 * in [0, 1] — analogous to `1 - |a-b|/4` in the Python scorer which operates
 * on [1,5].)
 *
 * Only "policy" dimension entries are used for matching; other dimensions
 * (behavior, alliances, rhetoric) carry useful context but are not position
 * scores the user can directly mirror.
 */

import type { CandidateProfile } from "../skills/profile_aggregator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopicAlignment {
  topic: string;
  /** 0 (complete disagreement) → 1 (perfect agreement) */
  agreement: number;
  /** User answer normalised to [-1, 1] */
  userScore: number;
  /** Candidate's averaged policy score from the profile, in [-1, 1] */
  candidateScore: number;
}

export interface MatchResult {
  candidateId: string;
  /** Unweighted average of per-topic agreements; 0–1. */
  overallScore: number;
  topicAlignments: TopicAlignment[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a 1–5 quiz answer to [-1, 1]. */
function normaliseUserScore(answer: number): number {
  return (answer - 3) / 2;
}

/** Agreement between two scores both in [-1, 1]. Result in [0, 1]. */
function topicAgreement(userNorm: number, candidateScore: number): number {
  return 1 - Math.abs(userNorm - candidateScore) / 2;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute how well a citizen's topic preferences match a candidate's profile.
 *
 * @param userTopicScores - Map of topic → quiz answer (1–5 scale).
 *   Keys should match the topic names in CandidateProfile.topicScores
 *   (e.g. "security", "economy", "anticorruption").
 * @param profile - CandidateProfile produced by the research pipeline.
 * @returns MatchResult with an overall 0–1 score and per-topic breakdown.
 */
export function computeProfileMatch(
  userTopicScores: Record<string, number>,
  profile: CandidateProfile,
): MatchResult {
  const topicAlignments: TopicAlignment[] = [];

  // Only the "policy" dimension represents the candidate's position stance.
  const policyScores = profile.topicScores.filter(
    (ts) => ts.dimension === "policy",
  );

  for (const ts of policyScores) {
    const userRaw = userTopicScores[ts.topic];
    if (userRaw === undefined) continue; // user gave no answer for this topic

    const userNorm = normaliseUserScore(userRaw);
    topicAlignments.push({
      topic: ts.topic,
      agreement: topicAgreement(userNorm, ts.score),
      userScore: userNorm,
      candidateScore: ts.score,
    });
  }

  const overallScore =
    topicAlignments.length === 0
      ? 0
      : topicAlignments.reduce((sum, a) => sum + a.agreement, 0) /
        topicAlignments.length;

  return {
    candidateId: profile.candidateId,
    overallScore,
    topicAlignments,
  };
}
