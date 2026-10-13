import type { Metadata, Viewport } from "next";
import { Pacifico, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
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
};

export const viewport: Viewport = {
  themeColor: "#ff6a3d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${pacifico.variable} antialiased`}>
      <body className="font-sans">
        <div className="relative flex min-h-dvh flex-col bg-white">
          {/* Tablette et ordinateur : en-tête et pied de page. Téléphone : barre de navigation en bas. */}
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 pb-20 md:px-4 md:pb-10 lg:px-8">{children}</main>
          <SiteFooter />
          {/* usePathname() n'est connu qu'à la requête sur les routes dynamiques : la barre arrive en streaming. */}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
