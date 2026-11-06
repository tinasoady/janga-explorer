import type { Metadata } from "next";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireSuperadmin } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getSubscriptionSettings } from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { SettingsForm } from "./settings-form";

const TITLES = {
  fr: { meta: "Tarifs de l'abonnement", heading: "Tarifs et paiement" },
  en: { meta: "Subscription pricing", heading: "Pricing and payment" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

export default async function TarifsPage() {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin/abonnements" />
        <h1 className="text-xl font-extrabold md:text-2xl">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { supabase } = await requireSuperadmin("/admin/abonnements/tarifs");
  const en = (await getLocale()) === "en";
  const settings = await getSubscriptionSettings(supabase);
  if (!settings) throw new Error("Réglages de l'abonnement introuvables : appliquez la migration 20261016000006.");

  return (
    <div className="max-w-xl space-y-4 px-5 pb-8">
      <p className="text-sm text-muted">
        {en
          ? "A month of subscription lasts 30 days. Without a subscription, a business can also pay for a deal's days of visibility (90 days at most). A payment's amount is set when the business declares it: changing a price doesn't affect pending payments or periods already paid."
          : "Un mois d'abonnement dure 30 jours. Sans abonnement, un pro peut aussi payer les jours de visibilité d'une offre (90 jours au plus). Le montant d'un paiement est fixé au moment où le pro le déclare : changer un prix ne modifie ni les paiements en attente, ni les périodes déjà payées."}
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
