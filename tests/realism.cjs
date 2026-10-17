// Real-geometry room slice, production actions, closed-stock invariants, and preview isolation.
const { chromium } = require("playwright"),
  assert = require("assert"),
  fs = require("fs"),
  path = require("path");
(async () => {
  const browser = await chromium.launch({
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const errors = [],
    external = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1120, height: 760 },
    });
    page.setDefaultTimeout(25000);
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (!/^(file:|data:|blob:|about:)/.test(r.url())) external.push(r.url());
    });
    // Reject any fetch at all: runtime model decoding and texture loads must use only embedded bytes/Image data URIs.
    await page.addInitScript(() => {
      window.fetch = () =>
        Promise.reject(new Error("Runtime fetch is forbidden in offline room"));
    });
    await page.goto("file://" + path.resolve("index.html"), { timeout: 60000 });
    await page.evaluate(() => cancelAnimationFrame(animId));
    await page.evaluate(() => ROOM_READY);
    assert.deepStrictEqual(
      await page.evaluate(() => ({ ready: R.ready, error: R.error })),
      { ready: true, error: "" },
    );
    await page.evaluate(() => {
      renderer.setPixelRatio(0.6);
      renderer.shadowMap.enabled = false;
      openShop();
      worldKit("year");
      worldCommitCheckout();
      saveGame(false);
      toTitle();
    });
    const saved = await page.evaluate(() => localStorage.getItem(SAVE_KEY));
    assert.ok(saved);
    await page.locator("#roomSampleButton").click();
    assert.deepStrictEqual(
      await page.evaluate(() => ({
        sample: R.sample,
        realism: roomRoot.userData.realism,
        phase,
        locked: G.tradeLocked,
        canBuy: canPurchase(),
        packed: countPackages(),
      })),
      {
        sample: true,
        realism: true,
        phase: "playing",
        locked: true,
        canBuy: false,
        packed: 100,
      },
    );
    assert.strictEqual(
      await page.evaluate(() => localStorage.getItem(SAVE_KEY)),
      saved,
    );
    const snapshot = await page.evaluate(() => JSON.stringify(G));
    await page.evaluate(() => {
      openShop(true);
      openShop(false);
      storeLegacyBegin();
      putCartIntoState(cartSummary({ rice: 1 }));
    });
    assert.strictEqual(await page.evaluate(() => JSON.stringify(G)), snapshot);
    const hit = await page.evaluate(() => {
      const sink = worldFindBase("sink"),
        point = sink.localToWorld(new THREE.Vector3(0, 0.08, 0));
      camera.position.copy(
        roomRoot.localToWorld(
          new THREE.Vector3(env.w / 2 - 1.59, 1.62, -env.d / 2 + 1.9),
        ),
      );
      camera.lookAt(point);
      lookYaw = camera.rotation.y;
      lookPitch = camera.rotation.x;
      worldUpdateTarget();
      return targetId;
    });
    assert.strictEqual(hit, "sink");
    await page.keyboard.press("e");
    const grip = await page.evaluate(() => ({
      kind: W.busy?.kind,
      hands: R.hands.length,
      bones: R.hands[0]?.userData.handData.bones.length,
      y: R.grip.position.y,
    }));
    assert.strictEqual(grip.kind, "drink");
    assert.strictEqual(grip.hands, 1);
    assert.ok(grip.bones >= 25);
    const animation = await page.evaluate(() => {
      W.busy.start -= W.busy.seconds * 1000 * 0.45;
      worldFrame(performance.now(), 0.033);
      return { lift: R.grip.position.y, tilt: R.grip.rotation.x };
    });
    assert.ok(animation.lift > grip.y + 0.1);
    assert.ok(animation.tilt > 0.5);
    await page.evaluate(() => {
      W.busy.start -= W.busy.seconds * 1000;
      worldFrame(performance.now(), 0.033);
    });
    assert.strictEqual(await page.evaluate(() => W.busy), null);
    assert.strictEqual(
      await page.evaluate(() => localStorage.getItem(SAVE_KEY)),
      saved,
    );
    await page.evaluate(() => {
      // Stand-in for the player's manual unpacking (covered step by step in browser.cjs).
      G.inv.forEach((b) => {
        if (b.packed) {
          b.packed = false;
          b.location = "shelf";
        }
      });
      syncRoom();
      const book = G.inv.find((b) => DB[b.id].kind === "book");
      worldEquip(book.uid);
    });
    assert.strictEqual(await page.evaluate(() => R.hands.length), 2);
    assert.strictEqual(
      await page.evaluate(() => !!W.handModel.userData.canvas),
      true,
    );
    // A trigger box above the mattress must not make dropped food hover in empty air.
    const place = await page.evaluate(() => {
      { const b = W.held && G.inv.find((x) => x.uid === W.held.uid); if (b) { b.location = "room"; b.pose = [0, 0, 0.6, 0]; } W.held = null; G.heldUID = null; }
      worldEquip(G.inv.find((b) => b.id === "fish").uid);
      const uid = W.held.uid;
      camera.position.copy(
        roomRoot.localToWorld(new THREE.Vector3(-0.6, 1.62, -0.15)),
      );
      camera.lookAt(
        roomRoot.localToWorld(new THREE.Vector3(-env.w / 2 + 0.9, 0.32, -0.15)),
      );
      lookYaw = camera.rotation.y;
      lookPitch = camera.rotation.x;
      worldUpdateTarget();
      const proxy = !!W.hit?.object.userData.interactionProxy;
      const rawHits = raycaster
        .intersectObjects(roomRoot.children, true)
        .slice(0, 10)
        .map((h) => ({
          name: h.object.name,
          point: h.point.toArray(),
          normal: h.face?.normal.toArray(),
          proxy: !!h.object.userData.interactionProxy,
          depth: h.distance,
        }));
      worldPutBack(true);
      const batch = G.inv.find((b) => b.uid === uid);
      return { proxy, pose: batch.pose, valid: validateSave(G), rawHits };
    });
    assert.strictEqual(place.proxy, true);
    assert.ok(
      place.pose && place.pose[1] < 0.75,
      "R lands on the real mattress, not its interaction trigger: " +
        JSON.stringify(place),
    );
    assert.strictEqual(place.valid, true);
    await page.evaluate(() => {
      advanceTime(10, "idle");
      saveGame(false);
      toTitle();
    });
    assert.strictEqual(await page.evaluate(() => R.sample), false);
    assert.strictEqual(
      await page.evaluate(() => localStorage.getItem(SAVE_KEY)),
      saved,
    );
    assert.strictEqual(await page.evaluate(() => JSON.stringify(G)), saved);
    await page.locator("#roomSampleButton").click();
    await page.evaluate((s) => loadState(JSON.parse(s)), saved);
    assert.strictEqual(await page.evaluate(() => R.sample), false);
    assert.strictEqual(
      await page.evaluate(() => G.tradeLocked && !canPurchase()),
      true,
    );
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(external, []);
    await page.evaluate(() => {
      renderer.dispose();
      renderer.forceContextLoss();
    });
    await page.close();
    // Arena-like opaque iframe: no network permissions, no same-origin localStorage.
    const host = await browser.newPage({
      viewport: { width: 1120, height: 760 },
    });
    host.on("pageerror", (e) => errors.push(e.message));
    await host.setContent(
      '<iframe id="game" sandbox="allow-scripts" style="width:1100px;height:730px;border:0"></iframe>',
    );
    // index.html#sample replaced the separate sample file; srcdoc has no hash, so use the same switch.
    let html = fs.readFileSync("index.html", "utf8");
    html = html.replace(
      "<head>",
      "<head><script>window.CLOSED365_SAMPLE = true;</script><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none';\">",
    );
    await host.locator("#game").evaluate((el, html) => {
      el.srcdoc = html;
    }, html);
    const frame = await host.locator("#game").contentFrame();
    await frame
      .locator("#roomSampleNotice")
      .waitFor({ state: "visible", timeout: 60000 });
    const isolated = await frame.locator("body").evaluate(() => {
      cancelAnimationFrame(animId);
      return {
        ready: R.ready,
        error: R.error,
        sample: R.sample,
        locked: G.tradeLocked,
        phase,
        valid: validateSave(G),
      };
    });
    assert.deepStrictEqual(isolated, {
      ready: true,
      error: "",
      sample: true,
      locked: true,
      phase: "playing",
      valid: true,
    });
    await frame.locator("body").evaluate(() => {
      renderer.dispose();
      renderer.forceContextLoss();
    });
    await host.close();
    assert.deepStrictEqual(errors, []);
    console.log(
      "REALISM PASS: imported mesh/PBR / 25-joint skin hands / animated cup / actual-surface placement / no fetch / no external requests / old-save isolation / sample return+import / opaque no-network iframe",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
