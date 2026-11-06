import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, BarChart3, CalendarRange, MessageCircle, Repeat, Send, ShieldCheck, Store } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { formatAriary, whatsappLink } from "@/lib/format";
import { getPublicPricing } from "@/lib/offers";

export const metadata: Metadata = {
  title: "Espace pro",
  description: "Restaurants, hôtels, organisateurs : publiez vos offres sur Janga Explorer.",
};

const STEPS = [
  {
    icon: Send,
    title: "Demandez votre compte",
    text: "Présentez votre établissement : nom, activité, localité, capacité et un justificatif. Nous le vérifions avant d'activer le compte.",
  },
  {
    icon: Send,
    title: "Publiez votre offre",
    text: "Depuis votre espace : une photo, le prix normal et le prix de l'offre, les conditions et la date de fin.",
  },
  {
    icon: ShieldCheck,
    title: "Nous la vérifions avec vous",
    text: "Un appel rapide pour confirmer le prix et les conditions. C'est ce qui donne le badge « Offre vérifiée ».",
  },
  {
    icon: BadgeCheck,
    title: "Elle est en ligne",
    text: "Les clients la trouvent par catégorie, budget ou recherche, et vous contactent directement.",
  },
];

const BENEFITS = [
  { icon: MessageCircle, text: "Les clients vous écrivent sur WhatsApp ou vous appellent : pas d'intermédiaire, sans commission sur vos ventes." },
  { icon: BarChart3, text: "Vous voyez combien de personnes ont regardé chaque offre et combien vous ont contacté." },
];

export default async function ProPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  const pricing = await getPublicPricing();

  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/" />
        <h1 className="text-xl font-extrabold">Espace pro</h1>
      </header>

      <div className="space-y-6 px-5 pb-8">
        <section className="rounded-3xl bg-ink p-6 text-white">
          <p className="text-sm font-semibold text-brand">Restaurants · Hôtels · Activités · Événements</p>
          <h2 className="mt-2 text-2xl leading-tight font-extrabold">
            Remplissez vos tables et vos chambres grâce aux bons plans.
          </h2>
          <p className="mt-3 text-sm text-white/80">
            Janga Explorer est le réflexe local pour savoir quoi faire aujourd&apos;hui à Mahajanga. Vos offres y
            sont vues par les habitants et les visiteurs, au moment où ils choisissent.
          </p>
        </section>

        <ul className="space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm">
              <Icon className="size-5 shrink-0 text-verified" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <section>
          <h2 className="text-lg font-extrabold">Deux formules, payables par Mobile Money</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-brand bg-white p-4">
              <p className="flex items-center gap-2 font-bold">
                <Repeat className="size-5 text-brand" aria-hidden />
                Abonnement mensuel
              </p>
              {pricing && (
                <p className="mt-2 text-2xl font-extrabold">
                  {formatAriary(pricing.monthlyPrice)} <span className="text-sm font-semibold text-muted">/ mois</span>
                </p>
              )}
              <p className="mt-1 text-sm text-ink/80">
                Offres illimitées pendant la période payée.
                {pricing && pricing.trialDays > 0 && ` Les ${pricing.trialDays} premiers jours sont offerts.`}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="flex items-center gap-2 font-bold">
                <CalendarRange className="size-5 text-sea" aria-hidden />
                À la durée, sans abonnement
              </p>
              {pricing && (
                <p className="mt-2 text-2xl font-extrabold">
                  {formatAriary(pricing.dayPrice)}{" "}
                  <span className="text-sm font-semibold text-muted">/ jour et par offre</span>
                </p>
              )}
              <p className="mt-1 text-sm text-ink/80">
                Pour un événement ou une promotion de quelques jours : vous payez seulement les jours où l&apos;offre
                est visible.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Comment ça marche</h2>
          <ol className="mt-3 space-y-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
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
            ))}
          </ol>
        </section>

        <div className="space-y-3">
          <Link
            href="/espace-pro"
            className="flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-white shadow-md shadow-brand/30"
          >
            <Store className="size-5" aria-hidden />
            Accéder à mon espace pro
          </Link>
          <Link
            href="/connexion?mode=inscription&next=%2Fespace-pro"
            className="flex items-center justify-center gap-2 rounded-full border border-brand py-3 text-sm font-bold text-brand"
          >
            Pas encore de compte ? Demander un compte pro
          </Link>
          {contact && (
            <a
              href={whatsappLink(contact, "Bonjour, je souhaite publier une offre sur Janga Explorer.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-semibold"
            >
              <MessageCircle className="size-5 text-verified" aria-hidden />
              Une question ? Écrivez-nous sur WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  );
}
