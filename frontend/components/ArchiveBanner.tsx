"use client";

import { useLanguage } from "@/lib/i18n";

/** Site-wide notice that the app is a frozen archive of the 2026 election. */
export default function ArchiveBanner() {
  const { t } = useLanguage();
  return (
    <div
      role="note"
      className="bg-secondary px-4 py-2 text-center text-xs text-white"
    >
      <span className="hidden sm:inline">{t.archive.banner}</span>
      <span className="sm:hidden">{t.archive.bannerShort}</span>
    </div>
  );
}
