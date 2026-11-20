/* Puzzle (#puzzle) včetně Z tvých partií a Vyber tah. Pořadí načítání je v index.html (APP_JS). */
/* ---------- Puzzle (#puzzle): úrovně, hodnocené úlohy, motivy, Puzzle Rush, pasti v zahájení ----------
   Úlohy: databáze Lichess (CC0) v puzzles/<pásmo>.txt, řádek = id;FEN;tahy UCI;rating;motivy.
   FEN je pozice PŘED tahem soupeře, první tah v seznamu zahraje soupeř, pak se střídá hráč a soupeř. */
const PQ_TIERS=[['Nováček',400,700,'Mat jedním tahem, nekryté figury, první vidličky'],['Začátečník',800,1100,'Vidličky, vazby, maty na dva tahy'],['Pokročilý',1200,1500,'Kombinace na víc tahů, odlákání, oběti'],['Klubový hráč',1600,1900,'Tiché tahy, mezitahy, delší výpočty'],['Expert',2000,2300,'Hluboké kombinace a koncovky'],['Mistr',2400,2800,'Úlohy, na které potřebuješ mistrovský výpočet']];
const PQ_BANDS=[];for(let b=400;b<=2800;b+=100)PQ_BANDS.push(b);
const PQ_LVL_N=PQ_BANDS.length*4,PQ_PER=10,PQ_PASS=7;
const PQ_TH={mateIn1:'Mat 1 tahem',mateIn2:'Mat 2 tahy',mateIn3:'Mat 3 tahy',mateIn4:'Mat 4 tahy',mateIn5:'Mat 5 a víc tahy',fork:'Vidlička',pin:'Vazba',skewer:'Napíchnutí',discoveredAttack:'Odtažný útok',discoveredCheck:'Odtažný šach',doubleCheck:'Dvojitý šach',hangingPiece:'Nekrytá figura',trappedPiece:'Chycená figura',sacrifice:'Oběť',deflection:'Odlákání',attraction:'Vlákání',clearance:'Uvolnění linie',interference:'Přerušení',intermezzo:'Mezitah',xRayAttack:'Rentgen',capturingDefender:'Odstranění obránce',zugzwang:'Nevýhoda tahu',quietMove:'Tichý tah',defensiveMove:'Obrana',backRankMate:'Mat na poslední řadě',smotheredMate:'Udušený mat',arabianMate:'Arabský mat',anastasiaMate:'Anastázin mat',bodenMate:'Bodenův mat',operaMate:'Operní mat',hookMate:'Mat hákem',pillsburysMate:'Pillsburyho mat',epauletteMate:'Nárameníkový mat',doubleBishopMate:'Mat dvěma střelci',dovetailMate:'Mat vlaštovčí ocas',cornerMate:'Mat v rohu',morphysMate:'Morphyho mat',swallowstailMate:'Mat vidlicí',triangleMate:'Trojúhelníkový mat',killBoxMate:'Mat v kleci',balestraMate:'Balestra mat',blindSwineMate:'Slepá prasata',vukovicMate:'Vukovićův mat',promotion:'Proměna',underPromotion:'Proměna v jinou figuru',advancedPawn:'Daleký pěšec',attackingF2F7:'Útok na f2/f7',kingsideAttack:'Útok na krále',queensideAttack:'Útok na dámském křídle',exposedKing:'Odkrytý král',enPassant:'Braní mimochodem',castling:'Rošáda',opening:'Zahájení',middlegame:'Střední hra',endgame:'Koncovka',rookEndgame:'Věžová koncovka',pawnEndgame:'Pěšcová koncovka',bishopEndgame:'Střelcová koncovka',knightEndgame:'Jezdcová koncovka',queenEndgame:'Dámská koncovka',queenRookEndgame:'Dáma a věž v koncovce',mate:'Mat',crushing:'Drtivá výhoda',advantage:'Výhoda',master:'Z partie mistrů',masterVsMaster:'Mistr proti mistrovi',superGM:'Z partie velmistrů',oneMove:'Jeden tah',short:'Krátká',long:'Delší',veryLong:'Velmi dlouhá',equality:'Vyrovnání'};
const PQ_GROUPS=[['Taktické motivy',['fork','pin','skewer','discoveredAttack','discoveredCheck','doubleCheck','hangingPiece','trappedPiece','sacrifice','deflection','attraction','capturingDefender','clearance','interference','intermezzo','xRayAttack','quietMove','defensiveMove','zugzwang','attackingF2F7','exposedKing','kingsideAttack','advancedPawn','promotion','underPromotion','enPassant']],
 ['Maty',['mateIn1','mateIn2','mateIn3','mateIn4','mateIn5','backRankMate','smotheredMate','arabianMate','anastasiaMate','bodenMate','operaMate','hookMate','pillsburysMate','epauletteMate','doubleBishopMate','dovetailMate','cornerMate','morphysMate','killBoxMate']],
 ['Fáze hry a koncovky',['opening','middlegame','endgame','rookEndgame','pawnEndgame','bishopEndgame','knightEndgame','queenEndgame','queenRookEndgame']]];
