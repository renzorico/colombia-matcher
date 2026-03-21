"""
CLI to automatically collect public evidence and refresh candidate stances.

Example:
python -m agents.run_research_pipeline --candidates-file candidates_v2.json
"""

import argparse
import json
from pathlib import Path

from .aggregator_agent import StanceAggregatorAgent
from .collector_agent import WebCollectorAgent
from .extractor_agent import StanceExtractorAgent
from .research_config import load_research_config
from .updater_agent import CandidateUpdaterAgent


def _load_candidate_names(candidates_file: str) -> list[str]:
    payload = json.loads(Path(candidates_file).read_text(encoding="utf-8"))
    return [item["name"] for item in payload if "name" in item]


def run(candidates_file: str) -> None:
    config = load_research_config()
    collector = WebCollectorAgent(config)
    extractor = StanceExtractorAgent()
    aggregator = StanceAggregatorAgent(config)
    updater = CandidateUpdaterAgent(candidates_file)

    updates = []
    for candidate in _load_candidate_names(candidates_file):
        print(f"[research] collecting for {candidate}")
        docs = collector.collect(candidate)
        signals = extractor.extract(candidate, docs)
        updates.append(aggregator.aggregate(candidate, signals))
        print(f"[research] docs={len(docs)} signals={len(signals)}")

    updater.apply_updates(updates)
    print("[research] candidate stances updated")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--candidates-file",
        default="candidates_v2.json",
        help="Path to candidates_v2.json",
    )
    args = parser.parse_args()
    run(args.candidates_file)


if __name__ == "__main__":
    main()
