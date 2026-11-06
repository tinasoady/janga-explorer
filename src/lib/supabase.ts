import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Mode démonstration forcé (NEXT_PUBLIC_DEMO_MODE=1) : le site affiche les offres fictives de src/data/demo-offers.ts
 * même si Supabase est configuré, pour présenter le site rempli d'offres sans toucher à la vraie base.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

/** Client Supabase public (lecture seule via RLS), ou null si les variables ne sont pas définies ou en démonstration. */
export function getSupabase() {
  if (client !== undefined) return client;
  if (DEMO_MODE) return (client = null);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
