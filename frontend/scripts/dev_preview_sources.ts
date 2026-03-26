/**
 * dev_preview_sources — manual preview tool for the source → content pipeline.
 *
 * Usage:
 *   npm run dev:preview:sources          (from frontend/)
 *   npx vite-node scripts/dev_preview_sources.ts
 */

import { collectSources } from "../skills/source_collector";
import { extractContent } from "../skills/content_extractor";

const CANDIDATE_ID = "ivan-cepeda";
const TOPICS = ["security", "economy"];
const MAX_SOURCES = 5;
const CLEANED_TEXT_PREVIEW_LEN = 200;

async function main() {
  const mode = process.env.ANTHROPIC_API_KEY ? "real (Opus web search)" : "mock (FAKE_SOURCES)";
  console.log(`\nCollecting sources for "${CANDIDATE_ID}" | topics: ${TOPICS.join(", ")} | mode: ${mode}\n`);

  const sources = await collectSources(CANDIDATE_ID, TOPICS);

  if (sources.length === 0) {
    console.log("No sources found for the given candidate / topics.");
    return;
  }

  const preview = sources.slice(0, MAX_SOURCES);
  console.log(`Found ${sources.length} source(s). Extracting content for the first ${preview.length}...\n`);

  for (const source of preview) {
    const content = await extractContent(source);

    const summary = {
      type: content.source.type,
      url: content.source.url,
      language: content.language,
      cleanedText: content.cleanedText.slice(0, CLEANED_TEXT_PREVIEW_LEN) +
        (content.cleanedText.length > CLEANED_TEXT_PREVIEW_LEN ? "…" : ""),
      ...(content.translatedText !== undefined && { translatedText: content.translatedText }),
    };

    console.log(JSON.stringify(summary, null, 2));
    console.log("---");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
