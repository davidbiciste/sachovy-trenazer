/* Trenažér variant (drill, učení), Stockfish naživo, ovládání a SPUŠTĚNÍ aplikace (musí být poslední). Pořadí načítání je v index.html (APP_JS). */
/* ---------- Drill sessions (random order, failed lines come back until all are clean) ---------- */
let session=null;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
/* náhodný výběr N variant z vybraných; další kolo bere ty, které ještě nebyly */
function randDrill(r){let left=r.pool.filter(id=>!r.used.includes(id));if(left.length<r.n){r.used=[];left=r.pool.slice();}
 const pick=shuffle(left).slice(0,r.n);r.used=r.used.concat(pick);startSession(LINES().filter(l=>pick.includes(l.id)),'Náhodný drill',null);session.rand=r;renderSession();}
/* statistika varianty: kolikrát hrána zpaměti, s chybou a ve kterých tazích */
function lineStats(c,l){const p=(store.prog[c.id]||{})[l.id];if(!p||!p.n)return null;const mv=p.mv||{};const ms=l.m.split(' ');
 const moves=Object.entries(mv).map(([k,v])=>({i:+k,v,lab:(+k%2===0?`${+k/2+1}.`:`${(+k+1)/2}…`)+ms[+k]})).sort((a,b)=>b.v-a.v||a.i-b.i);
 return{n:p.n,bad:p.n-(p.ok||0),ok:p.ok||0,rate:Math.round((p.ok||0)/p.n*100),moves};}
const statTxt=S=>S?`${S.n}× hráno · úspěšnost ${S.rate} %`:'';
function openLineStats(c,l){const S=lineStats(c,l);const pk=$('picker');const mx=S&&S.moves.length?S.moves[0].v:1;
 pk.innerHTML=`<div class="pkCard stCard"><h2>${l.name}</h2><p class="profEmpty">${l.full}</p>${S?`<div class="tiles"><div><b>${S.n}</b><span>hráno zpaměti</span></div><div><b>${S.rate} %</b><span>úspěšnost (bez chyby)</span></div><div><b>${S.bad}</b><span>s chybou</span></div></div>
  <h3>Kde chybuješ</h3>${S.moves.length?`<div class="mvBars">${S.moves.map(m=>`<div><b>${m.lab}</b><span class="bar"><i style="width:${Math.round(m.v/mx*100)}%"></i></span><em>${m.v}×</em></div>`).join('')}</div><p class="profEmpty">Nejvíc chyb děláš v tahu <b>${S.moves[0].lab}</b>. Na ten se při procvičování soustřeď.</p>`:'<p class="profEmpty">Zatím žádná chyba v konkrétním tahu. Chyby se začaly zapisovat až teď, takže starší pokusy tu nejsou.</p>'}`:'<p class="profEmpty">Tuhle variantu jsi ještě nehrál zpaměti.</p>'}
  <div class="row"><button class="btn" id="stClose">Zavřít</button><button class="btn primary" id="stPlay">Procvičit</button></div></div>`;
 pk.hidden=false;pk.onchange=null;pk.onclick=e=>{if(e.target===pk||e.target.id==='stClose'){pk.hidden=true;return;}if(e.target.id==='stPlay'){pk.hidden=true;if(c!==course){course=c;}openLine(LINES().find(x=>x.id===l.id),'drill');}};}
function halfDue(ch){const t=ch.lines.length,d=ch.lines.filter(isDone).length;store.half=store.half||{};return t>=4&&d>=Math.ceil(t/2)&&d<t&&!store.half[mKey(ch)];}
function startSession(lines,label,ch){if(!lines.length)return;session={label,all:lines.map(l=>l.id),queue:shuffle(lines.map(l=>l.id)),total:lines.length,clean:0,fails:0,ch:ch||null,t0:Date.now(),err:0};$('picker').hidden=true;nextInSession();}
function startLearnGroup(lines){if(!lines.length)return;const ids=lines.map(l=>l.id);session={kind:'learn',label:'Učení skupiny',all:ids,queue:ids.slice(),total:ids.length,clean:0,fails:0,phase:'learn',curId:null,ch:null};$('picker').hidden=true;nextInSession();}
function nextInSession(){if(!session)return;
 if(session.kind==='learn'){if(session.phase==='drill'&&session.curId){cur=LINES().find(l=>l.id===session.curId);setMode('drill');start();return;}
  if(!session.queue.length){completeSession();return;}session.curId=session.queue.shift();session.phase='learn';cur=LINES().find(l=>l.id===session.curId);setMode('learn');start();return;}if(!session.queue.length){completeSession();return;}const id=session.queue.shift();cur=LINES().find(l=>l.id===id);setMode('drill');start();}
function endSession(quiet){session=null;renderSession();}
function completeSession(){const s=session;session=null;
 if(s.parent||s.half){if(s.parent)session=s.parent;renderSession();renderSide();$('doneSum').innerHTML='';$('doneXp').textContent='';$('doneTitle').textContent='Půlka drží!';
  $('doneText').textContent=`Všech ${s.total} naučených variant máš zpaměti bez chyby${s.fails?` (opakovat jsi musel ${s.fails}×)`:''}. Pokračuj druhou polovinou.`;
  $('doneSum').innerHTML=drillResult(s);afterAction=s.parent?'session':'new';$('doneNext').textContent=s.parent?`Další varianta`:'Naučit další variantu';showDone();sfx('win');confetti();return;}
 if(s.kind==='learn'){groupIds=s.all;renderSession();renderSide();$('doneSum').innerHTML='';$('doneXp').textContent='';$('doneTitle').textContent='Skupina naučená!';
  $('doneText').textContent=`Prošel jsi všech ${s.total} variant: naučit a pak zpaměti. Teď si je otestuj v náhodném pořadí, ať víš, že drží.`;afterAction='groupTest';$('doneNext').textContent='Test skupiny (náhodně)';showDone();sfx('win');confetti();return;}let title='Drill hotový!',text=`Všech ${s.total} variant máš zahraných bez chyby.${s.fails?` Opakovat jsi musel ${s.fails}×.`:''}`;
 if(s.ch){store.mastered[mKey(s.ch)]=true;save();title='Kapitola na 100 %!';text=`${s.ch.t}: všechny varianty v náhodném pořadí bez chyby.`;}
 renderSession();renderSide();$('doneSum').innerHTML=drillResult(s);$('doneXp').textContent='';$('doneTitle').textContent=title;$('doneText').textContent=text;afterAction='review';$('doneNext').textContent='Pokračovat';
 if(s.rand){RAND=s.rand;afterAction='randMore';const left=s.rand.pool.length-s.rand.used.length;$('doneNext').textContent=`Dalších ${s.rand.n}`;$('doneText').textContent=text+' Další kolo vybere jiné varianty.';}
 showDone();sfx('win');confetti();}
const fmtT=ms=>{const t=Math.round(ms/1000),m=Math.floor(t/60),x=t%60;return m>=60?`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`;};
/* výsledek skupinového drillu: čas, špatné tahy, rekord pro stejnou sadu variant */
function drillResult(s){if(!s.t0)return'';const ms=Date.now()-s.t0;const key=course.id+'|'+s.all.slice().sort().join(',');store.drillBest=store.drillBest||{};const best=store.drillBest[key];
 const rec=!best||ms<best.ms;if(rec){store.drillBest[key]={ms,err:s.err||0,at:Date.now()};const ks=Object.keys(store.drillBest);if(ks.length>60){ks.sort((a,b)=>store.drillBest[a].at-store.drillBest[b].at).slice(0,ks.length-60).forEach(k=>delete store.drillBest[k]);}save();}
 return `<div class="drillRes"><div><b>${fmtT(ms)}</b><small>čas</small></div><div><b>${s.err||0}</b><small>špatných tahů</small></div><div><b>${s.fails||0}</b><small>variant s chybou</small></div></div><p class="drillRec">${rec?(best?`Nový rekord! Předtím ${fmtT(best.ms)}.`:'První čas pro tuhle sadu variant.'):`Tvůj rekord pro tuhle sadu: ${fmtT(best.ms)}${best.err?` (${best.err} chyb)`:' bez chyby'}.`}</p>`;}
setInterval(()=>{const e=document.getElementById('sessT');if(e&&session&&session.t0)e.textContent=fmtT(Date.now()-session.t0);},1000);
function renderSession(){const el=$('sessionBar');if(!session){el.hidden=true;return;}el.hidden=false;
 const doneN=session.clean;if(session.deaths)el.classList.add('deathOn');el.innerHTML=session.kind==='learn'?`<div><b>${session.label}</b><small>Hotovo ${session.clean} z ${session.total} · ${session.phase==='learn'?'učení':'zpaměti'}</small></div><button class="btn" id="endSess">Ukončit</button>`:`<div><b>${session.label}${store.death?' · ☠ Mód smrti':''}</b><small>Hotovo ${doneN} z ${session.total}${session.t0?` · <span id="sessT">${fmtT(Date.now()-session.t0)}</span> · chyb ${session.err||0}`:''}</small></div><button class="btn" id="endSess">Ukončit</button>`;
 $('endSess').onclick=()=>{endSession();start();};}
