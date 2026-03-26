import Link from "next/link";

// ---------------------------------------------------------------------------
// Static sections
// ---------------------------------------------------------------------------

const TOPICS = [
  { id: "security", label: "Seguridad", weight: "25%", desc: "Política de paz, relaciones con grupos armados, fuerzas militares." },
  { id: "economy", label: "Economía", weight: "20%", desc: "Modelo económico, inversión privada, rol del Estado en la economía." },
  { id: "health", label: "Salud", weight: "15%", desc: "Sistema de salud, EPS vs. modelo público, reforma a la salud." },
  { id: "energy_environment", label: "Energía y Medio Ambiente", weight: "15%", desc: "Transición energética, exploración de petróleo, acción climática." },
  { id: "fiscal", label: "Política Fiscal", weight: "10%", desc: "Deuda pública, gasto social, reforma tributaria, austeridad." },
  { id: "foreign_policy", label: "Política Exterior", weight: "10%", desc: "Relaciones con EE.UU., Venezuela, organismos internacionales." },
  { id: "anticorruption", label: "Anticorrupción", weight: "5%", desc: "Transparencia, control institucional, mecanismos anticorrupción." },
];

const AGENTS = [
  {
    name: "Research Agent",
    status: "future",
    description:
      "Busca en la web fuentes diversas sobre cada candidato: discursos, entrevistas, noticias, programas, redes sociales. Produce una lista estructurada de fuentes con metadatos (tipo, fecha, URL).",
    inputs: "ID de candidato, temas, ventana de tiempo",
    outputs: "Lista de Source[] con tipo, URL, fecha, extracto",
  },
  {
    name: "Stance Extractor Agent",
    status: "future",
    description:
      "Analiza cada fuente y extrae micro-posturas: qué dijo el candidato sobre cada tema, en qué dimensión (política, comportamiento, alianzas, retórica), y con qué evidencia.",
    inputs: "Source[], candidato, tema",
    outputs: "MicroStance[] con score [-1,1], label, cita, URL",
  },
  {
    name: "Profile Aggregator Agent",
    status: "future",
    description:
      "Consolida todas las micro-posturas en un perfil por candidato: promedia puntajes por tema y dimensión, calcula confianza según cantidad y coherencia de evidencia.",
    inputs: "MicroStance[] de múltiples fuentes",
    outputs: "CandidateProfile con topicScores y confidence",
  },
  {
    name: "Review Agent",
    status: "active",
    description:
      "Compara el perfil propuesto con el publicado y genera un diff legible por humanos. Permite a un revisor aceptar o rechazar cambios antes de que lleguen a la data canónica.",
    inputs: "ProposedUpdate[], canonical data",
    outputs: "ReviewDiff, recomendación de acción",
  },
  {
    name: "Matcher Agent",
    status: "active",
    description:
      "Lee el perfil canónico y las respuestas del usuario al quiz. Calcula afinidad usando promedios ponderados y normalización de escala. Explica los mayores acuerdos y divergencias.",
    inputs: "Answers (q01–q25), candidates_canonical.json",
    outputs: "Result[] ordenados por score, breakdown por tema, explicación",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetodologiaPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
            Metodología y arquitectura
          </span>
        </div>
        <h1 className="text-3xl font-bold">Cómo funciona</h1>
        <p className="mt-3 text-gray-500 leading-relaxed max-w-2xl">
          Esta herramienta calcula la afinidad entre tus posiciones y las de cada candidato
          presidencial colombiano. Los datos son curados manualmente y la arquitectura está
          diseñada para soportar enriquecimiento automatizado con supervisión humana.
        </p>

        {/* Status banner */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">Estado actual del proyecto</p>
          <p className="mt-1 text-sm text-amber-700">
            La versión en producción usa datos <strong>estáticos curados manualmente</strong>.
            La capa de investigación automática y los agentes de scraping están diseñados
            pero no se ejecutan en producción todavía — prioridad: precisión y transparencia
            antes que escala.
          </p>
        </div>

        {/* ── Production flow ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Flujo de producción actual</h2>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 font-mono text-sm text-gray-700">
            <div className="flex flex-col gap-1.5">
              {[
                ["Usuario", "responde 25 preguntas en el quiz"],
                ["Quiz page", "GET /questions → preguntas del backend canónico"],
                ["Quiz page", "POST /quiz/submit con respuestas (1–5 por pregunta)"],
                ["Backend scorer", "calcula afinidad ponderada por los 7 ejes temáticos"],
                ["Backend scorer", "devuelve Result[] ordenado por score (0–100%)"],
                ["Results page", "muestra candidatos + desglose por tema"],
                ["/candidatos/[id]", "GET /candidates/full → perfil completo del candidato"],
              ].map(([actor, action], i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-40 flex-shrink-0 font-semibold text-gray-500 truncate">
                    {actor}
                  </span>
                  <span className="text-gray-600">→ {action}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Scoring algorithm ────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Algoritmo de afinidad</h2>
          <div className="flex flex-col gap-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Cada pregunta está asociada a un <strong>eje temático</strong> (uno de los 7 temas)
              y tiene un <strong>peso</strong> (1–3). Las respuestas del usuario son promedios
              ponderados por pregunta dentro de cada eje, resultando en un puntaje de usuario
              por tema en escala 1–5.
            </p>
            <p>
              Cada candidato tiene un <strong>stance_score</strong> por tema (1–5), curado
              manualmente a partir de fuentes públicas. La afinidad entre el usuario y el
              candidato en un tema se calcula como:
            </p>
            <div className="rounded-lg bg-gray-100 px-5 py-3 font-mono text-gray-800">
              acuerdo = 1 − |puntaje_usuario − puntaje_candidato| / 4
            </div>
            <p>
              El puntaje final es la suma ponderada del acuerdo en cada tema, multiplicada
              por el peso relativo del tema. Los temas sin datos para el candidato
              redistribuyen su peso proporcionalmente entre los temas disponibles.
            </p>
            <p>
              Las preguntas con <strong>dirección negativa</strong> (donde una respuesta alta
              indica desacuerdo con la postura del eje) tienen sus respuestas invertidas
              antes del cálculo: <code className="bg-gray-100 px-1 rounded">6 − respuesta</code>.
              Esto garantiza que "Totalmente en desacuerdo" con una pregunta de izquierda
              produzca un puntaje alto en el eje correspondiente.
            </p>
          </div>
        </section>

        {/* ── Topics ───────────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-2">Los 7 ejes temáticos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Los pesos reflejan la importancia relativa de cada tema en el perfil político colombiano 2026.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <div key={t.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{t.label}</h3>
                  <span className="flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                    {t.weight}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Agents ───────────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-2">Arquitectura de agentes</h2>
          <p className="text-sm text-gray-500 mb-4">
            El sistema está diseñado como un pipeline de agentes especializados.
            Los marcados como <span className="font-semibold text-green-700">Activo</span> están
            en producción; los <span className="font-semibold text-amber-700">Futuros</span> están
            diseñados pero no habilitados.
          </p>
          <div className="flex flex-col gap-4">
            {AGENTS.map((a) => (
              <div
                key={a.name}
                className="rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{a.name}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status === "active" ? "Activo" : "Futuro"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {a.description}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-500">Inputs:</span>{" "}
                    <span className="text-gray-600">{a.inputs}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-500">Outputs:</span>{" "}
                    <span className="text-gray-600">{a.outputs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Review workflow ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Capa de revisión humana</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Antes de que cualquier cambio generado automáticamente llegue a los datos publicados,
            pasa por una etapa de revisión explícita. El modelo de datos separa claramente:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
            {[
              {
                label: "Publicado",
                file: "candidates_canonical.json",
                desc: "Datos activos. Curados manualmente. Lo que ve el usuario.",
                color: "border-green-200 bg-green-50 text-green-800",
              },
              {
                label: "Propuesto",
                file: "proposed_updates.json",
                desc: "Cambios sugeridos por el agente investigador. Pendientes de revisión.",
                color: "border-amber-200 bg-amber-50 text-amber-800",
              },
              {
                label: "Revisado",
                file: "review_log.json",
                desc: "Decisiones del revisor humano: aprobado, rechazado, con notas.",
                color: "border-blue-200 bg-blue-50 text-blue-800",
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
                <p className="font-bold">{item.label}</p>
                <p className="mt-0.5 font-mono text-xs opacity-70">{item.file}</p>
                <p className="mt-2 text-xs leading-relaxed opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why static-first ─────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Por qué datos estáticos primero</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-600 leading-relaxed">
            <p>
              <strong className="text-gray-800">Confiabilidad ante todo.</strong> Un sistema
              de scraping automatizado comete errores — extrae posturas equivocadas, cita
              fuentes de baja calidad, o malinterpreta contexto político. Preferimos comenzar
              con datos perfectos (aunque pocos) antes que datos abundantes pero ruidosos.
            </p>
            <p>
              <strong className="text-gray-800">Cero costo.</strong> No se usan APIs de
              búsqueda de pago ni servicios cloud. Todo corre localmente. El equipo puede
              desplegar y operar sin presupuesto.
            </p>
            <p>
              <strong className="text-gray-800">Transparencia auditora.</strong> Cada dato
              tiene su fuente documentada en el JSON canónico. Cualquier persona puede
              revisar, cuestionar y proponer correcciones — el sistema de revisión lo permite
              explícitamente.
            </p>
            <p>
              <strong className="text-gray-800">Escalabilidad gradual.</strong> La arquitectura
              está lista para agentes de investigación automáticos. Cuando el pipeline de
              agentes esté calibrado y validado, pasará a producción sin cambiar la capa
              de datos canónica ni el quiz.
            </p>
          </div>
        </section>

        {/* ── Source code / CTA ─────────────────────────────────────────────── */}
        <section className="mt-10 border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-start gap-4 justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Código abierto</p>
            <p className="text-sm text-gray-500 mt-1">
              Este proyecto es open-source. Puedes revisar los datos, los algoritmos
              y proponer mejoras directamente en el repositorio.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/candidatos"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white text-center hover:bg-blue-700 transition"
            >
              Ver candidatos
            </Link>
            <Link
              href="/quiz"
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 text-center hover:bg-gray-100 transition"
            >
              Hacer el quiz
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
