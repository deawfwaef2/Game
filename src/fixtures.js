/* v0.8 fixtures pass: the building's own fabric. A deep plastered reveal with a painted timber
   double casement (inner + outer sashes, fortochka vent, lever handles, weathered glass), and the
   small things every lived-in flat has. Purely visual; every interaction id is preserved.
   Geometry is batched per material so the extra detail costs only a handful of draw calls. */
const FX = { mats: new Map() };
function fxRand(seed) {
  let s = (iHash(String(seed)) >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// Collects boxes / arbitrary geometries in room space with a per-part tint, then merges them.
class FxBatch {
  constructor() {
    this.parts = [];
  }
  box(size, pos, tint = 1, rot = null) {
    return this.geo(new THREE.BoxGeometry(...size), pos, tint, rot);
  }
  geo(g, pos, tint = 1, rot = null) {
    const m = new THREE.Matrix4(),
      q = new THREE.Quaternion();
    if (rot) q.setFromEuler(new THREE.Euler(...rot));
    m.compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1));
    const c = typeof tint === "number" ? new THREE.Color(tint, tint, tint) : new THREE.Color(tint);
    this.parts.push({ g, m, c });
    return this;
  }
  build(mat, parent = roomRoot, shadow = true) {
    if (!this.parts.length) return null;
    let count = 0;
    const list = this.parts.map(({ g, m, c }) => {
      const n = g.index ? g.toNonIndexed() : g;
      n.applyMatrix4(m);
      count += n.attributes.position.count;
      return { n, c };
    });
    const pos = new Float32Array(count * 3),
      nor = new Float32Array(count * 3),
      uv = new Float32Array(count * 2),
      col = new Float32Array(count * 3);
    let o = 0;
    for (const { n, c } of list) {
      const k = n.attributes.position.count;
      pos.set(n.attributes.position.array, o * 3);
      nor.set(n.attributes.normal.array, o * 3);
      if (n.attributes.uv) uv.set(n.attributes.uv.array, o * 2);
      for (let i = 0; i < k; i++) col.set([c.r, c.g, c.b], (o + i) * 3);
      o += k;
      n.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeBoundingSphere();
    mat.vertexColors = true;
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    mesh.userData.noPick = true;
    parent.add(mesh);
    return mesh;
  }
}
// Hide production meshes by their real size (in room space) and approximate position.
function fxHide(match) {
  const v = new THREE.Vector3(),
    hidden = [];
  for (const o of roomRoot.children) {
    if (!o.isMesh || !o.visible) continue;
    o.geometry.computeBoundingBox();
    o.geometry.boundingBox.getSize(v).multiply(o.scale);
    if (match(v, o.position, o)) {
      o.visible = false;
      o.castShadow = false;
      hidden.push(o);
    }
  }
  return hidden;
}
const fxNear = (a, b, t = 0.012) => Math.abs(a - b) < t;
function fxGlassTexture(seed, outer) {
  const rnd = fxRand(seed);
  return iCanvas(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    // Clean glass is almost invisible; a faint haze keeps it readable as a surface.
    x.fillStyle = "rgba(205,214,208,0.05)";
    x.fillRect(0, 0, w, h);
    // Dust gathers in the corners and along the bottom bead, where cloths don't reach.
    const edge = x.createLinearGradient(0, h, 0, h * 0.72);
    edge.addColorStop(0, "rgba(196,190,174,0.3)");
    edge.addColorStop(1, "rgba(196,190,174,0)");
    x.fillStyle = edge;
    x.fillRect(0, 0, w, h);
    for (const cx of [0, w]) {
      const g = x.createLinearGradient(cx, 0, cx ? w - 36 : 36, 0);
      g.addColorStop(0, "rgba(190,186,172,0.16)");
      g.addColorStop(1, "rgba(190,186,172,0)");
      x.fillStyle = g;
      x.fillRect(cx ? w - 36 : 0, 0, 36, h);
    }
    if (outer) {
      // Dried rain runs on the outside pane: thin, mostly vertical, starting high.
      for (let i = 0; i < 46; i++) {
        let px = rnd() * w,
          py = rnd() * h * 0.5;
        const len = 30 + rnd() * 150;
        x.strokeStyle = `rgba(206,202,188,${0.07 + rnd() * 0.1})`;
        x.lineWidth = 0.6 + rnd() * 1.4;
        x.beginPath();
        x.moveTo(px, py);
        for (let s = 0; s < len; s += 6) {
          px += (rnd() - 0.5) * 1.6;
          py += 6;
          x.lineTo(px, py);
        }
        x.stroke();
      }
    } else {
      // Inside pane: faint wipe arcs left by an old cloth.
      x.strokeStyle = "rgba(180,182,170,0.07)";
      for (let i = 0; i < 9; i++) {
        x.lineWidth = 8 + rnd() * 14;
        x.beginPath();
        x.arc(w * (0.2 + rnd() * 0.6), h * (0.3 + rnd() * 0.5), 40 + rnd() * 60, rnd() * 6, rnd() * 6 + 1.6);
        x.stroke();
      }
    }
  });
}
// Old enamel paint over timber: brush drag, settled grime, a few chips down to grey undercoat.
function fxPaintTexture(seed) {
  const rnd = fxRand(seed);
  return iCanvas(512, 512, (x, w, h) => {
    x.fillStyle = "#f4f1ea";
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const y = rnd() * h,
        len = 40 + rnd() * 220,
        px = rnd() * w;
      x.strokeStyle = rnd() < 0.5 ? `rgba(255,255,250,${0.08 + rnd() * 0.12})` : `rgba(150,140,118,${0.03 + rnd() * 0.06})`;
      x.lineWidth = 0.6 + rnd() * 1.6;
      x.beginPath();
      x.moveTo(px, y);
      x.lineTo(px + len, y + (rnd() - 0.5) * 3);
      x.stroke();
    }
    // Yellowed patches where hands and sun have worked on the paint for years.
    for (let i = 0; i < 14; i++) {
      x.fillStyle = `rgba(196,176,128,${0.03 + rnd() * 0.05})`;
      x.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 160, 6 + rnd() * 30);
    }
    for (let i = 0; i < 10; i++) {
      const cx = rnd() * w,
        cy = rnd() * h,
        r = 1 + rnd() * 2.6;
      x.fillStyle = rnd() < 0.75 ? "rgba(170,168,158,0.7)" : "rgba(128,108,82,0.6)";
      x.beginPath();
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2,
          rr = r * (0.5 + rnd());
        x[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr * 1.6, cy + Math.sin(a) * rr);
      }
      x.fill();
    }
  });
}
function fxWindow() {
  const back = -env.d / 2,
    WW = 2.65,
    H = 1.45,
    Y = 1.72,
    y0 = Y - H / 2,
    y1 = Y + H / 2,
    depth = 0.42,
    rnd = fxRand(env.seed + "-window");
  // Remove the thin dark frame bars and the flat sill from the first build.
  fxHide(
    (s, p) =>
      fxNear(p.z, back + 0.04, 0.03) &&
      ((fxNear(s.x, 0.055) && fxNear(s.y, H + 0.12)) || (fxNear(s.x, WW + 0.1) && fxNear(s.y, 0.06))),
  );
  fxHide((s, p) => fxNear(s.x, WW + 0.25) && fxNear(s.y, 0.07) && fxNear(s.z, 0.3) && fxNear(p.z, back + 0.1, 0.03));
  const oldGlass = roomRoot.children.find((o) => o.userData.interact === "window" && o.isMesh);
  if (oldGlass) {
    oldGlass.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    oldGlass.position.z = back + 0.0;
  }
  // 1. Plastered reveal: real tenement walls are ~40 cm thick, the opening shows it.
  const plaster = iPBR("painted_plaster_wall", { roughness: 0.92, normal: 0.35, env: 0.3, arm: false });
  plaster.map = null;
  plaster.color.set(["#e4dfd2", "#dcd5c4", "#cfc6b1"][env.wear]);
  const reveal = new FxBatch(),
    rz = back + 0.07 - depth / 2;
  reveal.box([0.06, H + 0.06, depth], [-WW / 2 - 0.03, Y, rz], 0.97);
  reveal.box([0.06, H + 0.06, depth], [WW / 2 + 0.03, Y, rz], 0.97);
  reveal.box([WW + 0.12, 0.06, depth], [0, y1 + 0.03, rz], 0.9);
  reveal.box([WW + 0.12, 0.05, depth - 0.1], [0, y0 - 0.025, rz - 0.05], 0.86);
  // Outer face of the facade around the opening, so the reveal never shows a void.
  reveal.box([WW + 1.2, 0.5, 0.04], [0, y1 + 0.31, back + 0.07 - depth], 0.8);
  reveal.box([WW + 1.2, 0.6, 0.04], [0, y0 - 0.3, back + 0.07 - depth], 0.8);
  for (const sx of [-1, 1]) reveal.box([0.3, H + 0.2, 0.04], [sx * (WW / 2 + 0.15), Y, back + 0.07 - depth], 0.8);
  const revealMesh = reveal.build(plaster);
  iPlanarUV(revealMesh, 0.9, 0.9);
  // 2. Painted timber: inner and outer frames, each with mullions, transom and sashes.
  const paintTone = ["#e2dccd", "#d9cfb8", "#cbbd9f"][env.wear];
  const paintMap = fxPaintTexture(env.seed + "-paint");
  paintMap.wrapS = paintMap.wrapT = THREE.RepeatWrapping;
  const paint = new THREE.MeshStandardMaterial({ map: paintMap, color: paintTone, roughness: 0.5, metalness: 0, envMapIntensity: 0.45 });
  const wood = new FxBatch(),
    metal = new FxBatch(),
    glassIn = new FxBatch(),
    glassOut = new FxBatch(),
    seal = new FxBatch();
  const t = 0.066,
    mull = 0.06,
    colX = [-WW / 2 + t, -0.44 + mull / 2, 0.44 - mull / 2, WW / 2 - t],
    transY = y1 - t - 0.4;
  const cols = [
    [colX[0], -0.44 - mull / 2],
    [-0.44 + mull / 2, 0.44 - mull / 2],
    [0.44 + mull / 2, colX[3]],
  ];
  const tone = () => 0.93 + rnd() * 0.07;
  const woodIn = wood,
    woodOut = new FxBatch();
  const layer = (z, dep, inner) => {
    const wood = inner ? woodIn : woodOut;
    // Box frame fixed in the opening.
    wood.box([t, H, dep], [-WW / 2 + t / 2, Y, z], tone());
    wood.box([t, H, dep], [WW / 2 - t / 2, Y, z], tone());
    wood.box([WW - 2 * t, t, dep], [0, y1 - t / 2, z], tone());
    // Bottom rail is where condensation sits: slightly greyer paint.
    wood.box([WW - 2 * t, t * 1.15, dep * 1.15], [0, y0 + t * 0.575, z], tone() * 0.88);
    for (const x of [-0.44, 0.44]) wood.box([mull, H - 2 * t - 0.002, dep - 0.004], [x, Y, z], tone());
    wood.box([WW - 2 * t - 0.002, 0.05, dep - 0.006], [0, transY, z], tone());
    // Sashes: lower casements are tall; the upper row is fixed except a small fortochka.
    const cells = [];
    for (let c = 0; c < 3; c++) {
      cells.push({ x0: cols[c][0], x1: cols[c][1], yA: y0 + t * 1.15, yB: transY - 0.025, open: c !== 1, lower: true, c });
      cells.push({ x0: cols[c][0], x1: cols[c][1], yA: transY + 0.025, yB: y1 - t, open: c === 0, lower: false, c });
    }
    const zf = z + (inner ? 1 : -1) * (dep / 2 - 0.004);
    for (const cell of cells) {
      // Sashes sit proud of the frame and lap over it by 12 mm, as rebated casements do.
      cell.x0 -= 0.012;
      cell.x1 += 0.012;
      cell.yA -= 0.012;
      cell.yB += 0.012;
      const cw = cell.x1 - cell.x0,
        ch = cell.yB - cell.yA,
        cx = (cell.x0 + cell.x1) / 2,
        cy = (cell.yA + cell.yB) / 2,
        s = cell.open ? 0.052 : 0.022,
        sd = cell.open ? 0.05 : 0.03,
        sz = zf - (inner ? 1 : -1) * (sd / 2 - 0.012);
      const k = tone();
      wood.box([cw, s, sd], [cx, cell.yA + s / 2, sz], k * 0.92);
      wood.box([cw, s, sd], [cx, cell.yB - s / 2, sz], k);
      wood.box([s, ch - 2 * s, sd], [cell.x0 + s / 2, cy, sz], k);
      wood.box([s, ch - 2 * s, sd], [cell.x1 - s / 2, cy, sz], k);
      // Grey putty line around the glass.
      const gw = cw - 2 * s,
        gh = ch - 2 * s;
      for (const [a, b, px, py] of [
        [gw, 0.008, cx, cell.yA + s + 0.004],
        [gw, 0.008, cx, cell.yB - s - 0.004],
        [0.008, gh, cell.x0 + s + 0.004, cy],
        [0.008, gh, cell.x1 - s - 0.004, cy],
      ])
        seal.box([a, b, 0.012], [px, py, sz], 1);
      (inner ? glassIn : glassOut).geo(new THREE.PlaneGeometry(gw, gh), [cx, cy, sz], 1);
      if (cell.open && inner) {
        // Lever handle on the meeting stile, a stay bolt on the other sashes.
        const hx = cell.c === 0 ? cell.x1 - s / 2 : cell.x0 + s / 2,
          hy = cell.lower ? cy : cy - ch * 0.15,
          hz = sz + sd / 2 + 0.006;
        metal.box([0.026, 0.07, 0.008], [hx, hy, hz], 1);
        metal.geo(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 10), [hx, hy, hz + 0.015], 1, [Math.PI / 2, 0, 0]);
        metal.box([0.014, 0.085, 0.012], [hx, hy - 0.04, hz + 0.03], 1, [0.12, 0, 0]);
        // Exposed hinges on the opening side.
        const hingeX = cell.c === 0 ? cell.x0 + 0.004 : cell.x1 - 0.004;
        for (const f of cell.lower ? [0.15, 0.85] : [0.25, 0.75])
          metal.box([0.012, 0.07, 0.018], [hingeX, cell.yA + ch * f, hz - 0.01], 0.85);
      } else if (cell.open) {
        const hx = cell.c === 0 ? cell.x1 - s / 2 : cell.x0 + s / 2;
        metal.box([0.012, 0.04, 0.02], [hx, cy, sz - sd / 2 - 0.008], 0.8);
      }
    }
  };
  const zIn = back + 0.03,
    zOut = back - 0.19;
  layer(zIn, 0.075, true);
  layer(zOut, 0.065, false);
  // Interior window board: wide, painted, slightly overhanging the radiator; rounded nose.
  const board = new ROOM_TOOLS.RoundedBoxGeometry(WW + 0.16, 0.036, 0.29, 3, 0.012);
  wood.geo(board, [0, y0 - 0.002, back + 0.085], 0.97);
  // Galvanised exterior sill sloping away from the glass.
  metal.geo(new THREE.BoxGeometry(WW + 0.1, 0.008, 0.2), [0, y0 - 0.03, zOut - 0.13], 0.62, [0.12, 0, 0]);
  // Thin laps alias badly in the sun's shadow map (dashed edges); frames still cast onto the floor.
  const innerWood = woodIn.build(paint);
  innerWood.receiveShadow = false;
  iPlanarUV(innerWood, 0.6, 0.6);
  // The outer casement and reveal are deep, narrow crevices where screen-space AO only adds grain.
  const outerWood = woodOut.build(paint);
  outerWood.userData.noAO = true;
  outerWood.receiveShadow = false;
  iPlanarUV(outerWood, 0.6, 0.6);
  revealMesh.userData.noAO = true;
  seal.build(iStd("#8a8679", 0.7), roomRoot, false);
  metal.build(new THREE.MeshStandardMaterial({ color: "#b9b6ad", metalness: 0.85, roughness: 0.34, envMapIntensity: 0.9 }));
  const glassMat = (outer) =>
    new THREE.MeshStandardMaterial({
      map: fxGlassTexture(env.seed + (outer ? "-out" : "-in"), outer),
      color: "#ffffff",
      transparent: true,
      depthWrite: false,
      roughness: 0.12,
      metalness: 0.0,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    });
  // Glass UVs: one texture per pane, so dust gathers in each pane's own corners.
  glassIn.build(glassMat(false), roomRoot, false).renderOrder = 2;
  glassOut.build(glassMat(true), roomRoot, false).renderOrder = 1;
  FX.window = { zIn, zOut };
}