/* ---------- Picker ---------- */
let ERRSET=new Set();
function openPicker(){const pk=$('picker');let h=`<div class="pkCard"><h2>Vlastní drill</h2><p>Zaškrtni varianty. <b>Drill</b> je zamíchá a chybné vrací na konec. <b>Naučit skupinu</b> je projde jednu po druhé.</p>
 <label class="death" style="margin:-2px 0 2px"><input type="checkbox" id="pkDeath" ${store.death?'checked':''}> <span>Mód smrti: jedna chyba a drill začíná znovu</span></label><div class="row pkQuick"><button class="btn" data-q="all">Vše</button><button class="btn" data-q="pop">Nejhranější</button><button class="btn" data-q="done">Jen naučené</button><button class="btn" data-q="new">Jen nové</button><button class="btn" data-q="err">Nejvíc chybuju</button><button class="btn" data-q="none">Nic</button></div><p class="accMsg" id="pkErrMsg"></p><div class="pkCount"><span>Kolik náhodně vybrat:</span><div class="chip2" role="group">${[0,5,10,15].map(n=>`<button type="button" data-n="${n}" aria-pressed="${(store.drillN||0)===n}">${n?n:'Vše'}</button>`).join('')}</div></div><div class="pkList">`;
 course.chapters.forEach((ch,ci)=>{h+=`<div class="pkCh"><label class="pkHead"><input type="checkbox" data-ch="${ci}"> <b>${ci+1}. ${ch.t}${enH(ch)}</b> <small>${ch.s}</small></label><div class="pkLines">`+sortedLines(ch).map(l=>`<label><input type="checkbox" data-l="${l.id}"${isDone(l)?' checked':''}> <span class="st s-${stateOf(l)}">${STI[stateOf(l)]}</span> <span class="pkName">${l.name}${enH(l)}${(()=>{const S=lineStats(course,l);return S?` <small class="pkRate${S.rate<70?' low':''}">${S.rate} %</small>`:''})()}</span>${l.pop?`<span class="pkPop${isPopular(l)?' hot':''}">${Math.round(l.pop[0])} %</span>`:''}</label>`).join('')+`</div></div>`;});
 h+=`</div><div class="row"><button class="btn" id="pkCancel">Zavřít</button><button class="btn" id="pkLearn">Naučit skupinu</button><button class="btn primary" id="pkGo">Spustit drill</button></div></div>`;pk.innerHTML=h;pk.hidden=false;syncPicker();
 pk.onclick=e=>{if(e.target===pk||e.target.id==='pkCancel'){pk.hidden=true;return;}const dn=e.target.closest('[data-n]');if(dn){store.drillN=+dn.dataset.n;save();pk.querySelectorAll('[data-n]').forEach(b=>b.setAttribute('aria-pressed',b===dn));syncPicker();return;}const q=e.target.closest('[data-q]');if(q){if(q.dataset.q==='err'){const W=LINES().map(l=>({l,S:lineStats(course,l)})).filter(x=>x.S&&x.S.bad>0).sort((a,b)=>(a.S.rate-b.S.rate)||(b.S.bad-a.S.bad));ERRSET=new Set(W.slice(0,15).map(x=>x.l.id));if(!W.length){const m=document.getElementById('pkErrMsg');if(m)m.textContent='Zatím žádná varianta s chybou – nejdřív si něco zahraj zpaměti.';}}pk.querySelectorAll('input[data-l]').forEach(i=>{const l=LINES().find(x=>x.id===i.dataset.l);i.checked=(q.dataset.q==='err'&&ERRSET.has(l.id))||q.dataset.q==='all'||(q.dataset.q==='done'&&isDone(l))||(q.dataset.q==='pop'&&isPopular(l))||(q.dataset.q==='new'&&stateOf(l)==='new');});syncPicker();return;}
  if(e.target.id==='pkLearn'){showTrainer();const ids=[...pk.querySelectorAll('input[data-l]:checked')].map(i=>i.dataset.l);startLearnGroup(ids.map(id=>LINES().find(l=>l.id===id)));return;}
  if(e.target.id==='pkGo'){showTrainer();const ids=[...pk.querySelectorAll('input[data-l]:checked')].map(i=>i.dataset.l);const n=store.drillN||0;if(n&&n<ids.length){randDrill({n,pool:ids,used:[]});}else startSession(LINES().filter(l=>ids.includes(l.id)),'Vlastní drill',null);}};
 pk.onchange=e=>{if(e.target.id==='pkDeath'){store.death=e.target.checked;save();return;}const c=e.target.dataset.ch;if(c!=null){pk.querySelectorAll(`.pkCh:nth-child(${+c+1}) input[data-l]`).forEach(i=>i.checked=e.target.checked);}syncPicker();};}
function syncPicker(){const pk=$('picker');pk.querySelectorAll('.pkCh').forEach(chEl=>{const ls=[...chEl.querySelectorAll('input[data-l]')];const head=chEl.querySelector('input[data-ch]');const n=ls.filter(i=>i.checked).length;head.checked=n===ls.length;head.indeterminate=n>0&&n<ls.length;});
 const n=pk.querySelectorAll('input[data-l]:checked').length;const go=$('pkGo');const rn=store.drillN||0;go.textContent=n?`Spustit drill (${rn&&rn<n?rn:n})`:'Vyber aspoň jednu';go.style.opacity=n?1:.5;go.style.pointerEvents=n?'auto':'none';const gl=$('pkLearn');gl.textContent=n?`Naučit skupinu (${n})`:'Naučit skupinu';gl.style.opacity=n?1:.5;gl.style.pointerEvents=n?'auto':'none';}

/* ---------- Flow ---------- */
function pickStart(){const L=ORDER();return L.find(l=>stateOf(l)==='due')||L.find(l=>stateOf(l)==='lapsed')||L.find(l=>stateOf(l)==='learning')||L.find(l=>stateOf(l)==='new')||L[0];}
function nextNew(){const L=ORDER();if(store.sort==='pop')return L.find(l=>stateOf(l)==='new');const i=L.indexOf(cur);const order=L.slice(i+1).concat(L.slice(0,i));return order.find(l=>stateOf(l)==='new');}
function switchCourse(){flipped=course.side==='b';buildSquares();renderCourses();start();}
function boardIntoView(){if($('trainer').hidden)return;const el=document.querySelector('.progTop');
 /* na počítači se stránka nehýbe; na mobilu jen když šachovnice není celá vidět */
 if(!matchMedia('(max-width:820px)').matches)return;{const bd=$('board').getBoundingClientRect();if(el.getBoundingClientRect().top>=0&&bd.bottom<=innerHeight)return;}const beh='auto';
 /* works both for a normal page and inside a host frame that scrolls the page from outside */
 try{el.scrollIntoView({behavior:beh,block:'start'});}catch(e){el.scrollIntoView(true);}
 if(scrollY>0)window.scrollTo({top:0,behavior:beh});
 }
let MISS={};
function renderChList(){const el=document.getElementById('chList');if(!el)return;if(!course||!cur){el.hidden=true;return;}
 const ci=course.chapters.findIndex(c=>c.lines.includes(cur));if(ci<0){el.hidden=true;return;}const ch=course.chapters[ci];const d=ch.lines.filter(isDone).length,p=chPct(ch);
 let h=`<h3>${ci+1}. ${ch.t}</h3><div class="clSub">${d} z ${ch.lines.length} variant umíš</div><div class="bar"><i style="width:${p}%"></i></div><div class="lineTable">`;
 /* společný začátek všech variant kapitoly se nepíše; u ostatních variant je zvýrazněné, kde se liší od té, kterou hraješ */
 let base=0;const ls=ch.lines;while(ls.every(l=>l.moves[base]!=null&&l.moves[base]===ls[0].moves[base]))base++;
 const P=view;/* tah, který je teď na šachovnici = index P-1 */
 const mvTxt=l=>{let d=0;while(d<l.moves.length&&l.moves[d]===cur.moves[d])d++;/* d = první tah, kde se varianta liší od té, co hraješ */
   const focus=l===cur?P:Math.min(d,P);const from=focus>base?Math.max(base,focus-2):Math.max(0,focus-2);let o=from>0?'<span class="same">…</span> ':'';
   const end=mode==='drill'?Math.min(l.moves.length,P):l.moves.length;/* procvičování: žádné budoucí tahy */
   for(let i=from;i<end;i++){const num=i%2===0?`${i/2+1}.`:(i===from?`${(i+1)/2}...`:'');let cls;
    if(i<P&&i<d)cls=i===P-1?'now':'same';else if(i===d&&l!==cur)cls='div';else if(i>d&&l!==cur)cls='aft';else cls=i===P?'next':'';
    o+=`<span class="${cls}">${num}${l.moves[i]}</span> `;}if(mode==='drill'&&end<l.moves.length)o+='<span class="hid">…</span>';return o;};
 const offPath=l=>{if(l===cur)return false;let d=0;while(d<l.moves.length&&l.moves[d]===cur.moves[d])d++;return d<P;};
 sortedLines(ch).forEach((l,li)=>{if(offPath(l))return;const st=stateOf(l);h+=`<button class="hLine${l===cur?' active':''}" data-id="${l.id}" title="${ST[st][0]}${l.full&&mode!=='drill'?'\n'+l.full:''}"><span class="st s-${st}">${STI[st]}</span><span>${mode==='drill'?'Varianta '+(li+1):l.name+enH(l)}<span class="mvs">${mvTxt(l)}</span></span>${popHTML(l)||'<span></span>'}</button>`;});
 h+='</div>';{const nOff=ch.lines.filter(offPath).length;if(nOff)h+=`<div class="clSub clOff">${nOff} ${nOff===1?'varianta vede':nOff<5?'varianty vedou':'variant vede'} z téhle pozice jinam – ukážou se, když se vrátíš zpět.</div>`;}const sc=el.scrollTop;el.innerHTML=h;el.hidden=false;el.scrollTop=sc;
 const a=el.querySelector('.hLine.active');if(a){const r=a.getBoundingClientRect(),R=el.getBoundingClientRect();if(r.top<R.top)el.scrollTop+=r.top-R.top-8;else if(r.bottom>R.bottom)el.scrollTop+=r.bottom-R.bottom+8;}}
