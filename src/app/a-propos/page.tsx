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
  type LucideIcon,
} from "lucide-react";
import { BackButton } from "@/components/back-button";
import { CATEGORY_STYLE } from "@/components/category";
import { SectionTitle } from "@/components/section-title";
import { whatsappLink } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "À propos de nous",
  description:
    "Janga Explorer réunit les bons plans de Mahajanga au même endroit : restaurants, hôtels, activités et sorties, avec des offres vérifiées et un contact direct.",
};

const CATEGORY_TEXT: Record<(typeof CATEGORIES)[number]["key"], string> = {
  manger: "Menus du jour, formules, dîners en bord de mer, happy hours.",
  dormir: "Nuits en hôtel, bungalows, séjours et forfaits week-end.",
  activites: "Excursions, plongée, sorties en mer, découvertes de la région.",
  sorties: "Concerts, soirées, événements et animations du moment.",
};

const REASONS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: BadgeCheck,
    title: "Des offres vérifiées",
    text: "Avant la mise en ligne, nous appelons l'établissement pour confirmer le prix et les conditions. La date de la dernière vérification est indiquée sur chaque fiche.",
  },
  {
    icon: Wallet,
    title: "Des prix et des dates clairs",
    text: "Prix normal barré, prix de l'offre et remise : 80 000 Ar → 60 000 Ar, soit -25 %. « Valable jusqu'au… » est affiché, et l'offre disparaît le lendemain de sa date de fin.",
  },
  {
    icon: Navigation,
    title: "La localisation en un clic",
    text: "Le bouton « Voir la localisation » ouvre Google Maps sur l'établissement : vous y allez en tuk-tuk, en taxi ou à pied sans avoir à demander le chemin.",
  },
  {
    icon: MessageCircle,
    title: "Contact direct, 0 % de commission",
    text: "Un bouton WhatsApp avec un message déjà rédigé, ou un appel en un geste. Vous réservez et réglez directement avec l'établissement, au prix affiché.",
  },
  {
    icon: Heart,
    title: "Gratuit, sans compte ni application",
    text: "Rien à installer, aucune inscription. Filtrez par budget (20 000, 50 000 ou 100 000 Ar maximum) et gardez vos coups de cœur en favoris sur votre téléphone.",
  },
  {
    icon: MapPin,
    title: "100 % Mahajanga",
    text: "Nous ne couvrons qu'une ville, et nous la connaissons bien : de Sotema à Amborovy, Antsanitia.",
  },
];

const AUDIENCES: { icon: LucideIcon; title: string; points: string[]; cta: { href: string; label: string } }[] = [
  {
    icon: House,
    title: "Les habitants",
    points: [
      "Trouver un déjeuner à moins de 20 000 Ar près de chez soi",
      "Repérer les concerts et soirées du week-end en un coup d'œil",
      "Profiter des menus du jour et des happy hours du quartier",
    ],
    cta: { href: "/bons-plans", label: "Voir les bons plans" },
  },
  {
    icon: Luggage,
    title: "Les visiteurs",
    points: [
      "Touristes, voyageurs d'affaires et familles en vacances",
      "Comparer hôtels et bungalows : prix, remise et conditions sur la même fiche",
      "Réserver une excursion ou une plongée directement auprès du prestataire",
      "Trouver chaque adresse sur Google Maps en un clic",
    ],
    cta: { href: "/bons-plans?cat=dormir", label: "Hôtels et séjours" },
  },
  {
    icon: Store,
    title: "Les professionnels",
    points: [
      "Hôtels, restaurants, prestataires d'activités et organisateurs d'événements",
      "Remplir les tables et les chambres les jours creux",
      "Publier une offre en quelques minutes, sans commission, gratuitement pendant le lancement",
      "Être trouvé facilement grâce à la localisation Google Maps de l'offre",
    ],
    cta: { href: "/pro", label: "Publier une offre" },
  },
];

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Search, title: "Explorez", text: "Par catégorie, par budget ou avec la recherche." },
  { icon: Compass, title: "Comparez", text: "Prix, remise, conditions, date de fin : tout est sur la fiche." },
  { icon: PhoneCall, title: "Contactez", text: "Un message WhatsApp ou un appel, et vous réservez directement." },
];

