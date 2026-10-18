// Deterministic regression for the hidden-clock chapter mode. No browser, server or network required.
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
for (const f of ["src/data.js","src/catalog-gen.js","src/core.js","src/life-text.js","src/life.js","src/life-more.js","src/life-real.js","src/life-home.js","src/life-items.js","src/life-catalog.js","src/levels.js"])
  vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f});
const run = (code) => vm.runInContext(code,ctx);
run(`
let checks=0; function ok(x,m){assert.ok(x,m);checks++;}
function startChapter(id, kit={water:1}){
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
lvProgress.unlocked=6;const full=lvCatalogStock();
ok(full.length===CATALOG.length+LV_PRODUCTS.length,"last unlock exposes the entire catalogue");
ok(new Set(full.map(x=>x.id)).size===full.length,"chapter catalogue IDs are unique");
ok(lvPhysicalCatalog().length<=200,"walkable shelf displays only a readable sample");
lvProgress.unlocked=1;lvPending=null;phase="title";

let g=startChapter("bellhouse");
ok(g.level.id==="bellhouse"&&g.level.nominal===60,"fresh chapter save stores its chapter rules");
ok(timeHidden()&&gameGoalDays()===60&&gameBudget()===300,"chapter hides the clock and loads its own goal and budget");
G.minute=1440+23*60+30;ok(lvTryAt("bell",G.minute),"night bell accepted within its hidden window");
ok(G.level.cut===1&&G.level.correct===1,"correct bell silently shortens the hidden remaining days");
G.minute=2*1440+30;ok(!lvTryAt("bell",G.minute),"crossing midnight cannot create a second press for the same night");
G.minute=3*1440+12*60;ok(!lvTryAt("bell",G.minute),"a daylight press is not correct");
ok(G.level.wrong===1&&G.level.penalty===1,"wrong press adds a hidden penalty");
ok(validateSave(JSON.parse(JSON.stringify(G))),"chapter save validates and round-trips");
let bad=JSON.parse(JSON.stringify(G));bad.level.id="made-up";ok(!validateSave(bad),"unknown chapter IDs are rejected");
bad=JSON.parse(JSON.stringify(G));bad.level.rng=-1;ok(!validateSave(bad),"invalid chapter random state is rejected");

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