const PQ_DIFF=[['Lehké',500,900],['Střední',1000,1400],['Těžké',1500,1900],['Velmi těžké',2000,2400],['Mistrovské',2500,2800]];
const PQ_TRAPS=[{"id":"fool","n":"Bláznův mat","o":"Birdova hra","d":"Bílý oslabil diagonálu e1–h4 dvěma pěšci. Dáma dá mat jedním tahem.","pre":"f3 e5","fen":"rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2","lines":["g2g4 d8h4"]},{"id":"scholar","n":"Školní mat","o":"Italská hra","d":"Černý napadl dámu, ale zapomněl krýt pole f7, které bránil jen král.","pre":"e4 e5 Bc4 Nc6 Qh5","fen":"r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3","lines":["g8f6 h5f7"]},{"id":"caro-smother","n":"Udušený mat v Caro-Kannu","o":"Caro-Kannova obrana","d":"Dáma na e2 vazbí pěšce e7 a král nemá kam utéct. Jezdec dá mat.","pre":"e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Qe2","fen":"r1bqkbnr/pp1npppp/2p5/8/3PN3/8/PPP1QPPP/R1B1KBNR b KQkq - 2 5","lines":["g8f6 e4d6"]},{"id":"kieninger","n":"Kiengerova past","o":"Budapešťský gambit","d":"Bílý vzal střelce, ale jezdec d2 je vázaný a pěšec e2 taky. Jezdec skočí na d3.","pre":"d4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 a3 Ngxe5","fen":"r1b1k2r/ppppqppp/2n5/4n3/1bP2B2/P4N2/1P1NPPPP/R2QKB1R w KQkq - 0 8","lines":["a3b4 e5d3"]},{"id":"petrov-nc6","n":"Odtažný šach v Petrovově obraně","o":"Petrovova obrana","d":"Černý kopíroval bílého o tah déle. Jezdec odskočí se šachem od dámy a napadne černou dámu.","pre":"e4 e5 Nf3 Nf6 Nxe5 Nxe4 Qe2","fen":"rnbqkb1r/pppp1ppp/8/4N3/4n3/8/PPPPQPPP/RNB1KB1R b KQkq - 1 4","lines":["e4f6 e5c6 f8e7 c6d8"]},{"id":"legal","n":"Legalův mat","o":"Philidorova obrana","d":"Jezdec f3 je jen zdánlivě vázaný. Když černý sebere dámu, lehké figury dají mat.","pre":"e4 e5 Nf3 d6 Bc4 Bg4 Nc3","fen":"rn1qkbnr/ppp2ppp/3p4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 3 4","lines":["g7g6 f3e5 g4d1 c4f7 e8e7 c3d5"]},{"id":"blackburne","n":"Blackburnova past","o":"Italská hra","d":"Bílý chňapl po pěšci e5. Černá dáma napadne jezdce i pěšce g2 a útok skončí matem.","pre":"e4 e5 Nf3 Nc6 Bc4 Nd4","fen":"r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4","lines":["f3e5 d8g5 e5f7 g5g2 h1f1 g2e4 c4e2 d4f3"]},{"id":"englund","n":"Past v Englundově gambitu","o":"Englundův gambit","d":"Bílý napadl dámu, ale věž a1 i pole c1 zůstanou bez obrany.","pre":"d4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2","fen":"r1b1kbnr/pppp1ppp/2n5/4P3/8/5N2/PqPBPPPP/RN1QKB1R w KQkq - 0 6","lines":["d2c3 f8b4 d1d2 b4c3 d2c3 b2c1"]},{"id":"stafford","n":"Past ve Staffordově gambitu","o":"Petrovova obrana","d":"Bílý vazbí jezdce na dámu. Černý vazbu ignoruje: obětuje dámu a lehké figury dají mat.","pre":"e4 e5 Nf3 Nf6 Nxe5 Nc6 Nxc6 dxc6 d3 Bc5","fen":"r1bqk2r/ppp2ppp/2p2n2/2b5/4P3/3P4/PPP2PPP/RNBQKB1R w KQkq - 1 6","lines":["c1g5 f6e4 g5d8 c5f2 e1e2 c8g4"]},{"id":"siberian","n":"Sibiřská past","o":"Smith-Morrův gambit","d":"Bílý chtěl vyhnat jezdce g4. Jezdec skočí na d4 a odláká jezdce f3, který kryje h2.","pre":"e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 Qc7 O-O Nf6 Qe2 Ng4","fen":"r1b1kb1r/ppqp1ppp/2n1p3/8/2B1P1n1/2N2N2/PP2QPPP/R1B2RK1 w kq - 6 9","lines":["h2h3 c6d4 f3d4 c7h2"]},{"id":"from","n":"Past ve Fromově gambitu","o":"Birdova hra","d":"Bílý pustil černé figury na oslabené královské křídlo. Dáma se obětuje a střelec dá mat.","pre":"f4 e5 fxe5 d6 exd6 Bxd6","fen":"rnbqk1nr/ppp2ppp/3b4/8/8/8/PPPPP1PP/RNBQKBNR w KQkq - 0 4","lines":["b1c3 d8h4 g2g3 h4g3 h2g3 d6g3","b1c3 d8h4 g2g3 d6g3 h2g3 h4g3"]},{"id":"owen","n":"Past v Owenově obraně","o":"Owenova obrana","d":"Černý napadl dámu, ale pěšec g6 je mnohem silnější. Bílý dá šach a pak mat střelcem.","pre":"e4 b6 d4 Bb7 Bd3 f5 exf5 Bxg2 Qh5+ g6 fxg6","fen":"rn1qkbnr/p1ppp2p/1p4P1/7Q/3P4/3B4/PPP2PbP/RNB1K1NR b KQkq - 0 6","lines":["g8f6 g6h7 f6h5 d3g6"]},{"id":"elephant","n":"Sloní past","o":"Dámský gambit","d":"Jezdec f6 není opravdu vázaný. Černý obětuje dámu a vrátí si ji se ziskem figury.","pre":"d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5","fen":"r1bqkb1r/pppn1ppp/5n2/3p2B1/3P4/2N5/PP2PPPP/R2QKBNR w KQkq - 0 6","lines":["c3d5 f6d5 g5d8 f8b4 d1d2 b4d2 e1d2 e8d8","c3d5 f6d5 g5d8 f8b4 d1d2 e8d8"]},{"id":"lasker","n":"Laskerova past","o":"Albinův protigambit","d":"Pěšec dojde až na první řadu. Proměna v jezdce dá šach a pak střelec napadne dámu.","pre":"d4 d5 c4 e5 dxe5 d4 e3 Bb4+ Bd2 dxe3","fen":"rnbqk1nr/ppp2ppp/8/4P3/1bP5/4p3/PP1B1PPP/RN1QKBNR w KQkq - 0 6","lines":["d2b4 e3f2 e1e2 f2g1n h1g1 c8g4"]},{"id":"noah","n":"Noemova archa","o":"Španělská hra","d":"Bílá dáma vzala pěšce. Černý ji honí s tempem a nakonec chytí střelce b3 pěšci.","pre":"e4 e5 Nf3 Nc6 Bb5 a6 Ba4 d6 d4 b5 Bb3 Nxd4 Nxd4 exd4","fen":"r1bqkbnr/2p2ppp/p2p4/1p6/3pP3/1B6/PPP2PPP/RNBQK2R w KQkq - 0 8","lines":["d1d4 c7c5 d4d5 c8e6 d5c6 e6d7 c6d5 c5c4"]},{"id":"mortimer","n":"Mortimerova past","o":"Španělská hra","d":"Bílý sebral pěšce. Černý vyžene střelce a dáma dá šach s napadením jezdce e5.","pre":"e4 e5 Nf3 Nc6 Bb5 Nf6 d3 Ne7","fen":"r1bqkb1r/ppppnppp/5n2/1B2p3/4P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5","lines":["f3e5 c7c6 b5a4 d8a5 c1d2 a5e5"]},{"id":"qga-b5","n":"Držení pěšce v přijatém dámském gambitu","o":"Dámský gambit","d":"Černý chce držet pěšce c4. Bílý rozbije řetěz a dáma napadne věž a8 přes diagonálu.","pre":"d4 d5 c4 dxc4 e3","fen":"rnbqkbnr/ppp1pppp/8/8/2pP4/4P3/PP3PPP/RNBQKBNR b KQkq - 0 3","lines":["b7b5 a2a4 c7c6 a4b5 c6b5 d1f3"]},{"id":"damiano","n":"Damianova obrana","o":"Damianova obrana","d":"Tah f6 oslabil krále. Po šachu dáma napadne krále a věž h8 zároveň.","pre":"e4 e5 Nf3 f6 Nxe5","fen":"rnbqkbnr/pppp2pp/5p2/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3","lines":["f6e5 d1h5 g7g6 h5e5 d8e7 e5h8"]},{"id":"fishing","n":"Rybářský prut","o":"Španělská hra","d":"Bílý sebral jezdce na návnadě. Sloupec h se otevřel, dáma s věží za zády dá mat na h1.","pre":"e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Ng4 h3 h5","fen":"r1bqkb1r/pppp1pp1/2n5/1B2p2p/4P1n1/5N1P/PPPP1PP1/RNBQ1RK1 w kq - 0 6","lines":["h3g4 h5g4 f3h2 d8h4 h2g4 h4h1"]}];
const PQ={route:'urovne',bands:{},loading:{},g:null,flip:false,p:null,lines:[],step:0,lock:true,fail:false,hint:0,done:false,ctx:null,lvl:null,rush:null,diff:1,theme:null,playing:false,tok:0};
/* rozestup opakování chyb (18. 11. 2026): chybná úloha se vrátí za 1 den, po čistém vyřešení za 3, pak za 7 dní; pak je naučená */
const SR_DAYS=[1,3,7],srDue=n=>Date.now()+SR_DAYS[Math.min(n,SR_DAYS.length-1)]*864e5-3*36e5;
const srWhen=t=>{const d=Math.ceil((t-Date.now())/864e5);return d<=1?'zítra':d<5?`za ${d} dny`:`za ${d} dní`;};
const pqStore=()=>{store.pq=store.pq||{};const s=store.pq;s.lv=s.lv||{};s.r=s.r||800;s.rn=s.rn||0;s.rh=s.rh||[];s.seen=s.seen||[];s.rush=s.rush||{};s.tr=s.tr||{};s.th=s.th||{};s.ok=s.ok||0;s.all=s.all||0;s.miss=s.miss||[];s.daily=s.daily||{};s.own=s.own||{};s.ownF=s.ownF||{};return s;};
function pqRand(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function pqBandOf(r){return Math.max(400,Math.min(2800,Math.floor(r/100)*100));}
function pqLoadBand(b){if(PQ.bands[b])return Promise.resolve(PQ.bands[b]);if(PQ.loading[b])return PQ.loading[b];
 PQ.loading[b]=fetch('puzzles/'+String(b).padStart(4,'0')+'.txt').then(r=>{if(!r.ok)throw new Error('http '+r.status);return r.text();}).then(t=>{const L=t.trim().split('\n').map(l=>{const [id,fen,mv,r,th]=l.split(';');return {id,fen,lines:[mv.split(' ')],r:+r,th:th?th.split(' '):[]};});PQ.bands[b]=L;return L;}).catch(e=>{delete PQ.loading[b];throw e;});return PQ.loading[b];}
const pqThName=t=>PQ_TH[t]||t;
const pqShowTh=p=>p.th.filter(t=>PQ_TH[t]&&!['short','long','veryLong','oneMove','crushing','advantage','mate','equality','master','masterVsMaster','superGM'].includes(t)).slice(0,4).map(pqThName);
function pqLvlInfo(n){const bi=Math.floor((n-1)/4),q=(n-1)%4,band=PQ_BANDS[bi];const ti=PQ_TIERS.findIndex(t=>band>=t[1]&&band<=t[2]);return {bi,q,band,ti};}
function pqUnlocked(n){const s=pqStore();return n===1||!!s.lv[n-1]||!!s.lv[n]||!!s.skip&&n<=s.skip;}
function pqStars(k){return k>=10?3:k>=9?2:k>=PQ_PASS?1:0;}
const PQ_STAR='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
function pqStarsHTML(k,max){let h='';for(let i=0;i<(max||3);i++)h+=`<i class="${i<k?'on':''}">${PQ_STAR}</i>`;return `<span class="pqStars">${h}</span>`;}
const PQ_TABS=[['urovne','Úrovně'],['vyber','Vyber tah'],['denni','Denní'],['hodnocene','Hodnocené'],['motivy','Podle motivu'],['rush','Puzzle Rush'],['pasti','Pasti v zahájení'],['chyby','Opakovat chyby'],['kurzy','Pasti z kurzů']];
function pqTabs(on){return `<div class="pqTabs" role="tablist">${(pqOwnName()?[['moje','Z tvých partií'],...PQ_TABS]:PQ_TABS).map(([k,t])=>`<a role="tab" href="${k==='kurzy'?'#pasti':'#puzzle/'+k}" aria-selected="${k===on}">${t}</a>`).join('')}</div>`;}
function pqHead(on,sub){const s=pqStore();return `<div class="pqHero"><div><h1>Puzzle</h1><p>${sub}</p></div><div class="pqHeroSt"><span><b>${s.r}</b><small>hodnocení</small></span><span><b>${Object.keys(s.lv).length}</b><small>z ${PQ_LVL_N} úrovní</small></span><span><b>${s.ok}</b><small>vyřešeno</small></span></div></div>${pqTabs(on)}`;}
function pqBoardHTML(){return `<div class="exWrap pqWrap"><div class="exLeft"><div class="profCard"><div class="pqGoalTop" id="pqGoalTop" hidden></div><div class="xRow pqRow"><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div></div></div><div class="exRight"><div class="profCard" id="pqPanel"></div><div class="profCard" id="pqSide" hidden></div></div></div>`;}
function pqStopRush(){if(PQ.rush&&PQ.rush.tm){clearInterval(PQ.rush.tm);PQ.rush.tm=null;}}
async function renderPq(){pqFabHide();document.body.classList.add('homeMode');XB.mode='pq';pqStopRush();PQ.tok++;
 const r=PQ.route||'urovne';const H=$('home');
 if(!CHESS){H.innerHTML='<p class="profEmpty">Načítám…</p>';try{await chessLib();}catch(e){H.innerHTML='<p class="profEmpty">Nepodařilo se načíst šachová pravidla. Zkus obnovit stránku.</p>';return;}if(page!=='pq')return;}
 const [tab,arg]=r.split('/');
 if(tab==='hodnocene')return pqRatedPage();
 if(tab==='motivy')return pqThemePage(arg);
 if(tab==='rush')return pqRushPage();
 if(tab==='pasti')return pqTrapPage(arg);
 if(tab==='uroven'&&+arg)return pqLevelPlay(+arg);
 if(tab==='zkouska'&&arg!=null)return pqTestPlay(+arg);
 if(tab==='denni')return pqDailyPage();
 if(tab==='vyber')return vyPage();
 if(tab==='chyby')return pqMissPage();
 if(tab==='moje')return pqOwnPage();
 return pqLevelsPage();}
/* ---- Z tvých partií (18. 11. 2026): úlohy z hrubých chyb hráče na chess.com, předem spočítané Stockfishem (hl. 15, MultiPV 2, jen pozice s jedním jasně nejlepším tahem).
   Soubor puzzles/hraci/<jméno z chess.com malými>.txt, řádek: id;fen před tahem soupeře;tah soupeře + správný tah (UCI);rating;témata;co hráč zahrál;soupeř;datum.
   Kdo má soubor: PQ_OWN (jméno z chess.com) a PQ_OWN_ACC (účet → jméno). Vyřešené v store.pq.own. */
const PQ_OWN=['gengstrdavca'],PQ_OWN_ACC={davidbiciste:'gengstrdavca'};
function pqOwnName(){const G=store.pq&&store.pq.gen;if(G&&G.L&&G.L.length)return 'gen:'+G.n;if(typeof SYNC!=='undefined'&&SYNC.user&&!PQ_OWN_ACC[String(SYNC.user).toLowerCase()])return 'gen:';const c=String(store.ccName||'').toLowerCase();if(PQ_OWN.includes(c))return c;const a=typeof SYNC!=='undefined'&&SYNC.user?PQ_OWN_ACC[String(SYNC.user).toLowerCase()]:null;return a||null;}
const PQO={list:null,name:null};
function pqOwnAfter(p){const o=p.own,g=o.gain;const why=g==='mat'?'Na konci varianty je soupeř v matu.':(+g>=1?`Na konci varianty máš o ${g} ${+g===1?'bod':+g<5?'body':'bodů'} materiálu víc než na začátku${+g>=9?' (to je jako dáma)':+g>=5?' (to je jako věž)':+g>=3?' (to je jako lehká figura)':''}.`:'Pozice zůstane v pořádku, zatímco tvůj tah v partii ji pokazil.');
 return `V partii proti ${escH(o.opp)} (${escH(o.d)}) jsi tu zahrál <b>${escH(o.my)}</b>. ${why}${o.cont?`<br>Jak by to šlo dál: <b>${escH(o.cont)}</b>`:''}`;}
async function pqOwnLoad(){const n=pqOwnName();if(!n)return [];if(PQO.list&&PQO.name===n)return PQO.list;let t;if(n.startsWith('gen:')){const G=store.pq&&store.pq.gen;t=G&&G.L?G.L.join('\n'):'';}else t=await fetch('puzzles/hraci/'+n+'.txt').then(r=>{if(!r.ok)throw new Error('http '+r.status);return r.text();});
 PQO.name=n;PQO.list=t.trim().split('\n').filter(l=>l&&l[0]!=='#').map(l=>{const [id,fen,mv,r,th,my,opp,d,cont,gain]=l.split(';');return {id,fen,lines:mv.split('|').map(x=>x.split(' ')),r:+r,th:th?th.split(' '):[],own:{my,opp,d,cont:cont||'',gain:gain||''}};});return PQO.list;}
async function pqOwnPage(){const H=$('home');let L;try{L=await pqOwnLoad();}catch(e){H.innerHTML=pqHead('moje','')+'<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';renderSide();return;}if(page!=='pq')return;
 if(!L.length||PQ.genView){PQ.genView=false;return ogPage();}
 H.innerHTML=pqTabs('moje')+pqBoardHTML()+`<p class="profEmpty ogMore"><button class="nxLink" id="ogRedo">Udělat nové úlohy z posledních partií</button></p>`;renderSide();const rb=document.getElementById('ogRedo');if(rb)rb.onclick=()=>{PQ.genView=true;renderPq();};PQ.ctx='own';xInput();pqOwnNext();}
/* ---- Úlohy z tvých partií pro všechny (18. 11. 2026): partie z chess.com → Stockfish v prohlížeči hráče → store.pq.gen={n,t,L:[řádky ve formátu souboru puzzles/hraci]}.
   1) hl. 8 všechny pozice (posledních OG_N partií), 2) kandidáti (pozice ≥ -1 pěšec, po tahu o ≥2 pěšce hůř a pod +2): hl. 13 MultiPV 2, jen jasně nejlepší tah,
   3) prodloužení až na 3 tahy (hl. 12, MultiPV 3, uznává tahy do 0,8 pěšce od nejlepšího, jen když je pořád výhoda ≥1,5). Max 2 úlohy z partie, max 40. */
const OG_N=50,OG={run:false,stop:false};
function ogPage(){const H=$('home');const G=store.pq&&store.pq.gen;const nm=store.ccName||'';
 H.innerHTML=pqHead('moje','Úlohy z pozic, kde jsi ve svých partiích na chess.com udělal hrubou chybu. Najdeš lepší tah a dotáhneš ho – přesně ty situace, které ti utíkají.')+`<div class="profCard ogCard"><h2>Vytvořit úlohy z mých partií</h2>
 <p class="profEmpty">Stockfish projde tvých posledních ${OG_N} partií přímo v tomhle prohlížeči a najde tahy, kde jsi přišel o hodně. Na počítači to trvá asi minutu, na mobilu o něco déle. Stránku nech otevřenou.</p>
 <form id="ogForm" class="ogRow"><input id="ogName" placeholder="Jméno na chess.com" value="${escH(nm)}" autocomplete="off" required><button class="btn primary" id="ogGo">Vytvořit úlohy</button></form>
 ${G&&G.L&&G.L.length?`<p class="profEmpty">Teď máš ${G.L.length} úloh z partií hráče ${escH(G.n)} (${new Date(G.t).toLocaleDateString('cs-CZ')}). Nové úlohy je nahradí. <a href="#puzzle/moje" id="ogBack">Zpět k úlohám</a></p>`:''}
 <div id="ogProg" hidden><div class="ogBar"><i style="width:0"></i></div><p class="profEmpty" id="ogTx"></p><button class="btn" id="ogStop" type="button">Zastavit</button></div></div>`;renderSide();
 const bk=document.getElementById('ogBack');if(bk)bk.onclick=e=>{e.preventDefault();PQ.genView=false;renderPq();};
 $('ogForm').onsubmit=e=>{e.preventDefault();const n=$('ogName').value.trim();if(n&&!OG.run)ogRun(n);};$('ogStop').onclick=()=>{OG.stop=true;};}
function ogProg(pct,tx){const b=document.querySelector('#ogProg i'),t=document.getElementById('ogTx');if(b)b.style.width=Math.round(pct)+'%';if(t)t.textContent=tx;}
async function ogRun(name){OG.run=true;OG.stop=false;const pr=document.getElementById('ogProg');if(pr)pr.hidden=false;$('ogGo').disabled=true;let w=null;
 try{ogProg(2,'Načítám partie z chess.com…');if(!CHESS)await chessLib();const tok=++RZ.token;
  const r=await rzLoad(name,{tempo:['blitz','rapid','bullet'],limit:OG_N+10,token:tok},()=>{});if(!r)throw new Error('stop');
  const me=name.toLowerCase();const G=r.games.filter(g=>['blitz','rapid','bullet'].includes(g.time_class)).map(g=>rzParse(g,me)).filter(g=>g&&g.fens&&g.sans&&g.sans.length>=10).sort((a,b)=>b.end-a.end).slice(0,OG_N);
  if(!G.length){ogProg(0,'Nenašel jsem žádné partie. Zkontroluj jméno.');return;}
  w=new Worker('engine/stockfish.js');let mpv=1;await new Promise(ok=>{w.onmessage=e=>{if(String(e.data).includes('uciok'))ok();};w.postMessage('uci');});
  const an=(fen,depth,k)=>new Promise(ok=>{if(k!==mpv){w.postMessage('setoption name MultiPV value '+k);mpv=k;}const pv={};w.onmessage=e=>{const x=String(e.data);if(x.startsWith('info')&&x.includes(' pv ')&&x.includes(' score ')){const m=+((x.match(/ multipv (\d+)/)||[0,1])[1]);const sc=x.match(/ score (cp|mate) (-?\d+)/);pv[m]={t:sc[1],v:+sc[2],pv:x.split(' pv ')[1].split(' ')};}if(x.startsWith('bestmove'))ok(pv);};w.postMessage('position fen '+fen);w.postMessage('go depth '+depth);});
  const sv=x=>!x?-99999:x.t==='mate'?(x.v>0?100000-x.v*100:-100000-x.v*100):x.v;const ev1=x=>!x?null:x.t==='mate'?(x.v>0?10000-x.v*10:-10000-x.v*10):x.v;
  const F=f=>f.split(' ').length<6?f+' 0 1':f;const mv=(g,u)=>{try{return g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]});}catch(e){return null;}};
  const VAL={p:1,n:3,b:3,r:5,q:9,k:0};const mat=(g,c)=>{let t=0;for(const row of g.board())for(const q of row)if(q)t+=(q.color===c?1:-1)*VAL[q.type];return t;};
  const tot=G.reduce((a,g)=>a+g.fens.length,0);let done=0;const cand=[];
  for(const g of G){const ev=[];for(let i=0;i<g.fens.length;i++){if(OG.stop)throw new Error('stop');const p=await an(F(g.fens[i]),8,1);ev.push(ev1(p[1]));done++;if(done%20===0)ogProg(5+60*done/tot,`Procházím partie… ${G.indexOf(g)+1} z ${G.length}`);}
   for(let i=1;i<g.sans.length;i++){const f=g.fens[i];if(!f||f.split(' ')[1]!==g.col)continue;const b=ev[i],a=ev[i+1]==null?null:-ev[i+1];if(b==null||a==null)continue;if(b>=-100&&a<=b-200&&a<200)cand.push({g,i});}}
  const P=[];let k=0;for(const c of cand){if(OG.stop)throw new Error('stop');k++;ogProg(65+20*k/cand.length,`Ověřuji chyby… ${k} z ${cand.length}`);const {g,i}=c;const f=F(g.fens[i]),fp=F(g.fens[i-1]);
   const go=new CHESS(fp);let o2=null;try{o2=go.move(g.sans[i-1]);}catch(e){}let m2=null;try{m2=new CHESS(f).move(g.sans[i]);}catch(e){}if(!o2||!m2)continue;
   const r2=await an(f,13,2);const b=r2[1],s2=r2[2];if(!b)continue;const myu=m2.from+m2.to+(m2.promotion||'');if(b.pv[0]===myu)continue;const v1=sv(b);if(v1<-80)continue;if(s2&&v1-sv(s2)<150&&!(b.t==='mate'&&b.v>0&&s2.t!=='mate'))continue;
   P.push({g,i,f,fp,ou:o2.from+o2.to+(o2.promotion||''),my:g.sans[i],best:b.pv[0],v1,mate:b.t==='mate'&&b.v>0});}
  const per={};const P2=P.filter(x=>(per[x.g.url]=(per[x.g.url]||0)+1)<=2).slice(0,40);const out=[];k=0;
  for(const x of P2){if(OG.stop)throw new Error('stop');k++;ogProg(85+14*k/P2.length,`Skládám úlohy… ${k} z ${P2.length}`);const g0=new CHESS(x.f);const meC=g0.turn();const m0=mat(g0,meC);mv(g0,x.best);const lines=[];
   const ext=async(fen,line,d)=>{const g=new CHESS(fen);if(d>=3||g.isGameOver()){lines.push({line,fen});return;}const q=await an(fen,12,1);if(!q[1]){lines.push({line,fen});return;}const rp=q[1].pv[0];if(!mv(g,rp)||g.isGameOver()){lines.push({line,fen});return;}
    const q2=await an(g.fen(),12,3);const bb=q2[1];if(!bb){lines.push({line,fen});return;}const bs=sv(bb);const cs=[1,2,3].map(j=>q2[j]).filter(y=>y&&sv(y)>=bs-80&&sv(y)>=150).slice(0,2);if(!cs.length){lines.push({line,fen});return;}
    for(const y of cs){const g2=new CHESS(g.fen());if(!mv(g2,y.pv[0]))continue;await ext(g2.fen(),line.concat([rp,y.pv[0]]),d+1);}};
   await ext(g0.fen(),[x.ou,x.best],1);if(!lines.length)continue;const gm=new CHESS(lines[0].fen);const cont=[];if(!gm.isGameOver()){const q3=await an(gm.fen(),11,1);if(q3[1])for(const u of q3[1].pv.slice(0,4)){const m=mv(gm,u);if(!m)break;cont.push(m.san);}}
   const isM=gm.isCheckmate()||x.mate;const id='o'+(x.g.end||0).toString(36)+x.i;const d=new Date((x.g.end||0)*1000);
   out.push([id,x.fp,lines.map(l=>l.line.join(' ')).join('|'),800,isM?'mate':x.v1>=300?'crushing':'advantage',x.my,String(x.g.opp||'').replace(/;/g,''),d.getDate()+'. '+(d.getMonth()+1)+'. '+d.getFullYear(),cont.join(' '),isM?'mat':String(mat(gm,meC)-m0)].join(';'));}
  if(!out.length){ogProg(100,'V posledních partiích jsem nenašel pozici s jedním jasně nejlepším tahem. Zkus to zase za pár dní.');return;}
  const s=pqStore();s.gen={n:name,t:Date.now(),L:out};save();PQO.list=null;PQ.genView=false;ogProg(100,`Hotovo: ${out.length} úloh.`);setTimeout(()=>{if(page==='pq')renderPq();},600);}
 catch(e){ogProg(0,String(e&&e.message)==='stop'?'Zastaveno.':(e&&e.nf?'Hráč s tímhle jménem na chess.com není.':'Něco se nepovedlo: '+(e&&e.message||e)));}
 finally{OG.run=false;if(w)w.terminate();const b=document.getElementById('ogGo');if(b)b.disabled=false;}}
