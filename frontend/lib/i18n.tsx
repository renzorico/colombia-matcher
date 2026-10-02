"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "lang";
const DEFAULT_LANG: Lang = "es";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof translations)[Lang];
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => undefined,
  t: translations[DEFAULT_LANG],
});

/** Fallback when localStorage is blocked, so the toggle still works. */
let memoryLang: Lang | null = null;

/** Subscribers notified when the language changes in this tab. */
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "es" || stored === "en" ? stored : DEFAULT_LANG;
  } catch {
    return memoryLang ?? DEFAULT_LANG;
  }
}

function writeStoredLang(next: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch { /* storage unavailable — language still changes for this session */ }
  memoryLang = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

const getSnapshot = (): Lang => readStoredLang();
const getServerSnapshot = (): Lang => DEFAULT_LANG;

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep <html lang> in sync for screen readers and search engines.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: writeStoredLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
