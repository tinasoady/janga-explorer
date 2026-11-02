import type { MetadataRoute } from "next";

// Rend le site installable sur l'écran d'accueil (Android, iPhone, ordinateur), sans mode hors ligne.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Janga Explorer – Les bons plans de Mahajanga",
    short_name: "Janga Explorer",
    description:
      "Restaurants, hôtels, activités et sorties : les offres vérifiées du moment à Mahajanga, avec prix, dates de validité et contact direct.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff6a3d",
    categories: ["travel", "food", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
