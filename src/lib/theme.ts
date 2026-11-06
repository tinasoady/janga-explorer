// Mode jour / nuit. Le choix (« light », « dark », ou « system » pour suivre l'appareil) reste dans le navigateur ;
// la classe .dark de <html> est posée par un petit script avant l'affichage, pour éviter un flash de page claire.
// Sans dépendance serveur : utilisé par le sélecteur (composant client) et par la mise en page racine.

export type ThemeChoice = "light" | "dark" | "system";

export const THEME_KEY = "janga:theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Script en ligne de <head> : applique le thème enregistré (ou celui de l'appareil) avant le premier rendu. */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_KEY}");var d=c==="dark"||(c!=="light"&&matchMedia("${DARK_QUERY}").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}})()`;

const listeners = new Set<() => void>();

export function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

/** Thème réellement affiché : le choix de la personne, ou celui de l'appareil en mode « system ». */
export function isDarkShown() {
  return document.documentElement.classList.contains("dark");
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia(DARK_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  listeners.forEach((l) => l());
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // stockage indisponible (navigation privée…) : le choix vaut pour cette page seulement
  }
  apply(choice);
}

/** Abonnement pour useSyncExternalStore : changement de choix, ou de thème de l'appareil en mode « system ». */
export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);
  const media = matchMedia(DARK_QUERY);
  const onSystem = () => {
    if (readThemeChoice() === "system") apply("system");
  };
  media.addEventListener("change", onSystem);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onSystem);
  };
}
