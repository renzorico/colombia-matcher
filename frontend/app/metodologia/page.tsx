"use client";

import { useState } from "react";
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

const STEPS = [
  {
    number: "1",
    title: "Respondes",
    desc: "25 preguntas sobre los temas que más importan para Colombia en 2026. Sin respuestas correctas — solo tus opiniones.",
  },
  {
    number: "2",
    title: "Comparamos",
    desc: "Tus respuestas con las posiciones documentadas de cada candidato, tema por tema, usando fuentes verificables.",
  },
  {
    number: "3",
    title: "Descubres",
    desc: "Qué candidato está más alineado con tus ideas, con un desglose por tema y acceso a las fuentes.",
  },
];

const SECTIONS = [
  {
    id: "que-es",
    title: "¿Qué es esto?",
    body: "Una herramienta informativa que compara tus opiniones con las posiciones documentadas de cada candidato presidencial para 2026. Sin sesgos, sin publicidad, sin afiliación política.",
  },
  {
    id: "como-funciona",
    title: "¿Cómo funciona el quiz?",
    body: "Respondes 25 preguntas en escala 1–5. Cada pregunta corresponde a un eje temático. No hay respuestas correctas — solo tus opiniones. Tarda 5–10 minutos.",
  },
  {
    id: "fuentes",
    title: "¿De dónde viene la información?",
    body: "Revisamos discursos, entrevistas, programas de gobierno y noticias. Cada posición tiene una fuente verificable. Si un candidato no tiene posición clara sobre un tema, no le asignamos puntaje.",
  },
  {
    id: "afinidad",
    title: "¿Cómo se calcula la afinidad?",
    body: "Comparamos tus respuestas con las de cada candidato tema por tema. El resultado es un promedio ponderado — los temas más relevantes pesan más. Un resultado entre 65% y 75% ya es afinidad alta.",
  },
  {
    id: "imparcial",
    title: "¿Es imparcial?",
    body: "No apoyamos a ningún candidato. Los datos son curados por personas y cada posición tiene fuente citada. Úsalo como punto de partida, no como última palabra.",
  },
];

export default function MetodologiaPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">

        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Metodología
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Cómo funciona Elecciones Colombia 2026, en lenguaje claro.
        </p>

        {/* ── 3-step flow ───────────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center rounded-2xl px-3 py-5"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-extrabold text-white flex-shrink-0"
                style={{ backgroundColor: "var(--hero)" }}
              >
                {step.number}
              </div>
              <h3 className="mt-3 text-sm font-bold" style={{ color: "var(--secondary)" }}>
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed hidden sm:block" style={{ color: "var(--muted)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        {/* Step descriptions on mobile (shown below grid) */}
        <div className="mt-4 flex flex-col gap-2 sm:hidden">
          {STEPS.map((step) => (
            <p key={step.number} className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{step.number}. {step.title}:</span>{" "}
              {step.desc}
            </p>
          ))}
        </div>

        {/* ── Accordion FAQ ─────────────────────────────────────────────── */}
        <h2
          className="mt-10 text-lg font-bold pb-2"
          style={{ color: "var(--foreground)", borderBottom: "2px solid var(--primary)" }}
        >
          Preguntas frecuentes
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          {SECTIONS.map((s) => {
            const isOpen = openSection === s.id;
            return (
              <div
                key={s.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  border: `1px solid ${isOpen ? "var(--secondary)" : "var(--border)"}`,
                  backgroundColor: "var(--surface)",
                }}
              >
                <button
                  onClick={() => toggle(s.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: isOpen
                      ? "color-mix(in srgb, var(--secondary) 6%, transparent)"
                      : "transparent",
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isOpen ? "var(--secondary)" : "var(--foreground)" }}
                  >
                    {s.title}
                  </span>
                  <span
                    className="text-base font-bold flex-shrink-0 transition-transform duration-200"
                    style={{
                      color: "var(--muted)",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? "300px" : "0px", opacity: isOpen ? 1 : 0 }}
                >
                  <p
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {s.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Topic weights ──────────────────────────────────────────────── */}
        <h2
          className="mt-10 text-lg font-bold pb-2"
          style={{ color: "var(--foreground)", borderBottom: "2px solid var(--primary)" }}
        >
          Peso por tema
        </h2>
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Los temas más relevantes para la agenda colombiana 2026 tienen mayor peso en el cálculo.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {TOPICS.map((t) => {
            const color = TOPIC_COLORS[t.id] ?? "#4A4A4A";
            return (
              <div key={t.id} className="flex items-center gap-3">
                <span
                  className="w-44 flex-shrink-0 text-sm font-medium text-right"
                  style={{ color: "var(--foreground)" }}
                >
                  {t.label}
                </span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${t.weight}%`, backgroundColor: color }}
                  />
                </div>
                <span
                  className="w-8 flex-shrink-0 text-sm font-bold tabular-nums"
                  style={{ color }}
                >
                  {t.weight}%
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Disclaimer (de-emphasized) ─────────────────────────────────── */}
        <p className="mt-8 text-xs leading-relaxed" style={{ color: "var(--muted)", opacity: 0.7 }}>
          <span className="font-semibold uppercase tracking-wide">Aviso legal</span> · Herramienta
          informativa independiente. No afiliada a ningún candidato, partido o entidad
          gubernamental. Verifica siempre la información con otras fuentes.
        </p>

        {/* ── CTAs ──────────────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/quiz"
            className="rounded-full px-8 py-3 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Haz el quiz ahora
          </Link>
          <Link
            href="/bajo-el-capo"
            className="rounded-full px-6 py-2.5 text-sm font-semibold border transition hover:opacity-80"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Ver arquitectura técnica
          </Link>
        </div>

      </div>
    </main>
  );
}
