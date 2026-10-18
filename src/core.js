/* Deterministic survival simulation. No server and no real-world offline decay. */
const SAVE_KEY = "closed365-save-v3";
let G = null,
  phase = "title",
  currentSeed = "ANDERS-1986",
  env = environment(currentSeed),
  cart = {},
  shopCategory = "all",
  shopQuery = "",
  paused = false,
  panelType = "",
  selectedInv = "all",
  soundOn = false;
// A preparation session exists only before a new run. It is never restored from saves.
let preparationOpen = false,
  purchasingNow = false;
// Chapter mode hides the clock and the calendar; only bought timepieces and outside cues tell the time.
function timeHidden() {
  return !!(G && G.level && !G.ended);
}
function gameBudget() {
  return typeof lvBudget === "function" ? lvBudget() : 300;
}
function gameGoalDays() {
  return typeof lvGoalDays === "function" ? lvGoalDays() : 365;
}
function canPurchase() {
  return phase === "shop" && preparationOpen && !purchasingNow;
}
function blockPurchase() {
  notify("开局采购已经结束。本局不能购买或补货，只能使用现有存量。", "warn");
  return false;
}
function startPreparation() {
  if (phase !== "title") return blockPurchase();
  preparationOpen = true;
  cart = {};
  phase = "shop";
  return true;
}
function closePreparation() {
  preparationOpen = false;
  purchasingNow = false;
  cart = {};
}
function stockSummary() {
  const items = new Map();
  let kcal = 0;
  for (const b of G?.inv || []) {
    if (b.units <= 0) continue;
    const it = DB[b.id];
    if (!it) continue;
    const row = items.get(b.id) || { id: b.id, total: 0, usable: 0, packed: 0 };
    row.total += b.units;
    if (b.packed) row.packed += b.units;
    if (!isSpoiled(b) && !b.contaminated) {
      row.usable += b.units;
      if (it.kind === "food") kcal += (it.kcal || 0) * b.units;
    }
    items.set(b.id, row);
  }
  return {
    items: [...items.values()],
    kcal,
    theoreticalDays: Math.floor(kcal / 2000),
    remainingDays: Math.max(0, 366 - day()),
  };
}
const gameLog = [];
function uid() {
  return "i" + Math.random().toString(36).slice(2, 10);
}
function clamp(v, a = 0, b = 100) {
  return Math.max(a, Math.min(b, v));
}
function day() {
  return G ? Math.floor(G.minute / 1440) + 1 : 1;
}
function hour() {
  return G ? (G.minute % 1440) / 60 : 8;
}
function freshWaste() {
  return { packaging: 0, scraps: 0, discarded: 0, items: [], warnedFull: false };
}
function ensureWaste() {
  if (!G) return null;
  if (!G.waste || typeof G.waste !== "object" || Array.isArray(G.waste)) {
    G.waste = freshWaste();
    G.waste.packaging = Math.max(0, Math.floor(Number(G.trash) || 0));
  }
  G.waste.packaging ??= 0;
  G.waste.scraps ??= 0;
  G.waste.discarded ??= 0;
  G.waste.items ??= [];
  G.waste.warnedFull ??= false;
  return G.waste;
}
function addWaste(kind, id = null, count = 1) {
  if (!G) return 0;
  const waste = ensureWaste(),
    amount = Math.max(0, Math.floor(Number(count) || 0));
  if (!["packaging", "scraps", "discarded"].includes(kind)) kind = "discarded";
  const total = waste.packaging + waste.scraps + waste.discarded,
    added = Math.min(amount, Math.max(0, 2e7 - total));
  waste[kind] += added;
  for (let i = 0; i < Math.min(added, 48); i++) {
    waste.items.push({ kind, id: typeof id === "string" && Object.hasOwn(DB, id) ? id : null });
    if (waste.items.length > 48) waste.items.shift();
  }
  G.trash = total + added;
  return G.trash;
}
function markPackageOpened(batch) {
  if (!G || !batch || batch.opened) return false;
  batch.opened = true;
  addWaste("packaging", batch.id);
  return true;
}
function clearWaste() {
  if (!G) return;
  G.waste = freshWaste();
  G.trash = 0;
}
// v0.17: a catalogue variant (e.g. a sulphur soap) counts as its functional original ("soap").
const USED_LOG = [];
function isItem(b, id) {
  return b.id === id || DB[b.id]?.base === id;
}
function has(id) {
  return !!G?.inv.some((b) => isItem(b, id) && !b.packed && b.units > 0);
}
function amount(id) {
  return (
    G?.inv
      .filter((b) => isItem(b, id) && !b.packed)
      .reduce((a, b) => a + b.units, 0) || 0
  );
}
function use(id, n = 1) {
  const batches = G.inv
    .filter((b) => isItem(b, id) && !b.packed && b.units > 0)
    .sort((a, b) => a.created - b.created);
  let remaining = n;
  for (const b of batches) {
    const take = Math.min(b.units, remaining);
    if (take > 0) markPackageOpened(b);
    b.units -= take;
    remaining -= take;
    if (take > 0) USED_LOG.push(b.id);
    if (remaining <= 0) break;
  }
  if (USED_LOG.length > 40) USED_LOG.splice(0, USED_LOG.length - 40);
  G.inv = G.inv.filter((b) => b.units > 0.0001);
  return remaining <= 0.0001;
}
function countPackages() {
  return G?.inv.filter((b) => b.packed && b.units > 0).length || 0;
}
function availableFood() {
  return G.inv.filter(
    (b) =>
      !b.packed &&
      DB[b.id]?.kind === "food" &&
      !DB[b.id].ingredient &&
      b.units >= 1 &&
      !isSpoiled(b) &&
      !b.contaminated,
  );
}
function isSpoiled(b) {
  return b.age >= (DB[b.id]?.life || 9999);
}
function temperature() {
  if (!G) return env.temp;
  const season = Math.sin(((day() + 30) / 365) * Math.PI * 2) * 4;
  return Math.round(
    env.temp +
      season +
      (G.weather.temp || 0) +
      (has("heater") && G.power ? 4 : 0) -
      (has("fan") && G.power ? 2 : 0),
  );
}
function storedWater() {
  return G?.tank || 0;
}
function waterCapacity() {
  return G
    ? G.inv
        .filter((b) => !b.packed && DB[b.id]?.capacity)
        .reduce((a, b) => a + DB[b.id].capacity * b.units, 0)
    : 0;
}
function canTap() {
  return G.waterOn;
}
function spendWater(liters) {
  if (canTap()) return true;
  if (G.tank >= liters) {
    G.tank -= liters;
    return true;
  }
  return false;
}
function notify(text, type = "info") {
  if (typeof showToast === "function") showToast(text, type);
}
function logEvent(text, type = "normal") {
  if (!G) return;
  const entry = { minute: G.minute, text, type };
  G.log.unshift(entry);
  G.log = G.log.slice(0, 100);
  if (typeof renderJournalBadge === "function") renderJournalBadge();
}
function freshState(seed) {
  const e = environment(seed);
  return {
    version: 3,
    tradeLocked: true,
    seed,
    env: e,
    rng: hashSeed(seed + "events"),
    minute: 8 * 60 + 10,
    cash: gameBudget(),
    stats: {
      food: 85,
      water: 85,
      energy: 88,
      morale: 82,
      hygiene: 80,
      health: 100,
    },
    bladder: 18,
    bowel: 12,
    dirt: 12 + e.wear * 5,
    dishes: 0,
    trash: 0,
    waste: freshWaste(),
    hair: 8,
    nails: 1,
    clothes: 90,
    dirtyClothes: 0,
    tank: 0,
    inv: [],
    bags: [],
    books: {},
    entertainment: {},
    cooldowns: {},
    foodHistory: [],
    meals: {},
    sleepToday: 0,
    readToday: 0,
    activity: "idle",
    illness: [],
    power: true,
    waterOn: true,
    powerUntil: 0,
    waterUntil: 0,
    weather: { temp: 0, until: 0 },
    curtains: true,
    suspicion: 3,
    nextEvent: 22 * 60 + Math.floor(rngNext({ rng: hashSeed(seed) }) * 900),
    lastHour: 8,
    lastDay: 1,
    candleUntil: 0,
    heater: true,
    layout: {},
    log: [],
    ended: false,
    win: false,
    pendingKnock: false,
    emergencyUsed: false,
    position: null,
  };
}
function putCartIntoState(summary) {
  if (!purchasingNow || phase !== "shop") return blockPurchase();
  const offset = G.bags.length;
  summary.total.forEach((bag, i) => {
    G.bags.push({
      id: offset + i,
      weight: bag.weight,
      opened: false,
      crate: i >= summary.bags.length,
    });
    for (const [id, qty] of Object.entries(bag.items)) {
      G.inv.push({
        uid: uid(),
        id,
        units: DB[id].servings * qty,
        packed: true,
        bag: offset + i,
        created: G.minute,
        age: 0,
        location: "bag",
        opened: false,
        contaminated: false,
      });
    }
  });
}
function beginGame() {
  if (!canPurchase()) return blockPurchase();
  const s = cartSummary(cart);
  if (s.cost > gameBudget() + 0.001) {
    notify("纸币不够。请调整开局清单。", "warn");
    return false;
  }
  if (!s.count) {
    notify("请先选择开局物资。进入公寓后无法补货。", "warn");
    return false;
  }
  preparationOpen = false;
  purchasingNow = true;
  try {
    G = freshState(currentSeed);
    env = G.env;
    G.cash = Math.round((gameBudget() - s.cost) * 100) / 100;
    putCartIntoState(s);
  } finally {
    purchasingNow = false;
  }
  logEvent("1986年，你与家人告别。门锁落下，没有人知道你住在这里。", "story");
  logEvent(
    "这是本局唯一一次采购。此后不能购买、补货或送货，只能依靠现有物资。",
    "story",
  );
  logEvent(
    `${s.bags.length}只塑料袋、${s.crates.length}件独立箱已搬入。理论热量约${s.days}天，目标365天；保质期与烹煮资源仍需规划。`,
    s.days < 365 ? "warn" : "good",
  );
  phase = "playing";
  if (typeof roomRoot === "undefined" || roomRoot?.userData.seed !== env.seed)
    buildRoom(env);
  setFirstPerson();
  cart = {};
  closePanel();
  updatePhase();
  saveGame(false);
  renderHUD();
  if (typeof syncRoom === "function") syncRoom();
  notify("门已锁上，采购永久结束。先拆开门边的物资，清点存量。");
  return true;
}

