import type { Locale } from "./i18n";
import type { TicketTier } from "./tickets";

/** `label` : verbe court (filtres, formulaires) ; `tile` : nom de rubrique (accueil, menus). */
export const CATEGORIES = [
  { key: "manger", label: { fr: "Manger", en: "Eat" }, tile: { fr: "Restaurants", en: "Restaurants" } },
  { key: "dormir", label: { fr: "Dormir", en: "Stay" }, tile: { fr: "Hôtels", en: "Hotels" } },
  { key: "activites", label: { fr: "Activités", en: "Activities" }, tile: { fr: "Activités", en: "Activities" } },
  { key: "sorties", label: { fr: "Sorties", en: "Going out" }, tile: { fr: "Sorties", en: "Nightlife & events" } },
] as const satisfies readonly { key: string; label: Record<Locale, string>; tile: Record<Locale, string> }[];

/** Budgets proposés dans les filtres et les alertes, en ariary. */
export const BUDGETS = [20000, 50000, 100000];

export type CategoryKey =(typeof CATEGORIES)[number]["key"];

export function isCategory(value: unknown): value is CategoryKey {
  return CATEGORIES.some((c) => c.key === value);
}

export type Business = {
  id: string;
  name: string;
  kind: string; // "Restaurant partenaire", "Hôtel", "Agence d'excursions"...
  whatsapp: string | null; // format international sans "+", ex: 261341234567
  phone: string | null;
  rating: number | null;
  reviewCount: number;
};

export type Offer = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CategoryKey;
  imageUrl: string;
  /** Avec une billetterie : prix sur place du tarif le moins cher quand la prévente le rend moins cher. */
  priceOriginal: number | null;
  /** Avec une billetterie : prix du tarif le moins cher aujourd'hui (prévente si elle est ouverte). */
  priceOffer: number;
  /** Billetterie d'un événement (billet normal, VIP…) ; null pour une offre à prix unique. */
  tickets: TicketTier[] | null;
  presaleUntil: string | null; // date ISO, dernier jour de la prévente (inclus)
  conditions: string | null;
  location: string;
  mapUrl: string | null; // lien Google Maps donné par l'établissement (facultatif)
  validUntil: string; // date ISO (YYYY-MM-DD), dernier jour de validité inclus
  isVerified: boolean;
  verifiedAt: string | null; // date ISO
  isFeatured: boolean;
  publishedAt?: string; // horodatage ISO de la mise en ligne ; absent des données de démonstration
  business: Business;
};

export type OfferFilters = {
  category?: CategoryKey;
  q?: string;
  maxPrice?: number;
  sort?: "recent" | "fin" | "remise";
};
