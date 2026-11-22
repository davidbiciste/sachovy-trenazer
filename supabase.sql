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

-- ===== Žebříček s kamarády 2 (trener_lb2) byl 18. 11. 2026 zrušen (veřejný žebříček nechceme) =====
drop function if exists public.trener_lb2(text);

-- ===== Hra s kamarádem naživo (#hra, 19. 11. 2026) =====
-- Tahy kontroluje prohlížeč (chess.js), databáze hlídá pořadí tahů a hodiny (čas se počítá podle času serveru).
create table if not exists public.live_games (
  id            bigserial primary key,
  code          text not null unique,
  creator       uuid not null references public.players (id) on delete cascade,
  creator_color text not null default 'r',          -- w / b / r (náhodně)
  white         uuid references public.players (id) on delete set null,
  black         uuid references public.players (id) on delete set null,
  base_ms       int  not null default 300000,       -- 0 = bez času
  inc_ms        int  not null default 0,
  moves         text not null default '',           -- tahy v UCI oddělené mezerou
  ply           int  not null default 0,
  fen           text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  wtime         int  not null default 0,
  btime         int  not null default 0,
  last_at       timestamptz,
  status        text not null default 'wait',       -- wait / play / end
  result        text,                               -- 1-0 / 0-1 / 1/2-1/2 / null (zrušená)
  reason        text,                               -- mate, resign, time, draw, stalemate, repetition, material, fifty, abort
  draw_offer    text,                               -- w / b
  rematch_offer text,                               -- w / b
  rematch       text,                               -- kód odvety
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists live_games_white_idx on public.live_games (white, updated_at desc);
create index if not exists live_games_black_idx on public.live_games (black, updated_at desc);
create index if not exists live_games_creator_idx on public.live_games (creator, created_at desc);
alter table public.live_games enable row level security;
-- výzva konkrétnímu hráči v aplikaci (22. 11. 2026): invited = koho zakladatel vyzval, jen ten může přisednout
alter table public.live_games add column if not exists invited uuid references public.players (id) on delete cascade;
create index if not exists live_games_invited_idx on public.live_games (invited, status);
-- férová hra (22. 11. 2026): odchody z okna během vlastního tahu, čas na tahy, nahlášený podvod
alter table public.live_games add column if not exists blur_w int not null default 0;
alter table public.live_games add column if not exists blur_b int not null default 0;
alter table public.live_games add column if not exists away_w int not null default 0;   -- ms mimo okno
alter table public.live_games add column if not exists away_b int not null default 0;
alter table public.live_games add column if not exists mtimes text not null default ''; -- ms na každý půltah podle serveru
alter table public.live_games add column if not exists flag text;                         -- illegal / fakeend
alter table public.live_games add column if not exists flag_by text;                      -- w / b (kdo nahlásil)
revoke all on public.live_games from anon, authenticated;

create or replace function public.trener_live_pid(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid;
begin
  select player_id into pid from player_sessions where token = p_token;
  if pid is null then raise exception 'bad_token'; end if;
  return pid;
end $$;

-- konec na čas: kdo propadl, prohrál; když soupeř má jen krále, je to remíza
create or replace function public.trener_live_flag(g public.live_games)
returns public.live_games language plpgsql security definer set search_path = public, extensions as $$
declare stm text; left_ms int; board text;
begin
  if g.status <> 'play' or g.base_ms = 0 or g.ply < 2 or g.last_at is null then return g; end if;
  stm := case when g.ply % 2 = 0 then 'w' else 'b' end;
  left_ms := (case when stm = 'w' then g.wtime else g.btime end) - (extract(epoch from (now() - g.last_at)) * 1000)::int;
  if left_ms > 0 then return g; end if;
  board := split_part(g.fen, ' ', 1);
  if stm = 'w' then g.wtime := 0; else g.btime := 0; end if;
  g.status := 'end'; g.reason := 'time'; g.draw_offer := null;
  if (stm = 'w' and regexp_replace(board, '[^pnbrq]', '', 'g') = '') or (stm = 'b' and regexp_replace(board, '[^PNBRQ]', '', 'g') = '') then
    g.result := '1/2-1/2';
  else
    g.result := case when stm = 'w' then '0-1' else '1-0' end;
  end if;
  update live_games set wtime = g.wtime, btime = g.btime, status = g.status, reason = g.reason, result = g.result, draw_offer = null, updated_at = now() where id = g.id;
  return g;
end $$;

create or replace function public.trener_live_json(g public.live_games, pid uuid)
returns json language sql security definer set search_path = public, extensions as $$
  select json_build_object(
    'code', g.code, 'status', g.status, 'result', g.result, 'reason', g.reason,
    'base', g.base_ms, 'inc', g.inc_ms, 'moves', g.moves, 'ply', g.ply, 'fen', g.fen,
    'wtime', g.wtime, 'btime', g.btime,
    'last', case when g.last_at is null then null else (extract(epoch from g.last_at) * 1000)::bigint end,
    'now', (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'wname', (select username from players where id = g.white),
    'bname', (select username from players where id = g.black),
    'cname', (select username from players where id = g.creator),
    'iname', (select username from players where id = g.invited),
    'ccolor', g.creator_color,
    'me', case when pid = g.white then 'w' when pid = g.black then 'b' when pid = g.creator and g.status = 'wait' then 'c' else null end,
    'draw', g.draw_offer, 'remo', g.rematch_offer, 'rematch', g.rematch,
    'blur_w', g.blur_w, 'blur_b', g.blur_b, 'away_w', g.away_w, 'away_b', g.away_b, 'mtimes', g.mtimes, 'flag', g.flag, 'flag_by', g.flag_by)
$$;

-- nová hra: p_base a p_inc v sekundách (p_base 0 = bez času), p_color w / b / r
create or replace function public.trener_live_create(p_token text, p_base int, p_inc int, p_color text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token); c text; g live_games; i int;
begin
  if p_color not in ('w','b','r') then raise exception 'bad_color'; end if;
  if p_base < 0 or p_base > 10800 or p_inc < 0 or p_inc > 180 then raise exception 'bad_time'; end if;
  if (select count(*) from live_games where creator = pid and created_at > now() - interval '1 hour') >= 40 then raise exception 'too_many'; end if;
  delete from live_games where status = 'wait' and created_at < now() - interval '2 days';
  for i in 1..20 loop
    c := (select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1), '') from generate_series(1, 7));
    exit when not exists (select 1 from live_games where code = c);
  end loop;
  insert into live_games (code, creator, creator_color, base_ms, inc_ms, wtime, btime)
    values (c, pid, p_color, p_base * 1000, p_inc * 1000, p_base * 1000, p_base * 1000) returning * into g;
  return trener_live_json(g, pid);
end $$;

-- otevření odkazu: když hra čeká a otevře ji někdo jiný než zakladatel, přisedne a hra začne
create or replace function public.trener_live_join(p_token text, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token); g live_games; cw boolean;
begin
  select * into g from live_games where code = lower(trim(p_code)) for update;
  if g.id is null then raise exception 'not_found'; end if;
  if g.status = 'wait' and g.invited is not null and pid <> g.creator and pid <> g.invited then raise exception 'not_invited'; end if;
  if g.status = 'wait' and pid <> g.creator then
    cw := case g.creator_color when 'w' then true when 'b' then false else random() < 0.5 end;
    g.white := case when cw then g.creator else pid end;
    g.black := case when cw then pid else g.creator end;
    g.status := 'play'; g.last_at := now();
    update live_games set white = g.white, black = g.black, status = 'play', last_at = now(), updated_at = now() where id = g.id;
  end if;
  g := trener_live_flag(g);
  return trener_live_json(g, pid);
end $$;

create or replace function public.trener_live_state(p_token text, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token); g live_games;
begin
  select * into g from live_games where code = lower(trim(p_code));
  if g.id is null then raise exception 'not_found'; end if;
  g := trener_live_flag(g);
  return trener_live_json(g, pid);
end $$;

-- tah: p_ply = kolikátý půltah to je (od 0), p_over = konec partie podle prohlížeče (mate, stalemate, repetition, material, fifty)
drop function if exists public.trener_live_move(text, text, int, text, text, text);
create or replace function public.trener_live_move(p_token text, p_code text, p_ply int, p_uci text, p_fen text, p_over text, p_blur int default 0, p_away int default 0)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token); g live_games; col text; t int; el int;
begin
  select * into g from live_games where code = lower(trim(p_code)) for update;
  if g.id is null then raise exception 'not_found'; end if;
  g := trener_live_flag(g);
  if g.status <> 'play' then return trener_live_json(g, pid); end if;
  col := case when g.ply % 2 = 0 then 'w' else 'b' end;
  if (col = 'w' and pid is distinct from g.white) or (col = 'b' and pid is distinct from g.black) then raise exception 'not_your_turn'; end if;
  if p_ply <> g.ply then return trener_live_json(g, pid); end if;
  if p_uci !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' or length(coalesce(p_fen,'')) > 100 or g.ply >= 1200 then raise exception 'bad_move'; end if;
  el := greatest(0, (extract(epoch from (now() - coalesce(g.last_at, now()))) * 1000)::int);
  g.mtimes := trim(g.mtimes || ' ' || el);
  if col = 'w' then g.blur_w := g.blur_w + least(greatest(coalesce(p_blur,0),0),50); g.away_w := g.away_w + least(greatest(coalesce(p_away,0),0),el);
  else g.blur_b := g.blur_b + least(greatest(coalesce(p_blur,0),0),50); g.away_b := g.away_b + least(greatest(coalesce(p_away,0),0),el); end if;
  if g.base_ms > 0 and g.ply >= 2 then
    t := (case when col = 'w' then g.wtime else g.btime end) - el + g.inc_ms;
    if col = 'w' then g.wtime := t; else g.btime := t; end if;
  end if;
  g.moves := trim(g.moves || ' ' || p_uci); g.ply := g.ply + 1; g.fen := p_fen; g.last_at := now();
  g.draw_offer := case when g.draw_offer = col then g.draw_offer else null end;
  if p_over in ('mate','stalemate','repetition','material','fifty') then
    g.status := 'end'; g.reason := p_over; g.draw_offer := null;
    g.result := case when p_over = 'mate' then (case when col = 'w' then '1-0' else '0-1' end) else '1/2-1/2' end;
  end if;
  update live_games set moves = g.moves, ply = g.ply, fen = g.fen, last_at = g.last_at, wtime = g.wtime, btime = g.btime,
    draw_offer = g.draw_offer, status = g.status, reason = g.reason, result = g.result,
    mtimes = g.mtimes, blur_w = g.blur_w, blur_b = g.blur_b, away_w = g.away_w, away_b = g.away_b, updated_at = now() where id = g.id;
  return trener_live_json(g, pid);
end $$;

-- akce: resign, draw (nabídnout / přijmout), nodraw (odmítnout), abort (zrušit do prvního tahu černého), rematch (nabídnout / přijmout odvetu)
create or replace function public.trener_live_act(p_token text, p_code text, p_act text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token); g live_games; col text; opp text; n live_games; c text; i int;
begin
  select * into g from live_games where code = lower(trim(p_code)) for update;
  if g.id is null then raise exception 'not_found'; end if;
  g := trener_live_flag(g);
  col := case when pid = g.white then 'w' when pid = g.black then 'b' else null end;
  if p_act = 'decline' and g.status = 'wait' and pid = g.invited then
    update live_games set status = 'end', reason = 'declined', updated_at = now() where id = g.id returning * into g;
    return trener_live_json(g, pid);
  end if;
  if p_act = 'abort' and g.status = 'wait' and pid = g.creator then
    update live_games set status = 'end', reason = 'abort', updated_at = now() where id = g.id returning * into g;
    return trener_live_json(g, pid);
  end if;
  if col is null then raise exception 'not_player'; end if;
  opp := case when col = 'w' then 'b' else 'w' end;
  if p_act in ('illegal','fakeend') and g.flag is null then
    g.flag := p_act; g.flag_by := col;
    if g.status = 'play' or (p_act = 'fakeend' and g.reason in ('mate','stalemate','repetition','material','fifty')) then
      g.status := 'end'; g.result := null; g.reason := 'cheat'; g.draw_offer := null;
    end if;
    update live_games set status = g.status, result = g.result, reason = g.reason, draw_offer = null, flag = g.flag, flag_by = g.flag_by, updated_at = now() where id = g.id;
    return trener_live_json(g, pid);
  end if;
  if g.status = 'play' then
    if p_act = 'resign' then
      g.status := 'end'; g.reason := 'resign'; g.result := case when col = 'w' then '0-1' else '1-0' end; g.draw_offer := null;
    elsif p_act = 'abort' and g.ply < 2 then
      g.status := 'end'; g.reason := 'abort'; g.result := null; g.draw_offer := null;
    elsif p_act = 'draw' then
      if g.draw_offer = opp then g.status := 'end'; g.reason := 'draw'; g.result := '1/2-1/2'; g.draw_offer := null;
      else g.draw_offer := col; end if;
    elsif p_act = 'nodraw' and g.draw_offer = opp then
      g.draw_offer := null;
    end if;
  elsif g.status = 'end' and p_act = 'rematch' and g.rematch is null then
    if g.rematch_offer = opp then
      for i in 1..20 loop
        c := (select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1), '') from generate_series(1, 7));
        exit when not exists (select 1 from live_games where code = c);
      end loop;
      insert into live_games (code, creator, creator_color, white, black, base_ms, inc_ms, wtime, btime, status, last_at)
        values (c, pid, col, g.black, g.white, g.base_ms, g.inc_ms, g.base_ms, g.base_ms, 'play', now()) returning * into n;
      g.rematch := c; g.rematch_offer := null;
    else
      g.rematch_offer := col;
    end if;
  elsif g.status = 'end' and p_act = 'norematch' then
    g.rematch_offer := null;
  end if;
  update live_games set status = g.status, reason = g.reason, result = g.result, draw_offer = g.draw_offer,
    rematch_offer = g.rematch_offer, rematch = g.rematch, updated_at = now() where id = g.id;
  return trener_live_json(g, pid);
