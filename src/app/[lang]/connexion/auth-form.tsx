"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { messages } from "@/lib/i18n";
import { signIn, type AuthState } from "./actions";

const T = messages({
  fr: {
    email: "Adresse e-mail",
    password: "Mot de passe",
    submit: "Me connecter",
    noAccount: "Vous êtes professionnel et n'avez pas encore de compte ?",
    request: "Demander un compte pro",
  },
  en: {
    email: "Email address",
    password: "Password",
    submit: "Sign in",
    noAccount: "Running a business and don't have an account yet?",
    request: "Request a business account",
  },
});

export function AuthForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, null);
  const requestHref = `/connexion?${new URLSearchParams({ mode: "inscription", next })}`;
  const t = T[useLocale()];

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label={t.email}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email}
          className={inputClass}
        />
      </Field>
      <Field label={t.password}>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <FormMessage error={state?.error} info={state?.info} />
      <SubmitButton className={primaryButtonClass}>{t.submit}</SubmitButton>
      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={requestHref} className="font-semibold text-brand">
          {t.request}
        </Link>
      </p>
    </form>
  );
}
