/**
 * POST /api/match  [DEPRECATED — dev/debug only]
 *
 * Legacy TypeScript mock matching pipeline. No longer used by the production
 * quiz/results flow.  The production path calls the Python backend directly:
 *   POST http://localhost:8000/quiz/submit
 *
 * Kept here so existing dev tooling (debug profile page, preview scripts)
 * does not break. Do not expose or link this route in production UI.
 */

import { NextResponse } from "next/server";
import { getCandidateProfile } from "@/services/profiles";
import { computeProfileMatch } from "@/services/matcher";
import { buildUserTopicScores } from "@/lib/quiz";
import type { MatchResult } from "@/services/matcher";

/** All candidates covered by the mock pipeline. */
const CANDIDATE_IDS = [
  "ivan-cepeda",
  "german-vargas-lleras",
  "abelardo-de-la-espriella",
  "paloma-valencia",
  "sergio-fajardo",
  "claudia-lopez",
];

/** 60-day window so that all fixture sources (some ~45 days old) are included. */
const TIME_WINDOW_DAYS = 60;

/**
 * Static mirror of backend/questions_v1.json with axis + weight.
 * The Python backend's /questions endpoint strips the axis field, so we
 * maintain this mapping here for server-side topic score computation.
 */
const QUESTION_META: { id: string; axis: string; weight: number; bucket: string; statement: string }[] = [
  { id: "q01", axis: "security",           weight: 2, bucket: "", statement: "" },
  { id: "q02", axis: "security",           weight: 3, bucket: "", statement: "" },
  { id: "q03", axis: "security",           weight: 1, bucket: "", statement: "" },
  { id: "q04", axis: "security",           weight: 2, bucket: "", statement: "" },
  { id: "q05", axis: "economy",            weight: 3, bucket: "", statement: "" },
  { id: "q06", axis: "economy",            weight: 1, bucket: "", statement: "" },
  { id: "q07", axis: "economy",            weight: 2, bucket: "", statement: "" },
  { id: "q08", axis: "economy",            weight: 3, bucket: "", statement: "" },
  { id: "q09", axis: "health",             weight: 1, bucket: "", statement: "" },
  { id: "q10", axis: "health",             weight: 2, bucket: "", statement: "" },
  { id: "q11", axis: "health",             weight: 3, bucket: "", statement: "" },
  { id: "q12", axis: "energy_environment", weight: 1, bucket: "", statement: "" },
  { id: "q13", axis: "energy_environment", weight: 2, bucket: "", statement: "" },
  { id: "q14", axis: "energy_environment", weight: 3, bucket: "", statement: "" },
  { id: "q15", axis: "fiscal",             weight: 1, bucket: "", statement: "" },
  { id: "q16", axis: "fiscal",             weight: 2, bucket: "", statement: "" },
  { id: "q17", axis: "fiscal",             weight: 3, bucket: "", statement: "" },
  { id: "q18", axis: "foreign_policy",     weight: 1, bucket: "", statement: "" },
  { id: "q19", axis: "foreign_policy",     weight: 2, bucket: "", statement: "" },
  { id: "q20", axis: "foreign_policy",     weight: 3, bucket: "", statement: "" },
  { id: "q21", axis: "anticorruption",     weight: 1, bucket: "", statement: "" },
  { id: "q22", axis: "anticorruption",     weight: 2, bucket: "", statement: "" },
  { id: "q23", axis: "security",           weight: 3, bucket: "", statement: "" },
  { id: "q24", axis: "economy",            weight: 1, bucket: "", statement: "" },
  { id: "q25", axis: "health",             weight: 2, bucket: "", statement: "" },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { answers: Record<string, number> };
    const { answers } = body;

    // Convert question-ID answers to weighted per-topic scores.
    const topicScores = buildUserTopicScores(QUESTION_META, answers);

    // Build profiles in parallel — all mock/in-memory, no external I/O.
    const profiles = await Promise.all(
      CANDIDATE_IDS.map((id) => getCandidateProfile(id, undefined, TIME_WINDOW_DAYS)),
    );

    const matches: MatchResult[] = profiles
      .map((profile) => computeProfileMatch(topicScores, profile))
      .sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json(matches);
  } catch (err) {
    console.error("[/api/match] Error computing matches:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
