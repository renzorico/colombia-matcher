"use client";

import Link from "next/link";
import { TOPIC_COLORS } from "@/lib/topics";
import { useLanguage } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BajoElCapoPage() {
  const { t } = useLanguage();

  const TOPICS = t.bts.topics;
  const AGENTS = t.bts.agents;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>{t.bts.title}</h1>
        <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: "var(--muted)" }}>
          {t.bts.subtitle}{" "}
          <Link href="/metodologia" className="underline hover:opacity-80" style={{ color: "var(--secondary)" }}>
            {t.bts.subtitleMethodLink}
          </Link>.
        </p>

        {/* ── Stack tecnológico ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{t.bts.stackTitle}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            {t.bts.stack.map((row) => (
              <div key={row.layer} className="rounded-xl p-4" style={{ border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{row.layer}</p>
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--foreground)" }}>{row.tech}</p>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{row.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Production flow ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{t.bts.flowTitle}</h2>
          <div className="rounded-xl p-5 font-mono text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            <div className="flex flex-col gap-1.5">
              {t.bts.flow.map(([actor, action], i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-40 flex-shrink-0 font-semibold truncate" style={{ color: "var(--muted)" }}>
                    {actor}
                  </span>
                  <span style={{ color: "var(--foreground)" }}>→ {action}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Scoring algorithm ────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{t.bts.scoringTitle}</h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            <p>{t.bts.scoringP1}</p>
            <p>{t.bts.scoringP2}</p>
            <div className="rounded-lg px-5 py-3 font-mono" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              {t.bts.scoringFormula}
            </div>
            <p>{t.bts.scoringP3}</p>
            <p>
              {t.bts.scoringP4}{" "}
              <code className="px-1 rounded" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>6 − respuesta</code>.
            </p>
          </div>
        </section>

        {/* ── Topics ───────────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{t.bts.axesTitle}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            {t.bts.axesDesc}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOPICS.map((topic) => (
              <div
                key={topic.id}
                className="rounded-xl p-4"
                style={{
                  border: "1px solid var(--border)",
                  borderLeft: `4px solid ${TOPIC_COLORS[topic.id] ?? "#4A4A4A"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{topic.label}</h3>
                  <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: "color-mix(in srgb, var(--hero) 10%, transparent)", color: "var(--secondary)" }}>
                    {topic.weight}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{topic.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Agents ───────────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{t.bts.agentsTitle}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            {t.bts.agentsDesc}
          </p>
          <div className="flex flex-col gap-4">
            {AGENTS.map((a) => (
              <div key={a.name} className="rounded-xl p-5" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{a.name}</h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: "color-mix(in srgb, var(--hero) 15%, transparent)", color: "var(--secondary)" }}
                  >
                    {t.bts.agentActive}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{a.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="font-semibold" style={{ color: "var(--muted)" }}>Inputs:</span>{" "}
                    <span style={{ color: "var(--foreground)" }}>{a.inputs}</span>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="font-semibold" style={{ color: "var(--muted)" }}>Outputs:</span>{" "}
                    <span style={{ color: "var(--foreground)" }}>{a.outputs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Review workflow ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{t.bts.reviewTitle}</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
            {t.bts.reviewDesc}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
            {t.bts.reviewItems.map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
                <p className="font-bold">{item.label}</p>
                <p className="mt-0.5 font-mono text-xs opacity-70">{item.file}</p>
                <p className="mt-2 text-xs leading-relaxed opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why static-first ─────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{t.bts.staticTitle}</h2>
          <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            <p>
              <strong style={{ color: "var(--foreground)" }}>{t.bts.staticP1Title}</strong> {t.bts.staticP1}
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>{t.bts.staticP2Title}</strong> {t.bts.staticP2}
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>{t.bts.staticP3Title}</strong> {t.bts.staticP3}
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>{t.bts.staticP4Title}</strong> {t.bts.staticP4}
            </p>
          </div>
        </section>

        {/* ── Attribution ─────────────────────────────────────────────────── */}
        <p className="mt-10 text-xs" style={{ color: "var(--muted)" }}>
          {t.bts.photoCredit} <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Wikimedia Commons</a> (CC BY-SA)
        </p>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <section className="mt-6 pt-8 flex flex-col sm:flex-row items-start gap-4 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/metodologia"
              className="rounded-full px-5 py-2 text-sm font-semibold text-center transition hover:opacity-80"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              {t.bts.ctaMethodology}
            </Link>
            <Link
              href="/quiz"
              className="rounded-full px-5 py-2 text-sm font-bold text-center shadow transition hover:opacity-90"
              style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
            >
              {t.bts.ctaQuiz}
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
