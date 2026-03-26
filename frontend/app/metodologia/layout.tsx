import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metodología — ¿Con quién votas? Colombia 2026",
  description:
    "Cómo funciona el sistema: algoritmo de afinidad ponderada, pipeline multi-agente de investigación y modelo de revisión humana.",
};

export default function MetodologiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
