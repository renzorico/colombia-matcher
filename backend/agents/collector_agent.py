import re
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from .research_config import ResearchConfig
from .types import ResearchDocument


TRUSTED_SOURCE_HINTS = [
    "eltiempo.com",
    "semana.com",
    "elespectador.com",
    "caracol.com.co",
    "bluradio.com",
    "rcnradio.com",
    "lasillavacia.com",
    "presidencia.gov.co",
    "congreso.gov.co",
    "youtube.com",
]


def _safe_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    text = " ".join(node.get_text(" ", strip=True) for node in soup.find_all(["p", "h1", "h2", "h3", "li"]))
    return re.sub(r"\s+", " ", text).strip()


def _build_queries(candidate: str) -> list[str]:
    return [
        f'"{candidate}" seguridad economía salud propuestas presidenciales Colombia',
        f'"{candidate}" entrevista programa de gobierno 2026 Colombia',
        f'"{candidate}" corrupción política exterior energía ambiental Colombia',
    ]


class WebCollectorAgent:
    def __init__(self, config: ResearchConfig):
        self.config = config

    def _search_urls(self, query: str) -> list[str]:
        if not self.config.serper_api_key:
            raise RuntimeError(
                "SERPER_API_KEY is missing. Set it in your environment to enable automatic web search."
            )

        payload = {"q": query, "num": self.config.max_urls_per_query}
        headers = {
            "X-API-KEY": self.config.serper_api_key,
            "Content-Type": "application/json",
        }
        response = requests.post(
            "https://google.serper.dev/search",
            json=payload,
            headers=headers,
            timeout=20,
        )
        response.raise_for_status()

        data = response.json()
        items = data.get("organic", [])
        urls: list[str] = []
        for item in items:
            url = item.get("link")
            if isinstance(url, str) and url.startswith("http"):
                urls.append(url)
        return urls

    def _fetch_document(self, url: str) -> ResearchDocument | None:
        parsed = urlparse(url)
        source = parsed.netloc.lower()
        if not parsed.scheme.startswith("http"):
            return None

        if not any(hint in source for hint in TRUSTED_SOURCE_HINTS):
            return None

        response = requests.get(
            url,
            timeout=20,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; colombia-matcher-bot/1.0)",
            },
        )
        response.raise_for_status()

        html = response.text
        title_match = re.search(r"<title>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else url
        text = _safe_text_from_html(html)[: self.config.max_chars_per_doc]
        if len(text) < 600:
            return None

        return ResearchDocument(url=url, title=title, source=source, text=text)

    def collect(self, candidate: str) -> list[ResearchDocument]:
        urls: list[str] = []
        for query in _build_queries(candidate):
            urls.extend(self._search_urls(query))

        seen: set[str] = set()
        deduped = [u for u in urls if not (u in seen or seen.add(u))]

        docs: list[ResearchDocument] = []
        for url in deduped:
            try:
                doc = self._fetch_document(url)
            except Exception:
                continue
            if doc:
                docs.append(doc)
        return docs
