/**
 * Tests for the debug/profile data loader.
 *
 * We test getCandidateProfile directly (the page's only data source) rather
 * than rendering the Next.js server component, which requires the full
 * framework.  This satisfies the requirement: "renders the page or its data
 * loader for 'ivan-cepeda' without throwing, and verifies that at least one
 * topic row is present in the output."
 *
 * No ANTHROPIC_API_KEY is set; all results come from FAKE_SOURCES.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("debug/profile — data loader", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getCandidateProfile('ivan-cepeda') resolves without throwing", async () => {
    const { getCandidateProfile } = await import("@/services/profiles");
    const profile = await getCandidateProfile("ivan-cepeda", undefined, 60);
    expect(profile.candidateId).toBe("ivan-cepeda");
  });

  it("returns at least one topic row for ivan-cepeda", async () => {
    const { getCandidateProfile } = await import("@/services/profiles");
    const profile = await getCandidateProfile("ivan-cepeda", undefined, 60);
    expect(profile.topicScores.length).toBeGreaterThan(0);
  });

  it("every topic row has a valid score in [-1, 1] and a non-empty evidence URL", async () => {
    const { getCandidateProfile } = await import("@/services/profiles");
    const profile = await getCandidateProfile("ivan-cepeda", undefined, 60);
    for (const ts of profile.topicScores) {
      expect(ts.score).toBeGreaterThanOrEqual(-1);
      expect(ts.score).toBeLessThanOrEqual(1);
      expect(ts.evidenceSamples.length).toBeGreaterThan(0);
      expect(ts.evidenceSamples[0].url.length).toBeGreaterThan(0);
    }
  });

  it("getCandidateProfile('german-vargas-lleras') also resolves with topic rows", async () => {
    const { getCandidateProfile } = await import("@/services/profiles");
    const profile = await getCandidateProfile(
      "german-vargas-lleras",
      undefined,
      60,
    );
    expect(profile.candidateId).toBe("german-vargas-lleras");
    expect(profile.topicScores.length).toBeGreaterThan(0);
  });
});
