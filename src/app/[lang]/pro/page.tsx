import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, BarChart3, CalendarRange, MessageCircle, Repeat, Send, ShieldCheck, Store } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { formatAriary, whatsappLink } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getPublicPricing } from "@/lib/offers";

type Block = { title: string; text: string };

const T = messages<{
  metaTitle: string;
  metaDescription: string;
  title: string;
  kicker: string;
  heroTitle: string;
  heroText: string;
  benefits: string[];
  plansTitle: string;
  monthly: string;
  perMonth: string;
  monthlyText: string;
  trial: (days: number) => string;
  daily: string;
  perDay: string;
  dailyText: string;
  howTitle: string;
  steps: Block[];
  open: string;
  request: string;
  question: string;
  hello: string;
}>({
  fr: {
    metaTitle: "Espace pro",
    metaDescription: "Restaurants, hôtels, organisateurs : publiez vos offres sur Janga Explorer.",
    title: "Espace pro",
    kicker: "Restaurants · Hôtels · Activités · Événements",
    heroTitle: "Remplissez vos tables et vos chambres grâce aux bons plans.",
    heroText:
      "Janga Explorer est le réflexe local pour savoir quoi faire aujourd'hui à Mahajanga. Vos offres y sont vues par les habitants et les visiteurs, au moment où ils choisissent.",
    benefits: [
      "Les clients vous écrivent sur WhatsApp ou vous appellent : pas d'intermédiaire, sans commission sur vos ventes.",
      "Vous voyez combien de personnes ont regardé chaque offre et combien vous ont contacté.",
    ],
    plansTitle: "Deux formules, payables par Mobile Money",
    monthly: "Abonnement mensuel",
    perMonth: "/ mois",
    monthlyText: "Offres illimitées pendant la période payée.",
    trial: (days) => ` Les ${days} premiers jours sont offerts.`,
    daily: "À la durée, sans abonnement",
    perDay: "/ jour et par offre",
    dailyText:
      "Pour un événement ou une promotion de quelques jours : vous payez seulement les jours où l'offre est visible.",
    howTitle: "Comment ça marche",
    steps: [
      {
        title: "Demandez votre compte",
        text: "Présentez votre établissement : nom, activité, localité, capacité et un justificatif. Nous le vérifions avant d'activer le compte.",
      },
      {
        title: "Publiez votre offre",
        text: "Depuis votre espace : une photo, le prix normal et le prix de l'offre, les conditions et la date de fin.",
      },
      {
        title: "Nous la vérifions avec vous",
        text: "Un appel rapide pour confirmer le prix et les conditions. C'est ce qui donne le badge « Offre vérifiée ».",
      },
      {
        title: "Elle est en ligne",
        text: "Les clients la trouvent par catégorie, budget ou recherche, et vous contactent directement.",
      },
    ],
    open: "Accéder à mon espace pro",
    request: "Pas encore de compte ? Demander un compte pro",
    question: "Une question ? Écrivez-nous sur WhatsApp",
    hello: "Bonjour, je souhaite publier une offre sur Janga Explorer.",
  },
  en: {
    metaTitle: "For businesses",
    metaDescription: "Restaurants, hotels, organisers: post your deals on Janga Explorer.",
    title: "For businesses",
    kicker: "Restaurants · Hotels · Activities · Events",
    heroTitle: "Fill your tables and rooms with great deals.",
    heroText:
      "Janga Explorer is where people in Mahajanga check what to do today. Residents and visitors see your deals right when they're deciding.",
    benefits: [
      "Customers message you on WhatsApp or call you: no middleman, no commission on your sales.",
      "You can see how many people viewed each deal and how many contacted you.",
    ],
    plansTitle: "Two plans, paid by Mobile Money",
    monthly: "Monthly subscription",
    perMonth: "/ month",
    monthlyText: "Unlimited deals during the paid period.",
    trial: (days) => ` Your first ${days} days are free.`,
    daily: "Pay per day, no subscription",
    perDay: "/ day per deal",
    dailyText: "For an event or a promotion lasting a few days: you only pay for the days the deal is visible.",
    howTitle: "How it works",
    steps: [
      {
        title: "Request your account",
        text: "Tell us about your business: name, type, location, capacity and proof. We check it before activating the account.",
      },
      {
        title: "Post your deal",
        text: "From your space: a photo, the usual price and the deal price, the conditions and the end date.",
      },
      {
        title: "We check it with you",
        text: "A quick call to confirm the price and conditions. That's what earns the \"Verified deal\" badge.",
      },
      {
        title: "It goes live",
        text: "Customers find it by category, budget or search, and contact you directly.",
      },
    ],
    open: "Go to my business space",
    request: "No account yet? Request a business account",
    question: "A question? Message us on WhatsApp",
    hello: "Hello, I'd like to post a deal on Janga Explorer.",
  },
});

