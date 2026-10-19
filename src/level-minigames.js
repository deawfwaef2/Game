/* Offline, chapter-only skill games. The room's actual trigger remains hidden: this layer
   checks hand-skill, while lvTryAt still independently checks the secret chapter window. */
let lvMiniState = null;
let lvMiniRoot = null;
let lvMiniFrameId = 0;
const LV_MINI_CSS = `
.lv-mini-overlay{position:fixed;inset:0;z-index:1505;display:grid;place-items:center;padding:clamp(12px,3vw,38px);background:#050909d9;backdrop-filter:blur(12px);color:#efe9d8}
.lv-mini-overlay[hidden]{display:none!important}
.lv-mini-backdrop{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.lv-mini-backdrop img{width:100%;height:100%;object-fit:cover;filter:blur(5px) brightness(.29) saturate(.62);transform:scale(1.04)}
.lv-mini-backdrop:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0b100fe8,#111813bb 50%,#080d0dd9),linear-gradient(0deg,#080c0bf2,transparent 70%)}
.lv-mini-panel{position:relative;isolation:isolate;width:min(940px,100%);max-height:min(92dvh,900px);overflow:auto;border:1px solid #c0a97666;background:linear-gradient(145deg,#1c241fef,#101614f5);box-shadow:0 35px 120px #000b;padding:clamp(20px,4vw,46px);font-family:Georgia,'Noto Serif CJK SC','Songti SC',serif}
.lv-mini-panel:before{content:"";position:absolute;z-index:-1;inset:0;background:repeating-linear-gradient(0deg,transparent 0 6px,#fff009 7px,transparent 8px);opacity:.025;pointer-events:none}
.lv-mini-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:14px;border-bottom:1px solid #d6c69d33}
.lv-mini-overline{display:flex;gap:10px;align-items:center;color:#ccb988;font:700 10px/1.4 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase}
.lv-mini-overline i{width:6px;height:6px;border-radius:50%;background:#c07858;box-shadow:0 0 12px #e39b63}
.lv-mini-close{width:40px;height:40px;border:1px solid #d8c8a355;background:#11171380;color:#f4ecdb;font:24px/1 Georgia,serif;cursor:pointer}
.lv-mini-close:hover{background:#4c4937}
.lv-mini-title{margin:23px 0 8px;font:500 clamp(30px,5vw,48px)/1.15 'Noto Serif CJK SC','Songti SC',Georgia,serif;letter-spacing:.06em;color:#f3eddb;text-shadow:0 2px 16px #0009}
.lv-mini-intro{max-width:690px;margin:0;color:#c6c0b1;font:14px/1.7 system-ui,sans-serif}
.lv-mini-stage{margin:25px 0 18px;min-height:190px;border:1px solid #d1c08b35;background:linear-gradient(135deg,#d6c89c0b,#090e0d70);padding:clamp(15px,3vw,28px);display:grid;align-items:center}
.lv-mini-stage[data-kind="timing"]{grid-template-columns:minmax(0,1fr) 150px;gap:22px}
.lv-mini-instrument{display:grid;gap:18px;align-content:center}
.lv-mini-instrument-title{color:#b9ad90;font:11px/1.4 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase}
.lv-mini-meter{position:relative;height:22px;border:1px solid #c9bd9d55;background:linear-gradient(90deg,#111713,#263129 48%,#111713);box-shadow:inset 0 0 14px #0008;overflow:hidden}
.lv-mini-meter:before{content:"";position:absolute;z-index:1;top:0;bottom:0;left:var(--lv-zone-left,25%);width:var(--lv-zone-width,50%);background:linear-gradient(90deg,#d1a85a20,#d5bd7390,#d1a85a20);border-left:1px solid #edcb7b99;border-right:1px solid #edcb7b99}
.lv-mini-needle{position:absolute;z-index:2;top:-5px;bottom:-5px;left:50%;width:3px;background:#f2dfad;box-shadow:0 0 12px #ffc669;transform:translateX(-50%);will-change:left}
.lv-mini-track-labels{display:flex;justify-content:space-between;color:#8d8a7d;font:10px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
.lv-mini-progress{display:flex;gap:9px;align-items:center;min-height:15px;color:#b5aa8e;font:12px system-ui,sans-serif}
.lv-mini-progress i{display:block;width:11px;height:11px;border:1px solid #bcae8a88;border-radius:50%;background:#161c18;box-shadow:inset 0 0 4px #0008}
.lv-mini-progress i.hit{background:#c3a35e;border-color:#f0d68c;box-shadow:0 0 10px #c3a35e80}
.lv-mini-progress i.miss{background:#8c5548;border-color:#c88571}
.lv-mini-visual{width:140px;height:140px;display:grid;place-items:center;border:1px solid #d9c68a30;border-radius:50%;background:radial-gradient(circle,#d5c17a17,#111814 68%);color:#e4cf98;position:relative}
.lv-mini-gong{width:76px;height:76px;border:2px solid #b8a575;border-radius:50%;box-shadow:0 0 0 7px #b8a57512,0 0 0 14px #b8a5750a;display:grid;place-items:center;font-size:28px}
.lv-mini-gust{width:3px;height:75px;position:absolute;left:50%;top:30px;transform-origin:top center;transform:rotate(0deg);background:linear-gradient(#d8bc77,#5f573f);will-change:transform}
.lv-mini-gust:after{content:"";position:absolute;bottom:-5px;left:-7px;width:17px;height:17px;border-radius:50%;background:#d7bd78;box-shadow:0 0 15px #ebcc76}
.lv-mini-action{justify-self:start;min-height:46px;padding:0 19px;border:1px solid #c4a867;background:linear-gradient(135deg,#b28d4c,#80673c);color:#fff4d8;font:700 13px system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 5px 16px #0005}
.lv-mini-action:hover{filter:brightness(1.12);transform:translateY(-1px)}
.lv-mini-memory{display:grid;gap:18px;justify-items:center}
.lv-mini-memory-note{color:#c9c0a7;font:12px/1.5 system-ui,sans-serif;letter-spacing:.06em;text-align:center}
.lv-mini-pads{display:grid;grid-template-columns:repeat(3,minmax(88px,132px));gap:12px;justify-content:center}
.lv-mini-pad{min-height:76px;border:1px solid #c7b77f66;background:linear-gradient(145deg,#242d27,#151b18);color:#e9ddbe;font:600 15px system-ui,sans-serif;cursor:pointer;transition:transform .12s,background .12s,border .12s,box-shadow .12s}
.lv-mini-pad:hover:not(:disabled){background:#3d4838;border-color:#d9bd72;transform:translateY(-2px)}
.lv-mini-pad:disabled{opacity:.44;cursor:default}
.lv-mini-pad.lit{background:#b08d49;color:#fff3d1;border-color:#efd58d;box-shadow:0 0 20px #d2a95888;transform:scale(1.04)}
.lv-mini-pad.wrong{background:#794e43;border-color:#d28a73}
.lv-mini-listen{min-height:42px;padding:0 18px;border:1px solid #a99b77;background:#e5dcc2;color:#34382d;font:600 12px system-ui,sans-serif;cursor:pointer}
.lv-mini-tune{display:grid;gap:17px}
.lv-mini-radio-face{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;border:1px solid #827954;background:linear-gradient(120deg,#101714,#313b2b 52%,#111713);box-shadow:inset 0 0 24px #0009}
.lv-mini-radio-face strong{font:500 clamp(23px,4vw,38px)/1 Georgia,serif;color:#b8c38c;letter-spacing:.12em;text-shadow:0 0 13px #adcb69a8}
.lv-mini-radio-face small{color:#8e9875;font:10px system-ui,sans-serif;letter-spacing:.16em}
.lv-mini-signal-bars{display:flex;align-items:end;gap:4px;height:42px}
.lv-mini-signal-bars i{width:8px;height:12px;background:#68724e;opacity:.4;transition:height .15s,opacity .15s,background .15s}
.lv-mini-signal-bars i.on{opacity:1;background:#c3be76;box-shadow:0 0 9px #b5d17b77}
.lv-mini-tune input{width:100%;accent-color:#c1a15e;cursor:ew-resize}
.lv-mini-tune-labels{display:flex;justify-content:space-between;color:#908d7d;font:10px system-ui,sans-serif;letter-spacing:.12em}
.lv-mini-tune-report{min-height:20px;color:#c7bc9e;font:12px system-ui,sans-serif}
.lv-mini-crank{display:grid;gap:18px;justify-items:center}
.lv-mini-gear{width:112px;height:112px;border:2px dashed #c4a25e;border-radius:50%;display:grid;place-items:center;color:#dfc481;font-size:50px;transition:transform .25s;box-shadow:0 0 0 10px #c4a25e10,0 0 0 20px #c4a25e08}
.lv-mini-crank-controls{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
.lv-mini-crank-controls button{min-width:145px;min-height:48px;border:1px solid #c7b87f88;background:#202820;color:#eee2c4;font:600 13px system-ui,sans-serif;cursor:pointer}
.lv-mini-crank-controls button:hover:not(:disabled){background:#3b4938;border-color:#d4bb75}
.lv-mini-crank-controls button:disabled{opacity:.45;cursor:default}
.lv-mini-status{min-height:24px;margin:8px 0 0;color:#c5bda8;font:12px/1.5 system-ui,sans-serif;letter-spacing:.04em}
.lv-mini-footer{display:flex;justify-content:space-between;gap:12px;padding-top:15px;border-top:1px solid #d6c69d26;color:#888a7d;font:10px/1.5 system-ui,sans-serif;letter-spacing:.08em}
.lv-mini-footer span:last-child{text-align:right;color:#b7a67e}
@media(max-width:650px){.lv-mini-overlay{padding:8px}.lv-mini-panel{padding:18px;max-height:96dvh}.lv-mini-title{margin-top:17px;font-size:29px}.lv-mini-stage{padding:14px;min-height:200px}.lv-mini-stage[data-kind="timing"]{grid-template-columns:1fr;gap:12px}.lv-mini-visual{width:88px;height:88px;margin:auto}.lv-mini-gust{height:48px;top:18px}.lv-mini-gong{width:52px;height:52px;font-size:21px}.lv-mini-pads{grid-template-columns:repeat(3,minmax(70px,1fr));width:100%;gap:7px}.lv-mini-pad{min-height:62px;font-size:13px}.lv-mini-footer{display:block}.lv-mini-footer span{display:block;margin:4px 0}.lv-mini-footer span:last-child{text-align:left}}
`;
function lvMiniConfig(action, shift = false) {
  const chapter = lvState()?.id || "bellhouse";
  const final = chapter === "thousand";
  const difficulty = lvState()?.difficulty || "standard";
  const zone = ({ calm: 0.35, standard: 0.31, strict: 0.27 })[difficulty] || 0.31;
  const tuneTolerance = ({ calm: 10, standard: 8, strict: 6 })[difficulty] || 8;
  if (action === "bell") return { kind: "timing", motif: "bell", title: "把回声送回走廊", label: "门铃节拍 / ECHO CATCH", intro: "铃片会来回摆动。等它掠过黄铜色的安静区，再按下回铃；三次里稳稳接住两次即可。", tapLabel: "按下回铃", attempts: final ? 4 : 3, need: final ? 3 : 2, zone: final ? zone - 0.025 : zone };
  if (action === "wall") return { kind: "memory", motif: "wall", title: "隔墙的四个落点", label: "回敲练习 / WALL ECHO", intro: final ? "先听完一串落点，再按记住的顺序回应。最后几声会故意靠得很近。" : "先听完一串落点，再按记住的顺序回应。别急，墙里的节奏只响一遍。", pads: ["左墙", "中缝", "右墙"], length: final ? 5 : 4, sound: "knock" };
  if (action === "radio") return { kind: "tune", motif: "radio", title: "在杂波里找一条船", label: "短波校准 / CARRIER LOCK", intro: "慢慢扫过波段，等载波不再散开时锁定它。这里没有钟点，只有一段越来越清楚的声音。", tolerance: final ? Math.max(4, tuneTolerance - 2) : tuneTolerance };
  if (action === "ledger") return { kind: "timing", motif: "flame", title: "护住账页边缘的火", label: "火苗稳定 / PAPER & WIND", intro: "屋檐的风把火苗推来推去。等火线穿过纸页上的暖色标记，再点亮一角。", tapLabel: "护住火苗", attempts: final ? 4 : 3, need: final ? 3 : 2, zone: final ? zone - 0.025 : zone };
  if (action === "clock" && shift) return { kind: "crank", motif: "gear", title: "让旧机芯重新咬合", label: "发条校准 / GEAR TRAIN", intro: "观察齿轮的转向顺序，交替转动发条。太早上弦，或者转错一齿，机芯都会记住。", length: final ? 6 : 4, sound: "clock" };
  if (action === "clock") return { kind: "timing", motif: "pendulum", title: "接住摆锤回到中线的一刻", label: "摆锤校拍 / DEAD CENTER", intro: "摆锤每次越过中心，都会轻轻碰响木壳。听见那一下时按住拉链；三次里对准两次。", tapLabel: "轻拉钟链", attempts: final ? 4 : 3, need: final ? 3 : 2, zone: final ? zone - 0.025 : zone };
  return null;
}
function lvMiniSeed(tag) {
  const l = lvState();
  return hashSeed(`${G?.seed || "ANDERS-1986"}|${l?.id || "room"}|${tag}|${Math.floor((G?.minute || 0) / 1440)}|${l?.cueNo || 0}`);
}
function lvMiniPattern(length, count, tag) {
  const base = lvMiniSeed(tag);
  return Array.from({ length }, (_, i) => hashSeed(`${base}|${i}|${tag}`) % count);
}
function lvEnsureMiniRoot() {
  if (lvMiniRoot?.isConnected) return lvMiniRoot;
  lvMiniRoot = document.createElement("section");
  lvMiniRoot.id = "lvMiniOverlay";
  lvMiniRoot.className = "lv-mini-overlay";
  lvMiniRoot.hidden = true;
  lvMiniRoot.tabIndex = -1;
  lvMiniRoot.setAttribute("role", "dialog");
  lvMiniRoot.setAttribute("aria-modal", "true");
  lvMiniRoot.setAttribute("aria-labelledby", "lvMiniTitle");
  document.body.appendChild(lvMiniRoot);
  return lvMiniRoot;
}
function lvMiniView(state) {
  const art = typeof lvChapterCover === "function" ? lvChapterCover(lvState()?.id || "") : "";
  const background = art ? `<img src="${art}" alt="" aria-hidden="true">` : "";
  const m = state.meta;
  let stage = "";
  if (m.kind === "timing") {
    stage = `<div class="lv-mini-stage" data-kind="timing"><div class="lv-mini-instrument"><span class="lv-mini-instrument-title">${m.label}</span><div class="lv-mini-meter" style="--lv-zone-left:${50 - m.zone * 100}%;--lv-zone-width:${m.zone * 200}%"><i class="lv-mini-needle" id="lvMiniNeedle"></i></div><div class="lv-mini-track-labels"><span>偏离</span><span>稳住</span><span>偏离</span></div><div class="lv-mini-progress" id="lvMiniProgress"></div><button class="lv-mini-action" data-lv-mini-tap>${m.tapLabel}</button></div><div class="lv-mini-visual" aria-hidden="true">${m.motif === "bell" ? '<span class="lv-mini-gong">♢</span>' : m.motif === "flame" ? '<span class="lv-mini-flame">♨</span>' : '<span class="lv-mini-pendulum">⌖</span>'}<i class="lv-mini-gust" id="lvMiniGust"></i></div></div>`;
  } else if (m.kind === "memory") {
    stage = `<div class="lv-mini-stage" data-kind="memory"><div class="lv-mini-memory"><div class="lv-mini-memory-note" id="lvMiniMemoryNote">墙里的声音还没开始。准备好后，按一下“听一遍”。</div><div class="lv-mini-pads">${m.pads.map((label, i) => `<button class="lv-mini-pad" data-lv-mini-pad="${i}" disabled aria-label="${label}">${label}</button>`).join("")}</div><div class="lv-mini-progress" id="lvMiniProgress"></div><button class="lv-mini-listen" data-lv-mini-start>听一遍声音</button></div></div>`;
  } else if (m.kind === "tune") {
    stage = `<div class="lv-mini-stage" data-kind="tune"><div class="lv-mini-tune"><div class="lv-mini-radio-face"><div><small>SHORTWAVE · ANALOG TUNER</small><br><strong id="lvMiniBand">波段 50</strong></div><div class="lv-mini-signal-bars" id="lvMiniSignalBars">${Array.from({length:9},(_,i)=>`<i data-bar="${i}"></i>`).join("")}</div></div><input id="lvMiniSlider" type="range" min="0" max="100" step="1" value="50" aria-label="短波调谐"><div class="lv-mini-tune-labels"><span>低频 · 深海</span><span>高频 · 远岸</span></div><div class="lv-mini-tune-report" id="lvMiniTuneReport" aria-live="polite"></div><button class="lv-mini-action" data-lv-mini-lock>锁住这段声音</button></div></div>`;
  } else {
    stage = `<div class="lv-mini-stage" data-kind="crank"><div class="lv-mini-crank"><div class="lv-mini-gear" id="lvMiniGear" aria-hidden="true">⚙</div><div class="lv-mini-memory-note" id="lvMiniMemoryNote">先观察机芯的齿轮顺序。</div><div class="lv-mini-crank-controls"><button data-lv-mini-crank="0" disabled>↻ 顺时针</button><button data-lv-mini-crank="1" disabled>↺ 逆时针</button></div><div class="lv-mini-progress" id="lvMiniProgress"></div><button class="lv-mini-listen" data-lv-mini-start>观察齿轮</button></div></div>`;
  }
  const kicker = lvState()?.id === "thousand" ? "FINAL DOSSIER · FOUR SIGNALS" : `ROOM ${String(lvDef().no).padStart(2,"0")} · FIXED HOUSE MECHANISM`;
  return `<div class="lv-mini-backdrop">${background}</div><div class="lv-mini-panel"><header class="lv-mini-head"><span class="lv-mini-overline"><i></i>${kicker}</span><button class="lv-mini-close" data-lv-mini-close aria-label="退出小游戏">×</button></header><h2 class="lv-mini-title" id="lvMiniTitle">${m.title}</h2><p class="lv-mini-intro">${m.intro}</p>${stage}<p class="lv-mini-status" id="lvMiniStatus" aria-live="polite">操作做完，房间仍不会告诉你机关有没有回应。</p><footer class="lv-mini-footer"><span>小游戏期间游戏时间暂停 · Esc 可离开，不显示钟点</span><span>动作结果不会即时确认</span></footer></div>`;
}
function lvMiniSetStatus(text) {
  const e = document.getElementById("lvMiniStatus");
  if (e) e.textContent = text;
}
function lvMiniProgress(state) {
  const e = document.getElementById("lvMiniProgress");
  if (!e) return;
  const count = state.meta.attempts || state.meta.length;
  e.innerHTML = Array.from({ length: count }, (_, i) => {
    const score = state.scores[i];
    return `<i class="${score === true ? "hit" : score === false ? "miss" : ""}" aria-hidden="true"></i>`;
  }).join("");
}
function lvMiniPlayCue(name) {
  if (typeof auPlay !== "function") return;
  auPlay(name || "click", 0.46, { vary: 0.035 });
}
function lvMiniStartPlayback() {
  const s = lvMiniState;
  if (!s || !["memory", "crank"].includes(s.meta.kind) || s.stage !== "ready") return;
  s.stage = "playback";
  s.step = 0;
  const note = document.getElementById("lvMiniMemoryNote");
  if (note) note.textContent = s.meta.kind === "memory" ? "听清楚落点……" : "看清齿轮的转向……";
  const pads = [...document.querySelectorAll("[data-lv-mini-pad]")];
  const crank = [...document.querySelectorAll("[data-lv-mini-crank]")];
  const interval = s.meta.kind === "memory" ? 540 : 620;
  s.pattern.forEach((value, index) => {
    setTimeout(() => {
      if (lvMiniState !== s) return;
      const button = s.meta.kind === "memory" ? pads[value] : crank[value];
      button?.classList.add("lit");
      if (s.meta.kind === "crank") {
        const gear = document.getElementById("lvMiniGear");
        if (gear) gear.style.transform = `rotate(${(index + 1) * (value ? -45 : 45)}deg)`;
      }
      lvMiniPlayCue(s.meta.sound);
      setTimeout(() => button?.classList.remove("lit"), 250);
    }, 380 + index * interval);
  });
  setTimeout(() => {
    if (lvMiniState !== s) return;
    s.stage = "input";
    const noteNow = document.getElementById("lvMiniMemoryNote");
    if (noteNow) noteNow.textContent = s.meta.kind === "memory" ? "轮到你了。按刚才的顺序轻敲。" : "照着刚才的方向，逐齿上弦。";
    document.querySelectorAll("[data-lv-mini-pad],[data-lv-mini-crank]").forEach((b) => (b.disabled = false));
    document.querySelector("[data-lv-mini-start]")?.remove();
    lvMiniSetStatus("只记录你手上的节奏；房间的反应仍然藏着。");
  }, 420 + s.pattern.length * interval);
}
function lvMiniInput(value) {
  const s = lvMiniState;
  if (!s || s.stage !== "input" || !["memory", "crank"].includes(s.meta.kind)) return;
  const expected = s.pattern[s.step], ok = Number(value) === expected;
  s.scores[s.step] = ok;
  s.hits += ok ? 1 : 0;
  const selector = s.meta.kind === "memory" ? `[data-lv-mini-pad="${value}"]` : `[data-lv-mini-crank="${value}"]`;
  const button = document.querySelector(selector);
  if (button) {
    button.classList.add(ok ? "lit" : "wrong");
    setTimeout(() => button.classList.remove("lit", "wrong"), 220);
  }
  if (s.meta.kind === "crank") {
    const gear = document.getElementById("lvMiniGear");
    if (gear) gear.style.transform = `rotate(${(s.step + 1) * (ok ? (Number(value) ? -90 : 90) : 24)}deg)`;
  }
  s.step++;
  lvMiniProgress(s);
  lvMiniPlayCue(ok ? s.meta.sound : "error");
  if (s.step >= s.pattern.length) {
    const needed = s.meta.kind === "memory" ? s.pattern.length - (s.meta.length >= 5 ? 1 : 0) : s.pattern.length - 1;
    lvMiniResolve(s.hits >= needed);
  }
}
function lvMiniTuneUpdate() {
  const s = lvMiniState;
  const slider = document.getElementById("lvMiniSlider");
  if (!s || s.meta.kind !== "tune" || !slider) return;
  const value = Number(slider.value), distance = Math.abs(value - s.target), quality = Math.max(0, 100 - distance * 3.2);
  const band = document.getElementById("lvMiniBand"), report = document.getElementById("lvMiniTuneReport"), bars = [...document.querySelectorAll("#lvMiniSignalBars i")];
  if (band) band.textContent = `波段 ${String(value).padStart(2,"0")}`;
  const filled = Math.round(quality / 100 * bars.length);
  bars.forEach((bar, i) => { bar.classList.toggle("on", i < filled); bar.style.height = `${12 + i * 2.7}px`; });
  if (report) report.textContent = quality >= 78 ? "载波正在成形 · 可以试着锁住" : quality >= 46 ? "远处有一段声音 · 继续微调" : "杂波仍占上风 · 慢慢扫过波段";
  s.tuneQuality = quality;
  s.tuneGood = distance <= s.meta.tolerance;
}
function lvMiniTap() {
  const s = lvMiniState;
  if (!s || s.meta.kind !== "timing") return;
  const ok = Math.abs(s.position - 0.5) <= s.meta.zone;
  s.scores[s.step] = ok;
  s.hits += ok ? 1 : 0;
  s.step++;
  lvMiniProgress(s);
  lvMiniSetStatus(ok ? "这一拍很稳。继续听。" : s.position < 0.5 ? "风把火线推开了，下一拍再试。" : "擦过了中心，先听再动。" );
  lvMiniPlayCue(ok ? (s.meta.motif === "bell" ? "bell" : s.meta.motif === "pendulum" ? "clock" : "click") : "error");
  if (s.step >= s.meta.attempts) lvMiniResolve(s.hits >= s.meta.need);
}
function lvMiniFrame(now) {
  const s = lvMiniState;
  if (!s || s.meta.kind !== "timing") { lvMiniFrameId = 0; return; }
  const angle = Math.sin((now - s.startedAt) * 0.00215 + s.phaseOffset);
  s.position = 0.5 + angle * 0.47;
  const needle = document.getElementById("lvMiniNeedle");
  if (needle) needle.style.left = `${s.position * 100}%`;
  const gust = document.getElementById("lvMiniGust");
  if (gust) gust.style.transform = `rotate(${angle * (s.meta.motif === "pendulum" ? 27 : 18)}deg)`;
  lvMiniFrameId = requestAnimationFrame(lvMiniFrame);
}
function lvMiniResolve(skillOK) {
  const s = lvMiniState;
  if (!s || s.resolving) return;
  s.resolving = true;
  if (lvMiniFrameId) cancelAnimationFrame(lvMiniFrameId);
  lvMiniFrameId = 0;
  const restore = s.restorePanel;
  lvMiniRoot.hidden = true;
  lvMiniState = null;
  panelType = "";
  if (s.action === "radio") {
    lvTryAt("radio", s.startAt, false, !!skillOK);
    if (typeof s.after === "function") s.after();
    else if (typeof lvBaseDoLeisure === "function") lvBaseDoLeisure("radio");
  } else {
    lvTryAt(s.action, s.startAt, s.shift, !!skillOK);
    advanceTime(1, "level-action", false);
    saveGame(false);
    if (typeof renderHUD === "function") renderHUD();
    if (typeof worldRenderHUD === "function") worldRenderHUD();
    if (restore && restore !== "leisure" && typeof refreshPanel === "function") refreshPanel();
  }
}
function lvMiniCancel() {
  const s = lvMiniState;
  if (!s) return;
  if (lvMiniFrameId) cancelAnimationFrame(lvMiniFrameId);
  lvMiniFrameId = 0;
  lvMiniState = null;
  if (lvMiniRoot) lvMiniRoot.hidden = true;
  panelType = "";
  if (s.restorePanel === "leisure" && typeof openLeisure === "function") openLeisure();
  else if (typeof worldRenderHUD === "function") worldRenderHUD();
}
function lvStartMiniGame(action, shift = false, after = null) {
  if (!G || !lvMode() || G.ended || typeof document === "undefined") return false;
  if (action === "ledger" && shift && !has("lighter")) return notify("抽屉里没有火柴或打火机。", "warn");
  if (action === "radio" && !has("radio")) return notify("先拆出自己买的收音机。", "warn");
  const meta = lvMiniConfig(action, shift);
  if (!meta) return false;
  const restorePanel = panelType || "";
  if (restorePanel && typeof closePanel === "function") closePanel();
  const state = {
    action, shift, after, restorePanel, meta, startAt: G.minute, stage: meta.kind === "timing" || meta.kind === "tune" ? "active" : "ready",
    step: 0, hits: 0, scores: [], position: 0.5, startedAt: performance.now(), phaseOffset: (lvMiniSeed(action) % 1000) / 1000 * Math.PI * 2,
    pattern: ["memory", "crank"].includes(meta.kind) ? lvMiniPattern(meta.length, meta.kind === "memory" ? meta.pads.length : 2, action) : [],
    target: meta.kind === "tune" ? 20 + (lvMiniSeed("radio-target") % 61) : 50,
  };
  if (meta.kind === "tune") {
    const dir = (lvMiniSeed("radio-start") % 2) ? 1 : -1;
    state.sliderStart = Math.max(2, Math.min(98, state.target + dir * (20 + lvMiniSeed("radio-offset") % 15)));
  }
  lvMiniState = state;
  const root = lvEnsureMiniRoot();
  root.innerHTML = lvMiniView(state);
  root.hidden = false;
  panelType = "chapter-mini";
  lvMiniProgress(state);
  if (meta.kind === "timing") {
    lvMiniFrameId = requestAnimationFrame(lvMiniFrame);
    root.querySelector("[data-lv-mini-tap]")?.focus({ preventScroll: true });
  } else if (meta.kind === "tune") {
    const slider = root.querySelector("#lvMiniSlider");
    if (slider) slider.value = state.sliderStart;
    lvMiniTuneUpdate();
    root.querySelector("#lvMiniSlider")?.focus({ preventScroll: true });
  } else root.querySelector("[data-lv-mini-start]")?.focus({ preventScroll: true });
  return true;
}
function lvMiniHandleKey(e) {
  if (!lvMiniState) return;
  const s = lvMiniState;
  if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); lvMiniCancel(); return; }
  if (s.meta.kind === "timing" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); e.stopImmediatePropagation(); lvMiniTap(); return; }
  if (["memory", "crank"].includes(s.meta.kind)) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); e.stopImmediatePropagation();
      if (s.stage === "ready") lvMiniStartPlayback();
      return;
    }
    const number = Number(e.key);
    if (s.meta.kind === "memory" && number >= 1 && number <= 3) { e.preventDefault(); e.stopImmediatePropagation(); lvMiniInput(number - 1); return; }
    if (s.meta.kind === "crank" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); e.stopImmediatePropagation(); lvMiniInput(e.key === "ArrowRight" ? 0 : 1); return; }
  }
  if (s.meta.kind === "tune") {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault(); e.stopImmediatePropagation();
      const slider = document.getElementById("lvMiniSlider");
      if (slider) { slider.value = Math.max(0, Math.min(100, Number(slider.value) + (e.key === "ArrowRight" ? 1 : -1))); lvMiniTuneUpdate(); }
      return;
    }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopImmediatePropagation(); lvMiniTuneLock(); return; }
  }
  e.stopImmediatePropagation();
}
function lvMiniTuneLock() {
  const s = lvMiniState;
  if (!s || s.meta.kind !== "tune") return;
  if (s.tuneGood) { lvMiniSetStatus("载波暂时稳住了。把手从旋钮上移开。"); lvMiniResolve(true); }
  else { lvMiniSetStatus("杂波仍盖着声音。微调之后，再试着锁住。"); lvMiniPlayCue("radio_static"); }
}
function lvInstallMiniStyles() {
  if (document.getElementById("lvMiniStyles")) return;
  const style = document.createElement("style");
  style.id = "lvMiniStyles";
  style.textContent = LV_MINI_CSS;
  document.head.appendChild(style);
}
if (typeof document !== "undefined") {
  lvInstallMiniStyles();
  document.addEventListener("click", (e) => {
    if (!lvMiniState) return;
    const target = e.target.closest?.("[data-lv-mini-close]");
    if (target) { lvMiniCancel(); return; }
    if (e.target.closest?.("[data-lv-mini-start]")) { lvMiniStartPlayback(); return; }
    const pad = e.target.closest?.("[data-lv-mini-pad]");
    if (pad && !pad.disabled) { lvMiniInput(pad.dataset.lvMiniPad); return; }
    const crank = e.target.closest?.("[data-lv-mini-crank]");
    if (crank && !crank.disabled) { lvMiniInput(crank.dataset.lvMiniCrank); return; }
    if (e.target.closest?.("[data-lv-mini-tap]")) { lvMiniTap(); return; }
    if (e.target.closest?.("[data-lv-mini-lock]")) lvMiniTuneLock();
  });
  document.addEventListener("input", (e) => { if (e.target?.id === "lvMiniSlider") lvMiniTuneUpdate(); });
  document.addEventListener("keydown", lvMiniHandleKey, true);
}
