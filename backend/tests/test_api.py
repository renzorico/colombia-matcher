"""
test_api.py — Smoke tests for the FastAPI endpoints.

Uses FastAPI's TestClient (backed by httpx) to exercise each endpoint
against real canonical data loaded at app startup.
"""

import json
import pytest
from fastapi.testclient import TestClient

from main import app
from topics import TOPICS_BY_ID


# ---------------------------------------------------------------------------
# Shared test client
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# 25-answer payload that passes validation (all values in [1, 5])
_VALID_ANSWERS = {f"q{str(i).zfill(2)}": 3 for i in range(1, 26)}

# Right-wing answer set (mirrors test_scorer.py)
_RIGHT_ANSWERS = {
    "q01": 5, "q02": 1, "q03": 5, "q04": 5,
    "q05": 1, "q06": 1, "q07": 5, "q08": 1,
    "q09": 1, "q10": 5, "q11": 3,
    "q12": 1, "q13": 1, "q14": 5,
    "q15": 1, "q16": 5, "q17": 5,
    "q18": 1, "q19": 5, "q20": 1,
    "q21": 5, "q22": 3,
    "q23": 1, "q24": 2, "q25": 3,
}


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

class TestHealth:

    def test_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_returns_ok_status(self, client):
        resp = client.get("/health")
        assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# /candidates
# ---------------------------------------------------------------------------

class TestGetCandidates:

    def test_returns_200(self, client):
        resp = client.get("/candidates")
        assert resp.status_code == 200

    def test_returns_six_candidates(self, client):
        resp = client.get("/candidates")
        assert len(resp.json()) == 6

    def test_candidates_have_id_field(self, client):
        for c in client.get("/candidates").json():
            assert "id" in c, f"Missing 'id' in {c}"

    def test_candidates_have_name_field(self, client):
        for c in client.get("/candidates").json():
            assert "name" in c, f"Missing 'name' in {c}"

    def test_candidates_do_not_expose_stances(self, client):
        """Stances are internal; should not appear in the lightweight endpoint."""
        for c in client.get("/candidates").json():
            assert "stances" not in c, f"'stances' leaked into /candidates for {c.get('id')}"

    def test_candidates_do_not_expose_internal_metadata(self, client):
        for c in client.get("/candidates").json():
            assert "metadata" not in c
            assert "topics" not in c

    def test_known_candidate_ids_present(self, client):
        ids = {c["id"] for c in client.get("/candidates").json()}
        for expected_id in [
            "ivan-cepeda",
            "paloma-valencia",
            "claudia-lopez",
        ]:
            assert expected_id in ids


# ---------------------------------------------------------------------------
# /candidates/full
# ---------------------------------------------------------------------------

class TestGetCandidatesFull:

    def test_returns_200(self, client):
        resp = client.get("/candidates/full")
        assert resp.status_code == 200

    def test_returns_six_candidates(self, client):
        assert len(client.get("/candidates/full").json()) == 6

    def test_includes_controversies(self, client):
        for c in client.get("/candidates/full").json():
            assert "controversies" in c

    def test_includes_procuraduria_status(self, client):
        for c in client.get("/candidates/full").json():
            assert "procuraduria_status" in c

    def test_does_not_expose_raw_stances(self, client):
        for c in client.get("/candidates/full").json():
            assert "stances" not in c

    def test_includes_topics(self, client):
        for c in client.get("/candidates/full").json():
            assert "topics" in c
            assert isinstance(c["topics"], list)

    def test_topics_do_not_expose_stance_scores(self, client):
        # stance_score is internal — never exposed publicly.
        # confidence is intentionally public: it's a trust signal for UI display.
        for c in client.get("/candidates/full").json():
            for t in c["topics"]:
                assert "stance_score" not in t

    def test_includes_sources_list(self, client):
        for c in client.get("/candidates/full").json():
            assert "sources" in c
            assert isinstance(c["sources"], list)

    def test_sources_have_required_fields(self, client):
        for c in client.get("/candidates/full").json():
            for s in c["sources"]:
                assert "url" in s
                assert "title" in s
                assert s["url"] is not None  # only sources with URLs are included

    def test_includes_proposals(self, client):
        for c in client.get("/candidates/full").json():
            assert "proposals" in c


