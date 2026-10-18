/* 闭门365 · v0.16 sound. Real recorded sounds (all CC0: Kenney, rubberduck, OwlishMedia via OpenGameArt) and quiet
   CC0 piano music, embedded so the file still works offline. Footsteps on the floorboards, the tap, the kettle,
   the cistern, pages, the zip of a bag, rain on the sill, a clock in the room, the city far below. Music comes
   now and then like in a quiet film, and the radio plays its own tinny music when you listen to it.
   Settings (on/off and three volumes) live in the pause menu; sound is on by default and starts on first input. */
const AU = {
  ctx: null,
  buf: {},
  ready: false,
  loops: {},
  set: { on: true, music: 0.55, sfx: 0.85, amb: 0.6 },
  musicNode: null,
  musicNext: 0,
  stepAcc: 0,
  lastPos: null,
  busyKind: "",
  busyAt: 0,
  radio: null,
};
const AU_KEY = "closed365-audio-v1";
try {
  const s = JSON.parse(localStorage.getItem(AU_KEY) || "null");
  if (s && typeof s === "object") for (const k of Object.keys(AU.set)) if (typeof s[k] === typeof AU.set[k]) AU.set[k] = s[k];
} catch (e) {}
function auSave() {
  try {
    localStorage.setItem(AU_KEY, JSON.stringify(AU.set));
  } catch (e) {}
}
// soundOn is the old global switch the synthesized body sounds already check.
soundOn = AU.set.on;
function auUnlock() {
  if (AU.ctx || typeof AUDIO_DATA === "undefined") {
    if (AU.ctx && AU.ctx.state !== "running") AU.ctx.resume();
    return;
  }
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    return;
  }
  audioCtx = AU.ctx; // share with the older synthesized sounds
  const c = AU.ctx;
  AU.master = c.createGain();
  AU.master.connect(c.destination);
  for (const k of ["sfx", "music", "amb"]) {
    AU[k] = c.createGain();
    AU[k].connect(AU.master);
  }
  auApplyVolumes();
  const names = Object.keys(AUDIO_DATA);
  let left = names.length;
  for (const n of names) {
    const b64 = AUDIO_DATA[n],
      bin = atob(b64),
      arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    c.decodeAudioData(
      arr.buffer,
      (b) => {
        AU.buf[n] = b;
        if (--left === 0) AU.ready = true;
      },
      () => {
        if (--left === 0) AU.ready = true;
      },
    );
  }
}
function auApplyVolumes() {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime,
    on = AU.set.on ? 1 : 0;
  AU.master.gain.setTargetAtTime(on, t, 0.1);
  AU.sfx.gain.setTargetAtTime(AU.set.sfx, t, 0.1);
  AU.music.gain.setTargetAtTime(AU.set.music * 0.6, t, 0.3);
  AU.amb.gain.setTargetAtTime(AU.set.amb, t, 0.3);
}
for (const ev of ["pointerdown", "keydown", "touchstart"]) addEventListener(ev, auUnlock, { capture: true });
// One-shot sound. Small random pitch/volume changes stop repeated sounds from sounding mechanical.
function auPlay(name, vol = 1, opts = {}) {
  if (!AU.ctx || !AU.set.on) return null;
  const list = Array.isArray(name) ? name : [name],
    n = list[Math.floor(Math.random() * list.length)],
    b = AU.buf[n];
  if (!b) return null;
  const c = AU.ctx,
    src = c.createBufferSource(),
    g = c.createGain();
  src.buffer = b;
  src.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() - 0.5) * (opts.vary ?? 0.08));
  g.gain.value = vol * (1 + (Math.random() - 0.5) * 0.15);
  src.connect(g).connect(opts.bus || AU.sfx);
  src.start(c.currentTime + (opts.delay || 0));
  return src;
}
// Looped bed sound with a smoothly moving level (0 stops it after the fade).
function auLoop(name, level, bus = "amb", fade = 1.2) {
  if (!AU.ctx || !AU.buf[name]) return;
  let L = AU.loops[name];
  if (!L && level <= 0.001) return;
  if (!L) {
    const src = AU.ctx.createBufferSource(),
      g = AU.ctx.createGain();
    src.buffer = AU.buf[name];
    src.loop = true;
    g.gain.value = 0;
    src.connect(g).connect(AU[bus]);
    src.start();
    L = AU.loops[name] = { src, g, level: 0 };
  }
  if (Math.abs(L.level - level) > 0.002) {
    L.level = level;
    L.g.gain.setTargetAtTime(level, AU.ctx.currentTime, fade);
  }
}

