"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { todayIso } from "@/lib/format";
import { removeOfferImage, uploadOfferImage } from "@/lib/offer-image";
import { makeSlug, parseBusiness, parseOffer } from "@/lib/pro-forms";
import type { FormState } from "../espace-pro/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_ERROR = "Enregistrement impossible. Réessayez dans un instant.";

type ExistingOffer = { id: string; status: string; is_verified: boolean; verified_at: string | null };

/** Applique une décision de modération. Chaque action revérifie le rôle admin : elle est appelable en POST direct. */
async function moderate(formData: FormData, patch: Record<string, unknown>) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;

  await supabase.from("offers").update(patch).eq("id", id);
  updateTag("offers");
  refresh();
}

/** Publie l'offre avec le badge « Offre vérifiée » (prix et conditions confirmés avec l'établissement). */
export async function publishVerified(formData: FormData) {
  await moderate(formData, {
    status: "published",
    is_verified: true,
    verified_at: todayIso(),
    rejection_reason: null,
  });
}

/** Publie l'offre sans badge : informations non confirmées. */
export async function publishUnverified(formData: FormData) {
  await moderate(formData, {
    status: "published",
    is_verified: false,
    verified_at: null,
    rejection_reason: null,
  });
}

export async function rejectOffer(formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  await moderate(formData, {
    status: "rejected",
    is_verified: false,
    verified_at: null,
    rejection_reason: reason || "Informations insuffisantes ou à corriger.",
  });
}

/** Retire l'offre du site et la renvoie en attente de validation. */
export async function unpublishOffer(formData: FormData) {
  await moderate(formData, { status: "pending", is_verified: false, verified_at: null });
}

export async function toggleFeatured(formData: FormData) {
  const next = String(formData.get("featured") ?? "") === "true";
  await moderate(formData, { is_featured: next });
}

/**
 * Crée ou modifie une offre au nom d'un établissement (existant ou nouveau, sans compte), par exemple quand il
 * a transmis son offre par WhatsApp. L'admin choisit lui-même le statut : en ligne, avec ou sans badge, à la une.
 */
export async function adminSaveOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireAdmin();
  const field = (n: string) => String(formData.get(n) ?? "");
  const values = Object.fromEntries(
    [
      "title", "category", "description", "priceOriginal", "priceOffer", "conditions", "location", "validUntil",
      "businessId", "name", "kind", "whatsapp", "phone", "online", "verified", "featured",
    ].map((n) => [n, field(n)]),
  );

  const parsed = parseOffer(formData);
  if (!parsed.ok) return { error: parsed.error, values };
  const o = parsed.value;

  const id = field("id");
  let existing: ExistingOffer | null = null;
  let existingImage: string | null = null;
  if (id) {
    const { data } = await supabase
      .from("offers")
      .select("id, status, is_verified, verified_at, image_url")
      .eq("id", UUID.test(id) ? id : "")
      .maybeSingle<ExistingOffer & { image_url: string }>();
    if (!data) return { error: "Cette offre n'existe plus.", values };
    existing = data;
    existingImage = data.image_url;
  }

  // Établissement : un existant, ou un nouveau créé ici (sans propriétaire, l'admin le gère).
  const chosen = field("businessId");
  let businessId = chosen;
  let createdBusinessId: string | null = null;
  // En cas d'échec plus loin, on n'abandonne pas un établissement créé pour rien (un nouvel essai le recréerait).
  const fail = async (error: string): Promise<FormState> => {
    if (createdBusinessId) await supabase.from("businesses").delete().eq("id", createdBusinessId);
    return { error, values };
  };
  if (chosen === "new") {
    const business = parseBusiness(formData);
    if (!business.ok) return { error: business.error, values };
    const { data, error } = await supabase
      .from("businesses")
      .insert({ ...business.value, owner_id: null })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { error: GENERIC_ERROR, values };
    businessId = data.id;
    createdBusinessId = data.id;
  } else if (!UUID.test(chosen)) {
    return { error: "Choisissez un établissement.", values };
  }

  // Photo : obligatoire à la création, facultative ensuite.
  const file = formData.get("image");
  let uploadedPath: string | null = null;
  let imageUrl = existingImage;
  if (file instanceof File && file.size > 0) {
    const upload = await uploadOfferImage(supabase, user.id, file);
    if (!upload.ok) return fail(upload.error);
    uploadedPath = upload.path;
    imageUrl = upload.url;
  }
  if (!imageUrl) return fail("Ajoutez une photo de l'offre.");

  const online = field("online") === "on";
  const verified = online && field("verified") === "on";
  const row = {
    business_id: businessId,
    title: o.title,
    description: o.description,
    category: o.category,
    image_url: imageUrl,
    price_original: o.priceOriginal,
    price_offer: o.priceOffer,
    conditions: o.conditions,
    location: o.location,
    valid_until: o.validUntil,
    status: online ? "published" : existing && existing.status !== "published" ? existing.status : "pending",
    is_verified: verified,
    // La date de vérification ne bouge pas quand on corrige une offre déjà vérifiée.
    verified_at: verified ? (existing?.is_verified && existing.verified_at ? existing.verified_at : todayIso()) : null,
    is_featured: field("featured") === "on",
    rejection_reason: null,
  };

  const { error } = existing
    ? await supabase.from("offers").update(row).eq("id", existing.id)
    : await supabase.from("offers").insert({ ...row, slug: makeSlug(o.title) });

  if (error) {
    if (uploadedPath) await removeOfferImage(supabase, uploadedPath);
    return fail(GENERIC_ERROR);
  }

  updateTag("offers");
  redirect("/admin");
}
