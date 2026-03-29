"""
main.py — FastAPI backend for the citizen–candidate affinity quiz.

Canonical data source: backend/data/candidates_canonical.json
                       backend/data/questions_canonical.json

Data is loaded once at startup via loader.py and shared through
app.state.  All scoring delegates to scorer.py.
"""

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from agents.pipeline import run_matching_pipeline
from loader import (
    load_canonical_candidates,
    load_canonical_questions,
    load_canonical_sources,
)
from review import load_proposals, load_review_log
from scorer import explain_match


# ---------------------------------------------------------------------------
# Startup: load canonical data once, share via app.state
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.candidates       = load_canonical_candidates()
    app.state.questions        = load_canonical_questions()
    app.state.sources          = load_canonical_sources()
    app.state.proposals        = load_proposals()
    app.state.review_log       = load_review_log()
    yield
    # Nothing to tear down — in-memory data only


# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------

_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    *[o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()],
]

app = FastAPI(
    title="Affinity Quiz API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class QuizSubmission(BaseModel):
    answers: dict[str, int]

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v: dict[str, int]) -> dict[str, int]:
        if len(v) != 25:
            raise ValueError(f"Expected 25 answers, got {len(v)}.")
        for qid, score in v.items():
            if score not in range(1, 6):
                raise ValueError(
                    f"Answer for '{qid}' must be between 1 and 5, got {score}."
                )
        return v


class AffinityBreakdown(BaseModel):
    id: str
    candidate: str
    score: float
    breakdown: dict[str, int]


class AffinityResponse(BaseModel):
    results: list[AffinityBreakdown]


class CandidateSummary(BaseModel):
    """Lightweight public candidate record for /candidates."""
    id: str
    name: str
    party: str | None
    coalition: str | None
    spectrum: str | None
    short_bio: str | None
    image_url: str | None = None
    # Kept for clients still reading the legacy field name.
    party_history: str | None = None


class Question(BaseModel):
    id: str
    bucket: str
    statement: str
    weight: int


class ExplainResponse(BaseModel):
    candidate: str
    explanation: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _candidate_to_summary(c: dict) -> dict:
    """Project a normalised candidate dict to the public summary shape."""
    return {
        "id":            c["id"],
        "name":          c["name"],
        "party":         c.get("party"),
        "coalition":     c.get("coalition"),
        "spectrum":      c.get("spectrum"),
        "short_bio":     c.get("short_bio"),
        "image_url":     c.get("image_url"),
        # Backward-compat alias: surface party_history from metadata if present.
        "party_history": c.get("metadata", {}).get("party_history"),
    }


def _parse_answers_query(raw: str) -> dict[str, int]:
    """
    Decode a JSON string into an answer dict (25 keys, values 1–5).
    Raises HTTPException 422 on any violation.
    """
    import json as _json

    try:
        answers = _json.loads(raw)
    except _json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"'answers' is not valid JSON: {exc}") from exc

    if not isinstance(answers, dict):
        raise HTTPException(status_code=422, detail="'answers' must be a JSON object.")
    if len(answers) != 25:
        raise HTTPException(status_code=422, detail=f"Expected 25 answers, got {len(answers)}.")
    for qid, score in answers.items():
        if not isinstance(score, int) or score not in range(1, 6):
            raise HTTPException(
                status_code=422,
                detail=f"Answer for '{qid}' must be an integer 1–5, got {score!r}.",
            )
    return answers


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Meta"])
def health_check() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@app.get("/debug/runtime", tags=["Meta"])
def debug_runtime() -> dict[str, Any]:
    """Runtime diagnostics for deployment/version mismatch debugging."""
    publimetro_url = None
    src = app.state.sources.get("src-valencia-publimetro-2026-02")
    if src:
        publimetro_url = src.get("url")

    return {
        "status": "ok",
        "git_commit": os.getenv("RAILWAY_GIT_COMMIT_SHA") or os.getenv("GIT_COMMIT_SHA"),
        "git_branch": os.getenv("RAILWAY_GIT_BRANCH") or os.getenv("GIT_BRANCH"),
        "publimetro_url": publimetro_url,
    }


@app.get("/candidates", response_model=list[CandidateSummary], tags=["Data"])
def get_candidates() -> list[dict]:
    """
    Returns all candidates with lightweight public fields.
    Stance scores and internal metadata are excluded.
    """
    return [_candidate_to_summary(c) for c in app.state.candidates]


