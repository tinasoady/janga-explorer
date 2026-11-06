import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { ArrowRight, BadgeCheck, MapPin, MessageCircle, Search, Store, Wallet } from "lucide-react";
import { CATEGORY_STYLE } from "@/components/category";
import { DealsOfTheDay } from "@/components/deal-of-the-day";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { OfferCard } from "@/components/offer-card";
import { SectionTitle } from "@/components/section-title";
import { formatAriary } from "@/lib/format";
import { isLastChance } from "@/lib/highlight";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getActiveOffers, getPublicPricing, getToday, getWeekendOffers, pickDealsOfTheDay } from "@/lib/offers";
import { CATEGORIES, type Offer } from "@/lib/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=80&auto=format&fit=crop";

const T = messages({
  fr: {
    proSpace: "Espace pro",
    heroTitle: "Les bons plans",
    heroText: "Des bons plans pour tous vos moments !",
    live: (n: number) => `${n} bon${n > 1 ? "s" : ""} plan${n > 1 ? "s" : ""} en ce moment`,
    search: "Rechercher un bon plan",
    searchPlaceholder: "Tu cherches quoi aujourd'hui ?",
    categories: "Catégories",
    promises: ["Chaque offre relue avant publication", "Contact direct sur WhatsApp", "Aucun frais pour vous"],
    featured: "Les bons plans du moment",
    lastChance: "Dernière chance",
    weekend: "Ce week-end à Mahajanga",
    seeAll: "Voir tout",
    proTitle: "Vous êtes restaurateur, hôtelier ou organisateur ?",
    proText: "Publiez vos offres sur Janga Explorer et touchez les habitants et visiteurs de Mahajanga.",
    proDays: (price: string) => `Un événement de quelques jours ? Publiez-le pour ${price} par jour, sans abonnement.`,
    proCta: "Publier une offre",
  },
  en: {
    proSpace: "For businesses",
    heroTitle: "The best deals",
    heroText: "Great deals for every moment!",
    live: (n: number) => `${n} deal${n > 1 ? "s" : ""} right now`,
    search: "Search for a deal",
    searchPlaceholder: "What are you looking for today?",
    categories: "Categories",
    promises: ["Every deal reviewed before going live", "Contact businesses directly on WhatsApp", "No fees for you"],
    featured: "Deals of the moment",
    lastChance: "Last chance",
    weekend: "This weekend in Mahajanga",
    seeAll: "See all",
    proTitle: "Do you run a restaurant, a hotel or events?",
    proText: "Post your deals on Janga Explorer and reach Mahajanga's residents and visitors.",
    proDays: (price: string) => `Running an event for a few days? Post it for ${price} per day, no subscription needed.`,
    proCta: "Post a deal",
  },
});

const PROMISE_ICONS = [BadgeCheck, MessageCircle, Wallet];

