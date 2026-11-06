"use client";

import { useActionState, useState } from "react";
import { ExternalLink, MapPin, Wallet } from "lucide-react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { SubmitButton } from "@/components/submit-button";
import { formatAriary } from "@/lib/format";
import { messages } from "@/lib/i18n";
import type { ManagedOffer } from "@/lib/managed";
import { MAX_PASS_DAYS, passDaysDue } from "@/lib/subscription";
import { CATEGORIES, type CategoryKey } from "@/lib/types";
import { AdminOfferFields, type AdminOfferDefaults } from "../admin/offres/admin-offer-fields";
import { saveOffer, type FormState } from "./actions";
import { PhotoPicker } from "./photo-picker";
import { TicketFields, type TicketRow } from "./ticket-fields";

/** Catégories où l'on propose une billetterie à plusieurs tarifs (concerts, soirées, excursions…). */
const TICKET_CATEGORIES: CategoryKey[] = ["sorties", "activites"];

/** Photos à afficher : saisie renvoyée après une erreur, sinon photos enregistrées (couverture en premier). */
function initialPhotos(echoed: string | undefined, offer: ManagedOffer | null): string[] {
  if (echoed) {
    try {
      return JSON.parse(echoed) as string[];
    } catch {
      // saisie illisible : on repart des photos enregistrées
    }
  }
  return offer ? [offer.imageUrl, ...offer.imageUrls] : [];
}

/** Lignes de billetterie à afficher : saisie renvoyée après une erreur, sinon tarifs enregistrés. */
function initialTickets(echoed: string | undefined, offer: ManagedOffer | null): TicketRow[] {
  if (echoed) {
    try {
      return JSON.parse(echoed) as TicketRow[];
    } catch {
      // saisie illisible : on repart des tarifs enregistrés
    }
  }
  return (offer?.tickets ?? []).map((tier) => ({
    label: tier.label,
    presale: tier.presale?.toString() ?? "",
    door: tier.door?.toString() ?? "",
  }));
}

type Props = {
  offer: ManagedOffer | null;
  minDate: string;
  /** Action d'enregistrement : celle du professionnel par défaut, celle de l'admin sur ses propres pages. */
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Présent uniquement sur les pages d'administration : ajoute le choix de l'établissement et du statut. */
  admin?: { businesses: { id: string; name: string }[]; defaults: AdminOfferDefaults };
  /** Pro sans abonnement actif : il paiera les jours de visibilité de l'offre, estimés pendant la saisie. */
  dayPass?: { dayPrice: number; today: string };
};

