"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { formatAriary } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { MONTH_CHOICES, PAYMENT_METHODS, type PaymentMethod } from "@/lib/subscription";
import type { FormState } from "../actions";
import { declarePayment } from "./actions";

const T = messages({
  fr: {
    noNumbers: "Les numéros de paiement ne sont pas encore renseignés. Contactez Janga Explorer pour payer.",
    duration: "Durée",
    months: (m: number) => `${m} mois`,
    method: "Moyen de paiement",
    send: (amount: string, method: string) => [`Envoyez `, amount, ` par ${method} au`],
    to: (name: string) => `au nom de ${name}`,
    keepSms: "Gardez le SMS de confirmation : il contient la référence de la transaction.",
    payer: "Numéro qui a payé",
    reference: "Référence de la transaction",
    referenceHint: "Indiquée dans le SMS de confirmation de l'opérateur.",
    proof: "Preuve du paiement",
    proofHint: "Capture d'écran du SMS ou de l'application (JPEG, PNG ou WebP, 5 Mo maximum).",
    submit: "J'ai payé : envoyer pour vérification",
  },
  en: {
    noNumbers: "Payment numbers haven't been set up yet. Contact Janga Explorer to pay.",
    duration: "Duration",
    months: (m: number) => `${m} month${m > 1 ? "s" : ""}`,
    method: "Payment method",
    send: (amount: string, method: string) => [`Send `, amount, ` by ${method} to`],
    to: (name: string) => `in the name of ${name}`,
    keepSms: "Keep the confirmation SMS: it contains the transaction reference.",
    payer: "Number that paid",
    reference: "Transaction reference",
    referenceHint: "Shown in the operator's confirmation SMS.",
    proof: "Proof of payment",
    proofHint: "Screenshot of the SMS or app (JPEG, PNG or WebP, 5 MB max).",
    submit: "I've paid: send for checking",
  },
});

type Props = {
  monthlyPrice: number;
  /** Paiement des jours de visibilité d'une offre (au lieu de mois d'abonnement) : montant fixé d'avance. */
  offer?: { id: string; days: number; amount: number };
  accountName: string;
  /** Numéros de réception renseignés par l'administration (les moyens sans numéro ne sont pas proposés). */
  numbers: Partial<Record<PaymentMethod, string>>;
};

export function PaymentForm({ monthlyPrice, offer, accountName, numbers }: Props) {
  const [state, action] = useActionState<FormState, FormData>(declarePayment, null);
  const methods = PAYMENT_METHODS.filter((m) => numbers[m.key]);
  const [method, setMethod] = useState<string>(state?.values?.method || methods[0]?.key || "");
  const [months, setMonths] = useState(Number(state?.values?.months) || 1);
  const selected = methods.find((m) => m.key === method);
  const amount = offer ? offer.amount : months * monthlyPrice;
  const locale = useLocale();
  const t = T[locale];

  if (methods.length === 0) {
    return (
      <p className="rounded-2xl bg-surface p-5 text-center text-sm text-muted">
        {t.noNumbers}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {offer ? (
        <input type="hidden" name="offerId" value={offer.id} />
      ) : (
        <Field label={t.duration}>
          <select
            name="months"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className={inputClass}
          >
            {MONTH_CHOICES.map((m) => (
              <option key={m} value={m}>
                {t.months(m)} · {formatAriary(m * monthlyPrice, locale)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold">{t.method}</legend>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((m) => (
            <label
              key={m.key}
              className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center text-sm font-semibold ${
                method === m.key ? "border-brand bg-brand-soft text-brand" : "border-line bg-card"
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
            {t.send(formatAriary(amount, locale), selected.label).map((part, i) =>
              i === 1 ? <strong key={i}>{part}</strong> : part,
            )}
          </p>
          <p className="mt-1 text-xl font-extrabold tracking-wide">{numbers[selected.key]}</p>
          {accountName && <p className="text-muted">{t.to(accountName)}</p>}
          <p className="mt-2 text-xs text-muted">{t.keepSms}</p>
        </div>
      )}

      <Field label={t.payer}>
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

      <Field label={t.reference} hint={t.referenceHint}>
        <input
          name="reference"
          required
          minLength={3}
          maxLength={60}
          defaultValue={state?.values?.reference}
          className={inputClass}
        />
      </Field>

      <Field label={t.proof} hint={t.proofHint}>
        <input
          name="proof"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand"
        />
      </Field>

      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>{t.submit}</SubmitButton>
    </form>
  );
}
