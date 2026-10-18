/* Procedural first-person apartment. Three.js is embedded locally at build time. */
let scene,
  camera,
  renderer,
  roomRoot,
  cityRoot,
  animId,
  lastFrame = 0,
  lastRender = 0,
  lastTarget = 0,
  elapsedClock = 0,
  clockAccumulator = 0,
  sceneDirty = true;
let interactive = [],
  colliders = [],
  raycaster,
  targetObject = null,
  targetId = "",
  keys = {},
  lookYaw = 0,
  lookPitch = 0,
  dragging = false,
  lastX = 0,
  lastY = 0,
  pointerLocked = false;
let curtainMeshes = [],
  lampLights = [],
  windowGlow,
  skyLight,
  sunLight,
  ceilingLight,
  bagRoot,
  decorRoot,
  roomReady = false,
  fallbackMode = false;
let mobileStick = { active: false, x: 0, y: 0 },
  sceneScale = 1;
const sceneMats = {};
const material = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts });
function texture(type, seed) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d"),
    r = { rng: hashSeed(seed + type) };
  if (type === "floor") {
    x.fillStyle = "#705c46";
    x.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) {
      const y = row * 32;
      for (let col = -1; col < 3; col++) {
        const xx = col * 128 + (row % 2) * 64;
        x.fillStyle = `hsl(30,${22 + rngNext(r) * 10}%,${31 + rngNext(r) * 9}%)`;
        x.fillRect(xx, y, 127, 31);
        for (let k = 0; k < 18; k++) {
          x.strokeStyle = `rgba(32,20,11,${rngNext(r) * 0.17})`;
          x.lineWidth = 0.5;
          x.beginPath();
          x.moveTo(xx, y + rngNext(r) * 30);
          x.lineTo(xx + 128, y + rngNext(r) * 30);
          x.stroke();
        }
      }
    }
  } else if (type === "tile") {
    x.fillStyle = "#a9b8a7";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        x.fillStyle = (i + j) % 2 ? "#b7c0ae" : "#a9b5a1";
        x.fillRect(i * 64 + 2, j * 64 + 2, 61, 61);
      }
  } else if (type === "fabric") {
    x.fillStyle = "#84908c";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 3) {
      x.fillStyle = "#303f2810";
      x.fillRect(i, 0, 1, 256);
      x.fillRect(0, i, 256, 1);
    }
  } else if (type === "wood") {
    x.fillStyle = "#766048";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 130; i++) {
      x.strokeStyle = `rgba(31,20,12,${rngNext(r) * 0.14})`;
      x.beginPath();
      const y = rngNext(r) * 256;
      x.moveTo(0, y);
      x.bezierCurveTo(60, y + 5, 140, y - 4, 256, y + 2);
      x.stroke();
    }
  } else {
    x.fillStyle = ["#bfb9a9", "#b9b4a5", "#b4bbae"][env.wall] || "#bfb9a9";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 22000; i++) {
      const v = rngNext(r);
      x.fillStyle = v > 0.5 ? "#ffffff07" : "#342e2408";
      x.fillRect(rngNext(r) * 256, rngNext(r) * 256, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer
    ? Math.min(renderer.capabilities.getMaxAnisotropy(), 4)
    : 1;
  if (type === "floor") tex.repeat.set(3, 3);
  if (type === "wall") tex.repeat.set(3, 1.5);
  return tex;
}
function addBox(w, h, d, x, y, z, mat, parent = roomRoot, solid = false) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  if (solid) colliders.push(m);
  return m;
}
function cylinder(rt, rb, h, x, y, z, mat, parent = roomRoot) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function groupAt(x, y, z, parent = roomRoot) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function labelTexture(
  text,
  bg = "#d2c9ab",
  fg = "#373d30",
  width = 256,
  height = 128,
) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d");
  x.fillStyle = bg;
  x.fillRect(0, 0, width, height);
  x.fillStyle = fg;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `${Math.round(height * 0.38)}px serif`;
  x.fillText(text, width / 2, height / 2, width * 0.9);
  return new THREE.CanvasTexture(c);
}
function mark(g, id) {
  g.userData.interact = id;
  interactive.push(g);
  return g;
}
function buildRoom(e) {
  if (!scene) return;
  roomReady = false;
  if (roomRoot) {
    scene.remove(roomRoot);
    roomRoot.traverse((o) => {
      o.geometry?.dispose();
      if (o.material && o.material !== sceneMats.wall && o.material.dispose)
        o.material.dispose();
    });
  }
  if (cityRoot) scene.remove(cityRoot);
  interactive = [];
  colliders = [];
  curtainMeshes = [];
  lampLights = [];
  sceneDirty = true;
  roomRoot = new THREE.Group();
  roomRoot.userData.seed = e.seed;
  roomRoot.scale.x = e.mirror ? -1 : 1;
  scene.add(roomRoot);
  const w = e.w,
    d = e.d,
    back = -d / 2,
    front = d / 2;
  const wall = material("#fff", { map: texture("wall", e.seed) }),
    floor = material("#fff", {
      map: texture("floor", e.seed),
      roughness: 0.88,
    }),
    wood = material("#fff", { map: texture("wood", e.seed) }),
    darkwood = material("#493e30"),
    paint = material("#6d827c"),
    cream = material("#b9b49b"),
    metal = material("#454d46", { metalness: 0.45, roughness: 0.5 }),
    tile = material("#fff", { map: texture("tile", e.seed) }),
    fabric = material("#fff", { map: texture("fabric", e.seed) }),
    linen = material("#d0c6ad"),
    white = material("#d6d8c8", { roughness: 0.38 }),
    black = material("#242d27");
  Object.assign(sceneMats, {
    wall,
    floor,
    wood,
    darkwood,
    paint,
    cream,
    metal,
    tile,
    fabric,
    linen,
    white,
    black,
  });
  addBox(w + 0.2, 0.12, d + 0.2, 0, -0.06, 0, floor);
  addBox(w + 0.2, 0.1, d + 0.2, 0, 2.85, 0, material("#b4b09a"));
  addBox(0.14, 2.85, d, -w / 2, 1.425, 0, wall, roomRoot, true);
  addBox(0.14, 2.85, d, w / 2, 1.425, 0, wall, roomRoot, true);
  addBox(w, 2.85, 0.14, 0, 1.425, front, wall, roomRoot, true);
  // Real opening in the back wall: frame + city beyond, not a pasted screen.
  const winW = 2.65,
    winH = 1.45,
    winY = 1.72,
    sideW = (w - winW) / 2;
  addBox(
    sideW,
    2.85,
    0.14,
    -winW / 2 - sideW / 2,
    1.425,
    back,
    wall,
    roomRoot,
    true,
  );
  addBox(
    sideW,
    2.85,
    0.14,
    winW / 2 + sideW / 2,
    1.425,
    back,
    wall,
    roomRoot,
    true,
  );
  addBox(
    winW,
    winY - winH / 2,
    0.14,
    0,
    (winY - winH / 2) / 2,
    back,
    paint,
    roomRoot,
    true,
  );
  addBox(
    winW,
    2.85 - (winY + winH / 2),
    0.14,
    0,
    (2.85 + winY + winH / 2) / 2,
    back,
    wall,
    roomRoot,
    true,
  );
  for (const x of [-winW / 2, 0, winW / 2])
    addBox(0.055, winH + 0.12, 0.12, x, winY, back + 0.04, darkwood);
  for (const y of [winY - winH / 2, winY + winH / 2])
    addBox(winW + 0.1, 0.06, 0.18, 0, y, back + 0.04, darkwood);
  addBox(winW + 0.25, 0.07, 0.3, 0, winY - winH / 2 - 0.04, back + 0.1, wood);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshBasicMaterial({
      color: "#bbcabf",
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.set(0, winY, back - 0.025);
  roomRoot.add(glass);
  mark(glass, "window");
  const curtains = groupAt(0, 0, 0);
  for (const side of [-1, 1]) {
    const g = groupAt(side * (winW / 2 + 0.1), 0, back + 0.2, curtains);
    for (let i = 0; i < 8; i++) {
      const m = addBox(
        0.09,
        1.72,
        0.1,
        (i - 3.5) * 0.07,
        1.65,
        Math.sin(i) * 0.025,
        material("#a09275"),
        g,
      );
      curtainMeshes.push({ mesh: m, side, offset: (i - 3.5) * 0.07 });
    }
    mark(g, "window");
  }
  addBox(winW + 0.7, 0.04, 0.06, 0, 2.58, back + 0.22, metal);
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08])
    addBox(0.08, 0.13, d, x, 0.09, 0, darkwood);
  for (const z of [back + 0.08, front - 0.08])
    addBox(w, 0.13, 0.08, 0, 0.09, z, darkwood);
  // Bed, worn mattress, folded blanket and pillow.
  const bed = mark(groupAt(-w / 2 + 0.9, 0, -0.25), "bed");
  addBox(1.38, 0.24, 2.22, 0, 0.25, 0, darkwood, bed, true);
  addBox(1.35, 0.15, 2.15, 0, 0.45, 0, linen, bed);
  addBox(1.36, 0.07, 1.42, 0, 0.56, 0.29, fabric, bed);
  addBox(1.4, 0.7, 0.09, 0, 0.52, -1.12, wood, bed);
  addBox(
    0.85,
    0.14,
    0.39,
    0,
    0.6,
    -0.75,
    material(e.bed === 1 ? "#b5ac90" : "#c5c7ae"),
    bed,
  );
  for (const x of [-0.58, 0.58])
    for (const z of [-0.95, 0.95])
      addBox(0.07, 0.23, 0.07, x, 0.12, z, wood, bed);
  // A bedside cabinet; the bundle of letters from home sits on it.
  const bedside = mark(groupAt(-w / 2 + 0.5, 0, -1.85), "inspect");
  addBox(0.64, 0.54, 0.48, 0, 0.27, 0, wood, bedside, true);
  addBox(0.58, 0.02, 0.01, 0, 0.33, 0.25, darkwood, bedside);
  cylinder(0.025, 0.025, 0.015, 0, 0.33, 0.267, metal, bedside).rotation.x =
    Math.PI / 2;
  // Desk under the window, letter, lamp, radio, calendar.
  const desk = mark(groupAt(-0.28, 0, back + 0.66), "desk");
  addBox(1.6, 0.08, 0.7, 0, 0.78, 0, wood, desk, true);
  for (const x of [-0.67, 0.67])
    for (const z of [-0.25, 0.25])
      addBox(0.055, 0.74, 0.055, x, 0.37, z, darkwood, desk);
  const paper = addBox(
    0.42,
    0.006,
    0.29,
    -0.27,
    0.828,
    0.05,
    material("#d2cab0"),
    desk,
  );
  paper.rotation.y = 0.12;
  addBox(0.33, 0.035, 0.24, 0.15, 0.845, -0.08, material("#655d47"), desk);
  addBox(0.3, 0.012, 0.21, 0.15, 0.869, -0.08, material("#bdba9d"), desk);
  const book = addBox(
    0.24,
    0.04,
    0.3,
    -0.5,
    0.84,
    -0.13,
    material("#5b6a59"),
    desk,
  );
  book.rotation.y = -0.16;
  const lamp = groupAt(0.56, 0.83, -0.18, desk);
  cylinder(0.11, 0.13, 0.03, 0, 0.015, 0, metal, lamp);
  addBox(0.025, 0.34, 0.025, 0, 0.19, 0, metal, lamp);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.16, 24, 1, true),
    material("#878464", { side: THREE.DoubleSide }),
  );
  shade.position.set(0, 0.38, 0);
  lamp.add(shade);
  const lampPoint = new THREE.PointLight("#ffd493", 2.7, 4, 1.5);
  lampPoint.position.set(0.55, 1.15, back + 0.52);
  roomRoot.add(lampPoint);
  lampLights.push(lampPoint);
  // Small radio on a separate sideboard.
  const radio = mark(groupAt(-1.42, 0, back + 0.57), "radio");
  addBox(0.62, 0.82, 0.46, 0, 0.41, 0, wood, radio, true);
  addBox(0.3, 0.02, 0.025, 0, 0.61, 0.24, metal, radio);
  addBox(0.49, 0.27, 0.2, 0, 0.96, 0, darkwood, radio);
  addBox(0.22, 0.18, 0.012, -0.08, 0.96, 0.107, metal, radio);
  for (let i = 0; i < 6; i++)
    addBox(0.17, 0.004, 0.015, -0.08, 0.9 + i * 0.023, 0.12, black, radio);
  cylinder(0.032, 0.032, 0.015, 0.145, 0.96, 0.118, cream, radio).rotation.x =
    Math.PI / 2;
  addBox(0.005, 0.4, 0.005, 0.17, 1.28, -0.04, metal, radio);
  // Wall calendar and faded abstract print.
  const calendar = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.52),
    new THREE.MeshStandardMaterial({
      map: labelTexture("1986", "#d0c5a7", "#424c37", 256, 300),
      roughness: 1,
    }),
  );
  calendar.position.set(-w / 2 + 0.091, 1.75, 1.3);
  calendar.rotation.y = Math.PI / 2;
  roomRoot.add(calendar);
  mark(calendar, "journal");
  const painting = addBox(
    0.055,
    0.62,
    0.92,
    -w / 2 + 0.09,
    1.8,
    -0.45,
    darkwood,
  );
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.52),
    material("#9c9e7f"),
  );
  art.rotation.y = Math.PI / 2;
  art.position.set(-w / 2 + 0.124, 1.8, -0.45);
  roomRoot.add(art);
  // Kitchen on right back wall.
  const kitchen = mark(groupAt(w / 2 - 1.07, 0, back + 0.55), "kitchen");
  addBox(1.95, 0.77, 0.75, 0, 0.385, 0, paint, kitchen, true);
  addBox(2.04, 0.075, 0.81, 0, 0.82, 0, cream, kitchen);
  for (const x of [-0.67, 0, 0.67]) {
    addBox(0.6, 0.64, 0.027, x, 0.4, 0.39, paint, kitchen);
    addBox(0.19, 0.025, 0.035, x, 0.6, 0.42, metal, kitchen);
  }
  const sink = mark(groupAt(w / 2 - 1.59, 0.865, back + 0.57), "sink");
  addBox(0.55, 0.025, 0.4, 0, 0, 0, metal, sink);
  addBox(0.44, 0.028, 0.29, 0, 0.016, 0, material("#596960"), sink);
  cylinder(0.018, 0.018, 0.26, 0, 0.14, -0.2, metal, sink);
  addBox(0.02, 0.02, 0.16, 0, 0.27, -0.13, metal, sink);
  const stove = mark(groupAt(w / 2 - 0.55, 0.87, back + 0.56), "stove");
  addBox(0.53, 0.04, 0.52, 0, 0, 0, white, stove);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.016, 8, 32),
    metal,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.032;
  stove.add(ring);
  const pot = cylinder(
    0.125,
    0.12,
    0.16,
    0,
    0.12,
    0,
    material("#8d9990", { metalness: 0.65, roughness: 0.3 }),
    stove,
  );
  cylinder(0.135, 0.135, 0.02, 0, 0.215, 0, metal, stove);
  addBox(0.05, 0.02, 0.025, 0, 0.235, 0, black, stove);
  for (const x of [-0.8, 0]) {
    const cabinet = groupAt(w / 2 - 1.1 + x, 1.9, back + 0.23);
    addBox(0.7, 0.65, 0.42, 0, 0, 0, paint, cabinet);
    addBox(0.02, 0.18, 0.025, 0.25, 0, 0.23, metal, cabinet);
  }
  // Copper pipe, towel rail, modest geometric kitchen details.
  addBox(
    0.028,
    1.2,
    0.028,
    w / 2 - 0.1,
    1.3,
    back + 0.47,
    material("#8b795a", { metalness: 0.5 }),
  );
  addBox(0.35, 0.015, 0.04, w / 2 - 0.55, 1.31, back + 0.11, metal);
  if (e.fridge) {
    // Side against the right wall, door facing into the room (the v0.6 fridge faced the counter).
    const fridge = mark(groupAt(w / 2 - 0.41, 0, -0.72), "fridge");
    fridge.rotation.y = -Math.PI / 2;
    addBox(0.62, 1.5, 0.64, 0, 0.75, 0, material("#b9bda8"), fridge, true);
    addBox(0.76, 0.39, 0.055, 0, 1.33, 0.38, cream, fridge);
    addBox(0.76, 1.02, 0.055, 0, 0.61, 0.38, cream, fridge);
    addBox(0.025, 0.24, 0.055, -0.28, 1.24, 0.43, metal, fridge);
    addBox(0.025, 0.28, 0.055, -0.28, 0.91, 0.43, metal, fridge);
  }
  // Sofa, side table, carpet.
  const sofa = mark(groupAt(-w / 2 + 0.6, 0, front - 1.14), "sofa");
  addBox(0.88, 0.28, 1.7, 0, 0.34, 0, darkwood, sofa, true);
  addBox(0.82, 0.18, 1.43, 0.03, 0.53, 0, material("#728780"), sofa);
  addBox(0.22, 0.66, 1.67, -0.39, 0.59, 0, fabric, sofa);
  for (const z of [-0.77, 0.77])
    addBox(0.87, 0.47, 0.14, 0, 0.55, z, fabric, sofa);
  const rug = addBox(1.9, 0.012, 1.25, -0.8, 0.009, 0.65, material("#8f7965"));
  rug.rotation.y = 0.08;
  const table = mark(groupAt(-0.6, 0, 0.8), "table");
  addBox(1.08, 0.06, 0.62, 0, 0.46, 0, wood, table, true);
  for (const x of [-0.4, 0.4])
    for (const z of [-0.22, 0.22])
      addBox(0.045, 0.44, 0.045, x, 0.22, z, darkwood, table);
  cylinder(0.07, 0.065, 0.1, 0.18, 0.54, 0.02, white, table);
  const saucer = cylinder(0.11, 0.11, 0.015, 0.18, 0.48, 0.02, cream, table);
  addBox(0.2, 0.008, 0.28, -0.28, 0.5, -0.03, material("#b2a789"), table);
  // Entry door and hooks, peephole, apartment number.
  const door = mark(groupAt(-0.35, 0, front - 0.09), "door");
  addBox(0.94, 2.16, 0.08, 0, 1.08, 0, material("#514b39"), door);
  for (const x of [-0.52, 0.52])
    addBox(0.065, 2.24, 0.11, x, 1.12, 0, darkwood, door);
  addBox(1.1, 0.07, 0.11, 0, 2.24, 0, darkwood, door);
  cylinder(0.025, 0.025, 0.015, 0, 1.61, -0.05, metal, door).rotation.x =
    Math.PI / 2;
  addBox(0.17, 0.03, 0.04, 0.28, 1, -0.06, metal, door);
  addBox(
    0.24,
    0.11,
    0.012,
    0,
    1.85,
    -0.06,
    new THREE.MeshStandardMaterial({
      map: labelTexture(String(e.number), "#9d916f", "#332f22"),
      roughness: 0.5,
    }),
    door,
  );
  const wardrobe = mark(groupAt(-w / 2 + 1.65, 0, front - 0.37), "wardrobe");
  addBox(0.7, 1.72, 0.55, 0, 0.86, 0, wood, wardrobe, true);
  addBox(0.025, 0.2, 0.04, 0.25, 0.9, -0.29, metal, wardrobe);
  // Bathroom partition with a genuine door opening, shower and toilet.
  const bx = w / 2 - 2.05,
    bz = front - 2.05;
  addBox(0.1, 2.65, 2.05, bx, 1.325, front - 1.025, wall, roomRoot, true);
  addBox(0.38, 2.65, 0.1, bx + 0.19, 1.325, bz, wall, roomRoot, true);
  addBox(0.62, 2.65, 0.1, w / 2 - 0.31, 1.325, bz, wall, roomRoot, true);
  addBox(1.08, 0.53, 0.1, bx + 0.92, 2.385, bz, wall, roomRoot, true);
  addBox(1.98, 0.014, 1.96, w / 2 - 1.0, 0.011, front - 1, tile);
  addBox(0.025, 1.15, 1.99, w / 2 - 0.08, 0.59, front - 1, tile);
  const toilet = mark(groupAt(w / 2 - 0.49, 0, front - 0.55), "toilet");
  addBox(0.44, 0.6, 0.23, 0, 0.47, 0.25, white, toilet);
  const bowl = cylinder(0.23, 0.14, 0.36, 0, 0.25, -0.02, white, toilet);
  bowl.scale.z = 1.2;
  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.205, 0.035, 10, 28),
    white,
  );
  seat.rotation.x = Math.PI / 2;
  seat.scale.y = 1.22;
  seat.position.set(0, 0.45, -0.04);
  toilet.add(seat);
  addBox(0.04, 0.02, 0.06, 0.15, 0.79, 0.22, metal, toilet);
  const shower = mark(groupAt(bx + 0.62, 0, front - 0.62), "shower");
  addBox(0.86, 0.06, 0.83, 0, 0.045, 0, white, shower);
  addBox(0.03, 1.8, 0.03, -0.28, 0.97, 0.32, metal, shower);
  const head = cylinder(0.1, 0.1, 0.025, -0.18, 1.91, 0.2, metal, shower);
  head.rotation.z = 0.25;
  addBox(0.22, 0.025, 0.03, -0.19, 1.85, 0.32, metal, shower);
  const divider = new THREE.Mesh(
    new THREE.PlaneGeometry(0.83, 1.8),
    new THREE.MeshStandardMaterial({
      color: "#a3b7b0",
      transparent: true,
      opacity: 0.25,
      roughness: 0.15,
      side: THREE.DoubleSide,
    }),
  );
  divider.position.set(0.43, 1, 0.0);
  divider.rotation.y = Math.PI / 2;
  shower.add(divider);
  const bathMirror = mark(groupAt(w / 2 - 0.4, 1.6, bz + 0.16), "mirror");
  addBox(0.53, 0.57, 0.045, 0, 0, 0, metal, bathMirror);
  addBox(
    0.46,
    0.5,
    0.05,
    0,
    0,
    -0.01,
    material("#a9b5ac", { metalness: 0.78, roughness: 0.22 }),
    bathMirror,
  );
  const trash = mark(groupAt(bx - 0.35, 0, front - 0.42), "trash");
  cylinder(0.17, 0.13, 0.38, 0, 0.19, 0, material("#6e7666"), trash);
  // Ceiling pendant.
  addBox(0.012, 0.55, 0.012, 0, 2.58, 0.05, black);
  const pendant = new THREE.Mesh(
    new THREE.ConeGeometry(0.27, 0.16, 24, 1, true),
    material("#64705c", { side: THREE.DoubleSide }),
  );
  pendant.position.set(0, 2.24, 0.05);
  roomRoot.add(pendant);
  ceilingLight = new THREE.PointLight("#ffe0a9", 5, 8, 1.6);
  ceilingLight.position.set(0, 2.12, 0.05);
  ceilingLight.castShadow = true;
  ceilingLight.shadow.mapSize.set(512, 512);
  ceilingLight.shadow.bias = -0.001;
  roomRoot.add(ceilingLight);
  bagRoot = mark(groupAt(0.55, 0, front - 1.05), "bags");
  decorRoot = groupAt(0, 0, 0);
  buildCity(e);
  roomRoot.updateMatrixWorld(true);
  roomReady = true;
  syncRoom();
  // Store world-space collision rectangles after mirroring.
  colliders = colliders.map((m) => {
    const box = new THREE.Box3().setFromObject(m);
    return {
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
      minY: box.min.y,
      maxY: box.max.y,
    };
  });
  if (phase === "title" || phase === "shop") setCinematic();
  if (typeof installWorldRoom === "function") installWorldRoom();
}
function buildCity(e) {
  cityRoot = new THREE.Group();
  scene.add(cityRoot);
  const r = { rng: hashSeed(e.seed + "city") },
    windows = [];
  for (let i = 0; i < 24; i++) {
    const x = (rngNext(r) - 0.5) * 42,
      z = -8 - rngNext(r) * 27,
      h = 3 + rngNext(r) * 17,
      w = 1.5 + rngNext(r) * 3;
    const c = material(
      new THREE.Color().setHSL(0.16, 0.035, 0.22 + rngNext(r) * 0.12),
    );
    const building = addBox(w, h, 2, x, h / 2 - 5, z, c, cityRoot);
    building.castShadow = false;
    for (let row = 0; row < Math.min(14, Math.floor(h / 1.2)); row++)
      for (let col = 0; col < Math.floor(w / 0.65); col++)
        windows.push({
          x: x - w * 0.34 + col * 0.64,
          y: row * 1.12 - 4,
          z: z + 1.015,
          lit: rngNext(r) > 0.55,
        });
    if (i % 4 === 0) {
      const ant = addBox(
        0.035,
        1.3,
        0.035,
        x,
        h - 4.5,
        z,
        material("#39463f"),
        cityRoot,
      );
      ant.castShadow = false;
    }
  }
  // Hundreds of distant windows in one draw call, rather than one mesh per window.
  const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.23, 0.4, 0.015),
      new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      windows.length,
    ),
    matrix = new THREE.Matrix4();
  windows.forEach((v, i) => {
    matrix.makeTranslation(v.x, v.y, v.z);
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, new THREE.Color(v.lit ? "#aaa68b" : "#4b5950"));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  cityRoot.add(mesh);
  const ground = addBox(
    200,
    0.2,
    200,
    0,
    -7,
    -30,
    material("#5d695b"),
    cityRoot,
  );
  ground.castShadow = false;
}
function clearGroup(g) {
  if (!g) return;
  while (g.children.length) {
    const o = g.children[0];
    g.remove(o);
    o.traverse((m) => {
      m.geometry?.dispose();
      if (m.material?.dispose) m.material.dispose();
    });
  }
}
function syncRoom() {
  if (!roomReady || (!G && phase !== "title" && phase !== "shop")) return;
  sceneDirty = true;
  if (renderer) renderer.shadowMap.needsUpdate = true;
  const state = G && phase !== "title" ? G : null;
  const closed = state ? state.curtains : false;
  curtainMeshes.forEach(({ mesh, side, offset }) => {
    mesh.scale.x = closed ? 2.5 : 1;
    mesh.position.x = offset * (closed ? 2.5 : 1) - side * (closed ? 0.54 : 0);
  });
  const powered = state ? state.power : true;
  const night = state ? hour() < 6 || hour() > 18 : false;
  const daylight = night ? 0.15 : 1;
  skyLight.intensity = 0.5 + daylight * 0.55;
  sunLight.intensity = night ? 0.03 : 1.6;
  sunLight.color.set(night ? "#82969c" : "#efd7ad");
  scene.background = new THREE.Color(night ? "#252f30" : "#929b8b");
  scene.fog.color.copy(scene.background);
  ceilingLight.intensity = powered ? (night ? 5 : 2) : 0;
  lampLights.forEach(
    (l) =>
      (l.intensity = powered
        ? 3
        : state && state.candleUntil > state.minute
          ? 1.3
          : 0),
  );
  clearGroup(bagRoot);
  const unopened = state
    ? bagsAtDoor()
    : [{ id: 0 }, { id: 1 }, { id: 2 }];
  for (let i = 0; i < Math.min(typeof interiorBag === "function" ? 18 : 7, unopened.length); i++) {
    if (typeof interiorBag === "function" && typeof R !== "undefined" && R.ready) {
      interiorBag(bagRoot, unopened[i], i, state);
      continue;
    }
    const b = groupAt(
      (i % 3) * 0.27 - 0.25,
      0,
      Math.floor(i / 3) * 0.26,
      bagRoot,
    );
    const mat = material(i % 2 ? "#c3bda2" : "#aab69b", { roughness: 0.65 });
    const body = addBox(0.24, 0.31, 0.2, 0, 0.18, 0, mat, b);
    body.rotation.z = i % 2 ? 0.05 : -0.03;
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.012, 6, 18, Math.PI),
      mat,
    );
    handle.position.set(0, 0.36, 0);
    b.add(handle);
  }
  clearGroup(decorRoot);
  if (state) {
    if (has("plant")) {
      const g = groupAt(0.5, 0.83, -env.d / 2 + 0.55, decorRoot);
      cylinder(0.1, 0.07, 0.16, 0, 0.08, 0, material("#aa7b54"), g);
      for (let i = 0; i < 5; i++) {
        const leaf = addBox(
          0.11,
          0.025,
          0.25,
          Math.sin(i) * 0.07,
          0.28 + Math.sin(i) * 0.03,
          Math.cos(i) * 0.07,
          material("#6d865a"),
          g,
        );
        leaf.rotation.z = i * 0.7;
        leaf.rotation.y = i * 1.5;
      }
    }
    if (has("heater")) {
      const g = groupAt(-env.w / 2 + 0.3, 0, env.d / 2 - 2.1, decorRoot);
      addBox(0.15, 0.54, 0.48, 0, 0.29, 0, material("#a7ac98"), g);
      for (let i = 0; i < 6; i++)
        addBox(
          0.17,
          0.38,
          0.022,
          0,
          0.3,
          -0.2 + i * 0.08,
          material("#626e5c"),
          g,
        );
    }
    if (has("fan")) {
      const g = groupAt(env.w / 2 - 0.45, 0.83, -env.d / 2 + 1.2, decorRoot);
      cylinder(0.13, 0.15, 0.03, 0, 0, 0, material("#84927a"), g);
      addBox(0.03, 0.23, 0.03, 0, 0.13, 0, material("#63765b"), g);
      const cage = new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.009, 6, 32),
        material("#8c9b80"),
      );
      cage.position.y = 0.39;
      g.add(cage);
      for (let i = 0; i < 3; i++) {
        const blade = addBox(
          0.1,
          0.025,
          0.01,
          Math.cos(i * 2.094) * 0.09,
          0.39 + Math.sin(i * 2.094) * 0.09,
          0,
          material("#9daa8b"),
          g,
        );
        blade.rotation.z = i * 2.094;
      }
    }
    if (has("shelf") && !(typeof W !== "undefined" && W.enabled)) {
      const g = groupAt(env.w / 2 - 0.25, 0, 0.55, decorRoot);
      for (const y of [0.15, 0.55, 0.95, 1.35])
        addBox(0.4, 0.04, 0.8, 0, y, 0, sceneMats.wood, g);
      for (const z of [-0.37, 0.37])
        addBox(0.04, 1.5, 0.04, 0, 0.75, z, sceneMats.darkwood, g);
    }
    if (state.dirt > 30) {
      for (let i = 0; i < Math.min(12, Math.floor(state.dirt / 6)); i++) {
        const m = addBox(
          0.08,
          0.01,
          0.06,
          Math.sin(i * 17) * 1.2,
          0.03,
          Math.cos(i * 13) * 1.3,
          material(i % 2 ? "#b4a87e" : "#999d7e"),
          decorRoot,
        );
        m.rotation.y = i;
      }
    }
    const tableFood = (typeof W !== "undefined" && W.enabled ? [] : state.inv)
      .filter((b) => !b.packed && b.location === "table" && b.units > 0)
      .slice(0, 4);
    tableFood.forEach((b, i) => {
      const g = groupAt(-0.9 + i * 0.21, 0.51, 0.8, decorRoot);
      addBox(0.13, 0.18, 0.09, 0, 0.09, 0, material("#a29168"), g);
    });
  }
  if (typeof syncWorldRoom === "function") syncWorldRoom();
}
function setCinematic() {
  if (!camera) return;
  sceneDirty = true;
  const mirror = env.mirror ? -1 : 1;
  camera.position.set(0.5 * mirror, 1.68, env.d / 2 - 1.7);
  camera.lookAt(-0.55 * mirror, 1.13, -env.d / 2 + 0.7);
}
function setFirstPerson(pos) {
  if (!camera) return;
  sceneDirty = true;
  if (
    pos &&
    Array.isArray(pos) &&
    pos.length === 5 &&
    pos.every(Number.isFinite)
  ) {
    camera.position.set(
      clamp(pos[0], -env.w / 2 + 0.4, env.w / 2 - 0.4),
      1.62,
      clamp(pos[2], -env.d / 2 + 0.4, env.d / 2 - 0.4),
    );
    lookYaw = pos[3];
    lookPitch = clamp(pos[4], -1.2, 1.2);
  } else {
    camera.position.set(0, 1.62, env.d / 2 - 1.6);
    lookYaw = 0;
    lookPitch = -0.06;
  }
  camera.rotation.order = "YXZ";
  camera.rotation.set(lookPitch, lookYaw, 0);
}
function getPlayerPosition() {
  return camera
    ? [camera.position.x, 1.62, camera.position.z, lookYaw, lookPitch]
    : null;
}
function canMove(x, z) {
  const bw =
    typeof worldBounds === "function" ? worldBounds() : { w: env.w, d: env.d };
  if (
    x < -bw.w / 2 + 0.22 ||
    x > bw.w / 2 - 0.22 ||
    z < -bw.d / 2 + 0.22 ||
    z > bw.d / 2 - 0.22
  )
    return false;
  const rad = 0.19;
  return !colliders.some(
    (c) =>
      c.maxY > 0.25 &&
      c.minY < 1.6 &&
      x > c.minX - rad &&
      x < c.maxX + rad &&
      z > c.minZ - rad &&
      z < c.maxZ + rad,
  );
}
function freeMovement(dt) {
  // Head movement remains responsive while hands are busy. Only walking is locked.
  if (
    typeof worldIsBusy === "function" &&
    worldIsBusy() &&
    !paused &&
    !panelType
  ) {
    camera.rotation.set(lookPitch, lookYaw, 0);
    camera.position.y = worldEyeHeight();
    return;
  }
  if (
    !(
      phase === "playing" ||
      (typeof worldIsShopping === "function" && worldIsShopping())
    ) ||
    (typeof worldIsBusy === "function" && worldIsBusy()) ||
    paused ||
    panelType ||
    $("#qteLayer").classList.contains("visible")
  )
    return;
  let forward =
    (keys.KeyW || keys.ArrowUp ? 1 : 0) -
    (keys.KeyS || keys.ArrowDown ? 1 : 0) -
    mobileStick.y;
  let side = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + mobileStick.x;
  if (keys.ArrowLeft) lookYaw += dt * 1.3;
  if (keys.ArrowRight) lookYaw -= dt * 1.3;
  const len = Math.hypot(forward, side);
  if (len > 0) {
    forward /= Math.max(1, len);
    side /= Math.max(1, len);
    const speed = keys.ShiftLeft ? 1.8 : 1.35;
    const dx =
        (-Math.sin(lookYaw) * forward + Math.cos(lookYaw) * side) * dt * speed,
      dz =
        (-Math.cos(lookYaw) * forward - Math.sin(lookYaw) * side) * dt * speed;
    if (canMove(camera.position.x + dx, camera.position.z))
      camera.position.x += dx;
    if (canMove(camera.position.x, camera.position.z + dz))
      camera.position.z += dz;
  }
  camera.rotation.set(lookPitch, lookYaw, 0);
  camera.position.y =
    (typeof worldEyeHeight === "function" ? worldEyeHeight() : 1.62) +
    (len > 0 ? Math.sin(performance.now() * 0.008) * 0.006 : 0);
}
function updateTarget() {
  if (!renderer || phase !== "playing" || panelType || paused) {
    targetId = "";
    $("#interaction").classList.remove("active");
    return;
  }
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(roomRoot.children, true);
  let chosen = null;
  for (const hit of hits) {
    if (hit.distance > 2.8) break;
    let o = hit.object;
    while (o && o !== roomRoot && !o.userData.interact) o = o.parent;
    if (o?.userData.interact) {
      chosen = o;
      break;
    }
    if (hit.object.material?.transparent && hit.object.material.opacity < 0.4)
      continue;
    if (hit.distance < 2.8) break;
  }
  targetObject = chosen;
  targetId = chosen?.userData.interact || "";
  const names = {
    bed: ["旧床", "休息 · 调整睡眠"],
    kitchen: ["料理台", "做饭 · 清洁餐具"],
    sink: ["水槽", "饮水 · 储水"],
    stove: ["单眼电炉", "准备一顿饭"],
    fridge: ["旧冰箱", "查看冷藏物资"],
    desk: ["书桌", "读书 · 写日记"],
    radio: ["旧收音机", "收听 · 打发时间"],
    sofa: ["旧沙发", "休息 · 安静活动"],
    door: ["入户门", "保持安静 · 观察楼道"],
    window: ["公寓窗户", "窗帘 · 观察天气"],
    wardrobe: ["衣柜", "换衣 · 个人护理"],
    mirror: ["浴室镜子", "剪发 · 剪指甲"],
    toilet: ["卫生间", "小便 · 大便"],
    shower: ["淋浴区", "洗澡 · 洗衣"],
    trash: ["垃圾桶", "包装 · 餐厨残渣 · 清理"],
    bags: ["采购物资", "拆袋 · 整理"],
    inspect: ["床头柜", "家里的信"],
    journal: ["旧日历", "查看生存手记"],
    table: ["小餐桌", "背包 · 用餐"],
  };
  if (targetId) {
    const n = names[targetId] || ["物品", "查看"];
    $("#interaction").innerHTML =
      `<span class="keycap">E</span><div><strong>${n[0]}</strong><small>${n[1]}</small></div>`;
    $("#interaction").classList.add("active");
  } else $("#interaction").classList.remove("active");
}
function doInteract() {
  if (phase !== "playing" || panelType || paused) return;
  if (targetId) openStation(targetId);
  else notify("走近家具，把准星对准它，再按 E。也可用底部「房间」面板。");
}
function lookBy(dx, dy) {
  lookYaw -= dx * 0.003;
  lookPitch = clamp(lookPitch - dy * 0.0025, -1.25, 1.25);
}
function initScene() {
  const canvas = $("#world");
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#929b8b");
    scene.fog = new THREE.Fog("#929b8b", 10, 40);
    camera = new THREE.PerspectiveCamera(
      65,
      innerWidth / innerHeight,
      0.05,
      70,
    );
    camera.rotation.order = "YXZ";
    raycaster = new THREE.Raycaster();
    skyLight = new THREE.HemisphereLight("#e3e2c8", "#67624f", 1.1);
    scene.add(skyLight);
    sunLight = new THREE.DirectionalLight("#efd8b1", 1.6);
    sunLight.position.set(-3, 5, -8);
    sunLight.target.position.set(0, 0.4, 1);
    scene.add(sunLight, sunLight.target);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    sunLight.shadow.normalBias = 0.04;
    buildRoom(env);
    setCinematic();
    canvas.addEventListener("pointerdown", (e) => {
      if (
        e.target !== canvas ||
        e.button !== 0 ||
        !(
          phase === "playing" ||
          (typeof worldIsShopping === "function" && worldIsShopping())
        ) ||
        panelType ||
        paused
      )
        return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (pointerLocked) {
        lookBy(e.movementX, e.movementY);
      } else if (dragging) {
        lookBy(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
    canvas.addEventListener("pointerup", () => (dragging = false));
    canvas.addEventListener("pointercancel", () => (dragging = false));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("pointerlockchange", () => {
      pointerLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener("pointerlockerror", () =>
      notify("此预览不允许锁定鼠标，仍可按住画面拖动视角。"),
    );
    window.addEventListener("resize", () => {
      sceneDirty = true;
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });
  } catch (err) {
    console.warn("WebGL unavailable:", err.message);
    fallbackMode = true;
    $("#fallback").hidden = false;
    $("#world").hidden = true;
  }
  lastFrame = performance.now();
  animId = requestAnimationFrame(frameLoop);
}
function frameLoop(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (renderer) {
    freeMovement(dt);
    if (typeof worldFrame === "function") worldFrame(now, dt);
    if (now - lastTarget > 90) {
      updateTarget();
      lastTarget = now;
    }
    const activeView =
      (phase === "playing" ||
        (typeof worldIsShopping === "function" && worldIsShopping())) &&
      !panelType &&
      !paused &&
      !qte.active;
    if (sceneDirty || (activeView && now - lastRender > 33)) {
      renderer.render(scene, camera);
      lastRender = now;
      sceneDirty = false;
    }
  }
  if (
    phase === "playing" &&
    !(typeof worldIsBusy === "function" && worldIsBusy()) &&
    !paused &&
    !panelType &&
    !$("#qteLayer").classList.contains("visible") &&
    G &&
    !G.ended
  ) {
    clockAccumulator += dt;
    if (clockAccumulator > 1) {
      const whole = Math.floor(clockAccumulator);
      clockAccumulator -= whole;
      simulate(whole, "idle");
      renderHUD();
      if (Math.floor(G.minute) % 10 === 0) {
        syncRoom();
        saveGame(false);
      }
    }
  }
  animId = requestAnimationFrame(frameLoop);
}
function releasePointer() {
  if (document.pointerLockElement) document.exitPointerLock?.();
  keys = {};
  dragging = false;
  mobileStick = { active: false, x: 0, y: 0 };
}
function requestPointer() {
  if (!renderer) return;
  try {
    const result = $("#world").requestPointerLock?.();
    if (result?.catch)
      result.catch(() => notify("锁定不可用：按住画面拖动视角即可。"));
  } catch {
    notify("锁定不可用：按住画面拖动视角即可。");
  }
}