/* ---------- Music: a piece now and then, chosen by place, hour and mood; silence in between ---------- */
const AU_TRACKS = {
  title: ["m_light"],
  shop: ["m_jrpg"],
  day: ["m_vaporware", "m_light", "m_nostalgia"],
  night: ["m_nostalgia", "m_sadness", "m_light"],
  low: ["m_sadness", "m_emotional"],
};
function auMusicTick(now) {
  if (!AU.ready || !AU.set.on || AU.set.music <= 0) return;
  if (AU.radio) return;
  const place = phase === "title" ? "title" : typeof worldIsShopping === "function" && worldIsShopping() ? "shop" : phase === "playing" ? "room" : "";
  if (!place) return;
  if (AU.musicPlace !== place) {
    AU.musicPlace = place;
    auStopMusic(2.5);
    AU.musicNext = now + (place === "room" ? 25000 : 1500);
  }
  if (AU.musicNode || now < AU.musicNext) return;
  let pool = AU_TRACKS[place === "room" ? "day" : place];
  if (place === "room" && G) {
    const h = (G.minute / 60) % 24;
    if (G.stats.morale < 35) pool = AU_TRACKS.low;
    else if (h >= 20 || h < 6) pool = AU_TRACKS.night;
  }
  const pick = pool.filter((t) => t !== AU.lastTrack),
    name = (pick.length ? pick : pool)[Math.floor(Math.random() * (pick.length || pool.length))],
    b = AU.buf[name];
  if (!b) return;
  const c = AU.ctx,
    src = c.createBufferSource(),
    g = c.createGain();
  src.buffer = b;
  // Short loops are played twice through so a piece has room to breathe.
  src.loop = b.duration < 40;
  g.gain.value = 0;
  g.gain.setTargetAtTime(1, c.currentTime, 2);
  src.connect(g).connect(AU.music);
  src.start();
  const len = src.loop ? b.duration * 2 : b.duration;
  if (src.loop) src.stop(c.currentTime + len + 0.05);
  src.onended = () => {
    if (AU.musicNode?.src === src) {
      AU.musicNode = null;
      AU.musicNext = performance.now() + (place === "room" ? 90000 + Math.random() * 150000 : 4000);
    }
  };
  AU.musicNode = { src, g };
  AU.lastTrack = name;
}
function auStopMusic(fade = 1.5) {
  const m = AU.musicNode;
  if (!m || !AU.ctx) return;
  AU.musicNode = null;
  m.g.gain.setTargetAtTime(0, AU.ctx.currentTime, fade / 3);
  try {
    m.src.stop(AU.ctx.currentTime + fade + 0.1);
  } catch (e) {}
}
// The radio: tinny band-limited music under a little static while you listen.
function auRadio(on) {
  if (!AU.ctx || !AU.ready) return;
  const c = AU.ctx;
  if (on && !AU.radio) {
    auStopMusic(0.8);
    const tracks = ["m_vaporware", "m_jrpg", "m_nostalgia"],
      b = AU.buf[tracks[Math.floor(Math.random() * tracks.length)]],
      src = c.createBufferSource(),
      hp = c.createBiquadFilter(),
      lp = c.createBiquadFilter(),
      g = c.createGain();
    src.buffer = b;
    src.loop = true;
    hp.type = "highpass";
    hp.frequency.value = 380;
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.75, c.currentTime, 0.4);
    src.connect(hp).connect(lp).connect(g).connect(AU.sfx);
    src.start(0, Math.random() * Math.max(1, b.duration - 5));
    AU.radio = { src, g };
    auLoop("radio_static", 0.12, "sfx", 0.3);
  } else if (!on && AU.radio) {
    const r = AU.radio;
    AU.radio = null;
    r.g.gain.setTargetAtTime(0, c.currentTime, 0.3);
    try {
      r.src.stop(c.currentTime + 1.5);
    } catch (e) {}
    auLoop("radio_static", 0, "sfx", 0.3);
    AU.musicNext = performance.now() + 60000;
  }
}

