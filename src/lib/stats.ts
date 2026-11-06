import type { SupabaseClient } from "@supabase/supabase-js";

// Statistiques des offres : vues de la fiche et clics sur les contacts, comptés par jour dans la base.

export const STAT_EVENTS = ["view", "whatsapp", "call", "map"] as const;
export type StatEvent = (typeof STAT_EVENTS)[number];

export function isStatEvent(value: unknown): value is StatEvent {
  return STAT_EVENTS.some((e) => e === value);
}

export type OfferStats = { views: number; whatsapp: number; calls: number; maps: number };

export const EMPTY_STATS: OfferStats = { views: 0, whatsapp: 0, calls: 0, maps: 0 };

/** Période affichée au pro. */
export const STATS_DAYS = 30;

type StatsRow = OfferStats & { offer_id: string };

/** Totaux par offre depuis `since` (YYYY-MM-DD, inclus). Les règles RLS limitent la lecture aux offres du pro. */
export async function getOfferStats(
  supabase: SupabaseClient,
  offerIds: string[],
  since: string,
): Promise<Map<string, OfferStats>> {
  const totals = new Map<string, OfferStats>();
  if (offerIds.length === 0) return totals;

  const { data } = await supabase
    .from("offer_stats")
    .select("offer_id, views, whatsapp, calls, maps")
    .in("offer_id", offerIds)
    .gte("day", since)
    .returns<StatsRow[]>();

  for (const row of data ?? []) {
    const t = totals.get(row.offer_id) ?? { ...EMPTY_STATS };
    t.views += row.views;
    t.whatsapp += row.whatsapp;
    t.calls += row.calls;
    t.maps += row.maps;
    totals.set(row.offer_id, t);
  }
  return totals;
}
