/* Šachovnice a figurky, Koncovky, Profil, Vývojář, CRAZY módy, zvuk, DOM, stav, kreslení šachovnice. Pořadí načítání je v index.html (APP_JS). */
/* ---------- Šachovnice a figurky (#sachovnice) ---------- */
const SCHEME=()=>{try{return localStorage.getItem('trener-scheme')||'auto'}catch(e){return'auto'}};
const LOOK_FEN=[['bR',56],['bN',57],['bB',58],['bQ',59],['bK',60],['bB',61],['bN',62],['bR',63],['bP',48],['bP',49],['bP',50],['bP',51],['bP',53],['bP',54],['bP',55],['bP',36],['wP',28],['wN',21],['wP',8],['wP',9],['wP',10],['wP',11],['wP',13],['wP',14],['wP',15],['wR',0],['wN',1],['wB',2],['wQ',3],['wK',4],['wB',5],['wR',7]];
function lookBoard(theme,set,big){const t=THEMES[theme]||THEMES.wood;const map={};LOOK_FEN.forEach(([p,i])=>map[i]=p);let h='';
 for(let r=7;r>=0;r--)for(let f=0;f<8;f++){const i=r*8+f,lt=(r+f)%2===1,p=map[i];h+=`<div style="background:${lt?(t[2]||t[0]):(t[3]||t[1])}">${p?pieceOf(set,p):''}</div>`;}
 return `<div class="lkBoard${big?' big':''}">${h}</div>`;}
function renderLooks(){document.body.classList.add('homeMode');const th=store.theme||'wood',ps=store.pieces||'cburnett';
 const pieceRow=set=>['wK','wQ','wN','bK','bQ','bN'].map(p=>pieceOf(set,p)).join('');
 $('home').innerHTML=`<a class="backAll" href="#">← Všechny kurzy</a><div class="lkWrap"><div class="lkLeft"><div class="profCard"><h2>Vzhled</h2><p class="profEmpty">Vyber si vzhled aplikace, šachovnici a figurky. Platí všude a jde to kdykoli změnit.</p>${lookBoard(th,ps,true)}<button class="btn primary lkRand" id="lkRand">🎲 Náhodná kombinace</button><p class="profEmpty lkNow">${THEME_NAMES[th]||th} + ${(PIECE_SETS[ps]||[ps])[0]}${store.pfx&&store.pfx!=='none'?' + '+PIECE_FX[store.pfx][0]:''} · ${Object.keys(THEMES).length} šachovnic, ${Object.keys(PIECE_SETS).length} sad, ${Object.keys(PIECE_FX).length-1} efektů</p></div></div>
 <div class="lkRight"><div class="profCard"><h2>Figurky</h2><div class="lkSets">${Object.entries(PIECE_SETS).map(([k,[n,lic]])=>`<button class="lkSet${k===ps?' on':''}" data-ls="${k}"><span class="row6">${pieceRow(k)}</span><b>${n}</b><small>${lic}</small></button>`).join('')}</div></div>
 <div class="profCard"><h2>Šachovnice</h2><div class="lkThemes">${Object.entries(THEMES).map(([k,[l,d]])=>`<button class="lkTh${k===th?' on':''}" data-lt="${k}"><span class="sq4">${(()=>{const t=THEMES[k],L=t[2]||l,D=t[3]||d;return `<i style="background:${L}"></i><i style="background:${D}"></i><i style="background:${D}"></i><i style="background:${L}"></i>`})()}</span><small>${THEME_NAMES[k]||k}</small></button>`).join('')}</div></div>
 <div class="profCard"><h2>${window.MUSEUM?'Vzhled aplikace (muzeum vidíš jen ty)':'Vzhled aplikace'}</h2><div class="dsList dsGrid"${window.MUSEUM?'':' hidden'}>${Object.entries(window.DESIGNS).map(([k,v])=>`<button class="dsOpt${window.DESIGN===k?' on':''}" data-ds="${k}"><b>${v.n}</b><small>${v.d}</small></button>`).join('')}</div>${['neo','sal','klub'].includes(window.DESIGN)?`<div class="schRow"><span>Světlý nebo tmavý:</span><div class="chip2" role="group">${[['auto','Podle systému'],['light','Světlý'],['dark','Tmavý']].map(([k,n])=>`<button data-sch="${k}" aria-pressed="${(SCHEME()===k)}">${n}</button>`).join('')}</div></div>`:'<p class="profEmpty" style="margin-top:8px">Tenhle vzhled je jen tmavý.</p>'}</div>
 <div class="profCard"><h2>Efekty figurek</h2><div class="lkFx">${Object.entries(PIECE_FX).map(([k,[n,d]])=>`<button class="lkSet lkFxB${k===(store.pfx||'none')?' on':''}" data-lf="${k}"><b>${n}</b><small>${d}</small></button>`).join('')}</div></div>
<div class="profCard"><h2>Šetřit baterii</h2><div class="lkFx">${[['auto','Automaticky','Zapne se sám při baterii pod 20 % bez nabíječky nebo když máš v telefonu omezené animace.'],['on','Zapnuto','Stockfish přemýšlí kratší dobu, rám šachovnice nepulzuje a figurky se neanimují.'],['off','Vypnuto','Vždy plné efekty a nejdelší přemýšlení enginu.']].map(([k,n,d])=>`<button class="lkSet lkFxB${ecoPref()===k?' on':''}" data-eco="${k}"><b>${n}</b><small>${d}</small></button>`).join('')}</div><p class="ecoNow">Teď: úsporný režim je ${ecoOn()?'zapnutý':'vypnutý'}. Platí pro tohle zařízení.</p></div></div></div>`;
 renderSide();
 $('home').querySelectorAll('[data-lt]').forEach(b=>b.onclick=()=>{store.theme=b.dataset.lt;save();applyTheme();renderLooks();});
 $('home').querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>{const k=b.dataset.ds;try{if(k==='neo')localStorage.removeItem('trener-design');else localStorage.setItem('trener-design',k);}catch(e){}window.applyDesign(k);renderLooks();});
 $('lkRand').onclick=()=>{const pick=a=>a[Math.floor(Math.random()*a.length)];store.theme=pick(Object.keys(THEMES).filter(k=>k!=='invisible'));store.pieces=pick(Object.keys(PIECE_SETS));store.pfx=Math.random()<.6?'none':pick(Object.keys(PIECE_FX).filter(k=>k!=='blind'));save();applyTheme();renderLooks();};
 $('home').querySelectorAll('[data-sch]').forEach(b=>b.onclick=()=>{const k=b.dataset.sch;const h=document.documentElement;h.classList.remove('sch-light','sch-dark');try{if(k==='auto')localStorage.removeItem('trener-scheme');else{localStorage.setItem('trener-scheme',k);h.classList.add('sch-'+k);}}catch(e){}renderLooks();});
 $('home').querySelectorAll('[data-lf]').forEach(b=>b.onclick=()=>{store.pfx=b.dataset.lf;save();applyPfx();renderLooks();});
 $('home').querySelectorAll('[data-eco]').forEach(b=>b.onclick=()=>{try{if(b.dataset.eco==='auto')localStorage.removeItem('trener-eco');else localStorage.setItem('trener-eco',b.dataset.eco);}catch(e){}applyEco();renderLooks();});
 $('home').querySelectorAll('[data-ls]').forEach(b=>b.onclick=()=>{store.pieces=b.dataset.ls;save();renderLooks();});}
/* ---------- Koncovky (#koncovky): hraješ proti Stockfishi, trenažér hlídá cíl ---------- */
const ENDGAMES=[
 {id:'q',lvl:1,t:'Mat dámou',fen:'8/8/8/4k3/8/8/8/4K2Q w - - 0 1',goal:'mate',lim:15,tip:'Dámou zatlač krále ke kraji (vždy jezdcův skok od něj), pak přiveď svého krále a dej mat. Pozor na pat!'},
 {id:'rr',lvl:1,t:'Mat dvěma věžemi',fen:'8/8/8/3k4/8/8/8/R3K2R w - - 0 1',goal:'mate',lim:10,tip:'„Sekačka“: věže se střídají a tlačí krále řadu po řadě ke kraji.'},
 {id:'r',lvl:2,t:'Mat věží',fen:'8/8/8/4k3/8/8/8/R3K3 w - - 0 1',goal:'mate',lim:30,tip:'Věží odřízni krále, svým králem jdi naproti (opozice) a věž dá šach z boku. Krok po kroku zmenšuj jeho prostor.'},
 {id:'p6',lvl:1,t:'Pěšec: král na 6. řadě',fen:'4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',goal:'promote',tip:'Král před pěšcem na 6. řadě vyhrává vždy. Nejdřív králem, pak pěšcem.'},
 {id:'opp',lvl:2,t:'Opozice a tempo',fen:'8/8/3k4/8/3K4/8/3P4/8 w - - 0 1',goal:'promote',tip:'Pěšec má záložní tah. Použij ho, abys získal opozici, a pak pusť krále dopředu.'},
 {id:'brk',lvl:2,t:'Pěšcový průlom',fen:'7k/ppp5/8/PPP5/8/8/8/7K w - - 0 1',goal:'promote',tip:'Tři proti třem a králové daleko: obětuj pěšce uprostřed (b6!) a jeden z tvých projde.'},
 {id:'outside',lvl:2,t:'Vzdálený volný pěšec',fen:'8/8/4k3/p7/8/4K3/P6P/8 w - - 0 1',goal:'promote',tip:'Vzdáleným pěšcem odlákej černého krále na okraj a mezitím sněz pěšce na druhé straně.'},
 {id:'luc',lvl:3,t:'Lucena (stavba mostu)',fen:'1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1',goal:'promote',tip:'Věží odřízni krále (Rd1+), věž na 4. řadu a pak „postav most“ – věž zastaví šachy z boku.'},
 {id:'qp',lvl:3,t:'Dáma proti pěšci na 7. řadě',fen:'8/8/8/8/8/8/2pk4/K6Q w - - 0 1',goal:'mate',lim:25,tip:'Šachy a vazbami donuť krále postavit se před pěšce, mezitím přiveď svého krále.'},
 {id:'bb',lvl:3,t:'Mat dvěma střelci',fen:'8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1',goal:'mate',lim:35,tip:'Střelci vedle sebe tvoří zeď. Zatlač krále do rohu a pomoz si králem.'},
 {id:'bn',lvl:4,t:'Mat střelcem a jezdcem',fen:'8/8/8/4k3/8/8/8/1N2KB2 w - - 0 1',goal:'mate',lim:50,tip:'Mat jde dát jen v rohu barvy tvého střelce. Nejtěžší základní mat – nevzdávej to!'},
 {id:'sq',lvl:1,t:'Pravidlo čtverce',fen:'8/8/8/8/1P4k1/8/8/7K b - - 0 1',goal:'draw',hold:12,tip:'Nakresli si čtverec od pěšce k proměnovému poli. Když do něj král vstoupí, pěšce chytí.'},
 {id:'wb',lvl:2,t:'Špatný střelec – drž remízu',fen:'7k/8/5K1P/8/8/8/4B3/8 b - - 0 1',goal:'draw',hold:20,tip:'Střelec nekryje rohové pole h8. Drž krále v rohu a remíza je jistá.'},
 {id:'phil',lvl:3,t:'Philidor – obrana věží',fen:'4k3/7R/r7/3KP3/8/8/8/8 b - - 0 1',goal:'draw',hold:20,tip:'Věž drž na 6. řadě. Až pěšec vstoupí na 6. řadu, věž jde dozadu a dává šachy zezadu.'}];
const EG_LVL=['','Základ','Střední','Pokročilé','Expert'];
function evalTxt(cp,me){const s=me==='b'?-1:1,v=cp*s;if(Math.abs(cp)>=2900){const n=3000-Math.abs(cp);return v>0?`Mat za ${n} ${n===1?'tah':n<5?'tahy':'tahů'} – vyhráváš`:`Soupeř má mat za ${n} – prohráváš`;}
 const a=(Math.abs(v)/100).toFixed(1).replace('.',',');return Math.abs(v)<40?`Vyrovnané (${v>=0?'+':'−'}${a})`:v>0?`Vyhráváš o ${a} pěšce`:`Prohráváš o ${a} pěšce`;}
/* ---------- Databáze koncovek (Lichess tablebase, do 7 kamenů) ---------- */
const TB={cache:new Map(),off:false};
const tbPieces=fen=>fen.split(' ')[0].replace(/[^a-zA-Z]/g,'').length;
async function tbProbe(fen){if(TB.off||tbPieces(fen)>7)return null;const key=fen.split(' ').slice(0,4).join(' ');if(TB.cache.has(key))return TB.cache.get(key);
 try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),5000);const r=await fetch('https://tablebase.lichess.ovh/standard?fen='+encodeURIComponent(fen.replace(/ /g,'_')),{signal:ctl.signal});clearTimeout(t);if(!r.ok)return null;const d=await r.json();if(!d||!d.category)return null;TB.cache.set(key,d);return d;}catch(e){return null;}}
