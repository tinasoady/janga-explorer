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
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=75&auto=format&fit=crop";

export default async function HomePage() {
  const [offers, weekend] = await Promise.all([getActiveOffers(), getWeekendOffers()]);
  const featured = offers.filter((o) => o.isFeatured);

  return (
    <>
      {/* Téléphone seulement : sur tablette et ordinateur, c'est l'en-tête du site qui sert de repère. */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3 md:hidden">
        <div>
          <Logo />
          <p className="mt-0.5 flex items-center gap-1 pl-11 text-xs font-semibold text-ink/80">
            <MapPin className="size-3.5 text-brand" aria-hidden />
            Mahajanga
          </p>
        </div>
        <Link
          href="/pro"
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink"
        >
          <Store className="size-4" aria-hidden />
          Espace pro
        </Link>
      </header>

      <section className="relative mx-4 overflow-hidden rounded-3xl md:mt-6">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/35 to-transparent" />
        <div className="relative px-5 pt-7 pb-5 md:px-10 md:pt-14 md:pb-12 lg:px-14 lg:pt-20 lg:pb-16">
          <h1 className="font-script text-4xl text-white drop-shadow md:text-6xl lg:text-7xl">Mahajanga</h1>
          <p className="mt-2 max-w-[13rem] text-[15px] leading-snug font-semibold text-white drop-shadow md:mt-4 md:max-w-lg md:text-xl md:text-balance lg:mt-6 lg:text-2xl">
            Des bons plans pour tous vos moments !
          </p>
          <Form action="/bons-plans" className="mt-6 md:mt-8 md:max-w-xl">
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
        </div>
      </section>

      <nav aria-label="Catégories" className="grid grid-cols-4 gap-2 px-4 pt-5 md:gap-4 md:pt-8">
        {CATEGORIES.map((c) => {
          const { icon: Icon, bg } = CATEGORY_STYLE[c.key];
          return (
            <Link
              key={c.key}
              href={`/bons-plans?cat=${c.key}`}
              className="flex flex-col items-center gap-1.5 md:flex-row md:gap-4 md:rounded-2xl md:border md:border-line md:p-4 md:shadow-sm md:transition md:hover:-translate-y-0.5 md:hover:shadow-md"
            >
              <span className={`grid size-14 place-items-center rounded-2xl ${bg} text-white shadow-sm`}>
                <Icon className="size-7" aria-hidden />
              </span>
              <span className="text-xs font-semibold md:text-base md:font-bold">{c.tile}</span>
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
    <section className="pt-7 md:pt-10">
      <div className="flex items-center justify-between px-4 pb-3">
        <h2 className="text-lg font-extrabold md:text-2xl">{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-sea">
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
