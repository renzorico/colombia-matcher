# ¿Con quién votas? — Colombia Matcher 2026

Herramienta cívica para las elecciones presidenciales Colombia 2026 — quiz de afinidad política, perfiles de candidatos con propuestas, controversias y fuentes verificadas. Arquitectura multi-agente, estática primero.

> 🌐 **Demo en vivo:** https://colombia-matcher.vercel.app

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/renzorico/colombia-matcher&root=frontend)

> **Nota:** el frontend se despliega en Vercel, pero el backend debe desplegarse por separado en Railway. Ver [DEPLOY.md](./DEPLOY.md) para instrucciones completas.

Quiz de afinidad política para las elecciones presidenciales colombianas de 2026.
El usuario responde 25 preguntas y descubre con qué candidato comparte más posiciones,
con desglose por tema y links a las fuentes consultadas.

---

## Estado actual

| Capa | Estado |
|---|---|
| Quiz (25 preguntas) | Producción |
| Motor de afinidad (backend Python) | Producción |
| Perfiles de 6 candidatos curados | Producción |
| Explorer de candidatos (/candidatos) | Producción |
| Workflow de revisión humana | Producción (lectura) |
| Pipeline de investigación automático | Diseñado — no habilitado en producción |

Los datos de candidatos son **estáticos y curados manualmente**.
No se usan APIs de pago ni scrapers en producción.

---

## Arquitectura del sistema

```mermaid
flowchart TD
    User([Ciudadano]) -->|Responde 25 preguntas| Quiz[Quiz Page]
    Quiz -->|GET /questions| Backend
    Quiz -->|POST /quiz/submit| Backend

    subgraph Backend [Backend Python — FastAPI]
        direction TB
        Scorer[scorer.py\nAfinidad ponderada por eje]
        Loader[loader.py\nNormalización canónica]
        Data[(candidates_canonical.json\nquestions_canonical.json)]
        Loader --> Data
        Scorer --> Loader
    end

    Backend -->|Result[] ordenados por score| Results[/resultados]
    Results -->|Selecciona candidato| Profile[/candidatos/id]
    Profile -->|GET /candidates/full| Backend

    subgraph ReviewLayer [Capa de revisión — workflow humano]
        direction TB
        Proposals[(proposed_updates.json)]
        Log[(review_log.json)]
        Proposals --> Human[Revisor Humano]
        Human --> Log
    end

    subgraph FutureAgents [Agentes de investigación — futuro]
        direction TB
        RA[Research Agent\nBúsqueda web]
        SEA[Stance Extractor Agent\nExtracción de posturas]
        PA[Profile Aggregator Agent\nConsolidación]
        RA --> SEA --> PA --> Proposals
    end
```

---

## Flujo de producción

```
1. Usuario abre /quiz
2. Frontend fetches GET /questions  (backend canónico)
3. Usuario responde 25 preguntas Likert (1–5)
4. Frontend POST /quiz/submit con respuestas
5. Backend calcula afinidad ponderada por 7 ejes
6. Frontend recibe Result[] y renderiza /resultados
7. Usuario explora candidatos en /candidatos y /candidatos/[id]
```

---

## Algoritmo de afinidad

Cada pregunta tiene un eje temático y un peso (1–3). Las respuestas del usuario se promedian por eje, produciendo un puntaje 1–5 por tema. Cada candidato tiene también un `stance_score` 1–5 por tema, curado manualmente.

La afinidad por tema es:

```
acuerdo = 1 − |puntaje_usuario − puntaje_candidato| / 4
```

El score final es la suma ponderada del acuerdo por tema. Los temas con datos nulos redistribuyen su peso proporcionalmente. Las preguntas de dirección negativa invierten la respuesta (`6 − respuesta`) antes del cálculo.

**7 ejes temáticos y sus pesos:**

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
├── backend/
│   ├── data/
│   │   ├── candidates_canonical.json   # fuente de verdad de candidatos
│   │   ├── questions_canonical.json    # 25 preguntas con pesos y dirección
│   │   ├── proposed_updates.json       # propuestas del agente (pendientes de revisión)
│   │   └── review_log.json             # decisiones del revisor humano
│   ├── agents/                         # pipeline de investigación (dev)
│   ├── tests/                          # 105 tests (pytest)
│   ├── loader.py                       # normalización de JSON canónico
│   ├── scorer.py                       # motor de afinidad
│   ├── review.py                       # modelos Pydantic del workflow de revisión
│   ├── topics.py                       # fuente única de verdad de temas y pesos
│   └── main.py                         # FastAPI app
└── frontend/
    ├── app/
    │   ├── quiz/                       # quiz interactivo
    │   ├── resultados/                 # resultados de afinidad
    │   ├── candidatos/                 # listado de candidatos
    │   ├── candidatos/[id]/            # perfil detallado
    │   ├── metodologia/                # metodología y arquitectura
    │   └── admin/review/               # dashboard de revisión (dev only)
    ├── components/                     # NavBar, TopicBreakdown, SourceList, EmptyState
    ├── lib/api.ts                      # cliente HTTP tipado para el backend
    └── services/ + skills/             # pipeline TypeScript (dev/debug only)
