// Langues du site. Le choix est mémorisé dans un cookie : l'adresse reste la même dans les deux langues, et
// proxy.ts réécrit chaque page vers /fr/… ou /en/… (segment [lang]), prérendu dans les deux langues.
// Sans dépendance serveur : importé aussi par des composants client.

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "lang";

export const LOCALE_NAME: Record<Locale, string> = { fr: "Français", en: "English" };

/** Locale des formats de date et de nombre (Intl). */
export const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l === value);
}

/**
 * Textes d'un module dans les deux langues. L'anglais doit avoir exactement la même forme que le français
 * (mêmes clés, mêmes paramètres pour les textes calculés) : TypeScript le vérifie.
 */
export function messages<T>(m: { fr: T; en: NoInfer<T> }) {
  return m;
}

/** Langue préférée du navigateur parmi celles du site (en-tête Accept-Language), sinon le français. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  const first = acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return isLocale(first) ? first : DEFAULT_LOCALE;
}
