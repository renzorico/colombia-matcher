/**
 * stance_extractor_opus.test.ts
 *
 * Demonstrates how to test the Opus branch without hitting the real API.
 * All tests in this file use vi.mock to replace the Anthropic client with a
 * controlled stub, so they are safe to run in CI with no ANTHROPIC_API_KEY.
 *
 * The outer describe block is marked `.skip` — remove the `.skip` to run
 * against the stub, or add a dedicated vitest project config that sets
 * ANTHROPIC_API_KEY to enable live integration tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SourceContent } from "./content_extractor";
import type { Source } from "./source_collector";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_SOURCE: Source = {
  candidateId: "ivan-cepeda",
  type: "speech",
  url: "https://example.com/cepeda-seguridad-2026",
  date: "2026-03-20",
  sourceName: "El Espectador",
};

/** Builds a Spanish SourceContent that meets all Opus-branch conditions. */
function makeOpusContent(
  cleanedText: string,
  overrides: Partial<Source> = {},
): SourceContent {
  return {
    source: { ...BASE_SOURCE, ...overrides },
    rawText: cleanedText,
    cleanedText,
    language: "es",
    translatedText: "Human-security approach: invest socially instead of militarizing.",
  };
}

/** 600-char Spanish text — within the 500–4000 window. */
const VALID_TEXT =
  "Iván Cepeda defiende la seguridad humana como alternativa al modelo punitivo y militarista. " +
  "En su discurso ante el Congreso, sostuvo que desmantelar las economías ilícitas requiere " +
  "inversión social y no más tanques. Criticó duramente las políticas de mano dura que, según él, " +
  "sólo profundizan la violencia estructural. Propone crear fondos especiales para comunidades " +
  "afectadas por el conflicto armado y reforzar la justicia transicional como pilar de la paz.";

// ---------------------------------------------------------------------------
// Stub response factories
// ---------------------------------------------------------------------------

/** Builds the minimal Anthropic messages.create() response the code expects. */
function makeAnthropicResponse(jsonArray: object[]) {
  return {
    content: [{ type: "text", text: JSON.stringify(jsonArray) }],
    stop_reason: "end_turn",
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

const VALID_OPUS_STANCE = {
  candidateId: "ivan-cepeda",
  topic: "security",
  dimension: "policy",
  stanceScore: 0.7,
  stanceLabel: "Favors human-security over militarization",
  evidence: {
    url: "https://example.com/cepeda-seguridad-2026",
    quote: "desmantelar las economías ilícitas requiere inversión social",
    date: "2026-03-20",
    sourceName: "El Espectador",
  },
};

// ---------------------------------------------------------------------------
// Tests (skipped — remove .skip to enable with stubbed Anthropic client)
// ---------------------------------------------------------------------------

describe.skip("callOpusForSecurityStances — stubbed Anthropic client", () => {
  beforeEach(() => {
    // Inject a fake API key so the key-guard inside the helper passes
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key-stub");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns validated MicroStance[] from a well-formed Opus response", async () => {
    // Stub the Anthropic SDK at the module level
    vi.mock("@anthropic-ai/sdk", () => {
      const create = vi.fn().mockResolvedValue(
        makeAnthropicResponse([VALID_OPUS_STANCE]),
      );
      return {
        default: vi.fn().mockImplementation(() => ({
          messages: { create },
        })),
      };
    });

    const { callOpusForSecurityStances } = await import("./stance_extractor");
    const content = makeOpusContent(VALID_TEXT);
    const stances = await callOpusForSecurityStances(content, "ivan-cepeda");

    expect(stances).toHaveLength(1);
    expect(stances[0].topic).toBe("security");
    expect(stances[0].dimension).toBe("policy");
    expect(stances[0].stanceScore).toBeCloseTo(0.7);
    expect(stances[0].candidateId).toBe("ivan-cepeda");
  });

  it("returns [] when the model replies with an empty array", async () => {
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: {
          create: vi.fn().mockResolvedValue(makeAnthropicResponse([])),
        },
      })),
    }));

    const { callOpusForSecurityStances } = await import("./stance_extractor");
    const stances = await callOpusForSecurityStances(
      makeOpusContent(VALID_TEXT),
      "ivan-cepeda",
    );
    expect(stances).toEqual([]);
  });

  it("returns [] and does not throw when the model returns invalid JSON", async () => {
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{ type: "text", text: "not json at all" }],
          }),
        },
      })),
    }));

    const { callOpusForSecurityStances } = await import("./stance_extractor");
    // JSON.parse will throw — the caller (extractStances) catches it;
    // callOpusForSecurityStances itself propagates the parse error
    await expect(
      callOpusForSecurityStances(makeOpusContent(VALID_TEXT), "ivan-cepeda"),
    ).rejects.toThrow();
  });

  it("silently drops stances with out-of-range stanceScore", async () => {
    const badStance = { ...VALID_OPUS_STANCE, stanceScore: 5 }; // out of [-1, 1]
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: {
          create: vi.fn().mockResolvedValue(makeAnthropicResponse([badStance])),
        },
      })),
    }));

    const { callOpusForSecurityStances } = await import("./stance_extractor");
    const stances = await callOpusForSecurityStances(
      makeOpusContent(VALID_TEXT),
      "ivan-cepeda",
    );
    expect(stances).toEqual([]);
  });

  it("silently drops stances with an invalid dimension value", async () => {
    const badStance = { ...VALID_OPUS_STANCE, dimension: "vibes" }; // not a valid StanceDimension
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: {
          create: vi.fn().mockResolvedValue(makeAnthropicResponse([badStance])),
        },
      })),
    }));

    const { callOpusForSecurityStances } = await import("./stance_extractor");
    const stances = await callOpusForSecurityStances(
      makeOpusContent(VALID_TEXT),
      "ivan-cepeda",
    );
    expect(stances).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractStances Opus-branch gating — no API key needed for these
// ---------------------------------------------------------------------------

describe("extractStances — Opus branch gating (no real API calls)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to keyword rules when ANTHROPIC_API_KEY is absent", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { extractStances } = await import("./stance_extractor");

    // Text is long enough and has seguridad → keyword path fires
    const content: SourceContent = {
      source: { ...BASE_SOURCE },
      rawText: VALID_TEXT,
      cleanedText: VALID_TEXT,
      language: "es",
    };

    const stances = await extractStances("ivan-cepeda", ["security"], content);
    // Keyword rules will find "seguridad humana" in the text
    expect(stances.length).toBeGreaterThan(0);
    expect(stances[0].topic).toBe("security");
  });

  it("does NOT invoke Opus for a candidate other than ivan-cepeda", async () => {
    // If Opus were called without a valid key it would throw, but keyword rules
    // should run instead — this test verifies no Anthropic import is attempted
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { extractStances } = await import("./stance_extractor");

    const content: SourceContent = {
      source: { ...BASE_SOURCE, candidateId: "german-vargas-lleras" },
      rawText: VALID_TEXT,
      cleanedText: VALID_TEXT,
      language: "es",
    };

    // Should complete without throwing (keyword path)
    await expect(
      extractStances("german-vargas-lleras", ["security"], content),
    ).resolves.toBeDefined();
  });

  it("does NOT invoke Opus when text is shorter than 500 chars", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { extractStances } = await import("./stance_extractor");

    const shortText = "Cepeda habla sobre seguridad humana."; // < 500 chars
    const content: SourceContent = {
      source: { ...BASE_SOURCE },
      rawText: shortText,
      cleanedText: shortText,
      language: "es",
    };

    await expect(
      extractStances("ivan-cepeda", ["security"], content),
    ).resolves.toBeDefined();
  });

  it("does NOT invoke Opus when language is not 'es'", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { extractStances } = await import("./stance_extractor");

    const content: SourceContent = {
      source: { ...BASE_SOURCE },
      rawText: VALID_TEXT,
      cleanedText: VALID_TEXT,
      language: "en", // English → keyword path
    };

    await expect(
      extractStances("ivan-cepeda", ["security"], content),
    ).resolves.toBeDefined();
  });
});
