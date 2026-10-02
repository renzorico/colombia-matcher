"""
Generate parity fixtures for the TypeScript scorer (frontend/lib/scorer.ts).

Runs the reference Python scorer (backend/scorer.py) over a fixed set of
answer profiles and writes the expected rankings to
frontend/lib/__fixtures__/scorer_parity.json.  The Vitest suite in
frontend/lib/scorer.test.ts asserts the TS port reproduces them exactly.

Re-run after changing candidate data, questions, or scoring logic:
    python3 scripts/generate_scorer_fixtures.py
"""

import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from loader import load_canonical_candidates, load_canonical_questions  # noqa: E402
from scorer import compute_affinity  # noqa: E402

OUTPUT_PATH = ROOT / "frontend" / "lib" / "__fixtures__" / "scorer_parity.json"
QUESTION_COUNT = 25
RANDOM_PROFILE_COUNT = 8
RANDOM_SEED = 2026


def _uniform(value: int) -> dict[str, int]:
    return {f"q{i:02d}": value for i in range(1, QUESTION_COUNT + 1)}


def _alternating() -> dict[str, int]:
    return {f"q{i:02d}": 5 if i % 2 else 1 for i in range(1, QUESTION_COUNT + 1)}


def _random_profiles() -> list[dict[str, int]]:
    rng = random.Random(RANDOM_SEED)
    return [
        {f"q{i:02d}": rng.randint(1, 5) for i in range(1, QUESTION_COUNT + 1)}
        for _ in range(RANDOM_PROFILE_COUNT)
    ]


def main() -> None:
    candidates = load_canonical_candidates()
    questions = load_canonical_questions()

    profiles: dict[str, dict[str, int]] = {
        **{f"uniform_{v}": _uniform(v) for v in range(1, 6)},
        "alternating": _alternating(),
        **{f"random_{i}": p for i, p in enumerate(_random_profiles())},
    }

    fixtures = [
        {
            "name": name,
            "answers": answers,
            "expected": compute_affinity(answers, candidates, questions),
        }
        for name, answers in profiles.items()
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(fixtures, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(fixtures)} fixtures → {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
