/* 闭门365 · v0.12 everyday realism, all inside the flat:
   - two personal traits per run (seeded) that change how the year feels;
   - real household faults of an old building — dripping tap, running cistern, window draughts in the cold,
     an air-locked radiator, a loose door lock — each fixed with the right tool in your hand;
   - cooking variety: a cooked staple picks up home-grown greens, onion or sugar and becomes a named dish,
     which genuinely counts as a different taste;
   - watching the street from behind the curtain (Shift+E at the window): what you see depends on the hour,
     the weather, and whether the gang is searching the district. */
const LR_TRAITS = [
  { id: "cook", t: "会做饭", d: "煮出来的饭格外香，熟食心情更好。" },
  { id: "light", t: "睡得浅", d: "滴水声和敲门声都更让你心烦。" },
  { id: "reader", t: "书虫", d: "读书带来的快乐更多。" },
  { id: "handy", t: "手巧", d: "折纸更快，修东西也更利索。" },
  { id: "tidy", t: "爱干净", d: "屋子乱了更难受，打扫完更舒坦。" },
  { id: "sunny", t: "乐天", d: "心情掉得慢一点。" },
  { id: "homesick", t: "恋家", d: "家信让你格外高兴，但平常的日子更想家。" },
  { id: "owl", t: "夜猫子", d: "夜里精神好，早上提不起劲。" },
  { id: "green", t: "会种东西", d: "窗台上的菜长得更快。" },
  { id: "hungry", t: "饭量大", d: "饿得比别人快一点。" },
];
const LR_FAULTS = {
  drip: { t: "水龙头滴水", where: "sink", tool: "repair", fix: "换了水龙头里的胶垫，滴答声停了。", start: "厨房的水龙头开始滴水，关紧了也停不住。夜里滴答声很清楚。" },
  cistern: { t: "马桶水箱一直在流", where: "toilet", tool: "repair", fix: "调好了水箱里的浮球，水声停了。", start: "马桶水箱里的水一直在细细地流，声音不停。" },
  draft: { t: "窗缝漏风", where: "window", tool: "ducttape", cold: true, fix: "用胶带把窗缝一条条封好，屋里暖和了一点。", start: "起风了。冷风从窗框的缝里钻进来，窗帘下摆在动。" },
  radiator: { t: "暖气片不热", where: "radiator", tool: "radkey", cold: true, fix: "拧开放气阀，嘶嘶响了一阵，冒出一点水，暖气片慢慢热了。", start: "暖气片上半截是凉的，里面咕噜咕噜响——进了空气。" },
  lock: { t: "门锁松了", where: "door", tool: "repair", fix: "拧紧了门锁的螺丝，又加了一道垫片。门关上时“咔哒”一声，很踏实。", start: "门锁的螺丝松了，门关上时有点晃。你心里不踏实。" },
};
const LR_STAPLE = { rice: "米饭", oats: "燕麦粥", pasta: "通心面", flour: "面饼", cornmeal: "玉米糊", beans: "红豆汤", lentils: "扁豆汤", buckwheat: "荞麦饭", noodles: "挂面", potato: "土豆", sweetpotato: "红薯" };
const LR_TOPPINGS = [
  ["cherrytom", "番茄", null],
  ["greens", "葱花", null],
  ["sprouts", "豆芽", null],
  ["onion", "洋葱", null],
  ["sugar", "甜", ["oats", "cornmeal", "beans", "sweetpotato"]],
];
const LR_WATCH = {
  morning: ["对面楼的女人在阳台上晾衣服，一件一件抖平。", "楼下早点铺冒着白气，排了一小队人。", "几个孩子背着书包跑过街角，最后一个摔了一跤，爬起来接着跑。", "清洁工在扫人行道，扫帚声一下一下的。", "一辆送奶车停在街口，瓶子叮叮当当。", "电车站挤满了上班的人，第一辆车没挤上去的人在跺脚取暖。"],
  day: ["街对面的修鞋摊开张了，老师傅戴上了老花镜。", "两个老头在楼下的石桌上下棋，旁边站着三个看的。", "邮递员骑着自行车挨栋送信，没在你这栋停。", "一只狗在追自己的尾巴，追了好几圈。", "对面楼顶有人在修天线，扶着烟囱，看得你手心出汗。", "一辆卡车在卸白菜，工人一棵一棵往下扔，地上的人一棵一棵接。", "楼下小卖部门口排起了队，听说今天有橘子。", "一对年轻人在街角吵架，吵完又一起走了。"],
  evening: ["街灯一盏一盏亮起来，从街口亮到街尾。", "对面楼家家户户的窗子亮了，有一家在包饺子，一家人围着桌子。", "下班的人流从电车站涌出来，很快又散进各个楼道。", "楼下有人在喊孩子回家吃饭，喊了三遍。", "天边剩下一条橘红色的光，慢慢暗下去。"],
  night: ["街上空了，只有一只猫沿着墙根走。", "对面楼只剩一扇窗还亮着，有人在台灯下写东西。", "一辆电车空着驶过，车厢里的灯照亮了半条街。", "远处的钟楼敲了一下。整座城市都睡了。", "巡夜的警察打着手电走过街口，在你楼下停了一会儿，又走了。"],
  rain: ["雨里的行人撑着各色的伞，从上面看像一朵朵移动的蘑菇。", "雨水顺着对面的屋檐往下淌，连成一道帘子。", "街上的积水映着路灯，有人踮着脚跳过去。"],
  overcast: ["天是灰的，对面的楼也是灰的，只有一家的红窗帘很显眼。", "云压得很低，楼顶的烟囱冒出的烟直直地往上走。"],
  alert: ["楼下停着一辆没熄火的黑色轿车，车里的人一直没下来。", "两个穿皮夹克的男人在街对面抽烟，时不时抬头数楼层。", "一个陌生人拿着一张纸，在楼门口问下棋的老头什么。老头摇了摇头。", "街角多了一个卖报的，他卖得很少，看得很多。"],
};
// Dated days of the year in the empire, plus the first snow when it really gets cold.
const LR_DAYS = [
  [30, "今天是发薪日。楼道里比平时热闹，有人提着整条的鱼上楼，有人在唱歌。"],
  [45, "帝国建国日。傍晚，城中心放起了烟花，在对面楼的玻璃上映出一片一片的颜色。"],
  [80, "夏天最热的几天。楼下的孩子们拿水管互相浇水，尖叫声一直传到你的窗口。"],
  [120, "丰收节。电台里放了一整天的手风琴，楼上的人家在烤面包，香味顺着楼梯往上飘。"],
  [150, "秋天了。对面楼下的白杨树一夜之间黄了一半。"],
  [184, "今天是你的生日。没有人知道你在这里。你给自己多煮了一点，假装那是蛋糕。"],
  [215, "新年夜。零点的时候整座城市都在放鞭炮，你在黑暗里对着窗户说了一声“新年好”。"],
  [216, "新年第一天。楼道里家家户户互相拜年，有人在你门口停了一下，说了句“新年好”，又走了。"],
  [262, "冬天最冷的几天。窗玻璃上结了冰花，像一片小小的森林。"],
  [300, "早上第一次听见了鸟叫。春天要来了。"],
  [330, "楼下的白杨树发芽了，远远看去像一层淡绿色的雾。"],
];
const LR = {};
function lrRand(tag) {
  let s = lifeHash(String(G.seed) + "-" + tag) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function lrEnsure() {
  if (!G || !G.life) return;
  const L = G.life;
  if (!Array.isArray(L.traits)) {
    const r = lrRand("traits"),
      ids = LR_TRAITS.map((t) => t.id);
    const a = ids.splice(Math.floor(r() * ids.length), 1)[0],
      b = ids[Math.floor(r() * ids.length)];
    L.traits = [a, b];
  }
  if (!L.faults || typeof L.faults !== "object") L.faults = {};
  for (const k of Object.keys(L.faults)) if (!LR_FAULTS[k]) delete L.faults[k];
  if (typeof L.watchDay !== "number") L.watchDay = 0;
  if (typeof L.watchToday !== "number") L.watchToday = 0;
  if (!L.dishes || typeof L.dishes !== "object") L.dishes = {};
}
const lrPrevEnsure = lifeEnsure;
lifeEnsure = function () {
  lrPrevEnsure();
  lrEnsure();
};
function trait(id) {
  return !!G?.life?.traits?.includes(id);
}
function lrFault(id) {
  return !!G?.life?.faults?.[id];
}
const lrBase = { temperature, hourlyUpdate, dailyUpdate, doAction, doRead, doLeisure, consumeMeal, lifeOpenLetter, lifeGrowHour, randomEvent };
// Draughts and an air-locked radiator really make the room colder.
temperature = function () {
  const t = lrBase.temperature();
  if (!G?.life?.faults) return t;
  return t - (lrFault("draft") ? 2 : 0) - (lrFault("radiator") ? 3 : 0);
};
hourlyUpdate = function () {
  lrBase.hourlyUpdate();
  lifeEnsure();
  const s = G.stats,
    h = hour();
  if (trait("sunny")) s.morale = clamp(s.morale + 0.06);
  if (trait("hungry")) s.food = clamp(s.food - 0.3);
  if (trait("owl")) s.morale = clamp(s.morale + (h >= 21 || h < 2 ? 0.25 : h >= 6 && h < 10 ? -0.2 : 0));
  if (G.activity === "sleep") {
    const noise = (lrFault("drip") ? 1 : 0) + (lrFault("cistern") ? 1 : 0);
    if (noise) {
      s.energy = clamp(s.energy - 0.35 * noise * (trait("light") ? 1.6 : 1));
      s.morale = clamp(s.morale - 0.08 * noise * (trait("light") ? 1.6 : 1));
    }
  }
};
lifeGrowHour = function () {
  if (!trait("green")) return lrBase.lifeGrowHour();
  const before = (G.life.garden || []).map((p) => p && [p.growth, p.fruit || 0]);
  lrBase.lifeGrowHour();
  G.life.garden.forEach((p, i) => {
    if (!p || !before[i] || p.dead) return;
    p.growth = Math.min(1.25, p.growth + (p.growth - before[i][0]) * 0.25);
    p.fruit = Math.min(4, (p.fruit || 0) + ((p.fruit || 0) - before[i][1]) * 0.25);
  });
};
dailyUpdate = function () {
  lrBase.dailyUpdate();
  lifeEnsure();
  const L = G.life,
    cold = lrBase.temperature() < 15;
  if (trait("homesick")) G.stats.morale = clamp(G.stats.morale - 0.8);
  if (trait("tidy") && G.dirt > 40) G.stats.morale = clamp(G.stats.morale - 2);
  if (lrFault("lock")) G.stats.morale = clamp(G.stats.morale - 1);
  if (day() === 1 || day() === 2) {
    if (day() === 2) logEvent(`你一直是个${LR_TRAITS.filter((t) => L.traits.includes(t.id)).map((t) => t.t).join("、")}的人。${LR_TRAITS.filter((t) => L.traits.includes(t.id)).map((t) => t.d).join("")}`, "story");
    return;
  }
  for (const [d, t] of LR_DAYS) if (d === day()) {
    logEvent(t, "story");
    G.stats.morale = clamp(G.stats.morale + (d === 184 ? -1 : 3));
  }
  if (!L.snow && lrBase.temperature() < 6 && day() > 120) {
    L.snow = day();
    logEvent("下雪了。今年的第一场雪，窗外的屋顶一点一点白了。", "story");
    G.stats.morale = clamp(G.stats.morale + 4);
  }
  // An old building: something gives out now and then. Cold-weather faults only when it is cold.
  const open = Object.keys(LR_FAULTS).filter((k) => !L.faults[k] && (!LR_FAULTS[k].cold || cold));
  if (open.length && Object.keys(L.faults).length < 2 && rngNext(G) < 0.045) {
    const k = open[Math.floor(rngNext(G) * open.length)];
    L.faults[k] = day();
    logEvent(LR_FAULTS[k].start, "warn");
    notify(LR_FAULTS[k].t, "warn");
  }
  // Warm spells fix the draught's effect on their own (the window is closed tight again).
  if (!cold && L.faults.draft && rngNext(G) < 0.3) delete L.faults.draft;
};
function lrFix(id) {
  const f = LR_FAULTS[id];
  delete G.life.faults[id];
  advanceTime(trait("handy") ? 20 : 40, "repair");
  G.stats.morale = clamp(G.stats.morale + 4);
  logEvent(f.fix, "good");
}
doAction = function (action, value) {
  if (!G || G.ended) return lrBase.doAction(action, value);
  lifeEnsure();
  if (action === "repair") {
    const k = ["lock", "drip", "cistern"].find((x) => lrFault(x));
    if (k && has("repair")) {
      use("repair");
      lrFix(k);
      saveGame(false);
      renderHUD();
      syncRoom();
      return;
    }
  }
  if (action === "seal" || action === "bleed") {
    const id = action === "seal" ? "draft" : "radiator",
      tool = action === "seal" ? "ducttape" : "radkey";
    if (!has(tool)) return notify("需要" + DB[tool].name + "。", "warn");
    if (!lrFault(id)) return notify(action === "seal" ? "窗缝现在不漏风。" : "暖气片是热的，不用放气。");
    if (DB[tool].kind === "consumable") use(tool);
    lrFix(id);
    saveGame(false);
    renderHUD();
    syncRoom();
    return;
  }
  const r = lrBase.doAction(action, value);
  if (action === "clean" && trait("tidy")) G.stats.morale = clamp(G.stats.morale + 2);
  if (action === "silence" && trait("light")) G.stats.morale = clamp(G.stats.morale - 2);
  return r;
};
doRead = function (id) {
  const m = G?.stats.morale;
  const r = lrBase.doRead(id);
  if (G && trait("reader") && G.stats.morale > m) G.stats.morale = clamp(G.stats.morale + (G.stats.morale - m) * 0.3);
  return r;
};
doLeisure = function (id) {
  const c = G?.life?.cranes;
  const r = lrBase.doLeisure(id);
  if (id === "origami" && trait("handy") && G.life.cranes > c) {
    const extra = Math.min(3, Math.floor(amount("origami")));
    if (extra) {
      use("origami", extra);
      G.life.cranes += extra;
    }
  }
  return r;
};
lifeOpenLetter = function (early) {
  const ok = lrBase.lifeOpenLetter(early);
  if (ok && trait("homesick") && !early) G.stats.morale = clamp(G.stats.morale + 6);
  return ok;
};
// A cooked staple picks up one topping and becomes a dish; its taste counts separately for boredom.
function lrTopping(it) {
  if (!it.cook || !LR_STAPLE[it.id]) return null;
  for (const [id, name, only] of LR_TOPPINGS) if ((!only || only.includes(it.id)) && has(id)) return [id, name];
  return null;
}
consumeMeal = function (uidValue, success = true, slow = false) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    top = it && !b.packed && b.units >= 1 ? lrTopping(it) : null;
  if (!top) {
    const m = G?.stats.morale;
    const r = lrBase.consumeMeal(uidValue, success, slow);
    if (it?.cook && trait("cook") && G.stats.morale > m) G.stats.morale = clamp(G.stats.morale + 1.5);
    return r;
  }
  lifeEnsure();
  const dish = top[1] + LR_STAPLE[it.id],
    old = { flavor: it.flavor, name: it.name, joy: it.joy };
  use(top[0]);
  it.flavor = (old.flavor || it.id) + "+" + top[0];
  it.name = dish;
  it.joy = (old.joy || 1) + 2 + (trait("cook") ? 1.5 : 0) + (G.life.dishes[dish] ? 0 : 2);
  try {
    lrBase.consumeMeal(uidValue, success, slow);
  } finally {
    it.flavor = old.flavor;
    it.name = old.name;
    it.joy = old.joy;
    if (old.flavor === undefined) delete it.flavor;
    if (old.joy === undefined) delete it.joy;
  }
  if (!G.life.dishes[dish]) logEvent(`第一次做${dish}。`, "good");
  G.life.dishes[dish] = (G.life.dishes[dish] || 0) + 1;
};
randomEvent = function () {
  const k = G?.pendingKnock;
  const r = lrBase.randomEvent();
  if (G && !k && G.pendingKnock && lrFault("lock")) {
    G.stats.morale = clamp(G.stats.morale - 3);
    logEvent("门锁还松着。敲门的时候，门在框里轻轻晃了一下。", "warn");
  }
  return r;
};
// Watching the street from behind the curtain.
function lrWatch() {
  lifeEnsure();
  const L = G.life,
    h = hour(),
    d = day(),
    w = lifeWeather(d);
  if (L.watchDay !== d) {
    L.watchDay = d;
    L.watchToday = 0;
  }
  let pool = h >= 5.5 && h < 9.5 ? "morning" : h < 17.5 ? "day" : h < 21.5 ? "evening" : "night";
  if (h < 5.5) pool = "night";
  const r = rngNext(G);
  if (lifeAlertActive(d) && r < 0.45) pool = "alert";
  else if (w.overcast && r < 0.3) pool = rngNext(G) < 0.5 ? "rain" : "overcast";
  const list = LR_WATCH[pool],
    t = list[Math.floor(rngNext(G) * list.length)];
  advanceTime(30, "leisure");
  L.watchToday++;
  G.stats.morale = clamp(G.stats.morale + Math.max(0, 3 - L.watchToday) + (pool === "alert" ? -2 : 0));
  if (!G.curtains && (h >= 18 || h < 6)) G.suspicion = clamp(G.suspicion + 4);
  logEvent((G.curtains ? "你从窗帘缝往外看。" : "你站在窗边往外看。") + t, pool === "alert" ? "warn" : "story");
  return t;
}
function lrFaultsAt(where) {
  return Object.keys(G?.life?.faults || {}).filter((k) => LR_FAULTS[k].where === where);
}
if (typeof worldInteract === "function") {
  const lrWorld = { worldTargetInfo, worldInteract };
  worldTargetInfo = function (o) {
    const res = lrWorld.worldTargetInfo(o),
      id = o?.userData.interact || "";
    if (!G || (typeof worldIsShopping === "function" && worldIsShopping())) return res;
    const notes = lrFaultsAt(id).map((k) => LR_FAULTS[k].t + "（手持" + DB[LR_FAULTS[k].tool].name.replace(/ · .*$/, "") + "修）");
    let [n, h] = res;
    if (id === "window") h += "  ·  Shift+E 看看窗外";
    if (notes.length) h += "  ·  " + notes.join("；");
    return [n, h];
  };
  worldInteract = function (shift = false) {
    const id = W.focus?.userData.interact || "";
    const free = W.enabled && worldVisible() && !paused && !panelType && !W.busy && !W.glance && !W.held && G && phase === "playing" && !(typeof worldIsShopping === "function" && worldIsShopping());
    if (free && id === "window" && shift) return worldStart(G.curtains ? "从窗帘缝往外看" : "在窗边看一会儿", 3, () => lrWatch(), "use");
    return lrWorld.worldInteract(shift);
  };
}