/* ---------- Actions: what you hear while doing things ---------- */
// [test on label/kind, sound at start, loop while busy, repeated sound [names, every ms], sound at the end]
const AU_ACTIONS = [
  [/^sleep$|睡/, "blanket", null, null, "yawn"],
  [/^eat$/, null, null, [["bite", "bite2"], 1500], "gulp"],
  [/^read$|翻过几页|读/, "bookopen", null, [["page", "page2"], 2200], "bookclose"],
  [/shower|洗澡|淋浴/, "tap", "shower", null, null],
  [/^clean$|打扫|扫地|拖地|擦/, "sweep", null, [["sweep", "cloth"], 1100], null],
  [/dishes|洗碗/, "tap", null, [["dishes", "dishes2"], 1000], null],
  [/laundry|洗衣/, "splash", "shower", null, null],
  [/^fill$|接满|储水/, "tap", null, null, null],
  [/pee|poop|toilet|厕所|小便|大便/, null, null, null, "flush"],
  [/煮|烹|做饭|cook/, "pot", "boil", null, "pot2"],
  [/冲泡|烧水|kettle/, "kettle", null, null, null],
  [/exercise|锻炼|伸展|运动/, "breath", null, [["breath"], 3000], null],
  [/nails|hair|指甲|头发|剪/, "snip", null, [["snip"], 700], null],
  [/repair|seal|bleed|修|胶带|放气/, "tools", null, [["tools", "tools2"], 1400], null],
  [/信|letter/, "letter", null, null, "paper"],
  [/种下|浇水|waterplant|收[^音]|拔掉/, "spray", null, null, null],
  [/拆|打开.*袋|袋/, "zip", null, null, null],
  [/change|换衣|衣服/, "cloth", null, null, "cloth"],
  [/trash|丢弃|垃圾/, "crumple", null, null, null],
  [/radio|广播|收听/, "switch", null, null, "switch2"],
  [/teeth|刷牙|hands|洗手|洗脸/, "tap", null, null, null],
  [/写|notebook|回忆录/, "pencil", null, [["pencil"], 2600], null],
  [/折|纸鹤|origami/, "paper", null, [["paper", "crumple"], 1800], null],
  [/candle|蜡烛/, "switch", null, null, null],
  [/窗|看看|往外看/, "cloth", null, null, null],
  [/^drink$|喝/, "sip", null, null, null],
  [/结账|收银/, "coins", null, null, "bell"],
];
function auActionFor(label, kind) {
  for (const row of AU_ACTIONS) if (row[0].test(kind) || row[0].test(label)) return row;
  return null;
}
if (typeof worldStart === "function") {
  const auStart = worldStart;
  worldStart = function (label, seconds, commit, kind = "use", preview = "") {
    const ok = auStart(label, seconds, commit, kind, preview);
    if (ok && W.busy) {
      const row = auActionFor(String(label), String(kind));
      W.busy.au = row;
      W.busy.auNext = performance.now() + 600;
      if (row?.[1]) auPlay(row[1], 0.9);
      if (row?.[2]) auLoop(row[2], 0.55, "sfx", 0.25);
      if (/radio|广播|收听/.test(label + kind)) auRadio(true);
    }
    return ok;
  };
  const auFinish = worldFinishAction;
  worldFinishAction = function () {
    const a = W.busy,
      row = a?.au;
    const before = G ? auSnapshot() : null;
    const r = auFinish.apply(this, arguments);
    if (row?.[2]) auLoop(row[2], 0, "sfx", 0.3);
    if (row?.[4]) auPlay(row[4], 0.9);
    if (a && /radio|广播|收听/.test(a.label + a.kind)) setTimeout(() => auRadio(false), 9000);
    if (before && G) auFeedback(before, auSnapshot(), a);
    return r;
  };
  const auCancel = worldCancelAction;
  worldCancelAction = function () {
    const row = W.busy?.au;
    if (row?.[2]) auLoop(row[2], 0, "sfx", 0.2);
    auRadio(false);
    return auCancel.apply(this, arguments);
  };
}
// The old beeps become real sounds, chosen by what the call meant.
if (typeof worldSfx === "function") {
  worldSfx = function (freq = 400, length = 0.05) {
    const id = typeof targetId !== "undefined" ? targetId : "";
    if (freq === 500) return auPlay(["pick", "pick2"], 0.8);
    if (freq === 300) return auPlay(["place", "place2"], 0.8);
    if (freq === 750) return auPlay(["bite", "bite2"], 1);
    if (freq === 210) return auPlay(id === "fridge" ? "fridge_open" : "door_open", 0.7);
    if (freq === 180) return auPlay(id === "fridge" ? "fridge_close" : "door_close", 0.7);
    if (freq === 390) return auPlay(["page", "page2"], 0.8);
    if (freq === 650) return auPlay(["place2", "can"], 0.8);
    if (freq === 380 && length < 0.08) return auPlay(["pick", "pick2"], 0.7);
    if (freq === 380) return auPlay("cloth", 0.8);
    return auPlay("click", 0.5);
  };
}
// Knocks, thunder and other things that happen to you are heard, not only read.
if (typeof logEvent === "function") {
  const auLog = logEvent;
  logEvent = function (text, type) {
    const r = auLog.apply(this, arguments);
    try {
      if (!AU.ctx) return r;
      const t = String(text);
      if (/门外响起敲门声|有人敲门。|门外有人敲门/.test(t)) [0, 0.28, 0.56].forEach((d) => auPlay("knock", 1.1, { delay: d, vary: 0.04 }));
      else if (/有人敲隔壁的门/.test(t)) [0, 0.3, 0.6, 1.6, 1.9, 2.2].forEach((d) => auPlay("knock", 0.35, { delay: d, vary: 0.04 }));
      else if (/三下很轻的敲击声/.test(t)) [0, 0.4, 0.8, 2.6, 3.0, 3.4].forEach((d) => auPlay("knock", 0.22, { delay: d, rate: 1.3, vary: 0.04 }));
      else if (/雷声/.test(t)) auPlay("thunder", 0.9);
      else if (/停电/.test(t)) auPlay("switch2", 0.8);
      else if (/恢复/.test(t)) auPlay("switch", 0.6);
      else if (/目标完成|达成|完成了第|写完了第/.test(t)) auPlay("confirm", 0.7);
    } catch (e) {}
    return r;
  };
}