/* výsledek pro hráče (me) z pohledu strany na tahu v pozici fen */
function tbOutcome(d,fen,me){const stm=fen.split(' ')[1];let c=d.category;if(c==='cursed-win'||c==='blessed-loss'||c==='maybe-win'||c==='maybe-loss')c='draw';const forMe=stm===me?c:(c==='win'?'loss':c==='loss'?'win':c);return forMe==='unknown'?null:forMe;}
function tbMateMoves(d){return d&&d.dtm!=null?Math.ceil(Math.abs(d.dtm)/2):null;}
function tbTxt(d,fen,me){const o=tbOutcome(d,fen,me);if(!o)return'';const m=tbMateMoves(d);return o==='win'?(m!=null?`Databáze: vyhráváš – mat za ${m} ${m===1?'tah':m<5?'tahy':'tahů'}`:'Databáze: vyhraná pozice'):o==='loss'?(m!=null?`Databáze: prohráváš – soupeř má mat za ${m}`:'Databáze: prohraná pozice'):'Databáze: remíza';}
function tbCp(d,fen,me){const o=tbOutcome(d,fen,me);if(!o)return null;const m=tbMateMoves(d),s=me==='w'?1:-1;return o==='draw'?0:(o==='win'?1:-1)*s*(m!=null?3000-m:1500);}
let EG={g:null,task:null,flip:false,lock:false,moves:0,done:false,q0:0,hint:false};
const egDone=id=>!!(store.eg&&store.eg[id]);
function egGoalTxt(t){const me=t.fen.split(' ')[1]==='w'?'bílé':'černé';return t.goal==='mate'?`Dej mat do ${t.lim} tahů. Hraješ za ${me}.`:t.goal==='promote'?`Proměň pěšce a udrž výhru. Hraješ za ${me}.`:`Udrž remízu ${t.hold} tahů. Hraješ za ${me}.`;}
async function renderEndgames(){document.body.classList.add('homeMode');XB.mode='eg';
 if(!CHESS){$('home').innerHTML='<a class="backAll" href="#">← Všechny kurzy</a><p class="profEmpty">Načítám…</p>';try{await chessLib();}catch(e){return;}if(page!=='endgames')return;}
 const solved=ENDGAMES.filter(t=>egDone(t.id)).length;
 $('home').innerHTML=`<a class="backAll" href="#">← Všechny kurzy</a><div class="profCard pzHead"><h2>Koncovky</h2><p class="profEmpty">Klasické koncovky proti Stockfishi. Splněno <b id="egCnt">${solved}/${ENDGAMES.length}</b>.</p></div>
 <div class="exWrap"><div class="exLeft"><div class="profCard"><div class="xRow"><div class="evalBar" id="xEval"><div class="w" id="xEvalW"></div><span class="top" id="xEvalTop"></span><span class="bot" id="xEvalBot"></span></div><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div></div></div>
 <div class="exRight"><div class="profCard" id="egPanel"></div><div class="profCard"><h2>Úlohy</h2><div class="pzList" id="egList"></div></div></div></div>`;
 renderSide();xInput();egLoad(EG.task||ENDGAMES.find(t=>!egDone(t.id))||ENDGAMES[0]);}
function egList(){const el=$('egList');if(!el)return;el.innerHTML=ENDGAMES.map(t=>`<button class="pzItem${t===EG.task?' cur':''}${egDone(t.id)?' ok':''}" data-eg="${t.id}"><span class="egLv l${t.lvl}">${t.lvl}</span><span class="exTx"><b>${t.t}</b><small>${EG_LVL[t.lvl]} · ${t.goal==='mate'?'mat':t.goal==='promote'?'proměna':'remíza'}</small></span><span>${egDone(t.id)?'✓':''}</span></button>`).join('');
 el.querySelectorAll('[data-eg]').forEach(b=>b.onclick=()=>{egLoad(ENDGAMES.find(t=>t.id===b.dataset.eg));window.scrollTo({top:0,behavior:'smooth'});});}
function egLoad(t){XM.marks=[];xRenderMarks();EG.task=t;EG.g=new CHESS(t.fen);EG.me=t.fen.split(' ')[1];EG.flip=EG.me==='b';EG.lock=false;EG.moves=0;EG.done=false;EG.q0=egQueens();XB.sel=null;xBuild();xSet();xArrow(null);xBar(0);egList();
 $('egPanel').innerHTML=`<h2>${t.t}</h2><p class="profEmpty">${EG_LVL[t.lvl]}</p><div class="engBox"><b>Cíl:</b> ${egGoalTxt(t)}</div><p class="sfLvl">Pozice do 7 kamenů hlídá <b>databáze koncovek Lichess</b> (dokonale spočítané výsledky) a soupeř hraje její nejlepší obranu. Jinak: <b>Stockfish 17.1 Lite</b> (verze pro prohlížeč s menší neuronovou sítí), bez omezení síly, ${IS_MOBILE?'0,6':'0,8'} s na tah – zhruba <b>2700+ Elo na chess.com</b>.</p><p class="egEval" id="egEval">Engine počítá…</p><p class="accMsg" id="egMsg"></p><p class="profEmpty" id="egTip" hidden><b>Rada:</b> ${t.tip}</p>
 <div class="freeBtns"><button class="btn" id="egTipB">Rada</button><button class="btn" id="egHint">Nejlepší tah</button><button class="btn" id="egReset">Znovu</button><button class="btn primary" id="egNext">Další koncovka</button></div>`;
 $('egTipB').onclick=()=>{$('egTip').hidden=false;};$('egReset').onclick=()=>egLoad(t);
 $('egNext').onclick=()=>{const i=ENDGAMES.indexOf(t);egLoad(ENDGAMES.slice(i+1).concat(ENDGAMES.slice(0,i)).find(x=>!egDone(x.id))||ENDGAMES[(i+1)%ENDGAMES.length]);};
 $('egHint').onclick=async()=>{if(EG.lock||EG.done)return;const m=$('egMsg');m.className='';m.textContent='Engine přemýšlí…';{const tb=await tbProbe(EG.g.fen());if(tb&&tb.moves&&tb.moves[0]&&EG.task===t){xArrow(tb.moves[0].uci);m.textContent='Modrá šipka ukazuje nejlepší tah podle databáze koncovek.';return;}}try{const r=await sfAnalyse(EG.g.fen(),{movetime:900});if(r&&r.lines[0]&&EG.task===t){xArrow(r.lines[0].pv[0]);m.textContent='Modrá šipka ukazuje nejlepší tah.';}}catch(e){m.textContent='Engine se nepodařilo načíst.';}};
 egStatus();(async()=>{const f0=EG.g.fen();const tb=await tbProbe(f0);if(tb&&EG.task===t&&!EG.done){const o=tbOutcome(tb,f0,EG.me);if(o){xBar(tbCp(tb,f0,EG.me));$('egEval').textContent=tbTxt(tb,f0,EG.me);$('egEval').classList.add('tb');return;}}try{const r=await sfAnalyse(EG.g.fen(),{movetime:600});if(r&&r.lines[0]&&EG.task===t&&!EG.done){xBar(r.lines[0].cp);const ee=$('egEval');if(ee)ee.textContent=evalTxt(r.lines[0].cp,EG.me);}}catch(e){}})();}
function egQueens(){const b=EG.g.board().flat();return b.filter(x=>x&&x.type==='q'&&x.color===EG.me).length;}
function egStatus(){const el=$('egMsg');if(!el||EG.done)return;const t=EG.task;el.className='';el.textContent=t.goal==='mate'?`Tahů: ${EG.moves}/${t.lim}`:t.goal==='draw'?`Vydrženo: ${EG.moves}/${t.hold} tahů`:`Tahů: ${EG.moves}`;}
function egEnd(ok,txt){EG.done=true;EG.lock=true;const m=$('egMsg');m.className=ok?'ok':'bad';m.innerHTML=(ok?'✓ ':'✕ ')+txt;
 if(ok){const first=!egDone(EG.task.id);store.eg=store.eg||{};store.eg[EG.task.id]=1;if(first){addXp(15);m.innerHTML+=' · +15 XP';}save();sfx('win');confettiAt($('xBoard'));egList();const c=$('egCnt');if(c)c.textContent=`${ENDGAMES.filter(x=>egDone(x.id)).length}/${ENDGAMES.length}`;}
 else{sfx('wrong');m.innerHTML+=' <button class="lnk" id="egRetry">Zkusit znovu</button>';const r=document.getElementById('egRetry');if(r)r.onclick=()=>egLoad(EG.task);}}
function egCheck(afterMine){const g=EG.g,t=EG.task;if(g.isCheckmate()){if(afterMine)return egEnd(t.goal!=='draw','Mat! Úloha splněna.'),true;return egEnd(false,'Dostal jsi mat.'),true;}
 if(g.isDraw()||g.isStalemate()){const why=g.isStalemate()?'Pat':g.isThreefoldRepetition()?'Trojí opakování':g.isInsufficientMaterial()?'Nedostatek materiálu':'Remíza';return egEnd(t.goal==='draw',t.goal==='draw'?`${why} – remíza udržena!`:`${why} – remíza, výhra utekla.`),true;}
 return false;}
function egTry(from,to){if(EG.lock||EG.done)return false;const g=EG.g;let mv;try{mv=g.move({from:sqName(from),to:sqName(to),promotion:XPROMO||'q'});}catch(e){return false;}if(!mv)return false;
 XB.sel=null;xArrow(null);xAnimate(mv);xMarks();sfx(mv.captured?'capture':'move');EG.moves++;const t=EG.task;
 if(egCheck(true))return true;
 if(t.goal==='mate'&&EG.moves>=t.lim){egEnd(false,`Mat se nepodařil do ${t.lim} tahů.`);return true;}
 if(t.goal==='draw'&&EG.moves>=t.hold){egEnd(true,`Vydržel jsi ${t.hold} tahů – remíza udržena!`);return true;}
 egStatus();EG.lock=true;const task=t;
 setTimeout(async()=>{const fen=g.fen();const tb=await tbProbe(fen);if(EG.task!==task||EG.done)return;const o=tb?tbOutcome(tb,fen,EG.me):null;
  if(o){xBar(tbCp(tb,fen,EG.me));{const ee=$('egEval');ee.textContent=tbTxt(tb,fen,EG.me);ee.classList.add('tb');}
   if((t.goal==='promote')&&egQueens()>EG.q0&&o==='win')return egEnd(true,'Pěšec proměněn a výhra drží (ověřeno databází)!');
   if((t.goal==='promote'||t.goal==='mate')&&o!=='win')return egEnd(false,'Podle databáze koncovek je to teď jen remíza – výhra utekla.');
   if(t.goal==='draw'&&o==='loss')return egEnd(false,'Podle databáze koncovek tenhle tah prohrává.');
   const bm=tb.moves&&tb.moves[0];if(bm){const u=bm.uci;let om;try{om=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}catch(e){}if(om){xAnimate(om);xMarks();sfx(om.captured?'capture':'move');}
    if(egCheck(false))return;const f2=g.fen();tbProbe(f2).then(d2=>{if(d2&&EG.task===task&&!EG.done){xBar(tbCp(d2,f2,EG.me));$('egEval').textContent=tbTxt(d2,f2,EG.me);}});EG.lock=false;return;}}
  let r=null;try{r=await sfAnalyse(g.fen(),{movetime:IS_MOBILE?600:800});}catch(e){}if(EG.task!==task||EG.done)return;
  if(!r||!r.lines[0]){EG.lock=false;$('egMsg').textContent='Engine se nepodařilo načíst. Obnov stránku.';return;}
  const sign=EG.me==='w'?1:-1,ev=r.lines[0].cp*sign;xBar(r.lines[0].cp);{const ee=$('egEval');if(ee)ee.textContent=evalTxt(r.lines[0].cp,EG.me);}
  if(t.goal==='promote'&&egQueens()>EG.q0&&ev>=500)return egEnd(true,'Pěšec proměněn a výhra drží!');
  if((t.goal==='promote')&&ev<150)return egEnd(false,'Tímhle tahem výhra utekla – pozice je teď remízová.');
  if(t.goal==='draw'&&ev<-300)return egEnd(false,'Tímhle tahem pozice prohrává.');
  const u=r.lines[0].pv[0];let om;try{om=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}catch(e){}
  if(om){xAnimate(om);xMarks();sfx(om.captured?'capture':'move');}
  if(egCheck(false))return;EG.lock=false;},250);
 return true;}
