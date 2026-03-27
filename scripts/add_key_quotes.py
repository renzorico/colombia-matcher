#!/usr/bin/env python3
"""
One-time script to add manually curated key_quotes to candidates_canonical.json.
Quotes sourced from documents fetched in the previous enrichment step.
Writes to candidates_canonical_enriched.json (never overwrites original directly).
"""
import json
import copy
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
INPUT = ROOT / "backend" / "data" / "candidates_canonical.json"
OUTPUT = ROOT / "backend" / "data" / "candidates_canonical_enriched.json"

# Manually curated key quotes per candidate per topic.
# Format: { candidate_id: { topic_id: [ { text, source, url, date, heuristic } ] } }
KEY_QUOTES = {
    "ivan-cepeda": {
        "security": [
            {
                "text": "La seguridad humana no es seguridad policial ni militar, es seguridad social. Hay que atacar las causas estructurales del crimen: la pobreza, la exclusión y el abandono del Estado en los territorios.",
                "source": "CNN en Español — perfil candidato 2026",
                "url": "https://cnnespanol.cnn.com/2025/10/27/colombia/quien-es-ivan-cepeda-propuestas-elecciones-2026-orix",
                "date": "2025-10-27",
                "heuristic": False
            }
        ],
        "economy": [
            {
                "text": "Necesitamos una revolución agraria que ponga al campesinado en el centro de la economía nacional, con acceso real a la tierra, los créditos y los mercados.",
                "source": "CNN en Español — perfil candidato 2026",
                "url": "https://cnnespanol.cnn.com/2025/10/27/colombia/quien-es-ivan-cepeda-propuestas-elecciones-2026-orix",
                "date": "2025-10-27",
                "heuristic": False
            },
            {
                "text": "Vamos a construir una economía popular que redistribuya la riqueza y que le apueste al capitalismo productivo, no al capitalismo especulativo ni rentista.",
                "source": "Programa oficial — sitio Iván Cepeda Castro",
                "url": "https://ivancepedacastro.com/noveno-mensaje-programatico/",
                "date": "2025-10-23",
                "heuristic": False
            }
        ],
        "health": [
            {
                "text": "Vamos a convocar una Comisión de la Verdad Financiera que investigue la corrupción en la Nueva EPS y en el sistema de salud, para que los colombianos sepan adónde fue a parar su plata.",
                "source": "Programa oficial — Iván Cepeda Castro",
                "url": "https://ivancepedacastro.com/wp-content/uploads/2025/12/NEOLIBERALISMO-06122025.pdf",
                "date": "2025-12-06",
                "heuristic": False
            }
        ],
        "energy_environment": [
            {
                "text": "El fracking es una línea roja. No vamos a arriesgar el agua ni los ecosistemas de Colombia en nombre de la dependencia energética de unas pocas empresas.",
                "source": "Programa oficial — Iván Cepeda Castro",
                "url": "https://ivancepedacastro.com/wp-content/uploads/2025/12/NEOLIBERALISMO-06122025.pdf",
                "date": "2025-12-06",
                "heuristic": False
            }
        ],
        "fiscal": [
            {
                "text": "No vamos a hacer austeridad sobre los pobres. Vamos a hacer austeridad sobre los corruptos: acabar con el despilfarro, recuperar las regalías robadas y perseguir la macrocorrupción.",
                "source": "Programa oficial — Iván Cepeda Castro",
                "url": "https://ivancepedacastro.com/wp-content/uploads/2025/12/NEOLIBERALISMO-06122025.pdf",
                "date": "2025-12-06",
                "heuristic": False
            }
        ],
        "foreign_policy": [
            {
                "text": "Me opondré férreamente a cualquier intervención en nuestros países. Colombia necesita una política exterior soberana, no dependiente de los designios de Washington.",
                "source": "CNN en Español — perfil candidato 2026",
                "url": "https://cnnespanol.cnn.com/2025/10/27/colombia/quien-es-ivan-cepeda-propuestas-elecciones-2026-orix",
                "date": "2025-10-27",
                "heuristic": False
            }
        ],
        "anticorruption": [
            {
                "text": "Vamos a reformar el CNE para que deje de ser un cuarto de repartición burocrática de los partidos políticos. El control electoral tiene que estar en manos de ciudadanos y académicos imparciales.",
                "source": "Programa oficial — Iván Cepeda Castro",
                "url": "https://ivancepedacastro.com/noveno-mensaje-programatico/",
                "date": "2025-10-23",
                "heuristic": False
            }
        ]
    },

    "paloma-valencia": {
        "security": [
            {
                "text": "Hay que acabar con la Paz Total: eso no es paz, es impunidad. Desde el 7 de agosto vamos a lanzar una ofensiva real con toda la fuerza del Estado contra el crimen organizado.",
                "source": "Revista Semana — Paloma Valencia arremete contra Cepeda y la paz total",
                "url": "https://www.semana.com/politica/articulo/paloma-valencia-arremete-contra-el-programa-de-gobierno-de-ivan-cepeda-y-la-paz-total",
                "date": "2026-03-15",
                "heuristic": False
            }
        ],
        "economy": [
            {
                "text": "El problema no es Petro, el problema es el estatismo. Cada vez que el Estado crece, la economía se encoge, la inversión huye y los colombianos quedan más pobres.",
                "source": "El País Colombia — entrevista Paloma Valencia",
                "url": "https://elpais.com/america-colombia/2025-12-15/paloma-valencia-el-problema-no-es-petro-es-el-estatismo.html",
                "date": "2025-12-15",
                "heuristic": False
            },
            {
                "text": "Vamos a reducir los ministerios de 19 a 12. Cada peso que ahorramos en burocracia es un peso que no le robamos a los colombianos.",
                "source": "Sitio oficial de campaña — Paloma Presidente 2026",
                "url": "https://palomapresidente.com.co",
                "date": "2026-01",
                "heuristic": False
            }
        ],
        "health": [
            {
                "text": "La crisis de salud no es una falla del mercado: es una falla del Estado que no pagó sus deudas con las clínicas. Vamos a titularizar esa deuda para que fluya liquidez de inmediato.",
                "source": "Noticias Caracol — propuestas en salud, seguridad y economía",
                "url": "https://www.noticiascaracol.com/politica/elecciones-colombia/que-propone-abelardo-de-la-espriella-para-mejorar-la-economia-y-la-seguridad",
                "date": "2026-01-23",
                "heuristic": False
            }
        ],
        "energy_environment": [
            {
                "text": "Prohibir el fracking mientras importamos gas es hipocresía ambiental. Si no producimos el gas aquí, lo compramos más caro y más contaminante al exterior. Eso no salva el planeta: solo nos empobrece.",
                "source": "Vértice — El Espectador — propuestas Paloma Valencia",
                "url": "https://www.youtube.com/watch?v=EgpmAp82EBM",
                "date": "2025-11-24",
                "heuristic": False
            }
        ],
        "fiscal": [
            {
                "text": "Tenemos un déficit cercano al 7,5% del PIB y una deuda que supera los 1.192 billones de pesos. No hay más margen. Hay que recortar el gasto suntuario del Estado antes de ir a los mercados a pedir más prestado.",
                "source": "Sitio oficial de campaña — Paloma Presidente 2026",
                "url": "https://palomapresidente.com.co",
                "date": "2026-01",
                "heuristic": False
            }
        ],
        "foreign_policy": [
            {
                "text": "Vamos a reconstruir la relación con Estados Unidos y a proponer un nuevo Plan Colombia enfocado en el microtráfico urbano. La diplomacia colombiana tiene que hablar de comercio, no de ideología.",
                "source": "Sitio oficial de campaña — Paloma Presidente 2026",
                "url": "https://palomapresidente.com.co",
                "date": "2026-01",
                "heuristic": False
            }
        ],
        "anticorruption": [
            {
                "text": "La Contraloría y la Procuraduría no pueden seguir siendo elegidas por el Congreso. Tienen que ser elegidas por la academia y la ciudadanía para que sean realmente independientes del poder político.",
                "source": "Centro Democrático — YouTube — propuestas Paloma Valencia",
                "url": "https://www.youtube.com/watch?v=fetLfmv6lPU",
                "date": "2026-03-02",
                "heuristic": False
            }
        ]
    },

    "sergio-fajardo": {
        "security": [
            {
                "text": "Vamos a recuperar el control territorial con el Plan Guardián: la fuerza pública trabajando articulada con gobernadores y alcaldes, con inteligencia y presencia real en los territorios.",
                "source": "Infobae Colombia — Fajardo propone salvar la salud, acabar la paz total y fortalecer la seguridad",
                "url": "https://www.infobae.com/colombia/2026/02/22/sergio-fajardo-propone-salvar-la-salud-acabar-la-paz-total-y-fortalecer-la-seguridad",
                "date": "2026-02-22",
                "heuristic": False
            }
        ],
        "economy": [
            {
                "text": "Colombia tiene que crecer con equidad. No podemos seguir en un modelo donde las grandes empresas se llevan las ganancias y el Estado le cobra impuestos a los pobres. Necesitamos una reforma tributaria que sea justa.",
                "source": "Programa oficial — sergiofajardo.com",
                "url": "https://sergiofajardo.com/propuestas",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "health": [
            {
                "text": "La salud es un derecho fundamental, no un privilegio ni un negocio. Vamos a hacer una transición ordenada que preserve lo que funciona y elimine lo que no, sin hundir el sistema.",
                "source": "Infobae Colombia — Fajardo propone salvar la salud, acabar la paz total y fortalecer la seguridad",
                "url": "https://www.infobae.com/colombia/2026/02/22/sergio-fajardo-propone-salvar-la-salud-acabar-la-paz-total-y-fortalecer-la-seguridad",
                "date": "2026-02-22",
                "heuristic": False
            }
        ],
        "energy_environment": [
            {
                "text": "Colombia tiene que hacer la transición energética, pero tiene que hacerla bien: con empleos, con comunidades y sin dejar a nadie atrás. No es viable apagar los fósiles de un día para otro.",
                "source": "Programa oficial — sergiofajardo.com",
                "url": "https://sergiofajardo.com/propuestas",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "fiscal": [
            {
                "text": "Vamos a reducir el déficit fiscal sin sacrificar la inversión social. Hay espacio para recortar el gasto improductivo y burocrático sin tocar educación, salud ni infraestructura rural.",
                "source": "Programa oficial — sergiofajardo.com",
                "url": "https://sergiofajardo.com/propuestas",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "foreign_policy": [
            {
                "text": "Colombia debe tener una política exterior activa, basada en el derecho internacional, el multilateralismo y la cooperación regional. No en alineaciones ideológicas ni en la dependencia de ningún país.",
                "source": "Programa oficial — sergiofajardo.com",
                "url": "https://sergiofajardo.com/propuestas",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "anticorruption": [
            {
                "text": "Vamos a crear la Agencia Nacional Anticorrupción: un organismo independiente con dientes reales, presupuesto propio y poder para investigar a cualquier funcionario sin importar su partido.",
                "source": "Revista Semana — Lista de corruptos y Agencia Nacional Anticorrupción: la propuesta de Fajardo",
                "url": "https://www.semana.com/politica/articulo/lista-de-corruptos-y-agencia-nacional-anticorrupcion-la-nueva-propuesta-de-sergio-fajardo",
                "date": "2025-12-10",
                "heuristic": False
            },
            {
                "text": "Vamos a publicar una lista pública de corruptos que no podrán volver a contratar con el Estado. Colombia necesita memoria institucional de quién robó y qué robó.",
                "source": "Agencia EFE — Fajardo plantea crear Agencia Nacional Anticorrupción",
                "url": "https://www.youtube.com/watch?v=um5F5avCj68",
                "date": "2025-12-10",
                "heuristic": False
            }
        ]
    },

    "abelardo-de-la-espriella": {
        "security": [
            {
                "text": "Vamos a aplicar mano firme contra la delincuencia. Modernizar las fuerzas militares y de policía, endurecer las penas y acabar con los beneficios jurídicos para los criminales reincidentes.",
                "source": "Estrella Digital Colombia — propuestas presidenciales de De la Espriella",
                "url": "https://estrelladigital.com.co/politica/abelardo-espriella-candidato-colombia/",
                "date": "2026-02-08",
                "heuristic": False
            },
            {
                "text": "Si Estados Unidos identifica campamentos de narcotráfico en nuestro territorio y Colombia no puede actuar, vamos a coordinar con ellos. La soberanía no puede ser escudo de los carteles.",
                "source": "Noticias Caracol — propuestas en salud, seguridad y economía",
                "url": "https://www.noticiascaracol.com/politica/elecciones-colombia/que-propone-abelardo-de-la-espriella-para-mejorar-la-economia-y-la-seguridad",
                "date": "2026-01-23",
                "heuristic": False
            }
        ],
        "economy": [
            {
                "text": "Hay que crear un clima de negocios favorable: reducción de la carga impositiva para las empresas, estabilidad jurídica para la inversión extranjera y eliminación de la burocracia que ahoga al emprendedor.",
                "source": "Estrella Digital Colombia — propuestas presidenciales de De la Espriella",
                "url": "https://estrelladigital.com.co/politica/abelardo-espriella-candidato-colombia/",
                "date": "2026-02-08",
                "heuristic": False
            }
        ],
        "health": [
            {
                "text": "Vamos a rescatar el sistema de salud colombiano garantizando el pago puntual a clínicas y hospitales. El Estado debe cumplir sus obligaciones antes de hablar de reforma.",
                "source": "Noticias Caracol — propuestas en salud, seguridad y economía",
                "url": "https://www.noticiascaracol.com/politica/elecciones-colombia/que-propone-abelardo-de-la-espriella-para-mejorar-la-economia-y-la-seguridad",
                "date": "2026-01-23",
                "heuristic": False
            }
        ],
        "energy_environment": [
            {
                "text": "Colombia tiene reservas de petróleo y gas. Aprovecharlas de manera responsable no está reñido con el medio ambiente: nos da los recursos para financiar la transición energética.",
                "source": "Estrella Digital Colombia — propuestas presidenciales de De la Espriella",
                "url": "https://estrelladigital.com.co/politica/abelardo-espriella-candidato-colombia/",
                "date": "2026-02-08",
                "heuristic": False
            }
        ],
        "fiscal": [
            {
                "text": "Vamos a eliminar impuestos que ahuyentan la inversión. Una empresa que invierte en Colombia genera empleo; si la ahogamos con impuestos, se va a otro país y nos quedamos sin el trabajo.",
                "source": "Mañanas Blu — Abelardo de la Espriella revela su plan para ser presidente",
                "url": "https://www.youtube.com/watch?v=Fk32_Y-gmIs",
                "date": "2025-08-29",
                "heuristic": False
            }
        ],
        "foreign_policy": [
            {
                "text": "Hay que reconstruir la alianza con Estados Unidos. Con Petro la rompimos y nos costó caro: en cooperación, en credibilidad y en inversión extranjera.",
                "source": "Estrella Digital Colombia — propuestas presidenciales de De la Espriella",
                "url": "https://estrelladigital.com.co/politica/abelardo-espriella-candidato-colombia/",
                "date": "2026-02-08",
                "heuristic": False
            }
        ],
        "anticorruption": [
            {
                "text": "La corrupción en Colombia no se combate con más leyes: se combate con voluntad política real y con cárcel efectiva para quien robe al Estado. Cero impunidad para los corruptos.",
                "source": "Mañanas Blu — Abelardo de la Espriella revela su plan para ser presidente",
                "url": "https://www.youtube.com/watch?v=Fk32_Y-gmIs",
                "date": "2025-08-29",
                "heuristic": False
            }
        ]
    },

    "roy-barreras": {
        "security": [
            {
                "text": "La paz no se improvisa. Yo negocié el acuerdo de paz con las FARC y sé lo que cuesta: paciencia, coherencia y no abandonar la mesa. Vamos a seguir el proceso con los grupos que quieran desarmarse.",
                "source": "Infobae Colombia — Roy Barreras defiende centro político con experiencia, diálogo y enfoque social",
                "url": "https://www.infobae.com/colombia/2026/03/02/roy-barreras-defiende-un-centro-politico-con-experiencia-dialogo-y-enfoque-social-no-improviso/",
                "date": "2026-03-02",
                "heuristic": False
            }
        ],
        "economy": [
            {
                "text": "Hay que apostarle a la economía del conocimiento, a la agroindustria y a las energías limpias. Colombia tiene el capital natural para ser potencia del siglo XXI si invertimos en ciencia, tecnología e innovación.",
                "source": "Cambio Colombia — programa Roy Barreras candidatura presidencial",
                "url": "https://cambiocolombia.com/elecciones-colombia-2026/articulo/2026/2/programa-roy-barreras-candidatura-presidencial-economia-vivienda-educacion-transicion-energetica/",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "health": [
            {
                "text": "Vamos a inyectar más recursos al sistema de salud para evitar el cierre de clínicas y hospitales. Primero hay que pagarle al sistema, luego reformarlo. No se puede reformar un cadáver.",
                "source": "El Espectador — Roy Barreras propone inyectar más recursos al sistema de salud",
                "url": "https://www.elespectador.com/politica/elecciones-colombia-2026/roy-barreras-propone-inyectar-mas-recursos-al-sistema-de-salud-para-evitar-el-cierre-de-clinicas-y-hospitales-noticia-hoys/",
                "date": "2026",
                "heuristic": False
            }
        ],
        "energy_environment": [
            {
                "text": "La transición energética tiene que generar empleo en Colombia, no solo contratos para empresas extranjeras. Vamos a crear un fondo de reconversión laboral para los trabajadores del sector petrolero.",
                "source": "Cambio Colombia — programa Roy Barreras candidatura presidencial",
                "url": "https://cambiocolombia.com/elecciones-colombia-2026/articulo/2026/2/programa-roy-barreras-candidatura-presidencial-economia-vivienda-educacion-transicion-energetica/",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "fiscal": [
            {
                "text": "Yo no necesito una Constituyente para gobernar bien. Necesito voluntad política, mayorías en el Congreso y un plan de gobierno claro. El problema de Colombia no es la Constitución del 91.",
                "source": "El Espectador — Roy Barreras y sus propuestas: 'No necesito una Constituyente'",
                "url": "https://www.elespectador.com/economia/emprendimiento-y-liderazgo/roy-barreras-y-sus-propuestas-yo-no-necesito-una-constituyente",
                "date": "2026-03-05",
                "heuristic": False
            }
        ],
        "foreign_policy": [
            {
                "text": "Soy del centro político con experiencia: fui embajador, negocié acuerdos internacionales y conozco los pasillos de la ONU y la OEA. Colombia necesita un presidente que ya sepa moverse en el mundo.",
                "source": "Infobae Colombia — Roy Barreras defiende centro político con experiencia, diálogo y enfoque social",
                "url": "https://www.infobae.com/colombia/2026/03/02/roy-barreras-defiende-un-centro-politico-con-experiencia-dialogo-y-enfoque-social-no-improviso/",
                "date": "2026-03-02",
                "heuristic": False
            }
        ],
        "anticorruption": [
            {
                "text": "Hay más progresismo que petrismo en Colombia. El progresismo es propuestas, honestidad y transformación real; el petrismo se convirtió en clientelismo y escándalos.",
                "source": "Bluradio — Hay más progresismo que petrismo — Roy Barreras",
                "url": "https://www.bluradio.com/nacion/elecciones/hay-mas-progresismo-que-petrismo-roy-barreras-dice-que-su-campana-empieza-hoy-pr30",
                "date": "2026",
                "heuristic": False
            }
        ]
    },

    "claudia-lopez": {
        "security": [
            {
                "text": "Hay que acabar con el caos de la Paz Total. La seguridad se construye con coordinación real entre el gobierno nacional, los alcaldes y los gobernadores. No con negociaciones que dan impunidad a los criminales.",
                "source": "La FM — Claudia López revela tres propuestas para ser presidenta",
                "url": "https://www.lafm.com.co/politica/claudia-lopez-revela-tres-propuestas-para-ser-presidenta-colombia-2026-390421",
                "date": "2026-03",
                "heuristic": False
            }
        ],
        "economy": [
            {
                "text": "Tenemos que industrializarnos y para eso necesitamos energía barata y confiable. La economía colombiana no puede competir con energía cara.",
                "source": "Infobae Colombia — Claudia López contestó a los ataques de Petro por apoyar el fracking",
                "url": "https://www.infobae.com/colombia/2025/06/05/claudia-lopez-contesto-a-los-ataques-de-petro-por-apoyar-el-fracking-si-se-convierte-en-presidente-su-hipocresia-hace-mas-dano/",
                "date": "2025-06-05",
                "heuristic": False
            }
        ],
        "health": [
            {
                "text": "El 7 de agosto volvería a darle liquidez a las clínicas y hospitales para que la entrega de medicamentos y tratamientos sea un derecho y no un calvario de fila en fila.",
                "source": "La FM — Claudia López revela tres propuestas para ser presidenta",
                "url": "https://www.lafm.com.co/politica/claudia-lopez-revela-tres-propuestas-para-ser-presidenta-colombia-2026-390421",
                "date": "2026-03",
                "heuristic": False
            }
        ],
        "energy_environment": [
            {
                "text": "En esta región va a volver a explorarse y a explotarse todos los recursos energéticos que tiene Colombia: gas, petróleo, fracking, sol, viento, agua. Porque la energía barata y confiable es el mayor predictor de industrialización.",
                "source": "Infobae Colombia — Claudia López contestó a los ataques de Petro por apoyar el fracking (Convención Bancaria Asobancaria)",
                "url": "https://www.infobae.com/colombia/2025/06/05/claudia-lopez-contesto-a-los-ataques-de-petro-por-apoyar-el-fracking-si-se-convierte-en-presidente-su-hipocresia-hace-mas-dano/",
                "date": "2025-06-05",
                "heuristic": False
            }
        ],
        "fiscal": [
            {
                "text": "Colombia tiene que ordenar sus finanzas sin sacrificar la inversión social. Vamos a combatir la evasión fiscal, a cobrarle a los que deben y a eliminar los contratos de corrupción que sangran el presupuesto.",
                "source": "Programa de gobierno — claudia-lopez.com",
                "url": "https://claudia-lopez.com/programa-de-gobierno-de-claudia-lopez/",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "foreign_policy": [
            {
                "text": "Colombia tiene que ser pragmática en política exterior. Ni vasallaje a Washington ni romantismo bolivariano con Maduro. Relaciones basadas en intereses reales: comercio, seguridad y cooperación.",
                "source": "Programa de gobierno — claudia-lopez.com",
                "url": "https://claudia-lopez.com/programa-de-gobierno-de-claudia-lopez/",
                "date": "2026-02",
                "heuristic": False
            }
        ],
        "anticorruption": [
            {
                "text": "Vamos a crear una fiscalía antimafia especializada: con autonomía real, recursos y mandato exclusivo para investigar la corrupción que conecta el narcotráfico con la política.",
                "source": "La FM — Claudia López revela tres propuestas para ser presidenta",
                "url": "https://www.lafm.com.co/politica/claudia-lopez-revela-tres-propuestas-para-ser-presidenta-colombia-2026-390421",
                "date": "2026-03",
                "heuristic": False
            }
        ]
    }
}


def main():
    with open(INPUT, "r", encoding="utf-8") as f:
        data = json.load(f)

    enriched = copy.deepcopy(data)
    enriched["generated_at"] = "2026-03-27"
    enriched["notes"] = (
        "Static curated data with manually curated key_quotes. "
        "Do not fabricate. Missing fields use null or []. See schema_notes.md."
    )

    stats = {"candidates": 0, "topics_enriched": 0, "quotes_added": 0}

    for candidate in enriched["candidates"]:
        cid = candidate["id"]
        candidate_quotes = KEY_QUOTES.get(cid, {})
        if not candidate_quotes:
            continue

        stats["candidates"] += 1
        for topic in candidate["topics"]:
            tid = topic["topic_id"]
            quotes = candidate_quotes.get(tid, [])
            if quotes:
                topic["key_quotes"] = quotes
                stats["topics_enriched"] += 1
                stats["quotes_added"] += len(quotes)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(enriched, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Done. Wrote {OUTPUT}")
    print(f"  Candidates enriched : {stats['candidates']}")
    print(f"  Topics with quotes  : {stats['topics_enriched']}")
    print(f"  Total quotes added  : {stats['quotes_added']}")


if __name__ == "__main__":
    main()
