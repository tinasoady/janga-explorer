"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { addAdmin, type TeamState } from "./actions";

export function AddAdminForm() {
  const [state, action] = useActionState<TeamState, FormData>(addAdmin, null);
  const en = useLocale() === "en";

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line p-4">
      <Field
        label={en ? "Email of the new administrator" : "E-mail du nouvel administrateur"}
        hint={
          en
            ? "The person must already have an account on Janga Explorer."
            : "La personne doit déjà avoir créé un compte sur Janga Explorer."
        }
      >
        <input name="email" type="email" required autoComplete="off" className={inputClass} />
      </Field>
      <FormMessage error={state?.error} info={state?.info} />
      <SubmitButton className={primaryButtonClass}>
        <UserPlus className="size-4" aria-hidden />
        {en ? "Make administrator" : "Nommer administrateur"}
      </SubmitButton>
    </form>
  );
}
