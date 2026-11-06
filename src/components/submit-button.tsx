"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/** Bouton d'envoi d'un formulaire à Server Action : se désactive pendant l'envoi. */
export function SubmitButton({
  children,
  className,
  formAction,
  disabled = false,
}: {
  children: ReactNode;
  className: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  /** Bloque aussi le bouton hors envoi (ex. : photos encore en cours d'envoi). */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} formAction={formAction} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
