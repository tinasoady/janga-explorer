import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CalendarDays, MapPin, MessageCircle, Pencil, Phone, Plus, Star, UserCheck, Users } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { inputClass, secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { formatAriary, formatShortDate, whatsappLink } from "@/lib/format";
import {
  toManaged,
  type ManagedBusinessRow,
  type ManagedOffer,
  type ManagedOfferRow,
} from "@/lib/managed";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { publishUnverified, publishVerified, rejectOffer, toggleFeatured, unpublishOffer } from "./actions";

export const metadata: Metadata = { title: "Administration" };

type ModerationRow = ManagedOfferRow & { business: ManagedBusinessRow };
type ModerationItem = { offer: ManagedOffer; business: ManagedBusinessRow };

export default function AdminPage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">Administration</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Queue />
      </Suspense>
    </>
  );
}

async function loadItems(supabase: SupabaseClient, status: "pending" | "published", limit: number) {
  const { data, error } = await supabase
    .from("offers")
    .select("*, business:businesses(id, name, kind, whatsapp, phone)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" }) // les plus anciennes d'abord dans la file d'attente
    .limit(limit)
    .returns<ModerationRow[]>();
  if (error) throw new Error(`Chargement impossible : ${error.message}`);

  return data.flatMap(({ business, ...row }): ModerationItem[] => {
    const offer = toManaged(row);
    return offer ? [{ offer, business }] : [];
  });
}

/** Demandes de compte pro en attente de vérification (le superadmin seul peut les lire). */
async function countPendingRequests(supabase: SupabaseClient) {
  const { count } = await supabase
    .from("pro_requests")
    .select("user_id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

async function Queue() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireAdmin();
  const [pending, published, requestCount] = await Promise.all([
    loadItems(supabase, "pending", 100),
    loadItems(supabase, "published", 50),
    user.role === "superadmin" ? countPendingRequests(supabase) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-8 px-5 pb-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/offres/nouvelle"
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/30"
        >
          <Plus className="size-4" aria-hidden />
          Créer une offre
        </Link>
        {user.role === "superadmin" && (
          <>
            <Link href="/admin/demandes" className={secondaryButtonClass}>
              <UserCheck className="size-4" aria-hidden />
              Demandes de compte pro
              {requestCount > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{requestCount}</span>
              )}
            </Link>
            <Link href="/admin/equipe" className={secondaryButtonClass}>
              <Users className="size-4" aria-hidden />
              Équipe d&apos;administration
            </Link>
          </>
        )}
      </div>

      <section>
        <h2 className="text-lg font-extrabold">À valider ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">Aucune offre en attente.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {pending.map((item) => (
              <li key={item.offer.id}>
                <ModerationCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-extrabold">En ligne ({published.length})</h2>
        {published.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">Aucune offre en ligne.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {published.map((item) => (
              <li key={item.offer.id}>
                <ModerationCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ModerationCard({ item: { offer, business } }: { item: ModerationItem }) {
  const published = offer.status === "published";
  const contactMessage = `Bonjour, c'est Janga Explorer. Nous souhaitons confirmer votre offre « ${offer.title} » (${formatAriary(offer.priceOffer)}, jusqu'au ${formatShortDate(offer.validUntil)}).`;

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
          <Image src={offer.imageUrl} alt="" fill sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="leading-snug font-bold">{offer.title}</h3>
          <p className="truncate text-sm text-muted">
            {business.name} · {business.kind}
          </p>
          <p className="flex flex-wrap items-baseline gap-x-2">
            {offer.priceOriginal && (
              <span className="text-xs text-muted line-through">{formatAriary(offer.priceOriginal)}</span>
            )}
            <span className="font-extrabold text-brand">{formatAriary(offer.priceOffer)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            Jusqu&apos;au {formatShortDate(offer.validUntil)}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{offer.location}</span>
          </p>
        </div>
      </div>

      <p className="text-sm">{offer.description}</p>
      {offer.conditions && <p className="text-sm text-muted">Conditions : {offer.conditions}</p>}

      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <Link href={`/admin/offres/${offer.id}`} className={secondaryButtonClass}>
          <Pencil className="size-4" aria-hidden />
          Modifier
        </Link>
        {business.whatsapp && (
          <a
            href={whatsappLink(business.whatsapp, contactMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButtonClass}
          >
            <MessageCircle className="size-4 text-verified" aria-hidden />
            Contacter
          </a>
        )}
        {business.phone && (
          <a href={`tel:${business.phone.replace(/\s/g, "")}`} className={secondaryButtonClass}>
            <Phone className="size-4" aria-hidden />
            {business.phone}
          </a>
        )}
      </div>

      <form className="space-y-2 border-t border-line pt-3">
        <input type="hidden" name="id" value={offer.id} />
        {published ? (
          <p className="text-xs font-semibold text-muted">
            {offer.isVerified ? "Offre vérifiée" : "Sans badge de vérification"}
            {offer.isFeatured && " · À la une"}
          </p>
        ) : (
          <input name="reason" maxLength={300} placeholder="Motif du refus (visible par l'établissement)" className={inputClass} />
        )}
        <div className="flex flex-wrap gap-2">
          {published ? (
            <>
              <SubmitButton formAction={publishVerified} className={secondaryButtonClass}>
                {offer.isVerified ? "Revérifiée aujourd'hui" : "Ajouter le badge"}
              </SubmitButton>
              <input type="hidden" name="featured" value={String(!offer.isFeatured)} />
              <SubmitButton formAction={toggleFeatured} className={secondaryButtonClass}>
                <Star className="size-4" aria-hidden />
                {offer.isFeatured ? "Retirer de la une" : "Mettre à la une"}
              </SubmitButton>
              <SubmitButton formAction={unpublishOffer} className={`${secondaryButtonClass} text-red-700`}>
                Dépublier
              </SubmitButton>
            </>
          ) : (
            <>
              <SubmitButton
                formAction={publishVerified}
                className="flex items-center justify-center gap-2 rounded-full bg-verified px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Publier · vérifiée
              </SubmitButton>
              <SubmitButton formAction={publishUnverified} className={secondaryButtonClass}>
                Publier sans badge
              </SubmitButton>
              <SubmitButton formAction={rejectOffer} className={`${secondaryButtonClass} text-red-700`}>
                Refuser
              </SubmitButton>
            </>
          )}
        </div>
      </form>
    </article>
  );
}
