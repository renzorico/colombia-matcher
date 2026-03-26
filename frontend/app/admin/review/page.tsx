"use client";

// DEV ONLY — Admin review dashboard for the candidate-update proposal workflow.
// Shows pending proposals from the backend and the review log.
// This page is not linked from public nav and is intended for local use only.

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import {
  getAllProposals,
  getReviewLog,
  type ProposedUpdate,
  type ReviewDecision,
} from "@/lib/api";

// In production builds this component still ships, but we gate rendering
// so the page immediately returns 404 when not in dev mode.
const IS_DEV = process.env.NODE_ENV === "development";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200">
        <div
          className={`h-1.5 rounded-full ${pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 tabular-nums">{pct}%</span>
    </div>
  );
}

export default function AdminReviewPage() {
  if (!IS_DEV) {
    notFound();
  }

  const [proposals, setProposals] = useState<ProposedUpdate[]>([]);
  const [log, setLog] = useState<ReviewDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "log">("pending");

  useEffect(() => {
    Promise.all([getAllProposals(), getReviewLog()])
      .then(([p, l]) => {
        setProposals(p);
        setLog(l);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar datos de revisión.");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-400 font-mono text-sm">Cargando propuestas...</p>
      </main>
    );

  if (error)
    return (
      <main className="flex flex-1 items-center justify-center flex-col gap-2">
        <p className="text-red-500 font-mono text-sm">{error}</p>
        <p className="text-gray-400 text-xs">Asegúrate de que el backend esté activo.</p>
      </main>
    );

  const pending = proposals.filter((p) => p.status === "pending");
  const logById: Record<string, ReviewDecision> = {};
  for (const r of log) logById[r.proposal_id] = r;

  const displayProposals =
    activeTab === "pending" ? pending : proposals;

  return (
    <main className="flex flex-1 flex-col px-4 py-8">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold font-mono">Admin · Revisión de propuestas</h1>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
            DEV ONLY
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Propuestas de actualización generadas por el agente investigador.
          Para aprobar o rechazar, edita manualmente{" "}
          <code className="bg-gray-100 px-1 rounded">backend/data/proposed_updates.json</code>{" "}
          y{" "}
          <code className="bg-gray-100 px-1 rounded">backend/data/review_log.json</code>.
        </p>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pendientes", value: pending.length, color: "text-amber-700" },
            {
              label: "Aprobadas",
              value: proposals.filter((p) => p.status === "approved").length,
              color: "text-green-700",
            },
            {
              label: "Rechazadas",
              value: proposals.filter((p) => p.status === "rejected").length,
              color: "text-red-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 p-4 text-center"
            >
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b border-gray-200 pb-2">
          {(["pending", "all", "log"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm rounded-full font-medium transition ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab === "pending" ? `Pendientes (${pending.length})` : tab === "all" ? `Todas (${proposals.length})` : `Log (${log.length})`}
            </button>
          ))}
        </div>

        {/* Proposals table */}
        {activeTab !== "log" ? (
          displayProposals.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">
              No hay propuestas en esta vista.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {displayProposals.map((p) => {
                const decision = logById[p.id];
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-400">{p.id}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status]}`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold">
                          {p.candidate_id} · {p.topic_id} · <span className="font-mono text-sm">{p.field}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {String(p.current_value ?? "null")} → {String(p.proposed_value)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">Confianza del agente</p>
                        <div className="w-32 mt-1">
                          <ConfidenceBar value={p.agent_confidence} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(p.proposed_at).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                    </div>

                    {p.proposed_plain_language_summary && (
                      <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 leading-relaxed">
                        {p.proposed_plain_language_summary}
                      </div>
                    )}

                    {p.agent_notes && (
                      <p className="mt-2 text-xs text-amber-700 italic">
                        Nota del agente: {p.agent_notes}
                      </p>
                    )}

                    {p.evidence.url && (
                      <a
                        href={p.evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-xs text-blue-600 hover:underline truncate"
                      >
                        Evidencia: {p.evidence.title ?? p.evidence.url}
                      </a>
                    )}

                    {decision && (
                      <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                        decision.decision === "approved"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}>
                        <span className="font-semibold">
                          {decision.decision === "approved" ? "Aprobado" : "Rechazado"}{" "}
                          por {decision.reviewer ?? "?"}
                        </span>
                        {decision.notes && <> — {decision.notes}</>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Review log */
          <div className="flex flex-col gap-3">
            {log.map((r) => {
              const proposal = proposals.find((p) => p.id === r.proposal_id);
              return (
                <div key={r.id} className="rounded-xl border border-gray-200 p-4 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{r.id}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.decision]}`}
                    >
                      {r.decision}
                    </span>
                    {proposal && (
                      <span className="text-gray-500">
                        {proposal.candidate_id} · {proposal.topic_id}
                      </span>
                    )}
                  </div>
                  {r.notes && (
                    <p className="mt-2 text-gray-600 leading-relaxed">{r.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {r.reviewer ?? "—"} ·{" "}
                    {r.reviewed_at
                      ? new Date(r.reviewed_at).toLocaleDateString("es-CO")
                      : "sin fecha"}{" "}
                    · {r.will_publish ? "publicará" : "no publicará"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
