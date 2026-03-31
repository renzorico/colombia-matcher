# Changelog

A human-readable history of the major phases of **nobotestuvoto** (originally *colombia-matcher*) — a civic tool for the Colombian presidential elections 2026.

---

## Phase 6 — Bilingual support (EN/ES) · March 30–31, 2026

The app became fully bilingual. A language toggle (ES | EN) was added to the navbar and persists across sessions via `localStorage`. All UI strings were centralized into a single `translations.ts` file to make future maintenance simple.

**What was translated:**
- All 25 quiz questions (English statements written from scratch and manually refined)
- Simple explanation bubbles ("Explícamelo fácil") in both languages
- Every page: home, quiz, results, candidates, candidate profiles, methodology, behind-the-scenes, electoral risks
- Spectrum position labels (Left / Center / Right) across all candidate cards and profile pages
- Electoral risk stat boxes
- Charts and result breakdowns

**Other changes in this phase:**
- Renamed the English-language title from "Clarify Your Vote" to "Find Your Vote"
- Added a post-results feedback CTA linking to the creator's LinkedIn profile

---

## Phase 5 — Electoral risks page · March 28, 2026

A new standalone page (`/riesgos-electorales`) was added, built entirely on official data from Colombia's *Defensoría del Pueblo* (ATE 013-2025) and the *Misión de Observación Electoral (MOE)*.

**What it includes:**
- Key figures: 69 municipalities under immediate action, 670 at some level of risk, 4.5M voters at extreme risk
- Interactive choropleth map of Colombia colored by departmental risk level
- Three documented mechanisms by which armed groups distort electoral competition
- Critical finding: 10 municipalities in Nariño and Cauca with +50% for a single party, cross-referenced with maximum-alert zones
- Stacked proportional bar showing party distribution across 69 high-risk municipalities (legislative elections, March 8 2026)
- Candidate flip cards showing each candidate's position on armed groups, *paz total*, and their key security proposal
- Documented incidents from the March 8 legislative elections
- Primary source cards linking to official Defensoría and MOE documents

The page went through multiple rounds of audit, UX polish, and content accuracy review after launch.

---

## Phase 4 — Candidate data enrichment & UI overhaul · March 27–28, 2026

A major content and visual pass across the whole app.

**Data:**
- Added real proposals, controversies, and source citations for all 6 candidates
- Added manually curated key quotes per candidate per topic
- All 19 source URLs verified and replaced with working, correctly-pointing links
- Ran enrichment scripts to improve profile content depth

**UI:**
- Full rebrand to *Aclara tu voto* (later renamed *nobotestuvoto*)
- Colombian color palette, new hero colors, topic-specific color system
- Local candidate photos added for all 6 candidates; photos zoomed and cropped consistently
- Spectrum tooltip showing candidate political positioning on hover
- Photo lightbox for full-size candidate photos
- Methodology page redesigned with accordion FAQ and topic weight bars
- Results page: key-points breakdown, share-to-social buttons, downloadable story card (PNG)
- OG/social meta tags for all pages

---

## Phase 3 — Canonical data model & backend stabilization · March 26, 2026

The backend was restructured around a single canonical JSON file (`candidates_canonical.json`) as the source of truth.

**What changed:**
- Designed a 7-topic schema (Security, Economy, Health, Energy & Environment, Fiscal Policy, Foreign Policy, Anti-corruption) with explicit weights
- Migrated all candidate data to the canonical format with stance scores, confidence levels, and citations
- Backend test suite: 88 tests covering scoring logic, matching, and API endpoints
- Frontend migrated to consume only the canonical backend API (no more local mocks)
- Human review workflow: proposed changes are staged separately and must be explicitly approved before reaching canonical data
- Candidate detail pages now surface proposals, controversies, sources, and political spectrum position

---

## Phase 2 — Multi-agent research pipeline · March 21, 2026

An automated research pipeline was scaffolded to keep candidate profiles up to date from public sources.

**What was built:**
- Source collector skill: gathers speeches, interviews, news, and social media for a given candidate and topic
- Stance extractor skill: uses LLM calls to extract structured positions from raw text
- Profile aggregator skill: combines micro-stances from multiple sources into a scored profile with confidence and citations
- Review agent: generates human-readable diffs between proposed and published profiles
- Matcher agent: computes affinity between user quiz answers and candidate profiles using weighted averages
- Research agent and profile refresh agent as orchestrators

The pipeline was designed for manual-first operation: no change reaches the canonical data without human approval.

---

## Phase 1 — Initial release · March 20, 2026

First working version of the app: a quiz-based candidate matcher for the Colombian presidential elections 2026.

**Core features:**
- 25 questions covering 7 thematic axes, 1–5 scale answers
- Weighted affinity calculation per topic; overall score normalized to 0–100%
- Results page showing ranked candidates with per-topic breakdown
- Candidate list and individual profile pages
- Methodology page explaining how the matching works
- FastAPI backend (Python) + Next.js 16 frontend (TypeScript)
- Deployed: backend on Railway, frontend on Vercel

---

*Built by [Renzo Rico](https://www.linkedin.com/in/renzorico/) · Independent civic project · No political affiliation*
