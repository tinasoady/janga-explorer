import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Heart, MapPin, Plus, Search, User } from "lucide-react";
import { CategoryBar, CategoryBarLinks } from "./header-nav";
import { Logo } from "./logo";

/**
 * En-tête de tablette et d'ordinateur, en deux étages : logo, recherche et compte, puis le bandeau bleu des
 * rubriques, qui reste collé en haut au défilement. Masqué sur téléphone, où la navigation est en bas de l'écran.
 */
export function SiteHeader() {
  return (
    <>
      <header className="hidden bg-white md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-8 py-4 lg:gap-8 lg:px-12 lg:py-5">
          <div>
            <Logo size="lg" />
            <p className="flex items-center gap-1 pl-14 text-xs font-semibold text-ink/70">
              <MapPin className="size-3.5 text-brand" aria-hidden />
              Mahajanga
            </p>
          </div>

          <Form action="/bons-plans" className="min-w-0 flex-1 lg:max-w-md">
            <label className="flex items-center gap-3 rounded-md bg-surface px-4 py-3 ring-sea/40 focus-within:ring-2">
              <span className="sr-only">Rechercher un bon plan</span>
              <input
                name="q"
                type="search"
                placeholder="Rechercher un bon plan…"
                className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-ink/60"
              />
              <Search className="size-5 shrink-0 text-ink" aria-hidden />
            </label>
          </Form>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-2">
            <Link
              href="/profil"
              aria-label="Mon compte"
              className="flex items-center gap-2 rounded-md p-2 text-ink transition hover:text-sea"
            >
              <span className="grid size-8 place-items-center rounded-full border-2 border-current">
                <User className="size-4" strokeWidth={2.4} aria-hidden />
              </span>
              <span className="hidden text-[15px] font-semibold lg:inline">Mon compte</span>
            </Link>
            <span className="h-7 w-px bg-line" aria-hidden />
            <Link
              href="/favoris"
              aria-label="Mes favoris"
              className="grid size-11 place-items-center rounded-md text-ink transition hover:text-brand"
            >
              <Heart className="size-6" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href="/pro"
              className="ml-1 flex items-center gap-1.5 rounded-md bg-brand px-4 py-3 text-[15px] font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-brand-dark lg:ml-2 lg:px-5"
            >
              <Plus className="size-4" strokeWidth={3} aria-hidden />
              <span>
                Publier<span className="hidden lg:inline"> une offre</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="Rubriques" className="sticky top-0 z-40 hidden bg-sea shadow-md md:block">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          {/* usePathname() et useSearchParams() ne sont connus qu'à la requête */}
          <Suspense fallback={<CategoryBarLinks />}>
            <CategoryBar />
          </Suspense>
        </div>
      </nav>
    </>
  );
}
