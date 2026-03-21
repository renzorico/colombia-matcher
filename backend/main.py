"""
main.py — FastAPI backend for the citizen–candidate affinity quiz.
Loads JSON data once at startup and delegates scoring to scorer.py.
"""

import json
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from agents.pipeline import run_matching_pipeline
from scorer import explain_match, load_data


# ---------------------------------------------------------------------------
# Startup / shutdown: load data once, share via app.state
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    candidates, questions = load_data(
        candidates_path="candidates_v2.json",
        questions_path="questions_v1.json",
    )
    app.state.candidates = candidates
    app.state.questions  = questions
    yield
    # Nothing to tear down — in-memory data only


# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Affinity Quiz API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # update second entry before deploy
    ],
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
    candidate: str
    score: float
    breakdown: dict[str, int]


class AffinityResponse(BaseModel):
    results: list[AffinityBreakdown]


class Candidate(BaseModel):
    name: str
    party: str
    spectrum: str
    party_history: str


class Question(BaseModel):
    id: str
    bucket: str
    statement: str
    weight: int


class ExplainResponse(BaseModel):
    candidate: str
    explanation: str


# ---------------------------------------------------------------------------
# Shared answer-dict validator (reused by /explain)
# ---------------------------------------------------------------------------

def _parse_and_validate_answers(raw: str) -> dict[str, int]:
    """
    Decode a JSON string into an answer dict and validate that it contains
    exactly 25 keys with integer values between 1 and 5 inclusive.
    Raises HTTPException 422 on any violation.
    """
    try:
        answers = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"'answers' is not valid JSON: {exc}",
        ) from exc

    if not isinstance(answers, dict):
        raise HTTPException(
            status_code=422,
            detail="'answers' must be a JSON object.",
        )

    if len(answers) != 25:
        raise HTTPException(
            status_code=422,
            detail=f"Expected 25 answers, got {len(answers)}.",
        )

    for qid, score in answers.items():
        if not isinstance(score, int) or score not in range(1, 6):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Answer for '{qid}' must be an integer between 1 and 5, "
                    f"got {score!r}."
                ),
            )

    return answers


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Meta"])
def health_check() -> dict[str, str]:
    """Liveness probe — always returns 200 OK."""
    return {"status": "ok"}


@app.get("/candidates", response_model=list[Candidate], tags=["Data"])
def get_candidates() -> list[dict[str, Any]]:
    """
    Returns all candidates with lightweight profile fields only.
    Stances are intentionally excluded to keep the payload small.
    """
    safe_fields = {"name", "party", "spectrum", "party_history"}
    return [
        {k: v for k, v in candidate.items() if k in safe_fields}
        for candidate in app.state.candidates
    ]


@app.get("/candidates/full", tags=["Data"])
def get_candidates_full() -> list[dict[str, Any]]:
    """Returns candidates with procuraduria and scandals info."""
    fields = {"name", "procuraduria", "scandals"}
    return [
        {k: v for k, v in candidate.items() if k in fields}
        for candidate in app.state.candidates
    ]


@app.get("/questions", response_model=list[Question], tags=["Data"])
def get_questions() -> list[dict[str, Any]]:
    """
    Returns all 25 quiz questions.
    'axis' and 'note' fields are stripped — not exposed to the frontend.
    """
    safe_fields = {"id", "bucket", "statement", "weight"}
    return [
        {k: v for k, v in question.items() if k in safe_fields}
        for question in app.state.questions
    ]


@app.post("/quiz/submit", response_model=AffinityResponse, tags=["Quiz"])
def submit_quiz(submission: QuizSubmission) -> AffinityResponse:
    """
    Accepts 25 citizen answers on a 1–5 scale, runs the affinity
    scoring engine, and returns candidates ranked by match percentage.
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
        description=(
            "JSON string of the 25-answer dict, e.g. "
            '\'{"q01": 3, "q02": 5, ...}\''
        ),
    ),
) -> ExplainResponse:
    """
    Returns a 2-sentence plain-Spanish explanation of the strongest
    agreement and biggest divergence between the citizen and the
    named candidate.

    - **candidate_name**: exact candidate name (URL-encoded if it contains spaces)
    - **answers**: query param — JSON string of the 25-answer dict
    """
    citizen_answers = _parse_and_validate_answers(answers)

    try:
        explanation = explain_match(
            candidate_name=candidate_name,
            citizen_answers=citizen_answers,
            candidates=app.state.candidates,
            questions=app.state.questions,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Explanation error: {exc}",
        ) from exc

    # explain_match signals a missing candidate via a Spanish string;
    # surface that as a 404 so callers can handle it cleanly.
    if explanation.startswith("No se encontró"):
        raise HTTPException(status_code=404, detail=explanation)

    return ExplainResponse(candidate=candidate_name, explanation=explanation)


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
