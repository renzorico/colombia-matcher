/**
 * source_collector — SourceCollector skill.
 *
 * DEFAULT BEHAVIOUR (all candidates):
 *   Returns hard-coded FAKE_SOURCES fixtures — no external calls, fully
 *   deterministic, safe for tests.
 *
 * REAL WEB SEARCH (ivan-cepeda only, experimental):
 *   When ANTHROPIC_API_KEY is present and candidateId === "ivan-cepeda",
 *   searchRealSources() calls Claude with the web_search tool to find 3–5
 *   recent Spanish-language sources per topic.  collectSources() uses those
 *   results and skips the mock entirely.  Falls back to mock on any error or
 *   missing key.
 *
 *   This scope is intentionally narrow — one candidate — to keep API spend
 *   predictable while the real pipeline is validated.
 */

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The kind of evidence a source represents. */
export type SourceType =
  | "speech"
  | "interview"
  | "news"
  | "opinion"
  | "social"
  | "scandal"
  | "program"
  | "other";

/**
 * A single piece of evidence about a candidate's position, behaviour, or
 * background.
 */
export interface Source {
  /** Matches the candidate identifier used across the pipeline. */
  candidateId: string;
  type: SourceType;
  /** Canonical URL for the original document. */
  url: string;
  title?: string;
  /** Short excerpt or summary (≤ 300 chars) relevant to the topic. */
  snippet?: string;
  /** ISO 8601 date (YYYY-MM-DD) when the source was published. */
  date?: string;
  /** Media outlet, platform, or institution that published the content. */
  sourceName?: string;
  /**
   * Normalised topic tags used for filtering (e.g. "economy", "security").
   * Optional — real HTTP sources may derive these via extraction.
   */
  topics?: string[];
}

// ---------------------------------------------------------------------------
// Fake fixture data
// ---------------------------------------------------------------------------

/**
 * Hard-coded sources keyed by candidateId.
 * Dates are relative to the project reference date (2026-03-25) so that
 * time-window filtering tests remain deterministic regardless of when they run.
 *
 * Mix of recent items (< 14 days old) and older items (> 30 days old) so that
 * tests can exercise the timeWindowDays filter.
 */
