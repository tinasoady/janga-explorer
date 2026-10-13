import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Building2, Mail, MapPin, Users } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { inputClass, secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireSuperadmin } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { proKindLabel } from "@/lib/pro-request";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { approveRequest, rejectRequest } from "./actions";

export const metadata: Metadata = { title: "Demandes de compte pro" };

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

export default function DemandesPage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">Demandes de compte pro</h1>
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
      <p className="text-sm text-muted">
        Vérifiez l&apos;établissement (justificatif, appel ou WhatsApp) avant d&apos;approuver. Une demande approuvée
        active le compte : la personne peut créer son établissement et publier ses offres.
      </p>

      <Section title={`À vérifier (${pending.length})`} empty="Aucune demande en attente.">
        {pending.map((r) => (
          <RequestCard key={r.user_id} request={r} />
        ))}
      </Section>
      <Section title={`Approuvées (${approved.length})`} empty="Aucun compte approuvé pour l'instant.">
        {approved.map((r) => (
          <RequestCard key={r.user_id} request={r} />
        ))}
      </Section>
      {rejected.length > 0 && (
        <Section title={`Refusées (${rejected.length})`} empty="">
          {rejected.map((r) => (
            <RequestCard key={r.user_id} request={r} />
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

function RequestCard({ request: r }: { request: RequestRow }) {
  const reasonPlaceholder =
    r.status === "approved"
      ? "Motif du retrait (visible par la personne)"
      : "Motif du refus (visible par la personne)";

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-bold">{r.company}</h3>
        <p className="text-sm text-muted">
          {proKindLabel(r.kind)} · demandé le {formatShortDate(r.created_at.slice(0, 10))}
        </p>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">Contact</dt>
          <Building2 className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>{r.full_name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">E-mail</dt>
          <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>
            <a href={`mailto:${r.email}`} className="text-sea underline-offset-2 hover:underline">
              {r.email}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Localité</dt>
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>{r.locality}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Capacité</dt>
          <Users className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <dd>Capacité : {r.capacity}</dd>
        </div>
      </dl>

      <div className="rounded-xl bg-surface p-3 text-sm">
        <p className="text-xs font-semibold text-muted">Justificatif</p>
        <p className="mt-0.5 break-words whitespace-pre-line">{r.justification}</p>
      </div>

      {r.status === "rejected" && r.rejection_reason && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Motif : {r.rejection_reason}</p>
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
              Approuver
            </SubmitButton>
          )}
          {r.status !== "rejected" && (
            <SubmitButton formAction={rejectRequest} className={`${secondaryButtonClass} text-red-700`}>
              {r.status === "approved" ? "Retirer l'accès" : "Refuser"}
            </SubmitButton>
          )}
        </div>
      </form>
    </article>
  );
}
