# Šachový trenažér – pokyny pro Claude

Odpovídej česky, jednoduše (majitel není programátor).

## Jak web funguje
- Statický web: `index.html` (celá aplikace v jednom souboru), `config.js` (veřejné údaje Supabase).
- `engine/`: Stockfish 17.1 lite (WASM, běží v prohlížeči hráče) + `chess.js` (pravidla pro volnou hru). Engine se načte až v trenažéru. Lokální test potřebuje HTTP server (`python3 -m http.server`), z `file://` Worker nefunguje.
- Puzzle `#puzzle` (záložky `#puzzle/urovne|denni|hodnocene|motivy|rush|pasti|chyby`, hraní úrovně `#puzzle/uroven/<n>`, zkouška pro přeskočení obtížnosti `#puzzle/zkouska/<index obtížnosti>`): JS blok „Puzzle (#puzzle)“, režim šachovnice `pq`, stav v `store.pq`. Úlohy z Lichess (CC0) v `puzzles/<pásmo>.txt` (načítají se po pásmech), slavné pasti v zahájení v `PQ_TRAPS` (ověřené chess.js + Stockfish). Staré `#pasti` = záložka „Pasti z kurzů“. `#puzzle/vyber` = Vyber tah pro nováčky (3 možnosti, vysvětlení a varianta), data `puzzles/vyber.json` předem spočítaná Stockfishem (blok „Vyber tah“, stav `store.pq.vy`).
- Boční lišta na počítači ukazuje i seznam kurzů zahájení (`.nxCourses`).
- Stránky přes hash: `#` přehled kurzů, `#<id kurzu>` kurz, `#profil`, `#hledat` (najít variantu podle tahů), `#pasti`, `#koncovky`, `#lekce/<id lekce>` (Lekce strategie podle úrovní nováček / začátečník / nad 1000 / nad 1500 a hra proti botům; data v `TU_LESSONS`, skupiny v `TU_GROUPS`; staré `#zaciname` funguje dál), `#review` (Rozbor partie jako game review na chess.com: klasifikace tahů, přesnost, graf; hra v `sessionStorage`, výsledky enginu v IndexedDB), `#odhad` (Odhad Elo: partie s botem bez nápověd, odhad z přesnosti a průměrné ztráty v setinách pěšce, historie v `store.guess`), `#rozbor/<jméno z chess.com>` (Rozbor hráče: partie z api.chess.com, ukládá si je do IndexedDB `trener-rozbor`), `#dev`.
- Lekce typu `seq` (v `TU_LESSONS`): víc tahů za sebou a otázky s výběrem odpovědi. Krok s tahem `{task, ok, okTxt/okBy, alt, bad, reply, replyTxt, hint}`, otázka `{q, choices, ans, why, no}`. Úroveň „Útok a tempo“ = skupina `ga`. Správné tahy ověřuj Stockfishem.
- Rozbor hráče: procenta = podíl výher (winrate, `rzPct`), ne skóre s půlkami za remízy. Sekce „Na čem pracovat“ (`rzPatterns`/`rzRenderP`) hledá opakující se vzorce: figura na napadené pole, odkrytá figura, vidličky, otrávený materiál, mat na poslední řadě, rychlé maty, rošáda, dáma brzy, časová tíseň, tilt po prohře, dlouhé seance, denní doba, slabší soupeři, koncovky, brzké vzdávání, ztráty dámy, nedotažené výhry, barvy, trend. Data pro to počítá `rzParse` (`fk`, `castle`, `qE`, `bk`, `eg`, u chyb `self/fork/greedy`).
- Rozbor hráče: nejdřív seznam partií a výběr, pak rozbor vybraných. Výběr se pamatuje v `localStorage` (`trener-rz-pick:<jméno>`), u propojeného jména z profilu (`store.ccName`) se rozbor ukáže hned; partie se ukážou z IndexedDB a čerstvé se dotáhnou na pozadí. Souhrn pro profil v `store.ccSum`.
- Test Rozboru hráče: `node tests/rozbor.test.js` (s běžícím http.serverem na portu 8765; api.chess.com se nahrazuje soubory z `tests/fixtures/`).
- Hosting: **Render** (Static Site) staví web automaticky z větve `main`. Push do `main` = za 1–2 min je změna na webu.
- Účty a postup hráčů: **Supabase**, projekt `ylcybuglsjdcoklnaijl` („ŠACHOVÝ TRENAŽER“).
- Slučování postupu ze dvou zařízení: `mergeStores` (+ `mergePq` pro puzzle). Klíče, které má jen účet, se nesmí ztratit (dřív se tak ztrácel postup v puzzle).
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

## Testovací funkce (jen účty v `BETA_USERS`, teď `davidbiciste`)
- `BETA_USERS`, `isBeta()`, `BETA_COURSES` (kurz Dámský gambit `qg`, varianty ověřené chess.js + Stockfishem hl. 16) a `betaApply()` hned pod `COURSES`. Kurz se do `COURSES` přidá až po přihlášení testovacího účtu.
- JS blok „TESTOVACÍ FUNKCE“: sekce „V testu“ na úvodu (`betaHomeHTML`), karta Nové partie z chess.com (`btGamesCheck`, odbočení z repertoáru od 3. tahu, tlačítko Hotovo uloží `store.bt.gs`), `#souradnice` (trénink souřadnic, rekordy `store.bt.co`), `#vyzva` a `#vyzva/<kód>` (5 puzzle na čas, kód = base64 JSON v odkazu, bez databáze; odkaz otevře každý přihlášený, historie výzev jen u testovacích účtů v `store.bt.ch`). CSS blok „TESTOVACÍ FUNKCE“.
- Varianty od hráčů (`#varianty`, JS blok „VARIANTY OD HRÁČŮ“, stav `CV`): přidání v Najít variantu (karta „Tahle varianta v kurzech není“, kontrola Stockfishem: tahy hráčovy strany se ztrátou nad 150 setin pěšce = chyba, jde přidat i tak s upozorněním), zařazení podle `openings/names.json` (Lichess chess-openings, CC0; české názvy rodin v `CV_CZ`). Z variant se skládají kurzy `cvw` / `cvb` (Varianty hráčů za bílé / za černé); `exIndex` je vynechává (nejsou to tvůj repertoár). DB: tabulky `community_variants` (unikátní tahy + strana) a `community_variant_votes` (hlas = „Taky to hraju“), funkce `trener_cv_add`, `trener_cv_vote`, `trener_cv_list`, `trener_admin_cv_set` (správce: Skrýt / Doporučit). Bez spuštěného SQL web ukáže „ještě není zapnuté“.
- Kurzy přidané až po startu (BETA_COURSES, cvw/cvb) musí mít u variant dopočítané `l.ch` a `l.moves` (jinak trenažér spadne) – dělá to `betaApply` a `cvBuild`.
- Spuštění pro všechny: `isBeta()` vrátit `true` (nebo přesunout kurz do `COURSES`) a upravit nadpis „V testu“.

## Účty
- Správce: `davidbiciste` (`players.is_admin = true`). Vývojářská stránka: tlačítko „Vývojář“ nahoře nebo `#dev`.
- Admin funkce v DB: `trener_admin_players`, `trener_admin_set_password`, `trener_admin_delete` – všechny ověřují token správce.

## Výchozí vzhled „Nový trenažér“ (od 16. 11. 2026)
- Třída `d-neo` na `<html>` (spolu s `d-klub d-sal`), CSS blok „NÁVRH Nový trenažér“, JS blok se stejným názvem (`renderNeoHome`, `nxNav`, `nxCmd`). Písmo Bricolage Grotesque v `fonts/bricolage.woff` (hostované u sebe).
- Boční menu (počítač) / spodní lišta (mobil), úvod s živou šachovnicí, bento dlaždice, pás kurzů, hledání Ctrl K.
- Hráč se může vrátit: tlačítko „Starý vzhled“ v menu nebo „Vrátit starý vzhled“ dole na úvodu (uloží `trener-design=sal`). Zpět na nový: Vzhled nahoře → Nový trenažér.
- Zálohy před novým vzhledem: větev `zaloha-pred-novym-trenazerem`.

## Starý vzhled „Turnajový sál“ (volba sal)
- Barvy jen přes CSS proměnné v `:root` (světlý) a `@media (prefers-color-scheme:dark)` (tmavý). Zeď sálu `--bg`, papír `--bg-2`, grafit `--fg`, zelená hodin `--accent`/`--btn`, červený praporek `--bad`, mosaz `--gold`, ořech `--frame`.
- Písma: nadpisy a čísla Barlow Semi Condensed, text Source Sans 3. Žádné Inter/Roboto/Open Sans, žádné patkové nadpisy na krémovém pozadí.
- Odvaha jen na jednom místě: ořechový rám šachovnice. Zbytek tichý: dlaždice bez stínů, žádné versálkové nadpisky, žádné „→“ za tlačítky, žádná emoji, žádné „A · B · C“ na hlavních místech.
- Stejná akce = stejné jméno (Naučit, Procvičit, Drill, Další past). Po změně vzhledu screenshot mobil + desktop, světlý + tmavý.
- Přepínač vzhledu pro všechny hráče: tlačítko „Vzhled“ nahoře (nebo `?design=neo|sal|klub|kazeta|orig`). Vzhledy jsou ve třídách na `<html>`: `d-neo` (výchozí), `d-sal` (starý vzhled), `d-klub d-klubc`, `d-sal navrh` (kazeta), `d-orig`.
- Zálohy vzhledu: větve `zaloha-pred-designem` (tmavý původní), `zaloha-sachovy-klub` (krémový) a `zaloha-pred-novym-trenazerem` (Turnajový sál jako výchozí, stav před 16. 11. 2026 večer).
