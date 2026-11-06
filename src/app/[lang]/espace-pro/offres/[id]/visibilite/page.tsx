import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { FormMessage, Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { addDaysIso, formatAriary, formatLongDate, formatShortDate } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getToday } from "@/lib/offers";
import { getMyBusiness, getMyOffer } from "@/lib/pro";
import {
  canPayPerOffer,
  getMySubscription,
  getSubscriptionSettings,
  MAX_PASS_DAYS,
  passDaysDue,
  paymentMethodLabel,
  type PaymentRow,
} from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { PaymentForm } from "../../../abonnement/payment-form";

const TITLES = {
  fr: { meta: "Visibilité de l'offre", heading: "Payer la visibilité" },
  en: { meta: "Deal visibility", heading: "Pay for visibility" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

export default async function VisibilitePage({ searchParams, params }: PageProps<"/[lang]/espace-pro/offres/[id]/visibilite">) {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const T = messages({
  fr: {
    sent: "Paiement envoyé. Dès qu'il est confirmé, votre offre passe en vérification puis en ligne.",
    until: (date: string) => `Jusqu'au ${date}`,
    pending: (amount: string, days: number, method: string) =>
      `Votre paiement de ${amount} (${days} jours, ${method}) est en cours de vérification. Ensuite, nous vérifions l'offre avec vous et elle passe en ligne.`,
    ended: (date: string) => `Cette offre est terminée depuis le ${date}.`,
    changeDate: "Changez sa date de fin",
    toRepublish: "pour la publier à nouveau.",
    paidUntil: "Les jours de visibilité de cette offre sont payés jusqu'au",
    tooLong: (max: number, days: number) =>
      `Sans abonnement, la visibilité se paie pour ${max} jours au plus. Cette offre en demande ${days}.`,
    closerDate: "Choisissez une date de fin plus proche",
    or: "ou",
    subscribeLink: "abonnez-vous",
    visibility: "Visibilité de cette offre",
    breakdown: (days: number, price: string, from: string, to: string) =>
      `${days} jour${days > 1 ? "s" : ""} × ${price}, du ${from} au ${to} inclus`,
    note: "Les jours se comptent à partir d'aujourd'hui. Après le paiement, nous vérifions l'offre avec vous avant de la mettre en ligne.",
    better: (price: string) =>
      `Pour ${price}, l'abonnement d'un mois vous permet de publier autant d'offres que vous voulez pendant 30 jours.`,
    seeSubscription: "Voir l'abonnement",
    rejected: (r: string) => `Paiement précédent refusé : ${r}`,
  },
  en: {
    sent: "Payment sent. As soon as it's confirmed, your deal goes to review and then live.",
    until: (date: string) => `Until ${date}`,
    pending: (amount: string, days: number, method: string) =>
      `Your payment of ${amount} (${days} days, ${method}) is being checked. Then we'll check the deal with you and it goes live.`,
    ended: (date: string) => `This deal ended on ${date}.`,
    changeDate: "Change its end date",
    toRepublish: "to post it again.",
    paidUntil: "This deal's visibility is paid until",
    tooLong: (max: number, days: number) =>
      `Without a subscription, visibility can be paid for ${max} days at most. This deal needs ${days}.`,
    closerDate: "Choose an earlier end date",
    or: "or",
    subscribeLink: "subscribe",
    visibility: "Visibility for this deal",
    breakdown: (days: number, price: string, from: string, to: string) =>
      `${days} day${days > 1 ? "s" : ""} × ${price}, from ${from} to ${to} inclusive`,
    note: "Days are counted from today. After payment, we check the deal with you before it goes live.",
    better: (price: string) =>
      `For ${price}, a one-month subscription lets you post as many deals as you like for 30 days.`,
    seeSubscription: "See the subscription",
    rejected: (r: string) => `Previous payment rejected: ${r}`,
  },
});

type Props = Pick<PageProps<"/[lang]/espace-pro/offres/[id]/visibilite">, "params" | "searchParams">;

async function Content({ params, searchParams }: Props) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { user, supabase } = await requireProAccess(`/espace-pro/offres/${id}/visibilite`);
  const locale = await getLocale();
  const t = T[locale];
  const business = await getMyBusiness(supabase, user.id);
  if (!business) redirect("/espace-pro/etablissement");

  const offer = /^[0-9a-f-]{36}$/i.test(id) ? await getMyOffer(supabase, business.id, id) : null;
  if (!offer) notFound();

  const [subscription, settings, today, { data: payments }] = await Promise.all([
    getMySubscription(supabase, user.id),
    getSubscriptionSettings(supabase),
    getToday(),
    supabase
      .from("subscription_payments")
      .select("*")
      .eq("offer_id", offer.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<PaymentRow[]>(),
  ]);
  if (!settings || !canPayPerOffer(subscription)) redirect("/espace-pro/abonnement");

  const days = passDaysDue(offer, today);
  const amount = days * settings.dayPrice;
  // Premier jour à payer : aujourd'hui, ou le lendemain des jours déjà payés.
  const firstDay = days > 0 ? addDaysIso(offer.validUntil, -(days - 1)) : today;
  const pending = payments?.find((p) => p.status === "pending");
  const lastRejected = payments?.[0]?.status === "rejected" ? payments[0] : null;
  const numbers = Object.fromEntries(Object.entries(settings.numbers).filter(([, n]) => n));

  return (
    <div className="space-y-5 px-5 pb-8">
      {query.envoye === "1" && (
        <FormMessage info={t.sent} />
      )}

      <section className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
          <Image src={offer.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="line-clamp-2 leading-snug font-bold">{offer.title}</h2>
          <p className="text-sm font-extrabold text-brand">{formatAriary(offer.priceOffer, locale)}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {t.until(formatShortDate(offer.validUntil, locale))}
          </p>
        </div>
      </section>

      {pending ? (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4" role="status">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-sm">
            {t.pending(formatAriary(pending.amount, locale), pending.days ?? 0, paymentMethodLabel(pending.method))}
          </p>
        </div>
      ) : days === 0 ? (
        offer.validUntil < today ? (
          <p className="rounded-2xl bg-surface p-4 text-sm">
            {t.ended(formatLongDate(offer.validUntil, locale))}{" "}
            <Link href={`/espace-pro/offres/${offer.id}`} className="font-bold text-brand">
              {t.changeDate}
            </Link>{" "}
            {t.toRepublish}
          </p>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-verified/10 p-4" role="status">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-verified" aria-hidden />
            <p className="text-sm">
              {t.paidUntil} <strong>{formatLongDate(offer.passUntil ?? offer.validUntil, locale)}</strong>.
            </p>
          </div>
        )
      ) : days > MAX_PASS_DAYS ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm">
          {t.tooLong(MAX_PASS_DAYS, days)}{" "}
          <Link href={`/espace-pro/offres/${offer.id}`} className="font-bold text-brand">
            {t.closerDate}
          </Link>{" "}
          {t.or}{" "}
          <Link href="/espace-pro/abonnement" className="font-bold text-brand">
            {t.subscribeLink}
          </Link>
          .
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-line p-4">
            <p className="text-sm text-muted">{t.visibility}</p>
            <p className="mt-1 text-2xl font-extrabold">{formatAriary(amount, locale)}</p>
            <p className="text-sm text-ink/80">
              {t.breakdown(
                days,
                formatAriary(settings.dayPrice, locale),
                formatShortDate(firstDay, locale),
                formatShortDate(offer.validUntil, locale),
              )}
            </p>
            <p className="mt-2 text-xs text-muted">{t.note}</p>
          </section>

          {amount >= settings.monthlyPrice && (
            <div className="flex items-start gap-3 rounded-2xl bg-sea/10 p-4 text-sm">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-sea" aria-hidden />
              <p>
                {t.better(formatAriary(settings.monthlyPrice, locale))}{" "}
                <Link href="/espace-pro/abonnement" className="font-bold text-sea-dark">
                  {t.seeSubscription}
                </Link>
              </p>
            </div>
          )}

          {lastRejected?.rejection_reason && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {t.rejected(lastRejected.rejection_reason)}
            </p>
          )}

          <PaymentForm
            monthlyPrice={settings.monthlyPrice}
            offer={{ id: offer.id, days, amount }}
            accountName={settings.accountName}
            numbers={numbers}
          />
        </>
      )}
    </div>
  );
}
