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
  "ivan-cepeda":              "/candidates/ivan-cepeda.jpg",
  "abelardo-de-la-espriella": "/candidates/abelardo-de-la-espriella.jpg",
  "sergio-fajardo":           "/candidates/sergio-fajardo.jpg",
  "paloma-valencia":          "/candidates/paloma-valencia.jpg",
  "roy-barreras":             "/candidates/roy-barreras.jpg",
  "claudia-lopez":            "/candidates/claudia-lopez.jpg",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = CANDIDATE_NAMES[id] ?? id;
  const description = `Propuestas, posiciones y controversias de ${name} para las elecciones presidenciales de Colombia 2026.`;
  const image = CANDIDATE_IMAGES[id] ?? "https://nobotestuvoto.vercel.app/og-default.svg";
  return {
    title: name,
    description,
    openGraph: {
      title: `${name} — Elecciones Colombia 2026`,
      description,
      type: "website",
      locale: "es_CO",
      images: [{ url: image, width: 400, height: 530, alt: name }],
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
