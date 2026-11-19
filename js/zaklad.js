/* Figury, pravidla, engine, ukládání postupu, účty, Najít variantu, Pasti. Pořadí načítání je v index.html (APP_JS). */
// Piece shapes in the style of Colin M.L. Burnett's set (CC BY-SA 3.0), 45x45 viewBox
const PIECE_SVG=(()=>{
const S='stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"';
const W={
K:`<g fill="none" fill-rule="evenodd" stroke="#000" ${S}><path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/><path fill="#fff" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#fff" d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/><path d="M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0"/></g>`,
Q:`<g fill="#fff" fill-rule="evenodd" stroke="#000" ${S}><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0"/></g>`,
R:`<g fill="#fff" fill-rule="evenodd" stroke="#000" ${S}><path stroke-linecap="butt" d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/><path d="M34 14l-3 3H14l-3-3"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M31 17v12.5H14V17"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path fill="none" stroke-linejoin="miter" d="M11 14h23"/></g>`,
B:`<g fill="none" fill-rule="evenodd" stroke="#000" ${S}><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g>`,
N:`<g fill="none" fill-rule="evenodd" stroke="#000" ${S}><path fill="#fff" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#fff" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/><path fill="#000" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z"/></g>`,
P:`<path fill="#fff" stroke="#000" stroke-linecap="round" stroke-width="1.5" d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>`};
const B={
K:`<g fill="none" fill-rule="evenodd" stroke="#000" ${S}><path stroke-linejoin="miter" d="M22.5 11.63V6"/><path fill="#000" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#000" d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/><path stroke-linejoin="miter" d="M20 8h5"/><path stroke="#ececec" d="M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5v2.1-2.1C20 18 10.85 14 6.97 19.85 4.5 25.5 13 29.5 13 29.5"/><path stroke="#ececec" d="M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0"/></g>`,
Q:`<g fill-rule="evenodd" stroke="#000" ${S}><g stroke="none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" stroke-linecap="butt" d="M11 38.5a35 35 1 0 0 23 0"/><path fill="none" stroke="#ececec" d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0"/></g>`,
R:`<g fill-rule="evenodd" stroke="#000" ${S}><path stroke-linecap="butt" d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M14 29.5v-13h17v13H14z"/><path stroke-linecap="butt" d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z"/><path fill="none" stroke="#ececec" stroke-linejoin="miter" stroke-width="1" d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23"/></g>`,
B:`<g fill="none" fill-rule="evenodd" stroke="#000" ${S}><g fill="#000" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke="#ececec" stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g>`,
N:`<g fill="none" fill-rule="evenodd" stroke="#000" ${S}><path fill="#000" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#000" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/><path fill="#ececec" stroke="#ececec" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z"/><path fill="#ececec" stroke="none" d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z"/></g>`,
P:`<path fill="#000" stroke="#000" stroke-linecap="round" stroke-width="1.5" d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>`};
return p=>`<svg viewBox="0 0 45 45" aria-hidden="true">${(p[0]==='w'?W:B)[p[1]]}</svg>`;})();