/* klik na jinou variantu: přepne na ni a rovnou nastaví stejnou pozici (nebo místo, kde se od tvé hry oddělila) */
function jumpLine(l){let d=0;while(d<l.moves.length&&d<ply&&l.moves[d]===cur.moves[d])d++;const k=Math.min(view,d,l.moves.length-1);
 endSession(true);cur=l;if(stateOf(l)==='new'&&mode!=='learn')setMode('learn');start();if(k<=0)return;
 clearTimeout(timer);let m=null;for(let i=0;i<k;i++){m=resolve(hist[ply],cur.moves[ply],ply%2?'b':'w');hist.push(apply(hist[ply],m));mvs.push(m);ply++;}
 view=ply;setPosition(hist[ply]);markLast(m);select(null);arrow(null);busy=false;renderMoves();updateEvalForPly();
 if(userTurn()){newTurn();showPrompt();showHint();}else{busy=true;timer=setTimeout(()=>oppMove(),500);}}
document.getElementById('chList').addEventListener('click',e=>{const b=e.target.closest('.hLine');if(!b)return;const l=LINES().find(x=>x.id===b.dataset.id);if(!l||l===cur)return;jumpLine(l);});
function start(){hideBoardTip();MISS={};if(FREE){cur=FREE.orig;mode=FREE.mode;FREE=null;setMode(mode);}clearMarks();boardIntoView();if(started)sfx('start');started=true;clearTimeout(timer);clearIdle();clr("hintsq");hist=[startBoard()];mvs=[];ply=0;view=0;mistakes=0;hintOn=false;busy=false;finished=false;
 select(null);markLast(null);badge(null);arrow(null);$('done').classList.remove('show');setPosition(hist[0]);
 $('chName').textContent=`Kapitola ${course.chapters.indexOf(cur.ch)+1}: ${cur.ch.t}`;$('lnName').innerHTML=escH(cur.name)+enH(cur);$('progLabel').textContent=`${cur.ch.t} · ${cur.name}`;
 $('idea').innerHTML=`<b>Varianta:</b> ${cur.idea}${(()=>{const S=lineStats(course,cur);return S?`<div class="lnStT">${statTxt(S)}${S.moves.length?` · nejvíc chyb v tahu <b>${S.moves[0].lab}</b>`:''} <button class="lnk" id="lnStOpen">Podrobnosti</button></div>`:''})()}${popHTML(cur,true)}<details class="chPlan"><summary>Plán kapitoly: kam hra směřuje a kam rošádovat</summary>${cur.ch.plan}</details>`;{const lo=document.getElementById('lnStOpen');if(lo)lo.onclick=()=>openLineStats(course,cur);}renderSession();renderMoves();renderSide();showEval(20);
 if(!userTurn()){card('info','Soupeř začíná','Bílý táhne první','','<p class="auto">Počkej na první tah bílého.</p>');busy=true;timer=setTimeout(()=>{oppMove();},600);}
 else{newTurn();showPrompt();showHint();}}
function commit(m){clearMarks();const before=board();const after=apply(before,m);const capture=!!before[m.to]||m.ep!=null;
 animate(m,after);hist.push(after);mvs.push(m);ply++;view=ply;markLast(m);
 const e=me()==='w'?'b':'w',c=after[m.to][0];const k=after.indexOf((c==='w'?'b':'w')+'K');const chk=k>=0&&attackers(after,k,c).length>0;
 sfx(m.castle?'castle':chk?'check':capture?'capture':'move');}
function oppMove(){busy=true;const n0=ply;commit(resolve(board(),cur.moves[ply],ply%2?'b':'w'));busy=false;if(mode==='learn')boardTip(mvs[n0].to,'Soupeř: '+plainTxt(noteFor(n0)||explainN(n0,mvs[n0])),'opp');renderMoves();
 if(ply>=cur.moves.length){finish();return;}newTurn();showPrompt();showHint();updateEvalForPly();}
function expected(){return ply<cur.moves.length?resolve(board(),cur.moves[ply],ply%2?'b':'w'):null;}
function showHint(){clr('hintsq');if(mode==='free')return;if(finished||!userTurn()||view!==ply){arrow(null);return;}const ex=expected();
 if(mode==='learn'||hintLevel>=3)arrow(ex,'#ffaa00');else{arrow(null);if(hintLevel===2)SQ[ex.from].classList.add('hintsq');}}

function tryMove(from,to){if(mode==='free'){if(!XPROMO&&FREE&&askPromo(FREE.g,sqName(from),sqName(to),boardEl,()=>tryMove(from,to),()=>{const el=pcs[from];if(el){el.classList.remove('drag');place(el,from);}}))return true;return freeMove(from,to);}if(busy||finished||!userTurn())return false;const exp=expected();const n=ply;
 if(exp.from===from&&exp.to===to){select(null);arrow(null);commit(exp);const v=verdict(n);badge(to,v.kind);boardTip(to,plainTxt(noteFor(n)||explainN(n,mvs[n])),'me');if(mode==='drill'||mode==='learn')crazyHit(to,v.kind);
  card(v.kind,moveMiss&&mode==='drill'?'Správně':v.label,'',moveLabel(n),whyHTML(n));
  clearIdle();clr('hintsq');hintLevel=0;renderMoves();updateEvalForPly();
  if(ply<cur.moves.length){busy=true;timer=setTimeout(()=>{oppMove();if(!finished){/* keep explanation of my move visible, add opponent reply */
     const c=$('card');if(mode==='drill'){showPrompt();c.querySelector('.cardBody').insertAdjacentHTML('afterbegin',`<p class="auto">Tvůj tah ${moveLabel(n)}: ${explainN(n,mvs[n])}</p>`);}}},mode==='learn'?1300:650);}
  else finish();return true;}
 const el=pcs[from];if(el){el.classList.remove('drag');place(el,from);}select(null);
 const e=evalAt(n);const u=sqName(from)+sqName(to);
 if(e&&e[3]&&e[3].includes(u)){badge(to,'alt');sfx('wrong');
  card('alt','Taky dobrý tah','Engine ho hodnotí skoro stejně','',`<p class="why">Tah ${sqName(from)}–${sqName(to)} je podle enginu také silný, ale v repertoáru hrajeme ${mode==='learn'?`<b>${cur.moves[n]}</b>`:'jiný tah'}. Zkus ho najít.</p>`);
  if(mode==='learn')arrow(exp,'#ffaa00');return false;}
 mistakes++;moveMiss++;sfx('wrong');crazyMiss(to);if(mode==='drill')MISS[n]=1;flash(to);badge(to,'bad');
 if(mode==='drill')hintLevel=Math.max(hintLevel,moveMiss>=4?3:moveMiss>=3?2:1);
 if(mode==='learn')card('bad','Tohle ne','Drž se šipky',moveLabel(n),whyHTML(n));
 else if(hintLevel>=3)card('bad','Tohle ne','Zahraj tah podle šipky',moveLabel(n),whyHTML(n));
 else if(hintLevel===2)card('bad','Tohle ne','Nápověda: táhni zvýrazněnou figurou','',`<p class="why">${verbalHint(n)}</p><p class="auto">Svítící figurou máš táhnout. Ještě jedna chyba a ukážu ti celý tah.</p>`);
 else if(hintLevel===1)card('bad','Tohle ne',`Zkus to znovu (pokus ${moveMiss+1})`,'',`<p class="why">${verbalHint(n)}</p><p class="auto">${moveMiss===1?'Máš ještě dva pokusy, pak ti ukážu figuru.':'Ještě jeden pokus, pak ti ukážu figuru.'}</p>`);
 else card('bad','Tohle ne',`Zkus to znovu (pokus ${moveMiss+1})`,'',`<p class="auto">To není tah z repertoáru. ${moveMiss===1?'Máš ještě dva pokusy, pak ti napovím figuru.':'Ještě jeden pokus, pak ti napovím figuru.'}</p>`);
 showHint();explainWrong(n,from,to,mode==='learn'||hintLevel>=3);return false;}

