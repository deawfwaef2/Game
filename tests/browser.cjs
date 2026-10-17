// Focused offline/mobile/storage smoke. Run with NODE_PATH and browser path in README.
const { chromium } = require("playwright");
const assert = require("assert"),
  fs = require("fs");
(async () => {
  const browser = await chromium.launch({
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
  });
  let p;
  try {
    p = await context.newPage();
    p.setDefaultTimeout(15000);
    p.on("pageerror", (e) => errors.push(e.message));
    let network = 0;
    p.on("request", (r) => {
      if (!r.url().startsWith("file:") && !r.url().startsWith("data:"))
        network++;
    });
    await p.goto("file://" + process.cwd() + "/index.html");
    await p.waitForTimeout(400);
    assert.strictEqual(await p.evaluate(() => fallbackMode), false);
    console.log("FILE OFFLINE 3D: OK; external requests", network);
    // Stop the render scheduler for deterministic DOM testing on software GPU CI.
    // Game actions still execute the same production simulation; manual renders are checked below.
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.locator("#newGameButton").click();
    await p.locator("#starterKit").click();
    await p.locator('[data-category="hygiene"]').click();
    await p.locator("#shopSearch").fill("指甲");
    assert.strictEqual(await p.locator(".product-card").count(), 1);
    await p.locator('[data-product="nailclip"]').click();
    assert.ok((await p.locator("#panelTitle").textContent()).includes("指甲"));
    await p.locator("#closePanel").click();
    await p.locator("#shopSearch").fill("");
    await p.locator("#checkoutButton").click();
    await p.evaluate(() => {
      renderer.render(scene, camera);
    });
    await p.locator('[data-ui="room"]').click();
    await p.locator('[data-station="bags"]').click();
    await p.locator('[data-unpack="all"]').click();
    assert.strictEqual(await p.evaluate(() => countPackages()), 0);
    await p.locator("#closePanel").click();
    await p.locator('[data-ui="inventory"]').click();
    const firstFood = p.locator("[data-eat]").first();
    await firstFood.click();
    await p.locator("#qteSlow").click();
    await p.locator('[data-ui="room"]').click();
    await p.locator('[data-station="sink"]').click();
    await p.locator('[data-act="drink"]').click();
    await p.locator('[data-act="fill"]').click();
    assert.strictEqual(await p.evaluate(() => G.tank), 5);
    await p.locator("#closePanel").click();
    await p.locator('[data-ui="time"]').click();
    await p.locator('[data-hourset="4"]').click();
    await p.locator("#sleepNow").click();
    await p.locator('[data-ui="leisure"]').click();
    await p.locator("[data-book]").first().click();
    await p.locator("#closePanel").click();
    console.log(
      "Real UI: shopping/search/details/unpack/QTE/water/sleep/book OK",
    );
    assert.strictEqual(await p.evaluate(() => validateSave(G)), true);
    await p.evaluate(() => {
      renderer.render(scene, camera);
    });
    console.log(
      "Post-action WebGL context lost?",
      await p.evaluate(() => renderer.getContext().isContextLost()),
    );
    await p.locator('[data-ui="save"]').click();
    const download = p.waitForEvent("download");
    await p.locator('[data-ui="export"]').click();
    const dl = await download;
    await dl.saveAs("tests/artifacts/browser-save.json");
    assert.ok(dl.suggestedFilename().endsWith(".json"));
    const saved = JSON.parse(
      fs.readFileSync("tests/artifacts/browser-save.json", "utf8"),
    );
    assert.strictEqual(saved.format, "closed365-v3");
    await p.evaluate(() => {
      renderer.dispose();
      renderer.forceContextLoss();
    });
    await p.close();
    p = await context.newPage();
    p.setDefaultTimeout(30000);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + process.cwd() + "/index.html", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await p.waitForTimeout(400);
    await p.evaluate(() => cancelAnimationFrame(animId));
    assert.strictEqual(await p.locator("#continueButton").isDisabled(), false);
    await p.locator("#continueButton").click();
    assert.strictEqual(await p.evaluate(() => phase), "playing");
    await p.evaluate(() => cancelAnimationFrame(animId));
    console.log("File-origin save/export/reload/continue OK");
    await p.locator('[data-ui="save"]').click();
    await p
      .locator("#panel .import-input")
      .setInputFiles("tests/artifacts/browser-save.json");
    assert.strictEqual(await p.evaluate(() => phase), "playing");
    console.log("JSON import OK");
    await p.evaluate(() => {
      renderer.dispose();
      renderer.forceContextLoss();
    });
    await p.close();
    p = null;
    const phone = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    p = phone;
    p.setDefaultTimeout(15000);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + process.cwd() + "/index.html");
    await p.waitForTimeout(400);
    await p.evaluate(() => cancelAnimationFrame(animId));
    console.log(
      "Mobile title overflow",
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    );
    assert.strictEqual(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({
      path: "tests/artifacts/mobile-title.png",
      timeout: 15000,
    });
    await p.locator("#newGameButton").click();
    await p.locator("#starterKit").click();
    await p.screenshot({
      path: "tests/artifacts/mobile-shop.png",
      timeout: 15000,
    });
    await p.locator("#checkoutButton").click();
    await p.evaluate(() => {
      renderer.render(scene, camera);
    });
    await p.locator('[data-ui="room"]').click();
    await p.locator('[data-station="bags"]').click();
    await p.locator('[data-unpack="all"]').click();
    await p.locator("#closePanel").click();
    await p.evaluate(() => {
      paused = true;
      $("#pauseBanner").hidden = false;
    });
    await p.locator("#pauseBanner").click();
    assert.strictEqual(await p.evaluate(() => paused), false);
    console.log("Mobile checkout/unpack/tap-to-resume OK");
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.close();
    p = null;
    assert.deepStrictEqual(errors, []);
    console.log("BROWSER TESTS PASSED; JS errors = 0");
  } finally {
    if (p) {
      await p.evaluate(() => cancelAnimationFrame(animId)).catch(() => {});
      await p.close().catch(() => {});
    }
    await browser.close();
  }
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