/* ---------- profil hráče (#profil) ---------- */
function courseStats(c){const pr=store.prog[c.id]||{};const L=c.chapters.flatMap(ch=>ch.lines.map(l=>({l,ch})));const o={c,total:L.length,done:0,due:0,learning:0,neu:0,n:0,ok:0,err:0,lines:[]};
 L.forEach(({l,ch})=>{const st=stateIn(c,l);o[st==='new'?'neu':st==='done'?'done':st==='lapsed'?'learning':st]++;if(st==='due')o.done++;const p=pr[l.id];if(p){o.n+=p.n||0;o.ok+=p.ok||0;o.err+=p.err||0;o.lines.push({c,l,ch,p,st});}});
 o.pct=courseProg(c);o.acc=o.n?Math.round(o.ok/o.n*100):null;return o;}
/* čas v aplikaci: počítá se jen, když je stránka vidět a hráč v poslední 1,5 minutě něco dělal */
const tmSum=(tm,days)=>{tm=tm||{};if(!days)return Object.values(tm).reduce((a,x)=>a+x,0);let t=0;for(let i=0;i<days;i++){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);t+=tm[d]||0;}return t;};
const fmtH=sec=>{const m=Math.round((sec||0)/60);if(m<60)return m+' min';const h=Math.floor(m/60);return h+' h'+(m%60?' '+(m%60)+' min':'');};
let TM_IN=Date.now(),TM_N=0;['pointerdown','keydown','touchstart','wheel'].forEach(ev=>addEventListener(ev,()=>{TM_IN=Date.now();},{passive:true,capture:true}));
setInterval(()=>{if(document.visibilityState!=='visible'||Date.now()-TM_IN>90000)return;const d=new Date().toISOString().slice(0,10);store.tm=store.tm||{};store.tm[d]=(store.tm[d]||0)+15;
 if(++TM_N%8===0)save();else saveLocal();},15000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&TM_N%8)save();});
function renderProfile(){document.body.classList.add('homeMode');const Lv=lvlOf(store.xp);const S=COURSES.map(courseStats);
 const sum=k=>S.reduce((a,x)=>a+x[k],0);const tot=sum('total'),done=sum('done'),due=sum('due'),n=sum('n'),ok=sum('ok'),err=sum('err');
 const mast=COURSES.reduce((a,c)=>a+c.chapters.filter(ch=>chPct(ch,c)===100).length,0),chTot=COURSES.reduce((a,c)=>a+c.chapters.length,0);
 const acc=n?Math.round(ok/n*100):null;
 const side=sd=>{const xs=S.filter(x=>x.c.side===sd);const t=xs.reduce((a,x)=>a+x.total,0),d=xs.reduce((a,x)=>a+x.done,0),nn=xs.reduce((a,x)=>a+x.n,0),oo=xs.reduce((a,x)=>a+x.ok,0);return{t,d,pct:t?Math.round(d/t*100):0,acc:nn?Math.round(oo/nn*100):null};};
 const W=side('w'),B=side('b');
 /* activity */
 const act=store.act||{};const days=[];for(let i=13;i>=0;i--){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);days.push([d,act[d]||0]);}
 const mx=Math.max(1,...days.map(d=>d[1]));let streak=0;for(let i=0;;i++){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);if(act[d])streak++;else if(i>0)break;if(i>400)break;}
 /* strengths & weaknesses */
 const all=S.flatMap(x=>x.lines);
 const strong=all.filter(x=>(x.p.box||0)>=3).sort((a,b)=>(b.p.box-a.p.box)||((b.p.ok||0)-(a.p.ok||0))).slice(0,5);
 const weak=all.filter(x=>(x.p.err||0)>0||(x.st==='learning'||x.st==='lapsed')).map(x=>({...x,rate:(x.p.err||0)/Math.max(1,x.p.n||1)})).sort((a,b)=>(b.rate-a.rate)||((b.p.err||0)-(a.p.err||0))).slice(0,6);
 const chs=[];COURSES.forEach(c=>c.chapters.forEach(ch=>{const p=chPct(ch,c);const started=ch.lines.some(l=>(store.prog[c.id]||{})[l.id]);chs.push({c,ch,p,started});}));
 const bestCh=chs.filter(x=>x.p>=60).sort((a,b)=>b.p-a.p).slice(0,3),weakCh=chs.filter(x=>x.started&&x.p<60).sort((a,b)=>a.p-b.p).slice(0,3);
 /* tips */
 const tips=[];
 if(!done&&!all.length)tips.push(['Začni prvním kurzem. Vyber si zahájení za bílé i za černé – ať máš repertoár na obě barvy.','#']);
 if(due)tips.push([`Máš <b>${due}</b> ${due===1?'variantu':due<5?'varianty':'variant'} k opakování. Zopakuj je co nejdřív, jinak je zapomeneš.`,'#'+(S.find(x=>x.due)||S[0]).c.id]);
 if(acc!=null&&acc<70&&n>=5)tips.push([`Bez chyby zahraješ ${acc} % pokusů. Než začneš procvičovat, projdi variantu v režimu <b>Učit se</b> a čti si vysvětlení tahů.`,null]);
 if(weakCh[0])tips.push([`Kapitola <b>${weakCh[0].ch.t}</b> (${weakCh[0].c.title}) je zatím na ${weakCh[0].p} %. Dokonči ji, ať v ní nemáš díry.`,'#'+weakCh[0].c.id]);
 if(W.t&&B.t&&Math.abs(W.pct-B.pct)>=20)tips.push([`Za ${W.pct<B.pct?'bílé':'černé'} toho umíš méně (${Math.min(W.pct,B.pct)} % vs. ${Math.max(W.pct,B.pct)} %). Zkus přidat kurz za ${W.pct<B.pct?'bílé':'černé'}.`,'#']);
 const fresh=S.filter(x=>!x.lines.length);if(fresh.length&&all.length)tips.push([`Ještě jsi nezkusil: <b>${fresh.map(x=>x.c.title).join(', ')}</b>.`,'#'+fresh[0].c.id]);
 if(streak>=3)tips.push([`Trénuješ ${streak} dní v řadě – jen tak dál! 🔥`,null]);else if(all.length)tips.push(['Nejlíp se zahájení učí po kouskách každý den. Stačí 10 minut denně.',null]);
 const li=(x,why)=>`<li><b>${x.l.name}</b><small>${x.c.title} · ${x.ch.t}${why?' · '+why:''}</small><button data-play="${x.c.id}|${x.l.id}">Zahrát</button></li>`;
 const tipLi=([t,h])=>`<li>${t}${h!=null?`<br><button data-goto="${h}">Otevřít</button>`:''}</li>`;
 let h=`<a class="backAll" href="#">← Všechny kurzy</a><div class="prof">
 <div class="profCard profHead"><span class="big">${Lv.n}</span><div class="lb"><h1>${SYNC.user?escH(SYNC.user):'Můj profil'}</h1><div>Level ${Lv.n} – <b>${myLvl(Lv)}</b> · ${store.xp||0} XP</div><div class="bar"><i style="width:${Lv.pct}%"></i></div><small>Do dalšího levelu chybí ${Lv.left} XP · <button class="lnk" id="pLvl" style="padding:0">všechny levely</button> · <button class="lnk" id="pTitle" style="padding:0">vlastní název</button></small><form class="titleForm" id="titleForm" hidden><input id="titleIn" maxlength="40" placeholder="Vlastní název levelu" value="${escH(store.lvlTitle||'')}"><button class="btn" type="submit">Uložit</button><button class="btn" type="button" id="titleClear">Původní</button><small>Uvidíš ho jen ty na svém účtu.</small></form></div>
  ${SYNC.be&&SYNC.be.kind==='supa'?`<button class="btn" id="pOut">Odhlásit</button>`:''}</div>
 ${appCardHTML()}${typeof lbBadgesHTML==='function'?lbBadgesHTML():''}<div class="profCard"><h2>Statistiky</h2><div class="tiles"><div><b>${done}/${tot}</b><span>variant naučeno</span></div><div><b>${mast}/${chTot}</b><span>kapitol na 100 %</span></div><div><b>${acc==null?'–':acc+' %'}</b><span>pokusů bez chyby</span></div><div><b>${n}</b><span>zahraných variant zpaměti</span></div><div><b>${err}</b><span>chyb celkem</span></div><div><b>${due}</b><span>k opakování</span></div><div><b>${streak}</b><span>${streak===1?'den':'dní'} v řadě</span></div><div><b>${fmtH(tmSum(store.tm))}</b><span>v aplikaci celkem</span></div><div><b>${fmtH(tmSum(store.tm,7))}</b><span>v aplikaci za 7 dní</span></div></div></div>
 <div class="profCard"><h2>Bílé vs. černé</h2><div class="sideCmp"><div class="w"><b>${W.pct} %</b><span>Za bílé · ${W.d}/${W.t} variant${W.acc!=null?` · ${W.acc} % bez chyby`:''}</span></div><div class="b"><b>${B.pct} %</b><span>Za černé · ${B.d}/${B.t} variant${B.acc!=null?` · ${B.acc} % bez chyby`:''}</span></div></div></div>
 <div class="profCard"><h2>Doporučení</h2><ul class="lst tips">${tips.map(tipLi).join('')||'<li>Zatím nic – hraj a doporučení se objeví.</li>'}</ul></div>
 <div class="twoCol"><div class="profCard"><h2>Co ti jde</h2>${strong.length||bestCh.length?`<ul class="lst good">${bestCh.map(x=>`<li><b>${x.ch.t}</b><small>${x.c.title} · kapitola na ${x.p} %</small></li>`).join('')}${strong.map(x=>li(x,`umíš ji dlouhodobě${x.p.n?` · ${x.p.ok||0}/${x.p.n} bez chyby`:''}`)).join('')}</ul>`:'<p class="profEmpty">Tady se objeví varianty, které umíš nejlíp. Zahraj pár variant zpaměti.</p>'}</div>
 <div class="profCard"><h2>Co zlepšit</h2>${weak.length||weakCh.length?`<ul class="lst bad">${weakCh.map(x=>`<li><b>${x.ch.t}</b><small>${x.c.title} · kapitola teprve na ${x.p} %</small><button data-goto="#${x.c.id}">Otevřít kurz</button></li>`).join('')}${weak.map(x=>li(x,x.p.err?`${x.p.err} ${x.p.err===1?'chyba':x.p.err<5?'chyby':'chyb'} v ${x.p.n||1} ${(x.p.n||1)===1?'pokusu':'pokusech'}`:'zatím nezahraná zpaměti')).join('')}</ul>`:'<p class="profEmpty">Zatím žádné slabiny. 👍</p>'}</div></div>
 <div class="profCard"><h2>Aktivita – posledních 14 dní</h2><div class="act14">${days.map(([d,v])=>`<div class="${v?'on':''}" style="height:${Math.max(6,v/mx*100)}%" title="${d}: ${v} variant"></div>`).join('')}</div><div class="actLbl"><span>před 2 týdny</span><span>dnes</span></div></div>
 <div class="profCard"><h2>Rozbor hráče</h2><p class="profEmpty" style="margin-bottom:10px">Ulož si jméno z chess.com. Rozbor stáhne tvoje partie a ukáže, jak ti jdou zahájení a kde chybuješ.</p>${store.ccSum&&store.ccName?(()=>{const m=store.ccSum;return `<div class="tiles rzTiles ccSum"><div><b>${m.n}</b><span>partií v posledním rozboru</span></div><div><b>${m.p} %</b><span>výher</span></div>${m.b?`<div><b>${escH(m.b[0])}</b><span>nejčastěji proti tobě za černé (${m.b[1]}×)</span></div>`:''}${m.w?`<div><b>${escH(m.w[0])}</b><span>nejčastěji za bílé (${m.w[1]}×)</span></div>`:''}</div>${m.wk?`<p class="profEmpty">Slabé místo: <b>${escH(m.wk)}</b></p>`:''}`;})():''}<form class="titleForm" id="ccForm"><input id="ccIn" maxlength="40" placeholder="Jméno na chess.com" autocapitalize="none" autocorrect="off" spellcheck="false" value="${escH(store.ccName||'')}"><button class="btn">Uložit</button><button class="btn primary" type="button" id="ccGo">Rozebrat</button></form></div>
 <div class="profCard"><h2>Kurzy</h2>${S.map(x=>`<div class="crsRow"><div><b>${x.c.title}</b><small>${x.c.side==='w'?'za bílé':'za černé'} · ${x.done}/${x.total} variant${x.due?` · ${x.due} k opakování`:''}${x.acc!=null?` · ${x.acc} % bez chyby`:''}</small></div><div class="bar"><i style="width:${x.pct}%"></i></div><a href="#${x.c.id}">${x.pct} %</a></div>`).join('')}</div>
 </div>`;
 $('home').innerHTML=h;renderSide();
 $('pLvl').onclick=openLvl;{const bg=document.querySelector('.profHead .big');if(bg){bg.style.cursor='pointer';bg.title='Všechny levely';bg.onclick=openLvl;}const br=document.querySelector('.profHead .bar');if(br){br.style.cursor='pointer';br.onclick=openLvl;}}$('pTitle').onclick=()=>{const f=$('titleForm');f.hidden=!f.hidden;if(!f.hidden)$('titleIn').focus();};
 wireAppCard();$('ccForm').onsubmit=e=>{e.preventDefault();const v=$('ccIn').value.trim().toLowerCase().replace(/^@/,'').slice(0,40);if(v)store.ccName=v;else delete store.ccName;save();$('ccIn').value=v;const b=$('ccForm').querySelector('button');b.textContent='Uloženo';setTimeout(()=>{b.textContent='Uložit';},1500);};$('ccGo').onclick=()=>{const v=$('ccIn').value.trim().toLowerCase().replace(/^@/,'');if(v&&v!==store.ccName){store.ccName=v;save();}go(v?'#rozbor/'+encodeURIComponent(v):'#rozbor');};
 $('titleForm').onsubmit=e=>{e.preventDefault();const v=$('titleIn').value.trim().slice(0,40);if(v)store.lvlTitle=v;else delete store.lvlTitle;save();renderLvl();renderProfile();};
 $('titleClear').onclick=()=>{delete store.lvlTitle;save();renderLvl();renderProfile();};const po=document.getElementById('pOut');if(po)po.onclick=async()=>{await supaLogout();};}
