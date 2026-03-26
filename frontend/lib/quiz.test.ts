import { describe, it, expect } from "vitest";
import { axisToTopic, buildUserTopicScores, QUIZ_TOPICS, type QuestionWithAxis } from "./quiz";

// All axis values that appear in questions_canonical.json
const ALL_BACKEND_AXES = [
  "security",
  "economy",
  "health",
  "energy_environment",
  "fiscal",
  "foreign_policy",
  "anticorruption",
] as const;

function makeQuestion(
  id: string,
  axis: string,
  weight = 1,
): QuestionWithAxis {
  return { id, axis, weight };
}

// ---------------------------------------------------------------------------
// axisToTopic
// ---------------------------------------------------------------------------

describe("axisToTopic — mapping", () => {
  it.each(ALL_BACKEND_AXES)("maps axis '%s' to a known QuizTopic", (axis) => {
    const topic = axisToTopic(axis);
    expect(QUIZ_TOPICS).toContain(topic);
  });

  it("maps energy_environment → environment", () => {
    expect(axisToTopic("energy_environment")).toBe("environment");
  });

  it("maps foreign_policy → foreign-policy", () => {
    expect(axisToTopic("foreign_policy")).toBe("foreign-policy");
  });

  it("identity: axes that match their topic name pass through unchanged", () => {
    expect(axisToTopic("security")).toBe("security");
    expect(axisToTopic("economy")).toBe("economy");
    expect(axisToTopic("health")).toBe("health");
    expect(axisToTopic("fiscal")).toBe("fiscal");
    expect(axisToTopic("anticorruption")).toBe("anticorruption");
  });

  it("throws a descriptive error for an unknown axis", () => {
    expect(() => axisToTopic("unknown_axis")).toThrow(/Unknown quiz axis/);
    expect(() => axisToTopic("")).toThrow(/Unknown quiz axis/);
  });
});

// ---------------------------------------------------------------------------
// buildUserTopicScores
// ---------------------------------------------------------------------------

describe("buildUserTopicScores — aggregation", () => {
  it("computes a weighted average across questions for the same topic", () => {
    const questions: QuestionWithAxis[] = [
      makeQuestion("q01", "security", 2),
      makeQuestion("q02", "security", 3),
    ];
    const answers = { q01: 4, q02: 2 };
    const scores = buildUserTopicScores(questions, answers);
    // (4×2 + 2×3) / (2+3) = 14/5 = 2.8
    expect(scores["security"]).toBeCloseTo(2.8);
  });

  it("handles multiple topics in one call", () => {
    const questions: QuestionWithAxis[] = [
      makeQuestion("q01", "economy", 1),
      makeQuestion("q02", "health",  1),
    ];
    const answers = { q01: 5, q02: 1 };
    const scores = buildUserTopicScores(questions, answers);
    expect(scores["economy"]).toBeCloseTo(5);
    expect(scores["health"]).toBeCloseTo(1);
  });

  it("translates energy_environment axis to 'environment' key", () => {
    const questions: QuestionWithAxis[] = [makeQuestion("q01", "energy_environment", 1)];
    const scores = buildUserTopicScores(questions, { q01: 3 });
    expect(scores["environment"]).toBeCloseTo(3);
    expect(scores["energy_environment"]).toBeUndefined();
  });

  it("translates foreign_policy axis to 'foreign-policy' key", () => {
    const questions: QuestionWithAxis[] = [makeQuestion("q01", "foreign_policy", 1)];
    const scores = buildUserTopicScores(questions, { q01: 4 });
    expect(scores["foreign-policy"]).toBeCloseTo(4);
    expect(scores["foreign_policy"]).toBeUndefined();
  });

  it("skips questions that have no answer", () => {
    const questions: QuestionWithAxis[] = [
      makeQuestion("q01", "economy", 1),
      makeQuestion("q02", "economy", 1),
    ];
    const scores = buildUserTopicScores(questions, { q01: 5 }); // q02 unanswered
    expect(scores["economy"]).toBeCloseTo(5);
  });

  it("returns empty object when no questions are answered", () => {
    const questions: QuestionWithAxis[] = [makeQuestion("q01", "security", 1)];
    const scores = buildUserTopicScores(questions, {});
    expect(Object.keys(scores)).toHaveLength(0);
  });

  it("produces entries for all 7 topics when all axes are answered", () => {
    const questions: QuestionWithAxis[] = ALL_BACKEND_AXES.map((axis, i) =>
      makeQuestion(`q${i + 1}`, axis, 1),
    );
    const answers = Object.fromEntries(questions.map((q) => [q.id, 3]));
    const scores = buildUserTopicScores(questions, answers);
    expect(Object.keys(scores)).toHaveLength(7);
    for (const topic of QUIZ_TOPICS) {
      expect(scores[topic]).toBeCloseTo(3);
    }
  });
});

// ---------------------------------------------------------------------------
// QUIZ_TOPICS — no mismatch with profile topics
// ---------------------------------------------------------------------------

describe("QUIZ_TOPICS — consistency with CandidateProfile", () => {
  // The authoritative list from services/profiles.ts DEFAULT_TOPICS
  const PROFILE_TOPICS = [
    "security",
    "economy",
    "health",
    "environment",
    "fiscal",
    "foreign-policy",
    "anticorruption",
  ];

  it("every QuizTopic is a recognised profile topic", () => {
    for (const topic of QUIZ_TOPICS) {
      expect(PROFILE_TOPICS).toContain(topic);
    }
  });

  it("every profile topic has a corresponding QuizTopic", () => {
    for (const topic of PROFILE_TOPICS) {
      expect(QUIZ_TOPICS).toContain(topic);
    }
  });

  it("no backend axis produces a topic unknown to the profile pipeline", () => {
    for (const axis of ALL_BACKEND_AXES) {
      const topic = axisToTopic(axis);
      expect(PROFILE_TOPICS).toContain(topic);
    }
  });
});
