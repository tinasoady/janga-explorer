import Link from "next/link";
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { CATEGORIES } from "@/lib/types";
import { ContactLinks } from "./contact-links";
import { LanguageSwitcher } from "./language-switcher";
import { legalPages } from "./legal-page";
import { LogoMark } from "./logo";

const T = messages({
  fr: {
    tagline: "Les bons plans de Mahajanga, au bon moment.",
    contact: "Nous contacter",
    legal: "Informations légales",
    about: "À propos",
    aboutUs: "À propos de nous",
    why: "Pourquoi nous choisir",
    forWho: "À qui s'adresse le service",
    sections: "Rubriques",
    all: "Tous les bons plans",
    account: "Mon compte",
    profile: "Profil",
    favorites: "Mes favoris",
    alerts: "Mes alertes",
    pros: "Professionnels",
    publish: "Publier une offre",
    proSpace: "Espace pro",
  },
  en: {
    tagline: "The best deals in Mahajanga, right when you need them.",
    contact: "Contact us",
    legal: "Legal information",
    about: "About",
    aboutUs: "About us",
    why: "Why choose us",
    forWho: "Who the service is for",
    sections: "Sections",
    all: "All deals",
    account: "My account",
    profile: "Profile",
    favorites: "My saved deals",
    alerts: "My alerts",
    pros: "Businesses",
    publish: "Post a deal",
    proSpace: "Business space",
  },
});

function columns(locale: Locale) {
  const t = T[locale];
  return [
    {
      title: t.about,
      links: [
        { href: "/a-propos", label: t.aboutUs },
        { href: "/a-propos#pourquoi", label: t.why },
        { href: "/a-propos#pour-qui", label: t.forWho },
      ],
    },
    {
      title: t.sections,
      links: [
        { href: "/bons-plans", label: t.all },
        ...CATEGORIES.map((c) => ({ href: `/bons-plans?cat=${c.key}`, label: c.tile[locale] })),
      ],
    },
    {
      title: t.account,
      links: [
        { href: "/profil", label: t.profile },
        { href: "/favoris", label: t.favorites },
        { href: "/alertes", label: t.alerts },
      ],
    },
    {
      title: t.pros,
      links: [
        { href: "/pro", label: t.publish },
        { href: "/espace-pro", label: t.proSpace },
      ],
    },
  ];
}

/** Pied de page de tablette et d'ordinateur (sur téléphone, la barre du bas occupe cet espace). */
export async function SiteFooter() {
  const locale = await getLocale();
  const t = T[locale];
  return (
    <footer className="hidden bg-ink text-white/75 md:block">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8 py-12 text-sm lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:px-12">
        <div className="col-span-4 lg:col-span-1">
          <p className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <LogoMark variant="dark" />
            <span>
              Janga <span className="text-brand">Explorer</span>
            </span>
          </p>
          <p className="mt-3 max-w-xs leading-relaxed">{t.tagline}</p>
          <p className="mt-5 font-display text-base font-semibold tracking-wide text-white uppercase">{t.contact}</p>
          <div className="mt-3">
            <ContactLinks />
          </div>
        </div>
        {columns(locale).map((col) => (
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
          <LanguageSwitcher tone="dark" />
          <nav aria-label={t.legal} className="flex gap-5">
            {legalPages(locale).map((p) => (
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
