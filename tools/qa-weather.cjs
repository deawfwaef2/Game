// Screenshots of rain and snow outside the window (3D) plus the body motion/relief overlays.
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
const OUT = path.resolve("tests/artifacts/weather");
const ONLY = process.argv[2];
const CASES0 = [
  ["0-rain-day", "rain", 11],
    ["2-rain-dusk", "rain", 18.4],
  ["3-snow-sill", "snow", 10, true],
  ["4-frost-morning", "frost", 8],
];
const CASES = ONLY ? CASES0.filter((c) => c[1] === ONLY) : CASES0;
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
    for (const [name, kind, h, sill] of CASES) {
      const info = await p.evaluate(([kind, h, sill]) => {
        cancelAnimationFrame(animId);
        env.temp = kind === "snow" ? 6 : kind === "frost" ? 4 : 22;
        if (kind === "frost") {
          G.minute = (244 - 1) * 1440 + h * 60; G.curtains = false; LB.precipK = 0; LB.frostK = 1; LB.coverK = 0; LB.coverHr = -1;
          renderer.setPixelRatio(1);
          if (typeof lightingWindow === "function") lightingWindow();
          lbWeather(performance.now(), 0.016);
          camera.position.copy(roomRoot.localToWorld(new THREE.Vector3(0.35, 1.6, -env.d / 2 + 1.3)));
          camera.lookAt(roomRoot.localToWorld(new THREE.Vector3(-0.1, 1.6, -env.d / 2)));
          renderer.render(scene, camera);
          return { out: lrOutdoor(244), frost: LB.frost?.visible, op: LB.frost?.material.opacity };
        }
        let found = -1;
        for (let d = 3; d < 365 && found < 0; d++) for (let m = 0; m < 1440; m += 30) if (lrPrecip((d - 1) * 1440 + m) === kind) { found = d; break; }
        // Pick that day and the hour closest to the requested one where it is still falling.
        let best = null;
        for (let m = 0; m < 1440; m += 10) { const t = (found - 1) * 1440 + m; if (lrPrecip(t) === kind && (best === null || Math.abs(m / 60 - h) < Math.abs(best % 1440 / 60 - h))) best = t; }
        G.minute = best; G.curtains = false; G.stats.food = 80; G.stats.water = 80; G.stats.energy = 80; G.stats.morale = 80; G.stats.health = 100; G.illness = [];
        LB.precipK = 1; LB.wetK = kind === 'rain' ? 1 : 0; LB.coverHr = -1; LB.coverK = kind === 'snow' ? 1 : 0;
        renderer.setPixelRatio(1);
        if (typeof lightingWindow === "function") lightingWindow();
        lbWeather(performance.now(), 0.016);
        camera.position.copy(roomRoot.localToWorld(sill ? new THREE.Vector3(0.1, 1.45, -env.d / 2 + 0.75) : new THREE.Vector3(0.35, 1.6, -env.d / 2 + 1.5)));
        camera.lookAt(roomRoot.localToWorld(sill ? new THREE.Vector3(-0.2, 1.12, -env.d / 2 - 0.25) : new THREE.Vector3(-0.1, 1.75, -env.d / 2)));
        renderer.render(scene, camera);
        return { day: found, hour: (best % 1440) / 60, mesh: LB.mesh?.userData.precip, visible: LB.mesh?.visible };
      }, [kind, h, sill]);
      await p.waitForTimeout(1200);
      await p.screenshot({ type: "jpeg", quality: 30, timeout: 120000 });
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(OUT, name + ".jpg"), quality: 72, type: "jpeg", timeout: 120000 });
      console.log("saved", name, JSON.stringify(info));
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