# ---------------------------------------------------------------------------
# /review endpoints
# ---------------------------------------------------------------------------

class TestReviewEndpoints:

    def test_pending_returns_200(self, client):
        resp = client.get("/review/pending")
        assert resp.status_code == 200

    def test_pending_returns_list(self, client):
        data = client.get("/review/pending").json()
        assert isinstance(data, list)

    def test_pending_only_contains_pending_status(self, client):
        data = client.get("/review/pending").json()
        for p in data:
            assert p["status"] == "pending"

    def test_all_proposals_returns_200(self, client):
        resp = client.get("/review/all")
        assert resp.status_code == 200

    def test_all_proposals_has_correct_count(self, client):
        data = client.get("/review/all").json()
        assert len(data) == 3  # matches proposed_updates.json fixture

    def test_all_proposals_have_required_fields(self, client):
        for p in client.get("/review/all").json():
            for field in ("id", "candidate_id", "topic_id", "status", "agent_confidence"):
                assert field in p, f"Missing field '{field}' in proposal {p.get('id')}"

    def test_all_proposals_statuses_are_valid(self, client):
        valid = {"pending", "approved", "rejected"}
        for p in client.get("/review/all").json():
            assert p["status"] in valid

    def test_review_log_returns_200(self, client):
        resp = client.get("/review/log")
        assert resp.status_code == 200

    def test_review_log_returns_list(self, client):
        data = client.get("/review/log").json()
        assert isinstance(data, list)

    def test_review_log_has_correct_count(self, client):
        data = client.get("/review/log").json()
        assert len(data) == 2  # matches review_log.json fixture

    def test_review_log_decisions_are_valid(self, client):
        valid = {"approved", "rejected"}
        for r in client.get("/review/log").json():
            assert r["decision"] in valid

    def test_review_log_references_known_proposals(self, client):
        all_ids = {p["id"] for p in client.get("/review/all").json()}
        for r in client.get("/review/log").json():
            assert r["proposal_id"] in all_ids, (
                f"Review log entry {r['id']} references unknown proposal {r['proposal_id']}"
            )


# ---------------------------------------------------------------------------
# /questions
# ---------------------------------------------------------------------------

class TestGetQuestions:

    def test_returns_200(self, client):
        resp = client.get("/questions")
        assert resp.status_code == 200

    def test_returns_25_questions(self, client):
        assert len(client.get("/questions").json()) == 25

    def test_questions_have_required_fields(self, client):
        for q in client.get("/questions").json():
            for field in ("id", "bucket", "statement", "weight"):
                assert field in q, f"Field '{field}' missing in question {q.get('id')}"

    def test_questions_do_not_expose_internal_fields(self, client):
        for q in client.get("/questions").json():
            assert "axis" not in q
            assert "topic_id" not in q
            assert "direction" not in q
            assert "note" not in q

    def test_question_ids_sequential(self, client):
        ids = {q["id"] for q in client.get("/questions").json()}
        for i in range(1, 26):
            assert f"q{str(i).zfill(2)}" in ids


# ---------------------------------------------------------------------------
# /quiz/submit
# ---------------------------------------------------------------------------

