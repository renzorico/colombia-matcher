"""
test_scorer.py — Unit tests for backend/scorer.py.

Tests pure scoring logic independently of the HTTP layer and canonical files.
Where needed, small inline fixtures stand in for real candidate / question data
so these tests remain fast and free of I/O.
"""

import pytest

from scorer import (
    _axis_agreement,
    _redistribute_weights,
    _weighted_axis_scores,
    compute_affinity,
    explain_match,
)
from loader import load_canonical_candidates, load_canonical_questions
from topics import AXIS_WEIGHTS, TOPICS_BY_ID


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def canonical_candidates():
    return load_canonical_candidates()


@pytest.fixture(scope="module")
def canonical_questions():
    return load_canonical_questions()


# Deterministic "right-wing" answers: strongly agrees with security/market,
# disagrees with state intervention and environmental restrictions.
RIGHT_ANSWERS: dict[str, int] = {
    "q01": 5, "q02": 1, "q03": 5, "q04": 5,   # security: pro-military
    "q05": 1, "q06": 1, "q07": 5, "q08": 1,   # economy: pro-market
    "q09": 1, "q10": 5, "q11": 3,              # health: pro-EPS
    "q12": 1, "q13": 1, "q14": 5,              # energy_environment: pro-extraction
    "q15": 1, "q16": 5, "q17": 5,              # fiscal: austerity
    "q18": 1, "q19": 5, "q20": 1,              # foreign_policy: pro-US
    "q21": 5, "q22": 3,                        # anticorruption
    "q23": 1, "q24": 2, "q25": 3,
}

# Deterministic "left-wing" answers: the mirror image.
LEFT_ANSWERS: dict[str, int] = {k: 6 - v for k, v in RIGHT_ANSWERS.items()}


# ---------------------------------------------------------------------------
# Pure helper function tests
# ---------------------------------------------------------------------------

class TestAxisAgreement:

    def test_perfect_agreement(self):
        assert _axis_agreement(3.0, 3) == pytest.approx(1.0)

    def test_complete_disagreement(self):
        # Max gap on 1-5 scale is 4
        assert _axis_agreement(1.0, 5) == pytest.approx(0.0)
        assert _axis_agreement(5.0, 1) == pytest.approx(0.0)

    def test_half_agreement(self):
        # |3 - 1| / 4 = 0.5  → agreement = 0.5
        assert _axis_agreement(3.0, 1) == pytest.approx(0.5)

    def test_result_always_in_zero_one(self):
        for citizen in range(1, 6):
            for candidate in range(1, 6):
                result = _axis_agreement(float(citizen), candidate)
                assert 0.0 <= result <= 1.0, (
                    f"Out of range for citizen={citizen}, candidate={candidate}"
                )


class TestRedistributeWeights:

    def test_no_missing_axes_sums_to_one(self):
        weights = _redistribute_weights(AXIS_WEIGHTS, set())
        assert sum(weights.values()) == pytest.approx(1.0)

    def test_missing_axes_are_dropped(self):
        weights = _redistribute_weights(AXIS_WEIGHTS, {"security"})
        assert "security" not in weights

    def test_remaining_weights_rescaled_to_one(self):
        weights = _redistribute_weights(AXIS_WEIGHTS, {"security", "economy"})
        assert sum(weights.values()) == pytest.approx(1.0)

    def test_all_missing_returns_empty(self):
        weights = _redistribute_weights(AXIS_WEIGHTS, set(AXIS_WEIGHTS.keys()))
        assert weights == {}


class TestWeightedAxisScores:

    # Minimal inline question fixture (no file I/O)
    _QUESTIONS = [
        {"id": "q01", "axis": "security", "weight": 2},
        {"id": "q02", "axis": "security", "weight": 3},
        {"id": "q03", "axis": "economy",  "weight": 1},
    ]

    def test_basic_weighted_average(self):
        answers = {"q01": 4, "q02": 2, "q03": 5}
        # security: (4*2 + 2*3) / (2+3) = 14/5 = 2.8
        scores = _weighted_axis_scores(answers, self._QUESTIONS)
        assert scores["security"] == pytest.approx(2.8)
        assert scores["economy"]  == pytest.approx(5.0)

    def test_skips_unanswered_questions(self):
        answers = {"q01": 3}  # q02 and q03 unanswered
        scores = _weighted_axis_scores(answers, self._QUESTIONS)
        assert scores["security"] == pytest.approx(3.0)
        assert "economy" not in scores

    def test_empty_answers_returns_empty(self):
        scores = _weighted_axis_scores({}, self._QUESTIONS)
        assert scores == {}


# ---------------------------------------------------------------------------
# compute_affinity integration tests (uses canonical data)
# ---------------------------------------------------------------------------

