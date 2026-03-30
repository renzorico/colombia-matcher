"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

const STAT_COLORS = ["#eab308", "#1d4ed8", "#dc2626"];

function VerCandidatosButton({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/candidatos"
      className="rounded-full px-6 py-3 text-sm font-medium border transition"
      style={{
        borderColor: "rgba(255,255,255,0.4)",
        color: "#eab308",
        backgroundColor: hovered ? "#dc2626" : "transparent",
        transition: "background 200ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const STATS = [
    { number: "6",  label: t.home.statsCandidates, color: STAT_COLORS[0] },
    { number: "7",  label: t.home.statsTopics,      color: STAT_COLORS[1] },
    { number: "25", label: t.home.statsQuestions,   color: STAT_COLORS[2] },
  ];

  const STEP_EMOJIS = ["🗳️", "📊", "🏆"];

  return (
    <main className="flex flex-1 flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center px-4 py-20 text-center"
        style={{ backgroundColor: "var(--hero)" }}
      >
        <h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          style={{ color: "var(--primary)" }}
        >
          {t.home.title}
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          {t.home.subtitle}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/quiz"
            className="rounded-full px-8 py-3 text-base font-bold shadow-lg transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            {t.home.startQuiz}
          </Link>
          <VerCandidatosButton label={t.home.viewCandidates} />
        </div>
      </section>

      {/* ── Stat blocks ───────────────────────────────────────────────────── */}
      <section className="bg-surface border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-4 py-8 grid grid-cols-3 divide-x divide-gray-100">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 px-4 py-2">
              <span
                className="text-4xl sm:text-5xl font-extrabold tabular-nums"
                style={{ color: s.color }}
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
          {t.home.howItWorks}
        </h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
          {t.home.steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center bg-surface rounded-2xl p-6 shadow-sm"
              style={{ border: "1px solid var(--border)" }}
            >
              <span className="text-5xl mb-4">{STEP_EMOJIS[i]}</span>
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
            {t.home.start}
          </Link>
        </div>
      </section>

    </main>
  );
}
