"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  STATS,
  MECANISMOS,
  INCIDENTES,
  PARTIDOS_DISTRIBUCION,
  CANDIDATOS_POSICIONES,
  FUENTES,
} from "@/lib/riesgo-electoral";

// ── Dynamic map import (SSR: false — react-simple-maps uses browser APIs) ─────
const ColombiaMap = dynamic(() => import("./ColombiaMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center rounded-xl"
      style={{
        minHeight: 480,
        backgroundColor: "var(--border)",
        opacity: 0.3,
      }}
    >
      <span className="text-sm" style={{ color: "var(--muted)" }}>Cargando mapa…</span>
    </div>
  ),
});

// ── In-page nav (item 9: "Municipios" removed; item 11: new order) ────────────
const NAV_SECTIONS = [
  { id: "cifras",       label: "Cifras clave" },
  { id: "como-operan", label: "¿Cómo operan?" },
  { id: "mapa",        label: "Mapa" },
  { id: "analisis",    label: "Análisis" },
  { id: "candidatos",  label: "Candidatos" },
  { id: "jornada",     label: "Jornada" },
  { id: "fuentes",     label: "Fuentes" },
];

// Items 5: colored badges per mechanism number
const MECANISMO_COLORS = ["#dc2626", "#ea580c", "#7c3aed"];

// Item 12: incident color map (semantic)
const INCIDENT_SEVERITY: Record<string, string> = {
  "Ataque con explosivos":            "#DC2626",
  "Trashumancia electoral":           "#EA580C",
  "Traslado de puestos":              "#EA580C",
  "Operaciones preventivas":          "#2563EB",
  "Capturas por delitos electorales": "#2563EB",
  "Incidentes totales":               "#6B7280",
};

const SECTION_BORDER = "2px solid var(--primary)";
// Shared scroll-margin so sections clear both sticky headers (item 1)
const SCROLL_MT: React.CSSProperties = { scrollMarginTop: "110px" };

// ── Animated stat counter ─────────────────────────────────────────────────────

function useCountUp(target: number, triggered: boolean, duration = 1200): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!triggered) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      if (t >= 1) { setCount(target); return; }
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [triggered, target, duration]);
  return count;
}

// ── Stat card (item 4: centered, hover effect) ────────────────────────────────

interface StatCardProps { value: string; label: string; sub: string; color: string }

