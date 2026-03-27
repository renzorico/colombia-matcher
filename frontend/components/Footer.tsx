"use client";

import { usePathname } from "next/navigation";

const HIDE_ON = ["/quiz"];

export default function Footer() {
  const pathname = usePathname();
  if (HIDE_ON.includes(pathname)) return null;

  return (
    <footer className="border-t border-gray-100 pt-5 pb-8 text-center text-xs text-gray-400">
      <p>
        Herramienta independiente · Sin afiliación política · Datos curados manualmente · Actualizado marzo 2026
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
      </p>
    </footer>
  );
}