const STEP_ICONS = [Send, Send, ShieldCheck, BadgeCheck];
const BENEFIT_ICONS = [MessageCircle, BarChart3];

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLocale()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function ProPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  const [pricing, locale] = await Promise.all([getPublicPricing(), getLocale()]);
  const t = T[locale];

  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/" />
        <h1 className="text-xl font-extrabold">{t.title}</h1>
      </header>

      <div className="space-y-6 px-5 pb-8">
        <section className="rounded-3xl bg-ink p-6 text-white">
          <p className="text-sm font-semibold text-brand">{t.kicker}</p>
          <h2 className="mt-2 text-2xl leading-tight font-extrabold">{t.heroTitle}</h2>
          <p className="mt-3 text-sm text-white/80">{t.heroText}</p>
        </section>

        <ul className="space-y-3">
          {t.benefits.map((text, i) => {
            const Icon = BENEFIT_ICONS[i];
            return (
              <li key={text} className="flex gap-3 text-sm">
                <Icon className="size-5 shrink-0 text-verified" aria-hidden />
                {text}
              </li>
            );
          })}
        </ul>

        <section>
          <h2 className="text-lg font-extrabold">{t.plansTitle}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-brand bg-white p-4">
              <p className="flex items-center gap-2 font-bold">
                <Repeat className="size-5 text-brand" aria-hidden />
                {t.monthly}
              </p>
              {pricing && (
                <p className="mt-2 text-2xl font-extrabold">
                  {formatAriary(pricing.monthlyPrice, locale)}{" "}
                  <span className="text-sm font-semibold text-muted">{t.perMonth}</span>
                </p>
              )}
              <p className="mt-1 text-sm text-ink/80">
                {t.monthlyText}
                {pricing && pricing.trialDays > 0 && t.trial(pricing.trialDays)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="flex items-center gap-2 font-bold">
                <CalendarRange className="size-5 text-sea" aria-hidden />
                {t.daily}
              </p>
              {pricing && (
                <p className="mt-2 text-2xl font-extrabold">
                  {formatAriary(pricing.dayPrice, locale)}{" "}
                  <span className="text-sm font-semibold text-muted">{t.perDay}</span>
                </p>
              )}
              <p className="mt-1 text-sm text-ink/80">{t.dailyText}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">{t.howTitle}</h2>
          <ol className="mt-3 space-y-3">
            {t.steps.map(({ title, text }, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={title} className="flex gap-3 rounded-2xl border border-line p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold">
                      {i + 1}. {title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-3">
          <Link
            href="/espace-pro"
            className="flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-white shadow-md shadow-brand/30"
          >
            <Store className="size-5" aria-hidden />
            {t.open}
          </Link>
          <Link
            href="/connexion?mode=inscription&next=%2Fespace-pro"
            className="flex items-center justify-center gap-2 rounded-full border border-brand py-3 text-sm font-bold text-brand"
          >
            {t.request}
          </Link>
          {contact && (
            <a
              href={whatsappLink(contact, t.hello)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-semibold"
            >
              <MessageCircle className="size-5 text-verified" aria-hidden />
              {t.question}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