export default function AProposPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;

  return (
    <>
      <div className="flex items-center gap-2 px-2 py-3 md:hidden">
        <BackButton fallback="/profil" />
        <p className="text-xl font-extrabold">À propos</p>
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
          <p className="font-script text-2xl text-sun md:text-3xl">À propos de nous</p>
          <h1 className="mt-2 text-2xl leading-tight font-extrabold md:font-display md:text-5xl md:leading-[1.05] md:font-bold md:text-balance md:uppercase lg:text-6xl">
            Tous les bons plans de Mahajanga, au même endroit
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/85 md:mx-auto md:max-w-2xl md:text-lg">
            Janga Explorer est né d&apos;un constat simple : à Mahajanga, les bonnes affaires existent, mais elles sont
            éparpillées entre pages Facebook, affiches et bouche-à-oreille. Nous les rassemblons, nous les vérifions, et
            nous vous mettons en contact direct avec l&apos;établissement.
          </p>
        </div>
      </section>

      <div className="space-y-12 px-4 pt-10 pb-6 md:space-y-16 md:pt-14">
        <section id="tout-trouver" className="scroll-mt-20">
          <SectionTitle>Le seul endroit où tout trouver</SectionTitle>
          <p className="mt-3 max-w-3xl text-sm text-ink/80 md:text-base">
            Plus besoin de faire le tour des réseaux sociaux : restaurants, hôtels, activités et sorties sont réunis sur
            un seul site, avec les mêmes informations pour chaque offre.
          </p>
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
                      <span className="block font-bold">{c.tile}</span>
                      <span className="mt-0.5 block text-sm text-muted">{CATEGORY_TEXT[c.key]}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="pourquoi" className="scroll-mt-20">
          <SectionTitle>Pourquoi nous choisir</SectionTitle>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-surface p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-sea shadow-sm">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-ink/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="pour-qui" className="scroll-mt-20">
          <SectionTitle>Un service dédié à…</SectionTitle>
          <ul className="mt-5 grid gap-4 md:grid-cols-3 lg:gap-5">
            {AUDIENCES.map(({ icon: Icon, title, points, cta }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-line p-5 shadow-sm">
                <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
                <ul className="mt-2 flex-1 space-y-2 text-sm text-ink/80">
                  {points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={cta.href} className="mt-4 flex items-center gap-1 text-sm font-bold text-sea hover:text-sea-dark">
                  {cta.label}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="comment" className="scroll-mt-20">
          <SectionTitle>Comment ça marche</SectionTitle>
          <ol className="mt-5 grid gap-3 md:grid-cols-3 md:gap-5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
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
            ))}
          </ol>
        </section>

        <section className="rounded-3xl bg-brand-soft p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
          <div>
            <h2 className="text-lg font-extrabold md:text-2xl">Une question, une suggestion ?</h2>
            <p className="mt-1 text-sm text-ink/80 md:text-base">
              Écrivez-nous : c&apos;est l&apos;équipe Janga Explorer qui vous répond.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row md:mt-0 md:shrink-0">
            {contact && (
              <a
                href={whatsappLink(contact, "Bonjour Janga Explorer, ")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm"
              >
                <MessageCircle className="size-4" aria-hidden />
                Nous écrire sur WhatsApp
              </a>
            )}
            <Link
              href="/bons-plans"
              className="flex items-center justify-center gap-2 rounded-full border border-brand bg-white px-5 py-3 text-sm font-bold text-brand"
            >
              Voir les bons plans
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>

        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
          <Link href="/confidentialite" className="hover:text-ink">
            Politique de confidentialité
          </Link>
          <Link href="/cookies" className="hover:text-ink">
            Cookies
          </Link>
          <Link href="/conditions" className="hover:text-ink">
            Conditions d&apos;utilisation
          </Link>
        </nav>
      </div>
    </>
  );
}
