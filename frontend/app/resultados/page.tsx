"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  submitQuiz,
  getCandidates,
  type Result,
  type CandidateSummary,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Topic labels (canonical IDs → Spanish display names)
// ---------------------------------------------------------------------------

const TOPIC_LABELS: Record<string, string> = {
  security: "Seguridad",
  economy: "Economía",
  health: "Salud",
  energy_environment: "Energía y Medio Ambiente",
  fiscal: "Política Fiscal",
  foreign_policy: "Política Exterior",
  anticorruption: "Anticorrupción",
};

const SPECTRUM_LABELS: Record<string, string> = {
  left: "Izquierda",
  "center-left": "Centro-izquierda",
  center: "Centro",
  "center-right": "Centro-derecha",
  right: "Derecha",
  "far-right": "Derecha radical",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function alignmentChip(pct: number): { label: string; cls: string } {
  if (pct >= 67) return { label: "De acuerdo", cls: "bg-green-100 text-green-700" };
  if (pct >= 34) return { label: "Parcial", cls: "bg-gray-100 text-gray-600" };
  return { label: "En desacuerdo", cls: "bg-red-100 text-red-700" };
}

function spectrumBadge(spectrum: string | null): string {
  if (!spectrum) return "border-gray-200 text-gray-500";
  if (spectrum.startsWith("left")) return "border-red-200 text-red-700";
  if (spectrum.startsWith("center")) return "border-blue-200 text-blue-700";
  return "border-green-200 text-green-700";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResultadosPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [candidateMeta, setCandidateMeta] = useState<
    Record<string, CandidateSummary>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) {
      router.push("/quiz");
      return;
    }

    const answers = JSON.parse(stored) as Record<string, number>;
    if (Object.keys(answers).length === 0) {
      router.push("/quiz");
      return;
    }

    // Fetch quiz results + candidate metadata in parallel.
    Promise.all([submitQuiz(answers), getCandidates()])
      .then(([ranked, candidates]) => {
        setResults(ranked);
        const byId: Record<string, CandidateSummary> = {};
        for (const c of candidates) byId[c.id] = c;
        setCandidateMeta(byId);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los resultados.",
        );
        setLoading(false);
      });
  }, [router]);

  function handleRestart() {
    sessionStorage.removeItem("quizAnswers");
    router.push("/");
  }

  async function handleShare() {
    const top = results[0];
    if (!top) return;
    const text = `Hice el quiz de Colombia Matcher y mi candidato más afín es ${top.candidate} (${top.score}%). ¿Y tú? colombiamatcher.vercel.app`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share not supported — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg text-gray-500">Calculando afinidad...</p>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-500">
          El servidor de datos no está disponible. Intenta más tarde.
        </p>
        <button
          onClick={handleRestart}
          className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          Volver a empezar
        </button>
      </main>
    );
  }

  const top = results[0];
  const topMeta = top ? candidateMeta[top.id] : null;

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold">Tus resultados</h1>
      <p className="mt-2 text-gray-500 text-center">
        Candidatos ordenados por afinidad con tus respuestas
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Información curada manualmente · Datos estáticos a marzo 2026 ·{" "}
        <Link href="/metodologia" className="underline hover:text-gray-600">
          Ver metodología
        </Link>
      </p>

      {/* ── Top candidate hero ────────────────────────────────────────────── */}
      {top && (
        <div className="mt-8 w-full max-w-2xl rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            Tu mejor afinidad
          </p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{top.candidate}</h2>
              {topMeta && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {topMeta.party ?? "—"}
                  {topMeta.spectrum ? ` · ${SPECTRUM_LABELS[topMeta.spectrum] ?? topMeta.spectrum}` : ""}
                </p>
              )}
            </div>
            <Link
              href={`/candidatos/${top.id}`}
              className="flex-shrink-0 rounded-full border border-blue-400 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
            >
              Ver perfil
            </Link>
          </div>

          <p className="mt-4 text-5xl font-extrabold text-blue-600">
            {top.score}%
          </p>
          <div className="mt-2 h-3 w-full rounded-full bg-blue-100">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{ width: `${top.score}%` }}
            />
          </div>

          {/* Topic breakdown for top candidate */}
          {Object.keys(top.breakdown).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Object.entries(top.breakdown).map(([topicId, pct]) => {
                const chip = alignmentChip(pct);
                return (
                  <span
                    key={topicId}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.cls}`}
                    title={`${TOPIC_LABELS[topicId] ?? topicId}: ${pct}%`}
                  >
                    {TOPIC_LABELS[topicId] ?? topicId} · {pct}%
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Full ranked list ──────────────────────────────────────────────── */}
      <div className="mt-6 flex w-full max-w-2xl flex-col gap-4">
        {results.map((r, i) => {
          const meta = candidateMeta[r.id];

          return (
            <div
              key={r.id}
              className="rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              {/* Header row */}
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{r.candidate}</h3>
                  {meta && (
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-xs text-gray-400">
                        {meta.party ?? "—"}
                      </p>
                      {meta.spectrum && (
                        <span
                          className={`rounded-full border px-2 py-px text-xs ${spectrumBadge(meta.spectrum)}`}
                        >
                          {SPECTRUM_LABELS[meta.spectrum] ?? meta.spectrum}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-extrabold text-blue-600 tabular-nums">
                    {r.score}%
                  </span>
                  <Link
                    href={`/candidatos/${r.id}`}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Ver perfil →
                  </Link>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${r.score}%` }}
                />
              </div>

              {/* Per-topic chips */}
              {Object.keys(r.breakdown).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(r.breakdown).map(([topicId, pct]) => {
                    const chip = alignmentChip(pct);
                    return (
                      <span
                        key={topicId}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.cls}`}
                        title={`${TOPIC_LABELS[topicId] ?? topicId}: ${pct}%`}
                      >
                        {TOPIC_LABELS[topicId] ?? topicId}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Candidate profile links ────────────────────────────────────────── */}
      <div className="mt-8 w-full max-w-2xl rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-sm text-gray-600 font-medium mb-3">
          ¿Quieres saber más? Revisa las propuestas y el perfil completo de cada candidato.
        </p>
        <div className="flex flex-wrap gap-2">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/candidatos/${r.id}`}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 transition"
            >
              {r.candidate} →
            </Link>
          ))}
        </div>
      </div>

      {/* ── Share button ───────────────────────────────────────────────────── */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleShare}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          {copied ? "¡Copiado!" : "Compartir mis resultados"}
        </button>
      </div>

      {/* ── Footer actions ─────────────────────────────────────────────────── */}
      <div className="mt-6 mb-8 flex flex-col items-center gap-3">
        <Link
          href="/candidatos"
          className="rounded-full bg-gray-800 px-6 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
        >
          Explorar candidatos
        </Link>
        <button
          onClick={handleRestart}
          className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          Volver a empezar
        </button>
      </div>
    </main>
  );
}
