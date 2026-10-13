"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Store, Tag, User } from "lucide-react";

const LINKS = [
  { href: "/", label: "Accueil", icon: House, match: (p: string) => p === "/" },
  {
    href: "/bons-plans",
    label: "Bons plans",
    icon: Tag,
    match: (p: string) => p.startsWith("/bons-plans") || p.startsWith("/offres"),
  },
  { href: "/favoris", label: "Favoris", icon: Heart, match: (p: string) => p.startsWith("/favoris") },
] as const;

const ACCOUNT_PREFIXES = ["/profil", "/connexion", "/admin"];

/** Navigation de l'en-tête (tablette et ordinateur). Sur téléphone, c'est la barre du bas qui prend le relais. */
export function HeaderNav() {
  const pathname = usePathname();
  const onPro = pathname.startsWith("/pro") || pathname.startsWith("/espace-pro");
  const onAccount = ACCOUNT_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <>
      <nav aria-label="Navigation principale" className="flex items-center gap-1">
        {LINKS.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition hover:bg-surface ${
                active ? "bg-brand-soft text-brand" : "text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/pro"
          aria-current={onPro ? "page" : undefined}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition hover:bg-surface ${
            onPro ? "border-brand text-brand" : "border-line text-ink"
          }`}
        >
          <Store className="size-4" aria-hidden />
          Espace pro
        </Link>
        <Link
          href="/profil"
          aria-label="Profil"
          aria-current={onAccount ? "page" : undefined}
          className={`grid size-10 place-items-center rounded-full border transition hover:bg-surface ${
            onAccount ? "border-brand text-brand" : "border-line text-ink"
          }`}
        >
          <User className="size-5" aria-hidden />
        </Link>
      </div>
    </>
  );
}
