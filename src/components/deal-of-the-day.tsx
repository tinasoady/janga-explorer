import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { formatAriary } from "@/lib/format";
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { hasSeveralPrices } from "@/lib/tickets";
import type { Offer } from "@/lib/types";
import { MidnightCountdown } from "./midnight-countdown";
import { DiscountBadge, HighlightBadge, VerifiedBadge } from "./offer-card";
import { SectionTitle } from "./section-title";
import { Slider } from "./slider";

/** Temps d'affichage de chaque bon plan avant de passer au suivant. */
const SLIDE_MS = 6000;

const T = messages({
  fr: {
    title: "Les bons plans du jour",
    badge: "Sélection du jour",
    saved: (amount: string) => `${amount} d'économie`,
    cta: "Voir le bon plan",
    from: "dès",
  },
  en: {
    title: "Deals of the day",
    badge: "Today's pick",
    saved: (amount: string) => `save ${amount}`,
    cta: "See the deal",
    from: "from",
  },
});

/** Grandes cartes de l'accueil : les offres mises en avant pour la journée, qui défilent toutes seules. */
export async function DealsOfTheDay({ offers, today }: { offers: Offer[]; today: string }) {
  if (offers.length === 0) return null;
  const locale = await getLocale();
  const t = T[locale];

  return (
    <section className="px-4 pt-7 md:pt-12">
      <div className="flex items-center justify-between gap-3 pb-3 md:items-end md:pb-5">
        <SectionTitle>{t.title}</SectionTitle>
        <MidnightCountdown className="shrink-0 md:pb-3" />
      </div>

      <Slider label={t.title} autoPlay={SLIDE_MS}>
        {offers.map((offer, i) => (
          <DealCard key={offer.id} offer={offer} today={today} t={t} locale={locale} priority={i === 0} />
        ))}
      </Slider>
    </section>
  );
}

function DealCard({
  offer,
  today,
  t,
  locale,
  priority,
}: {
  offer: Offer;
  today: string;
  t: (typeof T)["fr"];
  locale: Locale;
  priority: boolean;
}) {
  const savings = offer.priceOriginal ? offer.priceOriginal - offer.priceOffer : 0;

  return (
    <article className="relative h-full overflow-hidden rounded-3xl bg-ink text-white shadow-lg transition md:grid md:grid-cols-2 md:hover:shadow-xl">
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-80">
        <Image
          src={offer.imageUrl}
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          priority={priority}
          className="object-cover"
        />
        <DiscountBadge offer={offer} size="lg" className="absolute top-3 left-3" />
        {offer.isVerified && <VerifiedBadge className="absolute top-3 right-3" />}
      </div>

      <div className="space-y-3 p-5 md:flex md:flex-col md:justify-center md:p-8 lg:p-10">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-xs font-extrabold tracking-wide text-ink uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          {t.badge}
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
            <span className="text-sm text-white/60 line-through">{formatAriary(offer.priceOriginal, locale)}</span>
          )}
          {hasSeveralPrices(offer) && <span className="text-sm text-white/70">{t.from}</span>}
          <span className="text-3xl font-extrabold text-sun">{formatAriary(offer.priceOffer, locale)}</span>
          {savings > 0 && <span className="text-sm font-bold text-white">{t.saved(formatAriary(savings, locale))}</span>}
        </p>
        <HighlightBadge offer={offer} today={today} className="w-fit" />
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/40 md:mt-2 md:text-base">
          {t.cta}
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}
