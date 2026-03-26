import Link from "next/link";

export default function MetodologiaPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">

        <h1 className="text-3xl font-bold">Cómo funciona Colombia Matcher</h1>
        <p className="mt-3 text-gray-500 leading-relaxed">
          Todo lo que necesitas saber sobre esta herramienta, en lenguaje claro.
        </p>

        {/* Estado del proyecto */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm font-semibold text-gray-700">Estado del proyecto</p>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Colombia Matcher está en fase de lanzamiento. La información sobre los candidatos
            es curada manualmente por el equipo del proyecto a partir de fuentes públicas.
            Seguimos incorporando propuestas y actualizando los perfiles a medida que avanza
            la campaña.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-10">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800">¿Qué es Colombia Matcher?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Es una herramienta informativa independiente que compara tus opiniones sobre
              los grandes temas del país con las posiciones conocidas de cada candidato
              presidencial para 2026. Al final del quiz ves con quién estás más de acuerdo
              y, lo más importante, <strong>por qué</strong>: con fuentes reales que puedes
              verificar tú mismo.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              No es una encuesta, no predice votos y no tiene ningún propósito comercial.
              Es simplemente una forma de informarte mejor antes de decidir.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800">¿Cómo funciona el quiz?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Respondes 25 preguntas sobre temas como seguridad, economía, salud,
              medio ambiente, política fiscal, relaciones exteriores y corrupción.
              Para cada pregunta eliges qué tan de acuerdo estás con una afirmación,
              en una escala del 1 (totalmente en desacuerdo) al 5 (totalmente de acuerdo).
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              No hay respuestas correctas ni incorrectas. Solo tus opiniones. Puedes
              omitir preguntas si no tienes una posición clara sobre un tema. El quiz
              tarda entre 5 y 10 minutos.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800">¿De dónde viene la información sobre los candidatos?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Revisamos discursos, entrevistas, programas de gobierno, debates y noticias
              publicadas en medios colombianos de referencia. Por cada posición que le
              asignamos a un candidato, hay una fuente verificable: un artículo, un video,
              un comunicado oficial.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Si un candidato no ha dicho nada claro sobre un tema, no le asignamos un
              puntaje para ese tema. Preferimos reconocer que no sabemos antes que inventar
              una posición.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Podés ver las fuentes de cada candidato en su perfil individual dentro de la
              sección{" "}
              <Link href="/candidatos" className="text-blue-600 hover:underline">
                Candidatos
              </Link>.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800">¿Cómo se calcula la afinidad?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Comparamos tus respuestas con las posiciones de cada candidato tema por tema.
              Cuanto más cerca estén tus opiniones de las de un candidato en un tema,
              mayor es la afinidad en ese tema.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              El resultado final es un promedio ponderado: los temas más relevantes para
              la agenda política colombiana 2026 pesan más que los secundarios. Por ejemplo,
              seguridad y economía tienen más peso que política exterior.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              El puntaje final va de 0% a 100%. Un 100% significaría acuerdo total en
              todos los temas — algo muy poco frecuente. Un resultado entre 65% y 75%
              ya representa una afinidad alta.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800">¿Es esta herramienta imparcial?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Colombia Matcher no apoya a ningún candidato, partido político ni movimiento.
              Los datos son curados por personas — no por algoritmos — y cada posición tiene
              su fuente citada para que cualquiera pueda verificarla o cuestionarla.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Sin embargo, ninguna herramienta es perfectamente neutral. La selección de
              preguntas y la importancia que le damos a cada tema implican criterios
              editoriales. Si crees que algo es incorrecto o está desactualizado,
              escríbenos.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Usa Colombia Matcher como un punto de partida, no como la última palabra.
              Consulta siempre los programas oficiales de los candidatos y otras fuentes
              antes de decidir tu voto.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800">¿Quién hizo esto?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Colombia Matcher es un proyecto cívico independiente creado con el objetivo
              de facilitar una decisión de voto más informada. No tiene financiación de
              partidos políticos, empresas ni entidades gubernamentales.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Aviso legal
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Colombia Matcher es una herramienta informativa independiente. No está afiliada
              a ningún candidato presidencial, partido político, movimiento ciudadano ni
              entidad gubernamental. La información presentada proviene de fuentes públicas
              y es responsabilidad del usuario verificarla y contrastarla con otras fuentes
              antes de tomar cualquier decisión electoral.
            </p>
          </section>

        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-gray-100 pt-8">
          <p className="text-sm text-gray-500">
            ¿Listo para descubrir con quién estás alineado?
          </p>
          <Link
            href="/quiz"
            className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Haz el quiz ahora →
          </Link>
          <Link
            href="/bajo-el-capo"
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            ¿Quieres ver la arquitectura técnica? → Detrás del motor
          </Link>
        </div>

      </div>
    </main>
  );
}
