"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { formatAriary } from "@/lib/format";
import { MONTH_CHOICES, PAYMENT_METHODS, type PaymentMethod } from "@/lib/subscription";
import type { FormState } from "../actions";
import { declarePayment } from "./actions";

type Props = {
  monthlyPrice: number;
  accountName: string;
  /** Numéros de réception renseignés par l'administration (les moyens sans numéro ne sont pas proposés). */
  numbers: Partial<Record<PaymentMethod, string>>;
};

export function PaymentForm({ monthlyPrice, accountName, numbers }: Props) {
  const [state, action] = useActionState<FormState, FormData>(declarePayment, null);
  const methods = PAYMENT_METHODS.filter((m) => numbers[m.key]);
  const [method, setMethod] = useState<string>(state?.values?.method || methods[0]?.key || "");
  const [months, setMonths] = useState(Number(state?.values?.months) || 1);
  const selected = methods.find((m) => m.key === method);

  if (methods.length === 0) {
    return (
      <p className="rounded-2xl bg-surface p-5 text-center text-sm text-muted">
        Les numéros de paiement ne sont pas encore renseignés. Contactez Janga Explorer pour vous abonner.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Durée">
        <select
          name="months"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className={inputClass}
        >
          {MONTH_CHOICES.map((m) => (
            <option key={m} value={m}>
              {m === 1 ? "1 mois" : `${m} mois`} · {formatAriary(m * monthlyPrice)}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold">Moyen de paiement</legend>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((m) => (
            <label
              key={m.key}
              className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center text-sm font-semibold ${
                method === m.key ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"
              }`}
            >
              <input
                type="radio"
                name="method"
                value={m.key}
                checked={method === m.key}
                onChange={() => setMethod(m.key)}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      {selected && (
        <div className="rounded-xl bg-surface p-4 text-sm">
          <p>
            Envoyez <strong>{formatAriary(months * monthlyPrice)}</strong> par {selected.label} au
          </p>
          <p className="mt-1 text-xl font-extrabold tracking-wide">{numbers[selected.key]}</p>
          {accountName && <p className="text-muted">au nom de {accountName}</p>}
          <p className="mt-2 text-xs text-muted">
            Gardez le SMS de confirmation : il contient la référence de la transaction.
          </p>
        </div>
      )}

      <Field label="Numéro qui a payé">
        <input
          name="payerPhone"
          type="tel"
          inputMode="tel"
          required
          maxLength={20}
          placeholder="034 12 345 67"
          defaultValue={state?.values?.payerPhone}
          className={inputClass}
        />
      </Field>

      <Field label="Référence de la transaction" hint="Indiquée dans le SMS de confirmation de l'opérateur.">
        <input
          name="reference"
          required
          minLength={3}
          maxLength={60}
          defaultValue={state?.values?.reference}
          className={inputClass}
        />
      </Field>

      <Field label="Preuve du paiement" hint="Capture d'écran du SMS ou de l'application (JPEG, PNG ou WebP, 5 Mo maximum).">
        <input
          name="proof"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand"
        />
      </Field>

      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>J&apos;ai payé : envoyer pour vérification</SubmitButton>
    </form>
  );
}
