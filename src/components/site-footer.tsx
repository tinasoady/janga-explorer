import Link from "next/link";
import { CATEGORIES } from "@/lib/types";
import { LogoMark } from "./logo";

const COLUMNS = [
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
      <div className="mx-auto grid max-w-6xl grid-cols-[1.4fr_repeat(3,1fr)] gap-8 px-8 py-12 text-sm lg:px-12">
        <div>
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
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © Janga Explorer · Mahajanga, Madagascar
      </p>
    </footer>
  );
}
