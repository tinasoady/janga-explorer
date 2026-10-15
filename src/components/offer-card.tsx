import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { discountPercent, formatAriary, formatShortDate } from "@/lib/format";
import type { Offer } from "@/lib/types";
import { CategoryIcon } from "./category";
import { FavoriteButton } from "./favorite-button";

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
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-verified px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ${className}`}
    >
      <ShieldCheck className="size-3" aria-hidden />
      Offre vérifiée
    </span>
  );
}

function Prices({ offer }: { offer: Offer }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {offer.priceOriginal && offer.priceOriginal > offer.priceOffer && (
        <span className="text-xs text-muted line-through">{formatAriary(offer.priceOriginal)}</span>
      )}
      <span className="text-base font-extrabold text-brand">{formatAriary(offer.priceOffer)}</span>
    </p>
  );
}

/** Carte verticale, utilisée dans les carrousels de l'accueil. */
export function OfferCard({ offer }: { offer: Offer }) {
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
        </p>
        <Prices offer={offer} />
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <CalendarDays className="size-3.5" aria-hidden />
          Valable jusqu&apos;au {formatShortDate(offer.validUntil)}
        </p>
      </div>
    </article>
  );
}

/** Ligne horizontale, utilisée dans les listes (bons plans, favoris). */
export function OfferRow({ offer }: { offer: Offer }) {
  return (
    <article className="relative flex gap-3 rounded-2xl border border-line bg-white p-2 shadow-sm">
      <div className="relative w-28 shrink-0 overflow-hidden rounded-xl min-[360px]:w-32">
        <Image src={offer.imageUrl} alt="" fill sizes="128px" className="object-cover" />
        <DiscountBadge offer={offer} size="sm" className="absolute top-1.5 left-1.5" />
        {offer.isVerified && <VerifiedBadge className="absolute bottom-1.5 left-1.5" />}
      </div>
      <div className="flex min-h-32 min-w-0 flex-1 flex-col gap-1 py-1 pr-7">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-bold">
          <Link href={`/offres/${offer.slug}`} className="after:absolute after:inset-0">
            {offer.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-ink/80">
          <CategoryIcon category={offer.category} />
          <span className="truncate">{offer.business.name}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{offer.location}</span>
        </p>
        <div className="mt-auto">
          <Prices offer={offer} />
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            Valable jusqu&apos;au {formatShortDate(offer.validUntil)}
          </p>
        </div>
      </div>
      <FavoriteButton slug={offer.slug} className="absolute top-2 right-2 z-10 size-8" />
    </article>
  );
}
