// Billetterie d'un événement : plusieurs tarifs (billet normal, VIP…), chacun avec un prix en prévente et/ou sur place.
// Sans dépendance serveur : utilisé par le formulaire de l'espace pro et par l'affichage des offres.

export type TicketTier = {
  /** "Billet normal", "VIP", "Table 4 personnes"… */
  label: string;
  /** Prix en prévente, en ariary (null si le tarif ne se vend que sur place). */
  presale: number | null;
  /** Prix sur place, le jour J (null si le tarif ne se vend qu'en prévente). */
  door: number | null;
};

/** Nombre de tarifs au plus par offre (même limite que la base). */
export const MAX_TICKET_TIERS = 6;

/** Plusieurs tarifs : le prix mis en avant est le moins cher (« dès … »). */
export function hasSeveralPrices(offer: { tickets: TicketTier[] | null }) {
  return (offer.tickets?.length ?? 0) > 1;
}

/** La prévente est ouverte jusqu'à sa date de fin incluse ; sans date, jusqu'à la fin de l'offre. */
export function isPresaleOpen(presaleUntil: string | null, today: string) {
  return !presaleUntil || today <= presaleUntil;
}

/** Prix payé aujourd'hui pour un tarif : celui de la prévente tant qu'elle est ouverte, sinon celui sur place. */
export function currentTierPrice(tier: TicketTier, presaleOpen: boolean) {
  if (presaleOpen && tier.presale !== null) return tier.presale;
  return tier.door ?? tier.presale ?? 0;
}

/**
 * Prix mis en avant sur les cartes : le tarif le moins cher aujourd'hui (« dès … »), et le prix sur place de ce même
 * tarif quand la prévente le rend moins cher (affiché barré, il donne la remise).
 */
export function ticketSummary(tiers: TicketTier[], presaleUntil: string | null, today: string) {
  const open = isPresaleOpen(presaleUntil, today);
  let cheapest = tiers[0];
  for (const tier of tiers) {
    if (currentTierPrice(tier, open) < currentTierPrice(cheapest, open)) cheapest = tier;
  }
  const price = currentTierPrice(cheapest, open);
  const original = cheapest.door !== null && cheapest.door > price ? cheapest.door : null;
  return { price, original, presaleOpen: open };
}
