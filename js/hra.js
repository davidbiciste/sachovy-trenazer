/* ===== HRA S KAMARÁDEM NAŽIVO (#hra, #hra/<kód>) – 19. 11. 2026 =====
   Hráč vytvoří hru (čas + barva) → odkaz #hra/<kód> pošle kamarádovi → kamarád ho otevře (musí být přihlášený) a hra začne.
   Databáze (supabase.sql, tabulka live_games, funkce trener_live_*) hlídá pořadí tahů a hodiny podle času serveru; pravidla kontroluje chess.js v prohlížeči.
   Synchronizace: Supabase Realtime (kanál trener-live-<kód>, zpráva „u“ = koukni do databáze) + záložní dotazování (1,2 s bez Realtime, 3 s s ním).
   Hodiny běží až od prvního tahu černého (jako na Lichess); do té doby jde hru zrušit. Šachovnice = #xBoard v režimu XB.mode='lv'. */
const LV={route:'',code:null,s:null,g:null,vg:null,vw:null,flip:false,ch:null,rt:false,pt:null,tick:null,off:0,pend:0,conf:null,mine:null,err:null,cfg:{t:'5+0',c:'r'},flagAt:0,low:{}};
const LV_TIMES=[['1+0','Bullet'],['2+1','Bullet'],['3+0','Blitz'],['3+2','Blitz'],['5+0','Blitz'],['5+3','Blitz'],['10+0','Rapid'],['10+5','Rapid'],['15+10','Rapid'],['30+0','Klasika'],['0+0','Bez času']];
try{const c=JSON.parse(localStorage.getItem('trener-lv-cfg')||'null');if(c&&c.t&&c.c)LV.cfg=c;}catch(e){}
const lvRpc=(fn,a)=>rpc(fn,Object.assign({p_token:getTok()},a));
const lvLink=c=>location.origin+location.pathname+'#hra/'+c;
const lvTc=(base,inc)=>base?`${Math.round(base/60000*10)/10} + ${Math.round(inc/1000)}`.replace('.',','):'Bez času';
const lvErr=e=>{const m=String(e&&(e.message||e.msg)||e||'');return /not_found/.test(m)?'Hra s tímhle kódem neexistuje. Zkontroluj odkaz.':/too_many/.test(m)?'Vytvořil jsi moc her za poslední hodinu. Zkus to za chvíli.':/bad_token/.test(m)?'Přihlášení vypršelo. Přihlas se znovu.':/function .*trener_live|Could not find the function|PGRST202/i.test(m)?'Hra s kamarádem ještě není zapnutá v databázi.':'Teď se nejde spojit se serverem. Zkus to za chvíli.';};
function lvFmt(ms){ms=Math.max(0,ms);if(ms<20000)return (Math.floor(ms/100)/10).toFixed(1).replace('.',',');const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(r).padStart(2,'0');}
function lvTimes(){const s=LV.s;if(!s)return[0,0];let w=s.wtime,b=s.btime;if(s.status==='play'&&s.base>0&&s.ply>=2&&s.last){const el=Date.now()+LV.off-s.last;if(s.ply%2===0)w-=el;else b-=el;}return[Math.max(0,w),Math.max(0,b)];}
function lvBuildG(moves){const g=new CHESS();for(const u of moves){if(!u)continue;let ok=null;try{ok=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});}catch(e){}if(!ok)break;}return g;}
const lvUcis=g=>g.history({verbose:true}).map(m=>m.from+m.to+(m.promotion||''));
function lvMySide(){const s=LV.s;return s&&(s.me==='w'||s.me==='b')?s.me:null;}
function lvCanMove(){const s=LV.s,me=lvMySide();return !!(s&&me&&s.status==='play'&&LV.g&&LV.g.turn()===me&&LV.vw==null);}
function lvSfx(mv,g){sfx(mv.flags.includes('k')||mv.flags.includes('q')?'castle':g.inCheck()?'check':mv.captured?'capture':'move');}
function lvOver(g){return g.isCheckmate()?'mate':g.isStalemate()?'stalemate':g.isInsufficientMaterial()?'material':g.isThreefoldRepetition()?'repetition':g.isDrawByFiftyMoves()?'fifty':null;}

