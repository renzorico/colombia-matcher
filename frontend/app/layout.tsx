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

const BASE_URL = "https://colombia-matcher.vercel.app";
const OG_IMAGE = `${BASE_URL}/og-default.svg`;
const DEFAULT_DESC = "Descubre qué candidato presidencial está más alineado con tus ideas. 25 preguntas. Datos verificados.";

export const metadata: Metadata = {
  title: {
    default: "Elecciones Colombia 2026 — ¿Con quién votas?",
    template: "%s — Elecciones Colombia 2026",
  },
  description: DEFAULT_DESC,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Elecciones Colombia 2026 — ¿Con quién votas?",
    description: DEFAULT_DESC,
    url: BASE_URL,
    siteName: "Elecciones Colombia 2026",
    type: "website",
    locale: "es_CO",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "¿Por quién votarás? Elecciones Colombia 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elecciones Colombia 2026 — ¿Con quién votas?",
    description: DEFAULT_DESC,
    images: [OG_IMAGE],
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
        <footer className="border-t border-gray-100 pt-5 pb-8 text-center text-xs text-gray-400">
          <p>
            Datos curados manualmente · Última actualización marzo 2026 ·{" "}
            <span className="italic">
              Herramienta informativa — consulta siempre los programas oficiales de cada candidato.
            </span>
          </p>
          <p className="mt-3">
            Construido por{" "}
            <a
              href="https://www.linkedin.com/in/renzorico"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              Renzo Rico
            </a>
            {" "}— Data Scientist ·{" "}
            <a
              href="https://github.com/renzorico/colombia-matcher"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              GitHub
            </a>
            {" "}· Herramienta independiente sin afiliación política
          </p>
        </footer>
      </body>
    </html>
  );
}
