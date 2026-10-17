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
for (const f of ["src/data.js", "src/core.js"])
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
vm.runInContext(
  `
let assertions=0;function ok(value,msg){assert.ok(value,msg);assertions++;}
function reset(seed='ANDERS-1986',kit=STARTER){closePreparation();phase='title';currentSeed=seed;env=environment(seed);startPreparation();cart={...kit};beginGame();for(const b of G.inv){b.packed=false;b.location=DB[b.id].kind==='food'&&DB[b.id].life<60&&env.fridge?'fridge':'shelf';}G.bags.forEach(b=>b.opened=true);G.cooldowns={};}
saveGame=()=>{};
ok(CATALOG.length===129,'catalog count');ok(new Set(CATALOG.map(i=>i.id)).size===CATALOG.length,'unique ids');ok(CATALOG.every(i=>i.price>0&&i.weight>0&&Number.isInteger(i.servings)&&i.servings>0),'valid product data');
for(let i=0;i<100;i++){const seed='test-'+i;ok(JSON.stringify(environment(seed))===JSON.stringify(environment(seed)),'seed deterministic');}
const envs=Array.from({length:100},(_,i)=>environment('t'+i));ok(envs.some(e=>!e.fridge)&&envs.some(e=>e.fridge),'fridge varies');ok(new Set(envs.map(e=>e.temp)).size>12,'temperature varies');
for(const kit of [STARTER,YEAR_KIT,Object.fromEntries(CATALOG.map(i=>[i.id,3]))]){const p=packCart(kit);ok(p.bags.every(b=>b.weight<=8),'all bags <=8kg');ok(p.total.reduce((a,b)=>a+Object.values(b.items).reduce((a,n)=>a+n,0),0)===Object.values(kit).reduce((a,n)=>a+n,0),'no lost packages');}
ok(cartSummary(YEAR_KIT).cost<=300&&cartSummary(YEAR_KIT).days>=365,'365-day calories affordable');
reset();ok(validateSave(JSON.parse(JSON.stringify(G))),'fresh save round trip');let bad=JSON.parse(JSON.stringify(G));bad.stats={};ok(!validateSave(bad),'reject missing stats');bad=JSON.parse(JSON.stringify(G));delete bad.hidden;ok(!validateSave(bad),'reject missing hidden data');bad=JSON.parse(JSON.stringify(G));bad.inv[0].id='__proto__';ok(!validateSave(bad),'reject prototype id');bad=JSON.parse(JSON.stringify(G));bad.inv[0].uid='\\\" onclick=alert(1)';ok(!validateSave(bad),'reject injected uid');bad=JSON.parse(JSON.stringify(G));bad.env.w=999;ok(!validateSave(bad),'reject invalid world');
reset();let physical=JSON.parse(JSON.stringify(G));physical.inv[0].pose=[0,.5,0,0];physical.inv[0].location='room';physical.heldUID=physical.inv[0].uid;ok(validateSave(physical),'valid physical placement and hand UID');
for(const pose of [[Infinity,.5,0,0],[0,NaN,0,0],[0,2,0,0],[9999,.5,0,0],[0,.5,-9999,0],[0,.5,0,Infinity]]){const s=JSON.parse(JSON.stringify(physical));s.inv[0].pose=pose;ok(!validateSave(s),'reject invalid physical pose');}
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
reset();G.hidden={cars:1,helis:1,balls:1};G.found={cars:1,helis:1,balls:1};clearPest('cars','carpowder');ok(G.hidden.cars===0&&G.found.cars===0,'clear exact pest');clearPest('helis','swatter');clearPest('balls','balltrap');ok(!Object.values(G.hidden).some(Boolean),'all three abstract categories clear');
reset();addDisease('cold');addDisease('cold');ok(G.illness.length===1,'no duplicate disease');const ill=G.illness[0].remaining;simulate(60,'sleep');ok(G.illness[0].remaining<ill-60,'sleep helps illness duration');
reset();G.minute=365*1440-5;G.nextEvent=1e9;simulate(5,'idle');ok(G.ended&&G.win,'365 victory path');reset();G.stats.health=.01;G.stats.water=0;simulate(5,'idle');ok(G.ended&&!G.win,'health loss path');reset();G.stats.morale=.001;simulate(5,'idle');ok(G.ended&&!G.win,'morale loss path');
console.log('PASS',assertions,'deterministic assertions');
// Run an actual resource-aware policy, not a cheat that resets survival meters.
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
console.log('ALL SIMULATION TESTS PASSED');
`,
  ctx,
  { timeout: 25000 },
);
