"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestions, type Question } from "@/lib/api";
import { BUCKET_TO_TOPIC, TOPIC_COLORS } from "@/lib/topics";

const LABELS: Record<number, string> = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo",
};

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

  useEffect(() => {
    getQuestions().then((qs) => {
      setQuestions(qs);
      setLoading(false);
    });
  }, []);

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

  async function handleNext() {
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      setSubmitting(true);
      sessionStorage.setItem("quizAnswers", JSON.stringify(answers));
      router.push("/resultados");
    }
  }

  function handleSkip() {
    setAnswers((prev) => ({ ...prev, [q.id]: 3 }));
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      const finalAnswers = { ...answers, [q.id]: 3 };
      sessionStorage.setItem("quizAnswers", JSON.stringify(finalAnswers));
      router.push("/resultados");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Topic chip */}
        <span
          className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: topicColor }}
        >
          {q.bucket}
        </span>

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
        <p className="mt-6 text-xl font-semibold leading-relaxed" style={{ color: "var(--foreground)" }}>
          {q.statement}
        </p>

        {/* Answer buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          {([1, 2, 3, 4, 5] as const).map((val) => {
            const isSelected = selected === val;
            return (
              <button
                key={val}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                className="rounded-xl px-5 py-3.5 text-left text-sm font-medium transition"
                style={{
                  border: `1.5px solid ${isSelected ? topicColor : "var(--border)"}`,
                  backgroundColor: isSelected ? hexWithAlpha(topicColor, 0.08) : "var(--surface)",
                  color: isSelected ? topicColor : "var(--foreground)",
                }}
              >
                {val} — {LABELS[val]}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {index > 0 && (
              <button
                onClick={() => setIndex(index - 1)}
                className="text-sm transition"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={handleSkip}
              className="text-sm transition"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              Omitir
            </button>
          </div>
          <button
            onClick={handleNext}
            disabled={selected === null || submitting}
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
