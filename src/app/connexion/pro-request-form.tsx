"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { PRO_KINDS } from "@/lib/pro-request";
import { requestProAccount, type ProRequestState } from "./actions";

export function ProRequestForm({ next }: { next: string }) {
  const [state, action] = useActionState<ProRequestState, FormData>(requestProAccount, null);
  const v = (name: string) => state?.values?.[name] ?? "";

  if (state?.info) {
    return (
      <div className="space-y-4">
        <FormMessage info={state.info} />
        <p className="text-sm text-muted">
          Nous pouvons vous contacter par téléphone ou WhatsApp pour confirmer votre activité.
        </p>
        <Link href="/" className="block text-center text-sm font-semibold text-brand">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Votre nom complet">
        <input name="fullName" required maxLength={80} autoComplete="name" defaultValue={v("fullName")} className={inputClass} />
      </Field>
      <Field label="Nom de l'entreprise ou de l'établissement">
        <input name="company" required maxLength={80} autoComplete="organization" defaultValue={v("company")} className={inputClass} />
      </Field>
      <Field label="Type d'activité">
        <select name="kind" required defaultValue={v("kind")} className={inputClass}>
          <option value="" disabled>
            Choisir…
          </option>
          {PRO_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Localité" hint="Ville ou quartier (ex : Amborovy, Corniche).">
          <input name="locality" required maxLength={80} defaultValue={v("locality")} className={inputClass} />
        </Field>
        <Field label="Capacité d'accueil" hint="Chambres, couverts ou participants.">
          <input
            name="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            required
            defaultValue={v("capacity")}
            className={inputClass}
          />
        </Field>
      </div>
      <Field
        label="Justificatif de votre activité"
        hint="Numéro NIF / STAT, page Facebook, site web ou lien Google Maps de l'établissement. Nous le vérifions avant d'activer le compte."
      >
        <textarea
          name="justification"
          required
          minLength={5}
          maxLength={500}
          rows={3}
          defaultValue={v("justification")}
          className={inputClass}
        />
      </Field>
      <Field label="E-mail professionnel">
        <input name="email" type="email" required autoComplete="email" defaultValue={v("email")} className={inputClass} />
      </Field>
      <Field label="Mot de passe" hint="8 caractères minimum.">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>Envoyer ma demande</SubmitButton>
      <p className="text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href={`/connexion?${new URLSearchParams({ next })}`} className="font-semibold text-brand">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
