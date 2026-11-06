import Link from "next/link";
import type { ReactNode } from "react";
import { BackButton } from "./back-button";
import { formatLongDate, whatsappLink } from "@/lib/format";
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const PAGES = ["/confidentialite", "/cookies", "/conditions"] as const;
type LegalHref = (typeof PAGES)[number];

const T = messages({
  fr: {
    labels: { "/confidentialite": "Confidentialité", "/cookies": "Cookies", "/conditions": "Conditions d'utilisation" },
    updated: "Dernière mise à jour :",
    legal: "Informations légales",
  },
  en: {
    labels: { "/confidentialite": "Privacy", "/cookies": "Cookies", "/conditions": "Terms of use" },
    updated: "Last updated:",
    legal: "Legal information",
  },
});

export function legalPages(locale: Locale) {
  return PAGES.map((href) => ({ href, label: T[locale].labels[href] }));
}

/** Date affichée en tête des pages légales (YYYY-MM-DD) : à changer à chaque modification de leur contenu. */
const LAST_UPDATE = "2026-11-06";

/** Mise en page commune aux pages légales : titre, onglets entre les documents et texte en colonne lisible. */
export async function LegalPage({
  title,
  current,
  intro,
  children,
}: {
  title: string;
  current: LegalHref;
  intro: ReactNode;
  children: ReactNode;
}) {
  const locale = await getLocale();
  const t = T[locale];
  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      <header className="flex items-center gap-2 px-2 py-3 md:px-4 md:pt-8 md:pb-2">
        <BackButton fallback="/a-propos" className="md:hidden" />
        <h1 className="text-xl font-extrabold md:font-display md:text-4xl md:font-bold md:tracking-wide md:uppercase">
          {title}
        </h1>
      </header>
      <p className="px-4 text-xs text-muted md:text-sm">
        {t.updated} {formatLongDate(LAST_UPDATE, locale)}
      </p>

      <nav aria-label={t.legal} className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
        {legalPages(locale).map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap ${
              p.href === current ? "border-fg bg-fg text-card" : "border-line text-fg hover:bg-surface"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 px-4 text-[15px] leading-relaxed text-fg/85 [&_a]:font-semibold [&_a]:text-sea [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-fg [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-fg [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <div className="rounded-2xl bg-surface p-4 text-sm [&>p:first-child]:mt-0">{intro}</div>
        {children}
      </div>
    </div>
  );
}

/** Moyen de contact pour exercer ses droits ou poser une question. */
export async function LegalContact() {
  const en = (await getLocale()) === "en";
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  if (!contact) {
    return en ? <>from the <Link href="/pro">Business space</Link> page</> : <>depuis la page <Link href="/pro">Espace pro</Link></>;
  }
  return (
    <>
      {en ? "on WhatsApp at" : "sur WhatsApp au"}{" "}
      <a
        href={whatsappLink(contact, en ? "Hello Janga Explorer, " : "Bonjour Janga Explorer, ")}
        target="_blank"
        rel="noopener noreferrer"
      >
        +{contact}
      </a>
    </>
  );
}
