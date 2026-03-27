"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getCandidatesFull,
  type CandidateFull,
  type Controversy,
  type Source,
} from "@/lib/api";
import TopicRadialChart from "@/components/TopicRadialChart";
import SourceList from "@/components/SourceList";
import EmptyState from "@/components/EmptyState";
import { SpectrumBar } from "@/components/SpectrumBar";
import { TOPIC_COLORS } from "@/lib/topics";

// ---------------------------------------------------------------------------
// Candidate ordering for prev/next navigation
// ---------------------------------------------------------------------------

const CANDIDATE_ORDER = [
  { id: "ivan-cepeda",                name: "Iván Cepeda" },
  { id: "abelardo-de-la-espriella",   name: "Abelardo de la Espriella" },
  { id: "sergio-fajardo",             name: "Sergio Fajardo" },
  { id: "paloma-valencia",            name: "Paloma Valencia" },
  { id: "roy-barreras",               name: "Roy Barreras" },
  { id: "claudia-lopez",              name: "Claudia López" },
];

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const SPECTRUM_LABELS: Record<string, string> = {
  left: "Izquierda",
  "center-left": "Centro-izquierda",
  center: "Centro",
  "center-right": "Centro-derecha",
  right: "Derecha",
  "far-right": "Derecha radical",
};

const TOPIC_LABELS: Record<string, string> = {
  security:           "Seguridad",
  economy:            "Economía",
  health:             "Salud",
  energy_environment: "Energía y Medio Ambiente",
  fiscal:             "Política Fiscal",
  foreign_policy:     "Política Exterior",
  anticorruption:     "Anticorrupción",
};

const SEVERITY_LABELS: Record<string, { label: string; cls: string; borderColor: string }> = {
  low:    { label: "Baja",  cls: "bg-gray-50 text-gray-600 border-gray-200",    borderColor: "#6B6B6B" },
  medium: { label: "Media", cls: "bg-orange-50 text-orange-700 border-orange-200", borderColor: "#D4813A" },
  high:   { label: "Alta",  cls: "bg-red-50 text-red-700 border-red-200",       borderColor: "#C4622D" },
};

const CONTROVERSY_STATUS_LABELS: Record<string, string> = {
  acquitted: "Absuelto/a",
  pending:   "Pendiente",
  ongoing:   "En curso",
  closed:    "Cerrado",
  convicted: "Condenado/a",
  active:    "Activo",
  resolved:  "Resuelto",
  past:      "Pasado",
};

