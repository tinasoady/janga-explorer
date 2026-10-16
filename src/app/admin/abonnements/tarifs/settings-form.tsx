"use client";

import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { PAYMENT_METHODS, type SubscriptionSettings } from "@/lib/subscription";
import { saveSettings, type SettingsState } from "../actions";

export function SettingsForm({ settings }: { settings: SubscriptionSettings }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, null);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix par mois (Ar)" hint="S'applique aux paiements déclarés ensuite.">
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
        <Field label="Essai gratuit (jours)" hint="Pour les comptes approuvés ensuite.">
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

      <Field label="Bénéficiaire" hint="Nom affiché au pro sous le numéro, pour qu'il vérifie avant d'envoyer.">
        <input name="accountName" maxLength={80} defaultValue={settings.accountName} className={inputClass} />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Numéros qui reçoivent les paiements</legend>
        <p className="text-xs text-muted">Laissez vide un moyen de paiement que vous n&apos;acceptez pas.</p>
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
      <SubmitButton className={primaryButtonClass}>Enregistrer</SubmitButton>
    </form>
  );
}
