import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell, ChevronRight, Heart, Info, LogOut, ShieldCheck, Store, UserRound } from "lucide-react";
import { ContactLinks } from "@/components/contact-links";
import { FavoritesSync } from "@/components/favorites-sync";
import { InstallAppCard } from "@/components/install-app";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeChoices } from "@/components/theme-toggle";
import { legalPages } from "@/components/legal-page";
import { secondaryButtonClass } from "@/components/form-ui";
import { LogoMark } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { getSessionUser, isAdminRole, ROLE_LABEL, type ProStatus } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { signOut } from "../connexion/actions";

const T = messages<{
  title: string;
  language: string;
  promiseTitle: string;
  promise: string;
  contact: string;
  legal: string;
  proStatus: Record<ProStatus, string>;
  welcome: string;
  noAccount: string;
  areYouPro: string;
  proText: string;
  requestPro: string;
  signIn: string;
  favorites: string;
  alerts: string;
  proSpace: string;
  about: string;
  admin: string;
  signOut: string;
}>({
  fr: {
    title: "Profil",
    language: "Langue",
    promiseTitle: "Notre engagement",
    promise:
      "Chaque offre affiche son prix, ses conditions et sa date de fin. Le badge « Offre vérifiée » signifie que nous avons confirmé ces informations directement avec l'établissement. Les offres expirées disparaissent automatiquement.",
    contact: "Nous contacter",
    legal: "Informations légales",
    proStatus: {
      none: "Connecté",
      pending: "Compte pro en cours de vérification",
      approved: "Compte professionnel",
      rejected: "Demande de compte pro refusée",
    },
    welcome: "Bienvenue sur Janga Explorer",
    noAccount: "Pas besoin de compte pour profiter des bons plans.",
    areYouPro: "Vous êtes professionnel ?",
    proText:
      "Hôtel, restaurant, activité ou événement à Mahajanga : demandez un compte pour publier vos offres. Nous vérifions votre établissement avant d'activer le compte.",
    requestPro: "Demander un compte pro",
    signIn: "Se connecter",
    favorites: "Mes favoris",
    alerts: "Mes alertes",
    proSpace: "Espace professionnel",
    about: "À propos de nous",
    admin: "Administration",
    signOut: "Se déconnecter",
  },
  en: {
    title: "Profile",
    language: "Language",
    promiseTitle: "Our promise",
    promise:
      "Every deal shows its price, conditions and end date. The \"Verified deal\" badge means we confirmed this information directly with the business. Expired deals disappear automatically.",
    contact: "Contact us",
    legal: "Legal information",
    proStatus: {
      none: "Signed in",
      pending: "Business account being reviewed",
      approved: "Business account",
      rejected: "Business account request declined",
    },
    welcome: "Welcome to Janga Explorer",
    noAccount: "You don't need an account to enjoy the deals.",
    areYouPro: "Do you run a business?",
    proText:
      "Hotel, restaurant, activity or event in Mahajanga: request an account to post your deals. We check your business before activating the account.",
    requestPro: "Request a business account",
    signIn: "Sign in",
    favorites: "My saved deals",
    alerts: "My alerts",
    proSpace: "Business space",
    about: "About us",
    admin: "Administration",
    signOut: "Sign out",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: T[await getLocale()].title };
}

export default async function ProfilPage() {
  const locale = await getLocale();
  const t = T[locale];
  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-4">
        <h1 className="text-xl font-extrabold">{t.title}</h1>
        <LanguageSwitcher />
      </header>

      <div className="space-y-6 p-4">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
          <Account />
        </Suspense>

        <InstallAppCard />

        <ThemeChoices />

        <section className="space-y-2 text-sm text-muted">
          <p className="flex items-center gap-2 font-bold text-fg">
            <ShieldCheck className="size-5 text-verified" aria-hidden />
            {t.promiseTitle}
          </p>
          <p>{t.promise}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold">{t.contact}</h2>
          <ContactLinks tone="light" />
        </section>

        <nav aria-label={t.legal} className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted">
          {legalPages(locale).map((p) => (
            <Link key={p.href} href={p.href} className="hover:text-fg">
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
  const [user, locale] = await Promise.all([getSessionUser(), getLocale()]);
  const t = T[locale];

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
                {isAdminRole(user.role) ? ROLE_LABEL[locale][user.role] : t.proStatus[user.proStatus]}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold">{t.welcome}</p>
              <p className="text-sm text-muted">{t.noAccount}</p>
            </>
          )}
        </div>
      </section>

      {!user && isSupabaseConfigured() && (
        <section className="space-y-3 rounded-2xl border border-dashed border-line p-4">
          <p className="flex items-center gap-2 font-bold">
            <Bell className="size-5 text-sea" aria-hidden />
            {t.areYouPro}
          </p>
          <p className="text-sm text-muted">{t.proText}</p>
          <div className="flex gap-2">
            <Link
              href="/connexion?mode=inscription"
              className="flex-1 rounded-full bg-brand py-2.5 text-center text-sm font-bold text-white"
            >
              {t.requestPro}
            </Link>
            <Link href="/connexion" className={`${secondaryButtonClass} flex-1`}>
              {t.signIn}
            </Link>
          </div>
        </section>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        <MenuLink href="/favoris" icon={Heart} label={t.favorites} />
        {user && <MenuLink href="/alertes" icon={Bell} label={t.alerts} />}
        <MenuLink href="/pro" icon={Store} label={t.proSpace} />
        <MenuLink href="/a-propos" icon={Info} label={t.about} />
        {user && isAdminRole(user.role) && <MenuLink href="/admin" icon={ShieldCheck} label={t.admin} />}
      </ul>

      {user && (
        <>
          <FavoritesSync />
          <form action={signOut}>
            <SubmitButton className={`${secondaryButtonClass} w-full`}>
              <LogOut className="size-4" aria-hidden />
              {t.signOut}
            </SubmitButton>
          </form>
        </>
      )}
    </>
  );
}
