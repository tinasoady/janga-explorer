import type { Metadata } from "next";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireAdmin } from "@/lib/auth";
import { getToday } from "@/lib/offers";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { OfferForm } from "../../../espace-pro/offer-form";
import { adminSaveOffer } from "../../actions";

export const metadata: Metadata = { title: "Nouvelle offre (admin)" };

export default function AdminNouvelleOffrePage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">Nouvelle offre</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("businesses")
    .select("id, name")
    .order("name")
    .returns<{ id: string; name: string }[]>();

  return (
    <div className="px-5 pb-8">
      <OfferForm
        offer={null}
        minDate={await getToday()}
        action={adminSaveOffer}
        admin={{
          businesses: data ?? [],
          defaults: { businessId: "", online: true, verified: false, featured: false },
        }}
      />
    </div>
  );
}
