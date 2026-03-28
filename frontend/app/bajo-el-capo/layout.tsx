import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detrás de cámaras",
  description:
    "Cómo está construida la infraestructura de datos y matching de Aclara tu voto: pipeline de datos, algoritmo de afinidad, agentes y stack tecnológico.",
  openGraph: {
    title: "Detrás de cámaras — Aclara tu voto",
    description:
      "Cómo está construida la infraestructura de datos y matching de Aclara tu voto: pipeline de datos, algoritmo de afinidad, agentes y stack tecnológico.",
    type: "website",
    locale: "es_CO",
  },
};

export default function BajoElCapoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
