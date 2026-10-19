// Deterministic regression for the hidden-clock chapter mode. No browser, server or network required.
const fs = require("fs"), vm = require("vm"), assert = require("assert");
const store = new Map([["anders-room-difficulty-v1", "extreme"]]);
const ctx = {
  console, Math, JSON, Number, String, Object, Array, Set, Map, Date, Blob, assert,
  localStorage: { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) },
  renderHUD(){}, syncRoom(){}, showToast(){}, renderJournalBadge(){}, updatePhase(){}, showEnd(){},
  closePanel(){}, openLeisure(){}, openInventory(){}, openStation(){}, refreshPanel(){},
  buildRoom(){}, setFirstPerson(){}, getPlayerPosition(){return null;}, $(selector){return null;},
};
vm.createContext(ctx);
for (const f of ["src/data.js","src/catalog-gen.js","src/core.js","src/life-text.js","src/life.js","src/life-more.js","src/life-real.js","src/life-home.js","src/life-items.js","src/life-catalog.js","src/levels.js","src/level-minigames.js"])
  vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f});
const run = (code) => vm.runInContext(code,ctx);
run(`
let checks=0; function ok(x,m){assert.ok(x,m);checks++;}
function startChapter(id, kit={water:1}, _legacyProfile=""){
  closePreparation(); phase="title"; currentSeed="test-"+id; env=environment(currentSeed); lvPending=id;
  ok(startPreparation(),"chapter may enter its one-time procurement"); cart={...kit}; ok(beginGame(),"chapter checkout succeeds");
  for(const b of G.inv){b.packed=false;b.opened=true;b.location="shelf";}
  return G;
}
// The first page is a deterministic tranche, not a per-seed 1% random draw. Every original item is available;
// progression to tier six opens every generated line plus the chapter-only clocks.
phase="shop";lvPending="bellhouse";
const firstA=shopStock("a"),firstB=shopStock("b");
ok(firstA.length===firstB.length&&firstA.every((x,i)=>x.id===firstB[i].id),"chapter delivery is independent of the room seed");
ok(firstA.length>1000&&firstA.length<CATALOG.length+LV_PRODUCTS.length,"first chapter opens a large but progressive catalogue tranche");
ok(CATALOG.filter(x=>!x.gen).every(x=>firstA.some(y=>y.id===x.id)),"all original products remain available");
ok(LV_PRODUCTS.every(x=>firstA.some(y=>y.id===x.id)),"all timekeeping goods are purchasable in chapter mode");
const starterSamples=lvPhysicalCatalog();
ok(starterSamples.length===200,"the starter chapter stocks 20 physical samples in each of ten bays");
ok(SHOP_CATS.every(cat=>starterSamples.some(x=>x.category===cat)),"the starter chapter has at least one physical product in every bay");
const tierPremium=CATALOG.find(x=>x.gen&&x.trait==="premium"),tierImported=CATALOG.find(x=>x.gen&&x.trait==="imported"),tierClearance=CATALOG.find(x=>x.gen&&x.trait==="clearance"),unitFood=CATALOG.find(x=>x.gen&&x.kind==="food"&&x.kcal>0);
ok(!!tierPremium&&cgPriceTierText(tierPremium).includes("优选溢价")&&!!tierImported&&cgPriceTierText(tierImported).includes("进口溢价")&&!!tierClearance&&cgPriceTierText(tierClearance).includes("临期折价"),"catalogue price tiers explain premium, imported and clearance price differences");
ok(!!unitFood&&cgUnitCostText(unitFood).includes("千大卡")&&Math.abs(cgUnitCostValue(unitFood)-unitFood.price*1000/(unitFood.servings*unitFood.kcal))<1e-10,"food comparisons report cost per serving and per thousand calories");
const brandPriceValues=Object.values(CG_BRAND_STYLE).map(x=>x[1]?.priceX||1);
ok(Math.max(...brandPriceValues)-Math.min(...brandPriceValues)>=1,"explicit brand positioning creates materially different price brackets");
lvProgress.unlocked=6;const full=lvCatalogStock();
ok(full.length===CATALOG.length+LV_PRODUCTS.length,"last unlock exposes the entire catalogue");
ok(new Set(full.map(x=>x.id)).size===full.length,"chapter catalogue IDs are unique");
ok(lvPhysicalCatalog().length>0,"chapter shop shelves are populated with physical samples");
ok(lvPhysicalCatalog().length<=200,"walkable shelf displays only a readable sample");
ok(SHOP_CATS.every(cat=>lvPhysicalCatalog().some(x=>x.category===cat)),"each category receives visible shelf stock");
lvProgress.unlocked=1;lvPending=null;phase="title";

// Every room uses one fixed, deliberately challenging profile; old profile saves migrate in place.
ok(Object.keys(LV_DIFFICULTIES).length===1&&LV_DIFFICULTIES.hard.id==="hard","chapter rules expose exactly one fixed difficulty profile");
ok(Math.abs(lvDifficulty().window-0.68)<1e-10&&Math.abs(lvDifficulty().penalty-1.4)<1e-10&&Math.abs(lvDifficulty().fatigue-1.35)<1e-10,"the single ruleset has fixed challenge, penalty and fatigue multipliers");
ok(!localStorage.getItem("anders-room-difficulty-v1"),"the obsolete difficulty-picker preference is removed");
const hardBudgetTable=LV_CHAPTERS.map(ch=>lvBudgetFor(ch.id));
ok(JSON.stringify(hardBudgetTable)==="[65,76,88,100,155,388]","all chapters use their modeled fixed-hard budgets");
ok(lvBudgetFor("bellhouse","calm")===lvBudgetFor("bellhouse","strict"),"legacy profile arguments cannot change a chapter budget");
const hardLong=lvHardBudgetDetails("thousand"),hardSubtotal=hardLong.foodCost+hardLong.careReserve+hardLong.setupReserve+hardLong.mechanismReserve;
ok(hardLong.planningKcalPerDay===1463,"fixed-hard chapters plan 103 percent of measured baseline calories");
ok(Math.abs(hardLong.riskAndPackingReserve/hardSubtotal-0.1)<1e-10,"fixed-hard budget keeps a ten-percent packing and risk reserve");
ok(gameBudget()===300,"classic 365-day budget remains unchanged outside chapter mode");
let legacyBase=startChapter("bellhouse",{water:1});const legacySnapshot=JSON.parse(JSON.stringify(legacyBase));
for(const profile of ["calm","standard","strict","extreme"]){
  const oldSave=JSON.parse(JSON.stringify(legacySnapshot));oldSave.level.difficulty=profile;
  ok(validateSave(oldSave),"legacy "+profile+" save remains valid");G=oldSave;
  ok(lvState().difficulty==="hard","legacy "+profile+" save migrates to fixed-hard rules");
}
G=JSON.parse(JSON.stringify(legacySnapshot));lvState();

let g=startChapter("bellhouse",{water:1},"calm");ok(G.level.difficulty==="hard"&&Math.abs(G.cash-(65-cartSummary({water:1}).cost))<0.01,"checkout records the fixed-hard chapter budget and deducts only purchased goods");
g=startChapter("night-radio",{radio:1});ok(lvWithinWindow(2*1440+21*60+15,20*60+30,22*60),"the fixed-hard radio window retains its midpoint");
ok(!lvWithinWindow(2*1440+20*60+30,20*60+30,22*60),"the fixed-hard radio window remains narrower than its full clue interval");
g=startChapter("bellhouse",{water:1});G.minute=3*1440+12*60;lvTryAt("bell",G.minute);ok(Math.abs(G.level.penalty-1.4)<1e-10,"a wrong-mechanism penalty follows the one fixed-hard profile");

g=startChapter("bellhouse");
ok(g.level.id==="bellhouse"&&g.level.nominal===60,"fresh chapter save stores its chapter rules");
ok(timeHidden()&&gameGoalDays()===60&&gameBudget()===65,"chapter hides the clock and loads its own fixed-hard goal and budget");
G.minute=1440+23*60+30;ok(lvTryAt("bell",G.minute),"night bell accepted within its hidden window");
ok(G.level.cut===1&&G.level.correct===1,"correct bell silently shortens the hidden remaining days");
G.minute=2*1440+30;ok(!lvTryAt("bell",G.minute),"crossing midnight cannot create a second press for the same night");
G.minute=3*1440+12*60;ok(!lvTryAt("bell",G.minute),"a daylight press is not correct");
ok(G.level.wrong===1&&Math.abs(G.level.penalty-1.4)<1e-10,"wrong press adds the fixed-hard hidden penalty");
ok(validateSave(JSON.parse(JSON.stringify(G))),"chapter save validates and round-trips");
let bad=JSON.parse(JSON.stringify(G));bad.level.id="made-up";ok(!validateSave(bad),"unknown chapter IDs are rejected");
bad=JSON.parse(JSON.stringify(G));bad.level.rng=-1;ok(!validateSave(bad),"invalid chapter random state is rejected");

// Chapter-only palate memory is shared across trait tags, accumulates with meals, and fades with game time.
g=startChapter("bellhouse",{water:1},"standard");
const tasteFood={id:"test_taste_food",name:"测试风味食品",kind:"food",life:9999,flavor:"plain-grain",trait:"sweet",tasteTags:["sweet","soft"],joy:0.5,kcal:180};DB[tasteFood.id]=tasteFood;
G.stats.morale=80;G.stats.food=G.stats.water=G.stats.energy=100;G.stats.health=100;G.nextEvent=1e7;G.level.taste={};
let tasteN=0;function eatTaste(){const uid="itaste"+(tasteN++);G.inv.push({uid,id:tasteFood.id,units:1,packed:false,opened:false,location:"shelf",bag:0,age:0,created:G.minute});consumeMeal(uid,true,false);}
for(let i=0;i<9;i++)eatTaste();
const samePenalty=lvTastePenalty(tasteFood),sibling={...tasteFood,id:"test_sibling",flavor:"different-fruit",trait:"sweet",tasteTags:["sweet"]};
const exposure=G.level.taste["flavor:plain-grain"];
ok(samePenalty>1,"repeated meals build a meaningful trait-based boredom penalty");
ok(lvTastePenalty(sibling)>0,"different foods sharing the same traits inherit some monotony");
const beforeTenth=G.stats.morale;eatTaste();ok(G.stats.morale<beforeTenth,"accumulated boredom reduces chapter morale");
const beforeFade=G.level.taste["flavor:plain-grain"];lvDecayTaste(30*1440);
ok(Math.abs(G.level.taste["flavor:plain-grain"]/beforeFade-0.5)<0.002,"palate fatigue has a slow thirty-day half-life");
ok(validateSave(JSON.parse(JSON.stringify(G))),"trait exposure persists in validated chapter saves");
bad=JSON.parse(JSON.stringify(G));bad.level.taste["flavor:plain-grain"]=101;ok(!validateSave(bad),"impossible palate exposure is rejected");
const unmarked=CATALOG.find(i=>i.life<9999&&i.expiryMark==="unmarked"),blurred=CATALOG.find(i=>i.life<9999&&i.expiryMark==="blurred");
ok(!!unmarked&&!!blurred,"catalogue contains both absent and smudged expiry labels");
const labelBatch={age:0,location:"shelf"}, publicExpiry=expiryPublicLabel(unmarked);
ok(publicExpiry.includes("常规保质期")&&publicExpiry.includes(expiryRangeText(unmarked))&&publicExpiry.includes("包装未印生产日期")&&!publicExpiry.includes("标示保质期"+unmarked.life),"unmarked goods show a useful nominal range without claiming an exact batch date");
ok(expiryPublicLabel(blurred).includes("生产日期字迹模糊")&&expiryPublicLabel(blurred).includes(expiryRangeText(blurred)),"blurred labels retain batch-date uncertainty while showing the nominal range");
ok(expiryInventoryLabel(unmarked,labelBatch).includes("已存放约0天")&&expiryInventoryLabel(unmarked,labelBatch).includes("批次余期不明"),"inventory shows storage time without inventing a precise remaining life");
labelBatch.age=unmarked.life;ok(isSpoiled({id:unmarked.id,age:unmarked.life})&&expiryInventoryLabel(unmarked,labelBatch).includes("已变质"),"spoilage still follows the exact internal shelf-life clock");
ok(CG_EXTRA_PRODUCTS.length>=10&&CG_EXTRA_PRODUCTS.every(i=>DB[i.id]?.tasteTags?.length),"new foods add differentiated taste traits and descriptions");
ok(new Set(CG_EXTRA_PRODUCTS.map(i=>i.shape?.[0]).filter(Boolean)).size>=7,"new catalogue products use distinct package and produce silhouettes");

// Packaging and meal scraps accumulate separately; only chapter mode gets a full-bin tidiness effect.
g=startChapter("bellhouse",{fish:2,water:1});clearWaste();
const wasteFood=G.inv.find(i=>i.id==="fish");wasteFood.opened=false;
ok(markPackageOpened(wasteFood)&&!markPackageOpened(wasteFood),"each package produces waste only on first opening");
consumeMeal(wasteFood.uid,true,true);
ok(G.waste.packaging===1&&G.waste.scraps===1&&G.trash===2,"opening and eating track packaging and meal scraps separately");
G.dirt=0;addWaste("discarded","fish",10);dailyUpdate();
ok(G.trash===12&&G.dirt>0&&G.waste.warnedFull,"chapter waste above capacity gradually affects tidiness");
const chapterLevel=G.level;G.level=null;G.dirt=0;dailyUpdate();
ok(G.dirt===0,"classic mode records waste without adding the chapter penalty");G.level=chapterLevel;
doAction("trash");ok(G.trash===0&&G.waste.packaging===0&&G.waste.scraps===0&&G.waste.discarded===0,"the trash action clears categorized waste");

// Each chapter has its own operational trigger, and no operation emits success/failure text.
g=startChapter("sealed");
G.level.cueNo=1;G.level.cueOpen=true;G.level.cueUntil=G.minute+20;G.minute=G.minute+5;
ok(lvTryAt("wall",G.minute),"response during the knock cue is accepted");
ok(G.level.cut===3&&G.level.correct===1,"wall response shortens several hidden days");
g=startChapter("night-radio",{radio:1});
G.minute=2*1440+21*60;ok(lvTryAt("radio",G.minute),"the evening radio signal is a valid chapter action");
ok(G.level.cut===3,"radio chapter has a distinct reward size");
g=startChapter("ledger",{lighter:1});
lrPrecip=()=>"rain";G.minute=2*1440+19*60;
ok(lvTryAt("ledger",G.minute,true),"rain, evening and a lighter trigger the ledger mechanism");
ok(G.level.cut===2&&amount("lighter")===39,"the ledger uses a real lighter charge and shortens the wait");
g=startChapter("clockmaker");
G.minute=2*1440+12*60;ok(lvTryAt("clock",G.minute,false),"the grandfather-clock action is time-window gated");
ok(G.level.cut===4,"the clockmaker chapter has its own shortening amount");
g=startChapter("thousand",{radio:1,lighter:1});
G.minute=2*1440+23*60+30;ok(lvTryAt("bell",G.minute),"the thousand-day room combines the bell mechanism");
G.minute=3*1440+21*60;ok(lvTryAt("radio",G.minute),"the thousand-day room combines the radio mechanism");
lrPrecip=()=>"rain";G.minute=4*1440+19*60;ok(lvTryAt("ledger",G.minute,true),"the thousand-day room combines the rain ledger");
ok(G.level.cut===10,"combined mechanisms each reduce their own number of hidden days");

// The new hand-skill games are distinct from the secret chapter-time gates.
g=startChapter("bellhouse");
ok(lvMiniConfig("bell").kind==="timing"&&lvMiniConfig("wall").kind==="memory","doorbell and wall use distinct timing and spatial-memory games");
ok(lvMiniConfig("radio").kind==="tune"&&lvMiniConfig("ledger").motif==="flame","radio tuning and ledger flame control have chapter-specific play");
ok(lvMiniConfig("clock",false).motif==="pendulum"&&lvMiniConfig("clock",true).kind==="crank","grandfather clock has separate pendulum and winding games");
const wallPattern=lvMiniPattern(4,3,"wall");ok(wallPattern.length===4&&wallPattern.every(x=>x>=0&&x<3)&&JSON.stringify(wallPattern)===JSON.stringify(lvMiniPattern(4,3,"wall")),"wall sequence is reproducible without advancing the game random stream");
g=startChapter("thousand",{radio:1,lighter:1});
ok(lvMiniConfig("wall").length===5&&lvMiniConfig("bell").attempts===4,"final room uses longer, harder versions of the same clue games");
G.minute=1440+23*60+30;ok(!lvTryAt("bell",G.minute,false,false)&&G.level.cut===0&&G.level.wrong===1,"a perfect hidden-window time still requires winning the hand-skill game");

// Bought clocks work, drift, stop for power, or need a battery/winding; time itself remains absent from HUD data.
g=startChapter("bellhouse",{lv_mwatch:1,lv_qwatch:1,lv_digital:1,lv_plugclock:1,battery:2});
const mechanical=G.inv.find(x=>x.id==="lv_mwatch"),quartz=G.inv.find(x=>x.id==="lv_qwatch"),digital=G.inv.find(x=>x.id==="lv_digital"),mains=G.inv.find(x=>x.id==="lv_plugclock");
for(const b of [mechanical,quartz,digital,mains]){b.packed=false;b.location="shelf";}
const wrist=lvReadDevice(mechanical);ok(/^[0-9]{2}:[0-9]{2}$/.test(wrist.time),"mechanical wristwatch provides an approximate time");
ok(wrist.sub.includes("误差"),"mechanical watch shows that its reading may drift");
ok(lvServiceDevice(quartz),"a quartz watch can be serviced with a purchased battery");
ok(/^[0-9]{2}:[0-9]{2}$/.test(lvReadDevice(quartz).time),"battery-powered quartz watch starts after fitting a cell");
ok(lvServiceDevice(digital),"a digital date clock can use a second purchased cell");
ok(/^1986-/.test(lvReadDevice(digital).sub),"date clock shows a calendar date only when it is purchased");
G.power=false;ok(lvReadDevice(mains).time==="00:00","plug-in display loses its time during an outage");
G.minute=quartz && G.level.devices[quartz.uid].batteryUntil+1;ok(lvReadDevice(quartz).time==="屏幕熄灭","quartz battery eventually runs down");

// Completing an actual chapter records stars and unlocks the next chapter without adding free goods.
g=startChapter("bellhouse");
G.minute=G.level.nominal*1440-3;G.stats.food=100;G.stats.water=100;G.stats.energy=100;G.stats.morale=100;G.stats.health=100;G.nextEvent=1e9;
simulate(5,"idle");
ok(G.ended&&G.win,"hidden countdown can finish the chapter");
ok(lvProgress.unlocked>=2&&lvProgress.clears.bellhouse,"chapter victory persists a clear and unlock");
ok(lvProgress.clears.bellhouse.stars>=1,"chapter victory awards a star rating");
console.log("PASS",checks,"chapter assertions");
`);
