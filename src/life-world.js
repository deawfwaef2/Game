/* 闭门365 · v0.10 life layer, 3D side: the letter bundle, windowsill pots and their plants, the letter page in
   the hands, radio captions, and models for home-grown produce. Everything is touched in the room — no panels. */
const LW = { root: null, stamp: "", mats: {} };
function lwMat(key, color, opts = {}) {
  if (!LW.mats[key])
    LW.mats[key] = new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.85, metalness: opts.m ?? 0, side: opts.side ?? THREE.FrontSide });
  return LW.mats[key];
}
function lwMesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData.noAO = true;
  parent.add(m);
  return m;
}
function lwRand(seed) {
  let s = lifeHash(String(seed)) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function lwPot(g) {
  const clay = lwMat("clay", "#a75f3c", { r: 0.92 });
  const prof = [[0.001, 0], [0.05, 0], [0.053, 0.006], [0.066, 0.092], [0.075, 0.094], [0.076, 0.118], [0.07, 0.12], [0.064, 0.104]].map(([x, y]) => new THREE.Vector2(x, y));
  lwMesh(g, new THREE.LatheGeometry(prof, 28), clay, 0, 0.012, 0).material.side = THREE.DoubleSide;
  lwMesh(g, new THREE.CylinderGeometry(0.074, 0.068, 0.012, 28), lwMat("saucer", "#94522f", { r: 0.9 }), 0, 0.006, 0);
  lwMesh(g, new THREE.CylinderGeometry(0.064, 0.064, 0.006, 24), lwMat("soil", "#3b2a1e", { r: 1 }), 0, 0.112, 0);
}
function lwPlant(g, p, i) {
  if (!p) return;
  const R = lwRand(env.seed + "-pot-" + i + "-" + p.planted),
    gr = Math.min(1, p.growth),
    wilt = p.dead ? 1 : p.water <= 0 ? Math.min(1, (p.dry || 0) / 24) : 0,
    top = 0.115;
  const green = p.dead ? lwMat("deadleaf", "#7a6340") : wilt > 0.3 ? lwMat("wiltleaf", "#7f8a45") : lwMat("leaf", "#4d7d31", { side: THREE.DoubleSide });
  if (p.crop === "scallion") {
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + R(),
        r = 0.015 + R() * 0.03,
        h = p.dead ? 0.03 : 0.025 + gr * (0.2 + R() * 0.07);
      lwMesh(g, new THREE.SphereGeometry(0.009, 8, 6), lwMat("bulb", "#e8e2c8"), Math.cos(a) * r, top + 0.004, Math.sin(a) * r).scale.y = 0.8;
      for (let j = 0; j < 2; j++) {
        const s = new THREE.Group();
        s.position.set(Math.cos(a) * r, top + 0.006, Math.sin(a) * r);
        s.rotation.set((R() - 0.5) * (0.25 + wilt * 1.1), R() * 6, (R() - 0.5) * (0.25 + wilt * 1.1));
        g.add(s);
        const hh = h * (j ? 0.75 : 1);
        lwMesh(s, new THREE.CylinderGeometry(0.0022, 0.0042, hh, 6), green, 0, hh / 2, 0);
      }
    }
  } else if (p.crop === "sprout") {
    if (gr < 0.18 && !p.dead) {
      const cloth = lwMesh(g, new THREE.BoxGeometry(0.12, 0.004, 0.12), lwMat("cloth", "#d9d2bd"), 0, top + 0.006, 0);
      cloth.rotation.y = 0.4;
      return;
    }
    const n = 46,
      stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0016, 0.0019, 1, 5), p.dead ? lwMat("deadsprout", "#9b8a62") : lwMat("sprout", "#efeacb"), n),
      head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0042, 6, 5), lwMat("sprouthead", "#c9c46a"), n),
      M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      E = new THREE.Euler();
    for (let k = 0; k < n; k++) {
      const a = R() * Math.PI * 2,
        r = Math.sqrt(R()) * 0.055,
        h = (p.dead ? 0.015 : 0.012 + gr * (0.055 + R() * 0.025)) * (1 - wilt * 0.4);
      E.set((R() - 0.5) * 0.4, 0, (R() - 0.5) * 0.4);
      Q.setFromEuler(E);
      M.compose(new THREE.Vector3(Math.cos(a) * r, top + h / 2, Math.sin(a) * r), Q, new THREE.Vector3(1, h, 1));
      stem.setMatrixAt(k, M);
      M.compose(new THREE.Vector3(Math.cos(a) * r, top + h, Math.sin(a) * r), Q, new THREE.Vector3(1, 1.3, 1));
      head.setMatrixAt(k, M);
    }
    for (const m of [stem, head]) {
      m.castShadow = true;
      m.userData.noAO = true;
      g.add(m);
    }
  } else if (p.crop === "tomato") {
    const H = p.dead ? 0.12 : 0.04 + gr * 0.4;
    if (gr > 0.3) lwMesh(g, new THREE.CylinderGeometry(0.003, 0.003, 0.5, 6), lwMat("stake", "#9c7b52"), 0.03, top + 0.25, -0.02);
    const stemG = new THREE.Group();
    stemG.position.y = top;
    stemG.rotation.z = wilt * 0.5;
    g.add(stemG);
    lwMesh(stemG, new THREE.CylinderGeometry(0.0028, 0.0045, H, 6), lwMat("stem", "#5b7b34"), 0, H / 2, 0);
    const leaves = Math.round(2 + gr * 12);
    for (let k = 0; k < leaves; k++) {
      const y = H * (0.15 + 0.85 * (k / Math.max(1, leaves - 1))),
        a = k * 2.4,
        L = new THREE.Group();
      L.position.set(0, y, 0);
      L.rotation.set(0, a, 0);
      stemG.add(L);
      const leaf = lwMesh(L, new THREE.PlaneGeometry(0.06, 0.028), green, 0.034, 0, 0);
      leaf.rotation.set(-Math.PI / 2 + 0.35 + wilt * 0.9, 0, 0);
    }
    if (!p.dead && gr > 0.82) {
      const fruiting = p.growth >= 1,
        ripe = Math.min(8, Math.floor(p.fruit || 0) * 3),
        total = fruiting ? Math.min(10, ripe + 3) : 0;
      for (let k = 0; k < (fruiting ? 2 : 4); k++) lwMesh(stemG, new THREE.SphereGeometry(0.005, 6, 5), lwMat("flower", "#e8c93a"), Math.cos(k * 2) * 0.03, H * (0.7 + k * 0.07), Math.sin(k * 2) * 0.03);
      for (let k = 0; k < total; k++) {
        const a = k * 1.9 + 0.5;
        lwMesh(stemG, new THREE.SphereGeometry(0.0115, 10, 8), k < ripe ? lwMat("ripe", "#c4321f", { r: 0.35 }) : lwMat("unripe", "#86a43f", { r: 0.4 }), Math.cos(a) * 0.035, H * (0.45 + (k % 4) * 0.08), Math.sin(a) * 0.035);
      }
    }
  }
}
function lwLetters(parent, opened, total) {
  const paper = lwMat("envelope", "#e7dcc2", { r: 0.95 }),
    string = lwMat("string", "#8a5b3a");
  const left = total - opened;
  if (left > 0) {
    const h = left * 0.0032;
    lwMesh(parent, new THREE.BoxGeometry(0.165, h, 0.112), paper, 0, h / 2, 0);
    lwMesh(parent, new THREE.BoxGeometry(0.168, h + 0.002, 0.004), string, 0, h / 2, 0);
    lwMesh(parent, new THREE.BoxGeometry(0.004, h + 0.002, 0.115), string, 0.03, h / 2, 0);
    lwMesh(parent, new THREE.BoxGeometry(0.11, 0.0012, 0.03), lwMat("label", "#f2ead5"), -0.01, h + 0.0007, -0.02);
  }
  const R = lwRand("opened");
  for (let k = 0; k < Math.min(opened, 8); k++) {
    const e = lwMesh(parent, new THREE.BoxGeometry(0.165, 0.0025, 0.112), lwMat("envelope-open", "#efe6cf", { r: 0.95 }), 0.05 + R() * 0.03, 0.0013 + k * 0.0026, 0.13 + R() * 0.03);
    e.rotation.y = (R() - 0.5) * 0.7;
  }
}
function lwBuild() {
  if (typeof roomRoot === "undefined" || !roomRoot || !G || phase !== "playing" || W.store) return;
  lifeEnsure();
  const slots = lifeSlots(),
    stamp = JSON.stringify([
      env.seed,
      slots,
      G.life.letters,
      G.life.garden.map((p) => p && [p.crop, Math.round(p.growth * 25), Math.floor((p.fruit || 0)), p.dead, p.water <= 0 ? Math.round(Math.min(24, p.dry || 0) / 6) : -1]),
    ]);
  if (LW.root && LW.root.parent === roomRoot && stamp === LW.stamp) return;
  LW.stamp = stamp;
  if (LW.root) {
    roomRoot.remove(LW.root);
    LW.root.traverse((o) => o.geometry && o.geometry.dispose());
  }
  LW.root = new THREE.Group();
  LW.root.name = "life";
  roomRoot.add(LW.root);
  // Windowsill pots: on the painted window board (top ≈1.011 m, room side of the casement).
  const back = -env.d / 2;
  for (let i = 0; i < slots; i++) {
    const g = new THREE.Group();
    g.position.set(0.62 + i * 0.24, 1.012, back + 0.125);
    g.rotation.y = i * 1.3;
    LW.root.add(g);
    lwPot(g);
    lwPlant(g, G.life.garden[i], i);
    worldTag(g, "garden:" + i, "窗台花盆");
  }
  // Letter bundle on the bedside cabinet top.
  const base = worldFindBase("inspect");
  if (base) {
    base.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    base.traverse((o) => {
      if (o.isMesh && o.visible && !o.userData.interactionProxy && o.material?.colorWrite !== false) box.expandByObject(o);
    });
    if (!box.isEmpty()) {
      const c = roomRoot.worldToLocal(new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2));
      const g = new THREE.Group();
      g.position.set(c.x - 0.04, c.y + 0.001, c.z - 0.05);
      g.rotation.y = 0.25;
      LW.root.add(g);
      lwLetters(g, G.life.letters, LIFE_LETTERS.length);
      worldTag(g, "letters", "家里的信");
    }
  }
  sceneDirty = true;
}
const lwBase = { syncWorldRoom, syncRoom, worldTargetInfo, worldInteract, worldUpdatePaper, worldProduct };
syncWorldRoom = function () {
  const r = lwBase.syncWorldRoom.apply(this, arguments);
  try { lwBuild(); } catch (e) { console.warn("life props", e); }
  return r;
};
syncRoom = function () {
  const r = lwBase.syncRoom.apply(this, arguments);
  try { lwBuild(); } catch (e) { console.warn("life props", e); }
  return r;
};
worldTargetInfo = function (o) {
  const id = o?.userData.interact || "";
  if (G && !(typeof worldIsShopping === "function" && worldIsShopping())) {
    if (id === "letters" || id === "inspect") return ["家里的信 · " + (LIFE_LETTERS.length - G.life.letters) + "封未拆", lifeLetterHint()];
    if (id.startsWith("garden:")) return lifeGardenHint(Number(id.slice(7)));
    if (id === "radio") {
      const [n, h] = lwBase.worldTargetInfo(o);
      return [n, h + "  ·  " + lifeRadioHint()];
    }
  }
  return lwBase.worldTargetInfo(o);
};
function lwShowLetter(index) {
  W.lifeLetter = index;
  W.glance = "letter";
  W.page = 0;
}
worldInteract = function (shift = false) {
  const id = W.focus?.userData.interact || "";
  const free = W.enabled && worldVisible() && !paused && !panelType && !W.busy && !W.glance && G && !(typeof worldIsShopping === "function" && worldIsShopping()) && phase === "playing";
  if (free && (id === "letters" || id === "inspect")) {
    lifeEnsure();
    const L = lifeNextLetter();
    if (L && (day() >= L.d || shift)) {
      const early = day() < L.d;
      return worldStart(early ? "犹豫了一下，还是解开了绳子" : "解开绳子，抽出一封信", 2.2, () => {
        if (lifeOpenLetter(early)) lwShowLetter(G.life.letters - 1);
      }, "use");
    }
    if (G.life.letters) {
      lwShowLetter(G.life.letters - 1);
      worldSetHand();
      worldRenderHUD();
      return;
    }
    showToast(lifeLetterHint());
    return;
  }
  if (free && id.startsWith("garden:")) {
    const i = Number(id.slice(7)),
      p = G.life.garden[i];
    if (!p) {
      const seeds = lifeSeeds();
      if (!seeds.length) return showToast("没有可种的东西。葱头、发芽绿豆、番茄种子要在开局采购时带上。");
      if (shift && seeds.length > 1) {
        W.lifeSeed = ((W.lifeSeed || 0) + 1) % seeds.length;
        return worldRenderHUD();
      }
      const k = seeds[(W.lifeSeed || 0) % seeds.length];
      return worldStart(`种下${LIFE_CROPS[k].name}`, 3, () => lifeSow(i, k), "use");
    }
    if (p.dead) return worldStart("把枯苗拔掉，松一松土", 2.5, () => lifeClear(i), "use");
    if (lifeReady(p) && !shift) {
      if (W.held) return showToast("手里有东西。先对准一个平面按 R 放下，再来收。");
      return worldStart(`收${LIFE_CROPS[p.crop].name}`, 2.6, () => {
        const b = lifeHarvest(i);
        if (b) worldEquip(b.uid, false);
      }, "use");
    }
    if (p.water > 75) return showToast("土还湿着，不用浇。浇多了根会烂。");
    return worldStart(`给${LIFE_CROPS[p.crop].name}浇水`, 2, () => lifeWater(i), "use", "bottle");
  }
  return lwBase.worldInteract(shift);
};
// The letter page in both hands: two pages of handwriting on aged paper.
worldUpdatePaper = function (force = false) {
  if (W.glance !== "letter") return lwBase.worldUpdatePaper(force);
  const model = W.handModel,
    c = model?.userData.canvas;
  if (!c) return;
  const n = Math.max(1, G.life.letters),
    idx = (((W.lifeLetter ?? n - 1) + (W.page || 0)) % n + n) % n,
    stamp = "letter" + idx;
  if (!force && W.paperStamp === stamp) return;
  W.paperStamp = stamp;
  const L = LIFE_LETTERS[idx],
    x = c.getContext("2d"),
    cw = c.width,
    ch = c.height;
  x.fillStyle = "#e9e0c9";
  x.fillRect(0, 0, cw, ch);
  const R = lwRand("paper" + idx);
  for (let k = 0; k < 900; k++) {
    x.fillStyle = `rgba(120,96,60,${R() * 0.05})`;
    x.fillRect(R() * cw, R() * ch, 1 + R() * 2, 1 + R() * 2);
  }
  x.strokeStyle = "rgba(90,80,60,0.18)";
  x.beginPath();
  x.moveTo(cw / 2, 0);
  x.lineTo(cw / 2, ch);
  x.stroke();
  x.strokeStyle = "rgba(70,100,140,0.16)";
  for (let y = 112; y < ch - 40; y += 48) {
    x.beginPath();
    x.moveTo(36, y + 14);
    x.lineTo(cw / 2 - 30, y + 14);
    x.moveTo(cw / 2 + 30, y + 14);
    x.lineTo(cw - 36, y + 14);
    x.stroke();
  }
  x.fillStyle = "#7d6a4c";
  x.font = "22px 'Noto Serif CJK SC','Songti SC',serif";
  x.textAlign = "left";
  x.fillText(`第${idx + 1}封 · ${L.from} · 写着“第${L.d}天再拆”`, 40, 58);
  x.textAlign = "right";
  x.fillText(n > 1 ? `滚轮翻看其他信（${idx + 1}/${n}）` : "Tab / R 收好", cw - 40, 58);
  x.textAlign = "left";
  x.fillStyle = "#24314a";
  x.font = "30px 'Kaiti SC','STKaiti','KaiTi','Noto Serif CJK SC',serif";
  L.lines.forEach((t, k) => {
    const page = k < 12 ? 0 : 1,
      row = k % 12;
    x.save();
    x.translate(page * (cw / 2) + 46 + (R() - 0.5) * 3, 120 + row * 48);
    x.rotate((R() - 0.5) * 0.012);
    x.fillText(t, 0, 0, cw / 2 - 86);
    x.restore();
  });
  model.userData.page.material.map.needsUpdate = true;
};
// Home-grown produce held in the hand or set down on a surface.
worldProduct = function (id, parent = null, bare = false) {
  if (!LIFE_PRODUCE[id]) return lwBase.worldProduct(id, parent, bare);
  const g = new THREE.Group(),
    R = lwRand(id);
  if (id === "greens") {
    for (let k = 0; k < 9; k++) {
      const s = lwMesh(g, new THREE.CylinderGeometry(0.003, 0.004, 0.2, 6), lwMat("leaf", "#4d7d31", { side: THREE.DoubleSide }), (R() - 0.5) * 0.02, 0.1, (R() - 0.5) * 0.02);
      s.rotation.z = (R() - 0.5) * 0.25;
    }
    lwMesh(g, new THREE.TorusGeometry(0.011, 0.002, 6, 12), lwMat("string", "#8a5b3a"), 0, 0.05, 0).rotation.x = Math.PI / 2;
    g.userData.height = 0.2;
  } else {
    lwMesh(g, new THREE.CylinderGeometry(0.07, 0.05, 0.045, 24, 1, true), lwMat("bowl", "#e8e4d6", { r: 0.4, side: THREE.DoubleSide }), 0, 0.0225, 0);
    lwMesh(g, new THREE.CylinderGeometry(0.05, 0.05, 0.004, 20), lwMat("bowl", "#e8e4d6"), 0, 0.002, 0);
    const n = id === "sprouts" ? 30 : 8;
    for (let k = 0; k < n; k++) {
      const a = R() * 6.28,
        r = Math.sqrt(R()) * 0.05;
      if (id === "sprouts") {
        const m = lwMesh(g, new THREE.CylinderGeometry(0.002, 0.002, 0.05, 5), lwMat("sprout", "#efeacb"), Math.cos(a) * r, 0.035, Math.sin(a) * r);
        m.rotation.set(R() * 1.4, R() * 6, R() * 1.4);
      } else lwMesh(g, new THREE.SphereGeometry(0.012, 10, 8), lwMat("ripe", "#c4321f", { r: 0.35 }), Math.cos(a) * r, 0.025 + (k % 3) * 0.008, Math.sin(a) * r);
    }
    g.userData.height = 0.06;
  }
  if (parent) parent.add(g);
  return g;
};
(function lwStyle() {
  const st = document.createElement("style");
  st.textContent = `#lifeCaption{position:fixed;left:50%;bottom:17%;transform:translate(-50%,8px);max-width:min(720px,88vw);padding:12px 20px 14px;background:rgba(18,17,14,.62);backdrop-filter:blur(3px);border-left:2px solid #c9a86a;color:#efe7d4;font:16px/1.65 'Noto Serif CJK SC','Songti SC',serif;letter-spacing:.04em;opacity:0;transition:opacity .5s,transform .5s;pointer-events:none;z-index:40}
#lifeCaption.on{opacity:1;transform:translate(-50%,0)}#lifeCaption small{display:block;font:11px/1.4 ui-monospace,monospace;letter-spacing:.12em;color:#c9a86a;margin-bottom:4px}#lifeCaption p{margin:0}`;
  document.head.appendChild(st);
})();
