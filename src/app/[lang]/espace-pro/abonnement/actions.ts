"use server";

import { redirect } from "next/navigation";
import { requireProAccess } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import { getToday } from "@/lib/offers";
import { getMyBusiness, getMyOffer } from "@/lib/pro";
import {
  getMySubscription,
  isPaymentMethod,
  MAX_PASS_DAYS,
  MONTH_CHOICES,
  passDaysDue,
  uploadPaymentProof,
} from "@/lib/subscription";
import type { FormState } from "../actions";

const T = messages({
  fr: {
    generic: "Enregistrement impossible. Réessayez dans un instant.",
    gone: "Cette offre n'existe plus.",
    paid: "Les jours de visibilité de cette offre sont déjà payés.",
    method: "Choisissez le moyen de paiement utilisé.",
    duration: "Choisissez la durée payée.",
    payer: "Indiquez le numéro qui a envoyé le paiement (ex : 034 12 345 67).",
    reference: "Indiquez la référence de la transaction reçue par SMS.",
    proof: "Ajoutez la capture d'écran du SMS de confirmation du paiement.",
    noSub: "Votre compte n'a pas d'abonnement. Contactez Janga Explorer.",
    canceled: "Votre abonnement a été annulé : contactez Janga Explorer avant de payer.",
    pending: "Un paiement est déjà en cours de vérification. Attendez sa confirmation.",
    duplicate: "Cette référence de transaction a déjà été déclarée.",
    tooLong: (max: number) => `Choisissez une date de fin à ${max} jours au plus, ou abonnez-vous.`,
  },
  en: {
    generic: "Couldn't save. Please try again in a moment.",
    gone: "This deal no longer exists.",
    paid: "The visibility days for this deal are already paid.",
    method: "Choose the payment method you used.",
    duration: "Choose the duration you paid for.",
    payer: "Enter the number that sent the payment (e.g. 034 12 345 67).",
    reference: "Enter the transaction reference you received by SMS.",
    proof: "Add the screenshot of the payment confirmation SMS.",
    noSub: "Your account has no subscription. Contact Janga Explorer.",
    canceled: "Your subscription has been cancelled: contact Janga Explorer before paying.",
    pending: "A payment is already being checked. Please wait for it to be confirmed.",
    duplicate: "This transaction reference has already been declared.",
    tooLong: (max: number) => `Choose an end date ${max} days away at most, or subscribe.`,
  },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Le pro déclare un paiement Mobile Money avec sa preuve : des mois d'abonnement, ou les jours de visibilité d'une
 * offre (champ `offerId`). Le montant est calculé par la base à partir du prix en vigueur ; un administrateur
 * confirme ensuite le paiement, ce qui prolonge l'abonnement ou met l'offre en validation.
 */
export async function declarePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireProAccess("/espace-pro/abonnement");
  const locale = await getRequestLocale();
  const t = T[locale];
  const field = (n: string) => String(formData.get(n) ?? "").trim();
  const values = { method: field("method"), months: field("months"), payerPhone: field("payerPhone"), reference: field("reference") };

  const offerId = field("offerId");
  const method = values.method;
  const months = Number(values.months);
  const payerPhone = values.payerPhone.replace(/[\s.\-]/g, "");
  const reference = values.reference;

  let days = 0;
  if (offerId) {
    const business = await getMyBusiness(supabase, user.id);
    const offer = business && UUID.test(offerId) ? await getMyOffer(supabase, business.id, offerId) : null;
    if (!offer) return { error: t.gone, values };
    days = passDaysDue(offer, await getToday());
    if (days === 0) return { error: t.paid, values };
    if (days > MAX_PASS_DAYS) {
      return { error: t.tooLong(MAX_PASS_DAYS), values };
    }
  }

  if (!isPaymentMethod(method)) return { error: t.method, values };
  if (!offerId && !MONTH_CHOICES.some((m) => m === months)) return { error: t.duration, values };
  if (!/^\+?[0-9]{8,15}$/.test(payerPhone)) {
    return { error: t.payer, values };
  }
  if (reference.length < 3 || reference.length > 60) {
    return { error: t.reference, values };
  }

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t.proof, values };
  }

  // Vérifié avant l'envoi de la preuve pour ne pas stocker de fichier inutile (la base contrôle aussi).
  const subscription = await getMySubscription(supabase, user.id);
  if (!subscription) return { error: t.noSub, values };
  if (subscription.status === "canceled") {
    return { error: t.canceled, values };
  }
  const pendingQuery = supabase
    .from("subscription_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");
  const { count } = await (offerId ? pendingQuery.eq("offer_id", offerId) : pendingQuery.eq("kind", "subscription"));
  if (count) return { error: t.pending, values };

  const upload = await uploadPaymentProof(supabase, user.id, file, locale);
  if (!upload.ok) return { error: upload.error, values };

  const { error } = await supabase.from("subscription_payments").insert({
    user_id: user.id,
    // Jours, montant et dernier jour payé sont recalculés par la base au moment de l'enregistrement.
    ...(offerId ? { kind: "offer", offer_id: offerId, days } : { kind: "subscription", months }),
    amount: 0, // remplacé par la base : mois ou jours × prix en vigueur
    method,
    payer_phone: payerPhone,
    reference,
    proof_path: upload.path,
  });
  if (error) {
    if (error.code === "23505" && error.message.includes("reference")) {
      return { error: t.duplicate, values };
    }
    return { error: t.generic, values };
  }

  redirect(offerId ? `/espace-pro/offres/${offerId}/visibilite?envoye=1` : "/espace-pro/abonnement?envoye=1");
}
