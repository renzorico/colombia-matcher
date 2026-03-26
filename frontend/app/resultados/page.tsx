"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchResult } from "@/services/matcher";

// ---------------------------------------------------------------------------
// Static candidate metadata
// ---------------------------------------------------------------------------

const CANDIDATE_INFO: Record<string, { displayName: string; bio: string }> = {
  "ivan-cepeda": {
    displayName: "Iván Cepeda",
    bio: "Senador, Pacto Histórico. Izquierda.",
  },
  "german-vargas-lleras": {
    displayName: "Germán Vargas Lleras",
    bio: "Ex vicepresidente, Cambio Radical. Centro-derecha.",
  },
  "abelardo-de-la-espriella": {
    displayName: "Abelardo de la Espriella",
    bio: "Abogado y político, Conservador. Derecha.",
  },
  "paloma-valencia": {
    displayName: "Paloma Valencia",
    bio: "Senadora, Centro Democrático. Centro-derecha.",
  },
  "sergio-fajardo": {
    displayName: "Sergio Fajardo",
    bio: "Ex gobernador de Antioquia, Independiente. Centro.",
  },
  "claudia-lopez": {
    displayName: "Claudia López",
    bio: "Ex alcaldesa de Bogotá, Ganadora Consulta de las Soluciones. Centro.",
  },
};

const TOPIC_LABELS: Record<string, string> = {
  security: "Seguridad",
  economy: "Economía",
  health: "Salud",
  environment: "Medio Ambiente",
  fiscal: "Política Fiscal",
  "foreign-policy": "Política Exterior",
  anticorruption: "Anticorrupción",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(score: number): number {
  return Math.round(score * 100);
}

function alignmentChip(agreement: number): { label: string; cls: string } {
  if (agreement >= 0.67)
    return { label: "De acuerdo", cls: "bg-green-100 text-green-700" };
  if (agreement >= 0.34)
    return { label: "Neutral", cls: "bg-gray-100 text-gray-600" };
  return { label: "En desacuerdo", cls: "bg-red-100 text-red-700" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResultadosPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) {
      router.push("/quiz");
      return;
    }

    const answers = JSON.parse(stored) as Record<string, number>;
    // Guard: if the user somehow landed here with an empty answers object,
    // send back to the quiz rather than showing a meaningless all-0% ranking.
    if (Object.keys(answers).length === 0) {
      router.push("/quiz");
      return;
    }

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json() as Promise<MatchResult[]>;
      })
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los resultados.",
        );
        setLoading(false);
      });
  }, [router]);

  function handleRestart() {
    sessionStorage.removeItem("quizAnswers");
    router.push("/");
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg text-gray-500">Calculando resultados...</p>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleRestart}
          className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          Volver a empezar
        </button>
      </main>
    );
  }

  const top = matches[0];
  const topInfo = top ? CANDIDATE_INFO[top.candidateId] : null;

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold">Tus resultados</h1>
      <p className="mt-2 text-gray-500 text-center">
        Candidatos ordenados por afinidad con tus respuestas
      </p>

      {/* ── Top candidate hero ────────────────────────────────────────────── */}
      {top && topInfo && (
        <div className="mt-8 w-full max-w-2xl rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            Tu mejor afinidad
          </p>
          <h2 className="mt-1 text-2xl font-bold">{topInfo.displayName}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{topInfo.bio}</p>

          <p className="mt-4 text-5xl font-extrabold text-blue-600">
            {pct(top.overallScore)}%
          </p>
          <div className="mt-2 h-3 w-full rounded-full bg-blue-100">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{ width: `${pct(top.overallScore)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Full ranked list ──────────────────────────────────────────────── */}
      <div className="mt-6 flex w-full max-w-2xl flex-col gap-4">
        {matches.map((m, i) => {
          const info = CANDIDATE_INFO[m.candidateId];
          const displayName = info?.displayName ?? m.candidateId;
          const bio = info?.bio ?? "";

          return (
            <div
              key={m.candidateId}
              className="rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              {/* Header row */}
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{displayName}</h3>
                  <p className="truncate text-xs text-gray-400">{bio}</p>
                </div>
                <span className="text-2xl font-extrabold text-blue-600 tabular-nums">
                  {pct(m.overallScore)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${pct(m.overallScore)}%` }}
                />
              </div>

              {/* Per-topic chips */}
              {m.topicAlignments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.topicAlignments.map((a) => {
                    const chip = alignmentChip(a.agreement);
                    const topicLabel = TOPIC_LABELS[a.topic] ?? a.topic;
                    return (
                      <span
                        key={a.topic}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.cls}`}
                        title={`${topicLabel}: ${pct(a.agreement)}% afinidad`}
                      >
                        {topicLabel} · {chip.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Restart ───────────────────────────────────────────────────────── */}
      <button
        onClick={handleRestart}
        className="mt-10 mb-8 rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
      >
        Volver a empezar
      </button>
    </main>
  );
}