const FAKE_SOURCES: Record<string, Source[]> = {
  "ivan-cepeda": [
    {
      candidateId: "ivan-cepeda",
      type: "speech",
      url: "https://example.com/ivan-cepeda-discurso-economia-2026-03-20",
      title: "Cepeda propone 'revolución agraria' como motor económico",
      snippet:
        "En un acto en el Quindío, Cepeda reiteró su propuesta de convertir la " +
        "economía campesina en el eje del desarrollo nacional con fuerte rectoría estatal.",
      date: "2026-03-20",
      sourceName: "El Espectador",
      topics: ["economy"],
    },
    {
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
    },
    {
      candidateId: "ivan-cepeda",
      type: "social",
      url: "https://x.com/ivancepedacastro/status/1234567890",
      title: "Tweet: seguridad humana vs seguridad militarista",
      snippet:
        "La seguridad no se logra con más tanques sino desmontando las economías " +
        "ilícitas mediante inversión social.",
      date: "2026-03-22",
      sourceName: "X (Twitter)",
      topics: ["security"],
    },
    {
      candidateId: "ivan-cepeda",
      type: "program",
      url: "https://example.com/cepeda-programa-gobierno-2026",
      title: "Programa de gobierno — Iván Cepeda 2026",
      snippet:
        "Documento oficial de 80 páginas con propuestas en economía, seguridad, " +
        "salud, ambiente y política exterior.",
      date: "2026-02-10",
      sourceName: "Sitio oficial candidato",
      topics: ["economy", "security", "health", "environment"],
    },
    {
      candidateId: "ivan-cepeda",
      type: "scandal",
      url: "https://example.com/cepeda-investigacion-congreso-2026-01-15",
      title: "Investigación disciplinaria archivada contra Cepeda",
      snippet:
        "La Procuraduría archivó la investigación en su contra por presuntos " +
        "vínculos con grupos al margen de la ley.",
      date: "2026-01-15",
      sourceName: "El Tiempo",
      topics: ["anticorruption"],
    },
  ],

  "german-vargas-lleras": [
    {
      candidateId: "german-vargas-lleras",
      type: "interview",
      url: "https://example.com/vargas-lleras-economia-entrevista-2026-03-21",
      title: "Vargas Lleras: 'El país necesita disciplina fiscal ya'",
      snippet:
        "En entrevista con La FM, el candidato defendió recortes al gasto público y " +
        "renegociación de contratos de obra pública. Insistió en que la disciplina fiscal " +
        "es clave para estabilizar la economía colombiana y recuperar la confianza inversionista.",
      date: "2026-03-21",
      sourceName: "La FM",
      topics: ["economy", "fiscal"],
    },
    {
      candidateId: "german-vargas-lleras",
      type: "news",
      url: "https://example.com/vargas-lleras-seguridad-policiva-2026-03-10",
      title: "Vargas Lleras promete doblar pie de fuerza en ciudades",
      snippet:
        "El ex-vicepresidente anunció aumentar el número de policías en Bogotá, Medellín y " +
        "Cali, y aplicar mano dura contra el crimen organizado como medida central de " +
        "seguridad ciudadana y convivencia.",
      date: "2026-03-10",
      sourceName: "Caracol Radio",
      topics: ["security"],
    },
    {
      candidateId: "german-vargas-lleras",
      type: "program",
      url: "https://example.com/vargas-lleras-programa-2026",
      title: "Plan de gobierno — Germán Vargas Lleras",
      snippet:
        "Énfasis en infraestructura, seguridad y austeridad fiscal. Propone reversión " +
        "de reformas pensional y laboral del gobierno Petro. La economía crecerá con " +
        "menos gasto público y más inversión privada.",
      date: "2026-02-01",
      sourceName: "Sitio oficial candidato",
      topics: ["economy", "security", "fiscal"],
    },
    {
      candidateId: "german-vargas-lleras",
      type: "scandal",
      url: "https://example.com/vargas-lleras-carrusel-contratacion-2026-02-15",
      title: "Señalamientos por contratos en Cambio Radical",
      snippet:
        "Entes de control investigan presuntas irregularidades en contratos firmados " +
        "durante la alcaldía de un aliado político. Los señalamientos apuntan a " +
        "corrupción en la contratación estatal y falta de transparencia.",
      date: "2026-02-15",
      sourceName: "Infobae Colombia",
      topics: ["anticorruption"],
    },
  ],

  "abelardo-de-la-espriella": [
    {
      candidateId: "abelardo-de-la-espriella",
      type: "speech",
      url: "https://www.elespectador.com/politica/abelardo-espriella-seguridad-orden-publico-2026-03-18",
      title: "De la Espriella: 'Colombia necesita mano dura para recuperar la paz'",
      snippet:
        "En un mitin en Montería, el candidato conservador Abelardo de la Espriella " +
        "prometió una política de seguridad basada en mano dura contra grupos armados, " +
        "restauración del orden público y apoyo total a las Fuerzas Militares para " +
        "recuperar territorios controlados por el crimen organizado y las disidencias.",
      date: "2026-03-18",
      sourceName: "El Espectador",
      topics: ["security"],
    },
    {
      candidateId: "abelardo-de-la-espriella",
      type: "interview",
      url: "https://www.semana.com/nacion/articulo/espriella-economia-libre-mercado-empresas-2026-03-12",
      title: "Espriella defiende el libre mercado y la reducción de impuestos",
      snippet:
        "El abogado y político cordobés aseguró en Semana que el camino para reactivar " +
        "la economía colombiana es reducir los impuestos a las empresas, eliminar trabas " +
        "regulatorias y atraer inversión extranjera directa. Rechazó las reformas " +
        "tributarias del gobierno Petro como 'un freno al crecimiento'.",
      date: "2026-03-12",
      sourceName: "Semana",
      topics: ["economy"],
    },
    {
      candidateId: "abelardo-de-la-espriella",
      type: "news",
      url: "https://www.eltiempo.com/politica/espriella-corrupcion-contratos-costa-2026-02-28",
      title: "Cuestionan a De la Espriella por contratos en la Costa Atlántica",
      snippet:
        "Medios de la región señalaron presuntos nexos del candidato con redes de " +
        "corrupción en la contratación pública en Córdoba y Sucre. El candidato negó " +
        "los señalamientos y exigió transparencia en las investigaciones. Su círculo " +
        "cercano rechazó las acusaciones como ataques políticos.",
      date: "2026-02-28",
      sourceName: "El Tiempo",
      topics: ["anticorruption"],
    },
    {
      candidateId: "abelardo-de-la-espriella",
      type: "program",
      url: "https://www.lasillavacia.com/silla-nacional/programa-gobierno-espriella-2026-fiscal",
      title: "Programa de gobierno: austeridad y disciplina fiscal",
      snippet:
        "El documento programático de De la Espriella propone austeridad en el gasto " +
        "público, reducción del déficit fiscal heredado del gobierno Petro y congelación " +
        "de nuevas reformas pensional y laboral. La disciplina fiscal es presentada como " +
        "condición sine qua non para la estabilidad macroeconómica.",
      date: "2026-02-10",
      sourceName: "La Silla Vacía",
      topics: ["fiscal", "economy"],
    },
    {
      candidateId: "abelardo-de-la-espriella",
      type: "opinion",
      url: "https://www.elespectador.com/opinion/espriella-salud-privada-eficiencia-2026-03-05",
      title: "De la Espriella propone fortalecer la salud privada y las EPS",
      snippet:
        "En columna de opinión, el candidato argumentó que la crisis de salud en " +
        "Colombia se resuelve fortaleciendo las EPS y el sector privado, no " +
        "liquidándolas. Prometió derogar la reforma a la salud del gobierno Petro " +
        "y restituir el papel rector de las aseguradoras privadas en el sistema.",
      date: "2026-03-05",
      sourceName: "El Espectador",
      topics: ["health"],
    },
  ],

  "paloma-valencia": [
    {
      candidateId: "paloma-valencia",
      type: "speech",
      url: "https://www.semana.com/nacion/articulo/paloma-valencia-seguridad-centro-democratico-2026-03-20",
      title: "Paloma Valencia: 'La seguridad ciudadana es la primera libertad'",
      snippet:
        "La senadora del Centro Democrático presentó su plan de seguridad en Cali, " +
        "insistiendo en la necesidad de militarizar las zonas de mayor violencia, " +
        "extraditar a los líderes del crimen organizado y aplicar mano dura sin " +
        "contemplaciones. Criticó los diálogos de paz del gobierno Petro con grupos armados.",
      date: "2026-03-20",
      sourceName: "Semana",
      topics: ["security"],
    },
    {
      candidateId: "paloma-valencia",
      type: "interview",
      url: "https://www.eltiempo.com/politica/paloma-valencia-disciplina-fiscal-austeridad-2026-03-14",
      title: "Valencia: 'Colombia no puede seguir viviendo por encima de sus posibilidades'",
      snippet:
        "En entrevista con El Tiempo, la candidata del Centro Democrático subrayó la " +
        "urgencia de aplicar disciplina fiscal estricta, reducir el gasto público " +
        "corriente y eliminar el déficit heredado. Propuso congelar la planta " +
        "burocrática y revisar todos los contratos del Estado para combatir el despilfarro.",
      date: "2026-03-14",
      sourceName: "El Tiempo",
      topics: ["fiscal", "economy"],
    },
    {
      candidateId: "paloma-valencia",
      type: "news",
      url: "https://www.lasillavacia.com/silla-nacional/paloma-valencia-impuestos-empresa-2026-03-08",
      title: "Valencia promete revertir la reforma tributaria de Petro",
      snippet:
        "La senadora y candidata presidencial anunció que su primer acto de gobierno " +
        "sería revocar la reforma tributaria que elevó los impuestos a las empresas " +
        "y los dividendos. Argumentó que esa reforma ha frenado la inversión y la " +
        "generación de empleo, hundiendo la economía en una recesión sin precedentes.",
      date: "2026-03-08",
      sourceName: "La Silla Vacía",
      topics: ["economy"],
    },
    {
      candidateId: "paloma-valencia",
      type: "program",
      url: "https://www.caracol.com.co/noticias/politica/programa-paloma-valencia-anticorrupcion-2026",
      title: "Plan anticorrupción de Paloma Valencia: transparencia y rendición de cuentas",
      snippet:
        "El programa de Valencia dedica un capítulo entero a la lucha contra la " +
        "corrupción: digitalización de la contratación pública para garantizar " +
        "transparencia, fortalecimiento de los entes de control independientes y " +
        "penas más severas para funcionarios corruptos. Cita la corrupción como el " +
        "principal lastre del desarrollo colombiano.",
      date: "2026-02-20",
      sourceName: "Caracol Radio",
      topics: ["anticorruption"],
    },
    {
      candidateId: "paloma-valencia",
      type: "social",
      url: "https://x.com/PalomaValenciaL/status/1776543210987654321",
      title: "Tweet: reforma pensional y déficit fiscal",
      snippet:
        "La reforma pensional del gobierno Petro es una bomba de tiempo para las " +
        "finanzas públicas. Vamos a generar un déficit insostenible que pagarán " +
        "nuestros hijos. Necesitamos responsabilidad fiscal, no populismo.",
      date: "2026-03-22",
      sourceName: "X (Twitter)",
      topics: ["fiscal"],
    },
  ],

  "sergio-fajardo": [
    {
      candidateId: "sergio-fajardo",
      type: "speech",
      url: "https://www.elespectador.com/politica/sergio-fajardo-educacion-transformacion-social-2026-03-19",
      title: "Fajardo: 'La educación es la apuesta más rentable que puede hacer Colombia'",
      snippet:
        "El ex gobernador de Antioquia y ex alcalde de Medellín insistió en que la " +
        "clave del desarrollo colombiano es la educación de calidad desde la primera " +
        "infancia. Prometió duplicar la inversión en colegios públicos, salud escolar " +
        "y acceso a internet en zonas rurales como base de su gobierno.",
      date: "2026-03-19",
      sourceName: "El Espectador",
      topics: ["health", "economy"],
    },
    {
      candidateId: "sergio-fajardo",
      type: "interview",
      url: "https://www.semana.com/nacion/articulo/fajardo-anticorrupcion-independencia-politica-2026-03-13",
      title: "Fajardo: 'La corrupción es el mayor obstáculo para el desarrollo de Colombia'",
      snippet:
        "En entrevista con Semana, Sergio Fajardo reiteró que la corrupción en la " +
        "contratación pública es la principal causa del atraso colombiano. Propuso " +
        "transparencia radical en el gasto del Estado, digitalización de procesos " +
        "licitatorios y una comisión anticorrupción con autonomía total del ejecutivo.",
      date: "2026-03-13",
      sourceName: "Semana",
      topics: ["anticorruption"],
    },
    {
      candidateId: "sergio-fajardo",
      type: "news",
      url: "https://www.lasillavacia.com/silla-nacional/fajardo-medio-ambiente-ciudades-sostenibles-2026-03-06",
      title: "Fajardo propone ciudades sostenibles y protección del medio ambiente",
      snippet:
        "El candidato independiente presentó su agenda ambiental en Bogotá: proteger " +
        "el medio ambiente como un derecho fundamental, detener la deforestación en " +
        "la Amazonia, prohibir el fracking y avanzar en la transición energética " +
        "hacia fuentes renovables para reducir la dependencia del petróleo.",
      date: "2026-03-06",
      sourceName: "La Silla Vacía",
      topics: ["environment"],
    },
    {
      candidateId: "sergio-fajardo",
      type: "program",
      url: "https://www.eltiempo.com/politica/programa-fajardo-economia-emprendimiento-2026",
      title: "Programa Fajardo: economía del conocimiento y emprendimiento",
      snippet:
        "El documento de Fajardo apuesta por una economía basada en el conocimiento, " +
        "la innovación y el emprendimiento, con un Estado que acompaña sin ahogar " +
        "al sector privado. Propone reforma tributaria progresiva para financiar " +
        "educación y salud sin incrementar los impuestos a la clase media.",
      date: "2026-02-15",
      sourceName: "El Tiempo",
      topics: ["economy", "fiscal"],
    },
    {
      candidateId: "sergio-fajardo",
      type: "opinion",
      url: "https://www.elespectador.com/opinion/fajardo-seguridad-convivencia-urbanismo-social-2026-03-01",
      title: "Fajardo: seguridad con urbanismo social, no con militarización",
      snippet:
        "En columna, Fajardo argumentó que el modelo de seguridad que transformó " +
        "Medellín no fue la mano dura sino el urbanismo social, la inversión en " +
        "comunidades vulnerables y la recuperación del espacio público. Propuso " +
        "replicar ese modelo en las ciudades más violentas del país.",
      date: "2026-03-01",
      sourceName: "El Espectador",
      topics: ["security"],
    },
  ],

  "claudia-lopez": [
    {
      candidateId: "claudia-lopez",
      type: "speech",
      url: "https://www.elespectador.com/politica/claudia-lopez-candidatura-consulta-soluciones-2026-03-10",
      title: "Claudia López gana la Consulta de las Soluciones y lanza su candidatura presidencial",
      snippet:
        "Tras imponerse en la Consulta de las Soluciones el 8 de marzo, Claudia López " +
        "celebró su triunfo con un discurso de unidad: 'Vamos a gobernar con " +
        "transparencia, con anticorrupción y con la gente'. Prometió una presidencia " +
        "enfocada en seguridad ciudadana sin mano dura, educación de calidad y " +
        "superación de la pobreza urbana en las grandes ciudades.",
      date: "2026-03-10",
      sourceName: "El Espectador",
      topics: ["anticorruption", "security"],
    },
    {
      candidateId: "claudia-lopez",
      type: "interview",
      url: "https://www.semana.com/nacion/articulo/claudia-lopez-economia-gobernanza-bogota-2026-03-17",
      title: "López: 'La experiencia de Bogotá demuestra que se puede gobernar bien sin corrupción'",
      snippet:
        "En entrevista con Semana, la ex alcaldesa argumentó que su gestión en Bogotá " +
        "probó que es posible administrar la economía pública con transparencia y " +
        "resultados. Propuso replicar el modelo de Bogotá a nivel nacional: contratos " +
        "digitales, veedurías ciudadanas y reducción del gasto burocrático para " +
        "invertir más en salud y educación.",
      date: "2026-03-17",
      sourceName: "Semana",
      topics: ["anticorruption", "economy"],
    },
    {
      candidateId: "claudia-lopez",
      type: "news",
      url: "https://www.lasillavacia.com/silla-nacional/claudia-lopez-seguridad-urbana-propuesta-2026-03-20",
      title: "El plan de seguridad de Claudia López: prevención, no solo represión",
      snippet:
        "La candidata presentó su propuesta de seguridad ciudadana basada en el modelo " +
        "de Bogotá: inversión en zonas de alta violencia, iluminación de espacios " +
        "públicos, fortalecimiento de la Policía con enfoque de proximidad y rechazo " +
        "a la militarización como respuesta al crimen. Insistió en que la seguridad " +
        "humana requiere abordar las causas estructurales de la violencia.",
      date: "2026-03-20",
      sourceName: "La Silla Vacía",
      topics: ["security"],
    },
    {
      candidateId: "claudia-lopez",
      type: "program",
      url: "https://www.eltiempo.com/politica/programa-claudia-lopez-salud-educacion-2026-03-05",
      title: "Programa López: universalizar la salud y reformar la educación pública",
      snippet:
        "El documento programático de Claudia López plantea una reforma a la salud " +
        "que garantice cobertura universal, elimine las barreras de acceso impuestas " +
        "por las EPS y fortalezca los hospitales públicos en regiones apartadas. " +
        "También propone aumentar la inversión en educación inicial y media técnica " +
        "como palancas de movilidad social y desarrollo económico.",
      date: "2026-03-05",
      sourceName: "El Tiempo",
      topics: ["health", "economy"],
    },
    {
      candidateId: "claudia-lopez",
      type: "social",
      url: "https://x.com/ClaudiaLopez/status/1779012345678901234",
      title: "Tweet: reforma pensional y responsabilidad fiscal",
      snippet:
        "Colombia necesita una reforma pensional que cubra a los trabajadores informales " +
        "sin hundir las finanzas del Estado. Hay que ser responsables fiscalmente: " +
        "ni el déficit del pasado ni el populismo del presente. Gobernar bien es " +
        "garantizar servicios públicos de calidad con transparencia y sin corrupción.",
      date: "2026-03-22",
      sourceName: "X (Twitter)",
      topics: ["fiscal", "anticorruption"],
    },
  ],
};

