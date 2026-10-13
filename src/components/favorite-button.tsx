"use client";

import { Heart } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";

export function FavoriteButton({ slug, className = "size-10" }: { slug: string; className?: string }) {
  const favorites = useFavorites();
  const active = favorites?.includes(slug) ?? false;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`grid place-items-center rounded-full bg-white/90 backdrop-blur transition active:scale-90 ${className}`}
    >
      <Heart className={`size-5 ${active ? "fill-brand text-brand" : "text-ink"}`} strokeWidth={2} />
    </button>
  );
}
