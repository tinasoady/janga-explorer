import type { Metadata } from "next";
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
  paymentMethodLabel,
  type PaymentRow,
} from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { SubscriptionStatus } from "../subscription-status";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Mon abonnement" };

export default function AbonnementPage({ searchParams }: PageProps<"/espace-pro/abonnement">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">Mon abonnement</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const PAYMENT_TONE: Record<PaymentRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-verified/10 text-verified",
  rejected: "bg-red-100 text-red-700",
};

async function Content({ searchParams }: { searchParams: PageProps<"/espace-pro/abonnement">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireProAccess("/espace-pro/abonnement");
  const [subscription, settings, payments, params] = await Promise.all([
    getMySubscription(supabase, user.id),
    getSubscriptionSettings(supabase),
    getMyPayments(supabase, user.id),
    searchParams,
  ]);

  if (!subscription || !settings) {
    return (
      <p className="m-5 rounded-2xl bg-surface p-5 text-center text-sm text-muted">
        Aucun abonnement n&apos;est associé à ce compte. Les comptes administrateurs publient sans abonnement.
      </p>
    );
  }

  const pending = payments.find((p) => p.status === "pending");
  const numbers = Object.fromEntries(Object.entries(settings.numbers).filter(([, n]) => n));

  return (
    <div className="space-y-6 px-5 pb-8">
      {params.envoye === "1" && (
        <FormMessage info="Paiement envoyé. Nous le vérifions et votre abonnement est prolongé dès sa confirmation." />
      )}

      <SubscriptionStatus subscription={subscription} />

      <section className="rounded-2xl border border-line p-4">
        <p className="text-sm text-muted">Abonnement Janga Explorer</p>
        <p className="mt-1 text-2xl font-extrabold">
          {formatAriary(settings.monthlyPrice)} <span className="text-base font-semibold text-muted">/ mois</span>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink/80">
          <li>Offres illimitées pendant la période payée</li>
          <li>Sans commission sur vos ventes</li>
          <li>Payer pendant l&apos;essai ou avant l&apos;échéance ne fait rien perdre : la période s&apos;ajoute à la suite.</li>
        </ul>
      </section>

      {subscription.status !== "canceled" && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">
            {subscription.status === "trial" ? "M'abonner" : subscription.status === "active" ? "Prolonger" : "Renouveler"}
          </h2>
          {pending ? (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4" role="status">
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
              <p className="text-sm">
                Votre paiement de <strong>{formatAriary(pending.amount)}</strong> ({pending.months} mois,{" "}
                {paymentMethodLabel(pending.method)}) est en cours de vérification. Votre abonnement sera prolongé dès sa
                confirmation.
              </p>
            </div>
          ) : (
            <PaymentForm monthlyPrice={settings.monthlyPrice} accountName={settings.accountName} numbers={numbers} />
          )}
        </section>
      )}

      {payments.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold">Mes paiements</h2>
          <ul className="mt-3 space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="space-y-1.5 rounded-2xl border border-line bg-white p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">
                    {formatAriary(p.amount)} · {p.months} mois
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_TONE[p.status]}`}>
                    {PAYMENT_STATUS_LABEL[p.status]}
                  </span>
                </div>
                <p className="text-muted">
                  {paymentMethodLabel(p.method)} · réf. {p.reference} · déclaré le {formatShortDate(dateOf(p.created_at))}
                </p>
                {p.status === "confirmed" && p.period_start && p.period_end && (
                  <p className="text-muted">
                    Période : du {formatShortDate(dateOf(p.period_start))} au {formatShortDate(dateOf(p.period_end))}
                  </p>
                )}
                {p.status === "rejected" && p.rejection_reason && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-red-700">Motif : {p.rejection_reason}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
