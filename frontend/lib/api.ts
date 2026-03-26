/**
 * api.ts — typed client for the canonical Python backend.
 *
 * All production data flows through these functions.
 * Set NEXT_PUBLIC_API_URL to point at the backend in staging/production;
 * defaults to http://localhost:8000 for local development.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status} on ${path}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  bucket: string;
  statement: string;
  weight: number;
}

/** One candidate in the ranked quiz result. */
export interface Result {
  /** Slug ID (e.g. "paloma-valencia") — use for /candidatos/[id] links. */
  id: string;
  /** Full display name (e.g. "Paloma Valencia"). */
  candidate: string;
  /** Affinity percentage 0–100. */
  score: number;
  /** Per-topic affinity percentage, keyed by canonical topic ID. */
  breakdown: Record<string, number>;
}

/** Lightweight candidate for the /candidatos listing. */
export interface CandidateSummary {
  id: string;
  name: string;
  party: string | null;
  coalition: string | null;
  spectrum: string | null;
  short_bio: string | null;
}

export interface Controversy {
  id: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | string;
  status: string;
  date: string | null;
}

export interface CandidateTopic {
  topic_id: string;
  topic_label: string;
  summary: string | null;
  plain_language_summary: string | null;
}

export interface Source {
  id: string;
  title: string | null;
  publisher: string | null;
  url: string;
  published_at: string | null;
}

/** Full candidate data for the /candidatos/[id] detail page. */
export interface CandidateFull extends CandidateSummary {
  topics: CandidateTopic[];
  proposals: unknown[];
  controversies: Controversy[];
  sources: Source[];
  procuraduria_status: string | null;
  procuraduria_summary: string | null;
  profile_status: string | null;
  last_updated: string | null;
}

// ---------------------------------------------------------------------------
// Review workflow types (used by admin/review page)
// ---------------------------------------------------------------------------

export interface ProposalEvidence {
  url: string | null;
  title: string | null;
  publisher: string | null;
  quote: string | null;
  date: string | null;
}

export interface ProposedUpdate {
  id: string;
  candidate_id: string;
  topic_id: string;
  field: string;
  current_value: unknown;
  proposed_value: unknown;
  proposed_summary: string | null;
  proposed_plain_language_summary: string | null;
  evidence: ProposalEvidence;
  proposed_by: string;
  proposed_at: string;
  status: "pending" | "approved" | "rejected";
  agent_confidence: number;
  agent_notes: string | null;
}

export interface ReviewDecision {
  id: string;
  proposal_id: string;
  decision: "approved" | "rejected";
  reviewer: string | null;
  reviewed_at: string | null;
  notes: string | null;
  will_publish: boolean;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getQuestions(): Promise<Question[]> {
  return apiFetch<Question[]>("/questions");
}

export async function getCandidates(): Promise<CandidateSummary[]> {
  return apiFetch<CandidateSummary[]>("/candidates");
}

export async function getCandidatesFull(): Promise<CandidateFull[]> {
  return apiFetch<CandidateFull[]>("/candidates/full");
}

export async function submitQuiz(
  answers: Record<string, number>,
): Promise<Result[]> {
  const data = await apiFetch<{ results: Result[] }>("/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return data.results;
}

export async function getPendingProposals(): Promise<ProposedUpdate[]> {
  return apiFetch<ProposedUpdate[]>("/review/pending");
}

export async function getAllProposals(): Promise<ProposedUpdate[]> {
  return apiFetch<ProposedUpdate[]>("/review/all");
}

export async function getReviewLog(): Promise<ReviewDecision[]> {
  return apiFetch<ReviewDecision[]>("/review/log");
}

export async function explainCandidate(
  name: string,
  answers: Record<string, number>,
): Promise<string> {
  const params = new URLSearchParams({ answers: JSON.stringify(answers) });
  const data = await apiFetch<{ candidate: string; explanation: string }>(
    `/explain/${encodeURIComponent(name)}?${params}`,
  );
  return data.explanation;
}
