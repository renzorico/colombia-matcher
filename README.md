# Colombia Matcher

Colombia Matcher is a web app where people answer policy questions and get matched with the 2026 Colombian presidential candidate that best fits their views.

## What It Does

- Asks 25 policy questions (Likert scale 1–5)
- Computes affinity scores against candidate positions across 7 topic axes
- Returns ranked matches with per-topic breakdown
- Lets users browse candidate profiles (bio, controversies, topic summaries)
- Generates plain-Spanish explanations per match

## Data Model

All candidate data is **static and curated** — no paid APIs, no live ingestion.
Source of truth: `backend/data/candidates_canonical.json` and `backend/data/questions_canonical.json`.

7 canonical topics: security (25%), economy (20%), health (15%), energy_environment (15%),
fiscal (10%), foreign_policy (10%), anticorruption (5%).

## Production Data Flow

```
Quiz page
  → GET /questions   (canonical backend)
  → collect answers locally (sessionStorage)
  → POST /quiz/submit (canonical backend scorer)
  → Results page (ranked candidates + per-topic breakdown)
  → /candidatos/[id] (full candidate profile from backend)
```

The old TypeScript mock matching pipeline (`frontend/services/`, `frontend/skills/`,
`frontend/app/api/match`) is **no longer the production path**. It remains in the
codebase for dev/debug purposes only. The production path is the canonical Python backend.

## Project Structure

- `backend/`: FastAPI API, quiz scoring engine, data pipeline
- `frontend/`: Next.js app (quiz flow + results UI)
- `backend/agents/`: multi-agent workflow for data collection and stance updates

## Multi-Agent Pipeline (Automatic Position Updates)

The backend now includes an automated research pipeline designed for periodic updates of candidate stances based on public sources:

1. `WebCollectorAgent`:
- Runs web searches for each candidate (news, interviews, proposals)
- Downloads article text from trusted domains

2. `StanceExtractorAgent`:
- Scans collected text for policy signals by axis
- Produces structured evidence snippets and tentative scores

3. `StanceAggregatorAgent`:
- Aggregates evidence into final 1-5 stance values per axis
- Leaves axis as `null` when evidence is insufficient

4. `CandidateUpdaterAgent`:
- Writes updated `stances` and research metadata into `candidates_v2.json`

Run it with:

```bash
cd backend
pip install -r requirements.txt
export SERPER_API_KEY="your_key"
python -m agents.run_research_pipeline --candidates-file candidates_v2.json
```

Notes:
- This is fully automated, but still heuristic-based today.
- For production quality, add stronger NLP/LLM extraction + source quality checks + human review loop.

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`.

## Push To GitHub

From repo root:

```bash
git add .
git commit -m "Initial Colombia Matcher app with multi-agent research pipeline"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

If `origin` already exists, replace the URL:

```bash
git remote set-url origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```
