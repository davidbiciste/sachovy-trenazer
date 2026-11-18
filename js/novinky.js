/* Novinky: souřadnice, výzva, Hraj proti soupeřům, Varianty od hráčů. Pořadí načítání je v index.html (APP_JS). */
/* ===================== TESTOVACÍ FUNKCE (BETA_USERS): souřadnice, výzva kamarádovi, nové partie z chess.com =====================
   Ostatní hráči nic z toho nevidí. Výjimka: odkaz na výzvu (#vyzva/…) otevře každý přihlášený, komu ho pošleš.
   ZRUŠENÍ: smazat tento blok, BETA_USERS/BETA_COURSES/betaApply nahoře u COURSES, CSS blok „TESTOVACÍ FUNKCE“ a řádky s betaApply/isBeta/BT. */
let BT={co:null,vz:null,code:'',gm:null,gmAt:0,gmName:''};
/* Zpět: když jsi na stránku přišel v rámci webu, vrátí tě o krok zpátky, jinak domů */
let BT_NAV=0;addEventListener('hashchange',()=>{BT_NAV++;BT.from=BT.fromKeep?BT.from:null;BT.fromKeep=false;});
function btBack(){if(BT_NAV>0)history.back();else go('');}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.btBack');if(b){e.preventDefault();btBack();}});
const btSt=()=>{store.bt=store.bt||{};const s=store.bt;s.co=s.co||{};s.ch=s.ch||[];s.gs=s.gs||0;return s;};
const BT_FILES='abcdefgh';
const btSqName=(f,r)=>BT_FILES[f]+(r+1);
const btFmtS=ms=>(ms/1000).toFixed(1).replace('.',',')+' s';
/* jednoduchá šachovnice pro souřadnice a výzvy: čtverce v barvách šachovnice hráče, figury jeho sady */
function btBoardHTML(id,flip,coords){let h='';for(let i=0;i<64;i++){const r=flip?Math.floor(i/8):7-Math.floor(i/8),f=flip?7-i%8:i%8;const nm=btSqName(f,r);
  const lab=coords?`${(flip?f===7:f===0)?`<span class="btRk">${r+1}</span>`:''}${(flip?r===7:r===0)?`<span class="btFl">${BT_FILES[f]}</span>`:''}`:'';
  h+=`<button type="button" class="btSq ${(f+r)%2?'l':'d'}" data-sq="${nm}" aria-label="${nm}">${lab}<span class="btPc"></span></button>`;}
 return `<div class="btBoard" id="${id}">${h}</div>`;}
function btSetPieces(id,g){const b=document.getElementById(id);if(!b)return;b.querySelectorAll('.btSq').forEach(q=>{const p=g?g.get(q.dataset.sq):null;q.querySelector('.btPc').innerHTML=p?PIECE_SVG(p.color+p.type.toUpperCase()):'';});}
function btMark(id,cls,sqs){const b=document.getElementById(id);if(!b)return;b.querySelectorAll('.'+cls).forEach(q=>q.classList.remove(cls));(sqs||[]).forEach(s=>{const q=b.querySelector(`[data-sq="${s}"]`);if(q)q.classList.add(cls);});}
function btShare(url,title,note){const n=document.getElementById(note);
 const done=t=>{if(n){n.textContent=t;}};
 if(navigator.share&&IS_MOBILE){navigator.share({title,url}).then(()=>done('Odesláno.')).catch(()=>{});return;}
 if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>done('Odkaz je zkopírovaný. Vlož ho kamarádovi do zprávy.')).catch(()=>done(url));else done(url);}

/* ---------- úvod: sekce „V testu“ ---------- */
function betaHomeHTML(neo){if(!isBeta())return'';
 const s=btSt();const best=Math.max(0,...Object.values(s.co));
 const tile=(go,cls,ic,t,sub)=>neo?`<button class="nxTile ${cls}" data-go="${go}"><span class="nxTIc">${NX_IC[ic]}</span><span class="nxTTx"><b>${t}</b><small>${sub}</small></span><span class="nxTGo">${NX_IC.arrow}</span></button>`
  :`<button class="profStrip exStrip" data-btgo="${go}"><span><b>${t}</b><small class="sub">${sub}</small></span></button>`;
 const body=`${tile('#souradnice','sky','king','Souřadnice',best?`Rekord ${best} polí za 30 s`:'Najdi pole co nejrychleji')}
  ${tile('#odznaky','violet','bars','Odznaky',`Máš ${Object.keys(store.badges||{}).length} z ${BADGES.length}`)}
  ${tile('#vyzva','coral','trap','Výzva kamarádovi','5 puzzle na čas, pošli odkaz')}
  ${tile('#qg','sun','book','Dámský gambit','Nový kurz za bílé po 1.d4 d5 2.c4')}
  ${tile('#souperi','coral','user','Hraj proti svým soupeřům','Bot hraje jako tvoji soupeři z chess.com')}
  ${tile('#varianty','plain','search','Varianty od hráčů',CV.list&&CV.list.length?`${CV.list.filter(v=>!v.hidden).length} variant, přidej svoji`:'Přidej variantu, která v kurzech chybí')}
  <div class="btCard" id="btGames"><p class="btDim">Kontroluji nové partie…</p></div>`;
 return neo?`<h2 class="nxH2">Novinky</h2><section class="nxBento btBento">${body}</section>`
  :`<section class="sideSec btOld"><h2 class="secT">Novinky</h2><div class="btOldRow">${body}</div></section>`;}
function betaWireHome(){if(!isBeta())return;document.querySelectorAll('[data-btgo]').forEach(b=>b.onclick=()=>go(b.dataset.btgo));btGamesCheck();}
/* nové partie z chess.com: kde jsi odbočil z repertoáru (od posledního „Hotovo“, nejvýš 7 dní zpátky) */
async function btGamesCheck(){const el=document.getElementById('btGames');if(!el)return;const name=store.ccName;
 if(!name){el.innerHTML=`<h3>Nové partie z chess.com</h3><p class="btDim">Ulož si v profilu jméno z chess.com. Pak ti tady po každém otevření ukážu, kde jsi v nových partiích odbočil z repertoáru.</p><button class="btn" data-btgo="#profil">Otevřít profil</button>`;el.querySelector('[data-btgo]').onclick=()=>go('#profil');return;}
 try{await chessLib();}catch(e){el.innerHTML='<p class="btDim">Nepodařilo se načíst šachová pravidla.</p>';return;}
 let G=BT.gm&&BT.gmName===name&&Date.now()-BT.gmAt<5*60e3?BT.gm:null;
 if(!G){try{const base='https://api.chess.com/pub/player/'+encodeURIComponent(name)+'/games/';const d=new Date();const k=x=>x.getUTCFullYear()+'/'+String(x.getUTCMonth()+1).padStart(2,'0');
   const months=[k(d)];const p=new Date(d.getTime()-7*DAY);if(k(p)!==months[0])months.push(k(p));
   const all=[];for(const m of months){try{all.push(...((await rzJson(base+m)).games||[]));}catch(e){if(!e.nf)throw e;}}
   G=[];for(const g of all){try{const x=rzParse(g,name.toLowerCase());if(x&&x.tc!=='daily'&&!x.bot)G.push(x);}catch(e){}}
   G.sort((a,b)=>b.end-a.end);BT.gm=G;BT.gmAt=Date.now();BT.gmName=name;}
  catch(e){el.innerHTML=`<h3>Nové partie z chess.com</h3><p class="btDim">${e.nf?`Účet „${escH(name)}“ na chess.com nenašel. Zkontroluj jméno v profilu.`:'Teď se nejde spojit s chess.com. Zkusím to příště.'}</p>`;return;}}
 const s=btSt();const from=Math.max(s.gs,Date.now()/1000-7*86400);const N=G.filter(x=>x.end>from);
 const head=`<h3>Nové partie z chess.com <small class="btDim">${escH(name)}</small></h3>`;
 if(!N.length){el.innerHTML=head+`<p class="btDim">${s.gs?'Od posledního „Hotovo“ žádná nová partie.':'Za posledních 7 dní žádná partie (blitz, rapid, bullet).'} Zahraj si a já ti tady ukážu, kde jsi odbočil z repertoáru.</p>`;return;}
 const dev=[],ok=[];const dk=new Map();N.forEach(x=>{const r=rzRep(x);if(!r)return;
  /* odbočení počítám až od 3. tahu (aspoň dva vlastní tahy podle kurzu), jinak by každé 1…e5 bylo „odbočení“ z Caro-Kann */
  if(r.out==='dev'&&r.ent&&r.k>=4){const key=x.fens[r.k]+'|'+r.my;const d=dk.get(key);if(d)d.n++;else{const o={x,r,n:1};dk.set(key,o);dev.push(o);}}else if(r.deep>=4)ok.push({x,r});});
 const devN=dev.reduce((a,d)=>a+d.n,0);
 const res=x=>x.res==='W'?'výhra':x.res==='L'?'prohra':'remíza';
 BT.dev=dev;const li=dev.slice(0,5).map(({x,r,n},i)=>`<li><span class="btR ${x.res}">${res(x)}</span><b>Proti ${escH(x.opp)}</b> <small class="btDim">${x.col==='w'?'za bílé':'za černé'}, ${rzDate(x.end)}${n>1?`, stejně ještě ${n-1}× v dalších partiích`:''}</small><br>V ${Math.ceil((r.k+1)/2)}. tahu jsi zahrál <b>${rzMvLab(r.my,r.k)}</b>, v kurzu ${escH(r.ent.x.c.title)} je <b>${r.want.map(w=>rzMvLab(w,r.k)).join(' nebo ')}</b>.<div class="btRow btLiBtns"><button class="btn primary" data-btv="${i}">Ukázat v partii</button><button class="btn" data-btpr="${r.ent.x.c.id}|${r.ent.x.l.id}">Procvičit variantu</button></div><div class="btGv" id="btGv${i}" hidden></div></li>`).join('');
 el.innerHTML=head+`<p>${N.length} ${N.length===1?'nová partie':N.length<5?'nové partie':'nových partií'}. ${devN?`${devN===1?'V jedné':'Ve '+devN} z nich jsi odbočil z repertoáru${dev.length<devN?` (${dev.length} ${dev.length===1?'různé místo':dev.length<5?'různá místa':'různých míst'})`:''}.`:ok.length?'Všude, kde to šlo, jsi hrál podle kurzů. Dobrá práce.':'Žádná z nich nebyla v tvých kurzech.'}</p>${li?`<ul class="btList">${li}</ul>`:''}<div class="btRow"><button class="btn" id="btGsOk">Hotovo, schovat</button><a class="btLink" href="#rozbor/${encodeURIComponent(name)}">Celý rozbor hráče</a></div>`;
 el.querySelectorAll('[data-btpr]').forEach(b=>b.onclick=()=>btPractice(...b.dataset.btpr.split('|')));
 el.querySelectorAll('[data-btv]').forEach(b=>b.onclick=()=>btGameView(+b.dataset.btv));
 el.querySelector('#btGsOk').onclick=()=>{s.gs=Math.floor(Math.max(...N.map(x=>x.end)));save();btGamesCheck();};}
