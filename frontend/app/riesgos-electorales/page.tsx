"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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

// ── Dynamic map import (avoids SSR issues with react-simple-maps) ─────────────
const ColombiaMap = dynamic(() => import("./ColombiaMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center rounded-xl"
      style={{ height: 380, backgroundColor: "var(--border)", opacity: 0.3 }}
    >
      <span className="text-sm" style={{ color: "var(--muted)" }}>Cargando mapa…</span>
    </div>
  ),
});

// ── In-page nav config ────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "cifras",       label: "Cifras clave" },
  { id: "como-operan", label: "¿Cómo operan?" },
  { id: "mapa",        label: "Mapa" },
  { id: "municipios",  label: "Municipios" },
  { id: "jornada",     label: "Jornada electoral" },
  { id: "candidatos",  label: "Candidatos" },
  { id: "fuentes",     label: "Fuentes" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByDepto(muns: Municipio[]): [string, Municipio[]][] {
  const map: Record<string, Municipio[]> = {};
  for (const m of muns) (map[m.departamento] ??= []).push(m);
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

// Semantic colors: red = security, orange = electoral irregularity, blue = institutional, gray = aggregate
const INCIDENT_SEVERITY: Record<string, string> = {
  "Ataque con explosivos":            "#DC2626",
  "Trashumancia electoral":           "#EA580C",
  "Traslado de puestos":              "#EA580C",
  "Operaciones preventivas":          "#2563EB",
  "Capturas por delitos electorales": "#2563EB",
  "Incidentes totales":               "#6B7280",
};

const SECTION_BORDER = "2px solid var(--primary)";

// ── Animated stat counter ─────────────────────────────────────────────────────

function useCountUp(target: number, triggered: boolean, duration = 1200): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!triggered) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      if (t >= 1) {
        setCount(target);
        return;
      }
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [triggered, target, duration]);
  return count;
}

interface StatCardProps {
  value: string;
  label: string;
  sub: string;
  color: string;
}

function StatCard({ value, label, sub, color }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const numMatch = value.replace(/[+%M]/g, "").match(/^(\d+(?:\.\d+)?)$/);
  const numericTarget = numMatch ? parseFloat(numMatch[1]) : null;
  const isCountable = numericTarget !== null && !value.includes(".");
  const counted = useCountUp(isCountable ? (numericTarget ?? 0) : 0, visible);

  const displayValue = () => {
    if (!isCountable) return value;
    if (!visible || counted === 0) return value;
    const prefix = value.startsWith("+") ? "+" : "";
    const suffix = value.endsWith("%") ? "%" : value.endsWith("M") ? "M" : "";
    return `${prefix}${counted}${suffix}`;
  };

  return (
    <div
      ref={ref}
      className="rounded-xl px-4 py-4 flex flex-col gap-1 transition-all duration-500"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <span className="text-2xl font-extrabold tabular-nums" style={{ color }}>
        {displayValue()}
      </span>
      <span className="text-xs font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
        {label}
      </span>
      <span className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
        {sub}
      </span>
    </div>
  );
}

// ── Candidate flip card ───────────────────────────────────────────────────────

interface FlipCardProps {
  c: (typeof CANDIDATOS_POSICIONES)[number];
}

