import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { formatAriary } from "@/lib/format";
import type { Offer } from "@/lib/types";
import { MidnightCountdown } from "./midnight-countdown";
import { DiscountBadge, HighlightBadge, VerifiedBadge } from "./offer-card";
import { SectionTitle } from "./section-title";

/** Grande carte de l'accueil : une offre mise en avant pour la journée. */
export function DealOfTheDay({ offer, today }: { offer: Offer; today: string }) {
  const savings = offer.priceOriginal ? offer.priceOriginal - offer.priceOffer : 0;

  return (
    <section className="px-4 pt-7 md:pt-12">
      <div className="flex items-center justify-between gap-3 pb-3 md:items-end md:pb-5">
        <SectionTitle>Le bon plan du jour</SectionTitle>
        <MidnightCountdown className="shrink-0 md:pb-3" />
      </div>

      <article className="relative overflow-hidden rounded-3xl bg-ink text-white shadow-lg transition md:grid md:grid-cols-2 md:hover:shadow-xl">
        <div className="relative aspect-[16/10] md:aspect-auto md:min-h-80">
          <Image
            src={offer.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <DiscountBadge offer={offer} size="lg" className="absolute top-3 left-3" />
          {offer.isVerified && <VerifiedBadge className="absolute top-3 right-3" />}
        </div>

        <div className="space-y-3 p-5 md:flex md:flex-col md:justify-center md:p-8 lg:p-10">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-xs font-extrabold tracking-wide text-ink uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Sélection du jour
          </p>
          <h3 className="text-2xl leading-tight font-extrabold md:text-3xl lg:text-4xl">
            <Link href={`/offres/${offer.slug}`} className="after:absolute after:inset-0">
              {offer.title}
            </Link>
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="line-clamp-1">
              {offer.business.name} · {offer.location}
            </span>
          </p>
          <p className="flex flex-wrap items-baseline gap-x-3">
            {savings > 0 && offer.priceOriginal && (
              <span className="text-sm text-white/60 line-through">{formatAriary(offer.priceOriginal)}</span>
            )}
            <span className="text-3xl font-extrabold text-sun">{formatAriary(offer.priceOffer)}</span>
            {savings > 0 && <span className="text-sm font-bold text-white">{formatAriary(savings)} d&apos;économie</span>}
          </p>
          <HighlightBadge offer={offer} today={today} className="w-fit" />
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/40 md:mt-2 md:text-base">
            Voir le bon plan
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </article>
    </section>
  );
}
