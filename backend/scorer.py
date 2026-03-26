"""
scorer.py — Citizen–Candidate Affinity Engine.

Computes weighted topic scores from citizen answers and returns
candidates ranked by affinity.  All topic IDs and weights are sourced
from topics.py — do not redefine them here.
"""

import json
from pathlib import Path

from topics import AXIS_WEIGHTS, AXIS_LABELS_ES  # single source of truth


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def _load_json(path: str | Path) -> dict | list:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def load_data(
    candidates_path: str,
    questions_path: str,
) -> tuple[list, list]:
    """
    Load raw JSON files and return (candidates, questions).

    Prefer loader.load_canonical_candidates() / load_canonical_questions()
    for new code — they normalise the canonical schema into scorer-ready
    dicts.  This function is kept for backward compatibility only.

    Parameters
    ----------
    candidates_path : path to a candidates JSON file
    questions_path  : path to a questions JSON file
    """
    candidates = _load_json(candidates_path)
    questions  = _load_json(questions_path)
    return candidates, questions


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _weighted_axis_scores(
    citizen_answers: dict[str, int | float],
    questions: list[dict],
) -> dict[str, float]:
    """
    For each topic axis, compute a direction-normalised weighted average of
    the citizen's answers across all questions mapped to that axis.

    Expected question fields:
        id       — question identifier matching a key in citizen_answers
        axis     — canonical topic ID (set by loader from topic_id)
        weight   — integer importance weight (default 1)
        direction — "positive" | "negative" | "neutral"  (default "positive")
                   "positive": higher answer → higher axis score (agrees with
                               the right/interventionist end of that topic)
                   "negative": higher answer → LOWER axis score; the answer is
                               inverted (6 - answer) before averaging so it
                               aligns with the candidate's 1–5 stance scale.
                   "neutral" : treated as "positive" (no inversion).

    Direction-normalisation ensures that a citizen who strongly disagrees with
    a left-framed question (answers 1) receives a high axis score — matching
    a right-leaning candidate — rather than a low score that would spuriously
    match the left-leaning candidate.

    Returns { axis_name: weighted_avg_score } with values on the [1, 5] scale.
    """
    axis_numerator:   dict[str, float] = {}
    axis_denominator: dict[str, float] = {}

    for q in questions:
        qid       = q["id"]
        axis      = q["axis"]
        weight    = float(q.get("weight", 1))
        direction = q.get("direction", "positive")

        answer = citizen_answers.get(qid)
        if answer is None:
            continue  # skip unanswered questions gracefully

        # Invert "negative direction" answers so the result stays on the same
        # 1–5 scale as candidate stance scores: 1→5, 2→4, 3→3, 4→2, 5→1.
        if direction == "negative":
            answer = 6 - answer

        axis_numerator[axis]   = axis_numerator.get(axis, 0.0)   + answer * weight
        axis_denominator[axis] = axis_denominator.get(axis, 0.0) + weight

    result: dict[str, float] = {}
    for axis, total_weight in axis_denominator.items():
        if total_weight > 0:
            result[axis] = axis_numerator[axis] / total_weight

    return result


def _axis_agreement(citizen_score: float, candidate_score: float) -> float:
    """
    agreement = 1 - |citizen - candidate| / 4
    Range: 0.0 (complete disagreement) → 1.0 (perfect agreement)
    """
    return 1.0 - abs(citizen_score - candidate_score) / 4.0


