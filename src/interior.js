/* v0.7 interior pass. Period materials, a correctly oriented 1980s refrigerator, a real kitchen
   run with a freestanding electric cooker, a tiled bathroom, a padded entrance door, soft corner
   occlusion and printed packaging. Purely visual: every production interaction id is preserved. */
const I = {
  clock: null,
  hob: null,
  globe: null,
  labels: new Map(),
  mats: new Map(),
  geos: new Map(),
};
function iTex(name, rx = 1, ry = 1) {
  const src = R.textures[name];
  if (!src) return null;
  const t = src.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}
function iPBR(prefix, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: opts.color || "#ffffff",
    roughness: opts.roughness ?? 0.8,
    metalness: 0,
    envMapIntensity: opts.env ?? 0.35,
  });
  const diff = iTex(prefix + "_diff");
  if (diff) m.map = diff;
  const nor = iTex(prefix + "_nor_gl");
  if (nor) {
    m.normalMap = nor;
    m.normalScale = new THREE.Vector2(opts.normal ?? 0.5, opts.normal ?? 0.5);
  }
  const arm = opts.arm === false ? null : iTex(prefix + "_arm");
  if (arm) m.roughnessMap = arm;
  return m;
}
function iStd(color, roughness = 0.6, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    envMapIntensity: 0.4,
    ...extra,
  });
}
// Metre-based planar UVs so a texture keeps its real scale on walls of any size.
function iPlanarUV(mesh, tw, th, origin = roomRoot) {
  const g = mesh.geometry,
    pos = g.attributes.position,
    nor = g.attributes.normal;
  if (!pos || !nor) return;
  origin.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);
  const m = new THREE.Matrix4()
      .copy(origin.matrixWorld)
      .invert()
      .multiply(mesh.matrixWorld),
    nm = new THREE.Matrix3().getNormalMatrix(m),
    v = new THREE.Vector3(),
    n = new THREE.Vector3(),
    uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m);
    n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
    const ax = Math.abs(n.x),
      ay = Math.abs(n.y),
      az = Math.abs(n.z);
    let u, w;
    if (ay >= ax && ay >= az) {
      u = v.x;
      w = v.z;
    } else if (ax >= az) {
      u = v.z * Math.sign(n.x || 1);
      w = v.y;
    } else {
      u = -v.x * Math.sign(n.z || 1);
      w = v.y;
    }
    uv[i * 2] = u / tw;
    uv[i * 2 + 1] = w / th;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