/* ---------- Clear feedback after every action: what changed, in plain words ---------- */
const AU_STATS = [
  ["food", "饱腹"],
  ["water", "水分"],
  ["energy", "体力"],
  ["morale", "心情"],
  ["hygiene", "清洁"],
  ["health", "健康"],
];
function auSnapshot() {
  const s = G.stats;
  return { food: s.food, water: s.water, energy: s.energy, morale: s.morale, hygiene: s.hygiene, health: s.health, bladder: G.bladder, bowel: G.bowel, dirt: G.dirt, minute: G.minute, tank: G.tank || 0 };
}
function auChips() {
  let el = document.getElementById("auChips");
  if (!el) {
    const st = document.createElement("style");
    st.textContent = `#auChips{position:fixed;left:50%;bottom:31%;transform:translate(-50%,10px);display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:92vw;pointer-events:none;z-index:9;opacity:0;transition:opacity .4s,transform .4s}
#auChips.on{opacity:1;transform:translate(-50%,0)}
#auChips b{font:600 19px/1 'Noto Sans CJK SC','PingFang SC',sans-serif;letter-spacing:.04em;padding:9px 14px 10px;border-radius:999px;background:rgba(18,16,13,.72);color:#f3ead8;box-shadow:0 2px 14px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12)}
#auChips b.up{color:#bfe3a8}#auChips b.down{color:#f0b09a}#auChips b.time{color:#d9c9a6;font-weight:500}`;
    document.head.appendChild(st);
    el = document.createElement("div");
    el.id = "auChips";
    document.body.appendChild(el);
  }
  return el;
}
function auFeedback(a, b, act) {
  const out = [],
    mins0 = b.minute - a.minute,
    // Small drifts from time passing are noise; show what the action itself changed.
    min = mins0 >= 240 ? 4 : mins0 >= 60 ? 3 : 2;
  for (const [k, name] of AU_STATS) {
    const d = Math.round(b[k] - a[k]);
    if (Math.abs(d) >= min) out.push([d > 0 ? "up" : "down", `${name} ${d > 0 ? "+" : "−"}${Math.abs(d)}`]);
  }
  if (b.bladder < a.bladder - 10) out.push(["up", "小便 解决了"]);
  if (b.bowel < a.bowel - 10) out.push(["up", "大便 解决了"]);
  if (b.dirt < a.dirt - 3) out.push(["up", `屋子 干净了${Math.round(a.dirt - b.dirt)}`]);
  if (b.tank > a.tank + 0.4) out.push(["up", `储水 +${(b.tank - a.tank).toFixed(1)}升`]);
  const mins = Math.round(b.minute - a.minute);
  if (mins >= 5) out.push(["time", mins >= 60 ? `过了 ${Math.floor(mins / 60)}小时${mins % 60 ? (mins % 60) + "分" : ""}` : `过了 ${mins}分钟`]);
  if (!out.length) return;
  const el = auChips();
  el.innerHTML = out.map(([c, t]) => `<b class="${c}">${t}</b>`).join("");
  el.classList.add("on");
  clearTimeout(AU.chipT);
  AU.chipT = setTimeout(() => el.classList.remove("on"), 4200);
  if (out.some((o) => o[0] === "up")) auPlay("select", 0.35);
}