@app.get("/candidates/full", tags=["Data"])
def get_candidates_full() -> list[dict[str, Any]]:
    """
    Returns candidates with richer public context:
    id, name, party, spectrum, controversies, procuraduria status,
    profile_status, last_updated.

    Raw internal metadata and full stance details are excluded.
    """
    result = []
    for c in app.state.candidates:
        meta = c.get("metadata", {})

        # Expose public topic fields.
        # stance_score is exposed for UI bar-chart visualization.
        # confidence signals how well-sourced a stance is.
        public_topics = [
            {
                "topic_id":               t.get("topic_id"),
                "topic_label":            t.get("topic_label"),
                "summary":                t.get("summary"),
                "plain_language_summary": t.get("plain_language_summary"),
                "confidence":             t.get("confidence"),
                "stance_score":           t.get("stance_score"),
            }
            for t in c.get("topics", [])
        ]

        # Collect all source IDs referenced by topics, proposals, and controversies.
        source_ids: set[str] = set()
        for t in c.get("topics", []):
            source_ids.update(t.get("evidence_ids", []))
        for p in c.get("proposals", []):
            source_ids.update(p.get("source_ids", []))
        for cont in c.get("controversies", []):
            source_ids.update(cont.get("source_ids", []))

        sources_data = app.state.sources
        candidate_sources = [
            {
                "id":                src["id"],
                "type":              src.get("type"),
                "title":             src.get("title"),
                "publisher":         src.get("publisher"),
                "url":               src["url"],
                "published_at":      src.get("published_at"),
                "reliability_notes": src.get("reliability_notes"),
            }
            for sid in sorted(source_ids)
            if (src := sources_data.get(sid)) and src.get("url")
        ]

        result.append(
            {
                "id":                   c["id"],
                "name":                 c["name"],
                "party":                c.get("party"),
                "coalition":            c.get("coalition"),
                "spectrum":             c.get("spectrum"),
                "short_bio":            c.get("short_bio"),
                "image_url":            c.get("image_url"),
                "topics":               public_topics,
                "proposals":            c.get("proposals", []),
                "controversies":        c.get("controversies", []),
                "sources":              candidate_sources,
                "procuraduria_status":  meta.get("procuraduria_status"),
                "procuraduria_summary": meta.get("procuraduria_summary"),
                "profile_status":       c.get("profile_status"),
                "last_updated":         c.get("last_updated"),
            }
        )
    return result


@app.get("/questions", response_model=list[Question], tags=["Data"])
def get_questions() -> list[dict]:
    """
    Returns all 25 quiz questions.
    Internal fields (topic_id, direction, note, axis) are stripped.
    """
    safe_fields = {"id", "bucket", "statement", "weight"}
    return [
        {k: v for k, v in q.items() if k in safe_fields}
        for q in app.state.questions
    ]


@app.post("/quiz/submit", response_model=AffinityResponse, tags=["Quiz"])
def submit_quiz(submission: QuizSubmission) -> AffinityResponse:
    """
    Accepts 25 citizen answers on a 1–5 scale and returns candidates
    ranked by affinity score with a per-topic breakdown.
    """
    try:
        result = run_matching_pipeline(
            submission.answers,
            candidates=app.state.candidates,
            questions=app.state.questions,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scoring error: {exc}") from exc

    return AffinityResponse(results=result["results"])


@app.get("/explain/{candidate_name}", response_model=ExplainResponse, tags=["Quiz"])
def explain_candidate(
    candidate_name: str,
    answers: str = Query(
        ...,
        description='JSON string of the 25-answer dict, e.g. \'{"q01": 3, "q02": 5, ...}\'',
    ),
) -> ExplainResponse:
    """
    Returns a plain-Spanish explanation of the strongest agreement and
    biggest divergence between the citizen and the named candidate.
    Only uses computed scores and canonical topic labels — no invented claims.

    - **candidate_name**: exact name (URL-encoded if it contains spaces)
    - **answers**: query param — JSON string of the 25-answer dict
    """
    citizen_answers = _parse_answers_query(answers)

    try:
        explanation = explain_match(
            candidate_name=candidate_name,
            citizen_answers=citizen_answers,
            candidates=app.state.candidates,
            questions=app.state.questions,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Explanation error: {exc}") from exc

    if explanation.startswith("No se encontró"):
        raise HTTPException(status_code=404, detail=explanation)

    return ExplainResponse(candidate=candidate_name, explanation=explanation)


# ---------------------------------------------------------------------------
# Review workflow endpoints (read-only — no auth required)
#
# These endpoints expose the static review data files so that:
#   - the admin UI can display pending proposals
#   - developers and reviewers can inspect what changes are queued
#
# Writing to the files (approve/reject) is done by editing the JSON directly
# or via future CLI tooling.  This keeps the review layer simple and
# auditable without requiring authentication infrastructure.
# ---------------------------------------------------------------------------

@app.get("/review/pending", tags=["Review"])
def get_pending_proposals() -> list[dict]:
    """
    Returns proposals that are still awaiting human review.
    Proposals with status 'approved' or 'rejected' are excluded.
    """
    return [
        p.model_dump()
        for p in app.state.proposals
        if p.status == "pending"
    ]


@app.get("/review/all", tags=["Review"])
def get_all_proposals() -> list[dict]:
    """Returns all proposals regardless of status (pending, approved, rejected)."""
    return [p.model_dump() for p in app.state.proposals]


@app.get("/review/log", tags=["Review"])
def get_review_log() -> list[dict]:
    """Returns the complete human review decision log."""
    return [r.model_dump() for r in app.state.review_log]


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
