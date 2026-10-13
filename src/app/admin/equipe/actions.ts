"use server";

import { refresh } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";

export type TeamState = { error?: string; info?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Les contrôles réels sont dans la base (fonction set_admin, réservée au superadmin) ; ceci donne des messages clairs. */
async function setAdmin(email: string, makeAdmin: boolean): Promise<TeamState> {
  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase.rpc("set_admin", { target_email: email, make_admin: makeAdmin });
  if (error) return { error: "Action impossible. Réessayez dans un instant." };

  switch (data) {
    case "ok":
      refresh();
      return makeAdmin
        ? { info: `${email} est maintenant administrateur.` }
        : { info: `${email} n'est plus administrateur.` };
    case "not_found":
      return { error: "Aucun compte avec cet e-mail. La personne doit d'abord créer un compte sur Janga Explorer." };
    case "is_superadmin":
      return { error: "Un super-administrateur ne peut pas être modifié depuis l'application." };
    default:
      return { error: "Action impossible." };
  }
}

export async function addAdmin(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: "Cette adresse e-mail n'est pas valide." };
  return setAdmin(email, true);
}

export async function removeAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return;
  await setAdmin(email, false);
}
