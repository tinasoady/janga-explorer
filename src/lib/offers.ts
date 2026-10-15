import { cacheLife, cacheTag } from "next/cache";
import { getDemoOffers } from "@/data/demo-offers";
import { addDaysIso, discountPercent, todayIso } from "./format";
import { getSupabase } from "./supabase";
import { isCategory, type Offer, type OfferFilters } from "./types";

type BusinessRow = {
  id: string;
  name: string;
  kind: string;
  whatsapp: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number;
};

type OfferRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price_original: number | null;
  price_offer: number;
  conditions: string | null;
  location: string;
  map_url: string | null;
  valid_until: string;
  is_verified: boolean;
  verified_at: string | null;
  is_featured: boolean;
  published_at: string | null;
  business: BusinessRow;
};

function toOffer(row: OfferRow): Offer | null {
  if (!isCategory(row.category)) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    priceOriginal: row.price_original,
    priceOffer: row.price_offer,
    conditions: row.conditions,
    location: row.location,
    mapUrl: row.map_url,
    validUntil: row.valid_until,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    isFeatured: row.is_featured,
    publishedAt: row.published_at ?? undefined,
    business: {
      id: row.business.id,
      name: row.business.name,
      kind: row.business.kind,
      whatsapp: row.business.whatsapp,
      phone: row.business.phone,
      rating: row.business.rating,
      reviewCount: row.business.review_count,
    },
  };
}

/**
 * Toutes les offres publiées et encore valables aujourd'hui à Mahajanga.
 * Le volume d'une ville reste faible : on charge tout une fois (en cache quelques minutes)
 * et on filtre en mémoire, ce qui évite de construire des requêtes à partir de la saisie.
 */
export async function getActiveOffers(): Promise<Offer[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("offers");

  const today = todayIso();
  const supabase = getSupabase();

  if (!supabase) {
    return getDemoOffers(today).filter((o) => o.validUntil >= today);
  }

  const { data, error } = await supabase
    .from("offers")
    .select("*, business:businesses(*)")
    .eq("status", "published")
    .gte("valid_until", today)
    .order("published_at", { ascending: false, nullsFirst: false })
    .returns<OfferRow[]>();

  if (error) throw new Error(`Chargement des offres impossible : ${error.message}`);
  return data.map(toOffer).filter((o): o is Offer => o !== null);
}

/** Date du jour à Mahajanga, utilisable dans un rendu pré-calculé. */
export async function getToday() {
  "use cache";
  cacheLife("minutes");
  return todayIso();
}

/** Activités et sorties encore valables le samedi qui vient (ou aujourd'hui si on est déjà le week-end). */
export async function getWeekendOffers() {
  const [offers, today] = await Promise.all([getActiveOffers(), getToday()]);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  const saturday = weekday === 0 ? today : addDaysIso(today, 6 - weekday);
  return offers.filter(
    (o) => (o.category === "activites" || o.category === "sorties") && o.validUntil >= saturday,
  );
}

export async function getOfferBySlug(slug: string) {
  const offers = await getActiveOffers();
  return offers.find((o) => o.slug === slug) ?? null;
}

export async function getOffersBySlugs(slugs: string[]) {
  const offers = await getActiveOffers();
  return slugs.map((s) => offers.find((o) => o.slug === s)).filter((o): o is Offer => o !== undefined);
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function filterOffers(offers: Offer[], { category, q, maxPrice, sort = "recent" }: OfferFilters) {
  const terms = q ? normalize(q).split(/\s+/).filter(Boolean) : [];

  const result = offers.filter((o) => {
    if (category && o.category !== category) return false;
    if (maxPrice && o.priceOffer > maxPrice) return false;
    if (terms.length) {
      const haystack = normalize(`${o.title} ${o.business.name} ${o.location} ${o.description}`);
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  if (sort === "fin") {
    result.sort((a, b) => a.validUntil.localeCompare(b.validUntil));
  } else if (sort === "remise") {
    const pct = (o: Offer) => discountPercent(o.priceOriginal, o.priceOffer) ?? 0;
    result.sort((a, b) => pct(b) - pct(a));
  }
  return result;
}
