"""
review.py — Pydantic models for the candidate-update review workflow.

Separates three kinds of data clearly:
  1. Published canonical data  → backend/data/candidates_canonical.json
  2. Proposed edits (pending)  → backend/data/proposed_updates.json
  3. Review decisions          → backend/data/review_log.json

This module only defines the schemas.  Loading and routing live in main.py.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# File paths
# ---------------------------------------------------------------------------

_HERE = Path(__file__).parent
PROPOSALS_PATH  = _HERE / "data" / "proposed_updates.json"
REVIEW_LOG_PATH = _HERE / "data" / "review_log.json"


# ---------------------------------------------------------------------------
# Evidence attached to a proposal
# ---------------------------------------------------------------------------

class ProposalEvidence(BaseModel):
    url: str | None
    title: str | None
    publisher: str | None
    quote: str | None
    date: str | None


# ---------------------------------------------------------------------------
# A proposed update to one field on one candidate's topic
# ---------------------------------------------------------------------------

class ProposedUpdate(BaseModel):
    id: str
    candidate_id: str
    topic_id: str
    field: str                        # e.g. "stance_score", "summary"
    current_value: Any                # value currently in canonical data
    proposed_value: Any               # value the agent is proposing
    proposed_summary: str | None
    proposed_plain_language_summary: str | None
    evidence: ProposalEvidence
    proposed_by: str                  # e.g. "research_agent_v1"
    proposed_at: str                  # ISO 8601
    status: Literal["pending", "approved", "rejected"]
    agent_confidence: float           # 0.0–1.0
    agent_notes: str | None


# ---------------------------------------------------------------------------
# A human reviewer's decision on a proposal
# ---------------------------------------------------------------------------

class ReviewDecision(BaseModel):
    id: str
    proposal_id: str
    decision: Literal["approved", "rejected"]
    reviewer: str | None              # "human", username, or None if auto
    reviewed_at: str | None           # ISO 8601
    notes: str | None
    will_publish: bool


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_proposals(path: Path = PROPOSALS_PATH) -> list[ProposedUpdate]:
    """Load all proposals from proposed_updates.json."""
    with path.open(encoding="utf-8") as fh:
        raw: list[dict] = json.load(fh)
    return [ProposedUpdate(**item) for item in raw]


def load_review_log(path: Path = REVIEW_LOG_PATH) -> list[ReviewDecision]:
    """Load all review decisions from review_log.json."""
    with path.open(encoding="utf-8") as fh:
        raw: list[dict] = json.load(fh)
    return [ReviewDecision(**item) for item in raw]
