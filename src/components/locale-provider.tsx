"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Transmet la langue de la page aux composants client (posé par la mise en page racine). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