function pqOwnNext(){const s=pqStore(),L=PQO.list||[],now=Date.now();const fresh=L.filter(p=>!s.own[p.id]&&!s.ownF[p.id]);const due=L.filter(p=>s.ownF[p.id]&&s.ownF[p.id].d<=now);
 const pool=fresh.length?fresh:due;if(!pool.length){const W=L.filter(p=>s.ownF[p.id]);const el=$('pqPanel');if(el)el.innerHTML=W.length?`<p class="profEmpty"><b>Na dnešek hotovo.</b> ${W.length} ${W.length===1?'úloha s chybou se vrátí':W.length<5?'úlohy s chybou se vrátí':'úloh s chybou se vrátí'} ${srWhen(Math.min(...W.map(p=>s.ownF[p.id].d)))}. Odstup je schválně: když si tah musíš za pár dní vybavit, naučíš se ho líp.</p>`:`<p class="profEmpty"><b>Všechno vyřešené!</b> Až odehraješ další partie, udělej si nové úlohy.</p>`;return;}
 const cur=PQ.p&&PQ.p.own?pool.indexOf(PQ.p):-1;const p=pool[(cur+1)%pool.length]||pool[0];pqLoad(p);}
/* ---- mapa úrovní ---- */
function pqLevelsPage(){const s=pqStore();let next=PQ_LVL_N;for(let n=Math.max(1,(Object.keys(s.lv).length?1:(s.skip||1)));n<=PQ_LVL_N;n++){if(!s.lv[n]&&pqUnlocked(n)){next=n;break;}}
 const tiers=PQ_TIERS.map((t,ti)=>{let cells='';let got=0,tot=0;for(let n=1;n<=PQ_LVL_N;n++){const I=pqLvlInfo(n);if(I.ti!==ti)continue;tot++;const st=s.lv[n]||0;if(st)got++;const un=pqUnlocked(n);
   cells+=`<button class="pqLv${st?' ok':''}${n===next?' nx':''}" data-lv="${n}" ${un?'':'disabled aria-disabled="true"'} title="Úroveň ${n} · úlohy ${I.band}–${I.band+99}"><b>${n}</b>${un?pqStarsHTML(st):'<span class="pqLock" aria-label="zamčeno"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>'}</button>`;}
  return `<section class="profCard pqTier"><div class="pqTierH"><div><h2>${t[0]}</h2><p>${t[3]} · úlohy ${t[1]}–${t[2]===2800?'2800+':t[2]+99}</p></div>${pqUnlocked(PQ_BANDS.indexOf(t[1])*4+1)?`<span class="pqTierN">${got}/${tot}</span>`:`<a class="btn pqSkipBtn" href="#puzzle/zkouska/${ti}">Přeskočit sem</a>`}</div><div class="pqLvGrid">${cells}</div></section>`;}).join('');
 $('home').innerHTML=pqHead('urovne','Tisíce úloh z partií na Lichess, od matu jedním tahem po mistrovské kombinace. Každá úroveň má 10 úloh. Vyřeš aspoň 7 napoprvé a otevře se další. Umíš víc? U každé obtížnosti je zkouška – zvládneš ji bez chyby a obtížnost se ti otevře.')+
 `<div class="profCard pqCont"><div><b>Pokračovat: úroveň ${next}</b><small>${PQ_TIERS[pqLvlInfo(next).ti][0]} · úlohy kolem ${pqLvlInfo(next).band}</small></div><button class="btn primary" id="pqGo">Hrát úroveň ${next}</button></div>`+

 tiers+`<p class="pqCredit">Úlohy pochází z otevřené databáze <a href="https://database.lichess.org/#puzzles" target="_blank" rel="noopener">Lichess</a> (CC0).</p>`;
 renderSide();$('pqGo').onclick=()=>go('#puzzle/uroven/'+next);
 $('home').querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{if(!b.disabled)go('#puzzle/uroven/'+b.dataset.lv);});
}
async function pqLevelPlay(n){const s=pqStore();if(!pqUnlocked(n)){go('#puzzle/urovne');return;}const I=pqLvlInfo(n);const tok=PQ.tok;
 $('home').innerHTML=pqTabs('urovne')+pqBoardHTML();renderSide();$('pqPanel').innerHTML='<p class="profEmpty">Načítám úlohy…</p>';
 let L;try{L=await pqLoadBand(I.band);}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst. Zkontroluj připojení.</p>';return;}if(tok!==PQ.tok)return;
 const lo=Math.floor(L.length*I.q/4),hi=Math.floor(L.length*(I.q+1)/4);const pool=L.slice(lo,hi);s.lvTry=s.lvTry||{};const att=(s.lvTry[n]||0);s.lvTry[n]=att+1;save();
 const rnd=pqRand(n*7919+att*104729+1);const picked=[];const used=new Set();while(picked.length<PQ_PER&&used.size<pool.length){const i=Math.floor(rnd()*pool.length);if(used.has(i))continue;used.add(i);picked.push(pool[i]);}
 picked.sort((a,b)=>a.r-b.r);PQ.lvl={n,list:picked,i:0,res:[]};PQ.ctx='lvl';xInput();pqLoad(picked[0]);}
