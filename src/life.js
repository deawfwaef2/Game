/* 闭门365 · v0.10 life layer — reasons to keep living 365 days indoors, all in the 3D room:
   1. Sixteen letters from home in a bundle on the bedside cabinet, each marked with the day it may be opened.
   2. A radio that actually broadcasts: morning/noon/evening news that follows the Grey Crow case through the
      year (some bulletins warn of door-to-door searches), tomorrow's weather (the same seeded sky the window
      shows) and a weekly radio play.
   3. A windowsill garden: scallions, mung-bean sprouts and cherry tomatoes that need water, light and warmth.
   No pests and no stand-ins for pests anywhere. */
const LIFE_CROPS = {
  scallion: { name: "葱", seed: "scallion", days: 9, light: true, drink: 0.55, regrow: 0.45, max: 6, yield: ["greens", 2] },
  sprout: { name: "豆芽", seed: "mungseed", days: 4, light: false, drink: 1.1, max: 1, yield: ["sprouts", 3] },
  tomato: { name: "樱桃番茄", seed: "tomatoseed", days: 50, light: true, drink: 0.8, warm: 15, fruitDays: 3, max: 16, yield: ["cherrytom", 1] },
};
const LIFE_PRODUCE = {
  greens: { name: "窗台上剪下的葱", kcal: 20, life: 5, joy: 6, flavor: "greens" },
  sprouts: { name: "自己发的豆芽", kcal: 45, life: 3, joy: 5, flavor: "sprouts" },
  cherrytom: { name: "自己种的樱桃番茄", kcal: 30, life: 7, joy: 8, water: 3, flavor: "cherrytom" },
};
for (const [id, p] of Object.entries(LIFE_PRODUCE))
  DB[id] = { id, price: 0, weight: 0.08, servings: 1, category: "fresh", kind: "food", grown: true, ...p };

function lifeHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
// Same generator as fxRand(env.seed + "-sky-" + day) in lighting.js, so the forecast matches the window.
function lifeWeather(d) {
  let s = lifeHash(String(env.seed) + "-sky-" + d) || 1;
  s = (s * 1664525 + 1013904223) >>> 0;
  const r = s / 4294967296,
    overcast = d > 1 && r < 0.32;
  return { overcast, hazy: !overcast && r < 0.5 };
}
function lifeSmooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
// 0..1 daylight reaching the windowsill at a game minute.
function lifeSunlight(minute = G.minute) {
  const h = (minute / 60) % 24,
    d = Math.floor(minute / 1440) + 1,
    w = lifeWeather(d);
  let L = lifeSmooth(5.9, 7.2, h) * (1 - lifeSmooth(17.8, 19.1, h));
  L *= 0.45 + 0.55 * Math.max(0, Math.sin((Math.PI * (h - 6.4)) / 12.2));
  L *= w.overcast ? 0.4 : w.hazy ? 0.75 : 1;
  return L * (G.curtains ? 0.3 : 1);
}
function lifeDefault() {
  return { letters: 0, early: 0, read: [], news: 0, serial: 0, serialDay: 0, heardAlert: 0, garden: [null, null, null], harvests: 0 };
}
function lifeEnsure() {
  if (!G) return;
  const d = lifeDefault();
  if (!G.life || typeof G.life !== "object") G.life = d;
  for (const k of Object.keys(d)) if (G.life[k] === undefined) G.life[k] = d[k];
  if (!Array.isArray(G.life.garden)) G.life.garden = [null, null, null];
  G.life.garden = G.life.garden.slice(0, 3).map((p) => (p && LIFE_CROPS[p.crop] ? p : null));
  while (G.life.garden.length < 3) G.life.garden.push(null);
  G.life.letters = Math.max(0, Math.min(LIFE_LETTERS.length, G.life.letters | 0));
  // Old saves may still carry the removed pest system; drop it entirely.
  delete G.hidden;
  delete G.found;
  delete G.pestTraces;
}
const lifeBase = { validateSave, freshState, loadState, hourlyUpdate, dailyUpdate, randomEvent, doLeisure };
validateSave = function (s) {
  if (!lifeBase.validateSave(s)) return false;
  const L = s.life;
  if (L === undefined) return true;
  const n = (v, a, b) => typeof v === "number" && Number.isFinite(v) && v >= a && v <= b;
  return (
    !!L && typeof L === "object" && n(L.letters, 0, 16) && n(L.news, 0, 100) && n(L.serial, 0, 10000) &&
    Array.isArray(L.garden) && L.garden.length <= 3 &&
    L.garden.every((p) => p === null || (p && Object.hasOwn(LIFE_CROPS, p.crop) && n(p.growth, 0, 2) && n(p.water, 0, 100)))
  );
};
freshState = function (seed) {
  const s = lifeBase.freshState(seed);
  s.life = lifeDefault();
  return s;
};
loadState = function (s) {
  const r = lifeBase.loadState(s);
  lifeEnsure();
  return r;
};

