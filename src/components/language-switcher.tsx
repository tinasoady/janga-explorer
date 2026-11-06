"use client";

import { Languages } from "lucide-react";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "./locale-provider";

const LABEL: Record<Locale, string> = { fr: "Choisir la langue", en: "Choose language" };

/** Garde le choix un an, puis recharge la page pour que le serveur la rende dans la nouvelle langue. */
function switchTo(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

/**
 * Bascule FR / EN. Le choix est gardé un an dans un cookie, puis la page est rechargée : le serveur la rend
 * dans la nouvelle langue (même adresse).
 */
export function LanguageSwitcher({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const locale = useLocale();

  const idle = tone === "dark" ? "text-white/70 hover:text-white" : "text-muted hover:text-fg";
  const active = tone === "dark" ? "bg-white text-ink" : "bg-fg text-card";

  return (
    <div role="group" aria-label={LABEL[locale]} className={`flex items-center gap-1 text-xs font-bold ${className}`}>
      <Languages className={`size-4 ${tone === "dark" ? "text-white/70" : "text-muted"}`} aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => l !== locale && switchTo(l)}
          aria-pressed={l === locale}
          className={`rounded-full px-2 py-1 uppercase transition ${l === locale ? active : idle}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