class TestComputeAffinity:

    def test_returns_all_candidates(self, canonical_candidates, canonical_questions):
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        assert len(results) == len(canonical_candidates)

    def test_results_sorted_descending(self, canonical_candidates, canonical_questions):
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_scores_in_zero_100_range(self, canonical_candidates, canonical_questions):
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        for r in results:
            assert 0 <= r["score"] <= 100, (
                f"Score {r['score']} out of range for {r['candidate']}"
            )

    def test_each_result_has_candidate_field(self, canonical_candidates, canonical_questions):
        """The old KeyError bug: results must have 'candidate', not crash."""
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        for r in results:
            assert "candidate" in r
            assert isinstance(r["candidate"], str)

    def test_breakdown_keys_are_canonical_topic_ids(self, canonical_candidates, canonical_questions):
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        for r in results:
            for key in r["breakdown"]:
                assert key in TOPICS_BY_ID, (
                    f"Breakdown key '{key}' is not a canonical topic ID "
                    f"in result for {r['candidate']}"
                )

    def test_breakdown_values_are_percentages(self, canonical_candidates, canonical_questions):
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        for r in results:
            for key, val in r["breakdown"].items():
                assert 0 <= val <= 100, (
                    f"Breakdown value {val} for '{key}' out of [0,100] "
                    f"in {r['candidate']}"
                )

    def test_energy_environment_in_breakdown(self, canonical_candidates, canonical_questions):
        """energy_environment must appear in every candidate's breakdown."""
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        for r in results:
            assert "energy_environment" in r["breakdown"], (
                f"'energy_environment' missing from breakdown for {r['candidate']}"
            )

    def test_no_energy_oil_or_environment_in_breakdown(self, canonical_candidates, canonical_questions):
        """Legacy split keys must never appear in results."""
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        for r in results:
            assert "energy_oil" not in r["breakdown"], (
                f"Legacy 'energy_oil' key found in {r['candidate']}"
            )
            assert "environment" not in r["breakdown"], (
                f"Legacy 'environment' key found in {r['candidate']}"
            )

    def test_right_answers_rank_espriella_high(self, canonical_candidates, canonical_questions):
        """Right-wing answers should rank de la Espriella (far-right) near the top."""
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        rank = {r["candidate"]: i for i, r in enumerate(results)}
        espriella_rank = rank.get("Abelardo de la Espriella", 999)
        cepeda_rank    = rank.get("Iván Cepeda", 999)
        assert espriella_rank < cepeda_rank, (
            "Right-wing answers should rank de la Espriella above Cepeda"
        )

    def test_left_answers_rank_cepeda_high(self, canonical_candidates, canonical_questions):
        """Left-wing answers should rank Cepeda (left) near the top."""
        results = compute_affinity(LEFT_ANSWERS, canonical_candidates, canonical_questions)
        rank = {r["candidate"]: i for i, r in enumerate(results)}
        cepeda_rank    = rank.get("Iván Cepeda", 999)
        espriella_rank = rank.get("Abelardo de la Espriella", 999)
        assert cepeda_rank < espriella_rank, (
            "Left-wing answers should rank Cepeda above de la Espriella"
        )

    def test_null_stance_candidate_still_gets_score(self, canonical_candidates, canonical_questions):
        """
        Claudia López has foreign_policy = null.
        The weight-redistribution logic must handle this without crashing
        and she should still receive a valid score.
        """
        results = compute_affinity(RIGHT_ANSWERS, canonical_candidates, canonical_questions)
        lopez_result = next(
            (r for r in results if r["candidate"] == "Claudia López"), None
        )
        assert lopez_result is not None
        assert isinstance(lopez_result["score"], float)
        assert 0 <= lopez_result["score"] <= 100


# ---------------------------------------------------------------------------
# explain_match tests
# ---------------------------------------------------------------------------

class TestExplainMatch:

    def test_returns_string(self, canonical_candidates, canonical_questions):
        result = explain_match(
            "Iván Cepeda", RIGHT_ANSWERS, canonical_candidates, canonical_questions
        )
        assert isinstance(result, str)
        assert len(result) > 0

    def test_unknown_candidate_returns_not_found_message(self, canonical_candidates, canonical_questions):
        result = explain_match(
            "Candidato Inexistente", RIGHT_ANSWERS, canonical_candidates, canonical_questions
        )
        assert result.startswith("No se encontró")

    def test_explanation_mentions_candidate_name(self, canonical_candidates, canonical_questions):
        result = explain_match(
            "Sergio Fajardo", RIGHT_ANSWERS, canonical_candidates, canonical_questions
        )
        assert "Fajardo" in result

    def test_explanation_mentions_topic_label_in_spanish(self, canonical_candidates, canonical_questions):
        """The explanation should reference Spanish topic labels, not English IDs."""
        result = explain_match(
            "Paloma Valencia", RIGHT_ANSWERS, canonical_candidates, canonical_questions
        )
        spanish_labels = [
            "Seguridad", "Economía", "Salud",
            "Energía", "Fiscal", "Exterior", "Anticorrupción",
        ]
        assert any(label in result for label in spanish_labels), (
            f"No Spanish topic label found in explanation: {result!r}"
        )
