import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { getToday } from "@/lib/offers";
import { getMyBusiness, getMyOffer } from "@/lib/pro";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { OfferForm } from "../../offer-form";

export const metadata: Metadata = { title: "Modifier l'offre" };

export default function ModifierOffrePage({ params }: PageProps<"/espace-pro/offres/[id]">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">Modifier l&apos;offre</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}

async function Content({ params }: { params: PageProps<"/espace-pro/offres/[id]">["params"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { id } = await params;
  const { user, supabase } = await requireProAccess(`/espace-pro/offres/${id}`);
  const business = await getMyBusiness(supabase, user.id);
  if (!business) redirect("/espace-pro/etablissement");

  const offer = /^[0-9a-f-]{36}$/i.test(id) ? await getMyOffer(supabase, business.id, id) : null;
  if (!offer) notFound();

  return (
    <div className="px-5 pb-8">
      <OfferForm offer={offer} minDate={await getToday()} />
    </div>
  );
}
