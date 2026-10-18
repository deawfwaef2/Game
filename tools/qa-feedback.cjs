// v0.16 visual QA: feedback chips after an action + focus hint with its effect line, in the real room.
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
(async () => { const b = await chromium.launch({ args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
 const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
 p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
 await p.goto("file://" + path.resolve("index.html") + "#qa", { timeout: 90000 }); await p.evaluate(() => ROOM_READY);
 await p.evaluate(async () => { cancelAnimationFrame(animId); renderer.setPixelRatio(1); roomStartSample(); await new Promise((r) => setTimeout(r, 500)); });
 await p.evaluate(() => { let t=null; roomRoot.traverse(o=>{ if(!t&&o.userData.interact==="shower") t=o; }); const c=new THREE.Box3().setFromObject(t).getCenter(new THREE.Vector3()); const room=roomRoot.localToWorld(new THREE.Vector3(0,1.62,0)); const dir=new THREE.Vector3(room.x-c.x,0,room.z-c.z).normalize(); camera.position.set(c.x+dir.x*1.6,1.62,c.z+dir.z*1.6); camera.lookAt(c.x,1.2,c.z); lookYaw=camera.rotation.y; lookPitch=camera.rotation.x; camera.updateMatrixWorld(true); worldUpdateTarget(); G.stats.hygiene=30; G.stats.morale=50;
   worldStart("打开花洒洗澡", 1, () => doAction("shower"), "shower"); worldFinishAction(); worldUpdateTarget(); worldRenderHUD(); clearTimeout(AU.chipT); renderer.render(scene,camera); });
 await p.waitForTimeout(800); await p.screenshot({ type: "jpeg", quality: 30, timeout: 180000 });
 await p.waitForTimeout(300); fs.mkdirSync("tests/artifacts/ui",{recursive:true}); await p.screenshot({ path: "tests/artifacts/ui/5-feedback.jpg", type: "jpeg", quality: 75, timeout: 180000 });
 console.log(await p.evaluate(() => [document.getElementById("auChips").textContent, document.querySelector("#worldFocus").innerText]));
 await b.close(); })();