// Rounded-rectangle contour in the XZ plane, always the same vertex count so contours can be lofted.
function fxContour(w, d, r, seg = 6) {
  const pts = [],
    hw = w / 2 - r,
    hd = d / 2 - r;
  for (const [cx, cz, a0] of [
    [hw, hd, 0],
    [-hw, hd, Math.PI / 2],
    [-hw, -hd, Math.PI],
    [hw, -hd, (3 * Math.PI) / 2],
  ])
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  return pts;
}
// Skin between stacked contours [[contour, y], ...]; inward flips the winding for inside faces.
function fxLoft(rings, inward = false) {
  const n = rings[0][0].length,
    pos = [],
    idx = [];
  rings.forEach(([c, y]) => c.forEach(([x, z]) => pos.push(x, y, z)));
  for (let r = 0; r < rings.length - 1; r++)
    for (let i = 0; i < n; i++) {
      const a = r * n + i,
        b = r * n + ((i + 1) % n),
        c = (r + 1) * n + i,
        d = (r + 1) * n + ((i + 1) % n);
      if (inward) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function fxCap(contour, y, up = true) {
  const pos = [0, y, 0],
    idx = [];
  contour.forEach(([x, z]) => pos.push(x, y, z));
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const a = 1 + i,
      b = 1 + ((i + 1) % n);
    if (up) idx.push(0, b, a);
    else idx.push(0, a, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const fxScale = (c, sx, sz = sx) => c.map(([x, z]) => [x * sx, z * sz]);
function fxCurtainTexture(seed) {
  const rnd = fxRand(seed);
  return iCanvas(256, 512, (x, w, h) => {
    x.fillStyle = "#e3ebe6";
    x.fillRect(0, 0, w, h);
    // A period vinyl print: soft wavy bands and little white bubbles.
    for (let y = 0; y < h; y += 64) {
      x.strokeStyle = "rgba(110,150,158,0.22)";
      x.lineWidth = 6;
      x.beginPath();
      for (let px = 0; px <= w; px += 8) x[px ? "lineTo" : "moveTo"](px, y + 20 + Math.sin(px / 24) * 8);
      x.stroke();
    }
    for (let i = 0; i < 90; i++) {
      x.strokeStyle = `rgba(255,255,255,${0.4 + rnd() * 0.4})`;
      x.lineWidth = 1.5;
      x.beginPath();
      x.arc(rnd() * w, rnd() * h, 2 + rnd() * 6, 0, Math.PI * 2);
      x.stroke();
    }
    // Lime-scale tide mark along the hem.
    const g = x.createLinearGradient(0, h, 0, h * 0.86);
    g.addColorStop(0, "rgba(170,160,130,0.45)");
    g.addColorStop(1, "rgba(170,160,130,0)");
    x.fillStyle = g;
    x.fillRect(0, h * 0.86, w, h * 0.14);
  });
}
function fxBathtub() {
  const shower = roomRoot.children.find((o) => o.userData.interact === "shower");
  if (!shower) return;
  shower.children.forEach((c) => (c.visible = false));
  const front = env.d / 2,
    bx = env.w / 2 - 2.05;
  // Tub fills the front wall of the bathroom from the partition: 1.20 m "sitting" bath.
  const L = 1.2,
    D = 0.7,
    Hh = 0.56,
    cx = bx + 0.05 + L / 2 + 0.005,
    cz = front - 0.07 - D / 2 - 0.005;
  const tub = new THREE.Group();
  tub.position.set(cx - shower.position.x, 0, cz - shower.position.z);
  shower.add(tub);
  const enamel = new THREE.MeshPhysicalMaterial({
    color: ["#f4f3ec", "#eeebe0", "#e6e0cf"][env.wear],
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.9,
  });
  const outerTop = fxContour(L, D, 0.07),
    rimIn = fxContour(L - 0.11, D - 0.11, 0.12),
    floorIn = fxContour(L - 0.36, D - 0.3, 0.1);
  // Cast-iron shell: rolled rim, sides drawn in towards the feet.
  const parts = [
    fxLoft([[fxScale(outerTop, 1.0), Hh], [fxScale(outerTop, 1.01), Hh - 0.025], [fxScale(outerTop, 0.985), Hh - 0.06], [fxScale(outerTop, 0.95, 0.93), 0.12]]),
    fxLoft([[rimIn, Hh], [fxScale(rimIn, 1.0), Hh - 0.02], [fxScale(rimIn, 0.95, 0.93), Hh - 0.2], [floorIn, 0.16]], true),
    fxLoft([[outerTop, Hh], [rimIn, Hh]], true),
    fxCap(floorIn, 0.16, true),
    fxCap(fxScale(outerTop, 0.95, 0.93), 0.12, false),
  ];
  for (const g of parts) {
    const m = new THREE.Mesh(g, enamel);
    m.castShadow = m.receiveShadow = true;
    tub.add(m);
  }
  // Rust run under the tap end where the old mixer has dripped for years: a long thin streak.
  const rust = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.34),
    new THREE.MeshStandardMaterial({
      map: iCanvas(32, 256, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(150,92,40,0)");
        g.addColorStop(0.25, "rgba(150,92,40,0.55)");
        g.addColorStop(1, "rgba(120,80,40,0.15)");
        x.fillStyle = g;
        x.beginPath();
        x.ellipse(w / 2, h / 2, w * 0.28, h / 2, 0, 0, Math.PI * 2);
        x.fill();
      }),
      transparent: true,
      depthWrite: false,
      roughness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  rust.position.set(-L / 2 + 0.2, 0.36, D / 2 - 0.105);
  rust.rotation.set(0.62 + Math.PI, 0, 0);
  rust.rotation.x = -Math.PI + 0.55;
  tub.add(rust);
  const chrome = new THREE.MeshStandardMaterial({ color: "#d4d7d5", metalness: 0.95, roughness: 0.2 });
  // Drain with chrome ring and a rubber plug left on its chain.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 24), chrome);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(-L / 2 + 0.24, 0.163, 0);
  tub.add(ring);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), iStd("#141414", 0.6));
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(-L / 2 + 0.24, 0.162, 0);
  tub.add(hole);
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.018, 16), iStd("#262626", 0.8));
  plug.position.set(-L / 2 + 0.33, 0.17, 0.07);
  plug.rotation.z = 0.25;
  tub.add(plug);
  // Feet.
  for (const fx of [-1, 1])
    for (const fz of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.12, 10), iStd("#3a3631", 0.6));
      foot.position.set(fx * (L / 2 - 0.14), 0.06, fz * (D / 2 - 0.12));
      tub.add(foot);
    }
  // Wall mixer with cross heads, long swivel spout and a hand shower on its hook.
  const wallZ = D / 2 + 0.005,
    mx = -L / 2 + 0.2,
    my = Hh + 0.24;
  const tap = new THREE.Group();
  tap.position.set(mx, my, wallZ);
  tub.add(tap);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 14), chrome);
  body.rotation.z = Math.PI / 2;
  body.position.z = -0.05;
  tap.add(body);
  for (const sx of [-0.12, 0.12]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 10), chrome);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(sx, 0, -0.025);
    tap.add(arm);
    for (const a of [0, Math.PI / 2]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), chrome);
      bar.rotation.y = 0;
      bar.rotation.z = a;
      bar.position.set(sx, 0.045, -0.05);
      tap.add(bar);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.045, 8), chrome);
    stem.position.set(sx, 0.022, -0.05);
    tap.add(stem);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.01, 10, 6), iStd(sx < 0 ? "#2f6db0" : "#b0302f", 0.3));
    dot.position.set(sx, 0.052, -0.05);
    tap.add(dot);
  }
  roomTube(tap, [[0, -0.01, -0.05], [0, -0.03, -0.1], [0.02, -0.06, -0.22], [0.04, -0.09, -0.27]], 0.009, chrome, 16);
  // Hose loops down and back up to the hand shower parked in a wall hook.
  const hook = [mx + 0.32, Hh + 1.05, wallZ - 0.03];
  roomTube(tub, [[mx, my - 0.03, wallZ - 0.05], [mx + 0.06, my - 0.26, wallZ - 0.12], [mx + 0.2, my - 0.32, wallZ - 0.1], [mx + 0.3, my - 0.05, wallZ - 0.05], [hook[0], hook[1] - 0.16, hook[2]]], 0.0075, new THREE.MeshStandardMaterial({ color: "#b9bcbb", metalness: 0.8, roughness: 0.35 }), 40);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.17, 12), chrome);
  handle.position.set(hook[0], hook[1] - 0.08, hook[2]);
  handle.rotation.x = -0.15;
  tub.add(handle);
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.03, 0.03, 20), chrome);
  rose.position.set(hook[0], hook[1] + 0.02, hook[2] - 0.025);
  rose.rotation.x = -1.1;
  tub.add(rose);
  const holder = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), chrome);
  holder.position.set(hook[0], hook[1] - 0.02, wallZ - 0.02);
  tub.add(holder);
  // Curtain rail (L-shaped, wall to wall) with a vinyl curtain drawn back against the partition.
  const railY = 1.98,
    rz = -D / 2 + 0.085,
    rx = L / 2 - 0.085;
  roomTube(tub, [[-L / 2 - 0.005, railY, rz], [rx - 0.08, railY, rz], [rx, railY, rz + 0.08], [rx, railY, D / 2 + 0.005]], 0.0095, chrome, 24);
  const cw = 0.52,
    ch = railY - 0.42,
    seg = 64,
    geo = new THREE.PlaneGeometry(cw, ch, seg, 12),
    pp = geo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const u = (pp.getX(i) + cw / 2) / cw,
      v = (pp.getY(i) + ch / 2) / ch;
    // Gathered pleats: deep at the rail, relaxing and flaring slightly towards the hem.
    const amp = 0.018 + v * 0.008,
      phase = u * Math.PI * 9 + Math.sin(u * 6.1) * 1.4 + Math.sin(u * 17.3 + v * 1.7) * 0.5;
    pp.setZ(i, Math.sin(phase) * amp + Math.sin(u * 4.3 + v * 2.4) * 0.02 + Math.sin(u * 2.1) * (1 - v) * 0.03);
    pp.setX(i, pp.getX(i) * (0.92 + (1 - v) * 0.12));
  }
  geo.computeVertexNormals();
  const curtainMap = fxCurtainTexture(env.seed + "-curtain");
  const curtain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: curtainMap, roughness: 0.45, side: THREE.DoubleSide, envMapIntensity: 0.6 }),
  );
  curtain.position.set(-L / 2 + cw / 2 + 0.02, 0.42 + ch / 2 - 0.01, rz + 0.01);
  curtain.castShadow = curtain.receiveShadow = true;
  tub.add(curtain);
  for (let i = 0; i < 9; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 6, 16), iStd("#e9e7df", 0.4));
    r.position.set(-L / 2 + 0.04 + i * (cw / 8.6), railY - 0.012, rz);
    r.scale.set(1, 1, 1);
    r.rotation.y = Math.PI / 2;
    tub.add(r);
  }
  // Move the washing basin into the tub (where it lives in real small flats) and block walking in.
  const laundry = roomRoot.children.find((o) => o.userData.interact === "laundry");
  if (laundry) laundry.position.set(cx + 0.24, 0.16, cz - 0.02);
  roomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(parts.length ? tub.children[0] : tub);
  colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z, minY: 0, maxY: Hh });
}