function iBox(parent, size, point, mat, radius = 0.004) {
  const m = radius
    ? roomRound(parent, size, point, mat, radius)
    : new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  if (!radius) {
    m.position.fromArray(point);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
  }
  return m;
}
function iFlip(o) {
  // Mirrored apartments flip the whole room; printed text must still read correctly.
  if (env.mirror) o.scale.x *= -1;
  return o;
}
function iCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
let I_GRAD = null;
function iGradient() {
  if (I_GRAD) return I_GRAD;
  I_GRAD = iCanvas(4, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.35, "rgba(0,0,0,0.45)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  });
  return I_GRAD;
}
function iShade(opacity) {
  return new THREE.MeshBasicMaterial({
    map: iGradient(),
    color: "#1a120a",
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}
// Soft occlusion where planes meet: what makes a box room read as a lived-in space.
function iCorners() {
  const w = env.w,
    d = env.d,
    root = new THREE.Group();
  root.name = "ambient-occlusion";
  roomRoot.add(root);
  const strip = (frame, w0, h0, pos, rot, flip, opacity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w0, h0), iShade(opacity));
    m.position.fromArray(pos);
    m.rotation.set(...rot);
    if (flip) m.scale.y = -1;
    m.userData.noPick = true;
    m.renderOrder = 2;
    frame.add(m);
  };
  for (const [theta, D, L] of [
    [0, d / 2 - 0.07, w],
    [Math.PI, d / 2 - 0.07, w],
    [Math.PI / 2, w / 2 - 0.07, d],
    [-Math.PI / 2, w / 2 - 0.07, d],
  ]) {
    const f = new THREE.Group();
    f.rotation.y = theta;
    root.add(f);
    strip(f, L, 0.42, [0, 0.006, D - 0.21], [-Math.PI / 2, 0, 0], false, 0.2);
    strip(f, L, 0.3, [0, 0.28, D - 0.003], [0, Math.PI, 0], false, 0.13);
    strip(f, L, 0.32, [0, 2.64, D - 0.003], [0, Math.PI, 0], true, 0.16);
    strip(f, L, 0.5, [0, 2.795, D - 0.25], [Math.PI / 2, 0, 0], true, 0.2);
    for (const s of [-1, 1])
      strip(
        f,
        2.72,
        0.34,
        [s * (L / 2 - 0.07 - 0.17), 1.42, D - 0.004],
        [0, Math.PI, s * (Math.PI / 2)],
        false,
        0.12,
      );
  }
  const blob = iCanvas(128, 128, (x) => {
    const g = x.createRadialGradient(64, 64, 6, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,.75)");
    g.addColorStop(0.6, "rgba(0,0,0,.3)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
  });
  const contact = (x, z, sx, sz, op = 0.42) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sz),
      new THREE.MeshBasicMaterial({
        map: blob,
        transparent: true,
        opacity: op,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.007, z);
    m.userData.noPick = true;
    root.add(m);
  };
  const back = -d / 2,
    front = d / 2;
  contact(w / 2 - 1.0, back + 0.42, 2.6, 0.95, 0.5);
  if (env.fridge) contact(w / 2 - 0.42, -0.72, 0.9, 1.0, 0.55);
  contact(w / 2 - 0.25, 0.41, 0.7, 1.6, 0.42);
  contact(-w / 2 + 1.65, front - 0.37, 1.0, 0.8, 0.5);
  contact(w / 2 - 0.49, front - 0.5, 0.65, 0.75, 0.38);
}
function iWalls() {
  const paper = sceneMats.wall;
  paper.map = iTex("wallpaper-1986_diff");
  paper.normalMap = iTex("painted_plaster_wall_nor_gl");
  paper.normalScale = new THREE.Vector2(0.22, 0.22);
  paper.roughnessMap = null;
  paper.metalnessMap = null;
  paper.roughness = 0.9;
  paper.envMapIntensity = 0.22;
  paper.color
    .set(["#fbf8ef", "#eef0e2", "#e9ebe6"][env.wall])
    .multiplyScalar([1, 0.95, 0.88][env.wear]);
  paper.needsUpdate = true;
  const sill = roomRoot.children.find(
    (o) =>
      o.isMesh &&
      o.material === sceneMats.paint &&
      Math.abs((o.geometry.parameters?.width || 0) - 2.65) < 0.01,
  );
  if (sill) sill.material = paper;
  roomRoot.traverse((o) => {
    if (o.isMesh && o.material === paper) iPlanarUV(o, 0.84, 0.42);
  });
  const ceiling = roomRoot.children.find(
    (o) =>
      o.isMesh && o.geometry.parameters?.height === 0.1 && o.position.y > 2.8,
  );
  if (ceiling) {
    ceiling.material.color.set("#ddd9cf");
    ceiling.material.roughness = 0.97;
    ceiling.material.normalMap = iTex("painted_plaster_wall_nor_gl");
    ceiling.material.normalScale = new THREE.Vector2(0.35, 0.35);
    ceiling.material.needsUpdate = true;
    iPlanarUV(ceiling, 1.6, 1.6);
    ceiling.material.color.set(["#d9d4c7", "#d2ccbd", "#c9c1ae"][env.wear]);
    // Decades of lamp smoke and one old leak from the flat above.
    const stain = iCanvas(512, 512, (x, w, h) => {
      const blot = (cx, cy, r, col, a) => {
        const g = x.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        g.addColorStop(0, `rgba(${col},${a})`);
        g.addColorStop(1, `rgba(${col},0)`);
        x.fillStyle = g;
        x.beginPath();
        x.arc(cx, cy, r, 0, Math.PI * 2);
        x.fill();
      };
      blot(256, 256, 150, "120,100,70", 0.12);
      const sx = 70 + (iHash(String(env.seed) + "leak") % 90),
        sy = 70;
      blot(sx, sy, 52, "150,118,62", 0.07 + env.wear * 0.03);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + iRand(i) * 0.5;
        blot(sx + Math.cos(a) * 24, sy + Math.sin(a) * 16, 24 + iRand(i + 3) * 10, "150,118,62", 0.04 + env.wear * 0.02);
      }
      x.strokeStyle = `rgba(130,95,45,${0.1 + env.wear * 0.05})`;
      x.lineWidth = 3;
      x.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2,
          r = 46 + Math.sin(a * 3 + 1) * 6 + Math.sin(a * 5 + 2) * 2.5;
        x[i ? "lineTo" : "moveTo"](sx + Math.cos(a) * r * 0.7, sy + Math.sin(a) * r * 0.5);
      }
      x.stroke();
      x.strokeStyle = "rgba(90,85,75,.22)";
      x.lineWidth = 1;
      x.beginPath();
      let cx = 330, cy = 40;
      x.moveTo(cx, cy);
      for (let i = 0; i < 18; i++) x.lineTo((cx += 6 + iRand(i) * 6), (cy += (iRand(i + 9) - 0.3) * 12));
      x.stroke();
    });
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(env.w - 0.14, env.d - 0.14),
      new THREE.MeshStandardMaterial({ map: stain, transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    );
    decal.rotation.x = Math.PI / 2;
    decal.position.set(0, ceiling.position.y - 0.0505, 0);
    decal.userData.noPick = true;
    roomRoot.add(decal);
  }
  // Painted plaster cornice, the detail a flat-box ceiling lacks.
  const cornice = iStd("#e2ded3", 0.92),
    w = env.w,
    d = env.d;
  for (const [x, z, len, rot] of [
    [0, -d / 2 + 0.07, w, 0],
    [0, d / 2 - 0.07, w, Math.PI],
    [-w / 2 + 0.07, 0, d, Math.PI / 2],
    [w / 2 - 0.07, 0, d, -Math.PI / 2],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, 2.8, z);
    g.rotation.y = rot;
    roomRoot.add(g);
    const cove = new THREE.Mesh(new THREE.BoxGeometry(len, 0.075, 0.018), cornice);
    cove.rotation.x = Math.PI / 4;
    cove.position.set(0, -0.033, 0.033);
    g.add(cove);
    iBox(g, [len, 0.018, 0.012], [0, -0.078, 0.006], cornice, 0);
    iBox(g, [len, 0.012, 0.08], [0, -0.006, 0.04], cornice, 0);
  }
}
function iRug() {
  const rug = roomRoot.children.find(
    (o) =>
      o.isMesh &&
      Math.abs((o.geometry.parameters?.width || 0) - 1.9) < 0.01 &&
      (o.geometry.parameters?.height || 1) < 0.02,
  );
  if (!rug) return;
  rug.material = new THREE.MeshStandardMaterial({
    map: iTex("rug-oriental_diff"),
    normalMap: iTex("denim_fabric_nor_gl", 6, 4),
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 1,
    envMapIntensity: 0.12,
    color: env.wear === 2 ? "#d8cfc4" : "#ffffff",
  });
  rug.scale.y = 0.7;
}
function iCeilingLamp() {
  const pendant = roomRoot.children.find(
    (o) => o.isMesh && o.geometry.type === "ConeGeometry",
  );
  const cord = roomRoot.children.find(
    (o) =>
      o.isMesh &&
      Math.abs((o.geometry.parameters?.height || 0) - 0.55) < 0.01 &&
      (o.geometry.parameters?.width || 1) < 0.02,
  );
  if (pendant) pendant.visible = false;
  if (cord) cord.visible = false;
  if (!R.models.modern_ceiling_lamp_01) return;
  const lamp = roomCopy("modern_ceiling_lamp_01");
  lamp.position.set(0, 2.8 - 0.528, 0.05);
  roomRoot.add(lamp);
  lamp.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    const m = o.material;
    if (m.name === "modern_ceiling_globe" || m.name.includes("glass")) {
      m.emissive = new THREE.Color("#ffe3b0");
      m.emissiveIntensity = 0;
      I.globe = m;
    }
  });
  ceilingLight.position.set(0, 2.32, 0.05);
}
function iClock() {
  if (!R.models.wall_clock) return;
  const g = roomCopy("wall_clock"),
    holder = new THREE.Group();
  holder.add(g);
  holder.position.set(-0.35, 2.5, env.d / 2 - 0.075);
  holder.rotation.y = Math.PI;
  holder.scale.setScalar(0.9);
  iFlip(holder);
  roomRoot.add(holder);
  I.clock = {
    minute: g.getObjectByName("wall_clock_minute_hand"),
    hour: g.getObjectByName("wall_clock_hours_hand"),
    second: g.getObjectByName("wall_clock_second_hand"),
  };
}
function iClockTick(now) {
  if (!I.clock?.minute) return;
  const m = G && phase === "playing" ? G.minute : 8 * 60 + 10;
  const mins = m % 60,
    hrs = (m / 60) % 12,
    rad = Math.PI / 180;
  // The model is authored showing 10:10:30 (minute 57.4°, hour 305.5°, second 176.5° clockwise from 12).
  I.clock.minute.rotation.z = -(mins * 6 - 57.4) * rad;
  I.clock.hour.rotation.z = -(hrs * 30 - 305.5) * rad;
  I.clock.second.rotation.z = -(((now / 1000) % 60) * 6 - 176.5) * rad;
}
function iDoorPanel(seed) {
  return iCanvas(512, 1024, (x, w, h) => {
    x.fillStyle = "#4a2a20";
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = 30 + Math.random() * 30;
      x.fillStyle = `rgba(${v + 30},${v},${v - 10},.08)`;
      x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    const cols = 4,
      rows = 9,
      cw = w / cols,
      rh = h / rows;
    x.lineWidth = 7;
    for (let r = -1; r <= rows + 1; r++)
      for (let c = -1; c <= cols + 1; c++) {
        const cx = c * cw + ((r & 1) * cw) / 2,
          cy = r * rh;
        const g = x.createRadialGradient(cx, cy, 4, cx, cy, cw * 0.62);
        g.addColorStop(0, "rgba(255,210,170,.14)");
        g.addColorStop(1, "rgba(0,0,0,.22)");
        x.fillStyle = g;
        x.beginPath();
        x.moveTo(cx, cy - rh / 2);
        x.lineTo(cx + cw / 2, cy);
        x.lineTo(cx, cy + rh / 2);
        x.lineTo(cx - cw / 2, cy);
        x.closePath();
        x.fill();
        x.strokeStyle = "rgba(20,8,4,.55)";
        x.stroke();
      }
  });
}
function iEntranceDoor() {
  const door = worldFindBase("door");
  if (!door) return;
  const slab = door.children[0],
    old = door.children.slice(4);
  for (const o of old) o.visible = o.material?.map ? true : false;
  const tex = iDoorPanel();
  slab.material = new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.9,
    roughness: 0.55,
    envMapIntensity: 0.4,
  });
  // Upholstery nails at the quilting points.
  const brass = new THREE.MeshStandardMaterial({
    color: "#b08c4e",
    metalness: 0.9,
    roughness: 0.35,
  });
  const pts = [];
  for (let r = 0; r <= 9; r++)
    for (let c = 0; c <= 4; c++) {
      const x = -0.47 + (c + ((r & 1) ? 0.5 : 0)) * 0.235,
        y = 2.16 - r * 0.24;
      if (x > -0.46 && x < 0.46 && y > 0.04 && y < 2.12) pts.push([x, y]);
    }
  const nails = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.008, 10, 6),
    brass,
    pts.length,
  );
  const m4 = new THREE.Matrix4();
  pts.forEach(([x, y], i) => nails.setMatrixAt(i, m4.makeTranslation(x, y, -0.043)));
  door.add(nails);
  // Welted border, lever handle, deadbolt, peephole ring and security chain.
  const welt = iStd("#3a2018", 0.5);
  for (const [w0, h0, x, y] of [
    [0.94, 0.03, 0, 2.145],
    [0.94, 0.03, 0, 0.015],
    [0.03, 2.16, -0.455, 1.08],
    [0.03, 2.16, 0.455, 1.08],
  ])
    iBox(door, [w0, h0, 0.03], [x, y, -0.045], welt, 0.012);
  const chrome = new THREE.MeshStandardMaterial({
    color: "#c9ccc6",
    metalness: 0.95,
    roughness: 0.25,
  });
  iBox(door, [0.05, 0.2, 0.012], [0.36, 1.0, -0.05], chrome, 0.006);
  const lever = iBox(door, [0.13, 0.02, 0.022], [0.31, 1.04, -0.075], chrome, 0.008);
  lever.rotation.z = -0.06;
  iBox(door, [0.016, 0.016, 0.03], [0.36, 1.04, -0.062], chrome, 0.005);
  const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.02, 20), brass);
  lock.rotation.x = Math.PI / 2;
  lock.position.set(0.36, 1.25, -0.055);
  door.add(lock);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 20), chrome);
  ring.position.set(0, 1.58, -0.05);
  door.add(ring);
  iBox(door, [0.1, 0.022, 0.012], [0.33, 1.72, -0.05], chrome, 0.004);
  // Unhooked chain hanging from the end of its slide track.
  const linkGeo = new THREE.TorusGeometry(0.0075, 0.0021, 6, 12);
  for (let i = 0; i < 12; i++) {
    const link = new THREE.Mesh(linkGeo, chrome);
    link.scale.set(1, 1.5, 1);
    link.position.set(0.375 + Math.sin(i * 0.25) * 0.006, 1.705 - i * 0.0185, -0.058);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
    door.add(link);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), chrome);
  ball.position.set(0.377, 1.48, -0.058);
  door.add(ball);
  // Number plate.
  const numberPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.07),
    new THREE.MeshStandardMaterial({
      map: iCanvas(256, 120, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#d6b46c");
        g.addColorStop(1, "#8d6a2e");
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        x.strokeStyle = "#5b4219";
        x.lineWidth = 6;
        x.strokeRect(6, 6, w - 12, h - 12);
        x.fillStyle = "#2b1e0c";
        x.font = "bold 78px Georgia, serif";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(String(env.number), w / 2, h / 2 + 4);
      }),
      metalness: 0.7,
      roughness: 0.35,
    }),
  );
  numberPlate.position.set(0, 1.84, -0.062);
  numberPlate.rotation.y = Math.PI;
  iFlip(numberPlate);
  door.add(numberPlate);
  for (const o of door.children)
    if (o.isMesh && o.material?.map && o !== slab && o !== numberPlate && o.geometry.parameters?.width === 0.24)
      o.visible = false;
  // Coir doormat inside the threshold.
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.012, 0.45),
    new THREE.MeshStandardMaterial({
      map: iCanvas(256, 160, (x, w, h) => {
        x.fillStyle = "#6f5434";
        x.fillRect(0, 0, w, h);
        for (let i = 0; i < 6000; i++) {
          const v = 70 + Math.random() * 70;
          x.fillStyle = `rgba(${v + 40},${v + 10},${v - 30},.35)`;
          x.fillRect(Math.random() * w, Math.random() * h, 1, 3);
        }
        x.strokeStyle = "#3c2a17";
        x.lineWidth = 10;
        x.strokeRect(8, 8, w - 16, h - 16);
      }),
      roughness: 1,
    }),
  );
  mat.position.set(-0.35, 0.006, env.d / 2 - 0.42);
  roomRoot.add(mat);
}
function iCalendar() {
  const cal = roomRoot.children.find(
    (o) => o.isMesh && o.userData?.interact === "journal" && o.geometry.type === "PlaneGeometry",
  );
  if (!cal) return;
  const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const m = 9 + (iHash(String(env.seed)) % 3);
  cal.geometry.dispose();
  cal.geometry = new THREE.PlaneGeometry(0.32, 0.5);
  cal.material.map = iCanvas(320, 500, (x, w, h) => {
    x.fillStyle = "#eee6d2";
    x.fillRect(0, 0, w, h);
    // Printed photo: lake, birches and hills in faded offset colours.
    const sky = x.createLinearGradient(0, 22, 0, 200);
    sky.addColorStop(0, "#9fb6c2");
    sky.addColorStop(1, "#e2d6b8");
    x.fillStyle = sky;
    x.fillRect(16, 22, w - 32, 190);
    x.fillStyle = "#6f7f6a";
    x.beginPath();
    x.moveTo(16, 140);
    for (let i = 0; i <= 12; i++) x.lineTo(16 + (i * (w - 32)) / 12, 120 + Math.sin(i * 1.7) * 14);
    x.lineTo(w - 16, 212);
    x.lineTo(16, 212);
    x.fill();
    x.fillStyle = "#7f98a0";
    x.fillRect(16, 165, w - 32, 47);
    for (let i = 0; i < 9; i++) {
      x.fillStyle = "#efe9dc";
      x.fillRect(40 + i * 28, 70 + (i % 3) * 8, 4, 100);
    }
    x.fillStyle = "#3c3a33";
    x.font = "bold 30px serif";
    x.textAlign = "center";
    x.fillText("1986 · " + months[m], w / 2, 252);
    x.font = "13px serif";
    x.fillText("安德士国营印刷厂", w / 2, 272);
    const days = ["一", "二", "三", "四", "五", "六", "日"];
    x.font = "15px serif";
    days.forEach((d, i) => {
      x.fillStyle = i > 4 ? "#a33a2c" : "#3c3a33";
      x.fillText(d, 36 + i * 41, 300);
    });
    const first = (m * 3 + 2) % 7;
    for (let d = 1; d <= 30; d++) {
      const k = d - 1 + first;
      x.fillStyle = k % 7 > 4 ? "#a33a2c" : "#3c3a33";
      x.fillText(String(d), 36 + (k % 7) * 41, 330 + Math.floor(k / 7) * 32);
    }
    x.strokeStyle = "rgba(60,50,40,.35)";
    x.lineWidth = 2;
    x.strokeRect(4, 4, w - 8, h - 8);
    x.fillStyle = "#555";
    x.beginPath();
    x.arc(w / 2, 10, 4, 0, Math.PI * 2);
    x.fill();
  });
  cal.material.roughness = 0.9;
  cal.material.needsUpdate = true;
  cal.position.y = 1.62;
  iFlip(cal);
}
function iVeneer() {
  const ven = new THREE.MeshStandardMaterial({
    map: iTex("walnut-veneer_diff"),
    roughness: 0.42,
    envMapIntensity: 0.45,
    color: ["#ffffff", "#eee6dc", "#ddd2c4"][env.wear],
  });
  const apply = (group) => {
    group?.traverse((o) => {
      if (o.isMesh && o.material === sceneMats.wood) {
        o.material = ven;
        iPlanarUV(o, 0.6, 0.4, group);
      }
    });
  };
  apply(worldFindBase("wardrobe"));
  apply(worldFindBase("inspect"));
  apply(W.pantry);
  const stained = ven.clone();
  stained.color.set("#6e5340");
  W.pantry?.traverse((o) => {
    if (o.isMesh && o.material !== ven && o.geometry.parameters?.height > 1.5 && o.geometry.parameters?.width < 0.05) {
      o.material = stained;
      iPlanarUV(o, 0.6, 0.4, W.pantry);
    }
  });
  iCalendar();
  const wardrobe = worldFindBase("wardrobe");
  if (wardrobe) {
    const brass = new THREE.MeshStandardMaterial({
      color: "#a98a52",
      metalness: 0.85,
      roughness: 0.35,
    });
    iBox(wardrobe, [0.78, 0.05, 0.6], [0, 1.745, 0.0], ven, 0.01);
    iBox(wardrobe, [0.66, 0.06, 0.5], [0, 0.03, 0.02], iStd("#2b231b", 0.7), 0.004);
    const door = W.doors.wardrobe?.hinge;
    if (door) {
      const trim = ven;
      for (const [w0, h0, x, y] of [
        [0.54, 0.02, 0.35, 1.56],
        [0.54, 0.02, 0.35, 0.2],
        [0.02, 1.38, 0.08, 0.88],
        [0.02, 1.38, 0.62, 0.88],
      ])
        iBox(door, [w0, h0, 0.012], [x, y, -0.022], trim, 0.004);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), brass);
      knob.position.set(0.63, 0.95, -0.035);
      door.add(knob);
    }
  }
}
function iFridge() {
  const fridge = worldFindBase("fridge");
  if (!fridge) return;
  worldClear(fridge);
  delete W.doors.fridge;
  const H = 1.46,
    enamel = new THREE.MeshPhysicalMaterial({
      color: ["#efeadb", "#e8e2d0", "#ddd5c0"][env.wear],
      roughness: 0.3,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.6,
    }),
    liner = iStd("#f3f2ec", 0.42),
    gasket = iStd("#5c5f5c", 0.7),
    chrome = new THREE.MeshStandardMaterial({
      color: "#d2d6d3",
      metalness: 0.95,
      roughness: 0.2,
      envMapIntensity: 0.9,
    }),
    alu = new THREE.MeshStandardMaterial({
      color: "#c7cbc8",
      metalness: 0.7,
      roughness: 0.42,
    }),
    wire = iStd("#ebeae4", 0.4),
    clear = new THREE.MeshPhysicalMaterial({
      color: "#dfeee9",
      roughness: 0.15,
      transparent: true,
      opacity: 0.45,
    });
  // Shell: rounded top, enamel sides, toe grille.
  iBox(fridge, [0.035, H - 0.05, 0.58], [-0.2825, (H - 0.05) / 2, -0.02], enamel, 0.012);
  iBox(fridge, [0.035, H - 0.05, 0.58], [0.2825, (H - 0.05) / 2, -0.02], enamel, 0.012);
  iBox(fridge, [0.6, 0.07, 0.6], [0, H - 0.035, -0.02], enamel, 0.034);
  iBox(fridge, [0.6, H, 0.02], [0, H / 2, -0.3], enamel, 0.006);
  iBox(fridge, [0.6, 0.1, 0.56], [0, 0.05, -0.03], enamel, 0.008);
  iBox(fridge, [0.5, 0.06, 0.01], [0, 0.05, 0.25], iStd("#2d302e", 0.6), 0.003);
  for (let i = 0; i < 5; i++)
    iBox(fridge, [0.48, 0.004, 0.012], [0, 0.03 + i * 0.01, 0.256], alu, 0);
  // Interior liner and compartments.
  iBox(fridge, [0.53, H - 0.2, 0.01], [0, (H - 0.2) / 2 + 0.1, -0.285], liner, 0);
  iBox(fridge, [0.53, 0.012, 0.55], [0, 0.104, -0.01], liner, 0);
  iBox(fridge, [0.53, 0.01, 0.55], [0, H - 0.075, -0.01], liner, 0);
  for (const x of [-0.262, 0.262])
    iBox(fridge, [0.008, H - 0.18, 0.55], [x, (H - 0.18) / 2 + 0.1, -0.01], liner, 0);
  const freezer = new THREE.Group();
  freezer.position.set(0, 1.16, -0.08);
  fridge.add(freezer);
  iBox(freezer, [0.44, 0.2, 0.38], [0, 0.1, 0], alu, 0.01);
  iBox(freezer, [0.43, 0.19, 0.012], [0, 0.1, 0.195], iStd("#e9ecec", 0.35, { metalness: 0.2 }), 0.008);
  iBox(freezer, [0.1, 0.016, 0.02], [0, 0.17, 0.21], liner, 0.005);
  iBox(fridge, [0.5, 0.012, 0.45], [0, 1.135, -0.05], clear, 0);
  // Crisper drawer, then two coated-wire shelves. Each has an invisible solid plate for R placement.
  const crisper = new THREE.Group();
  crisper.position.set(0, 0.11, 0.0);
  fridge.add(crisper);
  iBox(crisper, [0.5, 0.19, 0.012], [0, 0.095, 0.24], clear, 0.004);
  iBox(crisper, [0.5, 0.012, 0.46], [0, 0.0, 0.01], clear, 0);
  const shelfYs = [0.315, 0.63, 0.935],
    plateMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  shelfYs.forEach((y, k) => {
    if (k === 0) iBox(fridge, [0.52, 0.006, 0.5], [0, y - 0.003, -0.02], clear, 0);
    else {
      for (let i = 0; i < 17; i++) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.5, 6), wire);
        rod.rotation.x = Math.PI / 2;
        rod.position.set(-0.24 + i * 0.03, y - 0.004, -0.02);
        fridge.add(rod);
      }
      for (const z of [-0.27, 0.23]) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.52, 8), wire);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, y - 0.004, z);
        fridge.add(bar);
      }
    }
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.006, 0.5), plateMat);
    plate.position.set(0, y - 0.003, -0.02);
    plate.userData.shelfPlate = true;
    fridge.add(plate);
  });
  W.fridgeShelfY = shelfYs;
  iBox(fridge, [0.07, 0.03, 0.05], [0.2, 1.08, 0.18], iStd("#f6f4ea", 0.3, { emissive: "#fff3cf", emissiveIntensity: 0.15 }), 0.01);
  // Door with gasket, door bins, chrome lever and badge.
  const hinge = new THREE.Group();
  hinge.position.set(-0.3, 0, 0.27);
  fridge.add(hinge);
  iBox(hinge, [0.6, H - 0.12, 0.055], [0.3, (H - 0.12) / 2 + 0.1, 0.0275], enamel, 0.026);
  iBox(hinge, [0.5, H - 0.3, 0.02], [0.3, (H - 0.3) / 2 + 0.17, -0.008], liner, 0.01);
  for (const [w0, h0, x, y] of [
    [0.56, 0.016, 0.3, 0.13],
    [0.56, 0.016, 0.3, H - 0.05],
    [0.016, H - 0.18, 0.025, (H - 0.18) / 2 + 0.13 - 0.04],
    [0.016, H - 0.18, 0.575, (H - 0.18) / 2 + 0.13 - 0.04],
  ])
    iBox(hinge, [w0, h0, 0.014], [x, y, -0.006], gasket, 0.005);
  for (const y of [0.32, 0.66, 1.0]) {
    iBox(hinge, [0.46, 0.07, 0.008], [0.3, y + 0.035, -0.09], clear, 0.003);
    iBox(hinge, [0.46, 0.008, 0.08], [0.3, y, -0.05], liner, 0);
    for (const x of [0.07, 0.53])
      iBox(hinge, [0.008, 0.07, 0.08], [x, y + 0.035, -0.05], liner, 0);
  }
  iBox(hinge, [0.03, 0.3, 0.03], [0.555, 0.98, 0.085], chrome, 0.012);
  for (const y of [0.85, 1.11])
    iBox(hinge, [0.022, 0.022, 0.04], [0.555, y, 0.065], chrome, 0.008);
  iBox(hinge, [0.52, 0.012, 0.004], [0.3, 1.2, 0.057], chrome, 0.002);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.045),
    new THREE.MeshStandardMaterial({
      map: iCanvas(360, 90, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#f2f3f0");
        g.addColorStop(0.5, "#9da3a1");
        g.addColorStop(1, "#e6e8e5");
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        x.fillStyle = "#7d1d1b";
        x.font = "italic bold 44px Georgia, serif";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText("Polaris-3", w / 2, h / 2 + 2);
      }),
      metalness: 0.6,
      roughness: 0.3,
    }),
  );
  badge.position.set(0.3, H - 0.17, 0.0565);
  iFlip(badge);
  hinge.add(badge);
  worldDoor("fridge", hinge, -1);
  const light = new THREE.PointLight("#f6e8bd", 0, 1.6);
  light.position.set(0, 1.0, 0.1);
  fridge.add(light);
  W.fridgeLight = light;
  fridge.updateMatrixWorld(true);
}
function iKitchen() {
  const K = worldFindBase("kitchen"),
    sink = worldFindBase("sink"),
    stove = worldFindBase("stove");
  if (!K) return;
  const back = -env.d / 2,
    w = env.w;
  worldClear(K);
  // Hide the old floating wall boxes, copper pipe and towel bar.
  for (const o of [...roomRoot.children]) {
    const p = o.geometry?.parameters;
    if (
      (o.isGroup && Math.abs(o.position.y - 1.9) < 0.01 && Math.abs(o.position.z - (back + 0.23)) < 0.01) ||
      (o.isMesh && p && Math.abs(p.height - 1.2) < 0.01 && p.width < 0.03) ||
      (o.isMesh && p && Math.abs(p.width - 0.35) < 0.01 && Math.abs(o.position.y - 1.31) < 0.01)
    )
      o.visible = false;
  }
  const paint = new THREE.MeshStandardMaterial({
      map: iTex("cabinet-paint_diff"),
      color: ["#e3e7d6", "#d9dfcc", "#c9cbb8"][env.wear],
      roughness: 0.55,
      envMapIntensity: 0.4,
    }),
    frame = paint,
    top = new THREE.MeshStandardMaterial({
      map: iCanvas(256, 256, (x, w0, h0) => {
        x.fillStyle = "#cdc6b2";
        x.fillRect(0, 0, w0, h0);
        for (let i = 0; i < 5000; i++) {
          const v = Math.random() > 0.5 ? 90 : 235;
          x.fillStyle = `rgba(${v},${v - 6},${v - 18},.25)`;
          x.fillRect(Math.random() * w0, Math.random() * h0, 1.5, 1.5);
        }
      }),
      roughness: 0.42,
      envMapIntensity: 0.5,
    }),
    alu = new THREE.MeshStandardMaterial({ color: "#c4c8c5", metalness: 0.85, roughness: 0.35 }),
    knob = iStd("#3a2c22", 0.35);
  top.map.wrapS = top.map.wrapT = THREE.RepeatWrapping;
  top.map.repeat.set(3, 1.5);
  const x0 = -1.02,
    x1 = 0.44,
    cw = x1 - x0,
    cx = (x0 + x1) / 2,
    wallZ = back + 0.07 - K.position.z,
    depth = 0.6,
    zc = wallZ + depth / 2,
    zf = wallZ + depth;
  const carcass = iBox(K, [cw, 0.78, depth - 0.02], [cx, 0.47, zc - 0.01], paint, 0.004);
  iBox(K, [cw - 0.04, 0.08, depth - 0.07], [cx, 0.04, zc - 0.04], iStd("#2a2520", 0.8), 0);
  // Countertop with a real sink cut-out at the basin position.
  const sinkLocal = sink
    ? K.worldToLocal(sink.getWorldPosition(new THREE.Vector3()))
    : new THREE.Vector3(-0.52, 0, 0);
  const sx = sink ? -0.52 : sinkLocal.x,
    sz = zc - 0.02;
  const shape = new THREE.Shape();
  shape.moveTo(x0 - 0.01, -(zf + 0.02));
  shape.lineTo(x1 + 0.01, -(zf + 0.02));
  shape.lineTo(x1 + 0.01, -wallZ);
  shape.lineTo(x0 - 0.01, -wallZ);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absellipse(sx, -sz, 0.262, 0.194, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geo.rotateX(-Math.PI / 2);
  const counter = new THREE.Mesh(geo, top);
  counter.position.y = 0.86;
  counter.castShadow = counter.receiveShadow = true;
  K.add(counter);
  iPlanarUV(counter, 0.6, 0.6, K);
  iBox(K, [cw + 0.02, 0.036, 0.008], [cx, 0.876, zf + 0.022], alu, 0.002);
  if (sink) {
    sink.position.set(K.position.x + sx, 0.893, K.position.z + sz);
    sink.updateMatrixWorld(true);
  }
  // Framed doors and a drawer, each a real panel with stiles, rails and a knob.
  const doorAt = (x, y, wd, ht) => {
    const g = new THREE.Group();
    g.position.set(x, y, zf + 0.001);
    K.add(g);
    iBox(g, [wd, ht, 0.018], [0, 0, 0.009], paint, 0.003);
    const s = 0.05;
    for (const [w0, h0, px, py] of [
      [wd, s, 0, ht / 2 - s / 2],
      [wd, s, 0, -ht / 2 + s / 2],
      [s, ht - 2 * s, -wd / 2 + s / 2, 0],
      [s, ht - 2 * s, wd / 2 - s / 2, 0],
    ])
      iBox(g, [w0, h0, 0.008], [px, py, 0.021], frame, 0.002);
    return g;
  };
  const doors = [
    [x0 + 0.23, 0.45, 0.452, 0.66, 1],
    [x0 + 0.685, 0.45, 0.452, 0.66, -1],
    [x1 - 0.278, 0.36, 0.55, 0.48, 1],
  ];
  for (const [x, y, wd, ht, side] of doors) {
    const g = doorAt(x, y, wd, ht);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.014, 14, 10), knob);
    k.scale.z = 0.7;
    k.position.set(side * (wd / 2 - 0.05), ht / 2 - 0.08, 0.03);
    g.add(k);
  }
  const drawer = doorAt(x1 - 0.278, 0.73, 0.55, 0.17);
  iBox(drawer, [0.13, 0.016, 0.02], [0, 0, 0.034], alu, 0.006);
  // Tiled splashback up to the wall units, including behind the cooker.
  const tiles = iPBR("long_white_tiles", { roughness: 0.25, normal: 0.8, env: 0.6 });
  tiles.color.set("#f4f2ea");
  const splash = new THREE.Mesh(new THREE.BoxGeometry(cw + 0.62, 0.61, 0.012), tiles);
  splash.position.set(cx + 0.31, 0.86 + 0.305, wallZ + 0.006);
  splash.receiveShadow = true;
  K.add(splash);
  iPlanarUV(splash, 0.9, 0.9, roomRoot);
  // Wall cupboards hung on the wall, not floating in air.
  for (const ux of [x0 + 0.365, x0 + 1.095]) {
    const u = new THREE.Group();
    u.position.set(ux, 1.475, wallZ);
    K.add(u);
    iBox(u, [0.72, 0.66, 0.31], [0, 0.33, 0.155], paint, 0.004);
    for (const s of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(s * 0.179, 0.33, 0.311);
      u.add(g);
      iBox(g, [0.352, 0.64, 0.018], [0, 0, 0.009], paint, 0.003);
      for (const [w0, h0, px, py] of [
        [0.352, 0.045, 0, 0.2975],
        [0.352, 0.045, 0, -0.2975],
        [0.045, 0.55, -0.1535, 0],
        [0.045, 0.55, 0.1535, 0],
      ])
        iBox(g, [w0, h0, 0.008], [px, py, 0.021], frame, 0.002);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), knob);
      k.position.set(-s * 0.13, -0.24, 0.03);
      g.add(k);
    }
  }
  // Freestanding electric cooker with an enamel pot on the back ring.
  if (stove && R.models.electric_stove) {
    worldClear(stove);
    stove.position.set(w / 2 - 0.355, 0, back + 0.40);
    stove.rotation.set(0, 0, 0);
    const model = roomCopy("electric_stove");
    model.scale.setScalar(1.02);
    stove.add(model);
    roomProxy(stove, [0.52, 0.9, 0.62]);
    if (R.models.pot_enamel_01) {
      const pot = roomCopy("pot_enamel_01");
      pot.scale.setScalar(0.95);
      pot.position.set(-0.115, 0.877, -0.09);
      stove.add(pot);
    }
    const hob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, 0.004, 32),
      new THREE.MeshStandardMaterial({
        color: "#1d1b1a",
        roughness: 0.6,
        emissive: "#ff3a12",
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
      }),
    );
    hob.position.set(0.115, 0.879, 0.11);
    hob.userData.noPick = true;
    stove.add(hob);
    I.hob = hob;
    stove.updateMatrixWorld(true);
  }
  // Kitchen linoleum, laid edge to edge under the run.
  const lino = iPBR("old_linoleum_flooring_01", { roughness: 0.55, normal: 0.4, env: 0.3 });
  lino.color.set(["#ffffff", "#efe6d2", "#ded2bb"][env.wear]);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.004, 1.42), lino);
  floor.position.set(w / 2 - 0.07 - 1.15, 0.003, back + 0.07 + 0.71);
  floor.receiveShadow = true;
  roomRoot.add(floor);
  iPlanarUV(floor, 0.9, 0.9);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.006, 0.035), alu);
  strip.position.set(floor.position.x, 0.004, back + 0.07 + 1.42);
  roomRoot.add(strip);
  // Rebuild the kitchen collision from what is actually there now.
  roomRoot.updateMatrixWorld(true);
  const kb = new THREE.Box3().setFromObject(carcass);
  if (stove) kb.union(new THREE.Box3().setFromObject(stove));
  colliders = colliders.filter(
    (c) => !(c.maxX > kb.min.x && c.minX < kb.max.x && c.maxZ > kb.min.z && c.minZ < kb.max.z && c.maxY < 1.2),
  );
  colliders.push({ minX: kb.min.x, maxX: kb.max.x, minZ: kb.min.z, maxZ: kb.max.z, minY: 0, maxY: 0.95 });
}
function iBathroom() {
  // Enamel washing basin instead of the old flat-coloured tub.
  roomRoot.traverse((o) => {
    if (o.userData?.interact !== "laundry" || !o.isGroup || o.userData.enamel) return;
    o.userData.enamel = true;
    o.children.forEach((c) => (c.visible = false));
    const prof = [[0, 0.0], [0.15, 0.0], [0.16, 0.01], [0.2, 0.1], [0.225, 0.16], [0.235, 0.17], [0.23, 0.175], [0.215, 0.168], [0.19, 0.105], [0.15, 0.02], [0, 0.02]].map(([x, y]) => new THREE.Vector2(x, y));
    const enamel = new THREE.MeshPhysicalMaterial({ color: "#f2f1ea", roughness: 0.18, clearcoat: 0.8, envMapIntensity: 0.6 });
    const tub = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), enamel);
    tub.castShadow = tub.receiveShadow = true;
    o.add(tub);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.231, 0.006, 8, 48), iStd("#24497a", 0.35));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.172;
    o.add(rim);
    const chip = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), iStd("#1d1d1f", 0.6));
    chip.position.set(0.21, 0.13, 0.055);
    chip.lookAt(o.localToWorld(new THREE.Vector3(0.6, 0.16, 0.16)));
    o.add(chip);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshPhysicalMaterial({ color: "#c9d6d3", roughness: 0.05, transmission: 0, metalness: 0.1, opacity: 0.8, transparent: true }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.09;
    o.add(water);
  });
  // Silvered mirror glass that actually picks up the room's light.
  roomRoot.traverse((o) => {
    if (o.userData?.interact !== "mirror" || !o.isGroup) return;
    const meshes = o.children.filter((c) => c.isMesh);
    meshes.forEach((m, k) => {
      m.material = k === 0
        ? new THREE.MeshStandardMaterial({ color: "#8f969a", metalness: 0.9, roughness: 0.35 })
        : new THREE.MeshStandardMaterial({ color: "#e9f0f1", metalness: 1, roughness: 0.03, envMapIntensity: 1.6 });
    });
  });
  const w = env.w,
    front = env.d / 2,
    bx = w / 2 - 2.05,
    bz = front - 2.05,
    H = 1.78;
  const wallTiles = iPBR("long_white_tiles", { roughness: 0.22, normal: 0.8, env: 0.65 });
  wallTiles.color.set(["#eef3f1", "#e6efec", "#dfe6e1"][env.wear]);
  const floorTiles = iPBR("interior_tiles", { roughness: 0.4, normal: 0.6, env: 0.4 });
  floorTiles.color.set(["#ffffff", "#efebe4", "#e1dbd0"][env.wear]);
  roomRoot.children
    .filter((o) => o.isMesh && o.material === sceneMats.tile)
    .forEach((o) => {
      const p = o.geometry.parameters;
      if (p.height < 0.05) {
        o.material = floorTiles;
        iPlanarUV(o, 1.1, 1.1);
      } else {
        o.visible = false;
      }
    });
  const panel = (sx, sz, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, H, sz), wallTiles);
    m.position.set(x, H / 2 + 0.005, z);
    m.receiveShadow = true;
    roomRoot.add(m);
    iPlanarUV(m, 0.9, 0.9);
  };
  panel(0.012, 1.96, w / 2 - 0.076, front - 1.03);
  panel(1.96, 0.012, w / 2 - 1.03, front - 0.076);
  panel(0.012, 1.94, bx + 0.056, front - 1.03);
  panel(0.33, 0.012, bx + 0.215, bz + 0.056);
  panel(0.55, 0.012, w / 2 - 0.345, bz + 0.056);
  const porcelain = new THREE.MeshPhysicalMaterial({
    color: "#eceee8",
    roughness: 0.18,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
    envMapIntensity: 0.6,
  });
  const chrome = new THREE.MeshStandardMaterial({ color: "#cfd3d1", metalness: 0.95, roughness: 0.22 });
  // Pedestal washbasin under the mirror.
  const basin = worldTag(groupAt(w / 2 - 0.4, 0, bz + 0.3, roomRoot), "hands", "洗手池");
  const prof = [
    [0, 0.72],
    [0.06, 0.72],
    [0.17, 0.745],
    [0.215, 0.8],
    [0.235, 0.84],
    [0.245, 0.85],
    [0.235, 0.857],
    [0.21, 0.83],
    [0.15, 0.77],
    [0.05, 0.745],
    [0, 0.745],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), porcelain);
  bowl.scale.z = 0.72;
  bowl.castShadow = true;
  basin.add(bowl);
  const ped = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.11, 0],
        [0.1, 0.03],
        [0.07, 0.3],
        [0.075, 0.6],
        [0.1, 0.73],
        [0, 0.73],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      28,
    ),
    porcelain,
  );
  ped.scale.z = 0.8;
  ped.castShadow = true;
  basin.add(ped);
  roomTube(basin, [[0, 0.86, -0.16], [0, 0.95, -0.15], [0, 0.97, -0.08], [0, 0.94, -0.05]], 0.011, chrome);
  for (const x of [-0.08, 0.08]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.035, 12), chrome);
    t.position.set(x, 0.875, -0.16);
    basin.add(t);
  }
  roomProxy(basin, [0.5, 0.2, 0.38], [0, 0.8, 0]);
  // Toilet: seat ring + raised lid against the cistern.
  const toilet = worldFindBase("toilet");
  if (toilet) {
    const seatMat = iStd("#e8e3d6", 0.35);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 40), seatMat);
    lid.scale.z = 1.25;
    lid.rotation.x = -Math.PI / 2 + 0.12;
    lid.position.set(0, 0.62, 0.15);
    toilet.add(lid);
  }
  // Enamel pedal bin replaces the grey cylinder.
  const trash = worldFindBase("trash");
  if (trash) {
    worldClear(trash);
    const enamel = new THREE.MeshPhysicalMaterial({ color: "#d9d4c3", roughness: 0.3, clearcoat: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.38, 32, 1, true), enamel);
    body.position.y = 0.2;
    body.castShadow = true;
    trash.add(body);
    const lidTop = new THREE.Mesh(new THREE.SphereGeometry(0.152, 32, 8, 0, Math.PI * 2, 0, 0.5), enamel);
    lidTop.position.y = 0.33;
    trash.add(lidTop);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.151, 0.006, 8, 40), chrome);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.39;
    trash.add(rim);
    iBox(trash, [0.1, 0.012, 0.06], [0, 0.03, 0.16], chrome, 0.004);
    iBox(trash, [0.29, 0.02, 0.29], [0, 0.01, 0], iStd("#2e2a26", 0.7), 0.006);
  }
}
function iBroom() {
  const g = W.broomProp;
  if (!g || !R.models.wooden_broom) return;
  const keep = g.userData;
  worldClear(g);
  Object.assign(g.userData, keep);
  const tilt = new THREE.Group();
  tilt.position.set(-0.06, 0, -0.1);
  tilt.rotation.z = -0.2;
  g.add(tilt);
  const broom = roomCopy("wooden_broom");
  broom.rotation.y = Math.PI / 2;
  broom.position.y = 0.122;
  tilt.add(broom);
  if (R.models.dustpan) {
    const pan = roomCopy("dustpan");
    pan.position.set(0.02, 0.0, 0.28);
    pan.rotation.y = -1.3;
    g.add(pan);
  }
  roomProxy(g, [0.4, 1.3, 0.6], [0, 0.65, 0.05]);
}
/* --- Physical shopping bags and cardboard crates at the door. --- */
function iRand(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
// A filled T-shirt carrier bag: rectangular gusseted base, contents pushing the film out
// in lumps, the mouth gathered flat and creased below the handles.
function iBagGeometry(seed, closed) {
  const v = seed % 6,
    key = "bag" + v + (closed ? "c" : "o");
  if (I.geos.has(key)) return I.geos.get(key);
  const H = 0.27 + iRand(v) * 0.08,
    W = 0.3,
    D = 0.17;
  const geo = new THREE.CylinderGeometry(1, 1, 1, 28, 14, true);
  const pos = geo.attributes.position;
  const lumps = [...Array(5)].map((_, k) => [
    iRand(v * 9 + k) * Math.PI * 2,
    0.18 + iRand(v * 7 + k) * 0.5,
    0.012 + iRand(v * 5 + k) * 0.02,
  ]);
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) + 0.5,
      sx = pos.getX(i),
      sz = pos.getZ(i),
      a = Math.atan2(sz, sx),
      c = Math.cos(a),
      sn = Math.sin(a);
    let x = (W / 2) * Math.sign(c) * Math.pow(Math.abs(c), 0.42),
      z = (D / 2) * Math.sign(sn) * Math.pow(Math.abs(sn), 0.42);
    const belly = 1 + 0.1 * Math.sin(Math.PI * Math.min(1, t / 0.75));
    const gather = t < 0.66 ? 1 : 1 - Math.pow((t - 0.66) / 0.34, 1.4) * (closed ? 0.9 : 0.62);
    const narrow = t < 0.7 ? 1 : 1 - Math.pow((t - 0.7) / 0.3, 2) * (closed ? 0.55 : 0.16);
    let bump = 0;
    for (const [la, lt, lh] of lumps) {
      const da = Math.atan2(Math.sin(a - la), Math.cos(a - la));
      bump += lh * Math.exp(-(da * da) / 0.25 - ((t - lt) * (t - lt)) / 0.02);
    }
    const crease = t > 0.55 ? Math.sin(a * 11 + v * 2 + t * 6) * 0.006 * (t - 0.55) * 4 : 0;
    const k = 1 + (bump + crease) / Math.hypot(x, z);
    x *= belly * narrow * k;
    z *= belly * gather * k;
    pos.setXYZ(i, x, t * H, z);
  }
  geo.computeVertexNormals();
  geo.userData.height = H;
  I.geos.set(key, geo);
  return geo;
}
function iBagFilm(variant) {
  const key = "bagfilm" + variant;
  if (I.mats.has(key)) return I.mats.get(key);
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const x = c.getContext("2d");
  const base = ["#e2dfd6", "#ddd3b8", "#e0d9d2", "#d5dcdf"][variant % 4];
  x.fillStyle = base;
  x.fillRect(0, 0, 1024, 256);
  // Film wrinkles: thin light/dark streaks, mostly vertical near the top.
  for (let i = 0; i < 260; i++) {
    const px = iRand(i + variant * 31) * 1024,
      py = iRand(i * 3 + variant) * 256,
      len = 20 + iRand(i * 7) * 70;
    x.strokeStyle = i % 2 ? "rgba(255,255,255,.55)" : "rgba(90,85,70,.12)";
    x.lineWidth = 1 + iRand(i * 5) * 2;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + (iRand(i * 11) - 0.5) * 30, py - len);
    x.stroke();
  }
  const ink = ["#b0322a", "#2d5b8a", "#2f7a4b", "#8a2f62"][variant % 4];
  const print = (cx) => {
    x.save();
    x.translate(cx, 132);
    x.globalAlpha = 0.86;
    x.strokeStyle = ink;
    x.fillStyle = ink;
    x.lineWidth = 5;
    x.beginPath();
    x.arc(0, -22, 22, 0, Math.PI * 2);
    x.stroke();
    x.font = "bold 26px serif";
    x.textAlign = "center";
    x.fillText("安", 0, -13);
    x.font = "bold 23px serif";
    x.fillText(["安德士供销社", "市民百货商店", "第三合作商场", "安德士供销社"][variant % 4], 0, 26);
    x.font = "14px serif";
    x.fillText("谢谢惠顾 · 欢迎再来", 0, 48);
    x.font = "bold 13px sans-serif";
    x.fillText("ANDERS CO-OP 1986", 0, 66);
    x.restore();
  };
  // CylinderGeometry u=0 faces +z, u=.5 faces -z: print on both broad faces.
  print(0);
  print(1024);
  print(512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshPhysicalMaterial({
    map: tex,
    roughness: 0.42,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
  });
  I.mats.set(key, m);
  return m;
}
function interiorBag(parent, bag, i, state) {
  const g = new THREE.Group(),
    col = i % 4,
    row = Math.floor(i / 4);
  // Set down one after another by the door: loose rows, no two bags at the same angle.
  g.position.set(
    -0.36 + col * 0.29 + (row % 2) * 0.06 + (iRand(i * 3.1) - 0.5) * 0.06,
    0,
    -0.2 + row * 0.24 + (iRand(i * 5.7) - 0.5) * 0.05,
  );
  g.rotation.y = (iRand(i * 2.3) - 0.5) * 0.9;
  if (!bag.crate) g.rotation.z = (iRand(i * 8.9) - 0.5) * 0.09;
  iFlip(g); // printed text must read correctly in mirrored flats
  parent.add(g);
  const contents = state ? worldBagContents(bag.id) : [];
  if (bag.crate) {
    const card = iStd("#a8865a", 0.85),
      tape = iStd("#c7b48a", 0.4);
    iBox(g, [0.4, 0.3, 0.3], [0, 0.15, 0], card, 0.006);
    if (!bag.opened) iBox(g, [0.405, 0.004, 0.06], [0, 0.302, 0], tape, 0);
    else
      for (const s of [-1, 1]) {
        const f = iBox(g, [0.4, 0.004, 0.15], [0, 0.3, s * 0.21], card, 0);
        f.rotation.x = s * 0.5;
      }
    return g;
  }
  const variant = (bag.id * 7 + i) % 4,
    film = iBagFilm(variant),
    closed = !bag.opened,
    geo = iBagGeometry(i * 5 + bag.id, closed),
    H = geo.userData.height;
  const body = new THREE.Mesh(geo, film);
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.17), film);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.002;
  g.add(bottom);
  const band = (w, h) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(w, 0.012, 5, 18, Math.PI), film);
    m.scale.set(1, h / w, 0.35);
    return m;
  };
  if (closed) {
    // Handles pulled together and tied over the gathered mouth.
    for (const sgn of [-1, 1]) {
      const h = band(0.06, 0.085);
      h.position.set(sgn * 0.035, H - 0.015, 0);
      h.rotation.z = sgn * 0.35;
      g.add(h);
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), film);
    knot.scale.set(1.3, 0.8, 0.8);
    knot.position.set(0, H + 0.07, 0);
    g.add(knot);
  } else {
    for (const sgn of [-1, 1]) {
      const h = band(0.045, 0.1);
      h.position.set(sgn * 0.11, H - 0.01, 0);
      h.rotation.set(0.15 * sgn, 0, sgn * 0.12);
      g.add(h);
    }
    contents.slice(-3).forEach((b, k) => {
      const p = worldProduct(b.id, g),
        size = new THREE.Box3().setFromObject(p).getSize(new THREE.Vector3()),
        s = Math.min(1, 0.16 / Math.max(size.x, size.z, 0.05), 0.22 / Math.max(size.y, 0.05));
      p.scale.setScalar(s);
      // Only the tops show above the rim; the rest stays inside the bag.
      p.position.set((k - 1) * 0.07, Math.max(0.02, H + 0.035 - size.y * s), (k % 2 - 0.5) * 0.035);
      p.rotation.set(0.1 * (k - 1), k * 0.7, 0.12 * (k - 1));
    });
  }
  return g;
}
/* --- Printed packaging. Shapes follow the real container: sacks, pouches, cartons, bottles. --- */
const I_SPEC = {
  rice: ["sack", [0.3, 0.11, 0.42]],
  flour: ["paper", [0.13, 0.23, 0.08]],
  cornmeal: ["paper", [0.13, 0.23, 0.08]],
  sugar: ["paper", [0.11, 0.17, 0.07]],
  oats: ["box", [0.16, 0.24, 0.07]],
  pasta: ["pouch", [0.13, 0.24, 0.05]],
  beans: ["pouch", [0.13, 0.2, 0.06]],
  lentils: ["pouch", [0.13, 0.2, 0.06]],
  buckwheat: ["pouch", [0.13, 0.2, 0.06]],
  noodles: ["pouch", [0.1, 0.25, 0.035]],
  nuts: ["pouch", [0.12, 0.17, 0.05]],
  raisins: ["pouch", [0.1, 0.15, 0.04]],
  crackers: ["box", [0.2, 0.14, 0.06]],
  hardtack: ["box", [0.16, 0.08, 0.11]],
  biscuit: ["box", [0.17, 0.06, 0.1]],
  chocolate: ["box", [0.16, 0.012, 0.075]],
  oil: ["bottle", [0.04, 0.29], "#e2b546"],
  peanut: ["jar", [0.045, 0.11], "#9a6a3b"],
  jam: ["jar", [0.042, 0.11], "#8e1f2a"],
  bread: ["bread", [0.24, 0.1, 0.12]],
  potato: ["pile", [0.04, 9], "#b48b55"],
  sweetpotato: ["pile", [0.035, 6], "#9c4a3b"],
  carrot: ["pile", [0.02, 10], "#d9772b"],
  onion: ["pile", [0.035, 8], "#c69a55"],
  apple: ["pile", [0.036, 7], "#b2252a"],
  orange: ["pile", [0.037, 6], "#e98a1f"],
  banana: ["banana", [0.18]],
  cabbage: ["cabbage", [0.085]],
  egg: ["eggs", [0.2, 0.07, 0.1]],
  cheese: ["cheese", [0.07]],
  sausage: ["sausage", [0.22]],
  milk: ["carton", [0.07, 0.2, 0.07]],
  yogurt: ["jar", [0.045, 0.1], "#f1ede0"],
  juice: ["carton", [0.07, 0.2, 0.07]],
  milkpowder: ["tin", [0.055, 0.14]],
  water: ["bottle", [0.055, 0.33], "#dfeff3"],
  waterlarge: ["jug", [0.19, 0.3, 0.13]],
  tea: ["box", [0.13, 0.08, 0.07]],
  herbal: ["box", [0.13, 0.08, 0.07]],
  coffee: ["jar", [0.045, 0.12], "#3b2316"],
  cocoa: ["tin", [0.05, 0.12]],
  soda: ["can", [0.033, 0.115]],
  salt: ["box", [0.08, 0.13, 0.05]],
  pepper: ["tin", [0.025, 0.08]],
  spice: ["box", [0.1, 0.12, 0.04]],
  soap: ["box", [0.09, 0.035, 0.06]],
  shampoo: ["hdpe", [0.04, 0.2], "#4f7f6e"],
  toothpaste: ["box", [0.19, 0.04, 0.04]],
  toothbrush: ["box", [0.2, 0.022, 0.035]],
  paper: ["rolls", [0.055]],
  towel: ["cloth", [0.26, 0.07, 0.19], "#c9b9a0"],
  shirt: ["cloth", [0.26, 0.05, 0.2], "#dad8cc"],
  underwear: ["cloth", [0.2, 0.05, 0.16], "#bfc8cf"],
  socks: ["cloth", [0.16, 0.05, 0.12], "#59544c"],
  sweater: ["cloth", [0.28, 0.08, 0.22], "#7b4a3c"],
  detergent: ["box", [0.15, 0.21, 0.06]],
  dishsoap: ["hdpe", [0.035, 0.21], "#e3c84f"],
  disinfect: ["hdpe", [0.04, 0.22], "#7d8fb6"],
  trashbag: ["box", [0.14, 0.09, 0.09]],
  sponge: ["sponge", [0.1, 0.03, 0.07]],
  gloves: ["cloth", [0.2, 0.02, 0.12], "#e0c447"],
  aspirin: ["med", [0.1, 0.05, 0.025]],
  digest: ["med", [0.1, 0.05, 0.025]],
  coldmed: ["med", [0.1, 0.05, 0.025]],
  vitamin: ["hdpe", [0.03, 0.09], "#e8e3d4"],
  bandage: ["med", [0.08, 0.08, 0.05]],
  firstaid: ["med", [0.26, 0.16, 0.09]],
  candle: ["box", [0.2, 0.05, 0.06]],
  battery: ["box", [0.08, 0.12, 0.02]],
  fuel: ["box", [0.14, 0.09, 0.09]],
  cards: ["box", [0.065, 0.09, 0.022]],
  puzzle: ["box", [0.3, 0.06, 0.21]],
  carcan: ["box", [0.1, 0.1, 0.1]],
};
const I_PALETTE = {
  staple: ["#c9a256", "#7d3a2a", "#3e5a3c", "#d8c49a", "#a8492f"],
  fresh: ["#4b7a4a", "#c0402e", "#e6d7a8", "#3e5f88"],
  canned: ["#8f2a26", "#2f5a7a", "#c99a35"],
  drink: ["#2e6f8a", "#3d7a4d", "#a43b2f", "#e2c46a"],
  hygiene: ["#3c7a8a", "#e7e2d2", "#7a4f8a", "#4a8a5f"],
  clean: ["#d7462e", "#2f6ca6", "#e2bd2f", "#3d8a6d"],
  medical: ["#f1efe8"],
  tool: ["#5a5f57", "#b04a2e", "#2f5a7a"],
  leisure: ["#3f5d55", "#8a3f33"],
  furniture: ["#8a7a5c"],
};
function iHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function iLabel(it) {
  if (I.labels.has(it.id)) return I.labels.get(it.id);
  const pal = I_PALETTE[it.category] || I_PALETTE.tool,
    h = iHash(it.id),
    bg = pal[h % pal.length],
    medical = it.category === "medical";
  const [name, size] = it.name.replace(/[《》]/g, "").split(" · ");
  const tex = iCanvas(384, 256, (x, w, hh) => {
    x.fillStyle = bg;
    x.fillRect(0, 0, w, hh);
    for (let i = 0; i < 1600; i++) {
      x.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      x.fillRect(Math.random() * w, Math.random() * hh, 2, 2);
    }
    const light = ["#e7e2d2", "#e6d7a8", "#d8c49a", "#f1efe8", "#e2c46a", "#e2bd2f"].includes(bg);
    const ink = light ? "#2b2a24" : "#f4eedd";
    // Period print: a band, an emblem, the product name in heavy type and a small standard code.
    x.fillStyle = medical ? "#b3261e" : light ? "#7d3a2a" : "rgba(0,0,0,.28)";
    x.fillRect(0, 0, w, 46);
    x.fillStyle = medical ? "#fff" : light ? "#f4eedd" : "#f4eedd";
    x.font = "bold 22px 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(
      medical ? "安德士国营制药厂" : it.category === "fresh" ? "国营农贸合作社" : "安德士国营食品厂",
      w / 2,
      24,
    );
    x.beginPath();
    x.arc(54, 124, 30, 0, Math.PI * 2);
    x.strokeStyle = ink;
    x.lineWidth = 4;
    x.stroke();
    if (medical) {
      x.fillStyle = "#b3261e";
      x.fillRect(46, 104, 16, 40);
      x.fillRect(34, 116, 40, 16);
    } else {
      x.fillStyle = ink;
      x.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 9 : 22,
          a = (k / 10) * Math.PI * 2 - Math.PI / 2;
        x.lineTo(54 + Math.cos(a) * r, 124 + Math.sin(a) * r);
      }
      x.fill();
    }
    x.fillStyle = ink;
    let fs = 54;
    x.font = `900 ${fs}px 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif`;
    while (x.measureText(name).width > w - 120 && fs > 22) {
      fs -= 3;
      x.font = `900 ${fs}px 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif`;
    }
    x.textAlign = "left";
    x.fillText(name, 100, 122);
    x.fillStyle = light ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.14)";
    x.fillRect(0, hh - 58, w, 58);
    x.fillStyle = ink;
    x.font = "bold 26px 'Noto Sans SC',sans-serif";
    x.textAlign = "left";
    x.fillText(size || `${it.weight} kg`, 18, hh - 29);
    x.textAlign = "right";
    x.font = "16px monospace";
    x.fillText(`帝标 ${(h % 900) + 100}-84`, w - 16, hh - 29);
  });
  I.labels.set(it.id, tex);
  return tex;
}
function iProductMat(it, opts = {}) {
  const key = it.id + (opts.key || "");
  if (I.mats.has(key)) return I.mats.get(key);
  const m = new THREE.MeshStandardMaterial({
    map: iLabel(it),
    roughness: opts.roughness ?? 0.6,
    metalness: opts.metalness ?? 0,
    envMapIntensity: 0.45,
    ...(opts.extra || {}),
  });
  I.mats.set(key, m);
  return m;
}
function iSolid(color, roughness = 0.5, extra = {}) {
  const key = "solid" + color + roughness + JSON.stringify(extra);
  if (!I.mats.has(key)) I.mats.set(key, iStd(color, roughness, extra));
  return I.mats.get(key);
}
function iLathe(points, seg = 24) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg);
}
function iProduct(id, parent) {
  const it = DB[id],
    spec = I_SPEC[id];
  if (!it || !spec || !R.ready) return null;
  const [shape, dims, color] = spec,
    g = new THREE.Group(),
    label = () => iProductMat(it);
  let height = 0.2;
  const add = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  if (shape === "box" || shape === "med") {
    const [w, h, d] = dims;
    iBox(g, [w, h, d], [0, h / 2, 0], label(), Math.min(0.004, h * 0.15));
    height = h;
  } else if (shape === "paper" || shape === "pouch" || shape === "sack") {
    const [w, h, d] = dims;
    const body = iBox(g, [w, h, d], [0, h / 2, 0], label(), Math.min(w, h, d) * 0.3);
    body.material = iProductMat(it, { key: shape, roughness: shape === "pouch" ? 0.35 : 0.85 });
    if (shape === "paper") iBox(g, [w * 0.98, 0.03, d * 0.5], [0, h + 0.012, 0], iSolid("#d8cdb4", 0.9), 0.004);
    if (shape === "pouch") iBox(g, [w * 1.02, 0.018, d * 0.25], [0, h + 0.004, 0], iSolid("#e8e4da", 0.3), 0.003);
    if (shape === "sack") {
      body.scale.set(1, 1, 1);
      for (const s of [-1, 1]) iBox(g, [w * 0.9, h * 0.6, 0.03], [0, h * 0.42, s * (d / 2 + 0.005)], iSolid("#d9d2bd", 0.95), 0.012);
    }
    height = h;
  } else if (shape === "bottle") {
    const [r, h] = dims;
    const pet = new THREE.MeshPhysicalMaterial({
      color: color || "#dfeff3",
      roughness: 0.08,
      transparent: true,
      opacity: id === "oil" ? 0.85 : 0.55,
      clearcoat: 1,
      envMapIntensity: 1,
    });
    add(
      new THREE.Mesh(
        iLathe([[0, 0], [r * 0.9, 0.004], [r, 0.02], [r, h * 0.62], [r * 0.85, h * 0.74], [r * 0.38, h * 0.88], [r * 0.32, h * 0.93], [0, h * 0.93]]),
        pet,
      ),
    );
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.28, 24, 1, true), label()));
    band.position.y = h * 0.36;
    const cap = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.36, r * 0.36, h * 0.07, 16), iSolid(id === "oil" ? "#c23a1e" : "#2f6aa6", 0.4)));
    cap.position.y = h * 0.965;
    height = h;
  } else if (shape === "hdpe") {
    const [r, h] = dims;
    const body = add(
      new THREE.Mesh(
        iLathe([[0, 0], [r, 0.006], [r, h * 0.72], [r * 0.7, h * 0.85], [r * 0.32, h * 0.88], [0, h * 0.88]]),
        iSolid(color, 0.35),
      ),
    );
    body.scale.z = 0.7;
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.4, 24, 1, true), label()));
    band.scale.z = 0.7;
    band.position.y = h * 0.38;
    const cap = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.34, h * 0.12, 14), iSolid("#efece4", 0.35)));
    cap.position.y = h * 0.94;
    height = h;
  } else if (shape === "jar") {
    const [r, h] = dims;
    add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h * 0.86, 24),
        new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.15, clearcoat: 0.8, envMapIntensity: 0.9 }),
      ),
    ).position.y = h * 0.43;
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.45, 24, 1, true), label()));
    band.position.y = h * 0.45;
    const lid = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, h * 0.14, 24), iSolid("#c9b26a", 0.3, { metalness: 0.8 })));
    lid.position.y = h * 0.93;
    height = h;
  } else if (shape === "tin" || shape === "can") {
    const [r, h] = dims;
    const metal = iSolid("#c5c9c6", 0.28, { metalness: 0.9 });
    add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), metal)).position.y = h / 2;
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.004, r * 1.004, h * 0.86, 24, 1, true), label()));
    band.position.y = h / 2;
    height = h;
  } else if (shape === "carton") {
    const [w, h, d] = dims;
    iBox(g, [w, h, d], [0, h / 2, 0], label(), 0.002);
    const roof = add(new THREE.Mesh(new THREE.CylinderGeometry(0.0001, w * 0.72, 0.035, 4, 1), iSolid("#efebe0", 0.6)));
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, d / w);
    roof.position.y = h + 0.017;
    iBox(g, [w, 0.02, 0.006], [0, h + 0.036, 0], iSolid("#efebe0", 0.6), 0);
    height = h + 0.045;
  } else if (shape === "jug") {
    const [w, h, d] = dims;
    const jug = iBox(
      g,
      [w, h * 0.8, d],
      [0, h * 0.4, 0],
      new THREE.MeshPhysicalMaterial({ color: "#d8e9ee", roughness: 0.18, transparent: true, opacity: 0.6, clearcoat: 1 }),
      0.03,
    );
    jug.castShadow = true;
    iBox(g, [w * 0.6, h * 0.12, d * 0.5], [0, h * 0.86, 0], jug.material, 0.02);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16), iSolid("#2f6aa6", 0.4))).position.set(w * 0.25, h * 0.96, 0);
    iBox(g, [w * 1.005, h * 0.3, d * 1.005], [0, h * 0.42, 0], label(), 0.02);
    height = h;
  } else if (shape === "pile") {
    const [r, n] = dims;
    const mat = iSolid(color, id === "apple" || id === "orange" ? 0.35 : 0.85);
    const geo = id === "carrot" ? new THREE.ConeGeometry(r, 0.17, 12) : new THREE.SphereGeometry(r, 14, 10);
    const h0 = iHash(id);
    for (let k = 0; k < n; k++) {
      const m = add(new THREE.Mesh(geo, mat));
      const layer = k < Math.ceil(n * 0.6) ? 0 : 1,
        a = k * 2.4 + h0;
      const rr = layer ? r * 0.8 : r * 1.6;
      if (id === "carrot") {
        m.rotation.z = Math.PI / 2;
        m.position.set(0, r + layer * r * 1.6, (k % 6) * r * 1.9 - r * 5);
      } else {
        m.position.set(Math.cos(a) * rr, r * 0.95 + layer * r * 1.5, Math.sin(a) * rr * 0.8);
        m.scale.set(1, id === "potato" || id === "sweetpotato" ? 0.75 : 0.92, id === "sweetpotato" ? 1.6 : 1);
        m.rotation.y = a;
      }
    }
    const tag = iBox(g, [0.07, 0.045, 0.002], [r * 2.2, 0.03, 0], label(), 0);
    tag.rotation.y = 0.4;
    height = r * 3.5;
  } else if (shape === "cabbage") {
    const [r] = dims;
    const geo = new THREE.IcosahedronGeometry(r, 3),
      p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, k);
      v.multiplyScalar(1 + Math.sin(v.x * 70) * Math.sin(v.y * 60) * 0.05);
      p.setXYZ(k, v.x, v.y * 0.88, v.z);
    }
    geo.computeVertexNormals();
    add(new THREE.Mesh(geo, iSolid("#8fb070", 0.7))).position.y = r * 0.88;
    height = r * 1.76;
  } else if (shape === "banana") {
    const mat = iSolid("#e0c13e", 0.6);
    for (let k = 0; k < 4; k++) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.09, 0.02, 0),
        new THREE.Vector3(0, -0.012, 0.03),
        new THREE.Vector3(0.09, 0.025, 0),
      );
      const m = add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.017, 7), mat));
      m.position.set(0, 0.018 + (k > 1 ? 0.03 : 0), (k % 2) * 0.035 - 0.017);
    }
    height = 0.08;
  } else if (shape === "bread") {
    const [w, h, d] = dims;
    const loaf = add(new THREE.Mesh(new THREE.CapsuleGeometry(d / 2, w - d, 6, 14), iSolid("#5b3a22", 0.85)));
    loaf.rotation.z = Math.PI / 2;
    loaf.scale.set(h / d, 1, 1);
    loaf.position.y = h / 2;
    height = h;
  } else if (shape === "eggs") {
    const [w, h, d] = dims;
    iBox(g, [w, h * 0.55, d], [0, h * 0.275, 0], iSolid("#a9a294", 0.95), 0.008);
    const egg = new THREE.SphereGeometry(0.021, 12, 8),
      shell = iSolid("#e9dcc4", 0.6);
    for (let k = 0; k < 6; k++) {
      const m = add(new THREE.Mesh(egg, shell));
      m.scale.y = 1.3;
      m.position.set((k % 3 - 1) * 0.06, h * 0.6, (Math.floor(k / 3) - 0.5) * 0.045);
    }
    iBox(g, [w * 0.5, 0.002, d * 0.6], [0, h * 0.555, 0], label(), 0);
    height = h;
  } else if (shape === "cheese") {
    const [r] = dims;
    const wheel = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 28, 1, false, 0, Math.PI * 1.6), iSolid("#e4bf55", 0.6)));
    wheel.position.y = 0.03;
    const wax = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.061, 28, 1, true, 0, Math.PI * 1.6), iSolid("#a8221d", 0.4)));
    wax.position.y = 0.03;
    height = 0.06;
  } else if (shape === "sausage") {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.1, 0.02, 0), new THREE.Vector3(0, 0.02, 0.06), new THREE.Vector3(0.1, 0.02, 0));
    add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.02, 10), iSolid("#6a2a1e", 0.45)));
    height = 0.045;
  } else if (shape === "rolls") {
    const [r] = dims,
      roll = new THREE.CylinderGeometry(r, r, 0.1, 20),
      mat = iSolid("#f2efe6", 0.9);
    for (let k = 0; k < 4; k++) add(new THREE.Mesh(roll, mat)).position.set((k % 2 - 0.5) * r * 2.02, 0.05, (Math.floor(k / 2) - 0.5) * r * 2.02);
    const wrap = iBox(g, [r * 4.1, 0.05, r * 4.1], [0, 0.05, 0], new THREE.MeshPhysicalMaterial({ map: iLabel(it), transparent: true, opacity: 0.35, roughness: 0.2 }), 0.02);
    wrap.castShadow = false;
    height = 0.1;
  } else if (shape === "cloth" || shape === "sponge") {
    const [w, h, d] = dims;
    const key = "cloth" + (color || "sponge");
    if (!I.mats.has(key)) {
      const m = iStd(color || "#d6c34a", shape === "sponge" ? 0.95 : 1);
      m.normalMap = iTex("denim_fabric_nor_gl", 2, 2);
      I.mats.set(key, m);
    }
    const mat = I.mats.get(key);
    iBox(g, [w, h, d], [0, h / 2, 0], mat, h * 0.4);
    if (shape === "sponge") iBox(g, [w, h * 0.3, d], [0, h * 1.1, 0], iSolid("#3f7a4a", 0.9), 0.003);
    height = h;
  } else return null;
  if (parent) parent.add(g);
  g.userData.productId = id;
  g.userData.height = height;
  return g;
}
/* --- Hook into the production pipeline. --- */
const interiorPrevDecorate = roomDecorate,
  interiorPrevFrame = worldFrame,
  interiorPrevSyncWorld = syncWorldRoom,
  interiorPrevProduct = worldProduct,
  interiorPrevLight = roomLight;