function endSummary(){const b=hist[ply],c=me(),o=c==='w'?'b':'w',home=c==='w'?0:56,ohome=c==='w'?56:0;const out=[];
 const kSq=b.indexOf(c+'K'),okSq=b.indexOf(o+'K');const moved=pc=>cur.moves.slice(0,ply).some((m,i)=>(i%2===0)===(c==='w')&&(m.startsWith('O-')||m[0]===pc));
 const castled=cur.moves.slice(0,ply).find((m,i)=>(i%2===0)===(c==='w')&&m.startsWith('O-'));
 if(castled)out.push(`Tvůj král je zrošádovaný na ${castled==='O-O'?'krátkou':'dlouhou'} stranu.`);
 else if(kSq!==home+4)out.push(`Tvůj král zůstal na ${sqName(kSq)} a rošádu už udělat nemůžeš. Drž ho schovaný za pěšci.`);
 else{const minors=[1,2,5,6].map(f=>home+f).filter(i=>b[i]&&b[i][0]===c&&'NB'.includes(b[i][1]));
  const shortFree=!b[home+5]&&!b[home+6],longFree=!b[home+1]&&!b[home+2]&&!b[home+3];
  if(shortFree)out.push('Další krok: krátká rošáda (O-O).');else if(longFree)out.push('Další krok: dlouhá rošáda (O-O-O).');
  else out.push(`Dokonči vývin${minors.length?` (doma ještě stojí ${minors.map(i=>ACC[b[i][1]]+' '+sqName(i)).join(', ')})`:''} a pak rošáduj.`);}
 const oc=cur.moves.slice(0,ply).find((m,i)=>(i%2===0)!==(c==='w')&&m.startsWith('O-'));
 if(oc)out.push(`Soupeř má krále na ${oc==='O-O'?'krátké':'dlouhé'} straně${castled&&castled!==oc?', rošády jsou opačné, takže se hodí útok pěšci na jeho krále':''}.`);else if(okSq!==ohome+4)out.push('Soupeřův král přišel o rošádu. Otevírej hru proti němu.');
 let mat=0;b.forEach(p=>{if(p&&p[1]!=='K')mat+=(p[0]===c?1:-1)*VAL[p[1]];});
 out.push(mat===0?'Materiál je vyrovnaný.':mat>0?`Jsi materiálově napřed (${mat===1?'o pěšce':mat===3?'o lehkou figuru':mat>=5&&mat<8?'zhruba o věž':'o '+mat+' bodů'}).`:`Materiálově jsi pozadu (${-mat===1?'o pěšce':'o '+(-mat)+' body'}), ale máš za to aktivitu.`);
 const want=c==='w'?0:1;let cp=null;for(let i=ply-1;i>=0;i--){if(i%2===want){const e=evalAt(i);if(e){cp=e[1];break;}}}
 if(cp!=null){const s=(c==='w'?1:-1)*cp;out.push(s>150?'Engine: máš jasnou výhodu.':s>50?'Engine: stojíš o něco lépe.':s>-50?'Engine: pozice je vyrovnaná.':'Engine: soupeř stojí o něco lépe, hraj opatrně.');}
 return out.join(' ');}
function planArrows(){if(!cur.cont){arrow(null);return'';}const mv=cur.cont.split(' ');let b=hist[ply],c=ply%2?'b':'w';const mine=me();const items=[];let n=ply;
 for(const s of mv){if(items.length>=6)break;let m;try{m=resolve(b,s,c);}catch(e){break;}const desc=explain(b,m,null);items.push({m,mine:c===mine,lab:(n%2===0?`${n/2+1}.`:`${(n+1)/2}…`)+s,desc});b=apply(b,m);c=c==='w'?'b':'w';n++;}
 const draw=(m,col,num,op)=>{const cx=q=>colOf(q)+.5,cy=q=>rowOf(q)+.5;let x1=cx(m.from),y1=cy(m.from),x2=cx(m.to),y2=cy(m.to);const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;x1+=ux*.28;y1+=uy*.28;const hx=x2-ux*.4,hy=y2-uy*.4,w=.13,hw=.3,px=-uy,py=ux;
  return `<g opacity="${op}"><polygon fill="${col}" points="${x1+px*w/2},${y1+py*w/2} ${hx+px*w/2},${hy+py*w/2} ${hx+px*hw},${hy+py*hw} ${x2},${y2} ${hx-px*hw},${hy-py*hw} ${hx-px*w/2},${hy-py*w/2} ${x1-px*w/2},${y1-py*w/2}"/><circle cx="${x1}" cy="${y1}" r=".2" fill="${col}" stroke="#fff" stroke-width=".04"/><text x="${x1}" y="${y1+.075}" font-size=".22" font-weight="800" text-anchor="middle" fill="#fff">${num}</text></g>`;};
 arrowsEl.innerHTML=items.map((it,i)=>draw(it.m,it.mine?'#2f8fe8':'#e2533b',i+1,1-i*.1)).join('');
 return `<div class="contList"><b>Jak hra pokračuje (engine)</b><small><span class="dotB"></span>tvoje tahy <span class="dotR"></span>tahy soupeře · čísla na šachovnici ukazují pořadí</small><ol>${items.map((it,i)=>`<li class="${it.mine?'me':'op'}"><span class="n">${i+1}</span><span><b>${it.mine?'Ty':'Soupeř'}: ${it.lab}</b> ${it.desc}</span></li>`).join('')}</ol></div>`;}
/* okno po dohrání: na mobilu panel zespodu, šachovnice zůstane nahoře vidět */
function fitSheet(board,card){if(!board||!card)return;requestAnimationFrame(()=>{const free=innerHeight-board.getBoundingClientRect().bottom-6;card.style.maxHeight=Math.max(150,free)+'px';});}
function showDone(){const dn=$('done');dn.classList.add('show');const card=dn.querySelector('.doneCard');card.style.maxHeight='';if(matchMedia('(max-width:820px)').matches){const b=$('board');if(b){const y=b.getBoundingClientRect().top+scrollY-8;window.scrollTo({top:Math.max(0,y-(document.querySelector('.progTop')?document.querySelector('.progTop').offsetHeight+6:0)),behavior:'auto'});fitSheet(b,card);}}}
function finish(){finished=true;arrow(null);const perfect=mistakes===0;const pr=P();const p=pr[cur.id]||{box:0,due:0};let gain=0,text;
 if(mode!=='learn'){p.n=(p.n||0)+1;p.ok=(p.ok||0)+(perfect?1:0);p.err=(p.err||0)+mistakes;p.mv=p.mv||{};for(const k in MISS)p.mv[k]=(p.mv[k]||0)+1;}p.last=Date.now();
 const dk=new Date().toISOString().slice(0,10);store.act=store.act||{};store.act[dk]=(store.act[dk]||0)+1;
 if(mode==='learn'){if(!pr[cur.id]){p.box=1;p.due=Date.now();}gain=5;text='Teď ji zkus zahrát zpaměti v režimu Procvičit.';}
 else if(perfect){delete p.lapse;p.box=Math.min(Math.max(p.box+1,2),5);p.due=Date.now()+INTERVALS[p.box]*DAY;gain=10+p.box*2;text='Varianta se ti vrátí za '+days(INTERVALS[p.box])+'.';}
 else{if((p.box||0)>=2)p.lapse=1;p.box=Math.min(p.box||1,1);p.due=Date.now();gain=2;text='S chybou. Zahraj ji ještě jednou bez chyby a bude hotová.';}
 pr[cur.id]=p;addXp(gain);save();
 const nw=nextNew();
 if(session&&session.kind==='learn'){afterAction='session';const left=session.queue.length;
  if(mode==='learn'){session.phase='drill';text='Teď ji zahraj zpaměti.';$('doneNext').textContent='Zahrát zpaměti';}
  else if(perfect){session.clean++;session.phase='learn';session.curId=null;const nx=left&&LINES().find(l=>l.id===session.queue[0]);text=nx?`Správně, bez chyby. Další na řadě: ${nx.name}.`:'Správně, bez chyby. To byla poslední varianta skupiny.';$('doneNext').textContent=nx?`Další varianta`:'Dokončit';
   if(nx&&session.total>=4&&!session.halfDone&&session.clean===Math.ceil(session.total/2)){session.halfDone=true;afterAction='halfGroup';text=`Správně! Máš naučenou polovinu skupiny (${session.clean} variant). Než půjdeš dál, zahraj si je zpaměti v náhodném pořadí.`;$('doneNext').textContent=`Drill naučené půlky (${session.clean} variant)`;}}
  else{session.fails++;text='S chybou. Zahraj ji zpaměti ještě jednou, než půjdeš dál.';$('doneNext').textContent='Zkusit znovu zpaměti';}
  renderSession();}
 else if(session){session.err=(session.err||0)+(mistakes||0);if(perfect)session.clean++;else if(store.death){session.deaths=(session.deaths||0)+1;session.queue=shuffle(session.all);session.clean=0;}else{session.queue.push(cur.id);session.fails++;}renderSession();afterAction='session';
  $('doneNext').textContent=session.queue.length?(!perfect&&store.death?'Začít drill znovu':`Další varianta`):'Dokončit';text=perfect?'Správně, bez chyby.':store.death?`Mód smrti: chyba! Celý drill začíná znovu (${session.total} variant v novém pořadí).`:'S chybou. Varianta se ti vrátí na konec drillu.';}
 else if(mode==='learn'){afterAction='drill';$('doneNext').textContent='Procvičit zpaměti';}
 else if(!perfect){afterAction='retry';$('doneNext').textContent='Zkusit znovu';}
 else if(cur.ch.lines.every(isDone)&&!isMastered(cur.ch)){afterAction='chapterTest';$('doneNext').textContent='Spustit test kapitoly';text+=` Celou kapitolu máš naučenou. Teď ji dokonči testem: všechny varianty náhodně.`;}
 else if(halfDue(cur.ch)){afterAction='halfDrill';const hl=cur.ch.lines.filter(isDone);$('doneNext').textContent=`Drill naučené půlky (${hl.length} variant)`;text+=` Máš naučenou polovinu kapitoly. Než půjdeš dál, zahraj si naučené varianty zpaměti v náhodném pořadí.`;}
 else if(nw){afterAction='new';$('doneNext').textContent='Naučit novou variantu';text+=` Další na řadě: ${nw.name}.`;}
 else{afterAction='review';$('doneNext').textContent=LINES().some(l=>!isDone(l))?'Další varianta':'Opakovat';if(LINES().every(isDone))text+=' Celý kurz máš hotový!';}
 $('doneXp').textContent='+'+gain+' XP';$('doneTitle').textContent=mode==='learn'?'Varianta prošlá':perfect?'Bez chyby!':'Skoro!';
 const pa=planArrows();$('doneSum').innerHTML=`<b>Kam hra směřuje:</b> ${endSummary()}`+pa;$('doneText').textContent=text;$('idea').innerHTML=`<b>Plán kapitoly:</b> ${cur.ch.plan}`;
 setTimeout(()=>{showDone();if(perfect||mode==='learn'){sfx('win');confetti();if(perfect)crazyWin();}},500);renderSide();renderMoves();}

