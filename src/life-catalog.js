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
    if (it?.gen && it.look && it.kind !== "book" && !I_SPEC[it.look] && DB[it.look]) return lcProduct(it.look, parent, bare);
    return lcProduct(id, parent, bare);
  };
}
