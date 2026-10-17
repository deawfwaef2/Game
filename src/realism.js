/* Offline realistic-room vertical slice. Imported furniture/skin rigs are real geometry,
   not screenshots. Survival, stock, raycasts, doors and saves remain production code. */
const R = {
  ready: false,
  error: "",
  models: {},
  textures: {},
  hands: [],
  grip: null,
  gripBase: null,
  grab: null,
  environment: null,
  status: "载入房间资源",
  sample: false,
};
function roomBytes(base64) {
  const text = atob(base64),
    bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes.buffer;
}
function roomCopy(name) {
  const src = R.models[name];
  if (!src) return new THREE.Group();
  const g = name.startsWith("hand-")
    ? ROOM_TOOLS.cloneSkeleton(src)
    : src.clone(true);
  g.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry = o.geometry.clone();
    o.material = Array.isArray(o.material)
      ? o.material.map((m) => m.clone())
      : o.material.clone();
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = !o.isSkinnedMesh;
    if (o.material.envMapIntensity !== undefined)
      o.material.envMapIntensity = 0.5;
  });
  return g;
}
function roomFit(name, size, turn = 0) {
  const g = new THREE.Group(),
    inner = roomCopy(name);
  inner.rotation.y += turn;
  inner.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(inner),
    d = bounds.getSize(new THREE.Vector3()),
    c = bounds.getCenter(new THREE.Vector3());
  inner.position.sub(new THREE.Vector3(c.x, bounds.min.y, c.z));
  g.add(inner);
  g.scale.set(size[0] / d.x, size[1] / d.y, size[2] / d.z);
  g.userData.asset = name;
  return g;
}
function roomProxy(parent, size, center = [0, size[1] / 2, 0]) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshBasicMaterial({
      transparent: false,
      opacity: 1,
      depthWrite: false,
      colorWrite: false,
    }),
  );
  m.position.fromArray(center);
  m.userData.interactionProxy = true;
  parent.add(m);
  return m;
}
function roomRound(parent, size, point, mat, radius = 0.009) {
  const g = new ROOM_TOOLS.RoundedBoxGeometry(
    ...size,
    3,
    Math.min(radius, Math.min(...size) * 0.22),
  );
  const m = new THREE.Mesh(g, mat);
  m.position.fromArray(point);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function roomPBR(mat, prefix, repeat = [1, 1], color = "#ffffff") {
  if (!mat) return;
  mat.color.set(color);
  for (const [key, suffix] of [
    ["map", "diff"],
    ["normalMap", "nor_gl"],
    ["roughnessMap", "arm"],
    ["metalnessMap", "arm"],
  ]) {
    const src = R.textures[prefix + "_" + suffix];
    if (!src) continue;
    const t = src.clone();
    t.repeat.set(...repeat);
    t.needsUpdate = true;
    mat[key] = t;
  }
  mat.roughness = 0.9;
  mat.metalness = 0;
  mat.normalScale?.set(0.32, 0.32);
  mat.envMapIntensity = 0.3;
  mat.needsUpdate = true;
}
function roomTube(parent, points, radius, mat, count = 28) {
  const path = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(path, count, radius, 9, false),
    mat,
  );
  parent.add(mesh);
  mesh.castShadow = true;
  return mesh;
}
function roomDecorate() {
  if (
    !R.ready ||
    !W.enabled ||
    !roomRoot ||
    W.store ||
    roomRoot.userData.realism
  )
    return;
  roomRoot.userData.realism = true;
  const mats = sceneMats,
    w = env.w,
    d = env.d,
    back = -d / 2,
    front = d / 2;
  roomPBR(mats.floor, "old_wood_floor", [w / 3.2, d / 3.2]);
  roomPBR(mats.wall, "painted_plaster_wall", [2.7, 1.2], "#eee9dc");
  roomPBR(mats.wood, "old_wood_floor", [0.65, 0.65], "#b59c7b");
  mats.darkwood.color.set("#4c3c2d");
  mats.darkwood.roughness = 0.72;
  mats.paint.color.set("#ffffff");
  mats.paint.map = R.textures["cabinet-paint_diff"];
  mats.paint.normalMap = R.textures["painted_plaster_wall_nor_gl"];
  mats.paint.normalScale = new THREE.Vector2(0.08, 0.08);
  mats.paint.needsUpdate = true;
  mats.paint.roughness = 0.62 + env.wear * 0.1;
  mats.paint.color.set(["#ffffff", "#d8ddcf", "#b9b6a5"][env.wear]);
  mats.floor.color.multiplyScalar([1, 0.93, 0.84][env.wear]);
  mats.wood.color.multiplyScalar([1, 0.91, 0.8][env.wear]);
  mats.wall.color.set(["#eee9dc", "#e0e4da", "#d4d8d6"][env.wall]);
  mats.cream.color.set("#e0ded0");
  mats.cream.roughness = 0.46;
  mats.metal.color.set("#bbc1bd");
  mats.metal.metalness = 0.92;
  mats.metal.roughness = 0.27;
  mats.white.color.set("#e7e7df");
  mats.white.roughness = 0.2;
  roomPBR(mats.fabric, "denim_fabric", [2, 2], "#d0c9b8");
  roomRoot.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.geometry.type !== "BoxGeometry")
      return;
    const p = o.geometry.parameters,
      dims = [p.width, p.height, p.depth];
    if (Math.min(...dims) > 0.024 && Math.max(...dims) < 2.6) {
      o.geometry.dispose();
      o.geometry = new ROOM_TOOLS.RoundedBoxGeometry(
        ...dims,
        2,
        Math.min(0.009, Math.min(...dims) * 0.12),
      );
    }
  });
  const wallArt = roomRoot.children.find(
    (o) =>
      o.isMesh &&
      o.geometry.parameters?.width === 0.82 &&
      o.geometry.parameters?.height === 0.52,
  );
  if (wallArt)
    wallArt.material = new THREE.MeshStandardMaterial({
      map: R.textures["wall-print_diff"],
      roughness: 0.96,
      envMapIntensity: 0.18,
    });
  const bed = worldFindBase("bed");
  if (bed) {
    worldClear(bed);
    bed.add(roomFit("vintage_day_bed", [1.38, 1.03, 2.22], Math.PI / 2));
    roomProxy(bed, [1.38, 0.85, 2.22]);
  }
  const sofa = worldFindBase("sofa");
  if (sofa) {
    worldClear(sofa);
    sofa.add(roomFit("sofa_02", [0.86, 0.84, 1.7], Math.PI / 2));
    roomProxy(sofa, [0.86, 0.75, 1.7]);
  }
  const table = worldFindBase("table");
  if (table) {
    worldClear(table);
    table.add(roomFit("wooden_table_02", [1.08, 0.49, 0.62]));
    roomProxy(table, [1.08, 0.06, 0.62], [0, 0.46, 0]);
  }
  const desk = worldFindBase("desk");
  if (desk) {
    for (const c of desk.children.slice(0, 5)) {
      desk.remove(c);
      c.geometry?.dispose();
    }
    desk.add(roomFit("wooden_table_02", [1.6, 0.82, 0.7]));
    roomProxy(desk, [1.6, 0.05, 0.7], [0, 0.795, 0]);
  }
  const radio = worldFindBase("radio");
  if (radio) {
    worldClear(radio);
    radio.add(roomFit("drawer_cabinet", [0.66, 1.08, 0.285]));
    const player = roomFit("portable_cassette_player", [0.25, 0.15, 0.14]);
    player.position.set(0, 1.085, 0.005);
    radio.add(player);
    roomProxy(radio, [0.66, 1.23, 0.3]);
  }
  // No instructional placards pasted onto the furniture.
  if (W.pantry)
    W.pantry.children
      .filter(
        (o) =>
          o.isMesh && o.geometry.type === "PlaneGeometry" && o.position.y > 1.7,
      )
      .forEach((o) => {
        o.visible = false;
      });
  const chrome = new THREE.MeshStandardMaterial({
    color: "#ced4d2",
    metalness: 0.97,
    roughness: 0.22,
    envMapIntensity: 0.8,
  });
  const porcelain = new THREE.MeshPhysicalMaterial({
    color: "#e4e5df",
    roughness: 0.21,
    clearcoat: 0.28,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.5,
  });
  const sink = worldFindBase("sink");
  if (sink) {
    worldClear(sink);
    const profile = [
      [0, -0.115],
      [0.04, -0.115],
      [0.12, -0.105],
      [0.18, -0.068],
      [0.21, -0.015],
      [0.226, 0.008],
      [0.24, 0.01],
      [0.244, 0],
      [0.226, -0.03],
      [0.2, -0.1],
      [0.08, -0.133],
      [0, -0.133],
    ].map((p) => new THREE.Vector2(...p));
    const basin = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), chrome);
    basin.scale.set(1.14, 1, 0.81);
    sink.add(basin);
    roomTube(
      sink,
      [
        [0, 0, -0.176],
        [0, 0.15, -0.176],
        [0, 0.28, -0.145],
        [0, 0.295, -0.065],
        [0, 0.26, -0.015],
        [0, 0.22, -0.012],
      ],
      0.013,
      chrome,
    );
    const drain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.003, 24),
      mats.darkwood,
    );
    drain.position.set(0, -0.114, 0);
    sink.add(drain);
    roomRound(sink, [0.065, 0.024, 0.08], [0.16, 0.01, -0.16], chrome, 0.01);
    roomRound(sink, [0.016, 0.055, 0.065], [0.16, 0.045, -0.16], chrome, 0.008);
    roomProxy(sink, [0.56, 0.36, 0.43], [0, 0.07, 0]);
    const kitchen = worldFindBase("kitchen"),
      top = kitchen?.children[1];
    if (top) {
      const shape = new THREE.Shape();
      shape.moveTo(-1.02, -0.405);
      shape.lineTo(1.02, -0.405);
      shape.lineTo(1.02, 0.405);
      shape.lineTo(-1.02, 0.405);
      shape.closePath();
      const hole = new THREE.Path();
      hole.absellipse(-0.52, -0.02, 0.265, 0.197, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.065,
        bevelEnabled: true,
        bevelSize: 0.004,
        bevelThickness: 0.004,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 28,
      });
      geo.translate(0, 0, -0.0325);
      geo.rotateX(-Math.PI / 2);
      top.geometry.dispose();
      top.geometry = geo;
    }
  }
  const toilet = worldFindBase("toilet");
  if (toilet) {
    worldClear(toilet);
    const profile = [
      [0, 0],
      [0.115, 0.015],
      [0.1, 0.14],
      [0.165, 0.23],
      [0.23, 0.33],
      [0.23, 0.37],
      [0.19, 0.378],
      [0.17, 0.31],
      [0.12, 0.26],
      [0, 0.25],
    ].map((p) => new THREE.Vector2(...p));
    const bowl = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 48),
      porcelain,
    );
    bowl.scale.z = 1.27;
    toilet.add(bowl);
    const seat = new THREE.Mesh(
      new THREE.TorusGeometry(0.208, 0.018, 10, 64),
      porcelain,
    );
    seat.rotation.x = Math.PI / 2;
    seat.scale.y = 1.28;
    seat.position.y = 0.385;
    toilet.add(seat);
    roomRound(toilet, [0.43, 0.51, 0.19], [0, 0.48, 0.245], porcelain, 0.04);
    roomRound(toilet, [0.45, 0.035, 0.21], [0, 0.75, 0.245], porcelain, 0.012);
    roomRound(toilet, [0.05, 0.013, 0.034], [0.12, 0.776, 0.24], chrome, 0.005);
    roomProxy(toilet, [0.47, 0.77, 0.63], [0, 0.385, 0.055]);
  }
  // Rippled cloth, rather than sixteen solid curtain bars.
  for (const { mesh, side, offset } of curtainMeshes) {
    const geo = new THREE.PlaneGeometry(0.105, 1.72, 12, 28),
      pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i);
      pos.setZ(
        i,
        Math.cos((x / 0.105) * Math.PI * 2) * 0.024 +
          Math.sin(y * 5 + offset * 4) * 0.004,
      );
    }
    geo.computeVertexNormals();
    mesh.geometry.dispose();
    mesh.geometry = geo;
    mesh.material = new THREE.MeshStandardMaterial({
      map: R.textures["linen-diff"],
      normalMap: R.textures["denim_fabric_nor_gl"],
      normalScale: new THREE.Vector2(0.1, 0.1),
      side: THREE.DoubleSide,
      roughness: 0.98,
      color: "#e2ddd1",
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  // Window opening remains real geometry; only the distant city is a photographic sky card.
  if (cityRoot) {
    scene.remove(cityRoot);
    clearGroup(cityRoot);
    cityRoot = null;
  }
  const city = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 20),
    new THREE.MeshBasicMaterial({
      map: R.textures["anders-city"],
      color: "#f2f2ee",
      toneMapped: false,
    }),
  );
  city.position.set(0, 2, back - 20);
  roomRoot.add(city);
  R.city = city;
  const bounce = new THREE.PointLight("#dfebff", 18, 10, 2);
  bounce.position.set(0, 1.85, back + 0.15);
  roomRoot.add(bounce);
  R.windowBounce = bounce;
  const ceiling = roomRoot.children.find(
    (o) =>
      o.isMesh && o.geometry.parameters?.height === 0.1 && o.position.y > 2.8,
  );
  if (ceiling) {
    ceiling.material.color.set("#e1dfd7");
    ceiling.material.roughness = 0.95;
  }
  const detail = new THREE.Group();
  roomRoot.add(detail);
  roomRound(
    detail,
    [0.095, 0.135, 0.014],
    [0.42, 1.37, front - 0.09],
    porcelain,
    0.008,
  );
  roomRound(
    detail,
    [0.04, 0.07, 0.009],
    [0.42, 1.37, front - 0.101],
    mats.cream,
    0.004,
  );
  roomRound(
    detail,
    [0.095, 0.07, 0.014],
    [-w / 2 + 0.09, 0.29, 0.67],
    porcelain,
    0.007,
  ).rotation.y = Math.PI / 2;
  roomTube(
    detail,
    [
      [-0.28 + 0.56, 1.17, back + 0.48],
      [0.36, 0.85, back + 0.45],
      [0.4, 0.1, back + 0.23],
      [0.7, 0.07, back + 0.12],
    ],
    0.0035,
    mats.black,
    40,
  );
  // Familiar radiator details under the window.
  const rad = new THREE.Group();
  rad.position.set(0.36, 0.06, back + 0.2);
  detail.add(rad);
  for (let i = 0; i < 10; i++) {
    const fin = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.026, 0.35, 5, 10),
      mats.cream,
    );
    fin.position.set((i - 4.5) * 0.063, 0.25, 0);
    fin.scale.z = 1.5;
    rad.add(fin);
    fin.castShadow = true;
  }
  roomTube(
    rad,
    [
      [-0.36, 0.08, 0],
      [-0.36, 0.08, -0.06],
      [-0.36, 0.44, -0.06],
      [0.35, 0.44, -0.06],
    ],
    0.012,
    chrome,
  );
  // Floor/wall contact darkening is a very narrow ambient-occlusion strip, not a vignette filter.
  const contact = new THREE.MeshBasicMaterial({
    color: "#251b12",
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
  });
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) {
    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, d - 0.12),
      contact,
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.003, 0);
    roomRoot.add(edge);
  }
  roomRoot.updateMatrixWorld(true);
  roomLight();
  renderer.shadowMap.needsUpdate = true;
  sceneDirty = true;
  const shadeCanvas = document.createElement("canvas");
  shadeCanvas.width = shadeCanvas.height = 128;
  const ctx = shadeCanvas.getContext("2d"),
    gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "#000000aa");
  gradient.addColorStop(0.5, "#00000044");
  gradient.addColorStop(1, "#00000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadeCanvas);
  for (const [id, sx, sz] of [
    ["bed", 1.7, 2.55],
    ["sofa", 1.2, 2.05],
    ["table", 1.3, 0.85],
    ["desk", 1.8, 0.95],
    ["radio", 0.85, 0.55],
  ]) {
    const anchor = worldFindBase(id);
    if (!anchor) continue;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sz),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(anchor.position.x, 0.004, anchor.position.z);
    plane.userData.contactShadow = true;
    roomRoot.add(plane);
  }
}
function roomLight() {
  if (!R.ready || !renderer || W.store) return;
  const state = G && phase !== "title" ? G : null,
    night = state && (hour() < 6 || hour() > 18),
    closed = !!state?.curtains;
  const mirror = env.mirror ? -1 : 1;
  skyLight.color.set(night ? "#94a7bc" : "#e4eafa");
  skyLight.groundColor.set("#554c41");
  skyLight.intensity = night ? 0.16 : 0.32;
  sunLight.color.set(night ? "#a6b7d0" : "#ffe1b2");
  sunLight.intensity = night ? 0.07 : closed ? 0.2 : 3.1;
  sunLight.position.set(-2.4 * mirror, 3.7, -env.d / 2 - 2.9);
  sunLight.target.position.set(1.3 * mirror, 0.3, 1.0);
  sunLight.target.updateMatrixWorld();
  sunLight.shadow.camera.left = -5;
  sunLight.shadow.camera.right = 5;
  sunLight.shadow.camera.top = 5;
  sunLight.shadow.camera.bottom = -5;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 20;
  sunLight.shadow.camera.updateProjectionMatrix();
  sunLight.shadow.normalBias = 0.016;
  sunLight.shadow.bias = -0.00025;
  ceilingLight.castShadow = false;
  ceilingLight.intensity = state?.power === false ? 0 : night ? 5.5 : 0.6;
  lampLights.forEach(
    (l) => (l.intensity = state?.power === false ? 0 : night ? 2 : 0.25),
  );
  renderer.toneMappingExposure = night ? 0.92 : 1.04;
  scene.environmentIntensity = night ? 0.18 : 0.5;
  if (R.windowBounce) R.windowBounce.intensity = night ? 0.6 : closed ? 2 : 18;
  if (R.city) {
    R.city.material.color.set(night ? "#34445c" : "#f3f5f9");
  }
  scene.background.set(night ? "#222c37" : "#c5ccd0");
  scene.fog.color.copy(scene.background);
}
function roomPoseHand(g, grip = 0.65) {
  const data = g.userData.handData;
  if (!data) return;
  for (const n of data.bones) {
    n.object.position.copy(n.position);
    n.object.quaternion.copy(n.quaternion);
  }
  const axis = new THREE.Vector3(0, 0, 1);
  for (const finger of ["index", "middle", "ring", "pinky"]) {
    const chain = ["proximal", "intermediate", "distal"].map(
      (k) => data.byName[finger + "-finger-phalanx-" + k],
    );
    const tip = data.byName[finger + "-finger-tip"];
    if (chain.some((x) => !x) || !tip) continue;
    const bends = [0.67, 0.86, 0.5].map((a) => -g.userData.side * a * grip);
    [...chain, tip].forEach((bone, j) => {
      let pos = bone.position.clone(),
        angle = 0;
      for (let k = Math.min(j, 2); k >= 0; k--) {
        if (j > k)
          pos
            .sub(chain[k].position)
            .applyAxisAngle(axis, bends[k])
            .add(chain[k].position);
        angle += bends[k];
      }
      bone.object.position.copy(pos);
      bone.object.quaternion.premultiply(
        new THREE.Quaternion().setFromAxisAngle(axis, angle),
      );
    });
  }
  g.updateMatrixWorld(true);
}
function roomHand(parent, side = 1) {
  const g = new THREE.Group(),
    h = roomCopy(side < 0 ? "hand-left" : "hand-right");
  parent.add(g);
  const wrist = h.getObjectByName("wrist");
  if (!wrist) return g;
  const center = wrist.position.clone();
  h.position.sub(center);
  g.add(h);
  const bones = [],
    byName = {};
  h.traverse((o) => {
    if (o.isBone) {
      const x = {
        object: o,
        position: o.position.clone(),
        quaternion: o.quaternion.clone(),
      };
      bones.push(x);
      byName[o.name] = x;
    }
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
      o.material = new THREE.MeshPhysicalMaterial({
        color: "#c29a83",
        roughness: 0.6,
        metalness: 0,
        clearcoat: 0.025,
        sheen: 0.08,
        sheenColor: new THREE.Color("#b87f65"),
        envMapIntensity: 0.4,
      });
    }
  });
  g.userData.handData = { bones, byName };
  g.userData.side = side;
  // Asset fingers point -Y. Rotate the complete, skinned anatomical hand to +Y.
  h.rotation.set(Math.PI, (side * Math.PI) / 2, 0);
  h.position.copy(center).applyEuler(h.rotation).multiplyScalar(-1);
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.059, 0.33, 24, 4),
    new THREE.MeshStandardMaterial({
      map: R.textures["denim_fabric_diff"],
      normalMap: R.textures["denim_fabric_nor_gl"],
      normalScale: new THREE.Vector2(0.12, 0.12),
      color: "#787c6d",
      roughness: 0.92,
      envMapIntensity: 0.3,
    }),
  );
  sleeve.position.set(0, -0.17, 0);
  g.add(sleeve);
  const cuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.041, 0.006, 6, 30),
    sleeve.material,
  );
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = -0.012;
  g.add(cuff);
  g.position.set(side * 0.25, -0.17, 0.055);
  g.rotation.y = side * 0.2;
  g.rotation.z = -side * 0.1;
  g.scale.setScalar(1.04);
  roomPoseHand(g, 0.93);
  R.hands.push(g);
  return g;
}
const roomOldArm = worldArm,
  roomOldSetHand = worldSetHand,
  roomOldFrame = worldFrame,
  roomOldSync = syncRoom,
  roomOldBuild = buildRoom,
  roomOldProduct = worldProduct,
  roomOldEquip = worldEquip,
  roomOldPutBack = worldPutBack,
  roomOldMeal = worldMeal;
