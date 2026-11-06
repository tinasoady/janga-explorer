import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { formatAriary } from "@/lib/format";
import { filterOffers, getActiveOffers } from "@/lib/offers";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { BUDGETS, CATEGORIES, isCategory, type CategoryKey, type Offer } from "@/lib/types";
import { deleteAlert, markAlertSeen } from "./actions";
import { AlertForm } from "./alert-form";

export const metadata: Metadata = { title: "Mes alertes" };

type AlertRow = {
  id: string;
  category: string | null;
  max_price: number | null;
  query: string | null;
  last_seen_at: string;
};

export default function AlertesPage({ searchParams }: PageProps<"/alertes">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/profil" />
        <h1 className="text-xl font-extrabold">Mes alertes</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function Content({ searchParams }: { searchParams: PageProps<"/alertes">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;

  const params = await searchParams;
  const max = one(params.max);
  const defaults = {
    cat: isCategory(one(params.cat)) ? one(params.cat) : undefined,
    max: BUDGETS.includes(Number(max)) ? max : undefined,
    q: one(params.q)?.trim().slice(0, 80),
  };

  const { supabase } = await requireUser("/alertes");
  const [{ data }, offers] = await Promise.all([
    supabase
      .from("alerts")
      .select("id, category, max_price, query, last_seen_at")
      .order("created_at", { ascending: false })
      .returns<AlertRow[]>(),
    getActiveOffers(),
  ]);
  const alerts = data ?? [];

  return (
    <div className="space-y-6 px-5 pb-8">
      <p className="text-sm text-muted">
        Une alerte garde un œil sur les nouvelles offres qui vous intéressent. Elles apparaissent ici dès qu&apos;elles
        sont en ligne.
      </p>

      {alerts.length > 0 && (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <AlertCard alert={alert} offers={offers} />
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Nouvelle alerte</h2>
        <AlertForm defaults={defaults} />
      </section>
    </div>
  );
}

function alertLabel(alert: AlertRow) {
  const parts: string[] = [];
  if (isCategory(alert.category)) parts.push(CATEGORIES.find((c) => c.key === alert.category)?.label ?? "");
  if (alert.max_price) parts.push(`≤ ${formatAriary(alert.max_price)}`);
  if (alert.query) parts.push(`« ${alert.query} »`);
  return parts.join(" · ");
}

function AlertCard({ alert, offers }: { alert: AlertRow; offers: Offer[] }) {
  const matches = filterOffers(offers, {
    category: isCategory(alert.category) ? (alert.category as CategoryKey) : undefined,
    maxPrice: alert.max_price ?? undefined,
    q: alert.query ?? undefined,
  });
  const seenAt = Date.parse(alert.last_seen_at);
  const fresh = matches.filter((o) => o.publishedAt && Date.parse(o.publishedAt) > seenAt);

  const params = new URLSearchParams();
  if (alert.category) params.set("cat", alert.category);
  if (alert.max_price) params.set("max", String(alert.max_price));
  if (alert.query) params.set("q", alert.query);

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 font-bold">
        <Bell className="size-5 shrink-0 text-sea" aria-hidden />
        {alertLabel(alert)}
      </p>
      <p className="text-sm text-muted">
        {fresh.length > 0 ? (
          <span className="font-semibold text-brand">
            {fresh.length} nouvelle{fresh.length > 1 ? "s" : ""} offre{fresh.length > 1 ? "s" : ""}
          </span>
        ) : (
          "Rien de nouveau"
        )}
        {" · "}
        {matches.length} offre{matches.length > 1 ? "s" : ""} en ligne
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/bons-plans?${params}`} className={secondaryButtonClass}>
          Voir les offres
        </Link>
        {fresh.length > 0 && (
          <form action={markAlertSeen}>
            <input type="hidden" name="id" value={alert.id} />
            <SubmitButton className={secondaryButtonClass}>Marquer comme vu</SubmitButton>
          </form>
        )}
        <form action={deleteAlert}>
          <input type="hidden" name="id" value={alert.id} />
          <SubmitButton className={`${secondaryButtonClass} text-red-700`}>Supprimer</SubmitButton>
        </form>
      </div>
    </article>
  );
}
