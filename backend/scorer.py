"""
scorer.py — Phase 3: Citizen–Candidate Affinity Engine
Loads candidates_v2.json and questions_v1.json from disk,
computes weighted axis scores, and returns ranked affinity results.
"""

import json
from pathlib import Path


# ---------------------------------------------------------------------------
# Axis weights (must sum to 1.0)
# ---------------------------------------------------------------------------
AXIS_WEIGHTS: dict[str, float] = {
    "security":            0.25,
    "economy":             0.20,
    "health":              0.15,
    "energy_environment":  0.15,
    "fiscal":              0.10,
    "foreign_policy":      0.10,
    "anticorruption":      0.05,
}

# ---------------------------------------------------------------------------
# Axis labels in Spanish (used by explain_match)
# ---------------------------------------------------------------------------
AXIS_LABELS_ES: dict[str, str] = {
    "security":            "Seguridad",
    "economy":             "Economía",
    "health":              "Salud",
    "energy_environment":  "Energía y Medio Ambiente",
    "fiscal":              "Política Fiscal",
    "foreign_policy":      "Política Exterior",
    "anticorruption":      "Anticorrupción",
}


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
    Load and return (candidates, questions) from disk.

    Parameters
    ----------
    candidates_path : path to candidates_v2.json
    questions_path  : path to questions_v1.json

    Returns
    -------
    tuple[list, list] — (candidates, questions)
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
    For each axis, compute a weighted average of the citizen's answers
    across all questions mapped to that axis.

    Each question dict is expected to have:
        { "id": "q01", "axis": "security", "weight": 2, ... }

    Returns { axis_name: weighted_avg_score }
    """
    axis_numerator:   dict[str, float] = {}
    axis_denominator: dict[str, float] = {}

    for q in questions:
        qid    = q["id"]
        axis   = q["axis"]
        weight = float(q.get("weight", 1))

        answer = citizen_answers.get(qid)
        if answer is None:
            continue  # skip unanswered questions gracefully

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
    import os
    import pprint

    # ------------------------------------------------------------------
    # Synthetic citizen answers — 25 questions, values across 1–5 range
    # Adjust q-ids to match whatever your questions_v1.json uses.
    # ------------------------------------------------------------------
    TEST_ANSWERS: dict[str, int] = {
        "q01": 5, "q02": 4, "q03": 3, "q04": 2, "q05": 1,
        "q06": 5, "q07": 4, "q08": 3, "q09": 2, "q10": 1,
        "q11": 5, "q12": 4, "q13": 3, "q14": 2, "q15": 1,
        "q16": 5, "q17": 4, "q18": 3, "q19": 2, "q20": 1,
        "q21": 5, "q22": 4, "q23": 3, "q24": 2, "q25": 1,
    }

    print("=" * 60)
    print("SCORING ENGINE — Phase 3 Test Run")
    print("=" * 60)

    # ------------------------------------------------------------------
    # If the real JSON files aren't on disk yet, generate minimal stubs
    # so the test block is self-contained and runnable immediately.
    # ------------------------------------------------------------------
    STUB_CANDIDATES = "candidates_v2.json"
    STUB_QUESTIONS  = "questions_v1.json"

    if not os.path.exists(STUB_CANDIDATES):
        print("[INFO] candidates_v2.json not found — writing stub data for demo.\n")
        stub_candidates = [
            {
                "name": "Paloma Valencia",
                "stances": {
                    "security":      4,
                    "economy":       5,
                    "health":        3,
                    "energy_oil":    2,
                    "environment":   3,
                    "fiscal":        4,
                    "foreign_policy":     3,
                    "anticorruption":     5,
                },
            },
            {
                "name": "Carlos Mendoza",
                "stances": {
                    "security":      2,
                    "economy":       3,
                    "health":        5,
                    "energy_oil":    4,
                    "environment":   5,
                    "fiscal":        None,   # null stance → redistributed
                    "foreign_policy":     2,
                    "anticorruption":     3,
                },
            },
            {
                "name": "Lucía Rondón",
                "stances": {
                    "security":      1,
                    "economy":       2,
                    "health":        4,
                    "energy_oil":    3,
                    "environment":   5,
                    "fiscal":        3,
                    "foreign_policy":     5,
                    "anticorruption":     4,
                },
            },
        ]
        with open(STUB_CANDIDATES, "w", encoding="utf-8") as f:
            json.dump(stub_candidates, f, ensure_ascii=False, indent=2)

    if not os.path.exists(STUB_QUESTIONS):
        print("[INFO] questions_v1.json not found — writing stub data for demo.\n")
        axes_cycle = [
            "security", "security", "security", "security",
            "economy",  "economy",  "economy",  "economy",
            "health",   "health",   "health",
            "energy_oil",  "energy_oil",  "energy_oil",
            "environment", "environment",
            "fiscal",   "fiscal",
            "foreign_policy", "foreign_policy", "foreign_policy",
            "anticorruption", "anticorruption",
            "security", "economy",  # fill to 25
        ]
        stub_questions = [
            {
                "id":     f"q{str(i).zfill(2)}",
                "axis":   axes_cycle[i - 1],
                "weight": (i % 3) + 1,           # weights 1, 2, 3 cycling
                "text":   f"Pregunta de prueba {i}",
            }
            for i in range(1, 26)
        ]
        with open(STUB_QUESTIONS, "w", encoding="utf-8") as f:
            json.dump(stub_questions, f, ensure_ascii=False, indent=2)

    # ------------------------------------------------------------------
    # Load data explicitly, then pass into public functions
    # ------------------------------------------------------------------
    candidates, questions = load_data(STUB_CANDIDATES, STUB_QUESTIONS)

    print("\n▶ compute_affinity() results:\n")
    ranking = compute_affinity(TEST_ANSWERS, candidates, questions)
    pprint.pprint(ranking, sort_dicts=False)

    # ------------------------------------------------------------------
    # Run explain_match for the top candidate
    # ------------------------------------------------------------------
    if ranking:
        top_candidate = ranking[0]["candidate"]
        print(f"\n▶ explain_match() for top candidate: {top_candidate}\n")
        explanation = explain_match(top_candidate, TEST_ANSWERS, candidates, questions)
        print(explanation)

    print("\n" + "=" * 60)
    print("Test run complete.")
    print("=" * 60)