/* ---------- vývojářská stránka (jen účty s is_admin v Supabase; data hlídá server) ---------- */
const fmtD=t=>t?new Date(t).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'–';
function progSummary(d){if(!d||!d.prog)return{xp:0,per:[],done:0};let done=0;const per=COURSES.map(c=>{const p=d.prog[c.id]||{};const ids=new Set(c.chapters.flatMap(ch=>ch.lines.map(l=>l.id)));
  let n=0;for(const id in p)if(ids.has(id)&&(p[id].box||0)>=2)n++;done+=n;return{t:c.title,n,of:ids.size};});return{xp:d.xp||0,per,done};}
async function openDev(){const pk=$('picker');if(!(SYNC.admin&&getTok())){if(getTok()&&!(SYNC.be&&SYNC.be.kind==='supa'))return;/* ještě se ověřuje účet – #dev se otevře po přihlášení */if(location.hash==='#dev')history.replaceState(null,'',location.pathname+location.search+pageHash());return;}
 if(location.hash!=='#dev')history.replaceState(null,'',location.pathname+location.search+'#dev');
 const close=()=>{pk.hidden=true;history.replaceState(null,'',location.pathname+location.search+pageHash());};
 pk.innerHTML='<div class="pkCard dev"><h2>Vývojářská stránka</h2><p>Načítám…</p></div>';pk.hidden=false;
 let list=[];try{list=await rpc('trener_admin_players',{p_token:getTok()})||[];}catch(e){pk.innerHTML=`<div class="pkCard dev"><h2>Vývojářská stránka</h2><p>${/forbidden/.test(e.message||'')?'Tenhle účet nemá přístup.':escH(AUTH_ERR(e.message||String(e)))}</p><div class="row"><button class="btn" id="devClose">Zavřít</button></div></div>`;pk.onclick=ev=>{if(ev.target===pk||ev.target.id==='devClose')close();};return;}
 const now=Date.now(),wk=list.filter(p=>p.updated_at&&now-new Date(p.updated_at)<7*864e5).length;
 let tot=0;COURSES.forEach(c=>c.chapters.forEach(ch=>tot+=ch.lines.length));
 const rows=list.map(p=>{const s=progSummary(p.data);return `<tr><td><b>${escH(p.username)}</b>${p.is_admin?' <small>(správce)</small>':''}<br><small>od ${fmtD(p.created_at)}</small></td><td>${s.xp}<br><small>Lv ${lvlOf(s.xp).n} ${lvlOf(s.xp).name}</small></td><td>${s.done}/${tot}<br><small>${s.per.filter(x=>x.n).map(x=>`${escH(x.t)} ${x.n}/${x.of}`).join(' · ')||'–'}</small></td><td>${fmtH(tmSum((p.data||{}).tm))}<br><small>7 dní: ${fmtH(tmSum((p.data||{}).tm,7))}</small></td><td>${fmtD(p.updated_at)}</td><td>${fmtD(p.last_login)}</td>
  <td class="a"><button class="lnk" data-msg="${escH(p.username)}">Poslat zprávu</button> <button class="lnk" data-pw="${escH(p.username)}">Nové heslo</button>${p.username===SYNC.user?'':` <button class="lnk" data-del="${escH(p.username)}">Smazat</button>`}</td></tr>`;}).join('');
 pk.innerHTML=`<div class="pkCard dev"><h2>Vývojářská stránka</h2>
  <div class="devGrid"><div><b>${list.length}</b>hráčů</div><div><b>${wk}</b>aktivních za 7 dní</div><div><b>${tot}</b>variant celkem</div><div><b>${COURSES.length}</b>kurzů</div></div>
  <h3>Hráči</h3><div class="devWrap"><table class="devTbl"><thead><tr><th>Hráč</th><th>XP / level</th><th>Hotovo</th><th>Čas ve hře</th><th>Poslední uložení</th><th>Poslední přihlášení</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7">Zatím nikdo.</td></tr>'}</tbody></table></div>
  <p class="devMsg" id="devMsg" role="status"></p>
  <h3>Odpovědi hráčů</h3><div class="devInbox" id="devInbox">Načítám…</div>
  <h3>Tento prohlížeč</h3><div class="devGrid"><div><b>${escH(SYNC.state)}</b>stav ukládání</div><div><b>${store.xp||0}</b>moje XP</div><div><b>${(JSON.stringify(store).length/1024).toFixed(1)} kB</b>velikost postupu</div></div>
  <div class="row"><button class="btn" id="devReload">Obnovit</button><button class="btn" id="devClose">Zavřít</button></div></div>`;
 rpc('trener_admin_inbox',{p_token:getTok()}).then(ib=>{const el=document.getElementById('devInbox');if(!el)return;ib=ib||[];el.innerHTML=ib.length?ib.slice(0,30).map(x=>`<div class="devIn${x.seen?'':' new'}"><div><b>${escH(x.from)}</b> <small>${fmtD(x.at)}${x.seen?'':' · nové'}</small></div><p>${escH(x.body)}</p>${x.re?`<small>na: „${escH(x.re)}“</small>`:''}<button class="lnk" data-msg="${escH(x.from)}">Odpovědět</button></div>`).join(''):'<p class="profEmpty">Zatím žádné odpovědi.</p>';}).catch(()=>{const el=document.getElementById('devInbox');if(el)el.textContent='Odpovědi se nepodařilo načíst.';});
 pk.onclick=async ev=>{const t=ev.target,msg=document.getElementById('devMsg');if(t===pk||t.id==='devClose'){close();return;}if(t.id==='devReload'){openDev();return;}
  try{if(t.dataset.pw){const np=prompt(`Nové heslo pro „${t.dataset.pw}“ (aspoň 6 znaků):`);if(!np)return;await rpc('trener_admin_set_password',{p_token:getTok(),p_user:t.dataset.pw,p_pass:np});msg.textContent=`Heslo pro ${t.dataset.pw} změněno ✓`;}
   if(t.dataset.msg){const tx=prompt(`Zpráva pro „${t.dataset.msg}“ (ukáže se mu přes celou obrazovku):`);if(!tx||!tx.trim())return;await rpc('trener_admin_message',{p_token:getTok(),p_user:t.dataset.msg,p_body:tx.trim().slice(0,500)});msg.textContent=`Zpráva pro ${t.dataset.msg} odeslána. Ukáže se do 20 sekund, jakmile má aplikaci otevřenou.`;}
   if(t.dataset.del){if(!confirm(`Opravdu smazat hráče „${t.dataset.del}“ i s celým postupem? Nejde to vrátit.`))return;await rpc('trener_admin_delete',{p_token:getTok(),p_user:t.dataset.del});openDev();}
  }catch(e){if(msg)msg.textContent=AUTH_ERR(e.message||String(e));}};}
const b64e=s=>btoa(unescape(encodeURIComponent(s))),b64d=s=>decodeURIComponent(escape(atob(s)));
function backupCode(){return 'SACH1.'+b64e(JSON.stringify({xp:store.xp,prog:store.prog,mastered:store.mastered,act:store.act,tm:store.tm,pz:store.pz,upd:store.upd}));}
function importCode(c){c=(c||'').trim();if(!c.startsWith('SACH1.'))throw 0;const r=JSON.parse(b64d(c.slice(6)));if(!r||typeof r.prog!=='object')throw 0;
 applyMerged(mergeStores(store,Object.assign({},store,r,{upd:0})));save();}
const P=()=>store.prog[course.id];
function stateOf(l){const p=P()[l.id];if(!p)return'new';if((p.box||0)<2)return p.lapse||(p.ok||0)>0?'lapsed':'learning';return p.due<=Date.now()?'due':'done';}
const isDone=l=>{const s=stateOf(l);return s==='done'||s==='due';};
const ST={new:['Nová','Ještě jsi ji nehrál'],learning:['Procvič','Prošel jsi ji v režimu Učit se, teď ji zahraj zpaměti'],due:['Opakovat','Naučená, ale je čas ji zopakovat'],done:['Hotovo','Zahraná zpaměti bez chyby'],lapsed:['Zapomenutá','Už jsi ji uměl, ale udělal jsi chybu – zahraj ji znovu bez chyby']};
const STI={new:'',learning:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20V2z"/></svg>',due:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 6V3L8 7l4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z"/></svg>',done:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',lapsed:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 5h2.6l-.4 9h-1.8zM12.3 16.2a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z"/></svg>'};
const days=n=>n+(n===1?' den':n<5?' dny':' dní');


/* ---------- easter egg: T1 mód (Tyler1 zahrál krávu na PogChamps 5) ---------- */
const COW_SVG='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 20c-6-1-9-6-8-10 4 1 8 3 10 6M50 20c6-1 9-6 8-10-4 1-8 3-10 6" fill="#f3efe6" stroke="#2b2620" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 22c0-8 7-12 16-12s16 4 16 12v10c0 4-2 7-5 9v6H21v-6c-3-2-5-5-5-9z" fill="#fbf8f1" stroke="#2b2620" stroke-width="2.6" stroke-linejoin="round"/><path d="M22 14c3 0 5 3 4 6s-5 3-7 1 0-7 3-7zM42 24c3 1 4 4 2 6s-5 1-5-2 1-4 3-4z" fill="#2b2620"/><ellipse cx="32" cy="46" rx="13" ry="8" fill="#f2b8b0" stroke="#2b2620" stroke-width="2.6"/><circle cx="27" cy="46" r="2" fill="#2b2620"/><circle cx="37" cy="46" r="2" fill="#2b2620"/><circle cx="25" cy="31" r="2.4" fill="#2b2620"/><circle cx="39" cy="31" r="2.4" fill="#2b2620"/></svg>';
const T1W=['ČISTÁ KRÁVA','REFORMED TAH','BÚŮŮŮ!','ALFA KRÁVA','GIGA TAH','KRÁVA NEZNÁ STRACH','ŽÁDNÝ TILT'];
let T1T=null;function t1Shake(){if(!store.t1||matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.body.classList.remove('t1shake');void document.body.offsetWidth;document.body.classList.add('t1shake');clearTimeout(T1T);T1T=setTimeout(()=>document.body.classList.remove('t1shake'),600);}
function t1Moo(){if(!store.sound)return;const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='sawtooth';f.type='lowpass';f.frequency.value=900;
 const t=a.currentTime;o.frequency.setValueAtTime(150,t);o.frequency.linearRampToValueAtTime(190,t+.25);o.frequency.linearRampToValueAtTime(120,t+1.1);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.12);g.gain.setValueAtTime(.16,t+.8);g.gain.linearRampToValueAtTime(0,t+1.2);o.connect(f);f.connect(g);g.connect(a.destination);o.start(t);o.stop(t+1.25);}
function t1Toast(on){const d=document.createElement('div');d.className='t1toast';d.innerHTML=on?'<b>T1 MÓD</b><span>Tyler1 by byl hrdý. Kráva aktivována, tilt zakázán.</span>':'<b>T1 mód vypnut</b><span>Zpátky k normálnímu šachu.</span>';document.body.appendChild(d);setTimeout(()=>d.remove(),2600);}
function applyT1(){document.body.classList.toggle('t1',!!store.t1);if(!store.t1)document.body.classList.remove('t1shake');}
function toggleT1(){store.t1=!store.t1;if(store.t1&&store.alien){store.alien=false;applyAlien();}save();applyT1();t1Toast(store.t1);if(store.t1){t1Moo();t1Shake();crazyWin();}if(!$('home').hidden)renderHome();}
let t1buf='';document.addEventListener('keydown',e=>{if(e.target&&/input|textarea/i.test(e.target.tagName))return;if(e.key&&e.key.length===1){t1buf=(t1buf+e.key.toLowerCase()).slice(-6);if(t1buf==='tyler1'){t1buf='';toggleT1();}}});
let t1taps=[];document.addEventListener('pointerdown',e=>{const pic=e.target.closest&&e.target.closest('.cCard[data-c="cow"] .pic, .courseBtn[data-c="cow"] .ic, .crsIcon[data-c="cow"]');if(!pic)return;const now=Date.now();t1taps=t1taps.filter(t=>now-t<2500);t1taps.push(now);if(t1taps.length>=5){t1taps=[];toggleT1();}},true);

/* ---------- CRAZY módy: T1 (kráva) a ALIEN (Witty Alien, BRILIAAANT!) ---------- */
const ALW=['BRILIAAANT!!','ALIEN TAH','WITTY!!','ZE VESMÍRU','MIMOZEMSKÁ PŘÍPRAVA','GALAKTICKÉ!','UFO SCHVALUJE','BEAM ME UP'];
const T1HYPE=['BÚŮŮŮ!!','KRÁVA!!','MŮŮŮ GIGA','ALFA TAH','CHAD MOVE','T1 APPROVED','REFORMED!!','NO TILT'];
const crazy=()=>store.alien?'alien':store.t1?'t1':null;
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function ufoSound(){if(!store.sound)return;const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),l=a.createOscillator(),lg=a.createGain();o.type='sine';l.frequency.value=9;lg.gain.value=60;l.connect(lg).connect(o.frequency);
 const t=a.currentTime;o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(1300,t+.35);o.frequency.exponentialRampToValueAtTime(500,t+.8);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.85);o.connect(g).connect(a.destination);o.start(t);l.start(t);o.stop(t+.9);l.stop(t+.9);}
