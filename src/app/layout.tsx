import type { Metadata, Viewport } from "next";
import { Oswald, Pacifico, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { InstallPromptCatcher } from "@/components/install-app";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

/** Titres en capitales condensées de l'accueil sur ordinateur */
const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Janga Explorer – Les bons plans de Mahajanga",
    template: "%s · Janga Explorer",
  },
  description:
    "Restaurants, hôtels, activités et sorties : les offres vérifiées du moment à Mahajanga, avec prix, dates de validité et contact direct.",
  applicationName: "Janga Explorer",
  // iPhone : ouverture en plein écran depuis l'écran d'accueil, nom court sous l'icône
  appleWebApp: {
    capable: true,
    title: "Janga Explorer",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6a3d",
  // Nécessaire pour que env(safe-area-inset-*) soit renseigné : la barre du bas passe au-dessus de l'indicateur d'accueil de l'iPhone
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${pacifico.variable} ${oswald.variable} antialiased`}>
      <body className="font-sans">
        {/* overflow-x-clip : les bandeaux pleine largeur (100vw) ne doivent pas créer de défilement horizontal */}
        {/* Marges latérales : en paysage, l'encoche de l'iPhone ne doit pas masquer le contenu (viewport-fit=cover) */}
        <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-white pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          {/* Tablette et ordinateur : en-tête et pied de page. Téléphone : barre de navigation en bas. */}
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-4 md:pb-10 lg:px-8">{children}</main>
          <SiteFooter />
          {/* usePathname() n'est connu qu'à la requête sur les routes dynamiques : la barre arrive en streaming. */}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
          <InstallPromptCatcher />
        </div>
      </body>
    </html>
  );
}