/* prohlížeč partie přímo v kartě: otevře se na tahu, kde jsi odbočil (tvůj tah červeně, tah z kurzu zeleně) */
function btGameView(i){const d=BT.dev&&BT.dev[i];if(!d)return;const box=document.getElementById('btGv'+i);if(!box)return;
 const topPr=box.parentElement.querySelector('.btLiBtns [data-btpr]');
 if(!box.hidden){box.hidden=true;box.innerHTML='';const b=document.querySelector(`[data-btv="${i}"]`);if(b)b.textContent='Ukázat v partii';if(topPr)topPr.hidden=false;return;}
 document.querySelectorAll('.btGv').forEach(o=>{if(o!==box){o.hidden=true;o.innerHTML='';}});document.querySelectorAll('[data-btv]').forEach(b=>b.textContent='Ukázat v partii');document.querySelectorAll('.btLiBtns [data-btpr]').forEach(b=>b.hidden=false);if(topPr)topPr.hidden=true;
 const {x,r}=d;const bid='btGvB'+i;const devK=r.k+1;/* pozice po tvém tahu */
 const g0=new CHESS();const mv=[];for(const sn of x.sans){let m=null;try{m=g0.move(sn,{strict:false});}catch(e){}if(!m)break;mv.push(m);}
 const want=[];{const g=new CHESS();for(let j=0;j<r.k&&j<mv.length;j++)g.move(mv[j].san);r.want.forEach(w=>{try{const m=new CHESS(g.fen()).move(w,{strict:false});if(m)want.push(m);}catch(e){}});}
 const V={i,k:devK};BT.gv=V;box.hidden=false;const ob=document.querySelector(`[data-btv="${i}"]`);if(ob)ob.textContent='Skrýt partii';
 box.innerHTML=`<div class="btGvIn"><div class="btGvL">${btBoardHTML(bid,x.col==='b',true)}<div class="btGvCtl"><button class="btn" data-gk="s" title="Na začátek">⏮</button><button class="btn" data-gk="b" title="Tah zpět">◀</button><button class="btn" data-gk="d">Chyba</button><button class="btn" data-gk="f" title="Tah vpřed">▶</button><button class="btn" data-gk="e" title="Na konec">⏭</button></div></div>
  <div class="btGvR"><p class="btGvInfo" aria-live="polite"></p><div class="btGvMoves"></div><div class="btRow"><button class="btn primary" data-btpr2="${r.ent.x.c.id}|${r.ent.x.l.id}">Procvičit variantu</button><button class="btn" data-gfull>Rozbor celé partie</button><a class="btLink" href="${escH(x.url)}" target="_blank" rel="noopener">Na chess.com</a></div></div></div>`;
 const set=k=>{V.k=Math.max(0,Math.min(mv.length,k));const g=new CHESS();for(let j=0;j<V.k;j++)g.move(mv[j].san);btSetPieces(bid,g);
  const atDev=V.k===devK;btMark(bid,'btLast',!atDev&&V.k>0?[mv[V.k-1].from,mv[V.k-1].to]:[]);btMark(bid,'btMy',atDev?[mv[r.k].from,mv[r.k].to]:[]);btMark(bid,'btWant',atDev?want.flatMap(m=>[m.from,m.to]):[]);
  const inf=box.querySelector('.btGvInfo');const mvN=j=>`${Math.floor(j/2)+1}.${j%2?'..':''}`;
  inf.innerHTML=atDev?`<b>Tady jsi odbočil z repertoáru.</b> V ${Math.ceil(devK/2)}. tahu jsi zahrál <b class="btMyT">${czSan(mv[r.k].san)}</b> (červeně), v kurzu ${escH(r.ent.x.c.title)} je <b class="btWantT">${want.map(m=>czSan(m.san)).join(' nebo ')}</b> (zeleně).`
   :V.k===0?'Výchozí pozice. Tlačítkem Chyba skočíš zpátky na místo, kde jsi odbočil.':`Tah ${mvN(V.k-1)} ${czSan(mv[V.k-1].san)}${V.k<devK?` · ještě podle kurzu`:''}`;
  box.querySelector('.btGvMoves').innerHTML=mv.map((m,j)=>(j%2===0?`<b>${j/2+1}.</b>`:'')+`<button class="exMv${j+1===V.k?' cur':''}${j===r.k?' btDevMv':''}" data-gm="${j+1}">${czSan(m.san)}</button>`).join(' ');
  const c=box.querySelector('.btGvMoves .cur');if(c){const mvs=box.querySelector('.btGvMoves');const rr=c.getBoundingClientRect(),R=mvs.getBoundingClientRect();if(rr.top<R.top||rr.bottom>R.bottom)mvs.scrollTop+=rr.top-R.top-R.height/2;}};
 box.onclick=e=>{const t=e.target;const gk=t.closest('[data-gk]');if(gk){const a=gk.dataset.gk;set(a==='s'?0:a==='b'?V.k-1:a==='f'?V.k+1:a==='e'?mv.length:devK);return;}
  const gm=t.closest('[data-gm]');if(gm){set(+gm.dataset.gm);return;}
  const pr=t.closest('[data-btpr2]');if(pr){btPractice(...pr.dataset.btpr2.split('|'));return;}
  if(t.closest('[data-gfull]')){rvSet({sans:x.sans,w:x.col==='w'?x.me:x.opp,b:x.col==='b'?x.me:x.opp,me:x.col,src:'cc'});RV.k=devK;try{sessionStorage.setItem('trener-review',JSON.stringify(RV.g));}catch(e){}go('#review');return;}};
 set(devK);box.scrollIntoView({block:'nearest',behavior:'smooth'});}
function btPractice(cid,lid){const c=COURSES.find(q=>q.id===cid);if(!c)return;const from=location.hash;BT_NAV++;course=c;page='course';history.pushState(null,'','#'+c.id);flipped=c.side==='b';const l=LINES().find(q=>q.id===lid);if(l)openLine(l);else route();BT.from=from;/* Zpět do menu vrátí sem */}

/* ---------- trénink souřadnic (#souradnice) ---------- */
const BT_CO_SEC=30;
function renderCoords(){document.body.classList.add('homeMode');const s=btSt();const C=BT.co=BT.co||{mode:'find',side:'w',lab:true,run:false};
 const key=C.mode+'-'+C.side;const best=s.co[key]||0;
 const seg=(k,opts)=>`<div class="chip2 btSeg" role="group">${opts.map(([v,t])=>`<button type="button" data-${k}="${v}" aria-pressed="${C[k]===v}">${t}</button>`).join('')}</div>`;
 $('home').innerHTML=`<button type="button" class="btn btBack">← Zpět</button><div class="btPage"><div class="btHead"><h1>Souřadnice</h1><p class="btDim">Čím rychleji poznáš pole, tím snáz čteš tahy v kurzech, rozborech i knihách. Za ${BT_CO_SEC} sekund co nejvíc polí.</p></div>
 <div class="btWrap"><div class="btLeft"><div class="btMini" id="coMini" aria-hidden="true"></div><div class="btPrompt" id="coPrompt" aria-live="polite">${C.mode==='find'?'Klepni na Start':'Klepni na Start'}</div>${btBoardHTML('coBoard',C.side==='b',C.lab)}${C.mode==='name'?'<div class="btOpts" id="coOpts" hidden></div>':''}</div>
 <div class="btRight"><div class="profCard"><h2>Nastavení</h2>
  <p class="btLbl">Úloha</p>${seg('mode',[['find','Najdi pole'],['name','Pojmenuj pole']])}
  <p class="btLbl">Šachovnice z pohledu</p>${seg('side',[['w','bílého'],['b','černého']])}
  <label class="btChk"><input type="checkbox" id="coLab"${C.lab?' checked':''}> Ukazovat písmena a čísla na okraji</label>
  <div class="btStats"><span><b id="coScore">0</b><small>správně</small></span><span><b id="coTime">${BT_CO_SEC}</b><small>sekund</small></span><span><b id="coBest">${best}</b><small>rekord</small></span></div>
  <button class="btn primary btBig" id="coGo">Start</button>
  <p class="btDim" id="coMsg"></p></div></div></div></div>`;
 btSetPieces('coBoard',null);
 $('home').querySelectorAll('[data-mode],[data-side]').forEach(b=>b.onclick=()=>{btCoStop();if(b.dataset.mode)C.mode=b.dataset.mode;if(b.dataset.side)C.side=b.dataset.side;renderCoords();});
 $('coLab').onchange=e=>{btCoStop();C.lab=e.target.checked;renderCoords();};
 $('coGo').onclick=btCoStart;
 $('coBoard').onpointerdown=e=>{const q=e.target.closest('.btSq');if(q&&C.run&&C.mode==='find'){e.preventDefault();btCoAnswer(q.dataset.sq,q);}};}