def _redistribute_weights(
    base_weights: dict[str, float],
    missing_axes: set[str],
) -> dict[str, float]:
    """
    When a candidate has null for some axes, drop those axes and
    scale the remaining weights proportionally so they still sum to 1.
    """
    active = {ax: w for ax, w in base_weights.items() if ax not in missing_axes}
    total  = sum(active.values())
    if total == 0:
        return {}
    return {ax: w / total for ax, w in active.items()}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_affinity(
    citizen_answers: dict[str, int | float],
    candidates: list[dict],
    questions: list[dict],
) -> list[dict]:
    """
    Compute citizen–candidate affinity scores.

    Parameters
    ----------
    citizen_answers : { "q01": 3, "q02": 5, ... }  — 25 keys expected
    candidates      : pre-loaded list from candidates_v2.json
    questions       : pre-loaded list from questions_v1.json

    Returns
    -------
    List of dicts sorted by score descending:
        [
          {
            "candidate": "Paloma Valencia",
            "score": 78.4,
            "breakdown": { "security": 82, "economy": 71, ... }
          },
          ...
        ]
    Score and breakdown values are rounded percentages (0–100).
    """
    # Step 1 — citizen axis scores (weighted average per axis)
    citizen_axis: dict[str, float] = _weighted_axis_scores(citizen_answers, questions)

    results: list[dict] = []

    for candidate in candidates:
        name    = candidate["name"]
        stances = candidate.get("stances", {})  # { axis: score | null }

        # Step 2 — identify axes where the candidate has no stance (null / missing)
        missing_axes: set[str] = set()
        for axis in AXIS_WEIGHTS:
            if stances.get(axis) is None:
                missing_axes.add(axis)

        # Step 3 — build effective weights (redistribute if nulls present)
        effective_weights = _redistribute_weights(AXIS_WEIGHTS, missing_axes)

        # Step 4 — compute per-axis agreement and weighted total
        breakdown: dict[str, int] = {}
        weighted_sum = 0.0

        for axis, axis_weight in effective_weights.items():
            citizen_score   = citizen_axis.get(axis)
            candidate_score = stances.get(axis)

            # Skip if citizen didn't answer any questions on this axis
            if citizen_score is None or candidate_score is None:
                continue

            agreement      = _axis_agreement(citizen_score, candidate_score)
            weighted_sum  += agreement * axis_weight
            breakdown[axis] = round(agreement * 100)

        final_score = round(weighted_sum * 100, 1)

        results.append({
            "candidate": name,
            "score":     final_score,
            "breakdown": breakdown,
        })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results


def explain_match(
    candidate_name: str,
    citizen_answers: dict[str, int | float],
    candidates: list[dict],
    questions: list[dict],
) -> str:
    """
    Returns a 2-sentence plain-Spanish explanation of the strongest
    agreement and the biggest divergence with the named candidate.

    Parameters
    ----------
    candidate_name  : name of the candidate to explain (case-insensitive)
    citizen_answers : { "q01": 3, "q02": 5, ... }  — 25 keys expected
    candidates      : pre-loaded list from candidates_v2.json
    questions       : pre-loaded list from questions_v1.json
    """
    all_scores = compute_affinity(
        citizen_answers,
        candidates=candidates,
        questions=questions,
    )

    # Find the target candidate's result
    target = next(
        (r for r in all_scores if r["candidate"].lower() == candidate_name.lower()),
        None,
    )
    if target is None:
        return f"No se encontró al candidato '{candidate_name}' en los datos."

    breakdown = target["breakdown"]
    if not breakdown:
        return "No hay suficiente información para generar una explicación."

    best_axis  = max(breakdown, key=breakdown.get)
    worst_axis = min(breakdown, key=breakdown.get)

    best_label  = AXIS_LABELS_ES.get(best_axis,  best_axis)
    worst_label = AXIS_LABELS_ES.get(worst_axis, worst_axis)
    best_pct    = breakdown[best_axis]
    worst_pct   = breakdown[worst_axis]

    sentence1 = (
        f"Tu mayor coincidencia con {candidate_name} es en {best_label} "
        f"({best_pct}%), donde sus posiciones son muy similares."
    )
    sentence2 = (
        f"La mayor diferencia se encuentra en {worst_label} "
        f"({worst_pct}%), eje en el que sus visiones se distancian más."
    )
    return f"{sentence1} {sentence2}"


# ---------------------------------------------------------------------------
# __main__ — test run with hardcoded answers covering the full 1–5 range
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import pprint
    from loader import load_canonical_candidates, load_canonical_questions

    TEST_ANSWERS: dict[str, int] = {
        "q01": 5, "q02": 1, "q03": 4, "q04": 5, "q05": 1,
        "q06": 2, "q07": 5, "q08": 1, "q09": 1, "q10": 5,
        "q11": 3, "q12": 5, "q13": 1, "q14": 5, "q15": 1,
        "q16": 5, "q17": 5, "q18": 1, "q19": 5, "q20": 1,
        "q21": 3, "q22": 3, "q23": 1, "q24": 4, "q25": 3,
    }

    print("=" * 60)
    print("SCORING ENGINE — canonical data test run")
    print("=" * 60)

    candidates = load_canonical_candidates()
    questions  = load_canonical_questions()

    print("\n▶ compute_affinity() results:\n")
    ranking = compute_affinity(TEST_ANSWERS, candidates, questions)
    pprint.pprint(ranking, sort_dicts=False)

    if ranking:
        top = ranking[0]["candidate"]
        print(f"\n▶ explain_match() for top candidate: {top}\n")
        print(explain_match(top, TEST_ANSWERS, candidates, questions))

    print("\n" + "=" * 60)
