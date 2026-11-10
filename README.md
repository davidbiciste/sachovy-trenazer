# Šachový trenažér: jak ho dát na web (krok za krokem)

Ve složce jsou 4 soubory:

| Soubor | K čemu je |
|---|---|
| `index.html` | samotný trenažér |
| `config.js` | sem vložíš 2 hodnoty ze Supabase |
| `supabase.sql` | skript, který v Supabase vytvoří účty a ukládání postupu |
| `README.md` | tento návod |

Používají se tři služby a všechny jsou zdarma:

- **Supabase** ukládá účty (jméno + heslo) a postup hráčů.
- **GitHub** drží soubory webu.
- **Render** z GitHubu udělá web s adresou, např. `https://sachovy-trener.onrender.com`.

Celé to zabere asi 20–30 minut. Postupuj přesně v tomhle pořadí.

---

## Krok 1: Supabase (databáze a účty)

1. Otevři <https://supabase.com> a vpravo nahoře klikni **Start your project** /
   **Sign in**. Nejjednodušší je přihlásit se přes GitHub. Když GitHub ještě nemáš,
   udělej nejdřív krok 2.1 a vrať se sem.
2. Klikni **New project**.
   - **Organization:** nech předvyplněnou, případně ji vytvoř (Free).
   - **Project name:** `sachovy-trener`
   - **Database password:** klikni *Generate a password* a ulož si ho. Do webu ho nepotřebuješ.
   - **Region:** `Central EU (Frankfurt)`
   - Klikni **Create new project** a počkej 1–2 minuty, než se projekt připraví.
3. **Vytvoř tabulky a funkce:**
   - V levém menu klikni na **SQL Editor** (ikona `>_`).
   - Klikni **New query**, případně **+**.
   - Otevři soubor `supabase.sql` (stačí Poznámkový blok), označ všechno (Ctrl+A),
     zkopíruj a vlož do editoru.
   - Vpravo dole klikni **Run**. Dole se má objevit *Success. No rows returned*.
   - Pokud vyskočí okno o „destructive operation“, potvrď **Run this query**.
     Skript nic nemaže, jen vytváří.
4. **Zkopíruj dvě hodnoty:**
   - Nahoře klikni na tlačítko **Connect**, nebo jdi do **Project Settings**
     (ozubené kolo vlevo dole) → **Data API** / **API Keys**.
   - **Project URL** vypadá jako `https://abcdefghijkl.supabase.co`.
   - **Publishable key** začíná `sb_publishable_…`. Ve starších projektech se
     jmenuje **anon public** a začíná `eyJ…`. Kterýkoli z nich funguje.
   - **Nikdy** nepoužij *secret* / `service_role` klíč.
5. **Vlož je do `config.js`.** Otevři ho v Poznámkovém bloku a doplň hodnoty mezi uvozovky:

   ```js
   window.TRENER_CONFIG = {
     supabaseUrl: "https://abcdefghijkl.supabase.co",
     supabaseKey: "sb_publishable_xxxxxxxxxxxxxxxx"
   };
   ```

   Ulož. Publishable klíč je veřejný a to je v pořádku: tabulky nejdou z webu
   číst napřímo, web smí jen volat funkce ze `supabase.sql`, které si ověří
   jméno a heslo. Hesla se ukládají jen zašifrovaná (bcrypt).

Žádné e-maily ani SMTP se nastavovat nemusí. Hráči se registrují jen jménem a heslem.

## Krok 2: GitHub (uložení souborů)

1. Otevři <https://github.com> a klikni **Sign up**, pokud ještě nemáš účet.
2. Vpravo nahoře klikni **+** → **New repository**.
   - **Repository name:** `sachovy-trener`
   - Vyber **Public**. Render umí i Private, Public je ale nejjednodušší.
   - Nic dalšího nezaškrtávej a klikni **Create repository**.
3. Na stránce nového repozitáře klikni na odkaz **uploading an existing file**.
4. Přetáhni do okna všechny 4 soubory: `index.html`, `config.js`, `supabase.sql` a `README.md`.
   Soubory musí být přímo v repozitáři, ne ve složce.
5. Dole klikni zelené **Commit changes**.

Kontrola: v repozitáři vidíš seznam 4 souborů a `index.html` je mezi nimi.

## Krok 3: Render (web s adresou)

1. Otevři <https://render.com> → **Get Started** a přihlas se **přes GitHub**.
2. V dashboardu klikni **+ New** (vpravo nahoře) → **Static Site**.
3. U *Git Provider* vyber repozitář `sachovy-trener` a klikni **Connect**.
   Když ho v seznamu nevidíš, klikni **Configure account** / *Configure GitHub*
   a povol Renderu přístup k repozitáři `sachovy-trener`.
4. Vyplň formulář:
   - **Name:** `sachovy-trener`. Z toho vznikne adresa, takže si vyber, jakou chceš.
   - **Branch:** `main`
   - **Root Directory:** nech prázdné
   - **Build Command:** nech prázdné. Pokud ho Render vyžaduje, napiš `echo ok`.
   - **Publish Directory:** `.` (jedna tečka)
