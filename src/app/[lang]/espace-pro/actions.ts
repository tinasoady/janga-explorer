"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireProAccess } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import { removeOfferImage, uploadOfferImage } from "@/lib/offer-image";
import { getMyBusiness, getMyOffer } from "@/lib/pro";
import { echoTickets, makeSlug, parseBusiness, parseOffer } from "@/lib/pro-forms";
import { getToday } from "@/lib/offers";
import { canPayPerOffer, canPublish, getMySubscription, MAX_PASS_DAYS, passDaysDue } from "@/lib/subscription";

export type FormState = { error?: string; values?: Record<string, string> } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const T = messages({
  fr: {
    generic: "Enregistrement impossible. Réessayez dans un instant.",
    canceled: "Votre abonnement a été annulé : contactez Janga Explorer pour publier à nouveau.",
    tooLong: `Sans abonnement, la visibilité se paie pour ${MAX_PASS_DAYS} jours au plus : choisissez une date de fin plus proche, ou abonnez-vous (plus avantageux sur une longue durée).`,
    gone: "Cette offre n'existe plus.",
    photo: "Ajoutez une photo de l'offre.",
  },
  en: {
    generic: "Couldn't save. Please try again in a moment.",
    canceled: "Your subscription has been cancelled: contact Janga Explorer to post again.",
    tooLong: `Without a subscription, visibility can be paid for ${MAX_PASS_DAYS} days at most: choose an earlier end date, or subscribe (better value over a long period).`,
    gone: "This deal no longer exists.",
    photo: "Add a photo of the deal.",
  },
});

/** Page où le pro paie les jours de visibilité d'une offre publiée sans abonnement. */
const passPage = (offerId: string) => `/espace-pro/offres/${offerId}/visibilite`;

/** Renvoie la saisie au formulaire : React vide les champs après une action, on les remplit à nouveau en cas d'erreur. */
function echo(formData: FormData, names: string[]) {
  return Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "")]));
}

export async function saveBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireProAccess("/espace-pro/etablissement");
  const values = echo(formData, ["name", "kind", "whatsapp", "phone"]);
  const locale = await getRequestLocale();

  const parsed = parseBusiness(formData, locale);
  if (!parsed.ok) return { error: parsed.error, values };

  const existing = await getMyBusiness(supabase, user.id);
  const { error } = existing
    ? await supabase.from("businesses").update(parsed.value).eq("id", existing.id)
    : await supabase.from("businesses").insert({ ...parsed.value, owner_id: user.id });
  if (error) return { error: T[locale].generic, values };

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
    "pricing",
    "presaleUntil",
  ]);
  values.tickets = echoTickets(formData);

  const locale = await getRequestLocale();
  const t = T[locale];
  const parsed = parseOffer(formData, locale);
  if (!parsed.ok) return { error: parsed.error, values };
  const o = parsed.value;

  const id = String(formData.get("id") ?? "");
  const existing = id ? await getMyOffer(supabase, business.id, UUID.test(id) ? id : "") : null;
  if (id && !existing) return { error: t.gone, values };

  // Créer ou modifier une offre la (re)met en validation. Sans abonnement actif, elle reste un brouillon tant que
  // ses jours de visibilité ne sont pas payés (la base applique la même règle).
  const subscription = await getMySubscription(supabase, user.id);
  const subscribed = canPublish(user, subscription);
  if (!subscribed && !canPayPerOffer(subscription)) return { error: t.canceled, values };
  const daysDue = subscribed ? 0 : passDaysDue({ validUntil: o.validUntil, passUntil: existing?.passUntil ?? null }, await getToday());
  if (daysDue > MAX_PASS_DAYS) return { error: t.tooLong, values };

  // Photo : obligatoire à la création, facultative ensuite (on garde l'ancienne).
  const file = formData.get("image");
  let uploadedPath: string | null = null;
  let imageUrl = existing?.imageUrl ?? null;
  if (file instanceof File && file.size > 0) {
    const upload = await uploadOfferImage(supabase, user.id, file, locale);
    if (!upload.ok) return { error: upload.error, values };
    uploadedPath = upload.path;
    imageUrl = upload.url;
  }
  if (!imageUrl) return { error: t.photo, values };

  const row = {
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
  };

  const { data: saved, error } = existing
    ? await supabase.from("offers").update(row).eq("id", existing.id).select("id").single()
    : await supabase
        .from("offers")
        .insert({ ...row, business_id: business.id, slug: makeSlug(o.title), status: subscribed ? "pending" : "draft" })
        .select("id")
        .single();

  if (error) {
    if (uploadedPath) await removeOfferImage(supabase, uploadedPath);
    return { error: t.generic, values };
  }

  // Une offre modifiée repasse en validation : elle doit disparaître du site public.
  updateTag("offers");
  redirect(daysDue > 0 ? passPage(saved.id) : "/espace-pro");
}

async function ownedOfferId(formData: FormData) {
  const { user, supabase } = await requireProAccess("/espace-pro");
  const business = await getMyBusiness(supabase, user.id);
  const id = String(formData.get("id") ?? "");
  if (!business || !UUID.test(id)) return null;
  return { user, supabase, businessId: business.id, id };
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

/**
 * Soumet à nouveau une offre retirée ou refusée : elle repasse en validation. Sans abonnement, si ses jours de
 * visibilité ne sont pas payés, la base en fait un brouillon et le pro est envoyé vers le paiement.
 */
export async function resubmitOffer(formData: FormData) {
  const target = await ownedOfferId(formData);
  if (!target) return;
  const subscription = await getMySubscription(target.supabase, target.user.id);
  const subscribed = canPublish(target.user, subscription);
  if (!subscribed && !canPayPerOffer(subscription)) redirect("/espace-pro/abonnement");
  await target.supabase
    .from("offers")
    .update({ status: "pending" })
    .eq("id", target.id)
    .eq("business_id", target.businessId);
  updateTag("offers");
  if (!subscribed && (await getMyOffer(target.supabase, target.businessId, target.id))?.status === "draft") {
    redirect(passPage(target.id));
  }
  refresh();
}

export async function deleteOffer(formData: FormData) {
  const target = await ownedOfferId(formData);
  if (!target) return;
  await target.supabase.from("offers").delete().eq("id", target.id).eq("business_id", target.businessId);
  updateTag("offers");
  refresh();
}
