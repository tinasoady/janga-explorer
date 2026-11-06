import type { Metadata } from "next";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = { title: "Favoris" };

export default function FavorisPage() {
  return (
    <>
      <header className="border-b border-line px-4 py-4 md:border-0 md:pt-8">
        <h1 className="text-xl font-extrabold md:text-3xl">Mes favoris</h1>
        <p className="text-sm text-muted">Enregistrés sur cet appareil.</p>
      </header>
      <FavoritesList />
    </>
  );
}