5. Klikni **Deploy Static Site**. Za 1–2 minuty uvidíš *Live* a nahoře adresu,
   např. `https://sachovy-trener.onrender.com`.

## Krok 4: Vyzkoušej to

1. Otevři adresu z Renderu.
2. Vpravo nahoře má být zelené tlačítko **Přihlásit se**. Pokud chybí, viz *Časté problémy*.
3. Klikni na něj → **Registrovat** → zadej jméno, heslo a heslo znovu → **Vytvořit účet**.
4. Nahoře se místo tlačítka ukáže tvoje jméno se zelenou tečkou. Zahraj jednu variantu.
5. Otevři stejnou adresu na mobilu a přihlas se stejným jménem a heslem.
   Postup tam bude taky.
6. Pošli adresu kamarádům. Každý si udělá vlastní účet.

## Jak web aktualizovat

Když ti pošlu novou verzi `index.html`:

1. Na GitHubu v repozitáři klikni **Add file → Upload files**.
2. Nahraj nový `index.html`. Přepíše starý se stejným jménem.
3. **Commit changes**.

Render si změnu všimne a za minutu ji nasadí. Odkaz zůstává stejný a postup
hráčů v Supabase se nesmaže. `config.js` znovu nahrávat nemusíš.

## Vývojářská stránka (jen pro tebe)

1. Zaregistruj se na webu svým jménem.
2. V Supabase otevři **SQL Editor** a spusť znovu celý `supabase.sql` (přidá funkce pro správce).
3. Pak spusť tenhle řádek, místo `tvojejmeno` dej svoje přihlašovací jméno:

   ```sql
   update public.players set is_admin = true where username = 'tvojejmeno';
   ```

4. Na webu se odhlas a znovu přihlas. Nahoře uvidíš tlačítko **Vývojář**
   (nebo otevři adresu webu s `#dev` na konci).

Uvidíš tam seznam hráčů, jejich XP a postup, kdy naposledy hráli, a můžeš jim
nastavit nové heslo nebo je smazat. Ostatní hráči tlačítko nevidí, a i kdyby
stránku nějak otevřeli, databáze jim data nedá. Ověřuje se to v Supabase podle účtu.

## Aplikace v mobilu

Trenažér si můžeš nainstalovat na plochu telefonu jako aplikaci. Otevře se přes celou
obrazovku a funguje i bez internetu (postup se pak uloží do účtu, až budeš zase online).

- **iPhone:** otevři web v **Safari** → klepni na **Sdílet ⬆︎** → **Přidat na plochu**.
- **Android:** v Chrome klepni na kartě na **Nainstalovat aplikaci** (nebo menu **⋮ → Instalovat aplikaci**).

Aplikace se aktualizuje sama: po nahrání nové verze na GitHub (a nasazení na Renderu)
se při dalším otevření načte nová verze.

## Správa hráčů (v Supabase)

- **Seznam hráčů:** levé menu **Table Editor** → tabulka `players`.
- **Zapomenuté heslo:** v **SQL Editoru** spusť (uprav jméno a nové heslo):

  ```sql
  update public.players set pass_hash = extensions.crypt('noveheslo', extensions.gen_salt('bf')) where username = 'jmeno';
  ```

- **Smazání hráče i s postupem:**

  ```sql
  delete from public.players where username = 'jmeno';
  ```

- Po 10 špatných heslech za 10 minut se přihlášení na to jméno na chvíli zablokuje.
  Je to ochrana proti hádání hesla.

## Vlastní doména (volitelné)

V Renderu otevři svůj web → **Settings** → **Custom Domains** → **Add Custom Domain**
a napiš doménu, např. `trener.mojedomena.cz`. Render ti ukáže DNS záznam (CNAME).
Ten nastav u registrátora domény. HTTPS zařídí Render sám.

## Časté problémy

- **Tlačítko „Přihlásit se“ chybí:** `config.js` je prázdný, má
  překlep, nebo není v repozitáři vedle `index.html`. Zkontroluj uvozovky a čárku za URL.
- **„Špatný klíč v config.js“:** zkontroluj, že je klíč zkopírovaný celý. Když to s klíčem
  `sb_publishable_…` nejde, vezmi v Supabase **Project Settings → API Keys → Legacy API Keys**
  klíč **anon public** (začíná `eyJ…`) a dej ho do `supabaseKey`.
- **„V Supabase chybí funkce“:** nespustil se `supabase.sql`. Spusť ho znovu, celý.
- **„Nejde se spojit se serverem“:** free projekt Supabase se po týdnu bez
  návštěv uspí. V dashboardu Supabase klikni **Restore project**. Data zůstanou.
- **Web se načítá dlouho:** statický web na Renderu se neuspává. Jestli trvá
  dlouho jen přihlášení, probouzí se Supabase (viz předchozí bod).
- **Změna na GitHubu se neprojevila:** v Renderu otevři web → **Events** a zkontroluj,
  že poslední deploy je *Live*. Případně dej **Manual Deploy → Deploy latest commit**.
  V prohlížeči pak stránku obnov.
