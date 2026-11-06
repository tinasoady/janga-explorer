"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/form-ui";

export type AdminOfferDefaults = { businessId: string; online: boolean; verified: boolean; featured: boolean };

/**
 * Champs réservés à l'admin dans le formulaire d'offre : à quel établissement l'offre appartient (existant ou
 * nouveau, sans compte) et son statut de publication. `values` est la saisie renvoyée après une erreur.
 */
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
  const v = (name: string) => values?.[name] ?? "";
  const checked = (name: keyof Omit<AdminOfferDefaults, "businessId">) =>
    values ? v(name) === "on" : defaults[name];

  return (
    <fieldset className="space-y-4 rounded-2xl border border-brand/30 bg-brand-soft/40 p-4">
      <legend className="px-2 text-sm font-bold text-brand">Administration</legend>

      <Field label="Établissement">
        <select
          name="businessId"
          required
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Choisir…
          </option>
          <option value="new">+ Nouvel établissement</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>

      {choice === "new" && (
        <div className="space-y-4 rounded-xl bg-white p-4">
          <Field label="Nom du nouvel établissement">
            <input name="name" required maxLength={80} defaultValue={v("name")} className={inputClass} />
          </Field>
          <Field label="Type" hint="Ex : Restaurant, Hôtel, Agence d'excursions.">
            <input name="kind" maxLength={60} defaultValue={v("kind")} placeholder="Restaurant" className={inputClass} />
          </Field>
          <Field label="Numéro WhatsApp" hint="Ex : 034 12 345 67.">
            <input name="whatsapp" type="tel" inputMode="tel" defaultValue={v("whatsapp")} className={inputClass} />
          </Field>
          <Field label="Téléphone (facultatif)">
            <input name="phone" type="tel" inputMode="tel" maxLength={30} defaultValue={v("phone")} className={inputClass} />
          </Field>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <input name="online" type="checkbox" defaultChecked={checked("online")} className="mt-0.5 size-4 accent-brand" />
          <span>
            <span className="font-semibold">Mettre en ligne</span>
            <span className="block text-muted">Sinon l&apos;offre reste en attente de validation.</span>
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
            <span className="font-semibold">Badge « Offre vérifiée »</span>
            <span className="block text-muted">Prix et conditions confirmés avec l&apos;établissement.</span>
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
            <span className="font-semibold">Mettre à la une</span>
            <span className="block text-muted">Affichée dans « Les bons plans du moment » sur l&apos;accueil.</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
