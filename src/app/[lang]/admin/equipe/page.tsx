import type { Metadata } from "next";
import { Suspense } from "react";
import { Crown, ShieldCheck } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireSuperadmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { removeAdmin } from "./actions";
import { AddAdminForm } from "./add-admin-form";

export const metadata: Metadata = { title: "Équipe d'administration" };

type AdminRow = { id: string; email: string; role: "admin" | "superadmin" };

export default function EquipePage() {
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">Équipe d&apos;administration</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Team />
      </Suspense>
    </>
  );
}

async function Team() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireSuperadmin();
  const { data } = await supabase.rpc("list_admins");
  const admins = (data ?? []) as AdminRow[];

  return (
    <div className="space-y-6 px-5 pb-8">
      <p className="text-sm text-muted">
        Un administrateur valide, crée et modifie les offres. Seul un super-administrateur peut nommer ou retirer des
        administrateurs : on ne devient jamais administrateur en s&apos;inscrivant.
      </p>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center gap-3 px-4 py-3">
            {admin.role === "superadmin" ? (
              <Crown className="size-5 shrink-0 text-amber-500" aria-hidden />
            ) : (
              <ShieldCheck className="size-5 shrink-0 text-verified" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {admin.email}
                {admin.id === user.id && <span className="font-normal text-muted"> (vous)</span>}
              </p>
              <p className="text-xs text-muted">
                {admin.role === "superadmin" ? "Super-administrateur" : "Administrateur"}
              </p>
            </div>
            {admin.role === "admin" && (
              <form action={removeAdmin}>
                <input type="hidden" name="email" value={admin.email} />
                <SubmitButton className={`${secondaryButtonClass} text-red-700`}>Retirer</SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Nommer un administrateur</h2>
        <AddAdminForm />
      </section>
    </div>
  );
}
