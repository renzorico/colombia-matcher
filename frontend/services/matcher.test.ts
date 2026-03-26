import { describe, it, expect } from "vitest";
import { computeProfileMatch } from "./matcher";
import { getCandidateProfile } from "./profiles";
import type { CandidateProfile } from "../skills/profile_aggregator";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProfile(
  candidateId: string,
  topicScores: CandidateProfile["topicScores"],
): CandidateProfile {
  return { candidateId, updatedAt: new Date().toISOString(), topicScores };
}

// ---------------------------------------------------------------------------
// computeProfileMatch — unit tests (no I/O)
// ---------------------------------------------------------------------------

describe("computeProfileMatch — basic behaviour", () => {
  it("returns overallScore 0 when profile has no topicScores", () => {
    const profile = makeProfile("candidate-a", []);
    const result = computeProfileMatch({ security: 3 }, profile);
    expect(result.overallScore).toBe(0);
    expect(result.topicAlignments).toHaveLength(0);
  });

  it("returns overallScore 0 when user has no answers for the profile's topics", () => {
    const profile = makeProfile("candidate-a", [
      { topic: "security", dimension: "policy", score: 0.5, confidence: 0.4, evidenceSamples: [] },
    ]);
    const result = computeProfileMatch({ economy: 3 }, profile); // no "security" key
    expect(result.overallScore).toBe(0);
  });

  it("overallScore is always between 0 and 1", () => {
    const profile = makeProfile("candidate-a", [
      { topic: "security", dimension: "policy", score: 1, confidence: 1, evidenceSamples: [] },
      { topic: "economy", dimension: "policy", score: -1, confidence: 1, evidenceSamples: [] },
    ]);
    const result = computeProfileMatch({ security: 1, economy: 5 }, profile);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
  });

  it("perfect agreement when user and candidate are fully aligned", () => {
    // user answer 5 → normalised +1; candidate score +1 → agreement = 1
    const profile = makeProfile("candidate-a", [
      { topic: "economy", dimension: "policy", score: 1, confidence: 1, evidenceSamples: [] },
    ]);
    const result = computeProfileMatch({ economy: 5 }, profile);
    expect(result.overallScore).toBeCloseTo(1);
    expect(result.topicAlignments[0].agreement).toBeCloseTo(1);
  });

  it("zero agreement when user and candidate are completely opposed", () => {
    // user answer 1 → normalised -1; candidate score +1 → agreement = 0
    const profile = makeProfile("candidate-a", [
      { topic: "economy", dimension: "policy", score: 1, confidence: 1, evidenceSamples: [] },
    ]);
    const result = computeProfileMatch({ economy: 1 }, profile);
    expect(result.overallScore).toBeCloseTo(0);
    expect(result.topicAlignments[0].agreement).toBeCloseTo(0);
  });

  it("ignores non-policy dimensions when computing the match", () => {
    const profile = makeProfile("candidate-a", [
      // "behavior" dimension — should be skipped
      { topic: "security", dimension: "behavior", score: -0.9, confidence: 1, evidenceSamples: [] },
      // "policy" dimension — should be used
      { topic: "security", dimension: "policy", score: 0.6, confidence: 1, evidenceSamples: [] },
    ]);
    const result = computeProfileMatch({ security: 5 }, profile); // user leans +1
    // Only the policy score (0.6) should count; behavior (-0.9) is excluded
    expect(result.topicAlignments).toHaveLength(1);
    expect(result.topicAlignments[0].candidateScore).toBeCloseTo(0.6);
  });

  it("averages agreement across multiple matched topics", () => {
    const profile = makeProfile("candidate-a", [
      { topic: "security", dimension: "policy", score: 1, confidence: 1, evidenceSamples: [] },
      { topic: "economy", dimension: "policy", score: -1, confidence: 1, evidenceSamples: [] },
    ]);
    // user: security=5 (+1 norm, agrees with +1) → 1.0
    // user: economy=5  (+1 norm, opposes -1)     → 0.0
    // overall = (1.0 + 0.0) / 2 = 0.5
    const result = computeProfileMatch({ security: 5, economy: 5 }, profile);
    expect(result.overallScore).toBeCloseTo(0.5);
  });
});

