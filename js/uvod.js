/* Stránky, úvod Nový trenažér, menu, Ctrl K, noví hráči. Pořadí načítání je v index.html (APP_JS). */
/* ---------- stránky: #  = přehled kurzů, #<id kurzu> = kurz, #profil = profil hráče ---------- */
let page='all';
function parseRoute(){const h=decodeURIComponent(location.hash.slice(1));if(h==='profil'){page='profile';return;}if(h==='souradnice'){page='coords';return;}if(h==='odznaky'||h==='zebricek'){page='lb';return;}if(h==='varianty'){page='cv';return;}if(h==='souperi'){page='souperi';return;}if(h==='vyzva'||h.startsWith('vyzva/')){page='vyzva';BT.code=location.hash.slice(7);return;}if(h==='hledat'){page='explore';return;}if(h==='pasti'){page='puzzles';return;}if(h==='puzzle'||h.startsWith('puzzle/')){page='pq';PQ.route=h.slice(7)||'urovne';return;}if(h==='koncovky'){page='endgames';return;}if(h==='sachovnice'){page='looks';return;}if(h==='zaciname'||h.startsWith('zaciname/')){page='tutorial';TU.route=h.slice(9);return;}if(h==='lekce'||h.startsWith('lekce/')){page='tutorial';TU.route=h.slice(6);return;}if(h==='odhad'){page='tutorial';TU.route='odhad';return;}if(h==='review'){page='review';return;}if(h==='rozbor'||h.startsWith('rozbor/')){page='rozbor';RZ.route=h.slice(7).trim().toLowerCase();return;}const c=COURSES.find(x=>x.id===h);if(c){if(c!==course){course=c;cur=pickStart();flipped=course.side==='b';}page='course';return;}if(h!=='dev')page='all';}
function museumSync(){if(typeof SYNC==='undefined')return;const on=isTest();if(on===!!window.MUSEUM)return;window.MUSEUM=on;document.documentElement.classList.toggle('museum',on);
 try{if(on){localStorage.setItem('trener-museum','1');const k=localStorage.getItem('trener-design');if(k&&k!=='neo')window.applyDesign(k);}else{localStorage.removeItem('trener-museum');if(window.DESIGN!=='neo')window.applyDesign('neo');}}catch(e){}}
function route(){museumSync();if(location.hash==='#dev'){openDev();return;}parseRoute();{const r=document.getElementById('rzTop');if(r){if(page==='rozbor')r.setAttribute('aria-current','page');else r.removeAttribute('aria-current');}}showHome();}
function pageHash(){return page==='course'?'#'+course.id:page==='profile'?'#profil':page==='explore'?'#hledat':page==='puzzles'?'#pasti':page==='pq'?'#puzzle'+(PQ.route&&PQ.route!=='urovne'?'/'+PQ.route:''):page==='endgames'?'#koncovky':page==='looks'?'#sachovnice':page==='review'?'#review':page==='tutorial'?(TU.route==='odhad'?'#odhad':'#lekce'+(TU.route?'/'+TU.route:'')):page==='rozbor'?'#rozbor'+(RZ.name?'/'+encodeURIComponent(RZ.name):''):page==='coords'?'#souradnice':page==='lb'?'#odznaky':page==='cv'?'#varianty':page==='souperi'?'#souperi':page==='vyzva'?'#vyzva'+(BT.code?'/'+BT.code:''):'';}
/* návrh Olympiáda: plynulý přechod mezi stránkami (View Transitions) a krátký nástup obsahu */
function pkEnter(){const b=document.body;if(!document.documentElement.classList.contains('d-neo'))return;b.classList.remove('pk-enter');void b.offsetWidth;b.classList.add('pk-enter');document.querySelectorAll('#home .cCard,#home .nxCourse').forEach((c,i)=>c.style.setProperty('--pk-i',Math.min(i,12)));clearTimeout(pkEnter.t);pkEnter.t=setTimeout(()=>b.classList.remove('pk-enter'),1700);}
function pkNav(){if(document.documentElement.classList.contains('d-neo')&&document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){NX.anim=true;const vt=document.startViewTransition(()=>{route();pkEnter();nxMark();});/* přeskočená animace (rychlé klikání, skrytá stránka) není chyba */[vt.ready,vt.finished,vt.updateCallbackDone].forEach(x=>x&&x.catch(()=>{}));}else{NX.anim=true;route();pkEnter();nxMark();}}
function go(hash){if(hash==='#')hash='';if(location.hash===hash||(hash===''&&!location.hash))pkNav();else location.hash=hash;}
function stateIn(c,l){const p=(store.prog[c.id]||{})[l.id];if(!p)return'new';if((p.box||0)<2)return p.lapse||(p.ok||0)>0?'lapsed':'learning';return p.due<=Date.now()?'due':'done';}
const t1chip=()=>store.t1?' <button class="t1chip" id="t1off" title="Vypnout T1 mód">T1 MÓD ✕</button>':store.alien?' <button class="t1chip al" id="aloff" title="Vypnout Alien mód">ALIEN MÓD 👽 ✕</button>':'';
function cardHTML(c){const p=courseProg(c),L=c.chapters.flatMap(ch=>ch.lines),d=L.filter(l=>{const s=stateIn(c,l);return s==='done'||s==='due';}).length,due=L.filter(l=>stateIn(c,l)==='due').length;
 return `<button class="cCard" data-c="${c.id}"><span class="pic ${c.side==='b'?'b':''}">${courseIcon(c)}</span><span><b>${c.title}</b>${c.en&&c.en.toLowerCase()!==c.title.toLowerCase()?`<span class="cEn">${c.en}</span>`:''}<small>${c.sub.replace(/^Repertoár za (bílé|černé) · /,'')}</small><span class="cMeta">${d}/${L.length} variant${due?` · <b>${due} k opakování</b>`:''}</span></span><span class="miniRing">${ringSVG(p,18,5)}<span>${p}%</span></span></button>`;}
function syncHTML(){return `<div class="syncRow"><span id="syncInfo">${syncLabel()}</span></div>`;}
function wireSync(){
 const t1o=document.getElementById('t1off');if(t1o)t1o.onclick=toggleT1;const alo=document.getElementById('aloff');if(alo)alo.onclick=toggleAlien;}
/* ---------- pozdravy a šachové vtipy na úvodní stránce ---------- */
const GREET={rano:['Dobré ráno','Krásné ráno','Ranní káva a zahájení?','Brý ráno','Hezké ráno'],
 den:['Ahoj','Čau','Nazdar','Vítej zpátky','Zdravím','Rád tě vidím','Tak co, šachisto?'],
 vecer:['Dobrý večer','Večerní trénink?','Krásný večer','Ahoj, noční sovo'],
 noc:['Ještě vzhůru?','Noční trénink','Půlnoční šachy?','Spát se dá i zítra']};
