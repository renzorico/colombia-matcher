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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = CANDIDATE_NAMES[id] ?? id;
  const description = `Propuestas, posiciones y controversias de ${name} para las elecciones presidenciales de Colombia 2026.`;
  return {
    title: `${name} — Elecciones Colombia 2026 2026`,
    description,
    openGraph: {
      title: `${name} — Elecciones Colombia 2026 2026`,
      description,
      type: "website",
      locale: "es_CO",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Elecciones Colombia 2026 2026`,
      description,
    },
  };
}

export default function CandidatoPage() {
  return <CandidatoDetail />;
}
