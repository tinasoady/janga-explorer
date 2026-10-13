import type { Metadata } from "next";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { getMyBusiness, getMyProRequest } from "@/lib/pro";
import { proKindToBusinessKind } from "@/lib/pro-request";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Mon établissement" };

export default function EtablissementPage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">Mon établissement</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireProAccess("/espace-pro/etablissement");
  const business = await getMyBusiness(supabase, user.id);
  // Première fiche : on reprend le nom et le type indiqués dans la demande de compte.
  const request = business ? null : await getMyProRequest(supabase, user.id);
  const defaults = request ? { name: request.company, kind: proKindToBusinessKind(request.kind) } : undefined;

  return (
    <div className="px-5 pb-8">
      <BusinessForm business={business} defaults={defaults} />
    </div>
  );
}
