-- Janga Explorer : abonnement des comptes professionnels.
-- À exécuter après 20261015000005_offer_map_url.sql.
--
-- Principe :
--   * à l'approbation de sa demande, un compte pro reçoit un essai gratuit (30 jours par défaut) ;
--   * ensuite, il doit être abonné pour publier (nombre d'offres illimité) : il paie par MVola, Orange Money ou
--     Airtel Money, déclare son paiement avec la preuve (capture d'écran du SMS de confirmation), et un
--     administrateur le confirme. Chaque paiement confirmé prolonge l'accès de 30 jours par mois payé ;
--   * le superadmin fixe le prix et les numéros de paiement, offre des jours, annule ou réactive un abonnement.
--
-- Sans abonnement actif, le pro ne peut plus créer d'offre ni renvoyer une offre en validation (contrôlé ici, dans la
-- base). Ses offres déjà en ligne restent visibles jusqu'à leur date de fin ; il peut toujours les retirer.

-- ---------------------------------------------------------------------------
-- Réglages : une seule ligne, modifiable par le superadmin
-- ---------------------------------------------------------------------------
create table public.subscription_settings (
  id boolean primary key default true check (id),
  monthly_price integer not null default 20000 check (monthly_price between 0 and 10000000),
  trial_days integer not null default 30 check (trial_days between 0 and 365),
  account_name text not null default '' check (char_length(account_name) <= 80),
  mvola_number text not null default '' check (char_length(mvola_number) <= 30),
  orange_money_number text not null default '' check (char_length(orange_money_number) <= 30),
  airtel_money_number text not null default '' check (char_length(airtel_money_number) <= 30),
  updated_at timestamptz not null default now()
);

insert into public.subscription_settings default values;

alter table public.subscription_settings enable row level security;

-- Le prix et les numéros de paiement sont publics (affichés aux pros, et sur la page de présentation).
create policy "subscription_settings_select" on public.subscription_settings
  for select to anon, authenticated using (true);

create policy "subscription_settings_update" on public.subscription_settings
  for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- Abonnements : un par compte pro
--   accès jusqu'à greatest(trial_ends_at, paid_until), sauf s'il a été annulé (canceled_at)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  trial_ends_at timestamptz not null,
  paid_until timestamptz,
  canceled_at timestamptz,
  cancel_reason text check (char_length(cancel_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Aucune policy d'écriture : les abonnements ne changent que par les fonctions ci-dessous.
create policy "subscriptions_select" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create function public.has_active_subscription() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = (select auth.uid())
      and canceled_at is null
      and greatest(trial_ends_at, paid_until) > now()
  );
$$;

-- Comptes pro déjà approuvés : ils reçoivent leur mois d'essai à partir d'aujourd'hui.
insert into public.subscriptions (user_id, trial_ends_at)
select user_id, now() + make_interval(days => (select trial_days from public.subscription_settings))
from public.pro_requests
where status = 'approved'
on conflict do nothing;

-- L'approbation d'une demande ouvre l'essai gratuit (une seule fois : une réapprobation ne le renouvelle pas).
create or replace function public.review_pro_request(target uuid, approve boolean, reason text default null) returns text
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
    insert into public.subscriptions (user_id, trial_ends_at)
    values (target, now() + make_interval(days => (select trial_days from public.subscription_settings)))
    on conflict (user_id) do nothing;
  end if;
  return 'ok';
end;
$$;

-- ---------------------------------------------------------------------------
-- Paiements déclarés par les pros, confirmés ou refusés par un administrateur
-- ---------------------------------------------------------------------------
create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  months integer not null check (months between 1 and 12),
  amount integer not null check (amount >= 0), -- calculé par la base au moment de la déclaration
  method text not null check (method in ('mvola', 'orange_money', 'airtel_money')),
  payer_phone text not null check (char_length(payer_phone) between 8 and 30),
  reference text not null check (char_length(reference) between 3 and 60),
  proof_path text not null check (char_length(proof_path) <= 200),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  rejection_reason text check (char_length(rejection_reason) <= 300),
  period_start timestamptz,
  period_end timestamptz,
  reviewed_by uuid references auth.users on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscription_payments_user_idx on public.subscription_payments (user_id, created_at desc);
create index subscription_payments_status_idx on public.subscription_payments (status, created_at);
-- Un seul paiement en attente à la fois par compte.
create unique index subscription_payments_one_pending on public.subscription_payments (user_id) where status = 'pending';
-- Une même transaction ne peut pas être déclarée deux fois (sauf si la première déclaration a été refusée).
create unique index subscription_payments_reference_unique
  on public.subscription_payments (method, lower(reference)) where status <> 'rejected';

alter table public.subscription_payments enable row level security;

create policy "subscription_payments_select" on public.subscription_payments
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Un pro approuvé déclare ses propres paiements, avec une preuve rangée dans son dossier, tant que son abonnement
-- n'est pas annulé. Pas de policy de modification ni de suppression : la décision passe par review_subscription_payment().
create policy "subscription_payments_insert_own" on public.subscription_payments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_approved_pro()
    and proof_path like ((select auth.uid())::text || '/%')
    and exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid()) and s.canceled_at is null)
  );