const PROCURADURIA_LABELS: Record<string, { label: string; cls: string }> = {
  clean:       { label: "Sin sanciones activas", cls: "text-green-700 bg-green-50 border-green-200" },
  flagged:     { label: "⚠ Con anotaciones", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  investigated: { label: "Investigado/a", cls: "text-orange-700 bg-orange-50 border-orange-200" },
  under_investigation: { label: "Bajo investigación", cls: "text-orange-700 bg-orange-50 border-orange-200" },
  sanctioned:  { label: "Sancionado/a", cls: "text-red-700 bg-red-50 border-red-200" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateES(iso: string): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  // Handle partial dates like "2026-03" or "2026"
  const parts = iso.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`;
  }
  if (parts.length === 2) {
    const [y, m] = parts;
    return `${months[parseInt(m) - 1]} de ${y}`;
  }
  return iso;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-bold mb-3 pb-2"
      style={{ color: "var(--foreground)", borderBottom: "2px solid var(--primary)" }}
    >
      {children}
    </h2>
  );
}

function ControversyCard({ c, sourceMap }: { c: Controversy; sourceMap: Map<string, Source> }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_LABELS[c.severity] ?? {
    label: c.severity,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    borderColor: "#6B6B6B",
  };
  const status = CONTROVERSY_STATUS_LABELS[c.status] ?? c.status;
  const contSources = (c.source_ids ?? [])
    .map((id) => sourceMap.get(id))
    .filter((s): s is Source => s !== undefined);

  return (
    <div
      className="rounded-xl"
      style={{
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${sev.borderColor}`,
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-left"
      >
        <span
          className="flex-shrink-0 text-gray-400 text-sm transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
        <h4 className="text-sm font-semibold text-gray-800 flex-1 min-w-0">{c.title}</h4>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${sev.cls}`}>
          {sev.label}
        </span>
        {c.date && (
          <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
            {formatDateES(c.date)}
          </span>
        )}
      </button>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs text-gray-400">
              Gravedad {sev.label} · {status}
              {c.date ? ` · ${formatDateES(c.date)}` : ""}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{c.summary}</p>

          {c.notes && (
            <p className="mt-2 text-xs text-gray-400 italic leading-relaxed">{c.notes}</p>
          )}

          {contSources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {contSources.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  {s.publisher ?? s.title ?? s.url}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CandidatoDetail() {
  const params = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCandidatesFull()
      .then((all) => {
        const found = all.find((c) => c.id === params.id) ?? null;
        if (!found) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setCandidate(found);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar candidato.");
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">Cargando perfil...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Candidato no encontrado
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          El perfil que buscas no existe o la URL es incorrecta.
        </p>
        <Link
          href="/candidatos"
          className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
        >
          Ver todos los candidatos
        </Link>
      </main>
    );
  }

  if (error || !candidate) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600">{error ?? "Error al cargar el candidato."}</p>
        <Link href="/candidatos" className="text-sm hover:underline" style={{ color: "var(--secondary)" }}>
          Ver todos los candidatos
        </Link>
      </main>
    );
  }

  // Build a fast source lookup map for resolving source_ids in proposals/controversies
  const sourceMap = new Map<string, Source>(
    candidate.sources.map((s) => [s.id, s])
  );

  const procLabel = candidate.procuraduria_status
    ? (PROCURADURIA_LABELS[candidate.procuraduria_status] ?? {
        label: candidate.procuraduria_status,
        cls: "text-gray-700 bg-gray-50 border-gray-200",
      })
    : null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <Link
          href="/candidatos"
          className="text-sm transition"
          style={{ color: "var(--secondary)" }}
        >
          ← Todos los candidatos
        </Link>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mt-5 flex items-start gap-5">
          {/* Photo */}
          {candidate.image_url ? (
            <Image
              src={candidate.image_url}
              alt={candidate.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
              style={{ border: "2px solid var(--border)" }}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=6B6B6B&color=fff&size=200`; }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              {candidate.name.charAt(0)}
            </div>
          )}

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {candidate.name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {candidate.party ?? "Sin partido registrado"}
              {candidate.coalition ? ` · Coalición: ${candidate.coalition}` : ""}
            </p>
            {candidate.spectrum && (
              <div className="mt-2">
                <SpectrumBar spectrum={candidate.spectrum} />
              </div>
            )}
            {candidate.last_updated && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
                Actualizado al {formatDateES(candidate.last_updated)}
              </p>
            )}
          </div>
        </div>

        {candidate.short_bio && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {candidate.short_bio}
          </p>
        )}

        {/* ── Procuraduria ────────────────────────────────────────────────── */}
        {procLabel && (
          <div className={`mt-5 rounded-xl border px-4 py-3 ${procLabel.cls}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
              Estado Procuraduría
            </p>
            <p className="mt-0.5 text-sm font-semibold">{procLabel.label}</p>
            {candidate.procuraduria_summary && (
              <p className="mt-1.5 text-sm opacity-80 leading-relaxed">
                {candidate.procuraduria_summary}
              </p>
            )}
          </div>
        )}

        {/* ── Topics ──────────────────────────────────────────────────────── */}
        <section className="mt-8">
          <SectionHeading>Posiciones por tema</SectionHeading>
          <TopicRadialChart topics={candidate.topics} />
        </section>

        {/* ── Controversies ───────────────────────────────────────────────── */}
        <section className="mt-8">
          <SectionHeading>Controversias y antecedentes</SectionHeading>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Esta sección recoge hechos documentados y cubiertos por medios de comunicación.
            No constituye un juicio de culpabilidad.
          </p>
          {candidate.controversies.length === 0 ? (
            <EmptyState message="No se han documentado controversias relevantes para este candidato en las fuentes consultadas." />
          ) : (
            <div className="flex flex-col gap-3">
              {candidate.controversies.map((c) => (
                <ControversyCard key={c.id} c={c} sourceMap={sourceMap} />
              ))}
            </div>
          )}
        </section>

        {/* ── Sources ─────────────────────────────────────────────────────── */}
        <section className="mt-8">
          <SectionHeading>Fuentes consultadas</SectionHeading>
          <p className="text-xs text-gray-400 mb-3">
            Las posturas, propuestas y antecedentes de este perfil se basan en las
            siguientes fuentes públicas verificables.
          </p>
          <SourceList sources={candidate.sources ?? []} />
        </section>

        {/* ── Data provenance ─────────────────────────────────────────────── */}
        <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500 flex flex-col gap-1.5">
          <p className="font-semibold text-gray-600 text-sm">Nota de transparencia</p>
          <p>
            Estado del perfil:{" "}
            <span className="font-medium">
              {candidate.profile_status === "curated_static"
                ? "Información curada manualmente"
                : candidate.profile_status === "unknown"
                ? "Desconocido"
                : (candidate.profile_status ?? "—")}
            </span>
          </p>
          {candidate.last_updated && (
            <p>Última actualización: {formatDateES(candidate.last_updated)}</p>
          )}
          <p className="italic mt-1">
            Esta herramienta es informativa. Consulta siempre los programas y declaraciones
            oficiales de cada candidato antes de tomar decisiones electorales.
          </p>
        </div>

        {/* ── Prev / Next navigation ──────────────────────────────────────── */}
        {(() => {
          const idx = CANDIDATE_ORDER.findIndex((c) => c.id === params.id);
          const prev = idx > 0 ? CANDIDATE_ORDER[idx - 1] : null;
          const next = idx < CANDIDATE_ORDER.length - 1 ? CANDIDATE_ORDER[idx + 1] : null;
          return (
            <div className="mt-10 flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: "var(--border)" }}>
              {prev ? (
                <Link
                  href={`/candidatos/${prev.id}`}
                  className="flex flex-col text-sm transition"
                  style={{ color: "var(--secondary)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted)" }}>← Anterior</span>
                  <span className="font-medium">{prev.name}</span>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  href={`/candidatos/${next.id}`}
                  className="flex flex-col text-right text-sm transition"
                  style={{ color: "var(--secondary)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted)" }}>Siguiente →</span>
                  <span className="font-medium">{next.name}</span>
                </Link>
              ) : <div />}
            </div>
          );
        })()}

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/quiz"
            className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Ver tu afinidad con este candidato
          </Link>
        </div>

      </div>
    </main>
  );
}
