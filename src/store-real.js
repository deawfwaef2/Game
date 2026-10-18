/* 闭门365 · v0.16 a less rough cooperative shop.
   - Shelves carry the same detailed product models as the apartment (sacks, tins, bottles, jars, fruit), at real
     scale, several facings for small goods (instanced, so it stays light).
   - Printed shelf-edge price tags with the short name, price and portions, readable from the aisle.
   - Warmer, calmer light instead of the washed-out white room.
   - A large product card: what it is, what it is FOR (用途), the key numbers, what is in the basket, and the keys. */
const SR = { pending: null, card: null, cardKey: "" };
const srOldStoreProduct = worldStoreProduct;
function srShort(it) {
  return it.name.replace(/ · .*$/, "").replace(/^(小说|侦探集|诗集|画册)/, "").replace(/《|》/g, "");
}
// Fit a real product model to a shelf slot, standing on y=0 and centred.
function srModel(it, parent, facings) {
  let m = null;
  try {
    m = worldProduct(it.id, null, true);
  } catch (e) {
    m = null;
  }
  if (!m) return null;
  m.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m),
    size = box.getSize(new THREE.Vector3());
  if (!(size.x > 0.005 && size.y > 0.005)) return null;
  const s = Math.min(1.25, 0.36 / size.x, 0.37 / size.y, 0.36 / size.z);
  m.scale.multiplyScalar(s);
  m.updateMatrixWorld(true);
  box.setFromObject(m);
  const c = box.getCenter(new THREE.Vector3());
  m.position.x -= c.x;
  m.position.z -= c.z;
  m.position.y -= box.min.y;
  const w = size.x * s,
    n = facings && it.category !== "furniture" ? Math.max(1, Math.min(3, Math.floor(0.4 / (w + 0.014)))) : 1;
  if (n === 1) {
    parent.add(m);
    m.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });
    return m;
  }
  // Several facings share one draw call per part.
  const root = new THREE.Group();
  parent.add(root);
  m.updateMatrixWorld(true);
  const gap = w + 0.012;
  m.traverse((o) => {
    if (!o.isMesh) return;
    const rel = o.matrixWorld.clone();
    const inst = new THREE.InstancedMesh(o.geometry, o.material, n);
    for (let i = 0; i < n; i++) {
      const off = new THREE.Matrix4().makeTranslation((i - (n - 1) / 2) * gap, 0, (i % 2) * -0.012);
      inst.setMatrixAt(i, off.multiply(rel));
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.castShadow = false;
    inst.receiveShadow = true;
    root.add(inst);
  });
  return root;
}
worldStoreProduct = function (it, parent) {
  if (SR.pending) {
    const g = new THREE.Group();
    parent.add(g);
    SR.pending.push([it, g]);
    return g;
  }
  const g = new THREE.Group();
  parent.add(g);
  return srModel(it, g, false) ? g : (parent.remove(g), srOldStoreProduct(it, parent));
};
function srTagTexture(it) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 150;
  const x = c.getContext("2d");
  x.fillStyle = "#f1e8d2";
  x.fillRect(0, 0, 512, 150);
  x.fillStyle = "#b8352a";
  x.fillRect(0, 0, 512, 12);
  x.strokeStyle = "rgba(60,50,30,.35)";
  x.lineWidth = 3;
  x.strokeRect(2, 2, 508, 146);
  x.fillStyle = "#2f2a20";
  x.font = "bold 50px 'Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif";
  x.textBaseline = "middle";
  let name = srShort(it);
  while (x.measureText(name).width > 488 && name.length > 2) name = name.slice(0, -1);
  if (name !== srShort(it)) name = name.slice(0, -1) + "…";
  x.fillText(name, 14, 52);
  x.fillStyle = "#b8352a";
  x.font = "bold 46px 'DejaVu Sans Mono',monospace";
  x.fillText(`E$${it.price.toFixed(2)}`, 14, 112);
  x.fillStyle = "#5b5444";
  x.font = "30px 'Noto Sans CJK SC','PingFang SC',sans-serif";
  x.textAlign = "right";
  const sub = it.kind === "food" || it.kind === "drink" ? `${it.servings}份` : it.servings > 1 ? `${it.servings}次` : "耐用";
  x.fillText(`${sub} · ${it.weight}kg`, 498, 112);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function srTags() {
  for (const g of W.shopProducts || []) {
    const it = DB[g.userData.productId];
    if (!it) continue;
    for (const ch of [...g.children]) if (ch.isMesh && ch.geometry?.type === "PlaneGeometry") g.remove(ch);
    const map = srTagTexture(it);
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.105),
      new THREE.MeshStandardMaterial({ map, roughness: 0.9, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: 0.28 }),
    );
    tag.position.set(0, -0.05, 0.214);
    tag.rotation.x = -0.12;
    tag.userData.noAO = true;
    g.add(tag);
  }
}
// Warmer, less washed-out light: lower ambient, warm tubes, darker floor tone.
function srLight() {
  scene.background = new THREE.Color("#8d8676");
  scene.fog.color.copy(scene.background);
  skyLight.intensity = 0.72;
  sunLight.intensity = 0.5;
  sunLight.color.set("#ffd9a8");
  renderer.toneMappingExposure = 0.9;
  roomRoot.traverse((o) => {
    // The PMREM environment lit every surface at full strength: that was the washed-out white.
    for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
      if (!m || !("envMapIntensity" in m) || m.userData.srEnv) continue;
      m.userData.srEnv = true;
      const base = m.userData.envBase ?? m.envMapIntensity;
      m.userData.envBase = base * (m.metalness > 0.5 ? 0.7 : 0.3);
      m.envMapIntensity = m.userData.envBase;
    }
    if (o.isPointLight) {
      o.color.set("#ffe1b0");
      o.intensity = 3.3;
    }
    if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.color.getHexString() === "ede7cc") o.material.color.set("#fff1d2");
  });
}
const srOldBuildStore = worldBuildStore;
worldBuildStore = function () {
  SR.pending = [];
  let r;
  try {
    r = srOldBuildStore.apply(this, arguments);
  } finally {
    const list = SR.pending || [];
    SR.pending = null;
    for (const [it, g] of list) if (!srModel(it, g, true)) srOldStoreProduct(it, g);
  }
  try {
    srTags();
    srLight();
  } catch (e) {
    console.warn(e);
  }
  renderer.shadowMap.needsUpdate = true;
  sceneDirty = true;
  return r;
};