/* ===== TESTOVACÍ FUNKCE (zatím jen pro účty v BETA_USERS; ostatní hráči nic nevidí) ===== */
const BETA_USERS=['davidbiciste'];
/* isBeta = funkce puštěné všem přihlášeným hráčům (od 18. 11. 2026); isTest = jen BETA_USERS (nový vzhled lekcí a Do hloubky) */
function isBeta(){return !!(typeof SYNC!=='undefined'&&SYNC.user);}
function isTest(){return isBeta()&&BETA_USERS.includes(String(SYNC.user).toLowerCase());}
/* kurz Dámský gambit: varianty ověřené chess.js a Stockfishem 17.1 (hloubka 16) */
const BETA_COURSES=[{"id":"qg","title":"Dámský gambit","en":"Queen's Gambit","side":"w","icon":"wQ","sub":"Repertoár za bílé · 1.d4 d5 2.c4","chapters":[{"t":"Odmítnutý gambit: výměnná varianta","s":"2...e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5","plan":"Bílý hned vymění na d5 a ví, jaká pozice vznikne. Sestava: Bg5, e3, Bd3, Qc2, Nf3 (nebo Nge2) a rošáda. Pak přijde menšinový útok: věž na b1, pěšci b4 a b5 a černý dostane slabého pěšce na c6. Pozor na past: když černý hraje Nbd7, nesmíš brát Nxd5? – po Nxd5 Bxd8 Bb4+ prohraješ dámu.","lines":[{"id":"qg-ex-c6","name":"5...c6 6.Qc2 – hlavní sestava","m":"d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 Qc2 Be7 e3 Nbd7 Bd3 O-O Nf3 Re8 O-O Nf8 Rab1","full":"1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 c6 6.Qc2 Be7 7.e3 Nbd7 8.Bd3 O-O 9.Nf3 Re8 10.O-O Nf8 11.Rab1","idea":"Klasická sestava: dáma na c2, střelec na d3, rošáda a věž na b1. Další plán je b4–b5, menšinový útok."},{"id":"qg-ex-be7","name":"5...Be7 6.e3 O-O","m":"d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 Be7 e3 O-O Bd3 Nbd7 Nf3 Re8 Qc2 c6 O-O Nf8 Rab1","full":"1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 Be7 6.e3 O-O 7.Bd3 Nbd7 8.Nf3 Re8 9.Qc2 c6 10.O-O Nf8 11.Rab1","idea":"Stejná sestava v jiném pořadí. Dáma na c2 a střelec d3 míří spolu na h7."},{"id":"qg-ex-nbd7","name":"5...Nbd7 – Slonova past","m":"d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 Nbd7 e3 c6 Bd3 Be7 Qc2 O-O Nf3 Re8 O-O Nf8 Rab1","full":"1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 Nbd7 6.e3 c6 7.Bd3 Be7 8.Qc2 O-O 9.Nf3 Re8 10.O-O Nf8 11.Rab1","idea":"Černý nastražil past: pěšec d5 vypadá nekrytý, ale po Nxd5? Nxd5! Bxd8 Bb4+ by bílý přišel o dámu. Nenech se nachytat a pokračuj ve vývinu."},{"id":"qg-ex-h6","name":"5...h6 6.Bxf6 gxf6","m":"d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 h6 Bxf6 gxf6 e3 c6 Bd3 h5 Nge2 h4 O-O","full":"1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 h6 6.Bxf6 gxf6 7.e3 c6 8.Bd3 h5 9.Nge2 h4 10.O-O","idea":"Černý se ptá střelce. Vyměníš na f6 a černý má rozbitou pěšcovou strukturu. Král černého už nebude nikdy úplně v bezpečí."},{"id":"qg-ex-h6q","name":"5...h6 6.Bxf6 Qxf6? 7.Nxd5","m":"d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 h6 Bxf6 Qxf6 Nxd5 Qd6 Nc3 Be7 e3 O-O Nf3","full":"1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 h6 6.Bxf6 Qxf6 7.Nxd5 Qd6 8.Nc3 Be7 9.e3 O-O 10.Nf3","idea":"Když černý bere dámou, pěšec d5 zůstane bez ochrany. Nxd5 vyhraje pěšce."},{"id":"qg-ex-nxd5","name":"4...Nxd5 5.e4","m":"d4 d5 c4 e6 Nc3 Nf6 cxd5 Nxd5 e4 Nxc3 bxc3 c5 Nf3 cxd4 cxd4 Bb4+ Bd2 Bxd2+ Qxd2 O-O Bc4","full":"1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 Nxd5 5.e4 Nxc3 6.bxc3 c5 7.Nf3 cxd4 8.cxd4 Bb4+ 9.Bd2 Bxd2+ 10.Qxd2 O-O 11.Bc4","idea":"Černý bere jezdcem. Ty postavíš velké centrum e4–d4 a po výměnách máš pěšce v centru a aktivní figury."}]},{"t":"Odmítnutý gambit: další možnosti","s":"3...Be7, 3...c5, 3...Bb4","plan":"Když černý nehraje 3...Nf6, měň stejně na d5. Střelce c1 pak dej na f4 (jezdec na f6 ho nemůže napadnout) nebo na g5. Proti Tarraschově obraně (3...c5) dostane černý osamoceného pěšce na d5: hraj Nf3, g3, Bg2 a tlač na d5.","lines":[{"id":"qg-be7","name":"3...Be7 4.cxd5 exd5 5.Bf4","m":"d4 d5 c4 e6 Nc3 Be7 cxd5 exd5 Bf4 Nf6 e3 Bf5 Nge2 O-O Rc1 c6 Ng3 Be6 Bd3","full":"1.d4 d5 2.c4 e6 3.Nc3 Be7 4.cxd5 exd5 5.Bf4 Nf6 6.e3 Bf5 7.Nge2 O-O 8.Rc1 c6 9.Ng3 Be6 10.Bd3","idea":"Proti Be7 hraje střelec na f4. Sestava e3, Nge2, Ng3 a Bd3."},{"id":"qg-tarrasch","name":"3...c5 – Tarraschova obrana","m":"d4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7 O-O O-O Bg5 cxd4 Nxd4 h6 Be3","full":"1.d4 d5 2.c4 e6 3.Nc3 c5 4.cxd5 exd5 5.Nf3 Nc6 6.g3 Nf6 7.Bg2 Be7 8.O-O O-O 9.Bg5 cxd4 10.Nxd4 h6 11.Be3","idea":"Černý dostane osamoceného pěšce na d5. Fianchetto Bg2 na něj tlačí po dlouhé diagonále."},{"id":"qg-bb4","name":"3...Bb4 4.cxd5 exd5 5.Bf4","m":"d4 d5 c4 e6 Nc3 Bb4 cxd5 exd5 Bf4 Nf6 e3 O-O Bd3 c5 Nge2 Nc6 O-O","full":"1.d4 d5 2.c4 e6 3.Nc3 Bb4 4.cxd5 exd5 5.Bf4 Nf6 6.e3 O-O 7.Bd3 c5 8.Nge2 Nc6 9.O-O","idea":"Střelec váže jezdce. Vyměníš na d5, střelec na f4 a jezdec přes e2, aby nikdo nemohl rozbít pěšce na c3."}]},{"t":"Přijatý dámský gambit","s":"2...dxc4 3.e4","plan":"Černý bere pěšce, ale nemůže si ho udržet. Bílý hraje 3.e4 a postaví velké centrum. Pěšce c4 vezme střelec. Proti 3...b5 nehraj b3, ale a4 a pěšec se vrátí stejně.","lines":[{"id":"qga-e5","name":"3...e5 4.Nf3 exd4 5.Bxc4","m":"d4 d5 c4 dxc4 e4 e5 Nf3 exd4 Bxc4 Nc6 O-O Be6 Bxe6 fxe6 Qb3 Qd7 Qxb7 Rb8 Qa6","full":"1.d4 d5 2.c4 dxc4 3.e4 e5 4.Nf3 exd4 5.Bxc4 Nc6 6.O-O Be6 7.Bxe6 fxe6 8.Qb3 Qd7 9.Qxb7 Rb8 10.Qa6","idea":"Černý udeří v centru. Střelec bere na c4 a míří na f7. Po výměně střelců dáma napadne b7."},{"id":"qga-bb4","name":"3...e5 4.Nf3 Bb4+","m":"d4 d5 c4 dxc4 e4 e5 Nf3 Bb4+ Bd2 Bxd2+ Nbxd2 exd4 Bxc4 Nc6 O-O","full":"1.d4 d5 2.c4 dxc4 3.e4 e5 4.Nf3 Bb4+ 5.Bd2 Bxd2+ 6.Nbxd2 exd4 7.Bxc4 Nc6 8.O-O","idea":"Šach střelcem. Zakryješ Bd2, vyměníš a jezdec bere na d2. Pak Bxc4 a rošáda."},{"id":"qga-nf6","name":"3...Nf6 4.e5","m":"d4 d5 c4 dxc4 e4 Nf6 e5 Nd5 Bxc4 Nb6 Bb3 Nc6 Ne2 Bf5 Nbc3 e6 O-O","full":"1.d4 d5 2.c4 dxc4 3.e4 Nf6 4.e5 Nd5 5.Bxc4 Nb6 6.Bb3 Nc6 7.Ne2 Bf5 8.Nbc3 e6 9.O-O","idea":"Jezdec napadá e4, tak pěšec postoupí a jezdce vyžene. Střelec bere na c4 a ustoupí na b3."},{"id":"qga-c5","name":"3...c5 4.d5","m":"d4 d5 c4 dxc4 e4 c5 d5 Nf6 Nc3 e6 Bxc4 exd5 exd5 Bd6 Qe2+ Kf8 Nf3 a6 a4","full":"1.d4 d5 2.c4 dxc4 3.e4 c5 4.d5 Nf6 5.Nc3 e6 6.Bxc4 exd5 7.exd5 Bd6 8.Qe2+ Kf8 9.Nf3 a6 10.a4","idea":"Pěšec postoupí a zabere prostor. Po výměně na d5 dáš šach Qe2+ a černý ztratí rošádu."},{"id":"qga-nc6","name":"3...Nc6 4.Be3","m":"d4 d5 c4 dxc4 e4 Nc6 Be3 Nf6 Nc3 e5 d5 Ne7 Bxc4 Ng6 f3","full":"1.d4 d5 2.c4 dxc4 3.e4 Nc6 4.Be3 Nf6 5.Nc3 e5 6.d5 Ne7 7.Bxc4 Ng6 8.f3","idea":"Střelec kryje d4. Na e5 postoupíš d5 a jezdec musí z c6 pryč."},{"id":"qga-b5","name":"3...b5 4.a4","m":"d4 d5 c4 dxc4 e4 b5 a4 c6 axb5 cxb5 Nc3 Bd7 d5 a6 Nf3 e6 d6","full":"1.d4 d5 2.c4 dxc4 3.e4 b5 4.a4 c6 5.axb5 cxb5 6.Nc3 Bd7 7.d5 a6 8.Nf3 e6 9.d6","idea":"Černý chce pěšce udržet. a4 a axb5 rozbije jeho pěšce a ty máš velké centrum."}]},{"t":"Slovanská obrana","s":"2...c6 3.Nf3 Nf6 4.Nc3","plan":"Černý kryje d5 pěšcem c6. Bílý vyvíjí Nf3 a Nc3. Když černý vezme na c4, zahraj a4 (černý pak nemůže krýt pěšcem b5) a pak e3 a Bxc4. Proti polo-slovanské (4...e6) postav dámu na c2 a střelce na d3.","lines":[{"id":"qs-dxc4","name":"4...dxc4 5.a4 Bf5","m":"d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7 e4","full":"1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5 6.e3 e6 7.Bxc4 Bb4 8.O-O O-O 9.Qe2 Nbd7 10.e4","idea":"Hlavní varianta. a4 zastaví b5, Bxc4 vrátí pěšce a pak e4 postaví centrum."},{"id":"qs-semi","name":"4...e6 5.e3 – polo-slovanská","m":"d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Qc2 Bd6 Bd3 O-O O-O dxc4 Bxc4","full":"1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 e6 5.e3 Nbd7 6.Qc2 Bd6 7.Bd3 O-O 8.O-O dxc4 9.Bxc4","idea":"Pomalá sestava: Qc2, Bd3 a rošáda. Po dxc4 bere střelec."},{"id":"qs-a6","name":"4...a6 5.c5","m":"d4 d5 c4 c6 Nf3 Nf6 Nc3 a6 c5 Bf5 Bf4 Nbd7 e3 e6 Be2","full":"1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 a6 5.c5 Bf5 6.Bf4 Nbd7 7.e3 e6 8.Be2","idea":"Černý chce b5. c5 zabere prostor na dámském křídle a pole b6 zůstane slabé."},{"id":"qs-bf5","name":"4...Bf5 5.cxd5 cxd5 6.Qb3","m":"d4 d5 c4 c6 Nf3 Nf6 Nc3 Bf5 cxd5 cxd5 Qb3 Qb6 Nxd5 Nxd5 Qxd5 e6 Qb3","full":"1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 Bf5 5.cxd5 cxd5 6.Qb3 Qb6 7.Nxd5 Nxd5 8.Qxd5 e6 9.Qb3","idea":"Střelec opustil c8 a pěšec b7 je slabý. Qb3 na něj hned zaútočí a vyhraje pěšce d5."},{"id":"qs-early","name":"3...dxc4 4.e3","m":"d4 d5 c4 c6 Nf3 dxc4 e3 b5 a4 e6 axb5 cxb5 b3 Bb4+ Bd2 Bxd2+ Nbxd2","full":"1.d4 d5 2.c4 c6 3.Nf3 dxc4 4.e3 b5 5.a4 e6 6.axb5 cxb5 7.b3 Bb4+ 8.Bd2 Bxd2+ 9.Nbxd2","idea":"Černý bere hned. Na b5 zahraj a4 a pěšce rozbiješ."},{"id":"qs-g6","name":"4...g6 5.cxd5","m":"d4 d5 c4 c6 Nf3 Nf6 Nc3 g6 cxd5 cxd5 Bf4 Bg7 e3 O-O Be2 Nc6 O-O","full":"1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 g6 5.cxd5 cxd5 6.Bf4 Bg7 7.e3 O-O 8.Be2 Nc6 9.O-O","idea":"Slovansko-Grünfeldova sestava. Vyměníš na d5, střelec na f4 a klidný vývin."}]},{"t":"Ostatní odpovědi","s":"2...e5, 2...Nc6, 2...Bf5, 2...Nf6, 2...c5","plan":"Méně častá pokračování. Většinou stačí vzít pěšce na d5 nebo e5 a pokračovat ve vývinu. Proti Albinovu protigambitu nikdy nehraj e3 – Laskerova past končí proměnou na jezdce se šachem.","lines":[{"id":"qo-albin","name":"2...e5 – Albinův protigambit","m":"d4 d5 c4 e5 dxe5 d4 Nf3 Nc6 Nbd2 Be6 a3 Qd7 b4 O-O-O Bb2","full":"1.d4 d5 2.c4 e5 3.dxe5 d4 4.Nf3 Nc6 5.Nbd2 Be6 6.a3 Qd7 7.b4 O-O-O 8.Bb2","idea":"Bereš pěšce na e5. Jezdec na f3 a d2, a3 a b4. Nehraj e3?, Laskerova past je zlá."},{"id":"qo-chig","name":"2...Nc6 – Čigorinova obrana","m":"d4 d5 c4 Nc6 Nf3 Bg4 cxd5 Bxf3 gxf3 Qxd5 e3 e5 Nc3 Bb4 Bd2 Bxc3 bxc3","full":"1.d4 d5 2.c4 Nc6 3.Nf3 Bg4 4.cxd5 Bxf3 5.gxf3 Qxd5 6.e3 e5 7.Nc3 Bb4 8.Bd2 Bxc3 9.bxc3","idea":"Černý vymění střelce za jezdce. Po gxf3 máš dvojici střelců a silný střed."},{"id":"qo-baltic","name":"2...Bf5 – Baltická obrana","m":"d4 d5 c4 Bf5 cxd5 Bxb1 Qa4+ c6 Rxb1 Qxd5 e3 Nd7 Bd2 Ngf6 Nf3","full":"1.d4 d5 2.c4 Bf5 3.cxd5 Bxb1 4.Qa4+ c6 5.Rxb1 Qxd5 6.e3 Nd7 7.Bd2 Ngf6 8.Nf3","idea":"cxd5 a šach Qa4+ vyhraje pěšce zpátky a ty máš dvojici střelců."},{"id":"qo-marshall","name":"2...Nf6 – Marshallova obrana","m":"d4 d5 c4 Nf6 cxd5 Nxd5 Nf3 Bf5 Qb3 Nb6 Nc3 e6 e4 Bg6 h4 h6 Be3","full":"1.d4 d5 2.c4 Nf6 3.cxd5 Nxd5 4.Nf3 Bf5 5.Qb3 Nb6 6.Nc3 e6 7.e4 Bg6 8.h4 h6 9.Be3","idea":"Bereš na d5 a Qb3 napadne b7. Pak e4 vyžene jezdce i střelce."},{"id":"qo-c5","name":"2...c5 – symetrická","m":"d4 d5 c4 c5 cxd5 Nf6 e4 Nxe4 dxc5 Nxc5 Nc3 e6 Nf3 exd5 Qxd5","full":"1.d4 d5 2.c4 c5 3.cxd5 Nf6 4.e4 Nxe4 5.dxc5 Nxc5 6.Nc3 e6 7.Nf3 exd5 8.Qxd5","idea":"cxd5 a e4. Černý bere na e4, ale ty máš lepší vývin a dáma vezme na d5."}]}],"notes":{"d4 d5 c4":"2.c4 – dámský gambit. Pěšec c4 napadá d5. Kdo ho vezme, ztratí centrum.","d4 d5 c4 e6 Nc3 Nf6 cxd5":"4.cxd5 – výměnná varianta. Struktura je pak jasná a bílý má hotový plán.","d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5":"5.Bg5 zaváže jezdce f6, který kryje d5.","d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 Qc2 Be7 e3 Nbd7 Bd3 O-O Nf3 Re8 O-O Nf8 Rab1":"Rab1: věž za pěšce b. Teď přijde b4 a b5, menšinový útok.","d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 h6 Bxf6 Qxf6 Nxd5":"Nxd5! Dáma už pěšce nekryje, bílý ho vezme.","d4 d5 c4 dxc4 e4":"3.e4 – velké centrum. Pěšce c4 vezme střelec později.","d4 d5 c4 dxc4 e4 b5 a4":"4.a4 útočí na pěšce b5, černý ho nedokáže udržet.","d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4":"5.a4 zabrání b5. Pěšce c4 pak vezme střelec.","d4 d5 c4 c6 Nf3 Nf6 Nc3 Bf5 cxd5 cxd5 Qb3":"6.Qb3 napadá b7 a d5 zároveň.","d4 d5 c4 e5 dxe5":"3.dxe5 – bereš pěšce. Nehraj později e3, past!","d4 d5 c4 Bf5 cxd5 Bxb1 Qa4+":"4.Qa4+ šach a pak Rxb1 – figura zpátky."}}];
function betaApply(){const on=isBeta();let ch=false;
 /* testovací lekce: skupiny před „Hraj proti botovi“ */
 try{BETA_TU_GROUPS.forEach(gr=>{const i=TU_GROUPS.findIndex(x=>x[0]===gr[0]);if(on&&i<0){const pi=TU_GROUPS.findIndex(x=>x[0]==='play');TU_GROUPS.splice(pi<0?TU_GROUPS.length:pi,0,gr);}else if(!on&&i>=0)TU_GROUPS.splice(i,1);});
  BETA_TU_LESSONS.forEach(l=>{const i=TU_LESSONS.indexOf(l);if(on&&i<0)TU_LESSONS.push(l);else if(!on&&i>=0)TU_LESSONS.splice(i,1);});}catch(e){}if(!on&&typeof cvRemove==='function'&&CV.list)cvRemove();BETA_COURSES.forEach(c=>{const i=COURSES.indexOf(c);if(on&&i<0){c.chapters.forEach(chp=>chp.lines.forEach(l=>{l.ch=chp;l.moves=l.m.split(' ');}));COURSES.push(c);ch=true;}else if(!on&&i>=0){COURSES.splice(i,1);ch=true;}if(on&&store&&store.prog)store.prog[c.id]=store.prog[c.id]||{};});
 if(ch){try{EXI=null;RZI=null;}catch(e){}if(!on&&typeof course!=='undefined'&&BETA_COURSES.includes(course)){course=COURSES[0];}const cc=document.querySelector('#nxNav .nxCourses');if(cc){try{const t=document.createElement('div');t.innerHTML=nxNavHTML();const nc=t.querySelector('.nxCourses');if(nc)cc.innerHTML=nc.innerHTML;nxMark();}catch(e){}}}return ch;}

/* ---------- Engine ---------- */
const FILES='abcdefgh';
const sqName=i=>FILES[i&7]+((i>>3)+1);
function sqOf(s){return (s.charCodeAt(1)-49)*8+(s.charCodeAt(0)-97)}
function startBoard(){const b=Array(64).fill(null);const back='RNBQKBNR';
 for(let f=0;f<8;f++){b[f]='w'+back[f];b[8+f]='wP';b[48+f]='bP';b[56+f]='b'+back[f];}return b;}
function attacks(b,from,to,t){const fr=from>>3,ff=from&7,tr=to>>3,tf=to&7,dr=tr-fr,df=tf-ff;
 if(t==='N')return (Math.abs(dr)===1&&Math.abs(df)===2)||(Math.abs(dr)===2&&Math.abs(df)===1);
 if(t==='K')return Math.max(Math.abs(dr),Math.abs(df))===1;
 if(t==='P')return false;
 const straight=dr===0||df===0,diag=Math.abs(dr)===Math.abs(df);
 if(t==='R'&&!straight)return false;if(t==='B'&&!diag)return false;if(t==='Q'&&!straight&&!diag)return false;
 if(dr===0&&df===0)return false;
 const sr=Math.sign(dr),sf=Math.sign(df);let r=fr+sr,f=ff+sf;
 while(r!==tr||f!==tf){if(b[r*8+f])return false;r+=sr;f+=sf;}return true;}
