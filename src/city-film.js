/* Period city, true midground parallax, and a restrained colour-negative camera treatment.
   All geometry and facade details are local; there are no external map/image requests. */
const C = {
  windowTextures: [],
  root: null,
  seed: "",
  stats: {},
  night: null,
  materials: [],
  film: true,
  stamp: 0,
  noise: null,
};
function cityWindowTexture(variant = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 192;
  const x = canvas.getContext("2d");
  const g = x.createLinearGradient(0, 0, 128, 192);
  g.addColorStop(0, "#393e3b");
  g.addColorStop(0.5, ["#5e6862", "#484c46", "#76715e"][variant % 3]);
  g.addColorStop(1, "#242e2d");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 192);
  x.fillStyle = variant % 2 ? "#b4b1a080" : "#d5d0b6a0";
  const curtain = variant % 2 ? 21 : 34;
  x.fillRect(1, 0, curtain, 190);
  x.fillRect(128 - curtain, 0, curtain - 1, 190);
  for (let i = 0; i < 22; i++) {
    x.fillStyle = i % 2 ? "#ded7bc22" : "#30372e22";
    x.fillRect((i % 11) * 3 + (i > 10 ? 128 - curtain : 2), 0, 1, 192);
  }
  x.fillStyle = "#a9babc17";
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(128, 0);
  x.lineTo(0, 150);
  x.fill();
  x.strokeStyle = "#1b242577";
  x.lineWidth = 5;
  x.strokeRect(2, 2, 124, 188);
  x.fillStyle = "#cad0c347";
  x.fillRect(4, 4, 3, 180);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  C.windowTextures.push(t);
  return t;
}
function buildPeriodCity() {
  if (!R.ready || !roomRoot || W.store || roomRoot.userData.periodCity) return;
  roomRoot.userData.periodCity = true;
  camera.layers.enable(1);
  camera.far = 240;
  camera.updateProjectionMatrix();
  C.seed = env.seed;
  C.materials = [];
  const root = new THREE.Group();
  root.userData.noPick = true;
  root.name = "Anders-period-city";
  root.layers.set(1);
  roomRoot.add(root);
  C.root = root;
  const rng = { rng: hashSeed(env.seed + "period-city") },
    rand = () => rngNext(rng),
    batches = new Map();
  const wall = new THREE.MeshStandardMaterial({
    map: R.textures.painted_plaster_wall_diff,
    normalMap: R.textures.painted_plaster_wall_nor_gl,
    normalScale: new THREE.Vector2(0.15, 0.15),
    roughness: 0.94,
    metalness: 0,
    fog: false,
    color: "#c6c4b5",
    emissive: "#a9ae9e",
    emissiveIntensity: 0.14,
    envMapIntensity: 0.15,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: "#a5a699",
    roughness: 0.94,
    fog: false,
    emissive: "#858e83",
    emissiveIntensity: 0.09,
    envMapIntensity: 0.12,
  });
  const frame = new THREE.MeshStandardMaterial({
    color: "#c2beac",
    roughness: 0.8,
    metalness: 0.12,
    fog: false,
    emissive: "#7b847b",
    emissiveIntensity: 0.1,
    envMapIntensity: 0.15,
  });
  const iron = new THREE.MeshStandardMaterial({
    color: "#555d56",
    roughness: 0.63,
    metalness: 0.5,
    fog: false,
    envMapIntensity: 0.2,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: "#787d70",
    roughness: 0.95,
    fog: false,
    emissive: "#778172",
    emissiveIntensity: 0.12,
    envMapIntensity: 0.1,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: "#c4bfaa",
    map: R.textures["linen-diff"],
    roughness: 0.95,
    side: THREE.DoubleSide,
    fog: false,
    emissive: "#b0b4a4",
    emissiveIntensity: 0.1,
  });
  const glasses = [0, 1, 2].map(
    (i) =>
      new THREE.MeshStandardMaterial({
        map: cityWindowTexture(i),
        color: "#d5daca",
        roughness: 0.42,
        metalness: 0.16,
        emissive: "#c5c0a2",
        emissiveMap: cityWindowTexture(i),
        emissiveIntensity: 0.09,
        envMapIntensity: 0.18,
        fog: false,
      }),
  );
  C.materials = [wall, concrete, frame, iron, roofMat, cloth, ...glasses];
  C.faceMaterials = [];
  C.nightMeshes = [];
  C.glasses = glasses;
  const boxGeo = new THREE.BoxGeometry(1, 1, 1),
    glassGeo = new THREE.BoxGeometry(1, 1, 1),
    cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const dummy = new THREE.Object3D();
  function instance(type, mat, size, pos, rot = 0, color = null) {
    const key = type + ":" + mat.uuid;
    if (!batches.has(key)) batches.set(key, { type, mat, items: [] });
    dummy.position.set(...pos);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(...size);
    dummy.updateMatrix();
    batches.get(key).items.push({
      matrix: dummy.matrix.clone(),
      color: color ? new THREE.Color(color) : new THREE.Color("#ffffff"),
    });
  }
  const addBox = (mat, w, h, d, x, y, z, rot = 0, color = null) =>
    instance("box", mat, [w, h, d], [x, y, z], rot, color);
  const back = -env.d / 2,
    ground = -env.floor * 2.85;
  const blocks = [
    {
      x: -7.9,
      z: back - 22,
      w: 11.4,
      d: 8.8,
      top: 1.1,
      tint: "#c3bcb0",
      detail: 2,
    },
    {
      x: 8.3,
      z: back - 30,
      w: 12.5,
      d: 10,
      top: 5.3,
      tint: "#d0c3a7",
      detail: 2,
    },
    {
      x: -17.5,
      z: back - 48,
      w: 15,
      d: 11,
      top: 6.7,
      tint: "#c3c5b7",
      detail: 1,
    },
    { x: 2, z: back - 55, w: 16, d: 10, top: 2.5, tint: "#bbc2b6", detail: 1 },
    {
      x: 21,
      z: back - 65,
      w: 14,
      d: 11,
      top: 12.7,
      tint: "#c2c3b2",
      detail: 1,
    },
    { x: -31, z: back - 79, w: 20, d: 12, top: 13, tint: "#c1c6bd", detail: 0 },
  ];
  if (env.view === 1) {
    blocks[0].x -= 2;
    blocks[1].z -= 4;
  }
  if (env.view === 2) {
    blocks[0].top += 3;
    blocks[1].x += 1.5;
  }
  let windows = 0,
    balconies = 0;
  for (const block of blocks) {
    const { x, z, w, d, top, tint, detail } = block,
      height = top - ground;
    addBox(wall, w, height, d, x, ground + height / 2, z, 0, tint);
    addBox(concrete, w + 0.28, 0.16, d + 0.3, x, top + 0.08, z, 0, "#d0cbb8");
    // Real cornice and parapet geometry makes rooflines hold up while the player moves.
    for (const side of [-1, 1]) {
      addBox(
        concrete,
        w + 0.24,
        0.24,
        0.13,
        x,
        top + 0.24,
        z + side * (d / 2 + 0.03),
      );
      addBox(concrete, 0.13, 0.24, d, x + (side * w) / 2, top + 0.24, z);
    }
    const floors = Math.max(4, Math.floor(height / 2.85)),
      cols = Math.max(3, Math.floor((w - 1.2) / 2.1));
    for (let side = 0; side < (detail ? 3 : 1); side++) {
      const faceWidth = side === 0 ? w : d,
        num = side === 0 ? cols : Math.max(3, Math.floor(d / 2.1));
      const photoTexture = R.textures["city-bay_diff"].clone();
      photoTexture.repeat.set(num, floors);
      photoTexture.needsUpdate = true;
      C.windowTextures.push(photoTexture);
      const photoMat = new THREE.MeshStandardMaterial({
        map: photoTexture,
        color: tint,
        roughness: 0.95,
        metalness: 0,
        emissive: "#ffffff",
        emissiveMap: photoTexture,
        emissiveIntensity: 0.65,
        envMapIntensity: 0.06,
        fog: false,
      });
      C.faceMaterials.push(photoMat);
      C.materials.push(photoMat);
      const facade = new THREE.Mesh(
        new THREE.PlaneGeometry(faceWidth, floors * 2.85),
        photoMat,
      );
      facade.rotation.y =
        side === 0 ? 0 : side === 1 ? -Math.PI / 2 : Math.PI / 2;
      facade.position.set(
        side === 0 ? x : x + (side === 1 ? -1 : 1) * (w / 2 + 0.012),
        top - (floors * 2.85) / 2,
        side === 0 ? z + d / 2 + 0.012 : z,
      );
      facade.layers.set(1);
      facade.userData.noPick = true;
      root.add(facade);
      for (let row = 0; row < floors; row++)
        for (let col = 0; col < num; col++) {
          const yy = top - 1.425 - row * 2.85;
          if (yy < ground + 0.8) continue;
          const along = ((col - (num - 1) / 2) * faceWidth) / num;
          const px =
            side === 0
              ? x + along
              : x + (side === 1 ? -1 : 1) * (w / 2 + 0.028);
          const pz = side === 0 ? z + d / 2 + 0.028 : z + along,
            angle = side === 0 ? 0 : side === 1 ? -Math.PI / 2 : Math.PI / 2;
          const normal = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
          const ww = detail === 2 ? 1.04 : 0.98,
            hh = 1.42;
          instance(
            "glass",
            glasses[(row * 7 + col * 3 + side) % 3],
            [ww, hh, 0.035],
            [px, yy, pz],
            angle,
          );
          // Sills, jambs, and a center mullion have genuine depth, not a window-dot texture.
          for (const sx of [-1, 1]) {
            const dx = Math.cos(angle) * sx * (ww / 2 + 0.045),
              dz = -Math.sin(angle) * sx * (ww / 2 + 0.045);
            addBox(
              frame,
              0.055,
              hh + 0.12,
              0.075,
              px + dx + normal.x * 0.04,
              yy,
              pz + dz + normal.z * 0.04,
              angle,
            );
          }
          addBox(
            frame,
            0.04,
            hh,
            0.07,
            px + normal.x * 0.052,
            yy,
            pz + normal.z * 0.052,
            angle,
          );
          for (const sy of [-1, 1])
            addBox(
              concrete,
              ww + 0.19,
              0.065,
              0.19,
              px + normal.x * 0.07,
              yy + sy * (hh / 2 + 0.045),
              pz + normal.z * 0.07,
              angle,
            );
          windows++;
          if (side === 0 && detail === 2 && row % 3 === 1 && col % 2 === 0) {
            const zz = pz + 0.47,
              bottom = yy - 0.82;
            addBox(concrete, 1.55, 0.09, 0.94, px, bottom, zz);
            addBox(iron, 1.5, 0.032, 0.035, px, bottom + 0.86, zz + 0.43);
            addBox(iron, 1.5, 0.026, 0.03, px, bottom + 0.2, zz + 0.43);
            for (let k = -4; k <= 4; k++)
              addBox(
                iron,
                0.018,
                0.86,
                0.025,
                px + k * 0.17,
                bottom + 0.43,
                zz + 0.43,
              );
            for (const sx of [-1, 1])
              addBox(
                iron,
                0.025,
                0.84,
                0.89,
                px + sx * 0.735,
                bottom + 0.44,
                zz,
              );
            if ((col + row) % 4 === 1)
              addBox(
                cloth,
                0.48,
                0.58,
                0.025,
                px - 0.2,
                bottom + 0.46,
                zz + 0.45,
                0,
                "#d9d3ba",
              );
            balconies++;
          }
        }
    }
    for (let j = 0; j < (detail === 2 ? 3 : 1); j++) {
      const ax = x + (j - 1) * w * 0.23,
        az = z + ((j % 2) - 0.5) * d * 0.4,
        ah = 1.3 + rand() * 0.9;
      addBox(iron, 0.03, ah, 0.03, ax, top + ah / 2 + 0.2, az);
      addBox(iron, 0.9, 0.025, 0.025, ax, top + ah * 0.78, az);
      for (let k = -2; k <= 2; k++)
        addBox(iron, 0.022, 0.022, 0.42, ax + k * 0.16, top + ah * 0.78, az);
    }
    if (detail) {
      instance(
        "cylinder",
        roofMat,
        [0.6, 1.25, 0.6],
        [x + w * 0.25, top + 0.75, z],
      );
      instance(
        "cylinder",
        iron,
        [0.67, 0.09, 0.67],
        [x + w * 0.25, top + 1.4, z],
      );
      addBox(concrete, 0.62, 1.25, 0.55, x - w * 0.25, top + 0.7, z - 0.8);
    }
  }
  addBox(roofMat, 160, 0.1, 140, 0, ground - 0.12, back - 52, 0, "#777d74");
  for (const batch of batches.values()) {
    const geometry =
      batch.type === "cylinder"
        ? cylGeo
        : batch.type === "glass"
          ? glassGeo
          : boxGeo;
    const mesh = new THREE.InstancedMesh(
      geometry,
      batch.mat,
      batch.items.length,
    );
    batch.items.forEach((item, i) => {
      mesh.setMatrixAt(i, item.matrix);
      mesh.setColorAt(i, item.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.layers.set(1);
    mesh.userData.noPick = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    if (batch.type === "glass") {
      mesh.visible = false;
      C.nightMeshes.push(mesh);
    }
    root.add(mesh);
  }
  // Only the very distant horizon remains a photograph. The foreground has actual perspective/parallax.
  if (R.city) {
    R.city.position.set(0, -30, back - 132);
    R.city.scale.set(10, 10, 1);
    R.city.material.fog = false;
    R.city.material.needsUpdate = true;
  }
  C.stats = {
    buildings: blocks.length,
    windows,
    balconies,
    batches: batches.size,
  };
  C.night = null;
  updatePeriodCityLight();
  sceneDirty = true;
}
function updatePeriodCityLight() {
  if (!C.root || W.store || C.root.parent !== roomRoot) return;
  const night = G && phase === "playing" && (hour() < 6 || hour() > 18);
  if (C.night === !!night) return;
  C.night = !!night;
  for (const m of C.materials) {
    m.envMapIntensity = night ? 0.08 : 0.15;
  }
  C.nightMeshes?.forEach((m) => (m.visible = !!night));
  C.faceMaterials?.forEach((m) => (m.emissiveIntensity = night ? 0.015 : 0.65));
  C.glasses?.forEach((m, i) => {
    m.emissive.set(night ? ["#e0bd78", "#756d50", "#c1ba99"][i] : "#a7b3a9");
    m.emissiveIntensity = night ? [0.85, 0.12, 0.36][i] : 0.12;
  });
}
function setFilmMode(enabled, remember = true) {
  C.film = !!enabled;
  document.body.classList.toggle("film-mode", C.film);
  const b = $("#filmToggle");
  if (b) {
    b.textContent = C.film ? "胶片画面：开" : "胶片画面：关";
    b.setAttribute("aria-pressed", String(C.film));
  }
  if (remember) navSetting("closed365-film", C.film ? "on" : "off");
}
function initFilm() {
  if (!W.enabled) return;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d"),
    image = x.createImageData(128, 128),
    r = { rng: 0x198635 };
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 110 + rngNext(r) * 55;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 150;
  }
  x.putImageData(image, 0, 0);
  document.body.insertAdjacentHTML(
    "beforeend",
    '<div id="filmNoise" aria-hidden="true"></div><div id="filmGate" aria-hidden="true"></div>',
  );
  $("#filmNoise").style.backgroundImage = "url(" + c.toDataURL() + ")";
  C.noise = c;
  const b = document.createElement("button");
  b.id = "filmToggle";
  b.onclick = () => setFilmMode(!C.film);
  $("#worldPause .world-pause-small").append(b);
  setFilmMode(navSetting("closed365-film") !== "off", false);
}
const cityPreviousDecorate = roomDecorate,
  cityPreviousFrame = worldFrame;
roomDecorate = function () {
  cityPreviousDecorate();
  buildPeriodCity();
};
worldFrame = function (now, dt) {
  cityPreviousFrame(now, dt);
  if (now - C.stamp > 800) {
    updatePeriodCityLight();
    C.stamp = now;
  }
};
initFilm();
if (R.ready) buildPeriodCity();

function releasePeriodCity() {
  for (const t of C.windowTextures) t.dispose();
  C.windowTextures = [];
  C.root = null;
  C.materials = [];
}
const cityOldBuildRoom = buildRoom,
  cityOldBuildStore = worldBuildStore;
buildRoom = function (e) {
  releasePeriodCity();
  return cityOldBuildRoom(e);
};
worldBuildStore = function () {
  releasePeriodCity();
  return cityOldBuildStore();
};
