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
  paymentLabel,
  paymentMethodLabel,
  signProofUrls,
  SUBSCRIPTION_STATUS_LABEL,
  toSubscription,
  type PaymentRow,
  type Subscription,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/lib/subscription";
import { INTL_LOCALE, messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import {
  cancelSubscription,
  confirmPayment,
  grantDays,
  reactivateSubscription,
  rejectPayment,
} from "./actions";
import { RevenueChart, type RevenueMonth } from "./revenue-chart";

const TITLES = {
  fr: { meta: "Abonnements", heading: "Abonnements" },
  en: { meta: "Subscriptions", heading: "Subscriptions" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

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

const FILTERS = ["tous", "bientot", "trial", "active", "expired", "canceled"] as const;

type FilterKey = (typeof FILTERS)[number];

const T = messages({
  fr: {
    filters: {
      tous: "Tous",
      bientot: "Expirent sous 7 jours",
      trial: "En essai",
      active: "Abonnés",
      expired: "Expirés",
      canceled: "Annulés",
    } as Record<FilterKey, string>,
    pricing: (month: string, day: string, trial: number) =>
      `${month} / mois · ${day} / jour et par offre · essai de ${trial} jours`,
    settings: "Tarifs et numéros",
    keyFigures: "Chiffres clés",
    revenueOf: (month: string) => `Revenus de ${month}`,
    previous: (month: string, amount: string) => `${month} : ${amount}`,
    subscribers: "Abonnés",
    inTrial: (n: number) => `${n} en essai`,
    toCheck: "Paiements à vérifier",
    expiringSoon: "Expirent sous 7 jours",
    expired: "Expirés",
    expiredDetail: "sans abonnement actif",
    canceled: "Annulés",
    paymentsToCheck: (n: number) => `Paiements à vérifier (${n})`,
    noPayments: "Aucun paiement en attente.",
    accounts: (n: number) => `Comptes pro (${n})`,
    filterLabel: "Filtrer les abonnements",
    noAccounts: "Aucun compte dans cette liste.",
    lastReviewed: "Derniers paiements traités",
    deletedAccount: "Compte supprimé",
    noProof: "Preuve indisponible",
    proofAlt: "Preuve du paiement (ouvrir en grand)",
    unknownAccount: "Compte inconnu",
    offer: (title: string | undefined) => `Offre « ${title ?? "supprimée"} »`,
    offerUntil: (date: string) => `, jusqu'au ${date}`,
    payer: "Numéro payeur",
    reference: "Référence",
    declared: "Déclaré le",
    subscription: "Abonnement",
    checkStatement: (method: string, amount: string) =>
      `Vérifiez sur le relevé ${method} que ${amount} ont bien été reçus de ce numéro avec cette référence avant de confirmer.`,
    offerQueue: " Une fois confirmé, l'offre arrive dans la file de validation des offres.",
    canceledPayment: "Abonnement annulé : le superadmin doit le réactiver avant que ce paiement puisse être confirmé.",
    rejectReason: "Motif du refus (visible par le pro)",
    confirm: "Confirmer le paiement",
    reject: "Refuser",
    canceledReason: (r: string | null) => `Annulé : ${r ?? "sans motif"}`,
    endedOn: (date: string) => `Accès terminé le ${date}`,
    accessUntil: (date: string, days: number) =>
      `Accès jusqu'au ${date} (${days <= 1 ? "dernier jour" : `${days} jours`})`,
    trialUntil: (date: string) => `Essai jusqu'au ${date}`,
    paidUntil: (date: string) => ` · payé jusqu'au ${date}`,
    remind: "Relancer",
    manage: "Gérer l'abonnement",
    reactivate: "Réactiver l'abonnement",
    give: "Offrir",
    days: "jours",
    add: "Ajouter",
    cancelReason: "Motif de l'annulation (visible par le pro)",
    cancel: "Annuler l'abonnement",
  },
  en: {
    filters: {
      tous: "All",
      bientot: "Expiring within 7 days",
      trial: "On trial",
      active: "Subscribed",
      expired: "Expired",
      canceled: "Cancelled",
    } as Record<FilterKey, string>,
    pricing: (month: string, day: string, trial: number) =>
      `${month} / month · ${day} / day per deal · ${trial}-day trial`,
    settings: "Pricing and numbers",
    keyFigures: "Key figures",
    revenueOf: (month: string) => `Revenue for ${month}`,
    previous: (month: string, amount: string) => `${month}: ${amount}`,
    subscribers: "Subscribers",
    inTrial: (n: number) => `${n} on trial`,
    toCheck: "Payments to check",
    expiringSoon: "Expiring within 7 days",
    expired: "Expired",
    expiredDetail: "no active subscription",
    canceled: "Cancelled",
    paymentsToCheck: (n: number) => `Payments to check (${n})`,
    noPayments: "No pending payments.",
    accounts: (n: number) => `Business accounts (${n})`,
    filterLabel: "Filter subscriptions",
    noAccounts: "No accounts in this list.",
    lastReviewed: "Latest processed payments",
    deletedAccount: "Deleted account",
    noProof: "Proof unavailable",
    proofAlt: "Proof of payment (open full size)",
    unknownAccount: "Unknown account",
    offer: (title: string | undefined) => `Deal "${title ?? "deleted"}"`,
    offerUntil: (date: string) => `, until ${date}`,
    payer: "Paying number",
    reference: "Reference",
    declared: "Declared on",
    subscription: "Subscription",
    checkStatement: (method: string, amount: string) =>
      `Check on the ${method} statement that ${amount} was received from this number with this reference before confirming.`,
    offerQueue: " Once confirmed, the deal goes into the deal review queue.",
    canceledPayment: "Subscription cancelled: the super administrator must reactivate it before this payment can be confirmed.",
    rejectReason: "Reason for rejection (shown to the business)",
    confirm: "Confirm payment",
    reject: "Reject",
    canceledReason: (r: string | null) => `Cancelled: ${r ?? "no reason given"}`,
    endedOn: (date: string) => `Access ended on ${date}`,
    accessUntil: (date: string, days: number) => `Access until ${date} (${days <= 1 ? "last day" : `${days} days`})`,
    trialUntil: (date: string) => `Trial until ${date}`,
    paidUntil: (date: string) => ` · paid until ${date}`,
    remind: "Send reminder",
    manage: "Manage subscription",
    reactivate: "Reactivate subscription",
    give: "Give",
    days: "days",
    add: "Add",
    cancelReason: "Reason for cancellation (shown to the business)",
    cancel: "Cancel subscription",
  },
});

type Text = (typeof T)["fr"];

const STATUS_TONE: Record<SubscriptionStatus, string> = {
  trial: "bg-sea/10 text-sea-dark dark:text-sea",
  active: "bg-verified/10 text-verified",
  expired: "bg-amber-100 text-amber-800",
  canceled: "bg-red-100 text-red-700",
};

export default async function AbonnementsPage({ searchParams }: PageProps<"/[lang]/admin/abonnements">) {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const isExpiringSoon = (s: Subscription) => (s.status === "trial" || s.status === "active") && s.daysLeft <= 7;

/** Les 6 derniers mois (mois en cours compris), à l'heure de Mahajanga : "2026-05" … "2026-10". */
function lastMonths(count: number, locale: Locale) {
  const [year, month] = todayIso().split("-").map(Number);
  const label = new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "short", timeZone: "UTC" });
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

async function Dashboard({ searchParams }: { searchParams: PageProps<"/[lang]/admin/abonnements">["searchParams"] }) {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireAdmin();
  const superadmin = user.role === "superadmin";
  const locale = await getLocale();
  const t = T[locale];
  const money = (amount: number) => formatAriary(amount, locale);

  const months = lastMonths(6, locale);
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
  const offerIds = pending.flatMap((p) => (p.offer_id ? [p.offer_id] : []));
  const [proofs, { data: paidOffers }] = await Promise.all([
    signProofUrls(supabase, pending.map((p) => p.proof_path)),
    offerIds.length
      ? supabase.from("offers").select("id, title").in("id", offerIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const offerTitles = new Map((paidOffers ?? []).map((o: { id: string; title: string }) => [o.id, o.title]));

  const revenue: RevenueMonth[] = months.map((m) => {
    const inMonth = payments.filter(
      (p) => p.status === "confirmed" && p.reviewed_at && dateOf(p.reviewed_at).startsWith(m.key),
    );
    return { ...m, amount: inMonth.reduce((sum, p) => sum + p.amount, 0), count: inMonth.length };
  });
  const thisMonth = revenue[revenue.length - 1];
  const lastMonth = revenue[revenue.length - 2];

  const raw = typeof params.statut === "string" ? params.statut : "tous";
  const filter: FilterKey = FILTERS.some((f) => f === raw) ? (raw as FilterKey) : "tous";
  const shown = pros
    .filter((p) => (filter === "tous" ? true : filter === "bientot" ? isExpiringSoon(p.sub) : p.sub.status === filter))
    .sort((a, b) => a.sub.accessUntil.localeCompare(b.sub.accessUntil));

  return (
    <div className="space-y-8 px-5 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        {settings && (
          <p className="text-sm text-muted">
            {t.pricing(money(settings.monthlyPrice), money(settings.dayPrice), settings.trialDays)}
          </p>
        )}
        {superadmin && (
          <Link href="/admin/abonnements/tarifs" className={`${secondaryButtonClass} ml-auto`}>
            <Settings className="size-4" aria-hidden />
            {t.settings}
          </Link>
        )}
      </div>

      <section aria-label={t.keyFigures} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          label={t.revenueOf(thisMonth.label)}
          value={money(thisMonth.amount)}
          detail={t.previous(lastMonth.label, money(lastMonth.amount))}
          hero
        />
        <Stat label={t.subscribers} value={String(count("active"))} detail={t.inTrial(count("trial"))} />
        <Stat label={t.toCheck} value={String(pending.length)} accent={pending.length > 0} />
        <Stat label={t.expiringSoon} value={String(pros.filter((p) => isExpiringSoon(p.sub)).length)} />
        <Stat label={t.expired} value={String(count("expired"))} detail={t.expiredDetail} />
        <Stat label={t.canceled} value={String(count("canceled"))} />
      </section>

      <RevenueChart months={revenue} locale={locale} />

      <Section title={t.paymentsToCheck(pending.length)} empty={t.noPayments}>
        {pending.map((p) => (
          <PaymentCard
            key={p.id}
            payment={p}
            pro={byUser.get(p.user_id)}
            proofUrl={proofs.get(p.proof_path)}
            offerTitle={p.offer_id ? offerTitles.get(p.offer_id) : undefined}
            t={t}
            locale={locale}
          />
        ))}
      </Section>

      <section>
        <h2 className="text-lg font-extrabold">{t.accounts(pros.length)}</h2>
        <nav aria-label={t.filterLabel} className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "tous" ? "/admin/abonnements" : `/admin/abonnements?statut=${f}`}
              aria-current={filter === f ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                filter === f ? "bg-fg text-card" : "border border-line bg-card text-fg"
              }`}
            >
              {t.filters[f]}
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-surface p-5 text-center text-sm text-muted">{t.noAccounts}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shown.map((p) => (
              <li key={p.user_id}>
                <ProCard pro={p} superadmin={superadmin} t={t} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold">{t.lastReviewed}</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card text-sm">
            {reviewed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-2.5">
                <span className="min-w-0 font-semibold">{byUser.get(p.user_id)?.company ?? t.deletedAccount}</span>
                <span className="text-muted">
                  {money(p.amount)} · {paymentLabel(p, locale)} · {paymentMethodLabel(p.method)}
                  {p.reviewed_at && ` · ${formatShortDate(dateOf(p.reviewed_at), locale)}`}
                </span>
                <span
                  className={`text-xs font-semibold ${p.status === "confirmed" ? "text-verified" : "text-red-700"}`}
                >
                  {PAYMENT_STATUS_LABEL[locale][p.status]}
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
    <div className={`rounded-2xl border border-line bg-card p-4 ${hero ? "col-span-2 md:col-span-1" : ""}`}>
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

function PaymentCard({
  payment: p,
  pro,
  proofUrl,
  offerTitle,
  t,
  locale,
}: {
  payment: PaymentRow;
  pro?: Pro;
  proofUrl?: string;
  /** Paiement de visibilité : titre de l'offre concernée. */
  offerTitle?: string;
  t: Text;
  locale: Locale;
}) {
  const canceled = pro?.sub.status === "canceled";

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-card p-4 shadow-sm">
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
            <img src={proofUrl} alt={t.proofAlt} className="size-full object-cover" />
          </a>
        ) : (
          <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-surface text-center text-xs text-muted">
            {t.noProof}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="truncate font-bold">{pro?.company ?? t.unknownAccount}</h3>
          <p className="truncate text-sm text-muted">{pro?.email}</p>
          <p className="text-lg font-extrabold text-brand">{formatAriary(p.amount, locale)}</p>
          <p className="text-sm">
            {paymentLabel(p, locale)} · {paymentMethodLabel(p.method)}
          </p>
          {p.kind === "offer" && (
            <p className="text-sm text-muted">
              {t.offer(offerTitle)}
              {p.covers_until && t.offerUntil(formatShortDate(p.covers_until, locale))}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 text-sm">
        <div>
          <dt className="text-xs text-muted">{t.payer}</dt>
          <dd className="font-semibold break-all">{p.payer_phone}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.reference}</dt>
          <dd className="font-semibold break-all">{p.reference}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.declared}</dt>
          <dd className="font-semibold">{formatShortDate(dateOf(p.created_at), locale)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.subscription}</dt>
          <dd className="font-semibold">{pro ? SUBSCRIPTION_STATUS_LABEL[locale][pro.sub.status] : "?"}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted">
        {t.checkStatement(paymentMethodLabel(p.method), formatAriary(p.amount, locale))}
        {p.kind === "offer" && t.offerQueue}
      </p>

      {canceled && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.canceledPayment}
        </p>
      )}

      <form className="space-y-2 border-t border-line pt-3">
        <input type="hidden" name="id" value={p.id} />
        <input name="reason" maxLength={300} placeholder={t.rejectReason} className={inputClass} />
        <div className="flex flex-wrap gap-2">
          {!canceled && (
            <SubmitButton
              formAction={confirmPayment}
              className="flex items-center justify-center gap-2 rounded-full bg-verified px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {t.confirm}
            </SubmitButton>
          )}
          <SubmitButton formAction={rejectPayment} className={`${secondaryButtonClass} text-red-700`}>
            {t.reject}
          </SubmitButton>
        </div>
      </form>
    </article>
  );
}

function ProCard({ pro: p, superadmin, t, locale }: { pro: Pro; superadmin: boolean; t: Text; locale: Locale }) {
  const { sub } = p;
  const until = formatShortDate(dateOf(sub.accessUntil), locale);
  const soon = isExpiringSoon(sub);
  // Message envoyé au pro : en français, la langue de travail avec les professionnels de Mahajanga.
  const untilFr = formatShortDate(dateOf(sub.accessUntil));
  const reminder =
    sub.status === "expired"
      ? `Bonjour, c'est Janga Explorer. Votre abonnement est arrivé à échéance le ${untilFr}. Pour publier à nouveau vos offres, renouvelez-le depuis votre espace pro (Mon abonnement), ou payez la visibilité d'une offre à la journée.`
      : `Bonjour, c'est Janga Explorer. Votre ${sub.status === "trial" ? "essai gratuit" : "abonnement"} se termine le ${untilFr}. Pour continuer à publier vos offres, abonnez-vous depuis votre espace pro (Mon abonnement).`;

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{p.company ?? p.email}</h3>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted">
            <Mail className="size-3.5 shrink-0" aria-hidden />
            {p.email}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[sub.status]}`}>
          {SUBSCRIPTION_STATUS_LABEL[locale][sub.status]}
        </span>
      </div>

      <p className={`text-sm ${soon ? "font-semibold text-amber-700" : "text-fg/80"}`}>
        {sub.status === "canceled"
          ? t.canceledReason(sub.cancelReason)
          : sub.status === "expired"
            ? t.endedOn(until)
            : t.accessUntil(until, sub.daysLeft)}
      </p>
      <p className="text-xs text-muted">
        {t.trialUntil(formatShortDate(dateOf(sub.trialEndsAt), locale))}
        {sub.paidUntil && t.paidUntil(formatShortDate(dateOf(sub.paidUntil), locale))}
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
              {t.remind}
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
          <summary className="cursor-pointer text-sm font-semibold text-brand">{t.manage}</summary>
          <div className="mt-3 space-y-3">
            {sub.status === "canceled" ? (
              <form>
                <input type="hidden" name="id" value={p.user_id} />
                <SubmitButton formAction={reactivateSubscription} className={secondaryButtonClass}>
                  {t.reactivate}
                </SubmitButton>
              </form>
            ) : (
              <>
                <form className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={p.user_id} />
                  <label className="flex items-center gap-2 text-sm">
                    {t.give}
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
                    {t.days}
                  </label>
                  <SubmitButton formAction={grantDays} className={secondaryButtonClass}>
                    {t.add}
                  </SubmitButton>
                </form>
                <form className="space-y-2">
                  <input type="hidden" name="id" value={p.user_id} />
                  <input
                    name="reason"
                    maxLength={300}
                    placeholder={t.cancelReason}
                    className={inputClass}
                  />
                  <SubmitButton formAction={cancelSubscription} className={`${secondaryButtonClass} text-red-700`}>
                    {t.cancel}
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
