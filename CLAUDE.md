# Šachový trenažér – pokyny pro Claude

Odpovídej česky, jednoduše (majitel není programátor).

## Jak web funguje
- Statický web: `index.html` (celá aplikace v jednom souboru), `config.js` (veřejné údaje Supabase).
- `engine/`: Stockfish 17.1 lite (WASM, běží v prohlížeči hráče) + `chess.js` (pravidla pro volnou hru). Engine se načte až v trenažéru. Lokální test potřebuje HTTP server (`python3 -m http.server`), z `file://` Worker nefunguje.
- Stránky přes hash: `#` přehled kurzů, `#<id kurzu>` kurz, `#profil`, `#hledat` (najít variantu podle tahů), `#pasti`, `#dev`.
- Hosting: **Render** (Static Site) staví web automaticky z větve `main`. Push do `main` = za 1–2 min je změna na webu.
- Účty a postup hráčů: **Supabase**, projekt `ylcybuglsjdcoklnaijl` („ŠACHOVÝ TRENAŽER“).
- Databáze se mění jen přes `supabase.sql` (spustit se dá opakovaně, nic nemaže).

## Pravidla
- Při každé změně webu zvyš `APP_VERSION` v `index.html` (ukazuje se v patičce) a při změně `sw.js` i `VERSION` v něm.
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

## Design „Turnajový sál“
- Barvy jen přes CSS proměnné v `:root` (světlý) a `@media (prefers-color-scheme:dark)` (tmavý). Zeď sálu `--bg`, papír `--bg-2`, grafit `--fg`, zelená hodin `--accent`/`--btn`, červený praporek `--bad`, mosaz `--gold`, ořech `--frame`.
- Písma: nadpisy a čísla Barlow Semi Condensed, text Source Sans 3. Žádné Inter/Roboto/Open Sans, žádné patkové nadpisy na krémovém pozadí.
- Odvaha jen na jednom místě: ořechový rám šachovnice. Zbytek tichý: dlaždice bez stínů, žádné versálkové nadpisky, žádné „→“ za tlačítky, žádná emoji, žádné „A · B · C“ na hlavních místech.
- Stejná akce = stejné jméno (Naučit, Procvičit, Drill, Další past). Po změně vzhledu screenshot mobil + desktop, světlý + tmavý.
- Přepínač vzhledu pro správce: tlačítko „Vzhled“ nahoře (nebo `?design=sal|klub|kazeta|orig`). Vzhledy jsou ve třídách na `<html>`: `d-sal` (výchozí, vidí všichni), `d-klub d-klubc`, `d-sal navrh` (kazeta), `d-orig`.
- Zálohy vzhledu: větve `zaloha-pred-designem` (tmavý původní) a `zaloha-sachovy-klub` (krémový).
