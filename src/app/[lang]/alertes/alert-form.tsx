"use client";

import { useActionState } from "react";
import { Bell } from "lucide-react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { formatAriary } from "@/lib/format";
import { BUDGETS, CATEGORIES } from "@/lib/types";
import { createAlert, type AlertState } from "./actions";

export function AlertForm({ defaults }: { defaults: { cat?: string; max?: string; q?: string } }) {
  const [state, action] = useActionState<AlertState, FormData>(createAlert, null);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line p-4">
      <Field label="Catégorie">
        <select name="cat" defaultValue={defaults.cat ?? ""} className={inputClass}>
          <option value="">Toutes</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Budget maximum">
        <select name="max" defaultValue={defaults.max ?? ""} className={inputClass}>
          <option value="">Peu importe</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              ≤ {formatAriary(b)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mot-clé" hint="Ex : poisson, piscine, concert.">
        <input name="q" maxLength={80} defaultValue={defaults.q ?? ""} className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>
        <Bell className="size-4" aria-hidden />
        Créer l&apos;alerte
      </SubmitButton>
    </form>
  );
}
