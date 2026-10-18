/* 闭门365 · v0.13 the body speaks for itself. No meters on screen: when hunger, thirst, tiredness, low spirits,
   sickness, cold or heat actually reach a threshold, you feel it — the picture changes (colour drains, edges darken,
   eyelids droop, frost creeps in) and a short inner line appears once. Ordinary states show nothing at all. */
const LB_LINES = {
  food: [[30, "肚子咕咕叫了。该吃点东西。"], [15, "饿得发慌，手有点抖。"]],
  water: [[30, "嘴唇发干。"], [15, "喉咙干得发疼，头有点晕。"]],
  energy: [[25, "眼皮发沉。"], [10, "困得站都站不稳了。"]],
  morale: [[35, "心里空落落的。"], [20, "什么都不想做。"]],
  health: [[50, "身上不太对劲。"], [25, "浑身发冷，心跳很重。"]],
  hygiene: [[30, "身上黏糊糊的，想洗个澡。"]],
};
const LB_HIGH = {
  bladder: [[80, "得去趟厕所了。"], [92, "憋不住了。"]],
  bowel: [[80, "肚子发胀，得去厕所。"], [92, "肚子绞着疼，快去厕所。"]],
  dirt: [[55, "屋里乱得让人心烦。"]],
  hair: [[24, "刘海扎眼睛了。"]],
  nails: [[4, "指甲长得碍事了。"]],
};
const LB = { fx: {}, last: {}, el: null, lids: null, line: null, lineT: 0, blinkAt: 0, blinkEnd: 0 };
function lbClamp(v) {
  return Math.max(0, Math.min(1, v));
}
function lbSetup() {
  if (LB.el || typeof document === "undefined") return;
  const st = document.createElement("style");
  st.textContent = `#bodyFx{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity 1.2s}
#bodyFx.on{opacity:1}#bodyFx i{position:absolute;inset:0;display:block}
#bodyLids::before,#bodyLids::after{content:"";position:fixed;left:-5%;right:-5%;height:52%;background:#050403;pointer-events:none;z-index:7;transition:transform .22s ease-in}
#bodyLids::before{top:0;border-radius:0 0 50% 50%/0 0 30% 30%;transform:translateY(-102%)}
#bodyLids::after{bottom:0;border-radius:50% 50% 0 0/30% 30% 0 0;transform:translateY(102%)}
#bodyLids.shut::before,#bodyLids.shut::after{transform:translateY(0);transition-duration:.35s}
#bodyLids.half::before{transform:translateY(-62%)}#bodyLids.half::after{transform:translateY(62%)}
#bodyLine{position:fixed;left:50%;top:62%;transform:translate(-50%,6px);color:#f1e9d8;font:italic 17px/1.6 'Noto Serif CJK SC','Songti SC',serif;letter-spacing:.06em;text-shadow:0 1px 6px rgba(0,0,0,.85);opacity:0;transition:opacity .8s,transform .8s;pointer-events:none;z-index:8;white-space:nowrap}
#bodyLine.on{opacity:.95;transform:translate(-50%,0)}`;
  document.head.appendChild(st);
  LB.el = document.createElement("div");
  LB.el.id = "bodyFx";
  LB.el.innerHTML = "<i class='v'></i><i class='r'></i><i class='c'></i><i class='h'></i>";
  LB.lids = document.createElement("div");
  LB.lids.id = "bodyLids";
  LB.line = document.createElement("div");
  LB.line.id = "bodyLine";
  document.body.append(LB.el, LB.lids, LB.line);
}
// Target strengths 0..1 for each felt state (pure; used by tests too).
function lbTargets(s = G.stats) {
  const t = typeof temperature === "function" ? temperature() : 20;
  return {
    hunger: lbClamp((30 - s.food) / 30),
    thirst: lbClamp((30 - s.water) / 30),
    tired: lbClamp((25 - s.energy) / 25),
    sad: lbClamp((38 - s.morale) / 38),
    sick: Math.max(lbClamp((55 - s.health) / 55), G.illness?.length ? 0.22 : 0),
    cold: lbClamp((13 - t) / 8),
    hot: lbClamp((t - 28) / 6),
  };
}
function lbSay(text) {
  if (!LB.line) return;
  LB.line.textContent = text;
  LB.line.classList.add("on");
  clearTimeout(LB.lineT);
  LB.lineT = setTimeout(() => LB.line.classList.remove("on"), 4200);
}
// One line when a threshold is first crossed (or deepened); repeats only after 3 game hours.
function lbCheckLines() {
  const s = G.stats,
    now = G.minute,
    cand = [];
  const push = (key, level, text) => {
    const prev = LB.last[key];
    if (!prev || level > prev.level || now - prev.at > 180) cand.push([key, level, text]);
  };
  for (const [k, steps] of Object.entries(LB_LINES)) {
    let lv = 0,
      txt = "";
    steps.forEach(([th, line], i) => {
      if (s[k] < th) (lv = i + 1), (txt = line);
    });
    if (lv) push(k, lv, txt);
    else delete LB.last[k];
  }
  for (const [k, steps] of Object.entries(LB_HIGH)) {
    let lv = 0,
      txt = "";
    steps.forEach(([th, line], i) => {
      if ((G[k] || 0) > th) (lv = i + 1), (txt = line);
    });
    if (lv) push(k, lv, txt);
    else delete LB.last[k];
  }
  const t = temperature();
  if (t < 12) push("cold", 1, "冷得直搓手。");
  else if (t > 29) push("hot", 1, "闷热得喘不过气。");
  else delete LB.last.cold, delete LB.last.hot;
  if (!cand.length || (LB.line && LB.line.classList.contains("on"))) return;
  cand.sort((a, b) => b[1] - a[1]);
  const [key, level, text] = cand[0];
  LB.last[key] = { level, at: now };
  lbSay(text);
}
function lbActive() {
  return G && phase === "playing" && !G.ended && typeof worldVisible === "function" && worldVisible() && !panelType;
}
function lbTick() {
  lbSetup();
  const canvas = typeof renderer !== "undefined" && renderer?.domElement;
  if (!LB.el || !canvas) return;
  if (!lbActive()) {
    LB.el.classList.remove("on");
    LB.lids.className = "";
    canvas.style.filter = "";
    return;
  }
  const T = lbTargets(),
    F = LB.fx,
    nowMs = performance.now();
  for (const k of Object.keys(T)) F[k] = (F[k] ?? 0) + (T[k] - (F[k] ?? 0)) * 0.08;
  const sleeping = G.activity === "sleep" || W.busy?.kind === "sleep";
  const sat = Math.max(0.15, 1 - 0.65 * F.sad - 0.4 * F.hunger - 0.25 * F.sick),
    blur = 1.8 * F.tired * F.tired + 2.2 * F.thirst * F.thirst + 0.9 * F.sick * F.sick,
    bright = 1 - 0.12 * F.tired - 0.1 * F.hunger,
    sepia = 0.45 * F.thirst + 0.25 * F.hot;
  canvas.style.filter =
    sat > 0.98 && blur < 0.05 && bright > 0.99 && sepia < 0.02
      ? ""
      : `saturate(${sat.toFixed(3)}) blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(3)}) sepia(${sepia.toFixed(3)})`;
  const beat = (Math.sin(nowMs / 160) > 0.92 ? 1 : 0) * 0.5 + 0.5 * Math.max(0, Math.sin(nowMs / 430));
  const [v, r, c, h] = LB.el.children;
  v.style.background = `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${Math.min(0.85, 0.55 * F.hunger + 0.35 * F.sad + 0.3 * F.tired + 0.2 * F.thirst).toFixed(3)}) 100%)`;
  r.style.background = `radial-gradient(ellipse at center, transparent 50%, rgba(110,8,4,${(0.35 * F.sick * (0.55 + 0.45 * beat) + 0.12 * F.hunger * beat).toFixed(3)}) 100%)`;
  c.style.background = `radial-gradient(ellipse at center, transparent 35%, rgba(205,228,245,${(0.6 * F.cold).toFixed(3)}) 100%)`;
  h.style.background = `rgba(255,170,90,${(0.09 * F.hot).toFixed(3)})`;
  const any = F.hunger + F.sad + F.tired + F.sick + F.cold + F.hot > 0.03;
  LB.el.classList.toggle("on", any);
  // Heavy eyelids: blinks get slower and longer the more tired you are.
  if (!sleeping && F.tired > 0.3) {
    if (nowMs > LB.blinkEnd && nowMs > LB.blinkAt) {
      LB.blinkAt = nowMs + (7000 - 4500 * F.tired) * (0.7 + Math.random() * 0.6);
      LB.blinkEnd = LB.blinkAt + 220 + 700 * F.tired;
    }
    const shut = nowMs > LB.blinkAt && nowMs < LB.blinkEnd;
    LB.lids.className = shut ? "shut" : F.tired > 0.75 ? "half" : "";
  } else LB.lids.className = "";
  if (!sleeping) lbCheckLines();
}
if (typeof window !== "undefined" && typeof document !== "undefined") {
  setInterval(() => {
    try {
      lbTick();
    } catch (e) {}
  }, 120);
  // Body states no longer pile up as text at the bottom; only things outside you (a knock, the power) are written.
  if (typeof worldRenderHUD === "function") {
    const lbHud = worldRenderHUD;
    worldRenderHUD = function () {
      const r = lbHud.apply(this, arguments);
      if (G && phase === "playing" && W.enabled && !(typeof worldIsShopping === "function" && worldIsShopping())) {
        const el = document.getElementById("worldCondition");
        if (el) {
          const w = [];
          if (G.pendingKnock) w.push("门外有敲门声");
          if (!G.power) w.push("停电了");
          if (!G.waterOn) w.push("暂时停水");
          el.textContent = w.join(" · ");
        }
      }
      return r;
    };
  }
}