worldArm = function (parent, side = 1, reach = false) {
  return R.ready ? roomHand(parent, side) : roomOldArm(parent, side, reach);
};
worldSetHand = function (preview = "") {
  R.hands = [];
  R.grip = null;
  R.gripBase = null;
  roomOldSetHand(preview);
  if (R.ready && W.glance === "watch" && W.handModel) {
    for (const part of W.handModel.children) {
      if (!part.userData.handData) {
        part.position.x -= 0.045;
        part.position.y += 0.02;
      }
    }
  }
  if (!R.ready || !W.rig || W.glance || W.held?.type === "book") return;
  if (W.handModel) {
    W.handModel.position.y += 0.07;
    const p = new THREE.Vector3(0.24, -0.2, -0.46),
      grip = new THREE.Group();
    for (const child of [...W.rig.children]) {
      W.rig.remove(child);
      child.position.sub(p);
      grip.add(child);
    }
    grip.position.copy(p);
    W.rig.add(grip);
    R.grip = grip;
    R.gripBase = p.clone();
    if (W.held?.prepared) {
      const spoon = new THREE.Group();
      grip.add(spoon);
      spoon.position.set(-0.17, 0.12, 0.035);
      const metal = new THREE.MeshStandardMaterial({
        color: "#b8c0bd",
        metalness: 0.94,
        roughness: 0.22,
        envMapIntensity: 0.7,
      });
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.019, 20, 12),
        metal,
      );
      head.scale.set(0.72, 0.17, 1.35);
      spoon.add(head);
      roomRound(spoon, [0.008, 0.005, 0.13], [0, 0, 0.075], metal, 0.003);
      R.spoon = spoon;
    } else R.spoon = null;
  }
};
// Furniture trigger volumes make E forgiving, but R must land on the actual mesh surface.
worldPutBack = function (place = true) {
  if (
    R.ready &&
    place &&
    W.held &&
    !W.busy &&
    !W.glance &&
    W.hit?.object.userData.interactionProxy
  ) {
    camera.updateMatrixWorld(true);
    roomRoot.updateMatrixWorld(true);
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hit = raycaster
      .intersectObjects(roomRoot.children, true)
      .find((h) => {
        if (
          h.distance > 2.65 ||
          h.object.userData.interactionProxy ||
          h.object.userData.noPick
        )
          return false;
        for (let p = h.object; p; p = p.parent) if (!p.visible) return false;
        if (h.object.material?.transparent && h.object.material.opacity < 0.4)
          return false;
        return true;
      });
    W.hit = hit || null;
  }
  return roomOldPutBack(place);
};
worldEquip = function (uidValue, split = true) {
  roomOldEquip(uidValue, split);
  if (R.ready && W.held) {
    R.grab = { start: performance.now(), until: performance.now() + 340 };
  }
};
function roomMug(parent = null) {
  const g = new THREE.Group();
  if (parent) parent.add(g);
  const enamel = new THREE.MeshPhysicalMaterial({
    color: "#e4e4d9",
    roughness: 0.23,
    metalness: 0.08,
    clearcoat: 0.4,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.55,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: "#344e59",
    roughness: 0.27,
    metalness: 0.5,
    envMapIntensity: 0.65,
  });
  const pts = [
    [0, 0],
    [0.037, 0],
    [0.046, 0.008],
    [0.048, 0.11],
    [0.05, 0.122],
    [0.047, 0.125],
    [0.045, 0.118],
    [0.043, 0.018],
    [0.034, 0.012],
    [0, 0.012],
  ].map((p) => new THREE.Vector2(...p));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), enamel);
  g.add(body);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.048, 0.0025, 8, 64),
    edge,
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.123;
  g.add(lip);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.0058, 10, 40),
    enamel,
  );
  handle.position.set(0.061, 0.068, 0);
  g.add(handle);
  const tea = new THREE.Mesh(
    new THREE.CircleGeometry(0.043, 48),
    new THREE.MeshPhysicalMaterial({
      color: "#8caaae",
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 0.8,
    }),
  );
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 0.102;
  g.add(tea);
  g.userData = { productId: "cup", height: 0.125 };
  return g;
}
worldMeal = function () {
  if (!R.ready) return roomOldMeal();
  const g = new THREE.Group(),
    mat = new THREE.MeshPhysicalMaterial({
      color: "#e7e4d9",
      roughness: 0.27,
      clearcoat: 0.25,
      envMapIntensity: 0.5,
    });
  const profile = [
    [0, -0.015],
    [0.07, -0.015],
    [0.105, 0.018],
    [0.12, 0.065],
    [0.116, 0.07],
    [0.106, 0.042],
    [0.075, 0.002],
    [0, 0.002],
  ].map((p) => new THREE.Vector2(...p));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 48), mat));
  const grainGeometry = new THREE.SphereGeometry(0.0036, 7, 5),
    grainMat = new THREE.MeshStandardMaterial({
      color: "#e8dfc4",
      roughness: 0.72,
      envMapIntensity: 0.3,
    });
  const grains = new THREE.InstancedMesh(grainGeometry, grainMat, 170),
    dummy = new THREE.Object3D();
  for (let i = 0; i < 170; i++) {
    const a = i * 2.39996,
      r = Math.sqrt((i + 0.5) / 170) * 0.097;
    dummy.position.set(
      Math.cos(a) * r,
      0.04 + 0.012 * (1 - r / 0.1),
      Math.sin(a) * r,
    );
    dummy.rotation.set(Math.sin(i) * 0.4, a, Math.cos(i) * 0.35);
    dummy.scale.set(1, 1.1, 2);
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
  }
  grains.instanceMatrix.needsUpdate = true;
  g.add(grains);
  g.userData.height = 0.09;
  return g;
};
worldProduct = function (id, parent = null, bare = false) {
  if (R.ready && id === "cup") return roomMug(parent);
  const it = DB[id];
  if (!R.ready || !it) return roomOldProduct(id, parent, bare);
  // The sample upgrades canned-food geometry and materials; the complete product art pass is still pending.
  if (it.category !== "canned") return roomOldProduct(id, parent, bare);
  const all = roomCopy("russian_food_cans_01"),
    name =
      id === "condensed"
        ? "russian_food_cans_01_can_cond"
        : "russian_food_cans_01_can_fish";
  const mesh = all.getObjectByName(name);
  if (!mesh) return roomOldProduct(id, parent, bare);
  mesh.parent.remove(mesh);
  const g = new THREE.Group(),
    bounds = new THREE.Box3().setFromObject(mesh),
    size = bounds.getSize(new THREE.Vector3()),
    center = bounds.getCenter(new THREE.Vector3());
  mesh.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
  g.add(mesh);
  const height = id === "condensed" ? 0.14 : 0.07,
    width = id === "condensed" ? 0.09 : 0.15;
  g.scale.set(
    width / size.x,
    height / size.y,
    (id === "condensed" ? 0.09 : 0.09) / size.z,
  );
  // Bake the scale into a normalised child so all production shelf/hand placement keeps working.
  const out = new THREE.Group();
  out.add(g);
  if (parent) parent.add(out);
  out.userData = { productId: id, height };
  return out;
};
worldFrame = function (now, dt) {
  roomOldFrame(now, dt);
  if (!R.ready) return;
  const a = W.busy;
  if (R.grip && R.gripBase) {
    R.grip.position.copy(R.gripBase);
    R.grip.rotation.set(0, 0, 0);
    if (W.rig) {
      W.rig.rotation.x = 0;
      W.rig.position.y = Math.sin(now * 0.0018) * 0.0015;
    }
    if (a?.kind === "drink") {
      const p = clamp((now - a.start) / (a.seconds * 1000), 0, 1),
        u =
          Math.sin((Math.PI * clamp(p / 0.28, 0, 1)) / 2) *
          Math.sin((Math.PI * clamp((1 - p) / 0.26, 0, 1)) / 2);
      R.grip.position.add(
        new THREE.Vector3(-0.21, 0.13, 0.23).multiplyScalar(u),
      );
      R.grip.rotation.x = 0.64 * u;
      R.grip.rotation.z = -0.08 * u;
    }
    if (a?.kind === "eat") {
      const t = (now - a.start) / 1000,
        u = Math.pow(Math.max(0, Math.sin((t * Math.PI) / 1.6)), 2);
      R.grip.position.y += u * 0.035;
      if (R.spoon) {
        R.spoon.position.set(
          -0.17 + u * 0.02,
          0.12 + u * 0.13,
          0.035 + u * 0.22,
        );
        R.spoon.rotation.x = -u * 0.5;
      }
    }
  }
  const grasp =
    R.grab && now < R.grab.until ? clamp((now - R.grab.start) / 340, 0, 1) : 1;
  for (const h of R.hands) roomPoseHand(h, 0.28 + grasp * 0.65);
};
syncRoom = function () {
  roomOldSync();
  roomLight();
};
buildRoom = function (e) {
  roomOldBuild(e);
  roomDecorate();
};
async function initRealisticRoom() {
  if (!W.enabled) {
    R.ready = false;
    R.status = "无WebGL降级";
    return;
  }
  const button = $("#newGameButton"),
    small = $("#newGameButton small");
  button.disabled = true;
  document.body.classList.add("room-assets-loading");
  const loader = new ROOM_TOOLS.GLTFLoader();
  loader.register((parser) => {
    parser.textureLoader = new THREE.TextureLoader(loader.manager);
    return { name: "CLOSED365_embedded_images" };
  });
  let done = 0;
  const total =
    Object.keys(OFFLINE_ROOM.models).length +
    Object.keys(OFFLINE_ROOM.textures).length;
  const progress = () => {
    done++;
    R.status = `写实房间资源 ${done}/${total}`;
    small.textContent = R.status;
  };
  try {
    await Promise.all([
      ...Object.entries(OFFLINE_ROOM.models).map(async ([name, b64]) => {
        const gltf = await loader.parseAsync(roomBytes(b64), "");
        R.models[name] = gltf.scene;
        progress();
      }),
      ...Object.entries(OFFLINE_ROOM.textures).map(async ([name, url]) => {
        const t = await new THREE.TextureLoader().loadAsync(url);
        t.colorSpace =
          name.endsWith("_diff") ||
          name === "anders-city" ||
          name === "linen-diff"
            ? THREE.SRGBColorSpace
            : THREE.NoColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        R.textures[name] = t;
        progress();
      }),
    ]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new ROOM_TOOLS.RoomEnvironment(renderer);
    R.environment = pmrem.fromScene(envScene, 0.04);
    scene.environment = R.environment.texture;
    envScene.dispose();
    pmrem.dispose();
    R.ready = true;
    R.status = "房间样片已就绪";
    document.body.classList.add("realistic-room");
    roomDecorate();
    worldSetHand();
    small.textContent = "唯一一次采购 · 进房后只靠存量";
    if (phase === "title") setCinematic();
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    document.body.classList.remove("room-assets-loading");
    roomInstallSample();
  } catch (error) {
    R.ready = false;
    R.error = String(error.stack || error);
    R.status = "资源载入失败";
    console.error(error);
    document.body.classList.remove("room-assets-loading");
    small.textContent = "规则版仍可游玩 · 写实资源载入失败";
  } finally {
    button.disabled = false;
    sceneDirty = true;
  }
}
const roomOldSave = saveGame,
  roomOldTitle = toTitle,
  roomOldLoad = loadState;
saveGame = function (message = true) {
  if (R.sample) {
    if (message) notify("房间样片不会覆盖你的正式存档。可导出一份独立JSON。 ");
    return false;
  }
  return roomOldSave(message);
};
toTitle = function () {
  const wasSample = R.sample,
    old = R.savedGame;
  roomOldTitle();
  if (wasSample) {
    R.sample = false;
    G = old;
    R.savedGame = null;
    $("#roomSampleNotice").hidden = true;
    updatePhase();
  }
};
loadState = function (state) {
  if (R.sample && validateSave(state)) {
    R.sample = false;
    R.savedGame = null;
    $("#roomSampleNotice").hidden = true;
  }
  return roomOldLoad(state);
};
function roomStartSample() {
  if (!R.ready || phase !== "title") return false;
  updateSeed();
  R.savedGame = G;
  R.sample = true;
  if (!startPreparation()) {
    R.sample = false;
    return false;
  }
  cart = { ...YEAR_KIT };
  storeLegacyBegin();
  G.curtains = false;
  unpackBag(0, true);
  syncRoom();
  camera.position.copy(
    roomRoot.localToWorld(new THREE.Vector3(0.45, 1.62, 2.12)),
  );
  camera.lookAt(roomRoot.localToWorld(new THREE.Vector3(-0.55, 1.08, -1.6)));
  lookYaw = camera.rotation.y;
  lookPitch = camera.rotation.x;
  $("#roomSampleNotice").hidden = false;
  worldRenderHUD();
  renderer.shadowMap.needsUpdate = true;
  sceneDirty = true;
  showToast(
    "独立房间样片：已用开局预算购入并拆好全年物资，之后不能再买。不覆盖正式存档。",
    "info",
  );
  return true;
}
function roomInstallSample() {
  if ($("#roomSampleButton")) return;
  const button = document.createElement("button");
  button.id = "roomSampleButton";
  button.textContent = "先看写实房间样片　→";
  button.onclick = roomStartSample;
  $("#titleScreen .title-content").append(button);
  document.body.insertAdjacentHTML(
    "beforeend",
    '<div id="roomSampleNotice" hidden>独立房间样片 · 一次采购后封闭生存 · 不覆盖正式存档</div>',
  );
}
const ROOM_READY = initRealisticRoom();
