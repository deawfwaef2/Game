// Usage: NODE_PATH=... PLAYWRIGHT_BROWSERS_PATH=... node tools/qa-probe.cjs <seed> "<js expression returning JSON-able value>"
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    p.on("console", (m) => m.type() === "warning" || m.type() === "error" ? console.log("CONSOLE", m.text()) : 0);
    await p.goto("file://" + path.resolve("index.html") + "#qa", { timeout: 90000 });
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.evaluate(() => ROOM_READY);
    await p.evaluate(async (seed) => { const s = document.querySelector("#seedInput"); if (s && seed) s.value = seed; roomStartSample(); await new Promise((r) => setTimeout(r, 300)); }, process.argv[2] || "");
    console.log(JSON.stringify(await p.evaluate(process.argv[3]), null, 1));
  } finally { await b.close(); }
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
