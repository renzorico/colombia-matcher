"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const HIDE_ON = ["/quiz"];

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();
  if (HIDE_ON.includes(pathname)) return null;

  return (
    <footer className="border-t border-gray-100 pt-5 pb-8 text-center text-xs text-gray-400">
      <p>{t.footer.tagline}</p>
      <p className="mt-3">
        {t.footer.builtBy}{" "}
        <a
          href="https://www.linkedin.com/in/renzorico"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:text-gray-600 transition-colors"
        >
          Renzo Rico
        </a>
        {" "}— {t.footer.role}
      </p>
    </footer>
  );
}
