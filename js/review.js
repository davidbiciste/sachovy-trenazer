/* Rozbor partie (#review). Pořadí načítání je v index.html (APP_JS). */
/* ---------- Rozbor partie (#review): hodnocení každého tahu jako game review na chess.com ---------- */
const RV_CLS={brill:{l:'Brilantní tah',s:'!!',c:'#1fa79a'},great:{l:'Skvělý tah',s:'!',c:'#5c8bb0'},best:{l:'Nejlepší tah',s:'★',c:'#81b64c'},exc:{l:'Výborný tah',s:'✓',c:'#81b64c'},good:{l:'Dobrý tah',s:'✓',c:'#95b776'},book:{l:'Teorie',s:'T',c:'#a88865'},inacc:{l:'Nepřesnost',s:'?!',c:'#e6b43c'},mist:{l:'Chyba',s:'?',c:'#e58f2a'},miss:{l:'Promarněná šance',s:'×',c:'#d6534a'},blun:{l:'Hrubá chyba',s:'??',c:'#ca3431'}};
const RV_ORDER=['brill','great','best','exc','good','book','inacc','mist','miss','blun'];
let RV={g:null,run:0,busy:false,k:0,vg:null};
function rvLoadSaved(){if(RV.g)return;try{const j=sessionStorage.getItem('trener-review');if(j)RV.g=JSON.parse(j);}catch(e){}}
function rvSet(game){/* game: {fen0, sans, w, b, me, src} */const k='rv:'+(game.fen0||'start')+':'+game.sans.join(' ');RV.g=Object.assign({key:k,ev:[],best:[],gap:[]},game);RV.k=0;/* rozbor začíná od výchozí pozice */try{sessionStorage.setItem('trener-review',JSON.stringify(RV.g));}catch(e){}}
function rvOpen(game){rvSet(game);go('#review');}
const RV_START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
function rvFens(){const G=RV.g;if(G._f)return G._f;const g=new CHESS(G.fen0||RV_START);const f=[g.fen()],mv=[];for(const s of G.sans){let m=null;try{m=g.move(s,{strict:false});}catch(e){}if(!m)break;mv.push(m);f.push(g.fen());}G._f=f;G._m=mv;return f;}
async function rvAnalyse(){const G=RV.g;if(!G)return;const my=++RV.run;RV.busy=true;rvProg();
 const c=await rzGet('e',G.key);if(c&&c.ev&&c.ev.length>=rvFens().length){G.ev=c.ev;G.best=c.best;G.gap=c.gap;RV.busy=false;rvProg();rvRender();return;}
 const F=rvFens();const ms=IS_MOBILE?250:350;
 for(let k=0;k<F.length;k++){if(my!==RV.run||page!=='review')return;if(G.ev[k]!=null)continue;
  const g=new CHESS(F[k]);if(g.isCheckmate()){G.ev[k]=g.turn()==='w'?-3000:3000;continue;}if(g.isDraw()){G.ev[k]=0;continue;}
  let r=null;try{r=await sfAnalyse(F[k],{movetime:ms,multipv:2});}catch(e){RV.fail=true;break;}
  if(!r){if(my!==RV.run||page!=='review')return;k--;continue;}
  const l1=r.lines[0],l2=r.lines[1];G.ev[k]=l1?Math.max(-3000,Math.min(3000,l1.cp)):0;G.best[k]=l1&&l1.pv[0];G.gap[k]=l1&&l2?Math.abs(rzWp(l1.cp)-rzWp(l2.cp)):null;
  rvProg(k+1,F.length);if(page==='review'&&(k%4===0||k===F.length-1))rvRender(true);if(page==='review'&&(k===RV.k||k===RV.k-1))rvShow();}
 if(my!==RV.run)return;RV.busy=false;rvProg();if(!RV.fail)rzPut('e',G.key,{ev:G.ev,best:G.best,gap:G.gap});if(page==='review')rvRender();}