// Cast-iron sectional radiator (MS-140 pattern) on a one-pipe riser, replacing the capsule stand-in.
function fxRadiator() {
  const back = -env.d / 2,
    wallZ = back + 0.07;
  for (const g of roomRoot.getObjectsByProperty("type", "Group")) {
    const caps = g.children.filter((c) => c.geometry?.type === "CapsuleGeometry");
    if (caps.length >= 8) g.visible = false;
  }
  const cast = new FxBatch(),
    pipe = new FxBatch(),
    brass = new FxBatch(),
    n = 11,
    pitch = 0.092,
    H = 0.56,
    y0 = 0.13,
    z = wallZ + 0.05 + 0.07,
    x0 = -((n - 1) * pitch) / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * pitch,
      k = 0.95 + ((i * 37) % 7) / 100;
    for (const dz of [-0.035, 0.035])
      cast.geo(new ROOM_TOOLS.RoundedBoxGeometry(0.07, H - 0.06, 0.042, 2, 0.018), [x, y0 + H / 2, z + dz], k);
    // Hubs (top and bottom) where the sections are nippled together.
    for (const y of [y0 + 0.04, y0 + H - 0.04])
      cast.geo(new ROOM_TOOLS.RoundedBoxGeometry(pitch + 0.002, 0.075, 0.13, 2, 0.03), [x, y, z], k * 0.97);
    // The waist web between the two columns.
    cast.box([0.03, H - 0.16, 0.05], [x, y0 + H / 2, z], k * 0.9);
  }
  // Riser beside the window: floor to ceiling, collars at each end, branches into the radiator.
  const rx = -1.52,
    rz = wallZ + 0.045,
    r = 0.017,
    endX = x0 - pitch / 2;
  pipe.geo(new THREE.CylinderGeometry(r, r, 2.85, 14), [rx, 1.425, rz], 1);
  for (const y of [0.04, 2.77]) pipe.geo(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 16), [rx, y, rz], 0.92);
  for (const y of [y0 + 0.04, y0 + H - 0.04]) {
    // Branch along the wall, then an elbow forward into the end section's hub.
    const ex = endX - 0.03;
    pipe.geo(new THREE.CylinderGeometry(0.013, 0.013, ex - rx, 12), [(rx + ex) / 2, y, rz], 1, [0, 0, Math.PI / 2]);
    pipe.geo(new THREE.SphereGeometry(0.016, 12, 8), [ex, y, rz], 1);
    pipe.geo(new THREE.CylinderGeometry(0.013, 0.013, z - rz, 12), [ex, y, (rz + z) / 2], 1, [Math.PI / 2, 0, 0]);
    pipe.geo(new THREE.CylinderGeometry(0.013, 0.013, 0.03, 12), [ex + 0.015, y, z], 1, [0, 0, Math.PI / 2]);
  }
  // Bypass jumper between the branches, and a brass valve on the upper one.
  pipe.geo(new THREE.CylinderGeometry(0.012, 0.012, H - 0.08, 12), [rx + 0.11, y0 + H / 2, rz + 0.02], 0.97);
  brass.geo(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 14), [endX - 0.07, y0 + H - 0.04, z - 0.01], 1, [0, 0, Math.PI / 2]);
  brass.geo(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8), [endX - 0.07, y0 + H - 0.005, z - 0.01], 1);
  brass.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 18), [endX - 0.07, y0 + H + 0.02, z - 0.01], 0.6);
  // Wall brackets.
  for (const bx of [x0 + pitch * 2, x0 + pitch * (n - 3)]) pipe.box([0.02, 0.05, 0.1], [bx, y0 + H - 0.1, wallZ + 0.05], 0.8);
  const paint = new THREE.MeshStandardMaterial({
    map: fxPaintTexture(env.seed + "-radiator"),
    color: ["#e3dcc8", "#d9cfb6", "#c8bb9c"][env.wear],
    roughness: 0.48,
    envMapIntensity: 0.45,
  });
  const castMesh = cast.build(paint);
  iPlanarUV(castMesh, 0.35, 0.35);
  pipe.build(paint);
  brass.build(new THREE.MeshStandardMaterial({ color: "#a98a4a", metalness: 0.85, roughness: 0.38 }));
}
// Surface-mounted Bakelite sockets, a two-gang switch, and the plugs/cords that use them.
function fxElectrics() {
  const w = env.w,
    d = env.d,
    back = -d / 2,
    plastic = new FxBatch(),
    dark = new FxBatch(),
    cords = [];
  // dir: unit normal of the wall the fitting is on (into the room).
  const orient = (dir) => ({ "+z": [Math.PI / 2, 0, 0], "-z": [-Math.PI / 2, 0, 0], "-x": [0, 0, Math.PI / 2], "+x": [0, 0, -Math.PI / 2] })[dir];
  const off = (p, dir, t) => ({ "+z": [p[0], p[1], p[2] + t], "-z": [p[0], p[1], p[2] - t], "-x": [p[0] - t, p[1], p[2]], "+x": [p[0] + t, p[1], p[2]] })[dir];
  const along = (p, dir, t) => (dir[1] === "z" ? [p[0] + t, p[1], p[2]] : [p[0], p[1], p[2] + t]);
  const socket = (p, dir, plug = false) => {
    plastic.geo(new THREE.CylinderGeometry(0.038, 0.04, 0.016, 24), off(p, dir, 0.008), 0.96, orient(dir));
    plastic.geo(new THREE.CylinderGeometry(0.031, 0.034, 0.012, 24), off(p, dir, 0.02), 1, orient(dir));
    for (const t of [-0.0095, 0.0095]) dark.geo(new THREE.CylinderGeometry(0.0032, 0.0032, 0.004, 8), off(along(p, dir, t), dir, 0.025), 1, orient(dir));
    dark.geo(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 8), off([p[0], p[1] + 0.02, p[2]], dir, 0.026), 0.6, orient(dir));
    if (plug) {
      dark.geo(new THREE.CylinderGeometry(0.019, 0.016, 0.034, 16), off(p, dir, 0.044), 1, orient(dir));
      return off(p, dir, 0.06);
    }
    return null;
  };
  const sw = (p, dir, gangs) => {
    const wdt = gangs > 1 ? 0.12 : 0.075;
    const size = dir[1] === "z" ? [wdt, 0.085, 0.014] : [0.014, 0.085, wdt];
    plastic.box(size, off(p, dir, 0.007), 0.97);
    for (let g = 0; g < gangs; g++) {
      const t = gangs > 1 ? (g - 0.5) * 0.052 : 0;
      const k = dir[1] === "z" ? [0.036, 0.05, 0.014] : [0.014, 0.05, 0.036];
      const tilt = { "+z": [0.12, 0, 0], "-z": [-0.12, 0, 0], "-x": [0, 0, 0.12], "+x": [0, 0, -0.12] }[dir];
      plastic.box(k, off(along(p, dir, t), dir, 0.018), 1, tilt);
    }
  };
  // Desk lamp: the realism pass already runs its cord down to the floor at (0.7, 0.07, back+0.12).
  const lampPlug = socket([0.8, 0.27, back + 0.07], "+z", true);
  cords.push([[0.7, 0.07, back + 0.12], [0.76, 0.08, back + 0.1], [0.8, 0.15, back + 0.13], lampPlug]);
  // Bedside and bed-head sockets on the side wall.
  socket([-w / 2 + 0.07, 0.3, -1.45], "+x");
  // Kitchen: double socket above the worktop between sink and cooker.
  socket([2.52, 1.12, back + 0.07], "+z");
  socket([2.62, 1.12, back + 0.07], "+z");
  // Fridge cord.
  if (env.fridge) {
    const plug = socket([w / 2 - 0.07, 0.32, -0.3], "-x", true);
    cords.push([plug, [w / 2 - 0.08, 0.12, -0.33], [w / 2 - 0.09, 0.03, -0.42], [w / 2 - 0.08, 0.2, -0.55]]);
  }
  // Two-gang switch (bathroom + toilet light) beside the bathroom doorway, at the old 1.6 m height.
  const bx = w / 2 - 2.05,
    bz = d / 2 - 2.05;
  sw([bx + 0.19, 1.55, bz - 0.05], "-z", 2);
  const ivory = new THREE.MeshStandardMaterial({ color: ["#f1ede1", "#e9e1cd", "#ddd1b6"][env.wear], roughness: 0.32, envMapIntensity: 0.6 });
  plastic.build(ivory, roomRoot, true);
  dark.build(iStd("#1e1b18", 0.45), roomRoot, false);
  const cordMat = iStd("#26221e", 0.55);
  for (const pts of cords) roomTube(roomRoot, pts, 0.0035, cordMat, 24);
}
// Bathroom door: painted panel leaf with a reeded-glass top light, standing open into the bathroom.
function fxBathDoor() {
  const w = env.w,
    d = env.d,
    bx = w / 2 - 2.05,
    bz = d / 2 - 2.05,
    x0 = bx + 0.38,
    x1 = bx + 1.46,
    top = 2.12;
  const casing = new FxBatch(),
    leaf = new FxBatch(),
    glass = new FxBatch(),
    metal = new FxBatch();
  // Jamb lining and architraves on the room side.
  const jw = 0.035;
  for (const x of [x0 + jw / 2, x1 - jw / 2]) casing.box([jw, top, 0.12], [x, top / 2, bz], 0.97);
  casing.box([x1 - x0, jw, 0.12], [(x0 + x1) / 2, top - jw / 2, bz], 0.97);
  for (const side of [-1, 1]) {
    const z = bz + side * 0.062;
    for (const x of [x0 - 0.03, x1 + 0.03]) casing.box([0.07, top + 0.06, 0.016], [x, (top + 0.06) / 2, z], 0.93);
    casing.box([x1 - x0 + 0.13, 0.07, 0.016], [(x0 + x1) / 2, top + 0.03, z], 0.93);
  }
  // Leaf, hinged on the left jamb, open ~97° into the bathroom.
  const LW = x1 - x0 - 2 * jw - 0.006,
    LH = top - jw - 0.012,
    T = 0.04;
  const g = new THREE.Group();
  g.position.set(x0 + jw + 0.003, 0.006, bz + 0.03);
  g.rotation.y = -1.69;
  roomRoot.add(g);
  const stile = 0.11,
    rail = 0.12; // leaf local: x from 0 (hinge) to LW, y up, z thickness
  leaf.box([stile, LH, T], [stile / 2, LH / 2, 0], 1);
  leaf.box([stile, LH, T], [LW - stile / 2, LH / 2, 0], 1);
  leaf.box([LW - 2 * stile, rail, T], [LW / 2, rail / 2, 0], 0.9);
  leaf.box([LW - 2 * stile, rail, T], [LW / 2, LH - rail / 2, 0], 1);
  leaf.box([LW - 2 * stile, rail, T], [LW / 2, 1.0, 0], 1);
  leaf.box([LW - 2 * stile, rail * 0.8, T], [LW / 2, 1.42, 0], 1);
  // Recessed lower panel.
  leaf.box([LW - 2 * stile + 0.004, 1.0 - 1.5 * rail, T * 0.55], [LW / 2, (rail + 1.0 - rail / 2) / 2, 0], 0.95);
  // Mid panel and reeded glass light above.
  leaf.box([LW - 2 * stile + 0.004, 1.42 - 1.0 - rail * 0.9, T * 0.55], [LW / 2, (1.0 + 1.42) / 2, 0], 0.95);
  const gy0 = 1.42 + rail * 0.4,
    gy1 = LH - rail;
  glass.geo(new THREE.PlaneGeometry(LW - 2 * stile, gy1 - gy0), [LW / 2, (gy0 + gy1) / 2, 0], 1);
  for (const zz of [-1, 1])
    for (const [a, b, px, py] of [
      [LW - 2 * stile, 0.014, LW / 2, gy0 + 0.007],
      [LW - 2 * stile, 0.014, LW / 2, gy1 - 0.007],
      [0.014, gy1 - gy0, stile + 0.007, (gy0 + gy1) / 2],
      [0.014, gy1 - gy0, LW - stile - 0.007, (gy0 + gy1) / 2],
    ])
      leaf.box([a, b, 0.012], [px, py, zz * 0.012], 0.9);
  // Handles both sides, keyhole escutcheon, hinges.
  for (const zz of [-1, 1]) {
    metal.box([0.035, 0.16, 0.006], [LW - 0.06, 0.98, zz * (T / 2 + 0.003)], 1);
    metal.geo(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 10), [LW - 0.06, 1.02, zz * (T / 2 + 0.028)], 1, [Math.PI / 2, 0, 0]);
    metal.box([0.11, 0.016, 0.018], [LW - 0.105, 1.02, zz * (T / 2 + 0.05)], 1);
  }
  for (const y of [0.22, LH - 0.22]) metal.geo(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 10), [-0.004, y, 0], 0.8);
  const paint = new THREE.MeshStandardMaterial({
    map: fxPaintTexture(env.seed + "-door"),
    color: ["#e8e2d2", "#ded4bd", "#cfc2a4"][env.wear],
    roughness: 0.42,
    envMapIntensity: 0.45,
  });
  const c = casing.build(paint);
  iPlanarUV(c, 0.5, 0.5);
  const l = leaf.build(paint.clone(), g);
  iPlanarUV(l, 0.5, 0.5, g);
  metal.build(new THREE.MeshStandardMaterial({ color: "#b8b2a2", metalness: 0.8, roughness: 0.35 }), g);
  const reeded = iCanvas(64, 256, (x, cw, chh) => {
    for (let i = 0; i < cw; i += 4) {
      x.fillStyle = i % 8 ? "rgba(225,232,228,0.72)" : "rgba(250,252,250,0.82)";
      x.fillRect(i, 0, 4, chh);
    }
  });
  reeded.wrapS = THREE.RepeatWrapping;
  reeded.repeat.set(5, 1);
  glass.build(
    new THREE.MeshStandardMaterial({ map: reeded, transparent: true, depthWrite: false, roughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 0.8 }),
    g,
    false,
  );
  // Thin collider so nobody walks through the open leaf.
  roomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(l);
  colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z, minY: 0, maxY: 2 });
}
// Plaid wool blanket draped over the lower two-thirds of the bed, top sheet turned down over it.
function fxBlanketTexture(seed) {
  const rnd = fxRand(seed);
  const t = iCanvas(512, 512, (x, w, h) => {
    x.fillStyle = "#6e3a2c";
    x.fillRect(0, 0, w, h);
    const band = (pos, width, color, vertical) => {
      x.fillStyle = color;
      if (vertical) x.fillRect(pos, 0, width, h);
      else x.fillRect(0, pos, w, width);
    };
    for (const v of [false, true]) {
      for (let k = 0; k < 2; k++) {
        const o = k * 256;
        band(o + 30, 70, "rgba(48,58,44,0.62)", v);
        band(o + 120, 10, "rgba(220,198,150,0.55)", v);
        band(o + 150, 26, "rgba(30,24,22,0.45)", v);
        band(o + 206, 6, "rgba(220,198,150,0.45)", v);
      }
    }
    // Fuzzy wool: thousands of short fibres.
    for (let i = 0; i < 9000; i++) {
      const px = rnd() * w,
        py = rnd() * h,
        a = rnd() * Math.PI;
      x.strokeStyle = rnd() < 0.5 ? `rgba(255,235,210,${0.04 + rnd() * 0.05})` : `rgba(20,10,8,${0.05 + rnd() * 0.06})`;
      x.lineWidth = 0.8;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + Math.cos(a) * 3, py + Math.sin(a) * 3);
      x.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function fxBlanket() {
  const bed = roomRoot.children.find((o) => o.userData.interact === "bed");
  if (!bed) return;
  roomRoot.updateMatrixWorld(true);
  const meshes = [];
  bed.traverse((o) => o.isMesh && o.visible && !o.userData.proxy && o.geometry.attributes.position.count > 100 && meshes.push(o));
  if (!meshes.length) return;
  const inv = new THREE.Matrix4().copy(roomRoot.matrixWorld).invert(),
    bb = new THREE.Box3();
  meshes.forEach((m) => bb.union(new THREE.Box3().setFromObject(m)));
  bb.applyMatrix4(inv);
  const rc = new THREE.Raycaster(),
    down = roomRoot.localToWorld(new THREE.Vector3(0, -1, 0)).sub(roomRoot.localToWorld(new THREE.Vector3())).normalize();
  const height = (x, z) => {
    rc.set(roomRoot.localToWorld(new THREE.Vector3(x, 2.5, z)), down);
    const h = rc.intersectObjects(meshes, false)[0];
    return h ? roomRoot.worldToLocal(h.point.clone()).y : 0;
  };
  // Mattress top and its width along the bed's long (z) axis.
  const cx0 = (bb.min.x + bb.max.x) / 2,
    bbx0 = cx0,
    zFoot = bb.max.z - 0.04,
    zHead = bb.min.z + 0.04,
    zMid = (zFoot * 2 + zHead) / 3,
    top = height(cx0, zMid);
  // Scan each side separately: the room side drops off the mattress, the wall side rises into the backrest.
  const flat = (x) => {
    const h = height(x, zMid);
    return h > top - 0.05 && h < top + 0.06;
  };
  let left = bbx0, right = bbx0;
  for (left = cx0; left > bb.min.x && flat(left - 0.02); left -= 0.02);
  for (right = cx0; right < bb.max.x && flat(right + 0.02); right += 0.02);
  const cx = (left + right) / 2,
    half = (right - left) / 2;
  const hang = 0.24,
    z0 = zHead + (zFoot - zHead) * 0.36,
    z1 = zFoot,
    nu = 36,
    nv = 40,
    geo = new THREE.PlaneGeometry(1, 1, nu, nv),
    pp = geo.attributes.position,
    uvs = geo.attributes.uv,
    a = half + hang,
    len = z1 - z0 + 0.18;
  const field = new Map();
  const fh = (x, z) => {
    const key = Math.round(x * 25) + "," + Math.round(z * 25);
    if (!field.has(key)) field.set(key, height(x, z));
    return field.get(key);
  };
  for (let i = 0; i < pp.count; i++) {
    const u = pp.getX(i) * 2 * a,
      v = (pp.getY(i) + 0.5) * len,
      zz = z0 + v;
    let x, y, z;
    const ripple = Math.sin(u * 9 + v * 3) * 0.006 + Math.sin(v * 13 - u * 4) * 0.004;
    if (Math.abs(u) <= half) {
      x = cx + u;
      z = Math.min(zz, z1);
      y = THREE.MathUtils.clamp(fh(x, z), top - 0.03, top + 0.025) + 0.018 + ripple;
    } else {
      const e = Math.abs(u) - half,
        sx = Math.sign(u);
      x = cx + sx * (half + 0.035 * (1 - Math.exp(-e * 12)) + Math.sin(v * 7) * 0.006 * e * 4);
      z = Math.min(zz, z1);
      y = top + 0.018 - e;
    }
    if (zz > z1) {
      // Over the foot end.
      const e = zz - z1;
      z = z1 + 0.03 * (1 - Math.exp(-e * 12));
      y -= e;
    }
    pp.setXYZ(i, x, y, z);
    uvs.setXY(i, u / 0.6, v / 0.6);
  }
  geo.computeVertexNormals();
  const map = fxBlanketTexture(env.seed + "-blanket");
  const wool = new THREE.MeshStandardMaterial({ map, roughness: 0.95, side: THREE.DoubleSide, envMapIntensity: 0.3 });
  wool.color.setScalar([1, 0.94, 0.86][env.wear]);
  const blanket = new THREE.Mesh(geo, wool);
  blanket.castShadow = blanket.receiveShadow = true;
  blanket.userData.noPick = true;
  roomRoot.add(blanket);
  // Turned-down top sheet over the blanket's head edge.
  const sg = new THREE.PlaneGeometry(1, 1, 20, 4),
    sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const u = sp.getX(i) * 2 * (half + 0.05),
      v = (sp.getY(i) + 0.5) * 0.2,
      x = cx + u,
      z = z0 - 0.04 + v;
    const y = THREE.MathUtils.clamp(fh(x, Math.min(z, z1)), top - 0.03, top + 0.025) + 0.03 + Math.sin(u * 8) * 0.004 + (v > 0.04 ? 0 : -0.01);
    sp.setXYZ(i, x, Math.abs(u) > half ? y - (Math.abs(u) - half) : y, z);
  }
  sg.computeVertexNormals();
  const sheet = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: "#ecebe4", roughness: 0.85, side: THREE.DoubleSide, envMapIntensity: 0.3 }));
  sheet.castShadow = sheet.receiveShadow = true;
  sheet.userData.noPick = true;
  roomRoot.add(sheet);
}

