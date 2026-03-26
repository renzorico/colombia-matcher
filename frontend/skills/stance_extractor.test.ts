import { describe, it, expect } from "vitest";
import { extractStances } from "./stance_extractor";
import type { MicroStance } from "./stance_extractor";
import type { SourceContent } from "./content_extractor";
import type { Source } from "./source_collector";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeContent(
  cleanedText: string,
  overrides: Partial<Source> = {},
): SourceContent {
  const source: Source = {
    candidateId: "test-candidate",
    type: "news",
    url: "https://example.com/article",
    date: "2026-03-20",
    sourceName: "El Tiempo",
    ...overrides,
  };
  return {
    source,
    rawText: cleanedText,
    cleanedText,
    language: "es",
  };
}

// ---------------------------------------------------------------------------
// Returns empty array when no keywords match
// ---------------------------------------------------------------------------

describe("extractStances — no matching keywords", () => {
  it("returns an empty array for unrelated text", async () => {
    const content = makeContent(
      "El candidato habló sobre deportes y cultura popular.",
    );
    const result = await extractStances("test-candidate", ["security", "economy"], content);
    expect(result).toEqual([]);
  });

  it("returns an empty array when the topic is not in the requested list", async () => {
    // cleanedText clearly mentions seguridad but topic not requested
    const content = makeContent(
      "La seguridad ciudadana es una prioridad en su programa.",
    );
    const result = await extractStances("test-candidate", ["health"], content);
    expect(result).toEqual([]);
  });

  it("returns an empty array for empty cleanedText", async () => {
    const content = makeContent("");
    const result = await extractStances("test-candidate", ["security", "economy"], content);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Returns MicroStance for "security" topic
// ---------------------------------------------------------------------------

describe("extractStances — security keyword", () => {
  it("produces a MicroStance when cleanedText mentions 'seguridad'", async () => {
    const content = makeContent(
      "El candidato propone reforzar la seguridad en las ciudades.",
    );
    const result = await extractStances("ivan-cepeda", ["security"], content);
    expect(result).toHaveLength(1);
  });

  it("MicroStance has expected shape and valid fields", async () => {
    const content = makeContent(
      "Habló sobre seguridad pública y la necesidad de más policías.",
    );
    const [stance] = await extractStances("ivan-cepeda", ["security"], content);

    expect(stance.candidateId).toBe("ivan-cepeda");
    expect(stance.topic).toBe("security");
    expect(["policy", "behavior", "alliances", "rhetoric"]).toContain(stance.dimension);
    expect(stance.stanceScore).toBeGreaterThanOrEqual(-1);
    expect(stance.stanceScore).toBeLessThanOrEqual(1);
    expect(stance.stanceLabel.length).toBeGreaterThan(0);
    expect(stance.evidence.url).toBe("https://example.com/article");
    expect(stance.evidence.quote.length).toBeGreaterThan(0);
    expect(stance.evidence.date).toBe("2026-03-20");
    expect(stance.evidence.sourceName).toBe("El Tiempo");
  });

  it("assigns a lower (more negative) score for 'mano dura' than plain 'seguridad'", async () => {
    const hardline = makeContent("El candidato propone mano dura contra los criminales.");
    const moderate = makeContent("La seguridad es un derecho fundamental.");

    const [hardlineStance] = await extractStances("candidate-a", ["security"], hardline);
    const [moderateStance] = await extractStances("candidate-a", ["security"], moderate);

    expect(hardlineStance.stanceScore).toBeLessThan(moderateStance.stanceScore);
  });

  it("prefers 'seguridad humana' rule over plain 'seguridad'", async () => {
    const content = makeContent(
      "Defiende la seguridad humana como enfoque integral.",
    );
    const [stance] = await extractStances("candidate-a", ["security"], content);
    expect(stance.stanceScore).toBeGreaterThan(0);
    expect(stance.stanceLabel).toMatch(/human.security/i);
  });
});

// ---------------------------------------------------------------------------
// Determinism — same input always produces identical output
// ---------------------------------------------------------------------------

describe("extractStances — determinism", () => {
  it("returns identical results for two calls with the same input", async () => {
    const content = makeContent(
      "La seguridad y la economía son los ejes del programa.",
    );
    const topics = ["security", "economy"];

    const first = await extractStances("candidate-x", topics, content);
    const second = await extractStances("candidate-x", topics, content);

    expect(first).toEqual(second);
  });
});

// ---------------------------------------------------------------------------
// Multiple topics in a single SourceContent
// ---------------------------------------------------------------------------

describe("extractStances — multiple topics", () => {
  it("returns one MicroStance per matched topic", async () => {
    const content = makeContent(
      "El programa aborda la seguridad ciudadana, la economía y la corrupción.",
    );
    const result = await extractStances(
      "candidate-y",
      ["security", "economy", "anticorruption"],
      content,
    );

    const topics = result.map((s) => s.topic);
    expect(topics).toContain("security");
    expect(topics).toContain("economy");
    expect(topics).toContain("anticorruption");
    // Each topic appears at most once
    expect(new Set(topics).size).toBe(topics.length);
  });

  it("does not produce duplicate stances for the same topic", async () => {
    // "seguridad humana" and "seguridad" both appear — only first rule should fire
    const content = makeContent(
      "Prefiere la seguridad humana sobre la seguridad militarizada.",
    );
    const result = await extractStances("candidate-z", ["security"], content);
    const securityStances = result.filter((s) => s.topic === "security");
    expect(securityStances).toHaveLength(1);
  });

  it("only returns stances for requested topics even when other keywords appear", async () => {
    const content = makeContent(
      "Habló de seguridad, economía, salud y transparencia.",
    );
    const result = await extractStances("candidate-z", ["health"], content);
    const topics = result.map((s: MicroStance) => s.topic);
    expect(topics).toEqual(["health"]);
  });
});

// ---------------------------------------------------------------------------
// Health topic
// ---------------------------------------------------------------------------

describe("extractStances — health topic", () => {
  it("produces a health stance when 'EPS' is present", async () => {
    const content = makeContent(
      "La reforma crearía un sistema mixto con EPS bajo vigilancia del Estado.",
    );
    const result = await extractStances("candidate-a", ["health"], content);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("health");
  });

  it("produces a health stance when 'hospitales' is present", async () => {
    const content = makeContent(
      "El candidato prometió renovar los hospitales públicos del país.",
    );
    const result = await extractStances("candidate-a", ["health"], content);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("health");
  });

  it("does not produce health stances when health keywords are absent", async () => {
    const content = makeContent(
      "La seguridad y la economía son las prioridades del candidato.",
    );
    const result = await extractStances("candidate-a", ["health"], content);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Environment topic
// ---------------------------------------------------------------------------

describe("extractStances — environment topic", () => {
  it("produces an environment stance when 'deforestación' is present", async () => {
    const content = makeContent(
      "El candidato advirtió sobre la deforestación en la Amazonía colombiana.",
    );
    const result = await extractStances("candidate-a", ["environment"], content);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("environment");
  });

  it("assigns a high positive score for 'transición energética'", async () => {
    const content = makeContent(
      "Propone una transición energética para alejarse del modelo extractivista.",
    );
    const result = await extractStances("candidate-a", ["environment"], content);
    expect(result).toHaveLength(1);
    expect(result[0].stanceScore).toBeGreaterThan(0.5);
  });

  it("does not produce environment stances when environment keywords are absent", async () => {
    const content = makeContent(
      "El candidato debatió sobre seguridad y política fiscal.",
    );
    const result = await extractStances("candidate-a", ["environment"], content);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Evidence fields
// ---------------------------------------------------------------------------

describe("extractStances — evidence fields", () => {
  it("omits date and sourceName from evidence when source lacks them", async () => {
    const content = makeContent("La economía es clave.", {
      date: undefined,
      sourceName: undefined,
    });
    const [stance] = await extractStances("candidate-a", ["economy"], content);
    expect(stance.evidence.date).toBeUndefined();
    expect(stance.evidence.sourceName).toBeUndefined();
  });

  it("quote is a non-empty substring of or derived from cleanedText", async () => {
    const text =
      "El programa de seguridad propone aumentar la presencia policial en zonas rurales.";
    const content = makeContent(text);
    const [stance] = await extractStances("candidate-a", ["security"], content);
    // The quote should include the matched keyword context
    expect(stance.evidence.quote.toLowerCase()).toMatch(/seguridad/);
  });
});
