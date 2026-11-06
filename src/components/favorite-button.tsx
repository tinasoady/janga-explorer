"use client";

import { Heart } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { useLocale } from "./locale-provider";

export function FavoriteButton({ slug, className = "size-10" }: { slug: string; className?: string }) {
  const favorites = useFavorites();
  const active = favorites?.includes(slug) ?? false;
  const en = useLocale() === "en";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      aria-pressed={active}
      aria-label={
        en ? (active ? "Remove from saved deals" : "Save this deal") : active ? "Retirer des favoris" : "Ajouter aux favoris"
      }
      className={`grid place-items-center rounded-full bg-card/90 backdrop-blur transition active:scale-90 ${className}`}
    >
      <Heart className={`size-5 ${active ? "fill-brand text-brand" : "text-fg"}`} strokeWidth={2} />
    </button>
  );
}
