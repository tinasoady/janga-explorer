"use server";

import { createServerSupabase } from "@/lib/supabase-server";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_FAVORITES = 200;

function clean(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) return [];
  const valid = slugs.filter((s): s is string => typeof s === "string" && s.length <= 120 && SLUG.test(s));
  return [...new Set(valid)].slice(0, MAX_FAVORITES);
}

async function currentSession() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, userId: data.user.id } : null;
}

/**
 * Synchronise les favoris de l'appareil avec ceux du compte.
 * Première synchronisation de cet appareil pour ce compte : on fusionne les deux listes.
 * Ensuite le compte fait foi, pour que retirer un favori sur un appareil le retire partout.
 * Renvoie `null` si personne n'est connecté.
 */
export async function syncFavorites(
  local: string[],
  lastSyncedUserId: string | null,
): Promise<{ userId: string; slugs: string[] } | null> {
  const session = await currentSession();
  if (!session) return null;
  const { supabase, userId } = session;

  if (lastSyncedUserId !== userId) {
    const rows = clean(local).map((slug) => ({ user_id: userId, slug }));
    if (rows.length > 0) {
      await supabase.from("favorites").upsert(rows, { onConflict: "user_id,slug", ignoreDuplicates: true });
    }
  }

  const { data } = await supabase
    .from("favorites")
    .select("slug")
    .order("created_at", { ascending: false })
    .limit(MAX_FAVORITES)
    .returns<{ slug: string }[]>();
  return { userId, slugs: (data ?? []).map((r) => r.slug) };
}

/** Répercute un ajout / retrait de favori sur le compte. `false` si personne n'est connecté. */
export async function setFavoriteRemote(slug: string, on: boolean): Promise<boolean> {
  const session = await currentSession();
  if (!session) return false;
  const [valid] = clean([slug]);
  if (!valid) return true;

  const { supabase, userId } = session;
  if (on) {
    await supabase
      .from("favorites")
      .upsert({ user_id: userId, slug: valid }, { onConflict: "user_id,slug", ignoreDuplicates: true });
  } else {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("slug", valid);
  }
  return true;
}