function btCoRand(){const C=BT.co;let n;do{n=btSqName(Math.floor(Math.random()*8),Math.floor(Math.random()*8));}while(n===C.cur);return n;}
function btCoNext(){const C=BT.co;C.cur=btCoRand();const pr=document.getElementById('coPrompt');
 if(C.mode==='find'){if(pr)pr.innerHTML=`<b>${C.cur}</b>`;}
 else{btMark('coBoard','btTarget',[C.cur]);if(pr)pr.textContent='Jak se jmenuje označené pole?';const o=new Set([C.cur]);
  /* záměny, které se pletou: stejný sloupec nebo řada, sousední pole */
  while(o.size<4){const f=BT_FILES.indexOf(C.cur[0]),r=+C.cur[1]-1;const t=Math.random();const nf=t<.4?f:Math.max(0,Math.min(7,f+[-2,-1,1,2][Math.floor(Math.random()*4)])),nr=t>=.4&&t<.8?r:Math.max(0,Math.min(7,r+[-2,-1,1,2][Math.floor(Math.random()*4)]));o.add(btSqName(nf,nr));}
  const box=document.getElementById('coOpts');if(box){box.hidden=false;box.innerHTML=[...o].sort(()=>Math.random()-.5).map(v=>`<button class="btn" data-op="${v}">${v}</button>`).join('');box.onpointerdown=e=>{const b=e.target.closest('[data-op]');if(b&&C.run){e.preventDefault();btCoAnswer(b.dataset.op,b);}};}}}
function btCoStart(){const C=BT.co;btCoStop();C.run=true;C.score=0;C.miss=0;C.t0=performance.now();$('coScore').textContent='0';$('coMsg').textContent='';$('coGo').textContent='Znovu';
 const cb=document.getElementById('coBoard');cb.classList.add('run');{const r=cb.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)document.getElementById('coPrompt').scrollIntoView({block:'start',behavior:'smooth'});}btCoNext();sfx('start');
 C.tm=setInterval(()=>{const left=Math.max(0,BT_CO_SEC-(performance.now()-C.t0)/1000);const t=document.getElementById('coTime');if(!t){btCoStop();return;}t.textContent=Math.ceil(left);const mi=document.getElementById('coMini');if(mi)mi.textContent=`${Math.ceil(left)} s · ${C.score} správně`;if(left<=0)btCoEnd();},100);}
function btCoStop(){const C=BT.co;if(C&&C.tm){clearInterval(C.tm);C.tm=null;}if(C)C.run=false;}
function btCoAnswer(v,el){const C=BT.co;const ok=v===C.cur;
 if(ok){C.score++;$('coScore').textContent=C.score;sfx('move');}else{C.miss++;sfx('wrong');}
 const sq=document.querySelector(`#coBoard [data-sq="${v}"]`);const fl=sq||el;if(fl){fl.classList.remove('btOk','btBad');void fl.offsetWidth;fl.classList.add(ok?'btOk':'btBad');}
 if(C.mode==='find'){if(ok)btCoNext();else{const cur=C.cur;btMark('coBoard','btTarget',[cur]);setTimeout(()=>{if(BT.co.cur===cur)btMark('coBoard','btTarget',[]);},600);}}
 else{btMark('coBoard','btTarget',[]);btCoNext();}}
function btCoEnd(){const C=BT.co;btCoStop();const s=btSt();const key=C.mode+'-'+C.side;const prev=s.co[key]||0;
 document.getElementById('coBoard').classList.remove('run');btMark('coBoard','btTarget',[]);const box=document.getElementById('coOpts');if(box)box.hidden=true;
 const pr=document.getElementById('coPrompt');if(pr)pr.textContent='Čas!';
 let msg=`${C.score} ${C.score===1?'pole':C.score<5?'pole':'polí'} správně${C.miss?`, ${C.miss}× vedle`:''}.`;
 if(C.score>prev){s.co[key]=C.score;msg+=prev?` Nový rekord, předtím ${prev}.`:' První rekord.';$('coBest').textContent=C.score;if(C.score>=10)addXp(5);try{confettiAt(document.getElementById('coBoard'));}catch(e){}sfx('win');}
 save();$('coMsg').textContent=msg;}

/* ---------- výzva kamarádovi (#vyzva, #vyzva/<kód>) ---------- */
const BT_VZ_N=5;
const BT_VZ_LV=[[900,'Lehčí','kolem 900'],[1300,'Střední','kolem 1300'],[1700,'Těžší','kolem 1700'],[2100,'Mistrovská','kolem 2100']];
function btEnc(o){const s=unescape(encodeURIComponent(JSON.stringify(o)));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function btDec(c){try{const b=c.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(b))));}catch(e){return null;}}
const btVzUrl=o=>location.origin+location.pathname+'#vyzva/'+btEnc(o);
async function renderVyzva(){document.body.classList.add('homeMode');const code=BT.code;const V=code?btDec(code):null;
 if(BT.vz&&BT.vz.code===code&&BT.vz.state==='play'){btVzDraw();btVzLoad();return;}
 if(!code){if(!isBeta()){if(!SYNC.user){$('home').innerHTML='<p class="btDim">Načítám…</p>';return;}go('');return;}
  const myR=pqStore().r||800;
  $('home').innerHTML=`<button type="button" class="btn btBack">← Zpět</button><div class="btPage"><div class="btHead"><h1>Výzva kamarádovi</h1><p class="btDim">Vyřešíš ${BT_VZ_N} puzzle na čas. Pak pošleš odkaz a kamarád dostane úplně stejné úlohy. Vyhrává víc správně, při shodě rychlejší.</p></div>
  <div class="profCard"><h2>Obtížnost</h2><div class="btLv">${BT_VZ_LV.map(([b,t,s])=>`<button class="btn" data-lv="${b}"><b>${t}</b><small>${s}</small></button>`).join('')}<button class="btn primary" data-lv="${Math.max(400,Math.min(2800,Math.round(myR/100)*100))}"><b>Moje úroveň</b><small>kolem ${myR}</small></button></div></div>
  ${btSt().ch.length?`<div class="profCard"><h2>Poslední výzvy</h2><ul class="btList">${btSt().ch.slice().reverse().slice(0,8).map(c=>`<li>${c.r?`<b>${escH(c.r.n)}</b>: ${c.r.s}/${BT_VZ_N} za ${btFmtS(c.r.t)}, ty ${c.s}/${BT_VZ_N} za ${btFmtS(c.t)}`:`Ty ${c.s}/${BT_VZ_N} za ${btFmtS(c.t)}, čeká se na kamaráda`} <a class="btLink" href="#vyzva/${c.c}">otevřít</a></li>`).join('')}</ul></div>`:''}</div>`;
  $('home').querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>btVzNew(+b.dataset.lv));return;}
 if(!V||!V.i||!V.b){$('home').innerHTML=`<button type="button" class="btn btBack">← Zpět</button><div class="profCard"><h2>Výzva</h2><p class="btDim">Odkaz na výzvu je poškozený. Popros kamaráda, ať ho pošle znovu.</p></div>`;return;}
 const me=String(SYNC.user||'').toLowerCase(),mine=me&&me===String(V.f).toLowerCase();
 const rows=[[V.f,V.s,V.t]];if(V.r)rows.push([V.r.n,V.r.s,V.r.t]);
 let body;
 if(V.r){const w=btVzWin(V.s,V.t,V.r.s,V.r.t);body=`<p>${w===0?'Remíza!':`Vyhrál <b>${escH(w===1?V.f:V.r.n)}</b>.`}</p>${btVzTable(rows)}`;
  if(mine)btVzRemember(V,code);}
 else if(mine)body=`<p>Tohle je tvoje výzva: ${V.s}/${BT_VZ_N} za ${btFmtS(V.t)}. Pošli odkaz kamarádovi.</p><div class="btRow"><button class="btn primary" id="vzSend">Poslat odkaz</button></div><p class="btDim" id="vzNote"></p>`;
 else body=`<p><b>${escH(V.f)}</b> vyřešil ${V.s} z ${BT_VZ_N} puzzle za ${btFmtS(V.t)}. Zvládneš to líp?</p><p class="btDim">Obtížnost kolem ${V.b}. Čas běží od první úlohy do poslední. Každá úloha jde jen jednou.</p><div class="btRow"><button class="btn primary btBig" id="vzGo">Přijmout výzvu</button></div>`;
 $('home').innerHTML=`<button type="button" class="btn btBack">← Zpět</button><div class="btPage"><div class="btHead"><h1>Výzva</h1></div><div class="profCard">${body}</div></div>`;
 const sb=document.getElementById('vzSend');if(sb)sb.onclick=()=>btShare(btVzUrl(V),'Šachová výzva','vzNote');
 const gb=document.getElementById('vzGo');if(gb)gb.onclick=()=>btVzStart(code,V,V.i,V.b,false);}
const btVzWin=(s1,t1,s2,t2)=>s1!==s2?(s1>s2?1:2):t1===t2?0:(t1<t2?1:2);
const btVzTable=rows=>`<table class="btTbl"><tr><th>Hráč</th><th>Správně</th><th>Čas</th></tr>${rows.map(([n,s,t])=>`<tr><td>${escH(n)}</td><td>${s}/${BT_VZ_N}</td><td>${btFmtS(t)}</td></tr>`).join('')}</table>`;
function btVzRemember(V,code){if(!isBeta())return;const s=btSt();const k=V.i.join(',');const ix=s.ch.findIndex(c=>c.k===k);const e={k,c:code,s:V.s,t:V.t,r:V.r||null};if(ix>=0){if(!s.ch[ix].r||V.r)s.ch[ix]=e;}else s.ch.push(e);if(s.ch.length>30)s.ch.shift();save();}
async function btVzNew(band){$('home').innerHTML='<button type="button" class="btn btBack">← Zpět</button><p class="btDim">Vybírám úlohy…</p>';
 let L;try{L=await pqLoadBand(band);}catch(e){$('home').innerHTML='<a class="backAll" href="#vyzva">← Zpět</a><p class="btDim">Úlohy se nepodařilo načíst. Zkontroluj připojení.</p>';return;}
 const pool=L.filter(p=>p.lines[0].length>=2&&p.lines[0].length<=6);const ids=[];while(ids.length<BT_VZ_N&&pool.length){const p=pool.splice(Math.floor(Math.random()*pool.length),1)[0];ids.push(p.id);}
 btVzStart('',null,ids,band,true);}