roomDecorate = function () {
  interiorPrevDecorate();
  interiorApply();
};
function interiorApply() {
  if (!R.ready || !roomRoot || W.store || !roomRoot.userData.realism || roomRoot.userData.interior)
    return;
  roomRoot.userData.interior = true;
  // RoundedBoxGeometry reports 1×1×1 parameters; restore real sizes so old parts can be identified.
  roomRoot.traverse((o) => {
    if (!o.isMesh || o.geometry.type !== "BoxGeometry" || o.geometry.userData.sized) return;
    o.geometry.computeBoundingBox();
    const v = o.geometry.boundingBox.getSize(new THREE.Vector3());
    o.geometry.parameters = { ...o.geometry.parameters, width: +v.x.toFixed(4), height: +v.y.toFixed(4), depth: +v.z.toFixed(4) };
    o.geometry.userData.sized = true;
  });
  iWalls();
  iCorners();
  iRug();
  iCeilingLamp();
  iClock();
  iEntranceDoor();
  iVeneer();
  iFridge();
  iKitchen();
  iBathroom();
  iBroom();
  roomRoot.updateMatrixWorld(true);
  syncRoom();
  renderer.shadowMap.needsUpdate = true;
  sceneDirty = true;
}
worldProduct = function (id, parent = null, bare = false) {
  const it = DB[id];
  if (R.ready && it && it.category !== "canned" && id !== "cup") {
    const g = iProduct(id, parent);
    if (g) return g;
  }
  return interiorPrevProduct(id, parent, bare);
};
syncWorldRoom = function () {
  interiorPrevSyncWorld();
  if (!W.props || W.store || !env?.mirror) return;
  for (const o of W.props.children) if (!o.userData.mirrorFixed) {
    o.scale.x *= -1;
    o.userData.mirrorFixed = true;
  }
};
roomLight = function () {
  interiorPrevLight();
  if (!R.ready || W.store) return;
  const state = G && phase !== "title" ? G : null,
    night = state && (hour() < 6 || hour() > 18);
  skyLight.intensity = night ? 0.12 : 0.26;
  if (R.windowBounce) R.windowBounce.intensity *= 0.82;
  ceilingLight.intensity *= night ? 1.15 : 0.6;
};
worldFrame = function (now, dt) {
  interiorPrevFrame(now, dt);
  if (!R.ready || W.store) return;
  iClockTick(now);
  if (I.globe) I.globe.emissiveIntensity = ceilingLight.intensity > 1 ? 1.4 : 0.03;
  if (I.hob) {
    const cooking = !!W.busy && /煮|热|烧|cook/.test((W.busy.label || "") + (W.busy.kind || ""));
    const target = cooking ? 2.2 : 0;
    I.hob.material.emissiveIntensity = THREE.MathUtils.damp(I.hob.material.emissiveIntensity, target, 2.5, dt);
    I.hob.material.opacity = Math.min(1, I.hob.material.emissiveIntensity);
  }
};
// The asset loader can finish while the HTML parser is still reading earlier scripts.
if (R.ready) {
  interiorApply();
  if (W.held || phase === "title") worldSetHand();
}
// index.html#sample opens the isolated sample room directly (replaces the old duplicate HTML file).
ROOM_READY.then(() => {
  if (R.ready && (/^#sample/.test(location.hash) || window.CLOSED365_SAMPLE === true) && phase === "title") {
    roomStartSample();
    if (typeof navSetMode === "function") navSetMode("street", false);
    worldFrame(performance.now(), 0.016);
  }
});
