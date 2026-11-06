import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Building2, Mail, MapPin, Users } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { inputClass, secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireSuperadmin } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { proKindLabel } from "@/lib/pro-request";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { approveRequest, rejectRequest } from "./actions";

const TITLES = {
  fr: { meta: "Demandes de compte pro", heading: "Demandes de compte pro" },
  en: { meta: "Business account requests", heading: "Business account requests" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

type RequestRow = {
  user_id: string;
  email: string;
  full_name: string;
  company: string;
  kind: string;
  locality: string;
  capacity: number;
  justification: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

const T = messages({
  fr: {
    intro:
      "Vérifiez l'établissement (justificatif, appel ou WhatsApp) avant d'approuver. Une demande approuvée active le compte : la personne peut créer son établissement et publier ses offres.",
    toCheck: (n: number) => `À vérifier (${n})`,
    noPending: "Aucune demande en attente.",
    approved: (n: number) => `Approuvées (${n})`,
    noApproved: "Aucun compte approuvé pour l'instant.",
    rejected: (n: number) => `Refusées (${n})`,
    withdrawReason: "Motif du retrait (visible par la personne)",
    rejectReason: "Motif du refus (visible par la personne)",
    requestedOn: (date: string) => `demandé le ${date}`,
    contact: "Contact",
    email: "E-mail",
    locality: "Localité",
    capacityLabel: "Capacité",
    capacity: (n: number) => `Capacité : ${n}`,
    proof: "Justificatif",
    reason: (r: string) => `Motif : ${r}`,
    approve: "Approuver",
    withdraw: "Retirer l'accès",
    reject: "Refuser",
  },
  en: {
    intro:
      "Check the business (proof, call or WhatsApp) before approving. Approving a request activates the account: the person can create their business and post deals.",
    toCheck: (n: number) => `To check (${n})`,
    noPending: "No pending requests.",
    approved: (n: number) => `Approved (${n})`,
    noApproved: "No approved accounts yet.",
    rejected: (n: number) => `Rejected (${n})`,
    withdrawReason: "Reason for withdrawal (shown to the person)",
    rejectReason: "Reason for rejection (shown to the person)",
    requestedOn: (date: string) => `requested on ${date}`,
    contact: "Contact",
    email: "Email",
    locality: "Location",
    capacityLabel: "Capacity",
    capacity: (n: number) => `Capacity: ${n}`,
    proof: "Proof",
    reason: (r: string) => `Reason: ${r}`,
    approve: "Approve",
    withdraw: "Withdraw access",
    reject: "Reject",
  },
});

type Text = (typeof T)["fr"];

export default async function DemandesPage() {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Requests />
      </Suspense>
    </>
  );
}

async function Requests() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { supabase } = await requireSuperadmin("/admin/demandes");
  const locale = await getLocale();
  const t = T[locale];

  const { data, error } = await supabase
    .from("pro_requests")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<RequestRow[]>();
  if (error) throw new Error(`Chargement impossible : ${error.message}`);

  const pending = data.filter((r) => r.status === "pending");
  const approved = data.filter((r) => r.status === "approved").reverse();
  const rejected = data.filter((r) => r.status === "rejected").reverse();

  return (
    <div className="space-y-8 px-5 pb-8">
      <p className="text-sm text-muted">{t.intro}</p>

      <Section title={t.toCheck(pending.length)} empty={t.noPending}>
        {pending.map((r) => (
          <RequestCard key={r.user_id} request={r} t={t} locale={locale} />
        ))}
      </Section>
      <Section title={t.approved(approved.length)} empty={t.noApproved}>
        {approved.map((r) => (
          <RequestCard key={r.user_id} request={r} t={t} locale={locale} />
        ))}
      </Section>
      {rejected.length > 0 && (
        <Section title={t.rejected(rejected.length)} empty="">
          {rejected.map((r) => (
            <RequestCard key={r.user_id} request={r} t={t} locale={locale} />
          ))}
        </Section>
      )}
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

function RequestCard({ request: r, t, locale }: { request: RequestRow; t: Text; locale: Locale }) {
  const reasonPlaceholder = r.status === "approved" ? t.withdrawReason : t.rejectReason;

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-bold">{r.company}</h3>
        <p className="text-sm text-muted">
          {proKindLabel(r.kind, locale)} · {t.requestedOn(formatShortDate(r.created_at.slice(0, 10), locale))}
        </p>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">{t.contact}</dt>
          <Building2 className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>{r.full_name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">{t.email}</dt>
          <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>
            <a href={`mailto:${r.email}`} className="text-sea underline-offset-2 hover:underline">
              {r.email}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">{t.locality}</dt>
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>{r.locality}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">{t.capacityLabel}</dt>
          <Users className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>{t.capacity(r.capacity)}</dd>
        </div>
      </dl>

      <div className="rounded-xl bg-surface p-3 text-sm">
        <p className="text-xs font-semibold text-muted">{t.proof}</p>
        <p className="mt-0.5 break-words whitespace-pre-line">{r.justification}</p>
      </div>

      {r.status === "rejected" && r.rejection_reason && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{t.reason(r.rejection_reason)}</p>
      )}

      <form className="space-y-2 border-t border-line pt-3">
        <input type="hidden" name="id" value={r.user_id} />
        {r.status !== "rejected" && (
          <input name="reason" maxLength={300} placeholder={reasonPlaceholder} className={inputClass} />
        )}
        <div className="flex flex-wrap gap-2">
          {r.status !== "approved" && (
            <SubmitButton
              formAction={approveRequest}
              className="flex items-center justify-center gap-2 rounded-full bg-verified px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {t.approve}
            </SubmitButton>
          )}
          {r.status !== "rejected" && (
            <SubmitButton formAction={rejectRequest} className={`${secondaryButtonClass} text-red-700`}>
              {r.status === "approved" ? t.withdraw : t.reject}
            </SubmitButton>
          )}
        </div>
      </form>
    </article>
  );
}
