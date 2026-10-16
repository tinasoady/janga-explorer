import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Mail, MessageCircle, Phone, Settings } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { inputClass, secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { dateOf, formatAriary, formatShortDate, todayIso, whatsappLink } from "@/lib/format";
import {
  getSubscriptionSettings,
  PAYMENT_STATUS_LABEL,
  paymentMethodLabel,
  signProofUrls,
  SUBSCRIPTION_STATUS_LABEL,
  toSubscription,
  type PaymentRow,
  type Subscription,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import {
  cancelSubscription,
  confirmPayment,
  grantDays,
  reactivateSubscription,
  rejectPayment,
} from "./actions";
import { RevenueChart, type RevenueMonth } from "./revenue-chart";

export const metadata: Metadata = { title: "Abonnements" };

type ListRow = SubscriptionRow & {
  user_id: string;
  email: string;
  company: string | null;
  whatsapp: string | null;
  phone: string | null;
  pro_approved: boolean;
  created_at: string;
};

type Pro = ListRow & { sub: Subscription };

const FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "bientot", label: "Expirent sous 7 jours" },
  { key: "trial", label: "En essai" },
  { key: "active", label: "Abonnés" },
  { key: "expired", label: "Expirés" },
  { key: "canceled", label: "Annulés" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_TONE: Record<SubscriptionStatus, string> = {
  trial: "bg-sea/10 text-sea-dark",
  active: "bg-verified/10 text-verified",
  expired: "bg-amber-100 text-amber-800",
  canceled: "bg-red-100 text-red-700",
};

export default function AbonnementsPage({ searchParams }: PageProps<"/admin/abonnements">) {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">Abonnements</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const isExpiringSoon = (s: Subscription) => (s.status === "trial" || s.status === "active") && s.daysLeft <= 7;

/** Les 6 derniers mois (mois en cours compris), à l'heure de Mahajanga : "2026-05" … "2026-10". */
function lastMonths(count: number) {
  const [year, month] = todayIso().split("-").map(Number);
  const label = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 15));
    return { key: d.toISOString().slice(0, 7), label: label.format(d) };
  });
}

