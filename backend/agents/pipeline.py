"""
agents/pipeline.py — Matching pipeline for the citizen–candidate affinity quiz.

Thin orchestration layer that wraps scorer.compute_affinity so future agents
(e.g. LLM re-ranker, bias checks) can be inserted here without touching
main.py or the public HTTP API.
"""

from scorer import compute_affinity


def run_matching_pipeline(
    user_answers: dict,
    *,
    candidates: list,
    questions: list,
) -> dict:
    """
    Run the full matching pipeline for a set of citizen answers.

    Parameters
    ----------
    user_answers : { "q01": 3, ..., "q25": 5 } — 25 answers, values 1–5
    candidates   : pre-loaded candidate list (from app.state)
    questions    : pre-loaded question list   (from app.state)

    Returns
    -------
    { "results": [ { "candidate": str, "score": float, "breakdown": dict }, ... ] }
    Matches the shape expected by AffinityResponse in main.py.
    """
    ranked = compute_affinity(
        citizen_answers=user_answers,
        candidates=candidates,
        questions=questions,
    )
    return {"results": ranked}
