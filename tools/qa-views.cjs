// Visual self-inspection: renders the realistic room from many fixed angles and saves JPEGs for human review.
// Usage: NODE_PATH=/var/tmp/closed365-qa/node_modules PLAYWRIGHT_BROWSERS_PATH=/var/tmp/closed365-browsers node tools/qa-views.cjs [seed] [filter]
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const OUT = path.resolve("tests/artifacts/views");
const seed = process.argv[2] || "closed-door-365", filter = process.argv[3] || "";
// [name, from(local x,y,z as fractions/offsets), at] expressed as functions of room width/depth.
const VIEWS = (w, d) => [
  ["01-entry-overview", [0.4, 1.62, d / 2 - 0.55], [-0.4, 1.0, -d / 2 + 0.6]],
  ["02-kitchen", [w / 2 - 1.7, 1.62, -d / 2 + 2.5], [w / 2 - 0.9, 0.95, -d / 2 + 0.4]],
  ["03-fridge-front", [w / 2 - 2.1, 1.55, -0.72], [w / 2 - 0.4, 0.85, -0.72]],
  ["04-fridge-angle", [w / 2 - 1.9, 1.6, 0.5], [w / 2 - 0.45, 0.8, -0.75]],
  ["05-fridge-open", [w / 2 - 1.75, 1.45, -0.35], [w / 2 - 0.42, 0.75, -0.72], "W.doors.fridge && (W.doors.fridge.open = true, W.doors.fridge.angle = 1.47, W.doors.fridge.hinge.rotation.y = 1.47 * W.doors.fridge.sign)"],
  ["06-stove-close", [w / 2 - 0.95, 1.6, -d / 2 + 1.45], [w / 2 - 0.4, 0.85, -d / 2 + 0.4]],
  ["07-bed-desk", [w / 2 - 2.2, 1.6, 0.4], [-w / 2 + 0.6, 0.6, -d / 2 + 0.8]],
  ["08-bathroom", [w / 2 - 1.6, 1.6, d / 2 - 2.3], [w / 2 - 0.4, 0.7, d / 2 - 0.4]],
  ["09-bath-basin", [w / 2 - 1.0, 1.55, d / 2 - 0.6], [w / 2 - 0.4, 0.9, d / 2 - 1.9]],
  ["10-door-bags", [0.3, 1.65, -0.1], [0.2, 0.7, d / 2 - 0.4]],
  ["11-wardrobe-sofa", [0.6, 1.6, -0.6], [-w / 2 + 1.0, 0.8, d / 2 - 0.6]],
  ["12-window", [0, 1.6, 0.4], [0, 1.4, -d / 2]],
  ["13-ceiling", [0, 1.4, 0.8], [0, 2.8, -0.6]],
  ["15-bag-close", [-0.62, 0.62, d / 2 - 1.7], [-0.62, 0.2, d / 2 - 0.9]],
  ["16-stocked-pantry", [w / 2 - 1.5, 1.35, 0.41], [w / 2 - 0.25, 0.9, 0.41], "G.inv.forEach((b) => { if (b.packed) { b.packed = false; b.location = DB[b.id].category === 'fresh' ? 'fridge' : 'shelf'; } }); syncRoom();"],
  ["17-stocked-fridge", [w / 2 - 1.5, 1.35, -0.72], [w / 2 - 0.42, 0.8, -0.72], "W.doors.fridge && (W.doors.fridge.open = true, W.doors.fridge.angle = 1.47, W.doors.fridge.hinge.rotation.y = 1.47 * W.doors.fridge.sign)"],
  ["18-stocked-shelf-close", [w / 2 - 0.95, 1.2, 0.2], [w / 2 - 0.25, 0.75, 0.5]],
  ["19-window-close", [0.75, 1.55, -d / 2 + 0.75], [0.45, 1.35, -d / 2]],
  ["20-window-sill", [-0.3, 1.45, -d / 2 + 0.7], [-0.6, 0.95, -d / 2 - 0.1]],
  ["21-radiator", [0.9, 0.75, -d / 2 + 1.0], [-0.5, 0.42, -d / 2]],
  ["22-bed-blanket", [-1.5, 1.5, -0.3], [-2.75, 0.45, 0.0]],
  ["23-bath-door", [w / 2 - 1.1, 1.6, d / 2 - 3.1], [w / 2 - 1.6, 1.1, d / 2 - 1.4]],
  ["24-tub", [w / 2 - 1.0, 1.65, d / 2 - 1.5], [w / 2 - 1.55, 0.4, d / 2 - 0.4]],
  ["25-kitchen-socket", [w / 2 - 1.3, 1.45, -d / 2 + 1.1], [w / 2 - 1.0, 1.05, -d / 2]],
  ["14-pantry", [w / 2 - 1.9, 1.5, 0.4], [w / 2 - 0.25, 0.8, 0.41]],
];(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
    p.on("pageerror", (e) => errors.push(e.stack));
    await p.goto("file://" + path.resolve("index.html") + "#qa", { timeout: 90000 });
    await p.evaluate(() => cancelAnimationFrame(animId));
    await p.evaluate(() => ROOM_READY);
    const mode = process.env.QA_MODE || "sample";
    await p.evaluate(async ([seed, mode]) => {
      if (mode === "sample") { if (seed) { const s = document.querySelector("#seedInput"); if (s) s.value = seed; } roomStartSample(); }
      if (typeof navSetMode === "function") navSetMode("free", true);
      if (typeof setFilmMode === "function") setFilmMode(false, false);
      renderer.setPixelRatio(1);
      await new Promise((r) => setTimeout(r, 300));
    }, [seed, mode]);
    if (process.env.QA_SETUP) await p.evaluate(process.env.QA_SETUP);
    if (process.env.QA_AO) await p.evaluate((on) => typeof setAmbientOcclusion === "function" && setAmbientOcclusion(on, false), process.env.QA_AO === "on");
    const dims = await p.evaluate(() => ({ w: env.w, d: env.d, mirror: env.mirror, seed: env.seed }));
    console.log("ROOM", JSON.stringify(dims));
    for (const [name, from, at, pre] of VIEWS(dims.w, dims.d)) {
      if (filter && !new RegExp(filter).test(name)) continue;
      if (pre) await p.evaluate(pre);
      const data = await p.evaluate(([from, at]) => {
        camera.position.copy(roomRoot.localToWorld(new THREE.Vector3(...from)));
        camera.lookAt(roomRoot.localToWorld(new THREE.Vector3(...at)));
        lookYaw = camera.rotation.y; lookPitch = camera.rotation.x;
        if (typeof worldFrame === "function") worldFrame(performance.now(), 0.016);
        camera.position.copy(roomRoot.localToWorld(new THREE.Vector3(...from)));
        camera.lookAt(roomRoot.localToWorld(new THREE.Vector3(...at)));
        scene.updateMatrixWorld(true);
        renderer.shadowMap.needsUpdate = true;
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL("image/jpeg", 0.82);
      }, [from, at]);
      fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(data.split(",")[1], "base64"));
      console.log("saved", name);
    }
    console.log("RENDER", JSON.stringify(await p.evaluate(() => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles }))));
    if (errors.length) console.log("ERRORS", errors);
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
