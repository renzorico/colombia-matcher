"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCandidatesFull, type CandidateFull, type Controversy } from "@/lib/api";
import TopicBreakdown from "@/components/TopicBreakdown";
import EmptyState from "@/components/EmptyState";

const SPECTRUM_LABELS: Record<string, string> = {
  left: "Izquierda",
  "center-left": "Centro-izquierda",
  center: "Centro",
  "center-right": "Centro-derecha",
  right: "Derecha",
  "far-right": "Derecha radical",
};

const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  low: { label: "Baja gravedad", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  medium: { label: "Gravedad media", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  high: { label: "Alta gravedad", cls: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_LABELS: Record<string, string> = {
  acquitted: "Absuelto/a",
  pending: "Pendiente",
  ongoing: "En curso",
  closed: "Cerrado",
  convicted: "Condenado/a",
  active: "Activo",
};

const PROCURADURIA_LABELS: Record<string, { label: string; cls: string }> = {
  clean: { label: "Sin sanciones activas", cls: "text-green-700 bg-green-50" },
  investigated: { label: "Investigado/a", cls: "text-orange-700 bg-orange-50" },
  sanctioned: { label: "Sancionado/a", cls: "text-red-700 bg-red-50" },
};

function ControversyCard({ c }: { c: Controversy }) {
  const sev = SEVERITY_LABELS[c.severity] ?? {
    label: c.severity,
    cls: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const status = STATUS_LABELS[c.status] ?? c.status;

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sev.cls}`}
        >
          {sev.label}
        </span>
        <span className="text-xs text-gray-400">{status}{c.date ? ` · ${c.date}` : ""}</span>
      </div>
      <h4 className="mt-2 text-sm font-semibold text-gray-800">{c.title}</h4>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{c.summary}</p>
    </div>
  );
}

export default function CandidatoDetailPage() {
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
        <p className="text-gray-500">Cargando perfil...</p>
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

  const procLabel = candidate.procuraduria_status
    ? (PROCURADURIA_LABELS[candidate.procuraduria_status] ?? {
        label: candidate.procuraduria_status,
        cls: "text-gray-700 bg-gray-50",
      })
    : null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* ── Back link ───────────────────────────────────────────────────── */}
        <Link
          href="/candidatos"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Todos los candidatos
        </Link>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{candidate.name}</h1>
            {candidate.spectrum && (
              <span className="flex-shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {SPECTRUM_LABELS[candidate.spectrum] ?? candidate.spectrum}
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-500">
            {candidate.party ?? "Sin partido registrado"}
            {candidate.coalition ? ` · Coalición: ${candidate.coalition}` : ""}
          </p>
          {candidate.short_bio && (
            <p className="mt-3 text-gray-700 leading-relaxed">
              {candidate.short_bio}
            </p>
          )}
        </div>

        {/* ── Procuraduría status ─────────────────────────────────────────── */}
        {procLabel && (
          <div className={`mt-5 rounded-xl px-4 py-3 ${procLabel.cls}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Estado Procuraduría
            </p>
            <p className="mt-0.5 text-sm font-medium">{procLabel.label}</p>
            {candidate.procuraduria_summary && (
              <p className="mt-1 text-sm opacity-80 leading-relaxed">
                {candidate.procuraduria_summary}
              </p>
            )}
          </div>
        )}

        {/* ── Topics ──────────────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Posiciones por tema</h2>
          <TopicBreakdown topics={candidate.topics} />
        </section>

        {/* ── Proposals ───────────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Propuestas</h2>
          {candidate.proposals.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="flex flex-col gap-2">
              {candidate.proposals.map((p, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700"
                >
                  {String(p)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Controversies ───────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Controversias</h2>
          {candidate.controversies.length === 0 ? (
            <EmptyState message="No se registran controversias documentadas." />
          ) : (
            <div className="flex flex-col gap-3">
              {candidate.controversies.map((c) => (
                <ControversyCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>

        {/* ── Data footer ─────────────────────────────────────────────────── */}
        <div className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-400 flex flex-col gap-1">
          <span>
            Estado del perfil:{" "}
            <span className="font-medium">
              {candidate.profile_status === "curated_static"
                ? "Información curada manualmente"
                : (candidate.profile_status ?? "—")}
            </span>
          </span>
          {candidate.last_updated && (
            <span>Última actualización: {candidate.last_updated}</span>
          )}
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
