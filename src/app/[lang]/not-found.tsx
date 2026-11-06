import Link from "next/link";
import { SearchX } from "lucide-react";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const T = messages({
  fr: {
    title: "Cette page n'existe pas (ou plus)",
    text: "L'offre est peut-être terminée. D'autres bons plans vous attendent !",
    cta: "Voir les bons plans",
  },
  en: {
    title: "This page doesn't exist (anymore)",
    text: "The deal may have ended. Plenty of others are waiting for you!",
    cta: "See the deals",
  },
});

export default async function NotFound() {
  const t = T[await getLocale()];
  return (
    <div className="flex flex-col items-center px-6 pt-24 text-center">
      <SearchX className="size-12 text-muted" aria-hidden />
      <h1 className="mt-4 text-xl font-extrabold">{t.title}</h1>
      <p className="mt-2 text-sm text-muted">{t.text}</p>
      <Link href="/bons-plans" className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
        {t.cta}
      </Link>
    </div>
  );
}
