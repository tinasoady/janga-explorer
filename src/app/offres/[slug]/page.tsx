import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, FileText, Info, MapPin, Phone, ShieldCheck, Star } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { CategoryIcon } from "@/components/category";
import { FavoriteButton } from "@/components/favorite-button";
import { WhatsAppIcon } from "@/components/contact-links";
import { DiscountBadge } from "@/components/offer-card";
import {
  formatAriary,
  formatLongDate,
  formatVerifiedAgo,
  mapsLink,
  whatsappLink,
} from "@/lib/format";
import { getActiveOffers, getOfferBySlug, getToday } from "@/lib/offers";

export async function generateStaticParams() {
  const offers = await getActiveOffers();
  const featured = offers.filter((o) => o.isFeatured).map((o) => ({ slug: o.slug }));
  // Cache Components exige au moins un paramètre ; le slug factice renvoie une 404.
  return featured.length > 0 ? featured : [{ slug: "__aucune-offre__" }];
}

export async function generateMetadata({ params }: PageProps<"/offres/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: "Offre introuvable" };
  return {
    title: offer.title,
    description: `${offer.business.name} · ${formatAriary(offer.priceOffer)} · ${offer.description.slice(0, 120)}`,
    openGraph: { images: [offer.imageUrl] },
  };
}

export default function OfferPage({ params }: PageProps<"/offres/[slug]">) {
  return (
    <Suspense fallback={<OfferSkeleton />}>
      <OfferDetails params={params} />
    </Suspense>
  );
}

async function OfferDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [offer, today] = await Promise.all([getOfferBySlug(slug), getToday()]);
  if (!offer) notFound();

  const savings = offer.priceOriginal ? offer.priceOriginal - offer.priceOffer : 0;
  const message = `Bonjour, j'ai vu votre offre « ${offer.title} » à ${formatAriary(
    offer.priceOffer,
  )} sur Janga Explorer. Est-elle toujours disponible ?`;

  return (
    // Téléphone : photo pleine largeur puis détails. Tablette : colonne centrée. Ordinateur : photo à gauche (qui
    // reste visible au défilement) et détails à droite.
    <article className="md:mx-auto md:max-w-3xl md:pt-6 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-4 lg:pt-8">
      <div className="relative aspect-[4/3] w-full overflow-hidden md:rounded-3xl lg:sticky lg:top-24">
        <Image
          src={offer.imageUrl}
          alt={offer.title}
          fill
          priority
          sizes="(min-width: 1024px) 540px, (min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
        <BackButton fallback="/bons-plans" className="absolute top-3 left-3 bg-white/90 text-ink backdrop-blur" />
        <FavoriteButton slug={offer.slug} className="absolute top-3 right-3 size-10 shadow-sm" />
      </div>

      <div className="relative -mt-6 space-y-5 rounded-t-3xl bg-white px-5 pt-6 pb-6 md:mt-0 md:rounded-none md:px-1 lg:px-0 lg:pt-0">
        <header className="space-y-2">
          <h1 className="text-2xl leading-tight font-extrabold">{offer.title}</h1>
          <p className="flex items-start gap-1.5 text-sm text-ink/80">
            <CategoryIcon category={offer.category} className="mt-0.5 size-4" />
            <span>
              {offer.business.kind} · <span className="font-semibold text-ink">{offer.business.name}</span>
            </span>
          </p>
          {offer.business.rating !== null && (
            <p className="flex items-center gap-1 text-sm">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-bold">{offer.business.rating.toLocaleString("fr-FR")}</span>
              <span className="text-muted">({offer.business.reviewCount} avis)</span>
            </p>
          )}
        </header>

        <div className="flex items-start justify-between gap-3">
          <div>
            {offer.priceOriginal && savings > 0 && (
              <p className="text-sm text-muted line-through">{formatAriary(offer.priceOriginal)}</p>
            )}
            <p className="text-3xl font-extrabold text-brand">{formatAriary(offer.priceOffer)}</p>
            {savings > 0 && (
              <p className="mt-2 inline-block rounded-full bg-verified px-3 py-1 text-xs font-bold text-white">
                Économisez {formatAriary(savings)}
              </p>
            )}
          </div>
          <DiscountBadge offer={offer} tone="soft" size="lg" />
        </div>

        <dl className="space-y-3 rounded-2xl bg-surface p-4 text-sm">
          <div className="flex gap-3">
            <dt className="sr-only">Validité</dt>
            <CalendarDays className="size-5 shrink-0 text-muted" aria-hidden />
            <dd>
              Valable jusqu&apos;au <span className="font-semibold">{formatLongDate(offer.validUntil)}</span>
            </dd>
          </div>
          {offer.conditions && (
            <div className="flex gap-3">
              <dt className="sr-only">Conditions</dt>
              <FileText className="size-5 shrink-0 text-muted" aria-hidden />
              <dd>
                <span className="font-semibold">Conditions :</span> {offer.conditions}
              </dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="sr-only">Lieu</dt>
            <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
            <dd>
              {offer.location}
              {offer.mapUrl && (
                <span className="mt-0.5 block text-xs font-semibold text-verified">Localisation précise fournie</span>
              )}
            </dd>
          </div>
        </dl>

        <p className="leading-relaxed text-ink/90">{offer.description}</p>

        <div className="space-y-3">
          {offer.business.whatsapp && (
            <a
              href={whatsappLink(offer.business.whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-white shadow-md shadow-brand/30 transition active:scale-[0.98]"
            >
              <WhatsAppIcon />
              Contacter sur WhatsApp
            </a>
          )}
          <a
            href={mapsLink(offer)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-sea/40 bg-sea/5 py-3 font-semibold text-sea-dark transition active:scale-[0.98]"
          >
            <MapPin className="size-5" aria-hidden />
            Voir la localisation
          </a>
          {offer.business.phone && (
            <a
              href={`tel:${offer.business.phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 rounded-full border border-line py-3 font-semibold"
            >
              <Phone className="size-5" aria-hidden />
              Appeler {offer.business.phone}
            </a>
          )}
        </div>

        {offer.isVerified && offer.verifiedAt ? (
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4 text-verified" aria-hidden />
            Dernière vérification : {formatVerifiedAgo(offer.verifiedAt, today)}
          </p>
        ) : (
          <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <Info className="size-4 shrink-0" aria-hidden />
            Cette offre n&apos;a pas encore été vérifiée par Janga Explorer. Confirmez le prix et les conditions
            avec l&apos;établissement avant de vous déplacer.
          </p>
        )}
      </div>
    </article>
  );
}


function OfferSkeleton() {
  return (
    <div
      className="animate-pulse md:mx-auto md:max-w-3xl md:pt-6 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-10 lg:px-4 lg:pt-8"
      aria-hidden
    >
      <div className="aspect-[4/3] w-full bg-surface md:rounded-3xl" />
      <div className="space-y-4 px-5 pt-6 md:px-1 lg:pt-0">
        <div className="h-7 w-3/4 rounded bg-surface" />
        <div className="h-4 w-1/2 rounded bg-surface" />
        <div className="h-10 w-1/3 rounded bg-surface" />
        <div className="h-28 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
