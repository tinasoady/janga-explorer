import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Clock } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { FormMessage, Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { dateOf, formatAriary, formatShortDate } from "@/lib/format";
import {
  getMyPayments,
  getMySubscription,
  getSubscriptionSettings,
  PAYMENT_STATUS_LABEL,
  paymentLabel,
  paymentMethodLabel,
  type PaymentRow,
} from "@/lib/subscription";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { SubscriptionStatus } from "../subscription-status";
import { PaymentForm } from "./payment-form";

const TITLES = {
  fr: { meta: "Mon abonnement", heading: "Mon abonnement" },
  en: { meta: "My subscription", heading: "My subscription" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

export default async function AbonnementPage({ searchParams }: PageProps<"/[lang]/espace-pro/abonnement">) {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const T = messages({
  fr: {
    none: "Aucun abonnement n'est associé à ce compte. Les comptes administrateurs publient sans abonnement.",
    sent: "Paiement envoyé. Nous le vérifions et votre abonnement est prolongé dès sa confirmation.",
    plan: "Abonnement Janga Explorer",
    perMonth: "/ mois",
    perks: [
      "Offres illimitées pendant la période payée",
      "Sans commission sur vos ventes",
      "Payer pendant l'essai ou avant l'échéance ne fait rien perdre : la période s'ajoute à la suite.",
    ],
    daily: "Sans abonnement : à la durée",
    perDay: "/ jour et par offre",
    dailyText:
      "Pour un événement ou une promotion de quelques jours : publiez votre offre, puis payez seulement ses jours de visibilité.",
    subscribe: "M'abonner",
    extend: "Prolonger",
    renew: "Renouveler",
    pending: (amount: string, months: string, method: string) =>
      `Votre paiement de ${amount} (${months}, ${method}) est en cours de vérification. Votre abonnement sera prolongé dès sa confirmation.`,
    history: "Mes paiements",
    meta: (method: string, ref: string, date: string) => `${method} · réf. ${ref} · déclaré le ${date}`,
    visibleUntil: (date: string) => `Offre visible jusqu'au ${date}`,
    deleted: "Offre supprimée depuis",
    period: (from: string, to: string) => `Période : du ${from} au ${to}`,
    reason: (r: string) => `Motif : ${r}`,
  },
  en: {
    none: "No subscription is linked to this account. Admin accounts post without a subscription.",
    sent: "Payment sent. We're checking it, and your subscription is extended as soon as it's confirmed.",
    plan: "Janga Explorer subscription",
    perMonth: "/ month",
    perks: [
      "Unlimited deals during the paid period",
      "No commission on your sales",
      "Paying during the trial or before the due date costs you nothing: the new period is added on top.",
    ],
    daily: "Without a subscription: pay per day",
    perDay: "/ day per deal",
    dailyText: "For an event or a promotion lasting a few days: post your deal, then pay only for its days of visibility.",
    subscribe: "Subscribe",
    extend: "Extend",
    renew: "Renew",
    pending: (amount: string, months: string, method: string) =>
      `Your payment of ${amount} (${months}, ${method}) is being checked. Your subscription will be extended as soon as it's confirmed.`,
    history: "My payments",
    meta: (method: string, ref: string, date: string) => `${method} · ref. ${ref} · declared on ${date}`,
    visibleUntil: (date: string) => `Deal visible until ${date}`,
    deleted: "Deal since deleted",
    period: (from: string, to: string) => `Period: ${from} to ${to}`,
    reason: (r: string) => `Reason: ${r}`,
  },
});

const PAYMENT_TONE: Record<PaymentRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-verified/10 text-verified",
  rejected: "bg-red-100 text-red-700",
};

async function Content({ searchParams }: { searchParams: PageProps<"/[lang]/espace-pro/abonnement">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireProAccess("/espace-pro/abonnement");
  const locale = await getLocale();
  const t = T[locale];
  const [subscription, settings, payments, params] = await Promise.all([
    getMySubscription(supabase, user.id),
    getSubscriptionSettings(supabase),
    getMyPayments(supabase, user.id),
    searchParams,
  ]);

  if (!subscription || !settings) {
    return (
      <p className="m-5 rounded-2xl bg-surface p-5 text-center text-sm text-muted">
        {t.none}
      </p>
    );
  }

  const pending = payments.find((p) => p.status === "pending" && p.kind === "subscription");
  const numbers = Object.fromEntries(Object.entries(settings.numbers).filter(([, n]) => n));

  return (
    <div className="space-y-6 px-5 pb-8">
      {params.envoye === "1" && (
        <FormMessage info={t.sent} />
      )}

      <SubscriptionStatus subscription={subscription} />

      <section className="rounded-2xl border border-line p-4">
        <p className="text-sm text-muted">{t.plan}</p>
        <p className="mt-1 text-2xl font-extrabold">
          {formatAriary(settings.monthlyPrice, locale)}{" "}
          <span className="text-base font-semibold text-muted">{t.perMonth}</span>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink/80">
          {t.perks.map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
      </section>

      {subscription.status !== "canceled" && (
        <section className="rounded-2xl border border-dashed border-line p-4">
          <p className="text-sm text-muted">{t.daily}</p>
          <p className="mt-1 text-xl font-extrabold">
            {formatAriary(settings.dayPrice, locale)}{" "}
            <span className="text-base font-semibold text-muted">{t.perDay}</span>
          </p>
          <p className="mt-1 text-sm text-ink/80">{t.dailyText}</p>
        </section>
      )}

      {subscription.status !== "canceled" && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">
            {subscription.status === "trial" ? t.subscribe : subscription.status === "active" ? t.extend : t.renew}
          </h2>
          {pending ? (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4" role="status">
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
              <p className="text-sm">
                {t.pending(
                  formatAriary(pending.amount, locale),
                  paymentLabel(pending, locale),
                  paymentMethodLabel(pending.method),
                )}
              </p>
            </div>
          ) : (
            <PaymentForm monthlyPrice={settings.monthlyPrice} accountName={settings.accountName} numbers={numbers} />
          )}
        </section>
      )}

      {payments.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold">{t.history}</h2>
          <ul className="mt-3 space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="space-y-1.5 rounded-2xl border border-line bg-white p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">
                    {formatAriary(p.amount, locale)} · {paymentLabel(p, locale)}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_TONE[p.status]}`}>
                    {PAYMENT_STATUS_LABEL[locale][p.status]}
                  </span>
                </div>
                <p className="text-muted">
                  {t.meta(paymentMethodLabel(p.method), p.reference, formatShortDate(dateOf(p.created_at), locale))}
                </p>
                {p.kind === "offer" && p.covers_until && (
                  <p className="text-muted">
                    {p.offer_id ? (
                      <Link href={`/espace-pro/offres/${p.offer_id}/visibilite`} className="font-semibold text-brand">
                        {t.visibleUntil(formatShortDate(p.covers_until, locale))}
                      </Link>
                    ) : (
                      t.deleted
                    )}
                  </p>
                )}
                {p.status === "confirmed" && p.period_start && p.period_end && (
                  <p className="text-muted">
                    {t.period(
                      formatShortDate(dateOf(p.period_start), locale),
                      formatShortDate(dateOf(p.period_end), locale),
                    )}
                  </p>
                )}
                {p.status === "rejected" && p.rejection_reason && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-red-700">{t.reason(p.rejection_reason)}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
