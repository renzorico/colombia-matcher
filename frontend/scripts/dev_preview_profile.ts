/**
 * dev_preview_profile — manual preview of the full mock research chain:
 * source collection → content extraction → stance extraction → profile aggregation.
 *
 * Usage:
 *   npm run dev:preview:profile          (from frontend/)
 *   npx vite-node scripts/dev_preview_profile.ts
 */

import { collectSources } from "../skills/source_collector";
import { extractContent } from "../skills/content_extractor";
import { extractStances } from "../skills/stance_extractor";
import { aggregateProfile } from "../skills/profile_aggregator";

async function run() {
  const candidateId = process.argv[2] ?? "ivan-cepeda";
  const topics = [
    "security", "economy", "health", "environment",
    "fiscal", "foreign-policy", "anticorruption",
  ];

  const sources = await collectSources(candidateId, topics, 60);

  const allMicroStances = [];
  for (const source of sources) {
    const content = await extractContent(source);
    const stances = await extractStances(candidateId, topics, content);
    allMicroStances.push(...stances);
  }

  const profile = aggregateProfile(candidateId, allMicroStances);

  const summary = {
    candidateId,
    updatedAt: profile.updatedAt,
    topicScores: profile.topicScores.map((ts) => ({
      topic: ts.topic,
      dimension: ts.dimension,
      score: ts.score,
      confidence: ts.confidence,
      evidenceSamples: ts.evidenceSamples.map((ev) => ({
        url: ev.url,
        quote: ev.quote.slice(0, 120) + (ev.quote.length > 120 ? "…" : ""),
      })),
    })),
  };

  console.log(`\n=== Profile preview: ${candidateId} ===\n`);
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
