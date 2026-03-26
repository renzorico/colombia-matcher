# Schema Notes — Colombia Matcher Canonical Data
*Last updated: 2026-03-26*

---

## 1. Canonical Topic System

### Chosen system: 7 merged topics (snake_case)

| topic_id | Label (ES) | Quiz weight | Legacy aliases |
|---|---|---|---|
| `security` | Seguridad | 25% | `seguridad` |
| `economy` | Economía | 20% | `economia` |
| `health` | Salud | 15% | `salud` |
| `energy_environment` | Energía y Medio Ambiente | 15% | `energy_oil`, `environment`, `energia_ambiente` |
| `fiscal` | Política Fiscal | 10% | `fiscal_policy` |
| `foreign_policy` | Política Exterior | 10% | `foreign-policy`, `politica_exterior` |
| `anticorruption` | Anticorrupción | 5% | `anti_corruption`, `anticorrupcion` |

### Why these 7 topics?

**Merging `energy_oil` + `environment` into `energy_environment`:**

The previous `candidates_v2.json` stored energy and environment as two separate keys (`energy_oil`, `environment`). However:

1. The quiz only has 3 questions (q12–q14) covering both topics together.
2. With only 3 questions, splitting them would give each sub-topic 1–2 questions — not enough for meaningful differentiation.
3. The scorer already used a merged key `energy_environment` with weight 0.15.
4. In Colombian political debate, candidates' positions on fracking, the energy transition, and environmental protection are deeply intertwined and rarely separable.

**Decision:** keep the two sub-stances in the research pipeline metadata but publish a single merged `energy_environment` stance score for quiz matching. The `merge_note` field on each topic entry records the sub-scores used.

**Merge formula used:**
- Score: simple arithmetic mean of `energy_oil` and `environment` sub-scores, rounded to nearest integer.
- Confidence: `0.85` if both sub-components are "high"; `0.65` if one is "low"; `0.40` if both are "low".

**Standardizing `foreign-policy` → `foreign_policy`:**

The frontend previously used a hyphenated form (`foreign-policy`). All new code uses underscores. The hyphenated form is registered as an alias in `topics.ts` and `topics.py` so old data is still readable.

**Quiz weight rationale (inherited from scorer.py):**

| Topic | Weight | Rationale |
|---|---|---|
| security | 25% | Most salient issue in 2026 cycle; maximum candidate divergence |
| economy | 20% | Second most contested; wide left-right spread |
| health | 15% | System crisis dominates domestic news; all candidates have detailed positions |
| energy_environment | 15% | Fracking/transition is a defining left-right axis |
| fiscal | 10% | Important but technical; fewer questions, narrower public engagement |
| foreign_policy | 10% | Significant (Venezuela, US); some candidates have limited detail |
| anticorruption | 5% | Cross-cutting but least differentiating at the policy-stance level |

---

## 2. How Missing Evidence Is Represented

The project follows a **strict no-fabrication rule**. When information is missing:

| Situation | Representation |
|---|---|
| Missing stance score | `"stance_score": null` |
| Missing stance summary | `"summary": null` |
| Missing confidence | `"confidence": null` |
| Missing proposals | `"proposals": []` |
| Missing controversy detail | `"source_ids": []` with `"notes"` explaining what is needed |
| Source URL not found | `"url": null` |
| Unknown date | `"date": null` or `"published_at": null` |
| Research needed | `"research_note"` field on the topic or `"status": "pending_research"` on controversy |

### Current placeholders by candidate:

| Candidate | Missing |
|---|---|
| All | `proposals: []` — no proposal-level data has been curated yet |
| All | `short_bio` derived from existing text; no invented facts |
| Claudia López | `foreign_policy` stance — no public position found as of 2026-03-26 |
| Abelardo de la Espriella | Controversy 01 (`espriella-controversy-01`) — source not confirmed |
| Fajardo | Controversy 02 (`fajardo-controversy-02`) — needs additional El Espectador sourcing |

---

## 3. Data Source and Reliability

### Primary source: LLYC Report

Most candidate stance data (`src-shared-llyc-2026`) comes from a Llorente & Cuenca (LLYC) electoral analysis document referenced as "[LLYC, p.XX]" in the original data. The URL of this document is not publicly known. This is a credible professional political risk firm, but the source is a single analysis, not primary campaign documents.

**Risk:** A single source creates a reliability single point of failure. Future enrichment should add primary sources (official campaign programs, videos, interviews) for each stance.

### Other sources

- Roy Barreras and Claudia López stances are backed by multiple public URLs from El Espectador, Cambio Colombia, Infobae, LaFM, and the candidates' own official websites. These are more independently verifiable.
- Controversy data comes from published news articles where URLs are confirmed.

### Source types

| type | Description |
|---|---|
| `analysis` | Third-party political analysis (e.g., LLYC) |
| `program` | Official campaign government program document |
| `interview` | Published interview with the candidate |
| `news` | News article covering the candidate |
| `official` | Official government or institution document |

---

## 4. Fields: Public Display vs Internal Metadata

### Public display (safe to render in UI)

| Field | Purpose |
|---|---|
| `id`, `name`, `party`, `coalition`, `spectrum` | Identity display |
| `short_bio` | Candidate card summary |
| `topics[].topic_label`, `topics[].plain_language_summary` | Quiz results, candidate page |
| `topics[].stance_score` | Matching algorithm input |
| `topics[].confidence` | Confidence indicator on results |
| `controversies[].title`, `controversies[].summary`, `controversies[].severity`, `controversies[].status` | Controversy panel |
| `sources[].title`, `sources[].publisher`, `sources[].url`, `sources[].published_at` | Citation links |

### Internal / research metadata (not for direct public display without review)

