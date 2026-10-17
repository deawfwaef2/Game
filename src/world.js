/* v0.4 physical interaction layer. Daily play stays in the rendered world.
   Survival rules remain in core.js; old panels are a WebGL-unavailable fallback only. */
const W = {
  enabled: !fallbackMode && !!renderer,
  store: false, busy: null, held: null, glance: "", page: 0,
  rig: null, handModel: null, root: null, props: null, doors: {},
  focus: null, hit: null, sleepHours: 8, waitHours: 1,
  stockPage: 0, committing: false, lastHUD: 0, subtitleUntil: 0,
  savedRoomPosition: null, pauseOpen: false, preview: "", flash: null,
  textures: new Map(), productMaterials: new Map(), paperStamp: "",
  receiptPage: 0, receipts: [], clickStart: null, highlight: null,
};
const legacyUI = {
  updatePhase, openShop, openInventory, openRoom, openLeisure, openTime,
  openJournal, openCharacter, openStation, openSave, openHelp, toTitle,
  renderHUD, showToast, updateTarget, doInteract, getPlayerPosition, loadState,
};
function worldIsShopping() { return W.enabled && W.store && phase === "shop"; }
function worldIsBusy() { return W.enabled && !!W.busy; }
function worldBounds() { return worldIsShopping() ? {w: 14, d: 12} : env; }
function worldEyeHeight() {
  if (!W.enabled || !W.busy) return 1.62;
  const a = W.busy, t = clamp((performance.now() - a.start) / (a.seconds * 1000), 0, 1);
  return a.kind === "sleep" ? 1.62 - Math.sin(Math.PI * t) * .16 : 1.62;
}
function worldVisible() { return W.enabled && (phase === "playing" || worldIsShopping()); }
function worldTag(object, id, name = "", extra = {}) {
  object.userData.interact = id;
  object.userData.worldName = name;
  Object.assign(object.userData, extra);
  return object;
}
function worldMat(color, opts = {}) { return material(color, opts); }
function worldBox(parent, w, h, d, x, y, z, mat) {
  const m = addBox(w, h, d, x, y, z, mat, parent);
  m.castShadow = false;
  return m;
}
function worldCylinder(parent, rt, rb, h, x, y, z, mat) {
  const m = cylinder(rt, rb, h, x, y, z, mat, parent);
  m.castShadow = false;
  return m;
}
function worldClear(g) {
  if (!g) return;
  while (g.children.length) {
    const c = g.children.pop(); c.parent = null;
    c.traverse(o => {
      o.geometry?.dispose();
      const mats=Array.isArray(o.material)?o.material:[o.material];
      for(const m of mats){
        if(!m || Object.values(sceneMats).includes(m) || [...W.productMaterials.values()].includes(m))continue;
        if(m.map && ![...W.textures.values()].includes(m.map))m.map.dispose();
        m.dispose();
      }
    });
  }
}
function worldTextTexture(lines, opts = {}) {
  const width = opts.width || 512, height = opts.height || 256;
  const c = document.createElement("canvas"); c.width = width; c.height = height;
  const x = c.getContext("2d");
  x.fillStyle = opts.bg || "#dcd2b9"; x.fillRect(0,0,width,height);
  x.strokeStyle = opts.rule || "#5f54402e";
  x.strokeRect(9,9,width-18,height-18);
  const list = Array.isArray(lines) ? lines : [lines];
  const size = opts.size || 30, line = opts.line || size * 1.65;
  x.textAlign = opts.align || "center"; x.textBaseline = "middle";
  list.forEach((s,i) => {
    x.font = `${i === 0 && opts.heading ? size + 5 : size}px 'Noto Serif CJK SC','Songti SC','SimSun',serif`;
    x.fillStyle = i === 0 ? (opts.fg || "#3b3b30") : (opts.secondary || opts.fg || "#625d4e");
    x.fillText(String(s), opts.align === "left" ? 30 : width/2,
      opts.top ? opts.top + i*line : height/2 + (i-(list.length-1)/2)*line, width-52);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function worldLabel(parent, text, w, h, x, y, z, opts = {}) {
  const tex = worldTextTexture(text, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshStandardMaterial({map:tex, roughness:1, side:THREE.DoubleSide}));
  m.position.set(x,y,z); parent.add(m); return m;
}
function worldProductMaterial(it) {
  if (W.productMaterials.has(it.id)) return W.productMaterials.get(it.id);
  const colors = {staple:["#d3bf94","#5c573f"], canned:["#c5b995","#536b5e"], fresh:["#c9bba0","#6c7852"], drink:["#bfcbbd","#3c5d58"], hygiene:["#d4d2bf","#647363"], clean:["#c3c7b2","#4d6963"], medical:["#e0d8c4","#885e4d"], tool:["#c5b69a","#54564a"], leisure:["#465c56","#e4d6b5"], furniture:["#b4a184","#4c4c3e"]};
  const [bg, fg] = colors[it.category] || colors.tool;
  const name = it.name.replace(/ · .*$/, "").replace(/《|》/g, "");
  const lines = ["安德士 · 供销合作社", name, `${it.weight} kg   /   E$ ${it.price.toFixed(2)}`];
  const tex = worldTextTexture(lines,{bg,fg,size:25, width:512,height:256});
  W.textures.set(it.id, tex);
  const mat = new THREE.MeshStandardMaterial({map:tex, roughness:.85, side:THREE.DoubleSide});
  W.productMaterials.set(it.id,mat); return mat;
}
function worldProduct(id, parent = null) {
  const it = DB[id]; if (!it) return new THREE.Group();
  const g = new THREE.Group(); if (parent) parent.add(g);
  const label = worldProductMaterial(it), metal = worldMat("#9da69c",{metalness:.5,roughness:.45});
  const palette = {staple:"#c8b18a",canned:"#8d9c83",fresh:"#8a9569",drink:"#94b1a4",hygiene:"#c0cab6",clean:"#8aaca0",medical:"#d0c7ae",tool:"#737a6a",leisure:"#516258",furniture:"#88775c"};
  const base = worldMat(palette[it.category] || "#a19a82");
  let h=.22,w=.15,d=.10;
  if (it.kind === "book") {
    h=.26; w=.18; d=.045;
    worldBox(g,w,h,d,0,h/2,0,base);
    worldBox(g,w*.88,h*.91,d*1.03,.006,h/2,0,worldMat("#d7ceb6"));
    worldBox(g,.014,h,d*1.15,-w/2,h/2,0,base);
  } else if (it.category === "canned") {
    h=.16;w=.15;d=.15;
    worldCylinder(g,.074,.074,h,0,h/2,0,base);
    worldCylinder(g,.078,.078,.009,0,h,0,metal);
    worldCylinder(g,.077,.077,.008,0,.005,0,metal);
    worldBox(g,.025,.003,.017,.007,h+.005,0,metal);
  } else if (it.category === "drink" || ["soap","shampoo","dishsoap","disinfect","detergent"].includes(id) || it.capacity) {
    h=it.capacity ? .30 : .25;w=.14;d=.13;
    worldCylinder(g,.065,.069,h*.70,0,h*.35,0,base);
    worldCylinder(g,.026,.063,h*.17,0,h*.78,0,base);
    worldCylinder(g,.028,.028,h*.15,0,h*.93,0,worldMat("#e3dbc5"));
  } else if (id === "broom" || id === "mop") {
    h=.7; w=.16; d=.07;
    worldCylinder(g,.012,.013,.56,0,.42,0,worldMat("#937c59"));
    worldBox(g,.16,.14,.06,0,.07,0,worldMat(id==="broom"?"#ad976a":"#d0c8b0"));
  } else if (it.category === "staple") {
    h=it.weight>=2 ? .28 : .22; w=.19;d=.12;
    const body=worldBox(g,w,h,d,0,h/2,0,base); body.rotation.z=-.035;
    worldBox(g,w*.92,.02,d*.6,0,h+.006,0,worldMat("#aa9169"));
  } else if (it.category === "fresh") {
    h=.13;w=.17;d=.14;
    for (let i=0;i<3;i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),base);
      m.position.set((i-1)*.048,.06,(i%2)*.035);m.scale.y=.85;g.add(m);
    }
  } else {
    h=it.category==="medical"?.14:.19; w=.17;d=.07;
    worldBox(g,w,h,d,0,h/2,0,base);
    worldBox(g,w*.9,.014,d*1.04,0,h,0,worldMat("#bab59c"));
  }
  const front=new THREE.Mesh(new THREE.PlaneGeometry(w*.90,Math.min(h*.66,.16)),label);
  front.position.set(0,h*.50,d/2+.003);g.add(front);
  g.userData.productId=id;g.userData.height=h;
  return g;
}
function worldFindBase(id) {
  return roomRoot?.children.find(o=>o.userData.interact===id);
}
function worldDoor(id, hinge, sign=1) { W.doors[id]={hinge,sign,open:false,angle:0}; }
function installWorldRoom() {
  if (!W.enabled || !roomRoot || W.store) return;
  W.root=roomRoot;W.doors={};W.focus=null;W.hit=null;W.stockPage=0;
  W.props=new THREE.Group();roomRoot.add(W.props);
  const wood=sceneMats.wood, dark=sceneMats.darkwood, cream=worldMat("#c4c6b0"), iron=sceneMats.metal;
  const back=-env.d/2, front=env.d/2;
  const fridge=worldFindBase("fridge");
  if(fridge) {
    worldClear(fridge);
    worldBox(fridge,.82,1.55,.04,0,.81,-.33,cream);
    for(const x of [-.39,.39]) worldBox(fridge,.045,1.55,.70,x,.81,0,cream);
    for(const y of [.055,.52,.98,1.55]) worldBox(fridge,.78,.035,.68,0,y,0,cream);
    const hinge=groupAt(.405,0,.365,fridge);
    worldBox(hinge,.80,1.52,.055,-.40,.81,0,cream);
    worldBox(hinge,.025,.34,.055,-.70,.91,.055,iron);
    worldBox(hinge,.77,.014,.006,-.40,1.15,.034,iron);
    worldDoor("fridge",hinge,-1);
    const light=new THREE.PointLight("#f6e8bd",.8,1.7);light.position.set(0,1.37,.12);fridge.add(light);W.fridgeLight=light;
  }
  const wardrobe=worldFindBase("wardrobe");
  if(wardrobe) {
    worldClear(wardrobe);
    worldBox(wardrobe,.70,1.72,.035,0,.86,.26,wood);
    for(const x of [-.33,.33])worldBox(wardrobe,.04,1.72,.55,x,.86,0,wood);
    for(const y of [.06,.57,1.11,1.70])worldBox(wardrobe,.68,.035,.55,0,y,0,wood);
    const hinge=groupAt(-.35,0,-.30,wardrobe);
    worldBox(hinge,.70,1.71,.035,.35,.86,0,wood);
    worldBox(hinge,.025,.19,.04,.59,.9,-.04,iron);worldDoor("wardrobe",hinge,1);
    const clothes=worldTag(groupAt(0,.59,-.01,wardrobe),"changeclothes","换洗衣物");
    for(let i=0;i<3;i++)worldBox(clothes,.44,.065,.35,0,i*.068,0,worldMat(["#c4c7b2","#7d8c81","#a99474"][i]));
    W.clothesProp=clothes;
  }
  const bedside=worldFindBase("inspect");
  if(bedside) {
    worldClear(bedside);
    worldBox(bedside,.64,.54,.04,0,.27,-.22,wood);
    for(const x of [-.30,.30])worldBox(bedside,.04,.54,.48,x,.27,0,wood);
    for(const y of [.04,.53])worldBox(bedside,.64,.04,.48,0,y,0,wood);
    const drawer=worldTag(groupAt(0,0,.245,bedside),"drawer","床头抽屉");
    worldBox(drawer,.59,.38,.035,0,.29,0,wood);
    worldBox(drawer,.13,.023,.04,0,.32,.038,iron);
    W.drawer=drawer;W.drawerOpen=false;W.drawerOffset=0;
    const emergency=worldTag(groupAt(0,.19,0,bedside),"emergency","房东留下的应急纸包");
    worldBox(emergency,.35,.14,.23,0,0,0,worldMat("#bbad8d"));
    W.emergencyProp=emergency;
  }
  const desk=worldFindBase("desk");
  if(desk) {
    // The letter and notebook are individually selectable, not a desk menu.
    worldTag(desk.children[5],"notebook","手记");
    worldTag(desk.children[8],"bookpick","床边读物");
  }
  const pantry=worldTag(groupAt(env.w/2-.24,0,.41,roomRoot),"pantry","储物架");
  pantry.rotation.y=-Math.PI/2;W.pantry=pantry;
  for(const y of [.12,.49,.86,1.23,1.61])worldBox(pantry,1.35,.035,.39,0,y,0,wood);
  for(const x of [-.66,.66])worldBox(pantry,.04,1.65,.39,x,.83,0,dark);
  worldBox(pantry,1.35,1.65,.025,0,.83,-.19,wood);
  worldLabel(pantry,["食物 / 生活物资","拿起后使用，R放回"],.55,.15,0,1.75,-.10,{size:27});
  roomRoot.updateMatrixWorld(true);
  const pb=new THREE.Box3().setFromObject(pantry);
  colliders.push({minX:pb.min.x,maxX:pb.max.x,minZ:pb.min.z,maxZ:pb.max.z,minY:pb.min.y,maxY:pb.max.y});
  // Visible everyday objects anchor actions at their actual locations.
  const laundry=worldTag(groupAt(env.w/2-1.0,0,front-.46,roomRoot),"laundry","洗衣盆");
  worldCylinder(laundry,.21,.16,.18,0,.12,0,worldMat("#69857f"));
  const basin=worldCylinder(laundry,.185,.185,.012,0,.218,0,worldMat("#9aada2"));
  const broom=worldTag(groupAt(env.w/2-2.32,0,front-.88,roomRoot),"clean","扫帚与簸箕");
  worldCylinder(broom,.016,.016,1.17,0,.69,0,wood);
  worldBox(broom,.27,.18,.07,0,.10,0,worldMat("#baa578"));W.broomProp=broom;
  const hygiene=groupAt(env.w/2-.48,1.16,front-1.86,roomRoot);W.hygiene=hygiene;
  const tub=worldBox(hygiene,.53,.035,.21,0,0,0,cream);
  worldTag(tub,"hands","洗手台边沿");
  const candle=worldTag(groupAt(-.23,.51,.72,roomRoot),"candle","蜡烛托盘");
  worldCylinder(candle,.085,.085,.012,0,0,0,iron);
  worldCylinder(candle,.026,.026,.17,0,.09,0,worldMat("#dfd2ac"));W.candleProp=candle;
  const flame=new THREE.Mesh(new THREE.SphereGeometry(.017,8,6),new THREE.MeshBasicMaterial({color:"#ffc86e"}));
  flame.position.y=.192;flame.scale.y=1.8;candle.add(flame);W.flame=flame;
  W.localBooks=groupAt(-.25,0,back+.66,roomRoot);
  syncWorldRoom();
  if(phase==="playing" && G?.heldUID && G.inv.some(b=>b.uid===G.heldUID&&!b.packed&&b.units>0))worldEquip(G.heldUID,false);
  else { W.held=null;W.glance="";worldSetHand(); }
}
function syncWorldRoom() {
  if(!W.enabled || W.store || !W.props || W.root!==roomRoot) return;
  worldClear(W.props);
  const state=G && phase!=="title" ? G : null;
  if(bagRoot) {
    bagRoot.children.forEach((o,i)=>{
      const b=state?.bags.filter(x=>!x.opened)[i];
      if(b)worldTag(o,"bag:"+b.id,`${b.crate?"独立物资箱":"塑料采购袋"} · ${b.weight.toFixed(2)}kg`,{bagId:b.id});
    });
  }
  if(W.broomProp)W.broomProp.visible=!!state&&(has("broom")||has("mop"));
  if(W.clothesProp)W.clothesProp.visible=!!state&&(has("shirt")||has("underwear"));
  if(W.emergencyProp)W.emergencyProp.visible=!!state&&!state.emergencyUsed&&W.drawerOpen;
  if(W.candleProp)W.candleProp.visible=!!state&&(has("candle")||state.candleUntil>state.minute);
  if(W.flame)W.flame.visible=!!state&&state.candleUntil>state.minute;
  if(!state)return;
  if(pestRoot) {
    pestRoot.children.forEach(o=>{
      const kind=o.position.y>1?"helis":o.position.x>0?"balls":"cars";
      worldTag(o,"pest:"+kind,{cars:"小汽车",helis:"小直升机",balls:"小足球"}[kind]);
    });
  }
  const groups=new Map();
  for(const b of state.inv.filter(b=>!b.packed&&b.units>0&&b.uid!==W.held?.uid)) {
    // Each free-placed batch has its own real 3D object, separate from the rack.
    if(Array.isArray(b.pose)&&b.pose.length===4&&b.pose.every(Number.isFinite)) {
      const g=worldProduct(b.id,W.props);g.position.set(b.pose[0],b.pose[1],b.pose[2]);g.rotation.y=b.pose[3];
      worldTag(g,"stock:"+b.uid,DB[b.id].name,{uid:b.uid});continue;
    }
    const key=b.id+":"+(b.location==="fridge"?"fridge":"shelf");
    if(!groups.has(key))groups.set(key,b);
  }
  const shelf=[...groups.values()].filter(b=>b.location!=="fridge"&&DB[b.id].kind!=="book");
  const maxPage=Math.max(0,Math.ceil(shelf.length/24)-1);W.stockPage=clamp(W.stockPage,0,maxPage);
  shelf.slice(W.stockPage*24,W.stockPage*24+24).forEach((b,i)=>{
    const row=Math.floor(i/6),col=i%6;
    const g=worldProduct(b.id,W.props);g.scale.setScalar(.70);
    const pos=new THREE.Vector3((col-2.5)*.205,.14+row*.37,.04);
    W.pantry.localToWorld(pos);roomRoot.worldToLocal(pos);g.position.copy(pos);g.rotation.y=-Math.PI/2;
    worldTag(g,"stock:"+b.uid,DB[b.id].name,{uid:b.uid});
  });
  const fridge=worldFindBase("fridge");
  if(fridge) {
    [...groups.values()].filter(b=>b.location==="fridge").slice(0,9).forEach((b,i)=>{
      const g=worldProduct(b.id,W.props);g.scale.setScalar(.72);
      const pos=new THREE.Vector3((i%3-1)*.23,.13+Math.floor(i/3)*.46,.10);
      fridge.localToWorld(pos);roomRoot.worldToLocal(pos);g.position.copy(pos);
      worldTag(g,"stock:"+b.uid,DB[b.id].name,{uid:b.uid});
    });
  }
  [...groups.values()].filter(b=>DB[b.id].kind==="book").slice(0,12).forEach((b,i)=>{
    const g=worldProduct(b.id,W.props);g.scale.setScalar(.86);g.position.set(-.68+(i%6)*.15,.835+Math.floor(i/6)*.075,-env.d/2+.46);
    g.rotation.x=-Math.PI/2;g.rotation.z=.05*(i%3-1);
    worldTag(g,"stock:"+b.uid,DB[b.id].name,{uid:b.uid});
  });
  if(W.hygiene) {
    while(W.hygiene.children.length>1)W.hygiene.remove(W.hygiene.children.at(-1));
    ["scissors","nailclip","toothbrush"].filter(id=>has(id)).forEach((id,i)=>{
      const g=worldProduct(id,W.hygiene);g.scale.setScalar(.55);g.position.set(-.18+i*.18,.025,0);
      worldTag(g,"tool:"+id,DB[id].name);
    });
  }
  sceneDirty=true;
}
function worldArm(parent, side=1, reach=false) {
  const sleeve=worldMat("#4d5c55"),skin=worldMat("#c6a381");
  const g=new THREE.Group();parent.add(g);
  worldBox(g,.10,.21,.12,side*.21,-.29,.02,sleeve).rotation.z=side*-.12;
  worldBox(g,.078,.10,.085,side*.205,-.16,.025,skin);
  for(let i=0;i<4;i++) {
    const f=worldBox(g,.016,.064,.025,side*(.176+i*.018),-.115,.065,skin);
    f.rotation.x=-.16;
  }
  worldBox(g,.025,.062,.04,side*.155,-.151,.047,skin).rotation.z=-side*.42;
  return g;
}
function worldPaper(kind) {
  const g=new THREE.Group(),cover=worldMat(kind==="book"?"#465d54":"#625742");
  worldBox(g,.55,.36,.027,0,0,0,cover);
  const tex=worldTextTexture([""],{width:1024,height:768});
  const page=new THREE.Mesh(new THREE.PlaneGeometry(.523,.336),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
  page.position.z=.018;g.add(page);g.userData.page=page;g.userData.canvas=tex.image;
  worldBox(g,.003,.336,.002,0,0,.02,worldMat("#a99d82"));
  g.position.set(0,-.21,-.63);g.rotation.x=-.23;
  worldArm(g,-1);worldArm(g,1);g.userData.paperKind=kind;
  return g;
}
function worldMeal() {
  const g=new THREE.Group();
  worldCylinder(g,.115,.085,.08,0,0,0,worldMat("#d9d8c1"));
  worldCylinder(g,.105,.10,.015,0,.045,0,worldMat("#b79962"));
  for(let i=0;i<9;i++) {
    const m=new THREE.Mesh(new THREE.SphereGeometry(.014,6,5),worldMat(i%3?"#d3bc80":"#758262"));
    m.position.set(Math.sin(i*2.3)*.063,.059,Math.cos(i*1.8)*.063);g.add(m);
  }
  return g;
}
function worldSetHand(preview="") {
  if(!W.enabled||!camera)return;
  W.preview=preview;
  if(W.rig){camera.remove(W.rig);worldClear(W.rig);}
  if(camera.parent!==scene)scene.add(camera);
  const rig=new THREE.Group();camera.add(rig);W.rig=rig;W.handModel=null;W.paperStamp="";
  const held=W.held;
  if(W.glance||held?.type==="book") {
    const kind=W.glance||"book";
    if(kind==="watch") {
      const arm=new THREE.Group();rig.add(arm);arm.position.set(-.07,-.19,-.43);arm.rotation.set(.25,.05,-.6);
      worldBox(arm,.12,.39,.11,0,-.12,0,worldMat("#4d5b54"));
      worldBox(arm,.10,.16,.095,0,.13,0,worldMat("#c6a381"));
      worldBox(arm,.13,.09,.12,0,.01,.005,worldMat("#2c302d"));
      const dial=worldLabel(arm,["08:10","DAY 001"],.095,.073,0,.014,.069,{bg:"#d7d3b7",fg:"#3c453a",size:48,width:512,height:384});
      arm.userData.watch=dial;W.handModel=arm;
    } else { W.handModel=worldPaper(kind);rig.add(W.handModel);worldUpdatePaper(true); }
  } else if(held||preview) {
    const id=preview||held.id;
    const model=held?.prepared&&!preview?worldMeal():(id==="tap"?worldMeal():worldProduct(id));
    model.position.set(.24,-.31,-.46);model.rotation.set(.12,-.26,-.08);
    const h=model.userData.height||.13;
    const scale=id==="rice"?.70:Math.min(1,.26/h);model.scale.setScalar(scale);
    rig.add(model);W.handModel=model;
    const hand=new THREE.Group();rig.add(hand);hand.position.set(.09,-.09,-.47);hand.rotation.z=-.18;worldArm(hand,1);
  }
  rig.visible=worldVisible();sceneDirty=true;
}
function worldUpdatePaper(force=false) {
  const model=W.handModel;if(!model)return;
  if(W.glance==="watch") {
    const t=`${String(Math.floor(hour())).padStart(2,"0")}:${String(Math.floor(G.minute%60)).padStart(2,"0")}`;
    if(force||W.paperStamp!==t){
      const m=model.userData.watch;
      m.material.map.dispose();m.material.map=worldTextTexture([t,`DAY ${String(day()).padStart(3,"0")}`],{bg:"#d7d3b7",fg:"#3c453a",size:48,width:512,height:384});
      W.paperStamp=t;
    }return;
  }
  const c=model.userData.canvas;if(!c||(!G&&!worldIsShopping()))return;
  const stamp=JSON.stringify([Math.floor(G?.minute||0),W.glance,W.page,W.receiptPage,cart,W.held?.id,G?.stats,W.busy?.kind]);
  if(!force&&stamp===W.paperStamp)return;W.paperStamp=stamp;
  const x=c.getContext("2d"),cw=c.width,ch=c.height;
  x.fillStyle="#dfd4b9";x.fillRect(0,0,cw,ch);
  const grad=x.createLinearGradient(cw/2-20,0,cw/2+20,0);grad.addColorStop(0,"#5d513b00");grad.addColorStop(.5,"#5d513b44");grad.addColorStop(1,"#5d513b00");x.fillStyle=grad;x.fillRect(cw/2-20,0,40,ch);
  x.strokeStyle="#7d77531a";x.lineWidth=1;
  for(let y=158;y<ch-45;y+=55){x.beginPath();x.moveTo(30,y);x.lineTo(cw/2-30,y);x.moveTo(cw/2+30,y);x.lineTo(cw-30,y);x.stroke();}
  let left=[],right=[],title="生活手记",sub=worldIsShopping()?"ANDERS / 1986":`第 ${day()} 天  ·  ${temperature()}°C`;
  if(W.held?.type==="book"&&!W.glance) {
    const it=DB[W.held.id],p=G.books[it.id]?.pages||0;title=it.name;sub=`第 ${Math.round(p)} / ${it.pages} 页`;
    const stories={
      novel1:["火车在天亮以前停了。","他把信放进口袋，没有回头。","北边的山还落着雪，","而家里，也许已经开春了。","他记得母亲晾在窗边的衬衫，","以及那只永远慢五分钟的钟。"],
      novel2:["三月的公园没有人经过。","长椅还保持着冬天的颜色。","她在泥土里种下一粒种子，","决定再等一个星期。","生活并不会因为安静，","就停止生长。"],
      poetry:["远处的河，替我们继续流淌。","窗里的灯，守着一个名字。","把今天折好，夹进书中，","等明天醒来，再轻轻展开。"],
    };
    const text=stories[it.id]||["最后一班电车驶过旧城。","有人在窗边留下一盏灯。","故事里的人也有难眠的夜，","但日子总会慢慢走向清晨。","你翻过一页，听见楼外的风。","在这里，时间又属于自己。"];
    const off=(Math.floor(p/40)+W.page)%text.length;
    left=Array.from({length:8},(_,i)=>text[(i+off)%text.length]);
    right=["","窗外的城市仍在呼吸。","你把书翻到下一页。","","左键 / E · 安静阅读两小时","滚轮 · 翻阅片段","R · 放回，或放到桌上","（游戏原创阅读片段）"];
  } else if(W.glance==="receipt"&&worldIsShopping()) {
    title="供销合作社 · 购物清单";sub="E$ 预算 / 单袋承重8kg";
    const entries=Object.entries(cart).filter(([,q])=>q>0),sum=cartSummary(cart,restock),start=W.receiptPage*14;
    const lines=entries.slice(start,start+14).map(([id,q])=>`${DB[id].name.replace(/ · .*$/g,"")} ×${q}`);
    left=lines.slice(0,7);right=lines.slice(7,14);
    left.push(`总件数 ${sum.count} · ${sum.weight.toFixed(1)} kg`);
    right.push(`共 ${sum.bags.length} 袋 / ${sum.crates.length} 箱`,`应付 E$ ${sum.cost.toFixed(2)}`);
  } else if(W.page%3===1) {
    title="物资与房间";
    left=[`食物 ${availableFood().reduce((a,b)=>a+b.units,0).toFixed(0)} 份`,`储水 ${G.tank.toFixed(1)} / ${waterCapacity()} L`,`未拆 ${G.bags.filter(b=>!b.opened).length} 袋`,`现金 E$ ${G.cash.toFixed(2)}`,`餐具 ${G.dishes} · 垃圾 ${G.trash}`,`整洁 ${Math.round(100-G.dirt)} / 100`,`衣物 ${Math.round(G.clothes)} / 100`,`头发 ${G.hair.toFixed(1)} · 指甲 ${G.nails.toFixed(1)}`];
    right=[G.power?"电力正常":"停电中：照顾冷藏食物",G.waterOn?"供水正常":"停水中：使用储水",G.curtains?"窗帘已拉上":"窗帘敞开：夜间留意暴露",`暴露风险 ${Math.round(G.suspicion)} / 100`,...G.illness.map(i=>`${DISEASES[i.id].name} 约${Math.ceil(i.remaining/60)}小时`),"滚轮翻页 · Tab合上"];
  } else if(W.page%3===2) {
    title="记下今天";const entries=G.log.slice(0,4);
    const wrap=s=>s.match(/.{1,15}/gu)||[];
    left=entries.slice(0,2).flatMap(e=>wrap(e.text)).slice(0,9);
    right=entries.slice(2,4).flatMap(e=>wrap(e.text)).slice(0,9);
  } else {
    left=NEEDS.map(([k,n])=>`${n}    ${Math.round(G.stats[k])} / 100`);
    left.push(`小便 ${Math.round(G.bladder)}%`,`大便 ${Math.round(G.bowel)}%`);
    right=["WASD · 在房间里走动","拖动画面 · 环顾四周","E · 拿取 / 使用眼前物品","左键 · 使用手中的东西","R · 放置 / 放回物资","床边滚轮 · 调睡眠时长","Tab · 翻开或合上手记","滚轮翻页 · 你还在这里"];
  }
  x.textBaseline="middle";x.textAlign="center";x.fillStyle="#4c503d";x.font="30px 'Noto Serif CJK SC','Songti SC',serif";
  x.fillText(title,cw/4,60,cw/2-50);x.font="24px serif";x.fillStyle="#77715a";x.fillText(sub,cw*3/4,60,cw/2-50);
  [left,right].forEach((list,page)=>{x.textAlign="left";x.font="25px 'Noto Serif CJK SC','Songti SC',serif";list.slice(0,10).forEach((text,i)=>{x.fillStyle=i===0?"#414a3b":"#5e604c";x.fillText(text,page*cw/2+39,132+i*55,cw/2-75);});});
  x.textAlign="center";x.fillStyle="#928772";x.font="20px serif";x.fillText("1986 / ANDERS",cw/4,ch-35);x.fillText("把今天过好。",cw*3/4,ch-35);
  model.userData.page.material.map.needsUpdate=true;
}
function worldEquip(uidValue,split=true) {
  const b=G?.inv.find(x=>x.uid===uidValue);if(!b||b.packed||b.units<=0)return;
  if(W.busy)return;
  if(W.held?.uid===b.uid)return;
  if(W.held)worldPutBack(false);
  let chosen=b;
  if(split && b.units>DB[b.id].servings && DB[b.id].kind!=="book") {
    const units=DB[b.id].servings;b.units-=units;chosen={...b,uid:uid(),units};delete chosen.pose;G.inv.push(chosen);
  }
  delete chosen.pose;
  W.held={uid:chosen.uid,id:chosen.id,type:DB[chosen.id].kind==="book"?"book":"item",prepared:false};
  G.heldUID=chosen.uid;W.glance="";W.page=0;worldSetHand();syncWorldRoom();saveGame(false);worldSfx(500,.04);
}
function worldPutBack(place=true) {
  if(W.busy)return;
  if(W.glance){W.glance="";worldSetHand();return;}
  if(!W.held)return;
  const b=G.inv.find(x=>x.uid===W.held.uid);
  if(b) {
    const hit=W.hit;
    const id=targetId;
    if(place && id==="fridge"&&W.doors.fridge?.open){b.location="fridge";delete b.pose;}
    else if(place && id==="pantry"){b.location="shelf";delete b.pose;}
    else if(place && hit?.point && hit.distance<2.4 && hit.face) {
      const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if(normal.y>.75 && hit.point.y<1.35) {
        const p=roomRoot.worldToLocal(hit.point.clone());
        b.pose=[clamp(p.x,-env.w/2+.15,env.w/2-.15),clamp(p.y+.013,.025,1.35),clamp(p.z,-env.d/2+.15,env.d/2-.15),lookYaw*(env.mirror?-1:1)];
        b.location=Math.abs(p.x+.6)<.65&&Math.abs(p.z-.8)<.4?"table":"room";
      } else {b.location="shelf";delete b.pose;}
    } else {b.location="shelf";delete b.pose;}
  }
  W.held=null;G.heldUID=null;worldSetHand();syncWorldRoom();saveGame(false);worldSfx(300,.04);
}
function worldGlance(kind="notebook") {
  if(!worldVisible()||W.busy)return;
  W.glance=W.glance===kind?"":kind;W.page=0;worldSetHand();worldRenderHUD();
}
function worldStart(label,seconds,commit,kind="use",preview="") {
  if(!worldVisible()||paused||W.busy||G?.ended)return false;
  W.busy={label,seconds,start:performance.now(),commit,kind,good:false,missed:false};
  keys={};W.focus=null;$("#worldFocus").classList.remove("on");
  $("#worldAction").hidden=false;$("#worldAction span").textContent=label;
  $("#worldAction small").textContent=kind==="eat"?"光圈亮起时按空格；也可等待慢慢吃完":"Esc 暂停 / 取消本次动作";
  if(preview)worldSetHand(preview);
  if(kind==="sleep")$("#worldFade").classList.add("sleeping");
  sceneDirty=true;return true;
}
function worldFinishAction() {
  const a=W.busy;if(!a)return;
  W.busy=null;W.committing=true;
  try {a.commit(a);}finally {W.committing=false;}
  $("#worldAction").hidden=true;$("#worldBite").className="";
  $("#worldFade").classList.remove("sleeping");
  if(W.held && !G?.inv.some(b=>b.uid===W.held.uid&&b.units>0)){W.held=null;if(G)G.heldUID=null;}
  worldSetHand();syncWorldRoom();worldRenderHUD();if(G)saveGame(false);
  const entry=G?.log[0];if(entry&&phase==="playing")showToast(entry.text,entry.type);
}
function worldCancelAction() {
  if(!W.busy)return;
  W.busy=null;$("#worldAction").hidden=true;$("#worldBite").className="";
  $("#worldFade").classList.remove("sleeping");worldSetHand();
}
function worldBite() {
  if(W.busy?.kind!=="eat")return;
  const p=((performance.now()-W.busy.start)/1000)%1.6;
  if(p>.70&&p<1.14){W.busy.good=true;W.busy.seconds=Math.min(W.busy.seconds,(performance.now()-W.busy.start)/1000+.55);worldSfx(750,.05);}
  else {W.busy.missed=true;showToast("慢一点，下一口再稳稳接住。");}
}
function worldAction(action,label,seconds=2,value="",preview="") {
  return worldStart(label,seconds,()=>doAction(action,value),action==="sleep"?"sleep":action,preview);
}
function worldUseHeld() {
  if(!W.held||W.busy||paused)return;
  const b=G.inv.find(x=>x.uid===W.held.uid);if(!b)return;
  const it=DB[b.id];
  if(it.kind==="book")return worldStart("翻过几页，让时间慢下来",4,()=>doRead(it.id),"read");
  if(it.kind==="food") {
    if(isSpoiled(b)||b.contaminated)return showToast("这份食物不安全。拿到垃圾桶前按 R 丢弃。","warn");
    if(it.ingredient)return showToast("这是配料，做主食时会自动搭配。R 放回储物架。");
    if(it.cook&&!W.held.prepared) {
      if(!["stove","kitchen"].includes(targetId))return showToast("先拿到电炉前烹煮；免煮食物可以直接吃。");
      if(!G.power&&!(has("stove")&&amount("fuel")>=1))return showToast("需要电力，或便携炉与燃料块。","warn");
      if(!canTap()&&G.tank<.3)return showToast("烹煮还需要0.3L水。","warn");
      return worldStart("锅里的水轻轻沸腾",4,()=>{W.held.prepared=true;showToast("做好了。左键 / E 吃饭，也可以先端到桌边。");},"cook");
    }
    return worldStart("好好吃完这一餐",6,a=>consumeMeal(b.uid,!a.missed||a.good,!a.good),"eat");
  }
  if(it.kind==="drink")return worldStart(it.brew?"泡好这一杯":"慢慢喝一点",2.4,()=>actDrink(b.uid),"drink");
  if(it.kind==="medicine")return worldStart("按份使用护理物资",2,()=>takeMedicine(b.uid),"medicine");
  if(it.kind==="leisure")return worldStart("让独处的时间柔和一点",4,()=>doLeisure(it.id),"leisure");
  const acts={broom:["clean","扫过地面",4],mop:["clean","擦拭地面",4],scissors:["hair","对着镜子修短头发",3],nailclip:["nails","修剪指甲",2],toothbrush:["teeth","刷好牙",2],soap:["hands","洗净双手",2],shirt:["change","换上干净衣物",2],underwear:["change","换好衣物",2],detergent:["laundry","手洗换下的衣物",4],dishsoap:["dishes","洗净碗碟",3],repair:["repair","检查水电线路",4],candle:["candle","点亮一根蜡烛",2],bottle:["fill","接满储水容器",3],canister:["fill","接满储水容器",3],flashlight:["inspect","用手电检查家具",3],carpowder:["clearcars","收纳小汽车",2],swatter:["clearhelis","收纳小直升机",2],balltrap:["clearballs","收纳小足球",2]};
  const a=acts[it.id];if(a)return worldAction(a[0],a[1],a[2]);
  showToast("这件物资会在生活中自动发挥作用。R 放回，或对准平面放置。");
}
function worldTargetInfo(o) {
  const id=o?.userData.interact||"";
  if(!id)return ["",""];
  if(id.startsWith("stock:")) {
    const b=G?.inv.find(x=>x.uid===o.userData.uid),it=b&&DB[b.id];
    return [it?.name||"物资",`E 拿起${b&&(isSpoiled(b)||b.contaminated)?" · 不宜食用":""}  ·  ${b?Math.ceil(b.units):0}份/次`];
  }
  if(id.startsWith("bag:"))return [o.userData.worldName,"E 拆开这一袋  ·  按住 Shift + E 连续整理所有袋子"];
  if(id.startsWith("pest:"))return [o.userData.worldName,"E 使用对应工具收纳  ·  隐藏总数未知"];
  if(id.startsWith("tool:"))return [o.userData.worldName,"E 直接使用"];
  const names={
    bed:["旧床",`E 躺下睡 ${W.sleepHours} 小时  ·  滚轮 / ↑↓ 调时长`],
    sofa:["旧沙发",`E 安静坐 ${W.waitHours} 小时  ·  滚轮调时长  ·  Shift+E 伸展`],
    sink:["水槽",`E 接水喝  ·  R 接满储水容器${G&&!G.waterOn?" · 目前停水":""}`],
    stove:["单眼电炉",W.held?"E 烹煮手里的主食  ·  左键使用":"从架子上拿一份主食，再到这里烹煮"],
    kitchen:["料理台",W.held?"E 烹煮  ·  R 放置手中物资":"E 清洗餐具  ·  水槽可以接水"],
    fridge:["旧冰箱",`E ${W.doors.fridge?.open?"关上":"打开"}冰箱门${W.held?"  ·  R 放入冷藏":""}`],
    wardrobe:["旧衣柜",`E ${W.doors.wardrobe?.open?"关上":"打开"}柜门`],
    changeclothes:["叠好的换洗衣物","E 换上一套干净衣物"],
    drawer:["床头抽屉",`E ${W.drawerOpen?"推回":"拉开"}抽屉  ·  Shift+E 检查家具底部`],
    inspect:["床头柜","E 检查家具  ·  看向抽屉可拉开"],
    emergency:["房东的应急纸包","E 拆开  ·  只够应急一次"],
    table:["小餐桌",W.held?"左键 / E 使用手中物品  ·  对准桌面按 R 放下":"E 擦净桌面与碗碟  ·  可把物资摆在桌面"],
    desk:["书桌","E 拿起一本读物  ·  Tab 翻开手记"],
    bookpick:["床边读物","E 拿起拆出的第一本书"],
    notebook:["生活手记","E 翻开  ·  滚轮翻页"],journal:["墙上的旧日历","E 翻开手记，看看自己过得怎样"],
    radio:["旧收音机","E 收听广播一小时  ·  需拆出收音机"],
    toilet:["卫生间","E 处理小便  ·  Shift+E 处理大便"],
    shower:["淋浴区","E 打开花洒洗澡  ·  需要水"],
    laundry:["洗衣盆","E 手洗脏衣物  ·  需要水与洗衣粉"],
    clean:["扫帚与簸箕","E 扫净房间  ·  Shift+E 检查几何干扰物"],
    trash:["垃圾桶",W.held?"R 丢弃手里的这一包  ·  E 密封并清走变质物资":"E 密封垃圾，清走变质物资"],
    mirror:["浴室镜子","E 修剪指甲  ·  Shift+E 理发  ·  工具在镜子下方"],hands:["盥洗位置","E 洗手  ·  Shift+E 刷牙"],
    window:["窗帘",`E ${G?.curtains?"拉开一点":"拉上"}窗帘`],
    door:["入户门",G?.pendingKnock?"E 保持安静，等脚步远去  ·  Shift+E 看猫眼":"E 看一眼猫眼  ·  Shift+E 联系地下补给"],
    pantry:["储物架",`E 查看这一格的第一件物资  ·  滚轮换格${W.held?"  ·  R 归还":""}`],
    candle:["蜡烛托盘","E 点亮一根蜡烛  ·  持续六小时"],
  };
  return names[id]||[o.userData.worldName||"物品","E 使用"];
}
function worldUpdateTarget() {
  if(!W.enabled)return legacyUI.updateTarget();
  W.focus=null;W.hit=null;targetId="";targetObject=null;
  if(!worldVisible()||panelType||paused||W.busy||W.glance) {
    $("#worldFocus").classList.remove("on");$("#worldDot").classList.remove("focused");return;
  }
  camera.updateMatrixWorld(true);
  roomRoot.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(roomRoot.children,true);
  for(const hit of hits) {
    if(hit.distance>2.65)break;
    let visible=true;for(let p=hit.object;p;p=p.parent){if(!p.visible){visible=false;break;}}
    if(!visible||hit.object.userData.noPick)continue;
    if(hit.object.material?.transparent&&hit.object.material.opacity<.4)continue;
    W.hit=hit;
    let o=hit.object;
    while(o&&o!==roomRoot&&!o.userData.interact)o=o.parent;
    if(o&&o!==roomRoot&&o.userData.interact){W.focus=o;targetObject=o;targetId=o.userData.interact;}
    // A solid surface always occludes objects behind it. No through-wall interaction.
    break;
  }
  const [name,hint]=worldTargetInfo(W.focus);
  $("#worldFocus strong").textContent=name;$("#worldFocus span").textContent=hint;
  $("#worldFocus").classList.toggle("on",!!W.focus);
  $("#worldDot").classList.toggle("focused",!!W.focus);
}
function worldInteract(shift=false) {
  if(!W.enabled)return legacyUI.doInteract();
  if(!worldVisible()||paused||panelType)return;
  if(W.busy){if(W.busy.kind==="eat")worldBite();return;}
  if(W.glance){worldGlance(W.glance);return;}
  const id=targetId;
  if(worldIsShopping())return typeof worldShopInteract==="function"?worldShopInteract(id,shift):undefined;
  if(id.startsWith("stock:"))return worldEquip(W.focus.userData.uid);
  if(id.startsWith("bag:"))return worldStart(shift?"把门边的物资收好":"解开袋口，收好物资",shift?3:1.1,()=>unpackBag(W.focus?.userData.bagId??Number(id.slice(4)),shift),"unpack");
  if(id.startsWith("pest:"))return worldAction({cars:"clearcars",helis:"clearhelis",balls:"clearballs"}[id.slice(5)],"把几何小东西收纳走",2);
  if(id.startsWith("tool:")) {
    const a={scissors:["hair","修短头发"],nailclip:["nails","修剪指甲"],toothbrush:["teeth","刷好牙"]}[id.slice(5)];
    if(a)return worldAction(a[0],a[1],2,"",id.slice(5));
  }
  if(id==="fridge"||id==="wardrobe") {
    const d=W.doors[id];if(d){d.open=!d.open;worldSfx(d.open?210:180,.1);sceneDirty=true;}return;
  }
  switch(id) {
    case "bed": return worldAction("sleep",`睡 ${W.sleepHours} 小时`,3,W.sleepHours);
    case "sofa":return shift?worldAction("exercise","安静地做一组伸展",3):worldAction("wait",`在沙发上安静坐 ${W.waitHours} 小时`,2.5,W.waitHours);
    case "sink":return shift?worldAction("hands","洗净双手",2):worldStart("接一杯水，慢慢喝完",2.4,()=>actDrink("tap"),"drink","tap");
    case "stove":if(W.held)return worldUseHeld();showToast("先从储物架上拿一份主食。");return;
    case "kitchen":if(W.held)return worldUseHeld();return worldAction("dishes","把碗碟洗干净",2.5);
    case "table":if(W.held)return worldUseHeld();return worldAction("dishes","洗好碗碟，擦净桌面",2.5);
    case "drawer":if(shift)return worldAction("inspect","蹲下检查家具底部",3);W.drawerOpen=!W.drawerOpen;syncWorldRoom();return;
    case "emergency":return worldAction("emergency","拆开房东留下的应急纸包",2);
    case "inspect":return worldAction("inspect","检查床头与家具下面",3);
    case "changeclothes":return worldAction("change","换上干净衣物",2);
    case "toilet":return worldAction(shift?"poop":"pee","照顾好个人需要",2);
    case "shower":return worldAction("shower","打开花洒，冲去疲惫",3.5);
    case "laundry":return worldAction("laundry","手洗并晾好换下的衣物",3.5);
    case "clean":return worldAction(shift?"inspect":"clean",shift?"检查房间的角落":"扫净地板，收拾房间",3.5);
    case "trash":return worldAction("trash","密封垃圾，清走变质物资",2);
    case "mirror":return worldAction(shift?"hair":"nails",shift?"修短头发":"修剪指甲",2.5);
    case "hands":return worldAction(shift?"teeth":"hands",shift?"刷好牙":"洗净双手",2);
    case "window":return worldAction("curtains",G.curtains?"拉开一点窗帘":"把窗帘拉上",.7);
    case "door":
      if(G.pendingKnock)return worldAction(shift?"peek":"silence",shift?"悄悄看一眼猫眼":"保持安静，等脚步声远去",2.5);
      if(shift)return openShop(true);
      return worldAction("peek","看一眼空荡的楼道",1.3);
    case "candle":return worldAction("candle","点亮一根蜡烛",1.4);
    case "notebook":case "journal":return worldGlance();
    case "bookpick":case "desk": {
      const b=G.inv.find(b=>!b.packed&&DB[b.id].kind==="book");
      if(b)return worldEquip(b.uid);showToast("先把采购袋里的书拆出来。");return;
    }
    case "radio":if(!has("radio"))return showToast("先拆出自己买的收音机。");return worldStart("坐下来听一会儿广播",4,()=>doLeisure("radio"),"leisure");
    case "pantry":{
      const obj=W.props.children.find(o=>o.userData.uid&&G.inv.find(b=>b.uid===o.userData.uid)?.location!=="fridge");if(obj)return worldEquip(obj.userData.uid);showToast("储物架空了，看看门边还有没有未拆的袋子。");return;
    }
  }
  if(W.held)return worldUseHeld();
  showToast("走近物品，把准星对准它，再按 E。");
}
function worldAlternate() {
  if(W.busy||!worldVisible()||paused)return;
  if(worldIsShopping())return typeof worldShopAlternate==="function"?worldShopAlternate():undefined;
  if(targetId==="trash"&&W.held) {
    const b=G.inv.find(b=>b.uid===W.held.uid);if(b){G.inv=G.inv.filter(x=>x!==b);G.trash++;logEvent(`把${DB[b.id].name}丢进垃圾桶。`);}W.held=null;G.heldUID=null;worldSetHand();syncWorldRoom();saveGame(false);return;
  }
  if(targetId==="sink"&&!W.held)return worldAction("fill","把储水容器接满",2.7);
  worldPutBack(true);
}
function worldRenderHUD() {
  if(!W.enabled)return legacyUI.renderHUD();
  const visible=worldVisible();$("#worldHUD").hidden=!visible;
  if(W.rig)W.rig.visible=visible;
  if(!visible)return;
  const shopping=worldIsShopping();
  $("#worldDay").textContent=shopping?"最后一次采购":`第 ${String(Math.min(day(),365)).padStart(3,"0")} 天`;
  $("#worldPlace").textContent=shopping?"安德士 · 街角供销社":`北区旧公寓 / ${env.number}`;
  if(shopping) {
    const s=cartSummary(cart,restock),budget=restock?G.cash:300;
    $("#worldTopRight").textContent=`余 E$ ${(budget-s.cost).toFixed(2)}  ·  篮中 ${s.count} 件`;
    $("#worldCondition").textContent=restock?"地下补给 · 加价15% / 运费2 / 暴露风险+4":"纸币不会变多，明天还会继续。";
  } else if(G) {
    $("#worldTopRight").textContent=`${String(Math.floor(hour())).padStart(2,"0")}:${String(Math.floor(G.minute%60)).padStart(2,"0")}`;
    const warnings=getWarnings();
    if(G.pendingKnock)warnings.unshift("门外有敲门声");if(!G.power)warnings.unshift("停电了");if(!G.waterOn)warnings.unshift("暂时停水");
    for(const i of G.illness)warnings.unshift(DISEASES[i.id]?.name||"身体不适");
    $("#worldCondition").textContent=warnings.slice(0,2).join(" · ");
    $("#worldCondition").classList.toggle("urgent",!!safeReason("idle"));
  }
  $("#worldHint").textContent=shopping?"E 拿商品  ·  R 放回  ·  Tab 看清单":W.glance?"滚轮翻页  ·  Tab / R 合上":W.held?"左键 使用  ·  R 放置 / 归还":"WASD 移动  ·  E 交互  ·  Tab 手记";
  if(W.glance||W.held?.type==="book")worldUpdatePaper();
}
function worldFrame(now,dt) {
  if(!W.enabled)return;
  if(W.rig){
    W.rig.visible=worldVisible();
    const a=W.busy;const t=a?(now-a.start)/1000:0;
    W.rig.position.y=Math.sin(now*.0018)*.002;
    W.rig.position.x=Math.sin(now*.0012)*.0015;
    if(a&&(a.kind==="drink"||a.kind==="eat")){
      const lift=Math.pow(Math.max(0,Math.sin(t*2.5)),2);W.rig.position.y+=lift*.11;W.rig.rotation.x=lift*-.22;
    }else W.rig.rotation.x=0;
    if(a?.kind==="read"&&W.handModel)W.handModel.rotation.y=Math.sin(t*2.0)*.035;
  }
  for(const d of Object.values(W.doors)) {
    d.angle=THREE.MathUtils.damp(d.angle,d.open?1.47:0,9,dt);d.hinge.rotation.y=d.angle*d.sign;
  }
  if(W.fridgeLight)W.fridgeLight.intensity=(!W.store&&W.doors.fridge?.open&&G?.power)?.8:0;
  if(W.drawer){W.drawerOffset=THREE.MathUtils.damp(W.drawerOffset,W.drawerOpen?.28:0,10,dt);W.drawer.position.z=.245+W.drawerOffset;}
  if(W.busy&&!paused) {
    const a=W.busy,t=(now-a.start)/1000,p=clamp(t/a.seconds,0,1);
    $("#worldActionLine i").style.width=(p*100)+"%";
    if(a.kind==="eat") {
      const cycle=t%1.6,ready=cycle>.70&&cycle<1.14;
      $("#worldBite").className=ready?"on ready":"on";
      $("#worldBite").style.transform=`translate(-50%, -50%) scale(${1+(1-cycle/1.6)*.7})`;
    }
    if(p>=1)worldFinishAction();
  }
  if(now>W.subtitleUntil)$("#worldSubtitle").classList.remove("on");
  if(now-W.lastHUD>500){worldRenderHUD();W.lastHUD=now;}
  if(paused&&!W.pauseOpen&&phase==="playing"&&!panelType)worldPause(true);
}
function worldPause(open=!W.pauseOpen) {
  if(!W.enabled)return legacyUI.openSave();
  if(!worldVisible()&&!W.pauseOpen)return;
  if(open){worldCancelAction();releasePointer();paused=true;W.pauseOpen=true;$("#worldPause").hidden=false;$("#worldResume").focus({preventScroll:true});if(G)saveGame(false);}
  else {paused=false;W.pauseOpen=false;$("#worldPause").hidden=true;keys={};clockAccumulator=0;$("#worldResume").blur();}
  sceneDirty=true;
}
function handleWorldKey(e) {
  if(!W.enabled||["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return false;
  if(!worldVisible()&&!W.pauseOpen)return false;
  if(e.code==="Escape") {
    e.preventDefault();
    if(panelType){closePanel();return true;}
    if(W.glance&&!W.pauseOpen){W.glance="";worldSetHand();return true;}
    worldPause();return true;
  }
  if(W.pauseOpen||paused){if(e.code==="Tab")return true;return false;}
  const once=()=>{e.preventDefault();return !e.repeat;};
  if(e.code==="Tab"||e.code==="KeyI"||e.code==="KeyJ") {if(once())worldGlance(worldIsShopping()?"receipt":"notebook");return true;}
  if(e.code==="KeyT"){if(once()&&!worldIsShopping())worldGlance("watch");return true;}
  if(e.code==="KeyB"){if(once()&&!worldIsShopping())openLeisure();return true;}
  if(e.code==="KeyE"){if(once())worldInteract(e.shiftKey);return true;}
  if(e.code==="KeyR"){if(once())worldAlternate();return true;}
  if(e.code==="Space"){if(once()){if(W.busy?.kind==="eat")worldBite();else if(W.held)worldUseHeld();}return true;}
  if((e.code==="ArrowUp"||e.code==="ArrowDown")&&targetId==="bed"){if(once())worldWheel(e.code==="ArrowUp"?-1:1);return true;}
  if(e.code==="KeyF"){if(once())worldFlashlight();return true;}
  if(worldIsShopping()){
    keys[e.code]=true;if(e.code.startsWith("Arrow"))e.preventDefault();return true;
  }
  return false;
}
function worldWheel(delta) {
  if(!worldVisible()||paused||W.busy)return;
  const dir=delta>0?1:-1;
  if(W.glance||W.held?.type==="book"){
    if(W.glance==="receipt"){const n=Math.max(1,Math.ceil(Object.keys(cart).length/14));W.receiptPage=(W.receiptPage+dir+n)%n;}
    else W.page=(W.page+dir+300)%300;
    worldUpdatePaper(true);worldSfx(390,.035);return;
  }
  if(targetId==="bed")W.sleepHours=clamp(W.sleepHours-dir,1,12);
  else if(targetId==="sofa")W.waitHours=clamp(W.waitHours-dir,1,12);
  else if(targetId==="pantry"){
    const n=Math.max(1,Math.ceil(G.inv.filter(b=>!b.packed&&b.units>0&&b.location!=="fridge").length/24));
    W.stockPage=(W.stockPage+dir+n)%n;syncWorldRoom();
  } else if(worldIsShopping()&&typeof worldShopWheel==="function")worldShopWheel(dir);
  worldUpdateTarget();
}
function worldFlashlight() {
  if(worldIsShopping()||!G)return;
  if(!has("flashlight"))return showToast("先拆出手电筒。");
  if(!W.flash) {
    const light=new THREE.SpotLight("#eee4c3",4,9,.50,.65,1.4);
    light.position.set(.15,-.12,-.1);const target=new THREE.Object3D();target.position.set(0,-.1,-4);camera.add(target);light.target=target;camera.add(light);W.flash=light;
  }else W.flash.visible=!W.flash.visible;
  sceneDirty=true;
}
function worldSfx(freq=400,length=.05) {
  if(!soundOn)return;
  try {if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audioCtx.currentTime+length);g.gain.setValueAtTime(.018,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+length);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+length);}catch{}
}
function initWorldDOM() {
  const html=`<div id="worldFade"></div><div id="worldHUD" hidden>
    <div class="world-corner"><strong id="worldDay"></strong><small id="worldPlace"></small></div>
    <div id="worldTopRight"></div><div id="worldDot"></div><div id="worldBite"></div>
    <div id="worldFocus"><strong></strong><span></span></div>
    <div id="worldAction" hidden><span></span><div id="worldActionLine"><i></i></div><small></small></div>
    <div id="worldSubtitle" role="status" aria-live="polite"></div>
    <div class="world-bottom"><div id="worldCondition"></div><div id="worldHint"></div></div>
    <button id="worldPauseButton" aria-label="暂停">Ⅱ</button>
    <div id="worldMobile"><button data-world="alt">放回</button><button data-world="shift">辅助</button><button data-world="use">使用</button><div class="mobile-pair"><button data-world="down">−</button><button data-world="up">＋</button></div><button data-world="note">手记</button></div>
  </div>
  <section id="worldPause" hidden aria-label="暂停与存档"><div class="world-pause-content"><small>THE LAST TENANT</small><h2>时间，停一下。</h2>
    <button id="worldResume">回到房间　→</button><button id="worldSaveNow">保存这一刻</button><button id="worldExport">导出存档</button>
    <label>读取存档<input type="file" class="import-input" accept=".json,application/json" hidden></label>
    <button id="worldReturnTitle">保存并回到门外</button>
    <div class="world-pause-small"><button id="worldLock">锁定鼠标</button><button id="worldShadows">开关阴影</button><button id="worldSound">开关声音</button></div>
    <p>WASD走动 · 拖动环顾 · E交互 · 左键使用手中物品<br>R放置/放回 · Tab手记 · 床边滚轮调睡眠 · Shift+E辅助动作<br>日常在场景里完成。时间推进仍会在危险或敲门时停下。<br>离线版 ${VERSION} · 旧v3存档仍可读取</p>
  </div></section>`;
  document.body.insertAdjacentHTML("beforeend",html);
  $("#worldResume").onclick=()=>worldPause(false);
  $("#worldSaveNow").onclick=()=>saveGame();$("#worldExport").onclick=exportSave;
  $("#worldReturnTitle").onclick=()=>toTitle();
  $("#worldLock").onclick=()=>{worldPause(false);requestPointer();};
  $("#worldShadows").onclick=()=>{renderer.shadowMap.enabled=!renderer.shadowMap.enabled;renderer.shadowMap.needsUpdate=true;sceneDirty=true;};
  $("#worldSound").onclick=toggleAudio;$("#worldPauseButton").onclick=()=>worldPause();
  $$("[data-world]").forEach(b=>b.onclick=()=>{
    const a=b.dataset.world;
    if(a==="alt")worldAlternate();if(a==="shift")worldInteract(true);if(a==="use"){if(W.busy?.kind==="eat")worldBite();else worldUseHeld();}
    if(a==="note")worldGlance(worldIsShopping()?"receipt":"notebook");if(a==="up")worldWheel(-1);if(a==="down")worldWheel(1);
  });
  const canvas=$("#world");
  canvas.addEventListener("pointerdown",e=>{if(worldVisible()&&!paused&&!panelType)W.clickStart={x:e.clientX,y:e.clientY,t:performance.now(),button:e.button};});
  canvas.addEventListener("pointerup",e=>{
    const p=W.clickStart;W.clickStart=null;if(!p||!worldVisible()||paused||panelType)return;
    if(Math.hypot(p.x-e.clientX,p.y-e.clientY)>8||performance.now()-p.t>350)return;
    if(p.button===2)return worldAlternate();
    if(W.busy?.kind==="eat")return worldBite();
    if(W.busy)return;
    if(worldIsShopping())worldInteract();else if(W.held&&!W.glance)worldUseHeld();
  });
  canvas.addEventListener("wheel",e=>{if(worldVisible()){e.preventDefault();worldWheel(e.deltaY);}},{passive:false});
}
if(W.enabled) {
  document.body.classList.add("world-interactions");initWorldDOM();
  // Necessary modal screens are pause/import/help only. Every daily shortcut is physical.
  renderHUD=worldRenderHUD;updateTarget=worldUpdateTarget;doInteract=()=>worldInteract(!!(keys.ShiftLeft||keys.ShiftRight));
  showToast=(text,type="info")=>{const e=$("#worldSubtitle");e.textContent=text;e.className="on"+(type==="warn"?" warn":"");W.subtitleUntil=performance.now()+5500;};
  openInventory=()=>{if(!W.committing)worldGlance();};openRoom=()=>worldGlance();openJournal=()=>worldGlance();openCharacter=()=>worldGlance();
  openTime=()=>showToast("走到床边，用滚轮调好时长，按 E 躺下。不用再打开时间面板。");
  openLeisure=()=>{if(W.committing)return;const b=G?.inv.find(b=>!b.packed&&DB[b.id].kind==="book");if(b)worldEquip(b.uid);else showToast("先拆出一本书，再从书桌上拿起。");};
  openStation=id=>{if(!W.committing){targetId=id;worldInteract();}};
  openSave=()=>worldPause(true);
  updatePhase=()=>{legacyUI.updatePhase();document.body.classList.toggle("world-shopping",worldIsShopping());worldRenderHUD();};
  getPlayerPosition=()=>worldIsShopping()&&W.savedRoomPosition?W.savedRoomPosition:legacyUI.getPlayerPosition();
  toTitle=()=>{worldCancelAction();W.pauseOpen=false;$("#worldPause").hidden=true;W.store=false;W.glance="";W.held=null;paused=false;legacyUI.toTitle();};
  loadState=s=>{if(!validateSave(s))return legacyUI.loadState(s);worldCancelAction();W.pauseOpen=false;$("#worldPause").hidden=true;W.store=false;W.glance="";W.held=null;legacyUI.loadState(s);};
  installWorldRoom();worldRenderHUD();
  $("#newGameButton small").textContent="走进供销社 · 初始 300 帝国纸币";
}
