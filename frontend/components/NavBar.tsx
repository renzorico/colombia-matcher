"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const MAIN_LINKS = [
    { href: "/eleccion-2026",       label: t.nav.results2026 },
    { href: "/candidatos",          label: t.nav.candidates },
    { href: "/quiz",                label: t.nav.quiz },
    { href: "/riesgos-electorales", label: t.nav.electoralRisks },
    { href: "/metodologia",         label: t.nav.methodology },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className="sticky top-0 z-10 bg-surface/90 backdrop-blur-sm"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground hover:text-hero transition"
        >
          <ColombiaFlag />
          {t.nav.wordmark}
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm pb-0.5 transition ${
                isActive(link.href)
                  ? "font-semibold text-foreground border-b-2"
                  : "text-muted hover:text-foreground"
              }`}
              style={isActive(link.href) ? { borderColor: "var(--primary)" } : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/bajo-el-capo"
            className="text-sm text-muted hover:text-foreground transition"
          >
            {t.nav.howWeMadeIt}
          </Link>
          <LanguageToggle />
        </div>

        {/* Mobile: hamburger + toggle */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-muted hover:text-foreground transition"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3 bg-surface"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-sm py-1 transition ${
                isActive(link.href)
                  ? "font-semibold text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/bajo-el-capo"
            onClick={() => setOpen(false)}
            className="text-sm text-muted hover:text-foreground transition pt-1"
          >
            {t.nav.behindScenes}
          </Link>
        </div>
      )}
    </header>
  );
}

/** Colombian tricolour (yellow 1/2, blue 1/4, red 1/4); flag emoji renders as "CO" on Windows. */
function ColombiaFlag() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-[18px] rounded-[2px]"
      style={{ background: "linear-gradient(to bottom, #FCD116 0 50%, #003893 50% 75%, #CE1126 75% 100%)" }}
    />
  );
}
