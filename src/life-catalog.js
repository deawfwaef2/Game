/* 闭门365 · v0.17 the catalogue's characters actually do something.
   Generated goods inherit the mechanics of their functional original (a sulphur soap still washes you), and on
   top of that their trait applies real numbers:
   - foods/drinks: health, thirst (spicy/salty), warmth on cold days, energy;
   - seasonings: one is used automatically on each cooked meal, rotating so the taste changes;
   - consumables (soap, shampoo, detergent, disinfectant…): a per-use bonus when an action consumes them;
   - durable tools (brooms, towels, pillows, pots…): the best one you own adds its bonus whenever it is used;
   - furniture & warm clothes: a gentle passive morale per hour (capped), some only on cold days;
   - plants: each different species makes the room a little kinder (up to four);
   - self-care goods (cold cream, cooling balm, foot soaks, hot-water bottles, dumbbells…): used from the hand. */
const LC_ACTION_BASES = {
  shower: ["towel", "razor", "comb"],
  hands: ["comb"],
  clean: ["broom", "mop", "gloves"],
  dishes: ["gloves", "bowl"],
  laundry: ["gloves"],
  teeth: ["toothbrush"],
  change: ["shirt", "underwear", "socks", "sweater"],
  sleep: ["pillow", "blanket", "clock"],
  repair: ["flashlight"],
  nails: ["nailclip"],
  hair: ["scissors"],
  candle: ["lighter"],
};
const lcBase = { simulate, doAction, consumeMeal, actDrink, takeMedicine };
function lcApply(bonus, k = 1) {
  if (!bonus || !G) return;
  const s = G.stats;
  if (bonus.morale) s.morale = clamp(s.morale + bonus.morale * k);
  if (bonus.health) s.health = clamp(s.health + bonus.health * k);
  if (bonus.hygiene) s.hygiene = clamp(s.hygiene + bonus.hygiene * k);
  if (bonus.dirt) G.dirt = Math.max(0, G.dirt - bonus.dirt * k);
}
function lcBonusSum(b) {
  return b ? (b.morale || 0) + (b.health || 0) * 2 + (b.hygiene || 0) * 0.3 + (b.dirt || 0) * 0.3 : -99;
}
// The best owned (unpacked) variant of a functional base that carries a bonus.
function lcBest(base) {
  let best = null;
  for (const b of G?.inv || []) {
    if (b.packed || b.units <= 0) continue;
    const it = DB[b.id];
    if (it?.base !== base || !it.bonus) continue;
    if (!best || lcBonusSum(it.bonus) > lcBonusSum(best.bonus)) best = it;
  }
  return best;
}
function lcUsedSince(mark) {
  return [...new Set(USED_LOG.slice(mark))];
}
// Bonus of consumables actually used up during an action (each distinct product once).
function lcConsumed(mark) {
  for (const id of lcUsedSince(mark)) {
    const it = DB[id];
    if (it?.bonus && it.servings > 1) lcApply(it.bonus);
  }
}
function lcDurables(bases) {
  for (const base of bases || []) {
    const it = lcBest(base);
    if (it && it.servings <= 1) lcApply(it.bonus);
  }
}
doAction = function (action, value) {
  const m0 = G?.minute,
    mark = USED_LOG.length;
  const r = lcBase.doAction(action, value);
  if (!G || G.ended || G.minute === m0) return r;
  lcConsumed(mark);
  lcDurables(LC_ACTION_BASES[action]);
  return r;
};
consumeMeal = function (uidValue, success = true, slow = false) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    units = b?.units,
    m0 = G?.minute,
    mark = USED_LOG.length;
  const r = lcBase.consumeMeal(uidValue, success, slow);
  if (!G || !it || G.minute === m0 || (b.units === units && G.inv.includes(b))) return r;
  const s = G.stats;
  if (it.health) s.health = clamp(s.health + it.health);
  if (it.thirst) s.water = clamp(s.water - it.thirst);
  if (it.energy) s.energy = clamp(s.energy + it.energy);
  if (it.warmth && temperature() < 15) s.morale = clamp(s.morale + it.warmth);
  if (it.cook) {
    lcSeason();
    lcDurables(["pot", "pan"]);
  }
  lcDurables(["bowl"]);
  lcConsumed(mark);
  return r;
};
// One seasoning per cooked meal, rotating through what is on the shelf so the taste keeps changing.
function lcSeason() {
  const opts = G.inv.filter((b) => !b.packed && b.units > 0 && DB[b.id]?.kind === "seasoning" && DB[b.id].season && !isSpoiled(b));
  if (!opts.length) return null;
  G.life ??= {};
  const last = G.life.lastSeason;
  const pick = opts.find((b) => DB[b.id].line !== last) || opts[0],
    it = DB[pick.id];
  pick.units--;
  G.inv = G.inv.filter((x) => x.units > 0.0001);
  G.life.lastSeason = it.line;
  G.life.seasoned = (G.life.seasoned || 0) + 1;
  G.stats.morale = clamp(G.stats.morale + it.season);
  if (it.thirst) G.stats.water = clamp(G.stats.water - it.thirst);
  return it;
}
actDrink = function (uidValue) {
  const b = uidValue !== "tap" && G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    m0 = G?.minute;
  // A thermos keeps yesterday's boiled water hot: one brewed drink a day without power or a stove.
  let thermos = false;
  if (G && it?.brew && !G.power && !has("stove") && G.inv.some((x) => !x.packed && DB[x.id]?.thermos) && (G.life?.thermosDay ?? -1) !== day()) {
    thermos = true;
    G.power = true;
  }
  let r;
  try {
    r = lcBase.actDrink(uidValue);
  } finally {
    if (thermos) G.power = false;
  }
  if (!G || !it || G.minute === m0) return r;
  if (thermos) {
    G.life ??= {};
    G.life.thermosDay = day();
    if (typeof showToast === "function") showToast("暖水瓶里的水还温着，冲了一杯。");
  }
  if (it.health) G.stats.health = clamp(G.stats.health + it.health);
  if (it.warmth && temperature() < 15) G.stats.morale = clamp(G.stats.morale + it.warmth);
  if (it.brew) lcDurables(["cup"]);
  return r;
};
takeMedicine = function (uidValue) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    m0 = G?.minute;
  const r = lcBase.takeMedicine(uidValue);
  if (G && it?.bonus && G.minute !== m0) lcApply(it.bonus);
  return r;
};
simulate = function (minutes, context) {
  lcBase.simulate(minutes, context);
  if (!G || G.ended) return;
  const h = minutes / 60,
    t = temperature();
  let comfort = 0;
  const bases = new Set(),
    plants = new Set();
  for (const b of G.inv) {
    if (b.packed || b.units <= 0) continue;
    const it = DB[b.id];
    if (!it?.gen) continue;
    if (it.base === "plant") plants.add(it.line);
    const key = it.base || it.line;
    if (bases.has(key)) continue;
    if (it.comfort && (!it.coldComfort || t < 13)) {
      bases.add(key);
      comfort += it.comfort;
    } else if (it.coldComfort && t < 13) {
      bases.add(key);
      comfort += 0.03;
    }
  }
  comfort += Math.min(4, plants.size) * 0.025;
  if (comfort > 0) G.stats.morale = clamp(G.stats.morale + Math.min(0.24, comfort) * h);
};
// Self-care goods used straight from the hand.
function doCare(uidValue) {
  if (!G || G.ended) return;
  const b = G.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id];
  if (!b || b.packed || b.units < 1 || !it?.care) return;
  const c = it.care;
  G.life ??= {};
  G.life.care ??= {};
  const key = it.line + "@" + day(),
    times = G.life.care[key] || 0,
    limit = it.reusable ? 1 : 2;
  if (times >= limit) return notify(it.reusable ? "今天已经用过了，明天再说。" : "今天已经用过两次了，省着点。");
  for (const k of Object.keys(G.life.care)) if (!k.endsWith("@" + day())) delete G.life.care[k];
  G.life.care[key] = times + 1;
  if (!it.reusable) {
    b.units--;
    G.inv = G.inv.filter((x) => x.units > 0.0001);
  }
  const s = G.stats,
    t = temperature();
  if (c.hygiene) s.hygiene = clamp(s.hygiene + c.hygiene);
  if (c.morale) s.morale = clamp(s.morale + c.morale);
  if (c.health) s.health = clamp(s.health + c.health);
  if (c.energy) s.energy = clamp(s.energy + c.energy);
  if (c.cold && t < 15) s.morale = clamp(s.morale + 3);
  if (c.hot && t > 24) s.morale = clamp(s.morale + 3);
  G.life.cared = (G.life.cared || 0) + 1;
  advanceTime(c.min || 2, "care");
  logEvent(`用了${it.name}。${c.text}`, "good");
  saveGame(false);
  if (typeof renderHUD === "function") renderHUD();
}
// Browser only: hand-use for self-care goods, and variant tools reuse the action of their original.
if (typeof worldUseHeld === "function") {
  const lcUseHeld = worldUseHeld;
  worldUseHeld = function () {
    const held = W?.held,
      b = held && G?.inv.find((x) => x.uid === held.uid),
      it = b && DB[b.id];
    if (it?.kind === "care" && !held.prepared)
      return worldStart(it.care.min >= 10 ? "慢慢做完这件事" : "照顾一下自己", Math.min(5, 1.5 + it.care.min / 6), () => doCare(b.uid), "medicine");
    if (it?.kind === "seasoning") return showToast("调味料：每顿煮的饭会自动用一点，几种轮着用。R 放回储物架。");
    return lcUseHeld.apply(this, arguments);
  };
}
// Browser only: a variant without its own model borrows the shape of its original (the label still shows its own name).
if (typeof worldProduct === "function" && typeof I_SPEC !== "undefined") {
  const lcProduct = worldProduct;
  worldProduct = function (id, parent = null, bare = false) {
    const it = DB[id];
    if (it?.gen && it.look && it.kind !== "book" && !it.shape && !I_SPEC[it.look] && DB[it.look]) return lcProduct(it.look, parent, bare);
    return lcProduct(id, parent, bare);
  };
}