-- Le montant vient du prix en vigueur, jamais du navigateur ; le statut de départ est toujours « en attente ».
create function public.subscription_payments_prepare() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.amount := new.months * (select monthly_price from public.subscription_settings);
  new.status := 'pending';
  new.rejection_reason := null;
  new.period_start := null;
  new.period_end := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.created_at := now();
  return new;
end;
$$;

create trigger subscription_payments_prepare before insert on public.subscription_payments
  for each row execute function public.subscription_payments_prepare();

-- ---------------------------------------------------------------------------
-- Fonctions d'administration
-- ---------------------------------------------------------------------------

-- Fin de l'accès actuel, ou maintenant s'il est déjà terminé : un paiement ou un geste commercial s'ajoute à la suite.
create function public.subscription_extension_start(target uuid) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select greatest(now(), s.trial_ends_at, s.paid_until) from public.subscriptions s where s.user_id = target;
$$;

revoke execute on function public.subscription_extension_start(uuid) from public, anon, authenticated;

-- Confirme (approve = true) ou refuse (false) un paiement en attente. Ouvert à tous les administrateurs.
-- Renvoie 'ok', 'not_found', 'already_reviewed' ou 'canceled' (abonnement annulé : à réactiver d'abord).
create function public.review_subscription_payment(target uuid, approve boolean, reason text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  payment public.subscription_payments;
  sub public.subscriptions;
  starts timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs' using errcode = '42501';
  end if;

  select * into payment from public.subscription_payments where id = target for update;
  if not found then
    return 'not_found';
  end if;
  if payment.status <> 'pending' then
    return 'already_reviewed';
  end if;

  if not approve then
    update public.subscription_payments
    set status = 'rejected',
        rejection_reason = left(coalesce(nullif(trim(reason), ''), 'Paiement introuvable ou montant incorrect.'), 300),
        reviewed_by = (select auth.uid()),
        reviewed_at = now()
    where id = target;
    return 'ok';
  end if;

  -- Compte sans ligne d'abonnement (cas rare) : on la crée, sans essai.
  insert into public.subscriptions (user_id, trial_ends_at) values (payment.user_id, now())
  on conflict (user_id) do nothing;

  select * into sub from public.subscriptions where user_id = payment.user_id for update;
  if sub.canceled_at is not null then
    return 'canceled';
  end if;

  starts := public.subscription_extension_start(payment.user_id);

  update public.subscription_payments
  set status = 'confirmed',
      period_start = starts,
      period_end = starts + make_interval(days => 30 * payment.months),
      reviewed_by = (select auth.uid()),
      reviewed_at = now()
  where id = target;

  update public.subscriptions
  set paid_until = starts + make_interval(days => 30 * payment.months), updated_at = now()
  where user_id = payment.user_id;
  return 'ok';
end;
$$;

-- Offre des jours d'abonnement (geste commercial, paiement reçu hors application…). Réservé au superadmin.
create function public.grant_subscription_days(target uuid, extra_days integer) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = '42501';
  end if;
  if extra_days is null or extra_days not between 1 and 365 then
    return 'invalid';
  end if;

  update public.subscriptions
  set paid_until = public.subscription_extension_start(target) + make_interval(days => extra_days), updated_at = now()
  where user_id = target;
  return case when found then 'ok' else 'not_found' end;
end;
$$;

-- Annule un abonnement : l'accès s'arrête tout de suite, le motif est montré au pro. Réservé au superadmin.
create function public.cancel_subscription(target uuid, reason text default null) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = '42501';
  end if;

  update public.subscriptions
  set canceled_at = now(),
      cancel_reason = left(coalesce(nullif(trim(reason), ''), 'Abonnement annulé par Janga Explorer.'), 300),
      updated_at = now()
  where user_id = target and canceled_at is null;
  return case when found then 'ok' else 'not_found' end;
end;
$$;

-- Réactive un abonnement annulé : la période déjà payée (si elle n'est pas finie) redevient utilisable.
create function public.reactivate_subscription(target uuid) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = '42501';
  end if;

  update public.subscriptions
  set canceled_at = null, cancel_reason = null, updated_at = now()
  where user_id = target and canceled_at is not null;
  return case when found then 'ok' else 'not_found' end;
end;
$$;

-- Abonnements avec l'e-mail et le nom de l'établissement (que les administrateurs ne lisent pas directement :
-- auth.users et pro_requests leur sont fermés). Vide pour tout autre qu'un administrateur.
create function public.list_subscriptions()
returns table (
  user_id uuid,
  email text,
  company text,
  whatsapp text,
  phone text,
  pro_approved boolean,
  trial_ends_at timestamptz,
  paid_until timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select s.user_id, u.email::text, coalesce(b.name, r.company), b.whatsapp, b.phone,
         coalesce(r.status = 'approved', false),
         s.trial_ends_at, s.paid_until, s.canceled_at, s.cancel_reason, s.created_at
  from public.subscriptions s
  join auth.users u on u.id = s.user_id
  left join public.pro_requests r on r.user_id = s.user_id
  left join public.businesses b on b.owner_id = s.user_id
  where public.is_admin()
  order by coalesce(b.name, r.company);
$$;

revoke execute on function public.has_active_subscription() from public, anon;
revoke execute on function public.review_subscription_payment(uuid, boolean, text) from public, anon;
revoke execute on function public.grant_subscription_days(uuid, integer) from public, anon;
revoke execute on function public.cancel_subscription(uuid, text) from public, anon;
revoke execute on function public.reactivate_subscription(uuid) from public, anon;
revoke execute on function public.list_subscriptions() from public, anon;
grant execute on function public.has_active_subscription() to authenticated;
grant execute on function public.review_subscription_payment(uuid, boolean, text) to authenticated;
grant execute on function public.grant_subscription_days(uuid, integer) to authenticated;
grant execute on function public.cancel_subscription(uuid, text) to authenticated;
grant execute on function public.reactivate_subscription(uuid) to authenticated;
grant execute on function public.list_subscriptions() to authenticated;

-- ---------------------------------------------------------------------------
-- Offres : publier demande un abonnement actif
-- ---------------------------------------------------------------------------
drop policy "offers_insert_own" on public.offers;
create policy "offers_insert_own" on public.offers
  for insert to authenticated
  with check (
    public.owns_business(business_id)
    and public.is_approved_pro()
    and public.has_active_subscription()
    and status = 'pending'
    and not is_verified
    and verified_at is null
    and not is_featured
    and rejection_reason is null
  );

-- Même garde-fou que 20261015000005, plus : un pro sans abonnement actif ne renvoie plus d'offre en validation
-- (modification du contenu ou nouvelle soumission). Retirer une offre reste toujours possible.
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

  if new.status = 'pending' and not public.has_active_subscription() then
    raise exception 'Abonnement requis pour publier' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Preuves de paiement : bucket privé. Chaque pro écrit dans son dossier (<user_id>/...) et relit ses preuves ;
-- les administrateurs les lisent toutes (liens signés). Pas de modification ni de suppression : c'est une pièce justificative.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "payment_proofs_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "payment_proofs_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );
