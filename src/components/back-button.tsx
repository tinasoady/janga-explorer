"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Revient à la page précédente, ou à `fallback` si on arrive directement (lien partagé). */
export function BackButton({ fallback, className = "" }: { fallback: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Retour"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={`grid size-10 place-items-center rounded-full ${className}`}
    >
      <ChevronLeft className="size-6" />
    </button>
  );
}
