import Link from "next/link";
import { AlertTriangle, BadgeCheck, Ban, Gift } from "lucide-react";
import { dateOf, formatLongDate } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import type { Subscription } from "@/lib/subscription";

const TONE = {
  trial: { box: "bg-sea/10", icon: "text-sea", Icon: Gift },
  active: { box: "bg-verified/10", icon: "text-verified", Icon: BadgeCheck },
  expired: { box: "bg-amber-50", icon: "text-amber-600", Icon: AlertTriangle },
  canceled: { box: "bg-red-50", icon: "text-red-600", Icon: Ban },
} as const;

const T = messages({
  fr: {
    remaining: (days: number) => (days <= 1 ? "dernier jour" : `encore ${days} jours`),
    trial: (left: string, until: string) => [
      `Essai gratuit : ${left}`,
      `Publiez autant d'offres que vous voulez jusqu'au ${until}. Abonnez-vous ensuite, ou payez à la journée.`,
    ],
    active: (left: string, until: string) => [`Abonnement actif : ${left}`, `Offres illimitées jusqu'au ${until}.`],
    expired: (until: string) => [
      "Abonnement expiré",
      `Depuis le ${until}, publier une offre demande de payer ses jours de visibilité ou de vous réabonner. Vos offres en ligne restent visibles jusqu'à leur date de fin.`,
    ],
    canceled: "Abonnement annulé",
    canceledText: "Contactez Janga Explorer pour en savoir plus.",
    renew: "Renouveler mon abonnement",
    extend: "Prolonger maintenant",
    manage: "Gérer mon abonnement",
  },
  en: {
    remaining: (days: number) => (days <= 1 ? "last day" : `${days} days left`),
    trial: (left: string, until: string) => [
      `Free trial: ${left}`,
      `Post as many deals as you like until ${until}. After that, subscribe or pay per day.`,
    ],
    active: (left: string, until: string) => [`Subscription active: ${left}`, `Unlimited deals until ${until}.`],
    expired: (until: string) => [
      "Subscription expired",
      `Since ${until}, posting a deal means paying for its days of visibility or subscribing again. Your live deals stay visible until their end date.`,
    ],
    canceled: "Subscription cancelled",
    canceledText: "Contact Janga Explorer to find out more.",
    renew: "Renew my subscription",
    extend: "Extend now",
    manage: "Manage my subscription",
  },
});

/** État de l'abonnement du pro. `compact` : version tableau de bord, avec un lien vers la page d'abonnement. */
export async function SubscriptionStatus({
  subscription: s,
  compact = false,
}: {
  subscription: Subscription;
  compact?: boolean;
}) {
  const locale = await getLocale();
  const t = T[locale];
  const { box, icon, Icon } = TONE[s.status];
  const until = formatLongDate(dateOf(s.accessUntil), locale);
  const soon = (s.status === "trial" || s.status === "active") && s.daysLeft <= 7;
  const left = t.remaining(s.daysLeft);

  const [title, text] = {
    trial: t.trial(left, until),
    active: t.active(left, until),
    expired: t.expired(until),
    canceled: [t.canceled, s.cancelReason ?? t.canceledText],
  }[s.status];

  return (
    <section className={`flex items-start gap-3 rounded-2xl p-4 ${box}`} role="status">
      <Icon className={`mt-0.5 size-6 shrink-0 ${icon}`} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-ink/80">{text}</p>
        {compact && s.status !== "canceled" && (
          <Link href="/espace-pro/abonnement" className="inline-block pt-1 text-sm font-bold text-brand">
            {s.status === "expired" ? t.renew : soon ? t.extend : t.manage}
          </Link>
        )}
      </div>
    </section>
  );
}
