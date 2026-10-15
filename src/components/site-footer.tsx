import Link from "next/link";
import { CATEGORIES } from "@/lib/types";
import { LEGAL_PAGES } from "./legal-page";
import { LogoMark } from "./logo";

const COLUMNS = [
  {
    title: "À propos",
    links: [
      { href: "/a-propos", label: "À propos de nous" },
      { href: "/a-propos#pourquoi", label: "Pourquoi nous choisir" },
      { href: "/a-propos#pour-qui", label: "À qui s'adresse le service" },
    ],
  },
  {
    title: "Rubriques",
    links: [
      { href: "/bons-plans", label: "Tous les bons plans" },
      ...CATEGORIES.map((c) => ({ href: `/bons-plans?cat=${c.key}`, label: c.tile })),
    ],
  },
  {
    title: "Mon compte",
    links: [
      { href: "/profil", label: "Profil" },
      { href: "/favoris", label: "Mes favoris" },
      { href: "/alertes", label: "Mes alertes" },
    ],
  },
  {
    title: "Professionnels",
    links: [
      { href: "/pro", label: "Publier une offre" },
      { href: "/espace-pro", label: "Espace pro" },
    ],
  },
];

/** Pied de page de tablette et d'ordinateur (sur téléphone, la barre du bas occupe cet espace). */
export function SiteFooter() {
  return (
    <footer className="hidden bg-ink text-white/75 md:block">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8 py-12 text-sm lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:px-12">
        <div className="col-span-4 lg:col-span-1">
          <p className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <LogoMark />
            Janga Explorer
          </p>
          <p className="mt-3 max-w-xs leading-relaxed">Les bons plans de Mahajanga, au bon moment.</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-display text-base font-semibold tracking-wide text-white uppercase">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-sun">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-8 py-4 text-xs text-white/50 lg:px-12">
          <p>© Janga Explorer · Mahajanga, Madagascar</p>
          <nav aria-label="Informations légales" className="flex gap-5">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="transition hover:text-white">
                {p.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