async function btVzStart(code,V,ids,band,creator){if(!CHESS)try{await chessLib();}catch(e){return;}
 let L;try{L=await pqLoadBand(band);}catch(e){$('home').innerHTML='<button type="button" class="btn btBack">← Zpět</button><p class="btDim">Úlohy se nepodařilo načíst. Zkontroluj připojení.</p>';return;}
 const P=ids.map(id=>L.find(p=>p.id===id)).filter(Boolean);if(P.length!==ids.length){$('home').innerHTML='<button type="button" class="btn btBack">← Zpět</button><p class="btDim">Některé úlohy z výzvy už na webu nejsou.</p>';return;}
 BT.vz={code,V,band,ids,P,creator,i:0,res:[],t0:performance.now(),state:'play'};btVzDraw();btVzLoad();}
function btVzDraw(){const Z=BT.vz;
 $('home').innerHTML=`<button type="button" class="btn btBack">← Zpět</button><div class="btPage"><div class="btWrap"><div class="btLeft"><div class="btPrompt" id="vzPrompt" aria-live="polite"></div>${btBoardHTML('vzBoard',false,true)}</div>
 <div class="btRight"><div class="profCard"><h2>${Z.creator?'Tvoje výzva':'Výzva od '+escH(Z.V.f)}</h2><div class="btDots" id="vzDots"></div><div class="btStats"><span><b id="vzTime">0,0</b><small>sekund</small></span><span><b id="vzOk">0</b><small>správně</small></span></div><p class="btDim" id="vzMsg">Najdi nejlepší tah. Když se splete jeden tah, úloha je pryč.</p><div id="vzEnd"></div></div></div></div></div>`;
 clearInterval(BT.vzT);BT.vzT=setInterval(()=>{const t=document.getElementById('vzTime');if(!t||!BT.vz||BT.vz.state!=='play'){clearInterval(BT.vzT);return;}t.textContent=((performance.now()-BT.vz.t0)/1000).toFixed(1).replace('.',',');},100);
 btVzDots();btVzWire();}
/* ovládání šachovnice výzvy: klepnutí (figura, pak pole) i přetažení figury myší nebo prstem */
function btVzWire(){const B=document.getElementById('vzBoard');if(!B)return;B.onclick=btVzClick;
 let D=null;const sqAt=(x,y)=>{const el=document.elementFromPoint(x,y);const q=el&&el.closest?el.closest('#vzBoard .btSq'):null;return q?q.dataset.sq:null;};
 B.onpointerdown=e=>{const Z=BT.vz;if(!Z||Z.busy||Z.state!=='play'||e.button>0)return;const q=e.target.closest('.btSq');if(!q)return;const pc=Z.g.get(q.dataset.sq);
  /* tah klepnutím: figura je vybraná a klepneš na cílové pole – táhne se hned (na mobilu se druhé klepnutí jako click někdy ztratí) */
  if(Z.sel&&Z.sel!==q.dataset.sq&&!(pc&&pc.color===Z.me)){const m=Z.g.moves({square:Z.sel,verbose:true}).find(x=>x.to===q.dataset.sq);B.dataset.eat='1';setTimeout(()=>{delete B.dataset.eat;},500);e.preventDefault();
   if(m)btVzTry(Z.sel,q.dataset.sq,m);else{Z.sel=null;btMark('vzBoard','btSel',[]);btMark('vzBoard','btDot',[]);}return;}
  if(!pc||pc.color!==Z.me)return;
  e.preventDefault();B.dataset.eat='1';setTimeout(()=>{delete B.dataset.eat;},500);Z.sel=q.dataset.sq;btMark('vzBoard','btSel',[Z.sel]);btMark('vzBoard','btDot',Z.g.moves({square:Z.sel,verbose:true}).map(m=>m.to));
  const img=q.querySelector('.btPc');const r=q.getBoundingClientRect();const gh=img.cloneNode(true);gh.className='btGhost';gh.style.width=r.width+'px';gh.style.height=r.height+'px';document.body.appendChild(gh);img.style.opacity='.35';
  D={from:q.dataset.sq,img,gh,w:r.width,moved:false,x0:e.clientX,y0:e.clientY};const mv=ev=>{if(!D)return;if(Math.abs(ev.clientX-D.x0)+Math.abs(ev.clientY-D.y0)>4)D.moved=true;D.gh.style.transform=`translate(${ev.clientX-D.w/2}px,${ev.clientY-D.w/2}px)`;};mv(e);
  const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);if(!D)return;const d=D;D=null;d.gh.remove();d.img.style.opacity='';
   const to=sqAt(ev.clientX,ev.clientY);const Z2=BT.vz;if(!Z2||Z2.busy||!d.moved||!to||to===d.from)return;const m=Z2.g.moves({square:d.from,verbose:true}).find(x=>x.to===to);
   if(m){B.dataset.eat='1';setTimeout(()=>{delete B.dataset.eat;},60);btVzTry(d.from,to,m);}};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);};}
function btVzDots(){const Z=BT.vz,d=document.getElementById('vzDots');if(!d)return;d.innerHTML=Z.P.map((p,i)=>`<i class="${Z.res[i]===true?'ok':Z.res[i]===false?'bad':i===Z.i&&Z.state==='play'?'cur':''}"></i>`).join('');const o=document.getElementById('vzOk');if(o)o.textContent=Z.res.filter(x=>x===true).length;}
function btVzLoad(){const Z=BT.vz;const p=Z.P[Z.i];Z.g=new CHESS(p.fen);Z.k=0;Z.sel=null;Z.busy=true;
 const me=p.fen.split(' ')[1]==='w'?'b':'w';Z.me=me;const flip=me==='b';
 const host=document.getElementById('vzBoard');if(host){host.outerHTML=btBoardHTML('vzBoard',flip,true);btVzWire();}
 btSetPieces('vzBoard',Z.g);btMark('vzBoard','btLast',[]);const pr=document.getElementById('vzPrompt');if(pr)pr.innerHTML=`Úloha ${Z.i+1} z ${Z.P.length}: hraješ za <b>${me==='w'?'bílé':'černé'}</b>`;btVzDots();
 setTimeout(()=>{if(BT.vz!==Z)return;btVzPlay(p.lines[0][0]);Z.k=1;Z.busy=false;},600);}
function btVzPlay(uci){const Z=BT.vz;const m=Z.g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||'q'});btSetPieces('vzBoard',Z.g);btMark('vzBoard','btLast',[m.from,m.to]);sfx('move');return m;}
function btVzClick(e){const B=document.getElementById('vzBoard');if(B&&B.dataset.eat){delete B.dataset.eat;return;}const Z=BT.vz;const q=e.target.closest('.btSq');if(!q||!Z||Z.busy||Z.state!=='play')return;const sq=q.dataset.sq;const pc=Z.g.get(sq);
 if(Z.sel&&Z.sel!==sq){const mv=Z.g.moves({square:Z.sel,verbose:true}).find(m=>m.to===sq);if(mv){btVzTry(Z.sel,sq,mv);return;}}
 if(pc&&pc.color===Z.me){Z.sel=sq;btMark('vzBoard','btSel',[sq]);btMark('vzBoard','btDot',Z.g.moves({square:sq,verbose:true}).map(m=>m.to));}else{Z.sel=null;btMark('vzBoard','btSel',[]);btMark('vzBoard','btDot',[]);}}
function btVzTry(from,to,mv){const Z=BT.vz;if(mv.promotion&&!XPROMO){const B=document.getElementById('vzBoard');if(askPromo(Z.g,from,to,B,()=>btVzTry(from,to,mv),()=>{Z.sel=null;btSetPieces('vzBoard',Z.g);}))return;}const p=Z.P[Z.i];const want=p.lines[0][Z.k];const uci=from+to+(mv.promotion?(XPROMO||'q'):'');Z.sel=null;btMark('vzBoard','btSel',[]);btMark('vzBoard','btDot',[]);
 /* jako na Lichess: správně je i jiný tah, který dá hned mat */
 const g2=new CHESS(Z.g.fen());g2.move({from,to,promotion:XPROMO||'q'});const ok=uci===want||(uci.slice(0,4)===want.slice(0,4))||g2.isCheckmate();
 btVzPlay(uci);
 if(!ok){Z.busy=true;sfx('wrong');const sq=document.querySelector(`#vzBoard [data-sq="${to}"]`);if(sq)sq.classList.add('btBad');document.getElementById('vzMsg').textContent=`Vedle. Správně bylo ${czSan(btUciSan(p,Z.k))}.`;Z.res[Z.i]=false;setTimeout(()=>btVzNext(),1300);return;}
 Z.k++;if(Z.k>=p.lines[0].length||g2.isCheckmate()){Z.busy=true;Z.res[Z.i]=true;sfx('win');document.getElementById('vzMsg').textContent='Správně!';setTimeout(()=>btVzNext(),700);return;}
 Z.busy=true;setTimeout(()=>{if(BT.vz!==Z)return;btVzPlay(p.lines[0][Z.k]);Z.k++;Z.busy=false;},450);}
