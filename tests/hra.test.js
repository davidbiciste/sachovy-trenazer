/* Test Hry s kamarádem (#hra) – dva prohlížeče proti skutečným SQL funkcím ze supabase.sql v místním PostgreSQL.
   Příprava (jednou): místní PostgreSQL na /tmp:5433 se spuštěným supabase.sql (role anon, authenticated a schéma extensions musí existovat).
   Spuštění: python3 -m http.server 8765 --bind 127.0.0.1  (v kořeni repozitáře, v jiném terminálu), pak node tests/hra.test.js
   Supabase klient je nahrazený: rpc jde přes malý server na portu 8766, který volá funkce přes psql. Realtime je vypnutý (testuje se záložní dotazování). */
const {chromium}=require('playwright');const http=require('http');const {execFileSync}=require('child_process');
const URL='http://localhost:8765/';const SHOTS=process.env.SHOTS||'/tmp/hra-shots';require('fs').mkdirSync(SHOTS,{recursive:true});
const psql=sql=>execFileSync('psql',['-h','/tmp','-p','5433','-U','postgres','-At','-q','-c',sql],{encoding:'utf8'}).trim();
const lit=v=>v===null||v===undefined?'NULL':`'${(typeof v==='object'?JSON.stringify(v):String(v)).replace(/'/g,"''")}'`;
const srv=http.createServer((q,r)=>{const H={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'};if(q.method==='OPTIONS'){r.writeHead(204,H);return r.end();}
 let b='';q.on('data',c=>b+=c);q.on('end',()=>{const fn=q.url.slice(1).replace(/[^a-z0-9_]/g,'');const a=JSON.parse(b||'{}');const call=`public.${fn}(${Object.entries(a).map(([k,v])=>`${k.replace(/[^a-z0-9_]/g,'')} => ${lit(v)}`).join(', ')})`;
  let out;try{try{out={data:JSON.parse(psql(`select coalesce(${call}::text,'null')`)||'null')};}catch(e){if(/void/.test(String(e.stderr))){psql(`select ${call}`);out={data:null};}else throw e;}}
  catch(e){out={error:String(e.stderr||e.message).split('\n').find(l=>/ERROR/.test(l))||'error'};}
  r.writeHead(200,H);r.end(JSON.stringify(out));});}).listen(8766);
const FAKE=`window.supabase={createClient(){return{rpc:async(fn,args)=>{const r=await fetch('http://127.0.0.1:8766/'+fn,{method:'POST',body:JSON.stringify(args||{})});const j=await r.json();return j.error?{data:null,error:{message:j.error}}:{data:j.data,error:null};},channel(){const c={on(){return c},subscribe(){return c},send(){}};return c;},removeChannel(){}}}}`;
let fail=0;const ok=(c,t)=>{console.log((c?'OK   ':'CHYBA ')+t);if(!c)fail++;};
(async()=>{const b=await chromium.launch();const errs=[];const sfx=Date.now().toString(36).slice(-6);
 const reg=n=>JSON.parse(psql(`select trener_register('${n}','heslo123')::text`)).token;const ta=reg('ta'+sfx),tb=reg('tb'+sfx);
 const mk=async(tok,vp,dark)=>{const ctx=await b.newContext({viewport:vp||{width:1440,height:900},colorScheme:dark?'dark':'light'});await ctx.route('**/supabase.min.js',r=>r.fulfill({body:FAKE,contentType:'application/javascript'}));
  await ctx.addInitScript(t=>{if(t)localStorage.setItem('trener-token',t);localStorage.setItem('trener-was-in','1');},tok);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message+' @ '+String(e.stack).split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_/.test(m.text()))errs.push(m.text());});return p;};
 const A=await mk(ta),B=await mk(tb,{width:390,height:844},true);
 const mv=async(p,f,t)=>{await p.locator('#xBoard').scrollIntoViewIfNeeded();const fl=await p.evaluate(()=>xFlip());const bx=await p.locator('#xBoard').boundingBox();const s=bx.width/8;const xy=q=>{const c=q.charCodeAt(0)-97,r=+q[1]-1;return [bx.x+(fl?7-c:c)*s+s/2,bx.y+(fl?r:7-r)*s+s/2];};
  await p.mouse.click(...xy(f));await p.mouse.click(...xy(t));await p.waitForTimeout(150);};
 const h2=p=>p.$eval('#lvPanel h2',e=>e.textContent);
 await A.goto(URL+'#hra');await A.waitForSelector('#lvCreate',{timeout:20000});
 await A.click('[data-lvt="3+2"]');await A.click('[data-lvc="w"]');await A.screenshot({path:SHOTS+'/lobby-desktop.png',fullPage:true});
 await A.click('#lvCreate');await A.waitForFunction(()=>/#hra\/[a-z0-9]{7}$/.test(location.hash),null,{timeout:10000});const code=await A.evaluate(()=>location.hash.slice(5));
 await A.waitForSelector('#lvLinkIn');ok((await A.$eval('#lvLinkIn',e=>e.value)).endsWith('#hra/'+code),'čekání: odkaz pro kamaráda');await A.screenshot({path:SHOTS+'/cekani-desktop.png'});
 await B.goto(URL+'#hra/'+code);await B.waitForFunction(()=>LV.s&&LV.s.status==='play',null,{timeout:10000});
 await A.waitForFunction(()=>LV.s&&LV.s.status==='play',null,{timeout:5000});ok(true,'kamarád otevřel odkaz a hra začala u obou');
 ok(await A.evaluate(()=>LV.s.me==='w'&&!xFlip())&&await B.evaluate(()=>LV.s.me==='b'&&xFlip()),'barvy a otočení šachovnice (bílý dole / černý dole)');
 ok((await A.$eval('#lvClkB .lvTime',e=>e.textContent))==='3:00','hodiny ukazují 3:00');
 await mv(B,'e7','e5');ok(await B.evaluate(()=>LV.g.history().length===0&&LV.pre&&LV.pre.to==='e5'),'černý mimo tah netáhne, ale uloží si předtah e5');
 await mv(A,'f2','f3');await A.waitForFunction(()=>LV.g.history().length===2,null,{timeout:6000});ok(await A.evaluate(()=>LV.g.history().join(' ')==='f3 e5'),'tah bílého dorazil černému a předtah e5 se hned zahrál');
 await A.waitForTimeout(1500);const wt=await A.$eval('#lvClkB .lvTime',e=>e.textContent);ok(/^2:5[0-9]$/.test(wt)&&await A.$eval('#lvClkB',e=>e.classList.contains('run')),'po prvním tahu černého běží bílému čas ('+wt+')');
 await mv(B,'d8','h4');ok(await B.evaluate(()=>LV.pre&&LV.pre.from==='d8'&&LV.pre.to==='h4'&&document.querySelectorAll('#xSqs > .pre').length===2),'předtah: černý si naplánoval Dh4, pole jsou zvýrazněná');
 await B.screenshot({path:SHOTS+'/predtah-mobil-tmavy.png'});
 await mv(A,'g2','g4');
 const inc=JSON.parse(psql(`select json_build_object('w',wtime) from live_games where code='${code}'`)).w;ok(inc>177500&&inc<182000,'přičtení 2 s za tah ('+inc+' ms = 3:00 − přemýšlení + 2 s)');
 await A.waitForFunction(()=>LV.s.status==='end',null,{timeout:5000});await B.waitForFunction(()=>LV.s.status==='end',null,{timeout:5000});ok(await B.evaluate(()=>LV.g.history().join(' ')==='f3 e5 g4 Qh4#'),'předtah se zahrál hned po tahu bílého (mat)');
 ok(/Prohrál jsi/.test(await h2(A))&&/Vyhrál jsi/.test(await h2(B)),'mat: bílý prohrál, černý vyhrál');ok(/matem/.test(await A.$eval('#lvPanel',e=>e.textContent)),'důvod: konec matem');
 await A.screenshot({path:SHOTS+'/konec-desktop.png'});
 await A.click('[data-lva="rematch"]');await B.waitForSelector('[data-lva="rematch"]');await B.waitForFunction(()=>LV.s.remo==='w',null,{timeout:5000});await B.click('[data-lva="rematch"]');
 await A.waitForFunction(c=>LV.code&&LV.code!==c&&LV.s&&LV.s.code===LV.code,code,{timeout:8000});await B.waitForFunction(c=>LV.code&&LV.code!==c&&LV.s&&LV.s.code===LV.code,code,{timeout:8000});
 const c2=await A.evaluate(()=>LV.code);ok(c2===await B.evaluate(()=>LV.code)&&await A.evaluate(()=>LV.s.me==='b')&&await B.evaluate(()=>LV.s.me==='w'),'odveta: oba v nové hře s prohozenými barvami');
 await B.click('[data-lva="draw"]');await A.waitForSelector('.lvOffer',{timeout:5000});await A.click('[data-lva="nodraw"]');await B.waitForFunction(()=>!LV.s.draw,null,{timeout:5000});ok(true,'nabídka remízy a odmítnutí');
 await mv(A,'g8','f6');ok(await A.evaluate(()=>!!LV.pre),'předtah černého v nové hře');await mv(A,'a3','a3');ok(await A.evaluate(()=>!LV.pre&&!document.querySelector('#xSqs > .pre')),'klik na šachovnici předtah zruší');
 await mv(B,'e2','e4');await A.waitForFunction(()=>LV.g.history().length===1,null,{timeout:5000});await mv(A,'e7','e5');await B.waitForFunction(()=>LV.g.history().length===2,null,{timeout:5000});
 psql(`update live_games set wtime=1500 where code='${c2}'`);await B.evaluate(()=>lvFetch());
 await B.waitForFunction(()=>LV.s.status==='end',null,{timeout:8000});await A.waitForFunction(()=>LV.s.status==='end',null,{timeout:8000});
 ok(/Prohrál jsi/.test(await h2(B))&&/na čas/.test(await B.$eval('#lvPanel',e=>e.textContent))&&/Vyhrál jsi/.test(await h2(A)),'konec na čas');
 ok(await A.evaluate(()=>{const n=document.getElementById('lvNav');return !!n&&!!n.closest('.lvBoardCard');}),'tlačítka na posouvání jsou pod šachovnicí');
 const keep=await A.evaluate(()=>{window.__pc=Object.values(XB.pcs).find(e=>e.dataset.p==='wK');return !!window.__pc;});
 await A.click('[data-lvn="b"]');ok(keep&&await A.evaluate(()=>window.__pc.isConnected&&Object.values(XB.pcs).includes(window.__pc)),'procházení zpět: figury se posouvají (stejné prvky), ne překreslují');
 await A.click('#lvLiveB');
 await A.click('[data-lvn="s"]');ok(await A.evaluate(()=>LV.vw===0&&xGame().history().length===0),'tlačítko Na začátek ukáže výchozí pozici');
 await A.click('[data-lvn="f"]');ok(await A.evaluate(()=>LV.vw===1),'tlačítko Tah vpřed');await A.click('#lvLiveB');ok(await A.evaluate(()=>LV.vw===null),'Zpět k partii');
 await A.click('#lvReview');await A.waitForFunction(()=>page==='review',null,{timeout:5000});ok(true,'Rozbor partie otevře odehranou partii');
 const ub=psql(`select p.username from players p join player_sessions s on s.player_id=p.id where s.token='${tb}'`);
 await A.goto(URL+'#hra');await A.waitForSelector('#lvWhoIn');await A.waitForSelector('[data-lvfr]',{timeout:8000});ok(true,'návrh jména kamaráda, se kterým jsem hrál');
 await A.click('[data-lvfr]');ok((await A.$eval('#lvCreate',e=>e.textContent))==='Vyzvat '+ub,'tlačítko Vyzvat <jméno>');
 await A.click('#lvCreate');await A.waitForFunction(()=>LV.s&&LV.s.status==='wait'&&LV.s.iname,null,{timeout:8000});ok(/Čekám na/.test(await h2(A)),'vyzyvatel čeká na přijetí');const c3=await A.evaluate(()=>LV.code);
 await B.evaluate(()=>lvInvCheck());await B.waitForSelector('#lvInvBar',{timeout:8000});ok(/vyzývá/.test(await B.$eval('#lvInvBar',e=>e.textContent)),'kamarádovi vyskočila výzva');await B.screenshot({path:SHOTS+'/vyzva-mobil-tmavy.png'});
 await B.click('#lvInvBar [data-lvinv="no"]');await A.waitForFunction(()=>LV.s.status==='end'&&LV.s.reason==='declined',null,{timeout:8000});ok(/odmítl/.test(await h2(A)),'odmítnutí výzvy vidí vyzyvatel');
 await A.goto(URL+'#hra');await A.waitForSelector('#lvWhoIn');await A.fill('#lvWhoIn',ub);await A.click('#lvCreate');await A.waitForFunction(()=>LV.s&&LV.s.status==='wait',null,{timeout:8000});
 await B.evaluate(()=>lvInvCheck());await B.waitForSelector('#lvInvBar a',{timeout:8000});await B.click('#lvInvBar a');await B.waitForFunction(()=>LV.s&&LV.s.status==='play',null,{timeout:8000});await A.waitForFunction(()=>LV.s.status==='play',null,{timeout:8000});ok(true,'přijetí výzvy spustí hru u obou');
 await A.goto(URL+'#hra');await A.waitForSelector('#lvMine .lvList li',{timeout:8000});ok((await A.$$('#lvMine .lvList li')).length>=2,'seznam Tvoje hry');
 await B.goto(URL+'#hra');await B.waitForSelector('#lvMine .lvList li',{timeout:8000});await B.screenshot({path:SHOTS+'/lobby-mobil-tmavy.png',fullPage:true});
 const G=await mk(null);await G.goto(URL+'#hra/'+code);await G.waitForSelector('#lvLogin',{timeout:10000});ok(true,'nepřihlášený vidí výzvu k přihlášení');
 ok(!errs.length,'bez chyb v konzoli'+(errs.length?': '+errs.slice(0,5).join(' | '):''));
 await b.close();srv.close();console.log(fail?fail+' chyb':'Vše v pořádku');process.exit(fail?1:0);})().catch(e=>{console.error(e);process.exit(1);});