/* ---- hodnocené úlohy ---- */
async function pqRatedPage(){const s=pqStore();const tok=PQ.tok;$('home').innerHTML=pqTabs('hodnocene')+pqBoardHTML();renderSide();PQ.ctx='rated';xInput();pqRatedNext(tok);}
async function pqRatedNext(tok){const s=pqStore();tok=tok||PQ.tok;$('pqPanel').innerHTML='<p class="profEmpty">Hledám úlohu pro tvoje hodnocení…</p>';
 const tgt=s.r+Math.round((Math.random()-.4)*120);let L;try{L=await pqLoadBand(pqBandOf(tgt));}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';return;}if(tok!==PQ.tok)return;
 const seen=new Set(s.seen);let c=L.filter(p=>Math.abs(p.r-tgt)<=60&&!seen.has(p.id));if(!c.length)c=L.filter(p=>!seen.has(p.id));if(!c.length)c=L;
 pqLoad(c[Math.floor(Math.random()*c.length)]);}
function pqElo(pr,ok){const s=pqStore();const K=s.rn<15?40:s.rn<50?28:18;const e=1/(1+Math.pow(10,(pr-s.r)/400));const d=Math.round(K*((ok?1:0)-e))||(ok?1:-1);s.r=Math.max(100,s.r+d);s.rn++;s.rh.push(s.r);if(s.rh.length>200)s.rh.shift();return d;}
function pqSpark(h){if(h.length<2)return '';const v=h.slice(-60),mn=Math.min(...v),mx=Math.max(...v),W=300,Hh=60;const pts=v.map((x,i)=>`${(i/(v.length-1)*W).toFixed(1)},${(Hh-4-(x-mn)/((mx-mn)||1)*(Hh-8)).toFixed(1)}`).join(' ');return `<svg class="pqSpark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-label="Vývoj hodnocení"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg><div class="pqSparkL"><span>${mn}</span><span>${mx}</span></div>`;}
/* ---- podle motivu ---- */
async function pqThemePage(th){const s=pqStore();if(!th){
  $('home').innerHTML=pqHead('motivy','Vyber si motiv, který chceš procvičit, a obtížnost. Úlohy se střídají a neopakují se.')+
  `<div class="profCard"><h2>Obtížnost</h2><div class="pzChips" id="pqDiff">${PQ_DIFF.map((d,i)=>`<button data-df="${i}" aria-pressed="${i===PQ.diff}">${d[0]} <small>${d[1]}–${d[2]}</small></button>`).join('')}</div></div>`+
  PQ_GROUPS.map(([g,ts])=>`<section class="profCard"><h2>${g}</h2><div class="pqThGrid">${ts.map(t=>{const st=s.th[t]||[0,0];return `<button class="pqTh" data-th="${t}"><b>${pqThName(t)}</b><small>${st[1]?`${st[0]}/${st[1]} správně`:'zatím nehráno'}</small></button>`;}).join('')}</div></section>`).join('');
  renderSide();$('home').querySelectorAll('[data-df]').forEach(b=>b.onclick=()=>{PQ.diff=+b.dataset.df;$('home').querySelectorAll('[data-df]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $('home').querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>go('#puzzle/motivy/'+b.dataset.th));return;}
 const tok=PQ.tok;PQ.theme=th;$('home').innerHTML=pqTabs('motivy')+pqBoardHTML();renderSide();PQ.ctx='theme';xInput();pqThemeNext(tok);}
async function pqThemeNext(tok){tok=tok||PQ.tok;const th=PQ.theme,d=PQ_DIFF[PQ.diff];$('pqPanel').innerHTML=`<p class="profEmpty">Načítám úlohy: ${pqThName(th)}…</p>`;
 const bands=PQ_BANDS.filter(b=>b>=d[1]&&b<=d[2]);let all=[];try{for(const b of bands){all=all.concat((await pqLoadBand(b)).filter(p=>p.th.includes(th)));}}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';return;}if(tok!==PQ.tok)return;
 if(!all.length){$('pqPanel').innerHTML=`<p class="profEmpty">V téhle obtížnosti nejsou úlohy s motivem ${pqThName(th)}. Zkus jinou obtížnost.</p><a class="btn" href="#puzzle/motivy">Zpět na motivy</a>`;return;}
 const seen=new Set(pqStore().seen);const c=all.filter(p=>!seen.has(p.id));const L=c.length?c:all;pqLoad(L[Math.floor(Math.random()*L.length)]);}
/* ---- Puzzle Rush ---- */
const PQ_RUSH=[['3m','3 minuty',180],['5m','5 minut',300],['surv','Přežití',0]];
function pqRushPage(){const s=pqStore();pqStopRush();PQ.rush=null;
 $('home').innerHTML=pqHead('rush','Co nejvíc úloh za sebou. Začínáš lehce a každá vyřešená úloha je o kousek těžší. Tři chyby a konec.')+
 `<div class="pqRushPick">${PQ_RUSH.map(([k,t,sec])=>`<button class="profCard pqRushBtn" data-rush="${k}"><b>${t}</b><small>${sec?'Na čas · 3 chyby':'Bez času · 3 chyby'}</small><span>Rekord <b>${s.rush[k]||0}</b></span></button>`).join('')}</div>`;
 renderSide();$('home').querySelectorAll('[data-rush]').forEach(b=>b.onclick=()=>pqRushStart(b.dataset.rush));}
function pqRushStart(k){const def=PQ_RUSH.find(x=>x[0]===k);PQ.tok++;$('home').innerHTML=pqTabs('rush')+pqBoardHTML();renderSide();PQ.ctx='rush';xInput();
 PQ.rush={k,sec:def[2],left:def[2],n:0,miss:0,end:false,tm:null,hist:[],t0:Date.now()};
 if(def[2])PQ.rush.tm=setInterval(()=>{const R=PQ.rush;if(!R||page!=='pq'||XB.mode!=='pq'){pqStopRush();return;}R.left=Math.max(0,R.sec-Math.floor((Date.now()-R.t0)/1000));const el=document.getElementById('pqClock');if(el){el.textContent=pqFmtT(R.left);el.classList.toggle('low',R.left<=15);}if(R.left<=0)pqRushEnd();},250);
 pqRushNext();}
const pqFmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
async function pqRushNext(){const R=PQ.rush;if(!R||R.end)return;const tok=PQ.tok;const tgt=Math.min(2800,450+R.n*55+Math.round(Math.random()*40));let L;try{L=await pqLoadBand(pqBandOf(tgt));}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';return;}if(tok!==PQ.tok||R.end)return;
 const c=L.filter(p=>Math.abs(p.r-tgt)<=50&&p.lines[0].length<=8);const pick=(c.length?c:L)[Math.floor(Math.random()*(c.length||L.length))];pqLoad(pick);}
function pqRushEnd(){const R=PQ.rush;if(!R||R.end)return;R.end=true;pqStopRush();PQ.lock=true;const s=pqStore();const best=s.rush[R.k]||0;const rec=R.n>best;if(rec)s.rush[R.k]=R.n;if(R.n)addXp(Math.min(60,R.n*2));save();if(rec&&R.n)pqConfetti();
 $('pqPanel').innerHTML=`<div class="pqRushEnd"><small>${PQ_RUSH.find(x=>x[0]===R.k)[1]}</small><b>${R.n}</b><p>${rec&&R.n?'Nový rekord!':`Rekord: ${Math.max(best,R.n)}`}</p></div><div class="pqRushLog">${R.hist.map(h=>`<span class="${h[0]?'ok':'bad'}" title="${h[1]}">${h[0]?'✓':'✕'}</span>`).join('')}</div><div class="freeBtns"><button class="btn primary" id="pqRushAg">Hrát znovu</button><a class="btn" href="#puzzle/rush">Jiný režim</a></div>`;
 $('pqRushAg').onclick=()=>pqRushStart(R.k);pqFab();}
/* ---- pasti v zahájení ---- */
function pqTrapPage(id){const s=pqStore();const t=id&&PQ_TRAPS.find(x=>x.id===id);
 if(!t){$('home').innerHTML=pqHead('pasti','Slavné pasti, do kterých soupeři padají v zahájení. Soupeř udělá chybu – najdi, jak ho potrestat. Nauč se je, ať je poznáš i ve vlastních partiích.')+
  `<div class="pqTrapGrid">${PQ_TRAPS.map((t,i)=>`<a class="profCard pqTrap${s.tr[t.id]?' ok':''}" href="#puzzle/pasti/${t.id}"><span class="pqTrapN">${i+1}</span><span><b>${t.n}</b><small>${t.o}</small></span>${s.tr[t.id]?'<span class="pqTick">✓</span>':''}</a>`).join('')}</div><p class="pqCredit">Další pasti přímo z tvých kurzů najdeš v záložce <a href="#pasti">Pasti z kurzů</a>.</p>`;renderSide();return;}
 $('home').innerHTML=pqTabs('pasti')+pqBoardHTML();renderSide();PQ.ctx='trap';xInput();
 pqLoad({id:'trap-'+t.id,fen:t.fen,lines:t.lines.map(l=>l.split(' ')),r:0,th:[],trap:t});}
/* ---- společné řešení úlohy ---- */
function pqLoad(p){pqFabHide();pqPopClose();PQ.tok++;const tok=PQ.tok;document.querySelectorAll('.pzPop').forEach(x=>x.remove());XM.marks=[];xRenderMarks&&xRenderMarks();if(XB.sq&&XB.sq.length)pzClearMarks();
 PQ.p=p;PQ.counted=null;PQ.g=new CHESS(p.fen);PQ.flip=PQ.g.turn()==='w';PQ.lines=p.lines.slice();PQ.step=0;PQ.fail=false;PQ.hint=0;PQ.done=false;PQ.lock=true;XB.sel=null;xArrow(null);xBuild();xSet();pqPanel();
 setTimeout(()=>{if(tok!==PQ.tok)return;pqAuto(PQ.lines[0][0]);PQ.step=1;PQ.lock=false;pqMsg('');pqEvPre();},p.trap?900:600);}
function pqAuto(u){pqBadge(null);let mv;try{mv=PQ.g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});}catch(e){}if(mv){xAnimate(mv);xMarks();sfx(PQ.g.inCheck()?'check':mv.captured?'capture':'move');}return mv;}
const pqMe=()=>PQ.flip?'černé':'bílé';
function pqMsg(h,cls){const m=document.getElementById('pqMsg');if(m){m.className='accMsg'+(cls?' '+cls:'');m.innerHTML=h;}const t=document.getElementById('pqTopMsg');if(t){t.className='pqTopMsg'+(cls?' '+cls:'');t.innerHTML=h;}}
function pqPanel(){const p=PQ.p,s=pqStore(),el=$('pqPanel');if(!el)return;const who=`<div class="pqWho"><i class="${PQ.flip?'b':'w'}"></i>Hraješ za ${pqMe()}</div>`;let top='';
 if(PQ.ctx==='lvl'){const L=PQ.lvl,I=pqLvlInfo(L.n);top=`<div class="pqPT"><div><small>${PQ_TIERS[I.ti][0]}</small><h2>Úroveň ${L.n}</h2></div><span class="pqPN">${L.i+1}/${L.list.length}</span></div><div class="pqDots">${L.list.map((x,i)=>`<i class="${L.res[i]===true?'ok':L.res[i]===false?'bad':i===L.i?'cur':''}"></i>`).join('')}</div>`;}
 else if(PQ.ctx==='rated')top=`<div class="pqPT"><div><small>Hodnocené úlohy</small><h2>${s.r}</h2></div><span class="pqPN" id="pqDelta"></span></div>${pqSpark(s.rh)}`;
 else if(PQ.ctx==='theme')top=`<div class="pqPT"><div><small>${PQ_DIFF[PQ.diff][0]} · <a href="#puzzle/motivy">změnit</a></small><h2>${pqThName(PQ.theme)}</h2></div></div>`;
 else if(PQ.ctx==='rush'){const R=PQ.rush;top=`<div class="pqPT"><div><small>Puzzle Rush · ${PQ_RUSH.find(x=>x[0]===R.k)[1]}</small><h2 class="pqScore">${R.n}</h2></div>${R.sec?`<span class="pqClock" id="pqClock">${pqFmtT(R.left)}</span>`:''}</div><div class="pqStrikes">${[0,1,2].map(i=>`<i class="${i<R.miss?'on':''}">✕</i>`).join('')}</div>`;}
 else if(PQ.ctx==='test'){const T=PQ.test;top=`<div class="pqPT"><div><small>Zkouška · bez jediné chyby</small><h2>${PQ_TIERS[T.ti][0]}</h2></div><span class="pqPN">${T.i+1}/${T.list.length}</span></div><div class="pqDots">${T.list.map((x,i)=>`<i class="${T.res[i]===true?'ok':T.res[i]===false?'bad':i===T.i?'cur':''}"></i>`).join('')}</div>`;}
 else if(PQ.ctx==='daily')top=`<div class="pqPT"><div><small>Denní puzzle</small><h2>${new Date().toLocaleDateString('cs-CZ',{day:'numeric',month:'long'})}</h2></div></div>`;
 else if(PQ.ctx==='own'){const L=PQO.list||[],s=pqStore(),done=L.filter(x=>s.own[x.id]).length;top=`<div class="pqPT"><div><small>Z tvých partií</small><h2 id="pqOwnN">${done} z ${L.length}</h2></div></div><p class="profEmpty pqPre" id="pqOwnTx">${PQ.done?pqOwnAfter(p):`Pozice z tvé partie proti ${escH(p.own.opp)}. Tehdy jsi tu udělal hrubou chybu – najdi lepší tah${p.lines[0].length>2?` a dotáhni to (${(p.lines[0].length/2)|0} tahy)`:''}.`}</p>`;}
 else if(PQ.ctx==='miss'){const M=pqStore().miss,now=Date.now();top=`<div class="pqPT"><div><small>Opakovat chyby</small><h2>Dnes ${M.filter(m=>(m.d||0)<=now).length}</h2></div><span class="pqPN">celkem ${M.length}</span></div>`;}
 else if(PQ.ctx==='trap'){const t=p.trap;top=`<div class="pqPT"><div><small>${t.o}</small><h2>${t.n}</h2></div></div><p class="profEmpty pqPre">${pqPreSan(t)}</p>`;}
 const rush=PQ.ctx==='rush';
 const G=pqGoal(p);const gt=document.getElementById('pqGoalTop');if(gt){gt.hidden=false;gt.className='pqGoalTop '+G.c;gt.innerHTML=`<i class="${PQ.flip?'b':'w'}"></i><span>${PQ.flip?'Černý':'Bílý'} na tahu</span>${G.show?`<b>${G.t}</b>`:`<button class="pqGoalBtn" data-goal>Ukázat cíl</button>`}`+(rush||PQ.ctx==='test'?`<div class="pqTopRow"><span class="pqTopMsg" id="pqTopMsg"></span></div>`:`<div class="pqTopRow"><span class="pqTopMsg" id="pqTopMsg"></span><button type="button" class="pqTopHint" id="pqTopHint">Nápověda</button></div><div class="pqTopV" id="pqTopV" hidden></div>`);const th=document.getElementById('pqTopHint');if(th)th.onclick=pqHintF;}el.innerHTML=top+who+(G.show?`<div class="pqGoal ${G.c}"><b>${G.t}</b><span>${G.s}</span></div>`:`<div class="pqGoal hid"><button class="btn" data-goal>Ukázat cíl</button><span>Mat, nebo výhra? Zkus to poznat sám. Ukázání cíle se počítá jako nápověda.</span></div>`)+`<p class="pqTask">${PQ.ctx==='trap'?'Soupeř právě udělal chybu. Jak ho potrestáš?':'Najdi nejlepší tah'+(PQ.lines[0].length>2?' a pokračuj, dokud úloha neskončí':'')+'.'}</p><p class="accMsg" id="pqMsg"></p><div class="tuVerd pqVerd" id="pqVerd" hidden></div>`+
 (rush?`<div class="freeBtns"><button class="btn" id="pqEnd">Ukončit</button></div>`:PQ.ctx==='test'?`<div class="freeBtns"><a class="btn" href="#puzzle/urovne">Ukončit zkoušku</a></div>`:`<div class="freeBtns"><button class="btn" id="pqHint">Nápověda</button><button class="btn" id="pqSol">Ukázat řešení</button><button class="btn primary" id="pqNext">${PQ.ctx==='lvl'?'Přeskočit':'Další úloha'}</button></div>`)+
 (p.r&&!rush?`<p class="pqMeta" id="pqMeta"><span>Úloha ${p.r}</span></p>`:'');
 if(rush){$('pqEnd').onclick=pqRushEnd;return;}if(PQ.ctx==='test')return;
 $('pqHint').onclick=pqHintF;$('pqSol').onclick=()=>pqSolve(true);$('pqNext').onclick=()=>{if(!PQ.done)pqResult(false,true);pqAdvance();};}

/* cíl úlohy: mat, nebo výhra materiálu / výhody (z motivů Lichess, u pastí z konce řešení) */
function pqGoalShow(p){if(PQ.goalShown===p)return true;const c=PQ.ctx;if(c==='trap'||c==='rush')return true;if(c==='rated'||c==='daily')return false;return (p.r||0)<1200;}
function pqGoalReveal(){const p=PQ.p;if(!p||PQ.goalShown===p)return;PQ.goalShown=p;if(!PQ.done){const first=!PQ.fail;PQ.fail=true;if(first&&PQ.ctx==='rated')pqResult(false);}const G=pqGoal(p);const box=document.querySelector('#pqPanel .pqGoal');if(box){box.className='pqGoal '+G.c;box.innerHTML=`<b>${G.t}</b><span>${G.s}</span>`;}const gb=document.querySelector('#pqGoalTop [data-goal]');if(gb)gb.outerHTML=`<b>${G.t}</b>`;}
function pqGoal(p){const R=pqGoalRaw(p);R.show=pqGoalShow(p);return R;}
function pqGoalRaw(p){const th=p.th||[];const me=(p.lines[0].length)/2;let mn=0;for(let i=1;i<=5;i++)if(th.includes('mateIn'+i))mn=i;
 if(!mn&&(p.trap||th.includes('mate'))){try{const g=new CHESS(p.fen);for(const u of p.lines[0])g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});if(g.isCheckmate())mn=Math.round(me);}catch(e){}}
 if(mn)return {c:'mate',t:mn===1?'Mat jedním tahem':mn>=5?'Mat v 5 a více tazích':`Mat na ${mn} tahy`,s:mn===1?'Najdi tah, který dá mat.':'Najdi tahy, které vedou k matu.'};
 if(th.includes('mate'))return {c:'mate',t:'Mat',s:'Řešení končí matem.'};
 if(th.includes('equality'))return {c:'save',t:'Zachraň se',s:'Najdi tah, který udrží vyrovnanou pozici.'};
 if(th.includes('advantage'))return {c:'win',t:'Získej výhodu',s:`Vyhraj materiál nebo lepší pozici${me>1?` – ${Math.round(me)} ${me<5?'tahy':'tahů'}`:''}.`};
 return {c:'win',t:'Vyhraj materiál',s:`Získej rozhodující výhodu${me>1?` – ${Math.round(me)} ${me<5?'tahy':'tahů'}`:''}.`};}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-goal]'))pqGoalReveal();});

/* plovoucí tlačítko Další na mobilu (ať se nemusí posouvat k panelu pod šachovnicí) */
const PQ_FAB_T=['#pqLvN','#pqNext','#vyNext','#pqTestR','#pqRushAg','#pqLvR'];
function pqFab(cls){let f=document.getElementById('pqFab');const t=PQ_FAB_T.map(q=>document.querySelector('#pqPanel '+q)).find(Boolean);if(!t){pqFabHide();return;}
 if(!f){f=document.createElement('button');f.id='pqFab';f.type='button';document.body.appendChild(f);f.onclick=()=>{const t2=PQ_FAB_T.map(q=>document.querySelector('#pqPanel '+q)).find(Boolean);pqFabHide();if(t2)t2.click();};}
 f.className=cls||'';f.innerHTML=`<span>${cls==='ok'?'✓':cls==='bad'?'✕':''}</span>${escH(t.textContent.trim())}`;f.hidden=false;requestAnimationFrame(()=>f.classList.add('in'));}
function pqFabHide(){const f=document.getElementById('pqFab');if(f){f.hidden=true;f.classList.remove('in');}}
window.addEventListener('hashchange',pqFabHide);
function pqPreSan(t){const g=new CHESS();const out=[];t.pre.split(' ').filter(Boolean).forEach((m,i)=>{const mv=g.move(m);out.push((i%2?'':(i/2+1)+'.')+mv.san);});const b=new CHESS(t.fen);const mv=b.move({from:t.lines[0].slice(0,2),to:t.lines[0].slice(2,4)});const n=out.length;out.push((n%2?'':(n/2+1)+'.')+mv.san+'?');return out.join(' ');}
function pqHintF(){if(PQ.done||PQ.lock)return;const u=PQ.lines[0][PQ.step];if(!u)return;PQ.fail=true;PQ.hint++;
 if(PQ.hint===1){XB.sq[sqOf(u.slice(0,2))].classList.add('hintsq');pqMsg('Táhni zvýrazněnou figurou.');}else{xArrow(u);pqMsg('Tenhle tah.');}}
/* výběr figury při proměně pěšce – na všech šachovnicích (lekce, boti, koncovky, kurzy, puzzle, výzvy) */
let XPROMO=null;
function askPromo(g,f,t,el,run,cancel){if(XPROMO||!g||!el)return false;let lg=[];try{const pc=g.get(f);if(!pc||pc.type!=='p'||pc.color!==g.turn())return false;lg=g.moves({square:f,verbose:true}).filter(m=>m.to===t&&m.promotion);}catch(e){return false;}if(!lg.length)return false;
 pqPromo(f,t,g.turn(),el).then(pr=>{if(!pr){if(cancel)cancel();return;}XPROMO=pr;try{run();}finally{XPROMO=null;}});return true;}
function pqPromo(from,to,c0,el){return new Promise(res=>{const B=el||$('xBoard');const old=B.querySelector('.pqPromo');if(old)old.remove();const col=c0||PQ.g.turn();const d=document.createElement('div');d.className='pqPromo';d.innerHTML=['q','r','b','n'].map(p=>`<button data-p="${p}" aria-label="${{q:'dáma',r:'věž',b:'střelec',n:'jezdec'}[p]}">${PC(col+p.toUpperCase())}</button>`).join('')+'<button data-p="" class="x" aria-label="Zrušit">✕</button>';
 B.appendChild(d);d.onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;d.remove();res(b.dataset.p||null);};});}
function pqTry(from,to){if(PQ.lock||PQ.done||!PQ.p)return false;const f=sqName(from),t=sqName(to);const pc=PQ.g.get(f);if(!pc||pc.color!==PQ.g.turn())return false;
 const legal=PQ.g.moves({square:f,verbose:true}).filter(m=>m.to===t);if(!legal.length)return false;
 if(legal[0].promotion){PQ.lock=true;pqPromo(f,t).then(pr=>{PQ.lock=false;if(!pr){xSet();return;}pqDo(f,t,pr);});return true;}
 pqDo(f,t,'');return true;}
function pqDo(f,t,pr){const u=f+t+pr;const fen0=PQ.g.fen();pqBadge(null);const mv=PQ.g.move({from:f,to:t,promotion:pr||undefined});if(!mv)return;XB.sel=null;xAnimate(mv);xMarks();
 const st=PQ.step;const ok=PQ.lines.filter(l=>l[st]===u);const mate=PQ.g.isCheckmate();
 pqEvJudge(fen0,u,PQ.g,!!(ok.length||mate));
 if(ok.length||mate){if(ok.length)PQ.lines=ok;sfx(PQ.g.inCheck()?'check':mv.captured?'capture':'move');pzMark(to2(t),'ok');
  if(mate||st+1>=PQ.lines[0].length){pqSolved();return;}
  PQ.lock=true;const tok=PQ.tok;PQ.step=st+1;setTimeout(()=>{if(tok!==PQ.tok)return;pzClearMarks();xArrow(null);pqAuto(PQ.lines[0][PQ.step]);PQ.step++;PQ.lock=false;pqMsg('<b>Dobře.</b> Pokračuj.','ok');pqEvPre();},450);return;}
 sfx('wrong');pzMark(to2(t),'bad');PQ.lock=true;const first=!PQ.fail;PQ.fail=true;const tok=PQ.tok;
 if(PQ.ctx==='rush'){pqResult(false);setTimeout(()=>{if(tok!==PQ.tok)return;PQ.g.undo();pzClearMarks();xSet();PQ.done=true;pqShowLine(()=>{if(PQ.rush&&!PQ.rush.end){if(PQ.rush.miss>=3)pqRushEnd();else pqRushNext();}},true);},500);return;}
 if(first&&(PQ.ctx==='rated'||PQ.ctx==='theme'||PQ.ctx==='test'||PQ.ctx==='daily'))pqResult(false);
 if(PQ.ctx==='test'){setTimeout(()=>{if(tok!==PQ.tok)return;PQ.g.undo();pzClearMarks();xSet();PQ.done=true;pqShowLine(()=>pqTestEnd(false),true);},600);return;}
 pqMsg(PQ.ctx==='rated'&&first?'✕ Tohle není ono. Hodnocení už se odečetlo, ale úlohu můžeš dořešit.':'✕ Tohle ne – zkus to znovu.','bad');
 setTimeout(()=>{if(tok!==PQ.tok)return;PQ.g.undo();pzClearMarks();xSet();PQ.lock=false;},700);}
const to2=s=>sqOf(s);
function pqResult(ok,skip){const p=PQ.p,s=pqStore();if(PQ.counted===p)return;PQ.counted=p;s.all++;if(ok)s.ok++;
 if(p.own){const F=s.ownF[p.id];if(ok&&!skip){if(F){F.n=(F.n||0)+1;if(F.n>=SR_DAYS.length){delete s.ownF[p.id];s.own[p.id]=1;}else F.d=srDue(F.n);}else s.own[p.id]=1;}else{s.ownF[p.id]={n:0,d:srDue(0)};}const L=PQO.list||[],n=document.getElementById('pqOwnN'),tx=document.getElementById('pqOwnTx');if(n)n.textContent=`${L.filter(x=>s.own[x.id]).length} z ${L.length}`;if(tx)tx.innerHTML=pqOwnAfter(p);}
 if(p.id&&!p.trap&&!p.own){s.seen.push(p.id);if(s.seen.length>600)s.seen.splice(0,s.seen.length-600);}
 p.th.forEach(t=>{if(!PQ_TH[t])return;const x=s.th[t]=s.th[t]||[0,0];x[1]++;if(ok)x[0]++;});
 if(PQ.ctx==='rated'&&p.r){const d=pqElo(p.r,ok);const el=document.getElementById('pqDelta');if(el){el.textContent=(d>0?'+':'')+d;el.className='pqPN '+(d>0?'up':'down');}}
 if(PQ.ctx==='lvl'){PQ.lvl.res[PQ.lvl.i]=ok;}
 if(PQ.ctx==='rush'){const R=PQ.rush;R.hist.push([ok,p.r]);if(ok)R.n++;else R.miss++;}
 if(PQ.ctx==='trap'&&ok)s.tr[p.trap.id]=1;
 if(p.id&&!p.trap&&!p.own&&!skip){const i=s.miss.findIndex(m=>m.id===p.id);if(!ok&&i<0){s.miss.push({id:p.id,b:pqBandOf(p.r),n:0,d:srDue(0)});if(s.miss.length>300)s.miss.shift();}
  else if(i>=0&&PQ.ctx==='miss'){const m=s.miss[i];if(ok){m.n=(m.n||0)+1;if(m.n>=SR_DAYS.length)s.miss.splice(i,1);else m.d=srDue(m.n);}else{m.n=0;m.d=srDue(0);}}}
  else if(p.id&&!p.trap&&!p.own&&skip&&PQ.ctx==='miss'){const m=s.miss.find(m=>m.id===p.id);if(m){m.n=0;m.d=srDue(0);}}
 if(PQ.ctx==='test')PQ.test.res.push(ok);
 if(PQ.ctx==='daily'){const d=pqToday();if(!s.daily[d])s.daily[d]=ok?2:1;const sd=document.getElementById('pqSide');if(sd){const st=pqStreak();const pp=sd.querySelector('p');if(pp)pp.innerHTML=ok?`Vyřešeno napoprvé! Série: <b>${st}</b> ${st===1?'den':st<5?'dny':'dní'}. Zítra přijde další úloha.`:'Tentokrát s chybou. Zítra to vyjde – přijde nová úloha.';}}
 if(ok&&!skip)addXp(PQ.ctx==='rush'?0:p.r>=1800?4:3);save();}
function pqSolved(){PQ.done=true;PQ.lock=true;const clean=!PQ.fail;pqResult(clean);
 if(PQ.ctx==='test'){sfx('win');pqPanel();pqMsg('<b>Správně!</b>','ok');const tok=PQ.tok;setTimeout(()=>{if(tok===PQ.tok)pqTestNext();},700);return;}
 if(PQ.ctx==='rush'){sfx('win');const tok=PQ.tok;pqPanel();pqMsg('<b>Správně!</b>','ok');setTimeout(()=>{if(tok===PQ.tok&&PQ.rush&&!PQ.rush.end)pqRushNext();},550);return;}
 sfx('win');if(clean)pqCelebrate2();pqAfter(clean?'<b>Správně!</b>':'<b>Vyřešeno</b> – ale ne napoprvé.');}
function pqCelebrate2(){if(store.sound)try{[523,659,784].forEach((f,i)=>tone(i*.08,f,.3,.09));}catch(e){}if(PQ.ctx==='trap'||Math.random()<.35)confettiAt($('xBoard'));}
function pqConfetti(){confettiAt($('xBoard'));}
function pqAfter(head){const p=PQ.p;const th=pqShowTh(p);let extra='';
 if(p.trap)extra=`<div class="engBox">${p.trap.d}</div>`;
 else extra=(th.length?`<div class="pqThs">${th.map(t=>`<span>${t}</span>`).join('')}</div>`:'')+(p.id&&!p.own?`<small class="pqLi"><a href="https://lichess.org/training/${p.id}" target="_blank" rel="noopener">Úloha na Lichess</a></small>`:'');
 pqMsg(head,'ok');const m=document.getElementById('pqMsg');if(m)m.insertAdjacentHTML('afterend',`<div class="pqAfter">${extra}</div>`);
 const nb=$('pqNext');if(nb){nb.textContent=PQ.ctx==='daily'?'Hrát další úlohy':PQ.ctx==='lvl'?(PQ.lvl.i+1<PQ.lvl.list.length?'Další úloha':'Výsledek úrovně'):PQ.ctx==='trap'?'Další past':'Další úloha';nb.onclick=pqAdvance;nb.focus({preventScroll:true});}
 const h=$('pqHint');if(h)h.disabled=true;const so=$('pqSol');if(so){so.textContent='Přehrát znovu';so.onclick=()=>pqReplay();}
 if(PQ.ctx==='lvl')pqPanelDots();const tH=document.getElementById('pqTopHint');if(tH)tH.disabled=true;pqPop(head,/Správně/.test(head)?'ok':'');}
function pqPanelDots(){const L=PQ.lvl;const d=document.querySelector('.pqDots');if(d)d.innerHTML=L.list.map((x,i)=>`<i class="${L.res[i]===true?'ok':L.res[i]===false?'bad':i===L.i?'cur':''}"></i>`).join('');}
function pqSolve(){if(PQ.done||PQ.lock)return;PQ.fail=true;pqResult(false);PQ.done=true;pqShowLine(()=>{pqAfter('Řešení: <b>'+pqLineSan()+'</b>');});}
function pqLineSan(){const p=PQ.p;const g=new CHESS(p.fen);g.move({from:PQ.lines[0][0].slice(0,2),to:PQ.lines[0][0].slice(2,4),promotion:PQ.lines[0][0][4]});const out=[];for(const u of PQ.lines[0].slice(1)){const m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});if(!m)break;out.push(m.san);}return out.join(' ');}
async function pqShowLine(cb,fast){PQ.lock=true;const tok=PQ.tok;const wait=ms=>new Promise(r=>setTimeout(r,ms));pzClearMarks();
 while(PQ.step<PQ.lines[0].length){if(tok!==PQ.tok)return;const u=PQ.lines[0][PQ.step];xArrow(u);await wait(fast?250:550);if(tok!==PQ.tok)return;xArrow(null);if(!pqAuto(u))break;PQ.step++;await wait(fast?250:550);}
 if(tok===PQ.tok&&cb)cb();}
async function pqReplay(){if(PQ.playing)return;PQ.playing=true;const tok=PQ.tok;const p=PQ.p;const wait=ms=>new Promise(r=>setTimeout(r,ms));try{PQ.g=new CHESS(p.fen);pqAuto(PQ.lines[0][0]);xSet();await wait(500);
 for(const u of PQ.lines[0].slice(1)){if(tok!==PQ.tok)return;xArrow(u);await wait(450);xArrow(null);pqAuto(u);await wait(550);}}finally{PQ.playing=false;}}
function pqAdvance(){const c=PQ.ctx;
 if(c==='lvl'){const L=PQ.lvl;if(L.res[L.i]===undefined)L.res[L.i]=false;if(L.i+1<L.list.length){L.i++;pqLoad(L.list[L.i]);return;}return pqLevelEnd();}
 if(c==='test')return pqTestNext();if(c==='miss')return pqMissNext();if(c==='own')return pqOwnNext();if(c==='daily')return go('#puzzle/hodnocene');
 if(c==='rated')return pqRatedNext();if(c==='theme')return pqThemeNext();
 if(c==='trap'){const i=PQ_TRAPS.findIndex(t=>t===PQ.p.trap);const s=pqStore();const nx=PQ_TRAPS.slice(i+1).concat(PQ_TRAPS.slice(0,i)).find(t=>!s.tr[t.id])||PQ_TRAPS[(i+1)%PQ_TRAPS.length];go('#puzzle/pasti/'+nx.id);}}
