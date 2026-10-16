import type { Metadata } from "next";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireSuperadmin } from "@/lib/auth";
import { getSubscriptionSettings } from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Tarifs de l'abonnement" };

export default function TarifsPage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin/abonnements" />
        <h1 className="text-xl font-extrabold md:text-2xl">Tarifs et paiement</h1>
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
  const settings = await getSubscriptionSettings(supabase);
  if (!settings) throw new Error("Réglages de l'abonnement introuvables : appliquez la migration 20261016000006.");

  return (
    <div className="max-w-xl space-y-4 px-5 pb-8">
      <p className="text-sm text-muted">
        Un mois d&apos;abonnement dure 30 jours. Le montant d&apos;un paiement est fixé au moment où le pro le déclare :
        changer le prix ne modifie ni les paiements en attente, ni les périodes déjà payées.
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
