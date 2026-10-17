/* Walkable cooperative shop. Products, order crates and checkout are world objects. */
const storeLegacyBegin = beginGame;
const storeApartmentInfo = worldTargetInfo;
function worldBuildStore() {
  roomReady = false;
  if (roomRoot) {
    scene.remove(roomRoot);
    worldClear(roomRoot);
  }
  if (cityRoot) {
    scene.remove(cityRoot);
    worldClear(cityRoot);
    cityRoot = null;
  }
  W.root = null;
  W.props = null;
  W.pantry = null;
  W.doors = {};
  W.fridgeLight = null;
  W.drawer = null;
  interactive = [];
  colliders = [];
  curtainMeshes = [];
  lampLights = [];
  pestRoot = null;
  bagRoot = null;
  decorRoot = null;
  roomRoot = new THREE.Group();
  roomRoot.userData.seed = "__physical_shop__";
  scene.add(roomRoot);
  scene.background = new THREE.Color("#a8aa9b");
  scene.fog.color.copy(scene.background);
  scene.fog.near = 18;
  scene.fog.far = 45;
  skyLight.intensity = 1.3;
  sunLight.intensity = 0.75;
  sunLight.color.set("#f4dfbe");
  const cream = worldMat("#d6cdb4"),
    paint = worldMat("#53756c"),
    wood = worldMat("#988163"),
    dark = worldMat("#544e3d"),
    metal = worldMat("#767e70", { metalness: 0.35, roughness: 0.5 });
  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = floorCanvas.height = 256;
  const fx = floorCanvas.getContext("2d");
  fx.fillStyle = "#b6ae97";
  fx.fillRect(0, 0, 256, 256);
  fx.strokeStyle = "#8c897566";
  fx.lineWidth = 2;
  fx.strokeRect(1, 1, 254, 254);
  fx.fillStyle = "#c6bea5";
  fx.fillRect(0, 0, 22, 22);
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(14, 12);
  worldBox(
    roomRoot,
    14.2,
    0.1,
    12.2,
    0,
    -0.05,
    0,
    worldMat("#ffffff", { map: floorTex }),
  );
  worldBox(roomRoot, 14.2, 0.1, 12.2, 0, 3.4, 0, cream);
  for (const x of [-7, 7]) {
    worldBox(roomRoot, 0.12, 3.4, 12, x, 1.7, 0, cream);
    worldBox(roomRoot, 0.135, 1.0, 12, x, 0.5, 0, paint);
  }
  worldBox(roomRoot, 14, 3.4, 0.12, 0, 1.7, -6, cream);
  worldBox(roomRoot, 14, 1.05, 0.14, 0, 0.525, -5.985, paint);
  // Front shop windows, warm daylight, a real exit door.
  for (const x of [-5.9, -2.5, 1.0, 5.7]) {
    worldBox(roomRoot, 2.75, 0.45, 0.12, x, 0.225, 6, paint);
    worldBox(roomRoot, 2.75, 0.35, 0.12, x, 3.23, 6, cream);
    const pane = worldBox(
      roomRoot,
      2.65,
      2.5,
      0.02,
      x,
      1.7,
      6,
      worldMat("#b8c3b7", { transparent: true, opacity: 0.15 }),
    );
    pane.userData.noPick = true;
    for (const side of [-1, 1])
      worldBox(roomRoot, 0.055, 2.65, 0.12, x + side * 1.36, 1.7, 5.99, dark);
    worldBox(roomRoot, 2.75, 0.055, 0.12, x, 1.75, 5.98, dark);
  }
  const exit = worldTag(
    groupAt(3.35, 0, 5.91, roomRoot),
    "shopExit",
    "供销社出口",
  );
  worldBox(exit, 1.05, 2.58, 0.06, 0, 1.29, 0, worldMat("#65847b"));
  worldBox(
    exit,
    0.87,
    1.6,
    0.07,
    0,
    1.65,
    -0.01,
    worldMat("#b4bfa8", { roughness: 0.25 }),
  );
  worldBox(exit, 0.2, 0.03, 0.08, -0.28, 1.05, -0.07, metal);
  const exitSign = worldLabel(
    exit,
    ["离店", "EXIT"],
    0.37,
    0.22,
    0,
    2.84,
    -0.01,
    { bg: "#53756c", fg: "#e7dec4", size: 36 },
  );
  exitSign.rotation.y = Math.PI;
  const wallSign = worldLabel(
    roomRoot,
    ["安德士供销合作社", "ANDERS PEOPLE'S COOPERATIVE  /  1986"],
    5.8,
    0.58,
    0,
    2.87,
    -5.91,
    { bg: "#476a60", fg: "#e9dfc2", size: 35, width: 1024, height: 180 },
  );
  // Ten physical bays, one per category. The middle opening is a walkable aisle.
  const layout = [
    ["staple", -5.15, -5.35, 0],
    ["canned", -2.58, -5.35, 0],
    ["fresh", 0, -5.35, 0],
    ["drink", 2.58, -5.35, 0],
    ["hygiene", 5.15, -5.35, 0],
    ["clean", -4.85, -0.3, 0],
    ["tool", -2.45, -0.3, 0],
    ["medical", 2.45, -0.3, 0],
    ["leisure", 4.85, -0.3, 0],
    ["furniture", 6.48, 2.78, -Math.PI / 2],
  ];
  W.shopProducts = [];
  for (const [category, x, z, angle] of layout) {
    const bay = groupAt(x, 0, z, roomRoot);
    bay.rotation.y = angle;
    worldBox(bay, 2.29, 1.85, 0.045, 0, 0.965, -0.26, paint);
    for (const y of [0.18, 0.61, 1.04, 1.47, 1.9])
      worldBox(bay, 2.32, 0.035, 0.62, 0, y, 0, wood);
    for (const sx of [-1.15, 1.15])
      worldBox(bay, 0.038, 1.96, 0.62, sx, 0.98, 0, paint);
    const categoryName = CATEGORIES.find(([id]) => id === category)[1];
    worldLabel(bay, categoryName, 1.8, 0.23, 0, 2.15, -0.12, {
      bg: "#e1d6bc",
      fg: "#38574c",
      size: 37,
      width: 512,
      height: 96,
    });
    colliders.push({ mesh: bay });
    CATALOG.filter((it) => it.category === category).forEach((it, i) => {
      const row = Math.floor(i / 5),
        col = i % 5;
      const g = worldTag(
        groupAt((col - 2) * 0.44, 0.205 + row * 0.43, 0.1, bay),
        "buy:" + it.id,
        it.name,
        { productId: it.id },
      );
      const body = worldStoreProduct(it, g);
      body.rotation.y = 0.035 * (col % 2 ? 1 : -1);
      const price = worldLabel(
        g,
        `E$ ${(it.price * 1).toFixed(2)}`,
        0.3,
        0.075,
        0,
        -0.035,
        0.227,
        { bg: "#eee2c6", fg: "#4e4e3c", width: 192, height: 48, size: 24 },
      );
      W.shopProducts.push(g);
    });
  }
  // A service counter, mechanical cash register and paper receipt. No checkout overlay.
  const counter = worldTag(
    groupAt(-3.65, 0, 4.58, roomRoot),
    "shopCheckout",
    "收银台",
  );
  worldBox(counter, 4.5, 0.88, 0.94, 0, 0.44, 0, paint);
  worldBox(counter, 4.64, 0.065, 1.03, 0, 0.92, 0, wood);
  colliders.push({ mesh: counter });
  const register = groupAt(0.65, 0.96, 0, counter);
  register.rotation.y = Math.PI;
  worldBox(register, 0.52, 0.12, 0.42, 0, 0.06, 0, dark);
  const top = worldBox(register, 0.44, 0.18, 0.3, 0, 0.2, -0.025, metal);
  top.rotation.x = -0.16;
  for (let i = 0; i < 12; i++)
    worldBox(
      register,
      0.042,
      0.021,
      0.037,
      ((i % 4) - 1.5) * 0.067,
      0.299,
      Math.floor(i / 4) * 0.056 - 0.02,
      cream,
    );
  worldLabel(register, "收银", 0.25, 0.09, 0, 0.37, 0.05, {
    bg: "#272f28",
    fg: "#d6d5b0",
    width: 256,
    height: 96,
    size: 46,
  });
  worldBox(register, 0.4, 0.045, 0.16, 0, 0.08, 0.27, worldMat("#d1c5a5"));
  const receipt = worldTag(
    groupAt(1.58, 1.0, -0.01, counter),
    "shopReceipt",
    "纸质购物清单",
  );
  const paper = worldLabel(
    receipt,
    ["购物清单", "篮子还是空的。"],
    0.56,
    0.72,
    0,
    0.31,
    0,
    { size: 32, width: 512, height: 768 },
  );
  paper.rotation.y = Math.PI;
  W.receiptBoard = paper;
  const kitCrates = [
    ["starter", -5.2, 2.9, "短期物资样例", STARTER],
    ["year", -3.72, 2.9, "全年紧缩配给单", YEAR_KIT],
  ];
  for (const [which, x, z, name, kit] of kitCrates) {
    const crate = worldTag(groupAt(x, 0, z, roomRoot), "kit:" + which, name);
    worldBox(crate, 0.85, 0.57, 0.65, 0, 0.285, 0, worldMat("#a48a60"));
    for (const y of [0.11, 0.45])
      worldBox(crate, 0.88, 0.065, 0.68, 0, y, 0, worldMat("#c1ad83"));
    worldLabel(
      crate,
      [name, `E$ ${cartSummary(kit).cost.toFixed(2)}`, "E 加入这一份配给"],
      0.74,
      0.35,
      0,
      0.32,
      0.343,
      { bg: "#d4c39b", fg: "#4d5340", size: 29, width: 512, height: 256 },
    );
    colliders.push({ mesh: crate });
  }
  const basketSpot = worldTag(
    groupAt(1.55, 0, 4.85, roomRoot),
    "shopBasket",
    "购物篮与送货登记",
  );
  worldBox(basketSpot, 0.77, 0.78, 0.54, 0, 0.39, 0, dark);
  colliders.push({ mesh: basketSpot });
  worldLabel(
    basketSpot,
    ["合作社送货登记", "样品入篮，按清单分袋送达", "每只塑料袋承重不超过8kg"],
    0.8,
    0.32,
    0,
    1.18,
    0.04,
    { bg: "#d9cfb5", fg: "#425b4d", width: 768, height: 288, size: 30 },
  );
  for (const [x, z] of [
    [-3, -3.1],
    [3, -3.1],
    [-3, 2.4],
    [3, 2.4],
  ]) {
    worldBox(roomRoot, 0.012, 0.35, 0.012, x, 3.2, z, dark);
    worldBox(roomRoot, 1.15, 0.08, 0.2, x, 2.99, z, cream);
    const glow = worldBox(
      roomRoot,
      1.02,
      0.012,
      0.14,
      x,
      2.94,
      z,
      new THREE.MeshBasicMaterial({ color: "#ede7cc" }),
    );
    const light = new THREE.PointLight("#fff0cc", 4.1, 7, 1.7);
    light.position.set(x, 2.7, z);
    roomRoot.add(light);
  }
  // Shop collision is built before rendering batches; bay apertures remain accessible.
  roomRoot.updateMatrixWorld(true);
  colliders = colliders.map(({ mesh }) => {
    const box = new THREE.Box3().setFromObject(mesh);
    return {
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
      minY: box.min.y,
      maxY: box.max.y,
    };
  });
  worldBatchShop();
  worldMakeBasket();
  worldRefreshShop();
  camera.position.set(0, 1.62, 4.55);
  lookYaw = 0;
  lookPitch = -0.055;
  camera.rotation.set(lookPitch, lookYaw, 0);
  camera.updateMatrixWorld(true);
  renderer.shadowMap.needsUpdate = true;
  sceneDirty = true;
}
function worldStoreProduct(it, parent) {
  const g = new THREE.Group();
  parent.add(g);
  const colors = {
    staple: "#bba982",
    canned: "#9ba894",
    fresh: "#839267",
    drink: "#8faea3",
    hygiene: "#c4c9b1",
    clean: "#80a397",
    medical: "#d8ccae",
    tool: "#858775",
    leisure: "#596e61",
    furniture: "#9c876a",
  };
  const base = worldMat(colors[it.category] || "#afa88c");
  let w = 0.22,
    h = 0.27,
    d = 0.16;
  if (it.kind === "book") {
    w = 0.21;
    h = 0.28;
    d = 0.055;
    worldBox(g, w, h, d, 0, h / 2, 0, base);
  } else if (it.category === "canned") {
    w = d = 0.18;
    h = 0.2;
    worldCylinder(g, 0.09, 0.09, h, 0, h / 2, 0, base);
    worldCylinder(
      g,
      0.094,
      0.094,
      0.008,
      0,
      h,
      0,
      worldMat("#c0c2ac", { metalness: 0.4 }),
    );
  } else if (it.category === "drink") {
    w = d = 0.18;
    h = 0.31;
    worldCylinder(g, 0.078, 0.085, 0.25, 0, 0.125, 0, base);
    worldCylinder(g, 0.031, 0.062, 0.06, 0, 0.28, 0, worldMat("#ded7bd"));
  } else worldBox(g, w, h, d, 0, h / 2, 0, base);
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.94, h * 0.68),
    worldProductMaterial(it),
  );
  front.position.set(0, h * 0.52, d / 2 + 0.004);
  g.add(front);
  return g;
}
function worldBatchShop() {
  // Merge the hundreds of solid boxes/cylinders into a handful of instanced draws.
  // instanceTargets preserves exact per-object ray interactions after batching.
  roomRoot.updateMatrixWorld(true);
  const buckets = new Map(),
    remove = [];
  roomRoot.traverse((m) => {
    if (!m.isMesh || Array.isArray(m.material)) return;
    const type = m.geometry?.type;
    if (type !== "BoxGeometry" && type !== "CylinderGeometry") return;
    const p = m.geometry.parameters,
      ratio =
        type === "CylinderGeometry"
          ? (p.radiusTop / p.radiusBottom).toFixed(3)
          : "1";
    const mat = m.material,
      key = `${type}:${ratio}:${mat.metalness || 0}:${mat.roughness || 0}:${mat.map?.uuid || "color"}:${mat.transparent ? mat.opacity : 1}`;
    if (mat.transparent) return;
    if (!buckets.has(key))
      buckets.set(key, { list: [], type, ratio: Number(ratio), mat });
    let target = m;
    while (target && target !== roomRoot && !target.userData.interact)
      target = target.parent;
    const scale =
      type === "BoxGeometry"
        ? new THREE.Vector3(p.width, p.height, p.depth)
        : new THREE.Vector3(p.radiusBottom * 2, p.height, p.radiusBottom * 2);
    const matrix = m.matrixWorld
      .clone()
      .multiply(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z));
    buckets.get(key).list.push({
      m,
      matrix,
      color: mat.color,
      target: target === roomRoot ? null : target,
    });
    remove.push(m);
  });
  for (const { list, type, ratio, mat } of buckets.values()) {
    const geo =
      type === "BoxGeometry"
        ? new THREE.BoxGeometry(1, 1, 1)
        : new THREE.CylinderGeometry(0.5 * ratio, 0.5, 1, 16);
    const material = mat.clone();
    material.color.set("#ffffff");
    const inst = new THREE.InstancedMesh(geo, material, list.length);
    inst.receiveShadow = true;
    inst.castShadow = false;
    inst.userData.instanceTargets = [];
    list.forEach((p, i) => {
      inst.setMatrixAt(i, p.matrix);
      inst.setColorAt(i, p.color);
      inst.userData.instanceTargets[i] = p.target;
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    roomRoot.add(inst);
  }
  for (const m of remove) {
    m.parent.remove(m);
    m.geometry.dispose();
  }
}
function worldMakeBasket() {
  if (W.basketRig) {
    camera.remove(W.basketRig);
    worldClear(W.basketRig);
  }
  const basket = new THREE.Group();
  camera.add(basket);
  W.basketRig = basket;
  basket.position.set(-0.43, -0.54, -0.85);
  basket.rotation.set(0.16, 0.25, -0.035);
  const paint = worldMat("#6f8170"),
    wire = worldMat("#adb39b", { metalness: 0.3 });
  worldBox(basket, 0.43, 0.015, 0.29, 0, 0, 0, paint);
  for (const y of [0.06, 0.13, 0.22]) {
    for (const z of [-0.145, 0.145])
      worldBox(basket, 0.46, 0.012, 0.012, 0, y, z, paint);
    for (const x of [-0.225, 0.225])
      worldBox(basket, 0.012, 0.012, 0.3, x, y, 0, paint);
  }
  for (let i = 0; i < 8; i++)
    for (const z of [-0.145, 0.145])
      worldBox(basket, 0.009, 0.22, 0.009, (i - 3.5) * 0.062, 0.11, z, paint);
  for (let i = 0; i < 4; i++)
    for (const x of [-0.225, 0.225])
      worldBox(basket, 0.009, 0.22, 0.009, x, 0.11, (i - 1.5) * 0.09, paint);
  for (const x of [-0.16, 0.16])
    worldBox(basket, 0.012, 0.2, 0.012, x, 0.31, 0, wire);
  worldBox(basket, 0.33, 0.014, 0.02, 0, 0.413, 0, worldMat("#b5a17e"));
  W.basketContents = new THREE.Group();
  basket.add(W.basketContents);
}
function worldRefreshShop() {
  if (!worldIsShopping()) return;
  const sum = cartSummary(cart),
    budget = 300;
  if (W.receiptBoard) {
    const lines = [
      "安德士 · 供销合作社",
      "——————————",
      `登记 ${sum.count} 件 / ${sum.weight.toFixed(1)} kg`,
      `${sum.bags.length} 袋 / ${sum.crates.length} 独立箱`,
      `袋装费 E$ ${(sum.bags.length * 0.06).toFixed(2)}`,
      `热量约${sum.days}天 / 目标365天`,
      "——————————",
      `应付 E$ ${sum.cost.toFixed(2)}`,
      `结余 E$ ${(budget - sum.cost).toFixed(2)}`,
      "付款入室后永不补货",
    ];
    W.receiptBoard.material.map.dispose();
    W.receiptBoard.material.map = worldTextTexture(lines, {
      width: 512,
      height: 768,
      size: 29,
      line: 57,
      bg: "#e2d6b9",
      fg: "#4f5845",
    });
  }
  if (W.basketContents) {
    worldClear(W.basketContents);
    Object.keys(cart)
      .filter((id) => cart[id] > 0)
      .slice(-8)
      .forEach((id, i) => {
        const it = DB[id],
          g = worldStoreProduct(it, W.basketContents);
        g.scale.setScalar(0.48);
        g.position.set(
          ((i % 4) - 1.5) * 0.1,
          0.017,
          Math.floor(i / 4) * 0.13 - 0.07,
        );
        g.rotation.y = (i % 2 ? 1 : -1) * 0.15;
      });
  }
  W.paperStamp = "";
  worldRenderHUD();
  worldUpdateTarget();
  sceneDirty = true;
}
function worldOpenShop(isRestock = false) {
  if (!W.enabled) return legacyUI.openShop(isRestock);
  if (isRestock || !startPreparation()) return blockPurchase();
  W.savedRoomPosition = G?.position || null;
  worldCancelAction();
  worldPause(false);
  W.held = null;
  W.glance = "";
  W.receiptPage = 0;
  W.store = true;
  paused = false;
  W.kitConfirm = null;
  W.exitConfirm = 0;
  closePanel();
  releasePointer();
  worldSetHand();
  worldBuildStore();
  updatePhase();
  showToast(
    "仅此一次开局采购：确认入室后不能再买、不能补货。请先检查能否支撑365天，短期样例不足一年。",
    "warn",
  );
  return true;
}

function worldCartChange(id, delta = 1) {
  if (!canPurchase() || !DB[id] || !worldIsShopping()) return false;
  const next = Math.max(0, Math.min(100, (cart[id] || 0) + delta));
  if (next === (cart[id] || 0)) return false;
  const draft = { ...cart, [id]: next };
  if (!next) delete draft[id];
  const budget = 300;
  if (delta > 0 && cartSummary(draft).cost > budget + 0.001) {
    showToast("纸币不够，先把篮子里的一些物资放回去。", "warn");
    return false;
  }
  cart = draft;
  W.lastProduct = id;
  worldRefreshShop();
  worldSfx(delta > 0 ? 650 : 380, 0.06);
  return true;
}
function worldKit(which) {
  if (!canPurchase()) return blockPurchase();
  const kit = which === "year" ? YEAR_KIT : STARTER,
    sum = cartSummary(kit),
    budget = 300;
  if (sum.cost > budget + 0.001)
    return showToast("这份整套配给超过了当前预算。可以按件挑选。", "warn");
  if (
    Object.keys(cart).length &&
    (W.kitConfirm?.which !== which || performance.now() > W.kitConfirm.until)
  ) {
    W.kitConfirm = { which, until: performance.now() + 5000 };
    return showToast(
      "这一箱会替换现有购物清单。确认要换的话，再按一次 E。",
      "warn",
    );
  }
  W.kitConfirm = null;
  cart = { ...kit };
  worldRefreshShop();
  worldSfx(380, 0.1);
  showToast(
    which === "year"
      ? "全年紧缩配给已登记。只是热量估计，不保证健康、保质期和精神需求。"
      : "短期样例只有约79天理论热量，不足一年。进房后不能补货，请在货架补足再结账。",
  );
}
function worldCommitCheckout() {
  if (!canPurchase() || !worldIsShopping()) return blockPurchase();
  if (W.basketRig) {
    camera.remove(W.basketRig);
    worldClear(W.basketRig);
    W.basketRig = null;
    W.basketContents = null;
  }
  W.store = false;
  W.glance = "";
  W.held = null;
  W.focus = null;
  W.hit = null;
  targetId = "";
  scene.fog.near = 10;
  scene.fog.far = 40;
  storeLegacyBegin();
  if (phase === "playing") {
    setFirstPerson();
    saveGame(false);
    syncRoom();
  }
  worldSetHand();
  updatePhase();
}

function worldCheckout() {
  if (!canPurchase() || !worldIsShopping()) return blockPurchase();
  const s = cartSummary(cart),
    budget = 300;
  if (!s.count)
    return showToast(
      "篮子里还没有东西，先去货架前挑选，或者看看门边的配给箱。",
    );
  if (s.cost > budget + 0.001)
    return showToast("纸币不够，请先放回一部分商品。", "warn");
  worldStart(
    "交清纸币，锁定本局开局物资",
    1.6,
    worldCommitCheckout,
    "checkout",
  );
}
function worldLeaveShop() {
  if (Object.keys(cart).length && performance.now() > W.exitConfirm) {
    W.exitConfirm = performance.now() + 5000;
    return showToast(
      "还没结账。要放弃这次采购，再按一次 E 离开；否则请到门边收银台。",
      "warn",
    );
  }
  closePreparation();
  W.store = false;
  if (W.basketRig) {
    camera.remove(W.basketRig);
    worldClear(W.basketRig);
    W.basketRig = null;
  }
  toTitle();
}
function worldShopInteract(id, shift = false) {
  if (!canPurchase()) return blockPurchase();
  if (id.startsWith("buy:")) {
    const pid = id.slice(4),
      delta = shift ? 5 : 1;
    if (W.busy) return;
    return worldStart(
      "把样品放进购物篮",
      0.38,
      () => worldCartChange(pid, delta),
      "pickup",
      pid,
    );
  }
  if (id.startsWith("kit:")) return worldKit(id.slice(4));
  if (id === "shopCheckout") return worldCheckout();
  if (id === "shopReceipt" || id === "shopBasket")
    return worldGlance("receipt");
  if (id === "shopExit") return worldLeaveShop();
  showToast("WASD 沿过道走到货架前，准星对准商品按 E。门边有配给箱和收银台。");
}
function worldShopAlternate() {
  if (W.glance) {
    W.glance = "";
    worldSetHand();
    return;
  }
  const id = targetId.startsWith("buy:") ? targetId.slice(4) : W.lastProduct;
  if (id && cart[id]) return worldCartChange(id, -1);
  showToast("看向刚才拿过的商品，按 R 放回一件。");
}
function worldShopFrame(now) {
  if (W.basketRig) {
    W.basketRig.visible = worldIsShopping() && !W.glance;
    W.basketRig.rotation.z = -0.035 + Math.sin(now * 0.0016) * 0.007;
  }
}
if (W.enabled) {
  openShop = worldOpenShop;
  beginGame = worldCheckout;
  worldTargetInfo = (o) => {
    const id = o?.userData.interact || "";
    if (id.startsWith("buy:")) {
      const it = DB[id.slice(4)];
      const detail =
        it.kind === "book"
          ? `${it.pages}页 · 可重读`
          : it.kind === "food"
            ? `${it.servings}份 · ${it.kcal}kcal/份${it.cook ? " · 需烹煮" : ""}`
            : `${it.servings}次用量`;
      const life = it.life < 9999 ? ` · 常温${it.life}天` : " · 长期保存";
      return [
        it.name,
        `E 入篮  ·  Shift+E 拿5件  ·  R 放回  |  E$ ${(it.price * 1).toFixed(2)} · ${it.weight}kg · ${detail}${life}  |  篮中×${cart[it.id] || 0}`,
      ];
    }
    if (id === "kit:starter" || id === "kit:year") {
      const which = id.slice(4),
        s = cartSummary(which === "year" ? YEAR_KIT : STARTER);
      return [
        which === "year" ? "全年紧缩配给单" : "短期物资样例",
        `E 登记整套 · E$ ${s.cost.toFixed(2)} · ${s.count}件 · ${s.bags.length}袋 · ${s.days}理论热量天（非生存保证）`,
      ];
    }
    if (id === "shopCheckout") {
      const s = cartSummary(cart);
      return [
        "机械收银台",
        `E 确认本局唯一采购 · E$ ${s.cost.toFixed(2)} · 热量约${s.days}/365天 · 入室后不能补货`,
      ];
    }
    if (id === "shopReceipt" || id === "shopBasket")
      return ["送货购物清单", "E 拿起纸单查看  ·  滚轮翻页  ·  Tab / R 合上"];
    if (id === "shopExit")
      return ["供销社出口", "E 放弃本次采购，离开  ·  要购买请到收银台"];
    return storeApartmentInfo(o);
  };
}
