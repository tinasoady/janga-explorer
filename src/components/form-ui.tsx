import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

export const primaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-white shadow-md shadow-brand/30 disabled:opacity-60";

export const secondaryButtonClass =
  "flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
        {error}
      </p>
    );
  }
  if (info) {
    return (
      <p role="status" className="rounded-xl bg-verified/10 px-3.5 py-2.5 text-sm font-medium text-verified">
        {info}
      </p>
    );
  }
  return null;
}

/** Message affiché quand Supabase n'est pas configuré (mode démonstration). */
export function Unavailable() {
  return (
    <div className="m-4 rounded-2xl bg-surface p-6 text-center">
      <p className="font-bold">Bientôt disponible</p>
      <p className="mt-1 text-sm text-muted">
        Les comptes sont activés dès que l&apos;application est reliée à sa base de données.
      </p>
    </div>
  );
}