function hits(b,from,to){const p=b[from];if(!p)return false;if(p[1]==='P'){const dr=p[0]==='w'?1:-1;return (to>>3)-(from>>3)===dr&&Math.abs((to&7)-(from&7))===1;}return attacks(b,from,to,p[1]);}
function attackers(b,sq,color){const r=[];for(let i=0;i<64;i++)if(b[i]&&b[i][0]===color&&hits(b,i,sq))r.push(i);return r;}
function resolve(b,san,c){let s=san.replace(/[+#!?]/g,'');const home=c==='w'?0:56;
 if(s==='O-O')return{from:home+4,to:home+6,castle:[home+7,home+5]};
 if(s==='O-O-O')return{from:home+4,to:home+2,castle:[home,home+3]};
 let promo=null;const pm=s.match(/=([QRBN])$/);if(pm){promo=pm[1];s=s.slice(0,-2);}
 const to=sqOf(s.slice(-2)),dir=c==='w'?8:-8;
 if(/^[a-h]/.test(s)){
  if(s.includes('x')){const ff=FILES.indexOf(s[0]);const from=(to-dir)-(to&7)+ff;return{from,to,ep:b[to]?null:to-dir,promo};}
  return{from:b[to-dir]===c+'P'?to-dir:to-2*dir,to,promo};}
 const t=s[0];const dis=s.slice(1,-2).replace('x','');
 for(let i=0;i<64;i++)if(b[i]===c+t&&attacks(b,i,to,t)){
  if(dis&&!dis.split('').every(ch=>/[a-h]/.test(ch)?FILES[i&7]===ch:String((i>>3)+1)===ch))continue;return{from:i,to};}
 throw Error('Neplatný tah '+san);}
function apply(b,m){b=b.slice();const p=b[m.from];b[m.to]=m.promo?p[0]+m.promo:p;b[m.from]=null;
 if(m.ep!=null)b[m.ep]=null;if(m.castle){b[m.castle[1]]=b[m.castle[0]];b[m.castle[0]]=null;}return b;}
function targets(b,from,last){const p=b[from];if(!p)return[];const c=p[0],t=p[1],r=from>>3,f=from&7,res=[];
 const add=(rr,ff)=>{if(rr<0||rr>7||ff<0||ff>7)return false;const i=rr*8+ff;if(!b[i]){res.push(i);return true;}if(b[i][0]!==c)res.push(i);return false;};
 if(t==='N')[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,d])=>add(r+a,f+d));
 if(t==='K'){for(let a=-1;a<=1;a++)for(let d=-1;d<=1;d++)if(a||d)add(r+a,f+d);
  const h=c==='w'?0:56;if(from===h+4){if(b[h+7]===c+'R'&&!b[h+5]&&!b[h+6])res.push(h+6);if(b[h]===c+'R'&&!b[h+1]&&!b[h+2]&&!b[h+3])res.push(h+2);}}
 const dirs={B:[[1,1],[1,-1],[-1,1],[-1,-1]],R:[[1,0],[-1,0],[0,1],[0,-1]]};dirs.Q=dirs.B.concat(dirs.R);
 if(dirs[t])dirs[t].forEach(([a,d])=>{let rr=r+a,ff=f+d;while(add(rr,ff)){rr+=a;ff+=d;}});
 if(t==='P'){const dr=c==='w'?1:-1,one=(r+dr)*8+f;
  if(r+dr>=0&&r+dr<8&&!b[one]){res.push(one);const two=(r+2*dr)*8+f;if(r===(c==='w'?1:6)&&!b[two])res.push(two);}
  [-1,1].forEach(d=>{const ff=f+d;if(ff<0||ff>7)return;const i=(r+dr)*8+ff;
   if(b[i]&&b[i][0]!==c)res.push(i);
   else if(!b[i]&&last&&b[last.to]&&b[last.to][1]==='P'&&Math.abs(last.to-last.from)===16&&last.to===r*8+ff)res.push(i);});}
 return res;}
const uciOf=m=>sqName(m.from)+sqName(m.to);

/* ---------- Move explanations (generated from the position) ---------- */
const ACC={P:'pěšce',N:'jezdce',B:'střelce',R:'věž',Q:'dámu',K:'krále'};
const INS={P:'pěšcem',N:'jezdcem',B:'střelcem',R:'věží',Q:'dámou',K:'králem'};
const VAL={P:1,N:3,B:3,R:5,Q:9,K:100};
const NOM={P:'Pěšec',N:'Jezdec',B:'Střelec',R:'Věž',Q:'Dáma',K:'Král'};
function explain(b,m,prev){const p=b[m.from],c=p[0],e=c==='w'?'b':'w',t=p[1];const a=apply(b,m);const out=[];
 if(m.castle)return'Rošáda – král se schová do bezpečí a věž se dostane do hry.';
 const capSq=m.ep!=null?m.ep:m.to;const cap=b[capSq];
 if(cap){if(prev&&prev.to===m.to)out.push(`Bere zpátky ${ACC[cap[1]]}, takže je výměna vyrovnaná.`);else if(m.ep!=null)out.push(`Bere pěšce mimochodem – speciální pravidlo pro pěšce.`);else out.push(`Sebere ${ACC[cap[1]]} na ${sqName(m.to)}.`);}
 const k=a.indexOf(e+'K');const check=k>=0&&attackers(a,k,c).length>0;
 const backRank=c==='w'?0:7;
 if(!cap&&(t==='N'||t==='B')&&(m.from>>3)===backRank)out.push(t==='N'?'Jezdec vyráží do hry a míří ke středu.':'Střelec vyjíždí ven a uvolní místo pro rošádu.');
 if(t==='P'&&!cap){const sq=sqName(m.to);if(['d4','e4','d5','e5'].includes(sq))out.push('Pěšec se postaví doprostřed a zabere centrum.');else if(['c5','c4','f4','f5'].includes(sq))out.push('Pěšec tlačí na soupeřův střed.');}
 if(!cap&&!(t==='N'||t==='B')&&!m.castle){const was=attackers(b,m.from,e);if(was.length&&(attackers(b,m.from,c).length===0||was.some(i=>VAL[b[i][1]]<VAL[t])))out.push(`${NOM[t]} utíká, protože byl${t==='R'||t==='Q'?'a':''} v ohrožení.`);}
 const targ=[];for(let i=0;i<64;i++){const q=a[i];if(!q||q[0]!==e||q[1]==='K')continue;if(!hits(a,m.to,i))continue;
  const defended=attackers(a,i,e).length>0;if(VAL[q[1]]>VAL[t]||!defended&&q[1]!=='P')targ.push(i);}
 if(check)out.push(targ.length?`Šach! A k tomu ještě útočí na ${ACC[a[targ[0]][1]]}.`:'Šach – soupeř musí nejdřív zachránit krále.');
 else if(targ.length>=2)out.push(`Vidlička – útočí najednou na ${ACC[a[targ[0]][1]]} i ${ACC[a[targ[1]][1]]}.`);
 else if(targ.length===1)out.push(`Hrozí sebrat ${ACC[a[targ[0]][1]]} na ${sqName(targ[0])}.`);
 if(!out.length){if(t==='P')out.push('Pěšec získá víc místa a připraví další tahy.');else if(t==='K')out.push('Král se uklidí do bezpečí.');else out.push(`${NOM[t]} si najde lepší místo, odkud víc působí.`);}
 return out.join(' ');}

function explainN(n,m){const prev=mvs[n-1];const pc=n>=1&&prev&&(hist[n-1][prev.to]||prev.ep!=null);return explain(hist[n],m,pc?prev:null);}
/* ---------- Progress ---------- */
const KEY='opening-trainer-v2',DAY=864e5,INTERVALS=[0,1,3,7,14,30];
const load=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch(e){return null}};
let store=load(KEY)||{xp:0,sound:true,theme:'wood',prog:{}};
/* statistiky (pokusy, chyby, tahy s chybou) se jednou vynulují a počítají znovu – postup učení zůstává */
const STATS_V=2;function resetStats(st){if(!st||(st.statsV||0)>=STATS_V)return st;Object.values(st.prog||{}).forEach(c=>Object.values(c||{}).forEach(p=>{if(p){delete p.n;delete p.ok;delete p.err;delete p.mv;delete p.lapse;}}));st.statsV=STATS_V;return st;}
resetStats(store);
if(!store.prog.vienna){const old=load('vienna-trainer-v1');store.prog.vienna=old||{};const om=load('vienna-meta-v1');if(om&&om.xp)store.xp+=om.xp;}
COURSES.forEach(c=>{store.prog[c.id]=store.prog[c.id]||{};});store.mastered=store.mastered||{};
const mKey=ch=>course.id+'|'+ch.t;const isMastered=ch=>!!store.mastered[mKey(ch)];
function chPct(ch,co){co=co||course;const pr=store.prog[co.id]||{};const d=ch.lines.filter(l=>pr[l.id]&&(pr[l.id].box||0)>=2).length;return store.mastered[co.id+'|'+ch.t]?100:Math.round(d/ch.lines.length*90);}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
function save(){store.upd=Date.now();if(typeof lbTick==='function')try{lbTick();}catch(e){}saveLocal();queueCloud();}
/* ---- cloud sync (Claude účet) + záloha ---- */
let BK={open:false,msg:''};
/* SYNC.be = backend {kind:'claude'|'supa', save(store)} ; state: local|wait|cloud|err|out */
let SYNC={be:null,state:'local',busy:false,dirty:false,t:null,user:null,uid:null};
const CFG=window.TRENER_CONFIG||{};const HAS_SUPA=!!(CFG.supabaseUrl&&CFG.supabaseKey);let SB=null;
/* postup v puzzle ze dvou zařízení: z každé věci to lepší */
function mergePq(a,b){if(!a)return b?JSON.parse(JSON.stringify(b)):null;if(!b)return a;const o=Object.assign({},b,a);
 const mx=(x,y)=>{const r={};new Set([...Object.keys(x||{}),...Object.keys(y||{})]).forEach(k=>{r[k]=Math.max(+(x||{})[k]||0,+(y||{})[k]||0);});return r;};
 o.lv=mx(a.lv,b.lv);o.lvTry=mx(a.lvTry,b.lvTry);o.rush=mx(a.rush,b.rush);o.daily=mx(a.daily,b.daily);o.tr=mx(a.tr,b.tr);o.own=mx(a.own,b.own);o.ownF=Object.assign({},b.ownF||{},a.ownF||{});Object.keys(o.own).forEach(k=>delete o.ownF[k]);
 if(a.skip||b.skip)o.skip=Math.max(a.skip||0,b.skip||0);
 const ra=(a.rn||0)>=(b.rn||0)?a:b;o.r=ra.r;o.rn=ra.rn;o.rh=ra.rh;/* hodnocení z toho zařízení, kde se hrálo víc */
 const ca=(a.all||0)>=(b.all||0)?a:b;o.ok=ca.ok;o.all=ca.all;o.miss=ca.miss;
 o.th={};new Set([...Object.keys(a.th||{}),...Object.keys(b.th||{})]).forEach(k=>{const x=(a.th||{})[k]||[0,0],y=(b.th||{})[k]||[0,0];o.th[k]=(x[1]||0)>=(y[1]||0)?x:y;});
 o.seen=[...new Set([...(b.seen||[]),...(a.seen||[])])].slice(-600);
 if(a.vy||b.vy){const x=a.vy||{},y=b.vy||{};const v=(x.all||0)>=(y.all||0)?Object.assign({},y,x):Object.assign({},x,y);v.best=Math.max(x.best||0,y.best||0);v.seen=[...new Set([...(y.seen||[]),...(x.seen||[])])].slice(-900);o.vy=v;}
 return o;}
/* data testovacích funkcí (souřadnice, výzvy, kontrola partií) */
function mergeBt(a,b){a=a||{};b=b||{};const o=Object.assign({},b,a);
 o.co={};new Set([...Object.keys(a.co||{}),...Object.keys(b.co||{})]).forEach(k=>{o.co[k]=Math.max((a.co||{})[k]||0,(b.co||{})[k]||0);});
 o.gs=Math.max(a.gs||0,b.gs||0);const ch=[...(b.ch||[]),...(a.ch||[])],seen=new Set();o.ch=ch.filter(x=>{const k=x.c+'|'+x.t;if(seen.has(k))return false;seen.add(k);return true;}).slice(-30);return o;}
function mergeStores(a,b){resetStats(a);resetStats(b);/* a=local, b=remote; keeps the better progress of both */
 const newer=(b.upd||0)>(a.upd||0)?b:a;const o=Object.assign({},b,a,{xp:Math.max(a.xp||0,b.xp||0),sound:newer.sound,alien:newer.alien,theme:newer.theme,pieces:newer.pieces,pfx:newer.pfx,lvlTitle:('lvlTitle' in newer)?newer.lvlTitle:(a.lvlTitle||b.lvlTitle),ccName:('ccName' in newer)?newer.ccName:(a.ccName||b.ccName),tu:Object.assign({},b.tu||{},a.tu||{}),tuBot:(()=>{const o={};[a.tuBot||{},b.tuBot||{}].forEach(t=>Object.keys(t).forEach(k=>{const x=o[k]=o[k]||{w:0,d:0,l:0};['w','d','l'].forEach(r=>{x[r]=Math.max(x[r],t[k][r]||0);});}));return o;})(),sort:newer.sort,death:newer.death,t1:newer.t1,upd:Math.max(a.upd||0,b.upd||0)});
 o.mastered=Object.assign({},b.mastered||{},a.mastered||{});o.prog={};o.statsV=Math.max(a.statsV||0,b.statsV||0);
 o.tm={};new Set([...Object.keys(a.tm||{}),...Object.keys(b.tm||{})]).forEach(k=>{o.tm[k]=Math.max((a.tm||{})[k]||0,(b.tm||{})[k]||0);});
 o.act={};new Set([...Object.keys(a.act||{}),...Object.keys(b.act||{})]).forEach(k=>{o.act[k]=Math.max((a.act||{})[k]||0,(b.act||{})[k]||0);});
 o.xpDay={};new Set([...Object.keys(a.xpDay||{}),...Object.keys(b.xpDay||{})]).forEach(k=>{o.xpDay[k]=Math.max((a.xpDay||{})[k]||0,(b.xpDay||{})[k]||0);});
 o.pz=Object.assign({},b.pz||{},a.pz||{});o.drillBest=Object.assign({},b.drillBest||{});Object.entries(a.drillBest||{}).forEach(([k,v])=>{if(!o.drillBest[k]||v.ms<o.drillBest[k].ms)o.drillBest[k]=v;});o.eg=Object.assign({},b.eg||{},a.eg||{});
 o.badges=Object.assign({},b.badges||{},a.badges||{});
 o.hideLb=('hideLb' in newer)?newer.hideLb:(a.hideLb||b.hideLb||false);
 /* puzzle, poloviny kapitol, odhady Elo a testovací funkce: spojit postup z obou zařízení (dřív vyhrálo vždy jen toto zařízení) */
 o.pq=mergePq(a.pq,b.pq);if(!o.pq)delete o.pq;o.half=Object.assign({},b.half||{},a.half||{});
 {const gs=[...(b.guess||[]),...(a.guess||[])],seen=new Set();o.guess=gs.filter(x=>{const k=JSON.stringify(x);if(seen.has(k))return false;seen.add(k);return true;}).sort((x,y)=>String(x.d).localeCompare(String(y.d))).slice(-30);if(!o.guess.length)delete o.guess;}
 if(a.bt||b.bt)o.bt=mergeBt(a.bt,b.bt);
 new Set([...Object.keys(a.prog||{}),...Object.keys(b.prog||{})]).forEach(c=>{const pa=(a.prog||{})[c]||{},pb=(b.prog||{})[c]||{};const r={};
  new Set([...Object.keys(pa),...Object.keys(pb)]).forEach(id=>{const x=pa[id],y=pb[id];if(!x||!y){r[id]=x||y;return;}r[id]=((y.box||0)>(x.box||0)||((y.box||0)===(x.box||0)&&(y.due||0)>(x.due||0)))?y:x;});o.prog[c]=r;});
 return o;}
