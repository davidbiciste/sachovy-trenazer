# Šachový trenažér – pokyny pro Claude

Odpovídej česky, jednoduše (majitel není programátor).

## Jak web funguje
- Statický web: `index.html` (celá aplikace v jednom souboru), `config.js` (veřejné údaje Supabase).
- Hosting: **Render** (Static Site) staví web automaticky z větve `main`. Push do `main` = za 1–2 min je změna na webu.
- Účty a postup hráčů: **Supabase**, projekt `ylcybuglsjdcoklnaijl` („ŠACHOVÝ TRENAŽER“).
- Databáze se mění jen přes `supabase.sql` (spustit se dá opakovaně, nic nemaže).

## Pravidla
- Změny commitni a **pushni rovnou do `main`** (majitel to tak chce), pokud neřekne jinak.
- Před pushem zkontroluj, že se `index.html` načte bez chyb v konzoli (Playwright/Chromium je k dispozici).
- Když měníš databázi, uprav `supabase.sql` a spusť ho přes Supabase Management API:
  ```bash
  python3 -c "import json;print(json.dumps({'query':open('supabase.sql').read()}))" > /tmp/q.json
  curl -sS -X POST https://api.supabase.com/v1/projects/ylcybuglsjdcoklnaijl/database/query \
    -H "Authorization: Bearer proxy-injected" -H "Content-Type: application/json" --data @/tmp/q.json
  ```
  Token doplňuje síťová proxy prostředí sama (`proxy-injected` je jen zástupná hodnota). Nikdy nežádej token do chatu.
- Nikdy nepoužívej ani nevkládej `service_role` / secret klíč do webu.

## Účty
- Správce: `davidbiciste` (`players.is_admin = true`). Vývojářská stránka: tlačítko „Vývojář“ nahoře nebo `#dev`.
- Admin funkce v DB: `trener_admin_players`, `trener_admin_set_password`, `trener_admin_delete` – všechny ověřují token správce.
