import type { Metadata } from "next";
import CandidatoDetail from "./CandidatoDetail";

// Hardcoded because the backend is not running at Vercel build time.
// These must match the `id` field in candidates_canonical.json exactly.
const CANDIDATE_IDS = [
  "ivan-cepeda",
  "abelardo-de-la-espriella",
  "sergio-fajardo",
  "paloma-valencia",
  "roy-barreras",
  "claudia-lopez",
];

const CANDIDATE_NAMES: Record<string, string> = {
  "ivan-cepeda": "Iván Cepeda",
  "abelardo-de-la-espriella": "Abelardo de la Espriella",
  "sergio-fajardo": "Sergio Fajardo",
  "paloma-valencia": "Paloma Valencia",
  "roy-barreras": "Roy Barreras",
  "claudia-lopez": "Claudia López",
};

export function generateStaticParams() {
  return CANDIDATE_IDS.map((id) => ({ id }));
}

const CANDIDATE_IMAGES: Record<string, string> = {
  "ivan-cepeda": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ivan_Cepeda_Castro.jpg/220px-Ivan_Cepeda_Castro.jpg",
  "sergio-fajardo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Sergio_Fajardo_Valderrama.jpg/220px-Sergio_Fajardo_Valderrama.jpg",
  "paloma-valencia": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Paloma_Valencia_Laserna.jpg/220px-Paloma_Valencia_Laserna.jpg",
  "roy-barreras": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Roy_Barreras.jpg/220px-Roy_Barreras.jpg",
  "claudia-lopez": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Claudia_Lopez_Hernandez.jpg/220px-Claudia_Lopez_Hernandez.jpg",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = CANDIDATE_NAMES[id] ?? id;
  const description = `Propuestas, posiciones y controversias de ${name} para las elecciones presidenciales de Colombia 2026.`;
  const image = CANDIDATE_IMAGES[id] ?? "https://colombia-matcher.vercel.app/og-default.svg";
  return {
    title: name,
    description,
    openGraph: {
      title: `${name} — Elecciones Colombia 2026`,
      description,
      type: "website",
      locale: "es_CO",
      images: [{ url: image, width: 220, height: 220, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Elecciones Colombia 2026`,
      description,
      images: [image],
    },
  };
}

export default function CandidatoPage() {
  return <CandidatoDetail />;
}