function goView(v){v=Math.max(0,Math.min(ply,v));if(v===view)return;hideBoardTip();
 if(v===view+1){const m=mvs[view];animate(m,hist[v]);view=v;markLast(m);sfx(hist[v-1][m.to]||m.ep!=null?'capture':'move');}
 else{const back=v<view;view=v;setPosition(hist[v]);markLast(mvs[v-1]);if(back)sfx('move');}
 select(null);badge(null);showHint();renderMoves();
 if(mode==='free'){arrow(null);freeCard();}
 else if(view<ply){const n=view-1;if(n>=0)card('info','Prohlížíš si tahy','Klikni na šachovnici a pokračuj',moveLabel(n),`<p class="why">${noteFor(n)||explainN(n,mvs[n])}</p>`);}
 else showPrompt();}

/* ---------- Stockfish v prohlížeči (engine/stockfish.js, běží u hráče ve Web Workeru) + chess.js na pravidla ---------- */
let CHESS=null,CHP=null;function chessLib(){if(!CHP)CHP=import(new URL('engine/chess.js',document.baseURI).href).then(m=>{CHESS=m.Chess;return CHESS;}).catch(e=>{CHP=null;throw e;});return CHP;}
const SF={w:null,p:null,job:null,next:null,dead:false};
const IS_MOBILE=matchMedia('(pointer:coarse)').matches;
function sfInit(){if(SF.p)return SF.p;SF.p=new Promise((ok,ko)=>{let w;try{w=new Worker('engine/stockfish.js');}catch(e){SF.dead=true;ko(e);return;}SF.w=w;let up=false;
 const to=setTimeout(()=>{if(!up){SF.dead=true;ko(new Error('timeout'));}},20000);
 w.onmessage=e=>{const l=String(e.data||'');if(!up){if(l==='uciok'){w.postMessage('setoption name Hash value 16');w.postMessage('isready');}else if(l==='readyok'){up=true;clearTimeout(to);ok();}return;}sfLine(l);};
 w.onerror=e=>{SF.dead=true;clearTimeout(to);ko(e);};w.postMessage('uci');});return SF.p;}
function sfLine(l){const j=SF.job;if(!j)return;
 if(l.startsWith('info ')&&l.includes(' pv ')&&!/ (lower|upper)bound/.test(l)){const mp=+((l.match(/ multipv (\d+)/)||[0,1])[1]),d=+((l.match(/ depth (\d+)/)||[0,0])[1]);const sc=l.match(/ score (cp|mate) (-?\d+)/);if(!sc)return;
  const pv=l.split(' pv ')[1].trim().split(' ');let v=+sc[2];if(sc[1]==='mate')v=(v>0?1:-1)*(3000-Math.abs(v));if(j.fen.split(' ')[1]==='b')v=-v;/* skóre vždy z pohledu bílého */
  j.lines[mp-1]={cp:v,mate:sc[1]==='mate'?+sc[2]:null,pv,depth:d};if(mp===1){j.depth=d;if(j.onInfo)j.onInfo(j);}}
 else if(l.startsWith('bestmove')){SF.job=null;j.best=l.split(' ')[1]||null;j.res(j.cancelled?null:j);if(SF.next){const n=SF.next;SF.next=null;sfRun(n);}}}
function sfRun(j){SF.job=j;const w=SF.w,o=j.opt;w.postMessage('setoption name Skill Level value '+(o.skill!=null?o.skill:20));w.postMessage('setoption name MultiPV value '+(o.multipv||1));w.postMessage('position fen '+j.fen);
 w.postMessage('go'+(o.depth?' depth '+o.depth:'')+(o.movetime?' movetime '+o.movetime:'')+(o.searchmoves?' searchmoves '+o.searchmoves.join(' '):''));}
/* nová analýza zastaví běžící; čekající nahradí (zahozená vrátí null) */
/* iPhone: v trenažéru nejde stránku přetáhnout přes horní/dolní okraj (Safari ignoruje overscroll-behavior) */
(()=>{let TY=0;addEventListener('touchstart',e=>{if(e.touches.length===1)TY=e.touches[0].clientY;},{passive:true});
 addEventListener('touchmove',e=>{if(!document.body.classList.contains('trainerMode')||e.touches.length!==1||!e.cancelable)return;const dy=e.touches[0].clientY-TY;if(!dy)return;
  for(let el=e.target;el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement;el=el.parentElement){const oy=getComputedStyle(el).overflowY;
   if((oy==='auto'||oy==='scroll')&&el.scrollHeight>el.clientHeight+1){if(dy>0&&el.scrollTop>0)return;if(dy<0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)return;}}
  const se=document.scrollingElement||document.documentElement;const top=se.scrollTop<=0,bot=se.scrollTop+innerHeight>=se.scrollHeight-1;
  if((dy>0&&top)||(dy<0&&bot))e.preventDefault();},{passive:false});})();
/* úsporný režim baterie: kratší přemýšlení enginu, žádné nekonečné animace (volba platí pro tohle zařízení) */
var ECO_BAT=false;function ecoPref(){try{return localStorage.getItem('trener-eco')||'auto';}catch(e){return'auto';}}
function ecoOn(){const p=ecoPref();if(p==='on')return true;if(p==='off')return false;return ECO_BAT||matchMedia('(prefers-reduced-motion: reduce)').matches;}
function applyEco(){document.documentElement.classList.toggle('eco',ecoOn());}
try{if(navigator.getBattery)navigator.getBattery().then(b=>{const u=()=>{const was=ECO_BAT;ECO_BAT=!b.charging&&b.level<=.2;if(was!==ECO_BAT)applyEco();};u();b.addEventListener('levelchange',u);b.addEventListener('chargingchange',u);}).catch(()=>{});}catch(e){}
applyEco();
function sfAnalyse(fen,opt){if(opt&&opt.movetime&&ecoOn())opt=Object.assign({},opt,{movetime:Math.round(opt.movetime*.5)});return sfInit().then(()=>new Promise(res=>{const j={fen,opt:opt||{},lines:[],res,onInfo:opt&&opt.onInfo};
 if(SF.job){if(SF.next)SF.next.res(null);SF.next=j;if(!SF.job.stopping){SF.job.stopping=true;SF.job.cancelled=true;SF.w.postMessage('stop');}}else sfRun(j);}));}
function sfStop(){if(SF.next){SF.next.res(null);SF.next=null;}if(SF.job&&!SF.job.stopping){SF.job.stopping=true;SF.job.cancelled=true;SF.w.postMessage('stop');}}
/* FEN pozic aktuální varianty (+ volné hry) */
function fenAt(n){if(!CHESS)return null;if(!cur._fens||cur._fens.src!==cur.moves||cur._fens.n!==cur.moves.length){const g=new CHESS();const f=[g.fen()];for(const m of cur.moves){try{g.move(m,{strict:false});}catch(e){break;}f.push(g.fen());}cur._fens={src:cur.moves,n:cur.moves.length,f};}
 return cur._fens.f[n]||null;}
function pvSan(fen,pv,max){if(!CHESS)return'';const g=new CHESS(fen);const out=[];for(const u of pv.slice(0,max||6)){let m;try{m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}catch(e){break;}
  const n=g.moveNumber(),wh=m.color==='w';out.push((wh?`${n}.`:(out.length?'':`${n-1}…`))+m.san);}return out.join(' ');}
function sanOf(fen,u){return pvSan(fen,[u],1).replace(/^\d+(\.|…)+/,'');}
const fmtCp=v=>Math.abs(v)>=2900?((v>0?'+':'−')+'M'+(3000-Math.abs(v))):((v>0?'+':v<0?'−':'')+(Math.abs(v)/100).toFixed(1).replace('.',','));
/* ---- hodnocení naživo ---- */
let LIVE={t:null,fen:null};
function liveEval(){clearTimeout(LIVE.t);if(SF.dead||$('trainer').hidden)return;LIVE.t=setTimeout(async()=>{try{await chessLib();}catch(e){return;}
 const fen=fenAt(view);if(!fen||fen===LIVE.fen&&SF.job)return;LIVE.fen=fen;const bar=$('evalBar');
 try{const r=await sfAnalyse(fen,{movetime:IS_MOBILE?1500:2500,onInfo:j=>{if(j.depth>=6&&LIVE.fen===fen){showEval(j.lines[0].cp);bar.title=`Stockfish 17 · hloubka ${j.depth} · ${fmtCp(j.lines[0].cp)}`;}}});
  if(r&&r.lines[0]&&LIVE.fen===fen){showEval(r.lines[0].cp);bar.title=`Stockfish 17 · hloubka ${r.depth} · ${fmtCp(r.lines[0].cp)}`;if(mode==='free')freeInfo(r);}}catch(e){}},150);}