function rvProg(a,n){const el=document.getElementById('rvProg');if(!el)return;if(!RV.busy){el.hidden=true;return;}el.hidden=false;el.querySelector('span').textContent=n?`Stockfish hodnotí tahy… ${a} z ${n}`:'Spouštím Stockfish…';if(n)el.querySelector('i').style.width=(a/n*100)+'%';}
/* klasifikace tahu k (1..N) z pohledu toho, kdo táhl */
function rvClass(k){const G=RV.g,F=rvFens(),m=G._m[k-1];if(!m)return null;const b=G.ev[k-1],a=G.ev[k];if(b==null||a==null)return null;
 const s=m.color==='w'?1:-1,wb=rzWp(s*b),wa=rzWp(s*a),drop=wb-wa;const uci=m.from+m.to+(m.promotion||'');const isBest=G.best[k-1]&&G.best[k-1].slice(0,4)===uci.slice(0,4);
 if(k<=24&&rvBook(k))return{c:'book',drop};
 const prev=k>1?rvDrop(k-1):0;
 if(!isBest&&drop>=10&&prev>=10&&wb>=55)return{c:'miss',drop};
 if(drop>=20)return{c:'blun',drop};if(drop>=10)return{c:'mist',drop};if(drop>=5)return{c:'inacc',drop};
 if((isBest||drop<1)&&wb<95&&wa>=45&&rvSac(k))return{c:'brill',drop};
 if(isBest&&G.gap[k-1]!=null&&G.gap[k-1]>=15&&wb<90&&wb>10)return{c:'great',drop};
 if(isBest)return{c:'best',drop};if(drop<2)return{c:'exc',drop};return{c:'good',drop};}
function rvDrop(k){const G=RV.g,m=G._m[k-1];if(!m)return 0;const b=G.ev[k-1],a=G.ev[k];if(b==null||a==null)return 0;const s=m.color==='w'?1:-1;return rzWp(s*b)-rzWp(s*a);}
function rvBook(k){const I=rzIdx();if(!I)return false;const F=rvFens();for(let i=1;i<=k;i++){if(!I.has(F[i].split(' ').slice(0,3).join(' ')))return false;}return true;}
function rvSac(k){/* oběť: tažená figura (nebo jiná) zůstane napadená a nedostatečně krytá a má cenu aspoň 3 */const F=rvFens(),m=RV.g._m[k-1];try{const g=new CHESS(F[k]);const me=m.color,op=me==='w'?'b':'w';const V={p:1,n:3,b:3,r:5,q:9,k:0};
  for(const row of g.board())for(const x of row){if(!x||x.color!==me||V[x.type]<3)continue;const att=g.attackers(x.square,op);if(!att.length)continue;const def=g.attackers(x.square,me);const minA=Math.min(...att.map(q=>{const t=g.get(q).type;return t==='k'?100:V[t];}));if(!def.length||minA<V[x.type]){if(m.captured&&V[m.captured]>=V[x.type])continue;return true;}}}catch(e){}return false;}
function rvAcc(col){const G=RV.g,out=[];for(let k=1;k<=G._m.length;k++){const m=G._m[k-1];if(m.color!==col)continue;const d=rvDrop(k);if(G.ev[k]==null)continue;out.push(Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*Math.max(0,d))-3.1669)));}return out.length?Math.round(out.reduce((a,b)=>a+b,0)/out.length*10)/10:null;}
function rvRating(col){const G=RV.g;let t=0,n=0;const cl=v=>Math.max(-1000,Math.min(1000,v));for(let k=1;k<=G._m.length;k++){const m=G._m[k-1];if(m.color!==col||G.ev[k]==null||G.ev[k-1]==null)continue;const s=col==='w'?1:-1;t+=Math.max(0,cl(s*G.ev[k-1])-cl(s*G.ev[k]));n++;}if(n<6)return null;const acpl=t/n;
 const T=[[15,2400],[30,2000],[50,1500],[65,1200],[80,1000],[100,800],[130,600],[180,400],[260,250],[400,100]];if(acpl<=T[0][0])return T[0][1];for(let i=1;i<T.length;i++){const [c1,v1]=T[i-1],[c2,v2]=T[i];if(acpl<=c2)return Math.round((v1+(v2-v1)*(acpl-c1)/(c2-c1))/50)*50;}return 100;}
/* ---- Rozbor partie: poslední partie z chess.com (veřejné API, stejné jako Rozbor hráče) ---- */
async function rvCcLoad(name){const msg=$('rvCcMsg'),list=$('rvCcList');if(!msg)return;name=(name||'').trim().toLowerCase();
 if(!name){msg.textContent='Napiš své jméno na chess.com.';return;}msg.textContent='Načítám partie z chess.com…';list.innerHTML='';
 try{const base='https://api.chess.com/pub/player/'+encodeURIComponent(name);let arch;
  try{arch=(await rzJson(base+'/games/archives')).archives||[];rzPut('m',name+'/archives',arch);}catch(e){if(e.nf)throw e;arch=await rzGet('m',name+'/archives');if(!arch)throw e;}
  const months=arch.map(u=>String(u).match(/(\d{4})\/(\d{2})$/)).filter(Boolean).map(m=>m[1]+'/'+m[2]).sort().reverse().slice(0,3);let games=[];
  for(const mk of months){let gs=null;try{gs=(await rzJson(base+'/games/'+mk)).games||[];}catch(e){gs=await rzGet('m',name+'/'+mk)||await rzGet('m',name+'/'+mk+'/cur')||[];}
   games.push(...gs.filter(g=>g.pgn&&(!g.rules||g.rules==='chess')));if(games.length>=25)break;}
  games.sort((a,b)=>(b.end_time||0)-(a.end_time||0));
  if(store.ccName!==name){store.ccName=name;save();}
  RV.cc={name,games:games.slice(0,25)};if(page!=='review')return;rvCcDraw();}
 catch(e){if(!$('rvCcMsg'))return;$('rvCcMsg').textContent=e.nf?'Hráč s tímhle jménem na chess.com není. Zkontroluj, jak se jméno píše.':'Nepodařilo se spojit s chess.com. Zkus to za chvíli znovu.';}}
function rvCcDraw(){const msg=$('rvCcMsg'),list=$('rvCcList');if(!msg||!RV.cc)return;const {name,games}=RV.cc;
 if(!games.length){msg.textContent='Na chess.com zatím nejsou žádné partie za poslední 3 měsíce.';list.innerHTML='';return;}
 {const n=games.length;msg.textContent=`${n===1?'Poslední partie':n<5?'Poslední '+n+' partie':'Posledních '+n+' partií'} hráče ${name}. Klepni na partii a Stockfish ji rozebere.`;}
 const TC={bullet:'Bullet',blitz:'Blitz',rapid:'Rapid',daily:'Korespondenčně'};
 list.innerHTML=games.map((g,i)=>{const me=(g.white&&g.white.username||'').toLowerCase()===name?'w':'b';const my=g[me==='w'?'white':'black'],op=g[me==='w'?'black':'white'];
  const r=my.result==='win'?'win':['agreed','repetition','stalemate','insufficient','50move','timevsinsufficient'].includes(my.result)?'draw':'loss';
  const d=g.end_time?new Date(g.end_time*1000).toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric'}):'';
  return `<button class="rvCcGame ${r}" data-i="${i}"><span class="rvCcRes">${r==='win'?'Výhra':r==='draw'?'Remíza':'Prohra'}</span><span class="rvCcOpp"><b>${escH(op.username||'?')}</b> <small>${op.rating||''}</small></span><span class="rvCcMeta">${me==='w'?'bílými':'černými'} · ${TC[g.time_class]||g.time_class||''} · ${d}</span></button>`;}).join('');
 list.onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;const g=games[+b.dataset.i];const c=new CHESS();
  try{c.loadPgn(g.pgn,{strict:false});}catch(err){try{c.loadPgn(g.pgn);}catch(e2){msg.textContent='Tuhle partii se nepodařilo přečíst.';return;}}
  const h=c.history();if(h.length<2){msg.textContent='V téhle partii nejsou skoro žádné tahy.';return;}
  const me=(g.white.username||'').toLowerCase()===name?'w':'b';rvSet({sans:h,w:g.white.username+(g.white.rating?' ('+g.white.rating+')':''),b:g.black.username+(g.black.rating?' ('+g.black.rating+')':''),me,src:'cc'});scrollTo(0,0);renderReview();};}
async function renderReview(){document.body.classList.add('homeMode');XB.mode='rv';
 if(!CHESS){$('home').innerHTML='<a class="backAll" href="#">← Všechny kurzy</a><p class="profEmpty">Načítám…</p>';try{await chessLib();}catch(e){return;}if(page!=='review')return;}
 rvLoadSaved();
 if(!RV.g){$('home').innerHTML=`<a class="backAll" href="#">← Všechny kurzy</a><div class="profCard rvHead"><h1>Rozbor partie</h1><p class="profEmpty">Stockfish ohodnotí každý tah obou hráčů – jako game review na chess.com. Vyber partii z chess.com, nebo vlož PGN.</p>
  <h2 class="rvCcT">Partie z chess.com</h2><form class="rvCcForm" id="rvCcForm"><input id="rvCcName" placeholder="Jméno na chess.com" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escH(store.ccName||'')}"><button class="btn primary" id="rvCcGo">Načíst partie</button></form><p class="accMsg" id="rvCcMsg"></p><div class="rvCcList" id="rvCcList"></div>
  <h2 class="rvCcT">Nebo vlož PGN</h2><textarea id="rvPgn" class="rvPgn" placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 …"></textarea><div class="tuBtns"><button class="btn primary" id="rvGo">Rozebrat partii</button></div><p class="accMsg" id="rvErr"></p></div>`;renderSide();
  $('rvGo').onclick=()=>{const t=$('rvPgn').value.trim();const g=new CHESS();try{g.loadPgn(t,{strict:false});}catch(e){try{g.loadPgn(t);}catch(e2){$('rvErr').textContent='PGN se nepodařilo přečíst. Zkontroluj zápis.';return;}}const h=g.history();if(h.length<2){$('rvErr').textContent='V PGN nejsou žádné tahy.';return;}
   const hd=g.getHeaders?g.getHeaders():(g.header?g.header():{});rvSet({sans:h,w:hd.White||'Bílý',b:hd.Black||'Černý',me:'w',src:'pgn'});renderReview();};
  $('rvCcForm').onsubmit=e=>{e.preventDefault();rvCcLoad($('rvCcName').value.trim());};
  if(RV.cc&&RV.cc.name)rvCcDraw();else if(store.ccName)rvCcLoad(store.ccName);
  return;}
 const G=RV.g;rvFens();
 $('home').innerHTML=`<a class="backAll" href="#">← Všechny kurzy</a>
 <div class="exWrap rvWrap"><div class="exLeft"><div class="profCard"><div class="rvPl top" id="rvPlTop"></div><div class="xRow"><div class="evalBar" id="xEval" title="Hodnocení podle Stockfishe"><div class="w" id="xEvalW"></div><span class="top" id="xEvalTop"></span><span class="bot" id="xEvalBot"></span></div><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div><div class="rvPl bot" id="rvPlBot"></div>
 <div class="tuNav rvNav"><button class="btn" id="rvS" title="Na začátek">⏮</button><button class="btn" id="rvB" title="Tah zpět (←)">◀</button><button class="btn" id="rvF" title="Tah vpřed (→)">▶</button><button class="btn" id="rvE" title="Na konec">⏭</button><button class="btn" id="rvFlip" title="Otočit šachovnici">⇅</button></div></div></div>
 <div class="exRight"><div class="profCard"><h2>Rozbor partie</h2><div class="rzProg" id="rvProg" hidden><span></span><div class="bar"><i style="width:2%"></i></div></div><div id="rvMove"></div></div><div class="profCard" id="rvSum"></div><div class="profCard"><h2>Tahy</h2><div class="rvMoves" id="rvMoves"></div><div class="tuBtns"><button class="btn" id="rvNew">Jiná partie</button></div></div></div></div>`;
 renderSide();RV.flip=G.me==='b';xBuild();xInput();
 $('rvS').onclick=()=>rvGo(0);$('rvB').onclick=()=>rvGo(RV.k-1);$('rvF').onclick=()=>rvGo(RV.k+1);$('rvE').onclick=()=>rvGo(G._m.length);$('rvFlip').onclick=()=>{RV.flip=!RV.flip;xBuild();rvShow();};
 $('rvNew').onclick=()=>{RV.g=null;RV.run++;try{sessionStorage.removeItem('trener-review');}catch(e){}renderReview();};
 $('rvMoves').onclick=e=>{const b=e.target.closest('[data-k]');if(b)rvGo(+b.dataset.k);};
 $('rvSum').onclick=e=>{const b=e.target.closest('[data-k]');if(b){rvGo(+b.dataset.k);return;}const sv=e.target.closest('.rvGraph');if(sv){const r=sv.getBoundingClientRect();rvGo(Math.round((e.clientX-r.left)/r.width*RV.g._m.length));}};
 rvRender();if(G.ev.length<rvFens().length||G.ev.some(v=>v==null))rvAnalyse();else{RV.busy=false;}}
function rvGo(k){if(!RV.g)return;RV.k=Math.max(0,Math.min(RV.g._m.length,k));rvShow();sfx('move');}
function rvRender(partial){if(page!=='review'||!RV.g||!document.getElementById('rvSum'))return;const G=RV.g,N=G._m.length;
 const cls=[];for(let k=1;k<=N;k++)cls[k]=rvClass(k);G._c=cls;
 /* souhrn */const cnt=c=>({w:cls.filter((x,k)=>x&&x.c===c&&G._m[k-1].color==='w').length,b:cls.filter((x,k)=>x&&x.c===c&&G._m[k-1].color==='b').length});
 const aw=rvAcc('w'),ab=rvAcc('b'),rw=rvRating('w'),rb=rvRating('b');
 const graph=rvGraph();
 $('rvSum').innerHTML=`<div class="rvAccRow"><div><b>${escH(G.w)}</b><span class="rvAcc">${aw==null?'–':aw.toString().replace('.',',')}</span><small>přesnost</small></div><div><b>${escH(G.b)}</b><span class="rvAcc">${ab==null?'–':ab.toString().replace('.',',')}</span><small>přesnost</small></div></div>
 ${graph}
 <table class="rvCnt"><tbody>${RV_ORDER.map(c=>{const n=cnt(c);return `<tr><td>${n.w}</td><td><span class="rvIc" style="background:${RV_CLS[c].c}">${RV_CLS[c].s}</span> ${RV_CLS[c].l}</td><td>${n.b}</td></tr>`;}).join('')}
 <tr class="rvRat"><td>${rw||'–'}</td><td>Výkon v partii (odhad Elo)</td><td>${rb||'–'}</td></tr></tbody></table>${partial||RV.busy?'<p class="profEmpty">Hodnocení se ještě doplňuje…</p>':''}`;
 /* tahy */$('rvMoves').innerHTML=G._m.map((m,i)=>{const k=i+1,c=cls[k];return (i%2===0?`<b class="rvNo">${i/2+1}.</b>`:'')+`<button class="rvMv${k===RV.k?' cur':''}" data-k="${k}">${c?`<span class="rvIc sm" style="background:${RV_CLS[c.c].c}">${RV_CLS[c.c].s}</span>`:''}${czSan(m.san)}</button>`;}).join(' ');
 rvShow();}
