// Fast deterministic tests; no browser, external packages or network required.
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert");
const ctx = {
  console,
  Math,
  JSON,
  Number,
  String,
  Object,
  Array,
  Set,
  Map,
  Date,
  Blob,
  assert,
  localStorage: {
    setItem() {},
    getItem() {
      return null;
    },
  },
  renderHUD() {},
  syncRoom() {},
  showToast() {},
  renderJournalBadge() {},
  updatePhase() {},
  showEnd() {},
  closePanel() {},
  openLeisure() {},
  openInventory() {},
  openStation() {},
  refreshPanel() {},
  buildRoom() {},
  setFirstPerson() {},
  getPlayerPosition() {
    return null;
  },
};
vm.createContext(ctx);
for (const f of ["src/data.js", "src/core.js", "src/life-text.js", "src/life.js", "src/life-more.js", "src/life-real.js", "src/life-home.js"])
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
vm.runInContext(
  `
let assertions=0;function ok(value,msg){assert.ok(value,msg);assertions++;}
function reset(seed='ANDERS-1986',kit=STARTER){closePreparation();phase='title';currentSeed=seed;env=environment(seed);startPreparation();cart={...kit};beginGame();for(const b of G.inv){b.packed=false;b.location=DB[b.id].kind==='food'&&DB[b.id].life<60&&env.fridge?'fridge':'shelf';}G.bags.forEach(b=>b.opened=true);G.cooldowns={};}
saveGame=()=>{};
ok(CATALOG.length===133,'catalog count');ok(new Set(CATALOG.map(i=>i.id)).size===CATALOG.length,'unique ids');ok(CATALOG.every(i=>i.price>0&&i.weight>0&&Number.isInteger(i.servings)&&i.servings>0),'valid product data');
for(let i=0;i<100;i++){const seed='test-'+i;ok(JSON.stringify(environment(seed))===JSON.stringify(environment(seed)),'seed deterministic');}
const envs=Array.from({length:100},(_,i)=>environment('t'+i));ok(envs.some(e=>!e.fridge)&&envs.some(e=>e.fridge),'fridge varies');ok(new Set(envs.map(e=>e.temp)).size>12,'temperature varies');
for(const kit of [STARTER,YEAR_KIT,Object.fromEntries(CATALOG.map(i=>[i.id,3]))]){const p=packCart(kit);ok(p.bags.every(b=>b.weight<=8),'all bags <=8kg');ok(p.total.reduce((a,b)=>a+Object.values(b.items).reduce((a,n)=>a+n,0),0)===Object.values(kit).reduce((a,n)=>a+n,0),'no lost packages');}
ok(cartSummary(YEAR_KIT).cost<=300&&cartSummary(YEAR_KIT).days>=365,'365-day calories affordable');
reset();ok(validateSave(JSON.parse(JSON.stringify(G))),'fresh save round trip');let bad=JSON.parse(JSON.stringify(G));bad.stats={};ok(!validateSave(bad),'reject missing stats');bad=JSON.parse(JSON.stringify(G));bad.hidden={cars:2,helis:0,balls:0};bad.pestTraces=['x'];ok(validateSave(bad),'old saves with pest fields still load');bad=JSON.parse(JSON.stringify(G));bad.inv[0].id='__proto__';ok(!validateSave(bad),'reject prototype id');bad=JSON.parse(JSON.stringify(G));bad.inv[0].uid='\\\" onclick=alert(1)';ok(!validateSave(bad),'reject injected uid');bad=JSON.parse(JSON.stringify(G));bad.env.w=999;ok(!validateSave(bad),'reject invalid world');
reset();let physical=JSON.parse(JSON.stringify(G));physical.inv[0].pose=[0,.5,0,0];physical.inv[0].location='room';physical.heldUID=physical.inv[0].uid;ok(validateSave(physical),'valid physical placement and hand UID');
for(const pose of [[Infinity,.5,0,0],[0,NaN,0,0],[0,2.5,0,0],[9999,.5,0,0],[0,.5,-9999,0],[0,.5,0,Infinity]]){const s=JSON.parse(JSON.stringify(physical));s.inv[0].pose=pose;ok(!validateSave(s),'reject invalid physical pose');}
let physicalBad=JSON.parse(JSON.stringify(physical));physicalBad.heldUID='invalid<uid>';ok(!validateSave(physicalBad),'reject invalid hand UID');
reset();const fixedStock=JSON.stringify(G);ok(G.tradeLocked===true&&!canPurchase(),'run locks trading');cart={rice:1};ok(beginGame()===false,'cannot checkout again');ok(JSON.stringify(G)===fixedStock,'repeated checkout cannot change stock cash clock');ok(startPreparation()===false,'active game cannot reopen preparation');ok(putCartIntoState(cartSummary({rice:1}))===false,'direct inventory purchase helper rejects refill');ok(JSON.stringify(G)===fixedStock,'direct refill has no state effect');phase='shop';ok(beginGame()===false,'fake shop phase alone cannot reopen trading');phase='playing';
const oldSave=JSON.parse(fixedStock);delete oldSave.tradeLocked;ok(validateSave(oldSave),'old save without trade flag still validates');loadState(oldSave);ok(G.tradeLocked===true&&!canPurchase(),'old save migration locks trading');const falseUnlock=JSON.parse(JSON.stringify(G));falseUnlock.tradeLocked=false;ok(!validateSave(falseUnlock),'saved false unlock cannot reopen trading');
const beforeStock=stockSummary();const riceStock=beforeStock.items.find(x=>x.id==='rice').total;const meal=availableFood().find(x=>x.id==='rice');consumeMeal(meal.uid,true,true);ok(stockSummary().items.find(x=>x.id==='rice').total===riceStock-1,'stock ledger tracks actual consumption');ok(stockSummary().kcal<beforeStock.kcal,'remaining calories fall on consumption');
phase='title';ok(startPreparation()===true,'new run can start its own preparation');cart={water:1};ok(beginGame()===true,'new run gets one initial checkout');ok(G.inv.every(x=>x.id==='water'),'new run replaces inventory, never refills old run');ok(!canPurchase(),'new run locks after its checkout too');
reset();G.stats.water=14;G.bladder=10;G.bowel=10;G.nextEvent=1e9;const start=G.minute,advanced=advanceTime(720,'sleep');ok(advanced<720&&G.minute-start===advanced,'danger sleep interrupts');ok(!G.ended&&G.stats.water>0,'not killed by safe skip');
reset();G.stats.energy=10;G.bladder=0;G.bowel=0;G.nextEvent=1e9;G.stats.food=100;G.stats.water=100;advanceTime(360,'sleep');ok(G.stats.energy>60,'sleep recovers energy');
reset();const spoiled={uid:'itest001',id:'milk',units:4,packed:false,bag:0,created:G.minute,age:0,location:'shelf'};G.inv.push(spoiled);const cold={...spoiled,uid:'itest002',location:'fridge'};G.inv.push(cold);G.nextEvent=1e9;simulate(1440,'sleep');ok(spoiled.age>.9&&cold.age<.3,'fridge slows aging');G.power=false;G.powerUntil=1e9;const prev=cold.age;simulate(1440,'sleep');ok(cold.age-prev>.9,'outage ends fridge preservation');
reset();const s1=G.stats.food,b=availableFood().find(b=>b.id==='rice'),before=b.units;consumeMeal(b.uid,true,true);ok(G.stats.food>s1&&b.units===before-1,'meal consumes exactly one selected portion');ok(G.dishes===1,'meal leaves dishes');
reset();G.nails=.5;const beforeTime=G.minute;doAction('nails');ok(G.minute===beforeTime,'cannot farm already trimmed nails');
reset();G.dirt=0;G.stats.morale=50;doAction('clean');ok(G.stats.morale<=50,'cannot farm empty room morale');
reset();G.stats.morale=40;G.stats.water=12;const old=G.stats.morale;doRead('novel1');ok(G.stats.morale-old<2,'interrupted reading rewards actual time only');
reset();ok(G.hidden===undefined&&G.found===undefined&&G.pestTraces===undefined&&!DB.carpowder&&!DB.swatter&&!DB.balltrap,'no pests and no stand-in pests');
reset();addDisease('cold');addDisease('cold');ok(G.illness.length===1,'no duplicate disease');const ill=G.illness[0].remaining;simulate(60,'sleep');ok(G.illness[0].remaining<ill-60,'sleep helps illness duration');
reset();G.minute=365*1440-5;G.nextEvent=1e9;simulate(5,'idle');ok(G.ended&&G.win,'365 victory path');reset();G.stats.health=.01;G.stats.water=0;simulate(5,'idle');ok(G.ended&&!G.win,'health loss path');reset();G.stats.morale=.001;simulate(5,'idle');ok(G.ended&&!G.win,'morale loss path');
console.log('PASS',assertions,'deterministic assertions');
// Run an actual resource-aware policy, not a cheat that resets survival meters.

// v0.10 life layer: letters, radio, garden.
reset();lifeEnsure();ok(G.life&&G.life.letters===0&&G.life.garden.length===3,'life state on new game');
ok(!lifeOpenLetter(false),'day-3 letter cannot be opened on day 1 without choosing early');
G.minute=2*1440+9*60;const lm0=G.stats.morale;ok(lifeOpenLetter(false)&&G.life.letters===1&&G.stats.morale>lm0,'due letter opens and lifts morale');
ok(lifeOpenLetter(true)&&G.life.early===1,'early opening is allowed but counted');
ok(LIFE_LETTERS.length===16&&LIFE_LETTERS.every((l,i)=>!i||l.d>LIFE_LETTERS[i-1].d)&&LIFE_LETTERS.at(-1).d<365,'16 letters in day order before day 365');
ok(LIFE_LETTERS.every(l=>l.lines.length<=24),'letters fit two pages');
G.minute=8*60;G.life.news=0;let pr=lifeProgramme();ok(pr.kind==='news'&&G.life.news===1&&/明天/.test(pr.lines.join('')),'morning news with forecast');
const w=lifeWeather(5);ok(typeof w.overcast==='boolean'&&!lifeWeather(1).overcast,'deterministic sky; day 1 never overcast');
G.minute=5*1440+20*60;pr=lifeProgramme();ok(pr.kind==='serial'&&G.life.serial===1,'weekly radio play on day 6 evening');pr=lifeProgramme();ok(pr.kind!=='serial','one episode per airing');
ok(lifeAlertActive(9)&&!lifeAlertActive(8),'search alert window from the news');
reset();lifeEnsure();G.inv.push({uid:uid(),id:'pots',units:1,packed:false,location:'room',created:0,age:0,opened:false,contaminated:false},{uid:uid(),id:'scallion',units:8,packed:false,location:'room',created:0,age:0,opened:false,contaminated:false},{uid:uid(),id:'tomatoseed',units:6,packed:false,location:'room',created:0,age:0,opened:false,contaminated:false});
G.curtains=false;ok(lifeSow(0,'scallion')&&amount('scallion')===7,'sow scallion uses one bulb');ok(!lifeSow(0,'tomato'),'occupied pot');ok(lifeSow(1,'tomato'),'sow tomato');
for(let d=0;d<14;d++){for(let h=0;h<24;h++){G.minute+=60;lifeGrowHour();}G.life.garden.forEach(p=>p&&(p.water=100));}
ok(lifeReady(G.life.garden[0])===2,'scallion ready within two weeks with light and water');const invN=G.inv.length;const hb=lifeHarvest(0);ok(hb&&hb.id==="greens"&&!hb.packed&&G.inv.length===invN+1&&G.life.garden[0].growth<0.5,'harvest gives produce batch and regrows');
ok(DB.greens.kind==='food'&&!CATALOG.some(i=>i.id==='greens'),'produce is food but never sold');
ok(G.life.garden[1].growth<1,'tomato still growing after two weeks');
G.life.garden[2]={crop:'sprout',growth:0.5,water:0,dry:0,fruit:0,harvests:0};for(let h=0;h<40;h++){G.minute+=60;lifeGrowHour();}ok(G.life.garden[2].dead,'dry sprouts die');
const s2=JSON.parse(JSON.stringify(G));ok(validateSave(s2),'save with life layer validates');


// v0.11 variety & replay value.
reset('seed-A');lifeEnsure();const gA=LM.gang.g,nA=LIFE_NEWS.map(n=>n.t).join('|'),cA=Object.keys(G.life.chains).join();
reset('seed-Q7');lifeEnsure();const gB=LM.gang.g,nB=LIFE_NEWS.map(n=>n.t).join('|'),cB=Object.keys(G.life.chains).join();
ok(nA!==nB,'different seeds give different news years');ok(Object.keys(G.life.chains).length===3,'three neighbour storylines per run');
let variety=new Set();for(const sd of ['a','b','c','d','e','f','g','h','i','j']){reset(sd);lifeEnsure();variety.add(LM.gang.g+'/'+Object.keys(G.life.chains).sort().join()+'/'+LIFE_SERIAL_META[0].name);}ok(variety.size>=6,'ten seeds give at least six different story setups');
reset('seed-A');lifeEnsure();ok(LIFE_NEWS.length>=25&&LIFE_NEWS.every((n,i)=>!i||n.d>=LIFE_NEWS[i-1].d)&&LIFE_NEWS.at(-1).d<365&&LIFE_NEWS.filter(n=>n.alert).length>=2,'seeded news arc ordered with alerts');
ok(!LIFE_NEWS.some(n=>/\{[GBD]\}/.test(n.t)),'news templates filled');
ok(Array.isArray(G.life.goals)&&G.life.goals.length===5,'five personal goals after purchase');
ok(LIFE_SERIAL.length===39&&LIFE_SERIAL_META.length===39,'two radio plays, 39 episodes');
G.inv.push({uid:uid(),id:'origami',units:300,packed:false,location:'room',created:0,age:0,opened:true,contaminated:false});for(let k=0;k<12;k++)doLeisure('origami');ok(G.life.cranes>=72&&amount('origami')===300-G.life.cranes,'cranes use paper one sheet each');
let ev=0;for(let k=0;k<60;k++){const n=G.log.length;randomEvent();G.pendingKnock=false;if(G.log.length>n)ev++;}ok(ev>=50,'events keep coming');
const steps=Object.values(G.life.chains).reduce((a,c)=>a+c.step,0);G.minute+=200*1440;while(lifeAlertActive())G.minute+=1440;for(let k=0;k<40;k++){randomEvent();G.pendingKnock=false;}ok(Object.values(G.life.chains).reduce((a,c)=>a+c.step,0)>steps,'neighbour stories advance');
G.life.harvests=25;G.win=true;ok(lmEnding().id==='garden','gardener ending');G.life.harvests=0;G.life.cranes=1000;ok(lmEnding().id==='cranes','crane ending');G.life.cranes=0;ok(lmEnding().id==='home','default ending');


// v0.12 everyday realism.
reset('seed-A');lifeEnsure();ok(G.life.traits.length===2&&G.life.traits[0]!==G.life.traits[1]&&G.life.traits.every(t=>LR_TRAITS.some(x=>x.id===t)),'two distinct traits');
let tset=new Set();for(const sd of ['a','b','c','d','e','f','g','h']){reset(sd);lifeEnsure();tset.add(G.life.traits.join());}ok(tset.size>=5,'traits vary by seed');
reset('seed-A');lifeEnsure();const t0=temperature();G.life.faults.draft=1;G.life.faults.radiator=1;ok(temperature()===t0-5,'draught and cold radiator lower room temperature');
G.inv.push({uid:uid(),id:'ducttape',units:4,packed:false,location:'room',created:0,age:0,opened:true,contaminated:false},{uid:uid(),id:'radkey',units:1,packed:false,location:'room',created:0,age:0,opened:true,contaminated:false},{uid:uid(),id:'repair',units:5,packed:false,location:'room',created:0,age:0,opened:true,contaminated:false});
doAction('seal');doAction('bleed');ok(!G.life.faults.draft&&!G.life.faults.radiator&&amount('ducttape')===3&&has('radkey'),'tape seals the window, key bleeds the radiator');
G.life.faults.drip=1;G.power=true;G.waterOn=true;doAction('repair');ok(!G.life.faults.drip&&amount('repair')===4,'repair kit fixes a dripping tap');
G.life.faults={};G.minute=10*1440+600;let fl=0;for(let k=0;k<400;k++){dailyUpdate();if(Object.keys(G.life.faults).length)fl++;G.life.faults={};}ok(fl>4&&fl<60,'faults happen now and then, not constantly');
reset('seed-A');lifeEnsure();G.inv.push({uid:uid(),id:'greens',units:2,packed:false,location:'room',created:0,age:0,opened:true,contaminated:false});const nb=G.inv.find(b=>b.id==='noodles'&&!b.packed)||(()=>{const b={uid:uid(),id:'noodles',units:4,packed:false,location:'room',created:G.minute,age:0,opened:true,contaminated:false};G.inv.push(b);return b;})();
consumeMeal(nb.uid,true,false);ok(G.foodHistory.at(-1)===(DB.noodles.flavor||'noodles')+'+greens'&&G.life.dishes['葱花挂面']===1&&amount('greens')===1&&DB.noodles.name.includes('挂面')&&!DB.noodles.name.startsWith('葱花'),'cooked noodles with greens become a separate dish');
G.minute=1440*3+8*60;const wt=lrWatch();ok(typeof wt==='string'&&wt.length>5,'watching the street gives a scene');
{const out={};for(const sd of ['seed-A','ANDERS-1986','cold-1','warm-9','x77']){reset(sd);lifeEnsure();let rain=0,snow=0;for(let d=3;d<=365;d++){let k=null;for(let h=0;h<24;h++){const p=lrPrecip((d-1)*1440+h*60);if(p)k=p;}if(k==='rain')rain++;if(k==='snow')snow++;}out[sd]={rain,snow,temp:env.temp,bday:G.life.birthday};ok(rain+snow>30&&rain+snow<120,'rain and snow days are occasional: '+sd);ok(G.life.birthday>=20&&G.life.birthday<=345&&!LR_DAYS.some(x=>x[0]===G.life.birthday),'birthday is seeded and on its own day');}console.log('Weather by seed',JSON.stringify(out));ok(new Set(Object.values(out).map(o=>o.bday)).size>2,'birthdays differ by seed');}

{reset('seed-A');lifeEnsure();const bad=[];const can=(t)=>{for(let d=3;d<=365;d+=1)for(let h=0;h<24;h++){G.minute=(d-1)*1440+h*60+20;if(lhOk(t))return true;}return false;};
for(const c of LM_CHAINS)for(const st of c.steps)if(!can(st))bad.push(st);for(const [t] of LM_EVENTS)if(!/蝴蝶|电影票|身高线|梦见|大雾/.test(t)&&!can(t))bad.push(t);ok(bad.length===0,'every neighbour story step has a moment when it can happen: '+bad.join(' | '));
ok(!can('一只蝴蝶撞在窗玻璃上')&&!can('窗外起了大雾'),'no insects and no fog the window cannot show');
G.minute=4*1440+12*60;ok(!lhOk('深夜，楼上轻轻弹了一首很慢的曲子')&&!lhOk('早上，窗外传来咕咕声。'),'night and morning lines wait for their time');
G.minute=4*1440+23*60;ok(lhOk('深夜，楼上轻轻弹了一首很慢的曲子'),'night lines can happen at night');
G.minute=44*1440+1*60;G.log=[];for(let k=0;k<23;k++){G.minute+=60;hourlyUpdate();}const fw=G.log.find(e=>/烟花/.test(e.text));ok(fw&&Math.floor((fw.minute/60)%24)===19,'national-day fireworks are told in the evening');
G.minute=(G.life.birthday-1)*1440+1*60;G.log=[];for(let k=0;k<23;k++){G.minute+=60;hourlyUpdate();}const bd=G.log.find(e=>/生日/.test(e.text));ok(bd&&Math.floor((bd.minute/60)%24)===12,'birthday at noon');
const tn=new Set();for(const sd of ['a','b','c','d','e','f','g','h']){reset(sd);lifeEnsure();tn.add(G.life.tenant);}ok(tn.size>=3,'previous tenant varies by seed');
reset('seed-A');lifeEnsure();G.minute=4*1440+600;let warmWinter=0,coldSummer=0;for(let k=0;k<300;k++){G.minute=(240-1)*1440+600;G.weather={temp:0,until:0};const r0=G.rng;randomEvent();if(G.weather.temp>0)warmWinter++;G.minute=(60-1)*1440+600;G.weather={temp:0,until:0};randomEvent();if(G.weather.temp<0)coldSummer++;G.pendingKnock=false;G.power=true;G.waterOn=true;}console.log('Spells',warmWinter,coldSummer);}
reset('ANDERS-1986',YEAR_KIT);const actionCounts={eat:0,water:0,sleep:0,read:0};let loops=0,lastDay=day();
while(!G.ended&&loops++<30000){
 if(G.pendingKnock){doAction('silence');continue;}
 if(G.stats.water<60){if(G.waterOn||G.tank>=.5){actDrink('tap');actionCounts.water++;continue;}const drink=G.inv.find(b=>!b.packed&&['water','waterlarge'].includes(b.id)&&b.units>0);if(drink){actDrink(drink.uid);actionCounts.water++;continue;}}
 if(G.waterOn&&G.tank<2){doAction('fill');continue;}
 if(G.bladder>68){doAction('pee');continue;}if(G.bowel>65){doAction('poop');continue;}
 if(G.stats.food<58){const f=availableFood().filter(b=>!DB[b.id].cook||G.power||(has('stove')&&has('fuel'))).sort((a,b)=>{const ra=G.foodHistory.slice(-5).filter(x=>x===DB[a.id].flavor).length,rb=G.foodHistory.slice(-5).filter(x=>x===DB[b.id].flavor).length;return ra-rb||(DB[a.id].life-a.age)-(DB[b.id].life-b.age);})[0];if(f){consumeMeal(f.uid,true,false);actionCounts.eat++;continue;}}
 if(G.stats.hygiene<48&&(G.waterOn||G.tank>=8)){doAction('shower');continue;}
 if(G.dirt>37){doAction('clean');continue;}if(G.dishes>4&&(G.waterOn||G.tank>=1)){doAction('dishes');continue;}
 if(G.clothes<38){if(G.dirtyClothes<2){doAction('change');continue;}if(G.waterOn){doAction('laundry');continue;}}
 if(G.nails>3.8){doAction('nails');continue;}if(G.hair>23){doAction('hair');continue;}
 if(G.stats.energy<43){doAction('sleep',6);actionCounts.sleep++;continue;}
 if(G.stats.morale<63){if(G.stats.energy>30){doAction('exercise');continue;}doRead('novel1');actionCounts.read++;continue;}
 advanceTime(60,'idle');
 if(day()!==lastDay){lastDay=day();if(day()%60===0)console.log('Policy day',day(),'food portions',availableFood().reduce((a,b)=>a+b.units,0),'health',Math.round(G.stats.health),'morale',Math.round(G.stats.morale));}
}
console.log('365-day policy result:',JSON.stringify({day:day(),win:G.win,ended:G.ended,loops,stats:G.stats,remainingFoodPortions:availableFood().reduce((a,b)=>a+b.units,0),actions:actionCounts}));
ok(G.ended&&G.win,'resource-aware 365-day policy can win');
console.log('Year traces',G.life.tenant,G.life.tenantBits,'dreams',G.life.dreams.length);ok(G.life.tenantBits===6,'all six traces of the previous tenant turn up within a year of ordinary cleaning');ok(G.life.dreams.length>=8,'dreams on waking from proper sleeps');
console.log('ALL SIMULATION TESTS PASSED');
`,
  ctx,
  { timeout: 25000 },
);