/* ---- proč je tah špatný ---- */
async function explainWrong(n,from,to,reveal){const u=sqName(from)+sqName(to);let fen;try{await chessLib();await sfInit();fen=fenAt(n);}catch(e){return;}if(!fen)return;
 const c=$('card');const box=document.createElement('div');box.className='engBox';box.innerHTML='<span class="spin"></span> Engine počítá, proč to není dobré…';c.appendChild(box);
 const g=new CHESS(fen);let my;try{my=g.move({from:sqName(from),to:sqName(to),promotion:'q'});}catch(e){box.remove();return;}
 const T=IS_MOBILE?900:1300;const best=await sfAnalyse(fen,{movetime:T});if(!best||!box.isConnected)return;const mine=await sfAnalyse(fen,{movetime:T,searchmoves:[my.lan||u]});if(!mine||!box.isConnected)return;
 const pov=fen.split(' ')[1]==='w'?1:-1,b0=best.lines[0],m0=mine.lines[0];if(!b0||!m0){box.remove();return;}
 const loss=Math.max(0,pov*(b0.cp-m0.cp));const after=g.fen();
 const ref=m0.pv.slice(1);const refTxt=ref.length?pvSan(after,ref,5):'';
 let h=`<b>🔎 Engine:</b> po tvém tahu <b>${my.san}</b> je hodnocení <b>${fmtCp(m0.cp)}</b>`;
 h+=loss<30?` – skoro stejně dobré jako nejlepší tah. V repertoáru ale hrajeme jiný tah.`:` – to je o <b>${(loss/100).toFixed(1).replace('.',',')} pěšce</b> horší než nejlepší tah${loss>=300?' (hrubá chyba)':loss>=100?' (chyba)':' (nepřesnost)'}.`;
 if(refTxt&&loss>=30){const rp=refTxt.split(' ');h+=`<br><b>Proč:</b> soupeř nejspíš odpoví <b>${rp[0]}</b>${rp.length>1?` a hra může pokračovat ${rp.slice(1).join(' ')}`:''}.`;}
 const rep=cur.moves[n],bs0=sanOf(fen,b0.pv[0]);const bestTxt=pvSan(fen,b0.pv,6),repNote=(rep&&bs0&&bs0.replace(/[+#]/g,'')!==rep.replace(/[+#]/g,'')?`<br><small>Engine tu dává přednost tahu ${bs0}, v repertoáru hrajeme <b>${rep}</b> – oba tahy jsou dobré.</small>`:'');
 h+=reveal?`<br><b>Jak hrát dál:</b> ${bestTxt} <small>(${fmtCp(b0.cp)})</small>${repNote}`:`<details class="engMore"><summary>Ukázat, jak hrát dál (prozradí správný tah)</summary>${bestTxt} <small>(${fmtCp(b0.cp)})</small>${repNote}</details>`;
 box.innerHTML=h;if(ref[0]&&loss>=30){/* tvůj tah průhledně + odpověď soupeře červeně */const keep=mode==='learn'||hintLevel>=3;if(!keep)arrow(null);
  arrow({from,to},'#9a9488',true,.55);arrow({from:sqOf(ref[0].slice(0,2)),to:sqOf(ref[0].slice(2,4))},'#e2533b',true,.9);
  box.insertAdjacentHTML('beforeend','<div class="engLeg"><span><i style="background:#9a9488"></i>tvůj tah</span><span><i style="background:#e2533b"></i>odpověď soupeře</span>'+(keep?'<span><i style="background:#ffaa00"></i>správný tah</span>':'')+'</div>');}
 liveEval();}
/* ---- volná hra za obě strany (po dohrání varianty) ---- */
let FREE=null;
async function startFree(){try{await chessLib();}catch(e){alert('Volnou hru se nepodařilo načíst. Obnov stránku.');return;}
 $('done').classList.remove('show');const g=new CHESS();for(const m of cur.moves.slice(0,ply))g.move(m,{strict:false});
 FREE={orig:cur,mode,g,base:ply,best:null};cur=Object.assign({},cur,{moves:cur.moves.slice(0,ply)});mode='free';finished=false;busy=false;clearIdle();clr('hintsq');arrow(null);select(null);badge(null);
 if(view!==ply)goView(ply);renderMoves();freeCard();liveEval();}
function freeTargets(from){if(!FREE)return[];return FREE.g.moves({square:sqName(from),verbose:true}).map(m=>sqOf(m.to));}
function freeMove(from,to){const g=FREE.g;let mv;try{mv=g.move({from:sqName(from),to:sqName(to),promotion:XPROMO||'q'});}catch(e){return false;}if(!mv)return false;
 const home=mv.color==='w'?0:56;const m={from,to,promo:mv.promotion?mv.promotion.toUpperCase():null,ep:mv.flags.includes('e')?to+(mv.color==='w'?-8:8):null,castle:mv.flags.includes('k')?[home+7,home+5]:mv.flags.includes('q')?[home,home+3]:null};
 cur.moves.push(mv.san);select(null);arrow(null);FREE.best=null;commit(m);renderMoves();freeCard();liveEval();return true;}
function freeTruncate(n){if(!FREE||n>=ply)return;const g=new CHESS();for(const m of cur.moves.slice(0,n))g.move(m,{strict:false});FREE.g=g;cur.moves.length=n;hist.length=n+1;mvs.length=n;ply=n;view=n;FREE.best=null;FREE.lastR=null;}
function freeUndo(){if(!FREE||view<=0)return;const t=view-1;freeTruncate(t);setPosition(hist[t]);markLast(mvs[t-1]);arrow(null);select(null);renderMoves();freeCard();liveEval();}
function freeEnd(){if(!FREE)return;cur=FREE.orig;mode=FREE.mode;FREE=null;setMode(mode);start();}
function freeCard(extra){const atEnd=view===ply;const g=atEnd?FREE.g:new CHESS(fenAt(view));const turn=g.turn()==='w'?'bílý':'černý';let st=atEnd?'':`<p class="why">Prohlížíš tah ${view}. Když teď táhneš, varianta se odtud rozvětví (další tahy se smažou).</p>`;
 if(g.isCheckmate())st=`<p class="why"><b>Mat!</b> Vyhrál ${g.turn()==='w'?'černý':'bílý'}.</p>`;else if(g.isDraw())st='<p class="why"><b>Remíza.</b></p>';else if(g.inCheck())st=`<p class="why">Šach! ${turn[0].toUpperCase()+turn.slice(1)} musí krále ochránit.</p>`;
 card('info','Volná hra',`Táhne ${turn} · hraješ za obě strany`,'',`${st}<p class="auto">Zkoušej libovolné tahy za bílého i černého. Šipkami pod šachovnicí nebo kliknutím na tah v seznamu se vrátíš kamkoli a můžeš zkusit jiný tah – třeba co by se stalo, kdyby soupeř zahrál něco jiného. Hodnocení vlevo počítá Stockfish.</p><div class="engBox" id="freeEng">${FREE.best||'<span class="spin"></span> Engine počítá…'}</div>
 <div class="freeBtns"><button class="btn" id="fBest">Nejlepší tah</button><button class="btn" id="fUndo"${view<=0?' disabled':''}>Vrátit tah</button><button class="btn" id="fEnd">Konec volné hry</button></div>`);
 $('fBest').onclick=()=>{FREE.showBest=true;if(FREE.lastR)freeInfo(FREE.lastR);};$('fUndo').onclick=freeUndo;$('fEnd').onclick=freeEnd;}
function freeInfo(r){if(!FREE)return;FREE.lastR=r;const el=document.getElementById('freeEng');if(!el)return;const l=r.lines[0];if(!l)return;const fen=r.fen;
 let h=`<b>Hodnocení:</b> ${fmtCp(l.cp)} <small>(${l.cp>40?'lepší má bílý':l.cp<-40?'lepší má černý':'vyrovnané'})</small>`;
 if(FREE.showBest){h+=`<br><b>Nejlepší pokračování:</b> ${pvSan(fen,l.pv,6)}`;if(l.pv[0])arrow({from:sqOf(l.pv[0].slice(0,2)),to:sqOf(l.pv[0].slice(2,4))},'#2f8fe8');}
 FREE.best=h;el.innerHTML=h;}

/* ---------- vysvětlivka tahu přímo na šachovnici (jen v Učení), umístěná tak, aby nezakryla žádnou figuru ---------- */
function plainTxt(h){const d=document.createElement('div');d.innerHTML=h;let t=(d.textContent||'').replace(/\s+/g,' ').trim();const m=t.match(/^(.{20,110}?[.!?])(\s|$)/);if(m)t=m[1];if(t.length>115)t=t.slice(0,112).replace(/\s\S*$/,'')+'…';return t;}
function hideBoardTip(who){document.querySelectorAll(who?'.bTip.'+who:'.bTip').forEach(t=>t.remove());}
const BOARD_TIPS=false;/* vysvětlivky jsou vpravo v panelu; bubliny na šachovnici mátly */
function boardTip(sq,text,who){who=who||'me';if(!BOARD_TIPS)return;if(who==='me')hideBoardTip();else hideBoardTip('opp');if(mode!=='learn'||!text||!SQ[sq])return;const bd=$('board');const b=hist[ply];
 const occ=new Set();b.forEach((p,i)=>{if(p&&i!==sq)occ.add(colOf(i)+','+rowOf(i));});
 /* starší bublina (moje) zůstává; když na ni teď dopadla figura, zmizí, jinak její pole nejsou volná */
 document.querySelectorAll('.bTip').forEach(t=>{const g=t._g;if(!g)return;let hit=false;for(let cx=Math.floor(g[0]);cx<Math.ceil(g[0]+g[2]);cx++)for(let cy=Math.floor(g[1]);cy<Math.ceil(g[1]+g[3]);cy++){if(occ.has(cx+','+cy)||(cx===colOf(sq)&&cy===rowOf(sq)))hit=true;occ.add(cx+','+cy);}if(hit)t.remove();});
 const c=colOf(sq),r=rowOf(sq);const len=text.length;const W=len>70?3.6:len>40?3:2.4,H=len>70?1.55:len>40?1.15:.85;
 const free=(x,y)=>{if(x<0.05||y<0.05||x+W>7.95||y+H>7.95)return false;for(let cx=Math.floor(x);cx<Math.ceil(x+W);cx++)for(let cy=Math.floor(y);cy<Math.ceil(y+H);cy++){if(occ.has(cx+','+cy)||(cx===c&&cy===r))return false;}return true;};
 const cand=[];const tries=[[c+1.08,r+.5-H/2,'l'],[c-.08-W,r+.5-H/2,'r'],[c+.5-W/2,r-.08-H,'b'],[c+.5-W/2,r+1.08,'t'],[c+1.08,r-H+.92,'l'],[c+1.08,r+.08,'l'],[c-.08-W,r-H+.92,'r'],[c-.08-W,r+.08,'r'],[c+1-W,r-.08-H,'b'],[c,r-.08-H,'b'],[c+1-W,r+1.08,'t'],[c,r+1.08,'t']];
 for(const [x,y,side] of tries){const X=Math.max(.05,Math.min(7.95-W,x)),Y=Math.max(.05,Math.min(7.95-H,y));if(free(X,Y)){cand.push([X,Y,side]);break;}}
 const el=document.createElement('div');el.className='bTip '+who;el.setAttribute('aria-hidden','true');el.textContent=text;
 if(!cand.length)return;/* není volné místo – vysvětlení je v panelu vedle */
 const [x,y,side]=cand[0];el._g=[x,y,W,H];el.classList.add('s-'+side);Object.assign(el.style,{left:x/8*100+'%',top:y/8*100+'%',width:W/8*100+'%',minHeight:H/8*100+'%'});
 const ax=side==='l'?0:side==='r'?100:Math.max(8,Math.min(92,((c+.5-x)/W)*100)),ay=side==='t'?0:side==='b'?100:Math.max(15,Math.min(85,((r+.5-y)/H)*100));el.style.setProperty('--ax',ax+'%');el.style.setProperty('--ay',ay+'%');
 bd.appendChild(el);}
/* ---------- Drawing (right mouse button like chess.com, or pen mode) ---------- */
let marks=[],drawStart=null,pen=false;
/* kreslení: šipky (koňské a jiné „křivé“ v pravém úhlu) a ztmavená pole */
/* body šipky v souřadnicích šachovnice (stejně jako při kreslení) */
function markPts(k,cx,cy){const x1=cx(k.f),y1=cy(k.f),x2=cx(k.t),y2=cy(k.t),dx=x2-x1,dy=y2-y1;if(dx===0||dy===0||Math.abs(dx)===Math.abs(dy))return[[x1,y1],[x2,y2]];const fx=Math.abs(dx)>=Math.abs(dy);return[[x1,y1],fx?[x2,y1]:[x1,y2],[x2,y2]];}
function segDist(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],L=vx*vx+vy*vy;let t=L?((px-a[0])*vx+(py-a[1])*vy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-a[0]-t*vx,py-a[1]-t*vy);}
/* pravé klepnutí bez tažení: smaže zvýrazněné pole nebo šipku pod kurzorem, jinak pole zvýrazní */
function markClick(list,sq,pt,cx,cy,c){let i=list.findIndex(k=>k.f===sq&&k.t===sq);if(i>=0){list.splice(i,1);return;}
 let best=-1,bd=.32;list.forEach((k,j)=>{if(k.f===k.t)return;const P=markPts(k,cx,cy);for(let s=0;s<P.length-1;s++){const d=segDist(pt[0],pt[1],P[s],P[s+1]);if(d<bd){bd=d;best=j;}}});
 if(best>=0){list.splice(best,1);return;}list.push({f:sq,t:sq,c});}
function boardPt(el,x,y,flip){const r=el.getBoundingClientRect();return[(x-r.left)/r.width*8,(y-r.top)/r.height*8];}
function marksSVG(list,cx,cy){return list.map(k=>{const col=k.c||'#2e9a4b';
 if(k.f===k.t)return `<rect x="${cx(k.f)-.5}" y="${cy(k.f)-.5}" width="1" height="1" fill="#000" opacity=".26"/><rect x="${cx(k.f)-.5}" y="${cy(k.f)-.5}" width="1" height="1" fill="${col}" opacity=".3"/>`;
 const x1=cx(k.f),y1=cy(k.f),x2=cx(k.t),y2=cy(k.t),dx=x2-x1,dy=y2-y1;const straight=dx===0||dy===0||Math.abs(dx)===Math.abs(dy);
 const W=.17,HL=.44,HW=.27,TIP=.1;
 let pts;if(straight){const L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;pts=[[x1+ux*.22,y1+uy*.22],[x2-ux*TIP,y2-uy*TIP]];}
 else{const fx=Math.abs(dx)>=Math.abs(dy);const m=fx?[x2,y1]:[x1,y2];pts=[[x1+(fx?Math.sign(dx)*.22:0),y1+(fx?0:Math.sign(dy)*.22)],m,[x2-(fx?0:Math.sign(dx)*TIP),y2-(fx?Math.sign(dy)*TIP:0)]];}
 const [ax,ay]=pts[pts.length-2],[bx,by]=pts[pts.length-1],L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L,px=-uy,py=ux,hx=bx-ux*HL,hy=by-uy*HL;
 const shaft=pts.slice(0,-1).concat([[hx+ux*.02,hy+uy*.02]]).map(p=>p.join(',')).join(' ');
 const headPts=`${hx+px*HW},${hy+py*HW} ${bx},${by} ${hx-px*HW},${hy-py*HW}`;
 return `<g class="mk" opacity=".85"><polyline points="${shaft}" fill="none" stroke="${col}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/><polygon points="${headPts}" fill="${col}" stroke="${col}" stroke-width=".05" stroke-linejoin="round"/></g>`;}).join('');}
function renderMarks(){$('draw').innerHTML=marksSVG(marks,q=>colOf(q)+.5,q=>rowOf(q)+.5);}
function clearMarks(){if(marks.length){marks=[];renderMarks();}}
function toggleMark(f,t,c){const i=marks.findIndex(k=>k.f===f&&k.t===t);if(i>=0)marks.splice(i,1);else marks.push({f,t,c});renderMarks();}
const markColor=e=>e.shiftKey?'#d6453d':e.altKey?'#2f7fd8':e.ctrlKey||e.metaKey?'#e8962b':'#2e9a4b';
boardEl.addEventListener('contextmenu',e=>e.preventDefault());
let holdT=null;boardEl.addEventListener('pointerdown',e=>{if(e.button===2||(pen&&e.button===0)){const i=sqAt(e.clientX,e.clientY);if(i!=null){drawStart={sq:i,c:markColor(e)};clearTimeout(holdT);holdT=setTimeout(()=>{if(drawStart&&drawStart.sq===i){marks=[];renderMarks();drawStart=null;}},650);e.stopImmediatePropagation();e.preventDefault();}}},true);
window.addEventListener('pointerup',e=>{clearTimeout(holdT);if(!drawStart)return;const i=sqAt(e.clientX,e.clientY);if(i!=null){if(i===drawStart.sq){markClick(marks,i,boardPt(boardEl,e.clientX,e.clientY),q=>colOf(q)+.5,q=>rowOf(q)+.5,drawStart.c);renderMarks();}else toggleMark(drawStart.sq,i,drawStart.c);}drawStart=null;},true);
$('flipBtn').onclick=()=>boardFlip();$('penBtn').onclick=()=>{pen=!pen;$('penBtn').setAttribute('aria-pressed',pen);if(!pen)clearMarks();};
/* ---------- Pointer ---------- */
function sqAt(x,y){const r=boardEl.getBoundingClientRect();const col=Math.floor((x-r.left)/r.width*8),row=Math.floor((y-r.top)/r.height*8);
 if(col<0||col>7||row<0||row>7)return null;const f=flipped?7-col:col,rk=flipped?row:7-row;return rk*8+f;}
let hov=null;function setHov(i){if(hov!=null)SQ[hov].classList.remove('hov');hov=i;if(i!=null)SQ[i].classList.add('hov');}
boardEl.addEventListener('pointerdown',e=>{if(e.button>0)return;ac();const i=sqAt(e.clientX,e.clientY);if(i==null)return;
 if(view!==ply){if(mode==='free')freeTruncate(view);else{goView(ply);return;}}if(finished||busy||!userTurn())return;const b=board();
 if(b[i]&&b[i][0]===(mode==='free'?FREE.g.turn():me())){const was=sel===i;select(i);drag={from:i,el:pcs[i],x:e.clientX,y:e.clientY,moved:false,was};boardEl.setPointerCapture(e.pointerId);e.preventDefault();return;}
 if(sel!=null){const from=sel;if(tgts(from).includes(i))tryMove(from,i);else select(null);}});
boardEl.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;
 drag.moved=true;const r=boardEl.getBoundingClientRect(),s=r.width/8;drag.el.classList.add('drag');
 const x=Math.max(-s/2,Math.min(r.width-s/2,e.clientX-r.left-s/2)),y=Math.max(-s/2,Math.min(r.height-s/2,e.clientY-r.top-s/2));
 drag.el.style.transform=`translate(${x}px,${y}px)`;setHov(sqAt(e.clientX,e.clientY));});
