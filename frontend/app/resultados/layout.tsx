import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tus resultados",
  description:
    "Ve con qué candidato presidencial colombiano tienes más afinidad, con desglose por tema y links a las fuentes.",
  openGraph: {
    title: "Tus resultados — Elecciones Colombia 2026",
    description:
      "Ve con qué candidato presidencial colombiano tienes más afinidad, con desglose por tema y links a las fuentes.",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tus resultados — Elecciones Colombia 2026",
    description:
      "Ve con qué candidato presidencial colombiano tienes más afinidad, con desglose por tema y links a las fuentes.",
  },
};

export default function ResultadosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
