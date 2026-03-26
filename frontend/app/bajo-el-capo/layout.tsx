import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Cómo funciona?",
  description:
    "Arquitectura técnica de Elecciones Colombia 2026: pipeline de datos, algoritmo de afinidad, agentes y stack tecnológico.",
  openGraph: {
    title: "¿Cómo funciona? — Elecciones Colombia 2026",
    description:
      "Arquitectura técnica de Elecciones Colombia 2026: pipeline de datos, algoritmo de afinidad, agentes y stack tecnológico.",
    type: "website",
    locale: "es_CO",
  },
};

export default function BajoElCapoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
