"use client";

import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { messages } from "@/lib/i18n";
import type { ManagedBusiness } from "@/lib/managed";
import { saveBusiness, type FormState } from "../actions";

const T = messages({
  fr: {
    name: "Nom de l'établissement",
    kind: "Type",
    kindHint: "Ex : Restaurant, Hôtel, Agence d'excursions, Bar.",
    whatsapp: "Numéro WhatsApp",
    whatsappHint: "Les clients vous écrivent directement. Ex : 034 12 345 67.",
    phone: "Téléphone (facultatif)",
    phoneHint: "Si différent du WhatsApp.",
    save: "Enregistrer",
  },
  en: {
    name: "Business name",
    kind: "Type",
    kindHint: "E.g. Restaurant, Hotel, Excursion agency, Bar.",
    whatsapp: "WhatsApp number",
    whatsappHint: "Customers message you directly. E.g. 034 12 345 67.",
    phone: "Phone (optional)",
    phoneHint: "If different from WhatsApp.",
    save: "Save",
  },
});

export function BusinessForm({
  business,
  defaults,
}: {
  business: ManagedBusiness | null;
  /** Valeurs proposées pour une première fiche. */
  defaults?: { name: string; kind: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveBusiness, null);
  const t = T[useLocale()];
  const v = (name: keyof ManagedBusiness) =>
    state?.values?.[name] ?? business?.[name] ?? (name === "name" || name === "kind" ? defaults?.[name] : undefined) ?? "";

  return (
    <form action={action} className="space-y-4">
      <Field label={t.name}>
        <input name="name" required maxLength={80} defaultValue={v("name")} className={inputClass} />
      </Field>
      <Field label={t.kind} hint={t.kindHint}>
        <input name="kind" maxLength={60} defaultValue={v("kind")} placeholder="Restaurant" className={inputClass} />
      </Field>
      <Field label={t.whatsapp} hint={t.whatsappHint}>
        <input
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={v("whatsapp")}
          className={inputClass}
        />
      </Field>
      <Field label={t.phone} hint={t.phoneHint}>
        <input name="phone" type="tel" inputMode="tel" maxLength={30} defaultValue={v("phone")} className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>{t.save}</SubmitButton>
    </form>
  );
}
