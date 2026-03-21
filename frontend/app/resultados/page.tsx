"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz, explainCandidate, type Result } from "@/lib/api";

const SPECTRUM_COLORS: Record<string, string> = {
  left: "bg-red-600",
  "center-left": "bg-orange-500",
  center: "bg-yellow-500",
  "center-right": "bg-blue-500",
  "far-right": "bg-blue-900",
};

const SPECTRUM_LABELS: Record<string, string> = {
  left: "Izquierda",
  "center-left": "Centro-izquierda",
  center: "Centro",
  "center-right": "Centro-derecha",
  "far-right": "Extrema derecha",
};

const AXIS_LABELS: Record<string, string> = {
  security: "Seguridad",
  economy: "Economía",
  health: "Salud",
  energy_environment: "Energía y Medio Ambiente",
  fiscal: "Política Fiscal",
  foreign_policy: "Política Exterior",
  anticorruption: "Anticorrupción",
};

interface CandidateInfo {
  name: string;
  party: string;
  spectrum: string;
  party_history: string;
}

interface CandidateExtra {
  name: string;
  procuraduria: string;
  scandals: string;
}

export default function ResultadosPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<CandidateInfo[]>([]);
  const [extras, setExtras] = useState<CandidateExtra[]>([]);
  const answersRef = useRef<Record<string, number>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplain, setLoadingExplain] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) {
      router.push("/quiz");
      return;
    }

    const parsedAnswers = JSON.parse(stored) as Record<string, number>;
    answersRef.current = parsedAnswers;

    Promise.all([
      submitQuiz(parsedAnswers),
      fetch("http://localhost:8000/candidates").then((r) => r.json()),
      fetch("http://localhost:8000/candidates/full").then((r) =>
        r.ok ? r.json() : []
      ),
    ]).then(([quizResults, candidateInfos, candidateExtras]) => {
      setResults(quizResults);
      setCandidates(candidateInfos);
      setExtras(candidateExtras);
      setLoading(false);
    });
  }, [router]);

  async function handleExplain(candidateName: string) {
    if (explanations[candidateName]) return;
    setLoadingExplain((prev) => ({ ...prev, [candidateName]: true }));
    try {
      const text = await explainCandidate(candidateName, answersRef.current);
      setExplanations((prev) => ({ ...prev, [candidateName]: text }));
    } catch {
      setExplanations((prev) => ({
        ...prev,
        [candidateName]: "No se pudo obtener la explicación.",
      }));
    }
    setLoadingExplain((prev) => ({ ...prev, [candidateName]: false }));
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg text-gray-500">Calculando resultados...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold">Tus resultados</h1>
      <p className="mt-2 text-gray-500">
        Candidatos ordenados por afinidad con tus respuestas
      </p>

      <div className="mt-8 flex w-full max-w-2xl flex-col gap-6">
        {results.map((r) => {
          const info = candidates.find((c) => c.name === r.candidate);
          const spectrum = info?.spectrum ?? "center";
          return (
            <div
              key={r.candidate}
              className="rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold">{r.candidate}</h2>
                {info && (
                  <span className="text-sm text-gray-500">{info.party}</span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${SPECTRUM_COLORS[spectrum] ?? "bg-gray-500"}`}
                >
                  {SPECTRUM_LABELS[spectrum] ?? spectrum}
                </span>
              </div>

              {/* Score */}
              <p className="mt-3 text-3xl font-extrabold text-blue-600">
                {r.score}% de afinidad
              </p>

              {/* Axis bars */}
              <div className="mt-4 space-y-2">
                {Object.entries(r.breakdown).map(([axis, pct]) => (
                  <div key={axis}>
                    <div className="flex justify-between text-sm">
                      <span>{AXIS_LABELS[axis] ?? axis}</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="mt-0.5 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Explain button */}
              <div className="mt-4">
                {explanations[r.candidate] ? (
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {explanations[r.candidate]}
                  </p>
                ) : (
                  <button
                    onClick={() => handleExplain(r.candidate)}
                    disabled={loadingExplain[r.candidate]}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                  >
                    {loadingExplain[r.candidate]
                      ? "Cargando..."
                      : "Ver explicación"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Antecedentes y controversias */}
      {extras.length > 0 && (
        <section className="mt-12 w-full max-w-2xl">
          <h2 className="text-2xl font-bold">Antecedentes y controversias</h2>
          <div className="mt-4 space-y-4">
            {extras.map((c) => (
              <div
                key={c.name}
                className="rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <strong>Procuraduría:</strong> {c.procuraduria}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <strong>Controversias:</strong> {c.scandals}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Restart */}
      <button
        onClick={() => {
          sessionStorage.removeItem("quizAnswers");
          router.push("/");
        }}
        className="mt-10 mb-8 rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
      >
        Volver a empezar
      </button>
    </main>
  );
}
