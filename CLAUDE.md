# Project: Colombia Matcher – 2026 Colombian Presidential Elections

## High-level product vision

This is **not** a plain survey with hand-tuned weights.

The core of the product is an automated research engine that:
- Continuously scans the web for **evidence** about each candidate:
  - speeches and interviews
  - news coverage and op-eds
  - social media posts
  - scandals, investigations, and legal cases
  - party affiliations, alliances, and associations
  - official programs and policy documents
- Runs a multi-agent pipeline to turn that evidence into **structured stance profiles**:
  - per topic and subtopic (security, economy, health, environment, fiscal policy, foreign policy, anticorruption, etc.)
  - per “dimension” (policy stance, behavior/ethics, alliances, rhetoric)
  - each stance backed by **citations** (URLs, quotes, dates).

The quiz is just a frontend that:
- asks users about their priorities, values, and positions,
- matches those answers to the **dynamic, evidence-based stance profiles**,
- shows not only a similarity score but also **why**, with links to the underlying evidence.

Static/manual weights are a fallback only.
The primary source of truth is the **agent-generated candidate profile**, continuously updated from public information.

---

## Current status (from previous tooling)

Repository and app:
- Repo exists and is synced: `renzorico/colombia-matcher`.
- The repository is public and has a basic structure for backend + frontend.
- The app already works as a **quiz + candidate matcher** (a first version of the matching logic exists).

Backend:
- A first version of the **multi-agent backend research pipeline** has been added.
- Backend API smoke tests pass (runtime works).
- There are **no automated backend tests** yet for research and scoring logic.

Frontend:
- Lint issues that blocked a clean check were fixed.
- TypeScript checks pass.
- The production build has been successfully run and validated.

What remains, conceptually:
- Make the research pipeline **stronger and more production-ready** by improving:
  - source collection (coverage, diversity, recency)
  - extraction quality (stance detection, evidence selection)
  - confidence/scoring logic (aggregating multiple sources)
  - scheduling and triggering updates automatically
  - an optional human review layer before overwriting candidate positions
- Add backend tests for:
  - stance extraction and aggregation
  - matching logic and scoring behavior
  - the overall research pipeline (end-to-end smoke tests)

---

## System goals for Claude

When working in this repository, you (Claude) should focus on:

1. Designing and improving the **multi-agent research system** that:
   - searches the web for diverse evidence about candidates,
   - extracts structured stances from that evidence,
   - aggregates these into candidate profiles with scores + confidence + citations,
   - keeps profiles updated with minimal manual work.

2. Ensuring the **matching system**:
   - reads from these generated profiles (not hard-coded weights),
   - matches users to candidates,
   - explains the match using transparent evidence.

3. Keeping the implementation:
   - modular (skills vs agents),
   - testable (unit + integration tests),
   - token-efficient (short prompts, structured outputs).

---

## Conceptual architecture

### Layers

1. **Research Layer (multi-agent):**
   - Role: continually build an evidence-backed **candidate knowledge base**.
   - Output: candidate profiles with topic/dimension scores, confidence, and citations.

2. **Matching Layer (quiz + matcher):**
   - Role: ask users structured questions, compute alignment vs the profiles, and surface explanations and evidence.

---

## Agents (high-level orchestrators)

Place these in an `agents/` directory (or equivalent) and keep them thin, delegating heavy logic to skills.

### `agents/research_agent.*`

Purpose:
- Orchestrate a full research/update run for one candidate or all candidates.

Responsibilities:
- For each candidate (and optionally each topic or dimension):
  - call source collection skill(s) to gather a diverse set of sources,
  - call content extraction skill(s) to fetch and clean text,
  - call stance extraction skill(s) on each source to produce micro-stances,
  - call profile aggregation skill(s) to combine micro-stances,
  - call profile publishing skill(s) to persist updated profiles (possibly in a “proposed” state for review).

### `agents/profile_refresh_agent.*`

Purpose:
- Provide a lightweight entry point for scheduled updates (cron / task scheduler).

Responsibilities:
- Trigger `research_agent` with:
  - a time window (e.g., “last 7 days”),
  - a subset of candidates or topics.
- Enforce rate limits, source caps, and basic guardrails.

### `agents/review_agent.*`

Purpose:
- Support the human review layer before stance changes go live.

Responsibilities:
- Compare existing stored profile vs newly proposed profile.
- Generate a **diff** per candidate and topic:
  - what changed (score / confidence / evidence),
  - which new sources and quotes are driving the change.
- Produce a human-readable summary and recommendation (accept / reject / flag).
- Prepare data for a simple admin UI or review API.

### `agents/matcher_agent.*`

Purpose:
- Use stored candidate profiles + user quiz answers to compute matches and explanations.

Responsibilities:
- Map user answers into a vector over topics/dimensions.
- Read candidate vectors from the profile store.
- Compute similarity scores (e.g., cosine similarity or weighted distance).
- Return:
  - ranked candidates,
  - per-topic alignment,
  - supporting evidence snippets.

---

## Skills (low-level, reusable utilities)

Place these in a `skills/` directory. Skills should be small, focused, and testable.

### `skills/source_collector.*`

Purpose:
- Collect **diverse, high-signal sources** for a candidate and topic.

Input:
- `candidateId`
- optional `topics`
- optional `timeWindow` (e.g., last 30 days)

Output:
- A list of standardized `Source` objects, e.g.:

```ts
type SourceType = "speech" | "interview" | "news" | "opinion" | "social" | "scandal" | "program" | "other";

interface Source {
  candidateId: string;
  type: SourceType;
  url: string;
  title?: string;
  snippet?: string;
  date?: string; // ISO
  sourceName?: string; // media outlet, platform, etc.
}
