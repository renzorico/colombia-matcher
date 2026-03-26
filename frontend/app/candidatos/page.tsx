"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCandidates, type CandidateSummary } from "@/lib/api";
import { SpectrumBar } from "@/components/SpectrumBar";

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
        <p style={{ color: "var(--muted)" }}>Cargando candidatos...</p>
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
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Candidatos presidenciales
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Colombia 2026 · Información curada manualmente a partir de fuentes públicas verificables
        </p>
        <div
          className="mt-3 rounded-lg px-4 py-2.5 text-xs"
          style={{
            backgroundColor: "#4A6FA510",
            border: "1px solid #4A6FA530",
            color: "#2D4A7A",
          }}
        >
          Los perfiles muestran posturas documentadas en discursos, programas e entrevistas.
          Haz clic en un candidato para ver fuentes y detalles por tema.
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidates.map((c) => (
            <Link
              key={c.id}
              href={`/candidatos/${c.id}`}
              className="group flex flex-col items-center text-center bg-surface rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{
                border: "1px solid var(--border)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              {/* Circular photo */}
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ border: "3px solid var(--border)" }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  {c.name.charAt(0)}
                </div>
              )}

              {/* Name */}
              <h2 className="mt-3 text-base font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                {c.name}
              </h2>

              {/* Party */}
              <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                {c.party ?? "Sin partido registrado"}
                {c.coalition ? ` · ${c.coalition}` : ""}
              </p>

              {/* Spectrum bar */}
              {c.spectrum && (
                <div className="mt-3 w-full max-w-[160px]">
                  <SpectrumBar spectrum={c.spectrum} />
                </div>
              )}

              {/* Short bio */}
              {c.short_bio && (
                <p className="mt-3 text-xs leading-relaxed line-clamp-3 text-left" style={{ color: "var(--muted)" }}>
                  {c.short_bio}
                </p>
              )}

              {/* CTA hint */}
              <span
                className="mt-4 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--secondary)" }}
              >
                Ver perfil →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/quiz"
            className="rounded-full px-6 py-2.5 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            Hacer el quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
