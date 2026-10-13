import type { ReactNode } from "react";

const WIDTHS = { md: "max-w-2xl", lg: "max-w-3xl" };

/**
 * Colonne centrée pour les pages de lecture ou de formulaire (connexion, profil, espace pro…).
 * Sur téléphone elle occupe toute la largeur ; au-delà, elle évite des champs étirés sur 1 100 px.
 */
export function Narrow({ children, size = "md" }: { children: ReactNode; size?: keyof typeof WIDTHS }) {
  return <div className={`mx-auto w-full ${WIDTHS[size]}`}>{children}</div>;
}
