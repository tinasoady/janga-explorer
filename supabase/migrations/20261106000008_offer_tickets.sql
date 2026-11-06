-- Janga Explorer : billetterie des événements.
-- À exécuter après 20261106000007_offer_passes_stats.sql.
--
-- Une offre peut afficher plusieurs tarifs (billet normal, VIP…), chacun avec un prix en prévente et/ou sur place,
-- et une date de fin de prévente. Les colonnes price_offer / price_original restent remplies (tarif le moins cher en
-- prévente) : l'application recalcule à l'affichage le prix du jour selon que la prévente est ouverte ou non.

-- Forme attendue : [{"label": "VIP", "presale": 30000, "door": 40000}, …], de 1 à 6 tarifs, au moins un prix par tarif.
create function public.valid_ticket_tiers(tiers jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(tiers) = 'array'
    and jsonb_array_length(tiers) between 1 and 6
    and not exists (
      select 1
      from jsonb_array_elements(tiers) as t(tier)
      where jsonb_typeof(tier) <> 'object'
         or coalesce(jsonb_typeof(tier -> 'label'), 'null') <> 'string'
         or char_length(tier ->> 'label') not between 1 and 40
         or coalesce(jsonb_typeof(tier -> 'presale'), 'null') not in ('null', 'number')
         or coalesce(jsonb_typeof(tier -> 'door'), 'null') not in ('null', 'number')
         or (tier ->> 'presale') is null and (tier ->> 'door') is null
         or (tier ->> 'presale')::numeric not between 0 and 100000000
         or (tier ->> 'door')::numeric not between 0 and 100000000
    );
$$;

alter table public.offers
  add column ticket_tiers jsonb,
  add column presale_until date, -- dernier jour de la prévente (inclus) ; sans date, prévente jusqu'à la fin de l'offre
  add constraint offers_ticket_tiers_fmt check (ticket_tiers is null or public.valid_ticket_tiers(ticket_tiers)),
  add constraint offers_presale_needs_tiers check (presale_until is null or ticket_tiers is not null);

-- Même garde-fou que 20261106000007, avec les tarifs et la date de prévente parmi le contenu : un pro qui les change
-- renvoie l'offre en validation.
create or replace function public.offers_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if public.is_admin() then
    return new;
  end if;

  new.business_id := old.business_id;
  new.slug := old.slug;
  new.is_featured := old.is_featured;
  new.pass_until := old.pass_until;

  if (new.title, new.description, new.category, new.image_url, new.price_original,
      new.price_offer, new.conditions, new.location, new.map_url, new.valid_until,
      new.ticket_tiers, new.presale_until)
     is distinct from
     (old.title, old.description, old.category, old.image_url, old.price_original,
      old.price_offer, old.conditions, old.location, old.map_url, old.valid_until,
      old.ticket_tiers, old.presale_until) then
    new.status := 'pending';
    new.is_verified := false;
    new.verified_at := null;
    new.rejection_reason := null;
  else
    new.is_verified := old.is_verified;
    new.verified_at := old.verified_at;
    new.rejection_reason := old.rejection_reason;
    -- statuts autorisés à un pro : retirer son offre, ou soumettre à nouveau une offre retirée / refusée
    if new.status = 'archived' then
      null;
    elsif new.status = 'pending' and old.status in ('archived', 'rejected', 'draft') then
      new.is_verified := false;
      new.verified_at := null;
      new.rejection_reason := null;
    else
      new.status := old.status;
    end if;
  end if;

  if new.status = 'pending'
     and not public.has_active_subscription()
     and not coalesce(new.pass_until >= new.valid_until, false) then
    new.status := 'draft';
  end if;
  return new;
end;
$$;
