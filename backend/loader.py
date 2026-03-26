"""
loader.py — Canonical data loaders for Colombia Matcher.

Reads backend/data/candidates_canonical.json and
backend/data/questions_canonical.json, then normalises each record
into the flat shape that scorer.py and main.py expect.

Design rules
------------
- No fabrication: null / missing fields stay null.
- No external I/O beyond reading the two local JSON files.
- All topic IDs are resolved through topics.py so aliases are
  transparent to callers.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from topics import resolve_topic_id

# ---------------------------------------------------------------------------
# Canonical file paths (relative to this file)
# ---------------------------------------------------------------------------

_HERE = Path(__file__).parent
CANDIDATES_PATH = _HERE / "data" / "candidates_canonical.json"
QUESTIONS_PATH  = _HERE / "data" / "questions_canonical.json"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _topics_to_stances(topics: list[dict]) -> dict[str, int | None]:
    """
    Flatten the canonical topics array into a simple { topic_id: stance_score }
    dict that scorer.compute_affinity() can consume directly.

    Null stance_score values are preserved as None so the scorer's
    weight-redistribution logic can handle them correctly.
    """
    stances: dict[str, int | None] = {}
    for topic in topics:
        raw_id = topic.get("topic_id", "")
        canonical_id = resolve_topic_id(raw_id) or raw_id
        stances[canonical_id] = topic.get("stance_score")  # may be None
    return stances


# ---------------------------------------------------------------------------
# Public loaders
# ---------------------------------------------------------------------------

def load_canonical_candidates(path: Path = CANDIDATES_PATH) -> list[dict]:
    """
    Load and normalise candidates from candidates_canonical.json.

    Returned dicts expose:
      id, name, party, coalition, spectrum, spectrum_score, short_bio,
      image_url, stances (flat dict: topic_id → score | None),
      topics (original array, kept for richer endpoints),
      proposals, controversies, metadata, profile_status, last_updated.

    The 'name' field is always present so scorer.py's candidate["name"]
    lookup never raises a KeyError.
    """
    raw = _load_json(path)
    candidates_raw: list[dict] = raw["candidates"]

    result: list[dict] = []
    for c in candidates_raw:
        stances = _topics_to_stances(c.get("topics", []))
        result.append(
            {
                "id":             c["id"],
                "name":           c["name"],
                "party":          c.get("party"),
                "coalition":      c.get("coalition"),
                "spectrum":       c.get("spectrum"),
                "spectrum_score": c.get("spectrum_score"),
                "short_bio":      c.get("short_bio"),
                "image_url":      c.get("image_url"),
                # scorer.compute_affinity reads this flat dict
                "stances":        stances,
                # kept for /candidates/full and richer endpoints
                "topics":         c.get("topics", []),
                "proposals":      c.get("proposals", []),
                "controversies":  c.get("controversies", []),
                "metadata":       c.get("metadata", {}),
                "profile_status": c.get("profile_status"),
                "last_updated":   c.get("last_updated"),
            }
        )
    return result


def load_canonical_sources(path: Path = CANDIDATES_PATH) -> dict[str, dict]:
    """
    Return {source_id: source_dict} for every source in the top-level
    'sources' array of candidates_canonical.json.

    Used by main.py to resolve evidence_ids in topic records so that
    /candidates/full can include cited URLs per candidate.
    """
    raw = _load_json(path)
    return {s["id"]: s for s in raw.get("sources", [])}


def load_canonical_questions(path: Path = QUESTIONS_PATH) -> list[dict]:
    """
    Load and normalise questions from questions_canonical.json.

    Adds an 'axis' key (= topic_id) for scorer.py compatibility, and a
    'bucket' key (= topic_label) for frontend-API compatibility.
    The canonical 'topic_id' and 'topic_label' keys are also preserved.
    """
    raw: list[dict] = _load_json(path)

    result: list[dict] = []
    for q in raw:
        topic_id = q.get("topic_id", "")
        canonical_id = resolve_topic_id(topic_id) or topic_id
        result.append(
            {
                **q,
                # scorer.py reads 'axis'; map canonical topic_id → axis
                "axis":   canonical_id,
                # main.py /questions endpoint exposes 'bucket'
                "bucket": q.get("topic_label", canonical_id),
            }
        )
    return result
