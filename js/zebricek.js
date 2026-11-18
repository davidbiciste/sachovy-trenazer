/* Odznaky (#odznaky, staré #zebricek přesměruje sem). Veřejný žebříček s kamarády byl 18. 11. 2026 večer na přání majitele zrušen.
   Odznaky BADGES se počítají v lbTick() (volá ho save(), max. 1× za 15 s, a úvod), získané v store.badges {id: 'RRRR-MM-DD'}; nový odznak = toast. */
const lbDay=i=>new Date(Date.now()-i*864e5).toISOString().slice(0,10);
function lbStreak(){const d=store.xpDay||{},a=store.act||{};let n=0;for(let i=0;i<400;i++){const k=lbDay(i);if((d[k]||0)>0||(a[k]||0)>0)n++;else if(i>0)break;}return n;}
function lbVars(){let n=0;for(const c of COURSES){if(/^cv/.test(c.id))continue;for(const ch of c.chapters)for(const l of ch.lines){const s=stateIn(c,l);if(s==='done'||s==='due')n++;}}return n;}
function lbData(){const s=pqStore();return{st:lbStreak(),pz:s.ok||0,v:lbVars(),rush:Math.max(0,...Object.values(s.rush||{}).map(x=>+x||0)),own:Object.keys(s.own||{}).length,
 tu:Object.keys(store.tu||{}).length,guess:(store.guess||[]).length,xp:store.xp||0,kurz:COURSES.filter(c=>!/^cv/.test(c.id)&&courseProg(c)===100).length};}
/* [id, název, jak ho získat, podmínka, ikona] */
const BADGES=[
 ['v1','První varianta','Nauč se první variantu z kurzu',d=>d.v>=1,'book'],
 ['v25','25 variant','Umíš 25 variant',d=>d.v>=25,'book'],
 ['v100','100 variant','Umíš 100 variant',d=>d.v>=100,'book'],
 ['kurz','Celý kurz','Dotáhni jeden kurz na 100 %',d=>d.kurz>=1,'king'],
 ['s3','3 dny v řadě','Trénuj tři dny po sobě',d=>d.st>=3,'bars'],
 ['s7','Týden v řadě','Trénuj sedm dní po sobě',d=>d.st>=7,'bars'],
 ['s30','Měsíc v řadě','Trénuj třicet dní po sobě',d=>d.st>=30,'bars'],
 ['p10','10 úloh','Vyřeš 10 úloh v Puzzle',d=>d.pz>=10,'trap'],
 ['p100','100 úloh','Vyřeš 100 úloh v Puzzle',d=>d.pz>=100,'trap'],
 ['p500','500 úloh','Vyřeš 500 úloh v Puzzle',d=>d.pz>=500,'trap'],
 ['rush','Rychlík','V Puzzle Rush vyřeš 15 a víc',d=>d.rush>=15,'trap'],
 ['moje','Poučený z chyb','Vyřeš 10 úloh ze svých partií',d=>d.own>=10,'chart'],
 ['l10','Student','Dokonči 10 lekcí',d=>d.tu>=10,'book'],
 ['odhad','Změřeno','Zahraj Odhad Elo',d=>d.guess>=1,'elo'],
 ['xp1k','1 000 XP','Nasbírej 1 000 XP',d=>d.xp>=1000,'elo'],
 ['xp10k','10 000 XP','Nasbírej 10 000 XP',d=>d.xp>=10000,'elo']];
const LB={t:0};
function lbTick(force){if(!force&&Date.now()-LB.t<15000)return;LB.t=Date.now();let d;try{d=lbData();}catch(e){return;}
 store.badges=store.badges||{};const fresh=[];for(const b of BADGES)if(!store.badges[b[0]]&&b[3](d)){store.badges[b[0]]=lbDay(0);fresh.push(b);}
 if(store.lb)delete store.lb;
 if(fresh.length&&typeof toast==='function'&&LB.ready)setTimeout(()=>toast(fresh.length===1?`Nový odznak: ${fresh[0][1]}`:`Nové odznaky: ${fresh.map(b=>b[1]).join(', ')}`),300);
 LB.ready=true;return fresh.length>0;}
function lbBadgeHTML(b,got){return `<div class="lbBadge${got?' got':''}" title="${escH(b[2])}"><span class="lbBIc">${NX_IC[b[4]]||''}</span><b>${escH(b[1])}</b><small>${got?'Získáno '+new Date(got).toLocaleDateString('cs-CZ'):escH(b[2])}</small></div>`;}
function lbBadgesHTML(){const B=store.badges||{};const got=BADGES.filter(b=>B[b[0]]).length;
 return `<div class="profCard lbCard"><h2>Odznaky <small class="lbCnt">${got} z ${BADGES.length}</small></h2><div class="lbBadges">${BADGES.map(b=>lbBadgeHTML(b,B[b[0]])).join('')}</div></div>`;}
function renderLb(){document.body.classList.add('homeMode');lbTick(true);$('home').innerHTML=`<a class="backAll" href="#">← Domů</a>${lbBadgesHTML()}`;renderSide();}
