"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Tag, User } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Accueil", icon: House, match: (p: string) => p === "/" },
  {
    href: "/bons-plans",
    label: "Bons plans",
    icon: Tag,
    match: (p: string) => p.startsWith("/bons-plans") || p.startsWith("/offres"),
  },
  { href: "/favoris", label: "Favoris", icon: Heart, match: (p: string) => p.startsWith("/favoris") },
  {
    href: "/profil",
    label: "Profil",
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
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
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
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
