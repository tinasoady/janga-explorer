import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { getSessionUser, safeNext } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { AuthForm } from "./auth-form";
import { ProRequestForm } from "./pro-request-form";

const T = messages({
  fr: {
    meta: "Connexion",
    title: "Compte professionnel",
    signupIntro:
      "Les comptes sont réservés aux professionnels : hôtels, restaurants, activités et événements à Mahajanga. Présentez votre établissement : après vérification, nous activons votre compte et vous pouvez publier vos offres.",
    signinIntro: "Accédez à votre espace professionnel.",
  },
  en: {
    meta: "Sign in",
    title: "Business account",
    signupIntro:
      "Accounts are for businesses only: hotels, restaurants, activities and events in Mahajanga. Tell us about your business: once we've checked it, we activate your account and you can post your deals.",
    signinIntro: "Access your business space.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: T[await getLocale()].meta };
}

export default async function ConnexionPage({ searchParams }: PageProps<"/[lang]/connexion">) {
  const t = T[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">{t.title}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/[lang]/connexion">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;

  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNext(one(params.next));
  const signup = one(params.mode) === "inscription";

  if (await getSessionUser()) redirect(next);
  const t = T[await getLocale()];

  return (
    <div className="space-y-5 px-5 pb-8">
      <p className="text-sm text-muted">
        {signup ? t.signupIntro : t.signinIntro}
      </p>
      {signup ? <ProRequestForm next={next} /> : <AuthForm next={next} />}
    </div>
  );
}
