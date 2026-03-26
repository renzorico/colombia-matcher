import Link from "next/link";

const STEPS = [
  {
    emoji: "🗳️",
    emojiClass: "anim-bounce",
    step: "01",
    title: "Respondés",
    desc:
      "Respondés 25 preguntas sobre los temas que más importan para Colombia en 2026: seguridad, economía, salud, medio ambiente, corrupción y más. Sin respuestas correctas ni incorrectas — solo tus opiniones.",
    delay: "anim-delay-1",
  },
  {
    emoji: "📊",
    emojiClass: "anim-pulse",
    step: "02",
    title: "Comparamos",
    desc:
      "Comparamos tus respuestas con las posiciones documentadas y verificadas de cada candidato presidencial, tema por tema. Cada dato tiene su fuente — podés verificarlo tú mismo.",
    delay: "anim-delay-2",
  },
  {
    emoji: "🏆",
    emojiClass: "anim-reveal",
    step: "03",
    title: "Descubrís",
    desc:
      "Recibís un ranking personalizado mostrando qué candidato está más alineado con tus ideas, con explicación por tema y enlaces a los perfiles completos.",
    delay: "anim-delay-3",
  },
];

export default function ComoFuncionaPage() {
  return (
    <main className="flex flex-1 flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center px-4 py-20 text-center"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest mb-4 anim-fade-in-up"
          style={{ color: "var(--primary)" }}
        >
          Guía paso a paso
        </span>
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight anim-fade-in-up anim-delay-1"
          style={{ color: "#FFFFFF" }}
        >
          Así funciona<br />
          <span style={{ color: "var(--primary)" }}>Colombia Matcher</span>
        </h1>
        <p
          className="mt-5 max-w-md text-base leading-relaxed anim-fade-in-up anim-delay-2"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          En tres pasos descubrís con qué candidato presidencial colombiano estás más alineado.
        </p>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-2xl flex flex-col gap-8">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={`flex gap-6 items-start anim-fade-in-up ${s.delay}`}
            >
              {/* Big emoji */}
              <div
                className={`flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl text-4xl ${s.emojiClass}`}
                style={{ backgroundColor: "var(--surface)", border: "2px solid var(--border)" }}
              >
                {s.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--primary)" }}
                  >
                    Paso {s.step}
                  </span>
                </div>
                <h2
                  className="text-2xl font-bold leading-tight"
                  style={{ color: "var(--secondary)" }}
                >
                  {s.title}
                </h2>
                <p
                  className="mt-2 text-base leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy note ──────────────────────────────────────────────────── */}
      <section
        className="flex justify-center px-4 pb-6"
      >
        <div
          className="w-full max-w-2xl rounded-xl px-5 py-4 text-center text-sm anim-fade-in-up anim-delay-3"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          🔒 No recopilamos tus respuestas. Todo se procesa en tu dispositivo.
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-4 px-4 py-12 text-center">
        <h3
          className="text-xl font-bold"
          style={{ color: "var(--foreground)" }}
        >
          ¿Listo para descubrir con quién estás alineado?
        </h3>
        <Link
          href="/quiz"
          className="rounded-full px-8 py-3 text-base font-bold shadow-lg transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
        >
          Hacer el quiz ahora →
        </Link>
        <Link
          href="/candidatos"
          className="text-sm transition"
          style={{ color: "var(--muted)" }}
        >
          o explora los candidatos primero
        </Link>
      </section>

    </main>
  );
}
