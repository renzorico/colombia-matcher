import json
from datetime import datetime, timezone
from pathlib import Path

from .types import CandidateStanceUpdate


class CandidateUpdaterAgent:
    def __init__(self, candidates_path: str):
        self.candidates_path = Path(candidates_path)

    def apply_updates(self, updates: list[CandidateStanceUpdate]) -> None:
        candidates = json.loads(self.candidates_path.read_text(encoding="utf-8"))

        updates_by_name = {u.candidate: u for u in updates}
        now = datetime.now(timezone.utc).isoformat()

        for candidate in candidates:
            name = candidate.get("name")
            update = updates_by_name.get(name)
            if not update:
                continue

            candidate["stances"] = update.stances
            candidate["research"] = {
                "updated_at": now,
                **update.metadata,
            }

        self.candidates_path.write_text(
            json.dumps(candidates, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
