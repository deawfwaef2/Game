// Deterministic tests for safety tiers, disease, medicine, spoilage labels and cap-aware waste.
const fs = require("fs"), vm = require("vm"), assert = require("assert");
const store = new Map();
const ctx = {
  console, Math, JSON, Number, String, Object, Array, Set, Map, Date, Blob, assert,
  localStorage: { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) },
  renderHUD(){}, syncRoom(){}, showToast(){}, renderJournalBadge(){}, updatePhase(){}, showEnd(){}, notify(){},
  closePanel(){}, openLeisure(){}, openInventory(){}, openStation(){}, refreshPanel(){},
  buildRoom(){}, setFirstPerson(){}, getPlayerPosition(){return null;}, $(selector){return null;},
};
vm.createContext(ctx);
for (const f of [
  "src/data.js", "src/catalog-gen.js", "src/core.js", "src/life-text.js", "src/life.js",
  "src/life-more.js", "src/life-real.js", "src/life-home.js", "src/life-items.js",
  "src/life-catalog.js", "src/levels.js", "src/level-minigames.js", "src/survival.js",
]) vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f});
vm.runInContext(`
let checks=0;function ok(value,message){assert.ok(value,message);checks++;}
saveGame=()=>{};
function reset(seed="survival-test",kit={water:1,rice:1}){
  closePreparation();phase="title";lvPending=null;lvDifficultyKey="standard";currentSeed=seed;env=environment(seed);
  if(!startPreparation())throw new Error("prep failed");cart={...kit};if(!beginGame())throw new Error("checkout failed");
  for(const b of G.inv){b.packed=false;b.opened=false;b.location="shelf";}G.bags.forEach(b=>b.opened=true);
  G.nextEvent=1e7;G.minute=8*60+10;env=G.env;
  Object.assign(G.stats,{food:100,water:100,energy:100,morale:100,hygiene:90,health:100});
  G.dirt=10;G.illness=[];G.pendingKnock=false;G.cooldowns={};
  return G;
}
function seedForRoll(min,max){for(let n=0;n<100000;n++){const x={rng:n},r=rngNext(x);if(r>=min&&r<max)return n;}throw new Error("could not find deterministic RNG seed");}
function batch(id,uid="iqa001",extra={}){return {uid,id,units:2,packed:false,opened:false,location:"shelf",bag:0,age:0,created:G.minute,...extra};}
function qaMedicine(id,tier){DB[id]={id,name:id,kind:"medicine",treat:"rest",qualityTier:tier,servings:1,price:1,weight:.1,life:9999};}

ok(CATALOG.filter(i=>!i.gen).length===135,"base catalogue includes knife and cutting board");
ok(DB.knife&&DB.cutboard&&DB.knife.category==="tool"&&DB.cutboard.category==="tool","new cutting tools are ordinary opening-purchase goods");
ok(DISEASES.foodborne&&DISEASES.sprain&&DISEASES.cut,"foodborne illness, sprain and cut have named disease states");
ok(["premium","standard","economy","clearance"].every(t=>survQuality({qualityTier:t})===t),"quality-risk model recognizes all four tiers");

const riskItem=(tier,life=100)=>({id:"qa_"+tier,name:"test food",kind:"food",qualityTier:tier,life,servings:1,kcal:100,flavor:"qa",category:"staple"});
const riskBatch=(age=0,opened=false)=>({age,opened,contaminated:false});
const tierRisk={premium:survFoodRisk(riskItem("premium"),riskBatch()),standard:survFoodRisk(riskItem("standard"),riskBatch()),economy:survFoodRisk(riskItem("economy"),riskBatch()),clearance:survFoodRisk(riskItem("clearance"),riskBatch())};
ok(tierRisk.premium===0.00012&&tierRisk.standard===0.0007&&tierRisk.economy===0.003&&tierRisk.clearance===0.006,"premium food has lower base risk; economy and clearance have higher risks");
const ordinary=riskItem("standard"),oldBatch=riskBatch(80,false),openedBatch=riskBatch(0,true);
ok(survFoodRisk(ordinary,oldBatch)>survFoodRisk(ordinary,riskBatch()),"near-expiry batches carry a higher food-safety risk");
ok(survFoodRisk(ordinary,openedBatch)>survFoodRisk(ordinary,riskBatch()),"opened batches carry a higher food-safety risk");
ok(survFoodRisk(ordinary,riskBatch(),true)>survFoodRisk(ordinary,riskBatch()),"failed meal handling raises food-safety risk");
reset();G.weather.temp=10;const hotRisk=survFoodRisk(ordinary,riskBatch());G.weather.temp=0;
ok(hotRisk>survFoodRisk(ordinary,riskBatch()),"hot storage raises food-safety risk");
ok(survSafetyText({kind:"food",qualityTier:"premium"}).includes("食源风险较低")&&survSafetyText({kind:"food",qualityTier:"economy"}).includes("稳定性一般"),"food details explain safer premium and less reliable economy batches");
ok(survSafetyText({kind:"medicine",qualityTier:"premium"}).includes("更可靠")&&survSafetyText({kind:"medicine",qualityTier:"clearance"}).includes("可靠性较低"),"medicine details explain reliability by quality");
const generatedPremium=CATALOG.find(i=>i.gen&&i.kind==="food"&&i.qualityTier==="premium"),generatedEconomy=CATALOG.find(i=>i.gen&&i.kind==="food"&&i.qualityTier==="economy");
ok(!!generatedPremium&&!!generatedEconomy&&survFoodRisk(generatedPremium,{age:0})<survFoodRisk(generatedEconomy,{age:0}),"generated catalogue carries both premium safer and economy riskier foods");
const pricePair=(()=>{const byLine=new Map();for(const it of CATALOG.filter(x=>x.gen&&x.kind==="food")){const a=byLine.get(it.line)||[];a.push(it);byLine.set(it.line,a);}for(const a of byLine.values()){const p=a.find(x=>x.qualityTier==="premium"),e=a.find(x=>x.qualityTier==="economy");if(p&&e&&p.price/(p.kcal*p.servings)>e.price/(e.kcal*e.servings))return {p,e};}return null;})();
ok(!!pricePair,"at least one same-line premium food costs more per calorie than its economy counterpart");

const dated=CATALOG.find(i=>i.kind==="food"&&i.life<9999),expiryBatch={age:dated.life*.8,opened:false,units:2,location:"shelf"};
ok(expiryInventoryLabel(dated,expiryBatch).includes("临近保质期，建议优先食用"),"inventory warns when an unopened batch approaches expiry");
expiryBatch.opened=true;ok(expiryInventoryLabel(dated,expiryBatch).includes("已拆封，优先食用"),"inventory warns to prioritize opened batches");

reset();
const clear=CATALOG.find(i=>i.gen&&i.kind==="food"&&i.qualityTier==="clearance"&&i.life>90);
const contaminatedRisk={...clear,id:"qa_risky_food",life:clear.life};DB[contaminatedRisk.id]=contaminatedRisk;
const risky=batch(contaminatedRisk.id,"iqarisk",{age:contaminatedRisk.life*.96});G.inv.push(risky);
const pFood=survFoodRisk(contaminatedRisk,risky);G.rng=seedForRoll(0,pFood);consumeMeal(risky.uid,true,false);
ok(G.illness.some(i=>i.id==="foodborne"),"unsafe food can deterministically produce foodborne illness");
ok(validateSave(JSON.parse(JSON.stringify(G))),"new foodborne disease state round-trips through save validation");
const badSave=JSON.parse(JSON.stringify(G));badSave.illness[0].id="unknown-disease";ok(!validateSave(badSave),"save validation rejects unknown disease states");

reset();G.illness=[{id:"foodborne",remaining:5000}];G.minute=8*60+10;G.nextEvent=1e7;G.stats.water=100;G.stats.health=100;G.stats.energy=100;G.stats.morale=100;simulate(60,"idle");
ok(Math.abs(G.stats.water-94.6)<0.01&&G.stats.health<100&&G.stats.energy<100,"foodborne illness increases water loss and reduces health/energy");
reset();G.illness=[{id:"cut",remaining:5000}];G.minute=8*60+10;G.stats.health=100;simulate(60,"idle");
ok(G.stats.health<100&&G.stats.hygiene<90,"a cut slowly affects health and hygiene until treated or recovered");

const sharedRoll=seedForRoll(0.01,0.02);
function medicineTrial(tier){
  reset("med-"+tier);const id="qa_med_"+tier;qaMedicine(id,tier);const med=batch(id,"iqamed",{units:1});G.inv.push(med);
  G.illness=[{id:"sprain",remaining:4000}];G.rng=sharedRoll;takeMedicine(med.uid);
  return {remaining:G.illness[0]?.remaining??0,amount:amount(id)};
}
const premiumTrial=medicineTrial("premium"),standardTrial=medicineTrial("standard"),economyTrial=medicineTrial("economy"),clearanceTrial=medicineTrial("clearance");
ok(premiumTrial.remaining<3300&&premiumTrial.amount===0,"premium medicine succeeds on a roll that fails standard medicine");
ok(standardTrial.remaining>3900&&standardTrial.amount===0,"a standard medicine can fail and still consumes its dose");
ok(economyTrial.remaining>3900&&clearanceTrial.remaining>3900,"economy and clearance medicines fail on the same reproducible sample");

reset();
const water=batch("water","iqawater");G.inv.push(water);ok(markPackageOpened(water),"first opening records a bottle package");
ok(G.waste.packaging===1&&G.waste.caps===1&&G.trash===2,"base bottled water produces exactly one package and one cap");
ok(!markPackageOpened(water)&&G.waste.caps===1,"reopening the same bottle batch does not double-count its cap");
const tea=batch("tea","iqatea");G.inv.push(tea);markPackageOpened(tea);
ok(G.waste.packaging===2&&G.waste.caps===1,"tea sachets record packaging but no bottle cap");
ok(["water","waterlarge","juice","soda"].every(id=>DB[id].capWaste===true)&&!DB.tea.capWaste,"bottled base drinks mark caps while tea bags do not");
const generatedBottle=CATALOG.find(i=>i.gen&&i.kind==="drink"&&i.capWaste);ok(!!generatedBottle,"generated bottled drinks carry explicit cap-waste metadata");
ok(!DB.x_sour_plum.capWaste,"a powdered drink pouch does not invent a bottle cap");
const genBatch=batch(generatedBottle.id,"iqagen");G.inv.push(genBatch);markPackageOpened(genBatch);
ok(G.waste.packaging===3&&G.waste.caps===2&&G.trash===5,"generated bottle-cap metadata is consumed by the shared waste ledger");
ok(validateSave(JSON.parse(JSON.stringify(G))),"categorized cap waste passes save validation");
const invalidWaste=JSON.parse(JSON.stringify(G));invalidWaste.waste.caps++;ok(!validateSave(invalidWaste),"cap subtotal must reconcile with total trash");
doAction("trash");ok(G.trash===0&&G.waste.caps===0&&G.waste.packaging===0,"trash action clears bottle caps and packaging together");

reset();G.trash=4;delete G.waste;
const legacy=JSON.parse(JSON.stringify(G));ok(validateSave(legacy),"legacy save without categorized waste remains compatible");loadState(legacy);
ok(G.waste.packaging===4&&G.waste.caps===0&&G.trash===4,"old undifferentiated trash migrates as packaging without inventing caps");
const noCaps=JSON.parse(JSON.stringify(G));noCaps.waste={packaging:2,scraps:1,discarded:0,items:[],warnedFull:false};noCaps.trash=3;
ok(validateSave(noCaps),"intermediate waste save without a cap field remains compatible");loadState(noCaps);
ok(G.waste.caps===0&&G.trash===3,"intermediate waste save defaults bottle caps to zero");

reset();addDisease("foodborne");addDisease("foodborne");ok(G.illness.length===1,"duplicate disease episodes are blocked");
for(const id of ["cold","stomach","fever","sprain","cut"])addDisease(id);
ok(G.illness.length===6,"six supported disease/injury states fit the save bound");addDisease("foodborne");ok(G.illness.length===6,"disease system enforces the six-state cap");
ok(validateSave(JSON.parse(JSON.stringify(G))),"all supported illnesses validate");
console.log("PASS",checks,"survival safety, medicine, disease, expiry and waste assertions");
`,ctx);