/* ---------- spojení: Realtime + dotazování ---------- */
function lvSub(code){lvUnsub();try{if(!SB||!SB.channel)return;const ch=SB.channel('trener-live-'+code,{config:{broadcast:{self:false}}});ch.on('broadcast',{event:'u'},()=>lvFetch());ch.subscribe(st=>{LV.rt=st==='SUBSCRIBED';});LV.ch=ch;}catch(e){LV.ch=null;}}
function lvUnsub(){if(LV.ch){try{SB.removeChannel(LV.ch);}catch(e){}}LV.ch=null;LV.rt=false;}
function lvPing(){try{if(LV.ch&&LV.rt)LV.ch.send({type:'broadcast',event:'u',payload:{}});}catch(e){}}
function lvStop(){clearTimeout(LV.pt);LV.pt=null;clearInterval(LV.tick);LV.tick=null;lvUnsub();LV.code=null;}
function lvAlive(code){return page==='hra'&&LV.code===code&&!document.getElementById('lvLobby');}
function lvLoop(){clearTimeout(LV.pt);const code=LV.code;if(!lvAlive(code))return;const s=LV.s;
 const wait=!s?1500:s.status==='end'?(s.rematch?0:4000):LV.rt?3000:1200;if(!wait)return;
 LV.pt=setTimeout(async()=>{if(!lvAlive(code))return;if(!document.hidden)await lvFetch();lvLoop();},wait);}
async function lvFetch(){const code=LV.code;if(!code||LV.busy)return;LV.busy=true;try{const r=await lvRpc('trener_live_state',{p_code:code});if(LV.code===code)lvApply(r);}catch(e){}finally{LV.busy=false;}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&page==='hra'&&LV.code)lvFetch();});

/* ---------- příchozí stav ---------- */
function lvApply(s){if(!s||s.code!==LV.code||page!=='hra')return;if(LV.pend&&s.status==='play'&&s.ply<LV.pend)return;
 const prev=LV.s;LV.off=s.now-Date.now();LV.s=s;
 const flip=s.me==='b'||(s.me==='c'&&s.ccolor==='b');const flipCh=flip!==LV.flip;LV.flip=flip;
 const want=s.moves?s.moves.split(' '):[];const have=LV.g?lvUcis(LV.g):null;
 if(!LV.g||want.length<have.length||have.some((u,i)=>u!==want[i])||want.length-have.length>1){LV.g=lvBuildG(want);if(LV.vw!=null)lvView(null,true);xBuild();xSet();}
 else if(want.length>have.length){if(LV.vw!=null)lvView(null,true);const u=want[want.length-1];let mv=null;try{mv=LV.g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined});}catch(e){}if(mv){XB.sel=null;xAnimate(mv);xMarks();lvSfx(mv,LV.g);}else{LV.g=lvBuildG(want);xSet();}}
 if(flipCh){xBuild();xSet();xRenderMarks();}
 if(prev&&prev.status==='wait'&&s.status==='play'){sfx('start');LV.low={};}
 if(prev&&prev.status==='play'&&s.status==='end'&&s.reason!=='abort'){const me=lvMySide();sfx(!me||s.result==='1/2-1/2'?'move':(s.result==='1-0')===(me==='w')?'win':'wrong');}
 if(s.rematch&&prev&&!prev.rematch&&lvMySide()){setTimeout(()=>{if(page==='hra'&&LV.s===s)go('#hra/'+s.rematch);},900);}
 lvPanel();lvClocks();}

