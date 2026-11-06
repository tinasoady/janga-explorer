"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { safeNext } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import { notifyNewProRequest } from "@/lib/notify";
import { PRO_REQUEST_FIELDS, parseProRequest } from "@/lib/pro-request";
import { createServerSupabase } from "@/lib/supabase-server";

export type AuthState = { error?: string; info?: string; email?: string } | null;
export type ProRequestState = { error?: string; info?: string; values?: Record<string, string> } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const T = messages({
  fr: {
    missing: "Renseignez votre e-mail et votre mot de passe.",
    unavailable: "Les comptes ne sont pas encore disponibles.",
    unconfirmed:
      "Votre demande de compte est en cours de vérification. Vous pourrez vous connecter dès qu'elle sera approuvée.",
    wrong: "E-mail ou mot de passe incorrect.",
    requestsUnavailable: "Les demandes de compte ne sont pas encore disponibles.",
    exists: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
    failed: "Envoi de la demande impossible. Réessayez dans un instant.",
    sent: "Demande envoyée ! Nous vérifions votre établissement. Votre compte sera activé dès que la vérification est terminée.",
  },
  en: {
    missing: "Enter your email and password.",
    unavailable: "Accounts aren't available yet.",
    unconfirmed: "Your account request is being reviewed. You'll be able to sign in as soon as it's approved.",
    wrong: "Incorrect email or password.",
    requestsUnavailable: "Account requests aren't available yet.",
    exists: "An account already exists with this email. Please sign in.",
    failed: "Couldn't send the request. Please try again in a moment.",
    sent: "Request sent! We're checking your business. Your account will be activated as soon as that's done.",
  },
});

function read(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: safeNext(String(formData.get("next") ?? "")),
  };
}

/** URL publique du site, pour les liens envoyés par e-mail. */
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = read(formData);
  const t = T[await getRequestLocale()];
  if (!EMAIL.test(email) || !password) return { error: t.missing, email };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: t.unavailable, email };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return {
      error: unconfirmed ? t.unconfirmed : t.wrong,
      email,
    };
  }
  redirect(next);
}

/**
 * Demande de compte professionnel (il n'y a plus d'inscription libre). Le compte est créé dans Supabase Auth, avec la
 * demande jointe en métadonnées (un trigger en fait une ligne `pro_requests`), mais il n'ouvre aucun droit tant que le
 * superadmin n'a pas approuvé la demande. Le superadmin est prévenu par e-mail si l'envoi est configuré.
 */
export async function requestProAccount(_prev: ProRequestState, formData: FormData): Promise<ProRequestState> {
  const values = Object.fromEntries(PRO_REQUEST_FIELDS.map((n) => [n, String(formData.get(n) ?? "")]));
  const locale = await getRequestLocale();
  const t = T[locale];

  const parsed = parseProRequest(formData, locale);
  if (!parsed.ok) return { error: parsed.error, values };
  const { password, ...request } = parsed.value;

  const supabase = await createServerSupabase();
  if (!supabase) return { error: t.requestsUnavailable, values };

  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: request.email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/espace-pro")}`,
      data: {
        full_name: request.fullName,
        company: request.company,
        kind: request.kind,
        locality: request.locality,
        capacity: String(request.capacity),
        justification: request.justification,
      },
    },
  });

  if (error) {
    return {
      error: error.code === "user_already_exists" ? t.exists : t.failed,
      values,
    };
  }

  // Avec une adresse déjà connue, Supabase ne renvoie pas d'erreur (pour ne pas révéler les comptes existants) :
  // l'utilisateur renvoyé n'a alors aucune identité. On ne prévient personne dans ce cas.
  const created = (data.user?.identities?.length ?? 0) > 0;
  if (created) after(() => notifyNewProRequest(request, origin));

  // Session ouverte directement quand la confirmation par e-mail est désactivée dans Supabase.
  if (data.session) redirect("/espace-pro");
  return { info: t.sent };
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();
  redirect("/");
}
