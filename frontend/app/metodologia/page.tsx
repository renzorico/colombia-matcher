import Link from "next/link";
import { TOPIC_COLORS } from "@/lib/topics";

const TOPICS = [
  { id: "security",           label: "Seguridad",                weight: 25 },
  { id: "economy",            label: "Economía",                 weight: 20 },
  { id: "health",             label: "Salud",                    weight: 15 },
  { id: "energy_environment", label: "Energía y Medio Ambiente", weight: 15 },
  { id: "fiscal",             label: "Política Fiscal",          weight: 10 },
  { id: "foreign_policy",     label: "Política Exterior",        weight: 10 },
  { id: "anticorruption",     label: "Anticorrupción",           weight: 5 },
];

const SECTIONS = [
  {
    title: "¿Qué es esto?",
    body: "Una herramienta informativa que compara tus opiniones con las posiciones documentadas de cada candidato presidencial para 2026. Sin sesgos, sin publicidad, sin afiliación política.",
  },
  {
    title: "¿Cómo funciona el quiz?",
    body: "Respondes 25 preguntas en escala 1–5. Cada pregunta corresponde a un eje temático. No hay respuestas correctas — solo tus opiniones. Tarda 5–10 minutos.",
  },
  {
    title: "¿De dónde viene la información?",
    body: "Revisamos discursos, entrevistas, programas de gobierno y noticias. Cada posición tiene una fuente verificable. Si un candidato no tiene posición clara sobre un tema, no le asignamos puntaje.",
  },
  {
    title: "¿Cómo se calcula la afinidad?",
    body: "Comparamos tus respuestas con las de cada candidato tema por tema. El resultado es un promedio ponderado — los temas más relevantes pesan más. Un resultado entre 65% y 75% ya es afinidad alta.",
  },
  {
    title: "¿Es imparcial?",
    body: "No apoyamos a ningún candidato. Los datos son curados por personas y cada posición tiene fuente citada. Úsalo como punto de partida, no como última palabra.",
  },
];

export default function MetodologiaPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">

        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Metodología
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Cómo funciona Elecciones Colombia 2026, en lenguaje claro.
        </p>

        {/* ── Section cards ─────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-4">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="rounded-xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                {s.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Topic weights grid ────────────────────────────────────────── */}
        <h2
          className="mt-10 text-lg font-bold pb-2"
          style={{ color: "var(--foreground)", borderBottom: "2px solid var(--primary)" }}
        >
          Peso por tema
        </h2>
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Los temas más relevantes para la agenda colombiana 2026 tienen mayor peso en el cálculo.
        </p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TOPICS.map((t) => {
            const color = TOPIC_COLORS[t.id] ?? "#4A4A4A";
            return (
              <div
                key={t.id}
                className="rounded-xl p-4 flex flex-col items-center text-center"
                style={{
                  border: "1px solid var(--border)",
                  borderTop: `3px solid ${color}`,
                  backgroundColor: "var(--surface)",
                }}
              >
                <span
                  className="text-2xl font-extrabold"
                  style={{ color }}
                >
                  {t.weight}%
                </span>
                <span className="mt-1 text-xs font-medium" style={{ color: "var(--foreground)" }}>
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Disclaimer ────────────────────────────────────────────────── */}
        <div
          className="mt-8 rounded-xl px-5 py-4"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Aviso legal
          </p>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Herramienta informativa independiente. No afiliada a ningún candidato, partido
            o entidad gubernamental. Verifica siempre la información con otras fuentes.
          </p>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/quiz"
            className="rounded-full px-8 py-3 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Haz el quiz ahora
          </Link>
          <Link
            href="/bajo-el-capo"
            className="text-xs transition hover:opacity-80"
            style={{ color: "var(--muted)" }}
          >
            Ver arquitectura técnica
          </Link>
        </div>

      </div>
    </main>
  );
}
