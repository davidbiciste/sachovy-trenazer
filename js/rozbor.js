/* Rozbor hráče (#rozbor). Pořadí načítání je v index.html (APP_JS). */
/* ---------- Rozbor hráče (#rozbor/<jméno>): partie z chess.com, zahájení, chyby – všechno v prohlížeči ---------- */
/* prahové hodnoty pro štítky a doporučení */
const RZ_CFG={weakN:5,weakPct:40,strongPct:65,timeLossShare:25,rapidBetter:15,rapidMinN:10,bigLoss:3,mergePlies:6,wonAdv:3,wonPlies:4,egPts:13,openMoves:12,
 pressure:{bullet:10,blitz:20,rapid:60,daily:0},treeDepth:8,engDepth:10,engMs:400,engSkipMoves:6,engCap:1000,kingEgMin:3,wonLostMin:3};
const RZ_BOTS=['coach-david'];/* známí boti a trenéři z chess.com (daily partie proti nim se ve výchozím stavu nepočítají) */
const RZ_DRAW=new Set(['agreed','repetition','stalemate','insufficient','50move','timevsinsufficient']);
const RZ_WHY={checkmated:'mat',timeout:'čas',resigned:'vzdání',abandoned:'opuštění',agreed:'dohoda',repetition:'opakování',stalemate:'pat',insufficient:'málo materiálu','50move':'50 tahů',timevsinsufficient:'čas, málo materiálu',win:'výhra',lose:'prohra'};
const RZ_TC={bullet:'Bullet',blitz:'Blitz',rapid:'Rapid',daily:'Daily'};
const RZ_GEN={P:'pěšce',N:'jezdce',B:'střelce',R:'věže',Q:'dámy',K:'krále'};
const RZ_FAM={'Vienna-Game':'Vídeňská hra','Kings-Pawn-Opening':'Hra královým pěšcem','Queens-Pawn-Opening':'Hra dámským pěšcem','Italian-Game':'Italská hra','Giuoco-Piano-Game':'Italská hra',
 'Scandinavian-Defense':'Skandinávská obrana','Sicilian-Defense':'Sicilská obrana','Closed-Sicilian-Defense':'Sicilská obrana','French-Defense':'Francouzská obrana','Caro-Kann-Defense':'Caro-Kann',
 'Pirc-Defense':'Pircova obrana','Philidor-Defense':'Philidorova obrana','Petrovs-Defense':'Ruská hra','Alekhines-Defense':'Aljechinova obrana','Modern-Defense':'Moderní obrana',
 'Nimzowitsch-Defense':'Nimcovičova obrana','Four-Knights-Game':'Hra čtyř jezdců','Three-Knights-Opening':'Hra tří jezdců','Ruy-Lopez-Opening':'Španělská hra','Scotch-Game':'Skotská hra',
 'Bishops-Opening':'Střelcova hra','English-Opening':'Anglická hra','Reti-Opening':'Rétiho hra','Indian-Game':'Indická hra','Kings-Indian-Attack':'Královský indický útok',
 'Kings-Indian-Defense':'Královská indická obrana','Queens-Gambit':'Dámský gambit','London-System':'Londýnský systém','Slav-Defense':'Slovanská obrana','Semi-Slav-Defense':'Poloslovanská obrana',
 'Dutch-Defense':'Holandská obrana','Kings-Gambit':'Královský gambit','Kings-Fianchetto-Opening':'Královské fianchetto','Owens-Defense':'Owenova obrana','Center-Game':'Středová hra',
 'Danish-Gambit':'Dánský gambit','Ponziani-Opening':'Ponzianiho hra','Nimzo-Indian-Defense':'Nimcovičova indická obrana','Grunfeld-Defense':'Grünfeldova indická obrana','Benoni-Defense':'Benoni',
 'Queens-Indian-Defense':'Dámská indická obrana','Bird-Opening':'Birdova hra','Polish-Opening':'Polská hra','Englund-Gambit':'Englundův gambit','Elephant-Gambit':'Sloní gambit','Latvian-Gambit':'Lotyšský gambit'};
const czSan=s=>String(s).replace(/^[NBRQK]/,c=>({N:'J',B:'S',R:'V',Q:'D',K:'K'})[c]).replace(/=([NBRQ])/,(m,c)=>'='+({N:'J',B:'S',R:'V',Q:'D'})[c]);
const rzMvLab=(san,i)=>(i%2===0?`${i/2+1}.`:`${(i+1)/2}…`)+czSan(san);
const rzPath=(sans,n)=>sans.slice(0,n).map((s,i)=>(i%2===0?`${i/2+1}.`:(i===0?'1…':''))+czSan(s)).join(' ');
const rzPct=(w,d,n)=>n?Math.round(w/n*100):0;/* úspěšnost = podíl výher (remízy se nepočítají jako půl) */
const rzPts=(w,d)=>{const p=w+d/2;return Number.isInteger(p)?String(p):(Math.floor(p)||'')+'½';};
const rzClk=s=>s==null?'–':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const rzDate=t=>new Date(t*1000).toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric',year:'2-digit'});
const rzWp=cp=>50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
/* Přísnější hodnocení tahů (22. 11. 2026, blíž chess.com): strmější křivka šance na výhru (ve vyrovnané pozici stojí ztráta pěšce víc),
   přesnost partie = průměr obyčejného a harmonického průměru (jedna hrubá chyba přesnost výrazně stáhne), přísnější odhad Elo z průměrné ztráty. */
const wpStrict=cp=>{const c=Math.max(-3000,Math.min(3000,cp));return 50+50*(2/(1+Math.exp(-0.0055*c))-1);};
const accMove=drop=>Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*Math.max(0,drop))-3.1669));
function accGame(arr){if(!arr.length)return null;const am=arr.reduce((a,b)=>a+b,0)/arr.length,hm=arr.length/arr.reduce((a,v)=>a+1/Math.max(5,v),0);return Math.round((am+hm)/2*10)/10;}
const ELO_ACPL=[[10,2500],[20,2200],[32,1900],[45,1600],[60,1350],[75,1150],[95,950],[120,750],[160,550],[220,350],[320,150]];
function eloFromAcpl(acpl){const T=ELO_ACPL;if(acpl<=T[0][0])return T[0][1];for(let i=1;i<T.length;i++){const [c1,v1]=T[i-1],[c2,v2]=T[i];if(acpl<=c2)return Math.round((v1+(v2-v1)*(acpl-c1)/(c2-c1))/50)*50;}return 100;}
let RZ={route:'',name:'',disp:'',token:0,tempo:['blitz','rapid'],limit:200,all:null,stats:null,err:null,offline:false,
 f:{color:'all',period:0,rated:false,bots:false},chk:new Set(),pick:null,lim:25,open:new Set(),sel:null,view:null,vg:null,showAll:false,
 eng:{run:0,busy:false,res:{},n:30,prog:''}};
/* ---- úložiště (IndexedDB): uzavřené měsíce a výsledky enginu; bez úložiště všechno funguje dál ---- */
const RZDB={p:null};
function rzDb(){if(RZDB.p)return RZDB.p;RZDB.p=new Promise(res=>{try{const r=indexedDB.open('trener-rozbor',1);r.onupgradeneeded=()=>{const d=r.result;['m','e'].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s);});};
 r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null);setTimeout(()=>res(null),4000);}catch(e){res(null);}});return RZDB.p;}
async function rzGet(st,k){const d=await rzDb();if(!d)return null;return new Promise(res=>{try{const q=d.transaction(st).objectStore(st).get(k);q.onsuccess=()=>res(q.result==null?null:q.result);q.onerror=()=>res(null);}catch(e){res(null);}});}
async function rzPut(st,k,v){const d=await rzDb();if(!d)return;return new Promise(res=>{try{const t=d.transaction(st,'readwrite');t.objectStore(st).put(v,k);t.oncomplete=()=>res();t.onerror=()=>res();t.onabort=()=>res();}catch(e){res();}});}
/* ---- stahování z chess.com (veřejné API, bez klíče) ---- */
async function rzJson(url){let r;try{r=await fetch(url);}catch(e){const er=new Error('net');er.net=true;throw er;}
 if(r.status===404||r.status===410){const er=new Error('404');er.nf=true;throw er;}if(!r.ok){const er=new Error('http');er.net=true;throw er;}
 try{return await r.json();}catch(e){const er=new Error('json');er.net=true;throw er;}}
async function rzLoad(name,opt,onProg){const base='https://api.chess.com/pub/player/'+encodeURIComponent(name);let arch,offline=false;
 try{arch=(await rzJson(base+'/games/archives')).archives||[];rzPut('m',name+'/archives',arch);}
 catch(e){if(e.nf)throw e;arch=await rzGet('m',name+'/archives');if(!arch)throw e;offline=true;}
 let stats=null;if(!offline){try{stats=await rzJson(base+'/stats');rzPut('m',name+'/stats',stats);}catch(e){}}if(!stats)stats=await rzGet('m',name+'/stats');
 const now=new Date(),curKey=now.getUTCFullYear()+'/'+String(now.getUTCMonth()+1).padStart(2,'0');
 const months=arch.map(u=>String(u).match(/(\d{4})\/(\d{2})$/)).filter(Boolean).map(m=>m[1]+'/'+m[2]).sort().reverse();
 const games=[];let cnt=0;
 for(let i=0;i<months.length;i++){if(opt.token!==RZ.token)return null;const mk=months[i],key=name+'/'+mk;onProg(i,months.length,cnt);
  let gs=mk<curKey?await rzGet('m',key):null;/* uzavřený měsíc se už nemění */
  if(!gs){if(offline)gs=await rzGet('m',key+'/cur');else try{gs=(await rzJson(base+'/games/'+mk)).games||[];rzPut('m',mk<curKey?key:key+'/cur',gs);}
   catch(e){if(e.nf)gs=[];else{gs=await rzGet('m',key+'/cur');offline=true;if(!gs)throw e;}}}
  gs=gs||[];games.push(...gs);cnt+=gs.filter(g=>opt.tempo.includes(g.time_class)).length;if(opt.limit&&cnt>=opt.limit)break;}
 return{games,stats,offline};}