// Kitchen sink: the lathe bowl was single-sided, so from above you looked straight through it into
// the cupboard. Make it a real brushed-steel bowl with a drain.
function fxSink() {
  const sink = worldFindBase("sink");
  if (!sink) return;
  const bowl = sink.children.find((c) => c.isMesh && c.geometry.type === "LatheGeometry");
  if (!bowl) return;
  // The kitchen carcass is one solid box whose top sits at worktop level, swallowing the bowl.
  // Rebuild it as a box with a void under the sink.
  const sp = sink.getWorldPosition(new THREE.Vector3()),
    rc = new THREE.Raycaster(sp.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, -1, 0));
  const hit = rc
    .intersectObjects(roomRoot.children, true)
    .find((h) => h.object.visible && h.object.material.colorWrite !== false && !sink.getObjectById(h.object.id) && h.object.geometry.type === "BoxGeometry");
  if (hit && hit.object.parent) {
    const carcass = hit.object,
      parent = carcass.parent;
    carcass.geometry.computeBoundingBox();
    const b = carcass.geometry.boundingBox.clone().applyMatrix4(carcass.matrix),
      c = parent.worldToLocal(sp.clone()),
      vx0 = c.x - 0.29,
      vx1 = c.x + 0.29,
      vz0 = Math.max(b.min.z + 0.02, c.z - 0.22),
      vz1 = Math.min(b.max.z - 0.02, c.z + 0.22),
      vy = b.max.y - 0.24;
    const add = (x0, x1, y0, y1, z0, z1) => {
      if (x1 - x0 < 0.002 || y1 - y0 < 0.002 || z1 - z0 < 0.002) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), carcass.material);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
    };
    add(b.min.x, b.max.x, b.min.y, vy, b.min.z, b.max.z);
    add(b.min.x, vx0, vy, b.max.y, b.min.z, b.max.z);
    add(vx1, b.max.x, vy, b.max.y, b.min.z, b.max.z);
    add(vx0, vx1, vy, b.max.y, b.min.z, vz0);
    add(vx0, vx1, vy, b.max.y, vz1, b.max.z);
    carcass.visible = false;
  }
  const steel = bowl.material.clone();
  steel.side = THREE.DoubleSide;
  steel.roughness = 0.34;
  steel.color.set("#c4c8c6");
  bowl.material = steel;
  bowl.geometry.computeBoundingBox();
  const bb = bowl.geometry.boundingBox,
    y = bb.min.y + 0.004;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 28), steel);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, y + 0.002, 0);
  bowl.add(ring);
  const grate = new THREE.Mesh(new THREE.CircleGeometry(0.028, 24), iStd("#2a2a28", 0.5, { metalness: 0.6 }));
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(0, y + 0.001, 0);
  bowl.add(grate);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), iStd("#0c0c0c", 0.8));
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(0, y + 0.0015, 0);
  bowl.add(hole);
}