/** Returned for any candidateId not found in the fixture map. */
const UNKNOWN_CANDIDATE_SOURCES: Source[] = [];

// ---------------------------------------------------------------------------
// Real web search — experimental, ivan-cepeda only
// ---------------------------------------------------------------------------

const VALID_SOURCE_TYPES = new Set<string>([
  "speech", "interview", "news", "opinion", "social", "scandal", "program", "other",
]);

const SEARCH_SYSTEM_PROMPT = `You are a research assistant for a Colombian political analysis platform.

Use the web_search tool to find recent Spanish-language sources about a Colombian presidential candidate for the specified policy topics.

After searching, respond ONLY with a JSON array — no prose, no markdown fences, no explanation.

Each element must match this schema exactly (no extra keys):
{
  "url": string,
  "title": string,
  "snippet": string,
  "date": string | null,
  "sourceName": string,
  "type": "news" | "opinion" | "interview" | "speech" | "social" | "program" | "scandal" | "other",
  "topics": string[]
}

Rules:
- Return 3–5 sources per requested topic (topics may overlap across sources).
- snippet must be ≤ 300 characters, in Spanish, directly relevant to the topic.
- date must be ISO 8601 (YYYY-MM-DD) or null if unknown.
- Prefer credible Colombian outlets: El Espectador, El Tiempo, Semana, Caracol Radio, RCN, La Silla Vacía, Infobae Colombia, W Radio.
- Prefer sources dated within the provided time window.
- Exclude duplicate URLs.
- Include every URL the web_search tool actually returns, even if you are uncertain about publication date or exact snippet. Do NOT omit results to be cautious.
- If and only if the web_search tool returns zero results for a topic, omit that topic from the array. Never invent or guess URLs.`;

