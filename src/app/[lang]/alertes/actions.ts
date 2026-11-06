"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import { BUDGETS, isCategory } from "@/lib/types";

export type AlertState = { error?: string } | null;

const MAX_ALERTS = 10;

const T = messages({
  fr: {
    empty: "Choisissez au moins une catégorie, un budget ou un mot-clé.",
    tooMany: `Vous pouvez créer ${MAX_ALERTS} alertes au maximum. Supprimez-en une d'abord.`,
    failed: "Création impossible. Réessayez dans un instant.",
  },
  en: {
    empty: "Choose at least a category, a budget or a keyword.",
    tooMany: `You can create up to ${MAX_ALERTS} alerts. Delete one first.`,
    failed: "Couldn't create the alert. Please try again in a moment.",
  },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createAlert(_prev: AlertState, formData: FormData): Promise<AlertState> {
  const { user, supabase } = await requireUser("/alertes");
  const t = T[await getRequestLocale()];

  const category = String(formData.get("cat") ?? "");
  const max = Number(formData.get("max"));
  const query = String(formData.get("q") ?? "").trim().slice(0, 80);

  const row = {
    user_id: user.id,
    category: isCategory(category) ? category : null,
    max_price: BUDGETS.includes(max) ? max : null,
    query: query || null,
  };
  if (!row.category && !row.max_price && !row.query) {
    return { error: t.empty };
  }

  const { count } = await supabase.from("alerts").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_ALERTS) {
    return { error: t.tooMany };
  }

  const { error } = await supabase.from("alerts").insert(row);
  if (error) return { error: t.failed };
  redirect("/alertes");
}

export async function deleteAlert(formData: FormData) {
  const { supabase } = await requireUser("/alertes");
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await supabase.from("alerts").delete().eq("id", id);
  refresh();
}

/** Les offres déjà en ligne ne sont plus « nouvelles » pour cette alerte. */
export async function markAlertSeen(formData: FormData) {
  const { supabase } = await requireUser("/alertes");
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await supabase.from("alerts").update({ last_seen_at: new Date().toISOString() }).eq("id", id);
  refresh();
}
