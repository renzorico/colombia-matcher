"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCandidatesFull,
  type CandidateFull,
  type Controversy,
  type Proposal,
  type Source,
} from "@/lib/api";
import TopicRadialChart from "@/components/TopicRadialChart";
import SourceList from "@/components/SourceList";
import EmptyState from "@/components/EmptyState";
import { SpectrumBar } from "@/components/SpectrumBar";
import { TOPIC_COLORS } from "@/lib/topics";

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

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  proposed: "Propuesto",
  debate:   "En debate",
  approved: "Aprobado",
};

const PROCURADURIA_LABELS: Record<string, { label: string; cls: string }> = {
  clean:       { label: "Sin sanciones activas", cls: "text-green-700 bg-green-50 border-green-200" },
  investigated: { label: "Investigado/a", cls: "text-orange-700 bg-orange-50 border-orange-200" },
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

function ProposalCard({ p, sourceMap }: { p: Proposal; sourceMap: Map<string, Source> }) {
  const topicLabel = TOPIC_LABELS[p.topic_id] ?? p.topic_id;
  const statusLabel = PROPOSAL_STATUS_LABELS[p.status] ?? p.status;
  const propSources = p.source_ids
    .map((id) => sourceMap.get(id))
    .filter((s): s is Source => s !== undefined);
  const topicColor = TOPIC_COLORS[p.topic_id] ?? "#4A4A4A";

  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${topicColor}`,
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="flex items-start gap-2 flex-wrap justify-between">
        <div className="flex gap-2 flex-wrap">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {topicLabel}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
            {statusLabel}
          </span>
        </div>
      </div>

      <h4 className="mt-2 text-sm font-semibold text-gray-800">{p.title}</h4>

      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
        {p.plain_language_summary}
      </p>

      {p.summary && p.summary !== p.plain_language_summary && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 select-none">
            Leer más
          </summary>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{p.summary}</p>
        </details>
      )}

      {propSources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {propSources.map((s) => (
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
  );
}

function ControversyCard({ c, sourceMap }: { c: Controversy; sourceMap: Map<string, Source> }) {
  const sev = SEVERITY_LABELS[c.severity] ?? {
    label: c.severity,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const status = CONTROVERSY_STATUS_LABELS[c.status] ?? c.status;
  const contSources = (c.source_ids ?? [])
    .map((id) => sourceMap.get(id))
    .filter((s): s is Source => s !== undefined);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${sev.borderColor}`,
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${sev.cls}`}>
          Gravedad {sev.label}
        </span>
        <span className="text-xs text-gray-400">
          {status}
          {c.date ? ` · ${formatDateES(c.date)}` : ""}
        </span>
      </div>

      <h4 className="mt-2 text-sm font-semibold text-gray-800">{c.title}</h4>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{c.summary}</p>

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
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CandidatoDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCandidatesFull()
      .then((all) => {
        const found = all.find((c) => c.id === params.id) ?? null;
        if (!found) {
          router.replace("/candidatos");
          return;
        }
        setCandidate(found);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar candidato.");
        setLoading(false);
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">Cargando perfil...</p>
      </main>
    );
  }

  if (error || !candidate) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600">{error ?? "Candidato no encontrado."}</p>
        <Link href="/candidatos" className="text-sm text-blue-600 hover:underline">
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
            <img
              src={candidate.image_url}
              alt={candidate.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
              style={{ border: "2px solid var(--border)" }}
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=6B6B6B&color=fff&size=200`; }}
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

        {/* ── Proposals ───────────────────────────────────────────────────── */}
        <section className="mt-8">
          <SectionHeading>Propuestas de campaña</SectionHeading>
          {candidate.proposals.length === 0 ? (
            <EmptyState message="No se han documentado propuestas para este candidato en las fuentes consultadas." />
          ) : (
            <div className="flex flex-col gap-3">
              {candidate.proposals.map((p) => (
                <ProposalCard key={p.id} p={p} sourceMap={sourceMap} />
              ))}
            </div>
          )}
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

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/quiz"
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Ver tu afinidad con este candidato
          </Link>
        </div>

      </div>
    </main>
  );
}
