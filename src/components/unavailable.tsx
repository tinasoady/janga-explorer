"use client";

import { useLocale } from "./locale-provider";

/** Message affiché quand Supabase n'est pas configuré (mode démonstration). */
export function Unavailable() {
  const en = useLocale() === "en";
  return (
    <div className="m-4 rounded-2xl bg-surface p-6 text-center">
      <p className="font-bold">{en ? "Coming soon" : "Bientôt disponible"}</p>
      <p className="mt-1 text-sm text-muted">
        {en
          ? "Accounts will be switched on as soon as the app is connected to its database."
          : "Les comptes sont activés dès que l'application est reliée à sa base de données."}
      </p>
    </div>
  );
}
