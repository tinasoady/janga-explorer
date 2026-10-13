import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { getToday } from "@/lib/offers";
import { getMyBusiness } from "@/lib/pro";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { OfferForm } from "../../offer-form";

export const metadata: Metadata = { title: "Nouvelle offre" };

export default function NouvelleOffrePage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">Nouvelle offre</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireProAccess("/espace-pro/offres/nouvelle");
  if (!(await getMyBusiness(supabase, user.id))) redirect("/espace-pro/etablissement");

  return (
    <div className="px-5 pb-8">
      <OfferForm offer={null} minDate={await getToday()} />
    </div>
  );
}