function applyMerged(m){const before=JSON.stringify(store);store=resetStats(m);COURSES.forEach(c=>{store.prog[c.id]=store.prog[c.id]||{};});store.mastered=store.mastered||{};saveLocal();
 if(JSON.stringify(store)!==before){applyTheme();if(typeof applyT1==='function')applyT1();renderSound();renderLvl();if(!$('home').hidden){renderCourses();renderHome();}}}
function queueCloud(){if(!SYNC.be)return;SYNC.dirty=true;clearTimeout(SYNC.t);SYNC.t=setTimeout(pushCloud,1200);}
async function pushCloud(){if(!SYNC.be||SYNC.busy||!SYNC.dirty)return;SYNC.busy=true;SYNC.dirty=false;const be=SYNC.be;
 try{await be.save(store);if(SYNC.be===be)setSync('cloud');}catch(e){if(SYNC.be===be){setSync('err');SYNC.dirty=true;}}
 SYNC.busy=false;if(SYNC.dirty&&SYNC.be){clearTimeout(SYNC.t);SYNC.t=setTimeout(pushCloud,4000);}}
async function attachBackend(be,remote){SYNC.be=be;if(remote)applyMerged(mergeStores(store,remote));
 if(!remote||JSON.stringify(remote)!==JSON.stringify(store)){SYNC.dirty=true;await pushCloud();}else setSync('cloud');}
function setSync(st){SYNC.state=st;const el=document.getElementById('syncInfo');if(el)el.innerHTML=syncLabel();const ab=document.getElementById('accBtn');if(ab)ab.textContent=accBtnText();renderAccTop();}
function needGate(){return HAS_SUPA&&SYNC.ready&&!(SYNC.be&&SYNC.be.kind==='supa')&&SYNC.state!=='wait';}
function updateGate(){const g=document.getElementById('gate');if(!g)return;const need=needGate();
 if(need&&g.hidden){const pk=$('picker');pk.hidden=true;pk.innerHTML='';openAccount(true);}else if(!need&&!g.hidden){g.hidden=true;g.innerHTML='';}}
function renderAccTop(){const b=document.getElementById('accTop'),d=document.getElementById('devTop');if(!b)return;const logged=SYNC.be&&SYNC.be.kind==='supa';
 b.hidden=!HAS_SUPA;b.classList.toggle('in',!!logged);b.textContent=logged?SYNC.user:SYNC.state==='wait'&&getTok()?'Přihlašuji…':'Přihlásit se';b.title=logged?'Tvůj účet':'Přihlásit se nebo vytvořit účet';
 if(d)d.hidden=!(logged&&SYNC.admin);document.querySelectorAll('.nxDevBtn,.nxDevLnk').forEach(x=>x.hidden=!(logged&&SYNC.admin));{const ds=document.getElementById('dsTop');if(ds)ds.hidden=false;}updateGate();}
const escH=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function syncLabel(){const k=SYNC.be&&SYNC.be.kind;
 if(!navigator.onLine)return'<i class="dot"></i>Offline – postup se uloží, až budeš online';
 if(SYNC.state==='cloud')return k==='supa'?`<i class="dot ok"></i>Přihlášen jako <b>${escH(SYNC.user)}</b> – postup se ukládá do účtu`:'<i class="dot ok"></i>Postup se ukládá do tvého účtu Claude – uvidíš ho na všech zařízeních';
 if(SYNC.state==='err')return'<i class="dot warn"></i>Teď nejde uložit do účtu, postup je zatím v tomto prohlížeči';
 if(SYNC.state==='wait')return'<i class="dot"></i>Načítám uložený postup…';
 if(HAS_SUPA)return'<i class="dot"></i>Nejsi přihlášený – postup se ukládá jen v tomto prohlížeči';
 return'<i class="dot"></i>Postup se ukládá v tomto prohlížeči';}
function accBtnText(){return SYNC.be&&SYNC.be.kind==='supa'?'Účet':'Přihlásit / registrovat';}
async function initCloud(){
 if(window.claude&&claude.use){setSync('wait');const timer=setTimeout(()=>{if(SYNC.state==='wait')setSync('local');},10000);
  try{const db=await claude.use('db'),user=db&&await claude.use('user');const id=user&&await user.id();
   if(db&&id){const ref=db.collection('data/users/'+id).doc('progress');const snap=await ref.get();clearTimeout(timer);
    let remote=null;const d=snap&&snap.exists&&snap.data();if(d&&d.json){try{remote=JSON.parse(d.json);}catch(e){}}
    await attachBackend({kind:'claude',save:s=>ref.set({json:JSON.stringify(s),upd:s.upd||Date.now()})},remote);return;}
  }catch(e){}clearTimeout(timer);setSync('local');}
 if(HAS_SUPA)initSupa();}
