"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { messages } from "@/lib/i18n";

export type AdminOfferDefaults = { businessId: string; online: boolean; verified: boolean; featured: boolean };

/**
 * Champs réservés à l'admin dans le formulaire d'offre : à quel établissement l'offre appartient (existant ou
 * nouveau, sans compte) et son statut de publication. `values` est la saisie renvoyée après une erreur.
 */
const T = messages({
  fr: {
    legend: "Administration",
    business: "Établissement",
    choose: "Choisir…",
    newBusiness: "+ Nouvel établissement",
    newName: "Nom du nouvel établissement",
    kind: "Type",
    kindHint: "Ex : Restaurant, Hôtel, Agence d'excursions.",
    whatsapp: "Numéro WhatsApp",
    whatsappHint: "Ex : 034 12 345 67.",
    phone: "Téléphone (facultatif)",
    online: "Mettre en ligne",
    onlineHint: "Sinon l'offre reste en attente de validation.",
    verified: "Badge « Offre vérifiée »",
    verifiedHint: "Prix et conditions confirmés avec l'établissement.",
    featured: "Mettre à la une",
    featuredHint: "Affichée dans « Les bons plans du moment » sur l'accueil.",
  },
  en: {
    legend: "Administration",
    business: "Business",
    choose: "Choose…",
    newBusiness: "+ New business",
    newName: "Name of the new business",
    kind: "Type",
    kindHint: "E.g. Restaurant, Hotel, Excursion agency.",
    whatsapp: "WhatsApp number",
    whatsappHint: "E.g. 034 12 345 67.",
    phone: "Phone (optional)",
    online: "Put online",
    onlineHint: "Otherwise the deal stays awaiting review.",
    verified: "\"Verified deal\" badge",
    verifiedHint: "Price and conditions confirmed with the business.",
    featured: "Feature",
    featuredHint: "Shown in \"Deals of the moment\" on the home page.",
  },
});

export function AdminOfferFields({
  businesses,
  defaults,
  values,
}: {
  businesses: { id: string; name: string }[];
  defaults: AdminOfferDefaults;
  values?: Record<string, string>;
}) {
  const [choice, setChoice] = useState(values?.businessId ?? defaults.businessId);
  const t = T[useLocale()];
  const v = (name: string) => values?.[name] ?? "";
  const checked = (name: keyof Omit<AdminOfferDefaults, "businessId">) =>
    values ? v(name) === "on" : defaults[name];

  return (
    <fieldset className="space-y-4 rounded-2xl border border-brand/30 bg-brand-soft/40 p-4">
      <legend className="px-2 text-sm font-bold text-brand">{t.legend}</legend>

      <Field label={t.business}>
        <select
          name="businessId"
          required
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            {t.choose}
          </option>
          <option value="new">{t.newBusiness}</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>

      {choice === "new" && (
        <div className="space-y-4 rounded-xl bg-white p-4">
          <Field label={t.newName}>
            <input name="name" required maxLength={80} defaultValue={v("name")} className={inputClass} />
          </Field>
          <Field label={t.kind} hint={t.kindHint}>
            <input name="kind" maxLength={60} defaultValue={v("kind")} placeholder="Restaurant" className={inputClass} />
          </Field>
          <Field label={t.whatsapp} hint={t.whatsappHint}>
            <input name="whatsapp" type="tel" inputMode="tel" defaultValue={v("whatsapp")} className={inputClass} />
          </Field>
          <Field label={t.phone}>
            <input name="phone" type="tel" inputMode="tel" maxLength={30} defaultValue={v("phone")} className={inputClass} />
          </Field>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <input name="online" type="checkbox" defaultChecked={checked("online")} className="mt-0.5 size-4 accent-brand" />
          <span>
            <span className="font-semibold">{t.online}</span>
            <span className="block text-muted">{t.onlineHint}</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            name="verified"
            type="checkbox"
            defaultChecked={checked("verified")}
            className="mt-0.5 size-4 accent-brand"
          />
          <span>
            <span className="font-semibold">{t.verified}</span>
            <span className="block text-muted">{t.verifiedHint}</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={checked("featured")}
            className="mt-0.5 size-4 accent-brand"
          />
          <span>
            <span className="font-semibold">{t.featured}</span>
            <span className="block text-muted">{t.featuredHint}</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
