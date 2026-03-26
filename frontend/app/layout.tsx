import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elecciones Colombia 2026 — ¿Con quién votas?",
  description:
    "Descubre qué candidato presidencial está más alineado con tus ideas. 25 preguntas. Datos verificados.",
  openGraph: {
    title: "Elecciones Colombia 2026 — ¿Con quién votas?",
    description:
      "Descubre qué candidato presidencial está más alineado con tus ideas. 25 preguntas. Datos verificados.",
    url: "https://colombia-matcher.vercel.app",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elecciones Colombia 2026 — ¿Con quién votas?",
    description:
      "Descubre qué candidato presidencial está más alineado con tus ideas. 25 preguntas. Datos verificados.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
          Datos curados manualmente · Última actualización marzo 2026 ·{" "}
          <span className="italic">
            Herramienta informativa — consulta siempre los programas oficiales de cada candidato.
          </span>
        </footer>
      </body>
    </html>
  );
}
