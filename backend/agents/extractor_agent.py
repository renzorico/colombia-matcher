from .types import ExtractedSignal, ResearchDocument


AXIS_RULES = {
    "security": {
        "high": ["mano dura", "endurecer penas", "militar", "pie de fuerza", "cárcel"],
        "low": ["justicia restaurativa", "prevención", "resocialización", "acuerdo de paz"],
    },
    "economy": {
        "high": ["libre mercado", "privatización", "inversión privada", "reducir regulación"],
        "low": ["empresa pública", "subsidios", "control de precios", "intervención estatal"],
    },
    "health": {
        "high": ["aseguradoras", "eps", "competencia privada"],
        "low": ["salud pública", "universal", "atención primaria", "fortalecer hospitales públicos"],
    },
    "energy_environment": {
        "high": ["exploración petrolera", "fracking", "carbón", "gas"],
        "low": ["transición energética", "energías limpias", "descarbonización", "protección ambiental"],
    },
    "fiscal": {
        "high": ["austeridad", "reducir gasto", "regla fiscal", "equilibrio fiscal"],
        "low": ["inversión social", "gasto público", "expansión fiscal", "reforma tributaria progresiva"],
    },
    "foreign_policy": {
        "high": ["alineado con estados unidos", "otan", "sanciones", "línea dura"],
        "low": ["integración regional", "diplomacia", "negociación", "multilateralismo"],
    },
    "anticorruption": {
        "high": ["transparencia", "veeduría", "rendición de cuentas", "fiscalización", "lucha anticorrupción"],
        "low": ["clientelismo", "mermelada", "favores políticos", "captura institucional"],
    },
}


def _clip_evidence(text: str, marker: str, window: int = 220) -> str:
    idx = text.find(marker)
    if idx < 0:
        return text[:window]
    start = max(0, idx - window // 2)
    end = min(len(text), idx + window // 2)
    return text[start:end].strip()


class StanceExtractorAgent:
    def extract(self, candidate: str, documents: list[ResearchDocument]) -> list[ExtractedSignal]:
        signals: list[ExtractedSignal] = []

        for doc in documents:
            text = doc.text.lower()
            for axis, rules in AXIS_RULES.items():
                for phrase in rules["high"]:
                    if phrase in text:
                        signals.append(
                            ExtractedSignal(
                                axis=axis,
                                score=5,
                                confidence=0.7,
                                evidence=_clip_evidence(doc.text, phrase),
                                source_url=doc.url,
                            )
                        )
                for phrase in rules["low"]:
                    if phrase in text:
                        signals.append(
                            ExtractedSignal(
                                axis=axis,
                                score=1,
                                confidence=0.7,
                                evidence=_clip_evidence(doc.text, phrase),
                                source_url=doc.url,
                            )
                        )

        # Keep strongest evidence first for deterministic aggregation.
        signals.sort(key=lambda s: (s.axis, -s.confidence, s.source_url))
        return signals