const T = messages({
  fr: {
    title: "Titre de l'offre",
    category: "Catégorie",
    choose: "Choisir…",
    description: "Description",
    priceOriginal: "Prix normal (Ar)",
    optional: "Facultatif.",
    priceOffer: "Prix de l'offre (Ar)",
    pricing: "Prix",
    single: "Prix unique",
    tickets: "Plusieurs tarifs (billets)",
    ticketsHint: "Billet normal, VIP, prévente et sur place…",
    conditions: "Conditions",
    conditionsHint: "Nombre de personnes, jours, horaires, ce qui n'est pas inclus…",
    location: "Lieu / quartier",
    map: "Localisation Google Maps",
    recommended: "Recommandé",
    mapPlaceholder: "https://maps.app.goo.gl/…  ou  -15.7167, 46.3167",
    mapHelp1:
      "Facultatif. Avec la localisation, la fiche de l'offre affiche un bouton « Voir la localisation » qui ouvre le plan : vos clients vous trouvent sans avoir à appeler. Dans Google Maps, touchez votre établissement, puis ",
    mapHelp2: "Partager → Copier le lien",
    mapHelp3: " et collez-le ici. Vous pouvez aussi saisir des coordonnées GPS.",
    openMaps: "Ouvrir Google Maps",
    validUntil: "Dernier jour de validité",
    tooLong: `Sans abonnement, la visibilité se paie pour ${MAX_PASS_DAYS} jours au plus : choisissez une date plus proche ou abonnez-vous.`,
    visibility: "Visibilité :",
    days: (n: number) => `${n} jour${n > 1 ? "s" : ""}`,
    payNext: ", à payer par Mobile Money à l'étape suivante.",
    verifyNote:
      "Avant la mise en ligne, nous vous appelons pour confirmer le prix et les conditions : c'est ce qui donne le badge « Offre vérifiée ».",
    toPayment: "Continuer vers le paiement",
    save: "Enregistrer les modifications",
    create: "Créer l'offre",
    send: "Envoyer pour validation",
  },
  en: {
    title: "Deal title",
    category: "Category",
    choose: "Choose…",
    description: "Description",
    priceOriginal: "Usual price (Ar)",
    optional: "Optional.",
    priceOffer: "Deal price (Ar)",
    pricing: "Price",
    single: "Single price",
    tickets: "Several prices (tickets)",
    ticketsHint: "Standard, VIP, presale and at the door…",
    conditions: "Conditions",
    conditionsHint: "Number of people, days, opening hours, what isn't included…",
    location: "Place / neighbourhood",
    map: "Google Maps location",
    recommended: "Recommended",
    mapPlaceholder: "https://maps.app.goo.gl/…  or  -15.7167, 46.3167",
    mapHelp1:
      "Optional. With the location, the deal page shows a \"See the location\" button that opens the map, so customers find you without calling. In Google Maps, tap your business, then ",
    mapHelp2: "Share → Copy link",
    mapHelp3: " and paste it here. You can also enter GPS coordinates.",
    openMaps: "Open Google Maps",
    validUntil: "Last valid day",
    tooLong: `Without a subscription, visibility can be paid for ${MAX_PASS_DAYS} days at most: choose an earlier date or subscribe.`,
    visibility: "Visibility:",
    days: (n: number) => `${n} day${n > 1 ? "s" : ""}`,
    payNext: ", to pay by Mobile Money in the next step.",
    verifyNote:
      "Before the deal goes live, we call you to confirm the price and conditions: that's what earns the \"Verified deal\" badge.",
    toPayment: "Continue to payment",
    save: "Save changes",
    create: "Create the deal",
    send: "Send for review",
  },
});

