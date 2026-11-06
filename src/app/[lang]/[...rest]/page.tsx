import { notFound } from "next/navigation";

// Adresse inconnue : la mise en page racine est sous [lang], c'est donc cette route qui affiche la page 404 du site
// (not-found.tsx, dans la bonne langue) au lieu de la page 404 par défaut de Next.js.

// Cette page ne rend jamais rien (elle lève toujours la 404) : rien à valider pour la navigation instantanée.
export const instant = false;

export function generateStaticParams() {
  // Cache Components exige au moins un paramètre ; ce chemin factice renvoie lui aussi une 404.
  return [{ rest: ["__introuvable__"] }];
}

export default function CatchAll() {
  notFound();
}
