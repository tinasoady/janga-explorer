"use server";

import { refresh } from "next/cache";
import { requireAdmin, requireSuperadmin } from "@/lib/auth";

export type SettingsState = { error?: string; info?: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PATH = "/admin/abonnements";

// Les contrôles réels sont dans la base (fonctions réservées aux admins ou au superadmin) ; on vérifie aussi ici.

const targetId = (formData: FormData) => {
  const id = String(formData.get("id") ?? "");
  return UUID.test(id) ? id : null;
};

const reasonOf = (formData: FormData) => String(formData.get("reason") ?? "").trim().slice(0, 300) || null;

/** Confirme un paiement : l'abonnement est prolongé de 30 jours par mois payé. Ouvert à tous les administrateurs. */
export async function confirmPayment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = targetId(formData);
  if (!id) return;
  await supabase.rpc("review_subscription_payment", { target: id, approve: true, reason: null });
  refresh();
}

/** Refuse un paiement (introuvable, montant incorrect…) : le motif est montré au pro, qui peut en déclarer un autre. */
export async function rejectPayment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = targetId(formData);
  if (!id) return;
  await supabase.rpc("review_subscription_payment", { target: id, approve: false, reason: reasonOf(formData) });
  refresh();
}

/** Offre des jours d'abonnement, ajoutés à la fin de l'accès en cours. */
export async function grantDays(formData: FormData) {
  const { supabase } = await requireSuperadmin(PATH);
  const id = targetId(formData);
  const days = Number(formData.get("days"));
  if (!id || !Number.isInteger(days) || days < 1 || days > 365) return;
  await supabase.rpc("grant_subscription_days", { target: id, extra_days: days });
  refresh();
}

/** Annule l'abonnement : le pro ne peut plus publier ni payer tant qu'il n'est pas réactivé. */
export async function cancelSubscription(formData: FormData) {
  const { supabase } = await requireSuperadmin(PATH);
  const id = targetId(formData);
  if (!id) return;
  await supabase.rpc("cancel_subscription", { target: id, reason: reasonOf(formData) });
  refresh();
}

export async function reactivateSubscription(formData: FormData) {
  const { supabase } = await requireSuperadmin(PATH);
  const id = targetId(formData);
  if (!id) return;
  await supabase.rpc("reactivate_subscription", { target: id });
  refresh();
}

const digits = (formData: FormData, name: string) => String(formData.get(name) ?? "").replace(/[\s ]/g, "");
const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/** Prix et numéros de paiement. Un nouveau prix vaut pour les paiements déclarés ensuite, pas pour ceux en attente. */
export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireSuperadmin(`${PATH}/tarifs`);

  const monthlyPrice = Number(digits(formData, "monthlyPrice"));
  const trialDays = Number(digits(formData, "trialDays"));
  const accountName = text(formData, "accountName");
  const numbers = {
    mvola_number: text(formData, "mvola"),
    orange_money_number: text(formData, "orange_money"),
    airtel_money_number: text(formData, "airtel_money"),
  };

  if (!Number.isInteger(monthlyPrice) || monthlyPrice < 0 || monthlyPrice > 10_000_000) {
    return { error: "Le prix doit être un nombre entier d'ariary (10 000 000 Ar maximum)." };
  }
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365) {
    return { error: "La durée de l'essai doit être comprise entre 0 et 365 jours." };
  }
  if (accountName.length > 80) return { error: "Le nom du bénéficiaire est trop long." };
  if (Object.values(numbers).some((n) => n.length > 30 || (n && !/^[0-9+ ]{8,30}$/.test(n)))) {
    return { error: "Un numéro de paiement n'est pas valide (ex : 034 12 345 67)." };
  }

  const { error } = await supabase
    .from("subscription_settings")
    .update({
      monthly_price: monthlyPrice,
      trial_days: trialDays,
      account_name: accountName,
      ...numbers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { error: "Enregistrement impossible. Réessayez dans un instant." };

  refresh();
  return { info: "Réglages enregistrés." };
}
