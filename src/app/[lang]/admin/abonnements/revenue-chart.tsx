import { formatAriary } from "@/lib/format";
import { messages, type Locale } from "@/lib/i18n";

const T = messages({
  fr: {
    caption: "Revenus confirmés, 6 derniers mois",
    tableCaption: "Revenus confirmés par mois",
    month: "Mois",
    amount: "Montant",
    payments: "Paiements",
    count: (n: number) => `${n} paiement${n > 1 ? "s" : ""}`,
  },
  en: {
    caption: "Confirmed revenue, last 6 months",
    tableCaption: "Confirmed revenue by month",
    month: "Month",
    amount: "Amount",
    payments: "Payments",
    count: (n: number) => `${n} payment${n > 1 ? "s" : ""}`,
  },
});

export type RevenueMonth = { key: string; label: string; amount: number; count: number };

/**
 * Revenus confirmés par mois (date de confirmation). Une seule série : colonnes à la couleur de la marque, valeur
 * écrite sur le mois en cours, détail au survol, et tableau équivalent pour les lecteurs d'écran.
 */
export function RevenueChart({ months, locale }: { months: RevenueMonth[]; locale: Locale }) {
  const t = T[locale];
  const max = Math.max(...months.map((m) => m.amount), 1);
  const current = months.at(-1);

  return (
    <figure className="rounded-2xl border border-line bg-card p-4">
      <figcaption className="text-sm font-bold">{t.caption}</figcaption>

      <div className="mt-8 flex h-36 items-end gap-2 border-b border-line" aria-hidden>
        {months.map((m, i) => {
          const pct = (m.amount / max) * 100;
          const isCurrent = m === current;
          // Bulle calée sur le bord pour les colonnes extrêmes : elle ne déborde pas de l'écran sur téléphone.
          const align = i < 2 ? "left-0" : i >= months.length - 2 ? "right-0" : "";
          return (
            <div key={m.key} className="group relative flex h-full flex-1 justify-center">
              <div
                className={`absolute bottom-0 w-full max-w-10 rounded-t ${isCurrent ? "bg-brand" : "bg-brand/60"} group-hover:bg-brand-dark`}
                style={{ height: m.amount > 0 ? `max(${pct}%, 4px)` : 0 }}
              />
              {isCurrent && m.amount > 0 && (
                <span
                  className="absolute text-[11px] font-bold whitespace-nowrap text-fg group-hover:invisible"
                  style={{ bottom: `calc(${pct}% + 4px)` }}
                >
                  {formatAriary(m.amount, locale)}
                </span>
              )}
              <span
                className={`pointer-events-none invisible absolute z-10 ${align} rounded-lg bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-md group-hover:visible`}
                style={{ bottom: `calc(${pct}% + 6px)` }}
              >
                {m.label} · {formatAriary(m.amount, locale)} · {t.count(m.count)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 text-center text-[11px] text-muted" aria-hidden>
        {months.map((m) => (
          <span key={m.key} className="flex-1">
            {m.label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{t.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.month}</th>
            <th scope="col">{t.amount}</th>
            <th scope="col">{t.payments}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <th scope="row">{m.label}</th>
              <td>{formatAriary(m.amount, locale)}</td>
              <td>{m.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
