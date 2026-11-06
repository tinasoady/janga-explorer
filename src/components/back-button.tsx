"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "./locale-provider";

/** Revient à la page précédente, ou à `fallback` si on arrive directement (lien partagé). */
export function BackButton({ fallback, className = "" }: { fallback: string; className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  return (
    <button
      type="button"
      aria-label={locale === "en" ? "Back" : "Retour"}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={`grid size-10 place-items-center rounded-full ${className}`}
    >
      <ChevronLeft className="size-6" />
    </button>
  );
}
