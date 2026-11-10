-- Šachový trenažér: účty přes přihlašovací jméno + heslo.
-- Spusť jednou v Supabase: SQL Editor → New query → vlož CELÝ tento soubor → Run.
-- Spustit znovu je bezpečné (nic se nesmaže).
--
-- Tabulky nejsou z webu přístupné napřímo (RLS bez pravidel). Web volá jen
-- funkce níže a ty si samy ověří jméno+heslo nebo přihlašovací token.
-- Hesla se ukládají jen jako bcrypt hash.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  pass_hash   text not null,
  created_at  timestamptz not null default now()
);

alter table public.players add column if not exists is_admin boolean not null default false;

create table if not exists public.player_sessions (
  token       text primary key,
  player_id   uuid not null references public.players (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.player_progress (
  player_id   uuid primary key references public.players (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.login_failures (
  username    text not null,
  at          timestamptz not null default now()
);
create index if not exists login_failures_idx on public.login_failures (username, at);

alter table public.players         enable row level security;
alter table public.player_sessions enable row level security;
alter table public.player_progress enable row level security;
alter table public.login_failures  enable row level security;
revoke all on public.players, public.player_sessions, public.player_progress, public.login_failures from anon, authenticated;

-- Registrace: vrátí {token, username}
create or replace function public.trener_register(p_user text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u text := lower(trim(p_user)); pid uuid; tok text;
begin
  if u !~ '^[a-z0-9_.-]{3,20}$' then raise exception 'bad_username'; end if;
  if length(coalesce(p_pass,'')) < 6 then raise exception 'short_password'; end if;
  if exists (select 1 from players where username = u) then raise exception 'taken'; end if;
  insert into players (username, pass_hash) values (u, crypt(p_pass, gen_salt('bf'))) returning id into pid;
  tok := encode(gen_random_bytes(32), 'hex');
  insert into player_sessions (token, player_id) values (tok, pid);
  return json_build_object('token', tok, 'username', u);
end $$;

-- Přihlášení: vrátí {token, username}. Po 10 chybách za 10 minut na jedno jméno blokuje.
create or replace function public.trener_login(p_user text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u text := lower(trim(p_user)); pid uuid; tok text;
begin
  if (select count(*) from login_failures where username = u and at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many';
  end if;
  select id into pid from players where username = u and pass_hash = crypt(coalesce(p_pass,''), pass_hash);
  if pid is null then
    insert into login_failures (username) values (u);
    delete from login_failures where at < now() - interval '1 day';
    return json_build_object('error', 'bad_login');
  end if;
  tok := encode(gen_random_bytes(32), 'hex');
  insert into player_sessions (token, player_id) values (tok, pid);
  return json_build_object('token', tok, 'username', u);
end $$;

-- Načtení postupu: vrátí {username, data}
create or replace function public.trener_load(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid; u text; d jsonb;
begin
  select s.player_id, p.username into pid, u from player_sessions s join players p on p.id = s.player_id where s.token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  select data into d from player_progress where player_id = pid;
  return json_build_object('username', u, 'data', d, 'is_admin', (select is_admin from players where id = pid));
end $$;

-- Uložení postupu
create or replace function public.trener_save(p_token text, p_data jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  select player_id into pid from player_sessions where token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  if pg_column_size(p_data) > 200000 then raise exception 'too_big'; end if;
  insert into player_progress (player_id, data, updated_at) values (pid, p_data, now())
  on conflict (player_id) do update set data = excluded.data, updated_at = now();
end $$;

-- Odhlášení
create or replace function public.trener_logout(p_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from player_sessions where token = p_token;
end $$;

-- ===== Vývojářská stránka (jen pro účty s is_admin = true) =====
-- Ověří token a vrátí id admina, jinak chyba 'forbidden'.
create or replace function public.trener_admin_check(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  select p.id into pid from player_sessions s join players p on p.id = s.player_id
   where s.token = p_token and p.is_admin;
  if pid is null then raise exception 'forbidden'; end if;
  return pid;
end $$;

-- Seznam hráčů s postupem
create or replace function public.trener_admin_players(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  perform trener_admin_check(p_token);
  return coalesce((select json_agg(x order by x.updated_at desc nulls last) from (
    select p.username, p.is_admin, p.created_at, pr.updated_at, pr.data,
           (select max(s.created_at) from player_sessions s where s.player_id = p.id) as last_login
      from players p left join player_progress pr on pr.player_id = p.id) x), '[]'::json);
end $$;

-- Nové heslo pro hráče (odhlásí ho ze všech zařízení)
create or replace function public.trener_admin_set_password(p_token text, p_user text, p_pass text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  perform trener_admin_check(p_token);
  if length(coalesce(p_pass,'')) < 6 then raise exception 'short_password'; end if;
  update players set pass_hash = crypt(p_pass, gen_salt('bf')) where username = lower(trim(p_user)) returning id into pid;
  if pid is null then raise exception 'no_user'; end if;
  delete from player_sessions where player_id = pid;
end $$;

-- Smazání hráče i s postupem (sám sebe smazat nejde)
create or replace function public.trener_admin_delete(p_token text, p_user text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare me uuid; pid uuid;
begin
  me := trener_admin_check(p_token);
  select id into pid from players where username = lower(trim(p_user));
  if pid is null then raise exception 'no_user'; end if;
  if pid = me then raise exception 'self'; end if;
  delete from players where id = pid;
end $$;

revoke all on function public.trener_admin_check(text) from public, anon, authenticated;
revoke all on function public.trener_admin_players(text), public.trener_admin_set_password(text, text, text),
  public.trener_admin_delete(text, text) from public;
grant execute on function public.trener_admin_players(text), public.trener_admin_set_password(text, text, text),
  public.trener_admin_delete(text, text) to anon, authenticated;

-- ===== Udržování databáze vzhůru (volá ji automatická úloha na GitHubu každé 2 dny) =====
create or replace function public.trener_ping()
returns timestamptz language sql security definer set search_path = public as $$ select now() $$;
revoke all on function public.trener_ping() from public;
grant execute on function public.trener_ping() to anon, authenticated;

revoke all on function public.trener_register(text, text), public.trener_login(text, text),
  public.trener_load(text), public.trener_save(text, jsonb), public.trener_logout(text) from public;
grant execute on function public.trener_register(text, text), public.trener_login(text, text),
  public.trener_load(text), public.trener_save(text, jsonb), public.trener_logout(text) to anon, authenticated;

-- Udělej ze svého účtu správce (uprav jméno) – pak uvidíš na webu tlačítko „Vývojář“:
-- update public.players set is_admin = true where username = 'tvojejmeno';
-- Pro správce: nové heslo pro hráče (spusť ručně, uprav jméno a heslo):
-- update public.players set pass_hash = extensions.crypt('noveheslo', extensions.gen_salt('bf')) where username = 'jmeno';
-- Smazání hráče i s postupem:
-- delete from public.players where username = 'jmeno';