// Bags/crates that still physically hold something at the door (opened or not).
function bagsAtDoor() {
  if (!G) return [];
  const full = new Set(
    G.inv.filter((x) => x.packed && x.units > 0).map((x) => x.bag),
  );
  return G.bags.filter((b) => full.has(b.id));
}
// Rule-panel fallback (no WebGL) only. The 3D room never sorts items for the player.
function unpackBag(index, all = false) {
  const targets = bagsAtDoor().filter((b) => all || b.id === index);
  if (!targets.length) return notify("这些袋子已经拆开了。");
  for (const bag of targets) {
    bag.opened = true;
    for (const b of G.inv.filter((x) => x.bag === bag.id && x.packed)) {
      b.packed = false;
      const it = DB[b.id];
      b.location =
        it.kind === "food" && it.life < 60 && env.fridge
          ? "fridge"
          : it.category === "furniture"
            ? "room"
            : "shelf";
    }
  }
  advanceTime(Math.min(90, targets.length * 2), "unpack");
  logEvent(
    `拆开了${targets.length}袋物资，逐件归到${env.fridge ? "冰箱和" : ""}储物处。`,
    "good",
  );
  saveGame(false);
  syncRoom();
  renderHUD();
  if (panelType === "bags") openStation("bags");
}
function getWarnings() {
  if (!G) return [];
  const w = [];
  const s = G.stats;
  if (s.food < 25) w.push("需要吃饭");
  if (s.water < 25) w.push("需要喝水");
  if (s.energy < 20) w.push("严重疲劳");
  if (s.morale < 30) w.push("精神低落");
  if (s.hygiene < 30) w.push("需要清洗");
  if (G.bladder > 78) w.push("需要小便");
  if (G.bowel > 78) w.push("需要大便");
  if (G.dirt > 55) w.push("房间需要打扫");
  if (G.nails > 4) w.push("该剪指甲");
  if (G.hair > 24) w.push("头发有些长");
  if (G.clothes < 30) w.push("衣物需要更换");
  return w;
}
function safeReason(context) {
  const s = G.stats;
  if (s.water < 13) return "口渴已经危险";
  if (s.food < 12) return "饥饿已经危险";
  if (s.energy < 7 && context !== "sleep") return "体力已经危险";
  if (s.health < 20) return "健康正在告急";
  if (s.morale < 15) return "精神已经告急";
  if (G.bladder > 94 && context !== "toilet") return "小便需求接近极限";
  if (G.bowel > 94 && context !== "toilet") return "大便需求接近极限";
  return "";
}
function advanceTime(minutes, context = "idle", safe = true) {
  if (!G || G.ended) return 0;
  let advanced = 0;
  const intended = minutes;
  G.activity = context;
  G.cooldowns ??= {};
  const startDay = day();
  while (advanced < minutes) {
    const step = Math.min(5, minutes - advanced);
    simulate(step, context);
    advanced += step;
    if (G.ended) break;
    const reason = safeReason(context);
    if (safe && intended > 20 && reason) {
      notify(`时间推进已中断：${reason}。`, "warn");
      logEvent(
        `主动停下了${context === "sleep" ? "睡眠" : "活动"}：${reason}。`,
        "warn",
      );
      break;
    }
    if (G.lvBreak) {
      G.lvBreak = false;
      if (intended > 20) break;
    }
    if (G.pendingKnock && intended > 20) {
      logEvent("门外响起敲门声，时间推进中断。", "warn");
      break;
    }
  }
  G.activity = "idle";
  if (day() !== startDay && !timeHidden()) notify(`第 ${day()} 天。你还在这里。`);
  renderHUD();
  syncRoom();
  saveGame(false);
  return advanced;
}
function simulate(minutes, context) {
  const h = minutes / 60,
    s = G.stats,
    sleep = context === "sleep",
    reading = context === "read";
  const oldDay = day(),
    oldHour = Math.floor(G.minute / 60);
  G.minute += minutes;
  const cold =
    temperature() +
      (has("sweater") ? 4 : 0) +
      (sleep && has("blanket") ? 4 : 0) <
    13;
  const hot = temperature() > 29;
  s.food -= (sleep ? 1.8 : 2.8) * h * (cold ? 1.15 : 1);
  s.water -=
    (sleep ? 2.4 : 3.6) *
    h *
    (hot ? 1.3 : 1) *
    (G.illness.some((i) => i.id === "stomach") ? 1.3 : 1);
  const bedQuality = env.bed + (has("pillow") ? 1 : 0);
  s.energy += (sleep ? 7.6 + bedQuality * 1.1 : -2.7) * h;
  G.sleepToday += sleep ? h : 0;
  let loss =
    0.32 +
    Math.min(0.12, (day() / 365) * 0.12) +
    (G.dirt > 45 ? 0.25 : 0) +
    (s.hygiene < 35 ? 0.35 : 0) +
    (G.clothes < 30 ? 0.2 : 0) +
    (G.nails > 4 ? 0.12 : 0) +
    (G.hair > 24 ? 0.12 : 0) +
    (G.illness.length ? 0.4 : 0) +
    (cold ? 0.25 : 0) +
    (hot ? 0.2 : 0);
  if (sleep && G.sleepToday > 9) loss += 1.8;
  if (!G.power && hour() > 19 && G.candleUntil < G.minute) loss += 0.35;
  if (!G.curtains && hour() > 18) G.suspicion += h * 0.5;
  s.morale -= loss * h;
  if (has("plant")) s.morale += 0.08 * h;
  s.hygiene -= 0.65 * h;
  G.clothes -= 0.35 * h;
  G.bladder += 3.6 * h;
  G.bowel += 1.1 * h;
  G.dirt += 0.12 * h;
  G.hair += 0.035 * h;
  G.nails += 0.0035 * h;
  if (s.food < 12) {
    s.health -= 2.5 * h;
    s.morale -= 1.1 * h;
  }
  if (s.water < 12) {
    s.health -= 4 * h;
    s.morale -= 1.5 * h;
  }
  if (s.energy < 6) {
    s.health -= 1.1 * h;
    s.morale -= 0.8 * h;
  }
  if (sleep && s.food > 25 && s.water > 25) s.health += 0.35 * h;
  if (G.bladder >= 100 || G.bowel >= 100) {
    G.bladder = Math.min(G.bladder, 76);
    G.bowel = Math.min(G.bowel, 76);
    s.hygiene -= 12;
    s.morale -= 6;
    G.dirt += 4;
    logEvent("你没能及时照顾个人需要。更换衣物、清洗后会好一些。", "warn");
  }
  for (const disease of G.illness) {
    disease.remaining -= minutes;
    if (disease.id === "fever") s.health -= 0.55 * h;
    if (disease.id === "cold") s.energy -= 0.6 * h;
    if (sleep) disease.remaining -= minutes * 0.35;
  }
  G.illness = G.illness.filter((i) => i.remaining > 0);
  for (const b of G.inv) {
    const it = DB[b.id];
    if (it.life >= 9999) continue;
    const multiplier =
      b.location === "fridge" && env.fridge && G.power ? 0.22 : 1;
    b.age += (minutes / 1440) * multiplier;
  }
  if (!G.power && G.minute >= G.powerUntil) {
    G.power = true;
    logEvent("灯光轻轻闪动。电力恢复了。", "good");
    notify("电力恢复");
  }
  if (!G.waterOn && G.minute >= G.waterUntil) {
    G.waterOn = true;
    logEvent("管道传来水声，自来水恢复。", "good");
    notify("供水恢复");
  }
  if (G.weather.until && G.minute > G.weather.until)
    G.weather = { temp: 0, until: 0 };
  const newDay = day();
  if (newDay !== oldDay) dailyUpdate();
  if (Math.floor(G.minute / 60) !== oldHour) hourlyUpdate();
  if (G.minute >= G.nextEvent) {
    randomEvent();
    G.nextEvent = G.minute + 14 * 60 + Math.floor(rngNext(G) * 28 * 60);
  }
  for (const k in s) s[k] = clamp(s[k]);
  G.bladder = clamp(G.bladder);
  G.bowel = clamp(G.bowel);
  G.dirt = clamp(G.dirt);
  G.clothes = clamp(G.clothes);
  G.suspicion = clamp(G.suspicion);
  if (s.health <= 0)
    endGame(false, "身体已无法继续支撑。你没能等到街头平静的那一天。");
  else if (s.morale <= 0)
    endGame(false, "漫长的孤独压垮了你的精神。这一次，你没能完成隐匿计划。");
  else if (!G.level && G.minute >= 365 * 1440)
    endGame(
      true,
      "整整365天过去了。通缉画像褪色，街头换了新的秩序。你还活着。",
    );
}
function hourlyUpdate() {
  if (G.stats.hygiene < 22 && G.dirt > 45 && rngNext(G) < 0.015)
    addDisease("stomach");
  if (temperature() < 12 && !has("sweater") && rngNext(G) < 0.008)
    addDisease("cold");
  if (G.stats.health < 65 && G.stats.hygiene < 20 && rngNext(G) < 0.006)
    addDisease("fever");
}
function dailyUpdate() {
  G.lastDay = day();
  G.sleepToday = 0;
  G.readToday = 0;
  G.suspicion = Math.max(0, G.suspicion - (G.curtains ? 1.4 : 0.4));
  G.foodHistory = G.foodHistory.slice(-12);
  const spoiled = G.inv.filter(
    (b) => !b.packed && isSpoiled(b) && DB[b.id]?.kind === "food",
  );
  if (spoiled.length) {
    G.dirt = clamp(G.dirt + Math.min(3, spoiled.length * 0.5));
    logEvent(
      `${spoiled.length}批食物已过保质期。背包中会标红，可以集中丢弃。`,
      "warn",
    );
  }
  const waste = ensureWaste();
  if (G.level && G.trash >= 12) {
    G.dirt = clamp(G.dirt + Math.min(0.8, 0.25 + (G.trash - 12) * 0.025));
    if (!waste.warnedFull) {
      logEvent("垃圾桶已经满了。包装和残渣堆在旁边，房间整洁会慢慢下降。", "warn");
      waste.warnedFull = true;
    }
  } else if (G.trash < 6) waste.warnedFull = false;
  if (!G.level && day() % 7 === 0)
    logEvent(
      `第${day()}天。你把新的刻痕留在日历上。还有${365 - day()}天。`,
      "story",
    );
}
function addDisease(id) {
  if (G.illness.some((i) => i.id === id)) return;
  G.illness.push({ id, remaining: 24 * 60 + Math.floor(rngNext(G) * 48 * 60) });
  logEvent(`持续状态：${DISEASES[id].name}。${DISEASES[id].desc}`, "warn");
  notify("身体不太舒服：" + DISEASES[id].name, "warn");
}
function randomEvent() {
  const roll = rngNext(G);
  if (roll < 0.18 && G.power) {
    G.power = false;
    G.powerUntil = G.minute + 180 + Math.floor(rngNext(G) * 600);
    logEvent("楼内电网故障。预计数小时后恢复，冰箱暂停保鲜。", "warn");
    notify("突然停电。留意冰箱和照明。", "warn");
  } else if (roll < 0.33 && G.waterOn) {
    G.waterOn = false;
    G.waterUntil = G.minute + 180 + Math.floor(rngNext(G) * 540);
    logEvent("水管停止了供水。提前储水和瓶装水现在派得上用场。", "warn");
    notify("楼内临时停水", "warn");
  } else if (roll < 0.45) {
    // Warm spells come mostly in the warm half of the year, cold snaps in the cold half.
    const warmHalf = Math.sin(((day() + 30) / 365) * Math.PI * 2) > 0;
    G.weather = { temp: rngNext(G) > (warmHalf ? 0.3 : 0.75) ? 5 : -5, until: G.minute + 24 * 60 };
    logEvent(
      G.weather.temp > 0
        ? warmHalf
          ? "窗外热浪来袭，房间变得闷热。"
          : "一股暖湿的南风吹过来，屋里没那么冷了。"
        : warmHalf
          ? "刮了一夜北风，屋里一下子凉快了。"
          : "冷空气经过，室温缓慢下降。",
      "normal",
    );
  } else if (roll < 0.57) {
    G.pendingKnock = true;
    logEvent(
      "门外响了三下。也许只是邻居，但你不想冒险。保持安静，不必开门。",
      "warn",
    );
    notify("有人敲门。可以在门边查看或保持安静。", "warn");
  } else if (roll < 0.69) {
    G.stats.morale = clamp(G.stats.morale + 3);
    logEvent("旧楼远处传来模糊的琴声。你突然想起了家。", "story");
  } else
    logEvent("这几个小时，楼道里什么也没发生。平静是难得的好消息。", "normal");
}
function actDrink(uidValue) {
  if (uidValue === "tap") {
    if (!spendWater(0.5))
      return notify("停水了，也没有足够的储水。可以喝瓶装水。", "warn");
    G.stats.water = clamp(G.stats.water + 50);
    G.bladder = clamp(G.bladder + 8);
    advanceTime(5, "drink");
    logEvent("你喝了一杯干净的水。");
  } else {
    const b = G.inv.find((x) => x.uid === uidValue),
      it = b && DB[b.id];
    if (!b || b.packed || b.units < 1) return;
    if (it.brew && !spendWater(0.25))
      return notify("冲泡需要自来水或储水。", "warn");
    if (it.brew && !G.power && !has("stove"))
      return notify("冲泡需要电力，或便携炉。", "warn");
    if (isSpoiled(b)) return notify("饮品已过期。请丢弃。", "warn");
    markPackageOpened(b);
    b.units--;
    G.inv = G.inv.filter((x) => x.units > 0);
    G.stats.water = clamp(G.stats.water + it.water);
    G.stats.morale = clamp(G.stats.morale + (it.joy || 0));
    G.stats.energy = clamp(G.stats.energy + (it.energy || 0));
    G.bladder = clamp(G.bladder + 7);
    advanceTime(it.brew ? 8 : 3, "drink");
    logEvent(`喝了${it.name}。`);
  }
  saveGame(false);
  renderHUD();
  if (panelType === "inventory") openInventory();
}
function prepareFood(uidValue) {
  const b = G.inv.find((x) => x.uid === uidValue);
  if (!b || b.packed || b.units < 1) return;
  const it = DB[b.id];
  if (isSpoiled(b)) return notify("已经变质，不能食用。", "warn");
  if (b.contaminated)
    return notify("这批物资包装破损、受了潮，最好密封丢弃，不要冒险。", "warn");
  if (it.ingredient) return notify("这是配料。烹调主食时会自动搭配使用。");
  if (it.cook) {
    if (!G.power && !(has("stove") && amount("fuel") >= 1))
      return notify("停电期间需要便携炉和燃料块。先吃免煮食品。", "warn");
    if (!canTap() && G.tank < 0.3)
      return notify("烹调需要0.3L水。先使用瓶装水或等待供水。", "warn");
  }
  closePanel();
  beginFoodQTE(b.uid);
}
function consumeMeal(uidValue, success = true, slow = false) {
  const b = G.inv.find((x) => x.uid === uidValue);
  if (!b || b.units < 1 || b.packed) return;
  const it = DB[b.id];
  const flavor = it.flavor || it.id;
  const repeats = G.foodHistory.slice(-5).filter((f) => f === flavor).length;
  const wasContaminated = b.contaminated;
  markPackageOpened(b);
  b.units--;
  b.opened = true;
  G.foodHistory.push(flavor);
  G.foodHistory = G.foodHistory.slice(-12);
  let kcal = it.kcal;
  if (it.cook) {
    spendWater(0.3);
    if (!G.power) use("fuel");
    if (has("oil")) {
      use("oil");
      kcal += DB.oil.kcal;
    }
  }
  // Chapter mode uses the slower trait-based palate system; classic mode keeps its original short-window penalty.
  let joy = (it.joy || 1) + (success ? 1 : 0) - (G.level ? 0 : Math.max(0, repeats - 1) * 1.4);
  if (repeats > 1 && has("spice")) {
    use("spice");
    joy += 3;
  }
  G.stats.food = clamp(G.stats.food + kcal / 24);
  if (it.water) G.stats.water = clamp(G.stats.water + it.water);
  G.stats.morale = clamp(G.stats.morale + joy);
  G.bowel = clamp(G.bowel + 8 + kcal / 160);
  G.dishes += 1;
  G.dirt += success ? 1 : 4;
  addWaste("scraps", it.id);
  if (wasContaminated) addDisease("stomach");
  if (!success)
    logEvent("没能稳稳吃完，桌上多了一点残渣。没有令人不适的画面。", "warn");
  const period = hour() < 10 ? "早餐" : hour() < 16 ? "午餐" : "晚餐";
  const key = day() + "-" + period;
  G.meals[key] = true;
  advanceTime((it.cook ? (has("pot") ? 20 : 30) : 12) + (slow ? 10 : 0), "eat");
  logEvent(
    `${period}：${it.name}。${repeats > 2 ? "连续相同口味让你有些乏味。" : "吃点不一样的，心情也好一点。"}`,
    "good",
  );
  G.inv = G.inv.filter((x) => x.units > 0);
  saveGame(false);
  renderHUD();
  syncRoom();
}
function doAction(action, value) {
  if (!G || G.ended) return;
  const s = G.stats;
  switch (action) {
    case "drink":
      actDrink("tap");
      break;
    case "fill": {
      const cap = waterCapacity();
      if (!G.waterOn) return notify("现在停水，无法接水。", "warn");
      if (cap <= 0) return notify("需要先购买并拆出水壶或储水桶。", "warn");
      G.tank = cap;
      advanceTime(8, "fill");
      logEvent(`装满储水容器，共${cap}L。`, "good");
      break;
    }
    case "pee":
      G.bladder = 0;
      s.hygiene -= 1;
      advanceTime(4, "toilet");
      logEvent("处理完小便。");
      break;
    case "poop":
      G.bowel = 0;
      s.hygiene -= 3;
      if (has("paper")) use("paper");
      else {
        s.morale -= 1;
        logEvent("没有卫生纸，只能用水代替。补充生活物资会更从容。", "warn");
        spendWater(0.5);
      }
      advanceTime(10, "toilet");
      logEvent("处理完大便。");
      break;
    case "hands":
      if (!spendWater(0.3)) return notify("清洗需要水。", "warn");
      s.hygiene = clamp(s.hygiene + 8);
      advanceTime(3, "wash");
      break;
    case "shower":
      if (!spendWater(8)) return notify("洗澡需要供水，或至少8L储水。", "warn");
      {
        const soap = has("soap");
        if (soap) use("soap");
        s.hygiene = clamp(s.hygiene + (soap ? 55 : 28));
        s.morale = clamp(s.morale + (soap ? 5 : 2));
        if (!G.power && temperature() < 16) s.morale -= 2;
        advanceTime(20, "wash");
        logEvent(
          soap
            ? "洗了个澡，整个人轻松了些。"
            : "只用清水冲洗。肥皂能洗得更干净。",
          "good",
        );
      }
      break;
    case "teeth":
      if (!has("toothbrush") || !has("toothpaste"))
        return notify("需要牙刷和牙膏。", "warn");
      if (!spendWater(0.15)) return notify("需要少量水。", "warn");
      use("toothpaste");
      s.hygiene = clamp(s.hygiene + 8);
      s.morale = clamp(s.morale + 1);
      advanceTime(4, "wash");
      break;
    case "sleep": {
      const hours = clamp(Number(value) || 8, 1, 12);
      closePanel();
      const elapsed = advanceTime(hours * 60, "sleep");
      logEvent(
        `睡了${(elapsed / 60).toFixed(1)}小时。${G.sleepToday > 9 ? "睡得太久会让精神低落。" : "身体恢复了一些。"}`,
      );
      break;
    }
    case "wait":
      closePanel();
      advanceTime((Number(value) || 1) * 60, "wait");
      logEvent("你安静地等了一会儿。");
      break;
    case "exercise":
      if (s.energy < 20) return notify("太疲惫了，先休息。", "warn");
      s.morale = clamp(s.morale + 9);
      s.health = clamp(s.health + 1.5);
      s.energy -= 5;
      s.hygiene -= 5;
      advanceTime(30, "exercise");
      logEvent("你完成一组安静的伸展。身体还在，生活就还在。", "good");
      break;
    case "clean": {
      const tool = has("broom") || has("mop");
      const reduction = tool ? 35 : 12;
      const removed = Math.min(reduction, G.dirt);
      G.dirt = Math.max(0, G.dirt - reduction);
      s.morale = clamp(s.morale + Math.min(tool ? 6 : 2, removed / 5));
      s.hygiene -= 2;
      advanceTime(tool ? 30 : 45, "clean");
      logEvent(
        tool
          ? "扫过地面，收好散落物。房间重新有了秩序。"
          : "徒手整理了一些杂物。扫帚会更有效。",
        "good",
      );
      break;
    }
    case "dishes":
      if (!spendWater(1)) return notify("清洗餐具需要1L水。", "warn");
      {
        const soap = has("dishsoap");
        if (soap) use("dishsoap");
        G.dirt = Math.max(0, G.dirt - Math.min(15, G.dishes * 2));
        G.dishes = 0;
        advanceTime(12, "clean");
        logEvent("洗好了餐具。");
        break;
      }
    case "trash":
      if (!G.trash && !G.inv.some((b) => isSpoiled(b)))
        return notify("现在没有需要处理的垃圾。");
      {
        const waste = ensureWaste(),
          packaging = waste.packaging,
          scraps = waste.scraps,
          discarded = waste.discarded,
          spoiled = G.inv.filter((b) => isSpoiled(b));
        G.inv = G.inv.filter((b) => !isSpoiled(b));
        if (has("trashbag")) use("trashbag");
        clearWaste();
        G.dirt = Math.max(0, G.dirt - 8);
        advanceTime(10, "clean");
        logEvent(
          `密封带走包装${packaging}份、餐厨残渣${scraps}份、其他废弃物${discarded}份和变质物资${spoiled.length}批。没有恶心画面。`,
          "good",
        );
        break;
      }
    case "nails":
      if (G.nails <= 0.8) return notify("指甲已经修剪整齐，不必再剪。");
      if (!has("nailclip")) return notify("需要指甲刀。", "warn");
      G.nails = 0.5;
      s.morale = clamp(s.morale + 3);
      advanceTime(10, "groom");
      logEvent("剪好指甲，感觉利落多了。");
      break;
    case "hair":
      if (G.hair <= 7) return notify("头发已经很短了，等长一些再修剪。");
      if (!has("scissors")) return notify("需要理发剪。", "warn");
      G.hair = 6;
      s.morale = clamp(s.morale + 4);
      G.dirt += 2;
      advanceTime(25, "groom");
      logEvent("对着镜子把头发修短了一些。");
      break;
    case "change":
      if (!has("shirt") && !has("underwear"))
        return notify("没有拆出的换洗衣物。", "warn");
      if (G.dirtyClothes >= Math.max(1, amount("shirt") + amount("underwear")))
        return notify("干净的备用衣物已经用完，先洗衣服。", "warn");
      G.dirtyClothes++;
      G.clothes = 100;
      s.morale = clamp(s.morale + 4);
      advanceTime(5, "groom");
      logEvent("换上干净衣物。");
      break;
    case "laundry":
      if (!G.dirtyClothes) return notify("暂时没有待洗衣物。");
      if (!spendWater(6)) return notify("手洗衣物需要6L水。", "warn");
      if (!has("detergent")) return notify("需要洗衣粉。", "warn");
      use("detergent");
      G.dirtyClothes = 0;
      advanceTime(40, "wash");
      s.morale = clamp(s.morale + 3);
      logEvent("衣物洗好了，晾在不显眼的地方。");
      break;
    case "curtains":
      G.curtains = !G.curtains;
      advanceTime(1, "idle");
      logEvent(
        G.curtains
          ? "拉上窗帘。这个房间再次藏进夜色。"
          : "拉开一点窗帘。看到天空让你舒心，但夜间会更显眼。",
      );
      if (!G.curtains) s.morale = clamp(s.morale + 2);
      break;
    case "silence":
      G.pendingKnock = false;
      G.suspicion = Math.max(0, G.suspicion - 1);
      advanceTime(15, "wait");
      logEvent("你屏住呼吸。门外的脚步声最终远去了。", "story");
      break;
    case "peek":
      G.pendingKnock = false;
      advanceTime(3, "peek");
      logEvent(
        rngNext(G) < 0.7
          ? "猫眼里只有空荡荡的楼道。"
          : "有人提着纸袋下楼，没往你的方向看。",
        "story",
      );
      break;
    case "candle":
      if (!has("candle")) return notify("需要蜡烛。", "warn");
      use("candle");
      G.candleUntil = G.minute + 6 * 60;
      advanceTime(2, "light");
      logEvent("蜡烛已固定在防火托盘上。6小时后熄灭。");
      break;
    case "repair":
      if (!has("repair")) return notify("需要维修工具。", "warn");
      if (G.power && G.waterOn) return notify("目前水电都正常。");
      use("repair");
      const fix = has("flashlight") ? 30 : 60;
      G.powerUntil = Math.min(G.powerUntil, G.minute + fix);
      G.waterUntil = Math.min(G.waterUntil, G.minute + fix);
      advanceTime(45, "repair");
      logEvent("进行了力所能及的检查，故障剩余时间缩短至约1小时。");
      break;
    case "waterplant":
      G.cooldowns ??= {};
      if (G.cooldowns.plant && G.minute - G.cooldowns.plant < 1440)
        return notify("土壤还湿润，今天不用再浇水。");
      if (!has("plant")) return notify("你没有绿植。");
      if (!spendWater(0.2)) return notify("需要0.2L水。", "warn");
      G.cooldowns.plant = G.minute;
      s.morale = clamp(s.morale + 4);
      advanceTime(8, "leisure");
      logEvent("叶片在光里微微发亮。照顾一点生命，也是在照顾自己。");
      break;
    case "emergency":
      if (G.emergencyUsed) return notify("抽屉里已经空了。");
      G.emergencyUsed = true;
      for (const id of ["crackers", "water", "soap"])
        G.inv.push({
          uid: uid(),
          id,
          units: DB[id].servings,
          packed: false,
          created: G.minute,
          age: 0,
          location: "shelf",
          opened: false,
        });
      advanceTime(10, "idle");
      logEvent(
        "房东旧抽屉里有一包饼干、一瓶水和一块肥皂。只够应急一次。",
        "good",
      );
      break;
  }
  saveGame(false);
  renderHUD();
  syncRoom();
  if (panelType && panelType !== "inventory") refreshPanel();
}
function doRead(id) {
  if (!has(id)) return notify("先拆出这本书。");
  const it = DB[id];
  G.books[id] ??= { pages: 0, reads: 0 };
  const b = G.books[id],
    finished = b.pages >= it.pages;
  const joy = finished ? Math.max(1, it.joy / (b.reads + 2)) : it.joy;
  const planned = 2;
  const elapsed = advanceTime(planned * 60, "read");
  G.stats.morale = clamp(G.stats.morale + (joy * elapsed) / (planned * 60));
  b.pages = Math.min(it.pages, b.pages + (elapsed / 60) * 40);
  if (finished) b.reads++;
  G.readToday += elapsed / 60;
  logEvent(
    `读了《${it.name.replace(/^.*《|》.*$/g, "")}》${(elapsed / 60).toFixed(1)}小时。${finished ? "重读的感觉没有第一次新鲜。" : b.pages >= it.pages ? "你翻到了最后一页。" : "故事还没有结束。"}`,
    "good",
  );
  saveGame(false);
  openLeisure();
}
function doLeisure(id) {
  if (!has(id)) return;
  const it = DB[id];
  if ((it.activity === "radio" || it.activity === "music") && !G.power) {
    if (has("battery")) use("battery");
    else return notify("停电时需要干电池。", "warn");
  }
  const count = G.entertainment[id] || 0;
  const joy = Math.max(2, it.joy - Math.floor(count / 4));
  const planned = it.activity === "radio" ? 60 : 90;
  const elapsed = advanceTime(planned, "leisure");
  G.entertainment[id] = count + elapsed / planned;
  G.stats.morale = clamp(G.stats.morale + (joy * elapsed) / planned);
  logEvent(`用${it.name}打发了一段时间。换一种消遣能保持新鲜感。`, "good");
  saveGame(false);
  openLeisure();
}
function takeMedicine(uidValue) {
  const b = G.inv.find((x) => x.uid === uidValue);
  if (!b || b.packed || b.units < 1) return;
  const it = DB[b.id];
  if (it.treat === "vitamin") {
    use(it.id);
    G.stats.health = clamp(G.stats.health + 3);
    G.stats.morale = clamp(G.stats.morale + 1);
    logEvent("按份量做了一次日常营养补充。");
  } else {
    const disease = G.illness.find(
      (x) => it.treat === "all" || it.treat === "rest" || x.id === it.treat,
    );
    if (!disease) return notify("目前没有对应状态，不需要使用。");
    use(it.id);
    disease.remaining = Math.max(0, disease.remaining - 12 * 60);
    G.stats.health = clamp(G.stats.health + 2);
    G.illness = G.illness.filter((x) => x.remaining > 0);
    logEvent("使用了一份对症护理物资。持续状态缩短约12小时。", "good");
  }
  advanceTime(5, "medicine");
  openInventory();
}
function moveItem(uidValue, location) {
  const b = G.inv.find((x) => x.uid === uidValue);
  if (!b || b.packed) return;
  if (location === "fridge" && !env.fridge) return notify("这个种子没有冰箱。");
  b.location = location;
  advanceTime(2, "organize");
  logEvent(
    `把${DB[b.id].name}放到${{ fridge: "冰箱", shelf: "储物架", table: "桌面", room: "房间" }[location] || location}。`,
  );
  saveGame(false);
  openInventory();
  syncRoom();
}
function saveGame(message = true) {
  if (!G) return;
  try {
    if (typeof getPlayerPosition === "function")
      G.position = getPlayerPosition();
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
    if (message) notify("存档已保存在当前浏览器。");
  } catch (e) {
    if (message)
      notify("预览限制本地存储。请导出JSON存档，下载后可继续。", "warn");
  }
}
function getSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    return validateSave(s) ? s : null;
  } catch {
    return null;
  }
}
function validateSave(s) {
  try {
    const num = (v, a, b) =>
      typeof v === "number" && Number.isFinite(v) && v >= a && v <= b;
    const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
    if (
      !obj(s) ||
      s.version !== 3 ||
      typeof s.seed !== "string" ||
      !s.seed.length ||
      s.seed.length > 100 ||
      !num(s.minute, 0, 2000 * 1440) ||
      !num(s.cash, 0, 10000)
    )
      return false;
    if (s.tradeLocked !== undefined && s.tradeLocked !== true) return false;
    if (!obj(s.stats) || !NEEDS.every(([k]) => num(s.stats[k], 0, 100)))
      return false;
    for (const k of ["bladder", "bowel", "dirt", "clothes", "suspicion"])
      if (!num(s[k], 0, 100)) return false;
    for (const k of [
      "dishes",
      "trash",
      "hair",
      "nails",
      "dirtyClothes",
      "tank",
      "sleepToday",
      "readToday",
      "powerUntil",
      "waterUntil",
      "nextEvent",
      "candleUntil",
    ])
      if (!num(s[k], 0, 2e7)) return false;
    if (s.waste !== undefined) {
      const w = s.waste,
        validItem = (x) => obj(x) && ["packaging", "scraps", "discarded"].includes(x.kind) && (x.id === null || Object.hasOwn(DB, x.id));
      if (!obj(w) || !num(w.packaging, 0, 2e7) || !num(w.scraps, 0, 2e7) || !num(w.discarded, 0, 2e7) || typeof w.warnedFull !== "boolean" || !Array.isArray(w.items) || w.items.length > 48 || !w.items.every(validItem)) return false;
      if (Math.abs(s.trash - w.packaging - w.scraps - w.discarded) > 0.001) return false;
    }
    if (!num(s.rng, 0, 4294967295) || !obj(s.env)) return false;
    const expected = environment(s.seed);
    for (const k of [
      "w",
      "d",
      "mirror",
      "fridge",
      "bed",
      "wear",
      "temp",
      "floor",
      "number",
      "wall",
      "view",
    ])
      if (s.env[k] !== expected[k]) return false;
    for (const k of [
      "power",
      "waterOn",
      "curtains",
      "ended",
      "win",
      "pendingKnock",
      "emergencyUsed",
    ])
      if (typeof s[k] !== "boolean") return false;
    if (
      !Array.isArray(s.inv) ||
      s.inv.length > 5000 ||
      !s.inv.every(
        (b) =>
          obj(b) &&
          Object.hasOwn(DB, b.id) &&
          typeof b.uid === "string" &&
          /^i[a-z0-9]{3,24}$/.test(b.uid) &&
          num(b.units, 0, 100000) &&
          num(b.age, 0, 10000) &&
          num(b.created, 0, 2e7) &&
          typeof b.packed === "boolean" &&
          num(b.bag ?? 0, 0, 10000) &&
          ["bag", "shelf", "table", "fridge", "room"].includes(b.location),
      )
    )
      return false;
    // Optional v0.4 physical placements. Older v3 saves omit these fields.
    for (const b of s.inv) {
      if (
        b.pose !== undefined &&
        b.pose !== null &&
        (!Array.isArray(b.pose) ||
          b.pose.length !== 4 ||
          !b.pose.every(Number.isFinite) ||
          Math.abs(b.pose[0]) > expected.w / 2 ||
          b.pose[1] < 0 ||
          b.pose[1] > 2 ||
          Math.abs(b.pose[2]) > expected.d / 2 ||
          Math.abs(b.pose[3]) > 10000)
      )
        return false;
    }
    if (
      s.heldUID !== undefined &&
      s.heldUID !== null &&
      (typeof s.heldUID !== "string" || !/^i[a-z0-9]{3,24}$/.test(s.heldUID))
    )
      return false;
    if (
      !Array.isArray(s.bags) ||
      s.bags.length > 10000 ||
      !s.bags.every(
        (b) =>
          obj(b) &&
          num(b.id, 0, 10000) &&
          num(b.weight, 0, b.crate ? 100 : 8.00001) &&
          typeof b.opened === "boolean",
      )
    )
      return false;
    if (!obj(s.books) || !obj(s.entertainment) || !obj(s.meals)) return false;
    if (
      Object.keys(s.books).length > CATALOG.length ||
      !Object.entries(s.books).every(
        ([id, b]) =>
          DB[id]?.kind === "book" &&
          obj(b) &&
          num(b.pages, 0, DB[id].pages) &&
          num(b.reads, 0, 10000),
      )
    )
      return false;
    if (
      !Object.entries(s.entertainment).every(
        ([id, n]) => DB[id]?.kind === "leisure" && num(n, 0, 10000),
      )
    )
      return false;
    if (
      !Array.isArray(s.foodHistory) ||
      s.foodHistory.length > 100 ||
      !s.foodHistory.every((x) => typeof x === "string" && x.length < 50)
    )
      return false;
    if (
      !Array.isArray(s.illness) ||
      s.illness.length > 3 ||
      !s.illness.every((i) => DISEASES[i.id] && num(i.remaining, 0, 100000))
    )
      return false;
    if (
      !obj(s.weather) ||
      !num(s.weather.temp, -10, 10) ||
      !num(s.weather.until, 0, 2e7)
    )
      return false;
    if (
      !Array.isArray(s.log) ||
      s.log.length > 100 ||
      !s.log.every(
        (l) =>
          obj(l) &&
          num(l.minute, 0, 2e7) &&
          typeof l.text === "string" &&
          l.text.length < 3000 &&
          ["normal", "warn", "good", "story"].includes(l.type),
      )
    )
      return false;
    if (
      s.position !== null &&
      s.position !== undefined &&
      (!Array.isArray(s.position) ||
        s.position.length !== 5 ||
        !s.position.every((n) => num(n, -10000, 10000)))
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
function continueGame() {
  const s = getSave();
  if (!s) return notify("没有找到兼容的存档。");
  loadState(s);
}
function loadState(s) {
  if (!validateSave(s)) return notify("存档格式不兼容或已损坏。", "warn");
  closePreparation();
  G = s;
  ensureWaste();
  G.tradeLocked = true;
  paused = false;
  G.cooldowns ??= {};
  env = G.env;
  currentSeed = G.seed;
  phase = G.ended ? "end" : "playing";
  buildRoom(env);
  setFirstPerson(G.position);
  closePanel();
  updatePhase();
  renderHUD();
  syncRoom();
  if (G.ended) showEnd();
  notify("已回到你上次离开的房间。");
}
function exportSave() {
  if (!G) return;
  saveGame(false);
  const blob = new Blob(
    [JSON.stringify({ format: "closed365-v3", game: G }, null, 2)],
    { type: "application/json" },
  );
  downloadBlob(blob, "closed365-save-day" + day() + ".json");
  notify("存档已导出。请保留这份文件。");
}
function importSave(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return notify("存档文件过大。", "warn");
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      loadState(data.game || data);
    } catch {
      notify("无法读取这份存档。", "warn");
    }
  };
  reader.readAsText(file);
}
function downloadBlob(blob, name) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function endGame(win, reason) {
  if (G.ended) return;
  G.ended = true;
  G.win = win;
  G.endReason = reason;
  G.minute = win && !G.level ? 365 * 1440 : G.minute;
  phase = "end";
  saveGame(false);
  closePanel();
  updatePhase();
  showEnd();
}
