import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Clock, Pencil, Plus, Store, XCircle } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { hasProAccess, requireUser } from "@/lib/auth";
import { formatAriary, formatShortDate } from "@/lib/format";
import { STATUS_LABEL, type ManagedOffer } from "@/lib/managed";
import { getToday } from "@/lib/offers";
import { getMyBusiness, getMyOffers, getMyProRequest, type MyProRequest } from "@/lib/pro";
import { proKindLabel } from "@/lib/pro-request";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { archiveOffer, deleteOffer, resubmitOffer } from "./actions";

export const metadata: Metadata = { title: "Mon espace pro" };

export default function EspaceProPage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">Mon espace pro</h1>
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

  // Compte pro pas encore approuvé : on montre où en est la demande plutôt que le tableau de bord.
  if (!hasProAccess(user)) return <RequestStatus request={await getMyProRequest(supabase, user.id)} />;

  const business = await getMyBusiness(supabase, user.id);

  if (!business) {
    return (
      <div className="space-y-4 px-5 pb-8">
        <div className="rounded-2xl bg-surface p-6 text-center">
          <Store className="mx-auto size-10 text-brand" aria-hidden />
          <p className="mt-3 font-bold">Présentez votre établissement</p>
          <p className="mt-1 text-sm text-muted">
            Restaurant, hôtel, agence d&apos;excursions, bar… Indiquez son nom et comment les clients vous joignent,
            puis publiez vos offres.
          </p>
          <Link
            href="/espace-pro/etablissement"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white"
          >
            Créer mon établissement
          </Link>
        </div>
      </div>
    );
  }

  const [offers, today] = await Promise.all([getMyOffers(supabase, business.id), getToday()]);

  return (
    <div className="space-y-5 px-5 pb-8">
      <section className="flex items-start gap-3 rounded-2xl border border-line p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Store className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{business.name}</p>
          <p className="truncate text-sm text-muted">{business.kind}</p>
        </div>
        <Link href="/espace-pro/etablissement" className="text-sm font-semibold text-brand">
          Modifier
        </Link>
      </section>

      <Link
        href="/espace-pro/offres/nouvelle"
        className="flex items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-white shadow-md shadow-brand/30"
      >
        <Plus className="size-5" aria-hidden />
        Publier une offre
      </Link>

      <section>
        <h2 className="text-lg font-extrabold">Mes offres</h2>
        {offers.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">
            Vous n&apos;avez pas encore d&apos;offre. Chaque offre est relue avant d&apos;apparaître sur Janga Explorer.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferItem offer={offer} today={today} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RequestStatus({ request }: { request: MyProRequest | null }) {
  if (!request) {
    return (
      <div className="px-5 pb-8">
        <div className="rounded-2xl bg-surface p-6 text-center">
          <Store className="mx-auto size-10 text-brand" aria-hidden />
          <p className="mt-3 font-bold">Espace réservé aux professionnels</p>
          <p className="mt-1 text-sm text-muted">
            Les comptes professionnels sont créés sur demande, après vérification de l&apos;établissement.
          </p>
          <Link
            href="/connexion?mode=inscription"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white"
          >
            Faire une demande de compte pro
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
        <p className="mt-3 font-bold">
          {rejected ? "Votre demande n'a pas été retenue" : "Votre demande est en cours de vérification"}
        </p>
        <p className="mt-1 text-sm text-ink/80">
          {rejected
            ? request.rejectionReason
            : "Nous vérifions votre établissement, parfois par téléphone ou WhatsApp. Dès que c'est fait, vous pourrez publier vos offres depuis cette page."}
        </p>
      </div>

      <dl className="space-y-2 rounded-2xl border border-line p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Établissement</dt>
          <dd className="text-right font-semibold">{request.company}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Activité</dt>
          <dd className="text-right font-semibold">{proKindLabel(request.kind)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Localité</dt>
          <dd className="text-right font-semibold">{request.locality}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Capacité</dt>
          <dd className="text-right font-semibold">{request.capacity}</dd>
        </div>
      </dl>
    </div>
  );
}

function OfferItem({ offer, today }: { offer: ManagedOffer; today: string }) {
  const expired = offer.status === "published" && offer.validUntil < today;
  const canResubmit = offer.status === "archived" || offer.status === "rejected";
  const canArchive = offer.status === "published" || offer.status === "pending";

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
          <Image src={offer.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 leading-snug font-bold">{offer.title}</h3>
          <p className="text-sm font-extrabold text-brand">{formatAriary(offer.priceOffer)}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            Jusqu&apos;au {formatShortDate(offer.validUntil)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            expired ? STATUS_TONE.archived : STATUS_TONE[offer.status]
          }`}
        >
          {expired ? "Terminée" : STATUS_LABEL[offer.status]}
        </span>
        {offer.status === "published" && offer.isVerified && (
          <span className="text-xs font-semibold text-verified">Offre vérifiée</span>
        )}
      </div>

      {offer.status === "rejected" && offer.rejectionReason && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Motif : {offer.rejectionReason}</p>
      )}
      {offer.status === "published" && !expired && (
        <p className="text-xs text-muted">
          Modifier une offre en ligne la repasse en validation : elle est retirée du site le temps de la relecture.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/espace-pro/offres/${offer.id}`} className={secondaryButtonClass}>
          <Pencil className="size-4" aria-hidden />
          Modifier
        </Link>
        {canArchive && (
          <form action={archiveOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton className={secondaryButtonClass}>Retirer</SubmitButton>
          </form>
        )}
        {canResubmit && (
          <form action={resubmitOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton className={secondaryButtonClass}>Soumettre à nouveau</SubmitButton>
          </form>
        )}
        <form action={deleteOffer}>
          <input type="hidden" name="id" value={offer.id} />
          <SubmitButton className={`${secondaryButtonClass} text-red-700`}>Supprimer</SubmitButton>
        </form>
      </div>
    </article>
  );
}
