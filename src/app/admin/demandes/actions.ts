"use server";

import { refresh } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Le contrôle réel est dans la base (review_pro_request, réservée au superadmin) ; on vérifie aussi ici. */
async function review(formData: FormData, approve: boolean) {
  const { supabase } = await requireSuperadmin("/admin/demandes");
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  await supabase.rpc("review_pro_request", { target: id, approve, reason: approve ? null : reason || null });
  refresh();
}

/** Approuve la demande : le compte peut créer son établissement et publier des offres. */
export async function approveRequest(formData: FormData) {
  await review(formData, true);
}

/** Refuse une demande, ou retire l'accès à un compte déjà approuvé. */
export async function rejectRequest(formData: FormData) {
  await review(formData, false);
}