/* ---------- vlastní účty přes Supabase (jen na vlastním webu) ---------- */
function loadScript(src){return new Promise((ok,ko)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s);});}
/* účty: přihlašovací jméno + heslo, ověřuje databázová funkce v Supabase (supabase.sql) */
const TOK_KEY='trener-token';
const getTok=()=>{try{return localStorage.getItem(TOK_KEY)}catch(e){return null}};const setTok=t=>{try{t?localStorage.setItem(TOK_KEY,t):localStorage.removeItem(TOK_KEY)}catch(e){}};
async function rpc(fn,args){const {data,error}=await SB.rpc(fn,args);if(error)throw error;return data;}
async function loadSB(){if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
  SB=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
async function initSupa(){try{await loadSB();
  const t=getTok();if(t)await onLogin(t);SYNC.ready=true;if(!t)setSync('local');else renderAccTop();
 }catch(e){SB=null;if(getTok()&&store.owner){offlineMode(getTok());return;}SYNC.ready=true;setSync('local');}}
/* bez signálu: hraje se s postupem uloženým v prohlížeči (patří tomuto účtu); po návratu signálu se nejdřív spojí s účtem, pak uloží */
function offlineMode(token){SYNC.user=store.owner;SYNC.uid=store.owner;betaApply();
 const be={kind:'supa',offline:true,save:async()=>{if(!SB)await loadSB();if(be.offline){const r=await rpc('trener_load',{p_token:token});if(r&&r.data)applyMerged(mergeStores(store,r.data));SYNC.admin=!!(r&&r.is_admin);be.offline=false;}return rpc('trener_save',{p_token:token,p_data:store});}};
 SYNC.be=be;SYNC.ready=true;setSync('err');renderAccTop();}
/* zprávy: správce -> hráč a odpovědi hráč -> správce; ukážou se přes celou obrazovku, dokud je příjemce nezavře (kontrola každých 20 s) */
const MSG={shown:new Set(),busy:false};
async function msgCheck(){const tok=getTok();if(!tok||!SB||!SYNC.be||SYNC.be.kind!=='supa'||SYNC.be.offline||MSG.busy||document.hidden||document.getElementById('msgOv'))return;MSG.busy=true;
 try{const list=await rpc('trener_messages',{p_token:tok})||[];const m=list.find(x=>!MSG.shown.has('m'+x.id));if(m)msgShow(m,'msg');
  else if(SYNC.admin){const ib=await rpc('trener_admin_inbox',{p_token:tok})||[];const r=ib.slice().reverse().find(x=>!x.seen&&!MSG.shown.has('r'+x.id));if(r)msgShow(r,'reply');}}catch(e){}MSG.busy=false;}
function msgShow(m,kind){MSG.shown.add((kind==='reply'?'r':'m')+m.id);const d=document.createElement('div');d.id='msgOv';d.className='msgOv';
 d.innerHTML=`<div class="msgCard" role="dialog" aria-modal="true" aria-labelledby="msgT"><div class="msgFrom">${kind==='reply'?'Odpověď od':'Zpráva od'} ${escH(m.from)}</div>${kind==='reply'&&m.re?`<div class="msgRe">na tvou zprávu: „${escH(m.re)}“</div>`:''}<p class="msgBody" id="msgT">${escH(m.body)}</p>
 <textarea id="msgIn" class="msgIn" maxlength="500" rows="2" placeholder="Napiš odpověď…"></textarea><p class="msgNote" id="msgNote" role="status"></p>
 <div class="msgBtns"><button class="btn primary" id="msgSend">Odeslat odpověď</button><button class="btn" id="msgOk">${kind==='reply'?'Zavřít':'Děkuju'}</button></div></div>`;
 document.body.appendChild(d);try{sfx('win');}catch(e){}document.getElementById('msgOk').focus();
 const seen=()=>kind==='reply'?rpc('trener_admin_inbox_seen',{p_token:getTok(),p_id:m.id}):rpc('trener_message_seen',{p_token:getTok(),p_id:m.id});
 const close=async()=>{d.remove();try{await seen();}catch(e){}setTimeout(msgCheck,300);};
 document.getElementById('msgOk').onclick=close;
 document.getElementById('msgSend').onclick=async()=>{const t=document.getElementById('msgIn').value.trim().slice(0,500);const note=document.getElementById('msgNote');if(!t){note.textContent='Nejdřív napiš odpověď.';document.getElementById('msgIn').focus();return;}
  const b=document.getElementById('msgSend');b.disabled=true;note.textContent='Odesílám…';
  try{if(kind==='reply')await rpc('trener_admin_message',{p_token:getTok(),p_user:m.from,p_body:t});else await rpc('trener_reply',{p_token:getTok(),p_body:t,p_reply_to:m.id});
   note.textContent='Odesláno.';setTimeout(close,900);}catch(e){b.disabled=false;note.textContent=/too_many/.test(e.message||'')?'Moc zpráv za hodinu, zkus to později.':'Nepodařilo se odeslat. Zkontroluj připojení a zkus to znovu.';}};}
setInterval(msgCheck,20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)msgCheck();});
async function onLogin(token,known){try{localStorage.setItem('trener-was-in','1');}catch(e){}setSync('wait');
 try{const r=await rpc('trener_load',{p_token:token});setTok(token);SYNC.user=r.username;SYNC.uid=r.username;SYNC.admin=!!r.is_admin;
  if(store.owner!==r.username)resetLocal();betaApply();/* postup jiného účtu (nebo bez účtu) se do tohohle účtu nepřimíchá */
  await attachBackend({kind:'supa',save:s=>rpc('trener_save',{p_token:token,p_data:s})},r.data||null);store.owner=r.username;saveLocal();
  const pk=$('picker');if(!pk.hidden&&pk.querySelector('.acc'))pk.hidden=true;if(isBeta()){cvRefresh(true);}if(isBeta()&&(/^#(souradnice|plan|qg|vyzva|varianty|souperi)$/.test(location.hash)||/^#lekce\/[txmk]_/.test(location.hash)||/^#lekce$|^#zaciname$/.test(location.hash)))route();else if(!$('home').hidden)renderHome();renderAccTop();if(SYNC.admin&&location.hash==='#dev')openDev();setTimeout(msgCheck,1200);return true;
 }catch(e){if(!known&&!/bad_token/.test(e.message||'')&&store.owner){offlineMode(token);return true;}if(/bad_token/.test(e.message||''))setTok(null);SYNC.be=null;SYNC.uid=null;setSync(/bad_token/.test(e.message||'')?'local':'err');if(known)throw e;return false;}}
async function supaLogout(){const t=getTok();try{if(SYNC.dirty){clearTimeout(SYNC.t);await pushCloud();}if(t)await rpc('trener_logout',{p_token:t});}catch(e){}setTok(null);SYNC.be=null;SYNC.user=null;SYNC.uid=null;SYNC.admin=false;betaApply();resetLocal();setSync('local');}
/* smaže postup z tohoto prohlížeče (zůstane jen motiv a zvuk) */
function resetLocal(){store={xp:0,sound:store.sound!==false,theme:store.theme||'green',prog:{},mastered:{}};COURSES.forEach(c=>{store.prog[c.id]={};});saveLocal();
 try{applyTheme();renderSound();renderLvl();if(!$('home').hidden)renderHome();}catch(e){}}
const AUTH_ERR=m=>/taken/.test(m)?'Tohle jméno už někdo má. Vyber si jiné, nebo se přihlas.':/bad_login/.test(m)?'Špatné jméno nebo heslo.':/bad_username/.test(m)?'Jméno: 3–20 znaků, jen písmena bez diakritiky, čísla, tečka, pomlčka nebo podtržítko.':/short_password/.test(m)?'Heslo musí mít aspoň 6 znaků.':/too_many/.test(m)?'Moc pokusů. Zkus to za pár minut.':/Failed to fetch|NetworkError|Load failed/i.test(m)?'Nejde se spojit se serverem. Jsi online? (Free Supabase projekt se mohl uspat.)':/Invalid API key|No API key|JWT|Unauthorized/i.test(m)?'Špatný klíč v config.js. Zkus místo publishable klíče starší „anon“ klíč (viz návod).':/no_user/.test(m)?'Takový hráč neexistuje.':/forbidden/.test(m)?'Na tohle nemáš oprávnění.':/function .* does not exist|Could not find the function/i.test(m)?'V Supabase chybí funkce – spusť soubor supabase.sql (viz návod).':'Nepovedlo se: '+m;
function openAccount(gate){if(gate!==true)gate=false;if(!gate&&needGate())return;let gNew=false;try{gNew=gate&&!localStorage.getItem('trener-was-in')&&!getTok()&&!(store.xp>0);}catch(e){}/* úplně nový návštěvník: rovnou Registrovat */const pk=gate?$('gate'):$('picker');const logged=SYNC.be&&SYNC.be.kind==='supa';
 pk.innerHTML=logged?`<div class="pkCard acc"><h2>Tvůj účet</h2><p>Přihlášen jako <b>${escH(SYNC.user)}</b>. Postup se ukládá do účtu. Na jiném zařízení se přihlas stejným jménem a heslem a uvidíš ho tam taky.</p><div class="row"><button class="btn" id="accClose">Zavřít</button><button class="btn" id="accOut">Odhlásit</button></div></div>`
 :`<div class="pkCard acc">${gate?(gNew?'<h2>Vítej v Šachovém trenažéru</h2><p>Naučíš se tu zahájení, taktiku i koncovky. Krok za krokem, ať hraješ šachy první týden, nebo roky.</p><ul class="accWhat"><li>Lekce od pravidel až po 1500 Elo</li><li>Kurzy zahájení s tahy ověřenými enginem</li><li>Puzzle podle tvé úrovně</li></ul><p>Založ si účet, stačí jméno a heslo. Postup se ti uloží a uvidíš ho na mobilu i na počítači. Je to zdarma.</p>':'<h2>Přihlas se a hraj</h2><p>Na hraní potřebuješ účet. Nemáš ho? Klikni na <b>Registrovat</b>, stačí jméno a heslo. Postup se ti uloží a uvidíš ho na mobilu i na počítači.</p>'):'<h2>Účet</h2><p>S účtem se ti postup uloží a uvidíš ho na mobilu i na počítači.</p>'}${gate&&SYNC.state==='err'?'<p class="accMsg">Nepodařilo se načíst účet. Zkus se přihlásit znovu.</p>':''}
  <div class="accTabs chip2" role="group"><button type="button" data-at="in" aria-pressed="true">Přihlásit</button><button type="button" data-at="up" aria-pressed="false">Registrovat</button></div>
  <form id="accForm" autocomplete="on" novalidate><label>Přihlašovací jméno<input id="accUser" name="username" maxlength="20" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
  <label>Heslo<input id="accPass" name="password" type="password" autocomplete="current-password"></label>
  <label class="accRep" hidden>Heslo znovu<input id="accPass2" type="password" autocomplete="new-password"></label>
  <p class="accHint" hidden>Jméno: 3–20 znaků (a–z, 0–9, tečka, pomlčka, podtržítko). Heslo aspoň 6 znaků. Heslo si zapamatuj – obnovit ho jde jen ručně přes správce webu.</p>
  <p id="accMsg" class="accMsg" role="status"></p><div class="row">${gate?'':'<button type="button" class="btn" id="accClose">Zavřít</button>'}<button type="submit" class="btn primary" id="accGo">Přihlásit</button></div></form></div>`;
 pk.hidden=false;let tab='in';
 pk.onclick=async e=>{if((e.target===pk&&!gate)||e.target.id==='accClose'){pk.hidden=true;return;}if(e.target.id==='accOut'){await supaLogout();pk.hidden=true;if(!$('home').hidden)renderHome();return;}
  const t=e.target.closest('[data-at]');if(t){tab=t.dataset.at;const up=tab==='up';pk.querySelectorAll('[data-at]').forEach(b=>b.setAttribute('aria-pressed',b===t));pk.querySelector('.accRep').hidden=!up;pk.querySelector('.accHint').hidden=!up;$('accGo').textContent=up?'Vytvořit účet':'Přihlásit';$('accPass').autocomplete=up?'new-password':'current-password';$('accMsg').textContent='';}};
 pk.onchange=null;if(gNew){const up=pk.querySelector('[data-at="up"]');if(up)up.click();}
 const f=document.getElementById('accForm');if(!f)return;
 f.onsubmit=async e=>{e.preventDefault();const msg=$('accMsg');if(!SB){msg.textContent='Připojení k účtům teď nefunguje. Obnov stránku, nebo to zkus za chvíli.';return;}
  const user=$('accUser').value.trim().toLowerCase(),pass=$('accPass').value;
  if(!/^[a-z0-9_.-]{3,20}$/.test(user)){msg.textContent=AUTH_ERR('bad_username');return;}if(pass.length<6){msg.textContent=AUTH_ERR('short_password');return;}
  if(tab==='up'&&pass!==$('accPass2').value){msg.textContent='Hesla se neshodují.';return;}
  const go=$('accGo');go.disabled=true;msg.textContent=tab==='up'?'Vytvářím účet…':'Přihlašuji…';
  try{const r=await rpc(tab==='up'?'trener_register':'trener_login',{p_user:user,p_pass:pass});if(r&&r.error)throw new Error(r.error);try{localStorage.setItem('trener-was-in','1');}catch(e){}await onLogin(r.token,true);
  }catch(err){msg.textContent=AUTH_ERR(err&&err.message||String(err));go.disabled=false;}};}
/* ---------- levely podle XP ---------- */
const LVL_NAMES=['Začátečník','Pěšák','Jezdec','Střelec','Věž','Dáma','Král','Klubový hráč','Turnajový hráč','Krajský přeborník','Kandidát mistra','Národní mistr','FIDE mistr','Mezinárodní mistr','Velmistr','Supervelmistr','Kandidát na titul','Mistr světa','Legenda','Šachový bůh'];
const lvlXp=n=>50*n*(n-1);/* XP potřebné na level n: 1→0, 2→100, 3→300, 4→600, 5→1000 … */
const lvlName=n=>LVL_NAMES[Math.min(n,LVL_NAMES.length)-1];/* za posledním levelem už název zůstává */
const myLvl=L=>store.lvlTitle?escH(store.lvlTitle):L.name;/* vlastní název levelu – vidí ho jen majitel účtu */
function lvlOf(xp){xp=xp||0;let n=1;while(xp>=lvlXp(n+1))n++;const a=lvlXp(n),b=lvlXp(n+1);return{n,name:lvlName(n),from:a,to:b,left:b-xp,pct:Math.round((xp-a)/(b-a)*100)};}
function renderLvl(){const el=document.getElementById('sLvl');if(!el)return;const L=lvlOf(store.xp);
 el.innerHTML=`<span class="n">${L.n}</span><span class="lb">${myLvl(L)}<span class="lbar"><i style="width:${L.pct}%"></i></span><small>${store.xp||0} / ${L.to} XP</small></span>`;el.title=`Profil – level ${L.n}, ${myLvl(L)}. Do dalšího levelu chybí ${L.left} XP.`;}
function addXp(gain){const before=lvlOf(store.xp).n;store.xp=(store.xp||0)+gain;{const dk=new Date().toISOString().slice(0,10);store.xpDay=store.xpDay||{};store.xpDay[dk]=(store.xpDay[dk]||0)+gain;}const L=lvlOf(store.xp);renderLvl();if(L.n>before)setTimeout(()=>levelUp(L),700);}
function levelUp(L){if(store.sound)try{[523,659,784,1047,1319].forEach((f,i)=>tone(i*.1,f,.4,.11));tone(.55,1568,.6,.09,'triangle');}catch(e){}
 const d=document.createElement('div');d.className='lvlUp';d.setAttribute('role','status');d.innerHTML=`<div class="k">LEVEL UP!</div><div class="big">${L.n}</div><div class="nm">${myLvl(L)}</div><small>Další level za ${L.left} XP</small>`;document.body.appendChild(d);
 setTimeout(()=>d.classList.add('out'),2600);setTimeout(()=>d.remove(),3100);}
function openLvl(){const pk=$('picker'),L=lvlOf(store.xp);let rows='';const max=LVL_NAMES.length,top=L.n>=max;
 for(let n=1;n<=max;n++){const me=n===Math.min(L.n,max);rows+=`<div class="${me?'me':n>L.n?'no':''}"><span>${n}. ${lvlName(n)}${me&&top&&L.n>max?` <small>(level ${L.n})</small>`:''}</span><span>${lvlXp(n)} XP</span></div>`;}
 pk.innerHTML=`<div class="pkCard lvlInfo"><h2>Level ${L.n} – ${myLvl(L)}</h2><p>Máš <b>${store.xp||0} XP</b>. ${top?'Máš nejvyšší titul – gratuluju! 👑':`Do dalšího levelu chybí <b>${L.left} XP</b>.`} XP dostaneš za každou variantu zahranou zpaměti – bez chyby víc.</p><div class="lvlList">${rows}</div><div class="row"><button class="btn" id="lvlClose">Zavřít</button></div></div>`;
 pk.hidden=false;pk.onchange=null;pk.onclick=e=>{if(e.target===pk||e.target.id==='lvlClose')pk.hidden=true;};
 const me=pk.querySelector('.lvlList .me');if(me){const lst=me.parentElement;lst.scrollTop=me.offsetTop-lst.offsetTop-lst.clientHeight/2+me.clientHeight/2;}}
/* ---------- Najít variantu (#hledat): hraješ tahy, stránka ukáže varianty, které k nim vedou ---------- */
let EX={moves:[],flip:false,showBest:false},EXI=null;
const sanK=m=>m.replace(/[+#!?]/g,'');const fenK=f=>f.split(' ').slice(0,4).join(' ');
function exIndex(){if(EXI)return EXI;EXI=[];/* varianty od hráčů (cvw, cvb) nejsou tvůj repertoár: v Najít variantu mají vlastní kartu, v Rozboru hráče se nepočítají */COURSES.filter(c=>c.id!=='cvw'&&c.id!=='cvb').forEach(c=>c.chapters.forEach(ch=>ch.lines.forEach(l=>{const g=new CHESS();const fens=[fenK(g.fen())];const sans=[];
 for(const m of l.m.split(' ')){let mv;try{mv=g.move(m,{strict:false});}catch(e){break;}sans.push(sanK(mv.san));fens.push(fenK(g.fen()));}EXI.push({c,ch,l,sans,fens});})));return EXI;}
function exGame(){const g=new CHESS();for(const m of EX.moves)g.move(m);return g;}
async function renderExplore(){document.body.classList.add('homeMode');XB.mode='ex';
 if(!CHESS){$('home').innerHTML='<a class="backAll" href="#">← Všechny kurzy</a><p class="profEmpty">Načítám…</p>';try{await chessLib();}catch(e){$('home').innerHTML='<a class="backAll" href="#">← Všechny kurzy</a><p class="profEmpty">Nepodařilo se načíst pravidla šachu. Obnov stránku.</p>';return;}if(page!=='explore')return;}
 exIndex();
 $('home').innerHTML=`<a class="backAll" href="#">← Všechny kurzy</a><div class="exWrap"><div class="exLeft"><div class="profCard"><h2>Najít variantu</h2><p class="profEmpty" style="margin-bottom:10px">Táhni za bílého i černého (klikni nebo přetáhni figuru). Hned uvidíš, které varianty z tvých kurzů k téhle pozici vedou.</p>
 <div class="xRow"><div class="evalBar" id="xEval" title="Hodnocení podle Stockfishe"><div class="w" id="xEvalW"></div><span class="top" id="xEvalTop"></span><span class="bot" id="xEvalBot"></span></div><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div>
 <div class="exCtl"><button class="btn" id="exStart" title="Na začátek">⏮</button><button class="btn" id="exBack" title="Tah zpět">◀</button><button class="btn" id="exFwd" title="Tah vpřed">▶</button><button class="btn" id="exFlip" title="Otočit šachovnici">⇅</button></div>
 <div class="exMoves" id="exMoves"></div></div></div><div class="exRight" id="exRight"></div></div>`;
 renderSide();XB.redo=[];xBuild();xSet();exPanels();if(isBeta()&&!CV.names)cvNames().then(()=>{if(page==='explore')exPanels();}).catch(()=>{});if(isBeta()&&!CV.list)cvRefresh(false).then(()=>{if(page==='explore')exPanels();});
 $('exStart').onclick=()=>{if(!EX.moves.length)return;XB.redo=EX.moves.slice().reverse().concat(XB.redo);EX.moves=[];xJump();};
 $('exBack').onclick=()=>{if(!EX.moves.length)return;XB.redo.unshift(EX.moves.pop());xJump();};
 $('exFwd').onclick=()=>{if(!XB.redo.length)return;exPlay(XB.redo.shift(),true);};
 $('exFlip').onclick=()=>{EX.flip=!EX.flip;xBuild();xSet();$('xEval').classList.toggle('flip',EX.flip);if(XE.last)xEvalShow(XE.last);};
 $('exMoves').onclick=e=>{const bt=e.target.closest('.exMv');if(!bt)return;const k=+bt.dataset.to;XB.redo=EX.moves.slice(k).concat(XB.redo);EX.moves=EX.moves.slice(0,k);xJump();};
 $('exRight').onclick=e=>{const ch=e.target.closest('.exChip');if(ch){exPlay(ch.dataset.play);return;}
  const ln=e.target.closest('.exLine');if(ln){const [cid,lid]=ln.dataset.open.split('|');const c=COURSES.find(x=>x.id===cid);course=c;page='course';history.pushState(null,'','#'+c.id);openLine(LINES().find(l=>l.id===lid));}};
 xInput();}
/* Stockfish na stránce hledání */
const XE={t:null,fen:null,last:null};
function xBar(cp){const el=$('xEval');if(!el)return;const c=Math.max(-800,Math.min(800,cp));const wPct=50+50*(2/(1+Math.exp(-0.004*c))-1);el.classList.toggle('flip',xFlip());$('xEvalW').style.height=wPct+'%';
 const txt=(Math.abs(cp)>=2900?'M'+(3000-Math.abs(cp)):(Math.abs(cp)/100).toFixed(1));const fl=xFlip();$('xEvalTop').textContent=(fl?cp>0:cp<0)?txt:'';$('xEvalBot').textContent=(fl?cp<=0:cp>=0)?txt:'';$('xEvalTop').style.color=fl?'#3c3a37':'#f3f3f1';$('xEvalBot').style.color=fl?'#f3f3f1':'#3c3a37';}
function xArrow(u,col){const svg=$('xArrows');if(!svg)return;if(!u){svg.innerHTML='';return;}const f=sqOf(u.slice(0,2)),t=sqOf(u.slice(2,4));const cx=i=>xCol(i)+.5,cy=i=>xRow(i)+.5;let x1=cx(f),y1=cy(f),x2=cx(t),y2=cy(t);
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;x1+=ux*.3;y1+=uy*.3;const hx=x2-ux*.44,hy=y2-uy*.44,w=.17,hw=.38,px=-uy,py=ux;
 svg.innerHTML=`<polygon fill="${col==='green'?'#2e9e5b':col&&col[0]==='#'?col:'#2f8fe8'}" opacity=".85" points="${x1+px*w/2},${y1+py*w/2} ${hx+px*w/2},${hy+py*w/2} ${hx+px*hw},${hy+py*hw} ${x2},${y2} ${hx-px*hw},${hy-py*hw} ${hx-px*w/2},${hy-py*w/2} ${x1-px*w/2},${y1-py*w/2}"/>`;}
function xEvalShow(r){const el=$('xEng');const l=r&&r.lines[0];if(!el||!l)return;xBar(l.cp);if(XE.tb)setTimeout(()=>{const t=document.getElementById('xTb');if(!t)el.insertAdjacentHTML('beforeend',`<div id="xTb" class="tbLine">${XE.tb}</div>`);},0);
 const lab=l.cp>150?'bílý stojí lépe':l.cp>40?'bílý má malou výhodu':l.cp<-150?'černý stojí lépe':l.cp<-40?'černý má malou výhodu':'vyrovnaná pozice';
 el.innerHTML=`<b>Hodnocení:</b> ${fmtCp(l.cp)} <small>(${lab} · hloubka ${r.depth||l.depth})</small><br><b>Nejlepší pokračování:</b> ${pvSan(r.fen,l.pv,6)}`;
 xArrow(EX.showBest&&l.pv[0]?l.pv[0]:null);}
function exEval(){clearTimeout(XE.t);XE.tb=null;{const f=exGame().fen();tbProbe(f).then(d=>{if(!d||exGame().fen()!==f)return;const stm=f.split(' ')[1];const txt=tbTxt(d,f,stm).replace('Databáze: vyhráváš','Databáze: strana na tahu vyhrává').replace('Databáze: prohráváš','Databáze: strana na tahu prohrává').replace('soupeř má mat','mat');XE.tb=txt+(d.moves&&d.moves[0]?` · nejlepší tah <b>${d.moves[0].san}</b>`:'');const el=$('xEng');if(el&&!document.getElementById('xTb'))el.insertAdjacentHTML('beforeend',`<div id="xTb" class="tbLine">${XE.tb}</div>`);});}if(SF.dead){const el=$('xEng');if(el)el.textContent='Engine se nepodařilo načíst.';return;}XE.t=setTimeout(async()=>{const fen=exGame().fen();XE.fen=fen;XE.last=null;
 const g=exGame();if(g.isGameOver()){const el=$('xEng');if(el)el.innerHTML=g.isCheckmate()?`<b>Mat!</b> Vyhrál ${g.turn()==='w'?'černý':'bílý'}.`:'<b>Remíza.</b>';return;}
 try{const r=await sfAnalyse(fen,{movetime:IS_MOBILE?1500:2500,onInfo:j=>{if(j.depth>=6&&XE.fen===fen&&page==='explore')xEvalShow(j);}});if(r&&XE.fen===fen&&page==='explore'){XE.last=r;xEvalShow(r);}}catch(e){const el=$('xEng');if(el)el.textContent='Engine se nepodařilo načíst.';}},120);}
/* šachovnice stránky hledání – stejné prvky a styl jako v trenažéru */
const XB={sq:[],pcs:{},sel:null,drag:null,redo:[],mode:'ex'};
const xFlipBase=()=>XB.mode==='pq'?PQ.flip:XB.mode==='pz'?PZ.flip:XB.mode==='eg'?EG.flip:XB.mode==='rz'?!!(RZ.view&&RZ.view.x.col==='b'):XB.mode==='rv'?!!RV.flip:XB.mode==='tu'?TU.flip:EX.flip,xFlip=()=>xFlipBase()!==!!XB.uf,xGame=()=>(XB.mode==='pq'||XB.mode==='pz'||XB.mode==='eg')?xViewG():XB.mode==='rz'?RZ.vg:XB.mode==='rv'?RV.vg:XB.mode==='tu'?((TU.bot.view!=null||TU.view!=null)&&TU.vg?TU.vg:TU.g):exGame();
const xCol=i=>xFlip()?7-(i&7):(i&7),xRow=i=>xFlip()?(i>>3):7-(i>>3);
function xPlace(el,i){el.style.transform=`translate(${xCol(i)*100}%,${xRow(i)*100}%)`;}
function xBuild(){const el=$('xSqs');if(!el)return;if(XB.vw!=null){XB.vw=null;XB.vg=null;XB.vwA=null;}el.innerHTML='';XB.sq=[];for(let row=0;row<8;row++)for(let col=0;col<8;col++){const r=xFlip()?row:7-row,f=xFlip()?7-col:col,i=r*8+f;const d=document.createElement('div');d.className='sq '+((r+f)%2?'l':'d');
 if(col===0)d.innerHTML+=`<span class="co r">${r+1}</span>`;if(row===7)d.innerHTML+=`<span class="co f">${FILES[f]}</span>`;el.appendChild(d);XB.sq[i]=d;}}
/* procházení tahů šipkami ← → v puzzle, pastech a koncovkách (jen prohlížení; klepnutím na šachovnici nebo → až na konec se vrátíš k hraní) */
const xLiveG=()=>XB.mode==='pq'?PQ.g:XB.mode==='pz'?PZ.g:XB.mode==='eg'?EG.g:null;
function xViewG(){const g=xLiveG();if(XB.vw!=null&&(!g||XB.vwF!==g.fen()||XB.vwM!==XB.mode)){XB.vw=null;XB.vg=null;xVwBadge();}return XB.vw!=null&&XB.vg?XB.vg:g;}
function xView(v){const g=xLiveG();if(!g)return;const h=g.history({verbose:true}),n=h.length;
 if(v==null||v>=n){if(XB.vw==null)return;XB.vw=null;XB.vg=null;const a=$('xArrows');if(a&&XB.vwA!=null)a.innerHTML=XB.vwA;XB.vwA=null;}
 else{if(!n)return;v=Math.max(0,v);if(XB.vw==null){const a=$('xArrows');XB.vwA=a?a.innerHTML:null;}const vg=new CHESS(h[0].before);for(let i=0;i<v;i++)vg.move(h[i].san);XB.vw=v;XB.vg=vg;XB.vwF=g.fen();XB.vwM=XB.mode;const a=$('xArrows');if(a)a.innerHTML='';}
 XB.sel=null;xSet();xVwBadge();sfx('move');}
function xVwBadge(){const B=$('xBoard');if(!B)return;let el=document.getElementById('xVwB');
 if(XB.vw==null){if(el)el.remove();return;}const g=xLiveG();const n=g?g.history().length:0;
 if(!el){el=document.createElement('button');el.id='xVwB';el.type='button';el.className='xVwB';el.onclick=e=>{e.stopPropagation();xView(null);};B.appendChild(el);}
 el.innerHTML=`${XB.vw===0?'Výchozí pozice':`Prohlížíš tah ${XB.vw} z ${n}`} · zpět k hraní`;}
document.addEventListener('pointerdown',e=>{if(XB.vw!=null&&e.target.closest&&e.target.closest('#xBoard')&&!e.target.closest('#xVwB')){xView(null);XB.vwEat=true;e.stopPropagation();e.preventDefault();}},true);
document.addEventListener('click',e=>{if(XB.vwEat){XB.vwEat=false;if(e.target.closest&&e.target.closest('#xBoard')){e.stopPropagation();e.preventDefault();}}},true);
addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;if(e.target&&/input|textarea|select/i.test(e.target.tagName))return;
 /* Najít variantu: stejné jako tlačítka zpět / vpřed */
 if(page==='explore'&&$('exBack')){(e.key==='ArrowLeft'?$('exBack'):$('exFwd')).click();e.preventDefault();e.stopImmediatePropagation();return;}
 /* prohlížeč partie v kartě Nové partie z chess.com */
 if(BT.gv&&document.getElementById('btGv'+BT.gv.i)&&!document.getElementById('btGv'+BT.gv.i).hidden){const b=document.querySelector(`#btGv${BT.gv.i} [data-gk="${e.key==='ArrowLeft'?'b':'f'}"]`);if(b){b.click();e.preventDefault();e.stopImmediatePropagation();return;}}
 if(!['pq','puzzles','endgames'].includes(page)||!$('xBoard')||!xLiveG())return;
 const n=xLiveG().history().length;if(e.key==='ArrowLeft')xView((XB.vw==null?n:XB.vw)-1);else if(XB.vw!=null)xView(XB.vw+1);
 e.preventDefault();e.stopImmediatePropagation();},true);
function xSet(){const g=xGame(),P=$('xPcs');if(!P)return;P.innerHTML='';XB.pcs={};const b=g.board();
 for(let r=0;r<8;r++)for(let f=0;f<8;f++){const pc=b[r][f];if(!pc)continue;const i=(7-r)*8+f;const el=document.createElement('div');el.className='pc';el.dataset.p=pc.color+pc.type.toUpperCase();el.innerHTML=PC(el.dataset.p);xPlace(el,i);P.appendChild(el);XB.pcs[i]=el;}
 xMarks();}
/* plynulý přechod na jinou pozici (Rozbor partie): figury, které zůstaly, stojí; přesunuté sklouznou z nejbližšího pole; sebrané zmizí, vrácené se objeví */
function xMorph(){const g=xGame(),P=$('xPcs');if(!P)return;const old=XB.pcs||{};const olds=Object.keys(old);if(!olds.length||olds.some(i=>!old[i].dataset.p||!old[i].isConnected)){xSet();return;}
 const b=g.board(),want={};for(let r=0;r<8;r++)for(let f=0;f<8;f++){const pc=b[r][f];if(pc)want[(7-r)*8+f]=pc.color+pc.type.toUpperCase();}
 const next={},free=[];for(const i of olds){const el=old[i];if(want[i]===el.dataset.p){next[i]=el;}else free.push([+i,el]);}
 const dist=(a,c)=>Math.abs((a&7)-(c&7))+Math.abs((a>>3)-(c>>3));
 for(const t of Object.keys(want).map(Number)){if(next[t])continue;const code=want[t];let bi=-1,bd=99;free.forEach(([i,el],k)=>{if(el.dataset.p===code){const d=dist(i,t);if(d<bd){bd=d;bi=k;}}});
  if(bi>=0){const el=free.splice(bi,1)[0][1];el.style.zIndex=3;xPlace(el,t);setTimeout(()=>{el.style.zIndex='';},260);next[t]=el;}
  else{const el=document.createElement('div');el.className='pc gone';el.dataset.p=code;el.innerHTML=PC(code);xPlace(el,t);P.appendChild(el);requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('gone')));next[t]=el;}}
 free.forEach(([i,el])=>{el.style.zIndex=1;el.classList.add('gone');setTimeout(()=>el.remove(),230);});
 XB.pcs=next;xMarks();}