/* ---------- Letters ---------- */
function lifeNextLetter() {
  lifeEnsure();
  return LIFE_LETTERS[G.life.letters] || null;
}
function lifeOpenLetter(early = false) {
  lifeEnsure();
  const L = lifeNextLetter();
  if (!L) return false;
  const due = day() >= L.d;
  if (!due && !early) return false;
  G.life.letters++;
  if (!due) G.life.early++;
  G.stats.morale = clamp(G.stats.morale + (due ? 12 : 3));
  advanceTime(10, "read");
  logEvent(
    due
      ? `拆开了${L.from}写的第${G.life.letters}封信。字迹很熟悉，屋子好像没那么空了。`
      : `你没忍住，提前拆了写着“第${L.d}天”的信。读完有点空落落的。`,
    due ? "story" : "normal",
  );
  return true;
}
function lifeLetterHint() {
  const L = lifeNextLetter();
  if (!L) return `十六封都拆完了  ·  E 重读`;
  const left = L.d - day();
  if (left <= 0) return `E 拆开第${G.life.letters + 1}封（${L.from}）· 今天可以拆了`;
  return `下一封写着“第${L.d}天再拆”，还有${left}天${G.life.letters ? "  ·  E 重读旧信" : ""}  ·  Shift+E 偷偷提前拆`;
}

