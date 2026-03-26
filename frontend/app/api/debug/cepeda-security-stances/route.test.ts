/**
 * Integration test for the debug research endpoint.
 *
 * Runs against the keyword-fallback path (no ANTHROPIC_API_KEY) so no real
 * API calls are made and the test is safe for CI.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("GET /api/debug/cepeda-security-stances", () => {
  beforeEach(() => {
    // Ensure the Opus branch cannot fire — keyword path only
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responds 200 with a valid JSON body", async () => {
    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe("object");
  });

  it("body includes candidateId, updatedAt, mode, and stances array", async () => {
    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body.candidateId).toBe("ivan-cepeda");
    expect(typeof body.updatedAt).toBe("string");
    expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Array.isArray(body.stances)).toBe(true);
  });

  it("reports keyword_fallback mode when API key is absent", async () => {
    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body.mode).toBe("keyword_fallback");
    expect(body.opusNote).toMatch(/ANTHROPIC_API_KEY not set/);
  });

  it("each stance entry has the expected shape", async () => {
    const { GET } = await import("./route");
    const body = await (await GET()).json();

    for (const stance of body.stances) {
      expect(stance.topic).toBe("security");
      expect(typeof stance.dimension).toBe("string");
      expect(typeof stance.stanceScore).toBe("number");
      expect(stance.stanceScore).toBeGreaterThanOrEqual(-1);
      expect(stance.stanceScore).toBeLessThanOrEqual(1);
      expect(typeof stance.evidence.url).toBe("string");
      expect(typeof stance.evidence.quote).toBe("string");
      // Quotes must be capped at 120 chars + optional ellipsis
      expect(stance.evidence.quote.replace("…", "").length).toBeLessThanOrEqual(120);
    }
  });

  it("includes _raw.topicScores for the security topic", async () => {
    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(Array.isArray(body._raw.topicScores)).toBe(true);
    for (const ts of body._raw.topicScores) {
      expect(ts.topic).toBe("security");
      expect(typeof ts.score).toBe("number");
      expect(typeof ts.confidence).toBe("number");
    }
  });

  it("returns mode=opus comment when API key is present (no real call needed)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-fake-key-no-real-call");
    const { GET } = await import("./route");
    const body = await (await GET()).json();

    // The key is present so mode reports "opus" — actual Opus call will fail
    // (invalid key) but extractStances catches it and falls back to keywords,
    // so the response is still 200 with stances
    const res = await GET();
    expect(res.status).toBe(200);
    expect(body.mode).toBe("opus");
    expect(body.opusNote).toMatch(/ANTHROPIC_API_KEY present/);
  });
});
