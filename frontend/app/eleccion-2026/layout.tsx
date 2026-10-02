import type { Metadata } from "next";

const DESCRIPTION =
  "Resultados oficiales de la segunda vuelta presidencial 2026: Abelardo de la Espriella ganó con 49,66 %. Mapa por departamento, claves del resultado y primera vuelta.";

export const metadata: Metadata = {
  title: "Resultados 2026",
  description: DESCRIPTION,
  openGraph: {
    title: "Resultados elección presidencial Colombia 2026",
    description: DESCRIPTION,
    type: "website",
    locale: "es_CO",
  },
};

export default function Eleccion2026Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
