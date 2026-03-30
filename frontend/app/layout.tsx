import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n";
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
    default: "Aclara tu voto — Elecciones Colombia 2026",
    template: "%s — Aclara tu voto",
  },
  description: DEFAULT_DESC,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Aclara tu voto — Elecciones Colombia 2026",
    description: DEFAULT_DESC,
    url: BASE_URL,
    siteName: "Aclara tu voto",
    type: "website",
    locale: "es_CO",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Aclara tu voto — Elecciones Colombia 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aclara tu voto — Elecciones Colombia 2026",
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
        <LanguageProvider>
          <NavBar />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