/* ---- zpracování jedné partie: tahy, pozice, materiál, hodiny, rychlý odhad chyb ---- */
function rzResolve(b,san,c){const s=san.replace(/[+#!?]/g,'');
 if(/^[NBRQK][a-h1-8x]*[a-h][1-8]$/.test(s)){const t=s[0],to=sqOf(s.slice(-2)),dis=s.slice(1,-2).replace('x','');const cand=[];
  for(let i=0;i<64;i++)if(b[i]===c+t&&attacks(b,i,to,t)){if(dis&&!dis.split('').every(ch=>/[a-h]/.test(ch)?FILES[i&7]===ch:String((i>>3)+1)===ch))continue;cand.push(i);}
  if(!cand.length)throw Error('Neplatný tah '+san);let ok=cand;if(cand.length>1)ok=cand.filter(i=>!rzInCheck(apply(b,{from:i,to}),c));return{from:ok.length?ok[0]:cand[0],to};}
 return resolve(b,san,c);}
function rzInCheck(b,c){const k=b.indexOf(c+'K');return k>=0&&attackers(b,k,c==='w'?'b':'w').length>0;}
function rzFen(b,stm,cr,ep){let o='';for(let r=7;r>=0;r--){let e=0;for(let f=0;f<8;f++){const p=b[r*8+f];if(!p){e++;continue;}if(e){o+=e;e=0;}o+=p[0]==='w'?p[1]:p[1].toLowerCase();}if(e)o+=e;if(r)o+='/';}return o+' '+stm+' '+(cr||'-')+' '+ep;}
function rzCR(cr,a,b){[[4,'KQ'],[0,'Q'],[7,'K'],[60,'kq'],[56,'q'],[63,'k']].forEach(([sq,r])=>{if(a===sq||b===sq)for(const ch of r)cr=cr.replace(ch,'');});return cr;}
function rzMat(b,col){let s=0;for(const p of b)if(p&&p[1]!=='K')s+=(p[0]===col?1:-1)*VAL[p[1]];return s;}
function rzNpm(b){let s=0;for(const p of b)if(p&&p[1]!=='K'&&p[1]!=='P')s+=VAL[p[1]];return s;}
function rzFamily(slug){if(!slug)return null;const t=slug.split('-');let k=t.findIndex(w=>/^(Defense|Opening|Game|Gambit|Attack|System|Countergambit)$/.test(w));if(k<0)k=Math.min(1,t.length-1);
 const key=t.slice(0,k+1).join('-');return RZ_FAM[key]||key.replace(/-/g,' ').replace(/\bKings\b/,"King's").replace(/\bQueens\b/,"Queen's");}
function rzParse(g,me){if(g.rules&&g.rules!=='chess')return null;const wn=(g.white&&g.white.username||'').toLowerCase(),bn=(g.black&&g.black.username||'').toLowerCase();
 const w=wn===me;if(!w&&bn!==me)return null;const my=w?g.white:g.black,op=w?g.black:g.white,col=w?'w':'b';
 const res=my.result==='win'?'W':RZ_DRAW.has(my.result)?'D':'L';const reason=res==='W'?op.result:my.result;
 const pgn=g.pgn||'';const hdr={};pgn.replace(/^\[(\w+) "([^"]*)"\]/gm,(_,k,v)=>{hdr[k]=v;return'';});
 if(hdr.FEN&&!hdr.FEN.startsWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w'))return null;
 const body=pgn.replace(/^\[.*\]\s*$/gm,'');const tok=body.match(/\{[^}]*\}|[^\s{}]+/g)||[];const sans=[],clk=[];
 for(const t of tok){if(t[0]==='{'){const m=t.match(/%clk (\d+):(\d+):(\d+(?:\.\d+)?)/);if(m&&sans.length)clk[sans.length-1]=+m[1]*3600+ +m[2]*60+ +m[3];continue;}
  if(/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)||t[0]==='$')continue;const s=t.replace(/^\d+\.+/,'');if(s&&/^[a-hNBRQKO]/.test(s))sans.push(s);}
 let b=startBoard(),c='w',cr='KQkq',ep='-';const fens=[rzFen(b,'w',cr,'-')],mat=[0],npm=[rzNpm(b)],mv=[];const fk=new Set();let castle=0,qE=0,myN=0;const mc=w0=>w0===(g.white&&g.white.username||'').toLowerCase();
 for(let i=0;i<sans.length;i++){let m;try{m=rzResolve(b,sans[i],c);}catch(e){sans.length=i;break;}const p=b[m.from];if(!p||p[0]!==c){sans.length=i;break;}
  const cap=m.ep!=null?b[m.ep]:b[m.to];b=apply(b,m);cr=rzCR(cr,m.from,m.to);ep=(p[1]==='P'&&Math.abs(m.to-m.from)===16)?sqName((m.from+m.to)/2):'-';c=c==='w'?'b':'w';
  fens.push(rzFen(b,c,cr,ep));mat.push(rzMat(b,col));npm.push(rzNpm(b));mv.push({f:m.from,t:m.to,p:p[1],x:cap&&cap[0]!==p[0]?cap[1]:null});
  if(p[0]===col){myN++;if(p[1]==='K'&&Math.abs(m.to-m.from)===2&&!castle)castle=myN;if(p[1]==='Q'&&myN<=5)qE=1;}
  else if(p[1]!=='K'){let tg=0;for(let q=0;q<64;q++){const t2=b[q];if(t2&&t2[0]===col&&(t2[1]==='K'||VAL[t2[1]]>VAL[p[1]])&&hits(b,m.to,q))tg++;}if(tg>=2)fk.add(i+1);}}
 const N=sans.length,mine=k=>(col==='w')===(k%2===1);/* půltah k (od 1): lichý = bílý */
 const phase=k=>Math.ceil(k/2)<=RZ_CFG.openMoves?'op':npm[k-1]<=RZ_CFG.egPts?'eg':'mg';
 const M=k=>mat[Math.min(k,N)];const bl=[];
 for(let k=1;k<=N;k++){if(!mine(k))continue;let kind=null,drop=mat[k-1]-Math.max(M(k+2),M(k+4));
  if(drop>=RZ_CFG.bigLoss)kind='mat';else if(res==='L'&&reason==='checkmated'&&k===N-1)kind='mate';if(!kind)continue;
  if(bl.length&&k-bl[bl.length-1].k<RZ_CFG.mergePlies)continue;/* blízké chyby = jedna */
  let lost=null;for(let j=k+1;j<=Math.min(N,k+4);j+=2){const x=mv[j-1].x;if(x&&(!lost||VAL[x]>VAL[lost]))lost=x;}
  let self=false;for(let j=k+1;j<=Math.min(N,k+3);j+=2){if(mv[j-1].x&&mv[j-1].t===mv[k-1].t){self=true;break;}}
  const fork=[k+1,k+3].some(j=>fk.has(j));
  bl.push({k,kind,drop:kind==='mate'?99:drop,p:mv[k-1].p,lost,ph:phase(k),clk:clk[k-1],self,fork,greedy:!!mv[k-1].x});}
 let bk=false;if(res==='L'&&reason==='checkmated'&&N){const kq=b.indexOf(col+'K'),lm=mv[N-1],rank=col==='w'?0:7;if(kq>=0&&(kq>>3)===rank&&(lm.p==='R'||lm.p==='Q')&&(lm.t>>3)===rank)bk=true;}
 let run=0,wonLost=false;if(res==='L')for(let k=0;k<=N;k++){run=mat[k]>=RZ_CFG.wonAdv?run+1:0;if(run>=RZ_CFG.wonPlies){wonLost=true;break;}}
 const slug=(hdr.ECOUrl||'').split('/openings/')[1]||'';const oname=(op.username||'?');
 const acc=g.accuracies?g.accuracies[w?'white':'black']:null;
 return{url:g.url||(g.uuid?'uuid:'+g.uuid:'x:'+g.end_time+oname),end:g.end_time||0,tc:g.time_class,rated:!!g.rated,col,res,reason,opp:oname,oppR:op.rating,myR:my.rating,
  bot:RZ_BOTS.includes(oname.toLowerCase())||(/^coach-/i.test(oname)&&(op.rating===1200||g.time_class==='daily'))||/-bot$/i.test(oname),
  acc:acc==null?null:+acc,sans,fens,mat,clk,mv,npm,bl,N,wonLost,fk:[...fk],castle,qE,bk,eg:npm.some(v=>v<=RZ_CFG.egPts),eco:slug.replace(/-/g,' '),fam:rzFamily(slug),me:my.username};}
/* ---- filtry: rzFL = seznam partií podle filtrů, rzF = z nich ty, které hráč vybral k rozboru ---- */
function rzF(){if(!RZ.pick)return[];return rzFL().filter(x=>RZ.pick.has(x.url));}
function rzFL(){const f=RZ.f,now=Date.now()/1000;if(!RZ.all)return[];
 return RZ.all.filter(x=>(f.color==='all'||x.col===f.color)&&(!f.rated||x.rated)&&(f.bots||!x.bot)&&(!f.period||x.end>=now-f.period*86400));}
/* ---- strom zahájení ---- */
function rzTree(G,col){const root={kids:new Map(),n:0,w:0,d:0,l:0,path:[],gi:[]};
 G.forEach(x=>{if(x.col!==col)return;let nd=root;const add=n=>{n.n++;n[x.res==='W'?'w':x.res==='D'?'d':'l']++;n.gi.push(x);};add(root);
  for(let i=0;i<Math.min(RZ_CFG.treeDepth,x.N);i++){const s=x.sans[i];let k=nd.kids.get(s);if(!k)nd.kids.set(s,k={san:s,ply:i,path:x.sans.slice(0,i+1),kids:new Map(),n:0,w:0,d:0,l:0,gi:[]});nd=k;add(nd);}});return root;}
function rzNodes(root){const o=[];const walk=n=>{n.kids.forEach(k=>{o.push(k);walk(k);});};walk(root);return o;}
const rzTag=n=>n.n>=RZ_CFG.weakN?(rzPct(n.w,n.d,n.n)<RZ_CFG.weakPct?'weak':rzPct(n.w,n.d,n.n)>RZ_CFG.strongPct?'strong':''):'';
const rzBar=(w,d,l)=>{const n=w+d+l||1;return `<span class="rzBar" aria-hidden="true"><i class="w" style="width:${w/n*100}%"></i><i class="d" style="width:${d/n*100}%"></i><i class="l" style="width:${l/n*100}%"></i></span>`;};
function rzWeak(trees){const all=[];['w','b'].forEach(c=>rzNodes(trees[c]).forEach(n=>{if(n.n>=RZ_CFG.weakN&&rzPct(n.w,n.d,n.n)<RZ_CFG.weakPct)all.push({c,n});}));
 all.sort((a,b)=>rzPct(a.n.w,a.n.d,a.n.n)-rzPct(b.n.w,b.n.d,b.n.n)||b.n.n-a.n.n||a.n.ply-b.n.ply);const pick=[];
 for(const a of all){const rel=pick.some(p=>p.c===a.c&&(p.n.path.join(' ').startsWith(a.n.path.join(' '))||a.n.path.join(' ').startsWith(p.n.path.join(' '))));if(!rel)pick.push(a);if(pick.length>=3)break;}return pick;}
function rzNodeTxt(c,n){const oppMove=(n.ply%2===0)===(c==='b');return `${c==='w'?'Za bílé':'Za černé'} ${oppMove?'proti ':'po '}${rzPath(n.path,n.path.length)}`;}
/* ---- napojení na kurzy: pozice → varianty kurzů ---- */
let RZI=null;
function rzIdx(){if(RZI)return RZI;if(!CHESS)return null;RZI=new Map();exIndex().forEach(x=>x.fens.forEach((f,k)=>{const key=f.split(' ').slice(0,3).join(' ');let a=RZI.get(key);if(!a)RZI.set(key,a=[]);a.push({x,k});}));return RZI;}
function rzRep(x){const I=rzIdx();if(!I)return null;let deep=0,ent=null;
 for(let k=0;k<x.N;k++){const key=x.fens[k].split(' ').slice(0,3).join(' ');const ents=(I.get(key)||[]).filter(e=>e.x.c.side===x.col);if(!ents.length)return{deep,ent,out:'left',k};
  deep=k;ent=ents[0];const myTurn=(x.col==='w')===(k%2===0);if(!myTurn)continue;
  const nxt=ents.filter(e=>e.k<e.x.sans.length);if(!nxt.length)return{deep,ent,out:'end',k};
  const my=sanK(x.sans[k]);if(nxt.some(e=>e.x.sans[e.k]===my))continue;
  const want=[...new Set(nxt.map(e=>e.x.sans[e.k]))];return{deep,ent:nxt[0],out:'dev',k,my:x.sans[k],want};}
 return{deep,ent,out:'end',k:x.N};}
/* ---- výsledky enginu ---- */
function rzEngMarks(x){const d=RZ.eng.res[x.url];if(!d||!d.ev)return null;const ev=d.ev,s=x.col==='w'?1:-1,out=[];
 for(let k=1;k<=x.N;k++){if((x.col==='w')!==(k%2===1)||Math.ceil(k/2)<=RZ_CFG.engSkipMoves)continue;const b=ev[k-1],a=ev[k];if(b==null||a==null)continue;
  const bm=s*b,am=s*a;if(Math.abs(bm)>RZ_CFG.engCap)continue;const drop=rzWp(bm)-rzWp(am);let cls=drop>=30?'b':drop>=20?'m':drop>=10?'i':null;
  let miss=false;const pb=ev[k-2];if(pb!=null&&Math.abs(s*pb)<=RZ_CFG.engCap&&rzWp(bm)-rzWp(s*pb)>=30&&drop>=20)miss=true;
  if(cls||miss)out.push({k,cls:cls||'m',miss,drop:Math.round(drop),best:d.best[k-1]||null,p:x.mv[k-1].p,ph:Math.ceil(k/2)<=RZ_CFG.openMoves?'op':x.npm[k-1]<=RZ_CFG.egPts?'eg':'mg',clk:x.clk[k-1]});}
 return out;}
async function rzEngCache(G){await Promise.all(G.map(async x=>{if(RZ.eng.res[x.url])return;const c=await rzGet('e',x.url);if(c)RZ.eng.res[x.url]=c;}));}
async function rzEngRun(n){const G=rzF().slice(0,n);const my=++RZ.eng.run;RZ.eng.busy=true;rzRenderD();
 try{for(let gi=0;gi<G.length;gi++){const x=G[gi];if(RZ.eng.res[x.url])continue;const c=await rzGet('e',x.url);if(c){RZ.eng.res[x.url]=c;continue;}
   const ev=[],best=[],from=Math.max(0,RZ_CFG.engSkipMoves*2-1);let retry=0;
   for(let k=from;k<=x.N;k++){if(my!==RZ.eng.run||page!=='rozbor')return;rzEngProg(gi,G.length,k,x.N);
    let r=null;try{r=await sfAnalyse(x.fens[k]+' 0 '+(Math.floor(k/2)+1),{depth:RZ_CFG.engDepth,movetime:RZ_CFG.engMs});}catch(e){RZ.eng.fail=true;return;}
    if(!r){if(my!==RZ.eng.run||page!=='rozbor'||++retry>3)return;k--;continue;}retry=0;const l=r.lines[0];
    if(l){ev[k]=Math.max(-3000,Math.min(3000,l.cp));best[k]=l.pv[0]||null;}
    else if(k===x.N&&x.reason==='checkmated')ev[k]=(x.res==='W')===(x.col==='w')?3000:-3000;}
   const d={v:1,ev,best};RZ.eng.res[x.url]=d;await rzPut('e',x.url,d);}}
 finally{if(my===RZ.eng.run){RZ.eng.busy=false;RZ.eng.prog='';if(page==='rozbor'){rzRenderD();rzRenderF();if(RZ.view)rzVSet();}}}}
function rzEngProg(gi,n,k,N){RZ.eng.prog=`Partie ${gi+1} z ${n}, tah ${Math.ceil(Math.max(k,1)/2)} z ${Math.ceil(N/2)}`;const el=document.getElementById('rzEngP');if(el){el.querySelector('span').textContent=RZ.eng.prog;el.querySelector('i').style.width=((gi+k/Math.max(N,1))/n*100)+'%';}}
function rzEngStop(){RZ.eng.run++;RZ.eng.busy=false;RZ.eng.prog='';sfStop();rzRenderD();}
/* ---- stránka ---- */
async function renderRozbor(){document.body.classList.add('homeMode');XB.mode='rz';const nm=RZ.route;const pre=nm||RZ.name||store.ccName||'';
 const seg=(arr,cur,attr)=>arr.map(([v,t])=>`<button type="button" data-${attr}="${v}" aria-pressed="${cur(v)}">${t}</button>`).join('');
 $('home').innerHTML=`<a class="backAll" href="#">← Všechny kurzy</a><div class="rzWrap"><div class="profCard rzHead"><h1>Rozbor hráče</h1><p class="profEmpty">Zadej jméno z chess.com a aplikace najde jeho partie. Pak si vybereš, které rozebrat: ukáže, co proti tobě soupeři hrají nejčastěji, jaký kurz na to pomáhá, jak ti jdou zahájení a kde chybuješ.</p>
 <form class="rzForm" id="rzForm" autocomplete="off"><label class="rzName"><span>Jméno na chess.com</span><input id="rzIn" value="${escH(pre)}" placeholder="např. Hikaru" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" enterkeyhint="go"></label>
 <div class="rzOpt"><span>Tempo</span><div class="chip2" id="rzTempo">${seg(Object.entries(RZ_TC),v=>RZ.tempo.includes(v),'tc')}</div></div>
 <div class="rzOpt"><span>Počet partií</span><div class="chip2" id="rzLim">${seg([[100,'100'],[200,'200'],[500,'500'],[0,'Vše']],v=>RZ.limit===v,'lim')}</div></div>
 <button class="btn primary" id="rzGo">Najít partie</button></form></div><div id="rzOut"></div></div>`;
 renderSide();
 $('rzTempo').onclick=e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.tc;const on=RZ.tempo.includes(v);if(on&&RZ.tempo.length===1)return;RZ.tempo=on?RZ.tempo.filter(t=>t!==v):RZ.tempo.concat(v);b.setAttribute('aria-pressed',!on);};
 $('rzLim').onclick=e=>{const b=e.target.closest('button');if(!b)return;RZ.limit=+b.dataset.lim;$('rzLim').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));};
 $('rzForm').onsubmit=e=>{e.preventDefault();const v=$('rzIn').value.trim().toLowerCase().replace(/^@/,'');if(!/^[a-z0-9_-]{2,40}$/.test(v)){rzMsg('Jméno může mít jen písmena bez háčků, číslice, - a _.');return;}
  RZ.opts='';if(location.hash==='#rozbor/'+v)rzRun(v);else{RZ.force=true;location.hash='#rozbor/'+v;}};
 chessLib().then(()=>{if(page==='rozbor'&&RZ.all&&RZ.pick){rzRenderS();rzRenderF();if(RZ.sel)rzRenderB();}}).catch(()=>{});
 if(nm){const o=nm+'|'+RZ.tempo.join()+'|'+RZ.limit;if(RZ.force||RZ.opts!==o||!RZ.all&&!RZ.loading)rzRun(nm);else rzRenderOut();}else if(!pre)$('rzIn').focus();}