/* ---------- tah ---------- */
function lvTry(from,to){if(!lvCanMove())return false;const g=LV.g;let mv=null;try{mv=g.move({from:sqName(from),to:sqName(to),promotion:XPROMO||'q'});}catch(e){}if(!mv)return false;
 XB.sel=null;xAnimate(mv);xMarks();lvSfx(mv,g);
 const s=LV.s,ply=s.ply,uci=mv.from+mv.to+(mv.promotion||''),over=lvOver(g),now=Date.now()+LV.off;
 if(s.base>0&&ply>=2&&s.last){const el=now-s.last;if(s.me==='w')s.wtime=s.wtime-el+s.inc;else s.btime=s.btime-el+s.inc;}
 s.moves=(s.moves?s.moves+' ':'')+uci;s.ply=ply+1;s.last=now;s.fen=g.fen();if(s.draw&&s.draw!==s.me)s.draw=null;
 LV.pend=s.ply;LV.conf=null;lvPanel();lvClocks();lvSend(LV.code,{p_code:LV.code,p_ply:ply,p_uci:uci,p_fen:g.fen(),p_over:over},0);return true;}
async function lvSend(code,args,n){try{const r=await lvRpc('trener_live_move',args);LV.pend=0;if(LV.code===code){lvApply(r);lvPing();}}
 catch(e){if(LV.code!==code)return;if(n<3&&!/not_your_turn|bad_move/.test(String(e&&e.message))){if(!n)toast('Tah se odesílá znovu…');setTimeout(()=>lvSend(code,args,n+1),800*(n+1));return;}LV.pend=0;toast('Tah se nepodařilo odeslat.');lvFetch();}}
async function lvAct(a){const code=LV.code;if(!code)return;LV.conf=null;try{const r=await lvRpc('trener_live_act',{p_code:code,p_act:a});if(LV.code===code){lvApply(r);lvPing();}}catch(e){toast(lvErr(e));}}

/* ---------- prohlížení tahů (◀ ▶, šipky) ---------- */
function lvView(v,quiet){const g=LV.g;if(!g)return;const h=g.history(),n=h.length;
 if(v==null||v>=n){LV.vw=null;LV.vg=null;}else{v=Math.max(0,v);const vg=new CHESS();for(let i=0;i<v;i++)vg.move(h[i]);LV.vw=v;LV.vg=vg;}
 if(quiet)return;XB.sel=null;xSet();lvMoves();sfx('move');}
addEventListener('keydown',e=>{if(page!=='hra'||!LV.g||!document.getElementById('lvMoves'))return;if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;if(e.target&&/input|textarea|select/i.test(e.target.tagName))return;
 const n=LV.g.history().length,cur=LV.vw==null?n:LV.vw;lvView(e.key==='ArrowLeft'?cur-1:cur+1);e.preventDefault();});

/* ---------- vykreslení ---------- */
function lvMat(g){const v={p:1,n:3,b:3,r:5,q:9};let d=0;g.board().forEach(r=>r.forEach(p=>{if(p&&p.type!=='k')d+=(p.color==='w'?1:-1)*v[p.type];}));return d;}
function lvClocks(){const s=LV.s;if(!s)return;const [w,b]=lvTimes(),bot=LV.flip?'b':'w',top=bot==='w'?'b':'w';const stm=s.ply%2===0?'w':'b';
 const set=(id,col)=>{const el=document.getElementById(id);if(!el)return;const t=col==='w'?w:b;const on=s.status==='play'&&stm===col;
  el.querySelector('.lvTime').textContent=s.base?lvFmt(t):'–';el.classList.toggle('on',on);el.classList.toggle('run',on&&s.base>0&&s.ply>=2);el.classList.toggle('low',!!s.base&&t<Math.min(20000,s.base*.1+1)&&s.status!=='wait');el.classList.toggle('out',!!s.base&&t<=0);
  if(on&&s.base&&lvMySide()===col&&t<10000&&t>0&&!LV.low[col]&&s.base>=60000){LV.low[col]=1;sfx('wrong');}};
 set('lvClkT',top);set('lvClkB',bot);
 if(s.status==='play'&&s.base&&s.ply>=2&&(stm==='w'?w:b)<=0&&Date.now()-LV.flagAt>1500){LV.flagAt=Date.now();lvFetch();}}
