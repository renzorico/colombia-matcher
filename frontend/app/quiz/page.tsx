"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestions, type Question } from "@/lib/api";

const LABELS: Record<number, string> = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo",
};

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
        <p className="text-lg text-gray-500">Cargando preguntas...</p>
      </main>
    );
  }

  const total = questions.length;
  const q = questions[index];
  const selected = answers[q.id] ?? null;

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
        {/* Bucket label */}
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {q.bucket}
        </span>

        {/* Progress */}
        <p className="mt-3 text-sm text-gray-500">
          Pregunta {index + 1} de {total}
        </p>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        {/* Statement */}
        <p className="mt-6 text-xl font-semibold leading-relaxed">
          {q.statement}
        </p>

        {/* Answer buttons */}
        <div className="mt-6 flex flex-col gap-2">
          {([1, 2, 3, 4, 5] as const).map((val) => (
            <button
              key={val}
              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                selected === val
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {val} — {LABELS[val]}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {index > 0 && (
              <button
                onClick={() => setIndex(index - 1)}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Omitir
            </button>
          </div>
          <button
            onClick={handleNext}
            disabled={selected === null || submitting}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Enviando..."
              : index < total - 1
                ? "Siguiente"
                : "Ver resultados"}
          </button>
        </div>
      </div>
    </main>
  );
}
