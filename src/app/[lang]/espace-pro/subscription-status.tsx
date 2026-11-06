import Link from "next/link";
import { AlertTriangle, BadgeCheck, Ban, Gift } from "lucide-react";
import { dateOf, formatLongDate } from "@/lib/format";
import type { Subscription } from "@/lib/subscription";

const TONE = {
  trial: { box: "bg-sea/10", icon: "text-sea", Icon: Gift },
  active: { box: "bg-verified/10", icon: "text-verified", Icon: BadgeCheck },
  expired: { box: "bg-amber-50", icon: "text-amber-600", Icon: AlertTriangle },
  canceled: { box: "bg-red-50", icon: "text-red-600", Icon: Ban },
} as const;

function remaining(days: number) {
  return days <= 1 ? "dernier jour" : `encore ${days} jours`;
}

/** État de l'abonnement du pro. `compact` : version tableau de bord, avec un lien vers la page d'abonnement. */
export function SubscriptionStatus({ subscription: s, compact = false }: { subscription: Subscription; compact?: boolean }) {
  const { box, icon, Icon } = TONE[s.status];
  const until = formatLongDate(dateOf(s.accessUntil));
  const soon = (s.status === "trial" || s.status === "active") && s.daysLeft <= 7;

  const [title, text] = {
    trial: [`Essai gratuit : ${remaining(s.daysLeft)}`, `Publiez autant d'offres que vous voulez jusqu'au ${until}. Abonnez-vous ensuite pour continuer.`],
    active: [`Abonnement actif : ${remaining(s.daysLeft)}`, `Offres illimitées jusqu'au ${until}.`],
    expired: ["Abonnement expiré", `Depuis le ${until}, vous ne pouvez plus publier de nouvelle offre. Vos offres en ligne restent visibles jusqu'à leur date de fin.`],
    canceled: ["Abonnement annulé", s.cancelReason ?? "Contactez Janga Explorer pour en savoir plus."],
  }[s.status];

  return (
    <section className={`flex items-start gap-3 rounded-2xl p-4 ${box}`} role="status">
      <Icon className={`mt-0.5 size-6 shrink-0 ${icon}`} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-ink/80">{text}</p>
        {compact && s.status !== "canceled" && (
          <Link href="/espace-pro/abonnement" className="inline-block pt-1 text-sm font-bold text-brand">
            {s.status === "expired" ? "Renouveler mon abonnement" : soon ? "Prolonger maintenant" : "Gérer mon abonnement"}
          </Link>
        )}
      </div>
    </section>
  );
}
