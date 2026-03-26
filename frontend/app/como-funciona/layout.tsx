import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Cómo funciona? — Elecciones Colombia 2026 2026",
  description:
    "Descubre cómo Elecciones Colombia 2026 calcula tu afinidad con cada candidato presidencial: quiz, comparación y resultados explicados paso a paso.",
  openGraph: {
    title: "¿Cómo funciona? — Elecciones Colombia 2026 2026",
    description:
      "Descubre cómo Elecciones Colombia 2026 calcula tu afinidad con cada candidato presidencial.",
    type: "website",
    locale: "es_CO",
  },
};

export default function ComoFuncionaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
