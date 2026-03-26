/**
 * profiles — service layer for fetching a CandidateProfile.
 *
 * Currently runs the mock research pipeline in-process.
 * Replace getCandidateProfile with a DB/API lookup when the real pipeline
 * is production-ready; the interface stays the same.
 */

import { collectSources } from "../skills/source_collector";
import { extractContent } from "../skills/content_extractor";
import { extractStances } from "../skills/stance_extractor";
import { aggregateProfile } from "../skills/profile_aggregator";
import type { CandidateProfile } from "../skills/profile_aggregator";

/** All topics the mock extractors recognise. */
const DEFAULT_TOPICS = [
  "security",
  "economy",
  "health",
  "environment",
  "fiscal",
  "foreign-policy",
  "anticorruption",
];

/**
 * Return an aggregated CandidateProfile for the given candidate.
 *
 * @param candidateId    - Identifier used across the pipeline.
 * @param topics         - Topics to include; defaults to all known topics.
 * @param timeWindowDays - Only include sources from the last N days (default 30).
 */
export async function getCandidateProfile(
  candidateId: string,
  topics: string[] = DEFAULT_TOPICS,
  timeWindowDays = 30,
): Promise<CandidateProfile> {
  const sources = await collectSources(candidateId, topics, timeWindowDays);

  const allMicroStances = [];
  for (const source of sources) {
    const content = await extractContent(source);
    const stances = await extractStances(candidateId, topics, content);
    allMicroStances.push(...stances);
  }

  return aggregateProfile(candidateId, allMicroStances);
}
