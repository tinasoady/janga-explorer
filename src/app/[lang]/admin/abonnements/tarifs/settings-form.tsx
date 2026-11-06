"use client";

import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { messages } from "@/lib/i18n";
import { SubmitButton } from "@/components/submit-button";
import { PAYMENT_METHODS, type SubscriptionSettings } from "@/lib/subscription";
import { saveSettings, type SettingsState } from "../actions";

const T = messages({
  fr: {
    monthly: "Prix par mois (Ar)",
    monthlyHint: "S'applique aux paiements déclarés ensuite.",
    daily: "Prix par jour et par offre (Ar)",
    dailyHint: "Pour publier sans abonnement, à la durée.",
    trial: "Essai gratuit (jours)",
    trialHint: "Pour les comptes approuvés ensuite.",
    account: "Bénéficiaire",
    accountHint: "Nom affiché au pro sous le numéro, pour qu'il vérifie avant d'envoyer.",
    numbers: "Numéros qui reçoivent les paiements",
    numbersHint: "Laissez vide un moyen de paiement que vous n'acceptez pas.",
    save: "Enregistrer",
  },
  en: {
    monthly: "Price per month (Ar)",
    monthlyHint: "Applies to payments declared afterwards.",
    daily: "Price per day per deal (Ar)",
    dailyHint: "To post without a subscription, paid per day.",
    trial: "Free trial (days)",
    trialHint: "For accounts approved afterwards.",
    account: "Payee",
    accountHint: "Name shown to the business under the number, so they can check before sending.",
    numbers: "Numbers that receive payments",
    numbersHint: "Leave a payment method empty if you don't accept it.",
    save: "Save",
  },
});

export function SettingsForm({ settings }: { settings: SubscriptionSettings }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, null);
  const t = T[useLocale()];

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.monthly} hint={t.monthlyHint}>
          <input
            name="monthlyPrice"
            type="number"
            inputMode="numeric"
            required
            min={0}
            max={10000000}
            step={500}
            defaultValue={settings.monthlyPrice}
            className={inputClass}
          />
        </Field>
        <Field label={t.daily} hint={t.dailyHint}>
          <input
            name="dayPrice"
            type="number"
            inputMode="numeric"
            required
            min={0}
            max={1000000}
            step={100}
            defaultValue={settings.dayPrice}
            className={inputClass}
          />
        </Field>
        <Field label={t.trial} hint={t.trialHint}>
          <input
            name="trialDays"
            type="number"
            inputMode="numeric"
            required
            min={0}
            max={365}
            defaultValue={settings.trialDays}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={t.account} hint={t.accountHint}>
        <input name="accountName" maxLength={80} defaultValue={settings.accountName} className={inputClass} />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t.numbers}</legend>
        <p className="text-xs text-muted">{t.numbersHint}</p>
        {PAYMENT_METHODS.map((m) => (
          <Field key={m.key} label={m.label}>
            <input
              name={m.key}
              type="tel"
              inputMode="tel"
              maxLength={30}
              placeholder="034 12 345 67"
              defaultValue={settings.numbers[m.key]}
              className={inputClass}
            />
          </Field>
        ))}
      </fieldset>

      <FormMessage error={state?.error} info={state?.info} />
      <SubmitButton className={primaryButtonClass}>{t.save}</SubmitButton>
    </form>
  );
}
