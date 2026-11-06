import { dateOf, daysBetween } from "./format";
import type { Offer } from "./types";

// Repères d'urgence et de nouveauté affichés sur les cartes d'offres. Sans dépendance serveur : aussi utilisé
// par des composants client (favoris).

/** Une offre qui se termine dans ce nombre de jours (ou moins) est une « dernière chance ». */
export const LAST_CHANCE_DAYS = 3;

/** Une offre mise en ligne depuis ce nombre de jours (ou moins) est « nouvelle ». */
const NEW_DAYS = 2;

export type HighlightTone = "urgent" | "soon" | "new";
export type OfferHighlight = { label: string; tone: HighlightTone };

/** Jours restants après aujourd'hui : 0 le dernier jour. */
export function daysLeft(offer: Pick<Offer, "validUntil">, today: string) {
  return daysBetween(today, offer.validUntil);
}

export function isLastChance(offer: Pick<Offer, "validUntil">, today: string) {
  return daysLeft(offer, today) <= LAST_CHANCE_DAYS;
}

/** Le repère le plus utile pour décider vite : la fin proche passe avant la nouveauté. */
export function offerHighlight(offer: Pick<Offer, "validUntil" | "publishedAt">, today: string): OfferHighlight | null {
  const left = daysLeft(offer, today);
  if (left <= 0) return { label: "Dernier jour", tone: "urgent" };
  if (left === 1) return { label: "Jusqu'à demain", tone: "urgent" };
  if (left <= LAST_CHANCE_DAYS) return { label: `Plus que ${left + 1} jours`, tone: "soon" };
  if (offer.publishedAt && daysBetween(dateOf(offer.publishedAt), today) <= NEW_DAYS) {
    return { label: "Nouveau", tone: "new" };
  }
  return null;
}
