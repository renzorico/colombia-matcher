"use client";

import { useLanguage } from "@/lib/i18n";
import type { Lang } from "@/lib/translations";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  function toggle(next: Lang) {
    if (next !== lang) setLang(next);
  }

  return (
    <div
      className="flex items-center rounded-full overflow-hidden text-xs font-semibold"
      style={{ border: "1px solid var(--border)", height: 28 }}
    >
      {(["es", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => toggle(l)}
          className="px-2.5 h-full transition-colors"
          style={{
            backgroundColor: lang === l ? "var(--primary)" : "var(--surface)",
            color: lang === l ? "#1A1A1A" : "var(--muted)",
            cursor: lang === l ? "default" : "pointer",
          }}
          aria-label={l === "es" ? "Español" : "English"}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
