"use client";

import { useEffect } from "react";
import { syncFavoritesWithAccount } from "@/lib/favorites";

/** À afficher quand une personne est connectée : relie les favoris de cet appareil à son compte. */
export function FavoritesSync() {
  useEffect(() => {
    void syncFavoritesWithAccount();
  }, []);
  return null;
}