function pqLevelEnd(){const L=PQ.lvl,s=pqStore();const k=L.res.filter(x=>x===true).length;const st=pqStars(k);const prev=s.lv[L.n]||0;if(st>prev)s.lv[L.n]=st;if(st&&!prev)addXp(20);save();PQ.lock=true;
 const pass=st>0;if(pass)pqConfetti();const nx=L.n+1<=PQ_LVL_N?L.n+1:null;
 $('pqPanel').innerHTML=`<div class="pqLvEnd"><small>Úroveň ${L.n}</small><h2>${pass?(st===3?'Bez chyby!':'Úroveň splněná'):'Tentokrát ne'}</h2>${pqStarsHTML(st)}<p><b>${k}/${L.list.length}</b> napoprvé. ${pass?(nx?`Otevřela se úroveň ${nx}.`:'Prošel jsi všechny úrovně!'):`Potřebuješ aspoň ${PQ_PASS}. Další pokus bude s jinými úlohami.`}</p></div><div class="pqDots">${L.res.map(r=>`<i class="${r?'ok':'bad'}"></i>`).join('')}</div>
 <div class="freeBtns">${pass&&nx?`<button class="btn primary" id="pqLvN">Úroveň ${nx}</button>`:''}<button class="btn${pass&&nx?'':' primary'}" id="pqLvR">${pass?'Zahrát znovu':'Zkusit znovu'}</button><a class="btn" href="#puzzle/urovne">Mapa úrovní</a></div>`;
 const n=$('pqLvN');if(n)n.onclick=()=>go('#puzzle/uroven/'+nx);pqFab(pass?'ok':'bad');$('pqLvR').onclick=()=>{PQ.tok++;pqLevelPlay(L.n);};}

/* ---- zkouška pro přeskočení obtížnosti ---- */
const PQ_TEST_N=6;
async function pqTestPlay(ti){const T=PQ_TIERS[ti];if(!T||ti===0){go('#puzzle/urovne');return;}const tok=PQ.tok;
 $('home').innerHTML=pqTabs('urovne')+pqBoardHTML();renderSide();$('pqPanel').innerHTML=`<p class="profEmpty">Připravuji zkoušku ${T[0]}…</p>`;
 const bands=PQ_BANDS.filter(b=>b>=T[1]&&b<=T[2]);let pool=[];try{for(const b of bands.slice(0,2))pool=pool.concat(await pqLoadBand(b));}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';return;}if(tok!==PQ.tok)return;
 const list=[];const used=new Set();while(list.length<PQ_TEST_N){const p=pool[Math.floor(Math.random()*pool.length)];if(used.has(p.id))continue;used.add(p.id);list.push(p);}list.sort((a,b)=>a.r-b.r);
 PQ.test={ti,list,i:0,res:[]};PQ.ctx='test';xInput();pqLoad(list[0]);}
function pqTestNext(){const T=PQ.test;if(T.res.length&&T.res[T.res.length-1]===false)return pqTestEnd(false);if(T.i+1<T.list.length){T.i++;pqLoad(T.list[T.i]);}else pqTestEnd(true);}
function pqTestEnd(ok){const T=PQ.test,s=pqStore();PQ.lock=true;PQ.done=true;const first=PQ_BANDS.indexOf(PQ_TIERS[T.ti][1])*4+1;
 if(ok){s.skip=Math.max(s.skip||0,first);addXp(30);save();pqConfetti();}
 $('pqPanel').innerHTML=`<div class="pqLvEnd"><small>Zkouška · ${PQ_TIERS[T.ti][0]}</small><h2>${ok?'Zkouška splněná!':'Tentokrát ne'}</h2><p>${ok?`Otevřely se ti úrovně až po úroveň ${first}.`:`Zkouška musí být bez jediné chyby. Vyřešeno ${T.res.filter(Boolean).length} z ${T.list.length}. Další pokus bude s jinými úlohami.`}</p></div><div class="pqDots">${T.list.map((x,i)=>`<i class="${T.res[i]===true?'ok':T.res[i]===false?'bad':''}"></i>`).join('')}</div>
 <div class="freeBtns">${ok?`<a class="btn primary" href="#puzzle/uroven/${first}">Hrát úroveň ${first}</a>`:`<button class="btn primary" id="pqTestR">Zkusit znovu</button>`}<a class="btn" href="#puzzle/urovne">Mapa úrovní</a></div>`;
 const r=document.getElementById('pqTestR');if(r)r.onclick=()=>{PQ.tok++;pqTestPlay(T.ti);};pqFab(ok?'ok':'bad');}
/* ---- denní puzzle ---- */
const pqToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function pqStreak(){const s=pqStore();let n=0;const d=new Date();if(!s.daily[pqToday()])d.setDate(d.getDate()-1);for(;;){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(s.daily[k]===2){n++;d.setDate(d.getDate()-1);}else break;}return n;}
async function pqDailyPage(){const s=pqStore();const tok=PQ.tok;const day=Math.floor(Date.now()/864e5);const b=[1200,1400,1500,1600,1700,1500,1300][day%7];
 $('home').innerHTML=pqTabs('denni')+pqBoardHTML();renderSide();PQ.ctx='daily';xInput();$('pqPanel').innerHTML='<p class="profEmpty">Načítám denní puzzle…</p>';
 let L;try{L=await pqLoadBand(b);}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';return;}if(tok!==PQ.tok)return;
 const r=pqRand(day*2654435761);const good=L.filter(p=>p.lines[0].length>=4);const p=good[Math.floor(r()*good.length)];pqLoad(p);
 const side=$('pqSide');side.hidden=false;const st=pqStreak();const done=s.daily[pqToday()];
 side.innerHTML=`<h2>Denní série</h2><p class="profEmpty">${st?`Řešíš <b>${st}</b> ${st===1?'den':st<5?'dny':'dní'} za sebou napoprvé.`:'Vyřeš denní puzzle napoprvé a začni sérii.'} Každý den je nová úloha, stejná pro všechny.</p>${done?`<p class="profEmpty">Dnešní: <b>${done===2?'vyřešeno napoprvé':'vyřešeno s chybou'}</b>. Zítra přijde další.</p>`:''}`;}
/* ---- opakovat chyby ---- */
function pqMissPage(){const s=pqStore();if(!s.miss.length){$('home').innerHTML=pqHead('chyby','Úlohy, které se ti nepovedly napoprvé, se sem ukládají a vracejí s odstupem: za den, za 3 dny a za týden. Po třech čistých vyřešeních zmizí.')+`<div class="profCard"><p class="profEmpty">Zatím tu nic není. Až v nějaké úloze uděláš chybu, objeví se tady.</p><a class="btn primary" href="#puzzle/hodnocene">Hrát hodnocené úlohy</a></div>`;renderSide();return;}
 $('home').innerHTML=pqTabs('chyby')+pqBoardHTML();renderSide();PQ.ctx='miss';xInput();pqMissNext();}
async function pqMissNext(){const s=pqStore();const tok=PQ.tok;if(!s.miss.length){go('#puzzle/chyby');PQ.tok++;renderPq();return;}const now=Date.now();const di=s.miss.findIndex(m=>(m.d||0)<=now);
 if(di<0){const nx=Math.min(...s.miss.map(m=>m.d||0));$('pqPanel').innerHTML=`<p class="profEmpty"><b>Na dnešek máš chyby hotové.</b> Další se ti vrátí ${srWhen(nx)}. Odstup je schválně: když si tah musíš za pár dní vybavit, naučíš se ho líp.</p><a class="btn primary" href="#puzzle/hodnocene">Hrát hodnocené úlohy</a>`;return;}
 if(di>0)s.miss.push(...s.miss.splice(0,di));const m=s.miss[0];
 let L;try{L=await pqLoadBand(m.b);}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Úlohy se nepodařilo načíst.</p>';return;}if(tok!==PQ.tok)return;
 const p=L.find(x=>x.id===m.id);if(!p){s.miss.shift();save();return pqMissNext();}pqLoad(p);}

/* ---- Vyber tah (pro úplné nováčky): ze tří tahů vyber nejlepší, pak vysvětlení a varianta ----
   Data: puzzles/vyber.json (pozice z Lichess, tahy a vysvětlení předem spočítané Stockfishem). pf = pozice před tahem soupeře, fen = po něm. */
const VY_DIFF=[['Nováček',0,599],['Začátečník',600,899],['Pokročilý začátečník',900,1300]];
const VY={data:null,load:null,diff:0,p:null,pick:null};
function vyLoad(){if(VY.data)return Promise.resolve(VY.data);if(!VY.load)VY.load=fetch('puzzles/vyber.json').then(r=>{if(!r.ok)throw new Error('http');return r.json();}).then(d=>VY.data=d).catch(e=>{VY.load=null;throw e;});return VY.load;}
const vySt=()=>{const s=pqStore();s.vy=s.vy||{ok:0,all:0,st:0,best:0,seen:[]};return s.vy;};
const VY_COL=['#2f8fe8','#e39a2d','#a35ad8'],VY_L=['A','B','C'];
function vyLineSan(fen,uci){const g=new CHESS(fen);let n=+fen.split(' ')[5],w=g.turn()==='w';const out=[];uci.forEach((u,i)=>{let m;try{m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});}catch(e){}if(!m)return;out.push((w?n+'.':i===0?n+'...':'')+czSan(m.san));if(!w)n++;w=!w;});return out.join(' ');}
async function vyPage(){const tok=PQ.tok;
 $('home').innerHTML=pqTabs('vyber')+pqBoardHTML();renderSide();PQ.ctx='vyber';xInput();
 $('pqPanel').innerHTML='<p class="profEmpty">Načítám pozice…</p>';try{await vyLoad();}catch(e){$('pqPanel').innerHTML='<p class="profEmpty">Pozice se nepodařilo načíst. Zkontroluj připojení.</p>';return;}if(tok!==PQ.tok)return;vyNext();}
function vyNext(){pqFabHide();const v=vySt(),d=VY_DIFF[VY.diff];const all=VY.data.filter(x=>x.r>=d[1]&&x.r<=d[2]);const seen=new Set(v.seen);let c=all.filter(x=>!seen.has(x.id));if(!c.length){v.seen=v.seen.filter(id=>!all.some(x=>x.id===id));c=all;}
 const p=c[Math.floor(Math.random()*c.length)];VY.p=p;VY.pick=null;PQ.tok++;const tok=PQ.tok;
 if(XB.sq&&XB.sq.length)pzClearMarks();PQ.p={id:p.id,fen:p.pf,lines:[[p.last]],r:p.r,th:[]};
 PQ.g=new CHESS(p.pf);PQ.flip=PQ.g.turn()==='w';PQ.lock=true;PQ.done=true;XB.sel=null;xArrow(null);xBuild();xSet();vyPanel();
 setTimeout(()=>{if(tok!==PQ.tok)return;const mv=PQ.g.move({from:p.last.slice(0,2),to:p.last.slice(2,4),promotion:p.last[4]||undefined});if(mv){xAnimate(mv);xMarks();sfx(mv.captured?'capture':'move');}},500);}
function vyArrows(only){const svg=$('xArrows');if(!svg||!VY.p)return;const os=VY.p.o;svg.innerHTML='';
 os.forEach((o,i)=>{if(only!=null&&only!==i)return;xArrowAdd(o.u,VY_COL[i]);});}
