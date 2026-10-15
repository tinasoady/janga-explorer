import type { ReactNode } from "react";

/**
 * Titre de section : simple et gras sur téléphone ; sur tablette et ordinateur, en capitales condensées
 * soulignées d'un trait jaune, comme sur l'accueil.
 */
export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`text-lg font-extrabold md:font-display md:text-3xl md:font-bold md:tracking-wide md:uppercase md:after:mt-2 md:after:block md:after:h-1 md:after:w-14 md:after:rounded-full md:after:bg-sun ${className}`}
    >
      {children}
    </h2>
  );
}
