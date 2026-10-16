import { formatAriary } from "@/lib/format";

export type RevenueMonth = { key: string; label: string; amount: number; count: number };

/**
 * Revenus confirmés par mois (date de confirmation). Une seule série : colonnes à la couleur de la marque, valeur
 * écrite sur le mois en cours, détail au survol, et tableau équivalent pour les lecteurs d'écran.
 */
export function RevenueChart({ months }: { months: RevenueMonth[] }) {
  const max = Math.max(...months.map((m) => m.amount), 1);
  const current = months.at(-1);

  return (
    <figure className="rounded-2xl border border-line bg-white p-4">
      <figcaption className="text-sm font-bold">Revenus confirmés, 6 derniers mois</figcaption>

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
                  className="absolute text-[11px] font-bold whitespace-nowrap text-ink group-hover:invisible"
                  style={{ bottom: `calc(${pct}% + 4px)` }}
                >
                  {formatAriary(m.amount)}
                </span>
              )}
              <span
                className={`pointer-events-none invisible absolute z-10 ${align} rounded-lg bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-md group-hover:visible`}
                style={{ bottom: `calc(${pct}% + 6px)` }}
              >
                {m.label} · {formatAriary(m.amount)} · {m.count} paiement{m.count > 1 ? "s" : ""}
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
        <caption>Revenus confirmés par mois</caption>
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">Montant</th>
            <th scope="col">Paiements</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <th scope="row">{m.label}</th>
              <td>{formatAriary(m.amount)}</td>
              <td>{m.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
