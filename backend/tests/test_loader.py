"""
test_loader.py — Unit tests for backend/loader.py.

Validates that the canonical JSON files load correctly and that the
normalised dicts have the shapes scorer.py and main.py expect.
"""

import pytest

from loader import load_canonical_candidates, load_canonical_questions
from topics import TOPICS_BY_ID


# ---------------------------------------------------------------------------
# Fixtures — load once per module
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def candidates():
    return load_canonical_candidates()


@pytest.fixture(scope="module")
def questions():
    return load_canonical_questions()


# ---------------------------------------------------------------------------
# Candidate loader tests
# ---------------------------------------------------------------------------

class TestCandidateLoader:

    def test_loads_without_error(self, candidates):
        assert isinstance(candidates, list)

    def test_has_six_candidates(self, candidates):
        assert len(candidates) == 6

    def test_every_candidate_has_id(self, candidates):
        for c in candidates:
            assert c.get("id"), f"Missing 'id' in candidate {c}"

    def test_every_candidate_has_name(self, candidates):
        """The old KeyError bug: candidate['name'] must exist."""
        for c in candidates:
            assert c.get("name"), f"Missing 'name' in candidate {c}"

    def test_id_is_slug(self, candidates):
        """IDs should be lowercase-hyphenated slugs with no spaces."""
        for c in candidates:
            cid = c["id"]
            assert " " not in cid, f"ID '{cid}' contains spaces"
            assert cid == cid.lower(), f"ID '{cid}' is not lowercase"

    def test_every_candidate_has_stances_dict(self, candidates):
        for c in candidates:
            assert isinstance(c.get("stances"), dict), (
                f"'stances' missing or not a dict in candidate {c['id']}"
            )

    def test_stances_use_canonical_topic_ids(self, candidates):
        """All stance keys must be valid canonical topic IDs."""
        for c in candidates:
            for key in c["stances"]:
                assert key in TOPICS_BY_ID, (
                    f"Stance key '{key}' in candidate '{c['id']}' "
                    f"is not a canonical topic ID"
                )

    def test_no_legacy_split_energy_keys(self, candidates):
        """The old 'energy_oil' / 'environment' split must not appear."""
        for c in candidates:
            stances = c["stances"]
            assert "energy_oil" not in stances, (
                f"Legacy key 'energy_oil' found in candidate '{c['id']}'"
            )
            assert "environment" not in stances, (
                f"Legacy key 'environment' found in candidate '{c['id']}'"
            )

    def test_energy_environment_present(self, candidates):
        """The merged key must exist for every candidate."""
        for c in candidates:
            assert "energy_environment" in c["stances"], (
                f"'energy_environment' missing in candidate '{c['id']}'"
            )

    def test_stance_scores_in_range_or_null(self, candidates):
        """Non-null scores must be integers in [1, 5]."""
        for c in candidates:
            for topic_id, score in c["stances"].items():
                if score is not None:
                    assert isinstance(score, int), (
                        f"Score for '{topic_id}' in '{c['id']}' is not int: {score!r}"
                    )
                    assert 1 <= score <= 5, (
                        f"Score {score} for '{topic_id}' in '{c['id']}' out of [1,5]"
                    )

    def test_known_candidates_present(self, candidates):
        ids = {c["id"] for c in candidates}
        for expected in [
            "ivan-cepeda",
            "abelardo-de-la-espriella",
            "sergio-fajardo",
            "paloma-valencia",
            "roy-barreras",
            "claudia-lopez",
        ]:
            assert expected in ids, f"Expected candidate '{expected}' not found"

    def test_cepeda_is_left_spectrum(self, candidates):
        cepeda = next(c for c in candidates if c["id"] == "ivan-cepeda")
        assert cepeda["spectrum"] == "left"

    def test_espriella_is_far_right_spectrum(self, candidates):
        espriella = next(c for c in candidates if c["id"] == "abelardo-de-la-espriella")
        assert espriella["spectrum"] == "far-right"

    def test_cepeda_security_score_is_1(self, candidates):
        """Spot-check a known curated value."""
        cepeda = next(c for c in candidates if c["id"] == "ivan-cepeda")
        assert cepeda["stances"]["security"] == 1

    def test_espriella_security_score_is_5(self, candidates):
        espriella = next(c for c in candidates if c["id"] == "abelardo-de-la-espriella")
        assert espriella["stances"]["security"] == 5

    def test_lopez_foreign_policy_is_null(self, candidates):
        """Claudia López has no documented foreign-policy stance."""
        lopez = next(c for c in candidates if c["id"] == "claudia-lopez")
        assert lopez["stances"].get("foreign_policy") is None


# ---------------------------------------------------------------------------
# Question loader tests
# ---------------------------------------------------------------------------

class TestQuestionLoader:

    def test_loads_without_error(self, questions):
        assert isinstance(questions, list)

    def test_has_25_questions(self, questions):
        assert len(questions) == 25

    def test_every_question_has_id(self, questions):
        for q in questions:
            assert q.get("id")

    def test_every_question_has_axis_field(self, questions):
        """loader.py must add 'axis' = topic_id for scorer compatibility."""
        for q in questions:
            assert "axis" in q, f"'axis' missing in question {q.get('id')}"

    def test_every_question_has_bucket_field(self, questions):
        """loader.py must add 'bucket' for frontend compatibility."""
        for q in questions:
            assert "bucket" in q, f"'bucket' missing in question {q.get('id')}"

    def test_axis_values_are_canonical_topic_ids(self, questions):
        for q in questions:
            assert q["axis"] in TOPICS_BY_ID, (
                f"Question '{q['id']}' has non-canonical axis '{q['axis']}'"
            )

    def test_no_legacy_energy_split_axes(self, questions):
        for q in questions:
            assert q["axis"] not in ("energy_oil", "environment"), (
                f"Question '{q['id']}' uses legacy axis '{q['axis']}'"
            )

    def test_weights_are_positive_integers(self, questions):
        for q in questions:
            w = q["weight"]
            assert isinstance(w, int) and w > 0, (
                f"Question '{q['id']}' has invalid weight {w!r}"
            )

    def test_question_ids_are_unique(self, questions):
        ids = [q["id"] for q in questions]
        assert len(ids) == len(set(ids)), "Duplicate question IDs found"