async function loadPayments(supabase: SupabaseClient, since: string) {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*")
    .or(`status.eq.pending,reviewed_at.gte.${since}`)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<PaymentRow[]>();
  if (error) throw new Error(`Chargement des paiements impossible : ${error.message}`);
  return data;
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin/abonnements">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireAdmin();
  const superadmin = user.role === "superadmin";

  const months = lastMonths(6);
  // 1er jour du plus ancien mois, minuit à Mahajanga, en UTC sans millisecondes (valeur sûre dans un filtre `or`).
  const since = `${new Date(`${months[0].key}-01T00:00:00+03:00`).toISOString().slice(0, 19)}Z`;
  const [{ data: list, error }, payments, settings, params] = await Promise.all([
    supabase.rpc("list_subscriptions"),
    loadPayments(supabase, since),
    getSubscriptionSettings(supabase),
    searchParams,
  ]);
  if (error) throw new Error(`Chargement des abonnements impossible : ${error.message}`);

  const now = new Date();
  const all: Pro[] = ((list ?? []) as ListRow[]).map((row) => ({ ...row, sub: toSubscription(row, now) }));
  const byUser = new Map(all.map((p) => [p.user_id, p]));
  const pros = all.filter((p) => p.pro_approved);
  const count = (status: SubscriptionStatus) => pros.filter((p) => p.sub.status === status).length;

  const pending = payments.filter((p) => p.status === "pending").reverse(); // les plus anciens d'abord
  const reviewed = payments.filter((p) => p.status !== "pending").slice(0, 20);
  const proofs = await signProofUrls(supabase, pending.map((p) => p.proof_path));

  const revenue: RevenueMonth[] = months.map((m) => {
    const inMonth = payments.filter(
      (p) => p.status === "confirmed" && p.reviewed_at && dateOf(p.reviewed_at).startsWith(m.key),
    );
    return { ...m, amount: inMonth.reduce((sum, p) => sum + p.amount, 0), count: inMonth.length };
  });
  const thisMonth = revenue[revenue.length - 1];
  const lastMonth = revenue[revenue.length - 2];

  const raw = typeof params.statut === "string" ? params.statut : "tous";
  const filter: FilterKey = FILTERS.some((f) => f.key === raw) ? (raw as FilterKey) : "tous";
  const shown = pros
    .filter((p) => (filter === "tous" ? true : filter === "bientot" ? isExpiringSoon(p.sub) : p.sub.status === filter))
    .sort((a, b) => a.sub.accessUntil.localeCompare(b.sub.accessUntil));

  return (
    <div className="space-y-8 px-5 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        {settings && (
          <p className="text-sm text-muted">
            {formatAriary(settings.monthlyPrice)} / mois · essai de {settings.trialDays} jours
          </p>
        )}
        {superadmin && (
          <Link href="/admin/abonnements/tarifs" className={`${secondaryButtonClass} ml-auto`}>
            <Settings className="size-4" aria-hidden />
            Tarifs et numéros
          </Link>
        )}
      </div>

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          label={`Revenus de ${thisMonth.label}`}
          value={formatAriary(thisMonth.amount)}
          detail={`${lastMonth.label} : ${formatAriary(lastMonth.amount)}`}
          hero
        />
        <Stat label="Abonnés" value={String(count("active"))} detail={`${count("trial")} en essai`} />
        <Stat label="Paiements à vérifier" value={String(pending.length)} accent={pending.length > 0} />
        <Stat label="Expirent sous 7 jours" value={String(pros.filter((p) => isExpiringSoon(p.sub)).length)} />
        <Stat label="Expirés" value={String(count("expired"))} detail="ne peuvent plus publier" />
        <Stat label="Annulés" value={String(count("canceled"))} />
      </section>

      <RevenueChart months={revenue} />

      <Section title={`Paiements à vérifier (${pending.length})`} empty="Aucun paiement en attente.">
        {pending.map((p) => (
          <PaymentCard key={p.id} payment={p} pro={byUser.get(p.user_id)} proofUrl={proofs.get(p.proof_path)} />
        ))}
      </Section>

      <section>
        <h2 className="text-lg font-extrabold">Comptes pro ({pros.length})</h2>
        <nav aria-label="Filtrer les abonnements" className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "tous" ? "/admin/abonnements" : `/admin/abonnements?statut=${f.key}`}
              aria-current={filter === f.key ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                filter === f.key ? "bg-ink text-white" : "border border-line bg-white text-ink"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">Aucun compte dans cette liste.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shown.map((p) => (
              <li key={p.user_id}>
                <ProCard pro={p} superadmin={superadmin} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold">Derniers paiements traités</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
            {reviewed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-2.5">
                <span className="min-w-0 font-semibold">{byUser.get(p.user_id)?.company ?? "Compte supprimé"}</span>
                <span className="text-muted">
                  {formatAriary(p.amount)} · {p.months} mois · {paymentMethodLabel(p.method)}
                  {p.reviewed_at && ` · ${formatShortDate(dateOf(p.reviewed_at))}`}
                </span>
                <span
                  className={`text-xs font-semibold ${p.status === "confirmed" ? "text-verified" : "text-red-700"}`}
                >
                  {PAYMENT_STATUS_LABEL[p.status]}
                  {p.status === "rejected" && p.rejection_reason && ` : ${p.rejection_reason}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  hero = false,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  hero?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-4 ${hero ? "col-span-2 md:col-span-1" : ""}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`mt-1 font-extrabold tabular-nums ${hero ? "text-3xl" : "text-2xl"} ${accent ? "text-brand" : ""}`}>
        {value}
      </p>
      {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {children.map((child, i) => (
            <li key={i}>{child}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PaymentCard({ payment: p, pro, proofUrl }: { payment: PaymentRow; pro?: Pro; proofUrl?: string }) {
  const canceled = pro?.sub.status === "canceled";

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {proofUrl ? (
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block size-24 shrink-0 overflow-hidden rounded-xl border border-line bg-surface"
          >
            {/* Lien signé et temporaire vers un fichier privé : il ne passe pas par l'optimiseur d'images. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofUrl} alt="Preuve du paiement (ouvrir en grand)" className="size-full object-cover" />
          </a>
        ) : (
          <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-surface text-center text-xs text-muted">
            Preuve indisponible
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="truncate font-bold">{pro?.company ?? "Compte inconnu"}</h3>
          <p className="truncate text-sm text-muted">{pro?.email}</p>
          <p className="text-lg font-extrabold text-brand">{formatAriary(p.amount)}</p>
          <p className="text-sm">
            {p.months} mois · {paymentMethodLabel(p.method)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Numéro payeur</dt>
          <dd className="font-semibold break-all">{p.payer_phone}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Référence</dt>
          <dd className="font-semibold break-all">{p.reference}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Déclaré le</dt>
          <dd className="font-semibold">{formatShortDate(dateOf(p.created_at))}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Abonnement</dt>
          <dd className="font-semibold">{pro ? SUBSCRIPTION_STATUS_LABEL[pro.sub.status] : "?"}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted">
        Vérifiez sur le relevé {paymentMethodLabel(p.method)} que {formatAriary(p.amount)} ont bien été reçus de ce
        numéro avec cette référence avant de confirmer.
      </p>

      {canceled && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          Abonnement annulé : le superadmin doit le réactiver avant que ce paiement puisse être confirmé.
        </p>
      )}

      <form className="space-y-2 border-t border-line pt-3">
        <input type="hidden" name="id" value={p.id} />
        <input name="reason" maxLength={300} placeholder="Motif du refus (visible par le pro)" className={inputClass} />
        <div className="flex flex-wrap gap-2">
          {!canceled && (
            <SubmitButton
              formAction={confirmPayment}
              className="flex items-center justify-center gap-2 rounded-full bg-verified px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Confirmer le paiement
            </SubmitButton>
          )}
          <SubmitButton formAction={rejectPayment} className={`${secondaryButtonClass} text-red-700`}>
            Refuser
          </SubmitButton>
        </div>
      </form>
    </article>
  );
}

function ProCard({ pro: p, superadmin }: { pro: Pro; superadmin: boolean }) {
  const { sub } = p;
  const until = formatShortDate(dateOf(sub.accessUntil));
  const soon = isExpiringSoon(sub);
  const reminder =
    sub.status === "expired"
      ? `Bonjour, c'est Janga Explorer. Votre abonnement est arrivé à échéance le ${until}. Pour publier à nouveau vos offres, renouvelez-le depuis votre espace pro (Mon abonnement).`
      : `Bonjour, c'est Janga Explorer. Votre ${sub.status === "trial" ? "essai gratuit" : "abonnement"} se termine le ${until}. Pour continuer à publier vos offres, abonnez-vous depuis votre espace pro (Mon abonnement).`;

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{p.company ?? p.email}</h3>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted">
            <Mail className="size-3.5 shrink-0" aria-hidden />
            {p.email}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[sub.status]}`}>
          {SUBSCRIPTION_STATUS_LABEL[sub.status]}
        </span>
      </div>

      <p className={`text-sm ${soon ? "font-semibold text-amber-700" : "text-ink/80"}`}>
        {sub.status === "canceled"
          ? `Annulé : ${sub.cancelReason ?? "sans motif"}`
          : sub.status === "expired"
            ? `Accès terminé le ${until}`
            : `Accès jusqu'au ${until} (${sub.daysLeft <= 1 ? "dernier jour" : `${sub.daysLeft} jours`})`}
      </p>
      <p className="text-xs text-muted">
        Essai jusqu&apos;au {formatShortDate(dateOf(sub.trialEndsAt))}
        {sub.paidUntil && ` · payé jusqu'au ${formatShortDate(dateOf(sub.paidUntil))}`}
      </p>

      {(p.whatsapp || p.phone) && (soon || sub.status === "expired") && (
        <div className="flex flex-wrap gap-2">
          {p.whatsapp && (
            <a
              href={whatsappLink(p.whatsapp, reminder)}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryButtonClass}
            >
              <MessageCircle className="size-4 text-verified" aria-hidden />
              Relancer
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone.replace(/\s/g, "")}`} className={secondaryButtonClass}>
              <Phone className="size-4" aria-hidden />
              {p.phone}
            </a>
          )}
        </div>
      )}

      {superadmin && (
        <details className="group border-t border-line pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-brand">Gérer l&apos;abonnement</summary>
          <div className="mt-3 space-y-3">
            {sub.status === "canceled" ? (
              <form>
                <input type="hidden" name="id" value={p.user_id} />
                <SubmitButton formAction={reactivateSubscription} className={secondaryButtonClass}>
                  Réactiver l&apos;abonnement
                </SubmitButton>
              </form>
            ) : (
              <>
                <form className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={p.user_id} />
                  <label className="flex items-center gap-2 text-sm">
                    Offrir
                    <input
                      name="days"
                      type="number"
                      inputMode="numeric"
                      required
                      min={1}
                      max={365}
                      defaultValue={30}
                      className={`${inputClass} w-20`}
                    />
                    jours
                  </label>
                  <SubmitButton formAction={grantDays} className={secondaryButtonClass}>
                    Ajouter
                  </SubmitButton>
                </form>
                <form className="space-y-2">
                  <input type="hidden" name="id" value={p.user_id} />
                  <input
                    name="reason"
                    maxLength={300}
                    placeholder="Motif de l'annulation (visible par le pro)"
                    className={inputClass}
                  />
                  <SubmitButton formAction={cancelSubscription} className={`${secondaryButtonClass} text-red-700`}>
                    Annuler l&apos;abonnement
                  </SubmitButton>
                </form>
              </>
            )}
          </div>
        </details>
      )}
    </article>
  );
}
