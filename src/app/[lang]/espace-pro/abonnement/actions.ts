"use server";

import { redirect } from "next/navigation";
import { requireProAccess } from "@/lib/auth";
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

const GENERIC_ERROR = "Enregistrement impossible. Réessayez dans un instant.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Le pro déclare un paiement Mobile Money avec sa preuve : des mois d'abonnement, ou les jours de visibilité d'une
 * offre (champ `offerId`). Le montant est calculé par la base à partir du prix en vigueur ; un administrateur
 * confirme ensuite le paiement, ce qui prolonge l'abonnement ou met l'offre en validation.
 */
export async function declarePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireProAccess("/espace-pro/abonnement");
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
    if (!offer) return { error: "Cette offre n'existe plus.", values };
    days = passDaysDue(offer, await getToday());
    if (days === 0) return { error: "Les jours de visibilité de cette offre sont déjà payés.", values };
    if (days > MAX_PASS_DAYS) {
      return { error: `Choisissez une date de fin à ${MAX_PASS_DAYS} jours au plus, ou abonnez-vous.`, values };
    }
  }

  if (!isPaymentMethod(method)) return { error: "Choisissez le moyen de paiement utilisé.", values };
  if (!offerId && !MONTH_CHOICES.some((m) => m === months)) return { error: "Choisissez la durée payée.", values };
  if (!/^\+?[0-9]{8,15}$/.test(payerPhone)) {
    return { error: "Indiquez le numéro qui a envoyé le paiement (ex : 034 12 345 67).", values };
  }
  if (reference.length < 3 || reference.length > 60) {
    return { error: "Indiquez la référence de la transaction reçue par SMS.", values };
  }

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Ajoutez la capture d'écran du SMS de confirmation du paiement.", values };
  }

  // Vérifié avant l'envoi de la preuve pour ne pas stocker de fichier inutile (la base contrôle aussi).
  const subscription = await getMySubscription(supabase, user.id);
  if (!subscription) return { error: "Votre compte n'a pas d'abonnement. Contactez Janga Explorer.", values };
  if (subscription.status === "canceled") {
    return { error: "Votre abonnement a été annulé : contactez Janga Explorer avant de payer.", values };
  }
  const pendingQuery = supabase
    .from("subscription_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");
  const { count } = await (offerId ? pendingQuery.eq("offer_id", offerId) : pendingQuery.eq("kind", "subscription"));
  if (count) return { error: "Un paiement est déjà en cours de vérification. Attendez sa confirmation.", values };

  const upload = await uploadPaymentProof(supabase, user.id, file);
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
      return { error: "Cette référence de transaction a déjà été déclarée.", values };
    }
    return { error: GENERIC_ERROR, values };
  }

  redirect(offerId ? `/espace-pro/offres/${offerId}/visibilite?envoye=1` : "/espace-pro/abonnement?envoye=1");
}
