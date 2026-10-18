/* Chapter mode: a room with no clock. Correct hidden mechanisms shorten the wait;
   no success/failure notification is emitted until the chapter ends. */
const LV_KEY = "anders-room-chapters-v1";
const LV_CHAPTERS = [
  {
    id: "bellhouse", no: 1, title: "借住的人", place: "北区旧公寓 · 18层", nominal: 60, budget: 300,
    synopsis: "你替一个从不露面的邮差守着房间。门边多了一枚磨亮的旧按钮，楼道尽头偶尔有人报时。",
    rumor: "“有些门铃只在没人看见时才响。”房东说完便换了话题。",
    hint: "房间里有一枚墙上的按钮。楼道的声音不是每天都一样。",
    window: false,
  },
  {
    id: "sealed", no: 2, title: "封窗之后", place: "北区旧公寓 · 封窗房", nominal: 90, budget: 380,
    synopsis: "房东把窗户钉死，留下了墙纸和几块颜色不同的木板。隔壁住着一位听力很好的老人。",
    rumor: "“他从来不开门，只敲墙。你要是听见，就当没听见。”",
    hint: "窗外的光被木板挡住了。墙上有一块补过的地方。",
    window: true,
  },
  {
    id: "night-radio", no: 3, title: "夜航电台", place: "南港旧公寓 · 海风面", nominal: 120, budget: 520,
    synopsis: "夜里，远处的港口汽笛会穿过墙壁。桌上的收音机收得到一段没有台呼的短波。",
    rumor: "“海潮每天都一样，又每天都不一样。”一张旧纸条这样写。",
    hint: "窗边的天线朝着南边。夜里某个时段，杂音会变得很轻。",
    window: false,
  },
  {
    id: "ledger", no: 4, title: "漏雨的账本", place: "老城区公寓 · 漏雨房", nominal: 180, budget: 760,
    synopsis: "上任租客留下的账本被雨水洇开。几页边缘有红线，桌角有烧过的痕迹。",
    rumor: "“那本账本不记钱，只记欠下的日子。”",
    hint: "有些页角被水泡软了。雨声落在窗台时，屋里会有另一种气味。",
    window: false,
  },
  {
    id: "clockmaker", no: 5, title: "钟表匠的阁楼", place: "钟表街 · 顶层阁楼", nominal: 365, budget: 1080,
    synopsis: "这里曾经住过一位钟表匠。落地钟比屋里所有家具都高，摆锤被灰布盖住。",
    rumor: "“他每天都来上弦，却总说钟走得不对。”",
    hint: "墙上没有挂历。落地钟的摆锤偶尔停在最高处。",
    window: false,
  },
  {
    id: "thousand", no: 6, title: "没有第几天", place: "安德士帝国 · 旧楼深处", nominal: 1000, budget: 2500,
    synopsis: "一间没有窗的旧房子，墙上有按钮、敲痕和被雨水泡过的账本。走廊尽头有一台收音机。",
    rumor: "“不要相信它们各自说的话。把三种声音放在一起。”",
    hint: "留下的线索互相矛盾，却又像是同一个人的手笔。没有人说过你该怎么做。",
    window: true,
  },
];
const LV_BY_ID = Object.fromEntries(LV_CHAPTERS.map((c) => [c.id, c]));
const LV_PRODUCTS = [];
const LV = {};
function lvAddProduct(id, name, price, weight, category, clock, desc, shape) {
  const it = {
    id, name, price, weight, servings: 1, kcal: 0, life: 9999,
    category, kind: "tool", look: "tool", levelClock: clock,
    desc, note: desc, fx: "", shape,
  };
  DB[id] = it;
  LV_PRODUCTS.push(it);
}
// Timekeeping is available in chapter shops but is deliberately excluded from the classic catalogue.
// Chapter-specific shortening mechanisms are room fixtures, never shop items.
lvAddProduct("lv_mwatch", "安德士机械腕表 · 旧式", 5.8, 0.055, "tool", "mechanical", "不用电池，但会走快走慢；连续走七天左右要重新上弦。拆包后按 T 抬腕查看。", ["clock", [0.16, 0.24, 0.08], "#5a604f"]);
lvAddProduct("lv_qwatch", "红星石英腕表 · 需电池", 4.6, 0.04, "tool", "quartz", "需用 Shift+E 给腕表装入干电池；约三十天耗尽一节。拆包后按 T 查看。", ["clock", [0.16, 0.24, 0.08], "#596b70"]);
lvAddProduct("lv_alarm", "双铃机械闹钟 · 需上弦", 1.6, 0.32, "furniture", "mechanical", "不用电池；对准闹钟按 Shift+E 上弦，能看大致时刻。走时会有误差。", ["clock", [0.22, 0.17, 0.1], "#71806d"]);
lvAddProduct("lv_wallclock", "木壳挂钟 · 旧机芯", 3.2, 0.75, "furniture", "mechanical", "挂钟不需要电池，但会逐渐走偏；对准后按 Shift+E 上弦。", ["clock", [0.28, 0.38, 0.13], "#765638"]);
lvAddProduct("lv_digital", "绿字石英钟 · 带日期", 2.75, 0.18, "furniture", "digital", "电子屏显示时刻和日期；需要干电池，停电不影响，但电池会耗尽。对准后按 Shift+E 装电池。", ["clock", [0.25, 0.12, 0.08], "#394940"]);
lvAddProduct("lv_plugclock", "插电红字钟", 1.95, 0.26, "furniture", "mains", "插电工作；停电时归零，来电后要重新校时。", ["clock", [0.3, 0.12, 0.08], "#52443d"]);
lvAddProduct("lv_calendar", "1986撕页日历", 0.75, 0.34, "leisure", "calendar", "不显示时刻；每天自己撕下一页，记录日期。按 T 查看，Shift+E 手动撕页。", ["clock", [0.18, 0.26, 0.035], "#c9bd9d"]);
lvAddProduct("lv_sandglass", "半小时沙漏", 1.25, 0.16, "tool", "hourglass", "只能估量一段时间，不能告诉你现在几点。", ["clock", [0.085, 0.22, 0.085], "#a88c61"]);

