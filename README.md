# Colombia Matcher

Colombia Matcher is a web app where people answer policy questions and get matched with the 2026 Colombian presidential candidate that best fits their views.

## What It Does

- Asks 25 policy questions (Likert scale 1-5)
- Computes affinity scores against candidate positions across 7 axes
- Returns ranked matches with per-axis breakdown
- Shows extra context (party, background, controversies)
- Can generate short plain-Spanish explanations for each match

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
