export const CATEGORIES = [
  { key: "manger", label: "Manger", tile: "Restaurants" },
  { key: "dormir", label: "Dormir", tile: "Hôtels" },
  { key: "activites", label: "Activités", tile: "Activités" },
  { key: "sorties", label: "Sorties", tile: "Sorties" },
] as const;

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
  priceOriginal: number | null;
  priceOffer: number;
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
