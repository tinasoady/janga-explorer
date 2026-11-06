import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, FileText, Info, MapPin, Phone, ShieldCheck, Star, Ticket } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { CategoryIcon } from "@/components/category";
import { FavoriteButton } from "@/components/favorite-button";
import { WhatsAppIcon } from "@/components/contact-links";
import { DiscountBadge, HighlightBadge, SampleTag } from "@/components/offer-card";
import { TrackedLink, TrackOfferView } from "@/components/offer-tracking";
import {
  formatAriary,
  formatLongDate,
  formatVerifiedAgo,
  mapsLink,
  whatsappLink,
} from "@/lib/format";
import { messages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { hasSeveralPrices, isPresaleOpen } from "@/lib/tickets";
import type { Offer } from "@/lib/types";
import { getActiveOffers, getOfferBySlug, getToday } from "@/lib/offers";

const T = messages({
  fr: {
    notFound: "Offre introuvable",
    reviews: (n: number) => `(${n} avis)`,
    save: (amount: string) => `Économisez ${amount}`,
    savePresale: (amount: string) => `${amount} d'économie en prévente`,
    from: "Dès",
    tickets: "Billets",
    ticketType: "Tarif",
    presale: "Prévente",
    door: "Sur place",
    price: "Prix",
    presaleUntil: (date: string) => `Prévente jusqu'au ${date} inclus.`,
    presaleOpen: "Prévente en cours : réservez auprès de l'établissement.",
    presaleClosed: (date: string) => `Prévente terminée le ${date} : prix sur place uniquement.`,
    notSold: "—",
    fromMessage: (price: string) => `à partir de ${price}`,
    validity: "Validité",
    validUntil: "Valable jusqu'au",
    conditions: "Conditions",
    conditionsLabel: "Conditions :",
    place: "Lieu",
    exactPlace: "Localisation précise fournie",
    whatsapp: "Contacter sur WhatsApp",
    map: "Voir la localisation",
    call: (phone: string) => `Appeler ${phone}`,
    lastCheck: (ago: string) => `Dernière vérification : ${ago}`,
    unverified:
      "Cette offre n'a pas encore été vérifiée par Janga Explorer. Confirmez le prix et les conditions avec l'établissement avant de vous déplacer.",
    message: (title: string, price: string) =>
      `Bonjour, j'ai vu votre offre « ${title} » à ${price} sur Janga Explorer. Est-elle toujours disponible ?`,
    sampleNotice:
      "Offre d'exemple : cet établissement et ses numéros sont fictifs. Ils montrent à quoi ressembleront les offres sur Janga Explorer.",
  },
  en: {
    notFound: "Deal not found",
    reviews: (n: number) => `(${n} review${n > 1 ? "s" : ""})`,
    save: (amount: string) => `Save ${amount}`,
    savePresale: (amount: string) => `Save ${amount} with presale`,
    from: "From",
    tickets: "Tickets",
    ticketType: "Ticket",
    presale: "Presale",
    door: "At the door",
    price: "Price",
    presaleUntil: (date: string) => `Presale until ${date} inclusive.`,
    presaleOpen: "Presale on now: book with the business.",
    presaleClosed: (date: string) => `Presale ended on ${date}: door prices only.`,
    notSold: "—",
    fromMessage: (price: string) => `from ${price}`,
    validity: "Validity",
    validUntil: "Valid until",
    conditions: "Conditions",
    conditionsLabel: "Conditions:",
    place: "Location",
    exactPlace: "Exact location provided",
    whatsapp: "Contact on WhatsApp",
    map: "See the location",
    call: (phone: string) => `Call ${phone}`,
    lastCheck: (ago: string) => `Last checked: ${ago}`,
    unverified:
      "Janga Explorer hasn't verified this deal yet. Check the price and conditions with the business before you go.",
    message: (title: string, price: string) =>
      `Hello, I saw your deal "${title}" at ${price} on Janga Explorer. Is it still available?`,
    sampleNotice:
      "Sample deal: this business and its phone numbers are fictitious. They show what deals will look like on Janga Explorer.",
  },
});

export async function generateStaticParams() {
  const offers = await getActiveOffers();
  const featured = offers.filter((o) => o.isFeatured).map((o) => ({ slug: o.slug }));
  // Cache Components exige au moins un paramètre ; le slug factice renvoie une 404.
  return featured.length > 0 ? featured : [{ slug: "__aucune-offre__" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/offres/[slug]">): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: T[locale].notFound };
  return {
    title: offer.title,
    description: `${offer.business.name} · ${formatAriary(offer.priceOffer, locale)} · ${offer.description.slice(0, 120)}`,
    openGraph: { images: [offer.imageUrl] },
  };
}

export default function OfferPage({ params }: PageProps<"/[lang]/offres/[slug]">) {
  return (
    <Suspense fallback={<OfferSkeleton />}>
      <OfferDetails params={params} />
    </Suspense>
  );
}

async function OfferDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [offer, today, locale] = await Promise.all([getOfferBySlug(slug), getToday(), getLocale()]);
  if (!offer) notFound();
  const t = T[locale];

  const savings = offer.priceOriginal ? offer.priceOriginal - offer.priceOffer : 0;
  const several = hasSeveralPrices(offer);
  const shownPrice = formatAriary(offer.priceOffer, locale);
  const message = t.message(offer.title, several ? t.fromMessage(shownPrice) : shownPrice);

  return (
    // Téléphone : photo pleine largeur puis détails. Tablette : colonne centrée. Ordinateur : photo à gauche (qui
    // reste visible au défilement) et détails à droite.
    <article className="md:mx-auto md:max-w-3xl md:pt-6 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-4 lg:pt-8">
      <TrackOfferView offerId={offer.id} />
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
            {offer.business.isSample && <SampleTag className="mt-0.5" />}
          </p>
          {offer.business.rating !== null && (
            <p className="flex items-center gap-1 text-sm">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-bold">{offer.business.rating.toLocaleString(locale === "en" ? "en-GB" : "fr-FR")}</span>
              <span className="text-muted">{t.reviews(offer.business.reviewCount)}</span>
            </p>
          )}
        </header>

        <div className="flex items-start justify-between gap-3">
          <div>
            {offer.priceOriginal && savings > 0 && (
              <p className="text-sm text-muted line-through">{formatAriary(offer.priceOriginal, locale)}</p>
            )}
            <p className="text-3xl font-extrabold text-brand">
              {several && <span className="mr-1.5 text-base font-semibold text-muted">{t.from}</span>}
              {shownPrice}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {savings > 0 && (
                <p className="rounded-full bg-verified px-3 py-1 text-xs font-bold text-white">
                  {(offer.tickets ? t.savePresale : t.save)(formatAriary(savings, locale))}
                </p>
              )}
              <HighlightBadge offer={offer} today={today} className="px-3 py-1 text-xs" />
            </div>
          </div>
          <DiscountBadge offer={offer} tone="soft" size="lg" />
        </div>

        {offer.tickets && <TicketTable offer={offer} today={today} locale={locale} />}

        <dl className="space-y-3 rounded-2xl bg-surface p-4 text-sm">
          <div className="flex gap-3">
            <dt className="sr-only">{t.validity}</dt>
            <CalendarDays className="size-5 shrink-0 text-muted" aria-hidden />
            <dd>
              {t.validUntil} <span className="font-semibold">{formatLongDate(offer.validUntil, locale)}</span>
            </dd>
          </div>
          {offer.conditions && (
            <div className="flex gap-3">
              <dt className="sr-only">{t.conditions}</dt>
              <FileText className="size-5 shrink-0 text-muted" aria-hidden />
              <dd>
                <span className="font-semibold">{t.conditionsLabel}</span> {offer.conditions}
              </dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="sr-only">{t.place}</dt>
            <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
            <dd>
              {offer.location}
              {offer.mapUrl && (
                <span className="mt-0.5 block text-xs font-semibold text-verified">{t.exactPlace}</span>
              )}
            </dd>
          </div>
        </dl>

        <p className="leading-relaxed text-ink/90">{offer.description}</p>

        {offer.business.isSample && (
          <p className="flex gap-2 rounded-xl bg-sun/15 p-3 text-xs text-ink">
            <Info className="size-4 shrink-0 text-sun" aria-hidden />
            {t.sampleNotice}
          </p>
        )}

        <div className="space-y-3">
          {offer.business.whatsapp && (
            <TrackedLink
              offerId={offer.id}
              event="whatsapp"
              href={whatsappLink(offer.business.whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-white shadow-md shadow-brand/30 transition active:scale-[0.98]"
            >
              <WhatsAppIcon />
              {t.whatsapp}
            </TrackedLink>
          )}
          <TrackedLink
            offerId={offer.id}
            event="map"
            href={mapsLink(offer)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-sea/40 bg-sea/5 py-3 font-semibold text-sea-dark transition active:scale-[0.98]"
          >
            <MapPin className="size-5" aria-hidden />
            {t.map}
          </TrackedLink>
          {offer.business.phone && (
            <TrackedLink
              offerId={offer.id}
              event="call"
              href={`tel:${offer.business.phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 rounded-full border border-line py-3 font-semibold"
            >
              <Phone className="size-5" aria-hidden />
              {t.call(offer.business.phone)}
            </TrackedLink>
          )}
        </div>

        {offer.isVerified && offer.verifiedAt ? (
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4 text-verified" aria-hidden />
            {t.lastCheck(formatVerifiedAgo(offer.verifiedAt, today, locale))}
          </p>
        ) : (
          <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <Info className="size-4 shrink-0" aria-hidden />
            {t.unverified}
          </p>
        )}
      </div>
    </article>
  );
}


/** Tarifs d'un événement : une ligne par billet, colonnes prévente et sur place (seulement celles qui servent). */
function TicketTable({ offer, today, locale }: { offer: Offer; today: string; locale: Locale }) {
  const t = T[locale];
  const tiers = offer.tickets ?? [];
  const open = isPresaleOpen(offer.presaleUntil, today);
  const hasPresale = tiers.some((tier) => tier.presale !== null);
  const hasDoor = tiers.some((tier) => tier.door !== null);
  const money = (amount: number | null) => (amount === null ? t.notSold : formatAriary(amount, locale));

  return (
    <section aria-labelledby="billets" className="overflow-hidden rounded-2xl border border-line">
      <h2 id="billets" className="flex items-center gap-2 px-4 pt-4 font-bold">
        <Ticket className="size-5 text-brand" aria-hidden />
        {t.tickets}
      </h2>
      {hasPresale && (
        <p className={`px-4 pt-1 text-xs ${open ? "font-semibold text-verified" : "text-muted"}`}>
          {!open && offer.presaleUntil
            ? t.presaleClosed(formatLongDate(offer.presaleUntil, locale))
            : offer.presaleUntil
              ? t.presaleUntil(formatLongDate(offer.presaleUntil, locale))
              : t.presaleOpen}
        </p>
      )}
      <table className="mt-3 w-full text-sm">
        <thead className="bg-surface text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-semibold">
              {t.ticketType}
            </th>
            {hasPresale && hasDoor ? (
              <>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  {t.presale}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  {t.door}
                </th>
              </>
            ) : (
              <th scope="col" className="px-4 py-2 text-right font-semibold">
                {hasPresale ? t.presale : t.price}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tiers.map((tier) => (
            <tr key={tier.label}>
              <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                {tier.label}
              </th>
              {hasPresale && (
                <td
                  className={`px-2 py-2.5 text-right tabular-nums ${
                    open ? "font-extrabold text-brand" : "text-muted line-through"
                  } ${hasDoor ? "" : "pr-4"}`}
                >
                  {money(tier.presale)}
                </td>
              )}
              {hasDoor && (
                <td className={`px-4 py-2.5 text-right tabular-nums ${open && hasPresale ? "" : "font-extrabold text-brand"}`}>
                  {money(tier.door)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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