/* efekty bez emoji: částice na plátně (svítí), rázové vlny, paprsek, záblesky */
const FX={c:null,x:null,p:[],raf:0,d:1};
function fxCanvas(){if(!FX.c){const c=document.createElement('canvas');c.id='fxC';fxLayer().appendChild(c);FX.c=c;FX.x=c.getContext('2d');const rs=()=>{FX.d=Math.min(2,devicePixelRatio||1);c.width=innerWidth*FX.d;c.height=innerHeight*FX.d;};rs();addEventListener('resize',rs);}return FX.x;}
function fxBurst(x,y,o){if(RM())return;fxCanvas();const n=Math.round((o.n||60)*(document.documentElement.classList.contains('eco')?.45:1));for(let i=0;i<n;i++){const a=o.ang!=null?o.ang+(Math.random()-.5)*(o.spread||1):Math.random()*Math.PI*2,v=(o.v||6)*(.3+Math.random()*.9);
 FX.p.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:o.g==null?.12:o.g,life:0,max:(o.life||60)*(.6+Math.random()*.7),r:(o.r||3)*(.5+Math.random()),col:o.cols[i%o.cols.length],dr:o.drag||.965,tr:o.trail,tw:o.twinkle});}
 if(!FX.raf)FX.raf=requestAnimationFrame(fxTick);}
function fxTick(){const x=FX.x,c=FX.c;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.setTransform(FX.d,0,0,FX.d,0,0);x.globalCompositeOperation='lighter';
 FX.p=FX.p.filter(p=>{p.life++;if(p.life>p.max)return false;p.vx*=p.dr;p.vy=p.vy*p.dr+p.g;p.x+=p.vx;p.y+=p.vy;let k=1-p.life/p.max;if(p.tw)k*=.55+.45*Math.sin(p.life*.9+p.r*7);x.globalAlpha=Math.max(0,k);x.strokeStyle=x.fillStyle=p.col;
  if(p.tr){x.lineWidth=Math.max(.6,p.r*k);x.lineCap='round';x.beginPath();x.moveTo(p.x-p.vx*p.tr,p.y-p.vy*p.tr);x.lineTo(p.x,p.y);x.stroke();}else{x.beginPath();x.arc(p.x,p.y,p.r*k+.4,0,7);x.fill();}return true;});
 x.globalAlpha=1;FX.raf=FX.p.length?requestAnimationFrame(fxTick):0;if(!FX.raf){x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);}}
function fxLayer(){let l=document.getElementById('fxL');if(!l){l=document.createElement('div');l.id='fxL';document.body.appendChild(l);}return l;}
function fxDiv(cls,css,ms){const d=document.createElement('div');d.className=cls;for(const k in css)d.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),css[k]);fxLayer().appendChild(d);setTimeout(()=>d.remove(),ms);return d;}
function fxRing(x,y,col,size,ms,delay){fxDiv('fxRing',{left:x+'px',top:y+'px',width:size+'px',height:size+'px','--c':col,animationDelay:(delay||0)+'ms'},(ms||800)+(delay||0)).style.animationDuration=(ms||800)+'ms';}
function fxFlash(x,y,col,ms){fxDiv('fxFlash',{'--x':x+'px','--y':y+'px','--c':col,animationDuration:(ms||500)+'ms'},ms||500);}
function sqCenter(sq){if(sq==null||!SQ[sq])return null;const r=SQ[sq].getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width};}
function boardFx(cls,ms){const bd=$('board');if(!bd||RM())return;bd.classList.remove(cls);void bd.offsetWidth;bd.classList.add(cls);setTimeout(()=>bd.classList.remove(cls),ms);}
function screenShake(ms){if(RM())return;const t=document.getElementById('trainer');if(!t)return;t.classList.remove('fxShake');void t.offsetWidth;t.style.setProperty('--shk',ms+'ms');t.classList.add('fxShake');setTimeout(()=>t.classList.remove('fxShake'),ms);}
const ALC=['#3cff7a','#9dffb9','#00e5ff','#c9fff0','#ffffff','#7cf8ff'],T1C=['#ff3b2f','#ff7a1a','#ffc21a','#fff1a8','#ff1f4b'];
function alienBrilliant(sq){const p=sqCenter(sq);if(!p||RM())return;const w=p.w;
 /* tažný paprsek UFO shora na pole */
 fxDiv('fxBeam',{left:p.x+'px',top:'0px',height:p.y+w*.5+'px','--w':w*1.6+'px'},1900);
 fxFlash(p.x,p.y,'rgba(60,255,122,.55)',900);
 [0,140,300].forEach((d,i)=>fxRing(p.x,p.y,i===1?'#00e5ff':'#3cff7a',w*(5+i*2),900,d));
 fxBurst(p.x,p.y,{n:90,v:9,g:.05,life:70,r:2.6,cols:ALC,trail:3,drag:.95});
 setTimeout(()=>fxBurst(p.x,p.y,{n:70,v:3.5,g:-.04,life:90,r:2.2,cols:ALC,twinkle:1,drag:.98}),260);
 /* jiskry stoupající paprskem */
 for(let i=0;i<5;i++)setTimeout(()=>fxBurst(p.x,p.y,{n:14,v:5,ang:-Math.PI/2,spread:.35,g:-.03,life:60,r:2,cols:ALC,trail:2}),150+i*170);
 boardFx('alGlitch',700);screenShake(380);}
function t1Hit(sq,big){const p=sqCenter(sq);if(!p||RM())return;const w=p.w;
 fxFlash(p.x,p.y,'rgba(255,80,20,.5)',450);fxRing(p.x,p.y,'#ff3b2f',w*(big?7:4.5),600);if(big)fxRing(p.x,p.y,'#ffc21a',w*9,700,120);
 fxBurst(p.x,p.y,{n:big?110:60,v:big?11:8,ang:-Math.PI/2,spread:2.4,g:.28,life:55,r:2.8,cols:T1C,trail:2.5,drag:.97});
 fxBurst(p.x,p.y,{n:big?50:25,v:2.2,ang:-Math.PI/2,spread:1.2,g:-.09,life:50,r:5,cols:['#ff3b2f','#ff7a1a','#ffb01a'],drag:.96});
 boardFx('t1Punch',380);screenShake(big?520:300);}
function crazyBurst(sq,text,cls){const wrap=document.querySelector('#board');if(!wrap)return;const host=wrap.parentElement;host.style.position='relative';
 const b=document.createElement('div');b.className='crzWord '+cls;b.textContent=text;b.dataset.t=text;b.style.setProperty('--rot',(Math.random()*24-12)+'deg');host.appendChild(b);setTimeout(()=>b.remove(),cls.includes('brl')?2100:1500);}
function crazyHit(sq,kind){const m=crazy();if(!m)return;if(m==='alien'){const brill=kind==='best';crazyBurst(sq,brill?'BRILIAAANT!!':ALW[Math.floor(Math.random()*ALW.length)],brill?'al brl':'al');ufoSound();
  if(brill){alienBrilliant(sq);if(SQ[sq]){SQ[sq].classList.add('brill');setTimeout(()=>SQ[sq].classList.remove('brill'),2400);}}else{const p=sqCenter(sq);if(p&&!RM()){fxRing(p.x,p.y,'#3cff7a',p.w*3.5,600);fxBurst(p.x,p.y,{n:35,v:5,g:.04,life:50,r:2,cols:ALC,twinkle:1});}}}
 else{const big=kind==='best';crazyBurst(sq,T1HYPE[Math.floor(Math.random()*T1HYPE.length)],'t1');t1Hit(sq,big);if(big||Math.random()<.5)t1Moo();}
 const bd=$('board');bd.classList.remove('crzPulse');void bd.offsetWidth;bd.classList.add('crzPulse');}
function crazyMiss(sq){const m=crazy();if(!m)return;crazyBurst(sq,m==='alien'?'ABDUCTED':'TILT!!!','bad');if(RM())return;
 const p=sqCenter(sq);if(p){fxFlash(p.x,p.y,m==='alien'?'rgba(120,0,255,.45)':'rgba(255,0,0,.5)',500);fxBurst(p.x,p.y,{n:40,v:5,g:.2,life:45,r:2.4,cols:m==='alien'?['#a35cff','#5c2bff','#ffffff']:['#ff0000','#880000','#ffffff'],trail:2});}
 boardFx(m==='alien'?'alGlitch':'t1Tilt',600);screenShake(500);}
function crazyWin(){const m=crazy();if(!m)return;crazyBurst(null,m==='alien'?'BRILIAAANT VARIANTA!!':'ČISTÁ KRÁVA!!',m==='alien'?'al big brl':'t1 big');if(m==='alien')ufoSound();else t1Moo();
 if(RM())return;const W=innerWidth,H=innerHeight,cols=m==='alien'?ALC:T1C;
 fxFlash(W/2,H*.4,m==='alien'?'rgba(60,255,122,.4)':'rgba(255,60,20,.45)',900);
 if(m==='alien'){for(let i=0;i<9;i++)setTimeout(()=>{const x=W*(.12+Math.random()*.76),y=H*(.12+Math.random()*.45);fxRing(x,y,i%2?'#00e5ff':'#3cff7a',160+Math.random()*120,800);fxBurst(x,y,{n:80,v:7,g:.06,life:75,r:2.4,cols,trail:2.5,drag:.955});},i*230);
  fxDiv('fxBeam',{left:W/2+'px',top:'0px',height:H+'px','--w':Math.min(W*.5,420)+'px'},1900);}
 else{for(let i=0;i<14;i++)setTimeout(()=>{const x=W*(i/13);fxBurst(x,H+10,{n:50,v:21,ang:-Math.PI/2,spread:.5,g:.3,life:60,r:3,cols,trail:3,drag:.985});},i*60);
  for(let i=0;i<4;i++)setTimeout(()=>screenShake(450),i*450);fxDiv('fxFire',{},2200);}}
function applyAlien(){document.body.classList.toggle('alien',!!store.alien);}
function alToast(on){const d=document.createElement('div');d.className='t1toast al';d.innerHTML=on?'<b>ALIEN MÓD</b><span>Witty by řekl: BRILIAAANT! Každý dobrý tah je ze vesmíru.</span>':'<b>Alien mód vypnut</b><span>Přistání na Zemi.</span>';document.body.appendChild(d);setTimeout(()=>d.remove(),2600);}
function toggleAlien(){store.alien=!store.alien;if(store.alien&&store.t1){store.t1=false;applyT1();}save();applyAlien();alToast(store.alien);if(store.alien){ufoSound();crazyWin();}if(!$('home').hidden)renderHome();}
let altaps=[];document.addEventListener('pointerdown',e=>{const pic=e.target.closest&&e.target.closest('.cCard[data-c="alien"] .pic, .courseBtn[data-c="alien"] .ic, .crsIcon[data-c="alien"]');if(!pic)return;const now=Date.now();altaps=altaps.filter(t=>now-t<2500);altaps.push(now);if(altaps.length>=5){altaps=[];toggleAlien();}},true);
let albuf='';document.addEventListener('keydown',e=>{if(e.target&&/input|textarea/i.test(e.target.tagName))return;if(e.key&&e.key.length===1){albuf=(albuf+e.key.toLowerCase()).slice(-5);if(albuf==='alien'){albuf='';toggleAlien();}}});
/* ---------- Sound ---------- */
let AC=null;
function ac(){if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();}if(AC.state==='suspended')AC.resume();return AC;}
function knock(t0,freq,gain,dur,q){const a=ac();if(!a)return;const n=Math.floor(a.sampleRate*dur),buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,5);
 const s=a.createBufferSource();s.buffer=buf;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q||1.4;
 const g=a.createGain();g.gain.value=gain;s.connect(f).connect(g).connect(a.destination);s.start(a.currentTime+t0);}
