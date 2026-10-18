// UI screenshots: title, store overview, store product focus, apartment HUD (page screenshots incl. DOM text).
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
const OUT = path.resolve("tests/artifacts/ui");
const ONLY = process.argv[2];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const shot = async (p, name) => { await p.evaluate(() => { cancelAnimationFrame(animId); renderer.render(scene, camera); }); await p.waitForTimeout(700); await p.screenshot({ type: "jpeg", quality: 30, timeout: 120000 }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 72, timeout: 120000 }); console.log("saved", name); };
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    await p.goto("file://" + path.resolve("index.html"), { timeout: 90000 });
    await p.evaluate(() => { renderer.setPixelRatio(1); });
    await p.evaluate(() => ROOM_READY);
    if (!ONLY || ONLY === "title") await shot(p, "0-title");
    await p.evaluate(() => { document.querySelector("#newGameButton").click(); });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { cancelAnimationFrame(animId); });
    await shot(p, "1-store");
    await p.evaluate(() => { camera.position.set(-5.15, 1.5, -4.15); camera.lookAt(-5.15, 0.82, -5.25); lookYaw = camera.rotation.y; lookPitch = camera.rotation.x; worldUpdateTarget(); srUpdateCard(); });
    await p.waitForTimeout(400);
    await shot(p, "2-store-product");
    console.log(await p.evaluate(() => [targetId, document.getElementById("worldFocus")?.innerText]));
    await p.evaluate(() => { camera.position.set(-5.2, 1.62, 1.6); camera.lookAt(-5.2, 0.32, 3.243); lookYaw = camera.rotation.y; lookPitch = camera.rotation.x; worldUpdateTarget(); });
    await shot(p, "3-store-kit");
    await p.evaluate(() => { camera.position.set(-2.58, 1.55, -3.6); camera.lookAt(-2.58, 0.9, -5.3); lookYaw = camera.rotation.y; lookPitch = camera.rotation.x; worldUpdateTarget(); srUpdateCard(); });
    await shot(p, "3b-store-canned");
    await p.evaluate(() => { camera.position.set(0, 1.62, 1.6); camera.lookAt(0, 1.0, -5.3); lookYaw = camera.rotation.y; lookPitch = camera.rotation.x; worldUpdateTarget(); srUpdateCard(); });
    await shot(p, "3c-store-aisle");
    await p.goto("file://" + path.resolve("index.html") + "#sample", { timeout: 90000 }); await p.reload({ timeout: 90000 });
    await p.evaluate(() => ROOM_READY);
    await p.waitForFunction(() => typeof bagRoot !== "undefined" && bagRoot && bagRoot.children.length > 2, null, { timeout: 60000 }).catch(() => console.log("no bags"));
    await p.evaluate(() => { renderer.setPixelRatio(1); if (!bagRoot) return; const bag = bagRoot.children[2]; const pt = new THREE.Box3().setFromObject(bag).getCenter(new THREE.Vector3()); camera.position.copy(roomRoot.localToWorld(new THREE.Vector3(0.55, 1.62, env.d / 2 - 2.2))); camera.lookAt(pt); lookYaw = camera.rotation.y; lookPitch = camera.rotation.x; worldUpdateTarget(); });
    await shot(p, "4-room-hud");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
