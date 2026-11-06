import { cookies } from "next/headers";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./i18n";

/** Langue de la page en cours (segment [lang]), pour les composants serveur et les fonctions en cache. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Langue dans une Server Action ou une route API, où le segment [lang] n'est pas disponible : on lit le cookie,
 * que proxy.ts pose dès la première visite.
 */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
