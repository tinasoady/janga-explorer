-- Janga Explorer : comptes, espace pro, validation des offres, favoris, alertes et photos.
-- À exécuter après 20261013000001_init.sql (migration additive : fonctionne sur une base neuve ou déjà alimentée).

-- ---------------------------------------------------------------------------
-- Profils : un par compte. role = 'admin' se donne à la main (voir README).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comptes déjà existants avant cette migration
insert into public.profiles (id) select id from auth.users on conflict do nothing;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

-- Chacun lit son propre profil (pour connaître son rôle). Personne ne peut le modifier côté client.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Établissements : un compte = un établissement
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column owner_id uuid unique references auth.users on delete set null,
  add constraint businesses_name_len check (char_length(name) between 2 and 80) not valid,
  add constraint businesses_kind_len check (char_length(kind) <= 60) not valid,
  add constraint businesses_whatsapp_fmt check (whatsapp ~ '^[0-9]{8,15}$') not valid,
  add constraint businesses_phone_len check (char_length(phone) <= 30) not valid;

-- ---------------------------------------------------------------------------
-- Offres : cycle de validation
--   draft = brouillon (jamais public), pending = en attente de validation, published = en ligne,
--   rejected = refusée, archived = retirée par le pro
-- ---------------------------------------------------------------------------
alter table public.offers
  drop constraint offers_status_check,
  add constraint offers_status_check check (status in ('draft', 'pending', 'published', 'rejected', 'archived')),
  add column rejection_reason text,
  add column updated_at timestamptz not null default now(),
  add constraint offers_slug_fmt check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid,
  add constraint offers_title_len check (char_length(title) between 3 and 90) not valid,
  add constraint offers_description_len check (char_length(description) between 10 and 1000) not valid,
  add constraint offers_conditions_len check (char_length(conditions) <= 500) not valid,
  add constraint offers_location_len check (char_length(location) between 2 and 120) not valid,
  add constraint offers_reason_len check (char_length(rejection_reason) <= 300) not valid,
  add constraint offers_price_order check (price_original is null or price_original >= price_offer) not valid,
  add constraint offers_verified_date check (not is_verified or verified_at is not null) not valid;

create index offers_business_idx on public.offers (business_id);

-- Date de mise en ligne : sert aux alertes (« nouvelles offres depuis votre dernière visite »).
alter table public.offers add column published_at timestamptz;
update public.offers set published_at = created_at where status = 'published';

create function public.offers_set_published_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger offers_set_published_at before insert or update on public.offers
  for each row execute function public.offers_set_published_at();

-- Fonctions d'appui aux policies (security definer : évitent la récursion entre businesses et offers)
create function public.owns_business(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.businesses where id = target and owner_id = (select auth.uid()));
$$;

create function public.business_is_listed(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.offers
    where business_id = target
      and status = 'published'
      and valid_until >= (now() at time zone 'Indian/Antananarivo')::date
  );
$$;

-- ---------------------------------------------------------------------------
-- Policies : businesses
-- ---------------------------------------------------------------------------
drop policy "Lecture publique des établissements" on public.businesses;

-- Un établissement est public tant qu'il a au moins une offre en ligne ; son propriétaire et les admins le voient toujours.
create policy "businesses_select" on public.businesses
  for select to anon, authenticated using (
    owner_id = (select auth.uid())
    or public.is_admin()
    or public.business_is_listed(id)
  );

create policy "businesses_insert_own" on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and rating is null and review_count = 0);

create policy "businesses_update_own" on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "businesses_admin_all" on public.businesses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Un pro ne peut ni changer de propriétaire ni modifier ses notes.
create function public.businesses_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    new.owner_id := old.owner_id;
    new.rating := old.rating;
    new.review_count := old.review_count;
  end if;
  return new;
end;
$$;

create trigger businesses_guard before update on public.businesses
  for each row execute function public.businesses_guard();

-- ---------------------------------------------------------------------------
-- Policies : offers
-- ---------------------------------------------------------------------------
drop policy "Lecture publique des offres publiées" on public.offers;

-- Public : seulement les offres publiées et encore valables aujourd'hui à Mahajanga.
create policy "offers_select_public" on public.offers
  for select to anon, authenticated using (
    status = 'published'
    and valid_until >= (now() at time zone 'Indian/Antananarivo')::date
  );

create policy "offers_select_own" on public.offers
  for select to authenticated using (public.owns_business(business_id));

-- Un pro ne crée que des offres « en attente », sans badge ni mise en avant.
create policy "offers_insert_own" on public.offers
  for insert to authenticated
  with check (
    public.owns_business(business_id)
    and status = 'pending'
    and not is_verified
    and verified_at is null
    and not is_featured
    and rejection_reason is null
  );

create policy "offers_update_own" on public.offers
  for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "offers_delete_own" on public.offers
  for delete to authenticated using (public.owns_business(business_id));

create policy "offers_admin_all" on public.offers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Garde-fous sur les modifications faites par un pro :
--  * il ne peut ni se donner le badge « vérifiée », ni la mise en avant, ni changer le statut à sa guise ;
--  * toute modification du contenu (prix, conditions, dates…) renvoie l'offre en validation.
create function public.offers_guard() returns trigger
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
      new.price_offer, new.conditions, new.location, new.valid_until)
     is distinct from
     (old.title, old.description, old.category, old.image_url, old.price_original,
      old.price_offer, old.conditions, old.location, old.valid_until) then
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

create trigger offers_guard before update on public.offers
  for each row execute function public.offers_guard();

-- ---------------------------------------------------------------------------
-- Favoris (par compte). Les offres sont identifiées par leur slug, comme dans le navigateur.
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references auth.users on delete cascade,
  slug text not null check (char_length(slug) <= 120),
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

alter table public.favorites enable row level security;

create policy "favorites_own" on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Alertes : « montrez-moi ce qui est nouveau pour ces critères ».
-- ---------------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category text check (category in ('manger', 'dormir', 'activites', 'sorties')),
  max_price integer check (max_price > 0),
  query text check (char_length(query) <= 80),
  last_seen_at timestamptz not null default now(), -- les offres créées après cette date sont « nouvelles »
  created_at timestamptz not null default now(),
  constraint alerts_not_empty check (category is not null or max_price is not null or query is not null)
);

create index alerts_user_idx on public.alerts (user_id);

alter table public.alerts enable row level security;

create policy "alerts_own" on public.alerts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Photos des offres : bucket public en lecture, chaque pro écrit dans son propre dossier (<user_id>/...).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('offer-images', 'offer-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "offer_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'offer-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "offer_images_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'offer-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "offer_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'offer-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