function xArrowAdd(u,col){const svg=$('xArrows');if(!svg)return;const keep=svg.innerHTML;xArrow(u,col);svg.innerHTML=keep+svg.innerHTML;}
function vyPanel(){const p=VY.p,v=vySt(),el=$('pqPanel');if(!el)return;
 el.innerHTML=`<div class="pqPT"><div><small>Vyber tah · pro začátečníky</small><h2>Který tah je nejlepší?</h2></div><span class="pqPN" title="Správně za sebou">${v.st?`${v.st}× za sebou`:''}</span></div>
 <div class="pzChips vyDiff">${VY_DIFF.map((d,i)=>`<button data-vd="${i}" aria-pressed="${i===VY.diff}">${d[0]}</button>`).join('')}</div>
 <div class="pqWho"><i class="${PQ.flip?'b':'w'}"></i>Hraješ za ${pqMe()}</div>
 <p class="pqTask">Soupeř právě táhl. Vyber jednu ze tří možností – šipky ukazují, kam která figura táhne.</p>
 <div class="vyOpts">${p.o.map((o,i)=>`<button class="vyOpt" data-vo="${i}" style="--vc:${VY_COL[i]}"><span class="vyL">${VY_L[i]}</span><b>${o.san}</b><span class="vyR"></span></button>`).join('')}</div>
 <div id="vyExp"></div><div class="freeBtns" id="vyBtns"><button class="btn primary" id="vyNext">Další pozice</button></div>
 <p class="pqMeta">Vyřešeno správně ${v.ok} z ${v.all}${v.best?` · nejlepší série ${v.best}`:''}</p>`;
 el.querySelectorAll('[data-vd]').forEach(b=>b.onclick=()=>{VY.diff=+b.dataset.vd;vyNext();});
 el.querySelectorAll('[data-vo]').forEach(b=>{const i=+b.dataset.vo;b.onmouseenter=b.onfocus=()=>{if(VY.pick==null)vyArrows(i);};b.onmouseleave=b.onblur=()=>{if(VY.pick==null)vyArrows();};b.onclick=()=>vyChoose(i);});
 $('vyNext').onclick=()=>{if(VY.pick==null){const v=vySt();v.st=0;save();}vyNext();};
 setTimeout(()=>{if(VY.p===p&&VY.pick==null)vyArrows();},900);}
function vyChoose(i){if(VY.pick!=null)return;const p=VY.p,o=p.o[i],v=vySt();VY.pick=i;const ok=!!o.ok;const bi=p.o.findIndex(x=>x.ok);
 v.all++;if(ok){v.ok++;v.st++;if(v.st>v.best)v.best=v.st;addXp(2);}else v.st=0;v.seen.push(p.id);if(v.seen.length>700)v.seen.shift();save();
 document.querySelectorAll('.vyOpt').forEach((b,k)=>{b.disabled=true;b.classList.add(p.o[k].ok?'good':k===i?'bad':'dim');b.querySelector('.vyR').textContent=p.o[k].ok?'✓ nejlepší':k===i?'✕':'';});
 xArrow(null);const mv=PQ.g.move({from:o.u.slice(0,2),to:o.u.slice(2,4),promotion:o.u[4]||undefined});if(mv){xAnimate(mv);xMarks();}pzMark(sqOf(o.u.slice(2,4)),ok?'ok':'bad');sfx(ok?'win':'wrong');if(ok&&(PQ.g.isCheckmate()||Math.random()<.3))confettiAt($('xBoard'));
 const exp=$('vyExp');const best=p.o[bi];
 exp.innerHTML=ok?`<div class="vyBox good"><b>Správně! ${o.san} je nejlepší.</b><p>${o.txt}</p>${o.line.length?`<p class="vyLine">Pokračování: ${vyLineSan(p.fen,[o.u,...o.line])}</p>`:''}</div>`
  :`<div class="vyBox bad"><b>${o.san} není nejlepší.</b><p>${o.txt}</p>${o.line.length?`<p class="vyLine">Varianta: ${vyLineSan(p.fen,[o.u,...o.line])}</p>`:''}</div><div class="vyBox good"><b>Nejlepší byl tah ${best.san}</b><p>${best.txt}</p></div>`;
 const others=p.o.map((x,k)=>k!==i&&!x.ok?k:null).filter(k=>k!=null);
 $('vyBtns').innerHTML=`${o.line.length?`<button class="btn" id="vyPlay">${ok?'▶ Přehrát pokračování':'▶ Přehrát, proč je špatný'}</button>`:''}${!ok?`<button class="btn" id="vyBest">Ukázat nejlepší tah</button>`:''}${others.map(k=>`<button class="btn" data-vw="${k}">Proč ne ${p.o[k].san}?</button>`).join('')}<button class="btn primary" id="vyNext">Další pozice</button>`;
 $('vyNext').onclick=vyNext;pqFab(ok?'ok':'bad');const pl=document.getElementById('vyPlay');if(pl)pl.onclick=()=>vyShow(i);const bb=document.getElementById('vyBest');if(bb)bb.onclick=()=>vyShow(bi);
 document.querySelectorAll('[data-vw]').forEach(b=>b.onclick=()=>{const k=+b.dataset.vw;const x=p.o[k];exp.insertAdjacentHTML('beforeend',`<div class="vyBox bad"><b>Proč ne ${x.san}?</b><p>${x.txt}</p>${x.line.length?`<p class="vyLine">Varianta: ${vyLineSan(p.fen,[x.u,...x.line])}</p>`:''}</div>`);b.remove();vyShow(k);});
 if(!ok&&o.line.length)setTimeout(()=>{if(VY.p===p&&VY.pick===i)vyShow(i,true);},900);}
async function vyShow(k,cont){const p=VY.p,o=p.o[k];PQ.tok++;const tok=PQ.tok;const wait=ms=>new Promise(r=>setTimeout(r,ms));pzClearMarks();xArrow(null);
 PQ.g=new CHESS(p.fen);if(!cont){xSet();await wait(350);}else{xSet();}
 const seq=[o.u,...o.line];for(let j=cont?0:0;j<seq.length;j++){if(tok!==PQ.tok)return;const u=seq[j];if(j>0||!cont){xArrow(u,j%2?'#e8573f':VY_COL[k]);await wait(550);}if(tok!==PQ.tok)return;xArrow(null);let mv;try{mv=PQ.g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});}catch(e){}if(!mv)break;xAnimate(mv);xMarks();sfx(PQ.g.inCheck()?'check':mv.captured?'capture':'move');await wait(650);}
 if(tok===PQ.tok&&PQ.g.isCheckmate())pzMark(sqOf(seq[seq.length-1].slice(2,4)),o.ok?'ok':'bad');}


/* Stockfish hodnotí každý tah v puzzle stejně jako v lekcích (Nejlepší tah … Hrubá chyba). Rozbory jdou za sebou ve frontě, aby se navzájem nerušily.
   U špatného tahu se nejlepší tah neukazuje – prozradil by řešení. V Puzzle Rush a ve zkoušce se nehodnotí (je tam spěch). */
const PQE={q:Promise.resolve(),c:new Map()};
const pqEvOn=()=>PQ.ctx!=='rush'&&PQ.ctx!=='test';
function pqSf(fen){if(PQE.c.has(fen))return PQE.c.get(fen);const tok=PQ.tok;
 const pr=PQE.q.then(()=>tok!==PQ.tok?null:sfAnalyse(fen,{depth:15,movetime:IS_MOBILE?600:900})).catch(()=>null);PQE.q=pr.then(()=>{},()=>{});
 PQE.c.set(fen,pr);pr.then(r=>{if(!r)PQE.c.delete(fen);});if(PQE.c.size>60)PQE.c.delete(PQE.c.keys().next().value);return pr;}
function pqEvPre(){if(!pqEvOn()||!PQ.g||PQ.done||PQ.g.isGameOver())return;pqSf(PQ.g.fen());}
function pqBadge(sq,kind){document.querySelectorAll('#xPcs .badge').forEach(e=>e.remove());if(sq==null)return;const P=$('xPcs');if(!P)return;const el=document.createElement('div');el.className='badge '+kind;xPlace(el,sqOf(sq));el.innerHTML=`<span>${ICON[kind]}</span>`;P.appendChild(el);}
async function pqEvJudge(fen0,u,g,right){if(!pqEvOn())return;const tok=PQ.tok,fen1=g.fen(),mate=g.isCheckmate(),s=fen0.split(' ')[1]==='w'?1:-1;
 const [a,b]=await Promise.all([pqSf(fen0),mate||g.isGameOver()?null:pqSf(fen1)]);if(tok!==PQ.tok||!a||!a.lines[0])return;
 const cp1=mate?s*3000:g.isGameOver()?0:(b&&b.lines[0]?b.lines[0].cp:null);if(cp1==null)return;
 const cp0=a.lines[0].cp,drop=rzWp(s*cp0)-rzWp(s*cp1),isBest=mate||u.slice(0,4)===(a.best||'').slice(0,4);let k,lab;
 if(isBest){k='best';lab='Nejlepší tah';}else if(drop<4){k='good';lab='Výborný tah';}else if(drop<8){k='good';lab='Dobrý tah';}else if(drop<12){k='alt';lab='Nepřesnost';}else if(drop<25){k='bad';lab='Chyba';}else{k='bad';lab='Hrubá chyba';}
 /* tah z řešení je ověřený hluboko (Lichess); rychlý výpočet v prohlížeči ho občas podcení */
 if(right&&(k==='alt'||k==='bad')){k='good';lab='Výborný tah';}
 const me=v=>{const x=s*v;return Math.abs(x)>=2900?(x>0?`dáš mat${3000-Math.abs(x)>0?' (za '+(3000-Math.abs(x))+')':''}`:'soupeř dá mat'):`${x>0?'+':''}${(x/100).toFixed(1).replace('.',',')} pro tebe`;};
 let tx=mate?'Mat!':`Stockfish: ${me(cp1)}`;
 if(!right&&!mate){if(k==='best'||k==='good')tx+='. Engine ho má skoro stejně dobrý, ale úloha chce jiný tah – najdi ho.';else tx+=` (s nejlepším tahem ${me(cp0)}).`;}
 else if(right&&!mate&&k==='best')tx+='. Přesně tohle by zahrál i Stockfish.';
 const el=document.getElementById('pqVerd');if(el){el.hidden=false;el.className='tuVerd pqVerd k-'+k;el.innerHTML=`<b>${lab}</b> – ${tx}`;}const tv=document.getElementById('pqTopV');if(tv){tv.hidden=false;tv.className='pqTopV k-'+k;tv.innerHTML=`<b>${lab}</b> – ${tx}`;}const pv=document.getElementById('pqPopV');if(pv&&PQ.done){pv.className='pqPopV k-'+k;pv.innerHTML=`<b>${lab}</b> – ${tx}`;}
 if(right&&PQ.g===g&&g.fen()===fen1){const d=XB.sq&&XB.sq[sqOf(u.slice(2,4))];if(d)d.querySelectorAll('.pzMk').forEach(x=>x.remove());pqBadge(u.slice(2,4),k);}}

/* okénko po vyřešení přímo nad šachovnicí: výsledek, hodnocení Stockfishe a Další úloha (ať se nemusí posouvat k panelu) */
function pqPopClose(){document.querySelectorAll('.pqDone').forEach(x=>x.remove());}
function pqPop(head,cls){pqPopClose();pqFabHide();const tok=PQ.tok;const W=document.querySelector('.pqWrap .boardWrap');if(!W)return;
 setTimeout(()=>{if(tok!==PQ.tok||!PQ.done)return;const nb=$('pqNext');const v=document.getElementById('pqVerd');
  const d=document.createElement('div');d.className='pqDone '+(cls||'');d.setAttribute('role','dialog');
  d.innerHTML=`<button type="button" class="pqDoneX" aria-label="Zavřít">✕</button><div class="pqDoneH">${cls==='ok'?'<i>✓</i>':''}<span>${head}</span></div><div class="pqPopV${v&&!v.hidden?' '+[...v.classList].filter(c=>c.startsWith('k-')).join(' '):''}" id="pqPopV">${v&&!v.hidden?v.innerHTML:''}</div><div class="pqDoneB"><button type="button" class="btn" data-pp="re">Přehrát znovu</button><button type="button" class="btn primary" data-pp="next">${escH(nb?nb.textContent.trim():'Další úloha')}</button></div>`;
  W.appendChild(d);requestAnimationFrame(()=>d.classList.add('in'));
  d.querySelector('.pqDoneX').onclick=()=>{pqPopClose();pqFab(cls);};
  d.querySelector('[data-pp=re]').onclick=()=>{pqPopClose();pqFab(cls);pqReplay();};
  d.querySelector('[data-pp=next]').onclick=()=>{pqPopClose();const b=$('pqNext');if(b)b.click();};
  const nx=d.querySelector('[data-pp=next]');try{nx.focus({preventScroll:true});}catch(e){}},550);}
window.addEventListener('hashchange',pqPopClose);