function lvBars(){const s=LV.s;if(!s)return;const bot=LV.flip?'b':'w',top=bot==='w'?'b':'w';const md=LV.g?lvMat(LV.g):0;const me=lvMySide();
 const nm=col=>{const n=col==='w'?s.wname:s.bname;if(!n)return s.status==='wait'?(col===(s.ccolor==='r'?null:s.ccolor)?escH(s.cname):'Čeká se na kamaráda'):'?';return escH(n)+(me===col?' <small>(ty)</small>':'');};
 const adv=col=>{const d=col==='w'?md:-md;return d>0?`<span class="lvAdv">+${d}</span>`:'';};
 [['lvClkT',top],['lvClkB',bot]].forEach(([id,col])=>{const el=document.getElementById(id);if(!el)return;el.querySelector('.lvWho').innerHTML=`<span class="lvDot ${col}"></span><span class="lvNm">${nm(col)}</span>${adv(col)}`;});}
function lvMoves(){const el=document.getElementById('lvMoves');if(!el||!LV.g)return;const h=LV.g.history(),n=h.length,cur=LV.vw==null?n:LV.vw;
 if(!n){el.innerHTML='<p class="btDim lvNoMv">Zatím žádný tah.</p>';}
 else{let t='';for(let i=0;i<n;i+=2){t+=`<span class="lvNo">${i/2+1}.</span><button class="lvMv${cur===i+1?' cur':''}" data-lvv="${i+1}">${escH(h[i])}</button>${h[i+1]?`<button class="lvMv${cur===i+2?' cur':''}" data-lvv="${i+2}">${escH(h[i+1])}</button>`:'<span></span>'}`;}
  el.innerHTML=`<div class="lvMvGrid">${t}</div>`;el.querySelectorAll('[data-lvv]').forEach(b=>b.onclick=()=>lvView(+b.dataset.lvv));const c=el.querySelector('.cur');if(c&&LV.vw==null)el.scrollTop=el.scrollHeight;}
 const nav=document.getElementById('lvNav');if(nav){nav.querySelector('[data-lvn="s"]').disabled=nav.querySelector('[data-lvn="b"]').disabled=!n||cur===0;nav.querySelector('[data-lvn="f"]').disabled=nav.querySelector('[data-lvn="e"]').disabled=cur>=n;const vb=document.getElementById('lvLiveB');if(vb)vb.hidden=LV.vw==null;}}
