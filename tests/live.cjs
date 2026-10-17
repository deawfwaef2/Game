// Separate short check with the real RAF scheduler left running.
// CI lowers render resolution/shadows only; no state meters or clocks are reset.
const { chromium } = require("playwright");
const assert = require("assert"),
  path = require("path");
(async () => {
  const browser = await chromium.launch({
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 640 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(20000);
    await page.goto("file://" + path.resolve("index.html"));
    await page.evaluate(() => {
      renderer.setPixelRatio(0.6);
      renderer.shadowMap.enabled = false;
      sceneDirty = true;
    });
    await page.locator("#newGameButton").click();
    assert.strictEqual(await page.evaluate(() => worldIsShopping()), true);
    const initialZ = await page.evaluate(() => camera.position.z);
    await page.keyboard.down("w");
    await page.waitForFunction((z) => camera.position.z < z - 0.35, initialZ, {
      timeout: 15000,
    });
    await page.keyboard.up("w");
    const finalZ = await page.evaluate(() => camera.position.z);
    const yaw = await page.evaluate(() => lookYaw);
    await page.mouse.move(700, 240);
    await page.mouse.down();
    await page.mouse.move(770, 255, { steps: 3 });
    await page.mouse.up();
    assert.ok(Math.abs((await page.evaluate(() => lookYaw)) - yaw) > 0.1);
    await page.evaluate(() => {
      camera.position.set(-5.2, 1.62, 1.6);
      camera.lookAt(-5.2, 0.32, 3.243);
      lookYaw = camera.rotation.y;
      lookPitch = camera.rotation.x;
      worldUpdateTarget();
    });
    assert.strictEqual(await page.evaluate(() => targetId), "kit:starter");
    await page.keyboard.press("e");
    assert.strictEqual(await page.evaluate(() => cart.rice), 5);
    await page.evaluate(() => {
      camera.position.set(-2.8, 1.62, 3.1);
      camera.lookAt(-3, 1.16, 4.58);
      lookYaw = camera.rotation.y;
      lookPitch = camera.rotation.x;
      worldUpdateTarget();
    });
    assert.strictEqual(await page.evaluate(() => targetId), "shopCheckout");
    await page.keyboard.press("e");
    await page.waitForFunction(() => phase === "playing", null, {
      timeout: 20000,
    });
    await page.evaluate(() => {
      const point = new THREE.Box3()
        .setFromObject(bagRoot.children[0])
        .getCenter(new THREE.Vector3());
      camera.lookAt(point);
      lookYaw = camera.rotation.y;
      lookPitch = camera.rotation.x;
      worldUpdateTarget();
    });
    assert.ok((await page.evaluate(() => targetId)).startsWith("bag:"));
    await page.keyboard.press("Shift+E");
    await page.waitForFunction(() => countPackages() === 0, null, {
      timeout: 20000,
    });
    assert.strictEqual(await page.evaluate(() => panelType), "");
    assert.strictEqual(await page.evaluate(() => validateSave(G)), true);
    assert.deepStrictEqual(errors, []);
    console.log(
      "LIVE RAF PASS:",
      JSON.stringify({
        initialZ,
        finalZ,
        moved: initialZ - finalZ,
        checkout: true,
        unpacked: true,
        panels: 0,
        errors: 0,
      }),
    );
    await page.evaluate(() => {
      cancelAnimationFrame(animId);
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
