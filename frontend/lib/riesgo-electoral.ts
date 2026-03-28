// Riesgos Electorales 2026 — datos de fuentes oficiales
// Defensoría del Pueblo (ATE 013-2025 + IS 003-2026) y MOE (Feb/Mar 2026)

export type NivelDefensoria = "accion_inmediata" | "accion_urgente";
export type NivelMoe = "extremo" | "extremo_violencia" | "alto";

export interface Municipio {
  municipio: string;
  departamento: string;
  nivel_defensoria: NivelDefensoria;
  nivel_moe: NivelMoe;
  grupos_armados: string[];
  nota?: string;
}

export const MUNICIPIOS: Municipio[] = [
  // ── ARAUCA ───────────────────────────────────────────────────────────────
  { municipio: "Arauca",        departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-Mordisco"], nota: "Epicentro confrontación ELN vs disidencias FARC" },
  { municipio: "Arauquita",     departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-Mordisco"] },
  { municipio: "Saravena",      departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-Mordisco"] },
  { municipio: "Fortul",        departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-Mordisco"] },
  { municipio: "Tame",          departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-Mordisco"], nota: "Masacre en casco urbano ago 2025" },
  { municipio: "Puerto Rondón", departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-Mordisco"] },
  { municipio: "Cravo Norte",   departamento: "Arauca", nivel_defensoria: "accion_inmediata", nivel_moe: "alto",   grupos_armados: ["ELN"] },

  // ── CAUCA ─────────────────────────────────────────────────────────────────
  { municipio: "Toribío",               departamento: "Cauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC-Mordisco", "FARC-EP"] },
  { municipio: "Totoró",                departamento: "Cauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "Argelia",               departamento: "Cauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC", "ELN"] },
  { municipio: "Morales",               departamento: "Cauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "Santander de Quilichao",departamento: "Cauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC", "Clan del Golfo"] },
  { municipio: "Almaguer",              departamento: "Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "Balboa",                departamento: "Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC", "ELN"] },
  { municipio: "Bolívar",               departamento: "Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "Cajibío",               departamento: "Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "Caldono",               departamento: "Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "López de Micay",        departamento: "Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC", "Segunda Marquetalia"], nota: "Andén Pacífico, corredor estratégico" },

  // ── NARIÑO ────────────────────────────────────────────────────────────────
  { municipio: "Tumaco",       departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC-Franco Benavides", "Segunda Marquetalia", "ELN", "AUN"], nota: "73 líderes sociales asesinados desde 2016" },
  { municipio: "Barbacoas",    departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC", "Segunda Marquetalia"] },
  { municipio: "Cumbitara",    departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC"], nota: "Nuevo en riesgo extremo vs 2022" },
  { municipio: "El Charco",    departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC", "Segunda Marquetalia"] },
  { municipio: "Magüí Payán",  departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC-Franco Benavides"] },
  { municipio: "Olaya Herrera",departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC", "Segunda Marquetalia"] },
  { municipio: "Ricaurte",     departamento: "Nariño", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC"], nota: "Pasó de riesgo alto a extremo en 2026" },
  { municipio: "Ipiales",      departamento: "Nariño", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["Segunda Marquetalia", "EMC"], nota: "Frontera Ecuador, ruta narcotráfico" },

  // ── CHOCÓ ─────────────────────────────────────────────────────────────────
  { municipio: "Quibdó",              departamento: "Chocó", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"], nota: "Capital departamental en riesgo extremo" },
  { municipio: "El Carmen de Atrato", departamento: "Chocó", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"] },
  { municipio: "Istmina",             departamento: "Chocó", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"] },
  { municipio: "Lloró",               departamento: "Chocó", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN"] },
  { municipio: "Sipí",                departamento: "Chocó", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"] },

  // ── ANTIOQUIA ─────────────────────────────────────────────────────────────
  { municipio: "Ituango",   departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo", "EMC-36"] },
  { municipio: "Cáceres",   departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo", "ELN"] },
  { municipio: "Tarazá",    departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo", "ELN"] },
  { municipio: "El Bagre",  departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo", "ELN"], nota: "Bajo Cauca, minería ilegal" },
  { municipio: "Segovia",   departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-36"] },
  { municipio: "Remedios",  departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC-36"] },
  { municipio: "Briceño",   departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"] },
  { municipio: "Yondó",     departamento: "Antioquia", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"] },
  { municipio: "Amalfi",    departamento: "Antioquia", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC-36", "ELN"] },

  // ── BOLÍVAR ───────────────────────────────────────────────────────────────
  { municipio: "Arenal",      departamento: "Bolívar", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC"] },
  { municipio: "Cantagallo",  departamento: "Bolívar", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC"] },
  { municipio: "Montecristo", departamento: "Bolívar", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo", "ELN"] },
  { municipio: "Morales",     departamento: "Bolívar", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "EMC"] },

  // ── NORTE DE SANTANDER ────────────────────────────────────────────────────
  { municipio: "El Tarra", departamento: "Norte de Santander", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"], nota: "Catatumbo — crisis humanitaria ene 2025" },
  { municipio: "Hacarí",   departamento: "Norte de Santander", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"] },

  // ── CÓRDOBA ───────────────────────────────────────────────────────────────
  { municipio: "Buenavista", departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Chimá",      departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Chinú",      departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Los Córdobas",departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Momil",      departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Pueblo Nuevo",departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Sahagún",    departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "San Pelayo", departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"] },
  { municipio: "Tuchín",     departamento: "Córdoba", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo"], nota: "9 municipios en Córdoba — más que cualquier departamento" },

  // ── VALLE DEL CAUCA ───────────────────────────────────────────────────────
  { municipio: "Buenaventura", departamento: "Valle del Cauca", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC", "ELN", "Clan del Golfo"], nota: "Mayor ciudad en riesgo extremo. Puerto Pacífico estratégico" },
  { municipio: "Dagua",        departamento: "Valle del Cauca", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC", "ELN"] },

  // ── PUTUMAYO ──────────────────────────────────────────────────────────────
  { municipio: "Puerto Asís",      departamento: "Putumayo", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC-Calarcá", "Segunda Marquetalia"] },
  { municipio: "Puerto Caicedo",   departamento: "Putumayo", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC", "Segunda Marquetalia"] },
  { municipio: "Puerto Guzmán",    departamento: "Putumayo", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC-Calarcá"] },
  { municipio: "Puerto Leguízamo", departamento: "Putumayo", nivel_defensoria: "accion_urgente",   nivel_moe: "extremo", grupos_armados: ["EMC", "Segunda Marquetalia"] },

  // ── META ──────────────────────────────────────────────────────────────────
  { municipio: "La Macarena", departamento: "Meta", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["EMC-Calarcá"], nota: "Ataque con explosivos el día de elecciones, 8 mar 2026" },
  { municipio: "Puerto Gaitán",departamento: "Meta", nivel_defensoria: "accion_urgente",  nivel_moe: "extremo", grupos_armados: ["EMC-Calarcá"] },
  { municipio: "Puerto Rico",  departamento: "Meta", nivel_defensoria: "accion_urgente",  nivel_moe: "extremo", grupos_armados: ["EMC"] },

  // ── GUAVIARE ──────────────────────────────────────────────────────────────
  { municipio: "San José del Guaviare", departamento: "Guaviare", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC-Mordisco", "EMC-Calarcá"] },
  { municipio: "El Retorno",            departamento: "Guaviare", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "Calamar",               departamento: "Guaviare", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC"] },

  // ── GUAINÍA ───────────────────────────────────────────────────────────────
  { municipio: "Inírida", departamento: "Guainía", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC", "ELN"], nota: "Amenaza a 5 pueblos indígenas (AT 008-26, mar 2026)" },

  // ── CAQUETÁ ───────────────────────────────────────────────────────────────
  { municipio: "Cartagena del Chairá", departamento: "Caquetá", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC-Calarcá", "EMC-Mordisco"], nota: "Puestos de votación trasladados el 8 mar por amenazas" },
  { municipio: "Solano",               departamento: "Caquetá", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC"] },

  // ── TOLIMA ────────────────────────────────────────────────────────────────
  { municipio: "Roncesvalles", departamento: "Tolima", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC", "ELN", "Clan del Golfo"], nota: "3 grupos simultáneos — nuevo en riesgo extremo vs 2022" },
  { municipio: "Rovira",       departamento: "Tolima", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC"] },
  { municipio: "San Antonio",  departamento: "Tolima", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC"] },

  // ── CESAR ─────────────────────────────────────────────────────────────────
  { municipio: "La Gloria", departamento: "Cesar", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["ACSN", "ELN"] },

  // ── LA GUAJIRA ────────────────────────────────────────────────────────────
  { municipio: "Uribia", departamento: "La Guajira", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["ACSN", "Clan del Golfo"], nota: "Municipio indígena más grande de Colombia" },

  // ── RISARALDA ─────────────────────────────────────────────────────────────
  { municipio: "Mistrató", departamento: "Risaralda", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["EMC", "ELN"] },

  // ── SANTANDER ─────────────────────────────────────────────────────────────
  { municipio: "Barrancabermeja", departamento: "Santander", nivel_defensoria: "accion_inmediata", nivel_moe: "extremo", grupos_armados: ["ELN", "Clan del Golfo"], nota: "Amenazas preelectorales de gravedad excepcional" },

  // ── BOGOTÁ D.C. ───────────────────────────────────────────────────────────
  { municipio: "Bogotá D.C.", departamento: "Bogotá D.C.", nivel_defensoria: "accion_urgente", nivel_moe: "extremo_violencia", grupos_armados: ["Crimen organizado urbano"], nota: "315 de 901 puestos de votación con algún nivel de riesgo" },

  // ── ATLÁNTICO ─────────────────────────────────────────────────────────────
  { municipio: "Barranquilla", departamento: "Atlántico", nivel_defensoria: "accion_urgente", nivel_moe: "extremo", grupos_armados: ["Clan del Golfo", "ACSN"], nota: "Trashumancia desde Venezuela detectada el 8 mar 2026" },
];

export const STATS = [
  { label: "Municipios en acción inmediata", value: "69", sub: "Riesgo crítico — Defensoría del Pueblo", color: "#DC2626" },
  { label: "Municipios en algún nivel de riesgo", value: "670", sub: "Alerta Temprana Electoral 013-2025", color: "#EA580C" },
  { label: "Electores en riesgo extremo", value: "4.5M", sub: "11% del censo electoral nacional", color: "#7C3AED" },
  { label: "Aumento municipios riesgo extremo", value: "+65%", sub: "vs elecciones 2022 (49 → 81 municipios)", color: "#CA8A04" },
];

export const MECANISMOS = [
  {
    numero: "1",
    icono: "🏛️",
    titulo: "Suplantan al Estado",
    desc: "Los grupos armados ejercen funciones de gobierno en territorios donde el Estado tiene presencia débil: controlan precios, resuelven disputas, regulan la vida cotidiana.",
  },
  {
    numero: "2",
    icono: "🚫",
    titulo: "Regulan campañas",
    desc: "Imponen restricciones a las campañas políticas: prohíben mítines, controlan cuáles candidatos pueden hacer proselitismo, extorsionan a aspirantes y financiadores.",
  },
  {
    numero: "3",
    icono: "⚠️",
    titulo: "Vetan candidaturas",
    desc: "Amenazan o eliminan físicamente a candidatos que no cuenten con su aval. En algunos municipios, solo se presentan candidatos previamente aprobados por el grupo dominante.",
  },
];

export const INCIDENTES = [
  {
    tipo: "Ataque con explosivos",
    lugar: "La Macarena, Meta",
    desc: "EMC-Calarcá atacó infraestructura electoral el día de las elecciones. Fue controlado; el escrutinio continuó.",
    fuente: "Ministerio de Defensa, 8 mar 2026",
  },
  {
    tipo: "Trashumancia electoral",
    lugar: "Cúcuta, Norte de Santander",
    desc: "120 colombianos intentaron ingresar desde Venezuela en flotilla de buses para votar. Investigado como trashumancia vinculada a campaña.",
    fuente: "Ministro del Interior A. Benedetti, 8 mar 2026",
  },
  {
    tipo: "Traslado de puestos",
    lugar: "Cartagena del Chairá, Caquetá",
    desc: "Puestos de votación trasladados de urgencia por amenazas directas y alertas de atentados.",
    fuente: "Defensora del Pueblo Iris Marín, 8 mar 2026",
  },
  {
    tipo: "Operaciones preventivas",
    lugar: "Cauca",
    desc: "36 horas continuas de operaciones militares antes de la jornada. Se frustraron 5 intentos de ataques contra puestos de votación.",
    fuente: "Ministerio de Defensa, 8 mar 2026",
  },
  {
    tipo: "Capturas por delitos electorales",
    lugar: "Nacional",
    desc: "38 capturados — 72% más que en 2022 (22). $3.761 millones incautados.",
    fuente: "Policía Nacional / Mindefensa, 8 mar 2026",
  },
  {
    tipo: "Incidentes totales",
    lugar: "Nacional",
    desc: "~900 incidentes documentados incluyendo irregularidades, alertas logísticas y presuntos delitos electorales.",
    fuente: "La FM, 9 mar 2026",
  },
];

export const PARTIDOS_DISTRIBUCION = [
  { partido: "Pacto Histórico",       municipios: 38, pct: 55.1, color: "#c026d3" },
  { partido: "Alianza por Colombia",  municipios: 8,  pct: 11.6, color: "#2563eb" },
  { partido: "Partido de la U",       municipios: 8,  pct: 11.6, color: "#ca8a04" },
  { partido: "Frente Amplio Unitario",municipios: 6,  pct: 8.7,  color: "#16a34a" },
  { partido: "Partido Liberal",       municipios: 6,  pct: 8.7,  color: "#dc2626" },
  { partido: "Partido Conservador",   municipios: 2,  pct: 2.9,  color: "#1e40af" },
  { partido: "Centro Democrático",    municipios: 1,  pct: 1.4,  color: "#7c3aed" },
];

export interface CandidatoPosicion {
  id: string;
  nombre: string;
  partido: string;
  espectro: string;
  espectroColor: string;
  foto: string;
  postura: string;
  pazTotal: string;
  propuestaClave: string;
}

export const CANDIDATOS_POSICIONES: CandidatoPosicion[] = [
  {
    id: "ivan-cepeda",
    nombre: "Iván Cepeda",
    partido: "Pacto Histórico",
    espectro: "Izquierda",
    espectroColor: "#DC2626",
    foto: "/candidates/ivan-cepeda.jpg",
    postura: "Negociación puntual con resultados concretos",
    pazTotal: "Reforma, no abandono — \"mucho más puntual y con resultados concretos\"",
    propuestaClave: "Paz territorial con transformación económica. Oro ilegal y narcotráfico como raíz del crecimiento armado.",
  },
  {
    id: "roy-barreras",
    nombre: "Roy Barreras",
    partido: "Frente por la Vida",
    espectro: "Centro-izquierda",
    espectroColor: "#EA580C",
    foto: "/candidates/roy-barreras.jpg",
    postura: "Diálogos con mayor exigencia de resultados",
    pazTotal: "Continuidad reformada con garantías reales",
    propuestaClave: "Paz negociada con garantías para líderes sociales y firmantes del Acuerdo 2016.",
  },
  {
    id: "sergio-fajardo",
    nombre: "Sergio Fajardo",
    partido: "Dignidad y Compromiso",
    espectro: "Centro",
    espectroColor: "#CA8A04",
    foto: "/candidates/sergio-fajardo.jpg",
    postura: "Rechazo a la ilegalidad + justicia social",
    pazTotal: "Ni continuidad ni ruptura explícita",
    propuestaClave: "Justicia social como base estructural de la seguridad. \"Sin justicia social no hay desarrollo.\"",
  },
  {
    id: "claudia-lopez",
    nombre: "Claudia López",
    partido: "Independiente",
    espectro: "Centro",
    espectroColor: "#CA8A04",
    foto: "/candidates/claudia-lopez.jpg",
    postura: "Sin postura pública detallada en 2026",
    pazTotal: "Distancia crítica al gobierno Petro",
    propuestaClave: "Anticorrupción, transparencia institucional y garantías democráticas.",
  },
  {
    id: "paloma-valencia",
    nombre: "Paloma Valencia",
    partido: "Centro Democrático",
    espectro: "Centro-derecha",
    espectroColor: "#2563EB",
    foto: "/candidates/paloma-valencia.jpg",
    postura: "Fuerza pública — sin negociaciones",
    pazTotal: "Rechazo total — propone \"Seguridad Total\"",
    propuestaClave: "Las 4R: Robustecer FF.PP., Reducir ingresos ilegales, Re-enamorar comunidades, Restablecer la legalidad. Plan Colombia 2.0.",
  },
  {
    id: "abelardo-de-la-espriella",
    nombre: "Abelardo de la Espriella",
    partido: "Defensores de la Patria",
    espectro: "Derecha",
    espectroColor: "#1E3A5F",
    foto: "/candidates/abelardo-de-la-espriella.jpg",
    postura: "Ofensiva militar — sin negociación",
    pazTotal: "Rechazo total",
    propuestaClave: "Seguridad democrática estilo Uribe. Restaurar autoridad del Estado. Libre empresa y orden público.",
  },
];

export const FUENTES = [
  {
    label: "Alerta Temprana Electoral 013-2025",
    institucion: "Defensoría del Pueblo",
    fecha: "7 oct 2025",
    url: "https://alertasstg.blob.core.windows.net/alertas/013-25.pdf",
  },
  {
    label: "Informe de Seguimiento 003-2026 a ATE 013-2025",
    institucion: "Defensoría del Pueblo",
    fecha: "23 feb 2026",
    url: "https://alertasstg.blob.core.windows.net/informes/279.pdf",
  },
  {
    label: "Mapa de Riesgo Electoral 2026 — Comunicado Nacional",
    institucion: "Misión de Observación Electoral (MOE)",
    fecha: "4 feb 2026",
    url: "https://moe.org.co/wp-content/uploads/2026/02/Mapa-de-riesgo-electoral-2026-MOE-Comunciado-Nacional.pdf",
  },
  {
    label: "Presentación Mapa de Riesgo Electoral 2026",
    institucion: "Misión de Observación Electoral (MOE)",
    fecha: "4 feb 2026",
    url: "https://moe.org.co/wp-content/uploads/2026/02/Mapa-de-riesgo-electoral-presentación-MOE.pdf",
  },
  {
    label: "11ª Comisión de Seguimiento Electoral",
    institucion: "Misión de Observación Electoral (MOE)",
    fecha: "3 mar 2026",
    url: "https://moe.org.co/wp-content/uploads/2026/03/2026.MAR_.03-Informe-Undecima-Comisión-de-seguimiento-electoral-MOE-VF.pdf",
  },
];
