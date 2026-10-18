// v0.4 physical-world regression. No dependence on retired daily-panel buttons.
// Software-GPU CI uses production raycasts/input handlers with manually stepped animation.
const { chromium } = require("playwright");
const assert = require("assert"),
  fs = require("fs"),
  path = require("path");
const fileURL = "file://" + path.resolve("index.html");
const artifacts = path.resolve("tests/artifacts");
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const errors = [];
  let requests = 0;
  let page;
  const attach = (p) => {
    p.setDefaultTimeout(15000);
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => {
      if (!/^(file:|data:|blob:)/.test(r.url())) requests++;
    });
  };
  async function boot(p) {
    attach(p);
    await p.goto(fileURL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.evaluate(() => cancelAnimationFrame(animId));
  }
  async function release(p) {
    if (!p) return;
    await p
      .evaluate(() => {
        cancelAnimationFrame(animId);
        renderer?.dispose();
        renderer?.forceContextLoss();
      })
      .catch(() => {});
    await p.close();
  }
  async function helpers(p) {
    await p.evaluate(() => {
      window.qaAim = (id, options = {}) => {
        scene.updateMatrixWorld(true);
        let object;
        roomRoot.traverse((o) => {
          if (!object && o.userData.interact === id) object = o;
        });
        if (!object) throw Error("Physical object missing: " + id);
        let point = new THREE.Box3()
          .setFromObject(object)
          .getCenter(new THREE.Vector3());
        const product = id.startsWith("buy:")
          ? id.slice(4)
          : object.userData.productId;
        if (product) {
          let label;
          object.traverse((m) => {
            if (
              !label &&
              m.isMesh &&
              m.material === W.productMaterials.get(product)
            )
              label = m;
          });
          if (label) point = label.getWorldPosition(new THREE.Vector3());
        }
        if (id === "shopCheckout") point.set(-3.0, 1.16, 4.58);
        if (options.at) point.fromArray(options.at);
        if (options.localAt)
          point = roomRoot.localToWorld(new THREE.Vector3(...options.localAt));
        if (options.from) camera.position.fromArray(options.from);
        else if (options.localFrom)
          camera.position.copy(
            roomRoot.localToWorld(new THREE.Vector3(...options.localFrom)),
          );
        else {
          const direction = new THREE.Vector3(0, 0, 1).transformDirection(
            object.matrixWorld,
          );
          camera.position.copy(point).addScaledVector(direction, 1.15);
          camera.position.y = 1.62;
        }
        camera.lookAt(point);
        lookYaw = camera.rotation.y;
        lookPitch = camera.rotation.x;
        camera.updateMatrixWorld(true);
        worldUpdateTarget();
        return targetId;
      };
      // Test shortcut for clearing the hand: set the item down on the floor by the table.
      window.qaDrop = () => (() => { const b = W.held && G.inv.find((x) => x.uid === W.held.uid); if (b) { b.location = "room"; b.pose = [0, 0, 0.6, 0]; } W.held = null; G.heldUID = null; worldSetHand(); syncWorldRoom(); })();
      window.qaFinish = () => {
        if (!W.busy) throw Error("Expected physical action");
        W.busy.start -= W.busy.seconds * 1000 + 20;
        worldFrame(performance.now(), 0.1);
      };
      window.qaDoors = () => {
        for (let i = 0; i < 25; i++) worldFrame(performance.now(), 0.1);
        scene.updateMatrixWorld(true);
      };
    });
  }
  async function aim(p, id, options = {}, expected = id) {
    const hit = await p.evaluate(
      ([id, opts]) => qaAim(id, opts),
      [id, options],
    );
    assert.strictEqual(
      hit,
      expected,
      `center ray should reach ${id}, got ${hit}`,
    );
  }
  async function act(p, key = "e") {
    await p.keyboard.press(key);
    await p.evaluate(() => qaFinish());
    assert.strictEqual(await p.evaluate(() => panelType), "");
  }
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 820 },
    });
    page = await context.newPage();
    await boot(page);
    assert.strictEqual(await page.evaluate(() => fallbackMode), false);
    assert.strictEqual(await page.evaluate(() => W.enabled), true);
    await page.locator("#newGameButton").click();
    await helpers(page);
    assert.strictEqual(await page.evaluate(() => W.shopProducts.length), await page.evaluate(() => shopStock().length));
    assert.ok(await page.evaluate(() => CATALOG.length >= 15000 && shopStock().length <= 220));
    const artAudit = await page.evaluate(() => ({
      count: CG_EXTRA_PRODUCTS.length,
      unique: new Set(CG_EXTRA_PRODUCTS.map((it) => productArt(DB[it.id]))).size,
      allSvg: CG_EXTRA_PRODUCTS.every((it) => productArt(DB[it.id]).startsWith("<svg")),
    }));
    assert.ok(artAudit.count >= 10 && artAudit.unique >= 10 && artAudit.allSvg, "curated food lines render distinct offline product art");
    assert.strictEqual(await page.locator("#shopScreen").isVisible(), false);
    // Real key handlers drive the same production movement used by the RAF loop.
    const z = await page.evaluate(() => camera.position.z);
    await page.keyboard.down("w");
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) freeMovement(0.1);
    });
    await page.keyboard.up("w");
    assert.ok(await page.evaluate((z) => camera.position.z < z - 0.4, z));
    const yaw = await page.evaluate(() => lookYaw);
    await page.mouse.move(900, 360);
    await page.mouse.down();
    await page.mouse.move(970, 375, { steps: 3 });
    await page.mouse.up();
    assert.ok(Math.abs((await page.evaluate(() => lookYaw)) - yaw) > 0.1);
    await aim(page, "buy:rice");
    await act(page);
    assert.strictEqual(await page.evaluate(() => cart.rice), 1);
    await page.keyboard.press("r");
    assert.strictEqual(await page.evaluate(() => cart.rice || 0), 0);
    await page.keyboard.press("Tab");
    assert.strictEqual(await page.evaluate(() => W.glance), "receipt");
    assert.strictEqual(
      await page.evaluate(() => !!W.handModel.userData.canvas),
      true,
    );
    await page.keyboard.press("Tab");
    await aim(page, "kit:starter", { from: [-5.2, 1.62, 1.6] });
    await page.keyboard.press("e");
    assert.strictEqual(
      await page.evaluate(() => cartSummary(cart).cost),
      85.74,
    );
    assert.strictEqual(
      await page.evaluate(() => worldCartChange("rice", 100)),
      false,
    );
    await aim(page, "shopCheckout", { from: [-2.8, 1.62, 3.1] });
    await act(page);
    assert.strictEqual(await page.evaluate(() => phase), "playing");
    assert.strictEqual(await page.evaluate(() => G.cash), 214.26);
    assert.strictEqual(await page.evaluate(() => G.bags.length), 9);
    console.log(
      "PASS walkable shop / ~200 of 20k products / real E-R / budget / 3D receipt / checkout / movement-look",
    );
    const front = await page.evaluate(() => env.d / 2),
      mir = await page.evaluate(() => (env.mirror ? -1 : 1)),
      width = await page.evaluate(() => env.w);
    const firstBag = await page.evaluate(
      () => G.bags.find((b) => !b.opened).id,
    );
    await aim(page, "bag:" + firstBag, { from: [0, 1.62, front - 1.6] });
    await act(page);
    assert.strictEqual(
      await page.evaluate(() => G.bags.filter((b) => !b.opened).length),
      8,
    );
    // Nothing is sorted automatically: reach into the opened bag, lift one group, place it by hand.
    await aim(page, "bag:" + firstBag, { from: [0, 1.62, front - 1.6] });
    await page.keyboard.press("e");
    const liftedUID = await page.evaluate(() => W.held?.uid);
    assert.ok(liftedUID, "E on an opened bag should put one pack group in the hand");
    assert.strictEqual(
      await page.evaluate((u) => G.inv.find((b) => b.uid === u).packed, liftedUID),
      false,
    );
    await aim(page, "bag:" + firstBag, { from: [0, 1.62, front - 1.6] });
    await page.keyboard.press("e");
    assert.strictEqual(await page.evaluate(() => W.held.uid), liftedUID, "hand is full: no second item");
    await aim(page, "pantry", { localAt: [width / 2 - 0.25, 0.88, 0.41], localFrom: [width / 2 - 1.5, 1.4, 0.41] }, "pantry");
    await page.keyboard.press("r");
    assert.strictEqual(await page.evaluate(() => W.held), null);
    assert.strictEqual(
      await page.evaluate((u) => G.inv.find((b) => b.uid === u).location, liftedUID),
      "shelf",
    );
    assert.ok(await page.evaluate((u) => Array.isArray(G.inv.find((b) => b.uid === u).pose), liftedUID));
    // Repeating that cycle for ~100 groups is covered by unit logic; finish the rest directly.
    await page.evaluate(() => {
      G.bags.forEach((b) => (b.opened = true));
      G.inv.forEach((b) => {
        if (b.packed) {
          b.packed = false;
          b.location = DB[b.id].category === "fresh" ? "fridge" : "shelf";
        }
      });
      syncRoom();
    });
    assert.strictEqual(await page.evaluate(() => countPackages()), 0);
    assert.strictEqual(await page.evaluate(() => bagsAtDoor().length), 0);
    const crackerUID = await page.evaluate(
      () => G.inv.find((b) => b.id === "crackers").uid,
    );
    await aim(page, "stock:" + crackerUID);
    await page.keyboard.press("e");
    assert.strictEqual(await page.evaluate(() => W.held.id), "crackers");
    const placedUID = await page.evaluate(() => W.held.uid);
    await aim(page, "table", {
      localAt: [-0.7, 0.49, 0.75],
      localFrom: [-0.7, 1.62, 1.65],
    });
    await page.keyboard.press("r");
    assert.strictEqual(
      await page.evaluate(
        (uid) => G.inv.find((b) => b.uid === uid).location,
        placedUID,
      ),
      "table",
    );
    assert.strictEqual(
      await page.evaluate(
        (uid) => G.inv.find((b) => b.uid === uid).pose.length,
        placedUID,
      ),
      4,
    );
    await aim(page, "stock:" + placedUID, { localFrom: [-0.7, 1.62, 1.65] });
    await page.keyboard.press("e");
    const portions = await page.evaluate(
      () => G.inv.find((b) => b.uid === W.held.uid).units,
    );
    await act(page, "Space");
    assert.strictEqual(
      await page.evaluate(() => G.inv.find((b) => b.uid === W.held.uid).units),
      portions - 1,
    );
    assert.strictEqual(await page.evaluate(() => qte.active), false);
    assert.strictEqual(
      await page
        .locator("#qteLayer")
        .evaluate((e) => e.classList.contains("visible")),
      false,
    );
    const generatedWaste = await page.evaluate(() => ({
      packaging: G.waste.packaging,
      scraps: G.waste.scraps,
      discarded: G.waste.discarded,
      total: G.trash,
      visibleBags: I.wasteDisplay?.bags.filter((bag) => bag.visible).length || 0,
    }));
    assert.deepStrictEqual(generatedWaste, { packaging: 1, scraps: 1, discarded: 0, total: 2, visibleBags: 1 }, "first meal creates package+scrap waste and visible tied bag");
    const focusExpiry = await page.evaluate(() => {
      const it = CATALOG.find((x) => x.life < 9999 && x.expiryMark === "unmarked"),
        b = { uid: "qa-expiry-focus", id: it.id, units: 1, packed: false, opened: false, bag: 0, created: G.minute, age: 2, location: "shelf", contaminated: false };
      G.inv.push(b);
      const text = worldTargetInfo({ userData: { interact: "stock:" + b.uid, uid: b.uid } })[1];
      G.inv = G.inv.filter((x) => x !== b);
      return text;
    });
    assert.match(focusExpiry, /保质期：.*常规保质期.*已存放约2天.*批次余期不明/, "looking at shelf stock exposes nominal life and stored age without exact batch expiry");
    await page.evaluate(() => qaDrop());
    await aim(page, "sink");
    await act(page);
    await act(page, "r");
    assert.strictEqual(await page.evaluate(() => G.tank), 5);
    const riceUID = await page.evaluate(
      () => G.inv.find((b) => b.id === "rice").uid,
    );
    await aim(page, "stock:" + riceUID);
    await page.keyboard.press("e");
    await page.keyboard.press("Space");
    assert.strictEqual(await page.evaluate(() => W.busy === null), true);
    await aim(page, "stove");
    await act(page);
    assert.strictEqual(await page.evaluate(() => W.held.prepared), true);
    await act(page, "Space");
    const coldUID = await page.evaluate(() => W.held.uid);
    // The fridge stands against the side wall, its door facing into the room (-x local).
    await aim(page, "fridge", {
      localAt: [width / 2 - 0.7, 1.0, -0.72],
      localFrom: [width / 2 - 1.75, 1.62, -0.72],
    });
    await page.keyboard.press("e");
    await page.evaluate(() => qaDoors());
    assert.strictEqual(await page.evaluate(() => W.doors.fridge.open), true);
    await aim(page, "fridge", {
      localAt: [width / 2 - 0.42, 0.95, -0.72],
      localFrom: [width / 2 - 1.45, 1.45, -0.72],
    });
    await page.keyboard.press("r");
    assert.strictEqual(
      await page.evaluate(
        (uid) => G.inv.find((b) => b.uid === uid).location,
        coldUID,
      ),
      "fridge",
    );
    await aim(page, "stock:" + coldUID, {
      localFrom: [width / 2 - 1.45, 1.45, -0.72],
    });
    await page.keyboard.press("e");
    assert.strictEqual(await page.evaluate(() => W.held.uid), coldUID);
    await page.evaluate(() => qaDrop());
    console.log(
      "PASS individual bags / open bag / take one group by hand / manual shelf+fridge placement / retake / meal without modal / water / cooking / refrigerator door and storage",
    );
    const bookUID = await page.evaluate(
      () => G.inv.find((b) => DB[b.id].kind === "book").uid,
    );
    await aim(page, "stock:" + bookUID, {
      localFrom: [-0.68, 1.62, -front + 1.55],
    });
    await page.keyboard.press("e");
    assert.strictEqual(await page.evaluate(() => W.held.type), "book");
    await act(page, "Space");
    assert.ok(await page.evaluate(() => G.books[W.held.id].pages > 0));
    if (process.env.QA_SCREENSHOTS) {
      // Read the canvas directly: SwiftShader's page compositor can stall after RAF is stopped.
      const png = await Promise.race([
        page.evaluate(() => {
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL("image/png");
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(Error("CI canvas readback timeout")), 12000),
        ),
      ]);
      fs.writeFileSync(
        path.join(artifacts, "v0.4-handheld-book.png"),
        Buffer.from(png.split(",")[1], "base64"),
      );
    }
    await page.keyboard.press("r");
    await aim(page, "wardrobe", {
      localAt: [-width / 2 + 1.65, 0.9, front - 0.68],
      localFrom: [-width / 2 + 1.65, 1.62, front - 1.95],
    });
    await page.keyboard.press("e");
    await page.evaluate(() => qaDoors());
    assert.strictEqual(await page.evaluate(() => W.doors.wardrobe.open), true);
    await aim(page, "changeclothes", {
      localFrom: [-width / 2 + 1.65, 1.62, front - 1.95],
    });
    await act(page);
    assert.strictEqual(await page.evaluate(() => G.dirtyClothes), 1);
    await aim(page, "laundry", {
      localFrom: [width / 2 - 1.0, 1.62, front - 1.6],
    });
    await act(page);
    assert.strictEqual(await page.evaluate(() => G.dirtyClothes), 0);
    await aim(page, "toilet", {
      localFrom: [width / 2 - 0.49, 1.62, front - 1.5],
    });
    await act(page);
    await act(page, "Shift+E");
    assert.ok(await page.evaluate(() => G.bladder < 2 && G.bowel < 2));
    await aim(page, "shower", {
      localAt: [width / 2 - 1.61, 1.91, front - 0.42],
      localFrom: [width / 2 - 1.12, 1.62, front - 1.75],
    });
    await act(page);
    await aim(page, "bed", {
      localAt: [-width / 2 + 0.9, 0.59, -0.15],
      localFrom: [-0.3, 1.62, -0.15],
    });
    await page.keyboard.press("ArrowUp");
    assert.strictEqual(await page.evaluate(() => W.sleepHours), 9);
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowDown");
    assert.strictEqual(await page.evaluate(() => W.sleepHours), 4);
    const before = await page.evaluate(() => G.minute);
    await act(page);
    assert.ok(
      await page.evaluate((before) => G.minute >= before + 239, before),
    );
    await page.keyboard.press("Tab");
    assert.strictEqual(await page.evaluate(() => W.glance), "notebook");
    await page.evaluate(() => worldWheel(1));
    assert.strictEqual(await page.evaluate(() => W.page), 1);
    await page.keyboard.press("Tab");
    await page.keyboard.press("t");
    assert.strictEqual(await page.evaluate(() => W.glance), "watch");
    await page.keyboard.press("t");
    console.log(
      "PASS physical book progress / cabinet-clothes / laundry / toilet / shower / bed-side duration / notebook / wristwatch",
    );
    // Persist a deliberately placed real prop through both local save and JSON export/import.
    const foodUID = await page.evaluate(
      () => G.inv.find((b) => b.id === "crackers").uid,
    );
    await aim(page, "stock:" + foodUID);
    await page.keyboard.press("e");
    await aim(page, "table", {
      localAt: [-0.7, 0.49, 0.75],
      localFrom: [-0.7, 1.62, 1.65],
    });
    await page.keyboard.press("r");
    const pose = await page.evaluate(
      () => G.inv.find((b) => Array.isArray(b.pose)).pose,
    );
    assert.strictEqual(await page.evaluate(() => validateSave(G)), true);
    assert.strictEqual(
      await page.evaluate(() => {
        const s = JSON.parse(JSON.stringify(G));
        s.inv.find((b) => b.pose).pose[0] = 100000;
        return validateSave(s);
      }),
      false,
    );
    assert.strictEqual(
      await page.evaluate(() => {
        const s = JSON.parse(JSON.stringify(G));
        s.inv.find((b) => b.pose).pose[1] = NaN;
        return validateSave(s);
      }),
      false,
    );
    await page.keyboard.press("Escape");
    assert.strictEqual(await page.locator("#worldPause").isVisible(), true);
    await page.locator("#worldSaveNow").click();
    const download = page.waitForEvent("download");
    await page.locator("#worldExport").click();
    const dl = await download;
    const savePath = path.join(artifacts, "physical-save.json");
    await dl.saveAs(savePath);
    assert.strictEqual(
      JSON.parse(fs.readFileSync(savePath, "utf8")).format,
      "closed365-v3",
    );
    await release(page);
    page = await context.newPage();
    await boot(page);
    await page.locator("#continueButton").click();
    await helpers(page);
    assert.strictEqual(await page.evaluate(() => phase), "playing");
    assert.deepStrictEqual(
      await page.evaluate(() => G.inv.find((b) => Array.isArray(b.pose)).pose),
      JSON.parse(JSON.stringify(pose)),
    );
    await page.keyboard.press("Escape");
    await page.locator("#worldPause .import-input").setInputFiles(savePath);
    // FileReader is asynchronous; wait for the actual import, not the pre-existing playing phase.
    await page
      .locator("#worldPause")
      .waitFor({ state: "hidden", timeout: 15000 });
    assert.strictEqual(await page.evaluate(() => phase), "playing");
    assert.strictEqual(await page.locator("#worldPause").isVisible(), false);
    // Existing v3 JSON does not need any new interaction fields.
    assert.strictEqual(
      await page.evaluate(() => {
        const s = JSON.parse(JSON.stringify(G));
        delete s.heldUID;
        delete s.tradeLocked;
        s.inv.forEach((b) => delete b.pose);
        return validateSave(s);
      }),
      true,
    );
    console.log(
      "PASS safe placements / reject invalid coordinates / local continue / JSON export-import / old v3 compatibility",
    );
    await helpers(page);
    await aim(page, "door", {
      localAt: [-0.35, 1.4, front - 0.16],
      localFrom: [-0.35, 1.62, front - 1.45],
    });
    const lockedSnapshot = await page.evaluate(() => JSON.stringify(G));
    await page.keyboard.press("Shift+E");
    assert.strictEqual(await page.evaluate(() => phase), "playing");
    assert.strictEqual(await page.evaluate(() => worldIsShopping()), false);
    assert.strictEqual(await page.evaluate(() => G.tradeLocked), true);
    await page.evaluate(() => {
      openShop(true);
      openShop(false);
      legacyUI.openShop(true);
      legacyUI.openShop(false);
      worldKit("year");
      worldCartChange("rice", 1);
      worldShopInteract("buy:rice");
      worldCheckout();
      storeLegacyBegin();
      putCartIntoState(cartSummary({ rice: 1 }));
      uiAction("resupply");
    });
    assert.strictEqual(
      await page.evaluate(() => JSON.stringify(G)),
      lockedSnapshot,
    );
    assert.strictEqual(await page.evaluate(() => phase), "playing");
    assert.strictEqual(await page.locator('[data-ui="resupply"]').count(), 0);
    console.log(
      "PASS post-start purchase forbidden: door / normal+legacy shop / checkout / direct insertion / kits / old resupply action; stock cash clock unchanged",
    );
    await release(page);
    page = null;
    await context.close();
    // Touch controls remain usable without hidden grid/panel interactions.
    page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await boot(page);
    await helpers(page);
    assert.strictEqual(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.locator("#newGameButton").click();
    await aim(page, "kit:starter", { from: [-5.2, 1.62, 1.6] });
    await page.locator("#mobileInteract").tap();
    await aim(page, "shopCheckout", { from: [-2.8, 1.62, 3.1] });
    await page.locator("#mobileInteract").tap();
    await page.evaluate(() => qaFinish());
    await aim(page, "bag:0", { from: [0, 1.62, front - 1.6] });
    await page.locator("#mobileInteract").tap();
    await page.evaluate(() => qaFinish());
    assert.strictEqual(await page.evaluate(() => G.bags[0].opened), true);
    await page.locator("#mobileInteract").tap();
    assert.ok(await page.evaluate(() => !!W.held), "mobile tap lifts one group out of the opened bag");
    await page.evaluate(() => qaDrop());
    await page.locator('[data-world="note"]').tap();
    assert.strictEqual(await page.evaluate(() => W.glance), "notebook");
    await page.locator('[data-world="up"]').tap();
    assert.strictEqual(await page.evaluate(() => W.page), 299);
    await page.locator('[data-world="note"]').tap();
    await page.locator("#worldPauseButton").tap();
    await page.locator("#worldResume").tap();
    assert.strictEqual(await page.evaluate(() => paused), false);
    assert.strictEqual(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await release(page);
    page = null;
    console.log(
      "PASS 390x844 touch shop / unpack / physical notebook / pause / no overflow",
    );
    // Explicitly disable WebGL: preserve the accessible legacy survival fallback.
    page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (/webgl/i.test(type)) return null;
        return original.call(this, type, ...args);
      };
    });
    await boot(page);
    assert.strictEqual(await page.evaluate(() => fallbackMode), true);
    assert.strictEqual(await page.evaluate(() => W.enabled), false);
    await page.locator("#newGameButton").click();
    await page.locator("#starterKit").click();
    await page.locator("#checkoutButton").click();
    await page.locator('[data-ui="room"]').click();
    await page.locator('[data-station="bags"]').click();
    await page.locator('[data-unpack="all"]').click();
    assert.strictEqual(await page.evaluate(() => countPackages()), 0);
    await release(page);
    page = null;
    console.log("PASS forced no-WebGL fallback still playable");
    assert.strictEqual(requests, 0);
    assert.deepStrictEqual(errors, []);
    console.log(
      "ALL PHYSICAL BROWSER TESTS PASSED; external requests=0; JS errors=0",
    );
  } finally {
    if (page) await release(page).catch(() => {});
    await browser.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
