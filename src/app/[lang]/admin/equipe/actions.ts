"use server";

import { refresh } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";

export type TeamState = { error?: string; info?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const T = messages({
  fr: {
    failed: "Action impossible. Réessayez dans un instant.",
    added: (email: string) => `${email} est maintenant administrateur.`,
    removed: (email: string) => `${email} n'est plus administrateur.`,
    notFound: "Aucun compte avec cet e-mail. La personne doit d'abord créer un compte sur Janga Explorer.",
    superadmin: "Un super-administrateur ne peut pas être modifié depuis l'application.",
    impossible: "Action impossible.",
    invalid: "Cette adresse e-mail n'est pas valide.",
  },
  en: {
    failed: "Action failed. Please try again in a moment.",
    added: (email: string) => `${email} is now an administrator.`,
    removed: (email: string) => `${email} is no longer an administrator.`,
    notFound: "No account with this email. The person must first create an account on Janga Explorer.",
    superadmin: "A super administrator can't be changed from the app.",
    impossible: "Action failed.",
    invalid: "This email address isn't valid.",
  },
});

/** Les contrôles réels sont dans la base (fonction set_admin, réservée au superadmin) ; ceci donne des messages clairs. */
async function setAdmin(email: string, makeAdmin: boolean): Promise<TeamState> {
  const { supabase } = await requireSuperadmin();
  const t = T[await getRequestLocale()];
  const { data, error } = await supabase.rpc("set_admin", { target_email: email, make_admin: makeAdmin });
  if (error) return { error: t.failed };

  switch (data) {
    case "ok":
      refresh();
      return { info: makeAdmin ? t.added(email) : t.removed(email) };
    case "not_found":
      return { error: t.notFound };
    case "is_superadmin":
      return { error: t.superadmin };
    default:
      return { error: t.impossible };
  }
}

export async function addAdmin(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: T[await getRequestLocale()].invalid };
  return setAdmin(email, true);
}

export async function removeAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return;
  await setAdmin(email, false);
}
