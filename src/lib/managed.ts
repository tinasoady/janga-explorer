import { isCategory, type CategoryKey } from "./types";

// Offres vues depuis l'espace pro et l'administration : toutes les étapes du cycle de validation,
// contrairement à `Offer` qui ne décrit que ce qui est public.

export type OfferStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: "Brouillon",
  pending: "En attente de validation",
  published: "En ligne",
  rejected: "Refusée",
  archived: "Retirée",
};

export type ManagedOffer = {
  id: string;
  businessId: string;
  slug: string;
  title: string;
  description: string;
  category: CategoryKey;
  imageUrl: string;
  priceOriginal: number | null;
  priceOffer: number;
  conditions: string | null;
  location: string;
  validUntil: string;
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
  price_original: number | null;
  price_offer: number;
  conditions: string | null;
  location: string;
  valid_until: string;
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
    priceOriginal: row.price_original,
    priceOffer: row.price_offer,
    conditions: row.conditions,
    location: row.location,
    validUntil: row.valid_until,
    status: row.status,
    rejectionReason: row.rejection_reason,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}