const JOKES=['Proč šachisté nechodí na pláž? Bojí se, že je někdo zahrabe jako pěšce.',
 'Říkal jsem kamarádovi, že hraju Caro-Kann. Myslel, že jsem si koupil nové auto.',
 'Jezdec je jediná figura, která může přeskočit problémy. Ostatní je musí vyřešit.',
 'Můj trenér mi řekl, ať myslím o tři tahy dopředu. Teď mám zpoždění na všechno.',
 'Pěšec na sedmé řadě má větší sebevědomí než většina lidí na pohovoru.',
 'Šachista u doktora: „Pane doktore, ztrácím paměť.“ – „Od kdy?“ – „Od kterého tahu?“',
 'Rošáda: jediná chvíle, kdy král dobrovolně pozve věž k sobě domů.',
 'Proč dáma nikdy nespí? Protože pořád někde hrozí.',
 'Zahájení se učíš měsíce. Soupeř zahraje 1.a3 a máš po přípravě.',
 'Gambit je, když obětuješ pěšce a pak doufáš, že si soupeř nevšimne, že jsi ho prostě ztratil.',
 'Kráva není zahájení. Kráva je životní postoj.',
 'Remízu jsem nabídl ve 3. tahu. Soupeř řekl, že ještě ani nezačal myslet.',
 'Říkají, že šachy prodlužují život. Hlavně ty partie se 3 minutami na tah.',
 'Střelec na bílých polích a střelec na černých polích se nikdy nepotkají. Jako dva kolegové na home office.',
 'Nejlepší tah v šachu? Ten, který jsi chtěl zahrát o tah dřív.',
 'Proč je kůň v šachu tak zmatený? Protože chodí do L.',
 'Mat za 4 tahy. Já tomu říkám lekce pokory.',
 'Engine říká +0,3. Já říkám, že jsem úplně ztracený. Oba máme pravdu.',
 'Pěšec: malý, pomalý, nikdo ho nebere vážně. Pak dojde na konec a stane se dámou. Motivace na pondělí.',
 'Hraju Vídeňský gambit, protože „Hraju náhodné tahy“ zní míň sofistikovaně.',
 'Sicilská obrana: protože obyčejný život je moc nudný.',
 'Moje oblíbená obrana? Tvrdit, že mi ujela myš.',
 'Šachové hodiny jsou jediné hodiny, které tě nenávidí osobně.',
 'Proč nosí šachista dvoje ponožky? Pro případ, že by dostal díru do obrany.',
 'Král je nejdůležitější figura. A taky ta nejlínější.',
 'Na turnaji mi soupeř nabídl remízu. Odmítl jsem. Teď už vím, proč ji nabízel.',
 'Patová situace: když ani jeden nechce mýt nádobí.',
 'Teorie zahájení je jako dieta. Všichni vědí, co mají dělat, a v 10. tahu jedí čokoládu.',
 'Alien gambit: protože normální oběť figury nestačila.',
 'Šachy nejsou o tom, kdo udělá méně chyb. Jde o to, kdo udělá tu poslední.'];
