import { INTL_LOCALE, type Locale } from "./i18n";

// Toutes les dates sont calculées à l'heure de Mahajanga. Les fonctions d'affichage prennent la langue de la page
// (français par défaut).
export const TIME_ZONE = "Indian/Antananarivo";

const priceFormatters: Record<Locale, Intl.NumberFormat> = {
  fr: new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }),
};

export function formatAriary(amount: number, locale: Locale = "fr") {
  return `${priceFormatters[locale].format(amount)} Ar`;
}

export function discountPercent(original: number | null, offer: number) {
  if (!original || original <= offer) return null;
  return Math.round(((original - offer) / original) * 100);
}

/** Date du jour à Mahajanga au format YYYY-MM-DD. */
export function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** Date à Mahajanga (YYYY-MM-DD) d'un horodatage enregistré par la base. */
export function dateOf(timestamp: string) {
  return todayIso(new Date(timestamp));
}

export function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fromIso(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

/** "20 oct." / "20 Oct" */
export function formatShortDate(iso: string, locale: Locale = "fr") {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "short", timeZone: "UTC" }).format(
    fromIso(iso),
  );
}

/** "20 octobre 2026" / "20 October 2026" */
export function formatLongDate(iso: string, locale: Locale = "fr") {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fromIso(iso));
}

export function daysBetween(fromIsoDate: string, toIsoDate: string) {
  return Math.round((fromIso(toIsoDate).getTime() - fromIso(fromIsoDate).getTime()) / 86_400_000);
}

/** "aujourd'hui", "hier", "il y a 3 jours" / "today", "yesterday", "3 days ago" */
export function formatVerifiedAgo(verifiedAt: string, today: string, locale: Locale = "fr") {
  const days = daysBetween(verifiedAt, today);
  if (locale === "en") return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

/** Lien vers le plan : la localisation exacte donnée par l'établissement, sinon une recherche par nom et lieu. */
export function mapsLink(offer: { mapUrl: string | null; location: string; business: { name: string } }) {
  if (offer.mapUrl) return offer.mapUrl;
  const query = `${offer.business.name}, ${offer.location}${/mahajanga|majunga/i.test(offer.location) ? "" : ", Mahajanga"}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