// Same vertex count as fxContour(…, seg = 6): 28 points, so ellipses and rounded rects loft together.
function fxEllipse(w, d, cz = 0, n = 28) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.cos(a) * w / 2, cz + Math.sin(a) * d / 2]);
  }
  return pts;
}
const fxShift = (c, dz) => c.map(([x, z]) => [x, z + dz]);
// Floor-standing "compact" WC of the period: one-piece pedestal and bowl, cistern on the rear shelf,
// thermoplastic seat with the lid leaning back, supply pipe and stop valve to the wall.
function fxToilet() {
  const toilet = worldFindBase("toilet");
  if (!toilet) return;
  toilet.children.forEach((c) => {
    if (c.material?.colorWrite !== false) c.visible = false;
  });
  const porcelain = new THREE.MeshPhysicalMaterial({
    color: ["#f1f1ec", "#ecebe3", "#e4e1d4"][env.wear],
    roughness: 0.14,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.8,
  });
  const g = new THREE.Group();
  toilet.add(g);
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  // Rear of the WC is +z (against the wall). Bowl reaches forward to z ≈ -0.33.
  const foot = fxShift(fxContour(0.24, 0.3, 0.1), 0.06),
    neck = fxShift(fxContour(0.21, 0.28, 0.09), 0.05),
    belly = fxEllipse(0.33, 0.44, -0.06),
    rimOut = fxEllipse(0.36, 0.48, -0.075),
    rimTop = fxEllipse(0.355, 0.475, -0.075),
    rimIn = fxEllipse(0.27, 0.35, -0.085),
    throat = fxEllipse(0.15, 0.17, -0.03),
    trap = fxEllipse(0.1, 0.11, 0.0);
  add(fxLoft([[rimTop, 0.4], [rimOut, 0.385], [belly, 0.29], [neck, 0.15], [foot, 0.0]], false), porcelain);
  add(fxLoft([[rimTop, 0.4], [rimIn, 0.4]], true), porcelain);
  add(fxLoft([[rimIn, 0.4], [fxScale(rimIn, 0.9), 0.36], [throat, 0.25], [trap, 0.18]], true), porcelain);
  // Standing water in the trap.
  const water = add(fxCap(fxEllipse(0.16, 0.19, -0.035), 0.235, true), new THREE.MeshPhysicalMaterial({ color: "#b9cbc8", roughness: 0.03, transparent: true, opacity: 0.55, depthWrite: false }), false);
  water.userData.noAO = true;
  // Rear shelf the cistern sits on, joining the bowl.
  add(new ROOM_TOOLS.RoundedBoxGeometry(0.34, 0.07, 0.2, 2, 0.02).translate(0, 0.37, 0.2), porcelain);
  add(new ROOM_TOOLS.RoundedBoxGeometry(0.2, 0.33, 0.18, 2, 0.04).translate(0, 0.19, 0.2), porcelain);
  // Close-coupled cistern, lid and chrome push button.
  add(new ROOM_TOOLS.RoundedBoxGeometry(0.4, 0.36, 0.17, 3, 0.03).translate(0, 0.585, 0.25), porcelain);
  add(new ROOM_TOOLS.RoundedBoxGeometry(0.42, 0.035, 0.19, 3, 0.012).translate(0, 0.78, 0.25), porcelain);
  const chrome = new THREE.MeshStandardMaterial({ color: "#d3d6d4", metalness: 0.95, roughness: 0.22 });
  add(new THREE.CylinderGeometry(0.02, 0.022, 0.02, 20).translate(0, 0.805, 0.25), chrome);
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16).translate(0, 0.817, 0.25), chrome);
  // Floor bolt caps.
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.016, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(sx * 0.11, 0.0, 0.1), porcelain, false);
  // Thermoplastic seat ring (hinged at the back) and the lid leaning against the cistern.
  const seatMat = new THREE.MeshPhysicalMaterial({ color: ["#efece2", "#e8e2d2", "#ddd4bf"][env.wear], roughness: 0.32, clearcoat: 0.3 });
  const ringShape = new THREE.Shape(),
    hole = new THREE.Path();
  ringShape.absellipse(0, 0, 0.18, 0.225, 0, Math.PI * 2, false);
  hole.absellipse(0, 0.012, 0.11, 0.14, 0, Math.PI * 2, true);
  ringShape.holes.push(hole);
  const ext = { depth: 0.016, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 3, curveSegments: 40 };
  const ring = add(new THREE.ExtrudeGeometry(ringShape, ext), seatMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.425, -0.075);
  const lidShape = new THREE.Shape();
  lidShape.absellipse(0, 0, 0.185, 0.23, 0, Math.PI * 2, false);
  const lid = add(new THREE.ExtrudeGeometry(lidShape, ext), seatMat);
  // Hinge line at the back of the seat; the lid swings up past vertical and rests on the cistern.
  const hingeZ = 0.135,
    open = 1.72;
  lid.rotation.x = Math.PI / 2 - open;
  const r = 0.21;
  lid.position.set(0, 0.43 + Math.sin(open) * r, hingeZ + 0.01 - Math.cos(open) * r + 0.0);
  for (const sx of [-0.1, 0.1]) add(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 12).rotateZ(Math.PI / 2).translate(sx, 0.43, hingeZ), chrome);
  // Supply: flexible chrome pipe from the cistern's left side down to an angle valve on the wall.
  const wallZ = env.d / 2 - 0.07 - toilet.position.z - 0.014;
  roomTube(g, [[-0.17, 0.5, 0.27], [-0.2, 0.42, 0.3], [-0.215, 0.3, wallZ - 0.05], [-0.215, 0.26, wallZ - 0.03]], 0.006, chrome, 20);
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 14).rotateX(Math.PI / 2).translate(-0.215, 0.24, wallZ - 0.03), chrome);
  add(new THREE.BoxGeometry(0.04, 0.012, 0.012).translate(-0.215, 0.27, wallZ - 0.04), new THREE.MeshStandardMaterial({ color: "#b02c26", roughness: 0.4 }));
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 18).rotateX(Math.PI / 2).translate(-0.215, 0.24, wallZ - 0.002), chrome);
}
function fxApply() {
  if (!R.ready || !roomRoot || W.store || !roomRoot.userData.interior || roomRoot.userData.fixtures) return;
  roomRoot.userData.fixtures = true;
  try {
    fxWindow();
  } catch (error) {
    console.warn("fixtures: window", error);
  }
  for (const [name, fn] of [
    ["bathtub", fxBathtub],
    ["radiator", fxRadiator],
    ["electrics", fxElectrics],
    ["bath door", fxBathDoor],
    ["blanket", fxBlanket],
    ["sink", fxSink],
    ["toilet", fxToilet],
  ])
    try {
      fn();
    } catch (error) {
      console.warn("fixtures: " + name, error);
    }
  sceneDirty = true;
}
const fixturesPrevDecorate = roomDecorate;
roomDecorate = function () {
  fixturesPrevDecorate();
  fxApply();
};
if (R.ready) fxApply();
