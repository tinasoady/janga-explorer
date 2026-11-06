import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-6 pt-24 text-center">
      <SearchX className="size-12 text-muted" aria-hidden />
      <h1 className="mt-4 text-xl font-extrabold">Cette page n&apos;existe pas (ou plus)</h1>
      <p className="mt-2 text-sm text-muted">L&apos;offre est peut-être terminée. D&apos;autres bons plans vous attendent !</p>
      <Link href="/bons-plans" className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
        Voir les bons plans
      </Link>
    </div>
  );
}
