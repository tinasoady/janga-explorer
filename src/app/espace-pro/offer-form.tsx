"use client";

import Image from "next/image";
import { useActionState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Field, FormMessage, inputClass, primaryButtonClass } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import type { ManagedOffer } from "@/lib/managed";
import { CATEGORIES } from "@/lib/types";
import { AdminOfferFields, type AdminOfferDefaults } from "../admin/offres/admin-offer-fields";
import { saveOffer, type FormState } from "./actions";

type Props = {
  offer: ManagedOffer | null;
  minDate: string;
  /** Action d'enregistrement : celle du professionnel par défaut, celle de l'admin sur ses propres pages. */
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Présent uniquement sur les pages d'administration : ajoute le choix de l'établissement et du statut. */
  admin?: { businesses: { id: string; name: string }[]; defaults: AdminOfferDefaults };
};

export function OfferForm({ offer, minDate, action: saveAction = saveOffer, admin }: Props) {
  const [state, action] = useActionState<FormState, FormData>(saveAction, null);
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
  };
  const v = (name: string) => state?.values?.[name] ?? saved[name];

  return (
    <form action={action} className="space-y-4">
      {offer && <input type="hidden" name="id" value={offer.id} />}

      {admin && <AdminOfferFields businesses={admin.businesses} defaults={admin.defaults} values={state?.values} />}

      <Field label="Titre de l'offre">
        <input name="title" required minLength={3} maxLength={90} defaultValue={v("title")} className={inputClass} />
      </Field>

      <Field label="Catégorie">
        <select name="category" required defaultValue={v("category")} className={inputClass}>
          <option value="" disabled>
            Choisir…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description">
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix normal (Ar)" hint="Facultatif.">
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
        <Field label="Prix de l'offre (Ar)">
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

      <Field label="Conditions" hint="Nombre de personnes, jours, horaires, ce qui n'est pas inclus…">
        <textarea name="conditions" maxLength={500} rows={3} defaultValue={v("conditions")} className={inputClass} />
      </Field>

      <Field label="Lieu / quartier">
        <input name="location" required maxLength={120} defaultValue={v("location")} className={inputClass} />
      </Field>

      {/* Facultatif, mais mis en avant : c'est ce qui permet au client de trouver l'endroit sans appeler. */}
      <div className="space-y-2 rounded-2xl border border-sea/30 bg-sea/5 p-3.5">
        <label htmlFor="mapUrl" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-sea" aria-hidden />
          Localisation Google Maps
          <span className="rounded-full bg-sea px-2 py-0.5 text-[11px] font-bold text-white">Recommandé</span>
        </label>
        <input
          id="mapUrl"
          name="mapUrl"
          maxLength={500}
          inputMode="url"
          placeholder="https://maps.app.goo.gl/…  ou  -15.7167, 46.3167"
          defaultValue={v("mapUrl")}
          className={inputClass}
        />
        <p className="text-xs text-muted">
          Facultatif. Avec la localisation, la fiche de l&apos;offre affiche un bouton « Voir la localisation » qui
          ouvre le plan : vos clients vous trouvent sans avoir à appeler. Dans Google Maps, touchez votre
          établissement, puis <strong className="text-ink">Partager → Copier le lien</strong> et collez-le ici. Vous
          pouvez aussi saisir des coordonnées GPS.
        </p>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Mahajanga"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-sea"
        >
          Ouvrir Google Maps
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <Field label="Dernier jour de validité">
        <input name="validUntil" type="date" required min={minDate} defaultValue={v("validUntil")} className={inputClass} />
      </Field>

      <Field
        label="Photo"
        hint={offer ? "Laissez vide pour garder la photo actuelle. JPEG, PNG ou WebP, 5 Mo maximum." : "JPEG, PNG ou WebP, 5 Mo maximum."}
      >
        {offer && (
          <div className="relative mb-2 aspect-[4/3] w-40 overflow-hidden rounded-xl">
            <Image src={offer.imageUrl} alt="Photo actuelle" fill sizes="160px" className="object-cover" />
          </div>
        )}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={!offer}
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand"
        />
      </Field>

      {!admin && (
        <p className="rounded-xl bg-surface px-3.5 py-2.5 text-xs text-muted">
          Avant la mise en ligne, nous vous appelons pour confirmer le prix et les conditions : c&apos;est ce qui donne
          le badge « Offre vérifiée ».
        </p>
      )}

      <FormMessage error={state?.error} />
      <SubmitButton className={primaryButtonClass}>
        {offer ? "Enregistrer les modifications" : admin ? "Créer l'offre" : "Envoyer pour validation"}
      </SubmitButton>
    </form>
  );
}
