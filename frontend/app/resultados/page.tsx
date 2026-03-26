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
import { SpectrumBar } from "@/components/SpectrumBar";
import { TOPIC_COLORS, AXIS_LABELS_ES as TOPIC_LABELS } from "@/lib/topics";
import ResultsCharts from "@/components/ResultsCharts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rankLabel(rank: number): string {
  if (rank === 2) return "Segunda mayor afinidad";
  if (rank === 3) return "Tercera mayor afinidad";
  return `#${rank}`;
}

function alignmentChip(pct: number): { label: string; color: string } {
  if (pct >= 67) return { label: "De acuerdo",    color: "#5C8A6B" };
  if (pct >= 34) return { label: "Parcial",        color: "#6B6B6B" };
  return              { label: "En desacuerdo",   color: "#C4622D" };
}

// Mini topic bar used in result cards
function TopicMiniBar({ topicId, pct }: { topicId: string; pct: number }) {
  const color = TOPIC_COLORS[topicId] ?? "#4A4A4A";
  const label = TOPIC_LABELS[topicId] ?? topicId;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</span>
        <span className="text-[10px] font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="h-1 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResultadosPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [candidateMeta, setCandidateMeta] = useState<Record<string, CandidateSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) { router.push("/quiz"); return; }
    const answers = JSON.parse(stored) as Record<string, number>;
    if (Object.keys(answers).length === 0) { router.push("/quiz"); return; }

    Promise.all([submitQuiz(answers), getCandidates()])
      .then(([ranked, candidates]) => {
        setResults(ranked);
        const byId: Record<string, CandidateSummary> = {};
        for (const c of candidates) byId[c.id] = c;
        setCandidateMeta(byId);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los resultados.");
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
      try { await navigator.share({ text }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg" style={{ color: "var(--muted)" }}>Calculando afinidad...</p>
      </main>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{error}</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          El servidor de datos no está disponible. Intenta más tarde.
        </p>
        <button
          onClick={handleRestart}
          className="rounded-full px-6 py-2 text-sm font-semibold transition"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          Volver a empezar
        </button>
      </main>
    );
  }

  const top = results[0];
  const topMeta = top ? candidateMeta[top.id] : null;

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Tus resultados</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
        Información curada manualmente · Datos a marzo 2026 ·{" "}
        <Link href="/metodologia" className="underline hover:opacity-80">Ver metodología</Link>
      </p>

      {/* ── Winner hero ───────────────────────────────────────────────────── */}
      {top && (
        <div
          className="mt-8 w-full max-w-2xl rounded-2xl p-6 shadow-md"
          style={{ border: "2px solid var(--primary)", backgroundColor: "#FFFBEA" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--secondary)" }}
          >
            Tu mejor afinidad
          </p>

          <div className="mt-3 flex items-center gap-4">
            {/* Photo */}
            {topMeta?.image_url ? (
              <img
                src={topMeta.image_url}
                alt={top.candidate}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                style={{ border: "2px solid var(--primary)" }}
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top.candidate)}&background=6B6B6B&color=fff&size=200`; }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                {top.candidate.charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                {top.candidate}
              </h2>
              {topMeta && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{topMeta.party ?? "—"}</p>
                  {topMeta.spectrum && <SpectrumBar spectrum={topMeta.spectrum} />}
                </div>
              )}
            </div>

            <Link
              href={`/candidatos/${top.id}`}
              className="flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition"
              style={{
                border: "1px solid var(--secondary)",
                color: "var(--secondary)",
              }}
            >
              Ver perfil
            </Link>
          </div>

          {/* Score */}
          <p className="mt-5 text-5xl font-extrabold" style={{ color: "var(--secondary)" }}>
            {top.score}%
          </p>
          <div className="mt-2 h-3 w-full rounded-full" style={{ backgroundColor: "#E0DDD8" }}>
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${top.score}%`, backgroundColor: "var(--primary)" }}
            />
          </div>

          {/* Topic mini-bars */}
          {Object.keys(top.breakdown).length > 0 && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(top.breakdown).map(([topicId, pct]) => (
                <TopicMiniBar key={topicId} topicId={topicId} pct={pct} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Ranked list (starting at #2) ──────────────────────────────────── */}
      <p className="mt-8 w-full max-w-2xl text-sm text-center" style={{ color: "var(--muted)" }}>
        Estos son los candidatos ordenados de mayor a menor afinidad con tus respuestas
      </p>

      <div className="mt-3 flex w-full max-w-2xl flex-col gap-4">
        {results.slice(1).map((r, i) => {
          const rank = i + 2;
          const meta = candidateMeta[r.id];
          return (
            <div
              key={r.id}
              className="rounded-xl p-5 bg-surface"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                {/* Photo */}
                {meta?.image_url ? (
                  <img
                    src={meta.image_url}
                    alt={r.candidate}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1px solid var(--border)" }}
                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.candidate)}&background=6B6B6B&color=fff&size=200`; }}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "var(--secondary)" }}
                  >
                    {r.candidate.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>
                    {rankLabel(rank)}
                  </p>
                  <h3 className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                    {r.candidate}
                  </h3>
                  {meta && (
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                      {meta.party ?? "—"}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--secondary)" }}>
                    {r.score}%
                  </span>
                  <Link
                    href={`/candidatos/${r.id}`}
                    className="text-xs hover:underline"
                    style={{ color: "var(--secondary)" }}
                  >
                    Ver perfil →
                  </Link>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundColor: "var(--border)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${r.score}%`, backgroundColor: "var(--primary)" }}
                />
              </div>

              {/* Topic mini-bars */}
              {Object.keys(r.breakdown).length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {Object.entries(r.breakdown).map(([topicId, pct]) => {
                    const { label } = alignmentChip(pct);
                    const color = TOPIC_COLORS[topicId] ?? "#4A4A4A";
                    return (
                      <span
                        key={topicId}
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: color }}
                        title={`${TOPIC_LABELS[topicId] ?? topicId}: ${pct}% — ${label}`}
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

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <ResultsCharts results={results} />

      {/* ── Profile links ─────────────────────────────────────────────────── */}
      <div
        className="mt-8 w-full max-w-2xl rounded-xl px-5 py-4"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
          ¿Quieres saber más? Revisa las propuestas y el perfil completo de cada candidato.
        </p>
        <div className="flex flex-wrap gap-2">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/candidatos/${r.id}`}
              className="rounded-full px-3 py-1 text-xs font-medium transition"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              {r.candidate} →
            </Link>
          ))}
        </div>
      </div>

      {/* ── Share button ──────────────────────────────────────────────────── */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleShare}
          className="rounded-full px-6 py-2.5 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
        >
          {copied ? "¡Copiado!" : "Compartir mis resultados"}
        </button>
      </div>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <div className="mt-6 mb-8 flex flex-col items-center gap-3">
        <Link
          href="/candidatos"
          className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--secondary)", color: "#FFFFFF" }}
        >
          Explorar candidatos
        </Link>
        <button
          onClick={handleRestart}
          className="rounded-full px-6 py-2 text-sm font-semibold transition"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          Volver a empezar
        </button>
      </div>
    </main>
  );
}
