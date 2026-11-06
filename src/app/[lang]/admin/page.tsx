import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CalendarDays, CreditCard, MapPin, MessageCircle, Pencil, Phone, Plus, Star, UserCheck, Users } from "lucide-react";
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
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { publishUnverified, publishVerified, rejectOffer, toggleFeatured, unpublishOffer } from "./actions";

const TITLES = {
  fr: { meta: "Administration", heading: "Administration" },
  en: { meta: "Administration", heading: "Administration" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

const T = messages({
  fr: {
    create: "Créer une offre",
    subscriptions: "Abonnements",
    requests: "Demandes de compte pro",
    team: "Équipe d'administration",
    toReview: (n: number) => `À valider (${n})`,
    noPending: "Aucune offre en attente.",
    live: (n: number) => `En ligne (${n})`,
    noLive: "Aucune offre en ligne.",
    until: (date: string) => `Jusqu'au ${date}`,
    conditions: (c: string) => `Conditions : ${c}`,
    tickets: "Billets",
    presale: "prévente",
    door: "sur place",
    presaleUntil: (date: string) => `Prévente jusqu'au ${date}`,
    edit: "Modifier",
    contact: "Contacter",
    verified: "Offre vérifiée",
    noBadge: "Sans badge de vérification",
    featured: " · À la une",
    reasonPlaceholder: "Motif du refus (visible par l'établissement)",
    recheck: "Revérifiée aujourd'hui",
    addBadge: "Ajouter le badge",
    unfeature: "Retirer de la une",
    feature: "Mettre à la une",
    unpublish: "Dépublier",
    publishVerified: "Publier · vérifiée",
    publishPlain: "Publier sans badge",
    reject: "Refuser",
  },
  en: {
    create: "Create a deal",
    subscriptions: "Subscriptions",
    requests: "Business account requests",
    team: "Admin team",
    toReview: (n: number) => `To review (${n})`,
    noPending: "No deals waiting.",
    live: (n: number) => `Live (${n})`,
    noLive: "No live deals.",
    until: (date: string) => `Until ${date}`,
    conditions: (c: string) => `Conditions: ${c}`,
    tickets: "Tickets",
    presale: "presale",
    door: "at the door",
    presaleUntil: (date: string) => `Presale until ${date}`,
    edit: "Edit",
    contact: "Contact",
    verified: "Verified deal",
    noBadge: "No verification badge",
    featured: " · Featured",
    reasonPlaceholder: "Reason for rejection (shown to the business)",
    recheck: "Checked again today",
    addBadge: "Add the badge",
    unfeature: "Remove from featured",
    feature: "Feature",
    unpublish: "Unpublish",
    publishVerified: "Publish · verified",
    publishPlain: "Publish without badge",
    reject: "Reject",
  },
});

type Text = (typeof T)["fr"];

type ModerationRow = ManagedOfferRow & { business: ManagedBusinessRow };
type ModerationItem = { offer: ManagedOffer; business: ManagedBusinessRow };

export default async function AdminPage() {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">{heading}</h1>
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

/** Paiements d'abonnement déclarés par les pros, à confirmer (tous les administrateurs). */
async function countPendingPayments(supabase: SupabaseClient) {
  const { count } = await supabase
    .from("subscription_payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

async function Queue() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireAdmin();
  const locale = await getLocale();
  const t = T[locale];
  const [pending, published, requestCount, paymentCount] = await Promise.all([
    loadItems(supabase, "pending", 100),
    loadItems(supabase, "published", 50),
    user.role === "superadmin" ? countPendingRequests(supabase) : Promise.resolve(0),
    countPendingPayments(supabase),
  ]);

  return (
    <div className="space-y-8 px-5 pb-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/offres/nouvelle"
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/30"
        >
          <Plus className="size-4" aria-hidden />
          {t.create}
        </Link>
        <Link href="/admin/abonnements" className={secondaryButtonClass}>
          <CreditCard className="size-4" aria-hidden />
          {t.subscriptions}
          {paymentCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{paymentCount}</span>
          )}
        </Link>
        {user.role === "superadmin" && (
          <>
            <Link href="/admin/demandes" className={secondaryButtonClass}>
              <UserCheck className="size-4" aria-hidden />
              {t.requests}
              {requestCount > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{requestCount}</span>
              )}
            </Link>
            <Link href="/admin/equipe" className={secondaryButtonClass}>
              <Users className="size-4" aria-hidden />
              {t.team}
            </Link>
          </>
        )}
      </div>

      <section>
        <h2 className="text-lg font-extrabold">{t.toReview(pending.length)}</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">{t.noPending}</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {pending.map((item) => (
              <li key={item.offer.id}>
                <ModerationCard item={item} t={t} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-extrabold">{t.live(published.length)}</h2>
        {published.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">{t.noLive}</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {published.map((item) => (
              <li key={item.offer.id}>
                <ModerationCard item={item} t={t} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ModerationCard({ item: { offer, business }, t, locale }: { item: ModerationItem; t: Text; locale: Locale }) {
  const published = offer.status === "published";
  // Message envoyé à l'établissement : en français, la langue de travail avec les professionnels de Mahajanga.
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
              <span className="text-xs text-muted line-through">{formatAriary(offer.priceOriginal, locale)}</span>
            )}
            <span className="font-extrabold text-brand">{formatAriary(offer.priceOffer, locale)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {t.until(formatShortDate(offer.validUntil, locale))}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{offer.location}</span>
          </p>
        </div>
      </div>

      <p className="text-sm">{offer.description}</p>
      {offer.conditions && <p className="text-sm text-muted">{t.conditions(offer.conditions)}</p>}
      {offer.tickets && (
        // Tous les tarifs à confirmer avec l'établissement avant de publier.
        <div className="rounded-xl bg-surface p-3 text-sm">
          <p className="text-xs font-semibold text-muted">
            {t.tickets}
            {offer.presaleUntil && ` · ${t.presaleUntil(formatShortDate(offer.presaleUntil, locale))}`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {offer.tickets.map((tier) => (
              <li key={tier.label}>
                <span className="font-semibold">{tier.label}</span>
                {tier.presale !== null && ` · ${formatAriary(tier.presale, locale)} ${t.presale}`}
                {tier.door !== null && ` · ${formatAriary(tier.door, locale)} ${t.door}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <Link href={`/admin/offres/${offer.id}`} className={secondaryButtonClass}>
          <Pencil className="size-4" aria-hidden />
          {t.edit}
        </Link>
        {business.whatsapp && (
          <a
            href={whatsappLink(business.whatsapp, contactMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButtonClass}
          >
            <MessageCircle className="size-4 text-verified" aria-hidden />
            {t.contact}
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
            {offer.isVerified ? t.verified : t.noBadge}
            {offer.isFeatured && t.featured}
          </p>
        ) : (
          <input name="reason" maxLength={300} placeholder={t.reasonPlaceholder} className={inputClass} />
        )}
        <div className="flex flex-wrap gap-2">
          {published ? (
            <>
              <SubmitButton formAction={publishVerified} className={secondaryButtonClass}>
                {offer.isVerified ? t.recheck : t.addBadge}
              </SubmitButton>
              <input type="hidden" name="featured" value={String(!offer.isFeatured)} />
              <SubmitButton formAction={toggleFeatured} className={secondaryButtonClass}>
                <Star className="size-4" aria-hidden />
                {offer.isFeatured ? t.unfeature : t.feature}
              </SubmitButton>
              <SubmitButton formAction={unpublishOffer} className={`${secondaryButtonClass} text-red-700`}>
                {t.unpublish}
              </SubmitButton>
            </>
          ) : (
            <>
              <SubmitButton
                formAction={publishVerified}
                className="flex items-center justify-center gap-2 rounded-full bg-verified px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {t.publishVerified}
              </SubmitButton>
              <SubmitButton formAction={publishUnverified} className={secondaryButtonClass}>
                {t.publishPlain}
              </SubmitButton>
              <SubmitButton formAction={rejectOffer} className={`${secondaryButtonClass} text-red-700`}>
                {t.reject}
              </SubmitButton>
            </>
          )}
        </div>
      </form>
    </article>
  );
}
