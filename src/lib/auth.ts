import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";

export type Role = "user" | "admin" | "superadmin";
/** État de la demande de compte pro : « none » pour un compte sans demande (ex : compte administrateur). */
export type ProStatus = "none" | "pending" | "approved" | "rejected";
export type SessionUser = { id: string; email: string; role: Role; proStatus: ProStatus };

/** Un superadmin est aussi administrateur. */
export function isAdminRole(role: Role) {
  return role === "admin" || role === "superadmin";
}

export const ROLE_LABEL: Record<Role, string> = {
  user: "Connecté",
  admin: "Administrateur",
  superadmin: "Super-administrateur",
};

/** Chemin interne sûr pour une redirection après connexion (jamais d'URL externe). */
export function safeNext(next: string | null | undefined, fallback = "/profil") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

/**
 * Personne connectée et son rôle, ou `null`. La session est validée auprès de Supabase (getUser),
 * jamais lue telle quelle depuis le cookie. Dédupliqué pendant un même rendu.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const [{ data: profile }, { data: request }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle<{ role: Role }>(),
    supabase.from("pro_requests").select("status").eq("user_id", data.user.id).maybeSingle<{ status: ProStatus }>(),
  ]);

  const role: Role = profile?.role === "admin" || profile?.role === "superadmin" ? profile.role : "user";
  return { id: data.user.id, email: data.user.email ?? "", role, proStatus: request?.status ?? "none" };
});

/** Les administrateurs n'ont pas besoin de demande ; les autres doivent avoir une demande approuvée. */
export function hasProAccess(user: SessionUser) {
  return isAdminRole(user.role) || user.proStatus === "approved";
}

/** Pour les pages et actions réservées aux comptes : renvoie vers la connexion sinon. */
export async function requireUser(next: string) {
  const user = await getSessionUser();
  const supabase = await createServerSupabase();
  if (!user || !supabase) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return { user, supabase };
}

/** Pour l'administration : 404 pour tout compte qui n'est pas admin (on ne révèle pas que la page existe). */
export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (!isAdminRole(session.user.role)) notFound();
  return session;
}

/** Pour la gestion des administrateurs et des demandes de compte pro : réservée au superadmin. */
export async function requireSuperadmin(next = "/admin/equipe") {
  const session = await requireUser(next);
  if (session.user.role !== "superadmin") notFound();
  return session;
}

/**
 * Pour publier des offres : compte connecté ET demande de compte pro approuvée (ou administrateur).
 * Sinon on renvoie vers /espace-pro, qui explique où en est la demande.
 */
export async function requireProAccess(next: string) {
  const session = await requireUser(next);
  if (!hasProAccess(session.user)) redirect("/espace-pro");
  return session;
}
