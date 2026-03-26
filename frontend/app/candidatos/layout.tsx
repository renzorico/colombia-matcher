import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidatos presidenciales — ¿Con quién votas? Colombia 2026",
  description:
    "Perfiles políticos de los candidatos presidenciales colombianos 2026: posiciones por tema, fuentes verificables y estado en la Procuraduría.",
};

export default function CandidatosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
