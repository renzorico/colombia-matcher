import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ResearchConfig:
    serper_api_key: str | None
    max_urls_per_query: int
    max_chars_per_doc: int
    min_axis_signals: int


def load_research_config() -> ResearchConfig:
    return ResearchConfig(
        serper_api_key=os.getenv("SERPER_API_KEY"),
        max_urls_per_query=int(os.getenv("MAX_URLS_PER_QUERY", "5")),
        max_chars_per_doc=int(os.getenv("MAX_CHARS_PER_DOC", "12000")),
        min_axis_signals=int(os.getenv("MIN_AXIS_SIGNALS", "2")),
    )
