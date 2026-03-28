"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCandidates, type CandidateSummary } from "@/lib/api";
import { SpectrumBar } from "@/components/SpectrumBar";
import { candidatePhoto } from "@/lib/photos";
import PhotoLightbox from "@/components/PhotoLightbox";

type SpectrumFilter = "all" | "left" | "center" | "right";

const SPECTRUM_BUCKETS: Record<string, SpectrumFilter> = {
  left: "left",
  "center-left": "left",
  center: "center",
  "center-right": "right",
  right: "right",
  "far-right": "right",
};

const FILTER_LABELS: Record<SpectrumFilter, string> = {
  all: "Todos",
  left: "Izquierda",
  center: "Centro",
  right: "Derecha",
};

// Explicit order for the "Todos" horizontal scroll
const TODOS_ORDER = [
  "ivan-cepeda",
  "roy-barreras",
  "sergio-fajardo",
  "claudia-lopez",
  "paloma-valencia",
  "abelardo-de-la-espriella",
];

// Explicit order for the "Derecha" tab
const RIGHT_ORDER = ["paloma-valencia", "abelardo-de-la-espriella"];

// ── Filter tab — yellow hover/active ─────────────────────────────────────────

function FilterTab({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-full px-4 py-1.5 text-sm font-medium"
      style={{
        backgroundColor: active ? "#eab308" : hovered ? "#fde047" : "var(--surface)",
        color: active || hovered ? "#1a1a1a" : "var(--foreground)",
        border: `1px solid ${active ? "#eab308" : "var(--border)"}`,
        transition: "background 150ms ease, color 150ms ease",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ── Candidate card ────────────────────────────────────────────────────────────
// scrollMode: rectangular 280×320 card with 180px photo area
// grid mode: circular photo, centered layout (unchanged)

interface CandidateCardProps {
  c: CandidateSummary;
  onLightbox: (src: string, name: string) => void;
  scrollMode?: boolean;
}

function CandidateCard({ c, onLightbox, scrollMode }: CandidateCardProps) {
  const [hovered, setHovered] = useState(false);
  const photo = candidatePhoto(c.id);

  if (scrollMode) {
    return (
      <Link
        href={`/candidatos/${c.id}`}
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 280,
          flexShrink: 0,
          scrollSnapAlign: "start",
          minHeight: 320,
          backgroundColor: "var(--surface)",
          border: `1px solid ${hovered ? "var(--primary)" : "var(--border)"}`,
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Rectangular photo area */}
        {photo ? (
          <div
            className="relative overflow-hidden"
            style={{ height: 180, flexShrink: 0, backgroundColor: "#f3f4f6", cursor: "zoom-in" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLightbox(photo, c.name); }}
          >
            <Image
              src={photo}
              alt={c.name}
              fill
              className="object-cover"
              style={{ objectPosition: "center 15%" }}
              unoptimized
              sizes="280px"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center text-2xl font-bold text-white"
            style={{ height: 180, flexShrink: 0, backgroundColor: "var(--secondary)" }}
          >
            {c.name.charAt(0)}
          </div>
        )}
        {/* Content */}
        <div className="flex flex-col flex-1" style={{ padding: 20 }}>
          <h2 className="text-base font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            {c.name}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
            {c.party ?? "Sin partido registrado"}
          </p>
          {c.spectrum && (
            <div className="mt-3 w-full max-w-[160px]">
              <SpectrumBar spectrum={c.spectrum} candidateId={c.id} />
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Grid mode — circular photo, centered layout
  return (
    <Link
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
      {photo ? (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLightbox(photo, c.name); }}
          style={{ cursor: "zoom-in" }}
        >
          <Image
            src={photo}
            alt={c.name}
            width={80}
            height={80}
            unoptimized
            className="w-20 h-20 rounded-full object-contain p-1 bg-white"
            style={{ border: "3px solid var(--border)" }}
          />
        </div>
      ) : (
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          {c.name.charAt(0)}
        </div>
      )}
      <h2 className="mt-3 text-base font-bold leading-tight" style={{ color: "var(--foreground)" }}>
        {c.name}
      </h2>
      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
        {c.party ?? "Sin partido registrado"}
      </p>
      {c.spectrum && (
        <div className="mt-3 w-full max-w-[160px]">
          <SpectrumBar spectrum={c.spectrum} candidateId={c.id} />
        </div>
      )}
    </Link>
  );
}

export default function CandidatosPage() {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SpectrumFilter>("all");
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

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

  const filteredCandidates = candidates
    .filter((c) => {
      if (filter === "all") return true;
      if (!c.spectrum) return false;
      return SPECTRUM_BUCKETS[c.spectrum] === filter;
    })
    .sort((a, b) => {
      if (filter === "all") {
        const ai = TODOS_ORDER.indexOf(a.id);
        const bi = TODOS_ORDER.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      if (filter === "right") {
        const ai = RIGHT_ORDER.indexOf(a.id);
        const bi = RIGHT_ORDER.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return 0;
    });

  const handleLightbox = (src: string, name: string) => setLightbox({ src, name });

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Candidatos presidenciales
        </h1>
        <div
          className="mt-3 rounded-lg px-4 py-2.5 text-xs"
          style={{
            backgroundColor: "color-mix(in srgb, var(--hero) 6%, transparent)",
            border: "1px solid color-mix(in srgb, var(--hero) 18%, transparent)",
            color: "var(--secondary)",
          }}
        >
          Los perfiles muestran posturas documentadas en discursos, programas e entrevistas.
          Haz clic en un candidato para ver fuentes y detalles por tema.
        </div>

        {/* ── Spectrum filter — centered, yellow hover/active ──────────────── */}
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          {(["all", "left", "center", "right"] as SpectrumFilter[]).map((f) => (
            <FilterTab
              key={f}
              active={filter === f}
              label={FILTER_LABELS[f]}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>

        {/* ── Candidate list ───────────────────────────────────────────────── */}
        {filter === "all" ? (
          <div className="relative mt-6" style={{ overflow: "visible" }}>
            <div
              className="flex gap-5"
              style={{
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollbarWidth: "thin",
                paddingTop: 16,
                paddingBottom: 20,
              }}
            >
              {filteredCandidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  c={c}
                  onLightbox={handleLightbox}
                  scrollMode
                />
              ))}
            </div>
            {/* Right gradient fade hint */}
            <div
              className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent, var(--background))" }}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCandidates.map((c) => (
              <CandidateCard key={c.id} c={c} onLightbox={handleLightbox} />
            ))}
          </div>
        )}

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

      {lightbox && (
        <PhotoLightbox
          src={lightbox.src}
          name={lightbox.name}
          onClose={() => setLightbox(null)}
        />
      )}
    </main>
  );
}
