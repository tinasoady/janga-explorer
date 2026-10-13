-- Janga Explorer : schéma initial (MVP côté visiteur)

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,                       -- "Restaurant partenaire", "Hôtel partenaire"...
  whatsapp text,                            -- format international sans "+", ex : 261341234567
  phone text,
  rating numeric(2, 1) check (rating between 0 and 5),
  review_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('manger', 'dormir', 'activites', 'sorties')),
  image_url text not null,
  price_original integer check (price_original > 0),
  price_offer integer not null check (price_offer >= 0),
  conditions text,
  location text not null,
  valid_until date not null,                -- dernier jour de validité (inclus)
  is_verified boolean not null default false,
  verified_at date,                         -- date de la dernière vérification auprès du pro
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create index offers_active_idx on public.offers (status, valid_until);

-- Lecture publique uniquement : les écritures passent par le tableau de bord Supabase
-- (ou plus tard par l'espace pro, avec ses propres politiques).
alter table public.businesses enable row level security;
alter table public.offers enable row level security;

create policy "Lecture publique des établissements"
  on public.businesses for select
  to anon, authenticated
  using (true);

create policy "Lecture publique des offres publiées"
  on public.offers for select
  to anon, authenticated
  using (status = 'published');