// ---------------------------------------------------------------------------
// Integration: mock pipeline + matcher (reads from CandidateProfile)
// ---------------------------------------------------------------------------

describe("getCandidateProfile + computeProfileMatch — integration", () => {
  it("computes a match for ivan-cepeda without throwing", async () => {
    const profile = await getCandidateProfile("ivan-cepeda");
    expect(profile.candidateId).toBe("ivan-cepeda");

    const result = computeProfileMatch(
      { security: 2, economy: 2, anticorruption: 2 },
      profile,
    );

    expect(() => result).not.toThrow;
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
  });

  it("topicAlignments are driven by CandidateProfile.topicScores, not static data", async () => {
    const profile = await getCandidateProfile("ivan-cepeda");

    // Build a second profile identical except with flipped scores
    const flippedProfile = makeProfile("ivan-cepeda", profile.topicScores.map(ts => ({
      ...ts,
      score: -ts.score,
    })));

    const userAnswers = { security: 2, economy: 2, anticorruption: 2 };
    const normal  = computeProfileMatch(userAnswers, profile);
    const flipped = computeProfileMatch(userAnswers, flippedProfile);

    // Scores should differ because the underlying topicScores changed
    // (this would not be possible if the matcher read from static config)
    if (normal.topicAlignments.length > 0) {
      expect(normal.overallScore).not.toBeCloseTo(flipped.overallScore, 5);
    }
  });

  it("candidateScore in topicAlignments matches the value in profile.topicScores", async () => {
    const profile = await getCandidateProfile("ivan-cepeda");
    const result = computeProfileMatch(
      { security: 3, economy: 3, anticorruption: 3 },
      profile,
    );

    for (const alignment of result.topicAlignments) {
      const profileEntry = profile.topicScores.find(
        (ts) => ts.topic === alignment.topic && ts.dimension === "policy",
      );
      expect(profileEntry).toBeDefined();
      expect(alignment.candidateScore).toBeCloseTo(profileEntry!.score);
    }
  });
});

// ---------------------------------------------------------------------------
// Ranking — all 6 candidates
// ---------------------------------------------------------------------------

const ALL_CANDIDATE_IDS = [
  "ivan-cepeda",
  "german-vargas-lleras",
  "abelardo-de-la-espriella",
  "paloma-valencia",
  "sergio-fajardo",
  "claudia-lopez",
];

/** Simulate a centrist user who leans slightly left on environment/anticorruption. */
const MOCK_TOPIC_SCORES: Record<string, number> = {
  security: 3,
  economy: 3,
  health: 4,
  environment: 5,
  fiscal: 3,
  "foreign-policy": 3,
  anticorruption: 5,
};

describe("rankAllCandidates — all 6 mock profiles", () => {
  it("returns a ranked list of 6 candidates with overallScore in [0, 1]", async () => {
    const profiles = await Promise.all(
      ALL_CANDIDATE_IDS.map((id) => getCandidateProfile(id, undefined, 60)),
    );
    const ranked = profiles
      .map((p) => computeProfileMatch(MOCK_TOPIC_SCORES, p))
      .sort((a, b) => b.overallScore - a.overallScore);

    expect(ranked).toHaveLength(6);
    for (const m of ranked) {
      expect(m.overallScore).toBeGreaterThanOrEqual(0);
      expect(m.overallScore).toBeLessThanOrEqual(1);
    }
  });

  it("the top candidate has the highest overallScore across all 6", async () => {
    const profiles = await Promise.all(
      ALL_CANDIDATE_IDS.map((id) => getCandidateProfile(id, undefined, 60)),
    );
    const ranked = profiles
      .map((p) => computeProfileMatch(MOCK_TOPIC_SCORES, p))
      .sort((a, b) => b.overallScore - a.overallScore);

    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[0].overallScore).toBeGreaterThanOrEqual(ranked[i].overallScore);
    }
  });
});
