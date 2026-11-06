import { cacheLife, cacheTag } from "next/cache";
import { getDemoOffers } from "@/data/demo-offers";
import { addDaysIso, discountPercent, todayIso } from "./format";
import { getSupabase } from "./supabase";
import { ticketSummary, type TicketTier } from "./tickets";
import { isCategory, type Offer, type OfferFilters } from "./types";

type BusinessRow = {
  id: string;
  name: string;
  kind: string;
  whatsapp: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number;
  is_sample?: boolean; // absent tant que la migration 20261106000009 n'est pas appliquée
};

type OfferRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  image_urls?: string[]; // absent tant que la migration 20261107000010 n'est pas appliquée
  price_original: number | null;
  price_offer: number;
  ticket_tiers: TicketTier[] | null;
  presale_until: string | null;
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

/** Avec une billetterie, le prix affiché dépend du jour : prévente tant qu'elle est ouverte, puis prix sur place. */
export function withTicketPrices(offer: Offer, today: string): Offer {
  if (!offer.tickets?.length) return offer;
  const { price, original } = ticketSummary(offer.tickets, offer.presaleUntil, today);
  return { ...offer, priceOffer: price, priceOriginal: original };
}

function toOffer(row: OfferRow, today: string): Offer | null {
  if (!isCategory(row.category)) return null;
  return withTicketPrices({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    imageUrls: row.image_urls ?? [],
    priceOriginal: row.price_original,
    priceOffer: row.price_offer,
    tickets: row.ticket_tiers,
    presaleUntil: row.presale_until,
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
      isSample: row.business.is_sample ?? false,
    },
  }, today);
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
    return getDemoOffers(today)
      .filter((o) => o.validUntil >= today)
      .map((o) => withTicketPrices(o, today));
  }

  const { data, error } = await supabase
    .from("offers")
    .select("*, business:businesses(*)")
    .eq("status", "published")
    .gte("valid_until", today)
    .order("published_at", { ascending: false, nullsFirst: false })
    .returns<OfferRow[]>();

  if (error) throw new Error(`Chargement des offres impossible : ${error.message}`);
  return data.map((row) => toOffer(row, today)).filter((o): o is Offer => o !== null);
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

/**
 * Les bons plans du jour : `count` offres, d'abord celles à la une avec une remise, puis les autres offres à remise,
 * puis le reste. La sélection tourne chaque jour à minuit, pour que les mêmes offres ne restent pas en tête.
 */
export function pickDealsOfTheDay(offers: Offer[], today: string, count = 5) {
  const hasDiscount = (o: Offer) => discountPercent(o.priceOriginal, o.priceOffer) !== null;
  const byId = (a: Offer, b: Offer) => a.id.localeCompare(b.id);
  const tiers = [
    offers.filter((o) => o.isFeatured && hasDiscount(o)),
    offers.filter((o) => !o.isFeatured && hasDiscount(o)),
    offers.filter((o) => !hasDiscount(o)),
  ].map((group) => group.sort(byId));
  const day = Math.floor(new Date(`${today}T12:00:00Z`).getTime() / 86_400_000);

  const picked: Offer[] = [];
  for (const group of tiers) {
    const start = group.length ? day % group.length : 0;
    for (let i = 0; i < group.length && picked.length < count; i++) picked.push(group[(start + i) % group.length]);
  }
  return picked;
}

export type PublicPricing = { monthlyPrice: number; dayPrice: number; trialDays: number };

/** Tarifs de l'espace pro affichés au public (accueil, présentation pro). */
export async function getPublicPricing(): Promise<PublicPricing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("pricing");

  const supabase = getSupabase();
  // Démonstration : les valeurs par défaut de la base (migrations 20261016000006 et 20261106000007).
  if (!supabase) return { monthlyPrice: 20000, dayPrice: 1000, trialDays: 30 };
  const { data } = await supabase
    .from("subscription_settings")
    .select("monthly_price, day_price, trial_days")
    .maybeSingle<{ monthly_price: number; day_price: number; trial_days: number }>();
  return data ? { monthlyPrice: data.monthly_price, dayPrice: data.day_price, trialDays: data.trial_days } : null;
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
