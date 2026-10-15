"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireProAccess } from "@/lib/auth";
import { removeOfferImage, uploadOfferImage } from "@/lib/offer-image";
import { getMyBusiness, getMyOffer } from "@/lib/pro";
import { makeSlug, parseBusiness, parseOffer } from "@/lib/pro-forms";

export type FormState = { error?: string; values?: Record<string, string> } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_ERROR = "Enregistrement impossible. Réessayez dans un instant.";

/** Renvoie la saisie au formulaire : React vide les champs après une action, on les remplit à nouveau en cas d'erreur. */
function echo(formData: FormData, names: string[]) {
  return Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "")]));
}

export async function saveBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireProAccess("/espace-pro/etablissement");
  const values = echo(formData, ["name", "kind", "whatsapp", "phone"]);

  const parsed = parseBusiness(formData);
  if (!parsed.ok) return { error: parsed.error, values };

  const existing = await getMyBusiness(supabase, user.id);
  const { error } = existing
    ? await supabase.from("businesses").update(parsed.value).eq("id", existing.id)
    : await supabase.from("businesses").insert({ ...parsed.value, owner_id: user.id });
  if (error) return { error: GENERIC_ERROR, values };

  // Les coordonnées s'affichent sur les offres publiées.
  updateTag("offers");
  redirect("/espace-pro");
}

export async function saveOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireProAccess("/espace-pro");
  const business = await getMyBusiness(supabase, user.id);
  if (!business) redirect("/espace-pro/etablissement");

  const values = echo(formData, [
    "title",
    "category",
    "description",
    "priceOriginal",
    "priceOffer",
    "conditions",
    "location",
    "mapUrl",
    "validUntil",
  ]);

  const parsed = parseOffer(formData);
  if (!parsed.ok) return { error: parsed.error, values };
  const o = parsed.value;

  const id = String(formData.get("id") ?? "");
  const existing = id ? await getMyOffer(supabase, business.id, UUID.test(id) ? id : "") : null;
  if (id && !existing) return { error: "Cette offre n'existe plus.", values };

  // Photo : obligatoire à la création, facultative ensuite (on garde l'ancienne).
  const file = formData.get("image");
  let uploadedPath: string | null = null;
  let imageUrl = existing?.imageUrl ?? null;
  if (file instanceof File && file.size > 0) {
    const upload = await uploadOfferImage(supabase, user.id, file);
    if (!upload.ok) return { error: upload.error, values };
    uploadedPath = upload.path;
    imageUrl = upload.url;
  }
  if (!imageUrl) return { error: "Ajoutez une photo de l'offre.", values };

  const row = {
    title: o.title,
    description: o.description,
    category: o.category,
    image_url: imageUrl,
    price_original: o.priceOriginal,
    price_offer: o.priceOffer,
    conditions: o.conditions,
    location: o.location,
    map_url: o.mapUrl,
    valid_until: o.validUntil,
  };

  const { error } = existing
    ? await supabase.from("offers").update(row).eq("id", existing.id)
    : await supabase.from("offers").insert({ ...row, business_id: business.id, slug: makeSlug(o.title), status: "pending" });

  if (error) {
    if (uploadedPath) await removeOfferImage(supabase, uploadedPath);
    return { error: GENERIC_ERROR, values };
  }

  // Une offre modifiée repasse en validation : elle doit disparaître du site public.
  updateTag("offers");
  redirect("/espace-pro");
}

async function ownedOfferId(formData: FormData) {
  const { user, supabase } = await requireProAccess("/espace-pro");
  const business = await getMyBusiness(supabase, user.id);
  const id = String(formData.get("id") ?? "");
  if (!business || !UUID.test(id)) return null;
  return { supabase, businessId: business.id, id };
}

export async function archiveOffer(formData: FormData) {
  const target = await ownedOfferId(formData);
  if (!target) return;
  await target.supabase
    .from("offers")
    .update({ status: "archived" })
    .eq("id", target.id)
    .eq("business_id", target.businessId);
  updateTag("offers");
  refresh();
}

/** Soumet à nouveau une offre retirée ou refusée : elle repasse en validation. */
export async function resubmitOffer(formData: FormData) {
  const target = await ownedOfferId(formData);
  if (!target) return;
  await target.supabase
    .from("offers")
    .update({ status: "pending" })
    .eq("id", target.id)
    .eq("business_id", target.businessId);
  updateTag("offers");
  refresh();
}

export async function deleteOffer(formData: FormData) {
  const target = await ownedOfferId(formData);
  if (!target) return;
  await target.supabase.from("offers").delete().eq("id", target.id).eq("business_id", target.businessId);
  updateTag("offers");
  refresh();
}
