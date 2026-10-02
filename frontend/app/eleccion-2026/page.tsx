"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import NetVotesChart from "@/components/election/NetVotesChart";
import RegionTable from "@/components/election/RegionTable";
import {
  CANDIDATE_COLORS,
  DOMESTIC_REGIONS,
  HEADLINE,
  ROUND1,
  ROUND2,
  RUNNER_UP,
  SOURCES,
  WINNER,
  netVotes,
} from "@/lib/election";
import { useLanguage } from "@/lib/i18n";
import { candidatePhoto, PHOTO_FOCUS } from "@/lib/photos";

const MAP_HEIGHT = 560;
/** First-round candidates shown individually; the rest fold into "others". */
const FIRST_ROUND_SHOWN = 5;

const ResultsMap = dynamic(() => import("@/components/election/ResultsMap"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto w-full rounded-xl" style={{ aspectRatio: "520 / 620", maxHeight: MAP_HEIGHT, backgroundColor: "#f0efec" }} />
  ),
});

function useFormatters() {
  const { lang } = useLanguage();
  const locale = lang === "es" ? "es-CO" : "en-US";
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const decimals = (digits: number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const [oneDecimal, twoDecimals] = [decimals(1), decimals(2)];
  const compactMillions = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return {
    formatNumber: (value: number) => integer.format(value),
    /** Region figures are published to one decimal. */
    formatPct: (value: number) => `${oneDecimal.format(value)}%`,
    /** National figures are published to two decimals. */
    formatNationalPct: (value: number) => `${twoDecimals.format(value)}%`,
    formatPoints: (value: number) => oneDecimal.format(value),
    formatNationalPoints: (value: number) => twoDecimals.format(value),
    formatMillions: (value: number) =>
      `${compactMillions.format(value / 1_000_000)} ${lang === "es" ? "millones" : "million"}`,
  };
}

export default function Eleccion2026Page() {
  const { t } = useLanguage();
  const fmt = useFormatters();

  const antioquia = DOMESTIC_REGIONS.find((r) => r.name === "Antioquia");
  const round1Gap = ROUND1.candidates[0].votes - ROUND1.candidates[1].votes;
  const insightValues: Record<string, string> = {
    runnerUpRegions: String(HEADLINE.regionsWonByRunnerUp),
    antioquiaNet: antioquia ? fmt.formatNumber(netVotes(antioquia)) : "",
    domesticNet: fmt.formatNumber(Math.round(HEADLINE.domesticNetVotes / 1000) * 1000),
    abroadNet: fmt.formatNumber(HEADLINE.abroadNetVotes),
    abroadShare: `${Math.round((HEADLINE.abroadNetVotes / HEADLINE.marginVotes) * 100)}%`,
    runnerUpGain: fmt.formatMillions(HEADLINE.runnerUpGain),
    winnerGain: fmt.formatMillions(HEADLINE.winnerGain),
    round1Gap: fmt.formatNumber(round1Gap),
  };

  const stats = [
    { label: t.election.statMargin, value: fmt.formatNumber(HEADLINE.marginVotes), sub: t.election.statMarginSub(fmt.formatNationalPoints(HEADLINE.marginPoints)) },
    { label: t.election.statTurnout, value: fmt.formatNationalPct(ROUND2.turnout_pct), sub: t.election.statTurnoutSub(fmt.formatNationalPct(ROUND1.turnout_pct)) },
    { label: t.election.statBlank, value: fmt.formatNationalPct(ROUND2.blank.pct), sub: `${fmt.formatNumber(ROUND2.blank.votes)} ${t.election.votesUnit}` },
    { label: t.election.statRegions, value: `${HEADLINE.regionsWonByWinner} / 33`, sub: t.election.statRegionsSub(HEADLINE.regionsWonByWinner, HEADLINE.regionsWonByRunnerUp) },
  ];

  const firstRoundShown = ROUND1.candidates.slice(0, FIRST_ROUND_SHOWN);
  const firstRoundOthers = ROUND1.candidates.slice(FIRST_ROUND_SHOWN);
  const othersPct = firstRoundOthers.reduce((sum, c) => sum + c.pct, 0);
  const firstRoundRows = [
    ...firstRoundShown.map((c) => ({ key: c.name, label: c.name, pct: c.pct, votes: c.votes, id: c.id })),
    { key: "others", label: t.election.firstRoundOthers, pct: othersPct, votes: firstRoundOthers.reduce((s, c) => s + c.votes, 0), id: null },
  ];
  const firstRoundMax = Math.max(...firstRoundRows.map((r) => r.pct));

  return (
    <main className="flex flex-1 flex-col">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-14 pb-12" style={{ backgroundColor: "var(--hero)" }}>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
            {t.election.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white">
            {t.election.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            {t.election.lead(fmt.formatNumber(HEADLINE.marginVotes), fmt.formatNationalPoints(HEADLINE.marginPoints))}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { candidate: WINNER, color: CANDIDATE_COLORS.espriella, align: "left" as const },
              { candidate: RUNNER_UP, color: CANDIDATE_COLORS.cepeda, align: "right" as const },
            ].map(({ candidate, color, align }) => {
              const photo = candidate.id ? candidatePhoto(candidate.id) : null;
              return (
                <div key={candidate.name} className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
                  {photo && (
                    <Image
                      src={photo}
                      alt={candidate.name}
                      width={56}
                      height={56}
                      unoptimized
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover"
                      style={{ objectPosition: PHOTO_FOCUS, border: `3px solid ${color}` }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{candidate.name}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-white">{fmt.formatNationalPct(candidate.pct)}</p>
                    <p className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {fmt.formatNumber(candidate.votes)} {t.election.votesUnit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex h-3 w-full gap-[2px] overflow-hidden rounded-sm" aria-hidden="true">
            <span style={{ flex: `${WINNER.pct} 1 0`, backgroundColor: CANDIDATE_COLORS.espriella }} />
            <span style={{ flex: `${ROUND2.blank.pct} 1 0`, backgroundColor: "rgba(255,255,255,0.35)" }} />
            <span style={{ flex: `${RUNNER_UP.pct} 1 0`, backgroundColor: CANDIDATE_COLORS.cepeda }} />
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b px-4" style={{ borderColor: "var(--border)" }}>
        <dl className="mx-auto grid max-w-3xl grid-cols-2 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-3 py-6 ${i % 2 === 1 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
              style={{ borderColor: "var(--border)" }}
            >
              <dt className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</dt>
              <dd className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: "var(--foreground)" }}>{s.value}</dd>
              <dd className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{s.sub}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-4 py-14">
        {/* ── Insights ────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading title={t.election.insightsTitle} />
          <div className="grid gap-4 sm:grid-cols-3">
            {t.election.insights.map((insight, i) => (
              <article key={insight.title} className="rounded-2xl bg-surface p-5" style={{ border: "1px solid var(--border)" }}>
                <span className="text-xs font-bold tabular-nums" style={{ color: "var(--accent)" }}>0{i + 1}</span>
                <h3 className="mt-1 text-base font-bold leading-snug" style={{ color: "var(--secondary)" }}>{insight.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{insight.body(insightValues)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading title={t.election.mapTitle} subtitle={t.election.mapSubtitle} />
          <div className="rounded-2xl bg-surface p-4" style={{ border: "1px solid var(--border)" }}>
            <ResultsMap formatNumber={fmt.formatNumber} formatPct={fmt.formatPct} formatPoints={fmt.formatPoints} />
          </div>
        </section>

        {/* ── Net votes ───────────────────────────────────────────────────── */}
        <section>
          <SectionHeading title={t.election.contributorsTitle} subtitle={t.election.contributorsSubtitle} />
          <div className="rounded-2xl bg-surface p-5" style={{ border: "1px solid var(--border)" }}>
            <NetVotesChart formatNumber={fmt.formatNumber} />
          </div>
        </section>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading title={t.election.tableTitle} />
          <div className="rounded-2xl bg-surface p-5" style={{ border: "1px solid var(--border)" }}>
            <RegionTable formatNumber={fmt.formatNumber} formatPct={fmt.formatPct} formatPoints={fmt.formatPoints} />
          </div>
        </section>

        {/* ── First round ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading title={t.election.firstRoundTitle} subtitle={t.election.firstRoundSubtitle(fmt.formatNationalPct(ROUND1.turnout_pct))} />
          <div className="rounded-2xl bg-surface p-5" style={{ border: "1px solid var(--border)" }}>
            <ul className="flex flex-col gap-3">
              {firstRoundRows.map((row, i) => {
                const color = i === 0 ? CANDIDATE_COLORS.espriella : i === 1 ? CANDIDATE_COLORS.cepeda : "#a8a6a1";
                return (
                  <li key={row.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span style={{ color: "var(--foreground)" }}>
                        {row.id ? (
                          <Link href={`/candidatos/${row.id}`} className="hover:underline underline-offset-2">{row.label}</Link>
                        ) : (
                          row.label
                        )}
                      </span>
                      <span className="tabular-nums">
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{fmt.formatNationalPct(row.pct)}</span>
                        <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>{fmt.formatNumber(row.votes)}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-r" style={{ backgroundColor: "#f0efec" }}>
                      <div className="h-full rounded-r" style={{ width: `${(row.pct / firstRoundMax) * 100}%`, backgroundColor: color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Quiz CTA ────────────────────────────────────────────────────── */}
        <section className="rounded-2xl px-6 py-8 text-center" style={{ backgroundColor: "var(--hero)" }}>
          <h2 className="text-2xl font-bold text-white">{t.election.quizCtaTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            {t.election.quizCtaBody}
          </p>
          <Link
            href="/quiz"
            className="mt-5 inline-block rounded-full px-7 py-3 text-sm font-bold shadow transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
          >
            {t.election.quizCtaButton}
          </Link>
        </section>

        {/* ── Sources ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading title={t.election.sourcesTitle} />
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{t.election.dataNote}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {SOURCES.map((source) => (
              <li key={source.url} className="text-sm">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: "var(--secondary)" }}>
                  {source.title}
                </a>
                <span style={{ color: "var(--muted)" }}> · {source.publisher}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--foreground)" }}>{title}</h2>
      {subtitle && <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{subtitle}</p>}
    </div>
  );
}
