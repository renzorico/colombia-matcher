import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "El quiz — Colombia Matcher 2026",
  description:
    "25 preguntas para descubrir qué candidato presidencial representa mejor tus ideas.",
  openGraph: {
    title: "El quiz — Colombia Matcher 2026",
    description:
      "25 preguntas para descubrir qué candidato presidencial representa mejor tus ideas.",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "El quiz — Colombia Matcher 2026",
    description:
      "25 preguntas para descubrir qué candidato presidencial representa mejor tus ideas.",
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