/* ---------- Radio ---------- */
function lifeAlertActive(d = day()) {
  return LIFE_NEWS.some((n) => n.alert && d >= n.d && d <= n.d + 2);
}
function lifeForecast(d) {
  const w = lifeWeather(d);
  return w.overcast ? "阴天，见不到太阳" : w.hazy ? "多云，有薄雾，午后能见到一点阳光" : "晴，阳光充足";
}
function lifeProgramme(peek = false) {
  lifeEnsure();
  const h = hour(),
    d = day(),
    L = G.life;
  const newsHour = (h >= 6.5 && h < 9.5) || (h >= 12 && h < 13.5) || (h >= 18 && h < 19.5);
  const serialTime = d % 7 === 6 && h >= 19.5 && h < 23 && L.serialDay !== d;
  if (serialTime) {
    const n = L.serial % LIFE_SERIAL.length,
      rerun = L.serial >= LIFE_SERIAL.length;
    if (!peek) {
      L.serial++;
      L.serialDay = d;
    }
    return {
      kind: "serial",
      joy: rerun ? 5 : 11,
      title: `广播剧《雾港旅馆》${rerun ? "重播 · " : ""}第${n + 1}集`,
      lines: [n ? "上回说到……" : "今晚开播的新广播剧。", LIFE_SERIAL[n], n + 1 < LIFE_SERIAL.length ? "欲知后事，下周此时。" : "全剧终。谢谢收听。"],
    };
  }
  if (newsHour) {
    const avail = LIFE_NEWS.filter((n) => n.d <= d),
      latest = avail.length,
      fresh = latest > L.news,
      item = fresh ? avail[L.news] : null;
    if (!peek && fresh) {
      L.news++;
      if (item.alert) L.heardAlert = d;
    }
    const lines = [item ? item.t : LIFE_FILLER[(d * 7 + Math.floor(h)) % LIFE_FILLER.length]];
    if (lifeAlertActive(d)) lines.push("播音员提醒：这几天楼里如有陌生人敲门，请勿开门。");
    lines.push(`天气预报：明天，第${d + 1}天，${lifeForecast(d + 1)}。`);
    if ((d + 1) % 7 === 6) lines.push("明晚八点，广播剧《雾港旅馆》继续播出。");
    else if (d % 7 === 6 && h < 19.5) lines.push("今晚八点，广播剧《雾港旅馆》，敬请收听。");
    return { kind: "news", joy: item ? 6 : 3, title: h < 10 ? "早间新闻" : h < 14 ? "午间新闻" : "晚间新闻", lines };
  }
  const songs = ["《港口的灯》", "《雨后电车》", "《远处的河》", "《北方的信》", "《夜班》", "《归港》", "《第七个春天》"];
  return {
    kind: "music",
    joy: 0,
    title: h >= 22 || h < 5 ? "深夜音乐" : "点歌时间",
    lines: [`下一首：${songs[(d + Math.floor(h)) % songs.length]}。`, "整点新闻在早上七点、中午十二点和傍晚六点。"],
  };
}
function lifeRadioHint() {
  if (!G) return "";
  const p = lifeProgramme(true);
  return p.kind === "serial" ? "正在播：" + p.title : p.kind === "news" ? "现在是" + p.title : "新闻在7点、12点、18点";
}
doLeisure = function (id) {
  if (id !== "radio" || !G || !has("radio")) return lifeBase.doLeisure(id);
  if (!G.power && !has("battery")) return lifeBase.doLeisure(id);
  const p = lifeProgramme();
  if (p.joy) G.stats.morale = clamp(G.stats.morale + p.joy * 0.5);
  logEvent(`收音机 · ${p.title}：${p.lines[0]}`, p.kind === "music" ? "good" : "story");
  lifeCaption(p);
  return lifeBase.doLeisure(id);
};
function lifeCaption(p) {
  if (typeof document === "undefined") return;
  let el = document.getElementById("lifeCaption");
  if (!el) {
    el = document.createElement("div");
    el.id = "lifeCaption";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  clearTimeout(lifeCaption.t);
  let i = 0;
  const show = () => {
    if (i >= p.lines.length) {
      el.classList.remove("on");
      return;
    }
    el.innerHTML = `<small>FM 94.6 · 安德士人民广播电台 · ${p.title}</small><p></p>`;
    el.querySelector("p").textContent = p.lines[i++];
    el.classList.add("on");
    lifeCaption.t = setTimeout(show, Math.max(3800, el.querySelector("p").textContent.length * 160));
  };
  show();
}

/* ---------- Windowsill garden ---------- */
function lifeSlots() {
  return typeof has === "function" && has("pots") ? 3 : 0;
}
function lifeSeeds() {
  return Object.entries(LIFE_CROPS)
    .filter(([, c]) => has(c.seed))
    .map(([k]) => k);
}
function lifeTemp() {
  return typeof temperature === "function" ? temperature() : 20;
}
function lifeGrowHour() {
  lifeEnsure();
  if (!lifeSlots()) return;
  const t = lifeTemp(),
    sun = lifeSunlight();
  G.life.garden.forEach((p) => {
    if (!p || p.dead) return;
    const c = LIFE_CROPS[p.crop];
    p.water = Math.max(0, p.water - (100 * c.drink * (t > 26 ? 1.5 : t < 12 ? 0.7 : 1)) / 24);
    if (p.water <= 0) {
      p.dry = (p.dry || 0) + 1;
      if (p.dry > (p.crop === "sprout" ? 30 : 60)) {
        p.dead = true;
        logEvent(`窗台上的${c.name}干死了。土裂开了细纹。`, "warn");
      }
      return;
    }
    p.dry = 0;
    let f = c.light ? 0.3 + 1.9 * sun : 1;
    if (c.warm) f *= t < c.warm - 5 ? 0.1 : t < c.warm ? 0.45 : t > 31 ? 0.6 : 1;
    else f *= t < 8 ? 0.25 : t < 13 ? 0.6 : t > 32 ? 0.7 : 1;
    if (p.growth < 1 || !c.fruitDays) p.growth = Math.min(1.25, p.growth + f / (c.days * 24));
    else p.fruit = Math.min(4, (p.fruit || 0) + f / (c.fruitDays * 24));
  });
}
hourlyUpdate = function () {
  lifeBase.hourlyUpdate();
  lifeGrowHour();
};
function lifeSow(i, crop) {
  lifeEnsure();
  const c = LIFE_CROPS[crop];
  if (!lifeSlots() || G.life.garden[i] || !c || !has(c.seed)) return false;
  use(c.seed);
  G.life.garden[i] = { crop, growth: 0, water: 90, dry: 0, fruit: 0, harvests: 0, planted: G.minute };
  advanceTime(10, "leisure");
  G.stats.morale = clamp(G.stats.morale + 2);
  logEvent(crop === "sprout" ? "抓了一把绿豆铺在湿土上，盖上一层湿布。" : crop === "tomato" ? "把番茄种子按进土里。要等很久，但它会结果。" : "把葱头一个个插进土里，浇透了水。", "good");
  return true;
}
function lifeWater(i) {
  const p = G.life.garden[i];
  if (!p || p.dead) return false;
  if (!spendWater(0.25)) {
    notify("需要0.25L水：水龙头没水时会用储水。", "warn");
    return false;
  }
  p.water = 100;
  advanceTime(3, "leisure");
  G.stats.morale = clamp(G.stats.morale + 1);
  logEvent(`给${LIFE_CROPS[p.crop].name}浇了水。`, "normal");
  return true;
}
function lifeReady(p) {
  if (!p || p.dead) return 0;
  const c = LIFE_CROPS[p.crop];
  if (c.fruitDays) return p.growth >= 1 ? Math.floor(p.fruit || 0) : 0;
  return p.growth >= 1 ? c.yield[1] : 0;
}
// Returns the new batch; the caller puts it in the player's hand — nothing is placed automatically.
function lifeHarvest(i) {
  const p = G.life.garden[i],
    n = lifeReady(p);
  if (!n) return null;
  const c = LIFE_CROPS[p.crop];
  const batch = { uid: uid(), id: c.yield[0], units: n, packed: false, created: G.minute, age: 0, location: "room", opened: true, contaminated: false };
  G.inv.push(batch);
  p.harvests += c.fruitDays ? n : 1;
  G.life.harvests += 1;
  if (c.fruitDays) p.fruit -= n;
  else p.growth = c.regrow || 0;
  if (p.harvests >= c.max || !c.regrow && !c.fruitDays) G.life.garden[i] = null;
  advanceTime(5, "leisure");
  G.stats.morale = clamp(G.stats.morale + 5);
  logEvent(`收获了${DB[c.yield[0]].name}。是你自己种出来的。`, "good");
  return batch;
}
function lifeClear(i) {
  G.life.garden[i] = null;
  advanceTime(5, "clean");
}
function lifeGardenHint(i) {
  const p = G.life.garden[i];
  if (!p) {
    const seeds = lifeSeeds();
    if (!seeds.length) return ["空花盆", "没有可种的种子或葱头"];
    const k = seeds[(W.lifeSeed || 0) % seeds.length];
    return ["空花盆", `E 种下${LIFE_CROPS[k].name}（还有${Math.ceil(amount(LIFE_CROPS[k].seed))}份）${seeds.length > 1 ? "  ·  Shift+E 换一种" : ""}`];
  }
  const c = LIFE_CROPS[p.crop];
  if (p.dead) return [`枯掉的${c.name}`, "E 清掉，花盆可以重新种"];
  const soil = p.water > 60 ? "土还湿" : p.water > 20 ? "土有点干" : p.water > 0 ? "土快干透了" : "土已经干裂";
  const ready = lifeReady(p);
  if (ready) return [c.name, `E 收获${c.fruitDays ? ready + "份" : ""}（拿在手里）  ·  ${soil}  ·  Shift+E 浇水`];
  const stage = c.fruitDays && p.growth >= 1 ? "挂着青果" : p.growth > 0.75 ? "快好了" : p.growth > 0.35 ? "长高了一截" : p.growth > 0.08 ? "冒出了芽" : "刚种下";
  return [c.name, `${stage}  ·  ${soil}  ·  E 浇水 0.25L${c.light && G.curtains ? "  ·  窗帘拉着，光线不足" : ""}`];
}

/* ---------- Daily rhythm, searches ---------- */
dailyUpdate = function () {
  lifeBase.dailyUpdate();
  lifeEnsure();
  const L = lifeNextLetter();
  if (L && L.d === day()) logEvent(`床头那叠信里，写着“第${L.d}天”的那一封今天可以拆了。`, "story");
  const p = G.life.garden.find((x) => lifeReady(x));
  if (p) logEvent(`窗台上的${LIFE_CROPS[p.crop].name}可以收了。`, "good");
};
randomEvent = function () {
  if (G && lifeAlertActive() && !G.pendingKnock && rngNext(G) < 0.35) {
    G.pendingKnock = true;
    if (!G.curtains && hour() > 18) G.suspicion = clamp(G.suspicion + 12);
    logEvent(
      G.life?.heardAlert && day() - G.life.heardAlert <= 2
        ? "楼道里有人挨家挨户地敲门，和广播里说的一样。你早有准备：别出声。"
        : "楼道里有人挨家挨户地敲门，节奏很耐心。保持安静。",
      "warn",
    );
    notify("有人在挨户敲门。别出声。", "warn");
    return;
  }
  return lifeBase.randomEvent();
};
