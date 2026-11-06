"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { todayIso } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import { removeOfferImage, uploadOfferImage } from "@/lib/offer-image";
import { echoTickets, makeSlug, parseBusiness, parseOffer } from "@/lib/pro-forms";
import type { FormState } from "../espace-pro/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const T = messages({
  fr: {
    generic: "Enregistrement impossible. Réessayez dans un instant.",
    gone: "Cette offre n'existe plus.",
    business: "Choisissez un établissement.",
    photo: "Ajoutez une photo de l'offre.",
  },
  en: {
    generic: "Couldn't save. Please try again in a moment.",
    gone: "This deal no longer exists.",
    business: "Choose a business.",
    photo: "Add a photo of the deal.",
  },
});

type ExistingOffer = { id: string; status: string; is_verified: boolean; verified_at: string | null };

/** Repousse de 30 jours la fin de toutes les offres d'exemple (elles restent visibles pour les présentations). */
export async function extendSamples() {
  const { supabase } = await requireAdmin();
  await supabase.rpc("extend_sample_offers", { extra_days: 30 });
  updateTag("offers");
  refresh();
}

/** Supprime définitivement les établissements et offres d'exemple. Superadmin seulement, case de confirmation cochée. */
export async function deleteSamples(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  if (user.role !== "superadmin" || formData.get("confirm") !== "on") return;
  await supabase.rpc("delete_sample_content");
  updateTag("offers");
  refresh();
}

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
      "title", "category", "description", "priceOriginal", "priceOffer", "conditions", "location", "mapUrl", "validUntil",
      "pricing", "presaleUntil",
      "businessId", "name", "kind", "whatsapp", "phone", "online", "verified", "featured",
    ].map((n) => [n, field(n)]),
  );
  values.tickets = echoTickets(formData);

  const locale = await getRequestLocale();
  const t = T[locale];
  const parsed = parseOffer(formData, locale);
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
    if (!data) return { error: t.gone, values };
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
    const business = parseBusiness(formData, locale);
    if (!business.ok) return { error: business.error, values };
    const { data, error } = await supabase
      .from("businesses")
      .insert({ ...business.value, owner_id: null })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { error: t.generic, values };
    businessId = data.id;
    createdBusinessId = data.id;
  } else if (!UUID.test(chosen)) {
    return { error: t.business, values };
  }

  // Photo : obligatoire à la création, facultative ensuite.
  const file = formData.get("image");
  let uploadedPath: string | null = null;
  let imageUrl = existingImage;
  if (file instanceof File && file.size > 0) {
    const upload = await uploadOfferImage(supabase, user.id, file, locale);
    if (!upload.ok) return fail(upload.error);
    uploadedPath = upload.path;
    imageUrl = upload.url;
  }
  if (!imageUrl) return fail(t.photo);

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
    ticket_tiers: o.tickets,
    presale_until: o.presaleUntil,
    conditions: o.conditions,
    location: o.location,
    map_url: o.mapUrl,
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
    return fail(t.generic);
  }

  updateTag("offers");
  redirect("/admin");
}