function tone(t0,freq,dur,gain,type,to){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';
 const t=a.currentTime+t0;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
 g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+0.02);}
let started=false;
const SFX={start(){tone(0,523,.14,.07);tone(.09,784,.2,.07);},move(){knock(0,1500,1.1,.06,1.1);knock(0,420,.8,.05,.9);},capture(){knock(0,1900,1.3,.05,1);knock(.045,1100,1.1,.07,1.1);knock(.045,380,.8,.06,.8);},
 castle(){this.move();setTimeout(()=>this.move(),110);},check(){this.move();tone(.02,1320,.12,.05,'triangle');},wrong(){tone(0,220,.22,.18,'triangle',120);},
 win(){[523,659,784,1047].forEach((f,i)=>tone(i*.09,f,.35,.12));}};
function sfx(n){if(store.sound)try{SFX[n]()}catch(e){}}

/* ---------- DOM ---------- */
const $=id=>document.getElementById(id);
const boardEl=$('board'),sqsEl=$('sqs'),pcsEl=$('pcs'),fxEl=$('fx'),arrowsEl=$('arrows');
const THEMES={wood:['#e8d3ab','#a6774c'],green:['#ebecd0','#739552'],blue:['#dee3e6','#8ca2ad'],purple:['#e8e0f0','#8b75a8']};
/* další šachovnice jen pro stránku Šachovnice a figurky (#sachovnice) – v horní liště zůstávají 4 nejběžnější */
const THEMES_X={
 walnut:['#dcc9a3','#7d5638','Ořech'],marble:['#e9e7e1','#9e9b93','Mramor'],ice:['#e3eef3','#6f97ad','Led'],coral:['#f4e3d7','#c2786a','Korál'],night:['#a7b1b8','#4b5963','Noc'],olive:['#e6e3c7','#8a8a4a','Oliva'],tournament:['#f0f0e6','#3f7a5a','Turnaj'],candy:['#fbe3ef','#d980a8','Bonbon'],
 brownclassic:['#f0d9b5','#b58863','Klasická hnědá'],ocean:['#d6ecf0','#2f7d95','Oceán'],sand:['#f3e7c9','#c9a45c','Písek'],forest:['#dfe8cf','#4f7a3a','Les'],lavender:['#efe8f7','#9a86c2','Levandule'],mint:['#e6f5ee','#5fae8c','Máta'],cherry:['#f7e1e1','#a8423f','Třešeň'],slate:['#d9dde2','#5b6673','Břidlice'],
 coffee:['#e9d8c4','#6f4e37','Káva'],tangerine:['#fde9d4','#e0823a','Mandarinka'],sky:['#e8f2fb','#5b9bd5','Nebe'],rose:['#fbe9ec','#c9707e','Růže'],pistachio:['#eef3dc','#93b05a','Pistácie'],steel:['#e1e4e8','#7a8794','Ocel'],plum:['#eadcea','#7b4b7a','Švestka'],teal:['#dff0ee','#2b8a83','Petrolej'],
 butter:['#fff5cc','#d4b44a','Máslo'],grape:['#e7dff5','#5c3d8f','Hrozen'],peach:['#ffe9dc','#e8987a','Broskev'],moss:['#e4e8d4','#6b7a3a','Mech'],denim:['#dfe6f0','#3b5b8c','Džíny'],rust:['#f2dccd','#a0522d','Rez'],ash:['#ececec','#8c8c8c','Popel'],ink:['#d9d9d9','#2b2b2b','Inkoust'],
 bw:['#ffffff','#000000','Černobílá'],paper:['#faf7f0','#d6cdbb','Papír z knihy'],newspaper:['#efece4','#b9b4a8','Noviny'],gold:['#f6e7b0','#b8892b','Zlato'],silver:['#f1f3f5','#a9b0b8','Stříbro'],bronze:['#e9cfae','#9c6b3c','Bronz'],jade:['#dff2e4','#3e8e63','Nefrit'],ruby:['#f6dfe2','#9b1c31','Rubín'],
 sapphire:['#dfe7f7','#1f4e9c','Safír'],emerald:['#dbf2e3','#127a4a','Smaragd'],amethyst:['#efe2f6','#7d4aa8','Ametyst'],
 neon:['#4a4a7a','#2d0b4d','Neon','#4a4a7a','radial-gradient(circle,#ff2bd6 0 14%,#2d0b4d 55%)'],
 matrix:['#0b1f0e','#0f3d17','Matrix','repeating-linear-gradient(0deg,#0b1f0e 0 3px,#0e2a12 3px 4px)','repeating-linear-gradient(0deg,#0f3d17 0 3px,#14571f 3px 4px)'],
 lava:['#ffd27a','#c2361b','Láva','linear-gradient(135deg,#ffe29a,#ffb347)','linear-gradient(135deg,#e2491f,#8a1e0b)'],
 rainbow:['#ffffff','#999999','Duha','#fdfdfd','linear-gradient(135deg,#ff6b6b,#feca57,#48dbfb,#1dd1a1,#5f27cd)'],
 marbleReal:['#eeeeea','#8f8b83','Mramor s žilkami','linear-gradient(120deg,#f4f3ef 40%,#d9d6cf 45%,#f4f3ef 50%)','linear-gradient(120deg,#9b978f 40%,#6f6b64 45%,#9b978f 50%)'],
 woodgrain:['#e3c79a','#9a6a3f','Dřevo s letokruhy','repeating-linear-gradient(95deg,#e8cfa4 0 3px,#dcbd8c 3px 5px)','repeating-linear-gradient(95deg,#a2724a 0 3px,#8e5f37 3px 5px)'],
 camo:['#b5b58a','#5b6b3a','Maskáč','radial-gradient(circle at 30% 30%,#c5c49a 30%,#a5a57a 31%)','radial-gradient(circle at 60% 60%,#6b7b45 30%,#4b5a2e 31%)'],
 halloween:['#ffcf8a','#3d1f4b','Halloween','#ffcf8a','linear-gradient(135deg,#ff7b00,#3d1f4b)'],
 christmas:['#f4f4f4','#b3001b','Vánoce','#fafafa','repeating-linear-gradient(45deg,#b3001b 0 6px,#e4002b 6px 12px)'],
 snow:['#ffffff','#bcd6ea','Sníh','radial-gradient(circle,#fff 30%,#eef6fc 31%)','radial-gradient(circle,#d6e8f5 20%,#a9c8e0 60%)'],
 grass:['#c8e6a0','#5b9a3a','Tráva','repeating-linear-gradient(90deg,#cde9a5 0 4px,#c2e094 4px 6px)','repeating-linear-gradient(90deg,#62a33f 0 4px,#558f35 4px 6px)'],
 brick:['#e8d5c4','#a2482f','Cihly','#ead8c8','repeating-linear-gradient(0deg,#a2482f 0 40%,#8b3c27 40% 50%)'],
 stripes:['#ffffff','#2b2b2b','Proužky','repeating-linear-gradient(45deg,#fff 0 4px,#eee 4px 8px)','repeating-linear-gradient(45deg,#2b2b2b 0 4px,#444 4px 8px)'],
 dots:['#fff8e7','#e06c5a','Puntíky','radial-gradient(#f2d9b8 18%,#fff8e7 20%) 0 0/50% 50%','radial-gradient(#ffb3a7 18%,#e06c5a 20%) 0 0/50% 50%'],
 barbie:['#ffd6ec','#e0218a','Barbie'],hacker:['#0d0d0d','#00ff41','Hacker'],sunset:['#ffe0b2','#ff6f61','Západ slunce','linear-gradient(180deg,#ffe8c2,#ffd09b)','linear-gradient(180deg,#ff8a65,#c2185b)'],
 aurora:['#dff7f2','#2a4365','Polární záře','linear-gradient(135deg,#e6fffa,#c3dafe)','linear-gradient(135deg,#2c7a7b,#553c9a)'],
 chocolate:['#d7b899','#4b2e1e','Čokoláda'],vanilla:['#fffaf0','#e6d3a3','Vanilka'],watermelon:['#ffe3e3','#2f8f46','Meloun','#ff6b81','#2f8f46'],
 invisible:['transparent','transparent','Neviditelná 🙈','repeating-conic-gradient(#0000 0 25%,#0000 0 50%)','repeating-conic-gradient(#0000 0 25%,#0000 0 50%)']};
Object.assign(THEMES,Object.fromEntries(Object.entries(THEMES_X).map(([k,v])=>[k,[v[0],v[1],v[3],v[4]]])));
const THEME_NAMES={wood:'Dřevo',green:'Zelená',blue:'Modrošedá',purple:'Fialová',...Object.fromEntries(Object.entries(THEMES_X).map(([k,v])=>[k,v[2]]))};
const PIECE_SETS={cburnett:['Klasické','Colin M. L. Burnett, GPLv2+'],merida:['Merida','Armando H. Marroquin, GPLv2+'],chessnut:['Chessnut','Alexis Luengas, Apache 2.0'],fantasy:['Fantasy','Maurizio Monge, MIT'],spatial:['Spatial','Maurizio Monge, MIT'],celtic:['Celtic','Maurizio Monge, MIT'],pirouetti:['Pirouetti','pirouetti, AGPLv3+'],shapes:['Tvary','flugsio, CC BY-SA 4.0'],pixel:['Pixel','therealqtpi, AGPLv3+'],mpchess:['MPchess','Maxime Chupin, GPLv3+'],rhosgfx:['Rhos','RhosGFX, CC0'],letter:['Písmena','usolando, AGPLv3+'],'kiwen-suwi':['Kiwen suwi','neverRare, CC BY 4.0'],papercut:['Papírové','Nikolay Anzarov, CC BY 4.0'],totoy:['Totoy','Kosal Sen, CC BY 4.0'],
 'california':['California','Jerry S., CC BY-NC-SA'],'cardinal':['Cardinal','sadsnake1, CC BY-NC-SA'],'maestro':['Maestro','sadsnake1, CC BY-NC-SA'],'staunty':['Staunty','sadsnake1, CC BY-NC-SA'],'tatiana':['Tatiana','sadsnake1, CC BY-NC-SA'],'gioco':['Gioco','sadsnake1, CC BY-NC-SA'],'dubrovny':['Dubrovny','sadsnake1, CC BY-NC-SA'],'fresca':['Fresca','sadsnake1, CC BY-NC-SA'],'icpieces':['ICpieces','sadsnake1, CC BY-NC-SA'],'anarcandy':['Anarcandy','caderek, CC BY-NC-SA'],'caliente':['Caliente','avi, CC BY-NC-SA'],'disguised':['Převlečené','danegraphics, CC BY-NC-SA'],'cooke':['Cooke','fejfar, CC BY-NC-SA'],'minimal-warmth':['Minimal warmth','blunder_reign, CC BY-NC-SA'],'horsey':['Horsey','cham, michael1241, CC BY-NC-SA'],'xkcd':['xkcd komiks','Randall Munroe, CC BY-NC 2.5'],
 uni:['Znaky ♞','Unicode, kreslí písmo telefonu'],cow:['Krávy 🐄','Jezdci jsou krávy (T1 schválil)'],alien:['Mimozemšťani','Jezdci jsou mimozemšťani'],mix:['Mix','Každá figura z jiné sady']};