```

---

## Desarrollo local

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# Corre en http://localhost:8000
# Documentación: http://localhost:8000/docs
```

Endpoints principales:
- `GET /questions` — 25 preguntas del quiz
- `GET /candidates` — listado de candidatos
- `GET /candidates/full` — perfiles completos con fuentes y temas
- `POST /quiz/submit` — calcula afinidad
- `GET /explain/{name}` — explicación en español
- `GET /review/pending` — propuestas de actualización pendientes
- `GET /review/log` — log de decisiones del revisor

### Frontend

```bash
cd frontend
npm install
npm run dev
# Corre en http://localhost:3000
```

Variable de entorno (opcional):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Tests

```bash
cd backend
python -m pytest tests/ -v
# 105 tests
```

---

## Workflow de revisión (human-in-the-loop)

El sistema implementa un ciclo explícito de revisión antes de publicar cambios:

```
Research Agent propone → proposed_updates.json (status: pending)
         ↓
Revisor humano evalúa → review_log.json (approved / rejected + notas)
         ↓
Aprobado → actualización manual de candidates_canonical.json
```

El dashboard de revisión está disponible en `/admin/review` durante desarrollo.

---

## Despliegue

### Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Vercel (build-time) | URL completa del backend desplegado, sin trailing slash. Ej: `https://colombia-matcher.up.railway.app`. **Debe estar seteada antes del primer build.** |
| `CORS_ORIGINS` | Railway / Render | Orígenes permitidos, separados por comas. Ej: `https://colombia-matcher.vercel.app`. En dev, `localhost:3000` siempre está permitido. |
| `PORT` | Railway / Render | Inyectada automáticamente por la plataforma. No setear manualmente. |

---

### Backend → Railway (recomendado)

1. Crear un nuevo proyecto en [railway.app](https://railway.app) y conectar este repositorio.
2. Configurar el **root directory** como `backend`.
3. Railway detecta `railway.toml` automáticamente — builder nixpacks, start command uvicorn.
4. Setear la variable de entorno `CORS_ORIGINS` con la URL del frontend Vercel.
5. Una vez desplegado, copiar la URL pública (ej. `https://colombia-matcher.up.railway.app`).

### Frontend → Vercel (recomendado)

1. Importar el repositorio en [vercel.com](https://vercel.com).
2. Configurar el **root directory** como `frontend`.
3. Antes del primer build, setear la variable de entorno `NEXT_PUBLIC_API_URL` con la URL del backend Railway.
4. Deploy — Vercel detecta Next.js automáticamente.

### Backend → Render (alternativa gratuita)

Render detecta `render.yaml` en la raíz del repositorio. Solo conectar el repo y Render configura el servicio automáticamente. Setear `CORS_ORIGINS` en el dashboard.

### Desarrollo local con Docker

```bash
docker compose up --build
# Frontend en http://localhost:3000
# Backend en http://localhost:8000
```

El compose monta `./backend/data` como volumen, por lo que los cambios en los JSONs son inmediatos sin reconstruir la imagen.

---

## Roadmap

**Corto plazo (sin costo adicional):**
- Más candidatos (Juan Manuel Galán, Francia Márquez, etc.)
- Propuestas curadas por candidato
- Versión móvil mejorada

**Mediano plazo (agentes automáticos):**
- Habilitar Research Agent para búsqueda web periódica
- Stance Extractor con LLM para análisis de fuentes nuevas
- Profile Aggregator que consolida micro-posturas con confianza
- Alertas automáticas cuando un candidato cambia de postura

**Largo plazo:**
- Cobertura de elecciones locales (alcaldes, gobernadores)
- API pública para medios de comunicación
- Versión en inglés para audiencia internacional

---

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Python · FastAPI · Pydantic · pytest |
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Datos | JSON estático curado manualmente |
| Algoritmo | Promedios ponderados + normalización de escala |

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
