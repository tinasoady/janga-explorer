"use client";

import { useEffect, type ComponentProps } from "react";
import type { StatEvent } from "@/lib/stats";

/** Envoie l'événement sans retarder la navigation (le navigateur l'envoie même si on quitte la page). */
function track(offerId: string, event: StatEvent) {
  const body = JSON.stringify({ offerId, event });
  try {
    if (navigator.sendBeacon?.("/api/stats", body)) return;
  } catch {
    // on retente avec fetch
  }
  void fetch("/api/stats", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** Compte une vue de la fiche, une seule fois par onglet et par offre. */
export function TrackOfferView({ offerId }: { offerId: string }) {
  useEffect(() => {
    const key = `vue:${offerId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // stockage indisponible (navigation privée…) : on compte quand même
    }
    track(offerId, "view");
  }, [offerId]);
  return null;
}

/** Lien de contact (WhatsApp, appel, plan) qui compte le clic pour les statistiques du pro. */
export function TrackedLink({
  offerId,
  event,
  onClick,
  ...props
}: ComponentProps<"a"> & { offerId: string; event: Exclude<StatEvent, "view"> }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(offerId, event);
        onClick?.(e);
      }}
    />
  );
}
