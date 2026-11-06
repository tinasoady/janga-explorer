"use client";

// Composant client : les cartes sont aussi affichées par la liste des favoris, rendue dans le navigateur.
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, Flame, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { discountPercent, formatAriary, formatShortDate } from "@/lib/format";
import { offerHighlight, type HighlightTone } from "@/lib/highlight";
import { messages } from "@/lib/i18n";
import { hasSeveralPrices } from "@/lib/tickets";
import type { Offer } from "@/lib/types";
import { CategoryIcon } from "./category";
import { FavoriteButton } from "./favorite-button";
import { useLocale } from "./locale-provider";

const T = messages({
  fr: {
    verified: "Offre vérifiée",
    until: (date: string) => `Valable jusqu'au ${date}`,
    from: "dès",
    sample: "Exemple",
    sampleTitle: "Offre d'exemple : établissement fictif",
  },
  en: {
    verified: "Verified deal",
    until: (date: string) => `Valid until ${date}`,
    from: "from",
    sample: "Sample",
    sampleTitle: "Sample deal: fictitious business",
  },
});

const BADGE_SIZES = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-0.5 text-sm",
  lg: "px-3 py-2 text-lg",
};

export function DiscountBadge({
  offer,
  tone = "solid",
  size = "md",
  className = "",
}: {
  offer: Offer;
  tone?: "solid" | "soft";
  size?: keyof typeof BADGE_SIZES;
  className?: string;
}) {
  const pct = discountPercent(offer.priceOriginal, offer.priceOffer);
  if (pct === null) return null;
  const colors = tone === "solid" ? "bg-brand text-white shadow-sm" : "bg-brand-soft text-brand";
  return (
    <span className={`rounded-lg font-bold ${colors} ${BADGE_SIZES[size]} ${className}`}>
      -{pct}%
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  const t = T[useLocale()];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-verified px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ${className}`}
    >
      <ShieldCheck className="size-3" aria-hidden />
      {t.verified}
    </span>
  );
}

const HIGHLIGHT_STYLE: Record<HighlightTone, { className: string; icon: typeof Flame }> = {
  urgent: { className: "bg-red-600 text-white", icon: Flame },
  soon: { className: "bg-sun text-ink", icon: Clock },
  new: { className: "bg-sea text-white", icon: Sparkles },
};

/** « Dernier jour », « Plus que 3 jours », « Nouveau »… Rien si l'offre n'a rien de pressant ni de neuf. */
export function HighlightBadge({ offer, today, className = "" }: { offer: Offer; today: string; className?: string }) {
  const highlight = offerHighlight(offer, today, useLocale());
  if (!highlight) return null;
  const { className: colors, icon: Icon } = HIGHLIGHT_STYLE[highlight.tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm ${colors} ${className}`}
    >
      <Icon className="size-3" aria-hidden />
      {highlight.label}
    </span>
  );
}

function Prices({ offer }: { offer: Offer }) {
  const locale = useLocale();
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {hasSeveralPrices(offer) && <span className="text-xs text-muted">{T[locale].from}</span>}
      {offer.priceOriginal && offer.priceOriginal > offer.priceOffer && (
        <span className="text-xs text-muted line-through">{formatAriary(offer.priceOriginal, locale)}</span>
      )}
      <span className="text-base font-extrabold text-brand">{formatAriary(offer.priceOffer, locale)}</span>
    </p>
  );
}

/** Étiquette des offres d'exemple (établissements fictifs ajoutés pour présenter le site). */
export function SampleTag({ className = "" }: { className?: string }) {
  const t = T[useLocale()];
  return (
    <span
      title={t.sampleTitle}
      className={`shrink-0 rounded bg-surface px-1.5 py-px text-[10px] font-bold tracking-wide text-muted uppercase ${className}`}
    >
      {t.sample}
    </span>
  );
}

function ValidUntil({ offer }: { offer: Offer }) {
  const locale = useLocale();
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted">
      <CalendarDays className="size-3.5" aria-hidden />
      {T[locale].until(formatShortDate(offer.validUntil, locale))}
    </p>
  );
}

/** Carte verticale, utilisée dans les carrousels de l'accueil. `today` active les repères d'urgence et de nouveauté. */
export function OfferCard({ offer, today }: { offer: Offer; today?: string }) {
  return (
    <article className="relative w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition md:w-auto md:hover:-translate-y-0.5 md:hover:shadow-md">
      <div className="relative aspect-[4/3]">
        <Image
          src={offer.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 270px, (min-width: 768px) 33vw, 240px"
          className="object-cover"
        />
        <DiscountBadge offer={offer} className="absolute top-2 left-2" />
        {offer.isVerified && <VerifiedBadge className="absolute top-2 right-2" />}
        {today && <HighlightBadge offer={offer} today={today} className="absolute bottom-2 left-2" />}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 font-bold">
          <Link href={`/offres/${offer.slug}`} className="after:absolute after:inset-0">
            {offer.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-ink/80">
          <CategoryIcon category={offer.category} />
          <span className="line-clamp-1">{offer.business.name}</span>
          {offer.business.isSample && <SampleTag />}
        </p>
        <Prices offer={offer} />
        <ValidUntil offer={offer} />
      </div>
    </article>
  );
}

/** Ligne horizontale, utilisée dans les listes (bons plans, favoris). */
export function OfferRow({ offer, today }: { offer: Offer; today?: string }) {
  return (
    <article className="relative flex gap-3 rounded-2xl border border-line bg-white p-2 shadow-sm">
      <div className="relative w-28 shrink-0 overflow-hidden rounded-xl min-[360px]:w-32">
        <Image src={offer.imageUrl} alt="" fill sizes="128px" className="object-cover" />
        <DiscountBadge offer={offer} size="sm" className="absolute top-1.5 left-1.5" />
        {offer.isVerified && <VerifiedBadge className="absolute bottom-1.5 left-1.5" />}
      </div>
      <div className="flex min-h-32 min-w-0 flex-1 flex-col gap-1 py-1 pr-7">
        {today && <HighlightBadge offer={offer} today={today} className="self-start" />}
        <h3 className="line-clamp-2 text-[15px] leading-snug font-bold">
          <Link href={`/offres/${offer.slug}`} className="after:absolute after:inset-0">
            {offer.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-ink/80">
          <CategoryIcon category={offer.category} />
          <span className="truncate">{offer.business.name}</span>
          {offer.business.isSample && <SampleTag />}
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{offer.location}</span>
        </p>
        <div className="mt-auto">
          <Prices offer={offer} />
          <ValidUntil offer={offer} />
        </div>
      </div>
      <FavoriteButton slug={offer.slug} className="absolute top-2 right-2 z-10 size-8" />
    </article>
  );
}