boardEl.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;setHov(null);
 if(d.moved){const to=sqAt(e.clientX,e.clientY);if(to!=null&&to!==d.from&&tgts(d.from).includes(to))tryMove(d.from,to);else{d.el.classList.remove('drag');place(d.el,d.from);}}
 else if(d.was)select(null);});
boardEl.addEventListener('pointercancel',()=>{if(drag){drag.el.classList.remove('drag');place(drag.el,drag.from);drag=null;setHov(null);}});

/* ---------- Confetti ---------- */
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas');c.className='confetti';boardEl.appendChild(c);
 const r=boardEl.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=r.width*dpr;c.height=r.height*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);
 const cols=['#81b64c','#f2c14e','#ffffff','#e8573f','#5fb3f9'];const Pp=Array.from({length:120},()=>({x:r.width/2,y:r.height*.55,vx:(Math.random()-.5)*10,vy:-Math.random()*11-4,s:Math.random()*6+4,a:Math.random()*6,va:(Math.random()-.5)*.4,c:cols[Math.random()*cols.length|0]}));
 let t=0;(function f(){t++;x.clearRect(0,0,r.width,r.height);Pp.forEach(p=>{p.vy+=.33;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore();});if(t<95)requestAnimationFrame(f);else c.remove();})();}

/* ---------- Controls ---------- */
function setMode(m){mode=m;$('mLearn').setAttribute('aria-pressed',m==='learn');$('mDrill').setAttribute('aria-pressed',m==='drill');}
$('mLearn').onclick=()=>{endSession();setMode('learn');start();};$('mDrill').onclick=()=>{setMode('drill');start();};
$('restart').onclick=start;$('doneMenu').onclick=showHome;$('doneFree').onclick=startFree;$('doneClose').onclick=()=>$('done').classList.remove('show');
$('doneAgain').onclick=()=>{if(session&&session.queue[session.queue.length-1]===cur.id&&finished)session.queue.pop();start();};
$('hintBtn').onclick=()=>{if(mode==='free'){FREE.showBest=true;if(FREE.lastR)freeInfo(FREE.lastR);return;}if(finished||!userTurn()||busy)return;if(view!==ply)goView(ply);if(mode==='learn')return;hintLevel=Math.min(3,hintLevel+1);mistakes=Math.max(mistakes,1);showPrompt();showHint();};
function nextDue(){const L=ORDER();const due=L.find(l=>stateOf(l)==='due'),lr=L.find(l=>stateOf(l)==='lapsed')||L.find(l=>stateOf(l)==='learning'),nw=nextNew();
 if(due){cur=due;setMode('drill');}else if(lr){cur=lr;setMode('drill');}else if(nw){cur=nw;setMode('learn');}else{cur=L.slice().sort((a,b)=>P()[a.id].due-P()[b.id].due)[0];setMode('drill');}start();}
