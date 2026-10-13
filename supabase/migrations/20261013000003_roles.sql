-- Janga Explorer : rôle « superadmin » et gestion des administrateurs.
-- À exécuter après 20261013000002_accounts.sql.
--
-- Rôles :
--   user        compte ordinaire (le seul rôle qu'une inscription peut créer)
--   admin       valide, crée et modifie les offres et établissements
--   superadmin  tout ce que fait un admin, et nomme ou retire les admins
--
-- Le rôle ne se modifie jamais depuis l'application directement : la table profiles n'a aucune policy
-- d'écriture. Seules les fonctions ci-dessous (réservées au superadmin) et l'éditeur SQL peuvent le changer.

alter table public.profiles
  drop constraint profiles_role_check,
  add constraint profiles_role_check check (role in ('user', 'admin', 'superadmin'));

-- Un superadmin est aussi administrateur : toutes les policies existantes s'appliquent à lui.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'superadmin')
  );
$$;

create function public.is_superadmin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'superadmin');
$$;

-- Liste des administrateurs avec leur e-mail (que la table profiles ne contient pas). Vide pour tout autre que superadmin.
create function public.list_admins() returns table (id uuid, email text, role text)
language sql stable security definer set search_path = '' as $$
  select p.id, u.email::text, p.role
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role in ('admin', 'superadmin') and public.is_superadmin()
  order by p.role desc, u.email;
$$;

-- Nomme (make_admin = true) ou retire (false) un administrateur. Renvoie 'ok', 'not_found' ou 'is_superadmin'.
create function public.set_admin(target_email text, make_admin boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare
  target_id uuid;
  target_role text;
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = '42501';
  end if;

  select id into target_id from auth.users where lower(email) = lower(trim(target_email));
  if target_id is null then
    return 'not_found';
  end if;

  select role into target_role from public.profiles where id = target_id;
  if target_role = 'superadmin' then
    return 'is_superadmin'; -- un superadmin ne se rétrograde pas depuis l'application
  end if;

  insert into public.profiles (id, role)
  values (target_id, case when make_admin then 'admin' else 'user' end)
  on conflict (id) do update set role = excluded.role;
  return 'ok';
end;
$$;

-- Ces fonctions ne sont appelables que par des comptes connectés (et refusent tout sauf le superadmin).
revoke execute on function public.list_admins() from public, anon;
revoke execute on function public.set_admin(text, boolean) from public, anon;
grant execute on function public.list_admins() to authenticated;
grant execute on function public.set_admin(text, boolean) to authenticated;
