"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_LINKS = [
  { href: "/candidatos",    label: "Candidatos" },
  { href: "/quiz",          label: "Quiz" },
  { href: "/como-funciona", label: "¿Cómo funciona?" },
  { href: "/metodologia",   label: "Metodología" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          className="text-sm font-bold tracking-tight text-foreground hover:text-secondary transition"
        >
          ¿Por quién votarás?
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
            Detrás del motor
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-muted hover:text-foreground transition"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
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
            Detrás del motor
          </Link>
        </div>
      )}
    </header>
  );
}