/* ---------- The product card ---------- */
const SR_CAT = Object.fromEntries((typeof CATEGORIES !== "undefined" ? CATEGORIES : []).map(([id, n]) => [id, n]));
function srCard() {
  if (SR.card) return SR.card;
  const st = document.createElement("style");
  st.textContent = `#shopCard{position:fixed;right:max(18px,3vw);top:50%;transform:translate(14px,-50%);width:min(390px,40vw);padding:22px 24px 20px;background:linear-gradient(180deg,rgba(32,29,24,.93),rgba(22,20,17,.93));color:#efe6d2;border:1px solid rgba(232,214,170,.22);border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:'Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:8}
#shopCard.on{opacity:1;transform:translate(0,-50%)}
#shopCard .cat{font-size:14px;letter-spacing:.18em;color:#c9a86a}
#shopCard h2{margin:6px 0 10px;font:600 27px/1.25 'Noto Serif CJK SC','Songti SC',serif;color:#fff6e2}
#shopCard .price{display:flex;align-items:baseline;gap:14px;margin-bottom:14px}
#shopCard .price b{font:700 30px/1 'DejaVu Sans Mono',monospace;color:#f08d70}
#shopCard .price span{font-size:16px;color:#cfc3a8}
#shopCard .use{font-size:18px;line-height:1.65;margin:0 0 12px;color:#f5ecda}
#shopCard .use em{font-style:normal;display:inline-block;font-size:14px;padding:2px 8px;margin-right:8px;border-radius:3px;background:#c9a86a;color:#231f18;vertical-align:2px}
#shopCard .facts{font-size:15px;line-height:1.6;color:#cdbf9f;margin:0 0 14px;padding-top:10px;border-top:1px solid rgba(232,214,170,.15)}
#shopCard .keys{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:15px;color:#e3d7bd}
#shopCard kbd{display:inline-block;min-width:22px;padding:2px 7px;margin-right:5px;border:1px solid rgba(232,214,170,.4);border-radius:3px;font:600 14px/1.3 ui-monospace,monospace;text-align:center;color:#fff3d6;background:rgba(255,255,255,.06)}
#shopCard .budget{margin-top:12px;font-size:15px;color:#bcae8d}
#shopCard{max-height:92vh;overflow:hidden}
#shopCard .note{font:italic 17px/1.5 'Noto Serif CJK SC','Songti SC',serif;color:#e6d6b0;margin:-4px 0 10px}
#shopCard .use.fx em{background:#d9784f;color:#fff4e4}
#shopCard .use.small{font-size:16px;line-height:1.55;color:#e9dfca}
#shopCard .brand,#shopCard .prov{font-size:14px;line-height:1.5;color:#bfae88;margin:0 0 4px}
#shopCard .prov{color:#a39577;font-style:italic;margin-bottom:10px}
@media (max-width:760px){#shopCard{top:auto;bottom:12px;right:12px;left:12px;width:auto;transform:translate(0,10px);padding:14px 16px}#shopCard.on{transform:none}#shopCard h2{font-size:21px}#shopCard .use{font-size:16px}}`;
  document.head.appendChild(st);
  SR.card = document.createElement("div");
  SR.card.id = "shopCard";
  document.body.appendChild(SR.card);
  return SR.card;
}
function srEsc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
function srUseRows(it) {
  const c = typeof cgParts === "function" ? cgParts(it) : null;
  if (!c) return `<p class="use"><em>用途</em>${srEsc(itemUse(it))}</p>`;
  return (
    (c.note ? `<p class="note">${srEsc(c.note)}</p>` : "") +
    (c.fx ? `<p class="use fx"><em>特色</em>${srEsc(c.fx)}</p>` : "") +
    (c.use ? `<p class="use small"><em>用途</em>${srEsc(c.use)}</p>` : "") +
    (c.brand ? `<p class="brand">厂牌 · ${srEsc(c.brand)}</p>` : "") +
    (c.prov ? `<p class="prov">${srEsc(c.prov)}</p>` : "")
  );
}
function srUpdateCard() {
  const id = worldIsShopping() && !paused && !W.glance && typeof targetId === "string" && targetId.startsWith("buy:") ? targetId.slice(4) : "";
  const card = srCard();
  if (!id || !DB[id]) {
    if (card.classList.contains("on")) card.classList.remove("on");
    SR.cardKey = "";
    return;
  }
  const it = DB[id],
    inCart = cart[id] || 0,
    spent = cartSummary(cart).cost,
    key = id + ":" + inCart + ":" + spent.toFixed(2);
  if (key !== SR.cardKey) {
    SR.cardKey = key;
    card.innerHTML = `<div class="cat">${srEsc(SR_CAT[it.category] || "")}</div><h2>${srEsc(it.name)}</h2><div class="price"><b>E$ ${it.price.toFixed(2)}</b><span>篮中 ×${inCart}</span></div>${srUseRows(it)}<p class="facts">${srEsc(itemFacts(it))}</p><div class="keys"><span><kbd>E</kbd>放进篮子</span><span><kbd>Shift</kbd>+<kbd>E</kbd>拿5件</span><span><kbd>R</kbd>放回一件</span></div><div class="budget">已花 E$ ${spent.toFixed(2)} · 还剩 E$ ${(gameBudget() - spent).toFixed(2)} · 进门后不能再买</div>`;
  }
  card.classList.add("on");
}
const srPrevInfo = worldTargetInfo;
worldTargetInfo = function (o) {
  const id = o?.userData?.interact;
  if (worldIsShopping() && typeof id === "string" && id.startsWith("buy:") && DB[id.slice(4)]) {
    const it = DB[id.slice(4)];
    return [it.name, `E$ ${it.price.toFixed(2)}  ·  E 入篮  ·  右侧卡片写着它的用途`];
  }
  return srPrevInfo(o);
};
setInterval(() => {
  try {
    srUpdateCard();
  } catch (e) {}
}, 150);