function StatCard({ value, label, sub, color }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible]   = useState(false);
  const [hovered, setHovered]   = useState(false);

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
  const isCountable   = numericTarget !== null && !value.includes(".");
  const counted       = useCountUp(isCountable ? (numericTarget ?? 0) : 0, visible);

  const displayValue = () => {
    if (!isCountable)                 return value;
    if (!visible || counted === 0)    return value;
    const prefix = value.startsWith("+") ? "+" : "";
    const suffix = value.endsWith("%") ? "%" : value.endsWith("M") ? "M" : "";
    return `${prefix}${counted}${suffix}`;
  };

  return (
    <div
      ref={ref}
      className="rounded-xl px-4 py-4 flex flex-col items-center gap-1 cursor-default"
      style={{
        backgroundColor: hovered ? "#fafafa" : "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        textAlign: "center",
        transition: "opacity 500ms, transform 500ms, background 200ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

// ── Nav pill (item 2: hover states) ──────────────────────────────────────────

function NavPill({
  label, isActive, onClick,
}: { label: string; isActive: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer"
      style={{
        backgroundColor: isActive
          ? hovered ? "#c9a800" : "var(--primary)"
          : hovered ? "#f3f4f6" : "var(--surface)",
        color: isActive ? "#1A1A1A" : hovered ? "#374151" : "var(--muted)",
        border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
        transition: "background 150ms ease, color 150ms ease",
      }}
    >
      {label}
    </button>
  );
}

// ── Stacked proportional bar (item 8) ─────────────────────────────────────────

interface BarTooltip { idx: number; x: number; y: number }

function StackedProportionalBar() {
  const [tt, setTt] = useState<BarTooltip | null>(null);
  const total = PARTIDOS_DISTRIBUCION.reduce((s, d) => s + d.municipios, 0);

  return (
    <div>
      {/* Bar */}
      <div className="flex w-full rounded-lg overflow-hidden" style={{ height: 40 }}>
        {PARTIDOS_DISTRIBUCION.map((d, i) => (
          <div
            key={d.partido}
            className="transition-opacity duration-150"
            style={{
              width: `${(d.municipios / total) * 100}%`,
              backgroundColor: d.color,
              cursor: "pointer",
              opacity: tt !== null && tt.idx !== i ? 0.55 : 1,
            }}
            onMouseEnter={(e) => setTt({ idx: i, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setTt(null)}
            onMouseMove={(e) => setTt((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
          />
        ))}
      </div>

      {/* Tooltip */}
      {tt !== null && (
        <div
          className="pointer-events-none fixed rounded-lg px-3 py-2 shadow-lg text-xs z-50"
          style={{
            left: tt.x + 12,
            top: tt.y - 56,
            backgroundColor: "#1A1A1A",
            color: "#FAFAF7",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="font-bold mb-0.5">{PARTIDOS_DISTRIBUCION[tt.idx].partido}</p>
          <p style={{ color: "#D1D5DB" }}>
            {PARTIDOS_DISTRIBUCION[tt.idx].municipios} municipios · {PARTIDOS_DISTRIBUCION[tt.idx].pct}%
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {PARTIDOS_DISTRIBUCION.map((d) => (
          <span key={d.partido} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#6B6B6B" }}>
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            {d.partido} ({d.municipios})
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Candidate flip card (item 13: 200px image height, object-position) ────────

interface FlipCardProps { c: (typeof CANDIDATOS_POSICIONES)[number] }

function FlipCard({ c }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ perspective: "1000px", height: 285, minHeight: 285 }}
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
          {/* Photo: 200px, showing upper body not just face */}
          <div className="relative overflow-hidden bg-gray-100" style={{ flexShrink: 0, height: 200 }}>
            <Image
              src={c.foto}
              alt={c.nombre}
              fill
              className="object-cover"
              style={{ objectPosition: "center 15%" }}
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
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Ver posiciones →</p>
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
            <p className="text-xs font-bold" style={{ color: c.espectroColor }}>{c.nombre}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{c.partido}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Grupos armados</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{c.postura}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Paz total</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{c.pazTotal}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Propuesta clave</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{c.propuestaClave}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiesgosElectoralesPage() {
  const [activeSection, setActiveSection]   = useState("cifras");
  const [showBackToTop, setShowBackToTop]   = useState(false);
  const [hallazgoExpanded, setHallazgoExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Back-to-top tracking
  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Scroll-spy (topmost-wins)
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

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-3xl">

        {/* ── Hero (item 3: no outer card, left-bordered nota) ───────────── */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-4">
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
                Los datos de riesgo se basan en alertas emitidas antes de las legislativas del 8 de marzo de 2026
                y aplican igualmente a la primera vuelta presidencial de mayo 2026.
              </p>
            </div>
          </div>
          {/* Nota editorial — left-bordered callout */}
          <div
            style={{
              borderLeft: "4px solid #eab308",
              backgroundColor: "#fefce8",
              paddingLeft: 12,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#92400e" }}>
              NOTA EDITORIAL
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
              Esta página presenta información de fuentes institucionales del Estado colombiano. La correlación entre
              presencia de grupos armados y resultados electorales no equivale a fraude en el escrutinio — documenta
              condiciones estructurales que limitan el pluralismo político y la libre competencia electoral.
            </p>
          </div>
        </div>

        {/* ── Sticky in-page nav (item 1: top:48px below main header; item 2: hover) */}
        <div
          className="sticky z-[9] -mx-4 mb-8"
          style={{
            top: 48,
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
                {NAV_SECTIONS.map(({ id, label }) => (
                  <NavPill
                    key={id}
                    label={label}
                    isActive={activeSection === id}
                    onClick={() => scrollTo(id)}
                  />
                ))}
              </div>
            </div>
            {/* Right gradient fade (mobile scrollability hint) */}
            <div
              className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent, var(--background))" }}
            />
          </div>
        </div>

        {/* ── Cifras clave ───────────────────────────────────────────────── */}
        <div id="cifras" style={SCROLL_MT}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-10">
            {STATS.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} sub={s.sub} color={s.color} />
            ))}
          </div>
        </div>

        {/* ── ¿Cómo operan los riesgos? (item 5: no emoji, colored badges, justified) */}
        <div id="como-operan" style={SCROLL_MT}>
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
            {MECANISMOS.map((m, i) => {
              const badgeColor = MECANISMO_COLORS[i] ?? "#DC2626";
              return (
                <div
                  key={m.numero}
                  className="rounded-xl px-5 py-5"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: `4px solid ${badgeColor}`,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                      style={{ backgroundColor: badgeColor }}
                    >
                      {m.numero}
                    </span>
                    <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                      {m.titulo}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)", textAlign: "justify" }}>
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mapa ───────────────────────────────────────────────────────── */}
        <div id="mapa" style={SCROLL_MT} className="mb-10">
          <h2
            className="text-lg font-bold pb-2 mb-4"
            style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
          >
            Mapa de riesgo por departamento
          </h2>
          <div
            className="rounded-xl px-4 pt-4 pb-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <ColombiaMap />
          </div>
        </div>

        {/* ── Análisis / Hallazgo crítico (item 7: collapsible; item 8: stacked bar) */}
        <div id="analisis" style={SCROLL_MT}>
          <div className="mb-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
              Análisis cruzado
            </p>
          </div>

          <h2
            className="text-lg font-bold pb-2 mb-4"
            style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
          >
            Hallazgo crítico — Suroccidente colombiano
          </h2>

          {/* Collapsible card */}
          <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: "#FEF2F2", border: "2px solid #DC2626" }}>
            {/* Always visible: title + toggle */}
            <button
              className="w-full flex items-start gap-3 px-6 py-5 text-left"
              onClick={() => setHallazgoExpanded((e) => !e)}
            >
              <span className="text-2xl flex-shrink-0">🚩</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold mb-1" style={{ color: "#991B1B" }}>
                  10 municipios de Nariño y Cauca con &gt;50% para un solo partido
                </h3>
                <span className="text-xs font-semibold" style={{ color: "#DC2626" }}>
                  {hallazgoExpanded ? "▲ Ocultar análisis" : "▼ Ver análisis"}
                </span>
              </div>
            </button>

            {/* Collapsible body */}
            <div
              style={{
                overflow: "hidden",
                maxHeight: hallazgoExpanded ? "600px" : "0px",
                opacity: hallazgoExpanded ? 1 : 0,
                transition: "max-height 0.35s ease, opacity 0.25s ease",
              }}
            >
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#7F1D1D" }}>
                  Un análisis cruzado de los resultados del escrutinio oficial de la Registraduría Nacional
                  (99.8% de precisión histórica) con las alertas de la Defensoría del Pueblo (ATE 013-2025)
                  identificó 10 municipios del Suroccidente en los que el partido ganador superó el{" "}
                  <strong>50% de los votos al Senado</strong>, coincidiendo todos con alerta máxima de
                  seguridad electoral.
                </p>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#7F1D1D" }}>
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

          {/* Stacked bar chart — always visible */}
          <div className="rounded-xl px-5 py-5 mb-10" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
              Distribución de 1er lugar al Senado en los 69 municipios de riesgo crítico
            </h3>
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
              Partido con más votos al Senado en cada municipio de riesgo crítico (legislativas 8 mar 2026)
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--muted)", opacity: 0.7 }}>
              Fuente: Registraduría Nacional (escrutinio oficial) / Defensoría ATE 013-2025
            </p>
            <StackedProportionalBar />
            <p className="text-xs mt-4" style={{ color: "var(--muted)", opacity: 0.8 }}>
              Nota metodológica: ganar en más municipios de riesgo no prueba coerción — el Pacto Histórico
              tiene base electoral real en estas regiones. El indicador relevante es el subconjunto de 10
              municipios con &gt;50%, estadísticamente atípico en condiciones de pluralismo libre.
            </p>
          </div>
        </div>

        {/* ── Candidatos (item 11: before jornada) ───────────────────────── */}
        <div id="candidatos" style={SCROLL_MT}>
          <h2
            className="text-lg font-bold pb-2 mb-2"
            style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
          >
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

        {/* ── Jornada electoral (item 12: renamed, card grid) ────────────── */}
        <div id="jornada" style={SCROLL_MT}>
          <h2
            className="text-lg font-bold pb-2 mb-4"
            style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
          >
            Incidentes documentados — Legislativas 8 mar 2026
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {INCIDENTES.map((inc) => {
              const color = INCIDENT_SEVERITY[inc.tipo] ?? "#6B7280";
              return (
                <div
                  key={inc.tipo}
                  className="rounded-xl px-4 py-4 flex flex-col gap-2"
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold self-start"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {inc.tipo}
                  </span>
                  <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    {inc.lugar}
                  </p>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--foreground)" }}>
                    {inc.desc}
                  </p>
                  <p className="text-xs italic" style={{ color: "var(--muted)" }}>
                    {inc.fuente}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Fuentes (item 14: horizontal scroll card row) ──────────────── */}
        <div id="fuentes" style={SCROLL_MT}>
          <h2
            className="text-lg font-bold pb-2 mb-4"
            style={{ color: "var(--foreground)", borderBottom: SECTION_BORDER }}
          >
            Fuentes primarias
          </h2>

          <div className="relative mb-10">
            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: "thin" }}
            >
              {FUENTES.map((f) => (
                <a
                  key={f.label}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-2 rounded-xl p-4 transition hover:opacity-80 flex-shrink-0"
                  style={{
                    width: 280,
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span className="text-lg">📄</span>
                  <p
                    className="text-sm font-semibold leading-snug overflow-hidden"
                    style={{
                      color: "var(--secondary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {f.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{f.institucion}</p>
                  <div className="flex items-center gap-2 mt-auto flex-wrap">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{f.fecha}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBFCCB" }}
                    >
                      Fuente oficial
                    </span>
                    <span className="text-xs ml-auto" style={{ color: "var(--muted)" }}>↗</span>
                  </div>
                </a>
              ))}
            </div>
            {/* Right gradient fade */}
            <div
              className="absolute right-0 top-0 pointer-events-none"
              style={{
                bottom: 12,
                width: 64,
                background: "linear-gradient(to right, transparent, var(--background))",
              }}
            />
          </div>
        </div>

        {/* ── Aviso legal ────────────────────────────────────────────────── */}
        <p className="text-xs leading-relaxed mb-8" style={{ color: "var(--muted)", opacity: 0.7 }}>
          <span className="font-semibold uppercase tracking-wide">Aviso legal</span> · Herramienta informativa
          independiente. No afiliada a ningún candidato, partido o entidad gubernamental. Los datos
          provienen de fuentes institucionales públicas del Estado colombiano. Verifica siempre con
          las fuentes originales enlazadas arriba.
        </p>

        {/* ── CTAs (item 15: centered) ────────────────────────────────────── */}
        <div className="flex justify-center gap-4 flex-wrap">
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
