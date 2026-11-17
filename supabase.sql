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

-- ===== Žebříček (vidí jen přihlášení hráči; kdo má v postupu hideLb=true, není vidět) =====
create or replace function public.trener_leaderboard(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid;
begin
  select player_id into me from player_sessions where token = p_token;
  if me is null then raise exception 'bad_token'; end if;
  return coalesce((select json_agg(x order by x.week desc, x.xp desc) from (
    select p.username, (p.id = me) as is_me,
           coalesce((pr.data->>'xp')::bigint, 0) as xp,
           coalesce((select sum(v::bigint) from jsonb_each_text(coalesce(pr.data->'xpDay','{}'::jsonb)) as d(k, v)
                     where k >= to_char(now() - interval '6 days', 'YYYY-MM-DD')), 0) as week,
           coalesce((pr.data->>'hideLb')::boolean, false) as hidden
      from players p left join player_progress pr on pr.player_id = p.id
     where p.id = me or coalesce((pr.data->>'hideLb')::boolean, false) = false) x), '[]'::json);
end $$;
revoke all on function public.trener_leaderboard(text) from public;
grant execute on function public.trener_leaderboard(text) to anon, authenticated;

-- ===== Udržování databáze vzhůru (volá ji automatická úloha na GitHubu každé 2 dny) =====
create or replace function public.trener_ping()
returns timestamptz language sql security definer set search_path = public as $$ select now() $$;
revoke all on function public.trener_ping() from public;
grant execute on function public.trener_ping() to anon, authenticated;

revoke all on function public.trener_register(text, text), public.trener_login(text, text),
  public.trener_load(text), public.trener_save(text, jsonb), public.trener_logout(text) from public;
grant execute on function public.trener_register(text, text), public.trener_login(text, text),
  public.trener_load(text), public.trener_save(text, jsonb), public.trener_logout(text) to anon, authenticated;

-- ===== Zprávy od správce hráčům (ukážou se hráči na displeji, dokud je nepotvrdí) =====
create table if not exists public.player_messages (
  id          bigserial primary key,
  player_id   uuid not null references public.players (id) on delete cascade,
  from_user   text not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz
);
alter table public.player_messages enable row level security;
-- odpovědi hráčů správci: řádek s from_player = true (player_id = kdo píše)
alter table public.player_messages add column if not exists from_player boolean not null default false;
alter table public.player_messages add column if not exists reply_to bigint;

create or replace function public.trener_admin_message(p_token text, p_user text, p_body text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare me uuid; pid uuid; fu text;
begin
  me := trener_admin_check(p_token);
  if length(trim(coalesce(p_body,''))) = 0 or length(p_body) > 500 then raise exception 'bad_message'; end if;
  select id into pid from players where username = lower(trim(p_user));
  if pid is null then raise exception 'no_user'; end if;
  select username into fu from players where id = me;
  insert into player_messages (player_id, from_user, body) values (pid, fu, trim(p_body));
end $$;

create or replace function public.trener_messages(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  select player_id into pid from player_sessions where token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  return coalesce((select json_agg(json_build_object('id', id, 'from', from_user, 'body', body, 'at', created_at) order by id)
    from player_messages where player_id = pid and seen_at is null and not from_player), '[]'::json);
end $$;

create or replace function public.trener_message_seen(p_token text, p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  select player_id into pid from player_sessions where token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  update player_messages set seen_at = now() where id = p_id and player_id = pid and seen_at is null;
end $$;

revoke all on function public.trener_admin_message(text, text, text), public.trener_messages(text),
  public.trener_message_seen(text, bigint) from public;
grant execute on function public.trener_admin_message(text, text, text), public.trener_messages(text),
  public.trener_message_seen(text, bigint) to anon, authenticated;

-- Hráč odpoví na zprávu (dostane ji správce)
create or replace function public.trener_reply(p_token text, p_body text, p_reply_to bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid; u text;
begin
  select s.player_id, p.username into pid, u from player_sessions s join players p on p.id = s.player_id where s.token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  if length(trim(coalesce(p_body,''))) = 0 or length(p_body) > 500 then raise exception 'bad_message'; end if;
  if (select count(*) from player_messages where player_id = pid and from_player and created_at > now() - interval '1 hour') >= 30 then raise exception 'too_many'; end if;
  insert into player_messages (player_id, from_user, body, from_player, reply_to) values (pid, u, trim(p_body), true, p_reply_to);
end $$;

-- Správce: odpovědi od hráčů (posledních 100)
create or replace function public.trener_admin_inbox(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  perform trener_admin_check(p_token);
  return coalesce((select json_agg(x order by x.id desc) from (
    select m.id, m.from_user as "from", m.body, m.created_at as at, m.seen_at as seen,
           (select r.body from player_messages r where r.id = m.reply_to) as re
      from player_messages m where m.from_player order by m.id desc limit 100) x), '[]'::json);
end $$;

create or replace function public.trener_admin_inbox_seen(p_token text, p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform trener_admin_check(p_token);
  update player_messages set seen_at = now() where id = p_id and from_player and seen_at is null;
end $$;

revoke all on function public.trener_reply(text, text, bigint), public.trener_admin_inbox(text),
  public.trener_admin_inbox_seen(text, bigint) from public;
grant execute on function public.trener_reply(text, text, bigint), public.trener_admin_inbox(text),
  public.trener_admin_inbox_seen(text, bigint) to anon, authenticated;

-- Udělej ze svého účtu správce (uprav jméno) – pak uvidíš na webu tlačítko „Vývojář“:
-- update public.players set is_admin = true where username = 'tvojejmeno';
-- Pro správce: nové heslo pro hráče (spusť ručně, uprav jméno a heslo):
-- update public.players set pass_hash = extensions.crypt('noveheslo', extensions.gen_salt('bf')) where username = 'jmeno';
-- Smazání hráče i s postupem:
-- delete from public.players where username = 'jmeno';

-- ===== Varianty od hráčů (#varianty) =====
-- Hráč přidá variantu, která v kurzech není. Web ji předem zkontroluje Stockfishem a zařadí
-- podle názvů zahájení z Lichess. Stejnou variantu může „přidat“ víc hráčů = hlas (popularita).
create table if not exists public.community_variants (
  id          bigserial primary key,
  moves       text not null,                 -- tahy v SAN oddělené mezerou (1. tah bílého první)
  side        text not null check (side in ('w','b')),
  eco         text,
  opening     text,
  added_by    uuid references public.players (id) on delete set null,
  created_at  timestamptz not null default now(),
  sf_bad      int not null default 0,        -- kolik tahů hráče Stockfish označil jako chybu
  sf_note     text,
  hidden      boolean not null default false,
  featured    boolean not null default false,
  unique (moves, side)                       -- stejné tahy za bílé a za černé jsou dvě různé varianty
);
create table if not exists public.community_variant_votes (
  variant_id  bigint not null references public.community_variants (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (variant_id, player_id)
);
create index if not exists community_variant_votes_at on public.community_variant_votes (created_at);
alter table public.community_variants      enable row level security;
alter table public.community_variant_votes enable row level security;
revoke all on public.community_variants, public.community_variant_votes from anon, authenticated;

-- Přidat variantu (nebo k existující přidat hlas). Vrátí {id, created}
create or replace function public.trener_cv_add(p_token text, p_moves text, p_side text, p_eco text, p_opening text, p_sf_bad int, p_sf_note text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid; vid bigint; m text; made boolean := false;
begin
  select player_id into pid from player_sessions where token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  m := regexp_replace(trim(coalesce(p_moves,'')), '\s+', ' ', 'g');
  if length(m) < 3 or length(m) > 500 or m !~ '^[a-hKQRBNOx0-9=+#-]+( [a-hKQRBNOx0-9=+#-]+){1,59}$' then raise exception 'bad_moves'; end if;
  if p_side not in ('w','b') then raise exception 'bad_side'; end if;
  if (select count(*) from community_variants where added_by = pid and created_at > now() - interval '1 hour') >= 30 then raise exception 'too_many'; end if;
  select id into vid from community_variants where moves = m and side = p_side;
  if vid is null then
    insert into community_variants (moves, side, eco, opening, added_by, sf_bad, sf_note)
      values (m, p_side, left(p_eco, 8), left(p_opening, 160), pid, greatest(0, least(coalesce(p_sf_bad,0), 60)), left(p_sf_note, 300))
      returning id into vid;
    made := true;
  end if;
  insert into community_variant_votes (variant_id, player_id) values (vid, pid) on conflict do nothing;
  return json_build_object('id', vid, 'created', made);
end $$;

-- „Taky to hraju“ zapnout / vypnout
create or replace function public.trener_cv_vote(p_token text, p_id bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  select player_id into pid from player_sessions where token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  if p_on then insert into community_variant_votes (variant_id, player_id) select p_id, pid where exists (select 1 from community_variants where id = p_id) on conflict do nothing;
  else delete from community_variant_votes where variant_id = p_id and player_id = pid; end if;
end $$;

-- Seznam variant (správce vidí i skryté)
create or replace function public.trener_cv_list(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid; adm boolean;
begin
  select s.player_id, p.is_admin into pid, adm from player_sessions s join players p on p.id = s.player_id where s.token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  return coalesce((select json_agg(x order by x.id desc) from (
    select v.id, v.moves, v.side, v.eco, v.opening, v.created_at as at, v.sf_bad, v.sf_note, v.hidden, v.featured,
           (select username from players where id = v.added_by) as by,
           (select count(*) from community_variant_votes c where c.variant_id = v.id) as votes,
           (select count(*) from community_variant_votes c where c.variant_id = v.id and c.created_at > now() - interval '7 days') as votes7,
           exists (select 1 from community_variant_votes c where c.variant_id = v.id and c.player_id = pid) as mine
      from community_variants v where adm or not v.hidden order by v.id desc limit 2000) x), '[]'::json);
end $$;

-- Správce: skrýt / doporučit
create or replace function public.trener_admin_cv_set(p_token text, p_id bigint, p_hidden boolean, p_featured boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform trener_admin_check(p_token);
  update community_variants set hidden = coalesce(p_hidden, hidden), featured = coalesce(p_featured, featured) where id = p_id;
end $$;

revoke all on function public.trener_cv_add(text, text, text, text, text, int, text), public.trener_cv_vote(text, bigint, boolean),
  public.trener_cv_list(text), public.trener_admin_cv_set(text, bigint, boolean, boolean) from public;
grant execute on function public.trener_cv_add(text, text, text, text, text, int, text), public.trener_cv_vote(text, bigint, boolean),
  public.trener_cv_list(text), public.trener_admin_cv_set(text, bigint, boolean, boolean) to anon, authenticated;
