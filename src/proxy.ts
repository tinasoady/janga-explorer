import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE, negotiateLocale, type Locale } from "@/lib/i18n";
import { DEMO_MODE } from "@/lib/supabase";

const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

// Pages dont le rendu dépend de la session Supabase : on rafraîchit le jeton d'accès avant le rendu.
// Les pages publiques ne sont volontairement pas concernées : elles n'ont pas besoin d'appel réseau en plus.
const SESSION_PATHS = ["/profil", "/favoris", "/connexion", "/alertes", "/admin", "/espace-pro"];

const needsSession = (pathname: string) =>
  SESSION_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Langue : l'adresse reste la même dans les deux langues. On réécrit /bons-plans vers /fr/bons-plans ou
 * /en/bons-plans (segment [lang]) selon le cookie, ou, à la première visite, selon la langue du navigateur.
 * Une adresse déjà préfixée (/en/bons-plans, lien partagé) choisit la langue puis redirige vers l'adresse sans préfixe.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefix = pathname.split("/")[1];

  if (isLocale(prefix)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(prefix.length + 1) || "/";
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(LOCALE_COOKIE, prefix, { path: "/", maxAge: LOCALE_MAX_AGE, sameSite: "lax" });
    return redirect;
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));
  // Les Server Actions de la même requête lisent la langue dans ce cookie.
  if (!isLocale(saved)) request.cookies.set(LOCALE_COOKIE, locale);

  const target = request.nextUrl.clone();
  target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  let response = NextResponse.rewrite(target, { request });
  const finish = () => {
    if (!isLocale(saved)) {
      response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: LOCALE_MAX_AGE, sameSite: "lax" });
    }
    return response;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || DEMO_MODE || !needsSession(pathname)) return finish();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.rewrite(target, { request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Valide le jeton auprès de Supabase et, si besoin, en pose un nouveau dans les cookies.
  await supabase.auth.getUser();
  return finish();
}

export const config = {
  // Toutes les pages, sauf les routes API, le retour d'authentification, les fichiers internes de Next.js et les
  // fichiers statiques (tout chemin qui contient un point : icônes, manifeste…).
  matcher: ["/((?!api/|auth/|_next/|.*\\..*).*)"],
};