function xMarks(){XB.sq.forEach(d=>d.classList.remove('last','sel','dt','rg','hintsq'));const g=xGame();const h=g.history({verbose:true});const last=h[h.length-1];
 {let lm=last;if(!lm&&XB.mode==='tu'&&TU.les&&TU.les.ex.last)lm={from:TU.les.ex.last.slice(0,2),to:TU.les.ex.last.slice(2,4)};if(lm){XB.sq[sqOf(lm.from)].classList.add('last');XB.sq[sqOf(lm.to)].classList.add('last');}}
 if(XB.sel!=null){XB.sq[XB.sel].classList.add('sel');g.moves({square:sqName(XB.sel),verbose:true}).forEach(m=>{const t=sqOf(m.to);XB.sq[t].classList.add(g.get(m.to)||m.flags.includes('e')?'rg':'dt');});}}
function xAnimate(mv){const from=sqOf(mv.from),to=sqOf(mv.to);const el=XB.pcs[from];const capSq=mv.flags.includes('e')?to+(mv.color==='w'?-8:8):to;const cap=XB.pcs[capSq];
 if(cap&&cap!==el){delete XB.pcs[capSq];cap.style.zIndex=1;setTimeout(()=>{cap.classList.add('gone');setTimeout(()=>cap.remove(),220);},130);}
 delete XB.pcs[from];XB.pcs[to]=el;if(el){el.classList.remove('drag');xPlace(el,to);if(mv.promotion)el.innerHTML=PC(mv.color+mv.promotion.toUpperCase());}
 if(mv.flags.includes('k')||mv.flags.includes('q')){const h=mv.color==='w'?0:56;const [a,b2]=mv.flags.includes('k')?[h+7,h+5]:[h,h+3];const r=XB.pcs[a];delete XB.pcs[a];XB.pcs[b2]=r;if(r)xPlace(r,b2);}}
