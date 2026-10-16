"use server";

import { redirect } from "next/navigation";
import { requireProAccess } from "@/lib/auth";
import { getMySubscription, isPaymentMethod, MONTH_CHOICES, uploadPaymentProof } from "@/lib/subscription";
import type { FormState } from "../actions";

const GENERIC_ERROR = "Enregistrement impossible. Réessayez dans un instant.";

/**
 * Le pro déclare un paiement Mobile Money avec sa preuve. Le montant est calculé par la base à partir du prix en
 * vigueur ; un administrateur confirme ensuite le paiement, ce qui prolonge l'abonnement.
 */
export async function declarePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, supabase } = await requireProAccess("/espace-pro/abonnement");
  const field = (n: string) => String(formData.get(n) ?? "").trim();
  const values = { method: field("method"), months: field("months"), payerPhone: field("payerPhone"), reference: field("reference") };

  const method = values.method;
  const months = Number(values.months);
  const payerPhone = values.payerPhone.replace(/[\s.\-]/g, "");
  const reference = values.reference;

  if (!isPaymentMethod(method)) return { error: "Choisissez le moyen de paiement utilisé.", values };
  if (!MONTH_CHOICES.some((m) => m === months)) return { error: "Choisissez la durée payée.", values };
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
  const { count } = await supabase
    .from("subscription_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");
  if (count) return { error: "Un paiement est déjà en cours de vérification. Attendez sa confirmation.", values };

  const upload = await uploadPaymentProof(supabase, user.id, file);
  if (!upload.ok) return { error: upload.error, values };

  const { error } = await supabase.from("subscription_payments").insert({
    user_id: user.id,
    months,
    amount: 0, // remplacé par la base : nombre de mois × prix en vigueur
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

  redirect("/espace-pro/abonnement?envoye=1");
}
