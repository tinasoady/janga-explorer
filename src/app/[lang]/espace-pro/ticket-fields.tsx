"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, inputClass } from "@/components/form-ui";
import { useLocale } from "@/components/locale-provider";
import { messages } from "@/lib/i18n";
import { MAX_TICKET_TIERS } from "@/lib/tickets";

/** Ligne saisie : du texte, converti et vérifié par le serveur (parseOffer). */
export type TicketRow = { label: string; presale: string; door: string };

const T = messages({
  fr: {
    legend: "Billets",
    hint: "Un tarif par ligne. Remplissez la prévente, le prix sur place, ou les deux.",
    label: "Tarif",
    labelPlaceholders: ["Billet normal", "VIP", "Étudiant", "Table 4 personnes", "Enfant", "Pass 2 jours"],
    presale: "Prévente (Ar)",
    door: "Sur place (Ar)",
    remove: (label: string) => `Retirer le tarif ${label}`,
    add: "Ajouter un tarif",
    presaleUntil: "Fin de la prévente",
    presaleUntilHint: "Facultatif. Après cette date, seuls les prix sur place sont affichés.",
  },
  en: {
    legend: "Tickets",
    hint: "One ticket type per line. Fill in the presale price, the door price, or both.",
    label: "Ticket type",
    labelPlaceholders: ["Standard", "VIP", "Student", "Table for 4", "Child", "2-day pass"],
    presale: "Presale (Ar)",
    door: "At the door (Ar)",
    remove: (label: string) => `Remove ticket type ${label}`,
    add: "Add a ticket type",
    presaleUntil: "Presale ends",
    presaleUntilHint: "Optional. After this date, only door prices are shown.",
  },
});

const EMPTY: TicketRow = { label: "", presale: "", door: "" };

export function TicketFields({
  initial,
  presaleUntil,
  minDate,
}: {
  initial: TicketRow[];
  presaleUntil: string;
  minDate: string;
}) {
  const t = T[useLocale()];
  const [rows, setRows] = useState<TicketRow[]>(initial.length ? initial : [EMPTY, EMPTY]);
  // Chaque ligne garde sa clé quand on en retire une autre : les champs non contrôlés restent à leur place.
  const [keys, setKeys] = useState(() => rows.map((_, i) => i));
  const [nextKey, setNextKey] = useState(rows.length);

  const add = () => {
    setRows([...rows, EMPTY]);
    setKeys([...keys, nextKey]);
    setNextKey(nextKey + 1);
  };
  const remove = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
    setKeys(keys.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="space-y-3 rounded-2xl border border-line p-3.5">
      <legend className="px-1 text-sm font-semibold">{t.legend}</legend>
      <p className="text-xs text-muted">{t.hint}</p>

      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={keys[i]} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-surface p-2.5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
            <label className="col-span-1 block space-y-1">
              <span className="text-xs font-semibold">{t.label}</span>
              <input
                name="ticketLabel"
                maxLength={40}
                defaultValue={row.label}
                placeholder={t.labelPlaceholders[i % t.labelPlaceholders.length]}
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={rows.length === 1}
              aria-label={t.remove(row.label || String(i + 1))}
              className="row-start-1 grid size-10 place-items-center self-end justify-self-end rounded-full text-muted hover:text-red-700 disabled:opacity-30 sm:col-start-4"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
            <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-2 sm:col-start-2 sm:row-start-1">
              <label className="block space-y-1">
                <span className="text-xs font-semibold">{t.presale}</span>
                <input
                  name="ticketPresale"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  defaultValue={row.presale}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">{t.door}</span>
                <input
                  name="ticketDoor"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  defaultValue={row.door}
                  className={inputClass}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {rows.length < MAX_TICKET_TIERS && (
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm font-bold text-brand">
          <Plus className="size-4" aria-hidden />
          {t.add}
        </button>
      )}

      <Field label={t.presaleUntil} hint={t.presaleUntilHint}>
        <input name="presaleUntil" type="date" min={minDate} defaultValue={presaleUntil} className={inputClass} />
      </Field>
    </fieldset>
  );
}