function rvGraph(){const G=RV.g,N=G._m.length;if(!N)return'';const W=300,H=70;const pts=[];for(let k=0;k<=N;k++){const v=G.ev[k];if(v==null)continue;const y=H-rzWp(v)/100*H;pts.push([k/N*W,y]);}if(pts.length<2)return'';
 const area=`M0,${H} `+pts.map(p=>`L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')+` L${pts[pts.length-1][0].toFixed(1)},${H} Z`;
 const marks=(G._c||[]).map((c,k)=>c&&(c.c==='blun'||c.c==='mist'||c.c==='miss'||c.c==='brill'||c.c==='great')&&G.ev[k]!=null?`<circle cx="${(k/N*W).toFixed(1)}" cy="${(H-rzWp(G.ev[k])/100*H).toFixed(1)}" r="3" fill="${RV_CLS[c.c].c}" data-k="${k}"/>`:'').join('');
 return `<svg class="rvGraph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Graf hodnocení partie"><rect width="${W}" height="${H}" fill="#3c3a37"/><path d="${area}" fill="#f3f3f1"/><line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="#888" stroke-width=".5"/><line id="rvCur" x1="0" x2="0" y1="0" y2="${H}" stroke="var(--accent)" stroke-width="1.5"/>${marks}</svg>`;}
function rvShow(){const G=RV.g;if(!G||!document.getElementById('xBoard'))return;const k=RV.k,F=rvFens();RV.vg=new CHESS(F[k]);
 if(k>0){/* aby se ukázal poslední tah, přehraj partii po tah k */const g=new CHESS(F[0]);for(let i=0;i<k;i++)g.move(G._m[i].san);RV.vg=g;}
 xMorph();document.querySelectorAll('#xPcs .rvBadgeB').forEach(e=>e.remove());xArrow(null);
 const c=k>0&&G._c?G._c[k]:null,m=k>0?G._m[k-1]:null;
 if(c&&m){const el=document.createElement('div');el.className='badge rvBadgeB';xPlace(el,sqOf(m.to));el.innerHTML=`<span style="background:${RV_CLS[c.c].c}">${RV_CLS[c.c].s}</span>`;$('xPcs').appendChild(el);}
 if(G.ev[k]!=null)xBar(G.ev[k]);
 const showBest=c&&['inacc','mist','miss','blun','good'].includes(c.c)&&G.best[k-1];if(showBest)xArrow(G.best[k-1],'green');
 const cur=document.getElementById('rvCur');if(cur&&G._m.length){const x=k/G._m.length*300;cur.setAttribute('x1',x);cur.setAttribute('x2',x);}
 document.querySelectorAll('.rvMv').forEach(b=>b.classList.toggle('cur',+b.dataset.k===k));{const mv=$('rvMoves');const cb=mv&&mv.querySelector('.rvMv.cur');if(cb){const r=cb.getBoundingClientRect(),R=mv.getBoundingClientRect();if(r.top<R.top||r.bottom>R.bottom)mv.scrollTop+=r.top-R.top-R.height/2;}}
 /* hráči nad/pod šachovnicí */const top=RV.flip?'w':'b',bot=RV.flip?'b':'w';$('rvPlTop').textContent=G[top];$('rvPlBot').textContent=G[bot];
 /* popis tahu */const el=$('rvMove');if(!el)return;
 if(!m){el.innerHTML=`<p class="profEmpty">${escH(G.w)} – ${escH(G.b)}. Klepni na ▶ nebo na tah v seznamu. Šipkami ← → procházíš partii.</p>`;return;}
 const who=m.color==='w'?G.w:G.b;let txt='';
 if(!c){el.innerHTML=`<div class="rvCard"><b>${rzMvLab(m.san,k-1)}</b> <span class="profEmpty">čeká na hodnocení…</span></div>`;return;}
 const C=RV_CLS[c.c];const arr=(()=>{const g=new CHESS(F[k-1]);return tuArr(g);})();const ex=tuExplain(arr,m);
 const bestSan=G.best[k-1]?czSan(sanOf(F[k-1],G.best[k-1])):'';
 const rep=G.best[k]&&['mist','blun','miss','inacc'].includes(c.c)?tuSanExplain(F[k],G.best[k]):null;
 const msg={brill:'Brilantní! Obětuješ materiál, a přesto je to nejlepší tah.',great:'Skvělý tah – jediný, který drží pozici. Ostatní tahy by byly výrazně horší.',best:'Nejlepší tah podle Stockfishe.',exc:'Výborný tah, skoro stejně dobrý jako nejlepší.',good:'Dobrý tah, ale našlo se lepší pokračování.',book:'Teorie – tah, který znáš z kurzů.',inacc:'Nepřesnost – drobná ztráta.',mist:'Chyba – tímhle tahem jsi pustil část výhody.',miss:'Promarněná šance – soupeř předtím chyboval a tenhle tah to nevyužil.',blun:'Hrubá chyba – pozice se tím výrazně zhoršila.'}[c.c];
 el.innerHTML=`<div class="rvCard" style="border-left-color:${C.c}"><div class="rvCardH"><span class="rvIc" style="background:${C.c}">${C.s}</span><b>${rzMvLab(m.san,k-1)}</b> <span>${C.l}</span><small>${escH(who)}</small></div>
 <p>${msg}${ex?` ${czSan(m.san)}: ${ex.charAt(0).toLowerCase()+ex.slice(1)}`:''}</p>
 ${bestSan&&!['best','brill','great','book'].includes(c.c)&&bestSan!==czSan(m.san)?`<p><b>Nejlepší bylo ${bestSan}</b> (zelená šipka).</p>`:''}
 ${rep?`<p>Soupeř teď může zahrát <b>${rep.san}</b>${rep.txt?' – '+rep.txt.charAt(0).toLowerCase()+rep.txt.slice(1):''}</p>`:''}
 <p class="profEmpty">Hodnocení po tahu: ${G.ev[k]!=null?fmtCp(G.ev[k]):'–'}</p></div>`;}
addEventListener('keydown',e=>{if(page!=='review'||!RV.g||(e.target&&/input|textarea|select/i.test(e.target.tagName)))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){rvGo(RV.k+(e.key==='ArrowLeft'?-1:1));e.preventDefault();e.stopImmediatePropagation();}},true);
