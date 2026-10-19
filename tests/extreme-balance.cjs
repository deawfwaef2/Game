// Deterministic full-run economy proof: one real initial cart per extreme chapter,
// then a resource-aware policy plays the actual simulator without resetting meters or restocking.
const fs = require("fs"), vm = require("vm"), assert = require("assert");
const store = new Map();
const ctx = {
  console, Math, JSON, Number, String, Object, Array, Set, Map, Date, Blob, assert,
  localStorage: { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) },
  renderHUD(){}, syncRoom(){}, showToast(){}, renderJournalBadge(){}, updatePhase(){}, showEnd(){},
  closePanel(){}, openLeisure(){}, openInventory(){}, openStation(){}, refreshPanel(){},
  buildRoom(){}, setFirstPerson(){}, getPlayerPosition(){return null;}, $(selector){return null;},
};
vm.createContext(ctx);
for (const f of [
  "src/data.js", "src/catalog-gen.js", "src/core.js", "src/life-text.js", "src/life.js",
  "src/life-more.js", "src/life-real.js", "src/life-home.js", "src/life-items.js",
  "src/life-catalog.js", "src/levels.js", "src/level-minigames.js", "src/survival.js",
]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
const reports = vm.runInContext(`(() => {
  saveGame = () => {};
  lvProgress.unlocked = 6;
  const runChapter = id => {
    const detail = lvExtremeBudgetDetails(id), kit = {};
    for (const row of detail.foodPlan) kit[row.id] = row.packages;
    const foodKinds = new Set(Object.keys(YEAR_KIT).filter(itemId => ["food", "drink", "seasoning"].includes(DB[itemId]?.kind)));
    for (const [itemId,n] of Object.entries(YEAR_KIT)) if (!foodKinds.has(itemId)) kit[itemId] = n;
    Object.assign(kit, {waterlarge:1, firstaid:1, knife:1, cutboard:1});
    if (id === "night-radio" || id === "thousand") kit.radio = 1;
    if (id === "ledger" || id === "thousand") kit.lighter = 1;
    if (id === "thousand") Object.assign(kit,{waterlarge:2,firstaid:2,detergent:4,chocolate:4,jam:3});

    closePreparation(); phase="title"; currentSeed="extreme-proof-"+id; env=environment(currentSeed);
    lvPending=id; lvDifficultyKey="extreme";
    if (!startPreparation()) throw new Error("could not enter procurement for " + id);
    cart=kit;
    const cost=cartSummary(cart).cost, budget=gameBudget();
    if (cost > budget) throw new Error("test kit exceeds modeled budget for " + id + ": " + cost + " > " + budget);
    if (!beginGame()) throw new Error("one-time chapter checkout failed for " + id);
    for (const b of G.inv) { b.packed=false; b.opened=false; b.location="shelf"; }
    G.bags.forEach(b => b.opened=true);
    lifeEnsure();
    const initial={cost,budget,foodCalories:stockSummary().kcal};
    let loops=0, meals=0, letters=0, medicines=0, activity=0;
    const foodOK=b=>!DB[b.id].cook||G.power||(has("stove")&&amount("fuel")>=1);
    const readyFood=()=>availableFood().filter(foodOK).sort((a,b)=>{
      const pa=lvTastePenalty(DB[a.id]),pb=lvTastePenalty(DB[b.id]);
      const ra=survFoodRisk(DB[a.id],a),rb=survFoodRisk(DB[b.id],b);
      const ea=(a.age||0)/(DB[a.id].life||9999),eb=(b.age||0)/(DB[b.id].life||9999);
      return (pa+ra*10000+ea*0.5)-(pb+rb*10000+eb*0.5);
    });
    while (!G.ended && loops++<300000) {
      if (G.pendingKnock) { doAction("silence"); continue; }
      if (G.stats.water<62) {
        if (G.waterOn||G.tank>=0.5) { actDrink("tap"); continue; }
        const bottled=G.inv.find(b=>!b.packed&&b.units>=1&&["water","waterlarge"].includes(b.id));
        if (bottled) { actDrink(bottled.uid); continue; }
        advanceTime(15,"idle"); continue;
      }
      if (G.waterOn&&has("bottle")&&G.tank<1) { doAction("fill"); continue; }
      if (G.stats.food<58) {
        const b=readyFood()[0];
        if (b) { consumeMeal(b.uid,true,false); meals++; continue; }
        advanceTime(15,"idle"); continue;
      }
      if (G.illness.length) {
        const ill=G.illness[0];
        const med=G.inv.find(b=>!b.packed&&b.units>=1&&DB[b.id]?.kind==="medicine"&&(
          DB[b.id].treat==="all"||DB[b.id].treat==="rest"||DB[b.id].treat===ill.id||
          (DB[b.id].treat==="stomach"&&ill.id==="foodborne")
        ));
        if (med) { takeMedicine(med.uid); medicines++; continue; }
      }
      if (G.bladder>68) { doAction("pee"); continue; }
      if (G.bowel>65) { doAction("poop"); continue; }
      if (G.stats.hygiene<48&&(G.waterOn||G.tank>=8)) { doAction("shower"); continue; }
      if (G.trash>=12&&G.cooldowns.lastTrash!==day()) { doAction("trash"); G.cooldowns.lastTrash=day(); continue; }
      if (G.dirt>48) { doAction("clean"); continue; }
      if (G.dishes>5&&(G.waterOn||G.tank>=1)) { doAction("dishes"); continue; }
      if (G.clothes<38) {
        if (G.dirtyClothes<2) { doAction("change"); continue; }
        if (G.waterOn||G.tank>=6) { doAction("laundry"); continue; }
      }
      if (G.nails>3.8) { doAction("nails"); continue; }
      if (G.hair>23) { doAction("hair"); continue; }
      if (G.stats.energy<48) { doAction("sleep",6); continue; }
      if (G.life?.letters<LIFE_LETTERS.length&&LIFE_LETTERS[G.life.letters].d<=day()) {
        if (lifeOpenLetter(false)) { letters++; continue; }
      }
      if (G.stats.morale<68&&G.stats.energy>32&&G.stats.water>35&&G.stats.food>35) {
        doAction("exercise"); activity++; continue;
      }
      if (G.stats.morale<55) {
        const book=Object.keys(YEAR_KIT).find(itemId=>DB[itemId]?.kind==="book"&&G.books[itemId]?.pages<DB[itemId].pages);
        if (book) doRead(book); else doAction("exercise");
        activity++; continue;
      }
      advanceTime(60,"idle");
    }
    return {
      chapter:id, ...initial, day:day(), ended:G.ended, won:G.win, loops, meals, letters, medicines, activity,
      stars:G.level.stars, missed:G.level.missed,
      stats:{food:+G.stats.food.toFixed(1),water:+G.stats.water.toFixed(1),energy:+G.stats.energy.toFixed(1),health:+G.stats.health.toFixed(1),morale:+G.stats.morale.toFixed(1)},
      remainingFood:availableFood().reduce((a,b)=>a+b.units,0), remainingKcal:stockSummary().kcal,
      foodborneEvents:G.log.filter(x=>/食源性不适/.test(x.text)).length,
    };
  };
  return LV_CHAPTERS.map(ch=>runChapter(ch.id));
})()`, ctx);
console.log("EXTREME FULL-RUN BALANCE", JSON.stringify(reports.map(r=>({chapter:r.chapter,cost:r.cost,budget:r.budget,days:r.day,won:r.won,foodKcal:r.foodCalories,remainingKcal:r.remainingKcal,medicines:r.medicines,stars:r.stars})), null, 2));
for (const report of reports) {
  assert.ok(report.cost<=report.budget, report.chapter+" kit fits the single initial budget");
  assert.ok(report.budget-report.cost<=report.budget*0.1, report.chapter+" kit leaves no more than 10% budget slack");
  assert.ok(report.ended&&report.won&&report.day>=({bellhouse:60,sealed:90,"night-radio":120,ledger:180,clockmaker:365,thousand:1000})[report.chapter], report.chapter+" survives the actual chapter simulator");
  assert.ok(report.stats.health>0&&report.stats.morale>0, report.chapter+" ends with positive survival meters");
}
