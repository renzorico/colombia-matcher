"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getCandidatesFull,
  type CandidateFull,
  type Controversy,
  type Source,
} from "@/lib/api";
import TopicRadialChart from "@/components/TopicRadialChart";
import SourceList from "@/components/SourceList";
import EmptyState from "@/components/EmptyState";
import { SpectrumBar } from "@/components/SpectrumBar";
import { TOPIC_COLORS } from "@/lib/topics";
import { candidatePhoto } from "@/lib/photos";
import PhotoLightbox from "@/components/PhotoLightbox";
import { useLanguage } from "@/lib/i18n";

const CANDIDATE_ORDER = [
  { id: "ivan-cepeda",                name: "Iván Cepeda" },
  { id: "paloma-valencia",            name: "Paloma Valencia" },
  { id: "sergio-fajardo",             name: "Sergio Fajardo" },
  { id: "abelardo-de-la-espriella",   name: "Abelardo de la Espriella" },
  { id: "roy-barreras",               name: "Roy Barreras" },
  { id: "claudia-lopez",              name: "Claudia López" },
];

function formatDate(iso: string, lang: string): string {
  const months_es = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const months_en = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const months = lang === "en" ? months_en : months_es;
  const parts = iso.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return lang === "en"
      ? `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`
      : `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`;
  }
  if (parts.length === 2) {
    const [y, m] = parts;
    return lang === "en"
      ? `${months[parseInt(m) - 1]} ${y}`
      : `${months[parseInt(m) - 1]} de ${y}`;
  }
  return iso;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-bold mb-3 pb-2"
      style={{ color: "var(--foreground)", borderBottom: "2px solid var(--primary)" }}
    >
      {children}
    </h2>
  );
}