| Field | Purpose |
|---|---|
| `topics[].summary` | Full English/Spanish research summary; use `plain_language_summary` for UI |
| `topics[].evidence_ids` | Internal link to source objects |
| `topics[].merge_note` | Documents how sub-scores were merged; not a user-facing field |
| `topics[].research_note` | Internal flag for missing data |
| `metadata.procuraduria_summary` | Detailed legal status; display with care |
| `metadata.party_history` | Extended party context; too long for cards |
| `profile_status` | `curated_static` / `pending_review` / `agent_enriched` |
| `schema_version`, `generated_at` | File-level metadata |

### Controversy severity guide (for UI rendering)

| severity | Display |
|---|---|
| `low` | Grey badge / footnote |
| `medium` | Yellow badge |
| `high` | Orange badge |
| `critical` | Red badge |

### Controversy status guide

| status | Meaning |
|---|---|
| `acquitted` | Formally cleared by competent authority |
| `resolved` | Final ruling issued (not necessarily acquittal) |
| `pending` | Active legal/disciplinary process |
| `investigated` | Under investigation; no final ruling |
| `alleged` | Reported but not formally opened |
| `pending_research` | Source data not yet confirmed; placeholder only |

---

## 5. Score Scale and Interpretation

### `stance_score` (1–5 integer)

Inherited from the existing scorer. Represents position on a left–right policy axis **for that topic**:

| Score | General meaning |
|---|---|
| 1 | Far-left / progressive / interventionist / anti-extractivist |
| 2 | Center-left / moderate progressive |
| 3 | Center / technocratic / non-ideological |
| 4 | Center-right / market-oriented / security-focused |
| 5 | Far-right / ultra-liberal / authoritarian / extractivist |

This is a simplification. The direction of the scale is consistent **within each topic** but the exact meaning varies:
- On `security`: 1 = human security / negotiation; 5 = iron fist / militarized
- On `economy`: 1 = strong state intervention; 5 = radical market liberalisation
- On `energy_environment`: 1 = full transition, anti-fracking; 5 = maximum extraction, pro-fracking
- On `fiscal`: 1 = spending-first, anti-austerity; 5 = austerity-first, anti-deficit
- On `foreign_policy`: 1 = Latin American integration, Venezuela engagement; 5 = US alliance, anti-Venezuela
- On `anticorruption`: scores reflect institutional reform approach; less clear linear scale

### `confidence` (0.0–1.0 float)

| Value | Meaning |
|---|---|
| 0.85 | High — well-sourced, explicit, confirmed position |
| 0.65 | Mixed — one component high, one low |
| 0.40 | Low — inferred, limited sources, or flagged for review |
| `null` | No evidence found |

### `spectrum_score` (1–5 integer, in metadata)

Used for sorting/filtering candidates. Not for public display.

---

## 6. How This Static-First Model Evolves into Agent-Enriched

The `profile_status` field tracks the lifecycle:

```
curated_static  →  agent_enriched  →  pending_review  →  curated_static
```

1. **curated_static** (current state): All data is manually curated and verified.
   - Stances come from the LLYC report or confirmed public URLs.
   - `proposals: []` and missing fields are explicit placeholders.

2. **agent_enriched** (future): The research pipeline adds or updates fields:
   - New sources added to `sources[]`
   - `topics[].evidence_ids` extended with new sources
   - `proposals[]` populated from scraped/extracted program documents
   - `controversies[]` enriched with new press coverage
   - `topics[].confidence` updated based on evidence volume
   - A `proposed_stances` sibling block created (never overwrites `topics[]` directly)

3. **pending_review** (future): A diff between `topics[]` and `proposed_stances` is surfaced to a human reviewer via the admin UI.

4. Back to **curated_static** after human approval.

**Invariant:** The `curated_static` → `agent_enriched` transition never removes a `null` placeholder by inventing data. It only fills placeholders with evidence-backed values, or adds new evidence alongside existing values.

---

## 7. File Relationships and Intended Data Flow

```
backend/data/candidates_canonical.json   ← source of truth for all candidate data
backend/data/questions_canonical.json    ← source of truth for all quiz questions
backend/topics.py                        ← canonical topic definitions (Python)
frontend/lib/topics.ts                   ← canonical topic definitions (TypeScript)

backend/scorer.py                        ← reads candidates + questions; uses topics.py weights
backend/main.py                          ← serves API; should read from candidates_canonical.json
frontend/app/api/match/route.ts          ← should read from candidates_canonical.json via API
```

### Legacy files (keep for backward compatibility during migration)

- `backend/candidates_v2.json` — original data; has field name bugs (`candidate` vs `name`, split energy axes). Do not write new code against this file.
- `backend/questions_v1.json` — original questions; still valid but missing `topic_id` field and question `direction` metadata.

---

## 8. Known Bugs in Legacy Data (Documented for Migration)

1. **Field name mismatch:** `candidates_v2.json` uses key `"candidate"` but `scorer.py` reads `candidate["name"]`. Any call to `compute_affinity()` raises `KeyError`. Fix: update `scorer.py` to read `candidate.get("candidate") or candidate.get("name")`, or migrate to `candidates_canonical.json` which uses `"name"`.

2. **Axis mismatch:** `scorer.py` uses `"energy_environment"` (merged) but `candidates_v2.json` has `"energy_oil"` and `"environment"` as separate keys. The scorer always finds null for `energy_environment`, silently redistributing 15% of scoring weight. Fix: migrate to `candidates_canonical.json` where `energy_environment` is a single merged key.

3. **Axis hyphen vs underscore:** Frontend code used `"foreign-policy"` (hyphen) while all backend code uses `"foreign_policy"` (underscore). Fix: use `topics.ts` / `topics.py` `resolveTopicId()` wherever topic IDs are read from user input or older data.
