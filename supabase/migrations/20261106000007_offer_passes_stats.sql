-- Janga Explorer : publication à la durée (sans abonnement) et statistiques des offres.
-- À exécuter après 20261016000006_subscriptions.sql.
--
-- Publication à la durée : un pro qui ne veut pas (ou ne peut pas) payer l'abonnement mensuel, par exemple pour un
-- événement de quelques jours, paie seulement les jours de visibilité d'une offre : du jour où il déclare le paiement
-- au dernier jour de validité de l'offre, au prix journalier fixé par le superadmin. Même circuit que l'abonnement :
-- paiement Mobile Money avec preuve, confirmé par un administrateur.
--   * les jours payés sont notés sur l'offre (pass_until) ; tant qu'ils couvrent sa date de fin, le pro peut la
--     (re)mettre en validation sans abonnement ;
--   * une offre dont les jours ne sont pas payés reste en brouillon (draft), jamais publique. À la confirmation du
--     paiement, elle passe en validation comme les autres.
--
-- Statistiques : nombre de vues de la fiche et de clics sur WhatsApp, Appeler et Localisation, par offre et par jour.
-- Le pro voit celles de ses offres. Les compteurs sont indicatifs (pas de compte visiteur, pas de dédoublonnage côté base).

-- ---------------------------------------------------------------------------
-- Prix d'un jour de visibilité
-- ---------------------------------------------------------------------------
alter table public.subscription_settings
  add column day_price integer not null default 1000 check (day_price between 0 and 1000000);

-- ---------------------------------------------------------------------------
-- Offres : jours de visibilité payés
-- ---------------------------------------------------------------------------
alter table public.offers add column pass_until date; -- dernier jour couvert par un paiement à la durée

-- Un pro crée une offre « en attente » s'il est abonné, ou un brouillon à payer sinon.
drop policy "offers_insert_own" on public.offers;
create policy "offers_insert_own" on public.offers
  for insert to authenticated
  with check (
    public.owns_business(business_id)
    and public.is_approved_pro()
    and (status = 'draft' or (status = 'pending' and public.has_active_subscription()))
    and pass_until is null
    and not is_verified
    and verified_at is null
    and not is_featured
    and rejection_reason is null
  );

-- Même garde-fou que 20261016000006, avec deux changements :
--   * un pro ne modifie pas ses jours payés ;
--   * sans abonnement actif, une offre qui part en validation sans jours payés jusqu'à sa date de fin devient un
--     brouillon à payer (au lieu d'être refusée) : le pro choisit alors de payer ses jours ou de s'abonner.
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

  if new.status = 'pending'
     and not public.has_active_subscription()
     and not coalesce(new.pass_until >= new.valid_until, false) then
    new.status := 'draft';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Paiements : abonnement (months) ou jours de visibilité d'une offre (days)
-- ---------------------------------------------------------------------------
alter table public.subscription_payments
  alter column months drop not null,
  add column kind text not null default 'subscription' check (kind in ('subscription', 'offer')),
  add column offer_id uuid references public.offers on delete set null, -- null aussi si l'offre a été supprimée
  -- 90 jours au plus en une fois (MAX_PASS_DAYS dans src/lib/subscription.ts) : au-delà, l'abonnement est plus avantageux.
  add column days integer check (days between 1 and 90),
  add column covers_until date, -- date de fin de l'offre au moment du paiement : dernier jour payé
  add constraint subscription_payments_kind_fields check (
    (kind = 'subscription' and months is not null and days is null and offer_id is null and covers_until is null)
    or (kind = 'offer' and months is null and days is not null and covers_until is not null)
  );

-- Un paiement d'abonnement en attente à la fois par compte, et un paiement en attente à la fois par offre.
drop index public.subscription_payments_one_pending;
create unique index subscription_payments_one_pending
  on public.subscription_payments (user_id) where status = 'pending' and kind = 'subscription';
create unique index subscription_payments_one_pending_offer
  on public.subscription_payments (offer_id) where status = 'pending' and kind = 'offer';

-- Mêmes règles qu'avant, plus : on ne paie la visibilité que de ses propres offres.
drop policy "subscription_payments_insert_own" on public.subscription_payments;
create policy "subscription_payments_insert_own" on public.subscription_payments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_approved_pro()
    and proof_path like ((select auth.uid())::text || '/%')
    and exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid()) and s.canceled_at is null)
    and (
      kind = 'subscription'
      or exists (
        select 1 from public.offers o
        where o.id = subscription_payments.offer_id and public.owns_business(o.business_id)
      )
    )
  );

