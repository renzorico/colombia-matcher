/**
 * source_collector_real.test.ts
 *
 * Demonstrates how to test searchRealSources by stubbing the Anthropic client.
 * No real API calls are made — safe for CI with no ANTHROPIC_API_KEY.
 *
 * The stubbed suite is marked `.skip`.  Remove `.skip` and set
 * ANTHROPIC_API_KEY=test-key to run the stub tests in isolation.
 *
 * The gating suite (bottom of file) runs unconditionally and verifies that
 * searchRealSources respects its early-return conditions without needing mocks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal Anthropic messages.create() response carrying a text block. */
function makeTextResponse(text: string) {
  return {
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: 200, output_tokens: 80 },
  };
}

const VALID_SOURCE_JSON = JSON.stringify([
  {
    url: "https://elespectador.com/cepeda-seguridad-2026",
    title: "Cepeda propone enfoque de seguridad humana",
    snippet: "El senador reiteró su propuesta de invertir en comunidades para reducir la violencia estructural.",
    date: "2026-03-20",
    sourceName: "El Espectador",
    type: "news",
    topics: ["security"],
  },
  {
    url: "https://semana.com/cepeda-economia-2026",
    title: "Cepeda y su visión de la economía campesina",
    snippet: "El candidato defiende el modelo de economía popular como motor del desarrollo nacional.",
    date: "2026-03-18",
    sourceName: "Semana",
    type: "interview",
    topics: ["economy"],
  },
]);

// ---------------------------------------------------------------------------
// Stubbed Anthropic client tests (skipped in CI)
// ---------------------------------------------------------------------------

describe.skip("searchRealSources — stubbed Anthropic client", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-stub");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns validated Source[] from a well-formed Claude response", async () => {
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: {
          create: vi.fn().mockResolvedValue(makeTextResponse(VALID_SOURCE_JSON)),
        },
      })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const sources = await searchRealSources("ivan-cepeda", ["security", "economy"], 30);

    expect(sources.length).toBe(2);
    expect(sources[0].url).toBe("https://elespectador.com/cepeda-seguridad-2026");
    expect(sources[0].type).toBe("news");
    expect(sources[0].candidateId).toBe("ivan-cepeda");
    expect(sources[0].topics).toContain("security");
  });

  it("deduplicates sources with the same URL", async () => {
    const dupeJson = JSON.stringify([
      { url: "https://elespectador.com/same", title: "A", snippet: "x", date: null,
        sourceName: "El Espectador", type: "news", topics: ["security"] },
      { url: "https://elespectador.com/same", title: "B", snippet: "y", date: null,
        sourceName: "El Espectador", type: "news", topics: ["economy"] },
    ]);

    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: vi.fn().mockResolvedValue(makeTextResponse(dupeJson)) },
      })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const sources = await searchRealSources("ivan-cepeda", ["security"], 30);
    expect(sources).toHaveLength(1);
  });

  it("drops items with non-HTTP URLs", async () => {
    const badJson = JSON.stringify([
      { url: "ftp://bad.example.com/article", title: "Bad", snippet: "x",
        date: null, sourceName: "Bad", type: "news", topics: ["security"] },
      { url: "https://elespectador.com/good", title: "Good", snippet: "y",
        date: null, sourceName: "El Espectador", type: "news", topics: ["security"] },
    ]);

    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: vi.fn().mockResolvedValue(makeTextResponse(badJson)) },
      })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const sources = await searchRealSources("ivan-cepeda", ["security"], 30);
    expect(sources).toHaveLength(1);
    expect(sources[0].url).toBe("https://elespectador.com/good");
  });

  it("coerces unknown type values to 'news'", async () => {
    const weirdJson = JSON.stringify([
      { url: "https://elespectador.com/article", title: "X", snippet: "y",
        date: null, sourceName: "El Espectador", type: "podcast", topics: ["economy"] },
    ]);

    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: vi.fn().mockResolvedValue(makeTextResponse(weirdJson)) },
      })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const [source] = await searchRealSources("ivan-cepeda", ["economy"], 30);
    expect(source.type).toBe("news");
  });

  it("returns [] and does not throw when Claude returns malformed JSON", async () => {
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: vi.fn().mockResolvedValue(makeTextResponse("not json")) },
      })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const sources = await searchRealSources("ivan-cepeda", ["security"], 30);
    expect(sources).toEqual([]);
  });

  it("returns [] and does not throw when the API call rejects", async () => {
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: vi.fn().mockRejectedValue(new Error("Network error")) },
      })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const sources = await searchRealSources("ivan-cepeda", ["security"], 30);
    expect(sources).toEqual([]);
  });

  it("handles pause_turn by re-sending and returning the final response", async () => {
    const pauseResponse = {
      content: [{ type: "text", text: "Searching…" }],
      stop_reason: "pause_turn",
    };
    const finalResponse = makeTextResponse(VALID_SOURCE_JSON);

    const create = vi.fn()
      .mockResolvedValueOnce(pauseResponse)
      .mockResolvedValueOnce(finalResponse);

    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({ messages: { create } })),
    }));

    const { searchRealSources } = await import("./source_collector");
    const sources = await searchRealSources("ivan-cepeda", ["security", "economy"], 30);

    expect(create).toHaveBeenCalledTimes(2);
    expect(sources.length).toBe(2);
  });

  it("collectSources returns real sources when searchRealSources is non-empty", async () => {
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: vi.fn().mockResolvedValue(makeTextResponse(VALID_SOURCE_JSON)) },
      })),
    }));

    const { collectSources } = await import("./source_collector");
    const sources = await collectSources("ivan-cepeda", ["security"], 30);

    // Real sources have non-example.com hostnames
    expect(sources.every((s) => !s.url.includes("example.com"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Gating tests — run unconditionally, no API key needed
// ---------------------------------------------------------------------------

describe("searchRealSources — early-return gating", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns [] when ANTHROPIC_API_KEY is absent", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { searchRealSources } = await import("./source_collector");
    const result = await searchRealSources("ivan-cepeda", ["security"], 30);
    expect(result).toEqual([]);
  });

  it("returns [] for a candidate other than ivan-cepeda even with a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-fake");
    const { searchRealSources } = await import("./source_collector");
    // This would hit the API for ivan-cepeda but must bail out immediately for others
    const result = await searchRealSources("german-vargas-lleras", ["security"], 30);
    expect(result).toEqual([]);
  });

  it("collectSources falls back to mock when searchRealSources returns []", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { collectSources } = await import("./source_collector");
    const sources = await collectSources("ivan-cepeda", ["economy"]);
    // Mock path: all URLs are example.com
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s.url.includes("example.com"))).toBe(true);
  });
});