function btUciSan(p,k){const g=new CHESS(p.fen);for(let i=0;i<k;i++){const u=p.lines[0][i];g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}const u=p.lines[0][k];try{return g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'}).san;}catch(e){return u;}}
function btVzNext(){const Z=BT.vz;if(BT.vz!==Z)return;Z.i++;btVzDots();const m=document.getElementById('vzMsg');if(m)m.textContent='Najdi nejlepší tah.';if(Z.i<Z.P.length){btVzLoad();return;}btVzEnd();}
function btVzEnd(){const Z=BT.vz;Z.state='done';const t=Math.round(performance.now()-Z.t0);const s=Z.res.filter(x=>x===true).length;clearInterval(BT.vzT);
 const tm=document.getElementById('vzTime');if(tm)tm.textContent=(t/1000).toFixed(1).replace('.',',');btVzDots();{const vm=document.getElementById('vzMsg');if(vm)vm.textContent='';}const pr=document.getElementById('vzPrompt');if(pr)pr.textContent='Hotovo';
 const name=SYNC.user||'Kamarád';const end=document.getElementById('vzEnd');
 if(Z.creator){const V={v:1,f:name,b:Z.band,i:Z.ids,s,t};const code=btEnc(V);btVzRemember(V,code);Z.code=code;BT.code=code;history.replaceState(null,'','#vyzva/'+code);
  end.innerHTML=`<p><b>${s}/${BT_VZ_N}</b> za ${btFmtS(t)}. Teď pošli odkaz kamarádovi. Dostane stejné úlohy.</p><div class="btRow"><button class="btn primary" id="vzSend">Poslat výzvu</button><a class="btLink" href="#vyzva">Nová výzva</a></div><p class="btDim" id="vzNote"></p>`;
  document.getElementById('vzSend').onclick=()=>btShare(btVzUrl(V),'Šachová výzva','vzNote');if(s>=3)addXp(5);save();}
 else{const V=Object.assign({},Z.V,{r:{n:name,s,t}});const w=btVzWin(V.s,V.t,s,t);
  end.innerHTML=`<p>${w===2?'<b>Vyhrál jsi!</b>':w===0?'<b>Remíza.</b>':`<b>Tentokrát vyhrál ${escH(V.f)}.</b>`}</p>${btVzTable([[V.f,V.s,V.t],[name,s,t]])}<div class="btRow"><button class="btn primary" id="vzBack">Poslat výsledek zpátky</button></div><p class="btDim" id="vzNote">${escH(V.f)} uvidí, jak jsi dopadl.</p>`;
  document.getElementById('vzBack').onclick=()=>btShare(btVzUrl(V),'Výsledek výzvy','vzNote');if(w===2)try{confettiAt(document.getElementById('vzBoard'));}catch(e){}}}

/* ---------- Hraj proti svým soupeřům (#souperi): kniha z tahů soupeřů v tvých partiích na chess.com ---------- */
let SO={name:'',games:null,err:null,at:0,busy:false};
async function soLoad(name){if(SO.games&&SO.name===name&&Date.now()-SO.at<10*60e3)return SO.games;
 const base='https://api.chess.com/pub/player/'+encodeURIComponent(name)+'/games/';const ar=await rzJson('https://api.chess.com/pub/player/'+encodeURIComponent(name)+'/games/archives');
 const urls=(ar.archives||[]).slice(-12);const G=[];for(const u of urls.reverse()){try{const j=await rzJson(u);for(const g of (j.games||[])){try{const x=rzParse(g,name.toLowerCase());if(x&&x.tc!=='daily'&&!x.bot)G.push(x);}catch(e){}}}catch(e){}if(G.length>=900)break;}
 SO.games=G;SO.name=name;SO.at=Date.now();return G;}
/* síla mimo knihu: Stockfish Skill Level podle Elo (Skill 0 krátce ≈ 900) */
const soSkill=elo=>Math.max(0,Math.min(20,Math.round(((elo||1000)-900)/110)));
/* lidský tah: Stockfish najde 6 nejlepších tahů; bot vybere jeden z nich, který není o víc horší než chyba hráče na dané úrovni
   (800 Elo: max 1,2 pěšce, 1200: 0,9, 1500: 0,6, 1900: 0,35, výš téměř nejlepší). Figuru zadarmo tak nikdy nedá. */
const soMaxLoss=elo=>elo<900?120:elo<1200?90:elo<1500?60:elo<1900?35:12;
/* Maia (engine/maia.js, CSSLab, GPL-3.0): síť naučená na lidských partiích, úrovně 1100–1900. Vybere tah náhodně podle toho, jak často by ho zahráli lidé (jen tahy od 5 %). */
let MAIAP=null;function maiaLib(){if(!MAIAP)MAIAP=import(new URL('engine/maia.js?v=1',document.baseURI).href).catch(e=>{MAIAP=null;throw e;});return MAIAP;}
function soMaiaPreload(elo){if((elo||1000)>2000)return;maiaLib().then(m=>m.maiaLoad(elo)).catch(()=>{});}
async function soMaia(g,elo){const M=await maiaLib();const h=g.history({verbose:true});const fens=h.length&&h[0].before?[...h.map(m=>m.before),g.fen()]:[g.fen()];
 const leg=g.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion||''));const r=await M.maiaPolicy(elo,fens,leg);if(!r||!r.length)return null;
 const C=r.filter((x,i)=>i===0||x.p>=.05);const w=C.map(x=>Math.pow(x.p,1.3));const T=w.reduce((a,b)=>a+b,0);let q=Math.random()*T,pick=C[0];for(let i=0;i<C.length;i++){q-=w[i];if(q<=0){pick=C[i];break;}}
 return {pick,top:r.slice(0,3),lv:M.maiaLevel(elo)};}
async function soHuman(fen,elo){const r=await sfAnalyse(fen,{multipv:6,depth:(elo||1000)<1300?11:13});if(!r||!r.lines)return null;const me=fen.split(' ')[1];
 const L=r.lines.filter(l=>l&&l.pv&&l.pv[0]).map(l=>({u:l.pv[0],v:me==='w'?l.cp:-l.cp}));if(!L.length)return r.best||null;const best=Math.max(...L.map(l=>l.v));const mx=soMaxLoss(elo);
 const C=L.filter(l=>best-l.v<=mx);const w=C.map(l=>Math.exp(-(best-l.v)/(mx/2)));const T=w.reduce((a,b)=>a+b,0);let x=Math.random()*T;for(let i=0;i<C.length;i++){x-=w[i];if(x<=0)return C[i].u;}return C[0].u;}
/* databáze Lichess: co v pozici hrají lidé kolem daného Elo (když soupeři z chess.com pozici neměli) */
const SO_EX=new Map();
async function soExplorer(fen,elo){const B=[0,1000,1200,1400,1600,1800,2000,2200,2500];let i=B.length-1;while(i>0&&B[i]>(elo||1000))i--;const r=[B[Math.max(0,i)],B[Math.min(B.length-1,i+1)]].filter((v,k,a)=>a.indexOf(v)===k);
 const key=fen.split(' ').slice(0,4).join(' ')+'|'+r.join(',');let j=SO_EX.get(key);
 if(j===undefined){j=null;try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),2500);const res=await fetch('https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid&ratings='+r.join(',')+'&fen='+encodeURIComponent(fen),{signal:ctl.signal});clearTimeout(t);if(res.ok)j=await res.json();}catch(e){}SO_EX.set(key,j);}
 if(!j||!j.moves)return null;const mv=j.moves.map(m=>({san:m.san,n:(m.white||0)+(m.draws||0)+(m.black||0)})).filter(m=>m.n>0);const tot=mv.reduce((a,m)=>a+m.n,0);if(tot<20)return null;
 const ok=mv.filter(m=>m.n/tot>=.05);if(!ok.length)return null;const T=ok.reduce((a,m)=>a+m.n,0);let x=Math.random()*T,pick=ok[0];for(const m of ok){x-=m.n;if(x<=0){pick=m;break;}}
 return {pick,band:r[0]||0,top:ok.slice(0,3).map(m=>({san:m.san,p:Math.round(m.n/tot*100)}))};}
/* kniha: pozice (první 4 části FEN) → tahy soupeře s počtem; do 40 půltahů (20 tahů) */
function soBook(G,col){const M=new Map();for(const x of G){if(x.col!==col)continue;const g=new CHESS();for(let i=0;i<Math.min(x.sans.length,40);i++){const opp=(i%2===0)!==(col==='w');const key=g.fen().split(' ').slice(0,4).join(' ');let mv=null;try{mv=g.move(x.sans[i],{strict:false});}catch(e){}if(!mv)break;
  if(opp){let e=M.get(key);if(!e)M.set(key,e=[]);const o=e.find(z=>z.san===mv.san);if(o)o.n++;else e.push({san:mv.san,n:1});}}}
 M.forEach(e=>e.sort((a,b)=>b.n-a.n));return M;}
