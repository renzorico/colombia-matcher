import { describe, expect, it } from "vitest";

import {
  ABROAD,
  DOMESTIC_REGIONS,
  HEADLINE,
  REGIONS,
  ROUND2,
  marginBinIndex,
  marginColor,
} from "@/lib/election";

describe("election results data", () => {
  it("covers 32 departments, Bogotá and votes abroad", () => {
    expect(REGIONS).toHaveLength(34);
    expect(DOMESTIC_REGIONS).toHaveLength(33);
    expect(ABROAD?.abroad).toBe(true);
  });

  it("gives every domestic region a map key", () => {
    expect(DOMESTIC_REGIONS.every((r) => r.geoName)).toBe(true);
  });

  it("region totals stay within 0.01% of the national result", () => {
    const [winner, runnerUp] = ROUND2.candidates;
    const espriella = REGIONS.reduce((sum, r) => sum + r.espriella.votes, 0);
    const cepeda = REGIONS.reduce((sum, r) => sum + r.cepeda.votes, 0);
    expect(Math.abs(espriella - winner.votes) / winner.votes).toBeLessThan(0.0001);
    expect(Math.abs(cepeda - runnerUp.votes) / runnerUp.votes).toBeLessThan(0.0001);
  });

  it("derives the headline figures", () => {
    expect(HEADLINE.marginVotes).toBe(251_854);
    expect(HEADLINE.regionsWonByWinner + HEADLINE.regionsWonByRunnerUp).toBe(33);
    expect(HEADLINE.abroadNetVotes).toBeGreaterThan(HEADLINE.domesticNetVotes);
  });
});

describe("margin colour bins", () => {
  it("bins by absolute margin", () => {
    expect(marginBinIndex(0)).toBe(0);
    expect(marginBinIndex(-4.9)).toBe(0);
    expect(marginBinIndex(5)).toBe(1);
    expect(marginBinIndex(-29.9)).toBe(2);
    expect(marginBinIndex(63.6)).toBe(3);
  });

  it("uses a different hue per winner", () => {
    expect(marginColor(10)).not.toBe(marginColor(-10));
  });
});
