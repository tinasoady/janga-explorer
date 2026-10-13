"use client";

import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import type { ManagedBusiness } from "@/lib/managed";
import { saveBusiness, type FormState } from "../actions";

export function BusinessForm({
  business,
  defaults,
}: {
  business: ManagedBusiness | null;
  /** Valeurs proposées pour une première fiche. */
  defaults?: { name: string; kind: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveBusiness, null);
  const v = (name: keyof ManagedBusiness) =>
    state?.values?.[name] ?? business?.[name] ?? (name === "name" || name === "kind" ? defaults?.[name] : undefined) ?? "";

  return (
    <form action={action} className="space-y-4">
      <Field label="Nom de l'établissement">
        <input name="name" required maxLength={80} defaultValue={v("name")} className={inputClass} />
      </Field>
      <Field label="Type" hint="Ex : Restaurant, Hôtel, Agence d'excursions, Bar.">
        <input name="kind" maxLength={60} defaultValue={v("kind")} placeholder="Restaurant" className={inputClass} />
      </Field>
      <Field label="Numéro WhatsApp" hint="Les clients vous écrivent directement. Ex : 034 12 345 67.">
        <input
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={v("whatsapp")}
          className={inputClass}
        />
      </Field>
      <Field label="Téléphone (facultatif)" hint="Si différent du WhatsApp.">
        <input name="phone" type="tel" inputMode="tel" maxLength={30} defaultValue={v("phone")} className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>Enregistrer</SubmitButton>
    </form>
  );
}
