import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { ArrowRight, MapPin, Search, Store } from "lucide-react";
import { CATEGORY_STYLE } from "@/components/category";
import { Logo } from "@/components/logo";
import { OfferCard } from "@/components/offer-card";
import { getActiveOffers, getWeekendOffers } from "@/lib/offers";
import { CATEGORIES, type Offer } from "@/lib/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=80&auto=format&fit=crop";

export default async function HomePage() {
  const [offers, weekend] = await Promise.all([getActiveOffers(), getWeekendOffers()]);
  const featured = offers.filter((o) => o.isFeatured);

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
        <Link
          href="/pro"
          aria-label="Espace pro"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-ink"
        >
          <Store className="size-4" aria-hidden />
          {/* Sur les plus petits écrans (320 px), l'icône seule laisse la place au logo */}
          <span className="max-[359px]:hidden">Espace pro</span>
        </Link>
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
              Les bons plans
            </span>
          </h1>
          <p className="mt-2 max-w-[13rem] text-[15px] leading-snug font-semibold text-white drop-shadow md:mt-4 md:max-w-xl md:text-xl md:text-balance lg:text-2xl">
            Des bons plans pour tous vos moments !
          </p>
          <Form action="/bons-plans" className="mt-6 md:hidden">
            <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <Search className="size-5 text-muted" aria-hidden />
              <span className="sr-only">Rechercher un bon plan</span>
              <input
                name="q"
                type="search"
                placeholder="Tu cherches quoi aujourd'hui ?"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </label>
          </Form>

          <nav aria-label="Catégories" className="mt-auto hidden pt-10 md:flex md:items-stretch">
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
                  <span className="text-xs font-extrabold tracking-wide uppercase drop-shadow lg:text-sm">{c.tile}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <nav aria-label="Catégories" className="grid grid-cols-4 gap-2 px-4 pt-5 md:hidden">
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
              <span className="text-xs font-semibold">{c.tile}</span>
            </Link>
          );
        })}
      </nav>

      <Carousel title="Les bons plans du moment" href="/bons-plans" offers={featured} />
      <Carousel title="Ce week-end à Mahajanga" href="/bons-plans" offers={weekend} />

      <section className="mx-4 mt-8 rounded-3xl bg-brand-soft p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-8 lg:mt-12">
        <div>
          <h2 className="text-lg font-extrabold md:text-2xl">Vous êtes restaurateur, hôtelier ou organisateur ?</h2>
          <p className="mt-1 text-sm text-ink/80 md:text-base">
            Publiez vos offres sur Janga Explorer et touchez les habitants et visiteurs de Mahajanga.
          </p>
        </div>
        <Link
          href="/pro"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white md:mt-0 md:px-6 md:py-3 md:text-base"
        >
          Publier une offre
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </>
  );
}

function Carousel({ title, href, offers }: { title: string; href: string; offers: Offer[] }) {
  if (offers.length === 0) return null;
  return (
    <section className="pt-7 md:pt-12">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 md:items-end md:pb-5">
        <h2 className="text-lg font-extrabold md:font-display md:text-3xl md:font-bold md:tracking-wide md:uppercase md:after:mt-2 md:after:block md:after:h-1 md:after:w-14 md:after:rounded-full md:after:bg-sun">
          {title}
        </h2>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold whitespace-nowrap text-sea md:pb-3 md:hover:text-sea-dark">
          Voir tout
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {/* Téléphone : carrousel qu'on fait défiler. Tablette et ordinateur : grille, tout est visible d'un coup d'œil. */}
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:grid md:snap-none md:grid-cols-3 md:gap-5 md:overflow-visible md:[&>*:nth-child(n+7)]:hidden lg:grid-cols-4 lg:[&>*:nth-child(n+5)]:hidden">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}
