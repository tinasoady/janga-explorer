import type { Metadata } from "next";
import { Suspense } from "react";
import { Crown, ShieldCheck } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { secondaryButtonClass, Unavailable } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireSuperadmin, ROLE_LABEL } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { removeAdmin } from "./actions";
import { AddAdminForm } from "./add-admin-form";

const TITLES = {
  fr: { meta: "Équipe d'administration", heading: "Équipe d'administration" },
  en: { meta: "Admin team", heading: "Admin team" },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TITLES[await getLocale()].meta };
}

type AdminRow = { id: string; email: string; role: "admin" | "superadmin" };

export default async function EquipePage() {
  const { heading } = TITLES[await getLocale()];
  return (
    <>
      <header className="flex items-center gap-2 px-2 py-3">
        <BackButton fallback="/admin" />
        <h1 className="text-xl font-extrabold md:text-2xl">{heading}</h1>
      </header>
      <Suspense fallback={<div className="m-5 h-64 animate-pulse rounded-2xl bg-surface" aria-hidden />}>
        <Team />
      </Suspense>
    </>
  );
}

const T = messages({
  fr: {
    intro:
      "Un administrateur valide, crée et modifie les offres. Seul un super-administrateur peut nommer ou retirer des administrateurs : on ne devient jamais administrateur en s'inscrivant.",
    you: " (vous)",
    remove: "Retirer",
    add: "Nommer un administrateur",
  },
  en: {
    intro:
      "An administrator reviews, creates and edits deals. Only a super administrator can appoint or remove administrators: nobody becomes an administrator by signing up.",
    you: " (you)",
    remove: "Remove",
    add: "Appoint an administrator",
  },
});

async function Team() {
  if (!isSupabaseConfigured()) return <Unavailable />;
  const { user, supabase } = await requireSuperadmin();
  const locale = await getLocale();
  const t = T[locale];
  const { data } = await supabase.rpc("list_admins");
  const admins = (data ?? []) as AdminRow[];

  return (
    <div className="space-y-6 px-5 pb-8">
      <p className="text-sm text-muted">{t.intro}</p>

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
                {admin.id === user.id && <span className="font-normal text-muted">{t.you}</span>}
              </p>
              <p className="text-xs text-muted">{ROLE_LABEL[locale][admin.role]}</p>
            </div>
            {admin.role === "admin" && (
              <form action={removeAdmin}>
                <input type="hidden" name="email" value={admin.email} />
                <SubmitButton className={`${secondaryButtonClass} text-red-700`}>{t.remove}</SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">{t.add}</h2>
        <AddAdminForm />
      </section>
    </div>
  );
}
