"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/** Bouton d'envoi d'un formulaire à Server Action : se désactive pendant l'envoi. */
export function SubmitButton({
  children,
  className,
  formAction,
}: {
  children: ReactNode;
  className: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} formAction={formAction} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
