# ¿Con quién votas? — Colombia Matcher 2026

Herramienta cívica construida para las elecciones presidenciales de Colombia 2026: quiz de afinidad política, perfiles de candidatos con propuestas, controversias y fuentes verificadas.

> 🌐 **Demo en vivo:** https://nobotestuvoto.vercel.app

> **Proyecto archivado.** Los datos de candidatos están congelados al 1 de junio de 2026 (entre primera y segunda vuelta). Abelardo de la Espriella ganó la segunda vuelta del 21 de junio de 2026 con 49.66% frente a 48.70% de Iván Cepeda. El quiz sigue funcionando como demo.

El usuario responde 25 preguntas y descubre con qué candidato comparte más posiciones, con desglose por tema y links a las fuentes consultadas. Disponible en español e inglés.

---

## Arquitectura

El sitio es **100% estático**: un solo proyecto Next.js en Vercel, sin servidor, base de datos ni variables de entorno.

```mermaid
flowchart TD
    User([Ciudadano]) -->|Responde 25 preguntas| Quiz[/quiz]
    Quiz --> Scorer[lib/scorer.ts\nAfinidad ponderada por eje\nen el navegador]
    Data[(frontend/data/\ncandidates_canonical.json\nquestions_canonical.json)] --> Scorer
    Scorer --> Results[/resultados]
    Results --> Profile[/candidatos/id\nHTML prerenderizado]
    Data --> Profile

    subgraph Offline [Pipeline de investigación — offline, Python]
        direction TB
        Collector[Collector Agent\nBúsqueda web] --> Extractor[Extractor Agent\nPosturas por eje]
        Extractor --> Aggregator[Aggregator Agent\nConsolidación + confianza]
        Aggregator --> Proposals[(proposed_updates.json)]
        Proposals --> Human[Revisor humano]
        Human --> Log[(review_log.json)]
    end

    Human -.->|Aprobado| Data
```

**Decisiones clave**
- **Scoring en el cliente.** El motor de afinidad se escribió primero en Python (`backend/scorer.py`) y se portó a TypeScript (`frontend/lib/scorer.ts`). Tests de paridad en Vitest verifican que ambos producen resultados idénticos, incluido el redondeo de Python.
- **Una sola fuente de datos.** `frontend/data/*.json` lo leen tanto el sitio como el pipeline Python.
- **Humano en el loop.** Los agentes solo *proponen* cambios; nada llega a los datos publicados sin revisión.

---

## Algoritmo de afinidad

Cada pregunta tiene un eje temático y un peso (1–3). Las respuestas del usuario se promedian por eje, produciendo un puntaje 1–5 por tema. Cada candidato tiene también un `stance_score` 1–5 por tema, curado manualmente.

```
acuerdo = 1 − |puntaje_usuario − puntaje_candidato| / 4
```

El score final es la suma ponderada del acuerdo por tema. Los temas con datos nulos redistribuyen su peso proporcionalmente. Las preguntas de dirección negativa invierten la respuesta (`6 − respuesta`) antes del cálculo.

| Eje | Peso |
|---|---|
| Seguridad | 25% |
| Economía | 20% |
| Salud | 15% |
| Energía y Medio Ambiente | 15% |
| Política Fiscal | 10% |
| Política Exterior | 10% |
| Anticorrupción | 5% |

---

## Estructura del proyecto

```
colombia-matcher/
├── frontend/                        # sitio desplegado (Next.js 16)
│   ├── data/                        # JSON canónico: candidatos, fuentes, preguntas
│   ├── app/                         # quiz, resultados, candidatos, metodología, riesgos electorales
│   ├── components/
│   └── lib/
│       ├── scorer.ts                # motor de afinidad (port de backend/scorer.py)
│       ├── api.ts                   # acceso tipado a los datos
│       └── __fixtures__/            # resultados esperados generados desde Python
├── backend/                         # pipeline de investigación offline (Python)
│   ├── agents/                      # collector → extractor → aggregator → updater
│   ├── data/                        # propuestas y log de revisión
│   ├── scorer.py · loader.py · topics.py   # implementación de referencia
│   └── tests/                       # pytest
└── scripts/                         # enriquecimiento de perfiles y generación de fixtures
```

---

## Desarrollo local

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest, incluye tests de paridad con Python
npm run build
```

Pipeline Python (opcional):

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/pytest
```

Si cambias los datos o la lógica de scoring, regenera los fixtures de paridad:

```bash
python3 scripts/generate_scorer_fixtures.py
```

---

## Despliegue

Un proyecto de Vercel con **root directory** `frontend`. No hace falta configurar variables de entorno. Cada push a `master` despliega.

---

## Tecnologías

| Capa | Stack |
|---|---|
| Sitio | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Vitest |
| Investigación | Python · requests · BeautifulSoup · Pydantic · pytest |
| Datos | JSON estático curado manualmente con fuentes citadas |

---

## Candidatos incluidos

| Candidato | Espectro | Partido |
|---|---|---|
| Iván Cepeda | Izquierda | Pacto Histórico |
| Roy Barreras | Centro-izquierda | Independiente |
| Sergio Fajardo | Centro | Independiente |
| Claudia López | Centro | Consulta de las Soluciones |
| Paloma Valencia | Centro-derecha | Centro Democrático |
| Abelardo de la Espriella | Derecha radical | Conservador |