class TestQuizSubmit:

    def test_valid_submission_returns_200(self, client):
        resp = client.post("/quiz/submit", json={"answers": _VALID_ANSWERS})
        assert resp.status_code == 200

    def test_response_has_results_key(self, client):
        resp = client.post("/quiz/submit", json={"answers": _VALID_ANSWERS})
        assert "results" in resp.json()

    def test_results_contain_all_candidates(self, client):
        resp = client.post("/quiz/submit", json={"answers": _VALID_ANSWERS})
        assert len(resp.json()["results"]) == 6

    def test_results_have_required_fields(self, client):
        resp = client.post("/quiz/submit", json={"answers": _VALID_ANSWERS})
        for r in resp.json()["results"]:
            assert "candidate" in r
            assert "score" in r
            assert "breakdown" in r

    def test_results_sorted_descending(self, client):
        resp = client.post("/quiz/submit", json={"answers": _VALID_ANSWERS})
        scores = [r["score"] for r in resp.json()["results"]]
        assert scores == sorted(scores, reverse=True)

    def test_breakdown_uses_canonical_topic_ids(self, client):
        resp = client.post("/quiz/submit", json={"answers": _RIGHT_ANSWERS})
        for r in resp.json()["results"]:
            for key in r["breakdown"]:
                assert key in TOPICS_BY_ID, (
                    f"Breakdown key '{key}' is not a canonical topic ID"
                )

    def test_energy_environment_in_breakdown(self, client):
        resp = client.post("/quiz/submit", json={"answers": _RIGHT_ANSWERS})
        for r in resp.json()["results"]:
            assert "energy_environment" in r["breakdown"], (
                f"'energy_environment' missing from {r['candidate']}"
            )

    def test_no_legacy_energy_keys_in_breakdown(self, client):
        resp = client.post("/quiz/submit", json={"answers": _RIGHT_ANSWERS})
        for r in resp.json()["results"]:
            assert "energy_oil"   not in r["breakdown"]
            assert "environment"  not in r["breakdown"]

    def test_right_answers_rank_espriella_above_cepeda(self, client):
        resp = client.post("/quiz/submit", json={"answers": _RIGHT_ANSWERS})
        results = resp.json()["results"]
        rank = {r["candidate"]: i for i, r in enumerate(results)}
        assert rank["Abelardo de la Espriella"] < rank["Iván Cepeda"]

    def test_wrong_count_returns_422(self, client):
        bad = {f"q{str(i).zfill(2)}": 3 for i in range(1, 20)}  # only 19
        resp = client.post("/quiz/submit", json={"answers": bad})
        assert resp.status_code == 422

    def test_out_of_range_answer_returns_422(self, client):
        bad = {**_VALID_ANSWERS, "q01": 6}
        resp = client.post("/quiz/submit", json={"answers": bad})
        assert resp.status_code == 422

    def test_non_integer_answer_returns_422(self, client):
        bad = {**_VALID_ANSWERS, "q01": "cinco"}
        resp = client.post("/quiz/submit", json={"answers": bad})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# /explain/{candidate_name}
# ---------------------------------------------------------------------------

class TestExplainCandidate:

    def _answers_qs(self) -> str:
        return json.dumps(_VALID_ANSWERS)

    def test_valid_candidate_returns_200(self, client):
        resp = client.get(
            "/explain/Iván Cepeda",
            params={"answers": self._answers_qs()},
        )
        assert resp.status_code == 200

    def test_response_has_candidate_and_explanation(self, client):
        resp = client.get(
            "/explain/Paloma Valencia",
            params={"answers": self._answers_qs()},
        )
        data = resp.json()
        assert "candidate" in data
        assert "explanation" in data
        assert len(data["explanation"]) > 0

    def test_unknown_candidate_returns_404(self, client):
        resp = client.get(
            "/explain/Candidato Inexistente",
            params={"answers": self._answers_qs()},
        )
        assert resp.status_code == 404

    def test_missing_answers_param_returns_422(self, client):
        resp = client.get("/explain/Sergio Fajardo")
        assert resp.status_code == 422

    def test_invalid_json_answers_returns_422(self, client):
        resp = client.get(
            "/explain/Sergio Fajardo",
            params={"answers": "not-json"},
        )
        assert resp.status_code == 422

    def test_wrong_count_answers_returns_422(self, client):
        bad = json.dumps({"q01": 3})
        resp = client.get(
            "/explain/Sergio Fajardo",
            params={"answers": bad},
        )
        assert resp.status_code == 422
