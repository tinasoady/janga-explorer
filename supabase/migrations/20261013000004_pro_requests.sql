-- Janga Explorer : demandes de compte professionnel, validées par le superadmin.
-- À exécuter après 20261013000003_roles.sql.
--
-- Principe : il n'y a plus d'inscription libre. Une personne remplit une demande (nom, entreprise, activité, localité,
-- capacité, justificatif, e-mail pro, mot de passe). Son compte est créé dans Supabase Auth (le mot de passe y est
-- stocké chiffré) mais il n'ouvre AUCUN droit tant que le superadmin n'a pas approuvé la demande : sans demande
-- approuvée, impossible de créer un établissement ou une offre (règles RLS ci-dessous).

create table public.pro_requests (
  user_id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  company text not null check (char_length(company) between 2 and 80),
  kind text not null check (kind in ('hotel', 'restaurant', 'activite', 'evenement')),
  locality text not null check (char_length(locality) between 2 and 80),
  capacity integer not null check (capacity between 1 and 100000),
  justification text not null check (char_length(justification) between 5 and 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text check (char_length(rejection_reason) <= 300),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index pro_requests_status_idx on public.pro_requests (status, created_at);

alter table public.pro_requests enable row level security;

-- Chacun lit sa propre demande (pour voir où elle en est) ; le superadmin les lit toutes.
-- Aucune policy d'écriture : la demande est créée par le trigger ci-dessous, jugée par review_pro_request().
create policy "pro_requests_select" on public.pro_requests
  for select to authenticated using (user_id = (select auth.uid()) or public.is_superadmin());

-- À l'inscription, le formulaire joint la demande aux métadonnées du compte ; ce trigger en fait une ligne
-- pro_requests. Le rôle, lui, n'est jamais lu depuis les métadonnées : toute inscription donne un compte « user ».
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id) values (new.id);

  if meta ? 'company' then
    insert into public.pro_requests (user_id, email, full_name, company, kind, locality, capacity, justification)
    values (
      new.id,
      coalesce(new.email, ''),
      trim(meta ->> 'full_name'),
      trim(meta ->> 'company'),
      meta ->> 'kind',
      trim(meta ->> 'locality'),
      (meta ->> 'capacity')::integer,
      trim(meta ->> 'justification')
    );
  end if;
  return new;
end;
$$;

-- Vrai pour un compte dont la demande a été approuvée.
create function public.is_approved_pro() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pro_requests where user_id = (select auth.uid()) and status = 'approved'
  );
$$;

-- Approuve (approve = true) ou refuse / révoque (false) une demande. Réservé au superadmin.
-- À l'approbation, l'adresse e-mail est aussi confirmée : le superadmin a vérifié la personne, elle peut se connecter.
-- Renvoie 'ok' ou 'not_found'.
create function public.review_pro_request(target uuid, approve boolean, reason text default null) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = '42501';
  end if;

  update public.pro_requests
  set status = case when approve then 'approved' else 'rejected' end,
      rejection_reason = case
        when approve then null
        else left(coalesce(nullif(trim(reason), ''), 'Demande non retenue.'), 300)
      end,
      reviewed_at = now()
  where user_id = target;

  if not found then
    return 'not_found';
  end if;

  if approve then
    update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = target;
  end if;
  return 'ok';
end;
$$;

revoke execute on function public.review_pro_request(uuid, boolean, text) from public, anon;
grant execute on function public.review_pro_request(uuid, boolean, text) to authenticated;

-- Sans demande approuvée, on ne crée ni établissement ni offre (les admins passent par leurs propres policies).
drop policy "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own" on public.businesses
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and rating is null
    and review_count = 0
    and public.is_approved_pro()
  );

drop policy "offers_insert_own" on public.offers;
create policy "offers_insert_own" on public.offers
  for insert to authenticated
  with check (
    public.owns_business(business_id)
    and public.is_approved_pro()
    and status = 'pending'
    and not is_verified
    and verified_at is null
    and not is_featured
    and rejection_reason is null
  );