function exPlay(san,keepRedo){const g=exGame();let mv;try{mv=g.move(san,{strict:false});}catch(e){return false;}if(!mv)return false;
 if(!keepRedo){XB.redo=XB.redo[0]===mv.san?XB.redo.slice(1):[];}EX.moves.push(mv.san);XB.sel=null;xAnimate(mv);xMarks();sfx(mv.flags.includes('k')||mv.flags.includes('q')?'castle':g.inCheck()?'check':mv.captured?'capture':'move');exPanels();return true;}
function xJump(){XB.sel=null;xSet();exPanels();sfx('move');}
function xSqAt(x,y){const r=$('xBoard').getBoundingClientRect();const col=Math.floor((x-r.left)/r.width*8),row=Math.floor((y-r.top)/r.height*8);if(col<0||col>7||row<0||row>7)return null;const f=xFlip()?7-col:col,rk=xFlip()?row:7-row;return rk*8+f;}
function xTry(from,to){if(XB.mode==='rz'||XB.mode==='rv')return false;if(XB.mode!=='pq'&&!XPROMO){const m=XB.mode;const pg=m==='tu'?(TU.lock?null:TU.g):m==='pz'?(PZ.lock||!PZ.cur?null:PZ.g):m==='eg'?(EG.lock||EG.done?null:EG.g):exGame();if(askPromo(pg,sqName(from),sqName(to),$('xBoard'),()=>xTry(from,to),()=>xSet()))return true;}if(XB.mode==='tu')return tuTry(from,to);if(XB.mode==='pz')return pzTry(from,to);if(XB.mode==='pq')return pqTry(from,to);if(XB.mode==='eg')return egTry(from,to);const g=exGame();let mv=null;try{mv=g.move({from:sqName(from),to:sqName(to),promotion:XPROMO||'q'});}catch(e){}if(!mv)return false;return exPlay(mv.san);}
/* kreslení šipek a značek na šachovnici stránek Pasti / Koncovky / Hledání – stejně jako v lekcích */
const XM={marks:[],start:null,pen:false};
function xEnsureDraw(){const B=$('xBoard');if(!B)return;if(!document.getElementById('xDraw')){const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('class','draw');sv.setAttribute('id','xDraw');sv.setAttribute('viewBox','0 0 8 8');sv.setAttribute('aria-hidden','true');B.appendChild(sv);}
 const row=B.closest('.xRow');if(row&&!row.parentElement.querySelector('.xTools')){const t=document.createElement('div');t.className='xTools';t.innerHTML='<button class="btn penBtn" id="xPen" aria-pressed="'+XM.pen+'" title="Kreslení šipek levým tlačítkem (pravým kreslíš vždy)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.2V21h3.8l11-11-3.8-3.8-11 11zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8L20.7 7z"/></svg> Kreslit</button><button class="btn" id="xClr">Smazat značky</button><button class="btn" id="xFlipU" title="Otočit šachovnici (klávesa F)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3 5 6.99h3V14h2V6.99h3L9 3z"/></svg> Otočit</button><small>Pravé tlačítko: šipka nebo pole (znovu = smazat, podržet = smazat vše) · Shift/Alt/Ctrl jiná barva · F = otočit šachovnici</small>';row.after(t);
  $('xPen').onclick=()=>{XM.pen=!XM.pen;$('xPen').setAttribute('aria-pressed',XM.pen);};$('xClr').onclick=()=>{XM.marks=[];xRenderMarks();};$('xFlipU').onclick=()=>boardFlip();}
 {const fb=document.getElementById('xFlipU');if(fb)fb.hidden=XB.mode==='ex';}
 XM.marks=[];xRenderMarks();}
/* Otočit šachovnici (19. 11. 2026): tlačítko Otočit pod šachovnicí, v trenažéru vedle Kreslení, a klávesa F. Platí, dokud hráč neodejde na jinou stránku (XB.uf / flipped). Zvýraznění polí zůstanou. */
function boardFlip(){const X=document.getElementById('xBoard');if(X&&X.offsetParent){if(XB.mode==='ex'){EX.flip=!EX.flip;}else XB.uf=!XB.uf;const cls=XB.sq.map(d=>d&&d.className);xBuild();cls.forEach((c,i)=>{if(c&&XB.sq[i])XB.sq[i].className=c;});Object.entries(XB.pcs||{}).forEach(([i,el])=>xPlace(el,+i));xRenderMarks();return;}
 const B=document.getElementById('board');if(B&&B.offsetParent&&typeof buildSquares==='function'){const cls=SQ.map(d=>d&&d.className);flipped=!flipped;buildSquares();cls.forEach((c,i)=>{if(c&&SQ[i])SQ[i].className=c;});Object.entries(pcs||{}).forEach(([i,el])=>place(el,+i));if(typeof renderMarks==='function')renderMarks();}}
addEventListener('keydown',e=>{if((e.key==='f'||e.key==='F')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!(e.target&&/input|textarea|select/i.test(e.target.tagName))&&!(e.target&&e.target.isContentEditable)){const b=[...document.querySelectorAll('#board,#xBoard')].find(x=>x.offsetParent);if(b){boardFlip();e.preventDefault();}}});
function xRenderMarks(){const el=document.getElementById('xDraw');if(!el)return;el.innerHTML=marksSVG(XM.marks,q=>xCol(q)+.5,q=>xRow(q)+.5);}
function xInput(){const B=$('xBoard');xEnsureDraw();
 B.addEventListener('contextmenu',e=>e.preventDefault());
 B.addEventListener('pointerdown',e=>{if(e.button===2||(XM.pen&&e.button===0)){const i=xSqAt(e.clientX,e.clientY);if(i!=null){XM.start={sq:i,c:markColor(e)};clearTimeout(XM.hold);XM.hold=setTimeout(()=>{if(XM.start&&XM.start.sq===i){XM.marks=[];xRenderMarks();XM.start=null;}},650);e.stopImmediatePropagation();e.preventDefault();}}},true);
 B.addEventListener('pointerup',e=>{clearTimeout(XM.hold);if(!XM.start)return;const i=xSqAt(e.clientX,e.clientY);if(i!=null&&i===XM.start.sq){markClick(XM.marks,i,boardPt(B,e.clientX,e.clientY),q=>xCol(q)+.5,q=>xRow(q)+.5,XM.start.c);xRenderMarks();XM.start=null;e.stopImmediatePropagation();return;}if(i!=null){const f=XM.start.sq,t=i,c=XM.start.c;const k=XM.marks.findIndex(m=>m.f===f&&m.t===t);if(k>=0)XM.marks.splice(k,1);else XM.marks.push({f,t,c});xRenderMarks();}XM.start=null;e.stopImmediatePropagation();},true);
 B.addEventListener('pointerdown',e=>{if(e.button>0)return;ac();const i=xSqAt(e.clientX,e.clientY);if(i==null)return;if((XB.mode==='pz'&&PZ.lock)||(XB.mode==='pq'&&(PQ.lock||PQ.done))||(XB.mode==='eg'&&EG.lock)||XB.mode==='rz'||XB.mode==='rv'||(XB.mode==='tu'&&(TU.lock||TU.view!=null||TU.bot.view!=null)))return;const g=xGame();const pc=g.get(sqName(i));
  if(XB.sel!=null&&XB.sel!==i&&xTry(XB.sel,i))return;
  if(pc&&pc.color===g.turn()){const was=XB.sel===i;XB.sel=i;xMarks();XB.drag={from:i,el:XB.pcs[i],x:e.clientX,y:e.clientY,moved:false,was};B.setPointerCapture(e.pointerId);e.preventDefault();}
  else{XB.sel=null;xMarks();}});
 B.addEventListener('pointermove',e=>{const d=XB.drag;if(!d||!d.el)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<5)return;d.moved=true;const r=B.getBoundingClientRect(),s=r.width/8;d.el.classList.add('drag');
  const x=Math.max(-s/2,Math.min(r.width-s/2,e.clientX-r.left-s/2)),y=Math.max(-s/2,Math.min(r.height-s/2,e.clientY-r.top-s/2));d.el.style.transform=`translate(${x}px,${y}px)`;});
 B.addEventListener('pointerup',e=>{const d=XB.drag;XB.drag=null;if(!d)return;
  if(d.moved){const to=xSqAt(e.clientX,e.clientY);if(to==null||to===d.from||!xTry(d.from,to)){d.el.classList.remove('drag');xPlace(d.el,d.from);}}
  else if(d.was){XB.sel=null;xMarks();}});
 B.addEventListener('pointercancel',()=>{const d=XB.drag;XB.drag=null;if(d&&d.el){d.el.classList.remove('drag');xPlace(d.el,d.from);}});}
function exPanels(){const I=exIndex(),g=exGame(),n=EX.moves.length,key=fenK(g.fen()),seq=EX.moves.map(sanK);
 const exact=I.filter(x=>x.sans.length>=n&&seq.every((m,i)=>x.sans[i]===m));
 const trans=n?I.filter(x=>!exact.includes(x)&&x.fens.indexOf(key)>0):[];
 const nxt={};exact.forEach(x=>{if(x.sans.length>n){const m=x.sans[n];nxt[m]=(nxt[m]||0)+1;}});trans.forEach(x=>{const k=x.fens.indexOf(key);if(k>=0&&k<x.sans.length){const m=x.sans[k];nxt[m]=(nxt[m]||0)+1;}});
 const nxtS=Object.entries(nxt).sort((a,b)=>b[1]-a[1]);
 $('exMoves').innerHTML=EX.moves.map((m,i)=>(i%2===0?`<b>${i/2+1}.</b>`:'')+`<button class="exMv${i===n-1?' cur':''}" data-to="${i+1}">${m}</button>`).join(' ')||'<span class="profEmpty">Zatím žádný tah. Zahraj první tah za bílého.</span>';
 const row=(x,tr)=>{const st=stateIn(x.c,x.l);return `<button class="exLine" data-open="${x.c.id}|${x.l.id}"><span class="exIc ${x.c.side==='b'?'b':''}">${courseIcon(x.c)}</span><span class="exTx"><b>${x.l.name}${enH(x.l)}</b><small>${x.c.title} · ${x.ch.t}${tr?' · jiné pořadí tahů':''}</small><small class="exFull">${x.l.full}</small></span><span class="st s-${st}" title="${ST[st][0]}">${STI[st]}</span></button>`;};
 const LIM=60;
 $('exRight').innerHTML=`<div class="profCard"><h2>Stockfish</h2><div class="engBox" id="xEng"><span class="spin"></span> Engine počítá…</div><div class="freeBtns"><button class="btn" id="xBestBtn">${EX.showBest?'Skrýt nejlepší tah':'Ukázat nejlepší tah'}</button></div></div><div class="profCard"><h2>Jak repertoár pokračuje</h2>${nxtS.length?`<div class="exNext">${nxtS.map(([m,k])=>`<button class="exChip" data-play="${m}">${m}<small>${k} ${k===1?'varianta':k<5?'varianty':'variant'}</small></button>`).join('')}</div>`:`<p class="profEmpty">${n?'Tady už žádná varianta z kurzů nepokračuje.':'—'}</p>`}</div>
 <div class="profCard"><h2>Varianty, které k tomu vedou <small class="exCnt">${exact.length}</small></h2>${exact.length?`<div class="exList">${exact.slice(0,LIM).map(x=>row(x,false)).join('')}</div>${exact.length>LIM?`<p class="profEmpty">…a dalších ${exact.length-LIM}. Zahraj další tah a seznam se zúží.</p>`:''}`:'<p class="profEmpty">Žádná varianta z kurzů nejde přesně tímhle pořadím tahů.</p>'}</div>
 ${trans.length?`<div class="profCard"><h2>Stejná pozice jiným pořadím tahů <small class="exCnt">${trans.length}</small></h2><div class="exList">${trans.slice(0,LIM).map(x=>row(x,true)).join('')}</div></div>`:''}`+cvExploreHTML(exact);cvWire($('exRight'));
 $('xBestBtn').onclick=()=>{EX.showBest=!EX.showBest;$('xBestBtn').textContent=EX.showBest?'Skrýt nejlepší tah':'Ukázat nejlepší tah';if(XE.last)xEvalShow(XE.last);else xArrow(null);};xArrow(null);exEval();}
