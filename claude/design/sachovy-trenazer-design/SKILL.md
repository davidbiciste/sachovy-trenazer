---
name: sachovy-trenazer-design
description: Design Šachového trenažéru tak, aby nekřičel „AI“. Podle oficiálního skillu Anthropic frontend-design, upraveno pro tento projekt.
---

# Design Šachového trenažéru – aby to nekřičelo AI

## O čem produkt je
- Trenažér šachových zahájení (učení, drill, pasti, profil), hlavně na mobilu (PWA). Hlavní věc je šachovnice, ne marketing.
- Vizuální slovník ze světa šachu: dřevo a figurky, turnajový formulář a notace, šachové hodiny, diagramy z šachových knih. Ne SaaS.

## Typické znaky AI designu – nepoužívat jako výchozí volbu
1. Krémové pozadí (~#F4F1EA) + patkové písmo v nadpisech + terakotový akcent (~#D97757). Pozor: design „Šachový klub“ (bg #f3eee3 + Newsreader) do této kategorie spadá.
2. Skoro černé pozadí s jedním křiklavým akcentem.
3. Novinový layout: vlasové linky, nulové zaoblení, husté sloupce.
4. Sada stejných zaoblených karet se stejným šedým stínem a gradienty.
5. Šablonové ozdoby: VERSALKOVÝ nadpisek nad každým nadpisem, „A · B · C“, „SLOVO — úryvek“, #111 místo černé, monospace popisky, „→“ za tlačítky.
- Dále: zvýraznění jednoho slova v nadpisu, číslování 01/02/03 bez skutečného sledu, animace vyjíždění u každé sekce a hover na každé kartě.

## Postup
1. Plán: 4–6 barev (hex) + barvy polí, 1–2 písma (ne Inter/Roboto/Open Sans z reflexu), ASCII layout pro mobil/desktop, principy.
2. Kontrola: dopadl by plán stejně pro obecnou „learning app“? Pak přepracovat a napsat proč. Teprve potom kódovat.

## Pravidla projektu
- Měnit CSS proměnné (`--bg`, `--panel`, `--accent`, `--sq-l`, `--sq-d`…) ve světlé i tmavé variantě.
- Barvy kvality tahu odlišitelné i pro barvoslepé (tvar/ikona, ne jen barva).
- Odvaha na jednom místě, zbytek tichý. Před dokončením „sundat jeden doplněk“.
- Mobil od 360 px, viditelný focus, `prefers-reduced-motion`, kontrast, řádek do ~80 znaků.
- Po změně screenshot mobil + desktop, světlý + tmavý režim, a kritika.

## Texty
- Česky, jednoduše, z pohledu hráče, činný rod. Tlačítko říká, co udělá. Stejná akce = stejné jméno všude.
- Chyba a prázdný stav = co dělat dál, bez omlouvání.