const PIECE_FX={none:['Normální','Bez efektu'],gold:['Zlaté','Jako trofej'],silver:['Stříbrné','Kovový lesk'],neon:['Neon','Září do tmy'],ghost:['Duchové','Poloprůhledné'],sepia:['Sépie','Stará fotka'],invert:['Inverze','Bílé jsou černé a naopak'],drunk:['Opilé','Každá trochu nakřivo'],big:['Obří','Větší figury'],mini:['Mini','Malinké figury'],shadow:['Stín','Velký vržený stín'],upside:['Vzhůru nohama','Figury na hlavě'],blur:['Bez brýlí','Rozmazané'],retro:['Retro TV','Černobílý kontrast'],rainbow:['Duhové','Mění barvy'],shake:['Nervózní','Pořád se třesou'],blind:['Naslepo 🙈','Figury nevidíš – trénink paměti!']};
function applyPfx(){const h=document.documentElement;[...h.classList].filter(c=>c.startsWith('fx-')).forEach(c=>h.classList.remove(c));const f=store.pfx||'none';if(f!=='none')h.classList.add('fx-'+f);}
const UNI={K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'};const IMG_SETS=['merida','chessnut','fantasy','spatial','celtic','pirouetti','shapes','pixel','mpchess','rhosgfx','letter','kiwen-suwi','papercut','totoy','california','cardinal','maestro','staunty','tatiana','gioco','dubrovny','fresca','icpieces','anarcandy','caliente','disguised','cooke','minimal-warmth','horsey','xkcd'];
const MIXMAP={K:'fantasy',Q:'merida',R:'pixel',B:'celtic',N:'papercut',P:'chessnut'};
function pieceOf(set,p){if(set==='uni')return `<span class="uni ${p[0]}">${UNI[p[1]]}</span>`;
 if(set==='cow'&&p[1]==='N')return `<span class="cowpc ${p[0]}">${COW_SVG}</span>`;if(set==='alien'&&p[1]==='N')return `<span class="cowpc ${p[0]}">${ALIEN_SVG}</span>`;
 if(set==='mix')set=MIXMAP[p[1]];
 return IMG_SETS.includes(set)?`<img src="pieces/${set}/${p}.svg" alt="" draggable="false" loading="lazy">`:PIECE_SVG(p);}
const PC=p=>pieceOf(store.pieces||'cburnett',p);
function applyTheme(){try{applyPfx();}catch(e){}if(store.theme==='brown')store.theme='wood';const t=THEMES[store.theme]||THEMES.green;const R=document.documentElement.style;const solid=c=>c==='transparent'?'#b8b8b8':c;R.setProperty('--sq-l',solid(t[0]));R.setProperty('--sq-d',solid(t[1]));R.setProperty('--sq-lb',t[2]||t[0]);R.setProperty('--sq-db',t[3]||t[1]);
const BAR_THEMES=['wood','green','blue','purple'];
 $('themes').innerHTML=Object.entries(THEMES).filter(([k])=>BAR_THEMES.includes(k)||k===store.theme).map(([k,[l,d]])=>`<button class="sw" data-t="${k}" aria-pressed="${k===store.theme}" aria-label="Barvy ${k}"><i style="background:${l}"></i><i style="background:${d}"></i><i style="background:${d}"></i><i style="background:${l}"></i></button>`).join('');}
$('themes').addEventListener('click',e=>{const b=e.target.closest('.sw');if(!b)return;store.theme=b.dataset.t;save();applyTheme();});

/* ---------- State ---------- */
let course=COURSES[0],cur=null,mode='learn',hist=[],mvs=[],ply=0,view=0,mistakes=0,hintOn=false,hintLevel=0,moveMiss=0,idleT=[],busy=false,finished=false;
let sel=null,pcs={},drag=null,badgeEl=null,timer=null,flipped=false,SQ=[];
const LINES=()=>course.chapters.flatMap(ch=>ch.lines);
COURSES.forEach(co=>co.chapters.forEach(ch=>ch.lines.forEach(l=>{l.ch=ch;l.moves=l.m.split(' ');})));
const me=()=>course.side;
const board=()=>hist[ply];
const userTurn=()=>mode==='free'||(ply%2===0)===(me()==='w');

/* ---------- Board geometry ---------- */
function buildSquares(){sqsEl.innerHTML='';SQ=[];
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){const r=flipped?row:7-row,f=flipped?7-col:col,i=r*8+f;const d=document.createElement('div');d.className='sq '+((r+f)%2?'l':'d');
  if(col===0)d.innerHTML+=`<span class="co r">${r+1}</span>`;if(row===7)d.innerHTML+=`<span class="co f">${FILES[f]}</span>`;sqsEl.appendChild(d);SQ[i]=d;}}
const colOf=sq=>flipped?7-(sq&7):(sq&7),rowOf=sq=>flipped?(sq>>3):7-(sq>>3);
function place(el,sq){el.style.transform=`translate(${colOf(sq)*100}%,${rowOf(sq)*100}%)`;}
function mkPiece(p,sq){const el=document.createElement('div');el.className='pc';el.innerHTML=PC(p);place(el,sq);pcsEl.appendChild(el);return el;}
function setPosition(b){pcsEl.innerHTML='';pcs={};b.forEach((p,i)=>{if(p)pcs[i]=mkPiece(p,i);});}
function animate(m,after){const el=pcs[m.from];const capSq=m.ep!=null?m.ep:m.to;const cap=pcs[capSq];
 if(cap&&cap!==el){delete pcs[capSq];cap.style.zIndex=1;setTimeout(()=>{cap.classList.add('gone');setTimeout(()=>cap.remove(),220);},130);}
 delete pcs[m.from];pcs[m.to]=el;if(el){el.classList.remove('drag');place(el,m.to);if(m.promo)el.innerHTML=PC(after[m.to]);}
 if(m.castle){const r=pcs[m.castle[0]];delete pcs[m.castle[0]];pcs[m.castle[1]]=r;if(r)place(r,m.castle[1]);}}
function clr(c){SQ.forEach(s=>s.classList.remove(c));}
function markLast(m){clr('last');if(m){SQ[m.from].classList.add('last');SQ[m.to].classList.add('last');}}
function tgts(from){return mode==='free'?freeTargets(from):targets(board(),from,mvs[ply-1]);}
function showTargets(from){clr('dt');clr('rg');if(from==null)return;const b=board();tgts(from).forEach(i=>SQ[i].classList.add(b[i]?'rg':'dt'));}
function select(i){clr('sel');sel=i;if(i!=null)SQ[i].classList.add('sel');showTargets(i);}
function arrow(m,color,add,op){if(!m){arrowsEl.innerHTML='';return;}
 const cx=i=>colOf(i)+.5,cy=i=>rowOf(i)+.5;let x1=cx(m.from),y1=cy(m.from),x2=cx(m.to),y2=cy(m.to);
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;x1+=ux*.3;y1+=uy*.3;
 const hx=x2-ux*.44,hy=y2-uy*.44,w=.17,hw=.38,px=-uy,py=ux;
 const poly=`<polygon fill="${color}" opacity="${op||.85}" points="${x1+px*w/2},${y1+py*w/2} ${hx+px*w/2},${hy+py*w/2} ${hx+px*hw},${hy+py*hw} ${x2},${y2} ${hx-px*hw},${hy-py*hw} ${hx-px*w/2},${hy-py*w/2} ${x1-px*w/2},${y1-py*w/2}"/>`;if(add)arrowsEl.insertAdjacentHTML('beforeend',poly);else arrowsEl.innerHTML=poly;}