function ControversyCard({ c, sourceMap }: { c: Controversy; sourceMap: Map<string, Source> }) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useLanguage();

  const SEVERITY_LABELS = {
    low:    { label: t.candidate.severityLabels["low"],    cls: "bg-gray-50 text-gray-600 border-gray-200",    borderColor: "#6B6B6B" },
    medium: { label: t.candidate.severityLabels["medium"], cls: "bg-orange-50 text-orange-700 border-orange-200", borderColor: "#D4813A" },
    high:   { label: t.candidate.severityLabels["high"],   cls: "bg-red-50 text-red-700 border-red-200",       borderColor: "#C4622D" },
  } as Record<string, { label: string; cls: string; borderColor: string }>;

  const sev = SEVERITY_LABELS[c.severity] ?? {
    label: c.severity,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    borderColor: "#6B6B6B",
  };
  const status = t.candidate.controversyStatusLabels[c.status] ?? c.status;
  const contSources = (c.source_ids ?? [])
    .map((id) => sourceMap.get(id))
    .filter((s): s is Source => s !== undefined);

  return (
    <div
      className="rounded-xl"
      style={{
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${sev.borderColor}`,
        backgroundColor: "var(--surface)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-left"
      >
        <span
          className="flex-shrink-0 text-gray-400 text-sm transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
        <h4 className="text-sm font-semibold text-gray-800 flex-1 min-w-0">{c.title}</h4>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${sev.cls}`}>
          {sev.label}
        </span>
        {c.date && (
          <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
            {formatDate(c.date, lang)}
          </span>
        )}
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs text-gray-400">
              {status}
              {c.date ? ` · ${formatDate(c.date, lang)}` : ""}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{c.summary}</p>
          {c.notes && (
            <p className="mt-2 text-xs text-gray-400 italic leading-relaxed">{c.notes}</p>
          )}
          {contSources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {contSources.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  {s.publisher ?? s.title ?? s.url}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CandidatoDetail() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const [candidate, setCandidate] = useState<CandidateFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    getCandidatesFull()
      .then((all) => {
        const found = all.find((c) => c.id === params.id) ?? null;
        if (!found) { setNotFound(true); setLoading(false); return; }
        setCandidate(found);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t.candidate.errorPrefix);
        setLoading(false);
      });
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">{t.candidate.loading}</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {t.candidate.notFoundTitle}
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.candidate.notFoundDesc}
        </p>
        <Link
          href="/candidatos"
          className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
        >
          {t.candidate.notFoundCta}
        </Link>
      </main>
    );
  }

  if (error || !candidate) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600">{error ?? t.candidate.errorPrefix}</p>
        <Link href="/candidatos" className="text-sm hover:underline" style={{ color: "var(--secondary)" }}>
          {t.candidate.notFoundCta}
        </Link>
      </main>
    );
  }

  const sourceMap = new Map<string, Source>(
    candidate.sources.map((s) => [s.id, s])
  );

  const PROCURADURIA_LABELS = {
    clean:       { label: t.candidate.procuraduriaLabels["clean"],              cls: "text-green-700 bg-green-50 border-green-200" },
    flagged:     { label: t.candidate.procuraduriaLabels["flagged"],            cls: "text-amber-700 bg-amber-50 border-amber-200" },
    investigated: { label: t.candidate.procuraduriaLabels["investigated"],      cls: "text-orange-700 bg-orange-50 border-orange-200" },
    under_investigation: { label: t.candidate.procuraduriaLabels["under_investigation"], cls: "text-orange-700 bg-orange-50 border-orange-200" },
    sanctioned:  { label: t.candidate.procuraduriaLabels["sanctioned"],         cls: "text-red-700 bg-red-50 border-red-200" },
    unknown:     { label: t.candidate.procuraduriaLabels["unknown"],            cls: "text-gray-700 bg-gray-50 border-gray-200" },
  } as Record<string, { label: string; cls: string }>;

  const procLabel = candidate.procuraduria_status
    ? (PROCURADURIA_LABELS[candidate.procuraduria_status] ?? {
        label: candidate.procuraduria_status,
        cls: "text-gray-700 bg-gray-50 border-gray-200",
      })
    : null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Breadcrumb */}
        <Link href="/candidatos" className="text-sm transition" style={{ color: "var(--secondary)" }}>
          {t.candidate.breadcrumb}
        </Link>

        {/* Header */}
        <div className="mt-5 flex items-start gap-5">
          {candidatePhoto(candidate.id) ? (
            <button
              onClick={() => setLightbox({ src: candidatePhoto(candidate.id)!, name: candidate.name })}
              className="flex-shrink-0 focus:outline-none"
              style={{ cursor: "zoom-in" }}
              aria-label={`${t.candidate.photoAlt} ${candidate.name}`}
            >
              <Image
                src={candidatePhoto(candidate.id)!}
                alt={candidate.name}
                width={96}
                height={96}
                unoptimized
                className="w-24 h-24 rounded-2xl object-contain p-1 bg-white"
                style={{ border: "2px solid var(--border)" }}
              />
            </button>
          ) : (
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              {candidate.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {candidate.name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {candidate.party ?? t.candidates.noParty}
              {candidate.coalition ? ` · ${t.candidate.coalition}: ${candidate.coalition}` : ""}
            </p>
            {candidate.spectrum && (
              <div className="mt-2">
                <SpectrumBar spectrum={candidate.spectrum} candidateId={candidate.id} />
              </div>
            )}
            {candidate.last_updated && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
                {t.candidate.updatedAt} {formatDate(candidate.last_updated, lang)}
              </p>
            )}
          </div>
        </div>

        {candidate.short_bio && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {candidate.short_bio}
          </p>
        )}

        {/* Procuraduria */}
        {procLabel && (
          <div className={`mt-5 rounded-xl border px-4 py-3 ${procLabel.cls}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
              {t.candidate.procuraduria}
            </p>
            <p className="mt-0.5 text-sm font-semibold">{procLabel.label}</p>
            {candidate.procuraduria_summary && (
              <p className="mt-1.5 text-sm opacity-80 leading-relaxed">
                {candidate.procuraduria_summary}
              </p>
            )}
          </div>
        )}

        {/* Topics */}
        <section className="mt-8">
          <SectionHeading>{t.candidate.topicPositions}</SectionHeading>
          <TopicRadialChart topics={candidate.topics} />
        </section>

        {/* Controversies */}
        <section className="mt-8">
          <SectionHeading>{t.candidate.controversiesTitle}</SectionHeading>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            {t.candidate.controversiesDisclaimer}
          </p>
          {candidate.controversies.length === 0 ? (
            <EmptyState message={t.candidate.controversiesEmpty} />
          ) : (
            <div className="flex flex-col gap-3">
              {candidate.controversies.map((c) => (
                <ControversyCard key={c.id} c={c} sourceMap={sourceMap} />
              ))}
            </div>
          )}
        </section>

        {/* Sources */}
        <section className="mt-8">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-2 text-base font-bold pb-2 w-full text-left transition"
            style={{ color: "var(--foreground)", borderBottom: "2px solid var(--primary)" }}
          >
            <span
              className="text-gray-400 transition-transform duration-200"
              style={{ transform: showSources ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ›
            </span>
            {t.candidate.sourcesToggle} ({candidate.sources?.length ?? 0})
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: showSources ? "2000px" : "0px", opacity: showSources ? 1 : 0 }}
          >
            <p className="text-xs text-gray-400 mt-3 mb-3">
              {t.candidate.sourcesDisclaimer}
            </p>
            <SourceList sources={candidate.sources ?? []} />
          </div>
        </section>

        {/* Prev / Next navigation */}
        {(() => {
          const idx = CANDIDATE_ORDER.findIndex((c) => c.id === params.id);
          const prev = idx > 0 ? CANDIDATE_ORDER[idx - 1] : null;
          const next = idx < CANDIDATE_ORDER.length - 1 ? CANDIDATE_ORDER[idx + 1] : null;
          return (
            <div className="mt-10 flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: "var(--border)" }}>
              {prev ? (
                <Link
                  href={`/candidatos/${prev.id}`}
                  className="flex flex-col text-sm transition"
                  style={{ color: "var(--secondary)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{t.candidate.prev}</span>
                  <span className="font-medium">{prev.name}</span>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  href={`/candidatos/${next.id}`}
                  className="flex flex-col text-right text-sm transition"
                  style={{ color: "var(--secondary)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{t.candidate.next}</span>
                  <span className="font-medium">{next.name}</span>
                </Link>
              ) : (
                <Link
                  href="/candidatos"
                  className="flex flex-col text-right text-sm transition"
                  style={{ color: "var(--secondary)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{t.candidate.endOfList}</span>
                  <span className="font-medium">{t.candidate.viewAll}</span>
                </Link>
              )}
            </div>
          );
        })()}

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/quiz"
            className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            {t.candidate.quizCta}
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
