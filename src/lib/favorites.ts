"use client";

import { useSyncExternalStore } from "react";
import { setFavoriteRemote, syncFavorites } from "@/app/favoris/actions";

// Favoris stockés dans le navigateur : aucun compte nécessaire. Avec un compte, ils sont aussi
// enregistrés côté serveur pour être retrouvés sur tous les appareils.
const KEY = "janga:favoris";
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.value;
  let value = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) value = parsed.filter((s): s is string => typeof s === "string");
  } catch {
    // contenu corrompu : on repart de zéro
  }
  cache = { raw, value };
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  listeners.forEach((l) => l());
  return true;
}

// Identifiant du compte avec lequel cet appareil est synchronisé (absent = pas de compte).
const SYNC_KEY = "janga:favoris:compte";

function syncedUser() {
  try {
    return localStorage.getItem(SYNC_KEY);
  } catch {
    return null;
  }
}

function setSyncedUser(userId: string | null) {
  try {
    if (userId) localStorage.setItem(SYNC_KEY, userId);
    else localStorage.removeItem(SYNC_KEY);
  } catch {
    // stockage indisponible : les favoris restent simplement locaux
  }
}

export function toggleFavorite(slug: string) {
  const current = read();
  const adding = !current.includes(slug);
  const next = adding ? [slug, ...current] : current.filter((s) => s !== slug);
  if (!write(next)) return;

  if (syncedUser()) {
    setFavoriteRemote(slug, adding)
      .then((connected) => {
        if (!connected) setSyncedUser(null); // session terminée : on repasse en favoris locaux
      })
      .catch(() => {
        // hors ligne : la prochaine synchronisation remettra le compte à jour
      });
  }
}

/** Synchronise avec le compte connecté ; sans effet (et sans erreur) pour un visiteur sans compte. */
export async function syncFavoritesWithAccount({ onlyIfLinked = false } = {}) {
  const linked = syncedUser();
  if (onlyIfLinked && !linked) return;
  try {
    const result = await syncFavorites(read(), linked);
    if (!result) return setSyncedUser(null);
    setSyncedUser(result.userId);
    write(result.slugs);
  } catch {
    // hors ligne : on réessaiera à la prochaine visite
  }
}

/** Liste des slugs favoris ; `null` tant que le navigateur n'a pas été lu (rendu serveur). */
export function useFavorites(): string[] | null {
  return useSyncExternalStore<string[] | null>(subscribe, read, () => null);
}