/* ---------- Every frame: footsteps, room tone, rain, the busy-action rhythm, music ---------- */
function auFrame(now) {
  if (!AU.ready) return;
  const playing = typeof phase !== "undefined" && phase === "playing" && G && !G.ended,
    shopping = typeof worldIsShopping === "function" && worldIsShopping(),
    paused_ = typeof paused !== "undefined" && paused;
  // Footsteps: one step every ~0.62 m walked; floorboards at home, hard floor in the shop.
  if (typeof camera !== "undefined" && camera && (playing || shopping) && !paused_) {
    const p = camera.position;
    if (AU.lastPos) {
      const d = Math.hypot(p.x - AU.lastPos.x, p.z - AU.lastPos.z);
      if (d < 0.5) AU.stepAcc += d;
      if (AU.stepAcc > 0.62) {
        AU.stepAcc = 0;
        auPlay(shopping ? ["step_hard1", "step_hard2", "step_hard3"] : ["step_wood1", "step_wood2", "step_wood3", "step_wood4"], 0.55, { vary: 0.12 });
      }
    }
    AU.lastPos = { x: p.x, z: p.z };
  }
  // Rhythm sounds while busy (bites, page turns, scrubbing).
  const busy = typeof W !== "undefined" && W.busy;
  if (busy?.au?.[3] && now > busy.auNext) {
    busy.auNext = now + busy.au[3][1] * (0.8 + Math.random() * 0.4);
    auPlay(busy.au[3][0], 0.75);
  }
  // Room tone: a clock, the city through the glass, rain when it rains. Quieter with the curtains drawn.
  const inRoom = playing && !shopping && !paused_;
  const pr = inRoom && typeof lrPrecip === "function" ? lrPrecip() : null,
    curtain = G?.curtains ? 0.6 : 1,
    h = G ? (G.minute / 60) % 24 : 12,
    cityLevel = h >= 6 && h < 23 ? 0.16 : 0.06;
  auLoop("clock", inRoom ? 0.32 : 0);
  auLoop("city", inRoom ? cityLevel * curtain * (pr ? 0.5 : 1) : 0, "amb", 2);
  auLoop("rain", pr === "rain" ? 0.55 * curtain : 0, "amb", 2.5);
  auMusicTick(now);
}
if (typeof worldFrame === "function") {
  const auPrevFrame = worldFrame;
  worldFrame = function (now, dt) {
    auPrevFrame(now, dt);
    try {
      auFrame(now);
    } catch (e) {}
  };
}
// The title screen has its own frame loop path; keep the music going there too.
setInterval(() => {
  try {
    if (typeof phase !== "undefined" && phase === "title") auMusicTick(performance.now());
    // The cough when ill and the yawn when exhausted, now and then.
    if (AU.ready && G && phase === "playing" && !G.ended && typeof LB !== "undefined" && !(W.busy?.kind === "sleep")) {
      const now = performance.now();
      if ((LB.fx.sick || 0) > 0.4 && now > (AU.coughAt || 0)) {
        if (AU.coughAt) auPlay("cough", 0.6);
        AU.coughAt = now + 45000 + Math.random() * 60000;
      }
      if ((LB.fx.tired || 0) > 0.5 && now > (AU.yawnAt || 0)) {
        if (AU.yawnAt) auPlay("yawn", 0.55);
        AU.yawnAt = now + 70000 + Math.random() * 80000;
      }
    }
  } catch (e) {}
}, 1000);
// The old synthesized rain bed is replaced by the recorded rain.
if (typeof lbRainSound === "function") lbRainSound = function () {};

