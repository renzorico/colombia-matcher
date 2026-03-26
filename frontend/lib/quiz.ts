/**
 * quiz — shared types and utilities for the quiz pipeline.
 *
 * Centralises the mapping between backend axis names (questions_v1.json) and
 * the frontend QuizTopic strings used by the research pipeline and matcher.
 */

// Internal type used only by the deprecated /api/match route.
// The public Question type in api.ts no longer carries `axis` because the
// backend strips it; this keeps the legacy pipeline compiling without polluting
// the production type.
export interface QuestionWithAxis {
  id: string;
  axis: string;
  weight: number;
}

// ---------------------------------------------------------------------------
// QuizTopic — canonical frontend topic names
// ---------------------------------------------------------------------------

/**
 * The set of policy topics the quiz covers.  These strings must match the
 * topic keys used in CandidateProfile.topicScores (see skills/profile_aggregator.ts
 * and the DEFAULT_TOPICS list in services/profiles.ts).
 */
export type QuizTopic =
  | "security"
  | "economy"
  | "health"
  | "environment"
  | "fiscal"
  | "foreign-policy"
  | "anticorruption";

/** Ordered list of all quiz topics (mirrors DEFAULT_TOPICS in services/profiles.ts). */
export const QUIZ_TOPICS: QuizTopic[] = [
  "security",
  "economy",
  "health",
  "environment",
  "fiscal",
  "foreign-policy",
  "anticorruption",
];

// ---------------------------------------------------------------------------
// Axis → Topic mapping
// ---------------------------------------------------------------------------

/**
 * Maps the backend `axis` field (questions_v1.json) to a frontend QuizTopic.
 *
 * Most axes are already identical to the topic name; only two need remapping:
 *   energy_environment  →  environment
 *   foreign_policy      →  foreign-policy
 */
const AXIS_TO_TOPIC: Record<string, QuizTopic> = {
  security:           "security",
  economy:            "economy",
  health:             "health",
  energy_environment: "environment",
  fiscal:             "fiscal",
  foreign_policy:     "foreign-policy",
  anticorruption:     "anticorruption",
};

/**
 * Convert a backend `axis` string to a QuizTopic.
 * Throws a descriptive error if the axis is not in AXIS_TO_TOPIC.
 */
export function axisToTopic(axis: string): QuizTopic {
  const topic = AXIS_TO_TOPIC[axis];
  if (topic === undefined) {
    throw new Error(
      `Unknown quiz axis: "${axis}". Add it to AXIS_TO_TOPIC in lib/quiz.ts.`,
    );
  }
  return topic;
}

// ---------------------------------------------------------------------------
// Score aggregation
// ---------------------------------------------------------------------------

/**
 * Collapse per-question answers (1–5 scale) into per-topic weighted averages.
 *
 * Topics with no answered questions are omitted from the result.
 * The values stay in [1, 5] — computeProfileMatch normalises them to [-1, 1].
 *
 * @param questions - Full question list (must include `axis` and `weight`).
 * @param answers   - Map of question id → user answer (1–5).
 * @returns Weighted-average answer per topic in [1, 5].
 */
export function buildUserTopicScores(
  questions: QuestionWithAxis[],
  answers: Record<string, number>,
): Record<string, number> {
  const weightedSum: Record<string, number> = {};
  const totalWeight: Record<string, number> = {};

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === undefined) continue;
    const topic = axisToTopic(q.axis);
    weightedSum[topic] = (weightedSum[topic] ?? 0) + answer * q.weight;
    totalWeight[topic] = (totalWeight[topic] ?? 0) + q.weight;
  }

  const result: Record<string, number> = {};
  for (const topic of Object.keys(weightedSum)) {
    result[topic] = weightedSum[topic] / totalWeight[topic];
  }
  return result;
}