function rzMsg(t,cls){const o=$('rzOut');if(o)o.innerHTML=`<div class="profCard rzMsg ${cls||''}"><p>${t}</p></div>`;}
/* partie: rozparsovat, obnovit uložený výběr (u propojeného účtu rovnou všechny) */
function rzSetGames(name,list,stats,offline,keep){const all=[];for(const g of list){try{const x=rzParse(g,name);if(x)all.push(x);}catch(e){}}
 const prevAll=keep&&RZ.pick&&RZ.all&&RZ.pick.size>=RZ.all.length;RZ.all=all;RZ.stats=stats;RZ.offline=offline;RZ.disp=(all[0]&&all[0].me)||name;
 const urls=new Set(all.map(x=>x.url));let saved=null;try{saved=JSON.parse(localStorage.getItem('trener-rz-pick:'+name)||'null');}catch(e){}
 if(keep&&RZ.pick){const np=new Set([...RZ.pick].filter(u=>urls.has(u)));if(prevAll)all.forEach(x=>np.add(x.url));RZ.pick=np.size?np:null;}
 else if(saved&&saved.all)RZ.pick=new Set(urls);
 else if(saved&&saved.u){const np=new Set(saved.u.filter(u=>urls.has(u)));RZ.pick=np.size?np:null;}
 else RZ.pick=name===store.ccName&&all.length?new Set(urls):null;
 RZ.chk=RZ.pick?new Set(RZ.pick):new Set(urls);}
async function rzRun(name){const tok=++RZ.token;RZ.force=false;RZ.opts=name+'|'+RZ.tempo.join()+'|'+RZ.limit;RZ.name=name;RZ.all=null;RZ.err=null;RZ.view=null;RZ.sel=null;RZ.open=new Set();RZ.showAll=false;RZ.chk=new Set();RZ.pick=null;RZ.lim=25;RZ.trees=null;
 if(RZ.eng.busy)rzEngStop();RZ.eng.res={};RZ.loading=true;
 /* uložený výsledek z minula se ukáže hned, čerstvé partie se dotáhnou na pozadí */
 const sk=name+'/snap/'+RZ.tempo.join()+'/'+RZ.limit;const snap=await rzGet('m',sk);if(tok!==RZ.token)return;
 if(snap&&snap.length){rzSetGames(name,snap,await rzGet('m',name+'/stats'),false,false);await rzEngCache(RZ.all);if(tok!==RZ.token)return;RZ.loading=false;if(page==='rozbor')rzRenderOut();}
 else{const o=$('rzOut');if(o)o.innerHTML=`<div class="profCard"><div class="rzProg" id="rzProg"><span>Hledám partie…</span><div class="bar"><i style="width:3%"></i></div></div></div>`;}
 try{const r=await rzLoad(name,{tempo:RZ.tempo,limit:RZ.limit,token:tok},(i,n,c)=>{const el=document.getElementById('rzProg');if(el&&tok===RZ.token){el.querySelector('span').textContent=`Hledám partie… měsíc ${i+1} z ${n}, zatím ${c} ${c===1?'partie':'partií'}`;el.querySelector('i').style.width=Math.max(3,(i+1)/n*100)+'%';}});
  if(!r||tok!==RZ.token)return;let list=r.games.filter(g=>RZ.tempo.includes(g.time_class)).sort((a,b)=>(b.end_time||0)-(a.end_time||0));if(RZ.limit)list=list.slice(0,RZ.limit);
  const key=a=>a.map(g=>g.url||g.uuid||g.end_time).join('|');const changed=!snap||key(snap)!==key(list);
  if(!r.offline)rzPut('m',sk,list);
  if(changed){rzSetGames(name,list,r.stats,r.offline,!!snap);await rzEngCache(RZ.all);if(tok!==RZ.token)return;RZ.loading=false;if(page==='rozbor'){if(snap&&RZ.pick){rzRenderL();rzRenderAn();}else rzRenderOut();}return;}}
 catch(e){if(!snap)RZ.err=e&&e.nf?'nf':'net';}
 finally{if(tok===RZ.token)RZ.loading=false;}
 if(tok===RZ.token&&page==='rozbor'&&!snap)rzRenderOut();}
function rzRenderOut(){const o=$('rzOut');if(!o)return;
 if(RZ.err==='nf'){rzMsg(`<b>Hráč nenalezen.</b> Na chess.com žádný hráč <b>${escH(RZ.name)}</b> není. Zkontroluj jméno a zkus to znovu.`,'bad');return;}
 if(RZ.err){rzMsg('<b>Nepodařilo se spojit s chess.com.</b> Zkontroluj připojení k internetu a klikni znovu na Rozebrat.','bad');return;}
 if(!RZ.all)return;
 if(!RZ.all.length){rzMsg(`<b>Žádné partie.</b> Hráč ${escH(RZ.name)} nemá v tempu ${RZ.tempo.map(t=>RZ_TC[t]).join(', ')} žádné partie. Zkus zapnout jiné tempo.`);return;}
 const f=RZ.f;const seg=(arr,cur,attr)=>arr.map(([v,t])=>`<button type="button" data-${attr}="${v}" aria-pressed="${cur===v}">${t}</button>`).join('');
 const nBots=RZ.all.filter(x=>x.bot).length;
 o.innerHTML=`<div class="rzFilt"><div class="chip2" id="rzCol">${seg([['all','Obě barvy'],['w','Bílé'],['b','Černé']],f.color,'col')}</div>
 <div class="chip2" id="rzPer">${seg([[0,'Vše'],[30,'30 dní'],[90,'90 dní'],[365,'Rok']],f.period,'per')}</div>
 <label class="rzChk"><input type="checkbox" id="rzRated" ${f.rated?'checked':''}> jen hodnocené</label>${nBots?`<label class="rzChk"><input type="checkbox" id="rzBots" ${f.bots?'checked':''}> i proti botům (${nBots})</label>`:''}
 <span class="rzShare"><a href="#rozbor/${encodeURIComponent(RZ.name)}" id="rzLink">Odkaz na rozbor</a></span></div>
 ${RZ.offline?'<p class="profEmpty rzOff">Bez připojení – ukazuju partie uložené v zařízení.</p>':''}
 <div id="rzV" class="rzV" hidden></div><div id="rzL"></div><div id="rzAn"></div>`;
 const re=()=>{RZ.sel=null;RZ.view=null;rzRenderAll();};
 $('rzCol').onclick=e=>{const b=e.target.closest('button');if(!b)return;f.color=b.dataset.col;$('rzCol').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));re();};
 $('rzPer').onclick=e=>{const b=e.target.closest('button');if(!b)return;f.period=+b.dataset.per;$('rzPer').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));re();};
 $('rzRated').onchange=e=>{f.rated=e.target.checked;re();};if(nBots)$('rzBots').onchange=e=>{f.bots=e.target.checked;re();};
 $('rzLink').onclick=e=>{e.preventDefault();const u=location.origin+location.pathname+'#rozbor/'+encodeURIComponent(RZ.name);try{if(navigator.share&&IS_MOBILE){navigator.share({title:'Rozbor hráče '+RZ.disp,url:u}).catch(()=>{});return;}navigator.clipboard.writeText(u).then(()=>{e.target.textContent='Odkaz zkopírován';setTimeout(()=>{if(e.target)e.target.textContent='Odkaz na rozbor';},1800);});}catch(err){}};
 o.onclick=rzClick;rzRenderAll();}
function rzRenderAll(){rzRenderL();rzRenderAn();rzRenderV();}
function rzSaveSum(){if(!RZ.pick||!store.ccName||RZ.name!==store.ccName)return;const G=rzF();if(!G.length)return;const W=G.filter(x=>x.res==='W').length,D=G.filter(x=>x.res==='D').length;
 const cnt=c=>{const m={};G.filter(x=>x.col===c&&x.N>=(c==='w'?2:1)).forEach(x=>{const k=c==='w'?x.sans[0]+' '+x.sans[1]:x.sans[0];m[k]=(m[k]||0)+1;});return Object.entries(m).sort((a,b)=>b[1]-a[1])[0];};
 const tb=cnt('b'),tw=cnt('w');const wk=rzWeak({w:rzTree(G,'w'),b:rzTree(G,'b')})[0];
 const sum={d:new Date().toISOString().slice(0,10),n:G.length,p:rzPct(W,D,G.length),b:tb?[tb[0].split(' ').map((m,i)=>rzMvLab(m,i)).join(' '),tb[1]]:null,w:tw?[tw[0].split(' ').map((m,i)=>rzMvLab(m,i)).join(' '),tw[1]]:null,wk:wk?`${rzNodeTxt(wk.c,wk.n)}: ${wk.n.w} výh. z ${wk.n.n}`:null};
 const o=store.ccSum||{};if(o.n!==sum.n||o.p!==sum.p||o.wk!==sum.wk||o.d!==sum.d){store.ccSum=sum;save();}}
function rzRenderAn(){const el=$('rzAn');if(!el)return;if(!RZ.pick){el.innerHTML='';return;}try{rzSaveSum();}catch(e){}
 el.innerHTML='<div id="rzA"></div><div id="rzGap"></div><div id="rzP"></div><div id="rzF"></div><div id="rzS"></div><div id="rzB"></div><div id="rzD"></div><div id="rzE"></div>';rzRenderA();try{rzRenderGap();}catch(e){console.warn(e);}try{rzRenderP();}catch(e){console.warn(e);}rzRenderS();rzRenderF();rzRenderB();rzRenderD();rzRenderE();}
