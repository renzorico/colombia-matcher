import { describe, it, expect } from "vitest";
import { aggregateProfile } from "./profile_aggregator";
import type { MicroStance, Evidence } from "./stance_extractor";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStance(
  overrides: Partial<MicroStance> & Pick<MicroStance, "topic" | "stanceScore">,
): MicroStance {
  return {
    candidateId: "candidate-a",
    dimension: "policy",
    stanceLabel: "Test label",
    evidence: {
      url: `https://example.com/${overrides.topic}`,
      quote: `Quote about ${overrides.topic}`,
      date: "2026-03-20",
    } satisfies Evidence,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Empty input
// ---------------------------------------------------------------------------

describe("aggregateProfile — empty input", () => {
  it("returns an empty topicScores array when given no stances", () => {
    const profile = aggregateProfile("candidate-a", []);
    expect(profile.topicScores).toEqual([]);
  });

  it("still sets candidateId and a valid ISO updatedAt", () => {
    const profile = aggregateProfile("candidate-a", []);
    expect(profile.candidateId).toBe("candidate-a");
    expect(profile.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ---------------------------------------------------------------------------
// Averaging and confidence
// ---------------------------------------------------------------------------

describe("aggregateProfile — score averaging and confidence", () => {
  it("produces a single TopicDimensionScore for one stance", () => {
    const profile = aggregateProfile("candidate-a", [
      makeStance({ topic: "economy", stanceScore: 0.4 }),
    ]);
    expect(profile.topicScores).toHaveLength(1);
    const ts = profile.topicScores[0];
    expect(ts.score).toBeCloseTo(0.4);
    expect(ts.confidence).toBeCloseTo(1 / 5);
  });

  it("averages scores across multiple stances in the same (topic, dimension) group", () => {
    const profile = aggregateProfile("candidate-a", [
      makeStance({ topic: "security", stanceScore: 0.6 }),
      makeStance({ topic: "security", stanceScore: -0.4 }),
    ]);
    expect(profile.topicScores).toHaveLength(1);
    expect(profile.topicScores[0].score).toBeCloseTo(0.1);
  });

  it("confidence saturates at 1.0 for 5 or more stances", () => {
    const stances = Array.from({ length: 5 }, () =>
      makeStance({ topic: "economy", stanceScore: 0.2 }),
    );
    const profile = aggregateProfile("candidate-a", stances);
    expect(profile.topicScores[0].confidence).toBe(1);
  });

  it("treats different dimensions as separate groups", () => {
    const profile = aggregateProfile("candidate-a", [
      makeStance({ topic: "anticorruption", dimension: "policy", stanceScore: 0.7 }),
      makeStance({ topic: "anticorruption", dimension: "behavior", stanceScore: -0.6 }),
    ]);
    expect(profile.topicScores).toHaveLength(2);
    const topics = profile.topicScores.map((ts) => ts.dimension);
    expect(topics).toContain("policy");
    expect(topics).toContain("behavior");
  });
});

// ---------------------------------------------------------------------------
// Evidence deduplication and truncation
// ---------------------------------------------------------------------------

describe("aggregateProfile — evidence samples", () => {
  it("caps evidenceSamples at 3 even when there are more stances", () => {
    const stances = Array.from({ length: 5 }, (_, i) =>
      makeStance({
        topic: "security",
        stanceScore: 0.3,
        evidence: {
          url: `https://example.com/source-${i}`,
          quote: `Unique quote ${i}`,
        },
      }),
    );
    const profile = aggregateProfile("candidate-a", stances);
    expect(profile.topicScores[0].evidenceSamples).toHaveLength(3);
  });

  it("deduplicates evidence with the same url+quote", () => {
    const sharedEvidence: Evidence = {
      url: "https://example.com/dupe",
      quote: "Same quote repeated",
    };
    const stances = Array.from({ length: 4 }, () =>
      makeStance({ topic: "economy", stanceScore: 0.5, evidence: sharedEvidence }),
    );
    const profile = aggregateProfile("candidate-a", stances);
    expect(profile.topicScores[0].evidenceSamples).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// candidateId filtering
// ---------------------------------------------------------------------------

describe("aggregateProfile — candidateId filtering", () => {
  it("excludes stances belonging to other candidates", () => {
    const profile = aggregateProfile("candidate-a", [
      makeStance({ candidateId: "candidate-a", topic: "economy", stanceScore: 0.5 }),
      makeStance({ candidateId: "candidate-b", topic: "security", stanceScore: 0.8 }),
    ]);
    expect(profile.topicScores).toHaveLength(1);
    expect(profile.topicScores[0].topic).toBe("economy");
  });

  it("returns empty topicScores when no stances match the candidateId", () => {
    const profile = aggregateProfile("candidate-a", [
      makeStance({ candidateId: "candidate-b", topic: "security", stanceScore: 0.3 }),
    ]);
    expect(profile.topicScores).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// german-vargas-lleras — pipeline integration
// ---------------------------------------------------------------------------

describe("aggregateProfile — german-vargas-lleras mock pipeline", () => {
  it("builds a non-empty CandidateProfile without throwing", () => {
    const stances: MicroStance[] = [
      makeStance({ candidateId: "german-vargas-lleras", topic: "security",      stanceScore: -0.7 }),
      makeStance({ candidateId: "german-vargas-lleras", topic: "economy",       stanceScore:  0.3 }),
      makeStance({ candidateId: "german-vargas-lleras", topic: "fiscal",        stanceScore: -0.7 }),
      makeStance({ candidateId: "german-vargas-lleras", topic: "anticorruption", stanceScore: -0.6 }),
    ];
    const profile = aggregateProfile("german-vargas-lleras", stances);
    expect(profile.candidateId).toBe("german-vargas-lleras");
    expect(profile.topicScores.length).toBeGreaterThanOrEqual(4);
  });

  it("profile scores stay within [-1, 1]", () => {
    const stances: MicroStance[] = [
      makeStance({ candidateId: "german-vargas-lleras", topic: "security",  stanceScore: -0.7 }),
      makeStance({ candidateId: "german-vargas-lleras", topic: "economy",   stanceScore:  0.3 }),
      makeStance({ candidateId: "german-vargas-lleras", topic: "fiscal",    stanceScore: -0.6 }),
    ];
    const profile = aggregateProfile("german-vargas-lleras", stances);
    for (const ts of profile.topicScores) {
      expect(ts.score).toBeGreaterThanOrEqual(-1);
      expect(ts.score).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// New candidates — pipeline integration (mock stances)
// ---------------------------------------------------------------------------

describe("aggregateProfile — abelardo-de-la-espriella mock pipeline", () => {
  it("builds a non-empty CandidateProfile without throwing", () => {
    const stances: MicroStance[] = [
      makeStance({ candidateId: "abelardo-de-la-espriella", topic: "security",       stanceScore: -0.7 }),
      makeStance({ candidateId: "abelardo-de-la-espriella", topic: "economy",        stanceScore: -0.5 }),
      makeStance({ candidateId: "abelardo-de-la-espriella", topic: "anticorruption", stanceScore: -0.6 }),
      makeStance({ candidateId: "abelardo-de-la-espriella", topic: "fiscal",         stanceScore: -0.7 }),
      makeStance({ candidateId: "abelardo-de-la-espriella", topic: "health",         stanceScore:  0.3 }),
    ];
    const profile = aggregateProfile("abelardo-de-la-espriella", stances);
    expect(profile.candidateId).toBe("abelardo-de-la-espriella");
    expect(profile.topicScores.length).toBeGreaterThanOrEqual(3);
    for (const ts of profile.topicScores) {
      expect(ts.score).toBeGreaterThanOrEqual(-1);
      expect(ts.score).toBeLessThanOrEqual(1);
    }
  });
});

describe("aggregateProfile — paloma-valencia mock pipeline", () => {
  it("builds a non-empty CandidateProfile without throwing", () => {
    const stances: MicroStance[] = [
      makeStance({ candidateId: "paloma-valencia", topic: "security",       stanceScore: -0.7 }),
      makeStance({ candidateId: "paloma-valencia", topic: "fiscal",         stanceScore: -0.7 }),
      makeStance({ candidateId: "paloma-valencia", topic: "economy",        stanceScore: -0.5 }),
      makeStance({ candidateId: "paloma-valencia", topic: "anticorruption", stanceScore:  0.7 }),
    ];
    const profile = aggregateProfile("paloma-valencia", stances);
    expect(profile.candidateId).toBe("paloma-valencia");
    expect(profile.topicScores.length).toBeGreaterThanOrEqual(3);
    for (const ts of profile.topicScores) {
      expect(ts.score).toBeGreaterThanOrEqual(-1);
      expect(ts.score).toBeLessThanOrEqual(1);
    }
  });
});

describe("aggregateProfile — sergio-fajardo mock pipeline", () => {
  it("builds a non-empty CandidateProfile without throwing", () => {
    const stances: MicroStance[] = [
      makeStance({ candidateId: "sergio-fajardo", topic: "anticorruption", stanceScore:  0.7 }),
      makeStance({ candidateId: "sergio-fajardo", topic: "environment",    stanceScore:  0.8 }),
      makeStance({ candidateId: "sergio-fajardo", topic: "security",       stanceScore:  0.6 }),
      makeStance({ candidateId: "sergio-fajardo", topic: "economy",        stanceScore:  0.3 }),
      makeStance({ candidateId: "sergio-fajardo", topic: "fiscal",         stanceScore:  0.5 }),
    ];
    const profile = aggregateProfile("sergio-fajardo", stances);
    expect(profile.candidateId).toBe("sergio-fajardo");
    expect(profile.topicScores.length).toBeGreaterThanOrEqual(3);
    for (const ts of profile.topicScores) {
      expect(ts.score).toBeGreaterThanOrEqual(-1);
      expect(ts.score).toBeLessThanOrEqual(1);
    }
  });
});

describe("aggregateProfile — claudia-lopez mock pipeline", () => {
  it("builds a non-empty CandidateProfile without throwing", () => {
    const stances: MicroStance[] = [
      makeStance({ candidateId: "claudia-lopez", topic: "environment",    stanceScore:  0.8 }),
      makeStance({ candidateId: "claudia-lopez", topic: "economy",        stanceScore:  0.5 }),
      makeStance({ candidateId: "claudia-lopez", topic: "anticorruption", stanceScore:  0.7 }),
      makeStance({ candidateId: "claudia-lopez", topic: "health",         stanceScore:  0.5 }),
      makeStance({ candidateId: "claudia-lopez", topic: "security",       stanceScore:  0.6 }),
    ];
    const profile = aggregateProfile("claudia-lopez", stances);
    expect(profile.candidateId).toBe("claudia-lopez");
    expect(profile.topicScores.length).toBeGreaterThanOrEqual(3);
    for (const ts of profile.topicScores) {
      expect(ts.score).toBeGreaterThanOrEqual(-1);
      expect(ts.score).toBeLessThanOrEqual(1);
    }
  });
});
