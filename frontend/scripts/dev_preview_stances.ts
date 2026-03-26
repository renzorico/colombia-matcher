/**
 * dev_preview_stances — manual preview tool for the source → content → stance pipeline.
 *
 * Usage:
 *   npm run dev:preview:stances          (from frontend/)
 *   npx vite-node scripts/dev_preview_stances.ts
 */

import { collectSources } from "../skills/source_collector";
import { extractContent } from "../skills/content_extractor";
import { extractStances, type MicroStance } from "../skills/stance_extractor";

const QUOTE_PREVIEW_LEN = 100;

async function run() {
  const candidateId = "ivan-cepeda";
  const topics = ["security", "economy", "anticorruption"];

  const sources = await collectSources(candidateId, topics, 30);

  const allStances: MicroStance[] = [];

  for (const source of sources) {
    const content = await extractContent(source);
    const stances = await extractStances(candidateId, topics, content);
    allStances.push(...stances);
  }

  const stancesByTopic: Record<string, object[]> = {};
  for (const topic of topics) {
    stancesByTopic[topic] = allStances
      .filter((s) => s.topic === topic)
      .map((s) => ({
        topic: s.topic,
        dimension: s.dimension,
        stanceScore: s.stanceScore,
        stanceLabel: s.stanceLabel,
        evidence: {
          url: s.evidence.url,
          quote:
            s.evidence.quote.length > QUOTE_PREVIEW_LEN
              ? s.evidence.quote.slice(0, QUOTE_PREVIEW_LEN) + "…"
              : s.evidence.quote,
        },
      }));
  }

  const summary = {
    candidateId,
    totalSources: sources.length,
    totalMicroStances: allStances.length,
    stancesByTopic,
  };

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
