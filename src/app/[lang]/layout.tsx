import type { Metadata, Viewport } from "next";
import { Oswald, Pacifico, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { InstallPromptCatcher } from "@/components/install-app";
import { LocaleProvider } from "@/components/locale-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LOCALES, messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { THEME_SCRIPT } from "@/lib/theme";
import "../globals.css";

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

/** Chaque page est prérendue dans les deux langues ; proxy.ts choisit laquelle servir. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const META = messages({
  fr: {
    title: "Janga Explorer – Les bons plans de Mahajanga",
    description:
      "Restaurants, hôtels, activités et sorties : les offres vérifiées du moment à Mahajanga, avec prix, dates de validité et contact direct.",
  },
  en: {
    title: "Janga Explorer – The best deals in Mahajanga",
    description:
      "Restaurants, hotels, activities and nights out: this week's verified deals in Mahajanga, with prices, end dates and direct contact.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = META[await getLocale()];
  return {
    title: { default: t.title, template: "%s · Janga Explorer" },
    description: t.description,
    applicationName: "Janga Explorer",
    // iPhone : ouverture en plein écran depuis l'écran d'accueil, nom court sous l'icône
    appleWebApp: {
      capable: true,
      title: "Janga Explorer",
      statusBarStyle: "default",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff6a3d" },
    { media: "(prefers-color-scheme: dark)", color: "#111b26" },
  ],
  // Nécessaire pour que env(safe-area-inset-*) soit renseigné : la barre du bas passe au-dessus de l'indicateur d'accueil de l'iPhone
  viewportFit: "cover",
};

const DEMO_NOTICE = messages({
  fr: { text: "Démonstration : établissements, offres et numéros fictifs." },
  en: { text: "Demo: businesses, deals and phone numbers are fictitious." },
});

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  // Sans base de données (ou en démonstration forcée), les offres affichées sont fictives : on le dit sur chaque page.
  const demo = !isSupabaseConfigured();

  return (
    // suppressHydrationWarning : le script de <head> ajoute la classe .dark avant que React ne prenne la main.
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jakarta.variable} ${pacifico.variable} ${oswald.variable} antialiased`}
    >
      <head>
        {/* Applique le mode jour / nuit avant l'affichage, pour éviter un flash de page claire. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans">
        <LocaleProvider locale={locale}>
          {/* overflow-x-clip : les bandeaux pleine largeur (100vw) ne doivent pas créer de défilement horizontal */}
          {/* Marges latérales : en paysage, l'encoche de l'iPhone ne doit pas masquer le contenu (viewport-fit=cover) */}
          <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-card pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
            {demo && (
              <p className="bg-sun px-4 py-1.5 text-center text-xs font-bold text-ink">{DEMO_NOTICE[locale].text}</p>
            )}
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
        </LocaleProvider>
      </body>
    </html>
  );
}
