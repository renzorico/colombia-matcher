# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Location

The actual codebase lives at `/Users/renzorico/code/renzorico/colombia-matcher/` with two subdirectories:
- `backend/` — FastAPI Python server
- `frontend/` — Next.js TypeScript app

## Commands

### Backend

```bash
cd /Users/renzorico/colombia-matcher/backend
pip install -r requirements.txt
python main.py          # Runs on http://localhost:8000 with auto-reload
```

### Frontend

```bash
cd /Users/renzorico/colombia-matcher/frontend
npm install
npm run dev             # Runs on http://localhost:3000
npm run build           # Production build
npm run lint            # ESLint
npx tsc --noEmit        # Type check without emitting files
```

Both services must be running simultaneously for the app to work.

## Architecture

This is a **Colombian 2026 presidential election quiz** ("¿Con quién votas?") that matches users to candidates based on policy alignment.

### Backend (`backend/`)

- **`main.py`** — FastAPI app. Data (candidates + questions) is loaded once at startup via a lifespan context manager. CORS allows `localhost:3000`.
  - `GET /questions` — 25 quiz questions
  - `GET /candidates` — lightweight candidate list
  - `GET /candidates/full` — includes `procuraduria` and `scandals` fields
  - `POST /quiz/submit` — accepts `{"answers": {"q01": 1, ..., "q25": 5}}`, returns ranked results
  - `GET /explain/{candidate_name}?answers=...` — returns a 2-sentence Spanish explanation

- **`scorer.py`** — Core affinity engine. Computes weighted axis scores for the user, then calculates agreement per axis with each candidate using `1 - |diff|/4`. Seven weighted axes: `security(0.25)`, `economy(0.20)`, `health(0.15)`, `energy_environment(0.15)`, `fiscal(0.10)`, `foreign_policy(0.10)`, `anticorruption(0.05)`. Null stances are handled by redistributing weights proportionally.

- **`candidates_v2.json`** — Candidate data: name, party, spectrum, party_history, procuraduria, scandals, stances (per-axis scores 1–5 or null).

- **`questions_v1.json`** — 25 questions with fields: id (q01–q25), axis, bucket (Spanish category name), statement, weight (1–3).

### Frontend (`frontend/`)

Built with **Next.js 16.2.0 + React 19.2.4 + TypeScript + Tailwind CSS v4**. Uses the App Router.

> **Warning:** Next.js 16.2.0 has breaking changes from earlier versions. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`.

Three pages:
- **`app/page.tsx`** — Landing page, links to `/quiz`
- **`app/quiz/page.tsx`** — One-at-a-time question interface with 5-point Likert scale. Answers stored in `sessionStorage`. Skipped questions default to 3.
- **`app/resultados/page.tsx`** — Results page. Fetches candidates and submits stored answers. Shows candidates ranked by affinity %, per-axis breakdown bars, political spectrum badge, procuraduria/scandals info, and optional AI explanation.

**`lib/api.ts`** — Axios client pointing to `http://localhost:8000` with typed wrappers: `getQuestions()`, `submitQuiz(answers)`, `explainCandidate(name, answers)`.

### Data Flow

1. User answers 25 questions (values 1–5) in the quiz
2. Answers saved to `sessionStorage`
3. Results page reads `sessionStorage`, POSTs to `/quiz/submit`
4. Backend scores answers against each candidate's stances across 7 weighted axes
5. Returns candidates sorted by total affinity percentage with per-axis breakdown