function FlipCard({ c }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ perspective: "1000px", height: 260, minHeight: 260 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front ── */}
        <div
          className="absolute inset-0 rounded-xl flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${c.espectroColor}`,
            overflow: "hidden",
          }}
        >
          <div
            className="relative overflow-hidden bg-gray-100"
            style={{ flexShrink: 0, height: 160 }}
          >
            <Image
              src={c.foto}
              alt={c.nombre}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          </div>
          <div className="px-3 py-2 flex flex-col justify-center flex-1">
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {c.nombre}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: `${c.espectroColor}18`, color: c.espectroColor }}
              >
                {c.espectro}
              </span>
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
              Ver posiciones →
            </p>
          </div>
        </div>

        {/* ── Back ── */}
        <div
          className="absolute inset-0 rounded-xl overflow-auto flex flex-col px-4 py-4 gap-2.5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${c.espectroColor}`,
          }}
        >
          <div>
            <p className="text-xs font-bold" style={{ color: c.espectroColor }}>
              {c.nombre}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{c.partido}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>
              Grupos armados
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
              {c.postura}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>
              Paz total
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
              {c.pazTotal}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>
              Propuesta clave
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
              {c.propuestaClave}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiesgosElectoralesPage() {
  const [openDepto, setOpenDepto]           = useState<string | null>(null);
  const [search, setSearch]                 = useState("");
  const [activeSection, setActiveSection]   = useState("cifras");
  const [showBackToTop, setShowBackToTop]   = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const grouped = groupByDepto(MUNICIPIOS);

  // ── Back-to-top scroll tracking ─────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ── Scroll-spy (topmost-wins) ────────────────────────────────────────────────
  useEffect(() => {
    const intersecting = new Set<string>();
    const observers: IntersectionObserver[] = [];
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) intersecting.add(id);
          else intersecting.delete(id);
          const first = NAV_SECTIONS.find((s) => intersecting.has(s.id));
          if (first) setActiveSection(first.id);
        },
        { rootMargin: "-15% 0px -75% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Filtered municipalities ─────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const filteredGrouped: [string, Municipio[]][] = q
    ? grouped
        .map(([dep, muns]): [string, Municipio[]] => [
          dep,
          muns.filter(
            (m) =>
              m.municipio.toLowerCase().includes(q) ||
              m.departamento.toLowerCase().includes(q)
          ),
        ])
        .filter(([, muns]) => muns.length > 0)
    : grouped;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-3xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-5 mb-6"
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
                sobre los municipios con riesgo crítico de seguridad electoral para las elecciones presidenciales de mayo 2026.{" "}
                <span style={{ color: "var(--muted)" }}>
                  Los datos de riesgo se basan en alertas emitidas antes de las legislativas del 8 de marzo de 2026
                  y aplican igualmente a la primera vuelta presidencial de mayo 2026.
                </span>
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

        {/* ── Sticky in-page nav ──────────────────────────────────────────── */}
        <div
          className="sticky z-20 -mx-4 mb-8"
          style={{
            top: 0,
            backgroundColor: "var(--background)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="relative">
            <div
              ref={navRef}
              className="overflow-x-auto px-4 py-2"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex gap-2 min-w-max">
                {NAV_SECTIONS.map(({ id, label }) => {
                  const isActive = activeSection === id;
                  return (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all"
                      style={{
                        backgroundColor: isActive ? "var(--primary)" : "var(--surface)",
                        color: isActive ? "#1A1A1A" : "var(--muted)",
                        border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Right-side gradient fade to hint at more items */}
            <div
              className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
              style={{
                background: "linear-gradient(to right, transparent, var(--background))",
              }}
            />
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div id="cifras" className="scroll-mt-20">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-10">
            {STATS.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} sub={s.sub} color={s.color} />
            ))}
          </div>
        </div>

        {/* ── Mecanismos ─────────────────────────────────────────────────── */}
        <div id="como-operan" className="scroll-mt-20">
          <h2 className="text-lg font-bold pb-2 mb-4" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
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
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderLeft: "4px solid #DC2626",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{m.icono}</span>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    {m.numero}
                  </span>
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
        </div>

        {/* ── Map ────────────────────────────────────────────────────────── */}
        <div id="mapa" className="scroll-mt-20 mb-10">
          <h2 className="text-lg font-bold pb-2 mb-4" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
            Mapa de riesgo por departamento
          </h2>
          <div
            className="rounded-xl px-4 pt-4 pb-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <ColombiaMap />
          </div>
        </div>

        {/* ── Hallazgo crítico ───────────────────────────────────────────── */}
        <div className="mb-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
            Análisis cruzado
          </p>
        </div>

        <h2 className="text-lg font-bold pb-2 mb-4" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
          Hallazgo crítico — Suroccidente colombiano
        </h2>

        <div className="rounded-xl px-6 py-5 mb-6" style={{ backgroundColor: "#FEF2F2", border: "2px solid #DC2626" }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚩</span>
            <div>
              <h3 className="text-base font-extrabold mb-2" style={{ color: "#991B1B" }}>
                10 municipios de Nariño y Cauca con &gt;50% para un solo partido
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#7F1D1D" }}>
                Un análisis cruzado de los resultados del escrutinio oficial de la Registraduría Nacional
                (99.8% de precisión histórica) con las alertas de la Defensoría del Pueblo (ATE 013-2025)
                identificó 10 municipios del Suroccidente en los que el partido ganador superó el{" "}
                <strong>50% de los votos al Senado</strong>, coincidiendo todos con alerta máxima de
                seguridad electoral.
              </p>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "#7F1D1D" }}>
                En democracias competitivas, mayorías absolutas para un solo partido son estadísticamente
                inusuales. Cuando ocurren en zonas donde grupos armados vetan candidaturas y regulan
                campañas, sugieren que{" "}
                <strong>el pluralismo político ha sido efectivamente suprimido</strong> — no
                necesariamente a través del escrutinio, sino en las condiciones previas al voto.
              </p>
              <p className="text-xs" style={{ color: "#991B1B", opacity: 0.8 }}>
                Los 10 municipios se presentan como zona del Suroccidente hasta confirmar la lista oficial
                publicada en fuente abierta verificable (Registraduría / Defensoría).
              </p>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="rounded-xl px-5 py-5 mb-10" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
            Distribución de 1er lugar al Senado en los 69 municipios de riesgo crítico
          </h3>
          <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
            Partido que obtuvo más votos al Senado en cada municipio de riesgo crítico (legislativas 8 mar 2026)
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--muted)", opacity: 0.7 }}>
            Fuente: Registraduría Nacional (escrutinio oficial) / Defensoría ATE 013-2025
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={PARTIDOS_DISTRIBUCION} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="partido"
                width={175}
                tick={{ fontSize: 11, fill: "#6B6B6B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v, _name, props) => {
                  const pct = (props as { payload?: { pct?: number } }).payload?.pct;
                  return [`${v} municipios${pct !== undefined ? ` (${pct}%)` : ""}`];
                }}
                contentStyle={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: 8, backgroundColor: "var(--surface)" }}
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

        {/* ── Municipios ─────────────────────────────────────────────────── */}
        <div id="municipios" className="scroll-mt-20">
          <h2 className="text-lg font-bold pb-2 mb-1" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
            Municipios por departamento
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            Fuente: Defensoría ATE 013-2025 + IS 003-2026 y Mapa de Riesgo 2026 (MOE).
            Ordenados por número de municipios en acción inmediata.
          </p>

          {/* Search */}
          <input
            type="text"
            placeholder="Buscar departamento o municipio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(NIVEL_STYLE).map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: v.bg, color: v.color, border: `1px solid ${v.color}30` }}
              >
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: v.color }} />
                {v.label}
              </span>
            ))}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: "#F5F3FF", color: "#7C3AED", border: "1px solid #7C3AED30" }}
            >
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "#7C3AED" }} />
              Riesgo extremo MOE
            </span>
          </div>

          <div className="flex flex-col gap-2 mb-10">
            {filteredGrouped.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
                No se encontraron resultados para &ldquo;{search}&rdquo;
              </p>
            )}
            {filteredGrouped.map(([depto, muns]) => {
              const isOpen = openDepto === depto || !!q;
              const nImm = muns.filter((m) => m.nivel_defensoria === "accion_inmediata").length;
              const nUrg = muns.filter((m) => m.nivel_defensoria === "accion_urgente").length;
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
                    onClick={() => !q && setOpenDepto((p) => p === depto ? null : depto)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:-translate-y-0.5"
                    style={{
                      backgroundColor: isOpen ? "color-mix(in srgb, #DC2626 5%, transparent)" : "transparent",
                      cursor: q ? "default" : "pointer",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: isOpen ? "#DC2626" : "var(--foreground)" }}>
                        {depto}
                      </span>
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                        {muns.length} municipio{muns.length !== 1 ? "s" : ""}
                      </span>
                      {nImm > 0 && (
                        <span className="flex-shrink-0 hidden sm:inline rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #DC262630" }}>
                          {nImm} acción inmediata
                        </span>
                      )}
                      {nUrg > 0 && nImm === 0 && (
                        <span className="flex-shrink-0 hidden sm:inline rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#FFF7ED", color: "#EA580C", border: "1px solid #EA580C30" }}>
                          {nUrg} acción urgente
                        </span>
                      )}
                    </div>
                    {!q && (
                      <span
                        className="text-base font-bold flex-shrink-0 transition-transform duration-200"
                        style={{ color: "var(--muted)", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      >
                        +
                      </span>
                    )}
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{ maxHeight: isOpen ? "1200px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="px-5 pb-4 flex flex-col gap-2">
                      {muns.map((m) => {
                        const ns = NIVEL_STYLE[m.nivel_defensoria];
                        const isMoeExtreme = m.nivel_moe === "extremo" || m.nivel_moe === "extremo_violencia";
                        return (
                          <div key={m.municipio} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: ns.bg, border: `1px solid ${ns.color}20` }}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{m.municipio}</span>
                              <span className="rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "white", color: ns.color, border: `1px solid ${ns.color}40` }}>
                                {ns.label}
                              </span>
                              {isMoeExtreme && (
                                <span className="rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED", border: "1px solid #7C3AED40" }}>
                                  Extremo MOE
                                </span>
                              )}
                              {m.grupos_armados.map((g) => (
                                <span key={g} className="rounded-full px-2 py-0.5 text-xs whitespace-nowrap" style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                                  {g}
                                </span>
                              ))}
                            </div>
                            {m.nota && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{m.nota}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Jornada 8 marzo — timeline ─────────────────────────────────── */}
        <div id="jornada" className="scroll-mt-20">
          <h2 className="text-lg font-bold pb-2 mb-4" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
            Jornada electoral — 8 de marzo de 2026
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Incidentes documentados durante las elecciones legislativas:
          </p>

          <div className="relative mb-10">
            {/* Vertical line */}
            <div
              className="absolute top-2 bottom-2 w-0.5 ml-3"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div className="flex flex-col gap-5">
              {INCIDENTES.map((inc) => {
                const dotColor = INCIDENT_SEVERITY[inc.tipo] ?? "#6B7280";
                return (
                  <div key={inc.tipo} className="flex gap-4 items-start">
                    {/* Dot */}
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center z-10 mt-0.5"
                      style={{ backgroundColor: dotColor, border: "3px solid var(--background)" }}
                    />
                    {/* Card */}
                    <div
                      className="flex-1 rounded-xl px-4 py-3"
                      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold rounded-full px-2.5 py-0.5"
                          style={{ backgroundColor: `${dotColor}18`, color: dotColor }}
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
                      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{inc.fuente}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Candidatos — flip cards ─────────────────────────────────────── */}
        <div id="candidatos" className="scroll-mt-20">
          <h2 className="text-lg font-bold pb-2 mb-2" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
            ¿Qué proponen los candidatos?
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
            Posiciones sobre grupos armados, paz total y seguridad en territorios en conflicto.
            Pasa el cursor (o toca en móvil) para ver la postura de cada candidato.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10" style={{ alignItems: "start" }}>
            {CANDIDATOS_POSICIONES.map((c) => (
              <FlipCard key={c.id} c={c} />
            ))}
          </div>
        </div>

        {/* ── Fuentes ────────────────────────────────────────────────────── */}
        <div id="fuentes" className="scroll-mt-28">
          <h2 className="text-lg font-bold pb-2 mb-4" style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}>
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
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium" style={{ color: "var(--secondary)" }}>
                    {f.label}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{f.institucion}</span>
                    <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.5 }}>·</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{f.fecha}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBFCCB" }}
                    >
                      Fuente oficial
                    </span>
                  </div>
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--muted)" }}>↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Aviso legal ────────────────────────────────────────────────── */}
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

      {/* ── Back to top ────────────────────────────────────────────────────── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 rounded-full px-4 py-2.5 text-xs font-semibold shadow-lg transition hover:opacity-90"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          ↑ Volver arriba
        </button>
      )}
    </main>
  );
}
