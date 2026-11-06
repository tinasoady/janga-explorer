"use client";

import { useActionState } from "react";
import { Bell } from "lucide-react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { formatAriary } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { BUDGETS, CATEGORIES } from "@/lib/types";
import { createAlert, type AlertState } from "./actions";

const T = messages({
  fr: {
    category: "Catégorie",
    all: "Toutes",
    budget: "Budget maximum",
    anyBudget: "Peu importe",
    keyword: "Mot-clé",
    keywordHint: "Ex : poisson, piscine, concert.",
    create: "Créer l'alerte",
  },
  en: {
    category: "Category",
    all: "All",
    budget: "Maximum budget",
    anyBudget: "Any",
    keyword: "Keyword",
    keywordHint: "E.g. fish, pool, concert.",
    create: "Create the alert",
  },
});

export function AlertForm({ defaults }: { defaults: { cat?: string; max?: string; q?: string } }) {
  const [state, action] = useActionState<AlertState, FormData>(createAlert, null);
  const locale = useLocale();
  const t = T[locale];

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line p-4">
      <Field label={t.category}>
        <select name="cat" defaultValue={defaults.cat ?? ""} className={inputClass}>
          <option value="">{t.all}</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label[locale]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.budget}>
        <select name="max" defaultValue={defaults.max ?? ""} className={inputClass}>
          <option value="">{t.anyBudget}</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              ≤ {formatAriary(b, locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.keyword} hint={t.keywordHint}>
        <input name="q" maxLength={80} defaultValue={defaults.q ?? ""} className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>
        <Bell className="size-4" aria-hidden />
        {t.create}
      </SubmitButton>
    </form>
  );
}