const LV_WHY={mate:'matem',resign:'vzdáním',time:'na čas',draw:'dohodou',stalemate:'patem',repetition:'trojím opakováním',material:'nedostatkem materiálu',fifty:'pravidlem 50 tahů'};
function lvPanel(){const el=document.getElementById('lvPanel');const s=LV.s;if(!el||!s)return;lvBars();lvMoves();const me=lvMySide(),opp=me==='w'?'b':'w';let h='';
 const tc=`<p class="lvTc">${lvTc(s.base,s.inc)}${s.base?' · minuty + sekundy za tah':''}</p>`;
 if(s.status==='wait'){
  if(s.me==='c'){h=`<h2>Čekám na kamaráda</h2>${tc}<p class="btDim">Pošli mu tenhle odkaz. Jakmile ho otevře, hra začne. Musí být přihlášený (účet si založí za pár vteřin).</p>
   <div class="lvLink"><input id="lvLinkIn" readonly value="${escH(lvLink(s.code))}" aria-label="Odkaz na hru"><button class="btn primary" id="lvCopy">Kopírovat odkaz</button></div>
   ${navigator.share?'<button class="btn" id="lvShare">Poslat přes…</button> ':''}<button class="btn" id="lvAbort">Zrušit hru</button><p class="btDim lvCode">Kód hry: <b>${escH(s.code)}</b></p>`;}
  else h=`<h2>Hra ještě nezačala</h2>${tc}`;}
 else if(s.status==='play'){
  const stm=s.ply%2===0?'w':'b';
  h=`<h2>${!me?'Sleduješ partii':stm===me?'Jsi na tahu':'Na tahu je soupeř'}</h2>${tc}`;
  if(me){if(s.ply<2)h+=`<p class="btDim">Hodiny se spustí po prvním tahu černého. Do té doby jde hru zrušit.</p>`;
   if(s.draw===opp)h+=`<div class="lvOffer"><b>Soupeř nabízí remízu.</b><div><button class="btn primary" data-lva="draw">Přijmout</button> <button class="btn" data-lva="nodraw">Odmítnout</button></div></div>`;
   else if(s.draw===me)h+=`<p class="btDim">Nabídl jsi remízu. Čeká se na soupeře.</p>`;
   h+=`<div class="lvActs">${s.ply<2?'<button class="btn" data-lva="abort">Zrušit hru</button>':''}${s.draw?'':'<button class="btn" data-lva="draw">Nabídnout remízu</button>'}<button class="btn${LV.conf==='resign'?' lvDanger':''}" id="lvResign">${LV.conf==='resign'?'Opravdu se vzdát?':'Vzdát se'}</button></div>`;}}
 else{const r=s.result;let t;
  if(s.reason==='abort'||!r)t='Hra zrušena';else if(r==='1/2-1/2')t='Remíza';else if(!me)t=(r==='1-0'?'Vyhrál bílý':'Vyhrál černý');else t=(r==='1-0')===(me==='w')?'Vyhrál jsi':'Prohrál jsi';
  const why=s.reason&&s.reason!=='abort'?(s.reason==='resign'?((r==='1-0')===(me==='w')?'Soupeř se vzdal.':me?'Vzdal ses.':''):'Konec '+LV_WHY[s.reason]+'.'):'';
  h=`<h2 class="lvRes">${t}${r&&s.reason!=='abort'?` <span class="lvScore">${r.replace('1/2-1/2','½–½').replace('-','–')}</span>`:''}</h2><p class="btDim">${why}</p><div class="lvActs">`;
  if(me&&s.reason!=='abort'){if(s.rematch)h+=`<a class="btn primary" href="#hra/${escH(s.rematch)}">Hrát odvetu</a>`;else if(s.remo===opp)h+=`<button class="btn primary" data-lva="rematch">Soupeř chce odvetu – hrát</button><button class="btn" data-lva="norematch">Ne, díky</button>`;else if(s.remo===me)h+=`<button class="btn" disabled>Odveta nabídnuta…</button>`;else h+=`<button class="btn primary" data-lva="rematch">Odveta</button>`;}
  h+=`<a class="btn" href="#hra">Nová hra</a>${s.ply>=2?'<button class="btn" id="lvReview">Rozbor partie</button>':''}</div>`;}
 el.innerHTML=h;
 el.querySelectorAll('[data-lva]').forEach(b=>b.onclick=()=>lvAct(b.dataset.lva));
 const rs=document.getElementById('lvResign');if(rs)rs.onclick=()=>{if(LV.conf==='resign'){lvAct('resign');return;}LV.conf='resign';lvPanel();clearTimeout(LV.confT);LV.confT=setTimeout(()=>{if(LV.conf==='resign'){LV.conf=null;lvPanel();}},4000);};
 const ab=document.getElementById('lvAbort');if(ab)ab.onclick=async()=>{await lvAct('abort');go('#hra');};
 const cp=document.getElementById('lvCopy');if(cp)cp.onclick=async()=>{const t=lvLink(s.code);try{await navigator.clipboard.writeText(t);toast('Odkaz zkopírovaný. Pošli ho kamarádovi.');}catch(e){const i=document.getElementById('lvLinkIn');i.select();try{document.execCommand('copy');toast('Odkaz zkopírovaný.');}catch(e2){}}};
 const sh=document.getElementById('lvShare');if(sh)sh.onclick=()=>navigator.share({title:'Zahraj si se mnou šachy',text:`Partie ${lvTc(s.base,s.inc)} v Šachovém trenažéru`,url:lvLink(s.code)}).catch(()=>{});
 const rv=document.getElementById('lvReview');if(rv)rv.onclick=()=>rvOpen({sans:LV.g.history(),w:s.wname||'Bílý',b:s.bname||'Černý',me:me||'w',src:'live'});}

