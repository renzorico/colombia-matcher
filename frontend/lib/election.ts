/**
 * election.ts — typed access to the official 2026 results and derived figures.
 *
 * Data: frontend/data/election_results_2026.json, built and validated by
 * scripts/build_election_results.py.
 */

import resultsData from "@/data/election_results_2026.json";

export interface VoteShare {
  votes: number;
  pct: number;
}

export interface RegionResult {
  name: string;
  /** NOMBRE_DPT in /data/colombia-departments.json; null for votes abroad. */
  geoName: string | null;
  abroad: boolean;
  espriella: VoteShare;
  cepeda: VoteShare;
  blank: VoteShare;
  valid: number;
  invalid: number;
}

export interface NationalCandidate {
  name: string;
  /** Candidate profile slug when the candidate is covered by the quiz. */
  id: string | null;
  votes: number;
  pct: number;
}

export interface RoundResult {
  date: string;
  registered: number;
  votes_cast: number;
  turnout_pct: number;
  blank: VoteShare;
  invalid: VoteShare;
  candidates: NationalCandidate[];
}

export interface ElectionSource {
  title: string;
  publisher: string;
  url: string;
}

interface ElectionResults {
  meta: { generated_at: string; notes: string; sources: ElectionSource[] };
  national: { round1: RoundResult; round2: RoundResult; inauguration: string };
  round2ByRegion: RegionResult[];
}

const data = resultsData as ElectionResults;

export const ROUND1 = data.national.round1;
export const ROUND2 = data.national.round2;
export const INAUGURATION_DATE = data.national.inauguration;
export const SOURCES = data.meta.sources;
export const REGIONS: readonly RegionResult[] = data.round2ByRegion;

export const DOMESTIC_REGIONS = REGIONS.filter((r) => !r.abroad);
export const ABROAD = REGIONS.find((r) => r.abroad) ?? null;

const [WINNER, RUNNER_UP] = ROUND2.candidates;
export { WINNER, RUNNER_UP };

/** Candidate colours (validated: CVD ΔE 24.7, both ≥3:1 on white). */
export const CANDIDATE_COLORS = {
  espriella: "#2a78d6",
  cepeda: "#eb6834",
} as const;

/** Positive = De la Espriella ahead, in percentage points. */
export function marginPoints(region: RegionResult): number {
  return region.espriella.pct - region.cepeda.pct;
}

/** Positive = net votes for De la Espriella. */
export function netVotes(region: RegionResult): number {
  return region.espriella.votes - region.cepeda.votes;
}

/**
 * Diverging bins by winning margin. Each arm is one hue light→dark,
 * validated as an ordinal ramp against white.
 */
export const MARGIN_BINS = [
  { min: 0, max: 5, label: "0–5" },
  { min: 5, max: 15, label: "5–15" },
  { min: 15, max: 30, label: "15–30" },
  { min: 30, max: Infinity, label: "30+" },
] as const;

const ESPRIELLA_RAMP = ["#86b6ef", "#5598e7", "#256abf", "#104281"] as const;
const CEPEDA_RAMP = ["#f09a74", "#e57a4a", "#c9541f", "#94391a"] as const;

export function marginBinIndex(points: number): number {
  const size = Math.abs(points);
  const index = MARGIN_BINS.findIndex((bin) => size >= bin.min && size < bin.max);
  return index === -1 ? MARGIN_BINS.length - 1 : index;
}

export function marginColor(points: number): string {
  const ramp = points >= 0 ? ESPRIELLA_RAMP : CEPEDA_RAMP;
  return ramp[marginBinIndex(points)];
}

export const LEGEND_RAMPS = { espriella: ESPRIELLA_RAMP, cepeda: CEPEDA_RAMP };

// ---------------------------------------------------------------------------
// Headline figures
// ---------------------------------------------------------------------------

const round1Votes = (id: string) => ROUND1.candidates.find((c) => c.id === id)?.votes ?? 0;

export const HEADLINE = {
  marginVotes: WINNER.votes - RUNNER_UP.votes,
  marginPoints: Math.round((WINNER.pct - RUNNER_UP.pct) * 100) / 100,
  regionsWonByWinner: DOMESTIC_REGIONS.filter((r) => netVotes(r) > 0).length,
  regionsWonByRunnerUp: DOMESTIC_REGIONS.filter((r) => netVotes(r) < 0).length,
  abroadNetVotes: ABROAD ? netVotes(ABROAD) : 0,
  domesticNetVotes: DOMESTIC_REGIONS.reduce((sum, r) => sum + netVotes(r), 0),
  extraVotesCast: ROUND2.votes_cast - ROUND1.votes_cast,
  winnerGain: WINNER.votes - round1Votes("abelardo-de-la-espriella"),
  runnerUpGain: RUNNER_UP.votes - round1Votes("ivan-cepeda"),
};

/** Regions ordered by net votes, largest contribution to each candidate first. */
export function topContributors(count: number) {
  const sorted = [...REGIONS].sort((a, b) => netVotes(b) - netVotes(a));
  return {
    espriella: sorted.slice(0, count),
    cepeda: sorted.slice(-count).reverse(),
  };
}
