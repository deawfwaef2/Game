// Browser smoke for chapter selection, full order book, and the hidden-clock room.
const {chromium}=require("playwright"),assert=require("assert"),fs=require("fs"),path=require("path");
const fileURL="file://"+path.resolve("index.html"),out=path.resolve("tests/artifacts/levels");fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];
 const shots=process.env.QA_SCREENSHOTS==="1";
 const snap=async(name,quality)=>{if(shots){await page.addStyleTag({content:".lv-overlay{backdrop-filter:none!important}"});await page.screenshot({path:path.join(out,name),type:"jpeg",quality,timeout:90000});}};
 page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(!/^(file:|data:|blob:)/.test(r.url()))requests.push(r.url());});
 await page.goto(fileURL,{waitUntil:"domcontentloaded",timeout:90000});
 await page.evaluate(()=>cancelAnimationFrame(animId));
 await page.evaluate(async()=>{if(typeof ROOM_READY!=="undefined") await ROOM_READY;});
 await page.locator("#chapterButton").waitFor({state:"visible"});
 assert.equal(await page.locator("#chapterButton").isDisabled(),false);
 await snap("01-title.jpg",82);
 await page.locator("#chapterButton").click();
 await page.locator("#lvPicker").waitFor({state:"visible"});
 assert.equal(await page.locator(".lv-chapter").count(),6);
 assert.equal(await page.locator(".lv-chapter:not([disabled])").count(),1);
 assert.equal(await page.locator("[data-lv-difficulty]").count(),3,"chapter picker offers three difficulty profiles");
 assert.equal(await page.locator('[data-lv-difficulty="standard"]').getAttribute("aria-pressed"),"true","standard difficulty is selected by default");
 assert.ok((await page.locator('[data-level-select="bellhouse"]').innerText()).includes("预算 · E$ 300"),"chapter cards show chapter-specific budget");
 await snap("02-chapter-book.jpg",84);
 await page.locator('[data-level-select="bellhouse"]').click();
 await page.waitForFunction(()=>phase==="shop"&&W.store,{timeout:30000});
 assert.equal(await page.evaluate(()=>lvPending),"bellhouse");
 assert.ok(await page.evaluate(()=>lvCatalogStock().length>1000));
 assert.ok(await page.evaluate(()=>lvPhysicalCatalog().length>0&&W.shopProducts.length>0),"physical chapter shelves must contain visible products");
 await page.locator("#worldCatalogButton").waitFor({state:"visible"});
 await page.locator("#worldCatalogButton").click();
 await page.locator("#lvOrderOverlay").waitFor({state:"visible"});
 assert.ok(await page.locator("#lvOrderGrid .lv-order-item").count()>0,"the order book opens with products instead of an empty catalogue");
 await page.locator("#lvOrderSearch").fill("机械腕表");
 await page.waitForFunction(()=>document.querySelectorAll("#lvOrderGrid .lv-order-item").length>0);
 assert.ok(await page.locator("#lvOrderGrid").innerText().then(t=>t.includes("安德士机械腕表")));
 await snap("03-order-book.jpg",84);
 await page.locator('[data-lv-cart="lv_mwatch"][data-delta="1"]').first().click();
 await page.locator("#lvOrderSearch").fill("干电池");
 await page.waitForFunction(()=>document.querySelectorAll("#lvOrderGrid .lv-order-item").length>0);
 await page.locator('[data-lv-cart="battery"][data-delta="1"]').first().click();
 assert.equal(await page.evaluate(()=>cart.lv_mwatch),1);
 assert.equal(await page.evaluate(()=>cart.battery),1);
 await page.locator("[data-order-checkout]").click();
 await page.waitForFunction(()=>!!W.busy,{timeout:10000});
 await page.evaluate(()=>{if(W.busy){W.busy.start-=W.busy.seconds*1000+30;worldFrame(performance.now(),0.1);}});
 await page.waitForFunction(()=>phase==="playing"&&!W.store,{timeout:30000});
 const report=await page.evaluate(()=>({
   chapter:G.level.id,hidden:timeHidden(),day:document.querySelector("#hudDay").textContent,hudHeaderVisible:getComputedStyle(document.querySelector("#hud .hud-header")).display!=="none",
   hudClock:document.querySelector("#hudClock").textContent,topRight:document.querySelector("#worldTopRight").textContent,
   label:document.querySelector("#worldDay").textContent,mechanism:(()=>{let found=false;roomRoot.traverse(o=>{if(o.userData.interact==="level:bell")found=true;});return found;})(),
   catalog:CATALOG.length,added:Object.keys(cart),wrist:lvWristLines(),
 }));
 assert.equal(report.chapter,"bellhouse");assert.equal(report.hidden,true);assert.equal(report.day,"—");assert.equal(report.hudHeaderVisible,false);
 assert.equal(await page.locator("#worldVitals").isVisible(),true,"needs bars stay visible at upper left in the room");
 assert.equal(await page.locator("#worldVitals .world-vital").count(),6,"all six survival needs have bars");
 assert.ok(!/\b\d{1,2}:\d{2}\b/.test(report.label));assert.equal(report.topRight,"");
 assert.ok(report.label.includes("借住的人"));assert.equal(report.mechanism,true);
 assert.ok(report.wrist[0]==="——","packed watch is not yet available to read");
 await snap("04-hidden-clock-room.jpg",84);
 assert.equal(errors.length,0,errors.join("\n"));assert.equal(requests.length,0,requests.join("\n"));
 console.log("PASS chapter picker / progression lock / large searchable order book / checkout / hidden clock / room fixture; external requests=0; JS errors=0");
 await page.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
