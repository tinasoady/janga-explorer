import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { getSessionUser, safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { AuthForm } from "./auth-form";
import { ProRequestForm } from "./pro-request-form";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">Compte professionnel</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;

  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNext(one(params.next));
  const signup = one(params.mode) === "inscription";

  if (await getSessionUser()) redirect(next);

  return (
    <div className="space-y-5 px-5 pb-8">
      <p className="text-sm text-muted">
        {signup
          ? "Les comptes sont réservés aux professionnels : hôtels, restaurants, activités et événements à Mahajanga. Présentez votre établissement : après vérification, nous activons votre compte et vous pouvez publier vos offres."
          : "Accédez à votre espace professionnel."}
      </p>
      {signup ? <ProRequestForm next={next} /> : <AuthForm next={next} />}
    </div>
  );
}
