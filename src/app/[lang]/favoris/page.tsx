import type { Metadata } from "next";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { FavoritesList } from "./favorites-list";

const T = messages({
  fr: { meta: "Favoris", title: "Mes favoris", text: "Enregistrés sur cet appareil." },
  en: { meta: "Saved deals", title: "My saved deals", text: "Saved on this device." },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: T[await getLocale()].meta };
}

export default async function FavorisPage() {
  const t = T[await getLocale()];
  return (
    <>
      <header className="border-b border-line px-4 py-4 md:border-0 md:pt-8">
        <h1 className="text-xl font-extrabold md:text-3xl">{t.title}</h1>
        <p className="text-sm text-muted">{t.text}</p>
      </header>
      <FavoritesList />
    </>
  );
}
