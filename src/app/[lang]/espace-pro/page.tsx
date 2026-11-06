import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Clock, Eye, Lock, MapPin, MessageCircle, Pencil, Phone, Plus, Store, Wallet, XCircle } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { hasProAccess, requireUser } from "@/lib/auth";
import { addDaysIso, formatAriary, formatShortDate } from "@/lib/format";
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { STATUS_LABEL, type ManagedOffer } from "@/lib/managed";
import { getToday } from "@/lib/offers";
import { getMyBusiness, getMyOffers, getMyProRequest, type MyProRequest } from "@/lib/pro";
import { proKindLabel } from "@/lib/pro-request";
import { EMPTY_STATS, getOfferStats, STATS_DAYS, type OfferStats } from "@/lib/stats";
import { canPayPerOffer, canPublish, getMySubscription, getSubscriptionSettings } from "@/lib/subscription";
import { hasSeveralPrices } from "@/lib/tickets";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { archiveOffer, deleteOffer, resubmitOffer } from "./actions";
import { SubscriptionStatus } from "./subscription-status";

const T = messages({
  fr: {
    title: "Mon espace pro",
    createTitle: "Présentez votre établissement",
    createText:
      "Restaurant, hôtel, agence d'excursions, bar… Indiquez son nom et comment les clients vous joignent, puis publiez vos offres.",
    createCta: "Créer mon établissement",
    edit: "Modifier",
    publish: "Publier une offre",
    perDay: (price: string) => `Sans abonnement, vous payez ${price} par jour de visibilité de l'offre.`,
    orSubscribe: "Ou abonnez-vous",
    stats: "Statistiques",
    views: "Vues de vos offres",
    contacts: "Clients qui vous ont contacté",
    overDays: (n: number) => `sur ${n} jours`,
    contactsDetail: (n: number) => `WhatsApp et appels, sur ${n} jours`,
    myOffers: "Mes offres",
    noOffers: "Vous n'avez pas encore d'offre. Chaque offre est relue avant d'apparaître sur Janga Explorer.",
    lockedTitle: "Publication en pause",
    lockedText: "Votre abonnement est annulé. Contactez Janga Explorer pour le réactiver.",
    proOnlyTitle: "Espace réservé aux professionnels",
    proOnlyText: "Les comptes professionnels sont créés sur demande, après vérification de l'établissement.",
    proOnlyCta: "Faire une demande de compte pro",
    rejectedTitle: "Votre demande n'a pas été retenue",
    pendingTitle: "Votre demande est en cours de vérification",
    pendingText:
      "Nous vérifions votre établissement, parfois par téléphone ou WhatsApp. Dès que c'est fait, vous pourrez publier vos offres depuis cette page.",
    business: "Établissement",
    activity: "Activité",
    locality: "Localité",
    capacity: "Capacité",
    ended: "Terminée",
    paying: "Paiement en vérification",
    toPay: "Visibilité à payer",
    until: (date: string) => `Jusqu'au ${date}`,
    from: "dès",
    verified: "Offre vérifiée",
    statsLabel: (n: number) => `Statistiques des ${n} derniers jours`,
    statViews: "vues",
    statCalls: "appels",
    statMaps: "itinéraires",
    payVisibility: "Payer la visibilité",
    reason: (r: string) => `Motif : ${r}`,
    editWarning: "Modifier une offre en ligne la repasse en validation : elle est retirée du site le temps de la relecture.",
    withdraw: "Retirer",
    resubmit: "Soumettre à nouveau",
    remove: "Supprimer",
  },
  en: {
    title: "My business space",
    createTitle: "Tell us about your business",
    createText:
      "Restaurant, hotel, excursion agency, bar… Enter its name and how customers can reach you, then post your deals.",
    createCta: "Create my business",
    edit: "Edit",
    publish: "Post a deal",
    perDay: (price: string) => `Without a subscription, you pay ${price} per day the deal is visible.`,
    orSubscribe: "Or subscribe",
    stats: "Statistics",
    views: "Views of your deals",
    contacts: "Customers who contacted you",
    overDays: (n: number) => `over ${n} days`,
    contactsDetail: (n: number) => `WhatsApp and calls, over ${n} days`,
    myOffers: "My deals",
    noOffers: "You don't have any deals yet. Every deal is reviewed before it appears on Janga Explorer.",
    lockedTitle: "Posting paused",
    lockedText: "Your subscription has been cancelled. Contact Janga Explorer to reactivate it.",
    proOnlyTitle: "For businesses only",
    proOnlyText: "Business accounts are created on request, after we've checked the business.",
    proOnlyCta: "Request a business account",
    rejectedTitle: "Your request wasn't accepted",
    pendingTitle: "Your request is being reviewed",
    pendingText:
      "We're checking your business, sometimes by phone or WhatsApp. Once that's done, you'll be able to post your deals from this page.",
    business: "Business",
    activity: "Type",
    locality: "Location",
    capacity: "Capacity",
    ended: "Ended",
    paying: "Payment being checked",
    toPay: "Visibility to pay",
    until: (date: string) => `Until ${date}`,
    from: "from",
    verified: "Verified deal",
    statsLabel: (n: number) => `Statistics for the last ${n} days`,
    statViews: "views",
    statCalls: "calls",
    statMaps: "directions",
    payVisibility: "Pay for visibility",
    reason: (r: string) => `Reason: ${r}`,
    editWarning: "Editing a live deal sends it back for review: it's taken off the site while we check it.",
    withdraw: "Withdraw",
    resubmit: "Submit again",
    remove: "Delete",
  },
});

