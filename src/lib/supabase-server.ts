import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { DEMO_MODE } from "./supabase";

/** Vrai quand les variables Supabase sont définies, hors démonstration forcée (sinon l'application est en démonstration). */
export function isSupabaseConfigured() {
  return !DEMO_MODE && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Client Supabase lié à la session de la personne connectée (cookies), soumis aux règles RLS.
 * À créer à chaque requête, jamais à conserver dans une variable globale. `null` si Supabase n'est pas configuré.
 */
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || DEMO_MODE) return null;

  // La session dépend de la requête (cookies) et Supabase compare son jeton à l'heure courante : on déclare
  // l'accès dynamique avant, sinon Next.js signale une lecture de `Date.now()` pendant le prérendu.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le proxy rafraîchit déjà la session.
        }
      },
    },
  });
}
