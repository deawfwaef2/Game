/* v0.23 survival layer: quantified rationing, food safety, kitchen preparation and environment-driven incidents. */
const SURVIVAL = {
  qte: null,
  distance: 0,
  seed: "",
  ui: null,
};
function survQuality(it) {
  return ["premium", "economy", "clearance"].includes(it?.qualityTier)
    ? it.qualityTier
    : "standard";
}
function survSafetyText(it) {
  if (!it) return "";
  const tier = survQuality(it);
  if (["food", "drink"].includes(it.kind)) {
    return ({
      premium: "优选批次：封装与抽检更严格，食源风险较低；价格也更高。",
      economy: "简装低价：批次稳定性一般，开封与临期后更容易出问题。",
      clearance: "临期特价：折扣大但风险偏高，请尽早食用并留意状态。",
      standard: "常规批次：正常保存下风险较低；开封或临近保质期时请优先使用。",
    })[tier];
  }
  if (it.kind === "medicine") {
    return ({
      premium: "严选护理品：对症效果更可靠，价格较高。",
      economy: "简装低价护理品：可能效果不稳，留好备用剂量。",
      clearance: "折扣护理品：批次可靠性较低，可能需要备用剂量。",
      standard: "常规护理品：按对应状态使用。",
    })[tier];
  }
  if (it.base === "knife" || it.base === "cutboard") {
    return tier === "premium"
      ? "做工更可靠，切配时机更宽。"
      : tier === "economy"
        ? "简装低价，刃口或支撑不够稳定。"
        : "切配用具，能减轻手滑风险。";
  }
  return "";
}
function survFoodRisk(it, batch, failedQte = false) {
  if (!it || !["food", "drink"].includes(it.kind) || batch?.contaminated) return 0;
  let risk =
    survQuality(it) === "premium" ? 0.00012 :
    survQuality(it) === "economy" ? 0.003 :
    survQuality(it) === "clearance" ? 0.006 : 0.0007;
  if (Number.isFinite(it.life) && it.life < 9999) {
    const ratio = Math.max(0, (Number(batch?.age) || 0) / it.life);
    risk *= 1 + Math.max(0, ratio - 0.7) * 3;
  }
  if (batch?.opened) risk += 0.0002;
  if (typeof temperature === "function" && temperature() > 28) risk += 0.0002;
  if (failedQte) risk *= 1.25;
  return Math.min(0.018, risk);
}
function survChapterHard() { return !!(G?.level && !G.ended); }
function survFallChance(hazards = {}) {
  let p = 0.000025;
  if (hazards.wet) p += 0.00045;
  if (hazards.dark) p += 0.0003;
  if (hazards.clutter) p += 0.00024;
  if (hazards.tired) p += 0.00034;
  if (hazards.sprinting) p += 0.00042;
  if (hazards.wornFloor) p += 0.00008;
  if (hazards.chapterHard) p *= 1.2;
  return Math.min(0.003, p);
}
function survCurrentHazards(speed = 0) {
  const wet = !!(G?.cooldowns?.wetFloorUntil > G.minute),
    dark = !!(G && !G.power && (hour() >= 20 || hour() < 5) && G.candleUntil < G.minute),
    clutter = !!(G && (G.trash >= 12 || G.dirt > 65)),
    tired = !!(G && (G.stats.energy < 25 || G.illness.some((i) => i.id === "sprain"))),
    chapterHard = survChapterHard();
  return {
    wet,
    dark,
    clutter,
    tired,
    sprinting: speed > 1.55,
    wornFloor: (env?.wear || 0) > 0.65,
    chapterHard,
    cause: wet
      ? "刚才用水后的地面还有些湿滑"
      : dark
        ? "停电的夜里看不清脚下"
        : clutter
          ? "地面上的杂物和散落包装不太好避开"
          : tired
            ? "疲惫的双腿没能及时稳住"
            : speed > 1.55
              ? "匆忙的脚步踩到了旧地板的松动处"
              : "旧公寓的地板有一处轻微松动",
  };
}
function survQteEnsure() {
  if (SURVIVAL.ui || typeof document === "undefined") return SURVIVAL.ui;
  const style = document.createElement("style");
  style.id = "survivalIncidentStyles";
  style.textContent = `
#survivalIncident{position:fixed;inset:0;z-index:2500;display:grid;place-items:center;padding:18px;background:rgba(8,13,11,.72);backdrop-filter:blur(7px);font-family:system-ui,-apple-system,'Noto Sans CJK SC',sans-serif;color:#f2ead7}
#survivalIncident[hidden]{display:none}#survivalIncident .surv-card{width:min(540px,94vw);padding:clamp(22px,5vw,38px);border:1px solid #c6a76366;background:linear-gradient(145deg,#1e2822f5,#111715f5);box-shadow:0 22px 70px #0009;position:relative}
#survivalIncident .surv-kicker{display:block;color:#c5a963;font:700 10px/1.4 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase}
#survivalIncident h2{margin:12px 0 9px;color:#f1e8d3;font:600 clamp(24px,5vw,34px)/1.2 Georgia,'Noto Serif CJK SC',serif;letter-spacing:.04em}
#survivalIncident p{margin:0;color:#b8b4a5;font:14px/1.7 system-ui,sans-serif}#survivalIncident .surv-meter{position:relative;height:22px;margin:28px 0 13px;border:1px solid #a69d7b66;background:repeating-linear-gradient(90deg,#8c987f12 0 8%,#f1e8d20a 8% 9%);overflow:hidden}
#survivalIncident .surv-safe{position:absolute;top:0;bottom:0;background:#97b17d70;border-left:1px solid #c5d5a6;border-right:1px solid #c5d5a6;box-shadow:0 0 18px #aac78344}
#survivalIncident .surv-needle{position:absolute;top:-3px;bottom:-3px;width:3px;background:#f0d178;box-shadow:0 0 10px #ffdb88;transform:translateX(-1px)}
#survivalIncident .surv-status{min-height:25px;text-align:center;color:#d5c69a;font-size:12px!important}
#survivalIncident .surv-action{display:block;width:100%;margin-top:19px;padding:13px 16px;border:1px solid #c5a963;background:linear-gradient(120deg,#725d36,#9d804c);color:#fff4db;font:700 14px system-ui,sans-serif;letter-spacing:.05em;cursor:pointer;transition:filter .15s,transform .15s}
#survivalIncident .surv-action:hover{filter:brightness(1.14);transform:translateY(-1px)}#survivalIncident .surv-help{display:block;margin-top:11px;text-align:center;color:#898b7d;font:11px/1.5 system-ui,sans-serif}
@media(prefers-reduced-motion:reduce){#survivalIncident *{transition:none!important}}
`;
  document.head.appendChild(style);
  const root = document.createElement("div");
  root.id = "survivalIncident";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "survivalIncidentTitle");
  root.innerHTML = `<section class="surv-card"><span class="surv-kicker" id="survivalIncidentKicker">ROOM SAFETY / QUICK CHECK</span><h2 id="survivalIncidentTitle">稳住脚步</h2><p id="survivalIncidentCopy"></p><div class="surv-meter" aria-hidden="true"><span class="surv-safe"></span><i class="surv-needle"></i></div><p class="surv-status" id="survivalIncidentStatus" aria-live="polite"></p><button class="surv-action" id="survivalIncidentButton" type="button">把握时机</button><small class="surv-help">在指针进入浅色区域时按下空格、回车，或点击按钮。Esc 不会跳过这次动作。</small></section>`;
  document.body.appendChild(root);
  SURVIVAL.ui = {
    root,
    kicker: root.querySelector("#survivalIncidentKicker"),
    title: root.querySelector("#survivalIncidentTitle"),
    copy: root.querySelector("#survivalIncidentCopy"),
    status: root.querySelector("#survivalIncidentStatus"),
    safe: root.querySelector(".surv-safe"),
    needle: root.querySelector(".surv-needle"),
    button: root.querySelector("#survivalIncidentButton"),
  };
  return SURVIVAL.ui;
}
function survQteClose() {
  const q = SURVIVAL.qte;
  if (q?.frame) cancelAnimationFrame(q.frame);
  SURVIVAL.qte = null;
  if (SURVIVAL.ui) SURVIVAL.ui.root.hidden = true;
  if (typeof panelType !== "undefined" && panelType === "survival-qte") panelType = "";
}
function survStartQte(kind, options = {}) {
  if (!G || G.ended || SURVIVAL.qte || typeof document === "undefined") return false;
  const ui = survQteEnsure();
  if (!ui) return false;
  if (typeof releasePointer === "function") releasePointer();
  const q = {
    kind,
    started: performance.now(),
    deadline: performance.now() + (kind === "cut" ? 9000 : 5800),
    uid: options.uid || "",
    cause: options.cause || "",
    half: options.half || 0.15,
    injuryChance: options.injuryChance || 0,
    injured: false,
    hits: 0,
    misses: 0,
    attempts: 0,
    pos: 0,
    frame: 0,
  };
  SURVIVAL.qte = q;
  panelType = "survival-qte";
  ui.root.hidden = false;
  ui.kicker.textContent = kind === "fall" ? "ROOM SAFETY / FALL QTE" : "KITCHEN / VEGETABLE PREP";
  ui.title.textContent = kind === "fall" ? "腳下打滑" : "切好這一份菜";
  if (kind === "fall") {
    ui.title.textContent = "脚下打滑";
    ui.copy.textContent = `你感觉${q.cause}。看准时机稳住身体，尽量别让小失衡变成扭伤。`;
    ui.button.textContent = "稳住身体 · Space";
  } else {
    ui.copy.textContent = "连续完成三次安全切配。砧板垫稳、刀刃可靠时，可操作的安全时机更宽；手累或工具简陋会增加受伤机会。";
    ui.button.textContent = "切下一刀 · Space";
  }
  ui.status.textContent = kind === "fall" ? "指针进入浅色区域时按下。" : "安全切配 0 / 3 · 留意指针。";
  ui.safe.style.left = `${(0.5 - q.half) * 100}%`;
  ui.safe.style.width = `${q.half * 200}%`;
  ui.button.focus({ preventScroll: true });
  const tick = (now) => {
    if (SURVIVAL.qte !== q) return;
    q.pos = (Math.sin((now - q.started) * 0.0028 - Math.PI / 2) + 1) / 2;
    ui.needle.style.left = `calc(${q.pos * 100}% - 1px)`;
    if (now >= q.deadline) {
      if (q.kind === "fall") survFallFinish(false);
      else survCutFinish(true);
      return;
    }
    q.frame = requestAnimationFrame(tick);
  };
  q.frame = requestAnimationFrame(tick);
  return true;
}
function survInSafeZone(q) {
  return q.pos >= 0.5 - q.half && q.pos <= 0.5 + q.half;
}
function survFallFinish(success) {
  const q = SURVIVAL.qte;
  if (!q || q.kind !== "fall") return;
  survQteClose();
  if (!G || G.ended) return;
  G.cooldowns ??= {};
  G.cooldowns.fallUntil = G.minute + 180;
  SURVIVAL.distance = 0;
  if (success) {
    G.stats.energy = clamp(G.stats.energy - 0.8);
    logEvent("脚下一滑，你及时扶住墙沿，没有摔倒。", "good");
    notify("及时稳住了脚步。", "good");
  } else {
    G.stats.health = clamp(G.stats.health - 2.5);
    G.stats.morale = clamp(G.stats.morale - 1.5);
    addDisease("sprain");
    logEvent("没能及时站稳，轻微扭伤了脚踝。先休息，并用绷带或应急护理。", "warn");
    notify("轻微扭伤：休息或使用护理绷带。", "warn");
  }
  renderHUD();
  syncRoom();
  saveGame(false);
}
function survCutHalfWidth() {
  const knife = G?.inv.find((b) => !b.packed && b.units > 0 && isItem(b, "knife")),
    board = G?.inv.find((b) => !b.packed && b.units > 0 && isItem(b, "cutboard"));
  let half = 0.19;
  if (!knife) half -= 0.075;
  else if (survQuality(DB[knife.id]) === "premium") half += 0.045;
  else if (["economy", "clearance"].includes(survQuality(DB[knife.id]))) half -= 0.045;
  half += board ? 0.035 : -0.04;
  if (G?.stats.energy < 30) half -= 0.035;
  if (G?.stats.energy < 15) half -= 0.035;
  if (survChapterHard()) half -= 0.02;
  return clamp(half, 0.055, 0.27);
}
function survCutInjuryChance() {
  const knife = G?.inv.find((b) => !b.packed && b.units > 0 && isItem(b, "knife")),
    board = G?.inv.find((b) => !b.packed && b.units > 0 && isItem(b, "cutboard"));
  let p = 0.045;
  if (!knife) p += 0.19;
  else if (["economy", "clearance"].includes(survQuality(DB[knife.id]))) p += 0.11;
  if (!board) p += 0.09;
  if (G?.stats.energy < 30) p += 0.07;
  if (survChapterHard()) p += 0.05;
  return Math.min(0.58, p);
}
function survCauseCut() {
  if (!G || G.illness.some((i) => i.id === "cut")) return;
  G.stats.health = clamp(G.stats.health - 1.5);
  addDisease("cut");
  logEvent("切配时手指被刀刃轻轻划伤。清洁、包扎后再继续；护理绷带或应急护理盒可缩短恢复。", "warn");
  notify("手部轻微划伤：清洁包扎，必要时使用护理用品。", "warn");
  renderHUD();
}
function survCutAttempt() {
  const q = SURVIVAL.qte;
  if (!q || q.kind !== "cut" || !G || G.ended) return;
  q.attempts++;
  if (survInSafeZone(q)) {
    q.hits++;
    SURVIVAL.ui.status.textContent = `切配稳当 · 安全切配 ${q.hits} / 3`;
  } else {
    q.misses++;
    SURVIVAL.ui.status.textContent = "刀尖偏了一点。放慢呼吸，再找下一次时机。";
    if (!q.injured && rngNext(G) < q.injuryChance) {
      q.injured = true;
      survCauseCut();
    }
  }
  if (q.hits >= 3 || q.attempts >= 5) survCutFinish(false);
}
function survCutFinish(timedOut = false) {
  const q = SURVIVAL.qte;
  if (!q || q.kind !== "cut") return;
  const uidValue = q.uid,
    hits = q.hits,
    injured = q.injured;
  survQteClose();
  if (!G || G.ended) return;
  advanceTime(8, "prep");
  if (G.ended) return;
  logEvent(
    hits >= 3
      ? "把蔬菜切配好了，刀刃一直留在砧板上。"
      : timedOut
        ? "切配时机没找准，最后还是慢慢收了刀。"
        : "切配得不算整齐，但总算完成了。",
    hits >= 3 ? "good" : "normal",
  );
  if (injured) logEvent("手上的小伤口还在提醒你：先清洗，再用护理绷带。", "warn");
  if (typeof beginFoodQTE === "function" && G.inv.some((b) => b.uid === uidValue && b.units >= 1 && !b.packed))
    beginFoodQTE(uidValue);
}
function survHandleQteInput(e) {
  if (!SURVIVAL.qte) return;
  if (["Space", "Enter", "NumpadEnter", "KeyE"].includes(e.code)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!e.repeat) {
      if (SURVIVAL.qte.kind === "fall") survFallFinish(survInSafeZone(SURVIVAL.qte));
      else survCutAttempt();
    }
    return;
  }
  if (e.code === "Escape") {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (SURVIVAL.ui) SURVIVAL.ui.status.textContent = "先稳住这一刻；按下时机键或等待当前动作结束。";
  }
}
function survNeedsCut(it) {
  return !!(
    it &&
    it.kind === "food" &&
    !it.ingredient &&
    it.vegetable &&
    (it.category === "fresh" || it.cook)
  );
}
function survPrepareFood(uidValue) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id];
  if (!b || !it || !survNeedsCut(it)) return survBasePrepareFood.apply(this, arguments);
  if (isSpoiled(b) || b.contaminated || it.ingredient) return survBasePrepareFood.apply(this, arguments);
  if (it.cook && !G.power && !(has("stove") && amount("fuel") >= 1))
    return survBasePrepareFood.apply(this, arguments);
  if (it.cook && !canTap() && G.tank < 0.3) return survBasePrepareFood.apply(this, arguments);
  if (typeof document === "undefined") return survBasePrepareFood.apply(this, arguments);
  closePanel();
  const started = survStartQte("cut", {
    uid: b.uid,
    half: survCutHalfWidth(),
    injuryChance: survCutInjuryChance(),
  });
  if (!started) return survBasePrepareFood.apply(this, arguments);
}
function survFallGate() {
  return !!(
    G &&
    !G.ended &&
    phase === "playing" &&
    !paused &&
    !panelType &&
    !SURVIVAL.qte &&
    !document.getElementById("qteLayer")?.classList.contains("visible") &&
    !(typeof worldIsBusy === "function" && worldIsBusy()) &&
    (!G.cooldowns?.fallUntil || G.minute >= G.cooldowns.fallUntil)
  );
}
function survTrackDistance(distance, dt) {
  if (!(distance > 0.01) || !G || typeof document === "undefined" || !survFallGate()) return;
  if (SURVIVAL.seed !== G.seed) {
    SURVIVAL.seed = G.seed;
    SURVIVAL.distance = 0;
  }
  SURVIVAL.distance += distance;
  if (SURVIVAL.distance < 5) return;
  const segments = Math.floor(SURVIVAL.distance / 5),
    speed = dt > 0 ? distance / dt : 0;
  SURVIVAL.distance -= segments * 5;
  for (let i = 0; i < segments; i++) {
    const hazards = survCurrentHazards(speed);
    if (rngNext(G) < survFallChance(hazards)) {
      survStartQte("fall", { cause: hazards.cause, half: hazards.chapterHard ? 0.12 : 0.15 });
      return;
    }
  }
}
function survObserveMovement(fn, args, nowIndex = -1) {
  const before = camera ? [camera.position.x, camera.position.z] : null,
    dt = Number(args[nowIndex >= 0 ? nowIndex : 0]) || 0;
  const result = fn.apply(this, args);
  if (before && camera) {
    const distance = Math.hypot(camera.position.x - before[0], camera.position.z - before[1]);
    survTrackDistance(distance, dt);
  }
  return result;
}
function survOnAction(action, value) {
  const before = G?.minute;
  const result = survBaseDoAction.apply(this, arguments);
  if (!G || G.ended || G.minute === before) return result;
  if (["shower", "dishes", "laundry"].includes(action)) {
    G.cooldowns ??= {};
    const duration = action === "shower" ? 45 : action === "laundry" ? 30 : 18;
    G.cooldowns.wetFloorUntil = Math.max(G.cooldowns.wetFloorUntil || 0, G.minute + duration);
    G.cooldowns.wetFloorZone = action === "shower" ? "bathroom" : "kitchen";
  }
  return result;
}
function survAfterRisk(it, batch, risk, unsuccessful = false) {
  if (!G || G.ended || !it || !batch || batch.contaminated || risk <= 0) return;
  if (rngNext(G) < risk) {
    addDisease("foodborne");
    logEvent("刚才吃喝的东西让胃里有些不舒服。补水、休息并使用胃肠护理片。", "warn");
    renderHUD();
    saveGame(false);
  }
}
function survTakeMedicine(uidValue) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id];
  if (!b || !it || it.kind !== "medicine" || it.treat === "vitamin")
    return survBaseTakeMedicine.apply(this, arguments);
  const matches = G.illness.some((x) =>
    it.treat === "all" || it.treat === "rest" || x.id === it.treat || (it.treat === "stomach" && x.id === "foodborne"),
  );
  if (!matches) return survBaseTakeMedicine.apply(this, arguments);
  const tier = survQuality(it),
    failure = tier === "premium" ? 0.004 : tier === "economy" ? 0.12 : tier === "clearance" ? 0.16 : 0.025;
  if (rngNext(G) < failure) {
    if (!use(it.id)) return;
    advanceTime(5, "medicine");
    logEvent("这份简装护理品效果不明显；剂量已经用掉，必要时换用可靠的备用品。", "warn");
    notify("护理效果不明显，检查是否有备用药品。", "warn");
    saveGame(false);
    renderHUD();
    openInventory();
    return;
  }
  return survBaseTakeMedicine.apply(this, arguments);
}
function survEatMeal(uidValue, success = true, slow = false) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    risk = survFoodRisk(it, b, !success),
    wasContaminated = !!b?.contaminated;
  const result = survBaseConsumeMeal.apply(this, arguments);
  if (G && !G.ended && !wasContaminated) survAfterRisk(it, b, risk, !success);
  return result;
}
function survDrink(uidValue) {
  const b = uidValue === "tap" ? null : G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    before = b?.units || 0,
    risk = survFoodRisk(it, b);
  const result = survBaseActDrink.apply(this, arguments);
  if (G && !G.ended && b && it?.kind === "drink" && b.units < before)
    survAfterRisk(it, b, risk);
  return result;
}
function survInstall() {
  if (typeof document !== "undefined") {
    survQteEnsure();
    document.addEventListener("keydown", survHandleQteInput, true);
    document.addEventListener("click", (e) => {
      if (e.target?.closest?.("#survivalIncidentButton") && SURVIVAL.qte) {
        e.preventDefault();
        if (SURVIVAL.qte.kind === "fall") survFallFinish(survInSafeZone(SURVIVAL.qte));
        else survCutAttempt();
      }
    });
  }
  const oldItemUse = itemUse;
  itemUse = function (it) {
    const text = oldItemUse.apply(this, arguments),
      safety = survSafetyText(it);
    return [text, safety].filter(Boolean).join(text && safety ? "\n" : "");
  };
  const oldItemFacts = itemFacts;
  itemFacts = function (it) {
    const text = oldItemFacts.apply(this, arguments),
      safety = survSafetyText(it);
    return [text, safety].filter(Boolean).join(" · ");
  };
  const oldExpiry = expiryInventoryLabel;
  expiryInventoryLabel = function (it, batch) {
    const text = oldExpiry.apply(this, arguments);
    if (!it || !batch || isSpoiled(batch)) return text;
    if (batch.opened && batch.units > 0) return `${text} · 已拆封，优先食用`;
    if (it.life < 9999 && batch.age / it.life >= 0.72) return `${text} · 临近保质期，建议优先食用`;
    return text;
  };
  const oldPrepare = prepareFood;
  survBasePrepareFood = oldPrepare;
  prepareFood = survPrepareFood;
  const oldConsume = consumeMeal;
  survBaseConsumeMeal = oldConsume;
  consumeMeal = survEatMeal;
  const oldDrink = actDrink;
  survBaseActDrink = oldDrink;
  actDrink = survDrink;
  const oldMedicine = takeMedicine;
  survBaseTakeMedicine = oldMedicine;
  takeMedicine = survTakeMedicine;
  const oldAction = doAction;
  survBaseDoAction = oldAction;
  doAction = survOnAction;
  if (typeof freeMovement === "function") {
    const oldFreeMovement = freeMovement;
    freeMovement = function (dt) {
      return survObserveMovement(oldFreeMovement, arguments, 0);
    };
  }
  if (typeof worldFrame === "function") {
    const oldWorldFrame = worldFrame;
    worldFrame = function (now, dt) {
      return survObserveMovement(oldWorldFrame, arguments, 1);
    };
  }
}
let survBasePrepareFood, survBaseConsumeMeal, survBaseActDrink, survBaseTakeMedicine, survBaseDoAction;
survInstall();
