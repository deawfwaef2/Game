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
// Strings of paper cranes hanging from the head of the window opening, 100 per string, edges first.
function lwCraneGeo() {
  if (LW.craneGeo) return LW.craneGeo;
  const v = [
    0, 0, 0.012, 0, 0.004, 0, 0, 0, -0.012, // body ridge (front, top, back)
    0, 0.002, 0.004, 0.017, 0.006, -0.002, 0, 0.002, -0.006, // right wing
    0, 0.002, 0.004, 0, 0.002, -0.006, -0.017, 0.006, -0.002, // left wing
    0, 0, 0.012, 0, 0.012, 0.016, 0, 0.003, 0.006, // neck
    0, 0, -0.012, 0, 0.009, -0.017, 0, 0.003, -0.006, // tail
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return (LW.craneGeo = g);
}
function lwCranes(root, count, back) {
  if (count <= 0) return;
  // Real senbazuru: about 30 cranes per string, nested close; strings hang at both edges of the opening, two rows deep.
  const per = 30,
    strings = Math.min(32, Math.ceil(count / per)),
    total = Math.min(count, strings * per),
    mat = new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide }),
    mesh = new THREE.InstancedMesh(lwCraneGeo(), mat, total),
    thread = lwMat("thread", "#d8d0bc"),
    colors = ["#c8463c", "#e3b23c", "#3f7cac", "#5b9a5b", "#efe8d6", "#c86b98", "#e07b39", "#6b5ca5", "#2f8f8a"].map((c) => new THREE.Color(c)),
    R = lwRand("cranes" + env.seed),
    M = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    S = new THREE.Vector3(2.1, 2.1, 2.1);
  let k = 0;
  for (let s = 0; s < strings; s++) {
    const side = s % 2 ? -1 : 1,
      slot = Math.floor(s / 2),
      x = side * (1.27 - (slot % 8) * 0.058),
      z = back + (slot < 8 ? 0.11 : 0.2),
      n = Math.min(per, total - s * per),
      top = 2.43,
      len = n * 0.022 + 0.05;
    lwMesh(root, new THREE.CylinderGeometry(0.0006, 0.0006, len, 3), thread, x, top - len / 2, z).castShadow = false;
    for (let j = 0; j < n && k < total; j++, k++) {
      Q.setFromEuler(new THREE.Euler(0, R() * 6.28, 0));
      M.compose(new THREE.Vector3(x, top - 0.04 - j * 0.022, z), Q, S);
      mesh.setMatrixAt(k, M);
      mesh.setColorAt(k, colors[Math.floor(R() * colors.length)]);
    }
  }
  mesh.count = k;
  mesh.castShadow = true;
  mesh.userData.noAO = true;
  root.add(mesh);
}
function lwBuild() {
  if (typeof roomRoot === "undefined" || !roomRoot || !G || phase !== "playing" || W.store) return;
  lifeEnsure();
  const slots = lifeSlots(),
    stamp = JSON.stringify([
      env.seed,
      slots,
      G.life.letters,
      Math.floor((G.life.cranes || 0) / 5),
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
  lwCranes(LW.root, G.life.cranes || 0, back);
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
    if (id === "journal") return ["墙上的旧日历", `第${day()}天 · 还有${Math.max(0, 365 - day())}天  ·  E 看看这一年`];
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
  if (free && id === "journal") {
    W.glance = "year";
    W.page = 0;
    worldSetHand();
    worldRenderHUD();
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
function lwYearPage(model) {
  const c = model.userData.canvas,
    stamp = "year" + Math.floor(G.minute / 10) + JSON.stringify(G.life.goalsDone);
  if (W.paperStamp === stamp) return;
  W.paperStamp = stamp;
  lifeEnsure();
  const x = c.getContext("2d"),
    cw = c.width,
    ch = c.height,
    L = G.life,
    rec = lmRecords();
  x.fillStyle = "#e4dcc6";
  x.fillRect(0, 0, cw, ch);
  x.strokeStyle = "rgba(90,80,60,0.2)";
  x.beginPath();
  x.moveTo(cw / 2, 0);
  x.lineTo(cw / 2, ch);
  x.stroke();
  const serif = "'Noto Serif CJK SC','Songti SC',serif";
  const text = (t, px, X, Y, color = "#2f3a2c", w = cw / 2 - 80) => {
    x.font = `${px}px ${serif}`;
    x.fillStyle = color;
    x.fillText(t, X, Y, w);
  };
  x.textAlign = "left";
  text(`第 ${day()} 天`, 44, 40, 70, "#2b3326");
  text(`还有 ${Math.max(0, 365 - day())} 天 · 你在躲：${LM.gang.g}`, 21, 40, 106, "#6d6450");
  text("今年的小目标", 24, 40, 160, "#5a4a32");
  lmGoalRows().forEach((g, i) => {
    const y = 205 + i * 70;
    text((g.done ? "✓ " : "") + g.t, 23, 40, y, g.done ? "#4f6b3a" : "#2f3a2c");
    x.fillStyle = "rgba(80,70,50,0.15)";
    x.fillRect(40, y + 14, cw / 2 - 100, 8);
    x.fillStyle = g.done ? "#6c8c4a" : "#9c7b52";
    x.fillRect(40, y + 14, ((cw / 2 - 100) * g.cur) / g.max, 8);
    text(`${g.cur}/${g.max}`, 17, cw / 2 - 56, y + 22, "#7a705a", 60);
  });
  if (!(L.goals || []).length) text("（开局采购后生成）", 21, 40, 210, "#7a705a");
  const X = cw / 2 + 36;
  text("这一年", 24, X, 70, "#5a4a32");
  const chains = Object.entries(L.chains || {})
    .filter(([, c]) => c.step > 0)
    .map(([id, c]) => `${LM_CHAINS.find((q) => q.id === id).name} ${c.step}/6`);
  [
    `家信 ${L.letters}/16${L.early ? ` · 提前拆了${L.early}封` : ""}`,
    `自己种的菜 收获${L.harvests}次`,
    `纸鹤 ${L.cranes}只`,
    `回忆录 ${L.memoir}页 · ${Math.min(12, Math.floor(L.memoir / 20))}/12章`,
    `拼图 完成${L.puzzles}次 · 当前${L.pieces}/500`,
    `广播剧 听了${L.serial}集 · 新闻${L.news}条`,
    chains.length ? "邻居：" + chains.join("　") : "邻居：还没听见什么",
    typeof LR_TRAITS !== "undefined" ? "性格：" + LR_TRAITS.filter((q) => (L.traits || []).includes(q.id)).map((q) => q.t).join("、") : "",
    typeof LR_FAULTS !== "undefined" ? "家里的毛病：" + (Object.keys(L.faults || {}).map((k) => LR_FAULTS[k].t).join("、") || "暂时没有") : "",
    `做过的菜 ${Object.keys(L.dishes || {}).length} 种`,
  ].forEach((t, i) => text(t, 20, X, 108 + i * 34));
  text("所有的生活", 24, X, 466, "#5a4a32");
  text(`开始过 ${rec.runs} 次 · 撑满一年 ${rec.wins} 次 · 最长 ${rec.best} 天`, 19, X, 500);
  text(`找到的结局 ${rec.endings.length}/${LM_ENDINGS.length}`, 19, X, 532);
  LM_ENDINGS.forEach((e, i) => text(rec.endings.includes(e.id) ? "◆ " + e.t : "◇ ？？？", 18, X + (i % 2) * 210, 566 + Math.floor(i / 2) * 30, rec.endings.includes(e.id) ? "#4f6b3a" : "#8a806a", 200));
  const next = LM_ENDINGS.find((e) => !rec.endings.includes(e.id));
  if (next) text("下一次也许可以：" + next.hint, 17, X, 704, "#7a5a3a");
  text("Tab / R 合上", 17, X, ch - 30, "#8a806a");
  model.userData.page.material.map.needsUpdate = true;
}
worldUpdatePaper = function (force = false) {
  if (W.glance === "year" && W.handModel?.userData.canvas) {
    if (force) W.paperStamp = "";
    return lwYearPage(W.handModel);
  }
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
if (typeof showEnd === "function") {
  const lwShowEnd = showEnd;
  showEnd = function () {
    lwShowEnd();
    try {
      lifeEnsure();
      const e = LM_ENDINGS.find((q) => q.id === G.life.ending) || { t: G.win ? "归港" : "未完的一年" },
        rec = lmRecords(),
        done = G.life.goalsDone.length,
        next = LM_ENDINGS.find((q) => !rec.endings.includes(q.id));
      const box = document.createElement("section");
      box.className = "life-ending";
      box.innerHTML = `<small>结局</small><strong></strong><p></p>`;
      box.querySelector("strong").textContent = "「" + e.t + "」";
      box.querySelector("p").textContent = `今年的小目标完成 ${done}/${(G.life.goals || []).length} · 找到的结局 ${rec.endings.length}/${LM_ENDINGS.length}` + (next ? ` · 下一次也许可以：${next.hint}` : " · 全部结局都找到了");
      const btn = document.querySelector("#endScreen .start-button");
      btn?.parentNode.insertBefore(box, btn);
    } catch (err) {}
  };
}
(function lwStyle() {
  const st = document.createElement("style");
  st.textContent = `#lifeCaption{position:fixed;left:50%;bottom:17%;transform:translate(-50%,8px);max-width:min(720px,88vw);padding:12px 20px 14px;background:rgba(18,17,14,.62);backdrop-filter:blur(3px);border-left:2px solid #c9a86a;color:#efe7d4;font:20px/1.65 'Noto Serif CJK SC','Songti SC',serif;letter-spacing:.04em;opacity:0;transition:opacity .5s,transform .5s;pointer-events:none;z-index:40}
#lifeCaption.on{opacity:1;transform:translate(-50%,0)}#lifeCaption small{display:block;font:14px/1.4 ui-monospace,monospace;letter-spacing:.12em;color:#c9a86a;margin-bottom:4px}#lifeCaption p{margin:0}.life-ending{margin:18px 0 22px;padding:14px 18px;border-left:2px solid #c9a86a;background:rgba(255,255,255,.04)}.life-ending small{display:block;font-size:11px;letter-spacing:.2em;opacity:.7}.life-ending strong{display:block;font-size:24px;margin:4px 0;font-family:'Noto Serif CJK SC','Songti SC',serif}.life-ending p{margin:0;opacity:.8;font-size:14px}`;
  document.head.appendChild(st);
})();