/* ---------- Pause-menu settings: on/off and three sliders ---------- */
toggleAudio = function () {
  auUnlock();
  AU.set.on = !AU.set.on;
  soundOn = AU.set.on;
  auSave();
  auApplyVolumes();
  if (!AU.set.on) auStopMusic(0.5);
  const b = document.getElementById("soundToggle");
  if (b) b.textContent = AU.set.on ? "关闭声音" : "开启声音";
};
function auSettingsHTML() {
  const row = (k, t) => `<label class="au-row"><span>${t}</span><input type="range" min="0" max="100" value="${Math.round(AU.set[k] * 100)}" data-au="${k}"></label>`;
  return `<div class="au-box">${row("music", "音乐")}${row("sfx", "音效")}${row("amb", "环境声（钟、街道、雨）")}</div>`;
}
(function auSettingsUI() {
  const st = document.createElement("style");
  st.textContent = `.au-box{display:grid;gap:10px;margin:6px 0 14px}.au-row{display:grid;grid-template-columns:150px 1fr;align-items:center;gap:12px;font-size:16px;color:inherit}.au-row input{width:100%;accent-color:#c9a86a}`;
  document.head.appendChild(st);
  document.addEventListener("input", (e) => {
    const k = e.target?.dataset?.au;
    if (!k) return;
    AU.set[k] = Math.max(0, Math.min(1, e.target.value / 100));
    auSave();
    auApplyVolumes();
  });
  // Insert the sliders wherever the sound toggle appears (pause menu / settings panel).
  new MutationObserver(() => {
    const b = document.getElementById("soundToggle");
    if (b && !b.dataset.auDone) {
      b.dataset.auDone = "1";
      b.textContent = AU.set.on ? "关闭声音" : "开启声音";
      const row = b.closest(".settings-row");
      if (row) {
        const span = row.querySelector("span");
        if (span) span.textContent = "声音：真实录音音效、环境声与钢琴配乐 · 默认开启";
        row.insertAdjacentHTML("afterend", auSettingsHTML());
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
