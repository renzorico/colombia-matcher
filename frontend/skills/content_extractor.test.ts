import { describe, it, expect } from "vitest";
import { extractContent, cleanText } from "./content_extractor";
import type { Source } from "./source_collector";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const spanishNewsSource: Source = {
  candidateId: "ivan-cepeda",
  type: "news",
  url: "https://example.com/cepeda-salud-reforma-2026-03-18",
  title: "Cepeda defiende la reforma a la salud ante el Congreso",
  snippet:
    "El senador insistió en aprobar la reforma que crearía un sistema mixto " +
    "con EPS bajo estricta vigilancia del Estado.",
  date: "2026-03-18",
  sourceName: "Semana",
  topics: ["health"],
};

const englishInterviewSource: Source = {
  candidateId: "german-vargas-lleras",
  type: "interview",
  url: "https://example.com/vargas-lleras-english-interview",
  title: "Vargas Lleras on fiscal discipline",
  snippet:
    "The candidate outlined a plan to cut public spending and renegotiate " +
    "public works contracts to restore investor confidence.",
  date: "2026-03-21",
  sourceName: "Colombia Reports",
  topics: ["economy", "fiscal"],
};

const minimalSource: Source = {
  candidateId: "test-candidate",
  type: "other",
  url: "https://example.com/minimal",
};

// ---------------------------------------------------------------------------
// cleanText helper
// ---------------------------------------------------------------------------

describe("cleanText", () => {
  it("collapses multiple spaces into one", () => {
    expect(cleanText("hello   world")).toBe("hello world");
  });

  it("strips leading and trailing whitespace", () => {
    expect(cleanText("   trimmed   ")).toBe("trimmed");
  });

  it("joins multi-line text into a single line", () => {
    const input = "line one\n\nline two\n   line three";
    expect(cleanText(input)).toBe("line one line two line three");
  });

  it("returns empty string for blank input", () => {
    expect(cleanText("   \n\n   ")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// extractContent — Spanish source
// ---------------------------------------------------------------------------

describe("extractContent — Spanish news source", () => {
  it("resolves without throwing", async () => {
    await expect(extractContent(spanishNewsSource)).resolves.toBeDefined();
  });

  it("sets language to 'es'", async () => {
    const result = await extractContent(spanishNewsSource);
    expect(result.language).toBe("es");
  });

  it("leaves translatedText undefined (translation deferred)", async () => {
    const result = await extractContent(spanishNewsSource);
    expect(result.translatedText).toBeUndefined();
  });

  it("returns a non-empty rawText and cleanedText", async () => {
    const result = await extractContent(spanishNewsSource);
    expect(result.rawText.length).toBeGreaterThan(0);
    expect(result.cleanedText.length).toBeGreaterThan(0);
  });

  it("cleanedText contains no leading/trailing whitespace", async () => {
    const result = await extractContent(spanishNewsSource);
    expect(result.cleanedText).toBe(result.cleanedText.trim());
  });

  it("echoes back the original source object by reference", async () => {
    const result = await extractContent(spanishNewsSource);
    expect(result.source).toBe(spanishNewsSource);
  });
});

// ---------------------------------------------------------------------------
// extractContent — English source
// ---------------------------------------------------------------------------

describe("extractContent — English interview source", () => {
  it("sets language to 'en'", async () => {
    const result = await extractContent(englishInterviewSource);
    expect(result.language).toBe("en");
  });

  it("leaves translatedText undefined for English sources", async () => {
    const result = await extractContent(englishInterviewSource);
    expect(result.translatedText).toBeUndefined();
  });

  it("still produces non-empty rawText and cleanedText", async () => {
    const result = await extractContent(englishInterviewSource);
    expect(result.rawText.length).toBeGreaterThan(0);
    expect(result.cleanedText.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// extractContent — minimal source (no optional fields)
// ---------------------------------------------------------------------------

describe("extractContent — minimal source", () => {
  it("handles a source with only required fields", async () => {
    const result = await extractContent(minimalSource);
    expect(result.rawText.length).toBeGreaterThan(0);
    expect(result.cleanedText.length).toBeGreaterThan(0);
  });

  it("includes the URL in rawText when no title is provided", async () => {
    const result = await extractContent(minimalSource);
    expect(result.rawText).toContain(minimalSource.url);
  });
});

// ---------------------------------------------------------------------------
// Determinism — same input always produces same output
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("returns identical results for two calls with the same source", async () => {
    const a = await extractContent(spanishNewsSource);
    const b = await extractContent(spanishNewsSource);
    expect(a.rawText).toBe(b.rawText);
    expect(a.cleanedText).toBe(b.cleanedText);
    expect(a.language).toBe(b.language);
    expect(a.translatedText).toBe(b.translatedText);
  });
});
