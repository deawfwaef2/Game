// Local street-view navigation: production camera movement, touch UI, collision paths, lifecycle, old saves.
const { chromium } = require("playwright"),
  assert = require("assert"),
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
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (!/^(file:|data:|blob:)/.test(r.url())) external.push(r.url());
    });
    await page.goto("file://" + path.resolve("index.html"), { timeout: 60000 });
    await page.evaluate(() => cancelAnimationFrame(animId));
    await page.evaluate(() => ROOM_READY);
    assert.strictEqual(await page.evaluate(() => R.ready && !R.error), true);
    assert.strictEqual(await page.evaluate(() => N.mode), "street");
    await page.locator("#newGameButton").tap();
    await page.evaluate(() => worldFrame(performance.now(), 0.016));
    assert.strictEqual(await page.locator("#navEdges").isVisible(), true);
    const shopPlans = await page.evaluate(() =>
      N.nodes.map((n) => ({
        id: n.id,
        reachable: !!navPlan(camera.position, n.point),
      })),
    );
    assert.strictEqual(shopPlans.length, 14);
    assert.ok(
      shopPlans.every((n) => n.reachable),
      JSON.stringify(shopPlans),
    );
    const yearStop = await arrive("year-plan");
    assert.strictEqual(yearStop.target, "kit:year");
    await page.locator("#mobileInteract").tap();
    assert.ok(await page.evaluate(() => cartSummary(cart).days >= 365));
    const register = await arrive("checkout");
    assert.strictEqual(register.target, "shopCheckout");
    await page.locator("#mobileInteract").tap();
    await page.evaluate(() => {
      W.busy.start -= W.busy.seconds * 1000 + 20;
      worldFrame(performance.now(), 0.1);
      unpackBag(0, true);
      worldFrame(performance.now(), 0.016);
    });
    assert.strictEqual(
      await page.evaluate(() => G.tradeLocked && !canPurchase()),
      true,
    );
    const inventory = await page.evaluate(() => JSON.stringify(G.inv)),
      cash = await page.evaluate(() => G.cash),
      minute = await page.evaluate(() => G.minute);
    async function arrive(id) {
      const result = await page.evaluate((id) => {
        const started = navGo(id),
          start = performance.now(),
          bad = [];
        let steps = 0;
        while (N.walking && steps++ < 350) {
          worldFrame(start + steps * 100, 0.1);
          if (!canMove(camera.position.x, camera.position.z))
            bad.push(camera.position.toArray());
        }
        for (let i = 0; i < 22; i++) worldFrame(start + (steps + i) * 100, 0.1);
        worldUpdateTarget();
        return {
          started,
          walking: N.walking,
          current: N.current,
          steps,
          bad,
          target: targetId,
          subtitle: document.querySelector("#worldSubtitle")?.textContent,
          position: camera.position.toArray(),
        };
      }, id);
      assert.strictEqual(result.started, true, id);
      assert.strictEqual(result.walking, false, id);
      assert.strictEqual(result.current, id, JSON.stringify(result));
      assert.deepStrictEqual(result.bad, [], id);
      return result;
    }
    const expected = {
      kitchen: "sink",
      bath: "toilet",
      bed: "bed",
      desk: "notebook",
      entry: "door",
      fridge: "fridge",
      stove: "stove",
    };
    for (const id of [
      "center",
      "kitchen",
      "bath",
      "bed",
      "desk",
      "entry",
      "fridge",
      "stove",
      "pantry",
      "wardrobe",
      "sofa",
    ]) {
      if (!(await page.evaluate((id) => N.nodes.some((n) => n.id === id), id)))
        continue;
      const r = await arrive(id);
      if (expected[id])
        assert.strictEqual(
          r.target,
          expected[id],
          id + " arrival faces the physical object",
        );
    }
    assert.strictEqual(
      await page.evaluate(() => JSON.stringify(G.inv)),
      inventory,
    );
    assert.strictEqual(await page.evaluate(() => G.cash), cash);
    assert.strictEqual(await page.evaluate(() => G.minute), minute);
    // Real mobile taps on the four-edge UI, rather than directly calling the route planner.
    await arrive("center");
    await page.evaluate(() => navRender(true));
    const edge = await page.evaluate(
      () => Object.entries(N.choices).find(([, id]) => id)?.[0],
    );
    assert.ok(edge);
    const chosen = await page.evaluate((dir) => N.choices[dir], edge);
    await page.locator('#navEdges [data-nav="' + edge + '"]').tap();
    assert.strictEqual(await page.evaluate(() => N.goal?.id), chosen);
    assert.strictEqual(await page.evaluate(() => N.walking), true);
    const before = await page.evaluate(() => camera.position.toArray());
    await page.locator("#navModeToggle").tap();
    assert.strictEqual(await page.evaluate(() => N.mode), "free");
    assert.strictEqual(await page.evaluate(() => N.walking), false);
    assert.deepStrictEqual(
      await page.evaluate(() => camera.position.toArray()),
      before,
    );
    const free = await page.evaluate(() => {
      const before = camera.position.clone();
      keys.KeyD = true;
      for (let i = 0; i < 3; i++) freeMovement(0.1);
      keys.KeyD = false;
      return before.distanceTo(camera.position);
    });
    assert.ok(free > 0.2, "free movement remains available");
    const pos = await page.evaluate(() => camera.position.toArray());
    await page.locator("#navModeToggle").tap();
    assert.deepStrictEqual(
      await page.evaluate(() => camera.position.toArray()),
      pos,
    );
    assert.strictEqual(
      await page
        .locator("#joystick")
        .evaluate((e) => getComputedStyle(e).display),
      "none",
    );
    for (const selector of [
      "#mobileInteract",
      '#worldMobile [data-world="use"]',
    ]) {
      const hit = await page.locator(selector).evaluate((e) => {
        const r = e.getBoundingClientRect();
        return (
          document
            .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
            ?.closest("button") === e
        );
      });
      assert.ok(hit, selector + " is not intercepted by navigation");
    }
    await arrive("kitchen");
    await page.locator("#mobileInteract").tap();
    assert.strictEqual(await page.evaluate(() => W.busy?.kind), "drink");
    await page.evaluate(() => {
      W.busy.start -= W.busy.seconds * 1000 + 20;
      worldFrame(performance.now(), 0.1);
    });
    assert.strictEqual(await page.evaluate(() => W.busy), null);
    await page.evaluate(() => {
      navGo("bath");
      for (let i = 0; i < 4; i++) worldFrame(performance.now() + i * 100, 0.1);
    });
    const pausePos = await page.evaluate(() => camera.position.toArray());
    await page.keyboard.press("Escape");
    assert.strictEqual(await page.evaluate(() => N.walking), false);
    await page.evaluate(() => {
      for (let i = 0; i < 8; i++) worldFrame(performance.now() + i * 100, 0.1);
    });
    assert.deepStrictEqual(
      await page.evaluate(() => camera.position.toArray()),
      pausePos,
    );
    await page.locator("#worldResume").tap();
    const saved = await page.evaluate(() => {
      navGo("desk");
      for (let i = 0; i < 3; i++) worldFrame(performance.now() + i * 100, 0.1);
      saveGame(false);
      return localStorage.getItem(SAVE_KEY);
    });
    const savedPos = JSON.parse(saved).position;
    await page.evaluate((s) => loadState(JSON.parse(s)), saved);
    assert.strictEqual(await page.evaluate(() => N.walking), false);
    assert.deepStrictEqual(
      await page.evaluate(() => camera.position.toArray()),
      savedPos.slice(0, 3),
    );
    assert.strictEqual(
      await page.evaluate(() => G.tradeLocked && !canPurchase()),
      true,
    );
    // Film mode does not blur the canvas, and can be disabled without changing gameplay.
    assert.strictEqual(await page.evaluate(() => C.film), true);
    assert.ok(
      !(
        await page.locator("#world").evaluate((e) => getComputedStyle(e).filter)
      ).includes("blur"),
    );
    await page.keyboard.press("Escape");
    await page.locator("#filmToggle").tap();
    assert.strictEqual(await page.evaluate(() => C.film), false);
    await page.locator("#worldResume").tap();
    const beforeLive = await page.evaluate(() => {
      navStop(false);
      navRefreshLayout();
      renderer.setPixelRatio(0.45);
      renderer.shadowMap.enabled = false;
      navGo("center");
      lastFrame = performance.now();
      animId = requestAnimationFrame(frameLoop);
      return G.minute;
    });
    await page.waitForFunction(() => !N.walking, null, { timeout: 45000 });
    await page.evaluate(() => cancelAnimationFrame(animId));
    assert.ok(
      await page.evaluate((m) => G.minute > m, beforeLive),
      "walking uses live simulation time, not teleport/skip",
    );
    // A freshly occurring knock stops an existing journey, but deliberate movement remains possible.
    const knock = await page.evaluate(() => {
      G.pendingKnock = false;
      navGo("desk");
      worldFrame(performance.now(), 0.1);
      G.pendingKnock = true;
      worldFrame(performance.now(), 0.1);
      const stopped = !N.walking;
      const deliberate = navGo("entry");
      navStop(false);
      G.pendingKnock = false;
      return { stopped, deliberate };
    });
    assert.deepStrictEqual(knock, { stopped: true, deliberate: true });
    const routeAudit = await page.evaluate(() => {
      toTitle();
      G = null;
      let tested = 0,
        mirrors = new Set(),
        sizes = new Set(),
        missing = [];
      for (let i = 0; i < 24; i++) {
        currentSeed = "NAV-AUDIT-" + i;
        env = environment(currentSeed);
        phase = "title";
        buildRoom(env);
        navRefreshLayout();
        const from = new THREE.Vector3(0, 1.62, env.d / 2 - 1.6);
        mirrors.add(env.mirror);
        sizes.add(env.w + "x" + env.d);
        for (const node of N.nodes) {
          const plan = navPlan(from, node.point);
          tested++;
          if (!plan) {
            missing.push([i, node.id]);
            continue;
          }
          if (!plan.points.every((p) => canMove(p.x, p.z)))
            missing.push([i, node.id, "unsafe waypoint"]);
        }
      }
      return { tested, mirrors: mirrors.size, sizes: sizes.size, missing };
    });
    assert.ok(routeAudit.tested >= 240);
    assert.strictEqual(routeAudit.mirrors, 2);
    assert.ok(routeAudit.sizes >= 6);
    assert.deepStrictEqual(routeAudit.missing, []);
    assert.strictEqual(
      await page.evaluate(() => camera.layers.test(C.root.children[0].layers)),
      true,
    );
    assert.strictEqual(
      await page.evaluate(() =>
        raycaster.layers.test(C.root.children[0].layers),
      ),
      false,
      "city meshes do not enter close-range interaction rays",
    );
    assert.ok(
      await page.evaluate(
        () =>
          C.stats.buildings === 6 &&
          C.stats.windows > 1000 &&
          C.stats.balconies >= 20,
      ),
    );
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(external, []);
    console.log(
      "NAVIGATION PASS:",
      JSON.stringify({
        shopStops: shopPlans.length,
        apartmentRoutes: true,
        touchArrows: true,
        freeSwitch: true,
        pauseLoadStop: true,
        liveClock: true,
        seedRouteAudit: routeAudit,
        externalRequests: 0,
        jsErrors: 0,
      }),
    );
    await page.evaluate(() => {
      renderer.dispose();
      renderer.forceContextLoss();
    });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