const ICON={warn:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z"/></svg>',best:'<svg viewBox="0 0 24 24" fill="#fff"><path d="m12 17.3 6.2 3.7-1.6-7 5.4-4.7-7.2-.6L12 2 9.2 8.7 2 9.3l5.4 4.7-1.6 7z"/></svg>',
 good:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
 alt:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm1.6-6.2-.9.9c-.7.7-1.2 1.3-1.2 2.8h-2v-.5c0-1.1.4-2.1 1.2-2.8l1.2-1.3c.4-.3.6-.8.6-1.4a2 2 0 0 0-4 0H7.5a4 4 0 0 1 8 0c0 .9-.4 1.7-.9 2.3z"/></svg>',
 bad:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
 info:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>',
 learn:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8z"/></svg>'};
function badge(sq,kind){if(badgeEl)badgeEl.remove();badgeEl=null;if(sq==null)return;const el=document.createElement('div');el.className='badge '+kind;place(el,sq);el.innerHTML=`<span>${ICON[kind]}</span>`;fxEl.appendChild(el);badgeEl=el;}
function flash(sq){SQ[sq].classList.add('flash');setTimeout(()=>SQ[sq].classList.remove('flash'),400);}

/* ---------- Eval ---------- */
function evalAt(n){const k=cur.moves.slice(0,n+1).join(' ');return (EVAL[course.id]||{})[k];}
let lastCp=20;
function showEval(cp){if(cp==null)cp=lastCp;lastCp=cp;const c=Math.max(-800,Math.min(800,cp));const wPct=50+50*(2/(1+Math.exp(-0.004*c))-1);
 const bar=$('evalBar');bar.classList.toggle('flip',flipped);$('evalW').style.height=wPct+'%';
 const txt=(Math.abs(cp)>=2900?'M'+(3000-Math.abs(cp)):(Math.abs(cp)/100).toFixed(1));
 $('evalTop').textContent=(flipped?cp>0:cp<0)?txt:'';$('evalBot').textContent=(flipped?cp<=0:cp>=0)?txt:'';
 $('evalTop').style.color=flipped?'#3c3a37':'#f3f3f1';$('evalBot').style.color=flipped?'#f3f3f1':'#3c3a37';}
function updateEvalForPly(){/* eval of the best line at the most recent user-move position */
 let n=ply;const want=me()==='w'?0:1;for(let i=Math.min(n,cur.moves.length-1);i>=0;i--){if(i%2===want){const e=evalAt(i);if(e){showEval(e[1]);return;}}}showEval(20);}

/* ---------- Coach card ---------- */
function noteFor(n){return course.notes[cur.moves.slice(0,n+1).join(' ')]||null;}
function verdict(n){const e=evalAt(n);if(!e)return{kind:'good',label:'Repertoárový tah'};
 const mine=e[2],best=e[1],s=me()==='w'?1:-1;if(mine==null)return{kind:'good',label:'Repertoárový tah'};
 if(uciOf(resolve(hist[n],cur.moves[n],n%2?'b':'w'))===e[0]||Math.abs(best-mine)<=8)return{kind:'best',label:'Nejlepší tah'};
 if(s*(best-mine)<=35)return{kind:'good',label:'Výborný tah'};return{kind:'good',label:'Dobrý tah'};}
function card(kind,title,sub,mv,body){const c=$('card');c.className='card '+kind;if(store.alien){if(kind==='bad')title='ABDUCTED!!';else if(kind==='best')title='BRILIAAANT!!';else if(['good','book','great','ok'].includes(kind))title=ALW[Math.floor(Math.random()*ALW.length)];}else if(store.t1){if(kind==='bad'){title='TILT!!!';t1Shake();}else if(['best','good','book','great','ok'].includes(kind)){title=T1W[Math.floor(Math.random()*T1W.length)];}}
 c.innerHTML=`<div class="cardHead"><div class="ic">${ICON[kind==='learn'?'learn':kind]}</div><div class="t">${title}${sub?`<small>${sub}</small>`:''}</div>${mv?`<div class="mv">${mv}</div>`:''}</div><div class="cardBody">${body}</div>`;}
const moveLabel=n=>(n%2===0?`${n/2+1}.`:`${(n+1)/2}…`)+cur.moves[n];
function whyHTML(n){const note=noteFor(n);const m=resolve(hist[n],cur.moves[n],n%2?'b':'w');const auto=explainN(n,m);
 return note?`<p class="why">${note}</p><p class="auto">${auto}</p>`:`<p class="why">${auto}</p>`;}
function oppHTML(n){if(n<0||n>=cur.moves.length)return'';const m=mvs[n];if(!m)return'';return`<p class="opp">Soupeř odpověděl <b>${moveLabel(n)}</b>. ${explainN(n,m)}</p>`;}
function showPrompt(){/* before the user's move */
 if(mode==='free'){freeCard();return;}if(finished)return;const n=ply;
 if(mode==='learn')card('learn','Tvůj tah','Zahraj tah podle šipky',moveLabel(n),whyHTML(n)+oppHTML(n-1));
 else if(hintLevel>=3)card('info','Zahraj tento tah','Šipka ukazuje správný tah',moveLabel(n),whyHTML(n)+oppHTML(n-1));
 else if(hintLevel===2)card('info','Nápověda','Táhni zvýrazněnou figurou','',`<p class="why">${verbalHint(n)}</p><p class="auto">Svítící figurou máš táhnout. Kam s ní, už musíš najít sám.</p>`+oppHTML(n-1));
 else if(hintLevel===1)card('info','Nápověda','Zkus to podle rady','',`<p class="why">${verbalHint(n)}</p>`+oppHTML(n-1));
 else{const w=weakAt(n);card(w?'warn':'info',w?'Pozor, tady chybuješ!':'Tvůj tah','Zahraj tah zpaměti','',(w?`<p class="warnTx">⚠ V tomhle tahu jsi udělal chybu už <b>${w.v}×</b> z ${w.n} pokusů. Zamysli se, než táhneš.</p>`:'')+'<p class="auto">Najdi tah z repertoáru. Když si nevíš rady, klikni na Nápovědu.</p>'+oppHTML(n-1));if(w){const bd=$('board');bd.classList.remove('warnPulse');void bd.offsetWidth;bd.classList.add('warnPulse');}}}
/* tah, ve kterém hráč u této varianty chybuje nejčastěji (aspoň 2× a aspoň ve třetině pokusů) */
function weakAt(n){const p=P()[cur.id];if(!p||!p.mv||!p.n)return null;const v=p.mv[n]||0;if(v<2||v/p.n<.34)return null;const max=Math.max(...Object.values(p.mv));return v===max?{v,n:p.n}:null;}
function clearIdle(){idleT.forEach(clearTimeout);idleT=[];}
function newTurn(){clearIdle();hintLevel=0;moveMiss=0;if(mode!=='drill')return;const p0=ply,c0=cur;
 const bump=lv=>()=>{if(ply===p0&&cur===c0&&!finished&&userTurn()&&hintLevel<lv){hintLevel=lv;mistakes=Math.max(mistakes,1);showPrompt();showHint();}};
 /* hints come only from wrong attempts or the hint button, never from a timer */}
function verbalHint(n){const b=hist[n],m=expected(),p=b[m.from],e=p[0]==='w'?'b':'w',a=apply(b,m);
 if(m.castle)return'Rada: je čas schovat krále do bezpečí.';
 const cap=b[m.ep!=null?m.ep:m.to];const k=a.indexOf(e+'K');const chk=k>=0&&attackers(a,k,p[0]).length>0;
 if(chk)return'Rada: zkus dát šach.';
 if(cap){const prev=mvs[n-1];if(prev&&prev.to===m.to)return'Rada: soupeř právě něco sebral. Můžeš vzít zpět?';return`Rada: dá se něco sebrat. Podívej se na ${ACC[cap[1]]} soupeře.`;}
 if(p[1]==='P'){const sq=sqName(m.to);if(['d4','e4','d5','e5'].includes(sq))return'Rada: zaber centrum pěšcem.';return'Rada: hledej tah pěšcem.';}
 const bk=p[0]==='w'?0:7;if((p[1]==='N'||p[1]==='B')&&(m.from>>3)===bk)return`Rada: vyviň další lehkou figuru (jezdce nebo střelce).`;
 for(let i=0;i<64;i++){const q=a[i];if(q&&q[0]===e&&q[1]!=='K'&&q[1]!=='P'&&hits(a,m.to,i))return`Rada: napadni soupeřovu ${q[1]==='Q'?'dámu':q[1]==='R'?'věž':'figuru'}.`;}
 if(attackers(b,m.from,e).length)return`Rada: jedna z tvých figur je napadená. Zachraň ji.`;
 return`Rada: hraje se ${{N:'jezdcem',B:'střelcem',R:'věží',Q:'dámou',K:'králem'}[p[1]]}.`;}

/* ---------- Move list & progress ---------- */
function renderMoves(){renderChList();const el=$('moves');{const total=cur.moves.length;$('progBar').style.width=(ply/total*100)+'%';$('progTxt').textContent=`${Math.ceil(ply/2)}/${Math.ceil(total/2)}`;}if(!ply){el.innerHTML=`<div class="empty">${me()==='w'?'Začni prvním tahem bílého.':'Bílý táhne první, pak jsi na řadě ty.'}</div>`;liveEval();return;}
 let h='';for(let i=0;i<ply;i+=2){h+=`<div class="mrow"><span class="n">${i/2+1}.</span>`;
  for(const j of [i,i+1]){if(j<ply){const mine=(j%2===0)===(me()==='w');h+=`<button class="mv ${mine?'me':'op'}${j===view-1?' cur':''}" data-j="${j}">${cur.moves[j]}</button>`;}else h+='<span></span>';}h+='</div>';}
 el.innerHTML=h;const c=el.querySelector('.cur');if(c){const top=c.offsetTop;if(top<el.scrollTop||top>el.scrollTop+el.clientHeight-30)el.scrollTop=top-el.clientHeight/2;}
 const total=cur.moves.length;$('progBar').style.width=(ply/total*100)+'%';$('progTxt').textContent=`${Math.ceil(ply/2)}/${Math.ceil(total/2)}`;liveEval();}
$('moves').addEventListener('click',e=>{const b=e.target.closest('.mv');if(b)goView(+b.dataset.j+1);});

/* ---------- Sidebar, courses, stats ---------- */
let openCh={};
function courseProg(c){const pcts=c.chapters.map(ch=>chPct(ch,c));return Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length);}
const ALIEN_SVG='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6C18 6 10 16 10 28c0 14 12 28 22 30 10-2 22-16 22-30C54 16 46 6 32 6z" fill="#8fd16a" stroke="#2b2620" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 28c4-6 12-6 15 2-2 6-12 7-15-2zM50 28c-4-6-12-6-15 2 2 6 12 7 15-2z" fill="#14110e"/><ellipse cx="22" cy="28" rx="2.4" ry="1.6" fill="#fff" opacity=".8"/><ellipse cx="42" cy="28" rx="2.4" ry="1.6" fill="#fff" opacity=".8"/><path d="M27 46q5 3 10 0" fill="none" stroke="#2b2620" stroke-width="2.4" stroke-linecap="round"/></svg>';
const enH=o=>o&&o.en&&o.en.toLowerCase()!==String(o.t||o.name||'').toLowerCase()?` <i class="en" lang="en">${o.en}</i>`:'';
function courseIcon(c){return c.id==='cow'?COW_SVG:c.id==='alien'?ALIEN_SVG:PIECE_SVG(c.icon||(c.side==='w'?(c.id==='italian'?'wB':'wN'):'bN'));}
function renderCourses(){const btn=c=>{const pct=courseProg(c);return `<button class="courseBtn" data-c="${c.id}" aria-pressed="${c===course}" title="${c.title} · ${c.side==='w'?'za bílé':'za černé'} · ${pct} %" aria-label="${c.title}"><span class="ic ${c.side==='b'?'b':''}">${courseIcon(c)}</span><span class="cbar"><i style="width:${pct}%"></i></span></button>`;};
 $('courses').innerHTML=COURSES.filter(c=>c.side==='w').map(btn).join('')+'<span class="cSep" aria-hidden="true"></span>'+COURSES.filter(c=>c.side==='b').map(btn).join('');}
$('courses').addEventListener('click',e=>{const b=e.target.closest('.courseBtn');if(!b)return;go('#'+b.dataset.c);});
function renderSide(){const side=$('side');const sc=side.scrollTop;const oc=openCh[course.id]=openCh[course.id]||new Set([0]);let h='';
 course.chapters.forEach((ch,ci)=>{const learned=ch.lines.filter(isDone).length;if(ch.lines.includes(cur))oc.add(ci);
  const complete=learned===ch.lines.length,mast=isMastered(ch),pct=chPct(ch);
  h+=`<details class="ch${complete?' complete':''}" data-ci="${ci}"${oc.has(ci)?' open':''}><summary><div class="chHead"><span>${ci+1}. ${ch.t}${enH(ch)}<small style="display:block;color:var(--dim);font-weight:600;font-size:11.5px">${ch.s}</small></span>${mast?`<em class="chDone">${STI.done}100 %</em>`:`<em>${learned}/${ch.lines.length} · ${pct} %</em>`}</div><div class="bar"><i style="width:${pct}%"></i></div></summary><div class="lines">`;
  ch.lines.forEach(l=>{const st=stateOf(l);h+=`<button class="lineBtn${l===cur?' active':''}${isDone(l)?' isdone':''}" data-id="${l.id}" title="${ST[st][0]}: ${ST[st][1]}\n${l.full||''}"><span class="st s-${st}">${STI[st]}</span><span class="nm">${l.name}${enH(l)}${l===cur&&l.full?`<span class="full">${l.full}</span>`:''}</span></button>`;});
  h+=(complete&&!mast?`<button class="testBtn" data-test="${ci}">${STI.due} Závěrečný test kapitoly · dokončí ji na 100 %</button>`:mast?`<button class="testBtn again" data-test="${ci}">Zopakovat test kapitoly</button>`:'')+'</div></details>';});
 side.innerHTML=`<button class="btn customBtn" id="customBtn">Vlastní drill: vyber varianty</button><div class="legend">${['new','learning','lapsed','done','due'].map(s=>`<span><span class="st s-${s}">${STI[s]}</span>${ST[s][0]}</span>`).join('')}</div>`+h;side.scrollTop=sc;renderCourses();
 side.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{const ci=+d.dataset.ci;d.open?oc.add(ci):oc.delete(ci);}));
 const L=LINES();$('sLearned').textContent=L.filter(isDone).length;$('sTotal').textContent=L.length;$('sDue').textContent=L.filter(l=>stateOf(l)==='due').length;$('sXp').textContent=store.xp;renderLvl();}
$('side').addEventListener('click',e=>{if(e.target.closest('#customBtn')){openPicker();return;}const tb=e.target.closest('.testBtn');if(tb){const ch=course.chapters[+tb.dataset.test];startSession(ch.lines,`Test kapitoly: ${ch.t}`,ch);return;}
 const b=e.target.closest('.lineBtn');if(!b)return;endSession(true);cur=LINES().find(l=>l.id===b.dataset.id);start();});
/* ---------- Home menu ---------- */
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' mil.':n>=1e3?Math.round(n/1e3)+' tis.':String(n);
function popHTML(l,full){if(!l.pop)return'';const [s,g,r,mv,mine]=l.pop;
 if(full)return `<div class="popNote"><b>Lichess:</b> ${mine?'tah':'soupeř hraje'} <b>${mv}</b> v ${String(s).replace('.',',')} % partií${r===1?' (nejčastější volba)':r>1?` (${r}. nejčastější)`:''}, ${fmtN(g)} partií – tak často tuhle variantu ve hře potkáš. Hráči s ratingem 1400–2500.</div>`;
 return `<span class="pop${r===1?' top':''}" title="Jak často to potkáš: soupeř tu na Lichess hraje ${mv} v ${s} % partií (${fmtN(g)} partií). Není to tvůj postup.">${mv?`<em class="popMv">${String(mv).replace('...','…')}</em>`:''}${String(Math.round(s))} %<i><b style="width:${Math.min(100,s)}%"></b></i></span>`;}
function recommend(){const L=ORDER();const due=L.find(l=>stateOf(l)==='due'),lr=L.find(l=>stateOf(l)==='lapsed')||L.find(l=>stateOf(l)==='learning'),nw=L.find(l=>stateOf(l)==='new');
 if(due)return{l:due,m:'drill',t:'Zopakovat',s:due.name};if(lr)return{l:lr,m:'drill',t:'Procvičit zpaměti',s:lr.name};if(nw)return{l:nw,m:'learn',t:'Naučit novou variantu',s:nw.name};
 const ch=course.chapters.find(c=>!isMastered(c));if(ch)return{ch,t:'Test kapitoly',s:ch.t};return{l:L[0],m:'drill',t:'Opakovat',s:'všechno máš hotové'};}
function openLine(l,m){endSession();cur=l;setMode(m||(stateOf(l)==='new'?'learn':'drill'));showTrainer();start();}
function showTrainer(){{const h=$('home');/* nový vzhled drží úvod (.nx) viditelný i se skrytým #home – při otevření trenažéru ho vyprázdni */if(h&&h.querySelector(':scope > .nx'))h.innerHTML='';}document.body.classList.remove('homeMode');document.body.classList.add('trainerMode');window.scrollTo(0,0);$('home').hidden=true;$('trainer').hidden=false;flipped=course.side==='b';buildSquares();renderCourses();}
function showHome(){hideBoardTip();if(FREE){cur=FREE.orig;mode=FREE.mode;FREE=null;setMode(mode);}sfStop();LIVE.fen=null;document.body.classList.remove('trainerMode');clearTimeout(timer);clearIdle();endSession();$('done').classList.remove('show');$('trainer').hidden=true;$('home').hidden=false;renderCourses();renderHome();window.scrollTo(0,0);}
function ringSVG(p,r,w){const C=2*Math.PI*r;const s=2*(r+w/2);return `<svg viewBox="0 0 ${s} ${s}"><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${w}"/><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${p===100?'var(--accent)':'var(--brass)'}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p/100)}"/></svg>`;}
const isPopular=l=>!!l.pop&&(l.pop[2]===1||l.pop[0]>=20);
const popScore=l=>l.pop?l.pop[1]:-1;
function byPop(arr){return arr.map((l,i)=>[l,i]).sort((a,b)=>(popScore(b[0])-popScore(a[0]))||(a[1]-b[1])).map(x=>x[0]);}
function sortedLines(ch){return store.sort==='pop'?byPop(ch.lines):ch.lines;}
/* order in which the trainer offers lines: by similarity (course order) or by popularity across the whole course */
function ORDER(){return store.sort==='pop'?byPop(LINES()):LINES();}
