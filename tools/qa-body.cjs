// Screenshots of the body-state screen effects (CSS overlays need a real page screenshot, not canvas readback).
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
const OUT = path.resolve("tests/artifacts/body");
const CASES = [
  ["0-normal", "G.stats.food=80;G.stats.water=80;G.stats.energy=80;G.stats.morale=80;G.stats.health=100;"],
  ["1-hungry-thirsty", "G.stats.food=8;G.stats.water=10;"],
  ["2-exhausted-low", "G.stats.energy=4;G.stats.morale=12;"],
  ["3-sick-cold", "G.stats.health=22;G.illness=[{id:'cold',remaining:900}];G.weather={temp:-14,until:G.minute+9999};"],
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    await p.goto("file://" + path.resolve("index.html") + "#qa", { timeout: 90000 });
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.evaluate(() => ROOM_READY);
    await p.evaluate(async () => { roomStartSample(); await new Promise((r) => setTimeout(r, 500)); if (typeof navSetMode === "function") navSetMode("free", true); });
    for (const [name, js] of CASES) {
      await p.evaluate((js) => { G.stats.food = 80; G.stats.water = 80; G.stats.energy = 80; G.stats.morale = 80; G.stats.health = 100; G.illness = []; G.weather = { temp: 0, until: 0 }; LB.last = {}; eval(js); worldRenderHUD(); cancelAnimationFrame(animId); renderer.setPixelRatio(1); camera.position.copy(roomRoot.localToWorld(new THREE.Vector3(0.4, 1.62, env.d / 2 - 0.55))); camera.lookAt(roomRoot.localToWorld(new THREE.Vector3(-0.4, 1.0, -env.d / 2 + 0.6))); renderer.render(scene, camera); }, js);
      await p.waitForTimeout(1500);
      await p.evaluate(() => { cancelAnimationFrame(animId); LB.fx = lbTargets(); LB.blinkAt = performance.now() + 99999; lbTick(); });
      await p.screenshot({ type: "jpeg", quality: 30, timeout: 120000 });
      await p.waitForTimeout(800);
      await p.screenshot({ path: path.join(OUT, name + ".jpg"), quality: 70, type: "jpeg", timeout: 120000 });
      console.log("saved", name, JSON.stringify(await p.evaluate(() => [renderer.domElement.style.filter, document.getElementById("bodyLine").textContent, document.getElementById("bodyLids").className, document.getElementById("worldCondition").textContent])));
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
