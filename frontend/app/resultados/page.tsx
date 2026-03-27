"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  submitQuiz,
  getCandidates,
  type Result,
  type CandidateSummary,
} from "@/lib/api";
import { SpectrumBar } from "@/components/SpectrumBar";
import { TOPIC_COLORS, AXIS_LABELS_ES as TOPIC_LABELS, TOPIC_IDS } from "@/lib/topics";
import ResultsCharts from "@/components/ResultsCharts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rankLabel(rank: number): string {
  if (rank === 2) return "Segunda mayor afinidad";
  if (rank === 3) return "Tercera mayor afinidad";
  return `#${rank}`;
}

// Key points: top agreements + disagreements derived from breakdown
function KeyPoints({ breakdown }: { breakdown: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const agreements = entries.slice(0, 2);
  const disagreements = [...entries].sort((a, b) => a[1] - b[1]).slice(0, 2);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-medium transition-colors"
        style={{ color: "var(--secondary)" }}
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
        {open ? "Ocultar puntos clave" : "Ver puntos clave"}
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? "300px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
              Mayor acuerdo
            </p>
            {agreements.map(([topicId, pct]) => (
              <div key={topicId} className="flex items-center justify-between text-xs mb-0.5">
                <span style={{ color: "var(--foreground)" }}>{TOPIC_LABELS[topicId] ?? topicId}</span>
                <span className="font-semibold" style={{ color: "#5C8A6B" }}>{pct}%</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
              Mayor diferencia
            </p>
            {disagreements.map(([topicId, pct]) => (
              <div key={topicId} className="flex items-center justify-between text-xs mb-0.5">
                <span style={{ color: "var(--foreground)" }}>{TOPIC_LABELS[topicId] ?? topicId}</span>
                <span className="font-semibold" style={{ color: "#C4622D" }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
  const [noQuizData, setNoQuizData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) { setNoQuizData(true); setLoading(false); return; }
    let answers: Record<string, number>;
    try {
      answers = JSON.parse(stored) as Record<string, number>;
    } catch { setNoQuizData(true); setLoading(false); return; }
    if (Object.keys(answers).length === 0) { setNoQuizData(true); setLoading(false); return; }

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

  const siteUrl = "https://colombia-matcher.vercel.app";

  function shareText(top: Result) {
    return `Hice el quiz de Elecciones Colombia 2026 y mi candidato más afín es ${top.candidate} (${top.score}%). ¿Y tú? ${siteUrl}`;
  }

  async function handleShare() {
    const top = results[0];
    if (!top) return;
    const text = shareText(top);
    if (typeof navigator.share === "function") {
      try { await navigator.share({ text, url: siteUrl }); return; } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleShareWhatsApp() {
    const top = results[0];
    if (!top) return;
    const text = encodeURIComponent(shareText(top));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function handleShareTwitter() {
    const top = results[0];
    if (!top) return;
    const text = encodeURIComponent(shareText(top));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  }

  // ── No quiz data guard ────────────────────────────────────────────────────
  if (noQuizData) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          Completa el quiz primero para ver tus resultados.
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Responde 25 preguntas para descubrir con qué candidato tienes más afinidad.
        </p>
        <Link
          href="/quiz"
          className="rounded-full px-6 py-2.5 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
        >
          Hacer el quiz →
        </Link>
      </main>
    );
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
              <Image
                src={topMeta.image_url}
                alt={top.candidate}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                style={{ border: "2px solid var(--primary)" }}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top.candidate)}&background=6B6B6B&color=fff&size=200`; }}
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

          {/* Topic mini-bars — show all 7 topics, fill 0 for missing */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOPIC_IDS.map((topicId) => (
              <TopicMiniBar key={topicId} topicId={topicId} pct={top.breakdown[topicId] ?? 0} />
            ))}
          </div>
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
                  <Image
                    src={meta.image_url}
                    alt={r.candidate}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1px solid var(--border)" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.candidate)}&background=6B6B6B&color=fff&size=200`; }}
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
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {Object.entries(r.breakdown).map(([topicId, pct]) => (
                    <TopicMiniBar key={topicId} topicId={topicId} pct={pct} />
                  ))}
                </div>
              )}

              {/* Key agreement/disagreement points */}
              {Object.keys(r.breakdown).length > 0 && (
                <KeyPoints breakdown={r.breakdown} />
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
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#1a2e6b";
                (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                (e.currentTarget as HTMLElement).style.borderColor = "#1a2e6b";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              {r.candidate}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Share section ─────────────────────────────────────────────────── */}
      <div
        className="mt-8 w-full max-w-2xl rounded-xl px-5 py-5"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <p className="text-sm font-bold mb-4 text-center" style={{ color: "var(--foreground)" }}>
          Comparte tus resultados
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.527 5.845L0 24l6.318-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.893 9.893 0 01-5.048-1.379l-.361-.214-3.754.896.938-3.658-.235-.375A9.865 9.865 0 012.106 12c0-5.455 4.44-9.894 9.894-9.894 5.455 0 9.894 4.44 9.894 9.894 0 5.455-4.44 9.894-9.894 9.894z"/>
            </svg>
            WhatsApp
          </button>

          {/* Twitter/X */}
          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter / X
          </button>

          {/* Copy link */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </button>

          {/* Download PDF */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 16l-4-4h2.5V4h3v8H16l-4 4z"/>
              <path d="M4 18h16v2H4z"/>
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <div className="mt-6 mb-8 flex flex-col items-center gap-3">
        <Link
          href="/candidatos"
          className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
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