let GREET_PICK=null,JOKE_I=Math.floor(Math.random()*JOKES.length);
function greeting(){if(GREET_PICK)return GREET_PICK;const h=new Date().getHours();const k=h<5?'noc':h<10?'rano':h<18?'den':h<23?'vecer':'noc';const L=GREET[k];GREET_PICK=L[Math.floor(Math.random()*L.length)];return GREET_PICK;}
/* ---------- Přidat na plochu (PWA) ---------- */
let INSTALL_EVT=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();INSTALL_EVT=e;if(page==='all'&&!$('home').hidden)renderOverview();});
window.addEventListener('appinstalled',()=>{INSTALL_EVT=null;try{localStorage.setItem('trener-install-x','1')}catch(e){}if(page==='all'&&!$('home').hidden)renderOverview();});
const isStandalone=()=>{try{return ['standalone','window-controls-overlay','fullscreen','minimal-ui'].some(m=>matchMedia(`(display-mode: ${m})`).matches)||navigator.standalone===true;}catch(e){return false;}};
/* nainstalovaná aplikace: první kliknutí nebo klávesa po spuštění přepne na celou obrazovku (v prohlížeči nic) */
(()=>{let done=false;const off=()=>{removeEventListener('click',on,true);removeEventListener('keydown',on,true);};
 const on=()=>{if(done)return;done=true;off();if(!isStandalone()||document.fullscreenElement||window.top!==window)return;const el=document.documentElement;if(!el.requestFullscreen)return;
  try{const r=el.requestFullscreen({navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{});}catch(e){}};
 addEventListener('click',on,true);addEventListener('keydown',on,true);})();
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function installCardHTML(){let x=false;try{x=localStorage.getItem('trener-install-x')==='1';}catch(e){}
 if(x||isStandalone()||window.top!==window)return'';
 if(INSTALL_EVT)return `<div class="instCard" id="instCard"><span class="instIc"><img src="icons/icon-192.png?v=3" alt=""></span><span class="instTx"><b>Trenažér jako aplikace</b><small>Nainstaluj si ho na plochu – otevře se přes celou obrazovku a funguje i bez internetu.</small></span><button class="btn primary" id="instGo">Nainstalovat aplikaci</button><button class="instX" id="instX" aria-label="Zavřít">✕</button></div>`;
 if(isIOS())return `<div class="instCard" id="instCard"><span class="instIc"><img src="icons/icon-192.png?v=3" alt=""></span><span class="instTx"><b>Trenažér jako aplikace na iPhonu</b><small>V Safari klepni na <b>Sdílet ⬆︎</b> a vyber <b>Přidat na plochu</b>. Pak se otevře přes celou obrazovku a funguje i bez internetu.</small></span><button class="instX" id="instX" aria-label="Zavřít">✕</button></div>`;
 return'';}
/* karta Stáhnout aplikaci v profilu: přímá instalace, kde to prohlížeč umí, jinak návod podle zařízení */
function appDev(){const u=navigator.userAgent;if(/ipad/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return'ipad';if(/iphone|ipod/i.test(u))return'iphone';if(/android/i.test(u))return'android';if(/Macintosh/.test(u)&&/Safari/.test(u)&&!/Chrome|Chromium|Edg|Firefox/.test(u))return'mac';if(/Firefox/.test(u))return'firefox';return'pc';}
const APP_STEPS={iphone:['iPhone','Otevři web v <b>Safari</b>.','Dole klepni na <b>Sdílet</b> (čtvereček se šipkou nahoru).','Sjeď níž a vyber <b>Přidat na plochu</b>, pak <b>Přidat</b>.'],
 ipad:['iPad','Otevři web v <b>Safari</b>.','Nahoře vpravo klepni na <b>Sdílet</b> (čtvereček se šipkou nahoru).','Vyber <b>Přidat na plochu</b>, pak <b>Přidat</b>.'],
 android:['Android','Otevři web v <b>Chromu</b>.','Vpravo nahoře klepni na <b>tři tečky</b>.','Vyber <b>Nainstalovat aplikaci</b> (nebo <b>Přidat na plochu</b>).'],
 pc:['Počítač (Chrome, Edge)','Otevři web v <b>Chromu</b> nebo <b>Edge</b>.','V adresním řádku vpravo klikni na ikonu <b>Nainstalovat</b> (monitor se šipkou).','Nebo v menu (tři tečky) vyber <b>Uložit a sdílet</b> → <b>Nainstalovat stránku jako aplikaci</b>.'],
 mac:['Mac (Safari)','Otevři web v <b>Safari</b>.','Nahoře v menu vyber <b>Soubor</b> → <b>Přidat do Docku</b>.','Aplikace se objeví v Docku a ve složce Aplikace.'],
 firefox:['Firefox','Firefox na počítači instalaci aplikací neumí.','Otevři web v <b>Chromu</b> nebo <b>Edge</b> a klikni na ikonu <b>Nainstalovat</b> v adresním řádku.','Na telefonu použij Safari (iPhone) nebo Chrome (Android).']};
function appCardHTML(){if(window.top!==window)return'';const d=appDev(),st=APP_STEPS[d];
 if(isStandalone())return'';/* v nainstalované aplikaci kartu neukazovat */
 const steps=k=>`<ol class="appSteps">${APP_STEPS[k].slice(1).map(t=>`<li>${t}</li>`).join('')}</ol>`;
 return `<div class="profCard appCard" id="appCard"><h2>Stáhnout aplikaci</h2><p class="profEmpty">Trenažér si můžeš dát na plochu počítače, mobilu i iPadu. Otevře se jako normální aplikace přes celou obrazovku a funguje i bez internetu. Nic se nestahuje z obchodu a nic to nestojí.</p>
 <div class="tuBtns appBtns"><button class="btn primary" id="appGo">Stáhnout aplikaci</button></div>
 <div class="appHow" id="appHow" hidden><h3 class="rzH3">${st[0]}</h3>${steps(d)}
 <details class="appOther"><summary>Návod pro jiné zařízení</summary>${Object.keys(APP_STEPS).filter(k=>k!==d).map(k=>`<h3 class="rzH3">${APP_STEPS[k][0]}</h3>${steps(k)}`).join('')}</details></div></div>`;}
function appOpen(){const show=()=>{const c=document.getElementById('appCard');if(!c)return;c.scrollIntoView({block:'start',behavior:'smooth'});const g=document.getElementById('appGo');const h=document.getElementById('appHow');if(g&&h&&h.hidden&&!INSTALL_EVT)g.click();};if(page==='profile')show();else{go('#profil');setTimeout(show,350);}}
function wireAppCard(){const g=document.getElementById('appGo');if(!g)return;g.onclick=async()=>{const e=INSTALL_EVT;
 if(e){INSTALL_EVT=null;try{e.prompt();const r=await e.userChoice;if(r&&r.outcome==='accepted'){g.textContent='Instaluji…';return;}}catch(err){}}
 const h=document.getElementById('appHow');if(h){h.hidden=!h.hidden;g.textContent=h.hidden?'Stáhnout aplikaci':'Skrýt návod';if(!h.hidden)h.scrollIntoView({block:'nearest',behavior:'smooth'});}};}
function wireInstall(){const x=document.getElementById('instX');if(x)x.onclick=()=>{try{localStorage.setItem('trener-install-x','1')}catch(e){}const c=$('instCard');if(c)c.remove();};
 const g=document.getElementById('instGo');if(g)g.onclick=async()=>{const e=INSTALL_EVT;if(!e)return;INSTALL_EVT=null;try{e.prompt();await e.userChoice;}catch(err){}renderOverview();};}
/* ===================== NÁVRH „Nový trenažér“ (jen html.d-neo): nové menu, nový úvod, příkazová paleta ===================== */
const NX={t:null,f:'all',anim:true};
const nxOn=()=>document.documentElement.classList.contains('d-neo');
const nxNorm=t=>(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const NX_IC={
 home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
 book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
 trap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
 chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 elo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/></svg>',
 king:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M10 4h4M7 21h10M8 21l1-8-3-3 3-2h6l3 2-3 3 1 8"/></svg>',
 bars:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
 right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
 brush:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22z"/></svg>'};
const NX_PAGES=[
 {k:'#',t:'Domů',s:'Přehled a doporučení',ic:'home'},
 {k:'#lekce',t:'Lekce strategie',s:'Od nováčka po 1500 Elo, hra proti botům',ic:'book'},
 {k:'#odhad',t:'Odhad Elo',s:'Zahraj partii a zjisti, jaké máš asi Elo',ic:'elo'},
 {k:'#review',t:'Rozbor partie',s:'Hodnocení každého tahu',ic:'chart'},
 {k:'#puzzle',t:'Puzzle',s:'Tisíce úloh, úrovně, Puzzle Rush, hodnocení',ic:'trap'},
 {k:'#puzzle/vyber',t:'Vyber tah',s:'Pro nováčky: ze 3 tahů vyber nejlepší, s vysvětlením',ic:'trap'},
 {k:'#puzzle/pasti',t:'Pasti v zahájení',s:'Slavné pasti: Legalův mat, Sloní past…',ic:'trap'},
 {k:'#pasti',t:'Pasti z kurzů',s:'Najdi tah, kterým soupeře potrestáš',ic:'trap'},
 {k:'#koncovky',t:'Koncovky',s:'Úlohy proti Stockfishi',ic:'king'},
 {k:'#hledat',t:'Najít variantu',s:'Podle tahů na šachovnici',ic:'search'},
 {k:'#rozbor',t:'Rozbor hráče',s:'Tvoje partie z chess.com',ic:'bars'},
 {k:'#profil',t:'Profil',s:'Level, statistiky, účet',ic:'user'},
 {k:'#sachovnice',t:'Vzhled',s:'Šachovnice, figury a vzhled webu',ic:'brush'}];
const NX_TABS=[['#','Domů','home'],['#lekce','Lekce','book'],['#puzzle','Puzzle','trap'],['#hledat','Varianty','search'],['#profil','Profil','user']];
function nxNavHTML(){return `<div class="nxBrand"><span class="nxLogo">${PIECE_SVG('wN')}</span><b>Trenažér</b></div>`+
 NX_TABS.map(([k,t,ic])=>`<button class="nxTab" data-nx="${k}"><span class="nxTi">${NX_IC[ic]}</span><span>${t}</span></button>`).join('')+
 `<div class="nxCourses" aria-label="Kurzy zahájení"><div class="nxCrsH">Zahájení</div>${COURSES.map(c=>`<button class="nxCrs" data-nx="#${c.id}" title="${c.title} · ${c.side==='w'?'za bílé':'za černé'}"><span class="nxCrsI${c.side==='b'?' b':''}">${courseIcon(c)}</span><span class="nxCrsT">${c.title}</span><span class="nxCrsP">${courseProg(c)} %</span></button>`).join('')}</div>`+
 `<span class="nxNavInd" aria-hidden="true"></span><button class="nxTab nxAppBtn" data-nx="app"><span class="nxTi">${NX_IC.arrow}</span><span>Stáhnout aplikaci</span></button><button class="nxTab nxDevBtn" data-nx="#dev" hidden><span class="nxTi">${NX_IC.user}</span><span>Vývojář</span></button><button class="nxTab nxOldBtn" data-nx="old"><span class="nxTi">${NX_IC.left}</span><span>Starý vzhled</span></button><button class="nxTab nxCmdBtn" data-nx="cmd"><span class="nxTi">${NX_IC.search}</span><span>Hledat</span><kbd>Ctrl K</kbd></button>`;}
function nxActiveKey(){if(page==='all')return '#';if(page==='tutorial')return '#lekce';if(page==='puzzles'||page==='pq')return '#puzzle';if(page==='explore')return '#hledat';if(page==='profile'||page==='lb')return '#profil';return '';}
function nxMark(){const n=document.getElementById('nxNav');if(!n)return;n.querySelectorAll('.nxCrs').forEach(b=>{const c=COURSES.find(x=>'#'+x.id===b.dataset.nx);const e=b.querySelector('.nxCrsP');if(c&&e)e.textContent=courseProg(c)+' %';});const k=nxActiveKey();let act=null;
 n.querySelectorAll('.nxTab').forEach(b=>{const on=b.dataset.nx===k;b.classList.toggle('on',on);if(on){b.setAttribute('aria-current','page');act=b;}else b.removeAttribute('aria-current');});
 const ind=n.querySelector('.nxNavInd');if(ind){if(act){const r=act.getBoundingClientRect(),p=n.getBoundingClientRect();ind.style.opacity='1';ind.style.transform=`translate(${r.left-p.left}px,${r.top-p.top}px)`;ind.style.width=r.width+'px';ind.style.height=r.height+'px';}else ind.style.opacity='0';}}
/* návrat na starý vzhled jedním klikem (zpět se dá přes Vzhled nahoře) */
function nxOld(){try{localStorage.setItem('trener-design','sal');}catch(e){}window.applyDesign('sal');try{updDsBadge();}catch(e){}route();scrollTo(0,0);}
function nxInitNav(){if(document.getElementById('nxNav'))return;const n=document.createElement('nav');n.className='nxNav';n.id='nxNav';n.setAttribute('aria-label','Hlavní menu');n.innerHTML=nxNavHTML();document.body.appendChild(n);{const ab=n.querySelector('.nxAppBtn');if(ab&&(isStandalone()||window.top!==window))ab.hidden=true;}{const db=n.querySelector('.nxDevBtn');if(db)db.hidden=!(SYNC.be&&SYNC.be.kind==='supa'&&SYNC.admin);}
 n.addEventListener('click',e=>{const b=e.target.closest('[data-nx]');if(!b)return;if(b.dataset.nx==='cmd'){nxCmd();return;}if(b.dataset.nx==='old'){nxOld();return;}if(b.dataset.nx==='app'){appOpen();return;}go(b.dataset.nx);});
 addEventListener('resize',()=>{const ind=n.querySelector('.nxNavInd');if(ind){ind.style.transition='none';nxMark();requestAnimationFrame(()=>ind.style.transition='');}});}
/* počítání čísel od nuly (jen při příchodu na stránku) */
function nxCount(root){const red=matchMedia('(prefers-reduced-motion: reduce)').matches;root.querySelectorAll('[data-count]').forEach(el=>{const to=+el.dataset.count;if(red||!NX.anim||!to){el.textContent=to;return;}const t0=performance.now(),d=800;
 const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,4);el.textContent=Math.round(to*e);if(k<1&&el.isConnected)requestAnimationFrame(step);};requestAnimationFrame(step);});}
/* živá šachovnice v úvodu: sama hraje Italskou hru */
const NX_SAN=['e4','e5','Jf3','Jc6','Sc4','Sc5','c3','Jf6','d4'];
const NX_LINE=[['e2','e4'],['e7','e5'],['g1','f3'],['b8','c6'],['f1','c4'],['f8','c5'],['c2','c3'],['g8','f6'],['d2','d4']];
function nxStartPos(){const P={};const back='RNBQKBNR';for(let i=0;i<8;i++){const f='abcdefgh'[i];P[f+'1']='w'+back[i];P[f+'2']='wP';P[f+'7']='bP';P[f+'8']='b'+back[i];}return P;}
/* tahy pro živou šachovnici z prvního variantu kurzu (do 10 půltahů, bez braní a rošády, aby se nemusely mazat figury) */
function nxCourseLine(c){const L=c&&c.chapters&&c.chapters[0]&&c.chapters[0].lines[0];if(!L||!L.moves)return null;let b=startBoard();const line=[],san=[];const CZ={N:'J',B:'S',R:'V',Q:'D',K:'K'};
 for(let i=0;i<Math.min(10,L.moves.length);i++){const m=L.moves[i],col=i%2?'b':'w';if(/x|O-O|=/.test(m))break;let r;try{r=resolve(b,m,col);}catch(e){break;}if(b[r.to])break;line.push([sqName(r.from),sqName(r.to)]);san.push(m.replace(/^[NBRQK]/,x=>CZ[x]));b=apply(b,r);}
 return line.length>=4?{line,san,t:c.title}:null;}
function nxBoard(el,c){clearInterval(NX.t);const CL=nxCourseLine(c)||{line:NX_LINE,san:NX_SAN,t:'Italská hra'};const P=nxStartPos();let sq='';for(let r=7;r>=0;r--)for(let f=0;f<8;f++)sq+=`<i class="${(r+f)%2?'l':'d'}"></i>`;
 el.innerHTML=`<div class="nxSqs">${sq}</div><div class="nxPcs">${Object.entries(P).map(([s,p])=>`<span class="nxPc" data-s="${s}" style="--x:${s.charCodeAt(0)-97};--y:${8-+s[1]}">${PIECE_SVG(p)}</span>`).join('')}</div><span class="nxMoveTag" id="nxMoveTag">${escH(CL.t)}</span>`;
 const red=matchMedia('(prefers-reduced-motion: reduce)').matches;if(red)return;let i=0;
 const tick=()=>{if(!el.isConnected){clearInterval(NX.t);return;}if(el.matches(':hover'))return;
  if(i>=CL.line.length){i=0;nxBoard(el,c);return;}const [a,b]=CL.line[i];const pc=el.querySelector(`.nxPc[data-s="${a}"]`);
  el.querySelectorAll('.nxSqs i.hl').forEach(x=>x.classList.remove('hl'));
  if(pc){pc.dataset.s=b;pc.style.setProperty('--x',b.charCodeAt(0)-97);pc.style.setProperty('--y',8-+b[1]);
   const idx=s=>(8-+s[1])*8+(s.charCodeAt(0)-97);const q=el.querySelectorAll('.nxSqs i');q[idx(a)].classList.add('hl');q[idx(b)].classList.add('hl');}
  const tag=document.getElementById('nxMoveTag');if(tag){const n=Math.floor(i/2)+1;tag.textContent=(i%2?n+'… ':n+'. ')+CL.san[i];}
  i++;};
 NX.t=setInterval(tick,1100);}
/* doporučený kurz pro hlavní kartu */
function nxPick(){const due=COURSES.map(c=>({c,n:c.chapters.reduce((b,ch)=>b+ch.lines.filter(l=>stateIn(c,l)==='due').length,0)})).filter(x=>x.n).sort((a,b)=>b.n-a.n)[0];
 if(due)return{c:due.c,why:`${due.n} ${due.n===1?'varianta čeká':due.n<5?'varianty čekají':'variant čeká'} na zopakování`,cta:'Opakovat'};
 const started=COURSES.map(c=>({c,p:courseProg(c)})).filter(x=>x.p>0&&x.p<100).sort((a,b)=>b.p-a.p)[0];
 if(started)return{c:started.c,why:`Máš hotovo ${started.p} %. Pokračuj, ať to dotáhneš.`,cta:'Pokračovat'};
 const c=COURSES.find(x=>x.id==='italian')||COURSES[0];return{c,why:'Klidné a zdravé zahájení. Ideální první kurz.',cta:'Začít kurz'};}
function nxCourseCard(c){const p=courseProg(c),L=c.chapters.flatMap(ch=>ch.lines),d=L.filter(l=>{const s=stateIn(c,l);return s==='done'||s==='due';}).length,due=L.filter(l=>stateIn(c,l)==='due').length;
 return `<button class="nxCourse ${c.side==='b'?'b':'w'}" data-c="${c.id}" data-side="${c.side}"><span class="nxCIc">${courseIcon(c)}</span><span class="nxCSide">${c.side==='w'?'Za bílé':'Za černé'}</span><b>${c.title}</b><small>${c.sub.replace(/^Repertoár za (bílé|černé) · /,'')}</small><span class="nxCBar"><i style="width:${p}%"></i></span><span class="nxCFoot"><span>${d}/${L.length} variant</span>${due?`<span class="nxDue">${due} k opakování</span>`:`<span>${p} %</span>`}</span></button>`;}
/* ===== ÚPLNĚ NOVÍ HRÁČI – výběr, kde začít (18. 11. 2026). store.start={l:0..4,s:'w'|'b'}; l: 0 pravidla, 1 do 1000, 2 1000–1500, 3 nad 1500, 4 nevím.
   Ukazuje se místo velké karty nahoře, dokud hráč nemá XP ani hotovou variantu a nic nevybral. */
const NX_START_L=[['Teprve se učím pravidla','Ukážu ti, jak táhnou figury'],['Znám pravidla, hraju občas','Zhruba do 1000 Elo'],['Hraju pravidelně','Zhruba 1000 až 1500 Elo'],['Hraju hodně','Přes 1500 Elo'],['Nevím, jak na tom jsem','Zahraj partii a zjistíme to']];
function nxStartRec(){const st=store.start;if(!st)return null;
 if(st.l===0)return{eb:'Lekce',t:'Úplné základy',why:'Pravidla a jak táhnou figury. Krátké lekce s cvičením.',go:'#lekce/g0',cta:'Začít'};
 if(st.l===1)return{eb:'Lekce',t:'Cesta k 1000 Elo',why:'Základní principy a chyby, které začátečníky stojí nejvíc partií.',go:'#lekce/g1',cta:'Začít'};
 if(st.l===4)return{eb:'Odhad Elo',t:'Zjisti, jak hraješ',why:'Zahraj jednu partii s botem. Podle ní uvidíš, kde začít.',go:'#odhad',cta:'Zahrát partii'};
 const id=st.s==='b'?(st.l===3?'najdorf':'caro'):(st.l===3?'vienna':'italian');const c=COURSES.find(x=>x.id===id)||COURSES[0];
 return{c,eb:c.side==='w'?'Za bílé':'Za černé',t:c.title,why:st.s==='b'?(st.l===3?'Ostrá a bohatá obrana proti 1.e4.':'Pevná obrana proti 1.e4, kde se těžko prohrává hned v zahájení.'):(st.l===3?'Útočné zahájení, ve kterém soupeře rychle dostaneš pod tlak.':'Klidné a zdravé zahájení. Ideální první kurz.'),go:'#'+c.id,cta:'Začít kurz'};}
function nxStartHTML(step){if(step==='side')return `<div class="nxHeroTx nxStart"><h1>Za kterou barvu?</h1><p>Vyber, za koho se chceš naučit první zahájení. Druhou barvu přidáš kdykoli.</p>
  <div class="nxStartOpts"><button class="nxStartOpt" data-ss="w"><b>Za bílé</b><small>Hraješ první tah</small></button><button class="nxStartOpt" data-ss="b"><b>Za černé</b><small>Odpovídáš na 1.e4</small></button></div><button class="nxLink nxStartBack" data-sback>Zpět</button></div>`;
 return `<div class="nxHeroTx nxStart"><h1>Vítej v trenažéru</h1><p>Jak hraješ šachy? Podle toho ti ukážu, kde začít.</p>
  <div class="nxStartOpts">${NX_START_L.map(([t,s],i)=>`<button class="nxStartOpt" data-sl="${i}"><b>${t}</b><small>${s}</small></button>`).join('')}</div></div>`;}
function nxStartWire(){const hero=document.querySelector('.nxHero');if(!hero)return;hero.onclick=e=>{const l=e.target.closest('[data-sl]'),sd=e.target.closest('[data-ss]');
 if(l){const v=+l.dataset.sl;if(v===2||v===3){NX.startL=v;hero.querySelector('.nxStart').outerHTML=nxStartHTML('side');return;}store.start={l:v};save();renderNeoHome();return;}
 if(sd){store.start={l:NX.startL||2,s:sd.dataset.ss};save();renderNeoHome();return;}
 if(e.target.closest('[data-sback]')){hero.querySelector('.nxStart').outerHTML=nxStartHTML();return;}
 if(e.target.closest('[data-sreset]')){delete store.start;save();renderNeoHome();}};}
function renderNeoHome(){document.body.classList.add('homeMode');const L=lvlOf(store.xp);const rec=nxPick();
 const all=COURSES.flatMap(c=>c.chapters.flatMap(ch=>ch.lines.map(l=>stateIn(c,l))));const done=all.filter(s=>s==='done'||s==='due').length,dueAll=all.filter(s=>s==='due').length;
 const fresh=!(store.xp>0)&&!done;/* úplně nový hráč: zatím žádné XP ani hotová varianta */
 const sr=fresh?nxStartRec():null,pick=(fresh&&!store.start)?null:(sr&&(sr.c?{c:sr.c,why:sr.why,cta:sr.cta,own:sr}:{own:sr}))||rec;
 const heroTx=!pick?nxStartHTML():pick.c?`<div class="nxHeroTx"><span class="nxEyebrowless">${pick.c.side==='w'?'Za bílé':'Za černé'}</span><h1>${pick.c.title}</h1><p>${pick.why}</p>
   <div class="nxHeroProg"><span class="nxCBar"><i style="width:${courseProg(pick.c)}%"></i></span><span>${courseProg(pick.c)} %</span></div>
   <div class="nxHeroBtns"><button class="nxBtn primary" data-go="#${pick.c.id}">${pick.cta}${NX_IC.arrow}</button><button class="nxBtn" data-scroll="nxCourses">Všechny kurzy</button></div>${pick.own?'<button class="nxLink nxStartBack" data-sreset>Vybrat znovu</button>':''}</div>`
  :`<div class="nxHeroTx"><span class="nxEyebrowless">${pick.own.eb}</span><h1>${pick.own.t}</h1><p>${pick.own.why}</p>
   <div class="nxHeroBtns"><button class="nxBtn primary" data-go="${pick.own.go}">${pick.own.cta}${NX_IC.arrow}</button><button class="nxBtn" data-scroll="nxCourses">Kurzy zahájení</button></div><button class="nxLink nxStartBack" data-sreset>Vybrat znovu</button></div>`;
 const g=greeting();const nm='';/* jméno se neskloňuje (je to přihlašovací jméno), proto ho do oslovení nedáváme */const hi=/[?!]$/.test(g)?g.replace(/([?!])$/,nm+'$1'):g+nm+'.';
 const tile=(id,cls,ic,t,s,extra='')=>`<button class="nxTile ${cls}" data-go="${id}"><span class="nxTIc">${NX_IC[ic]}</span><span class="nxTTx"><b>${t}</b><small>${s}</small></span>${extra}<span class="nxTGo">${NX_IC.arrow}</span></button>`;
 let h=`<div class="nx">
 <header class="nxHead"><div class="nxHi"><p>${hi}</p></div><div class="nxTools"><button class="nxSearch" id="nxSearch">${NX_IC.search}<span>Hledat kurz nebo stránku</span><kbd>Ctrl K</kbd></button><button class="nxIco" id="nxSound" aria-label="Zvuk">${store.sound?SND_ON:SND_OFF}</button><button class="nxIco" id="nxLooks" aria-label="Vzhled" title="Vzhled">${NX_IC.brush}</button><button class="nxLvl" id="nxLvl" title="Tvůj level"><span class="nxRing" style="--p:${L.pct}"><b>${L.n}</b></span><span><b>${escH(myLvl(L))}</b><small>${store.xp} XP</small></span></button></div></header>
 <section class="nxHero${pick?'':' isStart'}">
  ${heroTx}
  <div class="nxHeroBoard" id="nxHeroBoard" data-go="#${(pick&&pick.c||COURSES.find(x=>x.id==='italian')||COURSES[0]).id}" title="${escH((pick&&pick.c||COURSES.find(x=>x.id==='italian')||COURSES[0]).title)} – otevřít kurz"></div>
 </section>
 ${fresh?'':`<section class="nxStats">
  <div class="nxStat"><span class="nxSN" data-count="${done}">${done}</span><span class="nxSL">variant umíš</span></div>
  <div class="nxStat ${dueAll?'hot':''}"><span class="nxSN" data-count="${dueAll}">${dueAll}</span><span class="nxSL">k opakování dnes</span></div>
  <div class="nxStat"><span class="nxSN" data-count="${store.xp||0}">${store.xp||0}</span><span class="nxSL">XP celkem</span></div>
  <div class="nxStat"><span class="nxSN" data-count="${L.left}">${L.left}</span><span class="nxSL">XP do levelu ${L.n+1}</span></div>
 </section>`}
 <h2 class="nxH2">Trénink</h2>
 <section class="nxBento">
  ${tile('#lekce','lime big','book','Lekce strategie','Od nováčka po 1500 Elo. Krátké vysvětlení, cvičení a hra proti botům.')}
  ${tile('#odhad','violet','elo','Odhad Elo','Zahraj partii a zjisti, kde jsi')}
  ${tile('#puzzle','coral','trap','Puzzle a pasti','Úrovně od 400 do 2800, Puzzle Rush, pasti')}
  ${fresh?tile('#souradnice','sky','king','Souřadnice','Nauč se najít každé pole na šachovnici'):tile('#review','sky','chart','Rozbor partie','Každý tah ohodnocený')}
  ${tile('#koncovky','sun','king','Koncovky','Úlohy proti Stockfishi')}
  ${fresh?'':tile('#hledat','plain','search','Najít variantu','Zahraj tahy, najdu kurz')}
  ${fresh?'':tile(store.ccName?'#rozbor/'+encodeURIComponent(store.ccName):'#rozbor','plain','bars','Rozbor hráče','Tvoje partie z chess.com')}
 </section>
 ${fresh?'':betaHomeHTML(true)}
 <section class="nxCourses" id="nxCourses"><div class="nxCHead"><h2 class="nxH2">Tvoje zahájení</h2><div class="nxSeg" role="group" aria-label="Filtr kurzů"><span class="nxSegInd" aria-hidden="true"></span>${[['all','Vše'],['w','Za bílé'],['b','Za černé']].map(([k,t])=>`<button data-f="${k}" aria-pressed="${NX.f===k}">${t}</button>`).join('')}</div><div class="nxArrows"><button class="nxIco" data-sc="-1" aria-label="Posunout doleva">${NX_IC.left}</button><button class="nxIco" data-sc="1" aria-label="Posunout doprava">${NX_IC.right}</button></div></div>
  <div class="nxRow" id="nxRow">${[...COURSES].sort((a,b)=>(a.side==='w'?0:1)-(b.side==='w'?0:1)).map(nxCourseCard).join('')}</div></section>
 <footer class="nxFoot"><p class="nxOldRow nxDevLnk"${SYNC.admin&&getTok()?'':' hidden'}><button class="nxLink" id="nxDev">Vývojářská stránka</button></p><p class="nxOldRow"${fresh?' hidden':''}>Nový vzhled ti nesedí? <button class="nxLink" id="nxOld">Vrátit starý vzhled</button></p><p class="nxJoke"><span id="jokeTx">${JOKES[JOKE_I]}</span> <button class="nxLink" id="jokeNext">Další vtip</button></p>${syncHTML()}</footer>
 </div>`;
 $('home').innerHTML=h;renderSide();wireSync();nxStartWire();try{if(SYNC.user&&typeof lbTick==='function'&&lbTick(true))save();}catch(e){}
 nxBoard($('nxHeroBoard'),pick&&pick.c||COURSES.find(x=>x.id==='italian'));nxCount($('home'));nxFilter(NX.f,true);NX.anim=false;betaWireHome();
 $('jokeNext').onclick=()=>{JOKE_I=(JOKE_I+1+Math.floor(Math.random()*(JOKES.length-1)))%JOKES.length;$('jokeTx').textContent=JOKES[JOKE_I];};
 $('nxSearch').onclick=()=>nxCmd();$('nxOld').onclick=nxOld;$('nxDev').onclick=()=>go('#dev');$('nxLooks').onclick=()=>go('#sachovnice');$('nxLvl').onclick=()=>go('#profil');
 $('nxSound').onclick=()=>{$('sound').click();$('nxSound').innerHTML=store.sound?SND_ON:SND_OFF;};
 const row=$('nxRow');$('home').querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>row.scrollBy({left:+b.dataset.sc*row.clientWidth*.8,behavior:'smooth'}));
 $('home').querySelector('.nxSeg').onclick=e=>{const b=e.target.closest('[data-f]');if(b)nxFilter(b.dataset.f);};
 if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches)row.querySelectorAll('.nxCourse').forEach(c=>{
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg) translateY(-3px)`;c.style.setProperty('--mx',(x+.5)*100+'%');c.style.setProperty('--my',(y+.5)*100+'%');});
  c.addEventListener('pointerleave',()=>{c.style.transform='';});});}
function nxFilter(f,now){NX.f=f;const seg=document.querySelector('.nxSeg');if(!seg)return;let act=null;seg.querySelectorAll('[data-f]').forEach(b=>{const on=b.dataset.f===f;b.setAttribute('aria-pressed',on);if(on)act=b;});
 const ind=seg.querySelector('.nxSegInd');if(act&&ind){if(now)ind.style.transition='none';ind.style.width=act.offsetWidth+'px';ind.style.transform=`translateX(${act.offsetLeft}px)`;if(now)requestAnimationFrame(()=>requestAnimationFrame(()=>ind.style.transition=''));}
 document.querySelectorAll('#nxRow .nxCourse').forEach(c=>{const show=f==='all'||c.dataset.side===f;c.hidden=!show;});
 const row=document.getElementById('nxRow');if(row&&!now)row.scrollTo({left:0,behavior:'smooth'});}
document.addEventListener('click',e=>{if(!nxOn())return;const h=document.getElementById('home');if(!h||!h.contains(e.target))return;
 const g=e.target.closest('.nx [data-go]');if(g){e.stopPropagation();go(g.dataset.go);return;}
 const s=e.target.closest('.nx [data-scroll]');if(s){document.getElementById(s.dataset.scroll).scrollIntoView({behavior:'smooth',block:'start'});return;}
 const c=e.target.closest('.nx .nxCourse');if(c){e.stopPropagation();go('#'+c.dataset.c);}},true);
/* příkazová paleta: Ctrl+K nebo /, šipky a Enter */
function nxCmd(){if(document.getElementById('nxCmd'))return;const items=[...NX_PAGES.map(p=>({...p,grp:'Stránky'})),...[{k:'app',t:'Stáhnout aplikaci',s:'Trenažér na plochu počítače, mobilu i iPadu',ic:'arrow',grp:'Stránky'}],...(SYNC.admin&&getTok()?[{k:'#dev',t:'Vývojářská stránka',s:'Hráči, hesla, zprávy',ic:'user',grp:'Stránky'}]:[]),...(isBeta()?[{k:'#souradnice',t:'Souřadnice',s:'Najdi pole co nejrychleji',ic:'king',grp:'Stránky'},{k:'#odznaky',t:'Odznaky',s:'Co už máš splněné a co tě čeká',ic:'bars',grp:'Stránky'},{k:'#vyzva',t:'Výzva kamarádovi',s:'5 puzzle na čas, pošli odkaz',ic:'trap',grp:'Stránky'},{k:'#varianty',t:'Varianty od hráčů',s:'Varianty, které přidali hráči',ic:'search',grp:'Stránky'},{k:'#souperi',t:'Hraj proti svým soupeřům',s:'Bot hraje jako lidé proti tobě na chess.com',ic:'user',grp:'Stránky'}]:[]),...COURSES.map(c=>({k:'#'+c.id,t:c.title,s:(c.side==='w'?'Za bílé':'Za černé')+' · '+c.sub.replace(/^Repertoár za (bílé|černé) · /,''),grp:'Kurzy',c}))];
 const d=document.createElement('div');d.id='nxCmd';d.className='nxCmd';d.innerHTML=`<div class="nxCmdBox" role="dialog" aria-modal="true" aria-label="Hledat"><div class="nxCmdIn">${NX_IC.search}<input id="nxCmdQ" placeholder="Kam chceš jít? Třeba „Italská“ nebo „pasti“" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><div class="nxCmdList" id="nxCmdList" role="listbox"></div></div>`;
 document.body.appendChild(d);const q=$('nxCmdQ'),list=$('nxCmdList');let sel=0,cur=[];
 const draw=()=>{const t=nxNorm(q.value.trim());cur=items.filter(it=>!t||nxNorm(it.t+' '+it.s+' '+(it.c?it.c.en||'':'')).includes(t));sel=Math.min(sel,Math.max(0,cur.length-1));let last='';
  list.innerHTML=cur.length?cur.map((it,i)=>{const hd=it.grp!==last?`<div class="nxCmdGrp">${it.grp}</div>`:'';last=it.grp;return hd+`<button class="nxCmdIt${i===sel?' on':''}" data-i="${i}" role="option" aria-selected="${i===sel}"><span class="nxCmdIc">${it.c?courseIcon(it.c):NX_IC[it.ic]}</span><span><b>${it.t}</b><small>${it.s}</small></span></button>`;}).join(''):'<p class="nxCmdNone">Nic takového tu není. Zkus jiné slovo.</p>';
  const on=list.querySelector('.on');if(on)on.scrollIntoView({block:'nearest'});};
 const close=()=>{d.classList.add('out');setTimeout(()=>d.remove(),150);};const pick=i=>{const it=cur[i];if(!it)return;close();if(it.k==='app')appOpen();else go(it.k);};
 q.oninput=()=>{sel=0;draw();};q.onkeydown=e=>{if(e.key==='ArrowDown'){sel=Math.min(cur.length-1,sel+1);draw();e.preventDefault();}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault();}else if(e.key==='Enter'){pick(sel);}else if(e.key==='Escape'){close();}};
 list.onclick=e=>{const b=e.target.closest('[data-i]');if(b)pick(+b.dataset.i);};d.onclick=e=>{if(e.target===d)close();};draw();q.focus();}
document.addEventListener('keydown',e=>{if(!nxOn())return;const typing=/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))||e.target.isContentEditable;
 if((e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)){e.preventDefault();nxCmd();}else if(e.key==='/'&&!typing&&!document.body.classList.contains('trainerMode')){e.preventDefault();nxCmd();}});
/* ===================== konec návrhu Nový trenažér (JS) ===================== */
function renderOverview(){if(nxOn())return renderNeoHome();document.body.classList.add('homeMode');const L=lvlOf(store.xp);
 const sec=(side,label)=>{const cs=COURSES.filter(c=>c.side===side);return cs.length?`<section class="sideSec"><h2 class="secT"><span class="kd ${side}"></span>${label} <small>(${cs.length})</small></h2><div class="courseCards">${cs.map(cardHTML).join('')}</div></section>`:'';};
 const dueAll=COURSES.reduce((a,c)=>a+c.chapters.reduce((b,ch)=>b+ch.lines.filter(l=>stateIn(c,l)==='due').length,0),0);
 const dueC=COURSES.find(c=>c.chapters.some(ch=>ch.lines.some(l=>stateIn(c,l)==='due')));
 let h=`<div class="homeHead">${t1chip()?`<div class="kicker">${t1chip()}</div>`:''}<h1>${(()=>{const g=greeting();const nm='';/* jméno se neskloňuje (je to přihlašovací jméno), proto ho do oslovení nedáváme */const end=/[?!]$/.test(g);return end?g.replace(/([?!])$/,nm+'$1'):g+nm+'.';})()}</h1><p>${dueAll?`Dnes máš k opakování <b>${dueAll}</b> ${dueAll===1?'variantu':dueAll<5?'varianty':'variant'}.`:'Všechno máš zopakované. Můžeš se naučit něco nového.'}</p>${dueC?`<button class="btn primary todayBtn" id="toDue">Opakovat – ${dueC.title}</button>`:''}<div class="joke"><span id="jokeTx">${JOKES[JOKE_I]}</span><button class="jNext" id="jokeNext" title="Další vtip" aria-label="Další vtip">↻</button></div><div class="quick">
 <button class="profStrip exStrip" id="toTu"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg></span><span><b>Lekce strategie</b><small class="sub">od nováčka po 1500 Elo, hra proti botům</small></span></button><button class="profStrip exStrip" id="toGuess"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/></svg></span><span><b>Odhad Elo</b><small class="sub">zahraj partii a zjisti, jaké máš asi Elo</small></span></button><button class="profStrip exStrip" id="toRv"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg></span><span><b>Rozbor partie</b><small class="sub">hodnocení každého tahu jako na chess.com</small></span></button><button class="profStrip" id="toProf"><span class="n">${L.n}</span><span><b>${SYNC.user?escH(SYNC.user):'Můj profil'}</b><small class="sub">${myLvl(L)}, ${store.xp||0} XP</small></span><span class="go">Profil</span></button><button class="profStrip exStrip" id="toEx"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/></svg></span><span><b>Najít variantu</b><small class="sub">podle tahů na šachovnici</small></span></button><button class="profStrip exStrip" id="toEg"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M8 21h8M9 21l1-6h4l1 6M10 15 8 9h8l-2 6M12 3v3M10.5 4.5h3M9 9a3 3 0 0 1 6 0"/></svg></span><span><b>Koncovky</b><small class="sub">${ENDGAMES.length} úloh proti Stockfishi</small></span></button><button class="profStrip exStrip" id="toRz"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></span><span><b>Rozbor hráče</b><small class="sub">tvoje partie z chess.com</small></span></button>${PUZZLES.length?'<button class="profStrip exStrip" id="toPz"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span><span><b>Pasti a triky</b><small class="sub">'+PUZZLES.length+' úloh z tvých kurzů</small></span></button>':''}</div></div>`;
 h+=installCardHTML()+betaHomeHTML(false)+sec('w','Za bílé')+sec('b','Za černé')+syncHTML();
 $('home').innerHTML=h;renderSide();wireSync();wireInstall();betaWireHome();$('toProf').onclick=()=>go('#profil');$('toEx').onclick=()=>go('#hledat');{const jn=document.getElementById('jokeNext');if(jn)jn.onclick=()=>{JOKE_I=(JOKE_I+1+Math.floor(Math.random()*(JOKES.length-1)))%JOKES.length;$('jokeTx').textContent=JOKES[JOKE_I];};}{const td=document.getElementById('toDue');if(td)td.onclick=()=>go('#'+dueC.id);}const tp=document.getElementById('toPz');if(tp)tp.onclick=()=>go('#pasti');$('toEg').onclick=()=>go('#koncovky');$('toTu').onclick=()=>go('#lekce');$('toGuess').onclick=()=>go('#odhad');$('toRv').onclick=()=>go('#review');$('toRz').onclick=()=>go(store.ccName?'#rozbor/'+encodeURIComponent(store.ccName):'#rozbor');}
function renderHome(){if(page==='all')return renderOverview();if(page==='profile')return renderProfile();if(page==='explore')return renderExplore();if(page==='puzzles')return renderPuzzles();if(page==='pq')return renderPq();if(page==='endgames')return renderEndgames();if(page==='looks')return renderLooks();if(page==='rozbor')return renderRozbor();if(page==='tutorial')return renderTutorial();if(page==='review')return renderReview();if(page==='coords')return renderCoords();if(page==='lb')return renderLb();if(page==='cv')return renderCv();if(page==='souperi')return renderSouperi();if(page==='vyzva')return renderVyzva();
 document.body.classList.add('homeMode');const L=LINES();const rec=recommend();const cp=courseProg(course);
 let h=`<div class="homeHead"><a class="backAll" href="#">← Všechny kurzy</a><div class="kicker">${course.side==='w'?'Za bílé':'Za černé'}${t1chip()}</div>
 <div class="crsTop"><span class="pic crsIcon ${course.side==='b'?'b':''}" data-c="${course.id}">${courseIcon(course)}</span><div><h1>${course.title}</h1><div class="crsEn">${course.en&&course.en.toLowerCase()!==course.title.toLowerCase()?course.en:''}</div><p>${course.sub.replace(/^Repertoár za (bílé|černé) · /,'')}<br>${course.chapters.length} kapitol, ${L.length} variant</p></div><span class="miniRing">${ringSVG(cp,22,6)}<span>${cp}%</span></span></div></div>`;
 h+=`<div class="panelBar"><div class="sum"><span><b>${cp} %</b>${course.title}</span><span><b>${L.filter(isDone).length}/${L.length}</b>variant hotovo</span><span><b>${course.chapters.filter(isMastered).length}/${course.chapters.length}</b>kapitol na 100 %</span><span><b>${L.filter(l=>stateOf(l)==='due').length}</b>k opakování</span><span><b>Level ${lvlOf(store.xp).n}</b>${myLvl(lvlOf(store.xp))} · ${store.xp} XP</span></div>
 <div class="acts"><button class="btn" id="hCustom">Vlastní drill</button><button class="btn primary" id="hGo">${rec.t}<small>${rec.s}</small></button></div></div>`;
 h+=`<div class="toolsRow"><div class="chip2" role="group" aria-label="Řazení variant"><button data-sort="tree" aria-pressed="${store.sort!=='pop'}">Podle podobnosti</button><button data-sort="pop" aria-pressed="${store.sort==='pop'}">Nejhranější</button></div>
 <label class="death" title="V drillu: jedna chyba a celý drill začíná znovu"><input type="checkbox" id="deathToggle" ${store.death?'checked':''}> <span>Mód smrti${store.death?' <b>zapnutý</b>':''}</span></label>
 <div class="legendRow">${['new','learning','lapsed','done','due'].map(s=>`<span><span class="st s-${s}">${STI[s]}</span>${ST[s][0]}</span>`).join('')}<span><i style="display:inline-block;width:22px;height:5px;border-radius:3px;background:var(--best)"></i>Jak často to potkáš (Lichess)</span></div></div><p class="popHelp">ⓘ <b>Modrá procenta u variant nejsou tvůj postup.</b> Ukazují, jak často na Lichess soupeř zahraje tah, kterým varianta začíná – tedy jak pravděpodobně ji ve hře potkáš. Tvůj postup ukazují kroužky, zelené pruhy a ikonky u variant.</p><div class="chList">`;
 const oc=openCh['home-'+course.id]=openCh['home-'+course.id]||new Set();
 course.chapters.forEach((ch,ci)=>{const mast=isMastered(ch),p=chPct(ch),allDone=ch.lines.every(isDone),nn=ch.lines.find(l=>stateOf(l)==='new');const d=ch.lines.filter(isDone).length;
  h+=`<details class="chRow${mast?' mast':''}" data-ci="${ci}"${oc.has(ci)?' open':''}><summary><span class="chNum">${mast?'✓':ci+1}</span><span class="chT"><b>${ch.t}${enH(ch)}</b><small>${ch.s} · ${ch.lines.length} variant</small></span><span class="chP"><div class="bar"><i style="width:${p}%"></i></div><span>${d}/${ch.lines.length} · ${p} %</span></span>
  <span class="chA">${nn?`<button class="btn" data-learn="${ci}">Naučit</button>`:''}${d?`<button class="btn" data-drill="${ci}">Drill</button>`:''}${allDone?`<button class="btn test" data-test="${ci}">${mast?'Test znovu':'Test kapitoly'}</button>`:''}</span></summary>
  <div class="chBody"><div class="chPlan2"><b>Plán:</b> ${ch.plan}</div><div class="lineTable">`;
  sortedLines(ch).forEach(l=>{const st=stateOf(l);h+=`<button class="hLine" data-id="${l.id}" title="${ST[st][0]}"><span class="st s-${st}">${STI[st]}</span><span>${l.name}${enH(l)}<span class="full">${l.full}</span>${(()=>{const S=lineStats(course,l);return S?`<span class="lnSt">${statTxt(S)} <span class="lnStBtn" data-stats="${l.id}" role="button" tabindex="0">Kde chybuju</span></span>`:''})()}</span>${popHTML(l)||'<span></span>'}<span class="act">${st==='new'?'Naučit':'Procvičit'}</span></button>`;});
  h+=`</div></div></details>`;});
 h+=`</div>`+syncHTML();
 $('home').innerHTML=h;renderSide();wireSync();
 $('home').querySelectorAll('details.chRow').forEach(dd=>dd.addEventListener('toggle',()=>{const ci=+dd.dataset.ci;dd.open?oc.add(ci):oc.delete(ci);}));
 $('hGo').onclick=()=>{if(rec.ch){showTrainer();startSession(rec.ch.lines,`Test kapitoly: ${rec.ch.t}`,rec.ch);}else openLine(rec.l,rec.m);};
 $('hCustom').onclick=()=>openPicker();
 $('deathToggle').onchange=e=>{store.death=e.target.checked;save();renderHome();};}
$('home').addEventListener('click',e=>{const cc=e.target.closest('.cCard');if(cc){go('#'+cc.dataset.c);return;}
 const pa=e.target.closest('[data-goto]');if(pa){go(pa.dataset.goto);return;}
 const pl=e.target.closest('[data-play]');if(pl){const [cid,lid]=pl.dataset.play.split('|');const c=COURSES.find(x=>x.id===cid);if(c){if(c!==course){course=c;}page='course';history.pushState(null,'','#'+c.id);openLine(LINES().find(l=>l.id===lid));}return;}
 const so=e.target.closest('[data-sort]');if(so){store.sort=so.dataset.sort;save();renderHome();return;}
 const sb=e.target.closest('[data-stats]');if(sb){e.stopPropagation();openLineStats(course,LINES().find(l=>l.id===sb.dataset.stats));return;}
 const ln=e.target.closest('.hLine');if(ln){openLine(LINES().find(l=>l.id===ln.dataset.id));return;}
 const b=e.target.closest('[data-learn],[data-drill],[data-test]');if(!b)return;e.preventDefault();const ch=course.chapters[+(b.dataset.learn??b.dataset.drill??b.dataset.test)];
 if(b.dataset.learn!=null){openLine(ch.lines.find(l=>stateOf(l)==='new'),'learn');}
 else if(b.dataset.drill!=null){showTrainer();startSession(ch.lines.filter(isDone).length?ch.lines.filter(isDone):ch.lines,`Drill: ${ch.t}`,null);}
 else{showTrainer();startSession(ch.lines,`Test kapitoly: ${ch.t}`,ch);}});
/* Domů: z trenažéru vždy rovnou na hlavní stránku */$('homeBtn').onclick=$('miniHome').onclick=()=>{BT.from=null;sfStop&&sfStop();go('');};
$('backBtn').onclick=$('miniBack').onclick=()=>{/* z procvičování varianty (Varianty od hráčů, Najít variantu, nové partie) zpátky tam, odkud jsi přišel */if(BT.from!=null){const h=BT.from;BT.from=null;history.back();if(!h)setTimeout(()=>{if(location.hash)go('');},300);return;}showHome();};