/* ---------- Room focus hints say what an action does (v0.16 clarity) ---------- */
const SR_EFFECT = {
  bed: "效果：恢复体力，时间快进 · 一天睡超过9小时心情会变差",
  sofa: "效果：坐着休息 · 伸展：心情+9 健康+1.5 体力−5",
  sink: "效果：喝一杯水，水分+50",
  toilet: "效果：小便或大便需求清零（大便用一份卫生纸）",
  shower: "效果：清洁+55（有肥皂）/ +28（清水）· 心情+5 · 用8升水",
  laundry: "效果：脏衣服全部洗净，心情+3 · 用6升水和一份洗衣粉",
  clean: "效果：屋子脏乱−35（有扫帚）· 心情最多+6 · 30分钟",
  trash: "效果：屋子脏乱−8，清走变质食物",
  hands: "效果：洗手 清洁+8 · 刷牙 清洁+8 心情+1",
  mirror: "效果：剪指甲 心情+3 · 理发 心情+4",
  changeclothes: "效果：衣物恢复干净，心情+4",
  plant: "效果：心情+4，每天一次",
  candle: "效果：停电的夜里不再因为黑暗掉心情",
  radio: "效果：心情+10，听新闻、音乐和广播剧",
  window: "拉开：心情+2，但晚上更容易被看见 · 拉上：更隐蔽",
};
const srPrevInfo2 = worldTargetInfo;
worldTargetInfo = function (o) {
  const r = srPrevInfo2(o);
  if (worldIsShopping() || !o) return r;
  const id = o.userData?.interact || "";
  try {
    if (id.startsWith("stock:")) {
      const b = G?.inv.find((x) => x.uid === o.userData.uid),
        it = b && DB[b.id],
        use = it && itemUse(it),
        expiry = it?.life < 9999 ? "\n保质期：" + expiryInventoryLabel(it, b) : "";
      if (use || expiry) return [r[0], r[1] + (use ? "\n用途：" + use : "") + expiry];
    }
    if (SR_EFFECT[id] && !(id === "kitchen" && W.held)) return [r[0], r[1] + "\n" + SR_EFFECT[id]];
  } catch (e) {}
  return r;
};
(function () {
  const st = document.createElement("style");
  st.textContent = "#worldFocus span{white-space:pre-line}";
  document.head.appendChild(st);
})();
