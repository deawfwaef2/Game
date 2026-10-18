// v0.16 sound + feedback: embedded CC0 recordings decode offline, actions make sounds and show what changed.
const { chromium } = require("playwright"), path = require("path"), assert = require("assert");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
  const errors = [], external = [];
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => !r.url().startsWith("file:") && !r.url().startsWith("data:") && !r.url().startsWith("blob:") && external.push(r.url()));
    await p.goto("file://" + path.resolve("index.html") + "#qa", { timeout: 90000 });
    await p.evaluate(() => ROOM_READY);
    await p.mouse.click(5, 5);
    await p.waitForFunction(() => AU.ready, null, { timeout: 60000 });
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.evaluate(async () => { roomStartSample(); await new Promise((r) => setTimeout(r, 300)); });
    const out = await p.evaluate(() => {
      const o = { total: Object.keys(AUDIO_DATA).length, decoded: Object.keys(AU.buf).length, on: AU.set.on };
      o.music = ["m_vaporware", "m_light", "m_nostalgia", "m_sadness", "m_jrpg", "m_emotional"].every((k) => AU.buf[k] && AU.buf[k].duration > 20);
      const played = [];
      const orig = AU.ctx.createBufferSource.bind(AU.ctx);
      AU.ctx.createBufferSource = () => { const s = orig(); const st = s.start.bind(s); s.start = (...a) => { played.push(Object.keys(AU.buf).find((k) => AU.buf[k] === s.buffer)); return st(...a); }; return s; };
      worldSfx(500, 0.04); worldSfx(210, 0.1);
      G.stats.food = 40; G.stats.water = 40; G.bladder = 90;
      const before = played.length;
      worldStart("上个厕所", 1, () => { G.bladder = 5; G.minute += 6; }, "pee"); worldFinishAction();
      o.flush = played.slice(before).includes("flush");
      const chips = document.getElementById("auChips"); o.chips = chips?.textContent || ""; o.chipsOn = chips?.classList.contains("on");
      worldStart("翻过几页，让时间慢下来", 1, () => { G.stats.morale += 4; G.minute += 30; }, "read"); worldFinishAction();
      o.readChips = document.getElementById("auChips").textContent;
      logEvent("门外有人敲门，响了三下。", "warn");
      o.played = played.slice();
      o.knock = played.filter((x) => x === "knock").length;
      G.minute = 3 * 1440 + 12 * 60; phase = "playing"; auFrame(performance.now()); auFrame(performance.now() + 20);
      o.clock = !!AU.loops.clock && AU.loops.clock.level > 0;
      toggleAudio(); o.off = AU.set.on === false && soundOn === false; toggleAudio(); o.backOn = AU.set.on;
      return o;
    });
    console.log(JSON.stringify(out));
    assert.strictEqual(out.decoded, out.total, "every embedded sound decodes");
    assert(out.total >= 70 && out.music, "sound effects and six music pieces");
    assert(out.played.includes("pick") || out.played.includes("pick2"), "picking up sounds");
    assert(out.played.includes("door_open"), "doors creak");
    assert(out.flush, "the cistern flushes after the toilet");
    assert(out.chipsOn && /小便 解决了/.test(out.chips) && /饱腹|过了/.test(out.chips + out.readChips), "feedback chips");
    assert(/心情 \+4/.test(out.readChips) && /过了 30分钟/.test(out.readChips), "reading shows mood and time");
    assert.strictEqual(out.knock, 3, "a knock is three real knocks");
    assert(out.clock, "room tone runs in the apartment");
    assert(out.off && out.backOn, "sound can be switched off and on");
    assert.deepStrictEqual(errors, []); assert.deepStrictEqual(external, []);
    console.log("AUDIO TESTS PASSED");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
