import Link from "next/link";

const STATS = [
  { number: "25", label: "preguntas" },
  { number: "6",  label: "candidatos" },
  { number: "7",  label: "temas clave" },
];

const STEPS = [
  { emoji: "🗳️", title: "Respondés",     desc: "25 preguntas sobre los temas que más importan para Colombia en 2026." },
  { emoji: "📊", title: "Comparamos",    desc: "Tus respuestas con las posiciones documentadas de cada candidato, tema por tema." },
  { emoji: "🏆", title: "Descubrís",     desc: "Qué candidato está más alineado con tus ideas, con fuentes verificables." },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center px-4 py-20 text-center"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          style={{ color: "var(--primary)" }}
        >
          ¿Por quién votarás?
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          Descubre qué candidato presidencial está más alineado con tus ideas.
          25 preguntas. Sin sesgos. Sin política.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/quiz"
            className="rounded-full px-8 py-3 text-base font-bold shadow-lg transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Comenzar quiz →
          </Link>
          <Link
            href="/candidatos"
            className="rounded-full px-6 py-3 text-sm font-medium border transition hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.85)" }}
          >
            Ver candidatos
          </Link>
        </div>
      </section>

      {/* ── Stat blocks ───────────────────────────────────────────────────── */}
      <section className="bg-surface border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-4 py-8 grid grid-cols-3 gap-4 text-center">
          {STATS.map((s) => (
            <div key={s.number} className="flex flex-col items-center gap-1">
              <span
                className="text-4xl sm:text-5xl font-extrabold"
                style={{ color: "var(--secondary)" }}
              >
                {s.number}
              </span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-4 py-16">
        <h2 className="text-2xl font-bold text-center" style={{ color: "var(--foreground)" }}>
          ¿Cómo funciona?
        </h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center bg-surface rounded-2xl p-6 shadow-sm"
              style={{ border: "1px solid var(--border)" }}
            >
              <span className="text-5xl mb-4">{step.emoji}</span>
              <h3 className="text-xl font-bold" style={{ color: "var(--secondary)" }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/quiz"
            className="rounded-full px-8 py-3 text-base font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Comenzar →
          </Link>
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <section className="text-center px-4 py-6 text-xs" style={{ color: "var(--muted)" }}>
        Herramienta informativa independiente. No afiliada a ningún candidato, partido o entidad gubernamental.
      </section>

    </main>
  );
}