let lvPending = null;
let lvBaseSeed = "";
let lvShopPage = 0;
let lvOrderPage = 0;
let lvOrderCategory = "all";
let lvOrderQuery = "";
let lvOrderOpen = false;
let lvRoom = null;
let lvRoomId = "";
let lvPropRoot = null;
let lvGrandPendulum = null;
let lvProgress = lvReadProgress();
function lvReadProgress() {
  const fresh = { unlocked: 1, clears: {} };
  try {
    const v = JSON.parse(localStorage.getItem(LV_KEY) || "null");
    if (!v || typeof v !== "object") return fresh;
    fresh.unlocked = Math.max(1, Math.min(6, Math.floor(Number(v.unlocked) || 1)));
    if (v.clears && typeof v.clears === "object") {
      for (const c of LV_CHAPTERS) {
        const r = v.clears[c.id];
        if (r && Number.isFinite(r.stars) && Number.isFinite(r.days))
          fresh.clears[c.id] = { stars: Math.max(1, Math.min(3, r.stars)), days: Math.max(0, Math.floor(r.days)), correct: Math.max(0, Math.floor(r.correct || 0)), wrong: Math.max(0, Math.floor(r.wrong || 0)) };
      }
    }
  } catch (e) {}
  return fresh;
}
function lvSaveProgress() {
  try { localStorage.setItem(LV_KEY, JSON.stringify(lvProgress)); } catch (e) {}
}
function lvDef(id = G?.level?.id || lvPending) {
  return LV_BY_ID[id] || LV_CHAPTERS[0];
}
function lvUnlocked() {
  return Math.max(1, Math.min(6, lvProgress.unlocked || 1));
}
function lvBudget() {
  const id = phase === "shop" && lvPending ? lvPending : G?.level?.id;
  return LV_BY_ID[id]?.budget || 300;
}
function lvGoalDays() {
  const id = phase === "shop" && lvPending ? lvPending : G?.level?.id;
  return LV_BY_ID[id]?.nominal || 365;
}
function lvChapterLabel() {
  return G?.level ? `${String(lvDef(G.level.id).no).padStart(2, "0")} · ${lvDef(G.level.id).title}` : "没有日期的房间";
}
function lvWindowBlocked() {
  return !!(G?.level && !G.ended && phase === "playing" && lvDef(G.level.id).window);
}
function lvNewRun(id, seed) {
  const c = lvDef(id);
  return {
    id, nominal: c.nominal, cut: 0, penalty: 0,
    correct: 0, wrong: 0, missed: 0,
    lastAttempt: {}, lastCueAt: 0, cueAt: 0, cueUntil: 0, cueOpen: false, cueNo: 0,
    rng: hashSeed(`${seed}|${id}|hidden-mechanism`),
    elapsed: 0, startedAt: 0, devices: {}, deviceBattery: 0,
    lastStory: false, stars: 0, complete: false,
    windAt: 0, clockDrift: ((hashSeed(seed + "clock-drift") % 17) - 8),
    datePages: 0,
  };
}
function lvState() { return G?.level && LV_BY_ID[G.level.id] ? G.level : null; }
const lvBaseFreshState = freshState;
freshState = function (seed) {
  const s = lvBaseFreshState.apply(this, arguments);
  if (lvPending && phase === "shop") {
    s.level = lvNewRun(lvPending, seed);
    s.level.startedAt = s.minute;
    s.level.windAt = s.minute;
    if (s.level.id === "sealed" || s.level.id === "thousand")
      s.level.cueAt = s.minute + Math.floor((1.7 + rngNext(s.level) * 2.6) * 1440);
  }
  return s;
};
const lvBaseValidateSave = validateSave;
validateSave = function (s) {
  if (!lvBaseValidateSave.apply(this, arguments)) return false;
  if (s.level === undefined) return true;
  const l = s.level, maxMinute = 2000 * 1440;
  const n = (v, min = 0, max = maxMinute) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const bool = (v) => typeof v === "boolean";
  if (!l || typeof l !== "object" || !LV_BY_ID[l.id] || l.nominal !== LV_BY_ID[l.id].nominal) return false;
  for (const [k, min, max] of [["cut",0,1e7],["penalty",0,1e7],["correct",0,1e6],["wrong",0,1e6],["missed",0,1e6],["cueAt",0,maxMinute],["cueUntil",0,maxMinute],["cueNo",0,1e6],["rng",0,4294967295],["elapsed",0,2000],["startedAt",0,maxMinute],["windAt",0,maxMinute],["datePages",0,2000],["clockDrift",-100,100],["stars",0,3]]) if (!n(l[k],min,max)) return false;
  if (!["cueOpen","lastStory","complete"].every((k) => bool(l[k]))) return false;
  if (!l.lastAttempt || typeof l.lastAttempt !== "object" || Array.isArray(l.lastAttempt) || Object.keys(l.lastAttempt).length > 32) return false;
  for (const [k,v] of Object.entries(l.lastAttempt)) if (k.length > 40 || !n(v,0,2000)) return false;
  if (!l.devices || typeof l.devices !== "object" || Array.isArray(l.devices) || Object.keys(l.devices).length > 1000) return false;
  for (const [uid,d] of Object.entries(l.devices)) {
    if (!/^i[a-z0-9]{3,24}$/.test(uid) || !d || typeof d !== "object") return false;
    for (const k of ["woundUntil","batteryUntil","setAt"]) if (!n(d[k],0,maxMinute)) return false;
    for (const k of ["offset","drift"]) if (!n(d[k],-1e7,1e7)) return false;
    if (d.sandUntil !== undefined && !n(d.sandUntil,0,maxMinute)) return false;
    if (d.initialized !== undefined && !bool(d.initialized)) return false;
  }
  return true;
};
function lvRemaining(state = lvState()) {
  if (!state) return 365 - day();
  return Math.max(0, state.nominal - Math.floor((G?.minute || 0) / 1440) - state.cut + state.penalty);
}
function lvMode() { return !!(G && lvState() && !G.ended); }
function lvCatalogTier() { return lvUnlocked(); }
function lvLineRank() {
  if (LV._lineRank) return LV._lineRank;
  const groups = new Map();
  for (let i = 0; i < CATALOG.length; i++) {
    const it = CATALOG[i];
    if (!it.gen) continue;
    const key = it.line || it.id;
    if (!groups.has(key)) groups.set(key, i);
  }
  const sorted = [...groups.entries()].sort((a, b) => a[1] - b[1]);
  LV._lineRank = new Map(sorted.map(([key], i) => [key, 1 + (i % 6)]));
  return LV._lineRank;
}
function lvCatalogStock() {
  const tier = lvCatalogTier(), ranks = lvLineRank();
  return CATALOG.filter((it) => !it.gen || (ranks.get(it.line || it.id) || 1) <= tier).concat(LV_PRODUCTS);
}
function lvPhysicalCatalog() {
  const all = lvCatalogStock(), out = [];
  for (const category of SHOP_CATS) {
    const rows = all.filter((it) => it.category === category);
    // The walkable shelves show a readable sample; every unlocked item is in the printed order book.
    rows.sort((a, b) => hashSeed("shelf|" + a.id) - hashSeed("shelf|" + b.id));
    out.push(...rows.slice(0, 20));
  }
  return out;
}
const lvBaseShopStock = shopStock;
shopStock = function (seed) {
  if (lvPending && phase === "shop") return lvCatalogStock();
  return lvBaseShopStock(seed);
};
function lvClockBatches() {
  return G?.inv.filter((b) => !b.packed && b.units > 0 && DB[b.id]?.levelClock) || [];
}
function lvDevice(batch) {
  const l = lvState();
  if (!l || !batch) return null;
  l.devices ||= {};
  if (!l.devices[batch.uid]) l.devices[batch.uid] = { initialized: false, woundUntil: 0, batteryUntil: 0, setAt: 0, offset: ((hashSeed(G.seed + batch.uid) % 31) - 15), drift: ((hashSeed(batch.uid + "drift") % 9) - 4) };
  const d = l.devices[batch.uid];
  if (!d.initialized) {
    d.initialized = true;
    d.setAt = G.minute;
    if (DB[batch.id].levelClock === "mechanical") d.woundUntil = G.minute + 7 * 1440;
  }
  return d;
}
function lvConsumeOne(id) {
  const b = G?.inv.find((x) => !x.packed && x.units > 0 && isItem(x, id));
  if (!b) return false;
  b.units = Math.max(0, b.units - 1);
  if (b.units <= 0.0001) G.inv = G.inv.filter((x) => x.units > 0.0001);
  return true;
}
function lvServiceDevice(batch) {
  const kind = DB[batch?.id]?.levelClock;
  if (!kind || batch.packed) return false;
  const d = lvDevice(batch);
  if (kind === "mechanical") {
    d.woundUntil = G.minute + 7 * 1440;
    d.offset += ((hashSeed(batch.uid + String(G.minute)) % 9) - 4);
    logEvent("拧紧了机芯的发条，齿轮开始转动。", "good");
  } else if (kind === "quartz" || kind === "digital") {
    if (!lvConsumeOne("battery")) return notify("没有拆开的干电池，没法更换。", "warn");
    d.batteryUntil = G.minute + 30 * 1440;
    d.offset += ((hashSeed(batch.uid + String(G.minute)) % 7) - 3);
    logEvent("换上了一节干电池，屏幕亮了。", "good");
  } else if (kind === "mains") {
    d.offset = 0;
    logEvent("停电后电子钟重新校好。", "good");
  } else if (kind === "calendar") {
    l.datePages = Math.min(2000, l.datePages + 1);
    logEvent("撕下了日历的一页。", "normal");
  } else if (kind === "hourglass") {
    d.sandUntil = G.minute + 30;
    logEvent("把沙漏翻了过来。", "normal");
  } else return false;
  advanceTime(2, "organize", false);
  syncRoom();
  saveGame(false);
  return true;
}
function lvDateText(days) {
  const date = new Date(Date.UTC(1986, 0, 1 + Math.max(0, days)));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function lvReadDevice(batch) {
  const kind = DB[batch.id]?.levelClock, d = lvDevice(batch), l = lvState();
  if (!kind || !d || !l) return null;
  if (kind === "hourglass") return { time: d.sandUntil > G.minute ? `剩约${Math.ceil(d.sandUntil - G.minute)}分钟` : "沙漏已落完", sub: "不能告诉你现在几点" };
  if (kind === "calendar") return { time: lvDateText(l.datePages || 0), sub: `手撕日历 · 已翻到第 ${l.datePages || 1} 页` };
  if (kind === "mechanical" && G.minute >= d.woundUntil) return { time: "停摆了", sub: "机械机芯 · 需要上弦" };
  if ((kind === "quartz" || kind === "digital") && G.minute >= d.batteryUntil) return { time: "屏幕熄灭", sub: "石英机芯 · 需要干电池" };
  if (kind === "mains" && !G.power) return { time: "00:00", sub: "停电后归零" };
  const drift = d.offset + Math.floor(Math.max(0, G.minute - d.setAt) / 1440) * d.drift;
  const seen = kind === "mains" ? G.minute : G.minute + drift;
  const hh = Math.floor(((seen % 1440) + 1440) % 1440 / 60), mm = Math.floor(((seen % 60) + 60) % 60);
  return { time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, sub: kind === "digital" ? lvDateText(Math.floor(G.minute / 1440)) : kind === "mains" ? "市电 · 停电会归零" : `走时误差约 ${Math.abs(drift)} 分钟` };
}
function lvWristLines() {
  if (!lvMode()) return [`${String(Math.floor(hour())).padStart(2, "0")}:${String(Math.floor(G.minute % 60)).padStart(2, "0")}`, `DAY ${String(day()).padStart(3, "0")}`];
  const devices=lvClockBatches();
  if (!devices.length) return ["——", "没有可用的计时器"];
  let stopped=null;
  for (const batch of devices) {
    const r=lvReadDevice(batch);
    if (r && !["停摆了","屏幕熄灭"].includes(r.time)) return [r.time,r.sub];
    stopped ||= r;
  }
  return stopped ? [stopped.time,stopped.sub] : ["——","时间没有留下痕迹"];
}
function lvWristText() { return lvWristLines()[0]; }
function lvScrub(text) {
  if (!G?.level || typeof text !== "string") return text;
  return text
    .replace(/整整365天过去了/g, "漫长的日子终于过去")
    .replace(/目标365天/g, "本章的期限")
    .replace(/还有\s*\d+\s*天/g, "还要等一阵")
    .replace(/第\s*\d+\s*天。/g, "某一天。")
    .replace(/第\s*\d+\s*天，/g, "某一天，")
    .replace(/第\s*\d+\s*天$/g, "某一天");
}
const lvBaseLogEvent = logEvent;
logEvent = function (text, type = "normal") {
  if (G?.level) text = lvScrub(text);
  return lvBaseLogEvent(text, type);
};
function lvRand(l) { return rngNext(l); }
function lvNextCue(minute) {
  const l = lvState();
  if (!l) return;
  l.cueAt = minute + Math.floor((2.2 + lvRand(l) * 2.8) * 1440);
  l.cueUntil = 0;
  l.cueOpen = false;
}
function lvSound(name, count = 1) {
  if (typeof auPlay !== "function") return;
  const delays = count === 1 ? [0] : Array.from({ length: count }, (_, i) => i * 0.42);
  for (const delay of delays) auPlay(name, 0.56, { delay, vary: 0.04 });
}
function lvTimeOf(minute) { return ((minute % 1440) + 1440) % 1440; }
function lvInWindow(minute, start, end) {
  const t = lvTimeOf(minute);
  return start <= end ? t >= start && t <= end : t >= start || t <= end;
}
function lvAttemptOnce(key, at = G.minute, dayKey = null) {
  const l = lvState();
  if (!l) return false;
  l.lastAttempt ||= {};
  const d = dayKey === null ? Math.floor(at / 1440) : dayKey;
  if (l.lastAttempt[key] === d) return false;
  l.lastAttempt[key] = d;
  return true;
}
function lvOutcome(ok, reward, penalty = 1) {
  const l = lvState();
  if (!l) return false;
  if (ok) { l.correct++; l.cut += reward; }
  else { l.wrong++; l.penalty += penalty; }
  return !!ok;
}
function lvTryAt(action, at = G.minute, shift = false) {
  const l = lvState();
  if (!l) return false;
  const id = l.id, t = lvTimeOf(at);
  if (id === "bellhouse" || (id === "thousand" && action === "bell")) {
    const key = id === "thousand" ? "bell" : "press";
    const night = Math.floor(at / 1440) - (lvTimeOf(at) < 60 ? 1 : 0);
    if (!lvAttemptOnce(key, at, night)) return false;
    const ok = lvInWindow(at, 23 * 60, 60);
    lvOutcome(ok, id === "thousand" ? 4 : 1, id === "thousand" ? 2 : 1);
    return ok;
  }
  if (id === "sealed") {
    if (action !== "wall" || !lvAttemptOnce("wall-" + l.cueNo, at)) return false;
    const ok = l.cueOpen && at <= l.cueUntil;
    lvOutcome(ok, 3, 2);
    l.cueOpen = false;
    lvNextCue(at);
    return ok;
  }
  if (id === "night-radio") {
    if (action !== "radio" || !lvAttemptOnce("radio", at)) return false;
    const ok = lvInWindow(at, 20 * 60 + 30, 22 * 60) && (G.power || has("battery"));
    lvOutcome(ok, 3, 2);
    return ok;
  }
  if (id === "ledger") {
    if (action !== "ledger" || !shift || !lvAttemptOnce("ledger", at)) return false;
    const rain = typeof lrPrecip === "function" ? lrPrecip(at) === "rain" : false;
    const ok = lvInWindow(at, 18 * 60, 20 * 60) && rain && has("lighter");
    if (has("lighter")) lvConsumeOne("lighter");
    lvOutcome(ok, 2, 2);
    return ok;
  }
  if (id === "clockmaker") {
    if (action !== "clock") return false;
    if (shift) {
      if (!lvAttemptOnce("wind", at)) return false;
      if (at - (l.windAt || l.startedAt) < 6 * 1440) {
        l.wrong++; l.penalty++;
        return false;
      }
      l.windAt = at;
      return true;
    }
    if (!lvAttemptOnce("clock", at)) return false;
    const due = !l.windAt || at - l.windAt <= 8 * 1440;
    const ok = lvInWindow(at, 11 * 60 + 50, 12 * 60 + 10) && due;
    lvOutcome(ok, 4, 3);
    return ok;
  }
  if (id === "thousand") {
    if (action === "wall") {
      if (!lvAttemptOnce("wall-" + l.cueNo, at)) return false;
      const ok = l.cueOpen && at <= l.cueUntil;
      lvOutcome(ok, 3, 2);
      l.cueOpen = false;
      lvNextCue(at);
      return ok;
    }
    if (action === "radio") {
      if (!lvAttemptOnce("radio", at)) return false;
      const ok = lvInWindow(at, 20 * 60 + 30, 22 * 60) && (G.power || has("battery"));
      lvOutcome(ok, 4, 2); return ok;
    }
    if (action === "ledger") {
      if (!shift || !lvAttemptOnce("ledger", at)) return false;
      const rain = typeof lrPrecip === "function" && lrPrecip(at) === "rain";
      const ok = lvInWindow(at, 18 * 60, 20 * 60) && rain && has("lighter");
      if (has("lighter")) lvConsumeOne("lighter");
      lvOutcome(ok, 2, 2); return ok;
    }
  }
  return false;
}
function lvProcess(before, after, minutes, context) {
  const l = lvState();
  if (!l || G.ended) return;
  const step = after - before;
  l.elapsed = Math.floor(after / 1440);
  if ((l.id === "sealed" || l.id === "thousand") && l.cueAt && before < l.cueAt && after >= l.cueAt) {
    l.cueOpen = true;
    l.cueNo++;
    l.cueUntil = l.cueAt + 20;
    l.lastCueAt = l.cueAt;
    l.cueAt = 0;
    G.lvBreak = true;
    lvSound("knock", 3);
  }
  if (l.cueOpen && after > l.cueUntil) {
    l.cueOpen = false;
    l.missed++;
    lvNextCue(after);
  }
  // The corridor chime is an environmental clue, not confirmation that the button worked.
  if ((l.id === "bellhouse" || l.id === "thousand") && lvTimeOf(before) < 23*60 && lvTimeOf(after) >= 23*60) lvSound("bell");
  // A receiver emits an indistinct burst during the night window. It is a clue, not confirmation.
  if ((l.id === "night-radio" || l.id === "thousand") && has("radio") && G.power) {
    const oldT = lvTimeOf(before), newT = lvTimeOf(after);
    if (oldT < 21 * 60 && newT >= 21 * 60) lvSound("radio_static");
  }
  if (l.id === "clockmaker" && lvTimeOf(before) < 12 * 60 && lvTimeOf(after) >= 12 * 60) lvSound("clock");
  if (step > 0) {
    for (const b of lvClockBatches()) {
      const d = lvDevice(b), kind = DB[b.id].levelClock;
      if (kind === "mechanical" && after >= d.woundUntil) d.woundUntil = 0;
      if ((kind === "quartz" || kind === "digital") && d.batteryUntil > 0 && after >= d.batteryUntil) d.batteryUntil = 0;
      if (kind === "mains" && !G.power) d.offset = -after;
    }
  }
  if (lvRemaining(l) <= 0 && !G.ended) {
    l.complete = true;
    endGame(true, "门外传来了约定好的声音。屋里的日子，到此为止。");
  }
}
const lvBaseSimulate = simulate;
simulate = function (minutes, context) {
  const before = G?.minute || 0;
  const result = lvBaseSimulate(minutes, context);
  if (G?.level && !G.ended) lvProcess(before, G.minute, minutes, context);
  return result;
};
function lvServiceOrTry(id, shift = false) {
  if (id === "bell") { lvTryAt("bell", G.minute, shift); advanceTime(1, "level-action", false); return; }
  if (id === "wall") { lvTryAt("wall", G.minute, shift); advanceTime(1, "level-action", false); return; }
  if (id === "ledger") {
    if (shift && !has("lighter")) return notify("抽屉里没有火柴或打火机。", "warn");
    lvTryAt("ledger", G.minute, shift); advanceTime(1, "level-action", false); return;
  }
  if (id === "clock") {
    lvTryAt("clock", G.minute, shift); advanceTime(1, "level-action", false); return;
  }
}
function lvBuildFixtures() {
  if (!G?.level || G.ended || phase !== "playing" || typeof roomRoot === "undefined" || !roomRoot || typeof W === "undefined" || !W.enabled) return;
  const id = G.level.id;
  if (lvRoom === roomRoot && lvRoomId === id && lvPropRoot) return;
  if (lvPropRoot?.parent) lvPropRoot.parent.remove(lvPropRoot);
  lvRoom = roomRoot;
  lvRoomId = id;
  lvGrandPendulum = null;
  lvPropRoot = new THREE.Group();
  lvPropRoot.userData.levelProps = true;
  roomRoot.add(lvPropRoot);
  const wood = worldMat("#68543c"), dark = worldMat("#373a33"), brass = worldMat("#a08a55", { metalness: 0.62, roughness: 0.3 }), cream = worldMat("#ddd1b3"), ink = worldMat("#45483c");
  const button = (x, y, z, rot, name, label) => {
    const g = worldTag(new THREE.Group(), "level:" + name, label);
    g.position.set(x, y, z); g.rotation.y = rot; lvPropRoot.add(g);
    worldBox(g, 0.24, 0.16, 0.055, 0, 0, 0, wood);
    worldBox(g, 0.17, 0.095, 0.012, 0, 0.005, 0.036, cream);
    const cap = worldCylinder(g, 0.035, 0.035, 0.025, 0, -0.035, 0.056, brass);
    cap.rotation.x = Math.PI / 2;
    worldBox(g, 0.11, 0.008, 0.006, 0, 0.055, 0.044, ink);
    return g;
  };
  const bell = id === "bellhouse" || id === "thousand";
  const wall = id === "sealed" || id === "thousand";
  const ledger = id === "ledger" || id === "thousand";
  const clock = id === "clockmaker";
  if (bell) button(-env.w / 2 + 0.13, 1.42, env.d / 2 - 0.92, Math.PI / 2, "bell", "旧电铃按钮");
  if (wall) button(env.w / 2 - 0.13, 1.34, 0.15, -Math.PI / 2, "wall", "墙上的空响处");
  if (ledger) {
    const g = worldTag(new THREE.Group(), "level:ledger", "洇开的账本");
    g.position.set(-0.22, 0.515, 0.91); g.rotation.y = -0.14; lvPropRoot.add(g);
    worldBox(g, 0.34, 0.022, 0.25, 0, 0, 0, wood);
    worldBox(g, 0.31, 0.012, 0.23, 0, 0.018, 0, cream);
    worldBox(g, 0.017, 0.005, 0.19, -0.12, 0.027, 0, ink);
    for (let i=0;i<5;i++) worldBox(g, 0.13, 0.003, 0.004, 0.04, 0.027, -0.075+i*0.035, i%2?ink:brass);
    g.userData.noPick = false;
  }
  if (clock) {
    const g = worldTag(new THREE.Group(), "level:clock", "钟表匠留下的落地钟");
    g.position.set(env.w / 2 - 0.43, 0, -0.25); lvPropRoot.add(g);
    worldBox(g, 0.52, 1.95, 0.36, 0, 0.975, 0, wood);
    worldBox(g, 0.43, 0.49, 0.055, 0, 1.58, 0.208, dark);
    const face = worldCylinder(g, 0.16, 0.16, 0.027, 0, 1.59, 0.244, cream); face.rotation.x = Math.PI/2;
    worldCylinder(g, 0.012, 0.012, 0.006, 0, 1.59, 0.263, ink).rotation.x = Math.PI/2;
    worldBox(g, 0.018, 0.115, 0.006, 0.018, 1.64, 0.266, ink);
    worldBox(g, 0.12, 0.009, 0.006, -0.035, 1.60, 0.265, brass);
    worldBox(g, 0.27, 0.62, 0.026, 0, 0.74, 0.195, worldMat("#81704b", { transparent:true, opacity:0.5 }));
    lvGrandPendulum = worldBox(g, 0.018, 0.42, 0.018, 0, 0.71, 0.23, brass);
    worldCylinder(g, 0.105, 0.105, 0.05, 0, 0.48, 0.23, brass);
    colliders.push(g);
  }
  if (lvWindowBlocked()) {
    const back = -env.d / 2;
    const board = worldBox(lvPropRoot, 2.48, 1.27, 0.09, 0, 1.72, back + 0.17, wood);
    board.userData.noPick = true;
    for (let x=-3;x<=3;x++) {
      const plank = worldBox(lvPropRoot, 0.025, 1.34, 0.095, x*0.35, 1.72, back + 0.11, dark);
      plank.userData.noPick = true;
    }
    for (const y of [1.19, 2.25]) {
      const bar = worldBox(lvPropRoot, 2.58, 0.07, 0.1, 0, y, back + 0.08, wood);
      bar.userData.noPick = true;
    }
  }
  if (id === "night-radio" || id === "thousand") {
    // A visible improvised antenna marks a chapter where listening matters; the existing radio remains usable.
    const g = new THREE.Group(); g.position.set(-1.42, 1.28, -env.d/2 + 0.53); g.rotation.z=0.12; lvPropRoot.add(g);
    worldBox(g,0.012,0.7,0.012,0,0.34,0,brass);
    worldBox(g,0.48,0.012,0.012,0,0.68,0,brass);
  }
}
const lvBaseSyncRoom = typeof syncRoom === "function" ? syncRoom : null;
if (lvBaseSyncRoom) syncRoom = function () {
  const r = lvBaseSyncRoom.apply(this, arguments);
  try {
    lvBuildFixtures();
    if (G?.level && !G.ended && !G.level.lastStory && phase === "playing") {
      const c = lvDef(G.level.id);
      logEvent(`${c.synopsis} ${c.rumor}`, "story");
      G.level.lastStory = true;
      saveGame(false);
    }
  } catch (e) { console.warn("level room", e); }
  return r;
};
function lvCaptureProgress() {
  const l = lvState();
  if (!l || l.complete === false) return;
  const elapsed = Math.max(1, Math.floor(G.minute / 1440));
  l.elapsed = elapsed;
  const ratio = elapsed / l.nominal;
  l.stars = ratio <= 0.56 && l.wrong === 0 ? 3 : ratio <= 0.82 && l.wrong <= 3 ? 2 : 1;
  l.complete = true;
  lvProgress.clears[l.id] = { stars: l.stars, days: elapsed, correct: l.correct, wrong: l.wrong };
  lvProgress.unlocked = Math.min(6, Math.max(lvProgress.unlocked, lvDef(l.id).no + 1));
  lvSaveProgress();
}
const lvBaseEndGame = endGame;
endGame = function (win, reason) {
  if (win && G?.level && !G.ended) {
    G.level.complete = true;
    lvCaptureProgress();
    reason = "门外传来了约定好的声音。你终于可以离开这间房。";
  }
  return lvBaseEndGame(win, reason);
};
const lvBaseShowEnd = showEnd;
showEnd = function () {
  const r = lvBaseShowEnd();
  if (!G?.level) return r;
  const l = G.level, c = lvDef(l.id), root = $("#endScreen");
  if (!root) return r;
  const over = root.querySelector(".end-overline"), count = root.querySelector(".end-days"), title = root.querySelector("h1"), para = root.querySelector("p");
  if (over) over.textContent = l.stars ? "A ROOM FINALLY LETS YOU GO" : "THE ROOM WENT QUIET";
  if (count) count.innerHTML = `${Math.floor(G.minute / 1440)}<small>天 · ${"★".repeat(l.stars || 0)}${"☆".repeat(3-(l.stars||0))}</small>`;
  if (title) title.textContent = G.win ? `第${c.no}间房，终于等到了回应。` : "这一次，房门还是没有打开。";
  if (para) para.innerHTML = `${esc(G.endReason || "漫长的等待结束了。")}<br>原定 ${l.nominal} 天 · 机关生效 ${l.correct} 次 · 误触 ${l.wrong} 次 · 错过线索 ${l.missed} 次。结局后，房间里的刻痕才显出它们的意思。`;
  const stats = root.querySelector(".end-stats");
  if (stats) stats.innerHTML = `<div><strong>${Math.floor(G.minute / 1440)}</strong>实际等待天数</div><div><strong>${l.correct}</strong>机关成功次数</div><div><strong>${"★".repeat(l.stars || 0)}${"☆".repeat(3-(l.stars||0))}</strong>本章评级</div>`;
  const btn = root.querySelector('[data-ui="title"]');
  if (btn) btn.insertAdjacentHTML("beforebegin", `<button class="lv-next-button" data-lv-picker>回到章节簿 · ${lvProgress.unlocked}/6已解锁</button>`);
  return r;
};
function lvOpenPicker() {
  let root = document.getElementById("lvPicker");
  if (!root) {
    root = document.createElement("section"); root.id="lvPicker"; root.className="lv-overlay"; root.hidden=true;
    root.innerHTML = `<div class="lv-picker-card"><header><div><span class="lv-kicker">ANDERS EMPIRE · SEALED ROOMS</span><h2>章节簿</h2><p>每一间房都有自己的故事、时限和规则。没有时钟，也没有成功提示。</p></div><button class="lv-close" data-lv-close aria-label="关闭">×</button></header><div id="lvChapterGrid" class="lv-chapter-grid"></div><footer><span>通关会留下星级，并逐步开放供销社的全国目录。</span><span>时间在房间里不会自己告诉你。</span></footer></div>`;
    document.body.appendChild(root);
  }
  const grid = root.querySelector("#lvChapterGrid");
  grid.innerHTML = LV_CHAPTERS.map((c) => {
    const record = lvProgress.clears[c.id], unlocked = c.no <= lvUnlocked();
    const stars = record ? `<span class="lv-stars">${"★".repeat(record.stars)}${"☆".repeat(3-record.stars)}</span>` : `<span class="lv-locked">${unlocked ? "尚未通关" : "完成前一章后开放"}</span>`;
    return `<button class="lv-chapter ${unlocked ? "" : "locked"}" ${unlocked ? `data-level-select="${c.id}"` : "disabled"}><span class="lv-chapter-no">${String(c.no).padStart(2,"0")} / 06</span><h3>${esc(c.title)}</h3><p>${esc(c.synopsis)}</p><div class="lv-card-meta"><span>基础期限 · ${c.nominal}天</span>${stars}</div><small>${esc(c.hint)}</small></button>`;
  }).join("");
  root.hidden=false;
  root.querySelector(".lv-close")?.focus();
}
function lvClosePicker() { const root=document.getElementById("lvPicker"); if(root) root.hidden=true; }
function lvChoose(id) {
  const c=LV_BY_ID[id]; if(!c || c.no>lvUnlocked()) return;
  lvBaseSeed = $("#seedInput")?.value.trim() || "ANDERS-1986";
  currentSeed = `${lvBaseSeed}-${id}`;
  env = environment(currentSeed);
  lvPending=id; lvShopPage=0;
  lvClosePicker();
  if (scene && roomRoot?.userData.seed !== currentSeed) {
    buildRoom(env);
    // Force the committed game start to rebuild the chapter set, including its collision fixtures.
    if (roomRoot) roomRoot.userData.seed = "level-pending-" + id;
  }
  openShop(false);
}
function lvEnsureOrderPanel() {
  let root=document.getElementById("lvOrderOverlay");
  if(root) return root;
  root=document.createElement("section"); root.id="lvOrderOverlay"; root.className="lv-overlay lv-order-overlay"; root.hidden=true;
  const hero=typeof OFFLINE_ROOM!=="undefined"?OFFLINE_ROOM.textures?.["coop-shop-hero"]||"":"";
  const heroImage=hero?`<img class="lv-order-hero-image" src="${hero}" alt="">`:"";
  root.innerHTML=`<div class="lv-order-card"><header class="lv-order-hero">${heroImage}<div class="lv-order-hero-shade"></div><div class="lv-order-hero-copy"><span class="lv-kicker">ANDERS PEOPLE'S COOPERATIVE · 1986</span><h2>全国订货簿</h2><p id="lvOrderCount"></p></div><button class="lv-close lv-order-close" data-order-close aria-label="关闭">×</button></header><div class="lv-order-content"><div class="lv-order-tools"><label class="lv-search-wrap"><span aria-hidden="true">⌕</span><input id="lvOrderSearch" type="search" placeholder="搜索商品、用途或特色" autocomplete="off" aria-label="搜索商品"></label><select id="lvOrderCategory" aria-label="商品分类"></select><span>柜台订货簿 · 搜索已开放商品，点“加入篮子”登记采购。</span></div><div id="lvOrderGrid" class="lv-order-grid"></div><footer class="lv-order-foot"><button data-order-page="-1">← 上一页</button><span id="lvOrderPageLabel"></span><button data-order-page="1">下一页 →</button><button class="lv-checkout-mini" data-order-checkout>前往收银台　→</button></footer></div></div>`;
  document.body.appendChild(root);
  const select=root.querySelector("#lvOrderCategory");
  select.innerHTML=CATEGORIES.map(([id,name])=>`<option value="${id}">${name}</option>`).join("");
  root.querySelector("#lvOrderSearch").addEventListener("input",e=>{lvOrderQuery=e.target.value.trim();lvOrderPage=0;lvRenderOrder();});
  select.addEventListener("change",e=>{lvOrderCategory=e.target.value;lvOrderPage=0;lvRenderOrder();});
  return root;
}
function lvRenderOrder() {
  const root=lvEnsureOrderPanel(), all=lvCatalogStock();
  const q=lvOrderQuery.toLowerCase();
  const filtered=all.filter(it=>(lvOrderCategory==="all"||it.category===lvOrderCategory)&&(!q||it.name.toLowerCase().includes(q)||(it.desc||"").toLowerCase().includes(q)||(it.note||"").toLowerCase().includes(q)));
  const pages=Math.max(1,Math.ceil(filtered.length/48)); lvOrderPage=Math.max(0,Math.min(pages-1,lvOrderPage));
  const spent=cartSummary(cart).cost;
  root.querySelector("#lvOrderCount").textContent=`${filtered.length.toLocaleString("zh-CN")} 件可订 · 本章已开放 · 已用 E$ ${spent.toFixed(2)} / ${gameBudget().toFixed(2)}`;
  root.querySelector("#lvOrderPageLabel").textContent=`${lvOrderPage+1} / ${pages}`;
  const view=filtered.slice(lvOrderPage*48,(lvOrderPage+1)*48);
  root.querySelector("#lvOrderGrid").innerHTML=view.map(it=>{
    const n=cart[it.id]||0;
    const useText=it.desc||it.note||"日常物资 · 按包装说明使用";
    return `<article class="lv-order-item"><div class="lv-order-art">${productArt(it)}</div><h3>${esc(it.name)}</h3><p>${esc(useText)}</p><div class="lv-order-meta"><span>${it.weight.toFixed(it.weight<1?2:1)} kg</span><b>E$ ${it.price.toFixed(2)}</b></div><div class="lv-order-qty"><button data-lv-cart="${it.id}" data-delta="-1" ${n?"":"disabled"}>−</button><span>${n}</span><button data-lv-cart="${it.id}" data-delta="1">加入篮子</button></div></article>`;
  }).join("");
}
function lvOpenOrder() {
  if(!worldIsShopping() || !canPurchase()) return blockPurchase();
  const root=lvEnsureOrderPanel(); lvOrderOpen=true; lvOrderPage=0; lvRenderOrder(); root.hidden=false; releasePointer();
  root.querySelector("#lvOrderSearch").focus();
}
function lvCloseOrder() {
  const root=document.getElementById("lvOrderOverlay"); if(root) root.hidden=true; lvOrderOpen=false;
}
function lvCartChange(id, delta) {
  if(!canPurchase() || !lvCatalogStock().some(it=>it.id===id)) return blockPurchase();
  if(typeof worldCartChange==="function") worldCartChange(id,Number(delta));
  else { const q=Math.max(0,Math.min(100,(cart[id]||0)+Number(delta))); if(q)cart[id]=q;else delete cart[id]; renderReceipt(); }
  lvRenderOrder();
}
const lvBaseRenderCatalog = typeof renderCatalog === "function" ? renderCatalog : null;
if(lvBaseRenderCatalog) renderCatalog=function(){
  if(!lvPending || phase!=="shop") return lvBaseRenderCatalog();
  const list=shopStock().filter(it=>(shopCategory==="all"||it.category===shopCategory)&&(!shopQuery||it.name.toLowerCase().includes(shopQuery.toLowerCase())||(it.desc||"").toLowerCase().includes(shopQuery)));
  const pageSize=60,pages=Math.max(1,Math.ceil(list.length/pageSize)); lvShopPage=Math.max(0,Math.min(pages-1,lvShopPage));
  const view=list.slice(lvShopPage*pageSize,(lvShopPage+1)*pageSize);
  $("#shopEmpty").hidden=!!list.length;
  $("#catalogGrid").innerHTML=view.map(it=>{const q=cart[it.id]||0,meta=it.kind==="food"?`${it.servings}份 · ${it.kcal} kcal/份`:it.kind==="book"?`${it.pages}页 · 可重读`:it.levelClock?"计时设备":it.servings>1?`${it.servings}次用量`:"耐用物品";return `<article class="product-card ${q?"in-cart":""}" title="${esc(it.desc||it.name)}"><button class="product-art" data-product="${it.id}" aria-label="查看${esc(it.name)}详情">${productArt(it)}</button><h3>${esc(it.name)}</h3><div class="product-meta"><span>${it.weight.toFixed(it.weight<1?2:1)}kg</span><span>${meta}</span>${it.life<9999?`<span>${it.life}天${it.cook?" · 需烹煮":""}</span>`:""}</div><div class="product-footer"><span class="product-price"><small>E$</small>${it.price.toFixed(2)}</span><div class="qty-control"><button data-cart="${it.id}" data-delta="-1" aria-label="减少${esc(it.name)}">−</button><span>${q}</span><button data-cart="${it.id}" data-delta="1" aria-label="添加${esc(it.name)}">＋</button></div></div></article>`;}).join("");
  let nav=document.getElementById("lvShopPager");if(!nav){nav=document.createElement("nav");nav.id="lvShopPager";nav.className="lv-shop-pager";$("#catalogGrid").after(nav);}
  nav.innerHTML=`<button data-lv-shop-page="-1" ${lvShopPage===0?"disabled":""}>← 上一页</button><span>${list.length.toLocaleString("zh-CN")}件 · ${lvShopPage+1}/${pages}</span><button data-lv-shop-page="1" ${lvShopPage>=pages-1?"disabled":""}>下一页 →</button>`;
};
const lvBaseOpenShop=typeof openShop==="function"?openShop:null;
if(lvBaseOpenShop) openShop=function(isRestock=false){
  const r=lvBaseOpenShop.apply(this,arguments);
  if(lvPending&&phase==="shop"&&!W.enabled){
    $("#shopIntroText").textContent=`本章基础期限 ${lvGoalDays()} 天。房间里没有时钟；计时器需开局购买，机关是否生效不会提示。开局只采购一次。`;
    $("#catalogCount").textContent=`${lvCatalogStock().length.toLocaleString("zh-CN")} 件 / 本章已开放 · 目录共 ${CATALOG.length.toLocaleString("zh-CN")} 种`;
    renderCatalog();
  }
  return r;
};
function lvStars(state) {
  const days=Math.max(1,Math.floor(G.minute/1440)),ratio=days/state.nominal;
  return ratio<=0.56&&state.wrong===0?3:ratio<=0.82&&state.wrong<=3?2:1;
}
const lvBaseWorldVisible=typeof worldVisible==="function"?worldVisible:null;
if(lvBaseWorldVisible) worldVisible=function(){return !lvOrderOpen&&lvBaseWorldVisible.apply(this,arguments);};
const lvBaseWorldTargetInfo=typeof worldTargetInfo==="function"?worldTargetInfo:null;
if(lvBaseWorldTargetInfo) worldTargetInfo=function(o){
  const id=o?.userData?.interact||"";
  if(id==="shopCatalog") return ["全国订货簿",`E 翻阅完整目录 · ${lvCatalogStock().length.toLocaleString("zh-CN")} 种已开放商品`];
  if(id.startsWith("level:")){
    const key=id.slice(6),l=lvState();
    const hints={bell:["旧电铃按钮","E 按下 · 墙内的线没有接到门外"],wall:["墙上的空响处","E 敲一下 · 听过走廊的声音再想想"],ledger:["洇开的账本","E 翻看 · Shift+E 点燃一页"],clock:["落地钟","E 拉动链条 · Shift+E 上弦"]};
    return hints[key]||[o.userData.worldName||"旧物件","E 检查"];
  }
  if(id.startsWith("stock:")){
    const batch=G?.inv.find(b=>b.uid===o.userData.uid),it=batch&&DB[batch.id];
    if(it?.levelClock) return [it.name,`T 抬腕读时 · Shift+E ${it.levelClock==="mechanical"?"上弦":it.levelClock==="quartz"||it.levelClock==="digital"?"装干电池":it.levelClock==="calendar"?"撕页":"校时"}`];
  }
  if(id==="radio"&&lvMode()) return ["旧收音机","E 收听广播 · 某些夜里，杂音会停一会儿"];
  return lvBaseWorldTargetInfo(o);
};
const lvBaseWorldInteract=typeof worldInteract==="function"?worldInteract:null;
if(lvBaseWorldInteract) worldInteract=function(shift=false){
  const id=targetId||"";
  if(worldIsShopping()&&id==="shopCatalog") return lvOpenOrder();
  if(lvMode()&&id.startsWith("level:")){
    const key=id.slice(6);
    if(key==="bell") return worldStart("按下墙上的按钮",0.45,()=>lvServiceOrTry("bell",shift),"use","button");
    if(key==="wall") return worldStart("敲一下墙面",0.55,()=>lvServiceOrTry("wall",shift),"use","tap");
    if(key==="ledger") return worldStart(shift?"点燃账本的一页":"翻看账本",0.7,()=>lvServiceOrTry("ledger",shift),"use","notebook");
    if(key==="clock") return worldStart(shift?"给落地钟上弦":"拉动钟链",0.8,()=>lvServiceOrTry("clock",shift),"use","clock");
  }
  if(lvMode()&&id.startsWith("stock:")){
    const batch=G.inv.find(b=>b.uid===W.focus?.userData.uid),it=batch&&DB[batch.id];
    if(it?.levelClock&&shift) return lvServiceDevice(batch);
  }
  return lvBaseWorldInteract.apply(this,arguments);
};
const lvBaseDoLeisure=typeof doLeisure==="function"?doLeisure:null;
if(lvBaseDoLeisure) doLeisure=function(id){
  if(lvMode()&&id==="radio"&&has("radio")&&(G.power||has("battery"))) lvTryAt("radio",G.minute,false);
  return lvBaseDoLeisure.apply(this,arguments);
};
const lvBaseWorldShopInteract=typeof worldShopInteract==="function"?worldShopInteract:null;
if(lvBaseWorldShopInteract) worldShopInteract=function(id,shift=false){
  if(id==="shopCatalog") return lvOpenOrder();
  return lvBaseWorldShopInteract.apply(this,arguments);
};
const lvBaseWorldBuildStore=typeof worldBuildStore==="function"?worldBuildStore:null;
if(lvBaseWorldBuildStore) worldBuildStore=function(){
  const r=lvBaseWorldBuildStore.apply(this,arguments);
  if(lvPending&&roomRoot){
    const g=worldTag(groupAt(-3.03,0.96,4.45,roomRoot),"shopCatalog","全国订货簿");
    worldBox(g,0.34,0.045,0.25,0,0.015,0,worldMat("#6d5940"));
    worldBox(g,0.31,0.018,0.23,0,0.045,0,worldMat("#e5d9bc"));
    worldLabel(g,["全国商品目录","E 翻阅 · 搜索与订购"],0.30,0.15,0,0.057,0.12,{bg:"#e5d9bc",fg:"#3f4d40",size:25,width:512,height:160});
  }
  return r;
};
const lvBaseToTitle=typeof toTitle==="function"?toTitle:null;
if(lvBaseToTitle) toTitle=function(){
  const r=lvBaseToTitle.apply(this,arguments);
  lvCloseOrder(); lvPending=null;
  if(lvBaseSeed&&$("#seedInput")){ $("#seedInput").value=lvBaseSeed; currentSeed=lvBaseSeed; env=environment(currentSeed); if(scene)buildRoom(env); updateSeed(); }
  lvBaseSeed=""; return r;
};
const lvBaseRenderHUD=typeof renderHUD==="function"?renderHUD:null;
if(lvBaseRenderHUD) renderHUD=function(){
  const r=lvBaseRenderHUD.apply(this,arguments);
  if(timeHidden()&&typeof document!=="undefined"){
    const d=$("#hudDay"),clock=$("#hudClock");
    if(d)d.textContent="—";
    if(d?.nextElementSibling)d.nextElementSibling.textContent="/ 无日期";
    if(clock)clock.textContent=lvChapterLabel();
  }
  return r;
};
const lvBaseUpdatePhase=typeof updatePhase==="function"?updatePhase:null;
if(lvBaseUpdatePhase) updatePhase=function(){const r=lvBaseUpdatePhase.apply(this,arguments);lvFallbackRender();return r;};
const lvBaseOpenHelp=typeof openHelp==="function"?openHelp:null;
if(lvBaseOpenHelp) openHelp=function(){
  if(!lvMode()) return lvBaseOpenHelp.apply(this,arguments);
  showPanel("help","没有钟的章节","CHAPTER RULES / TIME IS HIDDEN",`<p class="help-paragraph">本章没有常驻日期、钟点或剩余天数。身体仍会按原来的节奏消耗，睡觉和日常活动也会推进时间。窗外光线、广播、环境声和你自己买来的计时用品，是判断时刻的线索。</p><p class="help-paragraph">商品只在开局采购一次。机械钟需要上弦，石英钟需要自己装电池，插电钟会受停电影响；不同商品的误差和故障不一样。手记会隐藏时间戳。</p><p class="help-paragraph">每间房都有自己的线索和机关。按对或按错都不会马上告诉你，结局后才会显示哪些操作生效。机关装置是房间固定设施，不是商店商品。错误后果依关卡而异。</p><p class="help-paragraph">危险状态会打断长时间跳过，健康或精神耗尽仍会失败。结局评级看实际等待时间和误触次数。通关会开放新章节和更多订货品种。</p>`);
};
const lvBaseWorldFrame=typeof worldFrame==="function"?worldFrame:null;
if(lvBaseWorldFrame) worldFrame=function(now,dt){
  const r=lvBaseWorldFrame.apply(this,arguments);
  if(lvGrandPendulum&&lvMode()){
    const ok=G.level.windAt&&G.minute-G.level.windAt<=8*1440;
    lvGrandPendulum.rotation.z=ok?Math.sin(now*0.0028)*0.1:0;
    if(ok)sceneDirty=true;
  }
  return r;
};
function lvEnsureStyles() {
  if(document.getElementById("lvRuntimeCss")) return;
  const s=document.createElement("style");s.id="lvRuntimeCss";s.textContent=`.lv-overlay{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:clamp(12px,3vw,42px);background:rgba(18,22,19,.72);backdrop-filter:blur(10px);color:#272a23}.lv-overlay[hidden]{display:none!important}.lv-picker-card,.lv-order-card{width:min(1160px,100%);max-height:min(92dvh,1000px);overflow:auto;background:#e7dfca;border:1px solid #c9b995;box-shadow:0 30px 90px #1119;padding:clamp(18px,3vw,38px);font-family:Georgia,'Noto Serif CJK SC',serif}.lv-picker-card>header,.lv-order-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:1px solid #b8ad94;padding-bottom:20px}.lv-kicker{font:700 11px/1.4 system-ui,sans-serif;letter-spacing:.18em;color:#73705e}.lv-picker-card h2,.lv-order-head h2{font-size:clamp(30px,5vw,50px);font-weight:500;margin:8px 0}.lv-picker-card header p,.lv-order-head p{font:15px/1.6 system-ui,sans-serif;color:#686656;margin:0;max-width:680px}.lv-close{font-size:28px;border:1px solid #a69c84;background:transparent;width:44px;height:44px;color:#4c4d42;cursor:pointer}.lv-chapter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:22px 0}.lv-chapter{min-height:215px;text-align:left;padding:20px;background:#f1ead8;border:1px solid #c6baa0;color:#302f28;cursor:pointer;transition:transform .18s,background .18s,border .18s}.lv-chapter:hover:not(:disabled){transform:translateY(-3px);background:#f7f0df;border-color:#9e875d}.lv-chapter.locked{opacity:.52;cursor:not-allowed;background:#ded8ca}.lv-chapter-no,.lv-card-meta,.lv-chapter small{font:12px/1.5 system-ui,sans-serif;color:#82785f;letter-spacing:.08em}.lv-chapter h3{font-size:23px;font-weight:500;margin:9px 0}.lv-chapter p{font:14px/1.6 system-ui,sans-serif;color:#615f54;min-height:44px;margin:0 0 12px}.lv-card-meta{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #d6cbb2;padding-top:10px}.lv-chapter small{display:block;margin-top:10px;letter-spacing:0;color:#6e6b5d}.lv-stars{color:#9b7735;font-size:17px}.lv-locked{color:#8a5247}.lv-picker-card footer,.lv-order-foot{display:flex;justify-content:space-between;align-items:center;gap:14px;padding-top:16px;border-top:1px solid #c5b89d;font:13px/1.5 system-ui,sans-serif;color:#77715f}.lv-order-card{width:min(1280px,100%)}.lv-order-tools{display:grid;grid-template-columns:minmax(190px,1fr) 220px 1.2fr;gap:12px;align-items:center;margin:18px 0}.lv-order-tools input,.lv-order-tools select{background:#f8f3e7;border:1px solid #b8ad94;padding:12px;font:15px system-ui,sans-serif;color:#35362f}.lv-order-tools span{font:13px/1.45 system-ui,sans-serif;color:#77715f}.lv-order-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.lv-order-grid:has(.lv-order-item:only-child){grid-template-columns:minmax(240px,420px);justify-content:center}.lv-order-item{border:1px solid #cfc3aa;background:#f4eddd;padding:12px;min-width:0}.lv-order-art{height:86px;display:grid;place-items:center;background:#e4dcc7}.lv-order-art svg{height:68px;width:68px}.lv-order-item h3{font:600 15px/1.35 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:9px 0 4px}.lv-order-item p{font:12px/1.4 system-ui,sans-serif;height:35px;overflow:hidden;color:#716d5f;margin:0 0 7px}.lv-order-meta,.lv-order-qty{display:flex;align-items:center;justify-content:space-between;gap:6px;font:12px system-ui,sans-serif}.lv-order-meta b{color:#735b2f}.lv-order-qty{margin-top:8px}.lv-order-qty button,.lv-order-foot button,.lv-next-button,.lv-shop-pager button{border:1px solid #9c906f;background:#e3d7b9;color:#403c2e;padding:8px 12px;font:600 12px system-ui,sans-serif;cursor:pointer}.lv-order-qty button:disabled,.lv-order-foot button:disabled,.lv-shop-pager button:disabled{opacity:.4;cursor:not-allowed}.lv-order-qty span{min-width:25px;text-align:center}.lv-order-foot{margin-top:16px}.lv-checkout-mini{margin-left:auto;background:#535c48!important;color:#f3ebd8!important}.lv-shop-pager{display:flex;align-items:center;justify-content:center;gap:14px;padding:16px;font:13px system-ui,sans-serif;color:#635f53}.lv-next-button{display:block;width:min(420px,100%);margin:0 auto 10px;padding:13px}@media(max-width:780px){.lv-chapter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lv-order-tools{grid-template-columns:1fr 1fr}.lv-order-tools span{grid-column:1/-1}.lv-order-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lv-picker-card footer{display:block}.lv-picker-card footer span{display:block;margin:6px 0}}@media(max-width:480px){.lv-overlay{padding:8px}.lv-picker-card,.lv-order-card{padding:16px;max-height:96dvh}.lv-chapter-grid{grid-template-columns:1fr}.lv-chapter{min-height:0}.lv-order-tools{grid-template-columns:1fr}.lv-order-tools span{grid-column:auto}.lv-order-grid{gap:7px}.lv-order-item{padding:8px}.lv-order-art{height:68px}.lv-order-item h3{font-size:13px}.lv-order-item p{font-size:11px;height:31px}.lv-order-foot{flex-wrap:wrap}.lv-order-foot>*{flex:1}.lv-order-foot span{order:-1;text-align:center;flex-basis:100%}}`;
  document.head.appendChild(s);
  const premium=document.createElement("style");premium.id="lvPremiumStyles";premium.textContent=`.lv-order-card{width:min(1240px,100%);max-height:94dvh;overflow:auto;padding:0;background:#ede7d8;border:1px solid #c6b998;border-radius:4px;box-shadow:0 34px 100px #090b09a8;color:#292b25}.lv-order-hero{position:relative;min-height:clamp(150px,21vh,220px);display:flex;align-items:flex-end;overflow:hidden;padding:23px 30px;border-bottom:3px solid #9a4f3c;background:linear-gradient(135deg,#53614c,#9b805e)}.lv-order-hero-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 57%;filter:saturate(.82) contrast(1.02)}.lv-order-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,17,14,.82),rgba(20,18,14,.4) 56%,rgba(20,18,14,.1)),linear-gradient(0deg,rgba(12,14,11,.68),transparent 78%)}.lv-order-hero-copy{position:relative;z-index:1;color:#f6ead1;max-width:75%}.lv-order-hero-copy .lv-kicker{color:#e8d8b5;font-size:10px;letter-spacing:.2em}.lv-order-hero-copy h2{margin:5px 0 3px;font:500 clamp(30px,4vw,46px)/1.12 Georgia,'Noto Serif CJK SC','Songti SC',serif;letter-spacing:.06em;text-shadow:0 2px 12px #0009}.lv-order-hero-copy p{margin:0;color:#e4dac5;font:12px/1.4 system-ui,sans-serif;letter-spacing:.02em;text-shadow:0 1px 5px #0009}.lv-order-close{position:absolute;z-index:3;top:17px;right:18px;border-color:#f3e8ce88;background:#1e211bc9;color:#f4ead7;border-radius:3px}.lv-order-content{padding:18px clamp(16px,2.3vw,30px) 22px}.lv-order-tools{grid-template-columns:minmax(220px,1fr) minmax(165px,210px) minmax(180px,.9fr);gap:12px;margin:0 0 15px}.lv-search-wrap{display:flex;align-items:center;gap:8px;padding:0 12px;background:#f8f4ea;border:1px solid #b9aa88;box-shadow:inset 0 1px 2px #4036210d}.lv-search-wrap>span{font:24px/1 Georgia,serif;color:#806e4a}.lv-search-wrap input{min-width:0;width:100%;padding:11px 0;border:0;background:transparent;outline:0;color:#30322b;font:14px system-ui,sans-serif}.lv-order-tools select{min-width:0;background:#f8f4ea;border:1px solid #b9aa88;padding:11px 12px;color:#34362d;font:14px system-ui,sans-serif}.lv-order-tools>span{padding-left:12px;border-left:2px solid #b38f5d;color:#776c58;font:12px/1.5 system-ui,sans-serif}.lv-order-grid{max-height:min(48vh,470px);overflow:auto;padding:2px 3px 5px;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:12px}.lv-order-item{position:relative;border:1px solid #cfc3a9;border-radius:3px;background:linear-gradient(160deg,#faf6ec,#eee7d5);padding:10px;box-shadow:0 3px 11px #574a3010;transition:transform .16s,box-shadow .16s,border-color .16s}.lv-order-item:hover{transform:translateY(-2px);border-color:#a9966b;box-shadow:0 8px 20px #574a3020}.lv-order-art{height:92px;border:1px solid #d9cfb9;background:radial-gradient(ellipse at 50% 70%,#c9bd9e,#e5ddca 72%);overflow:hidden}.lv-order-art svg{height:88px;width:88px;filter:drop-shadow(0 5px 3px #342d1d22)}.lv-order-item h3{white-space:normal;min-height:38px;margin:9px 0 4px;color:#33342e;font:600 14px/1.35 'Noto Serif CJK SC','Songti SC',serif}.lv-order-item p{height:43px;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#746d5e;font:11px/1.5 system-ui,sans-serif}.lv-order-meta{padding-top:7px;border-top:1px solid #dfd5c0;color:#766d5a;font:11px system-ui,sans-serif}.lv-order-meta b{color:#934f3c;font-size:13px}.lv-order-qty{margin-top:9px}.lv-order-qty button{border:1px solid #ab9a73;background:#e9dfc8;color:#3e3a2e;border-radius:2px;padding:7px 9px;font:600 11px system-ui,sans-serif}.lv-order-qty button:last-child{background:#59624a;border-color:#59624a;color:#fff6e2}.lv-order-qty button:disabled{opacity:.4}.lv-order-foot{margin-top:14px;padding-top:13px;border-top:1px solid #cfc3a8}.lv-order-foot button{border-radius:2px}.lv-checkout-mini{margin-left:auto;background:#4d5b45!important;border-color:#4d5b45!important;color:#f5eddc!important;min-height:38px}.lv-order-grid::-webkit-scrollbar{width:8px}.lv-order-grid::-webkit-scrollbar-thumb{background:#b8a987;border:2px solid #eee7d8;border-radius:6px}@media(max-width:760px){.lv-order-hero{min-height:150px;padding:18px}.lv-order-hero-copy{max-width:88%}.lv-order-content{padding:14px}.lv-order-tools{grid-template-columns:minmax(0,1fr) minmax(125px,.65fr)}.lv-order-tools>span{grid-column:1/-1;border-left:0;padding:0}.lv-order-grid{max-height:52vh;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lv-order-item{padding:8px}.lv-order-art{height:72px}.lv-order-art svg{height:68px;width:68px}.lv-order-item h3{font-size:12px;min-height:34px}.lv-order-item p{font-size:10px;height:38px}.lv-order-qty button{padding:7px 6px}.lv-order-foot{flex-wrap:wrap}.lv-order-foot>*{flex:1}.lv-order-foot span{order:-1;text-align:center;flex-basis:100%}}`;
  document.head.appendChild(premium);
  const f=document.createElement("style");
  f.textContent=`.lv-fallback-tools{position:fixed;right:14px;bottom:92px;z-index:600;display:flex;flex-direction:column;gap:7px;max-width:min(310px,calc(100vw - 28px));padding:12px;background:#e8e0cced;border:1px solid #b5a989;box-shadow:0 8px 26px #171a1433;color:#35362d;font:13px/1.4 system-ui,sans-serif}.lv-fallback-tools strong{font:600 12px system-ui,sans-serif;letter-spacing:.08em}.lv-fallback-tools button{border:1px solid #9a8b68;background:#f3ecd9;padding:9px 11px;text-align:left;color:#3b3c32;cursor:pointer;font:13px system-ui,sans-serif}.lv-fallback-tools button:hover{background:#e0d2af}`;
  document.head.appendChild(f);
}
function lvFallbackDo(action,shift=false){
  if(action==="radio"){
    if(!has("radio")) return notify("先拆出自己买的收音机。","warn");
    if(lvMode()) lvTryAt("radio",G.minute,false);
    return doLeisure("radio");
  }
  if(action==="ledger"&&shift&&!has("lighter")) return notify("抽屉里没有火柴或打火机。","warn");
  if(action==="bell"||action==="wall"||action==="ledger"||action==="clock") lvServiceOrTry(action,shift);
  renderHUD();
}
function lvFallbackRender(){
  if(typeof document==="undefined") return;
  let b=document.getElementById("lvFallbackTools");
  if(W.enabled||!lvMode()||phase!=="playing") { b?.remove(); return; }
  if(!b){b=document.createElement("aside");b.id="lvFallbackTools";b.className="lv-fallback-tools";document.body.appendChild(b);}
  const id=G.level.id, rows=[];
  const add=(action,label,shift=false)=>rows.push(`<button data-lv-fallback-action="${action}" data-lv-fallback-shift="${shift}">${label}</button>`);
  if(id==="bellhouse") add("bell","按下墙边的旧按钮");
  if(id==="sealed") add("wall","敲一下墙面");
  if(id==="night-radio") add("radio","收听收音机");
  if(id==="ledger"){add("ledger","翻看账本");add("ledger","点燃一页",true);}
  if(id==="clockmaker"){add("clock","拉动钟链");add("clock","给机芯上弦",true);}
  if(id==="thousand"){add("bell","按下墙边的旧按钮");add("wall","敲一下墙面");add("radio","收听收音机");add("ledger","点燃一页",true);}
  b.innerHTML=`<strong>房间里的旧东西</strong>${rows.join("")}`;
}
if(typeof document!=="undefined"){
  lvEnsureStyles();
  const cta=document.getElementById("chapterButton");
  cta?.addEventListener("click",lvOpenPicker);
  document.addEventListener("click",e=>{
    const b=e.target.closest?.("[data-level-select]"); if(b){lvChoose(b.dataset.levelSelect);return;}
    if(e.target.closest?.("[data-lv-close]")){lvClosePicker();return;}
    if(e.target.closest?.("[data-lv-picker]")){lvClosePicker();lvOpenPicker();return;}
    if(e.target.closest?.("[data-order-close]")){lvCloseOrder();return;}
    const add=e.target.closest?.("[data-lv-cart]");if(add){lvCartChange(add.dataset.lvCart,Number(add.dataset.delta));return;}
    const page=e.target.closest?.("[data-order-page]");if(page){lvOrderPage+=Number(page.dataset.orderPage);lvRenderOrder();return;}
    if(e.target.closest?.("[data-order-checkout]")){lvCloseOrder();worldCheckout();return;}
    const shopPage=e.target.closest?.("[data-lv-shop-page]");if(shopPage){lvShopPage+=Number(shopPage.dataset.lvShopPage);renderCatalog();return;}
    const fallback=e.target.closest?.("[data-lv-fallback-action]");if(fallback){lvFallbackDo(fallback.dataset.lvFallbackAction,fallback.dataset.lvFallbackShift==="true");return;}
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&lvOrderOpen){e.preventDefault();e.stopImmediatePropagation();lvCloseOrder();return;}
    if(e.key==="Escape"&&document.getElementById("lvPicker")?.hidden===false){e.preventDefault();e.stopImmediatePropagation();lvClosePicker();}
  },true);
  const chapterButton=document.getElementById("chapterButton");
  if(chapterButton) chapterButton.title="选择一间房与一段故事；关卡模式不显示时钟和日期";
}