end $$;

-- moje poslední hry (rozehrané nahoře)
create or replace function public.trener_live_mine(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token);
begin
  return coalesce((select json_agg(x) from (
    select g.code, g.status, g.result, g.reason, g.base_ms as base, g.inc_ms as inc, g.ply, g.updated_at as at,
           case when pid = g.white then 'w' when pid = g.black then 'b' else 'c' end as me,
           coalesce((select username from players where id = case when pid = g.white then g.black else g.white end), (select username from players where id = g.invited)) as opp
      from live_games g
     where (g.white = pid or g.black = pid or (g.creator = pid and g.status = 'wait'))
       and not (g.status = 'end' and g.reason in ('abort','declined'))
     order by (g.status = 'end'), g.updated_at desc limit 12) x), '[]'::json);
end $$;

revoke all on function public.trener_live_pid(text), public.trener_live_flag(public.live_games), public.trener_live_json(public.live_games, uuid) from public, anon, authenticated;
revoke all on function public.trener_live_create(text, int, int, text), public.trener_live_join(text, text), public.trener_live_state(text, text),
  public.trener_live_move(text, text, int, text, text, text, int, int), public.trener_live_act(text, text, text), public.trener_live_mine(text) from public;
grant execute on function public.trener_live_create(text, int, int, text), public.trener_live_join(text, text), public.trener_live_state(text, text),
  public.trener_live_move(text, text, int, text, text, text, int, int), public.trener_live_act(text, text, text), public.trener_live_mine(text) to anon, authenticated;

