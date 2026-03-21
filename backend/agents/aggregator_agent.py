from collections import defaultdict
from statistics import mean

from .research_config import ResearchConfig
from .types import CandidateStanceUpdate, ExtractedSignal


AXES = [
    "security",
    "economy",
    "health",
    "energy_environment",
    "fiscal",
    "foreign_policy",
    "anticorruption",
]


class StanceAggregatorAgent:
    def __init__(self, config: ResearchConfig):
        self.config = config

    def aggregate(self, candidate: str, signals: list[ExtractedSignal]) -> CandidateStanceUpdate:
        by_axis: dict[str, list[ExtractedSignal]] = defaultdict(list)
        for signal in signals:
            by_axis[signal.axis].append(signal)

        stances: dict[str, int | None] = {}
        evidence_count: dict[str, int] = {}
        evidence_urls: dict[str, list[str]] = {}

        for axis in AXES:
            axis_signals = by_axis.get(axis, [])
            evidence_count[axis] = len(axis_signals)
            evidence_urls[axis] = [s.source_url for s in axis_signals[:5]]

            if len(axis_signals) < self.config.min_axis_signals:
                stances[axis] = None
                continue

            weighted = [s.score * s.confidence for s in axis_signals]
            avg = mean(weighted) / mean([s.confidence for s in axis_signals])
            stances[axis] = max(1, min(5, round(avg)))

        metadata = {
            "evidence_count": evidence_count,
            "evidence_urls": evidence_urls,
        }

        return CandidateStanceUpdate(candidate=candidate, stances=stances, metadata=metadata)
