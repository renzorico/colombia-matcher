import Link from "next/link";
import { TOPIC_COLORS } from "@/lib/topics";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const TOPICS = [
  { id: "security",           label: "Seguridad",               weight: "25%", desc: "Política de paz, relaciones con grupos armados, fuerzas militares." },
  { id: "economy",            label: "Economía",                weight: "20%", desc: "Modelo económico, inversión privada, rol del Estado en la economía." },
  { id: "health",             label: "Salud",                   weight: "15%", desc: "Sistema de salud, EPS vs. modelo público, reforma a la salud." },
  { id: "energy_environment", label: "Energía y Medio Ambiente", weight: "15%", desc: "Transición energética, exploración de petróleo, acción climática." },
  { id: "fiscal",             label: "Política Fiscal",         weight: "10%", desc: "Deuda pública, gasto social, reforma tributaria, austeridad." },
  { id: "foreign_policy",     label: "Política Exterior",       weight: "10%", desc: "Relaciones con EE.UU., Venezuela, organismos internacionales." },
  { id: "anticorruption",     label: "Anticorrupción",          weight: "5%",  desc: "Transparencia, control institucional, mecanismos anticorrupción." },
];

const AGENTS = [
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

export default function BajoElCapoPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Detrás de cámaras</h1>
        <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: "var(--muted)" }}>
          Cómo está construida la infraestructura de datos y matching de Aclara tu voto.
          Esta sección es para desarrolladores e investigadores. Si buscas la explicación
          en lenguaje simple, ve a{" "}
          <Link href="/metodologia" className="underline hover:opacity-80" style={{ color: "var(--secondary)" }}>
            Metodología
          </Link>.
        </p>

        {/* ── Stack tecnológico ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Stack tecnológico</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            {[
              { layer: "Frontend", tech: "Next.js 16 (App Router) · Tailwind CSS · TypeScript", note: "Desplegado en Vercel. Build estático con SSG para páginas de candidatos." },
              { layer: "Backend",  tech: "FastAPI · Python 3.11 · Pydantic",                   note: "Desplegado en Railway. REST API con /questions, /quiz/submit, /candidates/full." },
              { layer: "Datos",    tech: "JSON canónico (candidates_canonical.json)",           note: "Single source of truth. Curado manualmente. Leído en startup por el backend." },
              { layer: "Proxy",    tech: "Next.js rewrites → /api/backend/:path*",             note: "El frontend proxea al backend. Elimina CORS en producción." },
            ].map((row) => (
              <div key={row.layer} className="rounded-xl p-4" style={{ border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{row.layer}</p>
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--foreground)" }}>{row.tech}</p>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{row.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Production flow ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Flujo de producción actual</h2>
          <div className="rounded-xl p-5 font-mono text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            <div className="flex flex-col gap-1.5">
              {[
                ["Usuario",          "responde 25 preguntas en el quiz"],
                ["Quiz page",        "GET /questions → preguntas del backend canónico"],
                ["Quiz page",        "POST /quiz/submit con respuestas (1–5 por pregunta)"],
                ["Backend scorer",   "calcula afinidad ponderada por los 7 ejes temáticos"],
                ["Backend scorer",   "devuelve Result[] ordenado por score (0–100%)"],
                ["Results page",     "muestra candidatos + desglose por tema"],
                ["/candidatos/[id]", "GET /candidates/full → perfil completo del candidato"],
              ].map(([actor, action], i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-40 flex-shrink-0 font-semibold truncate" style={{ color: "var(--muted)" }}>
                    {actor}
                  </span>
                  <span style={{ color: "var(--foreground)" }}>→ {action}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Scoring algorithm ────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Algoritmo de afinidad</h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            <p>
              Cada pregunta está asociada a un <strong>eje temático</strong> y tiene un{" "}
              <strong>peso</strong> (1–3). Las respuestas se promedian ponderadamente por eje,
              resultando en un puntaje de usuario por tema en escala 1–5.
            </p>
            <p>
              Cada candidato tiene un <strong>stance_score</strong> por tema (1–5).
              La afinidad en un tema se calcula como:
            </p>
            <div className="rounded-lg px-5 py-3 font-mono" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              acuerdo = 1 − |puntaje_usuario − puntaje_candidato| / 4
            </div>
            <p>
              El puntaje final es la suma ponderada del acuerdo en cada tema multiplicada
              por el peso relativo del tema. Temas sin datos redistribuyen su peso
              proporcionalmente entre los temas disponibles.
            </p>
            <p>
              Las preguntas con <strong>dirección negativa</strong> tienen sus respuestas
              invertidas antes del cálculo:{" "}
              <code className="px-1 rounded" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>6 − respuesta</code>.
            </p>
          </div>
        </section>

        {/* ── Topics ───────────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Los 7 ejes temáticos</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Los pesos reflejan la importancia relativa de cada tema en el perfil político colombiano 2026.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <div
                key={t.id}
                className="rounded-xl p-4"
                style={{
                  border: "1px solid var(--border)",
                  borderLeft: `4px solid ${TOPIC_COLORS[t.id] ?? "#4A4A4A"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{t.label}</h3>
                  <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: "color-mix(in srgb, var(--hero) 10%, transparent)", color: "var(--secondary)" }}>
                    {t.weight}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Agents ───────────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Arquitectura de agentes</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            El sistema utiliza un pipeline de curación manual con dos agentes en producción.
            Los perfiles de candidatos son revisados y aprobados por humanos antes de publicarse —
            ningún cambio llega a los datos activos sin revisión explícita.
          </p>
          <div className="flex flex-col gap-4">
            {AGENTS.map((a) => (
              <div key={a.name} className="rounded-xl p-5" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{a.name}</h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: "color-mix(in srgb, var(--hero) 15%, transparent)", color: "var(--secondary)" }}
                  >
                    Activo
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{a.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="font-semibold" style={{ color: "var(--muted)" }}>Inputs:</span>{" "}
                    <span style={{ color: "var(--foreground)" }}>{a.inputs}</span>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="font-semibold" style={{ color: "var(--muted)" }}>Outputs:</span>{" "}
                    <span style={{ color: "var(--foreground)" }}>{a.outputs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Review workflow ──────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Capa de revisión humana</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
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
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Por qué datos estáticos primero</h2>
          <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            <p>
              <strong style={{ color: "var(--foreground)" }}>Confiabilidad ante todo.</strong> Un sistema
              de scraping automatizado comete errores — extrae posturas equivocadas, cita
              fuentes de baja calidad, o malinterpreta contexto político. Preferimos comenzar
              con datos curados (aunque pocos) antes que datos abundantes pero ruidosos.
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>Cero costo.</strong> No se usan APIs de
              búsqueda de pago ni servicios cloud. Todo corre estáticamente. El equipo puede
              desplegar y operar sin presupuesto.
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>Transparencia auditora.</strong> Cada dato
              tiene su fuente documentada en el JSON canónico. Cualquier persona puede
              revisar, cuestionar y proponer correcciones.
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>Escalabilidad gradual.</strong> La arquitectura
              está lista para agentes de investigación automáticos. Cuando el pipeline esté
              calibrado y validado, pasará a producción sin cambiar la capa de datos canónica
              ni el quiz.
            </p>
          </div>
        </section>

        {/* ── Attribution ─────────────────────────────────────────────────── */}
        <p className="mt-10 text-xs" style={{ color: "var(--muted)" }}>
          Fotos de candidatos: <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Wikimedia Commons</a> (CC BY-SA)
        </p>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <section className="mt-6 pt-8 flex flex-col sm:flex-row items-start gap-4 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/metodologia"
              className="rounded-full px-5 py-2 text-sm font-semibold text-center transition hover:opacity-80"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              ← Metodología (lenguaje simple)
            </Link>
            <Link
              href="/quiz"
              className="rounded-full px-5 py-2 text-sm font-bold text-center shadow transition hover:opacity-90"
              style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
            >
              Hacer el quiz
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
