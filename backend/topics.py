"""
topics.py — Canonical topic definitions for Colombia Matcher.

Single source of truth for topic IDs, Spanish labels, weights,
and migration aliases.  Import this wherever topic names are needed
so that a single change propagates everywhere.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Topic:
    id: str              # canonical snake_case ID used in JSON + code
    label_es: str        # Spanish display label
    description_es: str  # Short Spanish description for UI tooltips
    quiz_weight: float   # Relative importance in the affinity score (sum = 1.0)
    aliases: tuple[str, ...] = field(default_factory=tuple)
    # ↑ Legacy IDs that may appear in older data files or frontend code.
    #   When reading data, treat any alias as equivalent to `id`.


TOPICS: tuple[Topic, ...] = (
    Topic(
        id="security",
        label_es="Seguridad",
        description_es="Orden público, fuerzas militares, negociación con grupos armados y política antidrogas.",
        quiz_weight=0.25,
        aliases=("seguridad",),
    ),
    Topic(
        id="economy",
        label_es="Economía",
        description_es="Intervención del Estado, política comercial, empleo, reforma agraria y modelo productivo.",
        quiz_weight=0.20,
        aliases=("economia",),
    ),
    Topic(
        id="health",
        label_es="Salud",
        description_es="Sistema de salud, EPS, cobertura pública y acceso a medicamentos.",
        quiz_weight=0.15,
        aliases=("salud",),
    ),
    Topic(
        id="energy_environment",
        label_es="Energía y Medio Ambiente",
        description_es="Política energética, transición hacia renovables, fracking, minería y protección ambiental.",
        quiz_weight=0.15,
        # Legacy split-axis aliases from candidates_v2.json (pre-canonical).
        # These two sub-axes were merged into a single topic for quiz scoring.
        aliases=("energy_oil", "environment", "energia_ambiente"),
    ),
    Topic(
        id="fiscal",
        label_es="Política Fiscal",
        description_es="Impuestos, gasto público, déficit fiscal, pensiones y reforma tributaria.",
        quiz_weight=0.10,
        aliases=("fiscal_policy",),
    ),
    Topic(
        id="foreign_policy",
        label_es="Política Exterior",
        description_es="Relaciones con EE.UU., Venezuela, integración latinoamericana y política exterior.",
        quiz_weight=0.10,
        # Frontend previously used a hyphenated form.
        aliases=("foreign-policy", "politica_exterior"),
    ),
    Topic(
        id="anticorruption",
        label_es="Anticorrupción",
        description_es="Transparencia institucional, financiación de campañas, reforma judicial y lucha contra la corrupción.",
        quiz_weight=0.05,
        aliases=("anti_corruption", "anticorrupcion"),
    ),
)

# ---------------------------------------------------------------------------
# Convenience lookups
# ---------------------------------------------------------------------------

#: Map canonical ID → Topic
TOPICS_BY_ID: dict[str, Topic] = {t.id: t for t in TOPICS}

#: Map any alias (or canonical ID) → Topic
_ALIAS_MAP: dict[str, Topic] = {}
for _t in TOPICS:
    _ALIAS_MAP[_t.id] = _t
    for _alias in _t.aliases:
        _ALIAS_MAP[_alias] = _t


def get_topic(id_or_alias: str) -> Topic | None:
    """Return the Topic for a canonical ID or any registered alias."""
    return _ALIAS_MAP.get(id_or_alias)


def resolve_topic_id(id_or_alias: str) -> str | None:
    """Return the canonical topic ID for any ID or alias string."""
    topic = get_topic(id_or_alias)
    return topic.id if topic else None


#: Axis weights dict (for scorer.py compatibility)
AXIS_WEIGHTS: dict[str, float] = {t.id: t.quiz_weight for t in TOPICS}

#: Spanish labels dict (for explain_match compatibility)
AXIS_LABELS_ES: dict[str, str] = {t.id: t.label_es for t in TOPICS}
