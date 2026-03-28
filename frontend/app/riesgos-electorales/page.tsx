"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  MUNICIPIOS,
  STATS,
  MECANISMOS,
  INCIDENTES,
  PARTIDOS_DISTRIBUCION,
  CANDIDATOS_POSICIONES,
  FUENTES,
  type Municipio,
} from "@/lib/riesgo-electoral";

// ── helpers ───────────────────────────────────────────────────────────────────

function groupByDepto(muns: Municipio[]): [string, Municipio[]][] {
  const map: Record<string, Municipio[]> = {};
  for (const m of muns) {
    (map[m.departamento] ??= []).push(m);
  }
  return Object.entries(map).sort((a, b) => {
    const ai = a[1].filter((m) => m.nivel_defensoria === "accion_inmediata").length;
    const bi = b[1].filter((m) => m.nivel_defensoria === "accion_inmediata").length;
    return bi - ai || a[0].localeCompare(b[0]);
  });
}

const NIVEL_STYLE = {
  accion_inmediata: { label: "Acción Inmediata", color: "#DC2626", bg: "#FEF2F2" },
  accion_urgente:   { label: "Acción Urgente",   color: "#EA580C", bg: "#FFF7ED" },
};

const SECTION_BORDER = "2px solid var(--primary)";

// ── component ─────────────────────────────────────────────────────────────────

