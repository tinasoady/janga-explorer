"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { messages } from "@/lib/i18n";
import { isDarkShown, readThemeChoice, setThemeChoice, subscribeTheme, type ThemeChoice } from "@/lib/theme";
import { useLocale } from "./locale-provider";

const T = messages({
  fr: {
    toDark: "Passer en mode nuit",
    toLight: "Passer en mode jour",
    group: "Affichage",
    choices: { light: "Jour", dark: "Nuit", system: "Auto" } as Record<ThemeChoice, string>,
    systemHint: "Auto suit le réglage du téléphone ou de l'ordinateur.",
  },
  en: {
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
    group: "Display",
    choices: { light: "Light", dark: "Dark", system: "Auto" } as Record<ThemeChoice, string>,
    systemHint: "Auto follows your phone or computer setting.",
  },
});

const ICONS: Record<ThemeChoice, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

// Rendu serveur : thème inconnu, on affiche l'état « jour » (le script de <head> a déjà appliqué le vrai thème).
const useDark = () => useSyncExternalStore(subscribeTheme, isDarkShown, () => false);
const useChoice = () => useSyncExternalStore(subscribeTheme, readThemeChoice, () => "system" as const);

/** Bouton jour / nuit (en-têtes) : bascule vers le thème opposé à celui affiché. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = T[useLocale()];
  const dark = useDark();
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setThemeChoice(dark ? "light" : "dark")}
      aria-label={dark ? t.toLight : t.toDark}
      title={dark ? t.toLight : t.toDark}
      className={`grid size-9 place-items-center rounded-full text-fg transition hover:bg-surface ${className}`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/** Choix complet (profil) : jour, nuit, ou automatique selon l'appareil. */
export function ThemeChoices() {
  const t = T[useLocale()];
  const choice = useChoice();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold">{t.group}</legend>
      <div className="grid grid-cols-3 gap-2">
        {(["light", "dark", "system"] as const).map((value) => {
          const Icon = ICONS[value];
          const selected = choice === value;
          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                selected ? "border-brand bg-brand-soft text-brand" : "border-line bg-card"
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={selected}
                onChange={() => setThemeChoice(value)}
                className="sr-only"
              />
              <Icon className="size-4" aria-hidden />
              {t.choices[value]}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted">{t.systemHint}</p>
    </fieldset>
  );
}
