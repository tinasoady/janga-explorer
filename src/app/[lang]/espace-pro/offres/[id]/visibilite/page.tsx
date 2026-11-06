import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { FormMessage, Unavailable } from "@/components/form-ui";
import { requireProAccess } from "@/lib/auth";
import { formatAriary, formatLongDate, formatShortDate } from "@/lib/format";
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

export const metadata: Metadata = { title: "Visibilité de l'offre" };

export default function VisibilitePage({ searchParams, params }: PageProps<"/espace-pro/offres/[id]/visibilite">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/espace-pro" />
        <h1 className="text-xl font-extrabold">Payer la visibilité</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type Props = Pick<PageProps<"/espace-pro/offres/[id]/visibilite">, "params" | "searchParams">;

async function Content({ params, searchParams }: Props) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { user, supabase } = await requireProAccess(`/espace-pro/offres/${id}/visibilite`);
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
  const pending = payments?.find((p) => p.status === "pending");
  const lastRejected = payments?.[0]?.status === "rejected" ? payments[0] : null;
  const numbers = Object.fromEntries(Object.entries(settings.numbers).filter(([, n]) => n));

  return (
    <div className="space-y-5 px-5 pb-8">
      {query.envoye === "1" && (
        <FormMessage info="Paiement envoyé. Dès qu'il est confirmé, votre offre passe en vérification puis en ligne." />
      )}

      <section className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
          <Image src={offer.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="line-clamp-2 leading-snug font-bold">{offer.title}</h2>
          <p className="text-sm font-extrabold text-brand">{formatAriary(offer.priceOffer)}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            Jusqu&apos;au {formatShortDate(offer.validUntil)}
          </p>
        </div>
      </section>

      {pending ? (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4" role="status">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-sm">
            Votre paiement de <strong>{formatAriary(pending.amount)}</strong> ({pending.days} jours,{" "}
            {paymentMethodLabel(pending.method)}) est en cours de vérification. Ensuite, nous vérifions l&apos;offre
            avec vous et elle passe en ligne.
          </p>
        </div>
      ) : days === 0 ? (
        offer.validUntil < today ? (
          <p className="rounded-2xl bg-surface p-4 text-sm">
            Cette offre est terminée depuis le {formatLongDate(offer.validUntil)}.{" "}
            <Link href={`/espace-pro/offres/${offer.id}`} className="font-bold text-brand">
              Changez sa date de fin
            </Link>{" "}
            pour la publier à nouveau.
          </p>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-verified/10 p-4" role="status">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-verified" aria-hidden />
            <p className="text-sm">
              Les jours de visibilité de cette offre sont payés jusqu&apos;au{" "}
              <strong>{formatLongDate(offer.passUntil ?? offer.validUntil)}</strong>.
            </p>
          </div>
        )
      ) : days > MAX_PASS_DAYS ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm">
          Sans abonnement, la visibilité se paie pour {MAX_PASS_DAYS} jours au plus. Cette offre en demande {days}.{" "}
          <Link href={`/espace-pro/offres/${offer.id}`} className="font-bold text-brand">
            Choisissez une date de fin plus proche
          </Link>{" "}
          ou{" "}
          <Link href="/espace-pro/abonnement" className="font-bold text-brand">
            abonnez-vous
          </Link>
          .
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-line p-4">
            <p className="text-sm text-muted">Visibilité de cette offre</p>
            <p className="mt-1 text-2xl font-extrabold">{formatAriary(amount)}</p>
            <p className="text-sm text-ink/80">
              {days} jour{days > 1 ? "s" : ""} × {formatAriary(settings.dayPrice)}, du{" "}
              {formatShortDate(today)} au {formatShortDate(offer.validUntil)} inclus
            </p>
            <p className="mt-2 text-xs text-muted">
              Les jours se comptent à partir d&apos;aujourd&apos;hui. Après le paiement, nous vérifions l&apos;offre
              avec vous avant de la mettre en ligne.
            </p>
          </section>

          {amount >= settings.monthlyPrice && (
            <div className="flex items-start gap-3 rounded-2xl bg-sea/10 p-4 text-sm">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-sea" aria-hidden />
              <p>
                Pour {formatAriary(settings.monthlyPrice)}, l&apos;abonnement d&apos;un mois vous permet de publier
                autant d&apos;offres que vous voulez pendant 30 jours.{" "}
                <Link href="/espace-pro/abonnement" className="font-bold text-sea-dark">
                  Voir l&apos;abonnement
                </Link>
              </p>
            </div>
          )}

          {lastRejected?.rejection_reason && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Paiement précédent refusé : {lastRejected.rejection_reason}
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
