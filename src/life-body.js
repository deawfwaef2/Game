/* 闭门365 · v0.13–0.14 the body speaks for itself. No meters on screen: when hunger, thirst, tiredness, low spirits,
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
// When a felt state goes away because you looked after yourself, you notice that too (once).
const LB_RELIEF = {
  food: [45, "胃里暖起来了，手也不抖了。"],
  water: [45, "一口水下去，整个人活过来了。"],
  energy: [45, "睡足了，脑子清楚多了。"],
  morale: [50, "心里松快了一点。"],
  health: [65, "身上轻松了，病好像过去了。"],
  hygiene: [60, "洗干净了，浑身清爽。"],
  bladder: [30, "舒服了。"],
  bowel: [30, "舒服了。"],
  dirt: [25, "屋里收拾干净了，看着舒心。"],
  hair: [8, "头发短了，脖子后面凉飕飕的。"],
  nails: [1, "指甲剪干净了。"],
  cold: [15, "暖和过来了。"],
  hot: [27, "总算凉快下来了。"],
};
// Passing thoughts when nothing is pressing: a few per day at most, never the same one twice in a life.
const LB_THOUGHTS = {
  rain: ["小时候下雨，妈会把盆放在漏雨的地方，叮叮咚咚响一夜。", "雨天没人会在街上多待。今天大概是安全的。", "小禾最喜欢踩水坑，鞋子湿透了也不肯回家。", "雨声把楼里别的声音都盖住了，难得的安静。"],
  snow: ["爸以前会在楼下扫出一条路，一直扫到菜站门口。", "下雪的时候，城里的声音都变轻了。", "小禾说过，雪是天上有人在撕信纸。"],
  night: ["对面那扇亮着的窗，不知道住的是什么人。", "睡不着的时候，就数楼下电车经过的次数。", "夜里最难熬。白天总有事做。", "有时候会想，如果那天没有走进那扇门。"],
  morning: ["早上的光是最好的。在这里，光是免费的。", "又熬过了一夜。", "妈这时候应该在生炉子了。"],
  evening: ["这个时候，家里该开饭了。爸总是最后一个坐下。", "天黑以前是一天里最长的一段。"],
  any: [
    "爸的手很大，全是裂口。他从来不说疼。",
    "小禾的自行车链子总掉，每次都是我给她装上。",
    "我欠下的东西，迟早要还。只是不能是现在。",
    "这屋子的前一个主人，是不是也在这里数过日子？",
    "{gang}的人记性很好。我得比他们更有耐心。",
    "{boss}说过，没有人能躲一年。我偏要试试。",
    "要是能重来，我会在那天早上转身回家。",
    "以后出去了，第一件事是去吃一碗热汤面。",
    "人在一个地方待久了，会认得每一道墙缝。",
    "我学会了慢慢吃东西。以前从来没注意过米是甜的。",
    "妈的厨房总是有一股葱油味。",
    "有一阵子没听见自己说话了。",
    "把日子过成一样的，反而过得快一些。",
    "不知道外面的人是不是已经把我忘了。忘了也好。",
    "我怕的不是敲门声，是敲门以后的安静。",
  ],
};
const LB = { fx: {}, last: {}, thoughtAt: 0, sayAt: 0, glowT: 0, precip: null, precipK: 0, growlAt: 0, heartAt: 0, el: null, lids: null, line: null, lineT: 0, blinkAt: 0, blinkEnd: 0 };
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
#bodyLine.on{opacity:.95;transform:translate(-50%,0)}#bodyLine.soft.on{opacity:.72;font-size:16px}
#bodyFx i.g{background:radial-gradient(ellipse at center,rgba(255,226,170,.16),rgba(255,214,150,.05) 60%,transparent 85%);opacity:0}`;
  document.head.appendChild(st);
  LB.el = document.createElement("div");
  LB.el.id = "bodyFx";
  LB.el.innerHTML = "<i class='v'></i><i class='r'></i><i class='c'></i><i class='h'></i><i class='g'></i>";
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
function lbSay(text, soft = false) {
  if (!LB.line) return;
  LB.line.textContent = text;
  LB.line.classList.toggle("soft", soft);
  LB.line.classList.add("on");
  if (G) LB.sayAt = G.minute;
  clearTimeout(LB.lineT);
  LB.lineT = setTimeout(() => LB.line.classList.remove("on"), 4200);
}
// One line when a threshold is first crossed (or deepened); repeats only after 3 game hours.
// Relief is said once when the need is properly met; small wobbles around a threshold say nothing.
function lbCheckLines() {
  const s = G.stats,
    now = G.minute,
    cand = [],
    relief = [];
  const push = (key, level, text) => {
    const prev = LB.last[key];
    if (!prev || level > prev.level || now - prev.at > 180) cand.push([key, level, text]);
  };
  const settle = (key, value, low) => {
    if (!LB.last[key]) return;
    const [lim, text] = LB_RELIEF[key];
    if (low ? value >= lim : value <= lim) {
      if (now - LB.last[key].at < 1440 * 2) relief.push([key, text]);
      delete LB.last[key];
    }
  };
  for (const [k, steps] of Object.entries(LB_LINES)) {
    let lv = 0,
      txt = "";
    steps.forEach(([th, line], i) => {
      if (s[k] < th) (lv = i + 1), (txt = line);
    });
    if (lv) push(k, lv, txt);
    else settle(k, s[k], true);
  }
  for (const [k, steps] of Object.entries(LB_HIGH)) {
    let lv = 0,
      txt = "";
    steps.forEach(([th, line], i) => {
      if ((G[k] || 0) > th) (lv = i + 1), (txt = line);
    });
    if (lv) push(k, lv, txt);
    else settle(k, G[k] || 0, false);
  }
  const t = temperature();
  if (t < 12) push("cold", 1, "冷得直搓手。");
  else settle("cold", t, true);
  if (t > 29) push("hot", 1, "闷热得喘不过气。");
  else settle("hot", t, false);
  // The weather starting, seen or heard from inside.
  const pr = typeof lrPrecip === "function" ? lrPrecip() : null;
  if (pr && LB.precip !== pr) cand.push(["sky", 0.5, pr === "snow" ? "窗外飘起了雪。" : "下雨了。雨点打在窗台的铁皮上。"]);
  LB.precip = pr;
  if (LB.line && LB.line.classList.contains("on")) return;
  if (cand.length) {
    cand.sort((a, b) => b[1] - a[1]);
    const [key, level, text] = cand[0];
    if (key !== "sky") LB.last[key] = { level, at: now };
    if (key === "food") LB.growlNow = true;
    if (key === "health") LB.heartNow = true;
    lbSay(text);
    return;
  }
  if (relief.length) {
    lbSay(relief[0][1]);
    lbGlow();
    return;
  }
  lbThought();
}
function lbGlow() {
  const g = LB.el?.children[4];
  if (!g) return;
  g.style.transition = "none";
  g.style.opacity = "1";
  void g.offsetWidth;
  g.style.transition = "opacity 3.5s ease-out";
  g.style.opacity = "0";
}
function lbThought() {
  const now = G.minute,
    h = hour();
  if (now - LB.sayAt < 300 || now - LB.thoughtAt < 420 || day() < 2 || Math.random() > 0.02) return;
  if (G.pendingKnock || Object.keys(LB.last).length) return;
  lifeEnsure();
  const used = (G.life.thoughts = Array.isArray(G.life.thoughts) ? G.life.thoughts : []);
  const pr = typeof lrPrecip === "function" ? lrPrecip() : null,
    pools = [pr, h < 5 || h >= 22 ? "night" : h < 9 ? "morning" : h >= 17 ? "evening" : null, "any"].filter(Boolean);
  for (const pool of pools) {
    const left = LB_THOUGHTS[pool].map((t, i) => pool + i).filter((k) => !used.includes(k));
    if (!left.length) continue;
    const key = left[Math.floor(Math.random() * left.length)],
      gang = typeof LM !== "undefined" && LM.gang ? LM.gang : { g: "他们", b: "那个人" };
    used.push(key);
    LB.thoughtAt = now;
    lbSay(LB_THOUGHTS[pool][+key.slice(pool.length)].replace("{gang}", gang.g).replace("{boss}", gang.b), true);
    return;
  }
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
  LB.el.classList.add("on");
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

/* ---------- v0.14: the body moves, makes sounds, and the weather is really out there ---------- */
// Small, slow camera motion done on the canvas so it never touches the controls: shivering in waves when
// cold, a slow sway when exhausted or ill, a faint tremble when very hungry. Nothing when you are fine.
function lbMotion(now) {
  const canvas = typeof renderer !== "undefined" && renderer?.domElement;
  if (!canvas) return;
  const F = LB.fx;
  let x = 0,
    y = 0,
    rot = 0;
  if (lbActive() && !(G.activity === "sleep" || W.busy?.kind === "sleep")) {
    const cold = Math.max(0, (F.cold || 0) - 0.3) / 0.7,
      wave = Math.pow(Math.max(0, Math.sin(now / 1900)), 3);
    if (cold > 0) {
      x += Math.sin(now / 23) * 1.4 * cold * wave;
      y += Math.sin(now / 31 + 1) * 0.9 * cold * wave;
    }
    const sway = Math.max(0, (F.tired || 0) - 0.5) * 2 + Math.max(0, (F.sick || 0) - 0.5) * 1.6;
    if (sway > 0) {
      rot += Math.sin(now / 2600) * 0.55 * Math.min(1.2, sway);
      y += Math.sin(now / 3300) * 3.5 * Math.min(1.2, sway);
      x += Math.sin(now / 4100) * 2.5 * Math.min(1.2, sway);
    }
    const shake = Math.max(0, (F.hunger || 0) - 0.65) / 0.35;
    if (shake > 0) x += Math.sin(now / 17) * 0.7 * shake * Math.pow(Math.max(0, Math.sin(now / 2700)), 4);
  }
  const tf = Math.abs(x) + Math.abs(y) + Math.abs(rot) < 0.02 ? "" : `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(1.03)`;
  if (canvas.style.transform !== tf) canvas.style.transform = tf;
}
// Quiet synthesized body sounds, only if sound is switched on in the pause menu.
function lbAudio() {
  if (typeof soundOn === "undefined" || !soundOn) return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.state === "running" ? audioCtx : null;
  } catch {
    return null;
  }
}
function lbNoise(ctx, seconds) {
  if (LB.noise?.duration >= seconds) return LB.noise;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate),
    d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return (LB.noise = b);
}
function lbGrowl() {
  const ctx = lbAudio();
  if (!ctx) return;
  const src = ctx.createBufferSource(),
    lp = ctx.createBiquadFilter(),
    g = ctx.createGain(),
    lfo = ctx.createOscillator(),
    lg = ctx.createGain(),
    t = ctx.currentTime;
  src.buffer = lbNoise(ctx, 4);
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(140, t);
  lp.frequency.linearRampToValueAtTime(260, t + 0.7);
  lp.frequency.linearRampToValueAtTime(110, t + 1.5);
  lp.Q.value = 6;
  lfo.frequency.value = 11;
  lg.gain.value = 0.05;
  lfo.connect(lg).connect(g.gain);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.25);
  g.gain.linearRampToValueAtTime(0.0, t + 1.6);
  src.connect(lp).connect(g).connect(ctx.destination);
  src.start(t);
  lfo.start(t);
  src.stop(t + 1.7);
  lfo.stop(t + 1.7);
}
function lbHeartbeat(beats = 5) {
  const ctx = lbAudio();
  if (!ctx) return;
  for (let i = 0; i < beats; i++)
    for (const [off, amp] of [[0, 0.16], [0.17, 0.1]]) {
      const t = ctx.currentTime + i * 0.86 + off,
        o = ctx.createOscillator(),
        g = ctx.createGain();
      o.frequency.setValueAtTime(62, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.2);
    }
}
// Rain on the sill: looped brown noise through a band-pass, fading with the rain.
function lbRainSound(k) {
  const ctx = lbAudio();
  if (!ctx) {
    if (LB.rain) LB.rain.g.gain.value = 0;
    return;
  }
  if (!LB.rain) {
    const src = ctx.createBufferSource(),
      bp = ctx.createBiquadFilter(),
      g = ctx.createGain();
    src.buffer = lbNoise(ctx, 4);
    src.loop = true;
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.4;
    g.gain.value = 0;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
    LB.rain = { g };
  }
  LB.rain.g.gain.setTargetAtTime(0.05 * k, ctx.currentTime, 0.8);
}
function lbBodySounds() {
  const F = LB.fx,
    now = performance.now();
  if (!lbActive() || G.activity === "sleep") return;
  const hungry = (F.hunger || 0) > 0.3,
    sick = (F.sick || 0) > 0.45;
  if (LB.growlNow || (hungry && LB.growlAt && now > LB.growlAt)) {
    lbGrowl();
    LB.growlNow = false;
    LB.growlAt = now + 60000 + Math.random() * 90000 - 40000 * (F.hunger || 0);
  } else if (!hungry) LB.growlAt = 0;
  else if (!LB.growlAt) LB.growlAt = now + 30000;
  if ((LB.heartNow && sick) || (sick && LB.heartAt && now > LB.heartAt)) {
    lbHeartbeat(4 + Math.round(3 * F.sick));
    LB.heartNow = false;
    LB.heartAt = now + 40000 + Math.random() * 40000;
  } else if (!sick) LB.heartAt = 0;
  else if (!LB.heartAt) LB.heartAt = now + 8000;
}
// Rain streaks and snowflakes in the air outside the window, drawn on the GPU (no per-frame CPU work).
function lbPrecipMesh(kind) {
  const snow = kind === "snow",
    n = snow ? 2600 : 3200,
    verts = snow ? 1 : 2,
    rand = new Float32Array(n * verts * 3),
    end = new Float32Array(n * verts);
  for (let i = 0; i < n; i++) {
    const a = [Math.random(), Math.random(), Math.random()];
    for (let v = 0; v < verts; v++) {
      rand.set(a, (i * verts + v) * 3);
      end[i * verts + v] = v;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * verts * 3), 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
  geo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: snow ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uK: { value: 0 }, uLight: { value: 1 } },
    vertexShader: `uniform float uTime; attribute vec3 aRand; attribute float aEnd; varying float vA;
      void main(){
        vec3 box = vec3(11.0, 9.0, 13.0);
        float speed = ${snow ? "0.75" : "8.5"} * (0.8 + 0.4 * fract(aRand.x * 13.7));
        float y = mod(aRand.y * box.y - uTime * speed, box.y) - box.y * 0.5;
        float z = -0.5 - aRand.z * box.z;
        float x = (aRand.x - 0.5) * box.x * (0.55 - z * 0.06);
        ${snow ? "x += sin(uTime * 0.7 + aRand.y * 40.0) * 0.35; z += cos(uTime * 0.5 + aRand.x * 30.0) * 0.2;" : "x -= y * 0.1; y += aEnd * (0.3 + 0.2 * aRand.z); x -= aEnd * 0.035;"}
        vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
        vA = smoothstep(14.0, 2.0, -mv.z) * smoothstep(0.4, 1.4, -mv.z);
        ${snow ? "gl_PointSize = clamp(70.0 * (0.5 + aRand.z * 0.9) / -mv.z, 1.5, 10.0);" : ""}
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uK; uniform float uLight; varying float vA;
      void main(){
        ${snow ? "vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.22, length(c)); vec3 col = vec3(0.72,0.74,0.77);" : "float a = 1.0; vec3 col = vec3(0.66,0.69,0.74);"}
        gl_FragColor = vec4(col * uLight, a * vA * uK * ${snow ? "1.0" : "0.75"});
      }`,
  });
  const obj = snow ? new THREE.Points(geo, mat) : new THREE.LineSegments(geo, mat);
  obj.frustumCulled = false;
  obj.renderOrder = 0;
  obj.userData.noAO = true;
  obj.userData.precip = kind;
  obj.raycast = () => {};
  return obj;
}
// Raindrops and runnels on the outer pane while it rains (static: drops sit, a few have run down).
function lbWetGlass() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 560;
  const x = c.getContext("2d");
  for (let i = 0; i < 34; i++) {
    let px = Math.random() * c.width,
      py = Math.random() * c.height * 0.5;
    x.strokeStyle = "rgba(225,232,240,0.22)";
    x.lineWidth = 1 + Math.random() * 1.5;
    x.beginPath();
    x.moveTo(px, py);
    const len = 80 + Math.random() * 300;
    for (let k = 0; k < len; k += 6) x.lineTo((px += (Math.random() - 0.5) * 2.2), (py += 6));
    x.stroke();
  }
  for (let i = 0; i < 900; i++) {
    const px = Math.random() * c.width,
      py = Math.random() * c.height,
      r = 0.8 + Math.pow(Math.random(), 3) * 4.5;
    const g = x.createRadialGradient(px, py - r * 0.3, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,0.32)");
    g.addColorStop(0.6, "rgba(190,198,208,0.18)");
    g.addColorStop(1, "rgba(40,46,54,0.38)");
    x.fillStyle = g;
    x.beginPath();
    x.ellipse(px, py, r, r * (1 + Math.random() * 0.25), 0, 0, Math.PI * 2);
    x.fill();
    if (r > 2) {
      x.fillStyle = "rgba(255,255,255,0.6)";
      x.fillRect(px - r * 0.35, py - r * 0.5, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(2.62, 1.43),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }),
  );
  m.userData.noAO = true;
  m.raycast = () => {};
  m.renderOrder = 0;
  return m;
}
// Snow drifted against the foot of the outer panes after it has snowed, until a thaw.
function lbSnowCover(dt) {
  const hr = Math.floor(G.minute / 60);
  if (LB.coverHr !== hr) {
    LB.coverHr = hr;
    let recent = false;
    for (let k = 0; k <= 36 && !recent; k += 2) recent = lrPrecip(G.minute - k * 60) === "snow";
    LB.coverT = recent && lrOutdoor(day()) < 3 ? 1 : 0;
  }
  LB.coverK = (LB.coverK ?? LB.coverT) + (LB.coverT - (LB.coverK ?? LB.coverT)) * Math.min(1, dt * 0.01);
  let c = LB.cover;
  if (!c || c.parent !== roomRoot) {
    if (!c) {
      const geo = new ROOM_TOOLS.RoundedBoxGeometry(2.52, 0.08, 0.06, 3, 0.028);
      c = LB.cover = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#eef1f4", emissive: "#cdd5dc", roughness: 0.95, metalness: 0, envMapIntensity: 0.3 }));
      c.userData.noAO = true;
      c.raycast = () => {};
    }
    c.position.set(0, 1.1, -env.d / 2 - 0.25);
    roomRoot.add(c);
  }
  c.visible = LB.coverK > 0.03;
  c.scale.y = Math.max(0.05, LB.coverK);
  c.position.y = 1.07 + 0.04 * LB.coverK;
  c.material.emissiveIntensity = 0.12 + 0.45 * (LQ?.sky?.light ?? 1);
}
function lbWeather(now, dt) {
  if (typeof roomRoot === "undefined" || !roomRoot || !G || phase !== "playing" || W.store || typeof lrPrecip !== "function") return;
  lbSnowCover(dt);
  const pr = lrPrecip();
  LB.precipK += ((pr ? 1 : 0) - LB.precipK) * Math.min(1, dt * 0.25);
  if (pr) LB.kind = pr;
  let m = LB.mesh;
  if (LB.precipK < 0.01 && !pr) {
    if (m) m.visible = false;
    if (LB.wet) LB.wet.visible = false;
    lbRainSound(0);
    return;
  }
  if (!m || m.userData.precip !== LB.kind || m.parent !== roomRoot) {
    if (m) {
      m.parent?.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
    m = LB.mesh = lbPrecipMesh(LB.kind);
    m.position.set(0, 1.72, -env.d / 2);
    roomRoot.add(m);
  }
  m.visible = true;
  if (!LB.wet || LB.wet.parent !== roomRoot) {
    LB.wet = LB.wet || lbWetGlass();
    LB.wet.position.set(0, 1.72, -env.d / 2 - 0.235);
    roomRoot.add(LB.wet);
  }
  // Drops gather on the pane while it rains and dry off slowly afterwards.
  LB.wetK = (LB.wetK || 0) + ((LB.kind === "rain" && pr ? 1 : 0) - (LB.wetK || 0)) * Math.min(1, dt * (pr ? 0.08 : 0.01));
  LB.wet.visible = LB.wetK > 0.01;
  LB.wet.material.opacity = 0.85 * LB.wetK * (0.45 + 0.55 * (LQ?.sky?.light ?? 1));
  m.material.uniforms.uTime.value = now / 1000;
  m.material.uniforms.uK.value = LB.precipK;
  const light = LQ?.sky?.light ?? 1;
  m.material.uniforms.uLight.value = (LB.kind === "snow" ? 0.55 : 0.28) + (LB.kind === "snow" ? 0.45 : 0.72) * light;
  lbRainSound(LB.kind === "rain" && lbActive() ? LB.precipK * (G.curtains ? 0.7 : 1) : 0);
}
if (typeof window !== "undefined" && typeof worldFrame === "function") {
  const lbFrame = worldFrame;
  worldFrame = function (now, dt) {
    lbFrame(now, dt);
    try {
      lbWeather(now, dt);
      lbMotion(now);
    } catch (e) {}
  };
  setInterval(() => {
    try {
      if (G) lbBodySounds();
    } catch (e) {}
  }, 1000);
}
