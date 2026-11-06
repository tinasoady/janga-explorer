"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { messages } from "@/lib/i18n";
import { PRO_KINDS } from "@/lib/pro-request";
import { requestProAccount, type ProRequestState } from "./actions";

const T = messages({
  fr: {
    contactNote: "Nous pouvons vous contacter par téléphone ou WhatsApp pour confirmer votre activité.",
    home: "Retour à l'accueil",
    fullName: "Votre nom complet",
    company: "Nom de l'entreprise ou de l'établissement",
    kind: "Type d'activité",
    choose: "Choisir…",
    locality: "Localité",
    localityHint: "Ville ou quartier (ex : Amborovy, Corniche).",
    capacity: "Capacité d'accueil",
    capacityHint: "Chambres, couverts ou participants.",
    proof: "Justificatif de votre activité",
    proofHint:
      "Numéro NIF / STAT, page Facebook, site web ou lien Google Maps de l'établissement. Nous le vérifions avant d'activer le compte.",
    email: "E-mail professionnel",
    password: "Mot de passe",
    passwordHint: "8 caractères minimum.",
    submit: "Envoyer ma demande",
    already: "Déjà un compte ?",
    signIn: "Se connecter",
  },
  en: {
    contactNote: "We may contact you by phone or WhatsApp to confirm your business.",
    home: "Back to home",
    fullName: "Your full name",
    company: "Name of your company or business",
    kind: "Type of business",
    choose: "Choose…",
    locality: "Location",
    localityHint: "Town or neighbourhood (e.g. Amborovy, Corniche).",
    capacity: "Capacity",
    capacityHint: "Rooms, covers or participants.",
    proof: "Proof of your business",
    proofHint:
      "NIF / STAT number, Facebook page, website or Google Maps link of the business. We check it before activating the account.",
    email: "Business email",
    password: "Password",
    passwordHint: "At least 8 characters.",
    submit: "Send my request",
    already: "Already have an account?",
    signIn: "Sign in",
  },
});

export function ProRequestForm({ next }: { next: string }) {
  const [state, action] = useActionState<ProRequestState, FormData>(requestProAccount, null);
  const v = (name: string) => state?.values?.[name] ?? "";
  const locale = useLocale();
  const t = T[locale];

  if (state?.info) {
    return (
      <div className="space-y-4">
        <FormMessage info={state.info} />
        <p className="text-sm text-muted">{t.contactNote}</p>
        <Link href="/" className="block text-center text-sm font-semibold text-brand">
          {t.home}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label={t.fullName}>
        <input name="fullName" required maxLength={80} autoComplete="name" defaultValue={v("fullName")} className={inputClass} />
      </Field>
      <Field label={t.company}>
        <input name="company" required maxLength={80} autoComplete="organization" defaultValue={v("company")} className={inputClass} />
      </Field>
      <Field label={t.kind}>
        <select name="kind" required defaultValue={v("kind")} className={inputClass}>
          <option value="" disabled>
            {t.choose}
          </option>
          {PRO_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label[locale]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.locality} hint={t.localityHint}>
          <input name="locality" required maxLength={80} defaultValue={v("locality")} className={inputClass} />
        </Field>
        <Field label={t.capacity} hint={t.capacityHint}>
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
      <Field label={t.proof} hint={t.proofHint}>
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
      <Field label={t.email}>
        <input name="email" type="email" required autoComplete="email" defaultValue={v("email")} className={inputClass} />
      </Field>
      <Field label={t.password} hint={t.passwordHint}>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>{t.submit}</SubmitButton>
      <p className="text-center text-sm text-muted">
        {t.already}{" "}
        <Link href={`/connexion?${new URLSearchParams({ next })}`} className="font-semibold text-brand">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
