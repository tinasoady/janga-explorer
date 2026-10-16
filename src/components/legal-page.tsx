import Link from "next/link";
import type { ReactNode } from "react";
import { BackButton } from "./back-button";
import { whatsappLink } from "@/lib/format";

export const LEGAL_PAGES = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/conditions", label: "Conditions d'utilisation" },
] as const;

/** Date affichée en tête des pages légales : à changer à chaque modification de leur contenu. */
const LAST_UPDATE = "16 octobre 2026";

/** Mise en page commune aux pages légales : titre, onglets entre les documents et texte en colonne lisible. */
export function LegalPage({
  title,
  current,
  intro,
  children,
}: {
  title: string;
  current: (typeof LEGAL_PAGES)[number]["href"];
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      <header className="flex items-center gap-2 px-2 py-3 md:px-4 md:pt-8 md:pb-2">
        <BackButton fallback="/a-propos" className="md:hidden" />
        <h1 className="text-xl font-extrabold md:font-display md:text-4xl md:font-bold md:tracking-wide md:uppercase">
          {title}
        </h1>
      </header>
      <p className="px-4 text-xs text-muted md:text-sm">Dernière mise à jour : {LAST_UPDATE}</p>

      <nav aria-label="Informations légales" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
        {LEGAL_PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap ${
              p.href === current ? "border-ink bg-ink text-white" : "border-line text-ink hover:bg-surface"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 px-4 text-[15px] leading-relaxed text-ink/85 [&_a]:font-semibold [&_a]:text-sea [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <div className="rounded-2xl bg-surface p-4 text-sm [&>p:first-child]:mt-0">{intro}</div>
        {children}
      </div>
    </div>
  );
}

/** Moyen de contact pour exercer ses droits ou poser une question. */
export function LegalContact() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  if (!contact) return <>depuis la page <Link href="/pro">Espace pro</Link></>;
  return (
    <>
      sur WhatsApp au{" "}
      <a href={whatsappLink(contact, "Bonjour Janga Explorer, ")} target="_blank" rel="noopener noreferrer">
        +{contact}
      </a>
    </>
  );
}
