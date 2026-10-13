import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { HeaderNav } from "./header-nav";
import { Logo } from "./logo";

/** En-tête de tablette et d'ordinateur. Masqué sur téléphone, où la navigation est en bas de l'écran. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-white/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-8 py-3 lg:px-12">
        <div>
          <Logo />
          <p className="flex items-center gap-1 pl-11 text-[11px] font-semibold text-ink/70">
            <MapPin className="size-3 text-brand" aria-hidden />
            Mahajanga
          </p>
        </div>
        {/* usePathname() n'est connu qu'à la requête sur les routes dynamiques */}
        <Suspense fallback={null}>
          <div className="flex flex-1 items-center justify-between gap-4">
            <HeaderNav />
          </div>
        </Suspense>
      </div>
    </header>
  );
}
