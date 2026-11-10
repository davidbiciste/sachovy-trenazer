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
  return json_build_object('username', u, 'data', d);
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

revoke all on function public.trener_register(text, text), public.trener_login(text, text),
  public.trener_load(text), public.trener_save(text, jsonb), public.trener_logout(text) from public;
grant execute on function public.trener_register(text, text), public.trener_login(text, text),
  public.trener_load(text), public.trener_save(text, jsonb), public.trener_logout(text) to anon, authenticated;

-- Pro správce: nové heslo pro hráče (spusť ručně, uprav jméno a heslo):
-- update public.players set pass_hash = extensions.crypt('noveheslo', extensions.gen_salt('bf')) where username = 'jmeno';
-- Smazání hráče i s postupem:
-- delete from public.players where username = 'jmeno';