-- vyzvat hráče podle jména (v aplikaci mu vyskočí pozvánka)
create or replace function public.trener_live_invite(p_token text, p_user text, p_base int, p_inc int, p_color text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token); oid uuid; j json;
begin
  select id into oid from players where username = lower(trim(p_user));
  if oid is null then raise exception 'no_user'; end if;
  if oid = pid then raise exception 'self'; end if;
  update live_games set status = 'end', reason = 'abort', updated_at = now() where creator = pid and invited = oid and status = 'wait';
  j := trener_live_create(p_token, p_base, p_inc, p_color);
  update live_games set invited = oid where code = j->>'code';
  return trener_live_state(p_token, j->>'code');
end $$;

-- výzvy pro mě (čekající, posledních 24 hodin)
create or replace function public.trener_live_invites(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token);
begin
  return coalesce((select json_agg(x) from (
    select g.code, p.username as "from", g.base_ms as base, g.inc_ms as inc, g.creator_color as cc, g.created_at as at
      from live_games g join players p on p.id = g.creator
     where g.invited = pid and g.status = 'wait' and g.created_at > now() - interval '1 day'
     order by g.created_at desc limit 5) x), '[]'::json);
end $$;

-- s kým jsem naposledy hrál (návrhy jmen pro výzvu)
create or replace function public.trener_live_friends(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := trener_live_pid(p_token);
begin
  return coalesce((select json_agg(u) from (
    select p.username as u, max(g.updated_at) as at
      from live_games g join players p on p.id = case when g.white = pid then g.black when g.black = pid then g.white else g.invited end
     where (g.white = pid or g.black = pid or g.creator = pid) and p.id <> pid
     group by p.username order by max(g.updated_at) desc limit 8) x), '[]'::json);
end $$;

revoke all on function public.trener_live_invite(text, text, int, int, text), public.trener_live_invites(text), public.trener_live_friends(text) from public;
grant execute on function public.trener_live_invite(text, text, int, int, text), public.trener_live_invites(text), public.trener_live_friends(text) to anon, authenticated;
