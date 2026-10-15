-- Localisation Google Maps des offres : facultative, mais recommandée au professionnel.
-- On enregistre un lien https déjà vérifié côté serveur (lien « Partager » de Google Maps,
-- ou lien de recherche construit à partir de coordonnées GPS).

alter table public.offers
  add column map_url text,
  add constraint offers_map_url_fmt check (map_url is null or (map_url ~ '^https://' and char_length(map_url) <= 500));

-- Même règle que pour le lieu : un professionnel qui change la localisation renvoie l'offre en validation.
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

  if (new.title, new.description, new.category, new.image_url, new.price_original,
      new.price_offer, new.conditions, new.location, new.map_url, new.valid_until)
     is distinct from
     (old.title, old.description, old.category, old.image_url, old.price_original,
      old.price_offer, old.conditions, old.location, old.map_url, old.valid_until) then
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
  return new;
end;
$$;