$('next').onclick=nextDue;let afterAction='review',groupIds=[];
let RAND=null;
$('doneNext').onclick=()=>{if(afterAction==='randMore'&&RAND){randDrill(RAND);return;}if(afterAction==='halfDrill'){const ch=cur.ch;store.half=store.half||{};store.half[mKey(ch)]=true;save();startSession(ch.lines.filter(isDone),`Drill naučené půlky: ${ch.t}`,null);session.half=true;renderSession();return;}
 if(afterAction==='halfGroup'){const parent=session;const ids=parent.all.filter(id=>!parent.queue.includes(id));session={label:'Drill naučené půlky',all:ids,queue:shuffle(ids),total:ids.length,clean:0,fails:0,ch:null,parent};nextInSession();return;}
 if(afterAction==='groupTest'){startSession(LINES().filter(l=>groupIds.includes(l.id)),'Test skupiny',null);return;}if(afterAction==='session'){nextInSession();return;}if(afterAction==='chapterTest'){startSession(cur.ch.lines,`Test kapitoly: ${cur.ch.t}`,cur.ch);return;}if(afterAction==='drill'){setMode('drill');start();}else if(afterAction==='retry'){start();}else if(afterAction==='new'){const n=nextNew();if(n){cur=n;setMode('learn');start();}else nextDue();}else nextDue();};
$('nFirst').onclick=()=>goView(0);$('nPrev').onclick=()=>goView(view-1);$('nNext').onclick=()=>goView(view+1);$('nLast').onclick=()=>goView(ply);
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){goView(view-1);e.preventDefault();}if(e.key==='ArrowRight'){goView(view+1);e.preventDefault();}});
const SND_ON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const SND_OFF='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.5 2.5V12zM19 12c0 .9-.2 1.8-.5 2.6l1.5 1.5A9 9 0 0 0 14 3.2v2.1A7 7 0 0 1 19 12zM4.3 3 3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3c-.7.5-1.4.9-2.3 1.2v2.1a9 9 0 0 0 3.7-1.8l2 2 1.3-1.3L4.3 3zM12 4 9.9 6.1 12 8.2V4z"/></svg>';
function renderSound(){$('sound').innerHTML=store.sound?SND_ON:SND_OFF;$('sound').setAttribute('aria-label',store.sound?'Vypnout zvuk':'Zapnout zvuk');}
$('sound').onclick=()=>{store.sound=!store.sound;save();renderSound();if(store.sound){ac();sfx('move');}};
applyTheme();applyT1();applyAlien();renderSound();parseRoute();cur=pickStart();flipped=course.side==='b';buildSquares();showHome();
{const fb=$('fsBtn');const can=document.fullscreenEnabled&&matchMedia('(pointer:fine)').matches&&window.top===window;fb.hidden=!can;
 const upd=()=>{fb.innerHTML=document.fullscreenElement?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';fb.title=document.fullscreenElement?'Ukončit celou obrazovku (Esc)':'Celá obrazovka (F11)';};
 fb.onclick=()=>{try{if(document.fullscreenElement){document.exitFullscreen();store.fs=false;}else{document.documentElement.requestFullscreen({navigationUI:'hide'});store.fs=true;}saveLocal();}catch(e){}};
 document.addEventListener('fullscreenchange',upd);upd();
 /* když to hráč chtěl naposledy, na celou obrazovku se přepne při prvním kliknutí */
 if(can&&store.fs){const once=()=>{document.removeEventListener('pointerdown',once,true);if(!document.fullscreenElement)document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{});};document.addEventListener('pointerdown',once,true);}}
$('homeTop').onclick=()=>go('');$('rzTop').onclick=()=>go(store.ccName?'#rozbor/'+encodeURIComponent(store.ccName):'#rozbor');$('dsTop').onclick=()=>go('#sachovnice');updDsBadge();$('accTop').onclick=()=>{if(SYNC.be&&SYNC.be.kind==='supa')go('#profil');else openAccount();};$('sLvl').onclick=()=>go('#profil');renderLvl();$('devTop').onclick=openDev;window.addEventListener('hashchange',pkNav);renderAccTop();nxInitNav();setTimeout(()=>{pkEnter();nxMark();},0);try{document.fonts.ready.then(()=>nxMark());}catch(e){}addEventListener('load',()=>nxMark());
try{$('appVer').textContent='Verze '+APP_VERSION+'.';}catch(e){}
initCloud();window.addEventListener('pagehide',()=>{if(SYNC.dirty){clearTimeout(SYNC.t);pushCloud();}});
/* bez přibližování (iPhone ignoruje user-scalable=no, proto i gesta) */
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});
let lastTouchEnd=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastTouchEnd<300&&!e.target.closest('input,textarea'))e.preventDefault();lastTouchEnd=n;},{passive:false});
/* aplikace v mobilu (PWA): service worker jen na https/localhost a mimo frame (v Claude artifactu se nic nemění) */
try{if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))&&window.top===window)
 {let had=!!navigator.serviceWorker.controller,reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!reloaded){reloaded=true;location.reload();}had=true;});
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{try{r.update();}catch(e){}}).catch(()=>{}));}}catch(e){}
/* po návratu signálu hned poslat neuložený postup do účtu */
window.addEventListener('online',()=>{setSync(SYNC.state);if(SYNC.be&&(SYNC.dirty||SYNC.be.offline)){SYNC.dirty=true;clearTimeout(SYNC.t);pushCloud();}});
window.addEventListener('offline',()=>setSync(SYNC.state));