function lvShell(title,body){return `<button type="button" class="btn btBack">← Zpět</button><div class="btPage lvPage"><div class="btHead"><h1>${title}</h1></div>${body}</div>`;}
async function renderHra(){document.body.classList.add('homeMode');const code=LV.route;
 if(LV.code&&LV.code!==code)lvStop();
 if(!getTok()){LV.code=null;$('home').innerHTML=lvShell('Hra s kamarádem',`<div class="profCard"><p>${code?'Kamarád tě zve na partii. ':''}Na hru s kamarádem se potřebuješ přihlásit. Účet si založíš za pár vteřin${code?' a hra hned začne':''}.</p><button class="btn primary" id="lvLogin">Přihlásit se</button></div>`);$('lvLogin').onclick=()=>openAccount();return;}
 if(!SYNC.user||!SB){$('home').innerHTML='<p class="btDim">Načítám…</p>';return;}
 try{await chessLib();}catch(e){$('home').innerHTML=lvShell('Hra s kamarádem','<div class="profCard"><p>Nepodařilo se načíst šachová pravidla. Obnov stránku.</p></div>');return;}
 if(page!=='hra'||LV.route!==code)return;
 if(!code)return lvLobby();
 if(LV.code===code&&document.getElementById('lvPanel')){lvPanel();return;}
 LV.code=code;LV.s=null;LV.g=null;LV.vw=null;LV.vg=null;LV.pend=0;LV.conf=null;LV.low={};XB.mode='lv';XB.sel=null;
 $('home').innerHTML=`<a class="backAll" href="#hra">← Hra s kamarádem</a><div class="exWrap lvWrap"><div class="exLeft"><div class="profCard lvBoardCard">
  <div class="lvClk" id="lvClkT"><span class="lvWho"></span><span class="lvTime">–</span></div>
  <div class="xRow pqRow"><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div>
  <div class="lvClk" id="lvClkB"><span class="lvWho"></span><span class="lvTime">–</span></div></div></div>
  <div class="exRight"><div class="profCard lvPanel" id="lvPanel"><p class="btDim"><span class="spin"></span> Připojuji se ke hře…</p></div>
  <div class="profCard"><h2 class="lvH">Tahy</h2><div class="lvMoves" id="lvMoves"></div><div class="lvNav" id="lvNav"><button class="btn" data-lvn="s" title="Na začátek" aria-label="Na začátek">⏮</button><button class="btn" data-lvn="b" title="Tah zpět (←)" aria-label="Tah zpět">◀</button><button class="btn" data-lvn="f" title="Tah vpřed (→)" aria-label="Tah vpřed">▶</button><button class="btn" data-lvn="e" title="Na konec" aria-label="Na konec">⏭</button><button class="btn" id="lvLiveB" hidden>Zpět k partii</button></div></div></div></div>`;
 LV.g=new CHESS();LV.flip=false;xBuild();xSet();xInput();{const t=document.querySelector('.lvBoardCard .xTools');if(t)document.querySelector('.lvBoardCard').appendChild(t);}lvMoves();
 document.querySelectorAll('[data-lvn]').forEach(b=>b.onclick=()=>{const n=LV.g.history().length,cur=LV.vw==null?n:LV.vw;const k=b.dataset.lvn;lvView(k==='s'?0:k==='b'?cur-1:k==='f'?cur+1:null);});
 document.getElementById('lvLiveB').onclick=()=>lvView(null);
 let r;try{r=await lvRpc('trener_live_join',{p_code:code});}catch(e){if(LV.code!==code)return;$('lvPanel').innerHTML=`<h2>Hru se nepodařilo otevřít</h2><p>${lvErr(e)}</p><a class="btn" href="#hra">Zpět</a>`;LV.code=null;return;}
 if(LV.code!==code||page!=='hra')return;
 lvApply(r);lvSub(code);lvPing();lvLoop();clearInterval(LV.tick);LV.tick=setInterval(()=>{if(page!=='hra'||LV.code!==code){lvStop();return;}lvClocks();},100);}

