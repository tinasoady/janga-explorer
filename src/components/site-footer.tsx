import Link from "next/link";

/** Pied de page de tablette et d'ordinateur (sur téléphone, la barre du bas occupe cet espace). */
export function SiteFooter() {
  return (
    <footer className="hidden border-t border-line bg-surface md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-8 py-6 text-sm text-muted lg:px-12">
        <p>
          <span className="font-bold text-ink">Janga Explorer</span> · Les bons plans de Mahajanga, au bon moment.
        </p>
        <nav aria-label="Pied de page" className="flex gap-5 font-semibold">
          <Link href="/bons-plans" className="hover:text-ink">
            Bons plans
          </Link>
          <Link href="/pro" className="hover:text-ink">
            Espace pro
          </Link>
          <Link href="/profil" className="hover:text-ink">
            Profil
          </Link>
        </nav>
      </div>
    </footer>
  );
}
