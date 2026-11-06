import type { Locale } from "./i18n";
import type { TicketTier } from "./tickets";
import { isCategory, type CategoryKey } from "./types";

// Offres vues depuis l'espace pro et l'administration : toutes les étapes du cycle de validation,
// contrairement à `Offer` qui ne décrit que ce qui est public.

export type OfferStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export const STATUS_LABEL: Record<Locale, Record<OfferStatus, string>> = {
  fr: {
    draft: "Brouillon",
    pending: "En attente de validation",
    published: "En ligne",
    rejected: "Refusée",
    archived: "Retirée",
  },
  en: {
    draft: "Draft",
    pending: "Awaiting review",
    published: "Live",
    rejected: "Rejected",
    archived: "Withdrawn",
  },
};

export type ManagedOffer = {
  id: string;
  businessId: string;
  slug: string;
  title: string;
  description: string;
  category: CategoryKey;
  imageUrl: string;
  imageUrls: string[];
  priceOriginal: number | null;
  priceOffer: number;
  tickets: TicketTier[] | null;
  presaleUntil: string | null;
  conditions: string | null;
  location: string;
  mapUrl: string | null;
  validUntil: string;
  /** Dernier jour de visibilité payé à la journée (offres publiées sans abonnement). */
  passUntil: string | null;
  status: OfferStatus;
  rejectionReason: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export type ManagedBusiness = {
  id: string;
  name: string;
  kind: string;
  whatsapp: string | null;
  phone: string | null;
};

export type ManagedOfferRow = {
  id: string;
  business_id: string;
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
  pass_until: string | null;
  status: OfferStatus;
  rejection_reason: string | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
};

export type ManagedBusinessRow = ManagedBusiness;

export function toManaged(row: ManagedOfferRow): ManagedOffer | null {
  if (!isCategory(row.category)) return null;
  return {
    id: row.id,
    businessId: row.business_id,
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
    passUntil: row.pass_until,
    status: row.status,
    rejectionReason: row.rejection_reason,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}
