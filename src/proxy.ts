import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase (jeton d'accès) avant le rendu des pages qui en dépendent.
// Les pages publiques ne sont volontairement pas concernées : elles n'ont pas besoin d'appel réseau en plus.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Valide le jeton auprès de Supabase et, si besoin, en pose un nouveau dans les cookies.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/profil", "/favoris", "/connexion", "/alertes/:path*", "/admin/:path*", "/espace-pro/:path*"],
};
