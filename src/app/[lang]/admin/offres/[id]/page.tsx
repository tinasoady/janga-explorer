import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireAdmin } from "@/lib/auth";
import { toManaged, type ManagedOfferRow } from "@/lib/managed";
import { getToday } from "@/lib/offers";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { OfferForm } from "../../../espace-pro/offer-form";
import { adminSaveOffer } from "../../actions";

export const metadata: Metadata = { title: "Modifier l'offre (admin)" };

export default function AdminModifierOffrePage({ params }: PageProps<"/admin/offres/[id]">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">Modifier l&apos;offre</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}

async function Content({ params }: { params: PageProps<"/admin/offres/[id]">["params"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: row }, { data: businesses }] = await Promise.all([
    supabase.from("offers").select("*").eq("id", id).maybeSingle<ManagedOfferRow>(),
    supabase.from("businesses").select("id, name").order("name").returns<{ id: string; name: string }[]>(),
  ]);
  const offer = row ? toManaged(row) : null;
  if (!offer) notFound();

  return (
    <div className="px-5 pb-8">
      <OfferForm
        offer={offer}
        minDate={await getToday()}
        action={adminSaveOffer}
        admin={{
          businesses: businesses ?? [],
          defaults: {
            businessId: offer.businessId,
            online: offer.status === "published",
            verified: offer.isVerified,
            featured: offer.isFeatured,
          },
        }}
      />
    </div>
  );
}
