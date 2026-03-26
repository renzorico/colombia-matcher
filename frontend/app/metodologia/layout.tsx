import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metodología",
  description:
    "Cómo funciona el sistema: algoritmo de afinidad ponderada, pesos por tema y fuentes verificables.",
  openGraph: {
    title: "Metodología — Elecciones Colombia 2026",
    description:
      "Cómo funciona el sistema: algoritmo de afinidad ponderada, pesos por tema y fuentes verificables.",
    type: "website",
    locale: "es_CO",
  },
};

export default function MetodologiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
