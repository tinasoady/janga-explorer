"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Tag, User } from "lucide-react";
import { messages } from "@/lib/i18n";
import { useLocale } from "./locale-provider";

const T = messages({
  fr: { nav: "Navigation principale", home: "Accueil", deals: "Bons plans", favorites: "Favoris", profile: "Profil" },
  en: { nav: "Main navigation", home: "Home", deals: "Deals", favorites: "Saved", profile: "Profile" },
});

const ITEMS = [
  { href: "/", label: "home", icon: House, match: (p: string) => p === "/" },
  {
    href: "/bons-plans",
    label: "deals",
    icon: Tag,
    match: (p: string) => p.startsWith("/bons-plans") || p.startsWith("/offres"),
  },
  { href: "/favoris", label: "favorites", icon: Heart, match: (p: string) => p.startsWith("/favoris") },
  {
    href: "/profil",
    label: "profile",
    icon: User,
    match: (p: string) =>
      [
        "/profil",
        "/pro",
        "/espace-pro",
        "/connexion",
        "/alertes",
        "/admin",
        "/a-propos",
        "/confidentialite",
        "/cookies",
        "/conditions",
      ].some((prefix) => p.startsWith(prefix)),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = T[useLocale()];

  return (
    <nav
      aria-label={t.nav}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon className={`size-[22px] ${active ? "fill-brand/15" : ""}`} strokeWidth={active ? 2.3 : 1.8} />
                {t[label]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
