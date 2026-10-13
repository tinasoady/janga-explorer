"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { OfferRow } from "@/components/offer-card";
import { syncFavoritesWithAccount, useFavorites } from "@/lib/favorites";
import type { Offer } from "@/lib/types";

export function FavoritesList() {
  const favorites = useFavorites();

  // Récupère les changements faits depuis un autre appareil (seulement si cet appareil est relié à un compte).
  useEffect(() => {
    void syncFavoritesWithAccount({ onlyIfLinked: true });
  }, []);

  const key = favorites?.join(",") ?? null;
  // Dernière réponse reçue ; on la garde affichée pendant le rechargement suivant.
  const [loaded, setLoaded] = useState<Offer[] | null>(null);
  const offers = key === "" ? [] : loaded;

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/offres?slugs=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((res) => res.json() as Promise<{ offers: Offer[] }>)
      .then((data) => setLoaded(data.offers))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded([]);
      });
    return () => controller.abort();
  }, [key]);

  if (favorites === null || offers === null) {
    return (
      <div className="animate-pulse space-y-3 p-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  // On retire immédiatement les offres dé-favorisées, sans attendre une nouvelle requête.
  const visible = offers.filter((o) => favorites.includes(o.slug));
  const expired = favorites.filter((slug) => !offers.some((o) => o.slug === slug)).length;

  if (visible.length === 0) {
    return (
      <div className="m-4 flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center md:mx-auto md:max-w-xl">
        <Heart className="size-10 text-brand" aria-hidden />
        <p className="mt-3 font-bold">Aucun favori pour l&apos;instant</p>
        <p className="mt-1 text-sm text-muted">Touchez le cœur d&apos;une offre pour la retrouver ici.</p>
        <Link href="/bons-plans" className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Découvrir les bons plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {visible.map((offer) => (
          <li key={offer.id}>
            <OfferRow offer={offer} />
          </li>
        ))}
      </ul>
      {expired > 0 && (
        <p className="text-center text-xs text-muted">
          {expired} offre{expired > 1 ? "s" : ""} enregistrée{expired > 1 ? "s ont" : " a"} expiré.
        </p>
      )}
    </div>
  );
}
