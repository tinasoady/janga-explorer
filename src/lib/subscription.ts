import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionUser } from "./auth";
import { checkImage } from "./pro-forms";

// Abonnement des comptes pro : essai gratuit à l'approbation, puis paiements Mobile Money confirmés par un admin.
// Les règles qui comptent (montant, droit de publier) sont appliquées par la base ; ce module sert l'affichage.
// Il est aussi importé par des composants client : aucun import d'exécution de modules serveur (auth, cookies).

export type SubscriptionStatus = "trial" | "active" | "expired" | "canceled";

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Essai gratuit",
  active: "Abonné",
  expired: "Expiré",
  canceled: "Annulé",
};

export type PaymentMethod = "mvola" | "orange_money" | "airtel_money";

export const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "mvola", label: "MVola" },
  { key: "orange_money", label: "Orange Money" },
  { key: "airtel_money", label: "Airtel Money" },
];

export function paymentMethodLabel(method: string) {
  return PAYMENT_METHODS.find((m) => m.key === method)?.label ?? method;
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.key === value);
}

/** Durées proposées au paiement (un mois = 30 jours). */
export const MONTH_CHOICES = [1, 3, 6, 12] as const;

export type PaymentStatus = "pending" | "confirmed" | "rejected";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "En cours de vérification",
  confirmed: "Confirmé",
  rejected: "Refusé",
};

export type SubscriptionRow = {
  trial_ends_at: string;
  paid_until: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
};

export type Subscription = {
  status: SubscriptionStatus;
  trialEndsAt: string;
  paidUntil: string | null;
  /** Fin de l'accès (essai ou période payée), horodatage ISO. */
  accessUntil: string;
  /** Jours restants, arrondis au jour supérieur (0 si l'accès est terminé). */
  daysLeft: number;
  cancelReason: string | null;
};

/** Même règle que has_active_subscription() dans la base. */
export function toSubscription(row: SubscriptionRow, now = new Date()): Subscription {
  const trialEnd = new Date(row.trial_ends_at).getTime();
  const paidEnd = row.paid_until ? new Date(row.paid_until).getTime() : 0;
  const accessEnd = Math.max(trialEnd, paidEnd);
  const remaining = accessEnd - now.getTime();

  let status: SubscriptionStatus;
  if (row.canceled_at) status = "canceled";
  else if (remaining <= 0) status = "expired";
  else status = paidEnd > now.getTime() ? "active" : "trial";

  return {
    status,
    trialEndsAt: row.trial_ends_at,
    paidUntil: row.paid_until,
    accessUntil: new Date(accessEnd).toISOString(),
    daysLeft: status === "trial" || status === "active" ? Math.ceil(remaining / 86_400_000) : 0,
    cancelReason: row.cancel_reason,
  };
}

export function isSubscriptionActive(sub: Subscription | null) {
  return sub?.status === "trial" || sub?.status === "active";
}

/** Les administrateurs publient sans abonnement ; un pro doit être en essai ou abonné. */
export function canPublish(user: SessionUser, sub: Subscription | null) {
  return user.role === "admin" || user.role === "superadmin" || isSubscriptionActive(sub);
}

export async function getMySubscription(supabase: SupabaseClient, userId: string): Promise<Subscription | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("trial_ends_at, paid_until, canceled_at, cancel_reason")
    .eq("user_id", userId)
    .maybeSingle<SubscriptionRow>();
  return data ? toSubscription(data) : null;
}

export type SubscriptionSettings = {
  monthlyPrice: number;
  trialDays: number;
  accountName: string;
  numbers: Record<PaymentMethod, string>;
};

type SettingsRow = {
  monthly_price: number;
  trial_days: number;
  account_name: string;
  mvola_number: string;
  orange_money_number: string;
  airtel_money_number: string;
};

export async function getSubscriptionSettings(supabase: SupabaseClient): Promise<SubscriptionSettings | null> {
  const { data } = await supabase
    .from("subscription_settings")
    .select("monthly_price, trial_days, account_name, mvola_number, orange_money_number, airtel_money_number")
    .maybeSingle<SettingsRow>();
  if (!data) return null;
  return {
    monthlyPrice: data.monthly_price,
    trialDays: data.trial_days,
    accountName: data.account_name,
    numbers: {
      mvola: data.mvola_number,
      orange_money: data.orange_money_number,
      airtel_money: data.airtel_money_number,
    },
  };
}

export type PaymentRow = {
  id: string;
  user_id: string;
  months: number;
  amount: number;
  method: PaymentMethod;
  payer_phone: string;
  reference: string;
  proof_path: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  period_start: string | null;
  period_end: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function getMyPayments(supabase: SupabaseClient, userId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24)
    .returns<PaymentRow[]>();
  if (error) throw new Error(`Chargement de vos paiements impossible : ${error.message}`);
  return data;
}

const PROOF_BUCKET = "payment-proofs";

/** Envoie la preuve de paiement (capture d'écran) dans le dossier privé de la personne connectée. */
export async function uploadPaymentProof(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const image = await checkImage(file);
  if (!image.ok) return image;

  const path = `${userId}/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: "L'envoi de la preuve a échoué. Réessayez dans un instant." };
  return { ok: true, path };
}

/** Liens temporaires (1 heure) vers les preuves : le bucket est privé. */
export async function signProofUrls(supabase: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data } = await supabase.storage.from(PROOF_BUCKET).createSignedUrls(paths, 3600);
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}
