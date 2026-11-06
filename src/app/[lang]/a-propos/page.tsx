import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Heart,
  House,
  Luggage,
  MapPin,
  MessageCircle,
  Navigation,
  PhoneCall,
  Search,
  Store,
  Wallet,
} from "lucide-react";
import { BackButton } from "@/components/back-button";
import { CATEGORY_STYLE } from "@/components/category";
import { SectionTitle } from "@/components/section-title";
import { whatsappLink } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { CATEGORIES, type CategoryKey } from "@/lib/types";

type Block = { title: string; text: string };
type Audience = { title: string; points: string[]; cta: string };

const T = messages<{
  metaTitle: string;
  metaDescription: string;
  back: string;
  kicker: string;
  title: string;
  intro: string;
  allTitle: string;
  allText: string;
  categories: Record<CategoryKey, string>;
  whyTitle: string;
  reasons: Block[];
  forTitle: string;
  audiences: Audience[];
  howTitle: string;
  steps: Block[];
  questionTitle: string;
  questionText: string;
  writeUs: string;
  hello: string;
  seeDeals: string;
  legal: string;
  privacy: string;
  cookies: string;
  terms: string;
}>({
  fr: {
    metaTitle: "À propos de nous",
    metaDescription:
      "Janga Explorer réunit les bons plans de Mahajanga au même endroit : restaurants, hôtels, activités et sorties, avec des offres vérifiées et un contact direct.",
    back: "À propos",
    kicker: "À propos de nous",
    title: "Tous les bons plans de Mahajanga, au même endroit",
    intro:
      "Janga Explorer est né d'un constat simple : à Mahajanga, les bonnes affaires existent, mais elles sont éparpillées entre pages Facebook, affiches et bouche-à-oreille. Nous les rassemblons, nous les vérifions, et nous vous mettons en contact direct avec l'établissement.",
    allTitle: "Le seul endroit où tout trouver",
    allText:
      "Plus besoin de faire le tour des réseaux sociaux : restaurants, hôtels, activités et sorties sont réunis sur un seul site, avec les mêmes informations pour chaque offre.",
    categories: {
      manger: "Menus du jour, formules, dîners en bord de mer, happy hours.",
      dormir: "Nuits en hôtel, bungalows, séjours et forfaits week-end.",
      activites: "Excursions, plongée, sorties en mer, découvertes de la région.",
      sorties: "Concerts, soirées, événements et animations du moment.",
    },
    whyTitle: "Pourquoi nous choisir",
    reasons: [
      {
        title: "Des offres vérifiées",
        text: "Avant la mise en ligne, nous appelons l'établissement pour confirmer le prix et les conditions. La date de la dernière vérification est indiquée sur chaque fiche.",
      },
      {
        title: "Des prix et des dates clairs",
        text: "Prix normal barré, prix de l'offre et remise : 80 000 Ar → 60 000 Ar, soit -25 %. « Valable jusqu'au… » est affiché, et l'offre disparaît le lendemain de sa date de fin.",
      },
      {
        title: "La localisation en un clic",
        text: "Le bouton « Voir la localisation » ouvre Google Maps sur l'établissement : vous y allez en tuk-tuk, en taxi ou à pied sans avoir à demander le chemin.",
      },
      {
        title: "Contact direct, 0 % de commission",
        text: "Un bouton WhatsApp avec un message déjà rédigé, ou un appel en un geste. Vous réservez et réglez directement avec l'établissement, au prix affiché.",
      },
      {
        title: "Gratuit, sans compte ni application",
        text: "Rien à installer, aucune inscription. Filtrez par budget (20 000, 50 000 ou 100 000 Ar maximum) et gardez vos coups de cœur en favoris sur votre téléphone.",
      },
      {
        title: "100 % Mahajanga",
        text: "Nous ne couvrons qu'une ville, et nous la connaissons bien : de Sotema à Amborovy, Antsanitia.",
      },
    ],
    forTitle: "Un service dédié à…",
    audiences: [
      {
        title: "Les habitants",
        points: [
          "Trouver un déjeuner à moins de 20 000 Ar près de chez soi",
          "Repérer les concerts et soirées du week-end en un coup d'œil",
          "Profiter des menus du jour et des happy hours du quartier",
        ],
        cta: "Voir les bons plans",
      },
      {
        title: "Les visiteurs",
        points: [
          "Touristes, voyageurs d'affaires et familles en vacances",
          "Comparer hôtels et bungalows : prix, remise et conditions sur la même fiche",
          "Réserver une excursion ou une plongée directement auprès du prestataire",
          "Trouver chaque adresse sur Google Maps en un clic",
        ],
        cta: "Hôtels et séjours",
      },
      {
        title: "Les professionnels",
        points: [
          "Hôtels, restaurants, prestataires d'activités et organisateurs d'événements",
          "Remplir les tables et les chambres les jours creux",
          "Publier des offres en quelques minutes, sans commission : abonnement mensuel après un mois d'essai, ou paiement à la journée pour un événement",
          "Être trouvé facilement grâce à la localisation Google Maps de l'offre",
        ],
        cta: "Publier une offre",
      },
    ],
    howTitle: "Comment ça marche",
    steps: [
      { title: "Explorez", text: "Par catégorie, par budget ou avec la recherche." },
      { title: "Comparez", text: "Prix, remise, conditions, date de fin : tout est sur la fiche." },
      { title: "Contactez", text: "Un message WhatsApp ou un appel, et vous réservez directement." },
    ],
    questionTitle: "Une question, une suggestion ?",
    questionText: "Écrivez-nous : c'est l'équipe Janga Explorer qui vous répond.",
    writeUs: "Nous écrire sur WhatsApp",
    hello: "Bonjour Janga Explorer, ",
    seeDeals: "Voir les bons plans",
    legal: "Informations légales",
    privacy: "Politique de confidentialité",
    cookies: "Cookies",
    terms: "Conditions d'utilisation",
  },
  en: {
    metaTitle: "About us",
    metaDescription:
      "Janga Explorer brings Mahajanga's best deals together in one place: restaurants, hotels, activities and nights out, with verified offers and direct contact.",
    back: "About us",
    kicker: "About us",
    title: "All of Mahajanga's best deals, in one place",
    intro:
      "Janga Explorer started from a simple observation: Mahajanga has plenty of good deals, but they're scattered across Facebook pages, posters and word of mouth. We gather them, we check them, and we put you in direct touch with the business.",
    allTitle: "One place to find it all",
    allText:
      "No need to scroll through every social network: restaurants, hotels, activities and nights out are on one site, with the same information for every deal.",
    categories: {
      manger: "Set menus, lunch deals, seaside dinners, happy hours.",
      dormir: "Hotel nights, bungalows, stays and weekend packages.",
      activites: "Excursions, diving, boat trips, exploring the region.",
      sorties: "Concerts, parties, events and what's on right now.",
    },
    whyTitle: "Why choose us",
    reasons: [
      {
        title: "Verified deals",
        text: "Before a deal goes live, we call the business to confirm the price and conditions. The date of the last check is shown on every deal.",
      },
      {
        title: "Clear prices and dates",
        text: "Usual price crossed out, deal price and discount: 80,000 Ar → 60,000 Ar, that's -25%. \"Valid until…\" is shown, and the deal disappears the day after it ends.",
      },
      {
        title: "Location in one tap",
        text: "The \"See the location\" button opens Google Maps on the business, so you can get there by tuk-tuk, taxi or on foot without asking for directions.",
      },
      {
        title: "Direct contact, 0% commission",
        text: "A WhatsApp button with a ready-made message, or a call in one tap. You book and pay the business directly, at the price shown.",
      },
      {
        title: "Free, no account or app needed",
        text: "Nothing to install, no sign-up. Filter by budget (20,000, 50,000 or 100,000 Ar max) and keep your favourites saved on your phone.",
      },
      {
        title: "100% Mahajanga",
        text: "We cover just one town, and we know it well: from Sotema to Amborovy and Antsanitia.",
      },
    ],
    forTitle: "A service for…",
    audiences: [
      {
        title: "Residents",
        points: [
          "Find lunch under 20,000 Ar near home",
          "Spot the weekend's concerts and parties at a glance",
          "Make the most of local set menus and happy hours",
        ],
        cta: "See the deals",
      },
      {
        title: "Visitors",
        points: [
          "Tourists, business travellers and families on holiday",
          "Compare hotels and bungalows: price, discount and conditions on one page",
          "Book an excursion or a dive directly with the operator",
          "Find every address on Google Maps in one tap",
        ],
        cta: "Hotels and stays",
      },
      {
        title: "Businesses",
        points: [
          "Hotels, restaurants, activity providers and event organisers",
          "Fill tables and rooms on quiet days",
          "Post deals in minutes, no commission: a monthly subscription after a one-month free trial, or pay per day for an event",
          "Be easy to find thanks to the deal's Google Maps location",
        ],
        cta: "Post a deal",
      },
    ],
    howTitle: "How it works",
    steps: [
      { title: "Explore", text: "By category, by budget or with search." },
      { title: "Compare", text: "Price, discount, conditions, end date: it's all on the deal page." },
      { title: "Get in touch", text: "Send a WhatsApp message or call, and book directly." },
    ],
    questionTitle: "A question or a suggestion?",
    questionText: "Write to us: the Janga Explorer team will get back to you.",
    writeUs: "Message us on WhatsApp",
    hello: "Hello Janga Explorer, ",
    seeDeals: "See the deals",
    legal: "Legal information",
    privacy: "Privacy policy",
    cookies: "Cookies",
    terms: "Terms of use",
  },
});

