import { describe, it, expect } from "vitest";
import { collectSources } from "./source_collector";

describe("collectSources", () => {
  // -------------------------------------------------------------------------
  // Basic retrieval
  // -------------------------------------------------------------------------

  it("returns sources for a known candidateId", async () => {
    const sources = await collectSources("ivan-cepeda");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.candidateId === "ivan-cepeda")).toBe(true);
  });

  it("returns an empty array for an unknown candidateId", async () => {
    const sources = await collectSources("candidato-inexistente");
    expect(sources).toEqual([]);
  });

  it("returns sources of multiple types (speech, news, social, scandal, program)", async () => {
    const sources = await collectSources("ivan-cepeda");
    const types = new Set(sources.map((s) => s.type));
    expect(types.has("speech")).toBe(true);
    expect(types.has("news")).toBe(true);
    expect(types.has("social")).toBe(true);
    expect(types.has("scandal")).toBe(true);
    expect(types.has("program")).toBe(true);
  });

  it("does not mutate the internal fixture when caller modifies the result", async () => {
    const first = await collectSources("ivan-cepeda");
    first.push({
      candidateId: "ivan-cepeda",
      type: "other",
      url: "https://example.com/injected",
    });
    const second = await collectSources("ivan-cepeda");
    expect(second.some((s) => s.url === "https://example.com/injected")).toBe(
      false,
    );
  });

  // -------------------------------------------------------------------------
  // timeWindowDays filtering
  // -------------------------------------------------------------------------

  it("returns all sources when timeWindowDays is large enough to include all", async () => {
    // 3650 days ≈ 10 years — should include every fixture entry
    const all = await collectSources("ivan-cepeda");
    const windowed = await collectSources("ivan-cepeda", undefined, 3650);
    expect(windowed.length).toBe(all.length);
  });

  it("filters out old sources when timeWindowDays is small", async () => {
    // The fixture for ivan-cepeda has entries dated 2026-01-15 and 2026-02-10
    // which are > 30 days before 2026-03-25.  A 14-day window should exclude
    // them (and any other source dated before ~2026-03-11).
    const windowed = await collectSources("ivan-cepeda", undefined, 14);
    const allForCandidate = await collectSources("ivan-cepeda");

    // At least one source should have been filtered out
    expect(windowed.length).toBeLessThan(allForCandidate.length);

    // Every returned source must be within the 14-day window
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    windowed.forEach((s) => {
      if (s.date) {
        expect(new Date(s.date) >= cutoff).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Topic filtering
  // -------------------------------------------------------------------------

  it("returns only sources matching the requested topics", async () => {
    const sources = await collectSources("ivan-cepeda", ["health"]);
    expect(sources.length).toBeGreaterThan(0);
    sources.forEach((s) => {
      expect(s.topics).toBeDefined();
      expect(s.topics!.includes("health")).toBe(true);
    });
  });

  it("returns empty array when no source matches the requested topic", async () => {
    const sources = await collectSources(
      "ivan-cepeda",
      ["nonexistent-topic-xyz"],
    );
    expect(sources).toEqual([]);
  });

  it("returns sources for german-vargas-lleras", async () => {
    const sources = await collectSources("german-vargas-lleras");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.candidateId === "german-vargas-lleras")).toBe(true);
  });

  it("returns security and economy sources for german-vargas-lleras", async () => {
    const sources = await collectSources("german-vargas-lleras", ["security", "economy"]);
    expect(sources.length).toBeGreaterThan(0);
    sources.forEach((s) => {
      expect(
        s.topics?.includes("security") || s.topics?.includes("economy"),
      ).toBe(true);
    });
  });

  it("combines topic and timeWindowDays filters", async () => {
    // economy sources exist for german-vargas-lleras; scandal is old (2026-02)
    const sources = await collectSources(
      "german-vargas-lleras",
      ["economy"],
      30,
    );
    sources.forEach((s) => {
      expect(s.topics!.includes("economy")).toBe(true);
      if (s.date) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        expect(new Date(s.date) >= cutoff).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // New candidates (4 additions)
  // -------------------------------------------------------------------------

  it("returns sources for abelardo-de-la-espriella", async () => {
    const sources = await collectSources("abelardo-de-la-espriella");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.candidateId === "abelardo-de-la-espriella")).toBe(true);
  });

  it("abelardo-de-la-espriella covers security, economy, and anticorruption topics", async () => {
    const sources = await collectSources("abelardo-de-la-espriella");
    const covered = new Set(sources.flatMap((s) => s.topics ?? []));
    expect(covered.has("security")).toBe(true);
    expect(covered.has("economy")).toBe(true);
    expect(covered.has("anticorruption")).toBe(true);
  });

  it("returns sources for paloma-valencia", async () => {
    const sources = await collectSources("paloma-valencia");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.candidateId === "paloma-valencia")).toBe(true);
  });

  it("paloma-valencia covers security, fiscal, and anticorruption topics", async () => {
    const sources = await collectSources("paloma-valencia");
    const covered = new Set(sources.flatMap((s) => s.topics ?? []));
    expect(covered.has("security")).toBe(true);
    expect(covered.has("fiscal")).toBe(true);
    expect(covered.has("anticorruption")).toBe(true);
  });

  it("returns sources for sergio-fajardo", async () => {
    const sources = await collectSources("sergio-fajardo");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.candidateId === "sergio-fajardo")).toBe(true);
  });

  it("sergio-fajardo covers anticorruption, environment, and security topics", async () => {
    const sources = await collectSources("sergio-fajardo");
    const covered = new Set(sources.flatMap((s) => s.topics ?? []));
    expect(covered.has("anticorruption")).toBe(true);
    expect(covered.has("environment")).toBe(true);
    expect(covered.has("security")).toBe(true);
  });

  it("returns sources for claudia-lopez", async () => {
    const sources = await collectSources("claudia-lopez");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.candidateId === "claudia-lopez")).toBe(true);
  });

  it("claudia-lopez covers anticorruption, security, and health topics", async () => {
    const sources = await collectSources("claudia-lopez");
    const covered = new Set(sources.flatMap((s) => s.topics ?? []));
    expect(covered.has("anticorruption")).toBe(true);
    expect(covered.has("security")).toBe(true);
    expect(covered.has("health")).toBe(true);
  });
});
