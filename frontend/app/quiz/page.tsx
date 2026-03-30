"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestions, type Question } from "@/lib/api";
import { BUCKET_TO_TOPIC, TOPIC_COLORS } from "@/lib/topics";
import { explanacionesSimples } from "@/lib/explanaciones-simples";

const LABELS: Record<number, string> = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo",
};

const STORAGE_KEY = "quizProgress";

const TOPIC_ORDER = ["Seguridad", "Economía", "Salud", "Energía y Medio Ambiente", "Política Fiscal", "Política Exterior", "Anticorrupción"];

function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [explicitAnswerIds, setExplicitAnswerIds] = useState<Set<string>>(new Set());
  const [showAllSkippedWarning, setShowAllSkippedWarning] = useState(false);
  const [hoveredVal, setHoveredVal] = useState<number | null>(null);
  const [showExplanacion, setShowExplanacion] = useState(false);

  useEffect(() => {
    getQuestions().then((qs) => {
      // Sort so all same-topic questions appear consecutively, preserving relative within-topic order
      const sorted = [...qs].sort((a, b) => {
        const ai = TOPIC_ORDER.indexOf(a.bucket);
        const bi = TOPIC_ORDER.indexOf(b.bucket);
        if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return qs.indexOf(a) - qs.indexOf(b);
      });
      setQuestions(sorted);

      // Check for saved progress
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { answers: savedAnswers, index: savedIndex } = JSON.parse(saved) as {
            answers: Record<string, number>;
            index: number;
          };
          if (Object.keys(savedAnswers).length > 0) {
            setAnswers(savedAnswers);
            setIndex(Math.min(savedIndex, qs.length - 1));
            setShowResume(true);
          }
        }
      } catch { /* ignore */ }

      setLoading(false);
    });
  }, []);

  // Persist progress to localStorage on every change
  useEffect(() => {
    if (loading || questions.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index }));
    } catch { /* ignore */ }
  }, [answers, index, loading, questions.length]);

  // Topic-level progress — must be above early returns (Rules of Hooks)
  const topicOrder = useMemo(() => [...new Set(questions.map((qi) => qi.bucket))], [questions]);
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const qi of questions) counts[qi.bucket] = (counts[qi.bucket] ?? 0) + 1;
    return counts;
  }, [questions]);

  // Reset explanation bubble when question changes
  useEffect(() => {
    setShowExplanacion(false);
  }, [index]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg" style={{ color: "var(--muted)" }}>Cargando preguntas...</p>
      </main>
    );
  }

  const total = questions.length;
  const q = questions[index];
  const selected = answers[q.id] ?? null;
  const topicId = BUCKET_TO_TOPIC[q.bucket] ?? "security";
  const topicColor = TOPIC_COLORS[topicId] ?? "#4A6FA5";
  const topicNum = topicOrder.indexOf(q.bucket) + 1;
  const questionInTopic = questions.slice(0, index + 1).filter((qi) => qi.bucket === q.bucket).length;
  const topicTotal = topicCounts[q.bucket] ?? 1;
  const explicacion = explanacionesSimples[q.id] ?? null;

  function doSubmit(finalAnswers: Record<string, number>) {
    setSubmitting(true);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem("quizAnswers", JSON.stringify(finalAnswers));
    router.push("/resultados");
  }

  function handleNext() {
    if (selected === null) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setShowAllSkippedWarning(false);
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      // On last question: warn if nothing was ever explicitly answered
      if (explicitAnswerIds.size === 0) {
        setShowAllSkippedWarning(true);
        return;
      }
      doSubmit(answers);
    }
  }

  function handleSkip() {
    setShowValidation(false);
    setShowAllSkippedWarning(false);
    const updated = { ...answers, [q.id]: 3 };
    setAnswers(updated);
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      if (explicitAnswerIds.size === 0) {
        setShowAllSkippedWarning(true);
        return;
      }
      doSubmit(updated);
    }
  }

  function handleSelectAnswer(val: number) {
    setShowValidation(false);
    setShowAllSkippedWarning(false);
    setExplicitAnswerIds((prev) => new Set([...prev, q.id]));
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function handleRestart() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setIndex(0);
    setShowResume(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-4">
      <div className="w-full max-w-lg">

        {/* Resume banner */}
        {showResume && (
          <div
            className="mb-6 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <span style={{ color: "var(--foreground)" }}>
              Tienes progreso guardado en la pregunta {index + 1}.
            </span>
            <button
              onClick={handleRestart}
              className="text-xs font-medium underline flex-shrink-0"
              style={{ color: "var(--muted)" }}
            >
              Empezar de cero
            </button>
          </div>
        )}

        {/* Topic chip + sub-label */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: topicColor }}
          >
            {q.bucket}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Tema {topicNum} de {topicOrder.length} · Pregunta {questionInTopic} de {topicTotal} en este tema
          </span>
        </div>

        {/* Progress */}
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          Pregunta {index + 1} de {total}
        </p>
        <div className="mt-1 h-2 w-full rounded-full" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${((index + 1) / total) * 100}%`,
              backgroundColor: "var(--primary)",
            }}
          />
        </div>

        {/* Statement */}
        <p className="mt-6 text-lg font-semibold leading-relaxed" style={{ color: "var(--foreground)" }}>
          {q.statement}
        </p>

        {/* Simple explanation bubble */}
        {explicacion && (
          <>
            <button
              onClick={() => setShowExplanacion((prev) => !prev)}
              className="text-sm text-gray-400 hover:text-gray-600 hover:underline mt-2 mb-1 flex items-center gap-1 transition-colors cursor-pointer"
            >
              🧒 ¿No entiendes la pregunta? Explícamelo fácil
            </button>
            {showExplanacion && (
              <div className="relative mt-1 mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                <button
                  onClick={() => setShowExplanacion(false)}
                  className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                  aria-label="Cerrar explicación"
                >✕</button>
                <p className="pr-6">{explicacion}</p>
              </div>
            )}
          </>
        )}

        {/* Answer buttons */}
        <div className="mt-6 flex flex-col gap-2">
          {([1, 2, 3, 4, 5] as const).map((val) => {
            const isSelected = selected === val;
            const isHovered = hoveredVal === val;
            return (
              <button
                key={val}
                onClick={() => handleSelectAnswer(val)}
                onMouseEnter={() => setHoveredVal(val)}
                onMouseLeave={() => setHoveredVal(null)}
                className="rounded-xl px-5 py-2.5 text-left text-sm font-medium"
                style={{
                  border: `1.5px solid ${isSelected ? topicColor : "var(--border)"}`,
                  backgroundColor: isSelected
                    ? hexWithAlpha(topicColor, 0.08)
                    : isHovered
                    ? "#f3f4f6"
                    : "var(--surface)",
                  color: isSelected ? topicColor : "var(--foreground)",
                  transition: "background 150ms ease",
                  cursor: "pointer",
                }}
              >
                {val} — {LABELS[val]}
              </button>
            );
          })}
        </div>

        {/* Validation message */}
        {showValidation && (
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--accent)" }}>
            Selecciona una opción o usa &ldquo;Sin opinión&rdquo; para continuar.
          </p>
        )}

        {/* All-skipped warning */}
        {showAllSkippedWarning && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-sm"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
          >
            <p className="font-medium" style={{ color: "var(--foreground)" }}>
              Respondiste todo con &ldquo;Sin opinión&rdquo;.
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              Los resultados podrían no ser representativos. ¿Quieres continuar de todas formas?
            </p>
            <button
              onClick={() => doSubmit(answers)}
              className="mt-2 text-xs font-semibold underline"
              style={{ color: "var(--secondary)" }}
            >
              Continuar de todas formas
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {index > 0 && (
              <button
                onClick={() => { setShowValidation(false); setIndex(index - 1); }}
                className="text-sm transition"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                ← Anterior
              </button>
            )}
            <div className="flex flex-col">
              <button
                onClick={handleSkip}
                className="text-sm transition"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                Sin opinión
              </button>
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={submitting}
            className="rounded-full px-6 py-2.5 text-sm font-bold shadow transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            {submitting
              ? "Enviando..."
              : index < total - 1
                ? "Siguiente →"
                : "Ver resultados →"}
          </button>
        </div>

      </div>
    </main>
  );
}
