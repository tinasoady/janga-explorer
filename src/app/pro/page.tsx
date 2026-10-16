import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MessageCircle, Send, ShieldCheck, Store, Wallet } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { whatsappLink } from "@/lib/format";

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
  { icon: Wallet, text: "Un mois d'essai gratuit, puis un abonnement mensuel payable par Mobile Money : offres illimitées, sans commission sur vos ventes." },
  { icon: MessageCircle, text: "Les clients vous écrivent sur WhatsApp ou vous appellent : pas d'intermédiaire." },
];

export default function ProPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;

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