type Text = (typeof T)["fr"];

export async function generateMetadata(): Promise<Metadata> {
  return { title: T[await getLocale()].title };
}

export default async function EspaceProPage() {
  const t = T[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">{t.title}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-48 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

const STATUS_TONE: Record<string, string> = {
  published: "bg-verified/10 text-verified",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-surface text-muted",
  draft: "bg-surface text-muted",
};

async function Dashboard() {
  if (!isSupabaseConfigured()) return <Unavailable />;

  const { user, supabase } = await requireUser("/espace-pro");
  const locale = await getLocale();
  const t = T[locale];

  // Compte pro pas encore approuvé : on montre où en est la demande plutôt que le tableau de bord.
  if (!hasProAccess(user)) {
    return <RequestStatus request={await getMyProRequest(supabase, user.id)} t={t} locale={locale} />;
  }

  const [business, subscription, settings] = await Promise.all([
    getMyBusiness(supabase, user.id),
    getMySubscription(supabase, user.id),
    getSubscriptionSettings(supabase),
  ]);
  const publishable = canPublish(user, subscription);
  // Sans abonnement actif, le pro peut quand même publier en payant les jours de visibilité de chaque offre.
  const payPerOffer = !publishable && canPayPerOffer(subscription);
  const banner = subscription && <SubscriptionStatus subscription={subscription} compact />;

  if (!business) {
    return (
      <div className="space-y-4 px-5 pb-8">
        {banner}
        <div className="rounded-2xl bg-surface p-6 text-center">
          <Store className="mx-auto size-10 text-brand" aria-hidden />
          <p className="mt-3 font-bold">{t.createTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.createText}</p>
          <Link
            href="/espace-pro/etablissement"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white"
          >
            {t.createCta}
          </Link>
        </div>
      </div>
    );
  }

  const [offers, today, { data: pendingPasses }] = await Promise.all([
    getMyOffers(supabase, business.id),
    getToday(),
    supabase.from("subscription_payments").select("offer_id").eq("kind", "offer").eq("status", "pending"),
  ]);
  const paying = new Set((pendingPasses ?? []).map((p: { offer_id: string | null }) => p.offer_id));
  const stats = await getOfferStats(
    supabase,
    offers.map((o) => o.id),
    addDaysIso(today, -(STATS_DAYS - 1)),
  );
  const total = [...stats.values()].reduce(
    (sum, s) => ({ views: sum.views + s.views, contacts: sum.contacts + s.whatsapp + s.calls }),
    { views: 0, contacts: 0 },
  );

  return (
    <div className="space-y-5 px-5 pb-8">
      {banner}

      <section className="flex items-start gap-3 rounded-2xl border border-line p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Store className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{business.name}</p>
          <p className="truncate text-sm text-muted">{business.kind}</p>
        </div>
        <Link href="/espace-pro/etablissement" className="text-sm font-semibold text-brand">
          {t.edit}
        </Link>
      </section>

      {publishable || payPerOffer ? (
        <div className="space-y-2">
          <Link
            href="/espace-pro/offres/nouvelle"
            className="flex items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-white shadow-md shadow-brand/30"
          >
            <Plus className="size-5" aria-hidden />
            {t.publish}
          </Link>
          {payPerOffer && settings && (
            <p className="text-center text-xs text-muted">
              {t.perDay(formatAriary(settings.dayPrice, locale))}{" "}
              <Link href="/espace-pro/abonnement" className="font-semibold text-brand">
                {t.orSubscribe}
              </Link>
            </p>
          )}
        </div>
      ) : (
        <PublishLocked t={t} />
      )}

      {offers.length > 0 && (
        <section aria-label={t.stats} className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-semibold text-muted">{t.views}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{total.views}</p>
            <p className="text-xs text-muted">{t.overDays(STATS_DAYS)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-semibold text-muted">{t.contacts}</p>
            <p className="mt-1 text-2xl font-extrabold text-verified tabular-nums">{total.contacts}</p>
            <p className="text-xs text-muted">{t.contactsDetail(STATS_DAYS)}</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-extrabold">{t.myOffers}</h2>
        {offers.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">{t.noOffers}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferItem
                  offer={offer}
                  today={today}
                  canSubmit={publishable || payPerOffer}
                  paying={paying.has(offer.id)}
                  stats={stats.get(offer.id) ?? EMPTY_STATS}
                  t={t}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Remplace le bouton « Publier une offre » quand l'abonnement a été annulé par Janga Explorer. */
function PublishLocked({ t }: { t: Text }) {
  return (
    <div className="space-y-2 rounded-2xl bg-surface p-4 text-center">
      <p className="flex items-center justify-center gap-2 font-bold">
        <Lock className="size-4" aria-hidden />
        {t.lockedTitle}
      </p>
      <p className="text-sm text-muted">{t.lockedText}</p>
    </div>
  );
}

function RequestStatus({ request, t, locale }: { request: MyProRequest | null; t: Text; locale: Locale }) {
  if (!request) {
    return (
      <div className="px-5 pb-8">
        <div className="rounded-2xl bg-surface p-6 text-center">
          <Store className="mx-auto size-10 text-brand" aria-hidden />
          <p className="mt-3 font-bold">{t.proOnlyTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.proOnlyText}</p>
          <Link
            href="/connexion?mode=inscription"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white"
          >
            {t.proOnlyCta}
          </Link>
        </div>
      </div>
    );
  }

  const rejected = request.status === "rejected";
  const Icon = rejected ? XCircle : Clock;

  return (
    <div className="space-y-4 px-5 pb-8">
      <div
        className={`rounded-2xl p-6 text-center ${rejected ? "bg-red-50" : "bg-amber-50"}`}
        role="status"
      >
        <Icon className={`mx-auto size-10 ${rejected ? "text-red-600" : "text-amber-600"}`} aria-hidden />
        <p className="mt-3 font-bold">{rejected ? t.rejectedTitle : t.pendingTitle}</p>
        <p className="mt-1 text-sm text-ink/80">{rejected ? request.rejectionReason : t.pendingText}</p>
      </div>

      <dl className="space-y-2 rounded-2xl border border-line p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.business}</dt>
          <dd className="text-right font-semibold">{request.company}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.activity}</dt>
          <dd className="text-right font-semibold">{proKindLabel(request.kind, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.locality}</dt>
          <dd className="text-right font-semibold">{request.locality}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.capacity}</dt>
          <dd className="text-right font-semibold">{request.capacity}</dd>
        </div>
      </dl>
    </div>
  );
}

function OfferItem({
  offer,
  today,
  canSubmit,
  paying,
  stats,
  t,
  locale,
}: {
  offer: ManagedOffer;
  today: string;
  canSubmit: boolean;
  /** Un paiement de visibilité de cette offre attend la confirmation d'un admin. */
  paying: boolean;
  stats: OfferStats;
  t: Text;
  locale: Locale;
}) {
  const expired = offer.status === "published" && offer.validUntil < today;
  const canResubmit = canSubmit && (offer.status === "archived" || offer.status === "rejected");
  // Côté pro, un brouillon est une offre publiée sans abonnement dont les jours de visibilité restent à payer.
  const toPay = offer.status === "draft";
  const statusLabel = expired ? t.ended : toPay ? (paying ? t.paying : t.toPay) : STATUS_LABEL[locale][offer.status];
  const statusTone = expired ? STATUS_TONE.archived : toPay ? STATUS_TONE.pending : STATUS_TONE[offer.status];
  const hasStats = stats.views + stats.whatsapp + stats.calls + stats.maps > 0;
  const canArchive = offer.status === "published" || offer.status === "pending";

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
          <Image src={offer.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 leading-snug font-bold">{offer.title}</h3>
          <p className="text-sm font-extrabold text-brand">
            {hasSeveralPrices(offer) && <span className="mr-1 text-xs font-semibold text-muted">{t.from}</span>}
            {formatAriary(offer.priceOffer, locale)}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {t.until(formatShortDate(offer.validUntil, locale))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone}`}>{statusLabel}</span>
        {offer.status === "published" && offer.isVerified && (
          <span className="text-xs font-semibold text-verified">{t.verified}</span>
        )}
      </div>

      {hasStats && (
        <ul
          aria-label={t.statsLabel(STATS_DAYS)}
          className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-surface px-3 py-2 text-xs text-ink/80"
        >
          <StatItem icon={Eye} value={stats.views} label={t.statViews} />
          <StatItem icon={MessageCircle} value={stats.whatsapp} label="WhatsApp" />
          <StatItem icon={Phone} value={stats.calls} label={t.statCalls} />
          <StatItem icon={MapPin} value={stats.maps} label={t.statMaps} />
        </ul>
      )}

      {toPay && !paying && (
        <Link
          href={`/espace-pro/offres/${offer.id}/visibilite`}
          className="flex items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-sm font-bold text-white"
        >
          <Wallet className="size-4" aria-hidden />
          {t.payVisibility}
        </Link>
      )}

      {offer.status === "rejected" && offer.rejectionReason && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{t.reason(offer.rejectionReason)}</p>
      )}
      {offer.status === "published" && !expired && <p className="text-xs text-muted">{t.editWarning}</p>}

      <div className="flex flex-wrap gap-2">
        <Link href={`/espace-pro/offres/${offer.id}`} className={secondaryButtonClass}>
          <Pencil className="size-4" aria-hidden />
          {t.edit}
        </Link>
        {canArchive && (
          <form action={archiveOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton className={secondaryButtonClass}>{t.withdraw}</SubmitButton>
          </form>
        )}
        {canResubmit && (
          <form action={resubmitOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton className={secondaryButtonClass}>{t.resubmit}</SubmitButton>
          </form>
        )}
        <form action={deleteOffer}>
          <input type="hidden" name="id" value={offer.id} />
          <SubmitButton className={`${secondaryButtonClass} text-red-700`}>{t.remove}</SubmitButton>
        </form>
      </div>
    </article>
  );
}

function StatItem({ icon: Icon, value, label }: { icon: typeof Eye; value: number; label: string }) {
  return (
    <li className="flex items-center gap-1">
      <Icon className="size-3.5 text-muted" aria-hidden />
      <span className="font-bold tabular-nums">{value}</span> {label}
    </li>
  );
}