/* ---------- výběr hry (lobby) ---------- */
async function lvLobby(){XB.mode='lv';const c=LV.cfg;
 $('home').innerHTML=lvShell('Hra s kamarádem',`<p class="btDim lvIntro">Zahraj si živou partii s kamarádem. Vyber čas, vytvoř hru a pošli mu odkaz.</p><div class="lvLobby" id="lvLobby">
  <div class="profCard"><h2 class="lvH">Čas</h2><div class="lvTimes" role="group" aria-label="Tempo partie">${LV_TIMES.map(([t,k])=>`<button class="lvT" data-lvt="${t}" aria-pressed="${c.t===t}"><b>${t==='0+0'?'∞':t.replace('+',' + ')}</b><small>${k}</small></button>`).join('')}</div>
  <h2 class="lvH">Hraješ za</h2><div class="chip2 lvCols" role="group" aria-label="Barva">${[['w','Bílé'],['r','Náhodně'],['b','Černé']].map(([k,t])=>`<button data-lvc="${k}" aria-pressed="${c.c===k}">${k!=='r'?`<span class="lvDot ${k}"></span>`:''}${t}</button>`).join('')}</div>
  <button class="btn primary lvGo" id="lvCreate">Vytvořit hru a získat odkaz</button><p class="lvMsg" id="lvMsg" role="status"></p></div>
  <div class="lvSideCol"><div class="profCard"><h2 class="lvH">Máš kód od kamaráda?</h2><form class="lvJoin" id="lvJoinF"><input id="lvJoinIn" placeholder="např. k7m2xqp nebo celý odkaz" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Kód nebo odkaz hry"><button class="btn">Připojit</button></form></div>
  <div class="profCard"><h2 class="lvH">Tvoje hry</h2><div id="lvMine"><p class="btDim">Načítám…</p></div></div></div></div>`);
 document.querySelectorAll('[data-lvt]').forEach(b=>b.onclick=()=>{LV.cfg.t=b.dataset.lvt;lvSaveCfg();document.querySelectorAll('[data-lvt]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
 document.querySelectorAll('[data-lvc]').forEach(b=>b.onclick=()=>{LV.cfg.c=b.dataset.lvc;lvSaveCfg();document.querySelectorAll('[data-lvc]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
 $('lvCreate').onclick=async()=>{const bt=$('lvCreate');bt.disabled=true;$('lvMsg').textContent='';const [m,i]=LV.cfg.t.split('+').map(Number);
  try{const r=await lvRpc('trener_live_create',{p_base:Math.round(m*60),p_inc:i,p_color:LV.cfg.c});go('#hra/'+r.code);}catch(e){bt.disabled=false;$('lvMsg').textContent=lvErr(e);}};
 $('lvJoinF').onsubmit=e=>{e.preventDefault();const v=$('lvJoinIn').value.trim();const m=v.match(/#hra\/([a-z0-9]+)/i)||v.match(/^([a-z0-9]{5,10})$/i);if(!m){$('lvJoinIn').focus();toast('Vlož kód hry (7 znaků) nebo celý odkaz.');return;}go('#hra/'+m[1].toLowerCase());};
 let L;try{L=await lvRpc('trener_live_mine',{});}catch(e){const el=document.getElementById('lvMine');if(el)el.innerHTML=`<p class="btDim">${lvErr(e)}</p>`;return;}
 const el=document.getElementById('lvMine');if(!el||page!=='hra'||LV.route)return;
 if(!L||!L.length){el.innerHTML='<p class="btDim">Zatím žádné. Vytvoř první hru vlevo.</p>';return;}
 el.innerHTML=`<ul class="lvList">${L.map(g=>{const st=g.status==='wait'?'čeká na soupeře':g.status==='play'?'<b>hraje se</b>':g.result==='1/2-1/2'?'remíza':(g.result==='1-0')===(g.me==='w')?'výhra':'prohra';
  return `<li><a href="#hra/${escH(g.code)}"><span class="lvDot ${g.me==='c'?'':g.me}"></span><span class="lvLi"><b>${g.opp?escH(g.opp):'Bez soupeře'}</b><small>${lvTc(g.base,g.inc)} · ${st}</small></span><span class="lvLiGo">${g.status==='end'?'Ukázat':'Pokračovat'}</span></a></li>`;}).join('')}</ul>`;}
function lvSaveCfg(){try{localStorage.setItem('trener-lv-cfg',JSON.stringify(LV.cfg));}catch(e){}}
