"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { House } from "lucide-react";
import { messages, type Locale } from "@/lib/i18n";
import { CATEGORIES, isCategory } from "@/lib/types";
import { useLocale } from "./locale-provider";

/** "home", "all" (toutes les offres), "about" ou une clé de catégorie. */
type ActiveKey = string | null;

const T = messages({
  fr: { home: "Accueil", all: "Tous les bons plans", about: "À propos" },
  en: { home: "Home", all: "All deals", about: "About us" },
});

const items = (locale: Locale) => [
  { key: "all", href: "/bons-plans", label: T[locale].all },
  ...CATEGORIES.map((c) => ({ key: c.key as string, href: `/bons-plans?cat=${c.key}`, label: c.tile[locale] })),
  { key: "about", href: "/a-propos", label: T[locale].about },
];

/** Bandeau bleu des rubriques (tablette et ordinateur), avec la rubrique courante mise en avant. */
export function CategoryBar() {
  const pathname = usePathname();
  const cat = useSearchParams().get("cat");

  let active: ActiveKey = null;
  if (pathname === "/") active = "home";
  else if (pathname.startsWith("/a-propos")) active = "about";
  else if (pathname.startsWith("/bons-plans")) active = isCategory(cat) ? cat : "all";

  return <CategoryBarLinks active={active} />;
}

/** Rendu sans état actif : sert aussi de repli pendant que l'URL n'est pas encore connue. */
export function CategoryBarLinks({ active = null }: { active?: ActiveKey }) {
  const locale = useLocale();
  const item = (key: string) =>
    `flex shrink-0 items-center border-b-[3px] px-4 font-display text-[15px] font-semibold tracking-wide uppercase transition lg:px-5 lg:text-base ${
      active === key
        ? "border-sun bg-sea-dark text-white"
        : "border-transparent text-white/95 hover:bg-sea-dark hover:text-white"
    }`;

  return (
    <ul className="no-scrollbar flex h-14 items-stretch overflow-x-auto">
      <li className="flex">
        <Link
          href="/"
          aria-label={T[locale].home}
          aria-current={active === "home" ? "page" : undefined}
          className={item("home")}
        >
          <House className="size-5" strokeWidth={2.4} aria-hidden />
        </Link>
      </li>
      {items(locale).map(({ key, href, label }) => (
        <li key={key} className="flex items-center before:h-5 before:w-px before:bg-white/40">
          <Link href={href} aria-current={active === key ? "page" : undefined} className={`${item(key)} h-full`}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
