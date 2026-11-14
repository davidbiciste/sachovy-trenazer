/* Test stránky Rozbor hráče. Spuštění:
   python3 -m http.server 8765 --bind 127.0.0.1   (v kořeni repozitáře, v jiném terminálu)
   node tests/rozbor.test.js
   api.chess.com je nahrazené uloženými odpověďmi z tests/fixtures (účet gengstrdavca, stav 14. 11. 2026). */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const FX=path.join(__dirname,'fixtures')+'/';const URL='http://localhost:8765/';
async function mock(ctx,offline){
 await ctx.route('**/supabase.min.js',r=>r.fulfill({body:"window.supabase={createClient(){return{rpc:async(fn)=>fn==='trener_load'?{data:{username:'test',data:null}}:{data:null}}}}",contentType:'application/javascript'}));
 await ctx.addInitScript(()=>localStorage.setItem('trener-token','tok'));
 await ctx.route('https://api.chess.com/**',r=>{if(offline)return r.abort('internetdisconnected');const m=r.request().url().match(/player\/([^/]+)\/(.*)$/);const H={'access-control-allow-origin':'*','content-type':'application/json'};
  if(!m||m[1]!=='gengstrdavca')return r.fulfill({status:404,headers:H,body:'{}'});
  const f=m[2]==='games/archives'?'archives.json':m[2]==='stats'?'stats.json':m[2].startsWith('games/')?'games-'+m[2].slice(6).replace('/','-')+'.json':null;
  if(!f||!fs.existsSync(FX+f))return r.fulfill({status:404,headers:H,body:'{}'});return r.fulfill({status:200,headers:H,body:fs.readFileSync(FX+f)});});}
let fail=0;const ok=(c,t)=>{console.log((c?'OK   ':'CHYBA ')+t);if(!c)fail++;};
(async()=>{const b=await chromium.launch();const errs=[];
 const page=async(offline,vp)=>{const ctx=await b.newContext({viewport:vp||{width:1440,height:900}});await mock(ctx,offline);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return [ctx,p];};
 let [ctx,p]=await page();await p.goto(URL+'#rozbor/gengstrdavca');await p.waitForSelector('#rzA .rzTbl',{timeout:20000});
 const r=await p.evaluate(()=>{const G=rzF(),c=k=>G.filter(x=>x.res===k).length,T={w:rzTree(G,'w'),b:rzTree(G,'b')};const nd=(t,a)=>{let n=T[t];for(const m of a)n=n&&n.kids.get(m);return n||{};};
  const why={};G.filter(x=>x.res==='L').forEach(x=>why[x.reason]=(why[x.reason]||0)+1);return{n:G.length,W:c('W'),L:c('L'),D:c('D'),d4:nd('b',['d4']),f4:nd('w',['e4','e5','Nc3','Nf6','f4']),d5:nd('w',['e4','d5']),why,
  coach:RZ.all.filter(x=>x.bot).length};});
 ok(r.n===113&&r.W===60&&r.L===50&&r.D===3,`113 partií, 60/50/3 (je ${r.n}, ${r.W}/${r.L}/${r.D})`);
 ok(r.d4.n===8&&r.d4.w===0,'za černé proti 1.d4: 8 partií, 0 výher');
 ok(r.f4.n===4&&r.f4.w===4,'za bílé 1.e4 e5 2.Nc3 Nf6 3.f4: 4 ze 4');
 ok(r.d5.w===2&&r.d5.l===7,'za bílé proti 1...d5: 2 výhry, 7 proher');
 ok(r.why.checkmated===27&&r.why.timeout===17&&r.why.resigned===6,'prohry: 27 mat, 17 čas, 6 vzdání');
 await p.click('#rzTempo [data-tc="daily"]');await p.click('#rzGo');await p.waitForFunction(()=>RZ.all&&RZ.tempo.includes('daily')&&!RZ.loading);
 const dl=await p.evaluate(()=>({all:RZ.all.filter(x=>x.tc==='daily').length,shown:rzF().filter(x=>x.tc==='daily').length,coach:rzF().filter(x=>/^coach-/i.test(x.opp)).length}));
 ok(dl.all>0&&dl.coach===0,`daily proti Coach-David ve výchozím stavu vynechané (${dl.all} daily, zobrazeno ${dl.shown})`);
 await p.click('#rzTempo [data-tc="daily"]');await p.click('#rzGo');await p.waitForFunction(()=>RZ.all&&!RZ.tempo.includes('daily')&&!RZ.loading);
 await p.click('#rzEngN button[data-en="5"]');await p.click('#rzEngGo');await p.waitForFunction(()=>!RZ.eng.busy,null,{timeout:300000});
 ok(await p.evaluate(()=>Object.keys(RZ.eng.res).length)===5,'přesný rozbor 5 partií doběhl');
 await p.reload();await p.waitForSelector('#rzA .rzTbl');ok(await p.evaluate(()=>Object.keys(RZ.eng.res).length)===5,'po reloadu se rozbor načetl z cache');
 await p.click('#rzEngN button[data-en="30"]');await p.click('#rzEngGo');await p.waitForTimeout(800);await p.click('#rzEngX');await p.waitForTimeout(300);
 const n1=await p.evaluate(()=>Object.keys(RZ.eng.res).length);await p.waitForTimeout(1500);ok(!(await p.evaluate(()=>RZ.eng.busy))&&n1===await p.evaluate(()=>Object.keys(RZ.eng.res).length),'rozbor enginem jde zrušit');
 await ctx.close();
 [ctx,p]=await page();await p.goto(URL+'#rozbor/neexistujici-hrac');await p.waitForSelector('.rzMsg');ok((await p.textContent('.rzMsg')).includes('Hráč nenalezen'),'neexistující jméno: Hráč nenalezen');await ctx.close();
 [ctx,p]=await page(true);await p.goto(URL+'#rozbor/gengstrdavca');await p.waitForSelector('.rzMsg');ok((await p.textContent('.rzMsg')).includes('spojit'),'bez sítě: hláška o připojení');await ctx.close();
 [ctx,p]=await page(false,{width:402,height:874});await p.goto(URL+'#rozbor/gengstrdavca');await p.waitForSelector('#rzA .rzTbl');await p.click('.rzCard');await p.click('.rzGames tbody tr');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'iPhone: nic nepřetéká do strany');await ctx.close();
 ok(!errs.length,'bez chyb v konzoli '+errs.join(' | '));await b.close();process.exit(fail?1:0);})();
