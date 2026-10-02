import { describe, expect, it } from "vitest";

import fixtures from "@/lib/__fixtures__/scorer_parity.json";
import { _scoringInputs, getCandidatesFull, getQuestions, submitQuiz } from "@/lib/api";
import { computeAffinity, pyRound, type Result } from "@/lib/scorer";

interface ParityFixture {
  name: string;
  answers: Record<string, number>;
  expected: Result[];
}

describe("pyRound", () => {
  it("rounds exact ties to even like Python", () => {
    expect(pyRound(0.5)).toBe(0);
    expect(pyRound(1.5)).toBe(2);
    expect(pyRound(2.5)).toBe(2);
    expect(pyRound(0.25, 1)).toBe(0.2);
    expect(pyRound(0.75, 1)).toBe(0.8);
  });

  it("rounds non-ties to nearest", () => {
    expect(pyRound(84.04999, 1)).toBe(84);
    expect(pyRound(83.96, 1)).toBe(84);
    expect(pyRound(57.6)).toBe(58);
  });
});

describe("computeAffinity parity with backend/scorer.py", () => {
  it.each((fixtures as ParityFixture[]).map((f) => [f.name, f] as const))(
    "%s",
    (_name, fixture) => {
      const actual = computeAffinity(fixture.answers, _scoringInputs.candidates, _scoringInputs.questions);
      expect(actual).toEqual(fixture.expected);
    },
  );
});

describe("api", () => {
  it("exposes 25 questions without internal fields", async () => {
    const questions = await getQuestions();
    expect(questions).toHaveLength(25);
    expect(Object.keys(questions[0]).sort()).toEqual(["bucket", "id", "statement", "weight"]);
  });

  it("returns only cited sources with URLs", async () => {
    for (const candidate of await getCandidatesFull()) {
      expect(candidate.sources.every((s) => s.url)).toBe(true);
    }
  });

  it("rejects incomplete or out-of-range answers", async () => {
    await expect(submitQuiz({ q01: 3 })).rejects.toThrow(/Expected 25 answers/);
    const outOfRange = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`q${String(i + 1).padStart(2, "0")}`, 6]));
    await expect(submitQuiz(outOfRange)).rejects.toThrow(/must be an integer/);
  });
});