/* ===== v0.18 line specials, sleep aids, plants, books by genre ===== */
function lcL() {
  G.life ??= {};
  return G.life;
}
function lcCure(id, min) {
  const d = G.illness.find((x) => x.id === id);
  if (!d) return false;
  d.remaining = Math.max(0, d.remaining - min);
  G.illness = G.illness.filter((x) => x.remaining > 0);
  return true;
}
// Food/drink/seasoning specials. mode: eat | drink | season
function lcFoodFx(it, mode) {
  if (!it?.fx?.length || !G) return;
  const s = G.stats,
    L = lcL(),
    t = temperature(),
    hr = hour();
  for (const k of it.fx) {
    if (k === "full") L.fullUntil = G.minute + 300;
    else if (k === "cool" && t > 24) {
      s.morale = clamp(s.morale + 3);
      s.water = clamp(s.water + 6);
    } else if (k === "warm" && t < 15) s.morale = clamp(s.morale + 2);
    else if (k === "cureCold") lcCure("cold", 480);
    else if (k === "cureStomach") lcCure("stomach", 480);
    else if (k === "sleepAid") L.sleepAid = G.minute + 360;
    else if (k === "wake") {
      s.energy = clamp(s.energy + 6);
      if (hr >= 20 || hr < 4) L.wakeful = G.minute + 300;
    } else if (k === "comfort" && s.morale < 43) s.morale = clamp(s.morale + 3);
    else if (k === "memory" && mode !== "season") {
      L.tasted ??= {};
      if (!L.tasted[it.line]) {
        L.tasted[it.line] = 1;
        s.morale = clamp(s.morale + 5);
        logEvent(`第一次在这屋里吃到${it.note.split("，")[0]}。${it.note.includes("，") ? it.note.split("，").slice(1).join("，") + "。" : ""}有那么一会儿，你忘了自己在躲。`, "story");
      }
    } else if (k === "vitc") L.vitUntil = G.minute + 3 * 1440;
    else if (k === "strength") s.energy = clamp(s.energy + 4);
    else if (k === "focus") L.focusUntil = G.minute + 240;
    else if (k === "heavy" && mode !== "season") {
      if (L.heavyDay === day()) s.morale = clamp(s.morale - 2);
      L.heavyDay = day();
    } else if (k === "sugar") {
      s.energy = clamp(s.energy + 4);
      s.morale = clamp(s.morale + 1);
    } else if (k === "crumbs") G.dirt = Math.min(100, G.dirt + 1);
    else if (k === "festive" && hr >= 18) s.morale = clamp(s.morale + 4);
    else if (k === "pure") s.health = clamp(s.health + 0.3);
    else if (k === "craftcook" && mode === "eat" && it.cook) {
      s.morale = clamp(s.morale + 2);
      advanceTime(10, "cook");
    } else if (k === "pastime" && mode === "eat") {
      s.morale = clamp(s.morale + 3);
      G.dirt = Math.min(100, G.dirt + 1);
      advanceTime(20, "leisure");
    }
  }
}
// Pickles, peanuts, salted eggs…: one serving goes with each cooked staple meal.
const LC_GRAIN = ["rice", "noodles", "oats", "buckwheat", "flour", "lentils", "beans"];
function lcSide(meal, repeats) {
  if (!meal.cook || !(LC_GRAIN.includes(meal.look) || LC_GRAIN.includes(meal.id) || meal.flavor === "grain")) return null;
  const opts = G.inv.filter((b) => !b.packed && b.units > 0 && DB[b.id]?.fx?.includes("side") && DB[b.id].kind === "food" && !isSpoiled(b) && !b.contaminated);
  if (!opts.length) return null;
  const L = lcL(),
    pick = opts.find((b) => DB[b.id].line !== L.lastSide) || opts[0],
    it = DB[pick.id];
  pick.units--;
  G.inv = G.inv.filter((x) => x.units > 0.0001);
  L.lastSide = it.line;
  L.sides = (L.sides || 0) + 1;
  G.stats.morale = clamp(G.stats.morale + 2 + (repeats > 1 ? 1.5 : 0));
  if (it.thirst) G.stats.water = clamp(G.stats.water - it.thirst * 0.5);
  return it;
}
{
  const prevMeal = consumeMeal;
  consumeMeal = function (uidValue, success = true, slow = false) {
    const b = G?.inv.find((x) => x.uid === uidValue),
      it = b && DB[b.id],
      units = b?.units,
      m0 = G?.minute,
      flavor = it && (it.flavor || it.id),
      repeats = it ? G.foodHistory.slice(-5).filter((f) => f === flavor).length : 0;
    const r = prevMeal(uidValue, success, slow);
    if (!G || !it || G.minute === m0 || (b.units === units && G.inv.includes(b))) return r;
    lcFoodFx(it, "eat");
    if (it.cook) {
      const side = lcSide(it, repeats);
      if (side && typeof showToast === "function") showToast(`配了一点${side.name.replace(/ · .*/, "")}，这碗饭香多了。`);
      if (lcL().cookSkill) G.stats.morale = clamp(G.stats.morale + 1);
    }
    return r;
  };
  const prevSeason = lcSeason;
  lcSeason = function () {
    const it = prevSeason();
    if (it) lcFoodFx(it, "season");
    return it;
  };
  const prevDrink = actDrink;
  actDrink = function (uidValue) {
    const b = uidValue !== "tap" && G?.inv.find((x) => x.uid === uidValue),
      it = b && DB[b.id],
      m0 = G?.minute;
    const r = prevDrink(uidValue);
    if (G && it && G.minute !== m0) lcFoodFx(it, "drink");
    return r;
  };
  const prevDisease = addDisease;
  addDisease = function (id) {
    if (G && id === "cold" && (G.life?.vitUntil || 0) > G.minute && !G.illness.some((i) => i.id === id) && rngNext(G) < 0.5) {
      G.life.vitSaved = (G.life.vitSaved || 0) + 1;
      return;
    }
    return prevDisease(id);
  };
}
// Owned goods with passive character: best one per base/line counts.
function lcPassive() {
  const out = {};
  for (const b of G?.inv || []) {
    if (b.packed || b.units <= 0) continue;
    const it = DB[b.id];
    if (!it?.pass) continue;
    for (const [k, v] of Object.entries(it.pass)) {
      if (k === "pw" && !G.power) continue;
      if (it.pass.pw && !G.power && /^sl/.test(k)) continue;
      const key = k + "|" + (it.base || it.line);
      out[key] = Math.max(out[key] || 0, v === true ? 1 : v);
    }
  }
  const sum = {};
  for (const [key, v] of Object.entries(out)) {
    const k = key.split("|")[0];
    sum[k] = (sum[k] || 0) + v;
  }
  return sum;
}
{
  const prevSim = simulate;
  simulate = function (minutes, context) {
    prevSim(minutes, context);
    if (!G || G.ended) return;
    const h = minutes / 60,
      s = G.stats,
      L = lcL(),
      t = temperature();
    if ((L.fullUntil || 0) > G.minute) s.food = clamp(s.food + 0.9 * h);
    const P = lcPassive();
    let comfort = 0;
    if (P.c) comfort += P.c;
    if (P.cc && t < 13) comfort += P.cc;
    if (P.ch && t > 24) comfort += P.ch;
    const winter = typeof lrOutdoor === "function" ? lrOutdoor() < 3 : t < 12;
    if (P.winter && winter) comfort += 0.03;
    if (L.made) for (const line of Object.keys(L.made)) comfort += line === "maoxian" ? (t < 13 ? 0.04 : 0) : 0.015;
    if (comfort) s.morale = clamp(s.morale + Math.min(0.18, comfort) * h);
    if (context === "sleep") {
      let e = (P.sl || 0) + (t < 13 ? P.slc || 0 : 0) + (t > 24 ? P.slh || 0 : 0);
      if ((L.sleepAid || 0) > G.minute) e += 0.6;
      if ((L.wakeful || 0) > G.minute) e -= 0.5;
      if (e) s.energy = clamp(s.energy + Math.max(-0.5, Math.min(1.4, e)) * h);
    }
    if (P.jarplus)
      for (const b of G.inv) {
        const it = DB[b.id];
        if (it?.category === "staple" && it.life < 9999 && !b.packed && b.location !== "fridge") b.age -= (minutes / 1440) * 0.15;
      }
    if (P.dust && G.dirt > 0 && liDaily("lc-dust")) G.dirt = Math.max(0, G.dirt - Math.min(2, P.dust));
    if (P.aloe && G.illness.length && liDaily("lc-aloe")) s.health = clamp(s.health + 0.5);
    if (P.hope && s.morale < 30 && liDaily("lc-hope")) s.morale = clamp(s.morale + 2);
  };
}
// Books by genre, reading lamps and desk plants, "brain food".
const LC_BOOK = { finishJoy: { 传记: 4, 科普: 6, 外语读本: 6 } };
{
  const prevRead = doRead;
  doRead = function (id) {
    const it = DB[id],
      m0 = G?.minute,
      L = G && lcL(),
      startMorale = G?.stats.morale,
      st = G?.books[id],
      before = st ? st.pages : 0,
      wasFinished = st && it ? st.pages >= it.pages : false,
      reads = st?.reads || 0,
      hr = G ? hour() : 12;
    const r = prevRead(id);
    if (!G || !it || G.minute === m0) return r;
    const s = G.stats,
      b = G.books[id],
      g = it.genre;
    let extra = 0;
    const P = lcPassive();
    if (P.rd) extra += Math.min(1.5, P.rd);
    if ((L.focusUntil || 0) > m0) extra += 1.5;
    if (g === "小说" && startMorale < 40) extra += 2;
    if (g === "侦探小说" && b) b.pages = Math.min(it.pages, b.pages + 20);
    if ((g === "冒险小说" || g === "科幻小说") && (hr >= 20 || hr < 4)) extra += 1;
    if (g === "诗集" && typeof lrPrecip === "function" && lrPrecip(m0)) extra += 1.5;
    if (g === "散文集") L.sleepAid = G.minute + 360;
    if ((g === "连环画" || g === "杂志合订本") && wasFinished) extra += Math.max(1, it.joy / (reads + 2)) * 0.6;
    if (b && !wasFinished && b.pages >= it.pages) {
      if (LC_BOOK.finishJoy[g]) {
        extra += LC_BOOK.finishJoy[g];
        logEvent(g === "传记" ? `读完了${it.name.replace(/ · .*/, "")}。别人的一生也有熬不下去的时候，后来都熬过去了。` : `读完了${it.name.replace(/ · .*/, "")}，脑子里多了点东西。`, "good");
      }
      if (g === "棋谱") L.chessSkill = true;
      if (g === "菜谱") L.cookSkill = true;
    }
    if (extra) s.morale = clamp(s.morale + extra);
    return r;
  };
  const prevLeisure = doLeisure;
  doLeisure = function (id) {
    const it = DB[id];
    if (G && it?.pass?.needRadio && !has("radio")) return notify("磁带要用收音机（收录机）才能放。");
    const m0 = G?.minute;
    const r = prevLeisure(id);
    if (!G || !it || G.minute === m0) return r;
    const L = lcL();
    if (it.pass?.noise) {
      G.suspicion = Math.min(100, (G.suspicion || 0) + 3);
      if (typeof showToast === "function") showToast("声音不小，楼道里可能有人听见。");
    }
    if (it.pass?.focus) L.focusUntil = G.minute + 240;
    if (it.activity === "chess" && L.chessSkill) G.stats.morale = clamp(G.stats.morale + 2);
    const p = it.pass || {},
      hr = hour();
    if (p.nightowl && (hr >= 20 || hr < 4)) G.stats.morale = clamp(G.stats.morale + 1.5);
    if (p.rainy && typeof lrPrecip === "function" && lrPrecip(m0)) G.stats.morale = clamp(G.stats.morale + 1.5);
    if (p.fortune) {
      const v = Math.round((rngNext(G) * 5 - 1) * 10) / 10;
      G.stats.morale = clamp(G.stats.morale + v);
      logEvent(v >= 2 ? "抽到一张好牌。明知道是自己哄自己，还是高兴了一下。" : v < 0 ? "抽到一张不吉利的牌。你把它塞回了牌堆最底下。" : "抽到的牌说不清好坏。", "normal");
    }
    if (p.memory) {
      L.tasted ??= {};
      if (!L.tasted[it.line]) {
        L.tasted[it.line] = 1;
        G.stats.morale = clamp(G.stats.morale + 5);
        logEvent(`翻开${it.name}，里面夹着几张别人的旧邮票，有一张盖着你老家的邮戳。`, "story");
      }
    }
    if (p.make && CG_MAKE[it.line]) {
      L.makeCount ??= {};
      L.made ??= {};
      L.makeCount[it.line] = (L.makeCount[it.line] || 0) + 1;
      if (!L.made[it.line] && L.makeCount[it.line] >= p.make) {
        L.made[it.line] = day();
        G.stats.morale = clamp(G.stats.morale + 4);
        logEvent(`做好了${CG_MAKE[it.line][0]}。${CG_MAKE[it.line][1].replace("心情下降慢一点", "看着它，心里踏实一点")}。`, "good");
        if (typeof showToast === "function") showToast(`做好了${CG_MAKE[it.line][0]}`);
      }
    }
    return r;
  };
}