export default async function HomePage() {
  const [offers, weekend, today, pricing, locale] = await Promise.all([
    getActiveOffers(),
    getWeekendOffers(),
    getToday(),
    getPublicPricing(),
    getLocale(),
  ]);
  const t = T[locale];
  const deals = pickDealsOfTheDay(offers, today);
  // Les bons plans du jour ont leurs grandes cartes : on ne les répète pas juste en dessous.
  const dealIds = new Set(deals.map((d) => d.id));
  const featured = offers.filter((o) => o.isFeatured && !dealIds.has(o.id));
  const lastChance = offers
    .filter((o) => isLastChance(o, today))
    .sort((a, b) => a.validUntil.localeCompare(b.validUntil));

  return (
    <>
      {/* Téléphone seulement : sur tablette et ordinateur, c'est l'en-tête du site qui sert de repère. */}
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 md:hidden">
        <div>
          <Logo />
          <p className="mt-0.5 flex items-center gap-1 pl-11 text-xs font-semibold text-ink/80">
            <MapPin className="size-3.5 text-brand" aria-hidden />
            Mahajanga
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher className="[&>svg]:hidden" />
          <Link
            href="/pro"
            aria-label={t.proSpace}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-ink"
          >
            <Store className="size-4" aria-hidden />
            {/* Sur les plus petits écrans, l'icône seule laisse la place au logo et au choix de la langue */}
            <span className="max-[399px]:hidden">{t.proSpace}</span>
          </Link>
        </div>
      </header>

      {/* Téléphone : carte arrondie. Tablette et ordinateur : bandeau pleine largeur de l'écran, titre en grand et
          rubriques en bas de l'image (la recherche est alors dans l'en-tête du site). */}
      <section className="relative mx-4 overflow-hidden rounded-3xl md:mx-[calc(50%-50vw)] md:rounded-none">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/35 to-transparent md:bg-gradient-to-t md:from-ink/85 md:via-ink/25 md:to-ink/45" />
        <div className="relative px-5 pt-7 pb-5 md:flex md:min-h-[520px] md:flex-col md:items-center md:px-8 md:pt-16 md:pb-10 md:text-center lg:min-h-[620px] lg:pt-24">
          <h1 className="text-white drop-shadow md:drop-shadow-lg">
            <span className="block font-script text-4xl md:text-4xl lg:text-5xl">Mahajanga</span>
            <span className="hidden font-display text-[clamp(4.5rem,10vw,9rem)] leading-[0.95] font-bold tracking-tight uppercase md:mt-2 md:block">
              {t.heroTitle}
            </span>
          </h1>
          <p className="mt-2 max-w-[13rem] text-[15px] leading-snug font-semibold text-white drop-shadow md:mt-4 md:max-w-xl md:text-xl md:text-balance lg:text-2xl">
            {t.heroText}
          </p>
          {offers.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm md:mt-5 md:text-sm">
              <span className="size-2 animate-pulse rounded-full bg-sun" aria-hidden />
              {t.live(offers.length)}
            </p>
          )}
          <Form action="/bons-plans" className="mt-6 md:hidden">
            <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <Search className="size-5 text-muted" aria-hidden />
              <span className="sr-only">{t.search}</span>
              <input
                name="q"
                type="search"
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </label>
          </Form>

          <nav aria-label={t.categories} className="mt-auto hidden pt-10 md:flex md:items-stretch">
            {CATEGORIES.map((c) => {
              const { icon: Icon } = CATEGORY_STYLE[c.key];
              return (
                <Link
                  key={c.key}
                  href={`/bons-plans?cat=${c.key}`}
                  className="group flex w-36 flex-col items-center gap-2 border-white/70 text-white not-first:border-l lg:w-44"
                >
                  <span className="grid size-14 place-items-center rounded-full border-2 border-white bg-white/10 backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-white group-hover:text-ink lg:size-16">
                    <Icon className="size-7" strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="text-xs font-extrabold tracking-wide uppercase drop-shadow lg:text-sm">
                    {c.tile[locale]}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <nav aria-label={t.categories} className="grid grid-cols-4 gap-2 px-4 pt-5 md:hidden">
        {CATEGORIES.map((c) => {
          const { icon: Icon, bg } = CATEGORY_STYLE[c.key];
          return (
            <Link
              key={c.key}
              href={`/bons-plans?cat=${c.key}`}
              className="flex flex-col items-center gap-1.5"
            >
              <span className={`grid size-14 place-items-center rounded-2xl ${bg} text-white shadow-sm`}>
                <Icon className="size-7" aria-hidden />
              </span>
              <span className="text-center text-xs font-semibold">{c.tile[locale]}</span>
            </Link>
          );
        })}
      </nav>

      <ul className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-4 text-xs font-semibold md:mt-8 md:justify-center md:gap-8 md:text-sm">
        {t.promises.map((text, i) => {
          const Icon = PROMISE_ICONS[i];
          return (
            <li key={text} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm md:bg-transparent md:shadow-none">
              <Icon className="size-4 text-verified" aria-hidden />
              {text}
            </li>
          );
        })}
      </ul>

      <DealsOfTheDay offers={deals} today={today} />
      <Carousel title={t.featured} seeAll={t.seeAll} href="/bons-plans" offers={featured} today={today} />
      <Carousel title={t.lastChance} seeAll={t.seeAll} href="/bons-plans?sort=fin" offers={lastChance} today={today} />
      <Carousel title={t.weekend} seeAll={t.seeAll} href="/bons-plans" offers={weekend} today={today} />

      <section className="mx-4 mt-8 rounded-3xl bg-brand-soft p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-8 lg:mt-12">
        <div>
          <h2 className="text-lg font-extrabold md:text-2xl">{t.proTitle}</h2>
          <p className="mt-1 text-sm text-ink/80 md:text-base">{t.proText}</p>
          {pricing && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink md:text-base">
              <Wallet className="size-4 shrink-0 text-brand" aria-hidden />
              {t.proDays(formatAriary(pricing.dayPrice, locale))}
            </p>
          )}
        </div>
        <Link
          href="/pro"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white md:mt-0 md:px-6 md:py-3 md:text-base"
        >
          {t.proCta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </>
  );
}

function Carousel({
  title,
  seeAll,
  href,
  offers,
  today,
}: {
  title: string;
  seeAll: string;
  href: string;
  offers: Offer[];
  today: string;
}) {
  if (offers.length === 0) return null;
  return (
    <section className="pt-7 md:pt-12">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 md:items-end md:pb-5">
        <SectionTitle>{title}</SectionTitle>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold whitespace-nowrap text-sea md:pb-3 md:hover:text-sea-dark">
          {seeAll}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {/* Téléphone : carrousel qu'on fait défiler. Tablette et ordinateur : grille, tout est visible d'un coup d'œil. */}
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:grid md:snap-none md:grid-cols-3 md:gap-5 md:overflow-visible md:[&>*:nth-child(n+7)]:hidden lg:grid-cols-4 lg:[&>*:nth-child(n+5)]:hidden">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} today={today} />
        ))}
      </div>
    </section>
  );
}