/* 0) seznam partií a výběr, co rozebrat */
function rzRenderL(){const el=$('rzL');if(!el)return;const L=rzFL();
 if(!L.length){el.innerHTML='<div class="profCard"><p class="profEmpty">Filtrům neodpovídá žádná partie.</p></div>';return;}
 const fams={};L.forEach(x=>{if(x.fam)fams[x.fam]=(fams[x.fam]||0)+1;});
 const famOpts=Object.entries(fams).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<option value="${escH(k)}">${escH(k)} (${n})</option>`).join('');
 const rows=L.slice(0,RZ.lim).map(x=>`<tr data-game="${escH(x.url)}"><td class="ck"><input type="checkbox" data-chk="${escH(x.url)}"${RZ.chk.has(x.url)?' checked':''} aria-label="Vybrat partii proti ${escH(x.opp)}"></td><td>${rzDate(x.end)}</td><td>${RZ_TC[x.tc]||escH(x.tc)}</td><td>${x.col==='w'?'bílé':'černé'}</td><td class="op">${escH(x.opp)} <small>${x.oppR||''}</small></td><td>${rzRes(x)}</td><td class="fam">${escH(x.fam||'–')}</td><td>${Math.ceil(x.N/2)}</td></tr>`).join('');
 el.innerHTML=`<div class="profCard rzList"><h2>Partie <small class="exCnt" id="rzLCnt"></small></h2>
 <p class="profEmpty">Zaškrtni partie, které chceš rozebrat, a klikni na Rozebrat vybrané. Klepnutím na řádek otevřeš partii na šachovnici.</p>
 <div class="rzPickBar"><div class="chip2 rzPk">${[['all','Všechny'],['L','Jen prohry'],['W','Jen výhry'],['last20','Posledních 20'],['none','Žádné']].map(([v,t])=>`<button type="button" data-pk="${v}">${t}</button>`).join('')}</div>${famOpts?`<label class="rzPkFam"><span>Podle zahájení</span><select id="rzPkFam"><option value="">Vyber zahájení</option>${famOpts}</select></label>`:''}</div>
 <div class="rzScroll"><table class="rzTbl rzGames rzPickT"><thead><tr><th class="ck"></th><th>Datum</th><th>Tempo</th><th>Barva</th><th>Soupeř</th><th></th><th>Zahájení</th><th>Tahů</th></tr></thead><tbody>${rows}</tbody></table></div>
 ${L.length>RZ.lim?`<button class="lnk" id="rzLMore">Zobrazit dalších ${Math.min(25,L.length-RZ.lim)} (celkem ${L.length})</button>`:''}
 <div class="rzPickGo"><button class="btn primary" id="rzPickGo">Rozebrat vybrané</button><span class="profEmpty" id="rzPickNote"></span></div></div>`;
 const fs=document.getElementById('rzPkFam');if(fs)fs.onchange=()=>{if(!fs.value)return;RZ.chk=new Set(rzFL().filter(x=>x.fam===fs.value).map(x=>x.url));rzPickUpd();};
 rzPickUpd();}
function rzPickUpd(){const L=rzFL(),n=L.filter(x=>RZ.chk.has(x.url)).length;const c=document.getElementById('rzLCnt');if(c)c.textContent=`${L.length} · vybráno ${n}`;
 const b=document.getElementById('rzPickGo');if(b){b.textContent=`Rozebrat vybrané (${n})`;b.disabled=!n;}
 const ch=RZ.pick&&L.some(x=>RZ.chk.has(x.url)!==RZ.pick.has(x.url));
 const nt=document.getElementById('rzPickNote');if(nt)nt.textContent=!n?'Vyber aspoň jednu partii.':ch?'Výběr se změnil. Rozbor níž je pro předchozí výběr.':RZ.pick?'Rozbor níž je pro tenhle výběr.':'';
 document.querySelectorAll('#rzL [data-chk]').forEach(i=>{i.checked=RZ.chk.has(i.dataset.chk);});}
function rzApply(){const L=rzFL();const P=new Set(L.filter(x=>RZ.chk.has(x.url)).map(x=>x.url));if(!P.size)return;
 if(RZ.eng.busy)rzEngStop();RZ.pick=P;try{localStorage.setItem('trener-rz-pick:'+RZ.name,JSON.stringify(P.size===RZ.all.length?{all:1}:{u:[...P]}));}catch(e){}RZ.sel=null;RZ.view=null;RZ.trees=null;RZ.open=new Set();RZ.showAll=false;rzRenderV();rzRenderAn();rzPickUpd();
 const a=document.getElementById('rzAn');if(a)a.scrollIntoView({block:'start',behavior:'smooth'});}
/* a2) co proti tobě soupeři hrají nejčastěji a který kurz na to pomáhá */
const RZ_REC={/* když pozice není přímo v žádném kurzu: doporučení podle prvního tahu soupeře */
 b:{e4:['caro','najdorf'],d4:['slav','kid'],c4:['kid','slav'],Nf3:['kid','slav'],'*':['kid','caro']},
 w:{e5:['vienna','italian'],c6:['alien','cow'],'*':['cow']}};
function rzCrs(col,G,ply){const out=[];let exact=false;const I=rzIdx();
 if(I&&G[0]&&G[0].fens[ply]){const key=G[0].fens[ply].split(' ').slice(0,3).join(' ');(I.get(key)||[]).forEach(e=>{if(e.x.c.side===col&&!out.includes(e.x.c))out.push(e.x.c);});exact=out.length>0;}
 if(!out.length&&G[0]){const om=col==='b'?G[0].sans[0]:G[0].sans[1];const R=RZ_REC[col];(R[om]||R['*']).forEach(id=>{const c=COURSES.find(q=>q.id===id);if(c&&c.side===col&&!out.includes(c))out.push(c);});}
 return{list:out.slice(0,2),exact};}
const rzInRep=x=>{const r=rzRep(x);return !!(r&&r.deep>=6);};/* hrál podle kurzu aspoň 3 tahy */
function rzRenderS(){const G=rzF(),el=$('rzS');if(!el)return;if(!G.length){el.innerHTML='';return;}const I=rzIdx();
 const sc=g=>rzPct(g.filter(x=>x.res==='W').length,g.filter(x=>x.res==='D').length,g.length);
 const grp=c=>{const m=new Map();G.filter(x=>x.col===c&&x.N>=(c==='w'?2:1)).forEach(x=>{const k=c==='w'?x.sans[0]+' '+x.sans[1]:x.sans[0];let a=m.get(k);if(!a)m.set(k,a={k,G:[],w:0,d:0,l:0});a.G.push(x);a[x.res==='W'?'w':x.res==='D'?'d':'l']++;});return [...m.values()].sort((a,b)=>b.G.length-a.G.length);};
 const side=(c,t)=>{const all=grp(c);const tot=all.reduce((s,a)=>s+a.G.length,0);if(!tot)return '';
  const rows=all.slice(0,5).map(a=>{const n=a.G.length,cr=rzCrs(c,a.G,c==='w'?2:1);const mv=a.k.split(' ').map((s,i)=>rzMvLab(s,i)).join(' ');
   let eff='';if(I){const yes=a.G.filter(rzInRep),no=a.G.filter(x=>!rzInRep(x));if(yes.length&&no.length)eff=`<small>Podle kurzu ${sc(yes)} % (${yes.length}×), mimo kurz ${sc(no)} % (${no.length}×)</small>`;else if(yes.length)eff='<small>Pokaždé jsi hrál podle kurzu.</small>';}
   return `<li class="rzOp"><div class="rzOpTop"><b>${mv}</b><span class="nn">${n}× · ${Math.round(n/tot*100)} %</span><span class="rzP">${rzPct(a.w,a.d,n)} %</span>${rzBar(a.w,a.d,a.l)}</div><div class="rzOpCrs"><span>${cr.list.length?`${cr.exact?'Je v kurzu':'Pomůže kurz'} ${cr.list.map(q=>`<a href="#${q.id}">${escH(q.title)}</a>`).join(' nebo ')}`:'Zatím na to není kurz.'}</span>${eff}</div></li>`;}).join('');
  return `<div><h3 class="rzH3">${t} <small class="exCnt">${tot} partií</small></h3><ul class="rzOps">${rows}</ul></div>`;};
 let top='';if(I){const yes=G.filter(rzInRep),no=G.filter(x=>!rzInRep(x));top=`<div class="tiles rzTiles"><div><b>${yes.length?sc(yes)+' %':'–'}</b><span>výher, když hraješ podle kurzu (${yes.length} partií)</span></div><div><b>${no.length?sc(no)+' %':'–'}</b><span>výher mimo kurzy (${no.length} partií)</span></div></div>`;}
 el.innerHTML=`<div class="profCard"><h2>Co proti tobě hrají nejčastěji</h2><p class="profEmpty">Za bílé je to odpověď soupeře na tvůj první tah, za černé první tah soupeře. U každého je kurz, který ti na to pomůže. „Podle kurzu“ = aspoň 3 tvoje tahy podle varianty z kurzu.</p>${top}<div class="rzTwoS">${side('w','Za bílé')}${side('b','Za černé')}</div></div>`;}
const rzRes=x=>`<span class="rzR ${x.res}" title="${x.res==='W'?'výhra':x.res==='L'?'prohra':'remíza'}">${x.res==='W'?'V':x.res==='L'?'P':'R'}</span>`;
/* a) přehled */
function rzRenderA(){const G=rzF(),el=$('rzA');if(!el)return;if(!G.length){el.innerHTML='<div class="profCard"><p class="profEmpty">Filtrům neodpovídá žádná partie.</p></div>';return;}
 const cnt=a=>({n:a.length,w:a.filter(x=>x.res==='W').length,d:a.filter(x=>x.res==='D').length,l:a.filter(x=>x.res==='L').length});
 const row=(t,a)=>{const c=cnt(a);return c.n?`<tr><th>${t}</th><td>${c.n}</td><td>${c.w}</td><td>${c.d}</td><td>${c.l}</td><td><b>${rzPct(c.w,c.d,c.n)} %</b></td><td class="rzBarC">${rzBar(c.w,c.d,c.l)}</td></tr>`:'';};
 const T=cnt(G);const st=RZ.stats||{};const rat=Object.keys(RZ_TC).map(t=>{const s=st['chess_'+t];return s&&s.last?`<div><b>${s.last.rating}</b><span>${RZ_TC[t]}${s.best?` · nejlépe ${s.best.rating}`:''}</span></div>`:'';}).join('');
 const last=G.slice(0,20).reverse();
 el.innerHTML=`<div class="profCard"><h2>Přehled – ${escH(RZ.disp)}</h2><div class="tiles rzTiles"><div><b>${T.n}</b><span>partií</span></div><div><b>${T.w} / ${T.l} / ${T.d}</b><span>výhry / prohry / remízy</span></div><div><b>${rzPct(T.w,T.d,T.n)} %</b><span>výher (winrate)</span></div>${rat}</div>
 <div class="rzScroll"><table class="rzTbl"><thead><tr><th></th><th>Partie</th><th>V</th><th>R</th><th>P</th><th>Výhry</th><th></th></tr></thead><tbody>${row('Za bílé',G.filter(x=>x.col==='w'))}${row('Za černé',G.filter(x=>x.col==='b'))}${Object.keys(RZ_TC).map(t=>row(RZ_TC[t],G.filter(x=>x.tc===t))).join('')}</tbody></table></div>
 <h3 class="rzH3">Posledních ${last.length} partií</h3><div class="rzLast">${last.map(x=>`<button class="rzSq ${x.res}" data-game="${escH(x.url)}" title="${rzDate(x.end)} · ${escH(x.opp)} · ${RZ_WHY[x.reason]||x.reason}">${x.res==='W'?'V':x.res==='L'?'P':'R'}</button>`).join('')}</div><div class="rzLastLbl"><span>starší</span><span>nejnovější</span></div></div>`;}
/* b) + c) strom zahájení a detail */
function rzRenderB(){const G=rzF(),el=$('rzB');if(!el)return;if(!G.length){el.innerHTML='';return;}
 const trees={w:rzTree(G,'w'),b:rzTree(G,'b')};RZ.trees=trees;const weak=rzWeak(trees);
 const node=(n,c,dep)=>{const key=c+':'+n.path.join(' ');const open=RZ.open.has(key);const p=rzPct(n.w,n.d,n.n);const tg=rzTag(n);const sel=RZ.sel&&RZ.sel.type==='node'&&RZ.sel.key===key;
  const kids=[...n.kids.values()].sort((a,b)=>b.n-a.n);const has=kids.length&&dep<RZ_CFG.treeDepth;
  return `<li><button class="rzNode${sel?' sel':''}${(n.ply%2===0)===(c==='b')?' opp':''}" data-node="${escH(key)}" aria-expanded="${has?open:'false'}"><span class="tw">${has?(open?'−':'+'):''}</span><span class="mv">${rzMvLab(n.san,n.ply)}</span><span class="nn">${n.n}×</span><span class="rzP">${p} %</span>${rzBar(n.w,n.d,n.l)}${tg?`<span class="rzTag ${tg}">${tg==='weak'?'slabé':'silné'}</span>`:'<span></span>'}</button>${has&&open?`<ul>${kids.map(k=>node(k,c,dep+1)).join('')}</ul>`:''}</li>`;};
 const fams=c=>{const m={};G.filter(x=>x.col===c&&x.fam).forEach(x=>{const a=m[x.fam]=m[x.fam]||{n:0,w:0,d:0,l:0};a.n++;a[x.res==='W'?'w':x.res==='D'?'d':'l']++;});
  return Object.entries(m).sort((a,b)=>b[1].n-a[1].n).slice(0,12).map(([k,a])=>{const sel=RZ.sel&&RZ.sel.type==='fam'&&RZ.sel.side===c&&RZ.sel.fam===k;return `<button class="rzFam${sel?' sel':''}" data-fam="${c}|${escH(k)}"><span>${escH(k)}</span><span class="nn">${a.n}×</span><span class="rzP">${rzPct(a.w,a.d,a.n)} %</span>${rzBar(a.w,a.d,a.l)}</button>`;}).join('');};
 const side=(c,t)=>{const r=trees[c];if(!r.n)return '';const kids=[...r.kids.values()].sort((a,b)=>b.n-a.n);
  return `<div class="profCard rzSide"><h2>${t} <small class="exCnt">${r.n} partií · ${rzPct(r.w,r.d,r.n)} %</small></h2><ul class="rzTree">${kids.map(k=>node(k,c,1)).join('')}</ul><h3 class="rzH3">Zahájení podle chess.com</h3><div class="rzFams">${fams(c)||'<p class="profEmpty">Bez názvu zahájení.</p>'}</div></div>`;};
 el.innerHTML=`<div class="profCard"><h2>Co se proti tobě hraje</h2><p class="profEmpty">Klepni na tah – rozbalí se další tahy a pod stromem uvidíš partie, které tak šly. Štítek <span class="rzTag weak">slabé</span> = aspoň ${RZ_CFG.weakN} partií a méně než ${RZ_CFG.weakPct} % výher.</p>
 ${weak.length?`<div class="rzCards">${weak.map(a=>`<button class="rzCard" data-node="${escH(a.c+':'+a.n.path.join(' '))}"><b>${rzNodeTxt(a.c,a.n)}</b><span>${a.n.w} ${a.n.w===1?'výhra':a.n.w>=2&&a.n.w<=4?'výhry':'výher'} z ${a.n.n} · ${rzPct(a.n.w,a.n.d,a.n.n)} % výher</span></button>`).join('')}</div>`:'<p class="profEmpty rzOk">Žádné výrazně slabé místo – nikde nemáš aspoň 5 partií s méně než 40 % výher.</p>'}</div>
 <div class="rzTwo">${side('w','Za bílé')}${side('b','Za černé')}</div><div id="rzC"></div>`;
 rzRenderC();}
function rzSelGames(){const s=RZ.sel;if(!s)return null;const G=rzF();
 if(s.type==='fam')return{title:`${s.side==='w'?'Za bílé':'Za černé'}: ${s.fam}`,G:G.filter(x=>x.col===s.side&&x.fam===s.fam),side:s.side,n:0};
 const [c,p]=[s.key[0],s.key.slice(2)];const path=p?p.split(' '):[];return{title:rzNodeTxt(c,{path,ply:path.length-1}),G:G.filter(x=>x.col===c&&path.every((m,i)=>x.sans[i]===m)),side:c,n:path.length};}
function rzRenderC(){const el=$('rzC');if(!el)return;const S=rzSelGames();if(!S||!S.G.length){el.innerHTML='';return;}const G=S.G;
 /* kde se partie rozcházejí: stejná pozice, různé moje tahy */
 const pos=new Map();G.forEach(x=>{for(let k=0;k<Math.min(x.N,30);k++){if((x.col==='w')!==(k%2===0))continue;const key=x.fens[k].split(' ').slice(0,3).join(' ');let a=pos.get(key);if(!a)pos.set(key,a={k,x,mv:new Map(),n:0});
  const s=x.sans[k];let m=a.mv.get(s);if(!m)a.mv.set(s,m={n:0,p:0,k});m.n++;m.p+=x.res==='W'?1:x.res==='D'?.5:0;a.n++;}});
 const div=[...pos.values()].filter(a=>a.mv.size>1&&a.n>=2).sort((a,b)=>a.k-b.k||b.n-a.n).slice(0,5);
 const divTxt=div.map(a=>{const ms=[...a.mv.entries()].sort((p,q)=>q[1].n-p[1].n);return `<li>${a.k?`Po <b>${rzPath(a.x.sans,a.k)}</b>`:'Na začátku'} jsi hrál ${ms.map(([s,m])=>`<b>${rzMvLab(s,a.k)}</b> (${m.n}×, ${Math.round(m.p/m.n*100)} %)`).join(ms.length>2?', ':' a ')}.</li>`;}).join('');
 const avgAt=mv=>{const a=G.filter(x=>x.N>=mv*2).map(x=>x.mat[mv*2]);return a.length?(a.reduce((s,v)=>s+v,0)/a.length):null;};
 const fm=v=>v==null?'–':(v>0?'+':'')+v.toFixed(1).replace('.',',');const accs=G.filter(x=>x.acc!=null).map(x=>x.acc);
 const fb=G.map(x=>x.bl[0]).filter(Boolean).map(b=>Math.ceil(b.k/2)).sort((a,b)=>a-b);const med=fb.length?fb[Math.floor(fb.length/2)]:null;
 /* repertoár */
 let rep='';const I=rzIdx();
 if(!I)rep='<p class="profEmpty">Načítám kurzy…</p>';else{const rs=G.map(x=>({x,r:rzRep(x)})).filter(o=>o.r);const devs=new Map();let best=null;
  rs.forEach(({x,r})=>{if(!best||r.deep>best.r.deep)best={x,r};if(r.out==='dev'){const key=x.fens[r.k]+'|'+r.my;let d=devs.get(key);if(!d)devs.set(key,d={n:0,x,r});d.n++;}});
  const ds=[...devs.values()].sort((a,b)=>b.n-a.n||a.r.k-b.r.k).slice(0,3);RZ.devs=ds;
  if(!best||best.r.deep<Math.max(2,S.n)&&!ds.length)rep='<p class="profEmpty">Zatím není v žádném kurzu.</p>';
  else rep=(ds.length?`<ul class="lst rzDev">${ds.map(d=>{const e=d.r.ent;return `<li><b>V ${Math.ceil((d.r.k+1)/2)}. tahu jsi odbočil z repertoáru${d.n>1?` (${d.n}×)`:''}</b><small>Po ${rzPath(d.x.sans,d.r.k)||'začátku'} jsi hrál ${rzMvLab(d.r.my,d.r.k)}, v kurzu ${escH(e.x.c.title)} je ${d.r.want.map(w=>rzMvLab(w,d.r.k)).join(' nebo ')}.</small><button data-rzdev="${ds.indexOf(d)}">Ukázat v partii</button><button data-practice="${e.x.c.id}|${e.x.l.id}">Procvičit tuhle variantu</button></li>`;}).join('')}</ul>`
   :`<p class="profEmpty">V těchhle partiích jsi z repertoáru neodbočil – hrál jsi podle kurzu ${escH(best.r.ent.x.c.title)}, dokud z něj neodbočil soupeř.</p><div class="freeBtns"><button class="btn" data-practice="${best.r.ent.x.c.id}|${best.r.ent.x.l.id}">Procvičit tuhle variantu</button></div>`);}
 const rows=(RZ.showAll?G:G.slice(0,15)).map(x=>`<tr data-game="${escH(x.url)}"><td>${rzDate(x.end)}</td><td class="op">${escH(x.opp)} <small>${x.oppR||''}</small></td><td>${rzRes(x)}</td><td>${RZ_WHY[x.reason]||escH(x.reason)}</td><td>${Math.ceil(x.N/2)}</td><td><a href="${escH(x.url)}" target="_blank" rel="noopener">chess.com</a></td></tr>`).join('');
 const W=G.filter(x=>x.res==='W').length,D=G.filter(x=>x.res==='D').length;
 el.innerHTML=`<div class="profCard rzDetail" id="rzDet"><h2>${S.title} <small class="exCnt">${G.length} partií · ${rzPct(W,D,G.length)} %</small></h2>
 <div class="tiles rzTiles"><div><b>${fm(avgAt(10))}</b><span>materiál po 10. tahu</span></div><div><b>${fm(avgAt(15))}</b><span>po 15. tahu</span></div><div><b>${fm(avgAt(25))}</b><span>po 25. tahu</span></div><div><b>${accs.length?Math.round(accs.reduce((s,v)=>s+v,0)/accs.length)+' %':'–'}</b><span>přesnost podle chess.com</span></div><div><b>${med?med+'. tah':'–'}</b><span>typická první hrubá chyba${fb.length?` (${fb.length} z ${G.length} partií)`:''}</span></div></div>
 <h3 class="rzH3">Kde se tvoje partie rozcházejí</h3>${divTxt?`<ul class="lst rzDivs">${divTxt}</ul>`:'<p class="profEmpty">Ve stejných pozicích hraješ pořád stejně.</p>'}
 <h3 class="rzH3">Tvůj repertoár z kurzů</h3>${rep}
 <h3 class="rzH3">Partie</h3><div class="rzScroll"><table class="rzTbl rzGames"><thead><tr><th>Datum</th><th>Soupeř</th><th></th><th>Konec</th><th>Tahů</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${G.length>15&&!RZ.showAll?`<button class="lnk" id="rzMore">Zobrazit všech ${G.length}</button>`:''}</div>`;}
/* d) kde chybuješ */
function rzRenderD(){const G=rzF(),el=$('rzD');if(!el)return;if(!G.length){el.innerHTML='';return;}
 const B=[];G.forEach(x=>x.bl.forEach(b=>B.push({x,b})));const n=G.length;
 const ph={op:0,mg:0,eg:0};B.forEach(o=>ph[o.b.ph]++);const phMax=Math.max(1,ph.op,ph.mg,ph.eg);
 const lost={},moved={};B.forEach(o=>{if(o.b.lost)lost[o.b.lost]=(lost[o.b.lost]||0)+1;moved[o.b.p]=(moved[o.b.p]||0)+1;});
 const pcs=(m)=>Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([p,k])=>`<span class="rzPc">${NOM[p]} <b>${k}</b></span>`).join('')||'<span class="profEmpty">–</span>';
 const withClk=B.filter(o=>o.b.clk!=null&&RZ_CFG.pressure[o.x.tc]);const press=withClk.filter(o=>o.b.clk<RZ_CFG.pressure[o.x.tc]);
 const kEg=B.filter(o=>o.b.p==='K'&&o.b.ph==='eg');const WL=G.filter(x=>x.wonLost);const wlR={};WL.forEach(x=>{wlR[x.reason]=(wlR[x.reason]||0)+1;});
 const engG=G.filter(x=>RZ.eng.res[x.url]);const EM=[];engG.forEach(x=>(rzEngMarks(x)||[]).forEach(m=>EM.push({x,m})));
 const ec={i:EM.filter(o=>o.m.cls==='i'&&!o.m.miss).length,m:EM.filter(o=>o.m.cls==='m').length,b:EM.filter(o=>o.m.cls==='b').length,miss:EM.filter(o=>o.m.miss).length};
 const phN={op:'Zahájení',mg:'Střední hra',eg:'Koncovka'};
 const list=(engG.length?EM.filter(o=>o.m.cls!=='i').map(o=>({x:o.x,k:o.m.k,t:o.m.miss?'promarněná šance':o.m.cls==='b'?'hrubá chyba':'chyba',ph:o.m.ph,clk:o.m.clk})):[]).concat(B.filter(o=>!RZ.eng.res[o.x.url]).map(o=>({x:o.x,k:o.b.k,t:o.b.kind==='mate'?'dostal jsi mat':o.b.lost?'ztráta '+RZ_GEN[o.b.lost]:'ztráta materiálu',ph:o.b.ph,clk:o.b.clk})))
  .sort((a,b)=>b.x.end-a.x.end||a.k-b.k).slice(0,12);
 const errRow=e=>`<li><button class="rzErr" data-game="${escH(e.x.url)}" data-k="${e.k}"><b>${rzMvLab(e.x.sans[e.k-1],e.k-1)}</b><span>${e.t} · ${phN[e.ph].toLowerCase()}${e.clk!=null?` · ${rzClk(e.clk)} na hodinách`:''}</span><small>${rzDate(e.x.end)} proti ${escH(e.x.opp)}</small></button></li>`;
 const E=RZ.eng;const engN=Math.min(E.n,G.length);
 el.innerHTML=`<div class="profCard"><h2>Kde chybuješ</h2><p class="profEmpty">Rychlý odhad bez enginu: hrubá chyba = tah, po kterém jsi do dvou tahů ztratil aspoň 3 body materiálu a nevrátil je.</p>
 <div class="tiles rzTiles"><div><b>${(B.length/n).toFixed(1).replace('.',',')}</b><span>hrubých chyb na partii</span></div><div><b>${withClk.length?Math.round(press.length/withClk.length*100)+' %':'–'}</b><span>chyb v časové tísni (blitz pod ${RZ_CFG.pressure.blitz} s, rapid pod ${RZ_CFG.pressure.rapid} s)</span></div><div><b>${kEg.length}</b><span>tahů králem v koncovce, po kterých přišla ztráta nebo mat</span></div><div><b>${WL.length}</b><span>prohraných partií, kde jsi měl aspoň o 3 body víc${WL.length?`: ${Object.entries(wlR).map(([r,k])=>`${RZ_WHY[r]||r} ${k}`).join(', ')}`:''}</span></div></div>
 <h3 class="rzH3">Podle fáze hry</h3><div class="rzBars">${['op','mg','eg'].map(p=>`<div><span>${phN[p]}</span><span class="rzHB"><i style="width:${ph[p]/phMax*100}%"></i></span><b>${ph[p]}</b></div>`).join('')}</div>
 <div class="rzTwoS"><div><h3 class="rzH3">Jakou figuru ztrácíš</h3><div class="rzPcs">${pcs(lost)}</div></div><div><h3 class="rzH3">Čím jsi táhl při chybě</h3><div class="rzPcs">${pcs(moved)}</div></div></div>
 <h3 class="rzH3">Přesný rozbor enginem</h3>
 ${engG.length?`<div class="tiles rzTiles"><div><b>${(ec.i/engG.length).toFixed(1).replace('.',',')}</b><span>nepřesností na partii</span></div><div><b>${(ec.m/engG.length).toFixed(1).replace('.',',')}</b><span>chyb na partii</span></div><div><b>${(ec.b/engG.length).toFixed(1).replace('.',',')}</b><span>hrubých chyb na partii</span></div><div><b>${ec.miss}</b><span>promarněných šancí (soupeř chyboval a ty jsi to netrestal)</span></div></div><p class="profEmpty">Rozebráno ${engG.length} ${engG.length===1?'partie':'partií'} (Stockfish, hloubka ${RZ_CFG.engDepth}).</p>`:'<p class="profEmpty">Stockfish projde tvoje poslední partie tah po tahu a najde i menší chyby a promarněné šance. Běží v tomhle zařízení, u 30 partií to trvá pár minut.</p>'}
 ${E.busy?`<div class="rzProg" id="rzEngP"><span>${E.prog||'Spouštím engine…'}</span><div class="bar"><i style="width:2%"></i></div></div><div class="freeBtns"><button class="btn" id="rzEngX">Zrušit</button></div>`
  :`<div class="rzEngRow"><div class="chip2" id="rzEngN">${[5,10,30].map(k=>`<button type="button" data-en="${k}" aria-pressed="${E.n===k}">${k}</button>`).join('')}</div><button class="btn primary" id="rzEngGo">Rozebrat enginem</button>${E.fail?'<span class="profEmpty">Engine se nepodařilo spustit.</span>':''}</div>`}
 <h3 class="rzH3">Poslední chyby</h3>${list.length?`<ul class="rzErrs">${list.map(errRow).join('')}</ul>`:'<p class="profEmpty">Žádné hrubé chyby. Výborně.</p>'}</div>`;
 const go=document.getElementById('rzEngGo');if(go)go.onclick=()=>{RZ.eng.fail=false;rzEngRun(RZ.eng.n);};const x=document.getElementById('rzEngX');if(x)x.onclick=rzEngStop;
 const en=document.getElementById('rzEngN');if(en)en.onclick=e=>{const b=e.target.closest('button');if(!b)return;RZ.eng.n=+b.dataset.en;en.querySelectorAll('button').forEach(q=>q.setAttribute('aria-pressed',q===b));};
 if(E.busy&&E.prog){const p=document.getElementById('rzEngP');if(p)p.querySelector('span').textContent=E.prog;}}
/* e) čas */
function rzClkAt(x,col,n){const k=col==='w'?2*n-1:2*n;return k<=x.N?x.clk[k-1]:null;}
function rzRenderE(){const G=rzF(),el=$('rzE');if(!el)return;if(!G.length){el.innerHTML='';return;}
 const tcs=['bullet','blitz','rapid'].filter(t=>G.some(x=>x.tc===t&&x.clk.length));const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
 const rows=tcs.map(t=>{const g=G.filter(x=>x.tc===t);return [10,20,30].map(n=>{const me=[],op=[];g.forEach(x=>{const a=rzClkAt(x,x.col,n),b=rzClkAt(x,x.col==='w'?'b':'w',n);if(a!=null&&b!=null){me.push(a);op.push(b);}});
  return me.length?`<tr><th>${RZ_TC[t]}</th><td>${n}. tah</td><td><b>${rzClk(avg(me))}</b></td><td>${rzClk(avg(op))}</td><td class="${avg(me)<avg(op)?'neg':''}">${avg(me)<avg(op)?'−':'+'}${rzClk(Math.abs(avg(me)-avg(op)))}</td><td>${me.length}</td></tr>`:'';}).join('');}).join('');
 const L=G.filter(x=>x.res==='L'),TO=L.filter(x=>x.reason==='timeout'),TOok=TO.filter(x=>x.mat[x.N]>=0);
 el.innerHTML=`<div class="profCard"><h2>Čas</h2>${rows?`<div class="rzScroll"><table class="rzTbl"><thead><tr><th>Tempo</th><th>Kdy</th><th>Ty</th><th>Soupeř</th><th>Rozdíl</th><th>Partií</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="profEmpty">Partie nemají záznam hodin.</p>'}
 <div class="tiles rzTiles"><div><b>${TO.length}</b><span>proher na čas${L.length?` (${Math.round(TO.length/L.length*100)} % proher)`:''}</span></div><div><b>${TOok.length}</b><span>z nich s vyrovnaným nebo lepším materiálem</span></div></div></div>`;}
/* f) doporučení */
function rzRenderF(){const G=rzF(),el=$('rzF');if(!el)return;if(!G.length){el.innerHTML='';return;}const out=[];const C=RZ_CFG;
 const trees=RZ.trees||{w:rzTree(G,'w'),b:rzTree(G,'b')};const weak=rzWeak(trees);
 weak.slice(0,2).forEach(a=>{const I=rzIdx();let crs=null;if(I){const g=a.n.gi[0];const key=g.fens[a.n.path.length].split(' ').slice(0,3).join(' ');const e=(I.get(key)||[]).find(e=>e.x.c.side===a.c);if(e)crs=e.x.c;}
  out.push(`<b>${rzNodeTxt(a.c,a.n)} se ti nedaří:</b> z ${a.n.n} partií jsi vyhrál jen ${a.n.w} (${rzPct(a.n.w,a.n.d,a.n.n)} % výher)${a.n.l?`, prohrál ${a.n.l}`:''}${a.n.d?`, remíz ${a.n.d}`:''}. Připrav si na to odpověď.${crs?` <a href="#${crs.id}">Otevřít kurz ${escH(crs.title)}</a>`:''}`);});
 const L=G.filter(x=>x.res==='L'),TO=L.filter(x=>x.reason==='timeout');
 if(L.length>=4&&TO.length/L.length*100>=C.timeLossShare){const d=[];G.forEach(x=>{if(x.tc==='daily')return;const a=rzClkAt(x,x.col,25),b=rzClkAt(x,x.col==='w'?'b':'w',25);if(a!=null&&b!=null)d.push(b-a);});const av=d.length?d.reduce((s,v)=>s+v,0)/d.length:0;
  out.push(`Na čas prohráváš ${Math.round(TO.length/L.length*100)} % proher. Hraj rychleji ve střední hře${av>1?`, ve 25. tahu máš na hodinách v průměru o ${Math.round(av)} s méně než soupeř`:''}.`);}
 const sc=t=>{const a=G.filter(x=>x.tc===t);return{n:a.length,p:rzPct(a.filter(x=>x.res==='W').length,a.filter(x=>x.res==='D').length,a.length)};};const R=sc('rapid'),Bz=sc('blitz');
 if(R.n>=C.rapidMinN&&Bz.n>=C.rapidMinN&&R.p-Bz.p>=C.rapidBetter)out.push(`V rapidu vyhráváš ${R.p} % partií, v blitzu jen ${Bz.p} %. Hraj víc delších partií – máš čas si tahy rozmyslet.`);
 const ph={op:0,mg:0,eg:0};G.forEach(x=>x.bl.forEach(b=>ph[b.ph]++));const top=Object.entries(ph).sort((a,b)=>b[1]-a[1])[0];
 if(top[1]>=3){if(top[0]==='mg')out.push(`Nejvíc hrubých chyb (${top[1]}) děláš ve střední hře. Před každým tahem se podívej, co soupeř napadá. <a href="#puzzle/vyber">Procvičit Vyber tah</a>`);
  else if(top[0]==='eg')out.push(`Nejvíc hrubých chyb (${top[1]}) děláš v koncovce. <a href="#koncovky">Procvičit Koncovky</a>`);
  else out.push(`Nejvíc hrubých chyb (${top[1]}) děláš už v zahájení, do ${C.openMoves}. tahu. Nauč se varianty v kurzech zpaměti.`);}
 const kEg=G.reduce((s,x)=>s+x.bl.filter(b=>b.p==='K'&&b.ph==='eg').length,0);if(kEg>=C.kingEgMin)out.push(`V koncovce ${kEg}× po tahu králem přišla ztráta materiálu nebo mat. Než táhneš králem, zkontroluj šachy a vidličky jezdcem.`);
 const WL=G.filter(x=>x.wonLost).length;if(WL>=C.wonLostMin&&out.length<5)out.push(`${WL}× jsi prohrál partii, ve které jsi měl o 3 body materiálu víc. Když vedeš, měň figury a hlídej si krále i čas.`);
 el.innerHTML=out.length?`<div class="profCard"><h2>Doporučení</h2><ul class="lst tips rzTips">${out.slice(0,5).map(t=>`<li>${t}</li>`).join('')}</ul></div>`:'';}
/* p) opakující se vzorce: co se v partiích opakuje a na čem pracovat (bez enginu, z materiálu, hodin a tahů) */
function rzPatterns(G){const out=[],good=[];const n=G.length;if(n<5)return {out,good};
 const W=a=>a.filter(x=>x.res==='W').length,wr=a=>a.length?Math.round(W(a)/a.length*100):0;const L=G.filter(x=>x.res==='L');
 const B=[];G.forEach(x=>x.bl.forEach(b=>B.push({x,b})));const recent=a=>a.slice().sort((p,q)=>q.x.end-p.x.end).slice(0,3);
 const pct=(a,b)=>b?Math.round(a/b*100):0;const tx=(k,one,few,many)=>k===1?one:k>=2&&k<=4?few:many;
 const add=(o)=>{o.sev=o.sev||1;out.push(o);};
 // 1) figura na napadené pole
 const hung=B.filter(o=>o.b.self&&o.b.kind==='mat'&&!o.b.fork);
 if(hung.length>=3&&pct(hung.length,B.length)>=15)add({sev:hung.length*1.4,ic:'hang',t:'Táhneš figurou na pole, kde ji soupeř sebere',
  d:`${hung.length}× ze ${B.length} hrubých chyb jsi táhl figurou (nejčastěji ${({P:'pěšcem',N:'jezdcem',B:'střelcem',R:'věží',Q:'dámou',K:'králem'})[rzTop(hung.map(o=>o.b.p))]}) na pole, které soupeř napadal, a hned ji vzal.`,
  tip:'Před každým tahem se zeptej: „Kdo na to pole útočí a kdo ho brání?“ Když útočníků je víc než obránců, figura tam nepatří.',ex:recent(hung),lk:[['#puzzle/vyber','Vyber tah'],['#puzzle/motivy/hangingPiece','Nekryté figury']]});
 // 2) necháš jinou figuru bez obrany
 const left=B.filter(o=>!o.b.self&&!o.b.fork&&o.b.kind==='mat'&&o.b.lost);
 if(left.length>=3)add({sev:left.length*1.2,ic:'left',t:'Po tvém tahu zůstane jiná figura bez obrany',
  d:`${left.length}× jsi tahem odkryl jinou figuru a soupeř ji sebral – nejčastěji ${({P:'pěšce',N:'jezdce',B:'střelce',R:'věž',Q:'dámu'})[rzTop(left.map(o=>o.b.lost))]}.`,
  tip:'Než táhneš, podívej se, co ta figura doteď bránila. Odchodem může nechat jinou figuru viset.',ex:recent(left),lk:[['#puzzle/motivy/deflection','Odlákání'],['#puzzle/motivy/hangingPiece','Nekryté figury']]});
 // 3) vidličky
 const fk=B.filter(o=>o.b.fork);const fkAll=G.reduce((s,x)=>s+x.fk.length,0);
 if(fk.length>=2)add({sev:fk.length*1.5,ic:'fork',t:'Soupeř na tebe často chystá vidličky',
  d:`${fk.length}× po tvé chybě přišla vidlička – jedna figura soupeře napadla dvě tvoje (nebo krále a figuru). Celkem soupeři ve tvých partiích zahráli vidličku ${fkAll}×.`,
  tip:'Hlídej si figury, které stojí na stejné barvě pole jako jezdec soupeře, a nenechávej krále a dámu tak, aby je šlo napadnout jedním tahem.',ex:recent(fk),lk:[['#puzzle/motivy/fork','Procvičit vidličky']]});
 // 4) otrávený materiál
 const greedy=B.filter(o=>o.b.greedy&&o.b.kind==='mat');
 if(greedy.length>=3)add({sev:greedy.length*1.1,ic:'greedy',t:'Bereš materiál, který je past',
  d:`${greedy.length}× jsi něco sebral a do dvou tahů přišel o víc, než jsi vzal.`,
  tip:'Když soupeř nechá něco viset, zastav se: proč to dělá? Projdi jeho šachy a braní po tvém braní.',ex:recent(greedy),lk:[['#puzzle/pasti','Pasti v zahájení'],['#puzzle/motivy/attraction','Vlákání']]});
 // 5) mat na poslední řadě
 const bk=L.filter(x=>x.bk);
 if(bk.length>=2)add({sev:bk.length*2,ic:'mate',t:'Dostáváš mat na poslední řadě',
  d:`${bk.length}× tě soupeř zmatil věží nebo dámou na tvé první řadě – král byl zavřený za vlastními pěšci.`,
  tip:'Když se figury vymění, udělej králi „okénko“: tah h3 (za černé h6) nebo g3. Hlídej, aby první řadu bránila aspoň jedna věž.',ex:bk.slice(0,3).map(x=>({x,b:{k:x.N}})),lk:[['#puzzle/motivy/backRankMate','Mat na poslední řadě']]});
 // 6) rychlý mat
 const fast=L.filter(x=>x.reason==='checkmated'&&x.N<=40);
 if(fast.length>=2)add({sev:fast.length*1.8,ic:'mate',t:'Prohráváš matem už v zahájení',
  d:`${fast.length}× jsi dostal mat do 20. tahu. Často jde o útok na pole f7 (za bílé f2) nebo o krále, který zůstal uprostřed.`,
  tip:'V zahájení vyviň jezdce a střelce, zrošáduj a nehraj zbytečně tahy pěšci f a g. Poznej nejčastější pasti, ať je vidíš dopředu.',ex:fast.slice(0,3).map(x=>({x,b:{k:x.N}})),lk:[['#puzzle/pasti','Pasti v zahájení'],['#lekce','Lekce strategie']]});
 // 7) rošáda
 const cE=G.filter(x=>x.castle&&x.castle<=10&&x.N>=24),cN=G.filter(x=>(!x.castle||x.castle>10)&&x.N>=24);
 if(cE.length>=5&&cN.length>=5&&wr(cE)-wr(cN)>=15)add({sev:(wr(cE)-wr(cN))/6+cN.length/4,ic:'king',t:'Bez včasné rošády prohráváš',
  d:`Když se zrošáduješ do 10. tahu, vyhraješ ${wr(cE)} % partií (${cE.length}). Když ne, jen ${wr(cN)} % (${cN.length}).`,
  tip:'Rošáduj brzy – nejlépe do 8.–10. tahu. Král uprostřed je terč, hlavně když se otevře centrum.',ex:[],lk:[['#lekce','Lekce strategie']]});
 else if(cE.length>=5&&cN.length>=5&&wr(cN)-wr(cE)>=15)good.push(`Partie bez rané rošády ti jdou (${wr(cN)} % výher) – útočný styl ti sedí.`);
 // 8) dáma brzy ven
 const qE=G.filter(x=>x.qE),qN=G.filter(x=>!x.qE);
 if(qE.length>=5&&qN.length>=5&&wr(qN)-wr(qE)>=15)add({sev:(wr(qN)-wr(qE))/6+qE.length/5,ic:'queen',t:'Vytahuješ dámu moc brzy',
  d:`V ${qE.length} partiích jsi táhl dámou v prvních 5 tazích a vyhrál ${wr(qE)} %. Bez toho vyhráváš ${wr(qN)} %.`,
  tip:'Dáma na začátku jen ztrácí tempa – soupeř ji honí lehkými figurami a vyvíjí se. Nejdřív jezdci a střelci, dáma až potom.',ex:[],lk:[['#lekce','Lekce strategie']]});
 // 9) časová tíseň
 const wc=B.filter(o=>o.b.clk!=null&&RZ_CFG.pressure[o.x.tc]);const pr=wc.filter(o=>o.b.clk<RZ_CFG.pressure[o.x.tc]);const TO=L.filter(x=>x.reason==='timeout');
 if(wc.length>=6&&pct(pr.length,wc.length)>=40)add({sev:pr.length*1.2,ic:'clock',t:'Chybuješ hlavně v časové tísni',
  d:`${pr.length} z ${wc.length} hrubých chyb (${pct(pr.length,wc.length)} %) přišlo, když ti na hodinách zbývalo málo času.`,
  tip:'Šetři čas v zahájení (hraj naučené tahy rychle) a rozmýšlej jen v důležitých chvílích. V blitzu si nech na konec aspoň minutu.',ex:recent(pr),lk:[['#puzzle/rush','Puzzle Rush – rychlé rozhodování']]});
 if(L.length>=5&&pct(TO.length,L.length)>=25){const ok=TO.filter(x=>x.mat[x.N]>=0).length;add({sev:TO.length*1.3,ic:'clock',t:'Prohráváš na čas',
  d:`${TO.length} z ${L.length} proher (${pct(TO.length,L.length)} %) bylo na čas${ok?` a v ${ok} z nich jsi měl stejně nebo víc materiálu`:''}.`,
  tip:'Když vedeš a dochází čas, zjednodušuj: měň figury a hraj jisté tahy. Zkus delší tempo.',ex:TO.slice(0,3).map(x=>({x,b:{k:x.N}})),lk:[['#puzzle/rush','Puzzle Rush']]});}
 // 10) tilt: po prohře
 const C=G.slice().sort((a,b)=>a.end-b.end);const aL=[],aW=[];for(let i=1;i<C.length;i++){if(C[i].end-C[i-1].end>3600)continue;(C[i-1].res==='L'?aL:C[i-1].res==='W'?aW:[]).push(C[i]);}
 if(aL.length>=8&&aW.length>=8&&wr(aW)-wr(aL)>=15)add({sev:(wr(aW)-wr(aL))/5+2,ic:'tilt',t:'Po prohře hraješ hůř (tilt)',
  d:`Partie hned po prohře vyhraješ jen v ${wr(aL)} % (${aL.length} partií). Po výhře v ${wr(aW)} %.`,
  tip:'Po prohře si dej aspoň 5 minut pauzu, projdi si, co se stalo, a teprve pak hraj další. Po 2 prohrách za sebou skonči.',ex:[],lk:[]});
 // 11) dlouhé seance
 const s1=[],s2=[];let run=0;for(let i=0;i<C.length;i++){run=i&&C[i].end-C[i-1].end<1800?run+1:0;(run>=3?s2:s1).push(C[i]);}
 if(s1.length>=8&&s2.length>=8&&wr(s1)-wr(s2)>=12)add({sev:(wr(s1)-wr(s2))/5+1,ic:'tilt',t:'Ve dlouhých seancích ti to přestává jít',
  d:`Prvních pár partií za sebou vyhraješ ${wr(s1)} %, od 4. partie v řadě už jen ${wr(s2)} % (${s2.length} partií).`,
  tip:'Hraj po kratších blocích – 3 partie, pauza. Únava dělá chyby.',ex:[],lk:[]});
 // 12) denní doba
 const tb=[['ráno',5,11],['odpoledne',11,17],['večer',17,22],['v noci',22,29]].map(([t,a,b])=>{const g=G.filter(x=>{let h=new Date(x.end*1000).getHours();if(h<5)h+=24;return h>=a&&h<b;});return {t,g,w:wr(g)};}).filter(o=>o.g.length>=8);
 if(tb.length>=2){const so=tb.slice().sort((a,b)=>b.w-a.w);const hi=so[0],lo=so[so.length-1];if(hi.w-lo.w>=15)add({sev:(hi.w-lo.w)/6,ic:'sun',t:`Nejhůř ti to jde ${lo.t}`,
  d:`${lo.t[0].toUpperCase()+lo.t.slice(1)} vyhráváš ${lo.w} % partií (${lo.g.length}), ${hi.t} ${hi.w} % (${hi.g.length}).`,
  tip:`Hodnocené partie hraj radši ${hi.t}. ${lo.t==='v noci'?'Pozdě večer bývá hlava unavená.':''}`,ex:[],lk:[]});}
 // 13) proti slabším
 const weaker=G.filter(x=>x.oppR&&x.myR&&x.oppR<=x.myR-100),stronger=G.filter(x=>x.oppR&&x.myR&&x.oppR>=x.myR+100);
 if(weaker.length>=8&&wr(weaker)<55)add({sev:(60-wr(weaker))/5+2,ic:'down',t:'Ztrácíš body proti slabším soupeřům',
  d:`Proti hráčům o 100 a víc bodů slabším vyhráváš jen ${wr(weaker)} % (${weaker.length} partií).`,
  tip:'Slabší soupeř taky umí trestat. Hraj stejně pečlivě jako proti silnějším a nespěchej s útokem.',ex:[],lk:[]});
 if(stronger.length>=6&&wr(stronger)>=45)good.push(`Proti silnějším soupeřům (o 100+ bodů) vyhráváš ${wr(stronger)} % – máš na vyšší rating.`);
 // 14) koncovky
 const eg=G.filter(x=>x.eg),ne=G.filter(x=>!x.eg);const egB=B.filter(o=>o.b.ph==='eg');
 if(eg.length>=8&&ne.length>=8&&wr(ne)-wr(eg)>=15)add({sev:(wr(ne)-wr(eg))/6+egB.length/3,ic:'king',t:'Koncovky ti nejdou',
  d:`Když partie dojde do koncovky, vyhraješ ${wr(eg)} % (${eg.length} partií). Když skončí dřív, ${wr(ne)} %.${egB.length?` V koncovkách jsi udělal ${egB.length} hrubých chyb.`:''}`,
  tip:'Nauč se základní koncovky: věž proti pěšcům, opozice králů, aktivní král. V koncovce je král útočná figura.',ex:recent(egB),lk:[['#koncovky','Koncovky'],['#puzzle/motivy/rookEndgame','Věžové koncovky']]});
 else if(eg.length>=8&&wr(eg)-wr(ne)>=15)good.push(`Koncovky ti jdou: když partie dojde do koncovky, vyhraješ ${wr(eg)} %.`);
 // 15) vzdáváš brzy
 const res=L.filter(x=>x.reason==='resigned'&&x.mat[x.N]>=-2);
 if(res.length>=3)add({sev:res.length,ic:'flag',t:'Vzdáváš se moc brzy',
  d:`${res.length}× jsi vzdal, když jsi byl v materiálu nanejvýš 2 body pozadu.`,
  tip:'Online soupeři často chybují. Dokud nejsi o figuru a víc pozadu, hraj dál a hledej šance.',ex:res.slice(0,3).map(x=>({x,b:{k:x.N}})),lk:[]});
 // 16) dáma
 const qL=B.filter(o=>o.b.lost==='Q');if(qL.length>=3)add({sev:qL.length*1.6,ic:'queen',t:'Často přicházíš o dámu',
  d:`${qL.length}× jsi po chybě přišel o dámu.`,tip:'Dáma je nejcennější figura – před každým tahem dámou zkontroluj, jestli ji soupeř nemůže napadnout lehkou figurou nebo pěšcem.',ex:recent(qL),lk:[['#puzzle/motivy/trappedPiece','Chycená figura'],['#puzzle/motivy/skewer','Napíchnutí']]});
 // 17) vyhrané partie prohrané
 const wl=G.filter(x=>x.wonLost);if(wl.length>=3)add({sev:wl.length*1.5,ic:'down',t:'Nedotahuješ vyhrané partie',
  d:`${wl.length}× jsi měl aspoň o 3 body víc materiálu a stejně prohrál.`,tip:'Když vedeš: měň figury (ne pěšce), hlídej krále a soupeřovy šachy, nespěchej.',ex:wl.slice(0,3).map(x=>({x,b:{k:x.N}})),lk:[['#puzzle/motivy/defensiveMove','Obranné tahy']]});
 // barvy
 const wG=G.filter(x=>x.col==='w'),bG=G.filter(x=>x.col==='b');
 if(wG.length>=10&&bG.length>=10&&Math.abs(wr(wG)-wr(bG))>=15){const lo=wr(wG)<wr(bG)?'w':'b';add({sev:Math.abs(wr(wG)-wr(bG))/7,ic:'side',t:`Za ${lo==='w'?'bílé':'černé'} ti to jde výrazně hůř`,
  d:`Za bílé vyhráváš ${wr(wG)} %, za černé ${wr(bG)} %.`,tip:`Zaměř se na repertoár za ${lo==='w'?'bílé':'černé'} – vyber si jeden kurz a nauč se ho pořádně.`,ex:[],lk:[['#','Kurzy zahájení']]});}
 // trend
 if(C.length>=20){const h=Math.floor(C.length/2),a=wr(C.slice(0,h)),b=wr(C.slice(h));if(b-a>=10)good.push(`Zlepšuješ se: ve starší polovině partií ${a} % výher, v novější ${b} %.`);else if(a-b>=12)add({sev:(a-b)/6,ic:'down',t:'Poslední dobou se ti daří hůř',d:`Ve starší polovině vybraných partií jsi vyhrál ${a} %, v novější jen ${b} %.`,tip:'Zkus kratší pauzu od hodnocených partií a místo toho pár dní řeš puzzly.',ex:[],lk:[['#puzzle','Puzzle']]});}
 out.sort((a,b)=>b.sev-a.sev);return {out,good};}
function rzTop(a){const m={};a.forEach(v=>{if(v)m[v]=(m[v]||0)+1;});return Object.entries(m).sort((p,q)=>q[1]-p[1])[0]?.[0]||'P';}
const RZ_PIC={hang:'M12 3l9 16H3z',left:'M4 12h16M12 4v16',fork:'M12 20V10M12 10L6 4M12 10l6-6',greedy:'M6 8h12l-1 12H7z',mate:'M12 3v6M9 6h6M7 21h10l-1-9H8z',king:'M12 3v4M10 5h4M7 21h10l-1-10H8z',queen:'M5 8l3 10h8l3-10-4 4-3-7-3 7z',clock:'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',tilt:'M4 18l6-6 4 4 6-8',sun:'M12 4v2M12 18v2M4 12h2M18 12h2M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',down:'M4 6l6 6 4-4 6 8',flag:'M6 21V4h10l-2 4 2 4H6',side:'M12 3a9 9 0 0 0 0 18z'};
function rzRenderP(){const G=rzF(),el=$('rzP');if(!el)return;if(G.length<5){el.innerHTML='';return;}const {out,good}=rzPatterns(G);
 const card=(o,i)=>`<div class="rzPat${i===0?' top':''}"><div class="rzPatH"><span class="rzPatI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${RZ_PIC[o.ic]||RZ_PIC.down}"/></svg></span><div><b>${o.t}</b><p>${o.d}</p></div></div><p class="rzPatTip"><b>Co s tím:</b> ${o.tip}</p>
  ${o.ex.length||o.lk.length?`<div class="rzPatA">${o.ex.map(e=>`<button class="btn" data-game="${escH(e.x.url)}" data-k="${e.b.k}">Ukázka: ${rzDate(e.x.end)}, ${escH(e.x.opp)}</button>`).join('')}${o.lk.map(([h,t])=>`<a class="btn primary" href="${h}">${t}</a>`).join('')}</div>`:''}</div>`;
 el.innerHTML=`<div class="profCard"><h2>Na čem pracovat</h2><p class="profEmpty">Co se ve vybraných ${G.length} partiích opakuje. Seřazené podle toho, kolik tě to stojí. U každého vzorce můžeš otevřít ukázku z tvé partie.</p>
 ${out.length?`<div class="rzPats">${out.slice(0,6).map(card).join('')}</div>`:'<p class="profEmpty rzOk">Žádný výrazný opakující se problém. Vyber víc partií pro přesnější rozbor.</p>'}
 ${good.length?`<h3 class="rzH3">Co ti jde</h3><ul class="lst tips rzTips">${good.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}</div>`;}
/* f2) Mezery v repertoáru: kde v partiích končí tvoje kurzy (pro všechny hráče)
   – odbočil soupeř: na jeho tah nemáš v kurzech odpověď → Najít odpověď (Najít variantu se Stockfishem)
   – odbočil jsi ty: máš přípravu, ale hraješ jinak → Ukázat v partii, Procvičit */
function rzRenderGap(){const el=$('rzGap');if(!el)return;const G=rzF();if(G.length<3){el.innerHTML='';return;}
 const I=rzIdx();if(!I){el.innerHTML='';chessLib().then(()=>{if(page==='rozbor')rzRenderGap();}).catch(()=>{});return;}
 const gaps=new Map(),devs=new Map();let inRep=0;
 G.forEach(x=>{const r=rzRep(x);if(!r)return;if(r.deep>=1)inRep++;
  if(r.out==='left'&&r.k>0&&((r.k-1)%2===0)!==(x.col==='w')){const key=x.col+'|'+x.fens[r.k].split(' ').slice(0,3).join(' ');let a=gaps.get(key);if(!a)gaps.set(key,a={x,k:r.k,n:0,w:0,last:x});a.n++;if(x.res==='W')a.w++;if(x.end>a.last.end)a.last=x;}
  else if(r.out==='dev'&&r.ent){const key=x.col+'|'+x.fens[r.k]+'|'+r.my;let a=devs.get(key);if(!a)devs.set(key,a={x,r,n:0,w:0,last:x,lr:r});a.n++;if(x.res==='W')a.w++;if(x.end>a.last.end){a.last=x;a.lr=r;}}});
 const GL=[...gaps.values()].sort((a,b)=>b.n-a.n||a.k-b.k).slice(0,5),DL=[...devs.values()].sort((a,b)=>b.n-a.n||a.r.k-b.r.k).slice(0,4);RZ.gapDev=DL;
 if(!GL.length&&!DL.length){el.innerHTML='';return;}
 const pct=a=>Math.round(a.w/a.n*100);const side=c=>c==='w'?'za bílé':'za černé';const pth=(x,k)=>x.sans.slice(0,k).map((m,i)=>(i%2===0?(i/2+1)+'.':'')+czSan(m)).join(' ');
 const gapLi=a=>`<li><b>${pth(a.x,a.k)}</b> <small class="rzGapN">${a.n}× ${side(a.x.col)}, výhry ${pct(a)} %</small><small>Na tenhle tah soupeře nemáš v kurzech odpověď.</small><span class="rzGapB"><button class="btn" data-game="${escH(a.last.url)}" data-k="${a.k}">Ukázat partii</button><button class="btn primary" data-gapgo="${escH(a.x.sans.slice(0,a.k).join(' '))}" data-gapcol="${a.x.col}">Najít odpověď</button></span></li>`;
 const devLi=(a,i)=>`<li><b>${pth(a.x,a.r.k)||'Na začátku'}</b> <small class="rzGapN">${a.n}× ${side(a.x.col)}, výhry ${pct(a)} %</small><small>Hraješ ${rzMvLab(a.r.my,a.r.k)}, v kurzu ${escH(a.r.ent.x.c.title)} je ${a.r.want.map(w=>rzMvLab(w,a.r.k)).join(' nebo ')}.</small><span class="rzGapB"><button class="btn" data-gapdev="${i}">Ukázat v partii</button><button class="btn primary" data-practice="${a.lr.ent.x.c.id}|${a.lr.ent.x.l.id}">Procvičit</button></span></li>`;
 el.innerHTML=`<div class="profCard rzGap"><h2>Mezery v repertoáru</h2><p class="profEmpty">Kde ve vybraných ${G.length} partiích končí tvoje kurzy. Nejčastější místa nahoře.</p>
 ${GL.length?`<h3 class="rzH3">Tady ti chybí příprava</h3><ul class="lst rzGapL">${GL.map(gapLi).join('')}</ul>`:''}
 ${DL.length?`<h3 class="rzH3">Tady přípravu máš, ale hraješ jinak</h3><ul class="lst rzGapL">${DL.map(devLi).join('')}</ul>`:''}</div>`;}
/* g) prohlížeč partie */
function rzOpen(url,k){const x=RZ.all&&RZ.all.find(g=>g.url===url);if(!x)return;RZ.view={x,k:k==null?0:k};rzRenderV(true);}
function rzRenderV(scroll){const V=$('rzV');if(!V)return;if(!RZ.view){V.hidden=true;V.innerHTML='';V.dataset.u='';return;}
 if(!CHESS){V.hidden=false;V.innerHTML='<div class="profCard"><p class="profEmpty">Načítám…</p></div>';chessLib().then(()=>{if(page==='rozbor')rzRenderV(scroll);}).catch(()=>{});return;}
 const x=RZ.view.x;V.hidden=false;
 if(V.dataset.u!==x.url){V.dataset.u=x.url;
  V.innerHTML=`<div class="exWrap rzVW"><div class="exLeft"><div class="profCard"><div class="xRow"><div class="boardWrap"><div class="board" id="xBoard"><div class="sqs" id="xSqs"></div><svg class="arrows" id="xArrows" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="pcs" id="xPcs"></div></div></div></div>
  <div class="exCtl"><button class="btn" id="rvS" title="Na začátek">⏮</button><button class="btn" id="rvB" title="Tah zpět (←)">◀</button><button class="btn" id="rvF" title="Tah vpřed (→)">▶</button><button class="btn" id="rvE" title="Na konec">⏭</button></div></div></div>
  <div class="exRight"><div class="profCard"><h2>${x.col==='w'?escH(x.me)+' – '+escH(x.opp):escH(x.opp)+' – '+escH(x.me)} <small class="exCnt">${rzDate(x.end)}</small></h2><p class="profEmpty">${RZ_TC[x.tc]||x.tc} · ${x.res==='W'?'výhra':x.res==='L'?'prohra':'remíza'} (${RZ_WHY[x.reason]||x.reason})${x.eco?' · '+escH(x.eco):''}</p>
  <div class="engBox" id="rvInfo"></div><div class="exMoves rzMoves" id="rvMoves"></div><div class="rzVBtns"><button class="btn primary" id="rvFromRz">Rozbor partie</button><a class="btn" href="${escH(x.url)}" target="_blank" rel="noopener">Otevřít na chess.com</a><button class="btn" id="rvX">Zavřít</button></div></div></div></div>`;
  xBuild();xInput();
  $('rvS').onclick=()=>rzVGo(0);$('rvB').onclick=()=>rzVGo(RZ.view.k-1);$('rvF').onclick=()=>rzVGo(RZ.view.k+1);$('rvE').onclick=()=>rzVGo(x.N);$('rvX').onclick=()=>{RZ.view=null;rzRenderV();};$('rvFromRz').onclick=()=>rvOpen({sans:x.sans,w:x.col==='w'?x.me:x.opp,b:x.col==='b'?x.me:x.opp,me:x.col,src:'cc'});
  $('rvMoves').onclick=e=>{const b=e.target.closest('.exMv');if(b)rzVGo(+b.dataset.k);};}
 rzVSet();if(scroll)V.scrollIntoView({block:'start',behavior:'smooth'});}
function rzVGo(k){if(!RZ.view)return;RZ.view.k=Math.max(0,Math.min(RZ.view.x.N,k));rzVSet();sfx('move');}
function rzVMarks(x){const em=rzEngMarks(x);const m={};if(em)em.forEach(e=>{m[e.k]={c:e.miss&&e.cls!=='b'?'m':e.cls,best:e.best,miss:e.miss,eng:true};});else x.bl.forEach(b=>{m[b.k]={c:'b',lost:b.lost,kind:b.kind};});return m;}
function rzVSet(){const V=RZ.view;if(!V||!$('xBoard'))return;const x=V.x,k=V.k;const g=new CHESS();for(let i=0;i<k;i++){try{g.move(x.sans[i],{strict:false});}catch(e){break;}}RZ.vg=g;xMorph();
 const M=rzVMarks(x);const mk=M[k];const SYM={b:'??',m:'?',i:'?!'};const KIND={b:'bad',m:'bad',i:'alt'};
 if(mk&&k>0){const el=document.createElement('div');el.className='badge '+KIND[mk.c];xPlace(el,x.mv[k-1].t);el.innerHTML=`<span>${ICON[KIND[mk.c]]||''}</span>`;$('xPcs').appendChild(el);}
 const dv=V.dev&&k===V.dev.k+1?V.dev:null;let dvW=[];if(dv){try{const g2=new CHESS(x.fens[k-1]+' 0 1');dv.want.forEach(w=>{const m=new CHESS(g2.fen()).move(w,{strict:false});if(m)dvW.push(m);});}catch(e){}}
 xArrow(dv&&dvW[0]?dvW[0].from+dvW[0].to:mk&&mk.best?mk.best:null,dv?'green':undefined);
 const info=$('rvInfo');if(info&&dv){info.innerHTML=`<b>Tady jsi odbočil z repertoáru.</b> Zahrál jsi <b>${rzMvLab(x.sans[k-1],k-1)}</b>, v kurzu ${escH(dv.ent.x.c.title)} je <b>${dv.want.map(w=>rzMvLab(w,k-1)).join(' nebo ')}</b> (zelená šipka).<br><button class="btn" data-practice="${dv.ent.x.c.id}|${dv.ent.x.l.id}">Procvičit tuhle variantu</button>`;}
 else if(info){const NM={b:'hrubá chyba',m:'chyba',i:'nepřesnost'};
  info.innerHTML=k===0?'Výchozí pozice. Šipkami ← → procházíš tahy.':`<b>${rzMvLab(x.sans[k-1],k-1)}${mk?SYM[mk.c]:''}</b> ${mk?`– ${mk.miss?'promarněná šance, ':''}${NM[mk.c]}${mk.eng?(mk.best?`, lepší bylo <b>${czSan(sanOf(x.fens[k-1]+' 0 1',mk.best))}</b> (šipka)`:''):(mk.kind==='mate'?', soupeř dal mat':mk.lost?`, do dvou tahů ztráta ${RZ_GEN[mk.lost]}`:', ztráta materiálu')}`:''}<br><small>Materiál: ${x.mat[k]>0?'+':''}${x.mat[k]}${x.clk[k-1]!=null?` · hodiny po tahu ${rzClk(x.clk[k-1])}`:''}</small>`;}
 const mv=$('rvMoves');if(mv){mv.innerHTML=x.sans.map((s,i)=>{const q=M[i+1];return (i%2===0?`<b>${i/2+1}.</b>`:'')+`<button class="exMv${i+1===k?' cur':''}${q?' q-'+q.c:''}" data-k="${i+1}">${czSan(s)}${q?SYM[q.c]:''}</button>`;}).join(' ');
  const c=mv.querySelector('.cur');if(c){const r=c.getBoundingClientRect(),R=mv.getBoundingClientRect();if(r.top<R.top||r.bottom>R.bottom)mv.scrollTop+=r.top-R.top-R.height/2;}}}
addEventListener('keydown',e=>{if(page!=='rozbor'||!RZ.view||(e.target&&/input|textarea|select/i.test(e.target.tagName)))return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){rzVGo(RZ.view.k+(e.key==='ArrowLeft'?-1:1));e.preventDefault();e.stopImmediatePropagation();}},true);
function rzClick(e){const t=e.target;if(t.closest('a'))return;
 const gg=t.closest('[data-gapgo]');if(gg){EX.moves=gg.dataset.gapgo.split(' ').filter(Boolean);EX.flip=gg.dataset.gapcol==='b';XB.redo=[];go('#hledat');return;}
 const gd=t.closest('[data-gapdev]');if(gd){const a=(RZ.gapDev||[])[+gd.dataset.gapdev];if(a){RZ.view={x:a.last,k:a.lr.k+1,dev:a.lr};rzRenderV(true);}return;}
 const cell=t.closest('td.ck');if(cell){const i=cell.querySelector('input');if(!i)return;if(t!==i)i.checked=!i.checked;if(i.checked)RZ.chk.add(i.dataset.chk);else RZ.chk.delete(i.dataset.chk);rzPickUpd();return;}
 const pk=t.closest('[data-pk]');if(pk){const L=rzFL(),v=pk.dataset.pk;RZ.chk=new Set(v==='none'?[]:v==='all'?L.map(x=>x.url):v==='last20'?L.slice(0,20).map(x=>x.url):L.filter(x=>x.res===v).map(x=>x.url));const fs=document.getElementById('rzPkFam');if(fs)fs.value='';rzPickUpd();return;}
 if(t.id==='rzPickGo'){rzApply();return;}
 if(t.id==='rzLMore'){RZ.lim+=25;rzRenderL();return;}
 const dv=t.closest('[data-rzdev]');if(dv){const d=(RZ.devs||[])[+dv.dataset.rzdev];if(d){RZ.view={x:d.x,k:d.r.k+1,dev:d.r};rzRenderV(true);}return;}
 const gm=t.closest('[data-game]');if(gm){rzOpen(gm.dataset.game,gm.dataset.k!=null?+gm.dataset.k:null);return;}
 const nd=t.closest('[data-node]');if(nd){const key=nd.dataset.node;const card=nd.classList.contains('rzCard');
  if(card){const c=key[0],p=key.slice(2).split(' ');for(let i=1;i<p.length;i++)RZ.open.add(c+':'+p.slice(0,i).join(' '));}else if(RZ.open.has(key)&&RZ.sel&&RZ.sel.key===key)RZ.open.delete(key);else RZ.open.add(key);
  RZ.sel={type:'node',key};RZ.showAll=false;rzRenderB();if(card||IS_MOBILE||innerWidth<900){const d=$('rzDet');if(d&&card)d.scrollIntoView({block:'start',behavior:'smooth'});}return;}
 const fm=t.closest('[data-fam]');if(fm){const [c,f]=fm.dataset.fam.split('|');RZ.sel={type:'fam',side:c,fam:f};RZ.showAll=false;rzRenderB();const d=$('rzDet');if(d)d.scrollIntoView({block:'start',behavior:'smooth'});return;}
 const pr=t.closest('[data-practice]');if(pr){const [cid,lid]=pr.dataset.practice.split('|');const c=COURSES.find(q=>q.id===cid);if(!c)return;course=c;page='course';history.pushState(null,'','#'+c.id);flipped=c.side==='b';const l=LINES().find(q=>q.id===lid);if(l)openLine(l);return;}
 if(t.id==='rzMore'){RZ.showAll=true;rzRenderC();}}
