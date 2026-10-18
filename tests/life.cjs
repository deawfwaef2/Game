// v0.10 life layer in the real 3D room: windowsill pots, letter bundle, letter page in hand, radio captions.
const { chromium } = require("playwright"), path = require("path"), assert = require("assert");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const errors = [], external = [];
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => !r.url().startsWith("file:") && !r.url().startsWith("data:") && !r.url().startsWith("blob:") && external.push(r.url()));
    await p.goto("file://" + path.resolve("index.html") + "#qa", { timeout: 90000 });
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.evaluate(() => ROOM_READY);
    await p.evaluate(async () => { roomStartSample(); await new Promise((r) => setTimeout(r, 300)); });
    const out = await p.evaluate(() => {
      const o = {};
      const mk = (id, units) => ({ uid: uid(), id, units, packed: false, location: "room", created: 0, age: 0, opened: true, contaminated: false });
      G.inv.push(mk("pots", 1), mk("scallion", 8), mk("radio", 1));
      lifeEnsure(); G.minute = 2 * 1440 + 8 * 60; syncWorldRoom();
      const find = (id) => { let f = null; LW.root.traverse((x) => { if (x.userData.interact === id) f = x; }); return f; };
      o.tags = []; LW.root.traverse((x) => x.userData.interact && o.tags.push(x.userData.interact));
      o.pests = typeof clearPest !== "undefined" || !!DB.carpowder || G.hidden !== undefined;
      W.held = null; W.focus = find("garden:0"); worldInteract(false); worldFinishAction(); o.sown = G.life.garden[0]?.crop;
      G.life.garden[0].growth = 1; LW.stamp = ""; syncWorldRoom(); W.focus = find("garden:0"); worldInteract(false); worldFinishAction(); o.held = W.held?.id;
      W.held = null; G.heldUID = null; worldSetHand();
      W.focus = find("letters"); worldInteract(false); worldFinishAction(); o.glance = W.glance; o.letters = G.life.letters; o.paper = W.paperStamp;
      worldInteract(false); o.closed = W.glance === "";
      doLeisure("radio"); const cap = document.getElementById("lifeCaption"); o.caption = cap && cap.classList.contains("on") && /新闻/.test(cap.textContent);
      W.focus = null; const cal = (() => { let f = null; roomRoot.traverse((x) => { if (!f && x.userData.interact === "journal") f = x; }); return f; })();
      W.focus = cal; o.calHint = worldTargetInfo(cal)[1]; worldInteract(false); o.year = W.glance; o.yearPaper = String(W.paperStamp).startsWith("year"); worldInteract(false);
      G.life.cranes = 300; LW.stamp = ""; syncWorldRoom(); o.cranes = 0; LW.root.traverse((x) => { if (x.isInstancedMesh && x.geometry === LW.craneGeo) o.cranes = x.count; });
      W.held = null; G.heldUID = null; worldSetHand(); W.glance = "";
      const win = (() => { let f = null; roomRoot.traverse((x) => { if (!f && x.userData.interact === "window") f = x; }); return f; })();
      W.focus = win; o.winHint = worldTargetInfo(win)[1]; worldInteract(true); worldFinishAction(); o.watched = /往外看/.test(G.log[0]?.text || "");
      G.life.faults = { drip: 3 }; const sink = (() => { let f = null; roomRoot.traverse((x) => { if (!f && x.userData.interact === "sink") f = x; }); return f; })(); o.sinkHint = worldTargetInfo(sink)[1];
      G.life.harvests = 30; endGame(true, "test"); o.ending = G.life.ending; o.endBox = !!document.querySelector("#endScreen .life-ending") && /窗台上的春天/.test(document.querySelector("#endScreen .life-ending").textContent);
      o.records = lmRecords().endings.includes("garden");
      return o;
    });
    console.log(JSON.stringify(out));
    assert.deepStrictEqual(out.tags.sort(), ["garden:0", "garden:1", "garden:2", "letters"]);
    assert.strictEqual(out.pests, false);
    assert.strictEqual(out.sown, "scallion");
    assert.strictEqual(out.held, "greens");
    assert.strictEqual(out.glance, "letter");
    assert.strictEqual(out.letters, 1);
    assert.strictEqual(out.paper, "letter0");
    assert.ok(out.closed && out.caption);
    assert.ok(/看看这一年/.test(out.calHint) && out.year === "year" && out.yearPaper);
    assert.strictEqual(out.cranes, 300);
    assert.ok(/看看窗外/.test(out.winHint) && out.watched, "window watching");
    assert.ok(/水龙头滴水/.test(out.sinkHint), "fault shown at the sink");
    assert.ok(out.ending === "garden" && out.endBox && out.records);
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(external, []);
    console.log("LIFE PASS: watching the street / fault hints / year page on the wall calendar / hanging paper cranes / ending + cross-run records / windowsill garden sow/harvest-to-hand / letter bundle + letter page / radio caption / no pests / no external requests / JS errors 0");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
