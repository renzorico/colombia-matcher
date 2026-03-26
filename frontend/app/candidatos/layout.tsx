import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidatos presidenciales",
  description:
    "Perfiles políticos de los candidatos presidenciales colombianos 2026: posiciones por tema, fuentes verificables y estado en la Procuraduría.",
  openGraph: {
    title: "Candidatos presidenciales — Elecciones Colombia 2026",
    description:
      "Perfiles políticos de los candidatos presidenciales colombianos 2026: posiciones por tema, fuentes verificables y estado en la Procuraduría.",
    type: "website",
    locale: "es_CO",
  },
};

export default function CandidatosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