-- Le montant et le nombre de jours viennent de la base, jamais du navigateur.
-- Jours d'une offre : du lendemain des jours déjà payés (ou d'aujourd'hui) jusqu'à sa date de fin, inclus.
create or replace function public.subscription_payments_prepare() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  settings public.subscription_settings;
  target public.offers;
  today date := (now() at time zone 'Indian/Antananarivo')::date;
begin
  select * into settings from public.subscription_settings;

  if new.kind = 'offer' then
    select * into target from public.offers where id = new.offer_id;
    if not found then
      raise exception 'Offre introuvable' using errcode = '23503';
    end if;
    new.months := null;
    new.covers_until := target.valid_until;
    new.days := target.valid_until - greatest(today, coalesce(target.pass_until + 1, today)) + 1;
    if new.days < 1 then
      raise exception 'Les jours de cette offre sont déjà payés' using errcode = '22023';
    end if;
    new.amount := new.days * settings.day_price;
  else
    new.offer_id := null;
    new.days := null;
    new.covers_until := null;
    new.amount := new.months * settings.monthly_price;
  end if;

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

-- Comme dans 20261016000006, plus le cas d'un paiement de visibilité : à la confirmation, les jours sont ajoutés
-- à l'offre, et un brouillon désormais couvert part en validation.
create or replace function public.review_subscription_payment(target uuid, approve boolean, reason text default null) returns text
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

  if payment.kind = 'offer' then
    update public.subscription_payments
    set status = 'confirmed', reviewed_by = (select auth.uid()), reviewed_at = now()
    where id = target;

    -- Dans un update, les colonnes à droite du « = » ont leur ancienne valeur.
    update public.offers
    set pass_until = greatest(pass_until, payment.covers_until),
        status = case
          when status = 'draft' and greatest(pass_until, payment.covers_until) >= valid_until then 'pending'
          else status
        end
    where id = payment.offer_id;
    return 'ok';
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

-- ---------------------------------------------------------------------------
-- Statistiques des offres : un compteur par offre et par jour (heure de Mahajanga)
-- ---------------------------------------------------------------------------
create table public.offer_stats (
  offer_id uuid not null references public.offers on delete cascade,
  day date not null,
  views integer not null default 0,
  whatsapp integer not null default 0,
  calls integer not null default 0,
  maps integer not null default 0,
  primary key (offer_id, day)
);

alter table public.offer_stats enable row level security;

-- Le pro lit les statistiques de ses offres, les administrateurs toutes. Aucune écriture directe.
create policy "offer_stats_select" on public.offer_stats
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.offers o
      where o.id = offer_stats.offer_id and public.owns_business(o.business_id)
    )
  );

-- Appelée par le site à chaque vue de fiche ou clic de contact. Seules les offres visibles du public comptent ;
-- un événement inconnu est ignoré.
create function public.track_offer_event(target uuid, event text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Indian/Antananarivo')::date;
begin
  if event not in ('view', 'whatsapp', 'call', 'map') then
    return;
  end if;
  if not exists (
    select 1 from public.offers where id = target and status = 'published' and valid_until >= today
  ) then
    return;
  end if;

  insert into public.offer_stats as s (offer_id, day, views, whatsapp, calls, maps)
  values (target, today, (event = 'view')::int, (event = 'whatsapp')::int, (event = 'call')::int, (event = 'map')::int)
  on conflict (offer_id, day) do update
  set views = s.views + excluded.views,
      whatsapp = s.whatsapp + excluded.whatsapp,
      calls = s.calls + excluded.calls,
      maps = s.maps + excluded.maps;
end;
$$;

revoke execute on function public.track_offer_event(uuid, text) from public;
grant execute on function public.track_offer_event(uuid, text) to anon, authenticated;