/** Shape we accept from Claude before coercing to Source[]. */
interface RawSearchResult {
  url: unknown;
  title: unknown;
  snippet: unknown;
  date: unknown;
  sourceName: unknown;
  type: unknown;
  topics: unknown;
}

function isRawSearchResult(obj: unknown): obj is RawSearchResult {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.url === "string" &&
    typeof o.title === "string" &&
    typeof o.sourceName === "string"
  );
}

/** Extract the first JSON array literal from a string (handles code fences). */
function extractJsonArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Search the web for real sources about a candidate using Claude's web_search
 * tool.  Returns [] when the API key is absent, candidateId is not supported,
 * or any error occurs.
 *
 * Exported for testing (stub injection); not part of the primary public API.
 */
export async function searchRealSources(
  candidateId: string,
  topics: string[],
  timeWindowDays: number,
): Promise<Source[]> {
  if (!process.env.ANTHROPIC_API_KEY || candidateId !== "ivan-cepeda") {
    return [];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - timeWindowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);

  const userMessage =
    `Candidate: Iván Cepeda (Colombian senator, left-wing, Pacto Histórico).\n` +
    `Topics: ${topics.join(", ")}.\n` +
    `Time window: ${cutoffStr} to ${todayStr} (last ${timeWindowDays} days).\n\n` +
    `Use the web_search tool with the following example queries (run each separately or adapt as needed):\n` +
    `  - "Iván Cepeda seguridad 2026 Colombia"\n` +
    `  - "Iván Cepeda economía 2026 Colombia"\n` +
    `  - "Cepeda senador seguridad humana Colombia"\n` +
    `  - "Cepeda Pacto Histórico economía rural 2026"\n\n` +
    `Return ALL URLs the web_search tool finds as a JSON array. Do not filter out results beyond the required JSON schema; include every article, interview, or social post the tool returns, even if only partially relevant. Never invent URLs.`;

  try {
    const client = new Anthropic();
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];

    let response: Anthropic.Message;

    // Server-side tool loop: re-send if Claude pauses mid-search
    while (true) {
      response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        system: SEARCH_SYSTEM_PROMPT,
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        messages,
      });

      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return [];

    const raw = extractJsonArray(textBlock.text);
    if (!raw) return [];

    // Map and validate each result into a Source
    const seen = new Set<string>();
    const sources: Source[] = [];

    for (const item of raw) {
      if (!isRawSearchResult(item)) continue;

      const url = String(item.url);
      if (!url.startsWith("http://") && !url.startsWith("https://")) continue;
      if (seen.has(url)) continue;
      seen.add(url);

      const rawType = String(item.type ?? "news");
      const sourceType: SourceType = VALID_SOURCE_TYPES.has(rawType)
        ? (rawType as SourceType)
        : "news";

      const rawTopics = Array.isArray(item.topics)
        ? (item.topics as unknown[]).filter((t) => typeof t === "string").map(String)
        : topics; // fall back to the requested topics

      sources.push({
        candidateId,
        type: sourceType,
        url,
        title: typeof item.title === "string" ? item.title : undefined,
        snippet:
          typeof item.snippet === "string"
            ? item.snippet.slice(0, 300)
            : undefined,
        date:
          typeof item.date === "string" && item.date
            ? item.date
            : undefined,
        sourceName:
          typeof item.sourceName === "string" ? item.sourceName : undefined,
        topics: rawTopics,
      });
    }

    // --- diagnostic: warn when Claude returned items but all were filtered ---
    if (raw.length > 0 && sources.length === 0) {
      console.warn(
        `[source_collector] searchRealSources: Claude returned ${raw.length} raw item(s)` +
        ` but all were filtered out (bad schema, non-HTTP URL, or all duplicates).` +
        ` Set DEBUG_SEARCH_RAW=1 to dump the raw array.`,
      );
      if (process.env.DEBUG_SEARCH_RAW) {
        console.warn("[source_collector] raw JSON:", JSON.stringify(raw, null, 2));
      }
    }
    return sources;
  } catch (err) {
    console.warn(
      "[source_collector] Real web search failed — falling back to mock:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect a diverse set of sources for a candidate.
 *
 * For ivan-cepeda with ANTHROPIC_API_KEY present, this calls Claude's web
 * search tool to return real sources and bypasses the mock fixture.  For all
 * other candidates (or when the key is absent), it returns FAKE_SOURCES
 * filtered by topic and time window exactly as before.
 *
 * @param candidateId    - Identifier matching the pipeline's candidate records.
 * @param topics         - Optional list of topic keys to restrict results.
 * @param timeWindowDays - Only include sources from the last N days.
 * @returns A promise resolving to the matched Source array.
 */
export async function collectSources(
  candidateId: string,
  topics?: string[],
  timeWindowDays?: number,
): Promise<Source[]> {
  // -- real web search (ivan-cepeda only, when API key is set) ---------------
  const realSources = await searchRealSources(
    candidateId,
    topics ?? [],
    timeWindowDays ?? 30,
  );
  if (realSources.length > 0) return realSources;

  // -- mock fallback ----------------------------------------------------------
  const pool = FAKE_SOURCES[candidateId] ?? UNKNOWN_CANDIDATE_SOURCES;
  let results = pool.slice();

  if (topics && topics.length > 0) {
    const topicSet = new Set(topics.map((t) => t.toLowerCase()));
    results = results.filter(
      (s) => s.topics && s.topics.some((t) => topicSet.has(t.toLowerCase())),
    );
  }

  if (timeWindowDays !== undefined && timeWindowDays > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeWindowDays);
    results = results.filter((s) => {
      if (!s.date) return true;
      return new Date(s.date) >= cutoff;
    });
  }

  return results;
}