export function OfferForm({ offer, minDate, action: saveAction = saveOffer, admin, dayPass }: Props) {
  const [state, action] = useActionState<FormState, FormData>(saveAction, null);
  const locale = useLocale();
  const t = T[locale];
  const saved: Record<string, string> = {
    title: offer?.title ?? "",
    category: offer?.category ?? "",
    description: offer?.description ?? "",
    priceOriginal: offer?.priceOriginal?.toString() ?? "",
    priceOffer: offer?.priceOffer.toString() ?? "",
    conditions: offer?.conditions ?? "",
    location: offer?.location ?? "Mahajanga, ",
    mapUrl: offer?.mapUrl ?? "",
    validUntil: offer?.validUntil ?? "",
    presaleUntil: offer?.presaleUntil ?? "",
  };
  const v = (name: string) => state?.values?.[name] ?? saved[name];
  const [validUntil, setValidUntil] = useState(v("validUntil"));
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(v("category"));
  const [pricing, setPricing] = useState(state?.values?.pricing || (offer?.tickets ? "tickets" : "single"));
  // Une offre qui a déjà une billetterie la garde, même si sa catégorie ne la propose pas d'habitude.
  const ticketsAllowed = TICKET_CATEGORIES.some((c) => c === category) || Boolean(offer?.tickets);
  const withTickets = ticketsAllowed && pricing === "tickets";
  const daysDue =
    dayPass && validUntil ? passDaysDue({ validUntil, passUntil: offer?.passUntil ?? null }, dayPass.today) : 0;

  return (
    <form action={action} className="space-y-4">
      {offer && <input type="hidden" name="id" value={offer.id} />}

      {admin && <AdminOfferFields businesses={admin.businesses} defaults={admin.defaults} values={state?.values} />}

      <Field label={t.title}>
        <input name="title" required minLength={3} maxLength={90} defaultValue={v("title")} className={inputClass} />
      </Field>

      <Field label={t.category}>
        <select
          name="category"
          required
          defaultValue={v("category")}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            {t.choose}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label[locale]}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t.description}>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          defaultValue={v("description")}
          className={inputClass}
        />
      </Field>

      {ticketsAllowed && (
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold">{t.pricing}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["single", "tickets"] as const).map((mode) => (
              <label
                key={mode}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm ${
                  pricing === mode ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="pricing"
                  value={mode}
                  checked={pricing === mode}
                  onChange={() => setPricing(mode)}
                  className="sr-only"
                />
                <span className="block font-semibold">{mode === "single" ? t.single : t.tickets}</span>
                {mode === "tickets" && <span className="block text-xs text-muted">{t.ticketsHint}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {withTickets ? (
        <TicketFields
          initial={initialTickets(state?.values?.tickets, offer)}
          presaleUntil={v("presaleUntil")}
          minDate={minDate}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.priceOriginal} hint={t.optional}>
            <input
              name="priceOriginal"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              defaultValue={v("priceOriginal")}
              className={inputClass}
            />
          </Field>
          <Field label={t.priceOffer}>
            <input
              name="priceOffer"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              required
              defaultValue={v("priceOffer")}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <Field label={t.conditions} hint={t.conditionsHint}>
        <textarea name="conditions" maxLength={500} rows={3} defaultValue={v("conditions")} className={inputClass} />
      </Field>

      <Field label={t.location}>
        <input name="location" required maxLength={120} defaultValue={v("location")} className={inputClass} />
      </Field>

      {/* Facultatif, mais mis en avant : c'est ce qui permet au client de trouver l'endroit sans appeler. */}
      <div className="space-y-2 rounded-2xl border border-sea/30 bg-sea/5 p-3.5">
        <label htmlFor="mapUrl" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-sea" aria-hidden />
          {t.map}
          <span className="rounded-full bg-sea px-2 py-0.5 text-[11px] font-bold text-white">{t.recommended}</span>
        </label>
        <input
          id="mapUrl"
          name="mapUrl"
          maxLength={500}
          inputMode="url"
          placeholder={t.mapPlaceholder}
          defaultValue={v("mapUrl")}
          className={inputClass}
        />
        <p className="text-xs text-muted">
          {t.mapHelp1}
          <strong className="text-ink">{t.mapHelp2}</strong>
          {t.mapHelp3}
        </p>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Mahajanga"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-sea"
        >
          {t.openMaps}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <Field label={t.validUntil}>
        <input
          name="validUntil"
          type="date"
          required
          min={minDate}
          defaultValue={v("validUntil")}
          onChange={(e) => setValidUntil(e.target.value)}
          className={inputClass}
        />
      </Field>

      {dayPass && daysDue > 0 && (
        <p
          className={`flex gap-2 rounded-xl px-3.5 py-2.5 text-sm ${
            daysDue > MAX_PASS_DAYS ? "bg-amber-50 text-amber-900" : "bg-brand-soft text-ink"
          }`}
        >
          <Wallet className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          {daysDue > MAX_PASS_DAYS ? (
            <span>{t.tooLong}</span>
          ) : (
            <span>
              {t.visibility} <strong>{t.days(daysDue)}</strong> × {formatAriary(dayPass.dayPrice, locale)} ={" "}
              <strong>{formatAriary(daysDue * dayPass.dayPrice, locale)}</strong>
              {t.payNext}
            </span>
          )}
        </p>
      )}

      <PhotoPicker initial={initialPhotos(state?.values?.photos, offer)} onBusyChange={setUploading} />

      {!admin && <p className="rounded-xl bg-surface px-3.5 py-2.5 text-xs text-muted">{t.verifyNote}</p>}

      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass} disabled={uploading}>
        {dayPass && daysDue > 0 ? t.toPayment : offer ? t.save : admin ? t.create : t.send}
      </SubmitButton>
    </form>
  );
}