async function renderSouperi(){document.body.classList.add('homeMode');
 if(!isBeta()){if(!SYNC.user){$('home').innerHTML='<p class="btDim">Načítám…</p>';return;}go('');return;}
 const name=store.ccName;const head='<button type="button" class="btn btBack">← Zpět</button><div class="btPage"><div class="btHead"><h1>Hraj proti svým soupeřům</h1><p class="btDim">Bot hraje zahájení přesně tak, jak proti tobě hráli lidé na chess.com. Čím častěji nějaký tah hráli, tím spíš ho zahraje. Když už soupeři v pozici dál nic nehráli, převezme hru bot podle zvolené síly.</p></div>';
 if(!name){$('home').innerHTML=head+'<div class="profCard"><p>Nejdřív si v profilu ulož jméno z chess.com.</p><a class="btn primary" href="#profil">Otevřít profil</a></div></div>';return;}
 $('home').innerHTML=head+'<div class="profCard"><p class="btDim"><span class="spin"></span> Načítám tvoje partie z chess.com…</p></div></div>';
 let G;try{await chessLib();G=await soLoad(name);}catch(e){if(page!=='souperi')return;$('home').innerHTML=head+`<div class="profCard"><p>${e&&e.nf?'Účet „'+escH(name)+'“ na chess.com nenašel.':'Teď se nejde spojit s chess.com. Zkus to za chvíli.'}</p></div></div>`;return;}
 if(page!=='souperi')return;
 const W=soBook(G,'w'),Bk=soBook(G,'b');const start=new CHESS().fen().split(' ').slice(0,4).join(' ');
 const first=(M,col)=>{if(col==='b'){const e=M.get(start)||[];return e;}/* za bílé: odpovědi na můj nejčastější první tah */const g=new CHESS();const mine={};G.filter(x=>x.col==='w'&&x.sans[0]).forEach(x=>{mine[x.sans[0]]=(mine[x.sans[0]]||0)+1;});const top=Object.entries(mine).sort((a,b)=>b[1]-a[1])[0];if(!top)return[];g.move(top[0]);return (M.get(g.fen().split(' ').slice(0,4).join(' '))||[]).map(z=>({...z,pre:top[0]}));};
 const nW=G.filter(x=>x.col==='w').length,nB=G.length-nW;
 const lst=(e,col)=>e.length?`<ul class="soList">${e.slice(0,5).map(z=>`<li><b>${col==='w'?'1.'+czSan(z.pre)+' '+czSan(z.san):'1.'+czSan(z.san)}</b><span>${z.n}×</span></li>`).join('')}</ul>`:'<p class="btDim">Zatím málo partií.</p>';
 const rs=G.map(x=>+x.oppR).filter(Boolean);const avg=rs.length?Math.round(rs.reduce((a,b)=>a+b,0)/rs.length/50)*50:1000;if(!SO.elo||![avg,avg+300,2400].includes(SO.elo))SO.elo=avg;
 $('home').innerHTML=head+`<p class="btDim">Z ${G.length} partií (${escH(name)}, poslední rok, bez korespondenčních). Průměrné Elo tvých soupeřů: asi ${avg}.</p>
  <div class="soGrid"><div class="profCard"><h2>Hraješ za bílé <small class="exCnt">${nW}</small></h2><p class="btDim">Soupeři nejčastěji odpovídají:</p>${lst(first(W,'w'),'w')}<button class="btn primary btBig" data-sogo="w"${nW?'':' disabled'}>Hrát za bílé</button></div>
  <div class="profCard"><h2>Hraješ za černé <small class="exCnt">${nB}</small></h2><p class="btDim">Soupeři nejčastěji začínají:</p>${lst(first(Bk,'b'),'b')}<button class="btn primary btBig" data-sogo="b"${nB?'':' disabled'}>Hrát za černé</button></div></div>
  <div class="profCard"><h2>Když tvoji soupeři pozici neznají</h2><p class="btDim">Nejdřív zahraje, co v té pozici hrají lidé na Lichess kolem stejného Elo. Kde už ani tam nic není, hraje Stockfish na zvolené síle.</p><div class="chip2 btSeg" role="group">${[[avg,'Jako tvoji soupeři'],[avg+300,'O něco silnější'],[2400,'Plná síla']].map(([e,t],i)=>`<button type="button" data-soelo="${e}" aria-pressed="${(SO.elo||avg)===e}">${t} <small>asi ${e} Elo</small></button>`).join('')}</div></div></div>`;
 const H=$('home');H.querySelectorAll('[data-soelo]').forEach(b=>b.onclick=()=>{SO.elo=+b.dataset.soelo;H.querySelectorAll('[data-soelo]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
 H.querySelectorAll('[data-sogo]').forEach(b=>b.onclick=()=>{const col=b.dataset.sogo;const B=TU.bot;B.book=col==='w'?W:Bk;B.bookSide=col;B.col=col;B.bookName=name;B.soElo=SO.elo||avg;soMaiaPreload(B.soElo);B.lvl=3;B.guess=false;go('#lekce/bot');setTimeout(()=>{if(page==='tutorial'&&TU.les&&TU.les.ex.type==='bot')tuBotNew();},300);});}
/* ===================== konec TESTOVACÍ FUNKCE ===================== */
/* ===================== VARIANTY OD HRÁČŮ (#varianty) – TESTOVACÍ FUNKCE (isBeta) =====================
   Data v Supabase (community_variants + community_variant_votes, funkce trener_cv_*), názvy zahájení openings/names.json (Lichess, CC0).
   Z variant se skládají dva kurzy „Varianty hráčů za bílé / za černé“ (id cvw, cvb), takže se procvičují stejně jako ostatní kurzy. */
let CV={list:null,err:null,names:null,np:null,busy:false,tab:'week',open:null,chk:null};
/* krátká zpráva dole na obrazovce */
function toast(t){let el=document.getElementById('cvToast');if(!el){el=document.createElement('div');el.id='cvToast';el.className='cvToast';el.setAttribute('role','status');document.body.appendChild(el);}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),3200);}
const CV_CZ={"Sicilian Defense":"Sicilská obrana","Ruy Lopez":"Španělská hra","French Defense":"Francouzská obrana","Queen's Gambit Declined":"Odmítnutý dámský gambit","Italian Game":"Italská hra","English Opening":"Anglická hra","King's Gambit Accepted":"Přijatý královský gambit","King's Gambit Declined":"Odmítnutý královský gambit","King's Gambit":"Královský gambit","King's Indian Defense":"Královská indická obrana","Caro-Kann Defense":"Caro-Kann","Nimzo-Indian Defense":"Nimcovičova indická obrana","Queen's Pawn Game":"Hra dámským pěšcem","Semi-Slav Defense":"Polo-slovanská obrana","Dutch Defense":"Holandská obrana","Benoni Defense":"Benoni","Queen's Gambit Accepted":"Přijatý dámský gambit","Grünfeld Defense":"Grünfeldova indická obrana","Queen's Indian Defense":"Dámská indická obrana","Alekhine Defense":"Aljechinova obrana","Scotch Game":"Skotská hra","Indian Defense":"Indická obrana","Slav Defense":"Slovanská obrana","Petrov's Defense":"Ruská hra (Petrovova obrana)","Four Knights Game":"Hra čtyř jezdců","Zukertort Opening":"Zukertortova hra","Scandinavian Defense":"Skandinávská obrana","Philidor Defense":"Philidorova obrana","Réti Opening":"Rétiho hra","Nimzowitsch Defense":"Nimcovičova obrana","Vienna Game":"Vídeňská hra","Vienna Gambit":"Vídeňský gambit","Bishop's Opening":"Hra střelcem","Modern Defense":"Moderní obrana","King's Pawn Game":"Hra královským pěšcem","Catalan Opening":"Katalánská hra","Pirc Defense":"Pircova obrana","Bird Opening":"Birdova hra","Tarrasch Defense":"Tarraschova obrana","Polish Opening":"Polská hra","Blackmar-Diemer Gambit":"Blackmar-Diemerův gambit","Blackmar-Diemer Gambit Accepted":"Přijatý Blackmar-Diemerův gambit","Blackmar-Diemer Gambit Declined":"Odmítnutý Blackmar-Diemerův gambit","Bogo-Indian Defense":"Bogoljubovova indická obrana","King's Indian Attack":"Královský indický útok","Hungarian Opening":"Maďarská hra","Center Game":"Středová hra","Latvian Gambit":"Lotyšský gambit","Latvian Gambit Accepted":"Přijatý lotyšský gambit","Ponziani Opening":"Ponzianiho hra","Old Indian Defense":"Staroindická obrana","Trompowsky Attack":"Trompowského útok","Benko Gambit":"Benkův gambit","Benko Gambit Accepted":"Přijatý Benkův gambit","Englund Gambit":"Englundův gambit","Owen Defense":"Owenova obrana","Torre Attack":"Torreho útok","Three Knights Opening":"Hra tří jezdců","London System":"Londýnský systém","Queen's Gambit":"Dámský gambit","Elephant Gambit":"Sloní gambit","Danish Gambit":"Dánský gambit","Danish Gambit Accepted":"Přijatý dánský gambit","Budapest Defense":"Budapešťský gambit","Albin Countergambit":"Albinův protigambit","Czech Defense":"Česká obrana","Goring Gambit":"Göringův gambit","Rat Defense":"Krysí obrana","Kádas Opening":"Kádasova hra","Grob Opening":"Grobova hra","Van Geet Opening":"Van Geetova hra","Neo-Grünfeld Defense":"Neo-Grünfeldova obrana","Nimzo-Larsen Attack":"Nimcovič-Larsenův útok","Richter-Veresov Attack":"Richter-Veresovův útok","Rubinstein Opening":"Rubinsteinova hra","English Defense":"Anglická obrana","Ware Opening":"Wareova hra","Pterodactyl Defense":"Pterodaktyl","Amar Opening":"Amarova hra"};
const cvCz=name=>{if(!name)return'';const i=name.indexOf(':');const fam=i<0?name:name.slice(0,i),rest=i<0?'':name.slice(i);return (CV_CZ[fam]||fam)+rest;};
const cvFam=name=>{if(!name)return'Ostatní';const i=name.indexOf(':');const fam=(i<0?name:name.slice(0,i)).replace(/,.*$/,'');return CV_CZ[fam]||fam;};
const cvSub=name=>{if(!name)return'';const i=name.indexOf(':');return i<0?'':name.slice(i+1).trim();};
function cvNames(){if(CV.names)return Promise.resolve(CV.names);if(!CV.np)CV.np=fetch('openings/names.json').then(r=>{if(!r.ok)throw new Error('names');return r.json();}).then(j=>CV.names=j).catch(e=>{CV.np=null;throw e;});return CV.np;}
/* zařazení podle nejhlubší pozice ze seznamu Lichess (pozná i jiné pořadí tahů) */
function cvClassify(sans){const g=new CHESS();let best=null;const N=CV.names||{};
 for(const s of sans){try{if(!g.move(s,{strict:false}))break;}catch(e){break;}const k=g.fen().split(' ').slice(0,4).join(' ');if(N[k])best=N[k];}
 return best?{eco:best[0],name:best[1]}:{eco:'',name:''};}
const cvSans=m=>String(m||'').trim().split(/\s+/).filter(Boolean);
const cvFull=sans=>sans.map((s,i)=>(i%2===0?(i/2+1)+'.':'')+s).join(' ');
const cvFullCz=sans=>sans.map((s,i)=>(i%2===0?`<b>${i/2+1}.</b>`:'')+czSan(s)).join(' ');
const cvErrNoDb=e=>/function|does not exist|schema cache|PGRST202|404/i.test(String(e&&(e.message||e.code||e.details||e)));
async function cvLoad(){if(!isBeta()||!getTok()||!(SYNC.be&&SYNC.be.kind==='supa'))return;
 try{const l=await rpc('trener_cv_list',{p_token:getTok()});CV.list=Array.isArray(l)?l:[];CV.err=null;}catch(e){CV.err=cvErrNoDb(e)?'nodb':'net';if(!CV.list)CV.list=[];}}
/* kurzy z variant: jeden za bílé, jeden za černé; kapitoly = zahájení */
const CV_COURSES={w:{id:'cvw',title:'Varianty hráčů za bílé',en:'Od hráčů',side:'w',icon:'wN',sub:'Přidali je hráči trenažéru · zkontrolované Stockfishem',chapters:[],notes:{}},
 b:{id:'cvb',title:'Varianty hráčů za černé',en:'Od hráčů',side:'b',icon:'bN',sub:'Přidali je hráči trenažéru · zkontrolované Stockfishem',chapters:[],notes:{}}};
function cvBuild(){const by={w:{},b:{}};
 (CV.list||[]).filter(v=>!v.hidden).forEach(v=>{const sans=cvSans(v.moves);if(sans.length<2)return;const g=new CHESS();for(const s of sans){try{if(!g.move(s,{strict:false}))return;}catch(e){return;}}
  const fam=cvFam(v.opening),side=v.side==='b'?'b':'w';(by[side][fam]=by[side][fam]||[]).push({id:'cv'+v.id,name:(cvSub(v.opening)||cvCz(v.opening)||'Varianta')+(v.featured?' ★':''),m:sans.join(' '),full:cvFull(sans),
   idea:`Přidal ${v.by||'hráč'}. Hraje to ${v.votes} ${v.votes==1?'hráč':v.votes<5?'hráči':'hráčů'}.${v.sf_bad?' Pozor: '+(v.sf_note||'Stockfish tu našel chybu.'):''}`});});
 ['w','b'].forEach(sd=>{const C=CV_COURSES[sd];C.chapters=Object.entries(by[sd]).sort((a,b)=>b[1].length-a[1].length).map(([fam,lines])=>({t:fam,s:`${lines.length} ${lines.length===1?'varianta':lines.length<5?'varianty':'variant'}`,plan:'Varianty, které přidali hráči. U každé je napsané, kdo ji přidal a kolik hráčů ji hraje.',lines}));
  C.chapters.forEach(chp=>chp.lines.forEach(l=>{l.ch=chp;l.moves=l.m.split(' ');}));const i=COURSES.indexOf(C);const on=isBeta()&&C.chapters.length>0;if(on&&i<0)COURSES.push(C);else if(!on&&i>=0)COURSES.splice(i,1);if(on&&store.prog)store.prog[C.id]=store.prog[C.id]||{};});
 try{EXI=null;RZI=null;}catch(e){}const cc=document.querySelector('#nxNav .nxCourses');if(cc){try{const t=document.createElement('div');t.innerHTML=nxNavHTML();const nc=t.querySelector('.nxCourses');if(nc)cc.innerHTML=nc.innerHTML;nxMark();}catch(e){}}}
async function cvRefresh(rerender){if(!isBeta())return;try{await chessLib();await cvNames();}catch(e){}await cvLoad();if(CHESS)cvBuild();
 if(rerender&&!$('home').hidden&&['all','cv','explore'].includes(page))renderHome();}
function cvRemove(){['w','b'].forEach(sd=>{const i=COURSES.indexOf(CV_COURSES[sd]);if(i>=0)COURSES.splice(i,1);});CV.list=null;}

/* ---------- Najít variantu: karta pro přidání a varianty od hráčů, které tudy vedou ---------- */
function cvExploreHTML(exact){/* kurzy, které tudy jdou, rozdělené podle barvy: 1.e4 d5 je v kurzu za černé (Skandinávská), ale za bílé na to odpověď nemáš */const cov=new Set((exact||[]).map(x=>x.c.side));if(!isBeta())return'';const seq=EX.moves.slice(),n=seq.length;const L=(CV.list||[]).filter(v=>!v.hidden);
 const pre=n?L.filter(v=>{const s=cvSans(v.moves);return s.length>=n&&seq.every((m,i)=>s[i]===m);}):[];
 const same=pre.filter(v=>cvSans(v.moves).length===n);
 const cl=CV.names&&n?cvClassify(seq):{name:''};const nm=cl.name?cvCz(cl.name):'';
 let add='';
 if(n<2)add=`<div class="profCard cvAdd"><h2>Varianty od hráčů</h2><p class="btDim">Zahraj tahy za obě strany. Když varianta v kurzech nebude, objeví se tady tlačítko a přidáš ji pro všechny.</p></div>`;
 if(n>=2&&cov.size<2){const hasW=cov.has('w')||pre.some(v=>v.side==='w'),hasB=cov.has('b')||pre.some(v=>v.side==='b');
  add=`<div class="profCard cvAdd" id="cvAdd"><h2>${cov.has('b')?'Za bílé tahle varianta v kurzech není':cov.has('w')?'Za černé tahle varianta v kurzech není':'Tahle varianta v kurzech není'}</h2>${nm?`<p class="cvNm">${escH(nm)} <small class="btDim">${cl.eco}</small></p>`:''}
   ${CV.err==='nodb'?'<p class="btDim">Přidávání variant ještě není zapnuté v databázi. Správce musí jednou spustit supabase.sql.</p>'
   :`${hasW&&hasB?'<p class="btDim">Tuhle variantu už někdo přidal, najdeš ji níž.</p>':`<p class="btDim">Přidej ji pro všechny hráče. Stockfish ji zkontroluje, dopočítá aspoň do 8. tahu a sama se zařadí pod správné zahájení.</p>`}<div class="btRow">${hasW?'':'<button class="btn primary" data-cvadd="w">Přidat, hraju ji za bílé</button>'}${hasB?'':'<button class="btn" data-cvadd="b">Přidat, hraju ji za černé</button>'}</div><div id="cvChk"></div>`}</div>`;}
 const row=v=>`<div class="cvRow"><div class="cvTx"><b>${escH(cvCz(v.opening)||'Varianta')}</b>${v.featured?' <span class="cvTag gold">Doporučeno</span>':''}${v.sf_bad?' <span class="cvTag bad">Stockfish: chyba</span>':''}<small class="btDim">za ${v.side==='w'?'bílé':'černé'} · přidal ${escH(v.by||'hráč')} · hraje ${v.votes}</small><small class="cvMv">${cvFullCz(cvSans(v.moves))}</small></div><div class="cvBtns"><button class="btn" data-cvpr="${v.id}">Procvičit</button><button class="btn" data-cvvote="${v.id}" aria-pressed="${!!v.mine}">${v.mine?'Hraju to':'Taky to hraju'}</button></div></div>`;
 const list=pre.length?`<div class="profCard"><h2>Varianty od hráčů, které tudy vedou <small class="exCnt">${pre.length}</small></h2><div class="cvList">${pre.slice(0,20).map(row).join('')}</div></div>`:'';
 return add+list;}
function cvWire(root){if(!root)return;root.querySelectorAll('[data-cvadd]').forEach(b=>b.onclick=()=>cvAdd(b.dataset.cvadd));
 root.querySelectorAll('[data-cvpr]').forEach(b=>b.onclick=()=>cvPractice(+b.dataset.cvpr));
 root.querySelectorAll('[data-cvvote]').forEach(b=>b.onclick=()=>cvVote(+b.dataset.cvvote,b));
 root.querySelectorAll('[data-cvadm]').forEach(b=>b.onclick=()=>cvAdmin(+b.dataset.cvid,b.dataset.cvadm));}
function cvPractice(id){const v=(CV.list||[]).find(x=>x.id===id);if(!v)return;btPractice(v.side==='b'?'cvb':'cvw','cv'+id);}
async function cvVote(id,b){const v=(CV.list||[]).find(x=>x.id===id);if(!v)return;const on=!v.mine;b.disabled=true;
 try{await rpc('trener_cv_vote',{p_token:getTok(),p_id:id,p_on:on});v.mine=on;v.votes=Math.max(0,(+v.votes||0)+(on?1:-1));v.votes7=Math.max(0,(+v.votes7||0)+(on?1:-1));b.setAttribute('aria-pressed',on);b.textContent=on?'Hraju to':'Taky to hraju';cvBuild();}
 catch(e){toast('Nepodařilo se uložit. Zkus to znovu.');}b.disabled=false;}
async function cvAdmin(id,act){const v=(CV.list||[]).find(x=>x.id===id);if(!v||!SYNC.admin)return;
 const p={p_token:getTok(),p_id:id,p_hidden:null,p_featured:null};if(act==='hide')p.p_hidden=!v.hidden;else p.p_featured=!v.featured;
 try{await rpc('trener_admin_cv_set',p);if(act==='hide')v.hidden=!v.hidden;else v.featured=!v.featured;cvBuild();renderCv();}catch(e){toast('Nepodařilo se uložit.');}}
/* kontrola Stockfishem: tahy strany, za kterou hráč variantu hraje; chyba = ztráta víc než 1,5 pěšce proti nejlepšímu tahu */
async function cvAdd(side){const seq=EX.moves.slice();const box=document.getElementById('cvChk');const btns=document.querySelectorAll('[data-cvadd]');btns.forEach(b=>b.disabled=true);
 const say=h=>{const b=document.getElementById('cvChk');if(b)b.innerHTML=h;};const my=seq.map((s,i)=>i).filter(i=>(i%2===0)===(side==='w'));
 const bad=[];const D=IS_MOBILE?10:12;let k=0;try{clearTimeout(XE.t);}catch(e){}
 /* analýza v Najít variantu by kontrolu přerušila: zastavit ji a při přerušení zkusit znovu */
 const sfA=async fen=>{for(let t=0;t<4;t++){try{clearTimeout(XE.t);}catch(e){}const r=await sfAnalyse(fen,{depth:D});if(r&&r.lines[0])return r;}return null;};
 try{const g=new CHESS();for(let i=0;i<seq.length;i++){const before=g.fen();const mv=g.move(seq[i],{strict:false});
   if(my.includes(i)){k++;say(`<p class="btDim"><span class="spin"></span> Stockfish kontroluje tvůj ${k}. tah z ${my.length}…</p>`);
    const a=await sfA(before);const b=await sfA(g.fen());if(!a||!b)throw new Error('sf');
    const bestCp=a.lines[0].cp,afterCp=b.lines[0].cp;const loss=side==='w'?bestCp-afterCp:afterCp-bestCp;
    if(loss>150){let bs=a.best;try{const t=new CHESS(before).move({from:bs.slice(0,2),to:bs.slice(2,4),promotion:bs[4]||'q'});bs=t.san;}catch(e){}bad.push({i,san:mv.san,loss,best:bs});}}}}
 catch(e){say('<p class="btDim">Stockfish teď nejde spustit. Zkus to za chvíli znovu.</p>');btns.forEach(b=>b.disabled=false);return;}
 const lab=i=>`${Math.floor(i/2)+1}.${i%2?'..':''}`;const note=bad.length?bad.map(x=>`${lab(x.i)}${czSan(x.san)} ztrácí ${(x.loss/100).toFixed(1).replace('.',',')} pěšce, lepší je ${lab(x.i)}${czSan(x.best)}`).join('; '):'';
 /* krátkou variantu Stockfish dopočítá nejlepšími tahy za obě strany, aby bylo co procvičovat (aspoň do 8. tahu, nejvýš o 14 půltahů) */
 const CV_MIN=16,CV_ADD=14;
 const go=async()=>{const full=seq.slice();const want=Math.min(Math.max(CV_MIN,full.length),full.length+CV_ADD);
  if(full.length<want){const g=new CHESS();full.forEach(m=>g.move(m,{strict:false}));
   while(full.length<want&&!g.isGameOver()){say(`<p class="btDim"><span class="spin"></span> Stockfish dopočítává variantu: ${cvFullCz(full)}</p>`);const r=await sfA(g.fen());if(!r||!r.best||r.best==='(none)')break;
    let mv;try{mv=g.move({from:r.best.slice(0,2),to:r.best.slice(2,4),promotion:r.best[4]||'q'});}catch(e){break;}if(!mv)break;full.push(mv.san);}}
  say('<p class="btDim"><span class="spin"></span> Ukládám…</p>');const cl=CV.names?cvClassify(full):{eco:'',name:''};
  try{const r=await rpc('trener_cv_add',{p_token:getTok(),p_moves:full.join(' '),p_side:side,p_eco:cl.eco||null,p_opening:cl.name||null,p_sf_bad:bad.length,p_sf_note:note||null});
   await cvRefresh(false);toast(r&&r.created===false?'Tahle varianta už tam byla, přidal jsem k ní tvůj hlas.':full.length>seq.length?`Přidáno. Stockfish ji dopočítal do ${Math.ceil(full.length/2)}. tahu.`:'Varianta je přidaná pro všechny.');if(page==='explore')exPanels();}
  catch(e){say(`<p class="btDim">${cvErrNoDb(e)?'Přidávání variant ještě není zapnuté v databázi.':/too_many/.test(String(e.message))?'Za poslední hodinu jsi přidal hodně variant. Zkus to později.':'Nepodařilo se uložit. Zkus to znovu.'}</p>`);btns.forEach(b=>b.disabled=false);}};
 if(!bad.length){say('<p class="cvOk">Stockfish nenašel žádnou chybu.</p>');go();return;}
 say(`<p class="cvWarn"><b>Stockfish tu našel ${bad.length===1?'chybu':'chyby'}:</b> ${escH(note)}.</p><p class="btDim">Jestli je to schválně (gambit, past), můžeš ji přidat i tak. U varianty bude upozornění.</p><div class="btRow"><button class="btn primary" id="cvForce">Přesto přidat</button><button class="btn" id="cvCancel">Zrušit</button></div>`);
 document.getElementById('cvForce').onclick=go;document.getElementById('cvCancel').onclick=()=>{say('');btns.forEach(b=>b.disabled=false);};}

/* ---------- stránka #varianty ---------- */
async function renderCv(){document.body.classList.add('homeMode');
 if(!isBeta()){if(!SYNC.user){$('home').innerHTML='<p class="btDim">Načítám…</p>';return;}go('');return;}
 if(!CV.list){$('home').innerHTML='<button type="button" class="btn btBack">← Zpět</button><p class="btDim">Načítám varianty…</p>';await cvRefresh(false);if(page!=='cv')return;}
 const all=(CV.list||[]).filter(v=>SYNC.admin||!v.hidden),L=all.filter(v=>!v.hidden);const T=CV.tab;
 const fams={};L.forEach(v=>{const f=cvFam(v.opening);const o=fams[f]=fams[f]||{f,n:0,v7:0,vt:0,items:[]};o.n++;o.v7+=+v.votes7||0;o.vt+=+v.votes||0;o.items.push(v);});
 const famL=Object.values(fams).sort((a,b)=>T==='week'?(b.v7-a.v7||b.vt-a.vt):(b.n-a.n||b.vt-a.vt));
 const dt=s=>{try{return new Date(s).toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric'});}catch(e){return'';}};
 const row=v=>`<div class="cvRow${v.hidden?' cvHid':''}"><div class="cvTx"><b>${escH(cvCz(v.opening)||'Varianta')}</b>${v.featured?' <span class="cvTag gold">Doporučeno</span>':''}${v.sf_bad?` <span class="cvTag bad" title="${escH(v.sf_note||'')}">Stockfish: chyba</span>`:''}${v.hidden?' <span class="cvTag">Skryté</span>':''}
   <small class="btDim">za ${v.side==='w'?'bílé':'černé'} · přidal ${escH(v.by||'hráč')} ${dt(v.at)} · hraje ${v.votes}${+v.votes7?`, tento týden +${v.votes7}`:''}</small><small class="cvMv">${cvFullCz(cvSans(v.moves))}</small>${v.sf_bad&&v.sf_note?`<small class="cvNote">${escH(v.sf_note)}</small>`:''}</div>
   <div class="cvBtns">${v.hidden?'':`<button class="btn primary" data-cvpr="${v.id}">Procvičit</button><button class="btn" data-cvvote="${v.id}" aria-pressed="${!!v.mine}">${v.mine?'Hraju to':'Taky to hraju'}</button>`}${SYNC.admin?`<button class="btn" data-cvadm="feat" data-cvid="${v.id}">${v.featured?'Zrušit doporučení':'Doporučit'}</button><button class="btn" data-cvadm="hide" data-cvid="${v.id}">${v.hidden?'Zobrazit':'Skrýt'}</button>`:''}</div></div>`;
 const tabs=[['week','Nejvíc přidávané tento týden'],['new','Nejnovější'],['fam','Podle zahájení']];
 let body;
 if(CV.err==='nodb')body='<div class="profCard"><h2>Ještě není zapnuté</h2><p>Varianty od hráčů potřebují v databázi novou tabulku. Správce ji zapne tak, že jednou spustí <b>supabase.sql</b> v Supabase (SQL Editor → vložit celý soubor → Run).</p></div>';
 else if(!L.length&&!all.length)body=`<div class="profCard"><h2>Zatím žádná varianta</h2><p>Otevři <a class="btLink" href="#hledat">Najít variantu</a>, zahraj tahy, které v kurzech nejsou, a klepni na „Přidat“. Stockfish ji zkontroluje a sama se zařadí pod správné zahájení.</p></div>`;
 else if(T==='new')body=`<div class="profCard"><div class="cvList">${all.slice(0,80).map(row).join('')}</div></div>`;
 else body=famL.map(o=>{const open=CV.open===o.f||famL.length<=3;const items=o.items.slice().sort((a,b)=>T==='week'?((+b.votes7||0)-(+a.votes7||0)||b.votes-a.votes):b.votes-a.votes);
   return `<div class="profCard cvFam"><button class="cvFamH" data-cvfam="${escH(o.f)}" aria-expanded="${open}"><b>${escH(o.f)}</b><span class="btDim">${o.n} ${o.n===1?'varianta':o.n<5?'varianty':'variant'} · ${T==='week'?`tento týden +${o.v7}`:`hraje celkem ${o.vt}`}</span></button>${open?`<div class="cvList">${items.map(row).join('')}</div>`:''}</div>`;}).join('')
   +(SYNC.admin&&all.some(v=>v.hidden)?`<div class="profCard"><h2>Skryté varianty</h2><div class="cvList">${all.filter(v=>v.hidden).map(row).join('')}</div></div>`:'');
 const top=famL.filter(o=>o.v7>0).slice(0,3);
 $('home').innerHTML=`<button type="button" class="btn btBack">← Zpět</button><div class="btPage"><div class="btHead"><h1>Varianty od hráčů</h1><p class="btDim">Varianty, které v kurzech chybí a přidali je hráči. Každou zkontroloval Stockfish a sama se zařadila pod zahájení. Co se přidává nejvíc, to se nejspíš nejvíc hraje.</p></div>
  ${SYNC.admin&&top.length?`<div class="profCard cvAdmTop"><h2>Pro správce</h2><p>Tento týden se nejvíc přidává: ${top.map(o=>`<b>${escH(o.f)}</b> (+${o.v7})`).join(', ')}. To jsou kandidáti na nový kurz nebo rozšíření kurzu.</p></div>`:''}
  <div class="btRow cvTop"><div class="chip2 btSeg" role="group">${tabs.map(([k,t])=>`<button type="button" data-cvtab="${k}" aria-pressed="${T===k}">${t}</button>`).join('')}</div><a class="btn" href="#hledat">Přidat variantu</a></div>${body}</div>`;
 const H=$('home');H.querySelectorAll('[data-cvtab]').forEach(b=>b.onclick=()=>{CV.tab=b.dataset.cvtab;renderCv();});
 H.querySelectorAll('[data-cvfam]').forEach(b=>b.onclick=()=>{CV.open=CV.open===b.dataset.cvfam?null:b.dataset.cvfam;renderCv();});cvWire(H);}
/* ===================== konec VARIANTY OD HRÁČŮ ===================== */