export default function RiesgosElectoralesPage() {
  const [openDepto, setOpenDepto] = useState<string | null>(null);
  const grouped = groupByDepto(MUNICIPIOS);

  function toggleDepto(dep: string) {
    setOpenDepto((prev) => (prev === dep ? null : dep));
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-5 mb-8"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">🗳️</span>
            <div>
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                Riesgos Electorales 2026
              </h1>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Datos oficiales de la{" "}
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>Defensoría del Pueblo</span>{" "}
                y la{" "}
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>Misión de Observación Electoral (MOE)</span>{" "}
                sobre los municipios con riesgo crítico de seguridad electoral para las elecciones presidenciales de mayo 2026.
              </p>
            </div>
          </div>
          <div
            className="mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed"
            style={{ backgroundColor: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}
          >
            <span className="font-bold uppercase tracking-wide">Nota editorial</span> · Esta página presenta información
            de fuentes institucionales del Estado colombiano. La correlación entre presencia de grupos armados y
            resultados electorales no equivale a fraude en el escrutinio — documenta condiciones estructurales que
            limitan el pluralismo político y la libre competencia electoral.
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-10">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-4 flex flex-col gap-1"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span
                className="text-2xl font-extrabold tabular-nums"
                style={{ color: s.color }}
              >
                {s.value}
              </span>
              <span className="text-xs font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                {s.label}
              </span>
              <span className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
                {s.sub}
              </span>
            </div>
          ))}
        </div>

        {/* ── Mecanismos ─────────────────────────────────────────────────── */}
        <h2
          className="text-lg font-bold pb-2 mb-4"
          style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
        >
          ¿Cómo operan los riesgos?
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          La Defensoría documenta tres mecanismos mediante los cuales grupos armados ilegales distorsionan
          la competencia electoral en los municipios bajo alerta:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {MECANISMOS.map((m) => (
            <div
              key={m.numero}
              className="rounded-xl px-5 py-5"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white mb-3"
                style={{ backgroundColor: "#DC2626" }}
              >
                {m.numero}
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--foreground)" }}>
                {m.titulo}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Municipios ─────────────────────────────────────────────────── */}
        <h2
          className="text-lg font-bold pb-2 mb-1"
          style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
        >
          Municipios por departamento
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Fuente: Alerta Temprana Electoral 013-2025 + Informe de Seguimiento 003-2026 (Defensoría del Pueblo) y
          Mapa de Riesgo 2026 (MOE). Ordenados por número de municipios en acción inmediata.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(NIVEL_STYLE).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: v.bg, color: v.color, border: `1px solid ${v.color}30` }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: v.color }} />
              {v.label}
            </span>
          ))}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: "#F5F3FF", color: "#7C3AED", border: "1px solid #7C3AED30" }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#7C3AED" }} />
            Riesgo extremo MOE
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-10">
          {grouped.map(([depto, muns]) => {
            const isOpen = openDepto === depto;
            const nImm = muns.filter((m) => m.nivel_defensoria === "accion_inmediata").length;
            return (
              <div
                key={depto}
                className="rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${isOpen ? "#DC2626" : "var(--border)"}`,
                  backgroundColor: "var(--surface)",
                }}
              >
                <button
                  onClick={() => toggleDepto(depto)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:-translate-y-0.5"
                  style={{
                    backgroundColor: isOpen
                      ? "color-mix(in srgb, #DC2626 5%, transparent)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: isOpen ? "#DC2626" : "var(--foreground)" }}
                    >
                      {depto}
                    </span>
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                    >
                      {muns.length} municipio{muns.length !== 1 ? "s" : ""}
                    </span>
                    {nImm > 0 && (
                      <span
                        className="flex-shrink-0 hidden sm:inline rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #DC262630" }}
                      >
                        {nImm} acción inmediata
                      </span>
                    )}
                  </div>
                  <span
                    className="text-base font-bold flex-shrink-0 transition-transform duration-200"
                    style={{ color: "var(--muted)", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  >
                    +
                  </span>
                </button>

                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? "800px" : "0px", opacity: isOpen ? 1 : 0 }}
                >
                  <div className="px-5 pb-4 flex flex-col gap-2">
                    {muns.map((m) => {
                      const ns = NIVEL_STYLE[m.nivel_defensoria];
                      return (
                        <div
                          key={m.municipio}
                          className="rounded-lg px-3 py-2.5"
                          style={{ backgroundColor: ns.bg, border: `1px solid ${ns.color}20` }}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {m.municipio}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: "white", color: ns.color, border: `1px solid ${ns.color}40` }}
                            >
                              {ns.label}
                            </span>
                            {m.grupos_armados.map((g) => (
                              <span
                                key={g}
                                className="rounded-full px-2 py-0.5 text-xs"
                                style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                          {m.nota && (
                            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                              {m.nota}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Hallazgo Vallejo ───────────────────────────────────────────── */}
        <h2
          className="text-lg font-bold pb-2 mb-4"
          style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
        >
          Hallazgo crítico — Suroccidente colombiano
        </h2>

        <div
          className="rounded-xl px-6 py-5 mb-6"
          style={{ backgroundColor: "#FEF2F2", border: "2px solid #DC2626" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚩</span>
            <div>
              <h3 className="text-base font-bold mb-2" style={{ color: "#991B1B" }}>
                10 municipios de Nariño y Cauca con &gt;50% para un solo partido
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#7F1D1D" }}>
                El análisis de Alejandro Vallejo Bastidas (Risk Manager, Pinkerton) sobre los resultados
                del escrutinio oficial de la Registraduría (99.8% de precisión histórica) identificó
                10 municipios del Suroccidente en los que el partido ganador superó el <strong>50% de los votos al Senado</strong>,
                coincidiendo todos con alerta máxima de seguridad electoral.
              </p>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "#7F1D1D" }}>
                En democracias competitivas, mayorías absolutas para un solo partido son estadísticamente
                inusuales. Cuando ocurren en zonas donde grupos armados vetan candidaturas y regulan campañas,
                sugieren que <strong>el pluralismo político ha sido efectivamente suprimido</strong> — no
                necesariamente a través del escrutinio, sino en las condiciones previas al voto.
              </p>
              <p className="text-xs" style={{ color: "#991B1B", opacity: 0.8 }}>
                Los nombres exactos de los 10 municipios provienen del análisis con mapas publicado en LinkedIn por Vallejo.
                Se presentan como zona hasta confirmar la lista oficial publicada en fuente abierta.
              </p>
            </div>
          </div>
        </div>

        {/* Bar chart — party distribution */}
        <div
          className="rounded-xl px-5 py-5 mb-10"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
            Distribución de 1er lugar al Senado en los 69 municipios de riesgo crítico
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Fuente: Registraduría Nacional del Estado Civil (escrutinio oficial) + análisis Vallejo / Defensoría ATE 013-2025
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={PARTIDOS_DISTRIBUCION}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="partido"
                width={170}
                tick={{ fontSize: 11, fill: "#6B6B6B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v} municipios`]}
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  backgroundColor: "var(--surface)",
                }}
              />
              <Bar dataKey="municipios" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "#6B6B6B" }}>
                {PARTIDOS_DISTRIBUCION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-3" style={{ color: "var(--muted)", opacity: 0.8 }}>
            Nota metodológica: ganar en más municipios de riesgo no prueba coerción — el Pacto Histórico
            tiene base electoral real en estas regiones. El indicador relevante es el subconjunto de 10
            municipios con &gt;50%, estadísticamente atípico en condiciones de pluralismo libre.
          </p>
        </div>

        {/* ── Incidentes 8 marzo ─────────────────────────────────────────── */}
        <h2
          className="text-lg font-bold pb-2 mb-4"
          style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
        >
          Jornada electoral — 8 de marzo de 2026
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Incidentes documentados durante las elecciones legislativas:
        </p>

        <div className="flex flex-col gap-3 mb-10">
          {INCIDENTES.map((inc) => (
            <div
              key={inc.tipo}
              className="rounded-xl px-5 py-4"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <span
                  className="text-xs font-bold rounded-full px-2.5 py-0.5"
                  style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                >
                  {inc.tipo}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {inc.lugar}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {inc.desc}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {inc.fuente}
              </p>
            </div>
          ))}
        </div>

        {/* ── Candidatos ─────────────────────────────────────────────────── */}
        <h2
          className="text-lg font-bold pb-2 mb-2"
          style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
        >
          ¿Qué proponen los candidatos?
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Posiciones sobre grupos armados, paz total y seguridad en territorios en conflicto:
        </p>

        <div className="flex flex-col gap-3 mb-10">
          {CANDIDATOS_POSICIONES.map((c) => (
            <div
              key={c.nombre}
              className="rounded-xl px-5 py-4"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                  {c.nombre}
                </span>
                <span
                  className="text-xs rounded-full px-2.5 py-0.5 font-semibold"
                  style={{ backgroundColor: `${c.espectroColor}15`, color: c.espectroColor }}
                >
                  {c.espectro}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {c.partido}
                </span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Grupos armados</dt>
                  <dd style={{ color: "var(--foreground)" }}>{c.postura}</dd>
                </div>
                <div>
                  <dt className="font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Paz total</dt>
                  <dd style={{ color: "var(--foreground)" }}>{c.pazTotal}</dd>
                </div>
                <div>
                  <dt className="font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Propuesta clave</dt>
                  <dd style={{ color: "var(--foreground)" }}>{c.propuestaClave}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* ── Fuentes ────────────────────────────────────────────────────── */}
        <h2
          className="text-lg font-bold pb-2 mb-4"
          style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
        >
          Fuentes primarias
        </h2>

        <div className="flex flex-col gap-2 mb-10">
          {FUENTES.map((f) => (
            <a
              key={f.label}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl px-4 py-3 transition hover:opacity-80"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="text-base flex-shrink-0 mt-0.5">📄</span>
              <div className="min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--secondary)" }}>
                  {f.label}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{f.institucion}</span>
                  <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>·</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{f.fecha}</span>
                </div>
              </div>
              <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--muted)" }}>↗</span>
            </a>
          ))}
        </div>

        {/* ── Disclaimer ─────────────────────────────────────────────────── */}
        <p className="text-xs leading-relaxed mb-8" style={{ color: "var(--muted)", opacity: 0.7 }}>
          <span className="font-semibold uppercase tracking-wide">Aviso legal</span> · Herramienta informativa
          independiente. No afiliada a ningún candidato, partido o entidad gubernamental. Los datos
          provienen de fuentes institucionales públicas del Estado colombiano. Verifica siempre con
          las fuentes originales enlazadas arriba.
        </p>

        {/* ── CTAs ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/quiz"
            className="rounded-full px-8 py-3 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Haz el quiz — ¿con quién votas?
          </Link>
          <Link
            href="/candidatos"
            className="rounded-full px-6 py-2.5 text-sm font-semibold border transition hover:opacity-80"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Ver perfiles de candidatos
          </Link>
        </div>

      </div>
    </main>
  );
}
