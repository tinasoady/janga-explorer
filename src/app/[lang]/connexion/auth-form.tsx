"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { signIn, type AuthState } from "./actions";

export function AuthForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, null);
  const requestHref = `/connexion?${new URLSearchParams({ mode: "inscription", next })}`;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Adresse e-mail">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email}
          className={inputClass}
        />
      </Field>
      <Field label="Mot de passe">
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <FormMessage error={state?.error} info={state?.info} />
      <SubmitButton className={primaryButtonClass}>Me connecter</SubmitButton>
      <p className="text-center text-sm text-muted">
        Vous êtes professionnel et n&apos;avez pas encore de compte ?{" "}
        <Link href={requestHref} className="font-semibold text-brand">
          Demander un compte pro
        </Link>
      </p>
    </form>
  );
}
