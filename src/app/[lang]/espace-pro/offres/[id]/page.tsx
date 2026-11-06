import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getToday } from "@/lib/offers";
import { getMyBusiness, getMyOffer } from "@/lib/pro";
import { canPublish, getMySubscription, getSubscriptionSettings } from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { OfferForm } from "../../offer-form";

const TITLES = {
  fr: { meta: "Modifier l'offre", heading: "Modifier l'offre" },
  en: { meta: "Edit deal", heading: "Edit deal" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

export default async function ModifierOffrePage({ params }: PageProps<"/[lang]/espace-pro/offres/[id]">) {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}

async function Content({ params }: { params: PageProps<"/[lang]/espace-pro/offres/[id]">["params"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { id } = await params;
  const { user, supabase } = await requireProAccess(`/espace-pro/offres/${id}`);
  const business = await getMyBusiness(supabase, user.id);
  if (!business) redirect("/espace-pro/etablissement");

  const offer = /^[0-9a-f-]{36}$/i.test(id) ? await getMyOffer(supabase, business.id, id) : null;
  if (!offer) notFound();

  const [subscription, settings, today] = await Promise.all([
    getMySubscription(supabase, user.id),
    getSubscriptionSettings(supabase),
    getToday(),
  ]);
  // Sans abonnement, le formulaire montre les jours de visibilité qu'il restera à payer après la modification.
  const dayPass = !canPublish(user, subscription) && settings ? { dayPrice: settings.dayPrice, today } : undefined;

  return (
    <div className="px-5 pb-8">
      <OfferForm offer={offer} minDate={today} dayPass={dayPass} />
    </div>
  );
}
