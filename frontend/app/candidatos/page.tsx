"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCandidates, type CandidateSummary } from "@/lib/api";

const SPECTRUM_LABELS: Record<string, string> = {
  left: "Izquierda",
  "center-left": "Centro-izquierda",
  center: "Centro",
  "center-right": "Centro-derecha",
  right: "Derecha",
  "far-right": "Derecha radical",
};

function spectrumColor(spectrum: string | null): string {
  if (!spectrum) return "bg-gray-100 text-gray-500";
  if (spectrum.startsWith("left")) return "bg-red-50 text-red-700";
  if (spectrum === "center") return "bg-blue-50 text-blue-700";
  if (spectrum.startsWith("center")) return "bg-blue-50 text-blue-700";
  return "bg-green-50 text-green-700";
}

export default function CandidatosPage() {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCandidates()
      .then((data) => {
        setCandidates(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar candidatos.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Cargando candidatos...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold">Candidatos presidenciales</h1>
        <p className="mt-2 text-gray-500 text-sm">
          Colombia 2026 · Información curada manualmente a partir de fuentes públicas verificables
        </p>
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
          Los perfiles muestran posturas documentadas en discursos, programas e
          entrevistas. Haz clic en un candidato para ver fuentes y detalles por tema.
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {candidates.map((c) => (
            <Link
              key={c.id}
              href={`/candidatos/${c.id}`}
              className="block rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold truncate">{c.name}</h2>
                  <p className="mt-0.5 text-sm text-gray-500 truncate">
                    {c.party ?? "Sin partido registrado"}
                    {c.coalition ? ` · ${c.coalition}` : ""}
                  </p>
                  {c.short_bio && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {c.short_bio}
                    </p>
                  )}
                </div>
                {c.spectrum && (
                  <span
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${spectrumColor(c.spectrum)}`}
                  >
                    {SPECTRUM_LABELS[c.spectrum] ?? c.spectrum}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/quiz"
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Hacer el quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
