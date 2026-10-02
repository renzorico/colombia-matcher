/**
 * api.ts — typed data access for candidates, questions and quiz scoring.
 *
 * Everything runs in the browser from the bundled canonical JSON in
 * frontend/data/ (no backend). The functions stay async so pages can treat
 * them like any other data source.
 *
 * Projections mirror the former FastAPI endpoints (backend/main.py):
 * internal fields such as stance direction and question notes are not exposed.
 */

import candidatesData from "@/data/candidates_canonical.json";
import questionsData from "@/data/questions_canonical.json";
import { computeAffinity, type Answers, type Result, type ScoringCandidate, type ScoringQuestion } from "@/lib/scorer";
import { resolveTopicId } from "@/lib/topics";

export type { Result } from "@/lib/scorer";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  bucket: string;
  statement: string;
  weight: number;
}

/** Lightweight candidate for the /candidatos listing. */
export interface CandidateSummary {
  id: string;
  name: string;
  party: string | null;
  coalition: string | null;
  spectrum: string | null;
  short_bio: string | null;
  image_url: string | null;
}

export interface Controversy {
  id: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | string;
  status: string;
  date: string | null;
  notes: string | null;
  source_ids: string[];
}

export interface Proposal {
  id: string;
  topic_id: string;
  title: string;
  summary: string;
  plain_language_summary: string;
  status: string;
  source_ids: string[];
}

export interface CandidateTopic {
  topic_id: string;
  topic_label: string;
  summary: string | null;
  plain_language_summary: string | null;
  confidence: number | null;
  stance_score: number | null;
}

export interface Source {
  id: string;
  type: string | null;
  title: string | null;
  publisher: string | null;
  url: string;
  published_at: string | null;
  reliability_notes: string | null;
}

/** Full candidate data for the /candidatos/[id] detail page. */
export interface CandidateFull extends CandidateSummary {
  topics: CandidateTopic[];
  proposals: Proposal[];
  controversies: Controversy[];
  sources: Source[];
  procuraduria_status: string | null;
  procuraduria_summary: string | null;
  profile_status: string | null;
  last_updated: string | null;
}

// ---------------------------------------------------------------------------
// Raw canonical shapes (only the fields read here)
// ---------------------------------------------------------------------------

interface RawTopic extends CandidateTopic {
  evidence_ids?: string[];
}

interface RawCandidate extends CandidateSummary {
  topics: RawTopic[];
  proposals: Proposal[];
  controversies: Controversy[];
  metadata?: { procuraduria_status?: string | null; procuraduria_summary?: string | null };
  profile_status: string | null;
  last_updated: string | null;
}

interface RawSource extends Partial<Source> {
  id: string;
  url: string;
}

interface RawQuestion extends Question {
  topic_id: string;
  topic_label: string;
  direction: string;
}

const QUESTION_COUNT = 25;
const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

const rawCandidates = candidatesData.candidates as unknown as RawCandidate[];
const rawSources = candidatesData.sources as unknown as RawSource[];
const rawQuestions = questionsData as unknown as RawQuestion[];

const sourcesById = new Map(rawSources.map((s) => [s.id, s]));

const canonicalTopic = (id: string): string => resolveTopicId(id) ?? id;

const scoringCandidates: ScoringCandidate[] = rawCandidates.map((c) => ({
  id: c.id,
  name: c.name,
  stances: Object.fromEntries(c.topics.map((t) => [canonicalTopic(t.topic_id), t.stance_score])),
}));

const scoringQuestions: ScoringQuestion[] = rawQuestions.map((q) => ({
  id: q.id,
  axis: canonicalTopic(q.topic_id),
  weight: q.weight,
  direction: q.direction,
}));

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

function toSummary(c: RawCandidate): CandidateSummary {
  return {
    id: c.id,
    name: c.name,
    party: c.party ?? null,
    coalition: c.coalition ?? null,
    spectrum: c.spectrum ?? null,
    short_bio: c.short_bio ?? null,
    image_url: c.image_url ?? null,
  };
}

/** Sources cited by any topic, proposal or controversy, sorted by ID. */
function citedSources(c: RawCandidate): Source[] {
  const ids = new Set<string>([
    ...c.topics.flatMap((t) => t.evidence_ids ?? []),
    ...c.proposals.flatMap((p) => p.source_ids ?? []),
    ...c.controversies.flatMap((x) => x.source_ids ?? []),
  ]);
  return [...ids]
    .sort()
    .map((id) => sourcesById.get(id))
    .filter((s): s is RawSource => Boolean(s?.url))
    .map((s) => ({
      id: s.id,
      type: s.type ?? null,
      title: s.title ?? null,
      publisher: s.publisher ?? null,
      url: s.url,
      published_at: s.published_at ?? null,
      reliability_notes: s.reliability_notes ?? null,
    }));
}

function toFull(c: RawCandidate): CandidateFull {
  return {
    ...toSummary(c),
    topics: c.topics.map((t) => ({
      topic_id: t.topic_id,
      topic_label: t.topic_label,
      summary: t.summary ?? null,
      plain_language_summary: t.plain_language_summary ?? null,
      confidence: t.confidence ?? null,
      stance_score: t.stance_score ?? null,
    })),
    proposals: c.proposals ?? [],
    controversies: c.controversies ?? [],
    sources: citedSources(c),
    procuraduria_status: c.metadata?.procuraduria_status ?? null,
    procuraduria_summary: c.metadata?.procuraduria_summary ?? null,
    profile_status: c.profile_status ?? null,
    last_updated: c.last_updated ?? null,
  };
}

function validateAnswers(answers: Answers): void {
  const entries = Object.entries(answers);
  if (entries.length !== QUESTION_COUNT) {
    throw new Error(`Expected ${QUESTION_COUNT} answers, got ${entries.length}.`);
  }
  for (const [qid, score] of entries) {
    if (!Number.isInteger(score) || score < LIKERT_MIN || score > LIKERT_MAX) {
      throw new Error(`Answer for '${qid}' must be an integer ${LIKERT_MIN}–${LIKERT_MAX}, got ${score}.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export async function getQuestions(): Promise<Question[]> {
  return rawQuestions.map((q) => ({
    id: q.id,
    bucket: q.topic_label ?? canonicalTopic(q.topic_id),
    statement: q.statement,
    weight: q.weight,
  }));
}

export async function getCandidates(): Promise<CandidateSummary[]> {
  return rawCandidates.map(toSummary);
}

export async function getCandidatesFull(): Promise<CandidateFull[]> {
  return rawCandidates.map(toFull);
}

/** Rank candidates by affinity with 25 Likert answers (1–5). */
export async function submitQuiz(answers: Answers): Promise<Result[]> {
  validateAnswers(answers);
  return computeAffinity(answers, scoringCandidates, scoringQuestions);
}

/** Exposed for parity tests against the Python reference scorer. */
export const _scoringInputs = { candidates: scoringCandidates, questions: scoringQuestions };
