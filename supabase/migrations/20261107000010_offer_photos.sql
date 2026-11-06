-- Janga Explorer : plusieurs photos par offre.
-- À exécuter après 20261106000009_sample_offers.sql.
--
-- offers.image_url reste la photo de couverture (cartes, partage) ; offers.image_urls contient jusqu'à 7 photos en
-- plus, affichées dans la galerie de la fiche. Les photos sont réduites dans le navigateur puis envoyées directement
-- au stockage (sans passer par le serveur web, limité à 4,5 Mo par requête) : la limite du bucket passe à 10 Mo.

create function public.valid_image_urls(urls text[]) returns boolean
language sql immutable set search_path = '' as $$
  select cardinality(urls) <= 7
    and not exists (select 1 from unnest(urls) as u(url) where url !~ '^https://' or char_length(url) > 500);
$$;

alter table public.offers
  add column image_urls text[] not null default '{}',
  add constraint offers_image_urls_fmt check (public.valid_image_urls(image_urls));

update storage.buckets set file_size_limit = 10485760 where id = 'offer-images';

-- Même garde-fou que 20261106000008, avec les photos supplémentaires parmi le contenu : un pro qui les change renvoie
-- l'offre en validation.
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

  if (new.title, new.description, new.category, new.image_url, new.image_urls, new.price_original,
      new.price_offer, new.conditions, new.location, new.map_url, new.valid_until,
      new.ticket_tiers, new.presale_until)
     is distinct from
     (old.title, old.description, old.category, old.image_url, old.image_urls, old.price_original,
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

-- Offres d'exemple : quelques galeries, pour montrer la fonction (mêmes photos que src/data/demo-offers.ts).
-- Le garde-fou est suspendu le temps de cette mise à jour : sans session admin, il prendrait la migration pour un pro
-- qui change ses photos et dépublierait les offres.
alter table public.offers disable trigger offers_guard;

update public.offers o
set image_urls = array(
  select 'https://images.unsplash.com/photo-' || id || '?w=1200&q=75&auto=format&fit=crop' from unnest(g.photos) as p(id)
)
from (values
  ('bungalow-pieds-dans-eau-deux-nuits', array['1507525428034-b723cf961d3e', '1582719508461-905c673771fd', '1473116763249-2faaef81ccda']),
  ('journee-piscine-dejeuner', array['1571896349842-33c89424de2d', '1566073771259-6a8506099945', '1540189549336-e6e99c3679fe']),
  ('week-end-deux-nuits-fanjava', array['1590490360182-c33d57733427', '1540541338287-41700207dee6', '1517248135467-4c7edcad34c4']),
  ('plongee-decouverte-bateau', array['1544551763-46a013bb70d5', '1544551763-77ef2d0cfc6c']),
  ('snorkeling-pique-nique-katsepy', array['1530053969600-caed2596d242', '1570789210967-2cac24afeb00', '1519708227418-c8fd9a32b7a2']),
  ('concert-salegy-corniche', array['1429962714451-bb934ecdc4ec', '1533174072545-7a4b6ad7a6c3']),
  ('deuxieme-pizza-moitie-prix', array['1565299624946-b28f40a0ae38', '1551218808-94e220e084d2']),
  ('poisson-du-jour-grille', array['1615141982883-c7ad0e69fd62', '1559339352-11d035aa65de'])
) as g(slug, photos)
where o.slug = g.slug
  and o.business_id in (select id from public.businesses where is_sample);

alter table public.offers enable trigger offers_guard;
