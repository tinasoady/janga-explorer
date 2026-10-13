import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { ChevronLeft, Search, SearchX } from "lucide-react";
import { CATEGORY_STYLE } from "@/components/category";
import { OfferRow } from "@/components/offer-card";
import { formatAriary } from "@/lib/format";
import { filterOffers, getActiveOffers } from "@/lib/offers";
import { BUDGETS, CATEGORIES, isCategory, type OfferFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Bons plans",
  description: "Toutes les offres du moment à Mahajanga : restaurants, hôtels, activités et sorties.",
};

const SORTS = [
  { key: "recent", label: "Nouveautés" },
  { key: "fin", label: "Bientôt finis" },
  { key: "remise", label: "Meilleure remise" },
] as const;

type Params = { [key: string]: string | string[] | undefined };

export default function BonsPlansPage({ searchParams }: PageProps<"/bons-plans">) {
  return (
    <>
      {/* Collé en haut sur téléphone ; sur tablette et ordinateur, l'en-tête du site l'est déjà. */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-white/95 px-2 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-4 md:pt-6 md:pb-0 md:backdrop-blur-none">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="grid size-10 place-items-center rounded-full md:hidden"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="text-xl font-extrabold md:text-3xl">Bons plans</h1>
      </header>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(params: Params): OfferFilters {
  const cat = first(params.cat);
  const max = Number(first(params.max));
  const sort = first(params.sort);
  return {
    category: isCategory(cat) ? cat : undefined,
    q: first(params.q)?.trim().slice(0, 80) || undefined,
    maxPrice: BUDGETS.includes(max) ? max : undefined,
    sort: SORTS.some((s) => s.key === sort) ? (sort as OfferFilters["sort"]) : "recent",
  };
}

function hrefWith(filters: OfferFilters, patch: Partial<OfferFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.category) params.set("cat", next.category);
  if (next.q) params.set("q", next.q);
  if (next.maxPrice) params.set("max", String(next.maxPrice));
  if (next.sort && next.sort !== "recent") params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/bons-plans?${query}` : "/bons-plans";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
        active ? "border-brand bg-brand text-white shadow-sm" : "border-line bg-white text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Params> }) {
  const filters = parseFilters(await searchParams);
  const offers = filterOffers(await getActiveOffers(), filters);

  return (
    <div className="space-y-3 pt-3">
      <Form action="/bons-plans" className="px-4 md:max-w-2xl">
        {filters.category && <input type="hidden" name="cat" value={filters.category} />}
        {filters.maxPrice && <input type="hidden" name="max" value={filters.maxPrice} />}
        {filters.sort !== "recent" && <input type="hidden" name="sort" value={filters.sort} />}
        <label className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5">
          <Search className="size-5 text-muted" aria-hidden />
          <span className="sr-only">Rechercher</span>
          <input
            key={filters.q ?? ""}
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Plat, hôtel, activité, quartier…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
      </Form>

      <nav aria-label="Catégories" className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:overflow-visible">
        <Chip href={hrefWith(filters, { category: undefined })} active={!filters.category}>
          Tout
        </Chip>
        {CATEGORIES.map((c) => {
          const { icon: Icon } = CATEGORY_STYLE[c.key];
          return (
            <Chip key={c.key} href={hrefWith(filters, { category: c.key })} active={filters.category === c.key}>
              <Icon className="size-4" aria-hidden />
              {c.label}
            </Chip>
          );
        })}
      </nav>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 text-xs md:flex-wrap md:overflow-visible md:text-sm">
        <span className="shrink-0 font-semibold text-muted">Budget</span>
        {[undefined, ...BUDGETS].map((max) => {
          const active = filters.maxPrice === max;
          return (
            <Link
              key={max ?? "all"}
              href={hrefWith(filters, { maxPrice: max })}
              scroll={false}
              className={`shrink-0 rounded-full px-2.5 py-1 font-semibold ${
                active ? "bg-ink text-white" : "bg-surface text-ink"
              }`}
            >
              {max ? `≤ ${formatAriary(max)}` : "Tous"}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4 pt-1">
        <p className="text-sm text-muted" aria-live="polite">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
          {filters.q && (
            <>
              {" "}
              pour « <span className="font-semibold text-ink">{filters.q}</span> »
            </>
          )}
        </p>
        <div className="flex gap-1 text-xs">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={hrefWith(filters, { sort: s.key })}
              scroll={false}
              className={`rounded-md px-1.5 py-0.5 font-semibold ${
                filters.sort === s.key ? "text-brand" : "text-muted"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {offers.length > 0 ? (
        <ul className="space-y-3 px-4 pb-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {offers.map((offer) => (
            <li key={offer.id}>
              <OfferRow offer={offer} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-4 flex flex-col items-center rounded-2xl bg-surface px-6 py-10 text-center">
          <SearchX className="size-10 text-muted" aria-hidden />
          <p className="mt-3 font-bold">Aucune offre ne correspond</p>
          <p className="mt-1 text-sm text-muted">Essayez une autre catégorie ou un budget plus large.</p>
          <Link href="/bons-plans" className="mt-4 text-sm font-semibold text-brand">
            Voir toutes les offres
          </Link>
        </div>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-4 pt-3" aria-hidden>
      <div className="h-11 rounded-2xl bg-surface md:max-w-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-surface" />
        ))}
      </div>
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
