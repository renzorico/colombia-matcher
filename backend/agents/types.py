from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ResearchDocument:
    url: str
    title: str
    source: str
    text: str


@dataclass(frozen=True)
class ExtractedSignal:
    axis: str
    score: int
    confidence: float
    evidence: str
    source_url: str


@dataclass
class CandidateResearch:
    candidate: str
    documents: list[ResearchDocument]
    signals: list[ExtractedSignal]


@dataclass
class CandidateStanceUpdate:
    candidate: str
    stances: dict[str, int | None]
    metadata: dict[str, Any]