/* ---------- přepínač vzhledu pro vývojáře ---------- */
function openDesigns(){const pk=$('picker');const D=window.DESIGNS;
 pk.innerHTML=`<div class="pkCard dsCard"><h2>Vzhled webu</h2><p>Vyzkoušej, který vzhled se ti líbí nejvíc. Volba platí jen pro tebe a dá se kdykoli změnit. Názor řekni Davidovi.</p><div class="dsList">${Object.entries(D).filter(([k])=>window.MUSEUM||k==='neo').map(([k,v])=>`<button class="dsOpt${window.DESIGN===k?' on':''}" data-ds="${k}"><b>${v.n}</b><small>${v.d}</small></button>`).join('')}</div><div class="row"><button class="btn" id="dsClose">Zavřít</button></div></div>`;
 pk.hidden=false;pk.onchange=null;pk.onclick=e=>{if(e.target===pk||e.target.id==='dsClose'){pk.hidden=true;return;}const b=e.target.closest('[data-ds]');if(!b)return;const k=b.dataset.ds;
  try{if(k==='neo')localStorage.removeItem('trener-design');else localStorage.setItem('trener-design',k);}catch(err){}window.applyDesign(k);updDsBadge();pk.querySelectorAll('.dsOpt').forEach(x=>x.classList.toggle('on',x===b));};}
function updDsBadge(){const n=document.getElementById('dsName');if(n)n.textContent=(window.DESIGNS[window.DESIGN]||{}).n||'';}
/* ---------- Pasti (#pasti): soupeř udělá častou chybu z Lichess, ty najdi trest ---------- */
let PZ={g:null,flip:false,cur:null,filter:'all',lock:false,tries:0,shown:false};
const pzDone=id=>!!(store.pz&&store.pz[id]);
function pzList(){return PUZZLES.filter(z=>PZ.filter==='all'||z.c===PZ.filter);}
function pzNext(){const L=pzList();const un=L.filter(z=>!pzDone(z.id));return (un.length?un:L)[0]||null;}
async function renderPuzzles(){document.body.classList.add('homeMode');XB.mode='pz';
 if(!CHESS){$('home').innerHTML='<a class="backAll" href="#">← Všechny kurzy</a><p class="profEmpty">Načítám…</p>';try{await chessLib();}catch(e){return;}if(page!=='puzzles')return;}
 const cnt={};PUZZLES.forEach(z=>{cnt[z.c]=(cnt[z.c]||0)+1;});const solved=PUZZLES.filter(z=>pzDone(z.id)).length;
 const chips=`<button data-pzf="all" aria-pressed="${PZ.filter==='all'}">Vše <small>${PUZZLES.length}</small></button>`+COURSES.filter(c=>cnt[c.id]).map(c=>`<button data-pzf="${c.id}" aria-pressed="${PZ.filter===c.id}">${c.title} <small>${PUZZLES.filter(z=>z.c===c.id&&pzDone(z.id)).length}/${cnt[c.id]}</small></button>`).join('');
 $('home').innerHTML=pqTabs('kurzy')+`<div class="profCard pzHead"><h2>Pasti z tvých kurzů</h2><p class="profEmpty">Pozice z tvých kurzů, kde soupeř na Lichess často udělá chybu. Najdi tah, kterým ho potrestáš. Vyřešeno <b>${solved}/${PUZZLES.length}</b>.</p><div class="pzChips">${chips}</div></div>
 <div class="exWrap"><div class="exLeft"><div class="profCard"><div class="xRow"><div class="evalBar" id="xEval"><div class="w" id="xEvalW"></div><span class="top" id="xEvalTop"></span><span class="bot" id="xEvalBot"></span></div><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div></div></div>
 <div class="exRight"><div class="profCard" id="pzPanel"></div><div class="profCard"><h2>Seznam pastí</h2><div class="pzList" id="pzList"></div></div></div></div>`;
 renderSide();
 $('home').querySelectorAll('[data-pzf]').forEach(b=>b.onclick=()=>{PZ.filter=b.dataset.pzf;PZ.cur=null;renderPuzzles();});
 xInput();pzLoad(PZ.cur&&pzList().includes(PZ.cur)?PZ.cur:pzNext());}
function pzRenderList(){const el=$('pzList');if(!el)return;el.innerHTML=pzList().map((z,i)=>{const c=COURSES.find(x=>x.id===z.c);return `<button class="pzItem${z===PZ.cur?' cur':''}${pzDone(z.id)?' ok':''}" data-pz="${z.id}"><span class="exIc ${c.side==='b'?'b':''}">${courseIcon(c)}</span><span class="exTx"><b>${z.lab}?</b><small>${c.title} · ${z.ch} · hraje ${String(z.share).replace('.',',')} %</small></span><span>${pzDone(z.id)?'✓':''}</span></button>`;}).join('')||'<p class="profEmpty">Žádné pasti.</p>';
 el.querySelectorAll('[data-pz]').forEach(b=>b.onclick=()=>{pzLoad(PUZZLES.find(z=>z.id===b.dataset.pz));window.scrollTo({top:0,behavior:'smooth'});});}
function pzLoad(z){XM.marks=[];xRenderMarks();document.querySelectorAll('.pzPop').forEach(x=>x.remove());if(XB.sq&&XB.sq.length)pzClearMarks();PZ.cur=z;PZ.tries=0;PZ.shown=false;XB.sel=null;xArrow&&xArrow(null);if(!z){$('pzPanel').innerHTML='<p class="profEmpty">Žádné pasti v tomhle výběru.</p>';return;}
 const c=COURSES.find(x=>x.id===z.c);PZ.flip=c.side==='b';PZ.g=new CHESS(z.before);PZ.lock=true;xBuild();xSet();xBar(z.was);pzRenderList();
 $('pzPanel').innerHTML=`<h2>${c.title}</h2><p class="profEmpty">${z.ch}</p><div class="engBox"><b>Soupeř zahrál ${z.lab}?</b> Tenhle tah na Lichess hraje <b>${String(z.share).replace('.',',')} %</b> hráčů (${fmtN(z.games)} partií). Je to chyba – najdi tah, kterým ho potrestáš. Hraješ za ${c.side==='w'?'bílé':'černé'}.</div><p class="accMsg" id="pzMsg"></p><div class="freeBtns"><button class="btn" id="pzHint">Nápověda</button><button class="btn" id="pzShow">Ukázat řešení</button><button class="btn primary" id="pzNextBtn">Další past</button></div>`;
 $('pzHint').onclick=()=>{const u=z.pv[0];XB.sq[sqOf(u.slice(0,2))].classList.add('hintsq');$('pzMsg').textContent='Táhni zvýrazněnou figurou.';PZ.tries=Math.max(PZ.tries,1);};
 $('pzShow').onclick=()=>pzSolve(true);
 $('pzNextBtn').onclick=()=>{const L=pzList();const i=L.indexOf(z);const un=L.slice(i+1).concat(L.slice(0,i)).find(x=>!pzDone(x.id));pzLoad(un||L[(i+1)%L.length]);};
 setTimeout(()=>{if(PZ.cur!==z)return;let mv;try{mv=PZ.g.move(z.mistake,{strict:false});}catch(e){}if(mv){xAnimate(mv);xMarks();sfx(mv.captured?'capture':'move');}PZ.lock=false;},650);}

/* ---------- Pasti: značky, oslava, okno a pokračování ---------- */
function pzMark(sq,kind){const d=XB.sq[sq];if(!d)return;d.classList.add(kind==='ok'?'pzOk':'pzBad');const m=document.createElement('span');m.className='pzMk '+kind;m.textContent=kind==='ok'?'✓':'✕';d.appendChild(m);}
function pzClearMarks(){XB.sq.forEach(d=>{if(!d)return;d.classList.remove('pzOk','pzBad');d.querySelectorAll('.pzMk').forEach(x=>x.remove());});}
function confettiAt(host){if(!host||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas');c.className='confetti';host.appendChild(c);
 const r=host.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=r.width*dpr;c.height=r.height*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);
 const cols=['#81b64c','#f2c14e','#ffffff','#e8573f','#5fb3f9'];const Pp=Array.from({length:140},()=>({x:r.width/2,y:r.height*.55,vx:(Math.random()-.5)*11,vy:-Math.random()*12-4,s:Math.random()*6+4,a:Math.random()*6,va:(Math.random()-.5)*.4,c:cols[Math.random()*cols.length|0]}));
 let t=0;(function f(){t++;x.clearRect(0,0,r.width,r.height);Pp.forEach(p=>{p.vy+=.33;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore();});if(t<100)requestAnimationFrame(f);else c.remove();})();}
function pzCelebrate(){if(store.sound)try{[523,659,784,1047].forEach((f,i)=>tone(i*.09,f,.35,.1));}catch(e){}confettiAt($('xBoard'));}
function pzGoNext(){const z=PZ.cur;const L=pzList();const i=L.indexOf(z);const un=L.slice(i+1).concat(L.slice(0,i)).find(x=>!pzDone(x.id));pzLoad(un||L[(i+1)%L.length]);}
function pzPopup(z,shown,xp){document.querySelectorAll('.pzPop').forEach(x=>x.remove());const d=document.createElement('div');d.className='pzPop';d.setAttribute('role','dialog');
 const more=z.pv.length>1;
 d.innerHTML=`<div class="box"><div class="ic${shown?' show':''}">${shown?'?':'✓'}</div><h3>${shown?'Řešení':'Správně!'}</h3>${xp?`<div class="xp">+${xp} XP</div>`:''}
  <p>${shown?'Tímhle tahem soupeře trestáš:':'Soupeře jsi potrestal. Takhle by hra pokračovala:'}</p><div class="line">${pvSan(z.fen,z.pv,8)}</div><p>Hodnocení enginu po řešení: <b>${fmtCp(z.best)}</b></p>
  <div class="acts">${more?'<button class="btn" id="pzPlay">▶ Ukázat pokračování na šachovnici</button>':''}<button class="btn primary" id="pzPopNext">Další past</button><button class="btn" id="pzPopClose">Zavřít</button></div></div>`;
 document.body.appendChild(d);if(matchMedia('(max-width:820px)').matches){const b=$('xBoard');if(b){window.scrollTo({top:Math.max(0,b.getBoundingClientRect().top+scrollY-8),behavior:'auto'});fitSheet(b,d.querySelector('.box'));}}
 d.onclick=e=>{if(e.target===d||e.target.id==='pzPopClose'){d.remove();}else if(e.target.id==='pzPopNext'){d.remove();pzGoNext();}else if(e.target.id==='pzPlay'){d.remove();pzPlayCont(z);}};}
async function pzPlayCont(z){if(PZ.playing)return;PZ.playing=true;pzClearMarks();const msg=$('pzMsg');const wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{for(const u of z.pv.slice(1)){if(PZ.cur!==z)return;xArrow(u);await wait(650);if(PZ.cur!==z)return;let mv;try{mv=PZ.g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}catch(e){break;}if(!mv)break;xArrow(null);xAnimate(mv);xMarks();sfx(mv.captured?'capture':'move');await wait(700);}
  if(PZ.cur===z&&msg){msg.className='ok';msg.innerHTML=`Takhle hra pokračuje: <b>${pvSan(z.fen,z.pv,8)}</b> <small>(${fmtCp(z.best)})</small> · <button class="lnk" id="pzAgain">Další past</button>`;const a=document.getElementById('pzAgain');if(a)a.onclick=pzGoNext;}
 }finally{PZ.playing=false;}}
function pzTry(from,to){const z=PZ.cur;if(!z||PZ.lock)return false;const u=sqName(from)+sqName(to);let mv;try{mv=PZ.g.move({from:sqName(from),to:sqName(to),promotion:XPROMO||'q'});}catch(e){return false;}if(!mv)return false;
 const ok=z.acc.some(a=>a.slice(0,4)===u);
 if(ok){XB.sel=null;xAnimate(mv);xMarks();pzSolve(false);return true;}
 PZ.tries++;sfx('wrong');XB.sel=null;PZ.lock=true;xAnimate(mv);pzMark(sqOf(mv.to),'bad');{const m=$('pzMsg');m.className='bad';m.textContent=PZ.tries>=2?'✕ Pořád ne. Zkus nápovědu.':'✕ Tohle ne – zkus to znovu.';}setTimeout(()=>{if(PZ.cur!==z)return;PZ.g.undo();pzClearMarks();xSet();PZ.lock=false;},700);return true;}
function pzSolve(shown){const z=PZ.cur;PZ.lock=true;if(shown){const u=z.pv[0];let mv;try{mv=PZ.g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}catch(e){}if(mv){XB.sel=null;xAnimate(mv);xMarks();}}
 const first=!pzDone(z.id);if(!shown&&first){store.pz=store.pz||{};store.pz[z.id]=1;addXp(PZ.tries?5:10);save();}
 sfx(shown?'move':'win');xBar(z.best);xArrow(null);{const u=z.pv[0];pzMark(sqOf(u.slice(2,4)),shown?'ok':'ok');}if(!shown)pzCelebrate();{const m=$('pzMsg');if(m)m.className='ok';}setTimeout(()=>{if(PZ.cur===z)pzPopup(z,shown,!shown&&first?(PZ.tries?5:10):0);},shown?600:900);
 $('pzMsg').innerHTML=(shown?'Řešení: ':'<b>Správně!</b> ')+`<b>${pvSan(z.fen,z.pv,6)}</b> <small>(${fmtCp(z.best)})</small>${!shown&&first?` · +${PZ.tries?5:10} XP`:''}`;
 pzRenderList();if(!shown&&first){const h=$('home').querySelector('.pzHead b');if(h)h.textContent=`${PUZZLES.filter(x=>pzDone(x.id)).length}/${PUZZLES.length}`;}}