const REASON_ICONS = [BadgeCheck, Wallet, Navigation, MessageCircle, Heart, MapPin];
const AUDIENCE_ICONS = [House, Luggage, Store];
const AUDIENCE_LINKS = ["/bons-plans", "/bons-plans?cat=dormir", "/pro"];
const STEP_ICONS = [Search, Compass, PhoneCall];

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLocale()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function AProposPage() {
  const locale = await getLocale();
  const t = T[locale];
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;

  return (
    <>
      <div className="flex items-center gap-2 px-2 py-3 md:hidden">
        <BackButton fallback="/profil" />
        <p className="text-xl font-extrabold">{t.back}</p>
      </div>

      {/* Téléphone : carte arrondie. Tablette et ordinateur : bandeau pleine largeur, comme l'accueil. */}
      <section className="relative mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink to-sea-dark px-6 py-8 text-white md:mx-[calc(50%-50vw)] md:rounded-none md:px-8 md:py-20 md:text-center lg:py-24">
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-10 w-full text-sea/30 md:h-16"
          aria-hidden
        >
          <path d="M0 20c50 0 50-12 100-12s50 12 100 12 50-12 100-12 50 12 100 12v20H0Z" fill="currentColor" />
        </svg>
        <div className="relative mx-auto max-w-4xl">
          <p className="font-script text-2xl text-sun md:text-3xl">{t.kicker}</p>
          <h1 className="mt-2 text-2xl leading-tight font-extrabold md:font-display md:text-5xl md:leading-[1.05] md:font-bold md:text-balance md:uppercase lg:text-6xl">
            {t.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/85 md:mx-auto md:max-w-2xl md:text-lg">{t.intro}</p>
        </div>
      </section>

      <div className="space-y-12 px-4 pt-10 pb-6 md:space-y-16 md:pt-14">
        <section id="tout-trouver" className="scroll-mt-20">
          <SectionTitle>{t.allTitle}</SectionTitle>
          <p className="mt-3 max-w-3xl text-sm text-fg/80 md:text-base">{t.allText}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {CATEGORIES.map((c) => {
              const { icon: Icon, bg } = CATEGORY_STYLE[c.key];
              return (
                <li key={c.key}>
                  <Link
                    href={`/bons-plans?cat=${c.key}`}
                    className="flex h-full gap-4 rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:shadow-md lg:flex-col"
                  >
                    <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${bg} text-white shadow-sm`}>
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-bold">{c.tile[locale]}</span>
                      <span className="mt-0.5 block text-sm text-muted">{t.categories[c.key]}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="pourquoi" className="scroll-mt-20">
          <SectionTitle>{t.whyTitle}</SectionTitle>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {t.reasons.map(({ title, text }, i) => {
              const Icon = REASON_ICONS[i];
              return (
                <li key={title} className="flex gap-4 rounded-2xl bg-surface p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-sea shadow-sm">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-fg/75">{text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="pour-qui" className="scroll-mt-20">
          <SectionTitle>{t.forTitle}</SectionTitle>
          <ul className="mt-5 grid gap-4 md:grid-cols-3 lg:gap-5">
            {t.audiences.map(({ title, points, cta }, i) => {
              const Icon = AUDIENCE_ICONS[i];
              return (
                <li key={title} className="flex flex-col rounded-2xl border border-line p-5 shadow-sm">
                  <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
                  <ul className="mt-2 flex-1 space-y-2 text-sm text-fg/80">
                    {points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={AUDIENCE_LINKS[i]}
                    className="mt-4 flex items-center gap-1 text-sm font-bold text-sea hover:text-sea-dark"
                  >
                    {cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="comment" className="scroll-mt-20">
          <SectionTitle>{t.howTitle}</SectionTitle>
          <ol className="mt-5 grid gap-3 md:grid-cols-3 md:gap-5">
            {t.steps.map(({ title, text }, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={title} className="flex items-center gap-4 rounded-2xl border border-line p-4 md:flex-col md:p-6 md:text-center">
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-sea text-white">
                    <Icon className="size-6" aria-hidden />
                    <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-sun text-xs font-extrabold text-ink">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-3xl bg-brand-soft p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
          <div>
            <h2 className="text-lg font-extrabold md:text-2xl">{t.questionTitle}</h2>
            <p className="mt-1 text-sm text-fg/80 md:text-base">{t.questionText}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row md:mt-0 md:shrink-0">
            {contact && (
              <a
                href={whatsappLink(contact, t.hello)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm"
              >
                <MessageCircle className="size-4" aria-hidden />
                {t.writeUs}
              </a>
            )}
            <Link
              href="/bons-plans"
              className="flex items-center justify-center gap-2 rounded-full border border-brand bg-card px-5 py-3 text-sm font-bold text-brand"
            >
              {t.seeDeals}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>

        <nav aria-label={t.legal} className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
          <Link href="/confidentialite" className="hover:text-fg">
            {t.privacy}
          </Link>
          <Link href="/cookies" className="hover:text-fg">
            {t.cookies}
          </Link>
          <Link href="/conditions" className="hover:text-fg">
            {t.terms}
          </Link>
        </nav>
      </div>
    </>
  );
}
