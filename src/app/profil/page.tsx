import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell, ChevronRight, Heart, Info, LogOut, ShieldCheck, Store, UserRound } from "lucide-react";
import { FavoritesSync } from "@/components/favorites-sync";
import { LEGAL_PAGES } from "@/components/legal-page";
import { secondaryButtonClass } from "@/components/form-ui";
import { LogoMark } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { getSessionUser, isAdminRole, ROLE_LABEL, type ProStatus } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { signOut } from "../connexion/actions";

export const metadata: Metadata = { title: "Profil" };

const PRO_STATUS_LABEL: Record<ProStatus, string> = {
  none: "Connecté",
  pending: "Compte pro en cours de vérification",
  approved: "Compte professionnel",
  rejected: "Demande de compte pro refusée",
};

export default function ProfilPage() {
  return (
    <>
      <header className="border-b border-line px-4 py-4">
        <h1 className="text-xl font-extrabold">Profil</h1>
      </header>

      <div className="space-y-6 p-4">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
          <Account />
        </Suspense>

        <section className="space-y-2 text-sm text-muted">
          <p className="flex items-center gap-2 font-bold text-ink">
            <ShieldCheck className="size-5 text-verified" aria-hidden />
            Notre engagement
          </p>
          <p>
            Chaque offre affiche son prix, ses conditions et sa date de fin. Le badge « Offre vérifiée » signifie que
            nous avons confirmé ces informations directement avec l&apos;établissement. Les offres expirées
            disparaissent automatiquement.
          </p>
        </section>

        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted">
          {LEGAL_PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="hover:text-ink">
              {p.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: typeof Heart; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3.5 font-semibold">
        <Icon className="size-5 text-brand" aria-hidden />
        <span className="flex-1">{label}</span>
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

async function Account() {
  const user = await getSessionUser();

  return (
    <>
      <section className="flex items-center gap-4 rounded-2xl bg-surface p-4">
        {user ? (
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
            <UserRound className="size-6" aria-hidden />
          </span>
        ) : (
          <LogoMark className="size-12" />
        )}
        <div className="min-w-0">
          {user ? (
            <>
              <p className="truncate font-bold">{user.email}</p>
              <p className="text-sm text-muted">
                {isAdminRole(user.role) ? ROLE_LABEL[user.role] : PRO_STATUS_LABEL[user.proStatus]}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold">Bienvenue sur Janga Explorer</p>
              <p className="text-sm text-muted">Pas besoin de compte pour profiter des bons plans.</p>
            </>
          )}
        </div>
      </section>

      {!user && isSupabaseConfigured() && (
        <section className="space-y-3 rounded-2xl border border-dashed border-line p-4">
          <p className="flex items-center gap-2 font-bold">
            <Bell className="size-5 text-sea" aria-hidden />
            Vous êtes professionnel ?
          </p>
          <p className="text-sm text-muted">
            Hôtel, restaurant, activité ou événement à Mahajanga : demandez un compte pour publier vos offres. Nous
            vérifions votre établissement avant d&apos;activer le compte.
          </p>
          <div className="flex gap-2">
            <Link
              href="/connexion?mode=inscription"
              className="flex-1 rounded-full bg-brand py-2.5 text-center text-sm font-bold text-white"
            >
              Demander un compte pro
            </Link>
            <Link href="/connexion" className={`${secondaryButtonClass} flex-1`}>
              Se connecter
            </Link>
          </div>
        </section>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        <MenuLink href="/favoris" icon={Heart} label="Mes favoris" />
        {user && <MenuLink href="/alertes" icon={Bell} label="Mes alertes" />}
        <MenuLink href="/pro" icon={Store} label="Espace professionnel" />
        <MenuLink href="/a-propos" icon={Info} label="À propos de nous" />
        {user && isAdminRole(user.role) && <MenuLink href="/admin" icon={ShieldCheck} label="Administration" />}
      </ul>

      {user && (
        <>
          <FavoritesSync />
          <form action={signOut}>
            <SubmitButton className={`${secondaryButtonClass} w-full`}>
              <LogOut className="size-4" aria-hidden />
              Se déconnecter
            </SubmitButton>
          </form>
        </>
      )}
    </>
  );
}
