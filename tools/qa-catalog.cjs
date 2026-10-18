// v0.17 visual QA: the per-seed stock on the shelves, a variant's product card, and the stock notice board.
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
const OUT = path.resolve("tests/artifacts/ui");
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const shot = async (p, name) => { await p.evaluate(() => { cancelAnimationFrame(animId); renderer.render(scene, camera); }); await p.waitForTimeout(700); await p.screenshot({ type: "jpeg", quality: 30, timeout: 180000 }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 72, timeout: 180000 }); console.log("saved", name); };
  const look = (p, pos, at) => p.evaluate(([pos, at]) => { camera.position.set(...pos); camera.lookAt(...at); lookYaw = camera.rotation.y; lookPitch = camera.rotation.x; worldUpdateTarget(); if (typeof srUpdateCard === "function") srUpdateCard(); return [targetId, document.getElementById("shopCard")?.innerText || ""]; }, [pos, at]);
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    await p.goto("file://" + path.resolve("index.html"), { timeout: 90000 });
    await p.evaluate(() => { renderer.setPixelRatio(1); });
    await p.evaluate(() => ROOM_READY);
    await p.evaluate(() => { document.querySelector("#seedInput").value = "QA-CATALOG-7"; });
    await p.evaluate(() => { document.querySelector("#newGameButton").click(); });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { cancelAnimationFrame(animId); });
    console.log(await p.evaluate(() => [currentSeed, CATALOG.length, shopStock().length, W.shopProducts.length]));
    if (process.argv[2] !== "sign") {
    console.log(await look(p, [-2.58, 1.5, -4.15], [-2.58, 0.82, -5.25]));
    await shot(p, "6-catalog-canned");
    console.log(await look(p, [4.85, 1.5, 1.15], [4.85, 0.82, 0.05]));
    await shot(p, "7-catalog-leisure");
    }
    console.log(await look(p, [-5.6, 1.6, 1.45], [-6.9, 1.72, 1.45]));
    await shot(p, "8-catalog-sign");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
