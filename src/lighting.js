// v0.8 realistic light: ground-truth ambient occlusion (GTAO) rendered in HDR, then tone-mapped once.
// Contact shadows under furniture, in wall corners and around objects are what make the room read as real.
// Off by default on touch devices and software renderers; adaptive guard switches it off if frames get slow.
const LQ = {
  composer: null,
  gtao: null,
  on: false,
  busy: false,
  failed: false,
  ratio: 0,
  slow: 0,
  frames: 0,
  software: false,
};
function lightingSoftwareGPU() {
  try {
    const gl = renderer.getContext(),
      ext = gl.getExtension("WEBGL_debug_renderer_info"),
      name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return /swiftshader|llvmpipe|software/i.test(String(name));
  } catch {
    return false;
  }
}
function lightingDefault() {
  const saved = navSetting("closed365-ao");
  if (saved === "on" || saved === "off") return saved === "on";
  const coarse = matchMedia?.("(pointer: coarse)").matches;
  return !coarse && !LQ.software;
}
function lightingBuild() {
  if (LQ.composer || LQ.failed) return !!LQ.composer;
  try {
    if (!renderer?.capabilities.isWebGL2 || !ROOM_TOOLS.GTAOPass) throw Error("WebGL2/GTAO unavailable");
    const ratio = renderer.getPixelRatio(),
      target = new THREE.WebGLRenderTarget(innerWidth * ratio, innerHeight * ratio, {
        type: THREE.HalfFloatType,
        samples: 4,
      });
    const composer = new ROOM_TOOLS.EffectComposer(renderer, target);
    composer.addPass(new ROOM_TOOLS.RenderPass(scene, camera));
    const gtao = new ROOM_TOOLS.GTAOPass(scene, camera, innerWidth * ratio, innerHeight * ratio);
    gtao.output = ROOM_TOOLS.GTAOPass.OUTPUT.Default;
    gtao.blendIntensity = 1;
    gtao.updateGtaoMaterial({
      radius: 0.55,
      distanceExponent: 1.5,
      thickness: 1.6,
      scale: 1.35,
      samples: 16,
      distanceFallOff: 1,
      screenSpaceRadius: false,
    });
    gtao.updatePdMaterial({
      lumaPhi: 10,
      depthPhi: 2,
      normalPhi: 3,
      radius: 8,
      radiusExponent: 1.4,
      rings: 3,
      samples: 16,
    });
    // Invisible interaction proxies, glass, water and decals must not cast occlusion.
    gtao.overrideVisibility = function () {
      const cache = this._visibilityCache;
      this.scene.traverse((o) => {
        cache.set(o, o.visible);
        if (o.isPoints || o.isLine || o.isSprite || o.userData.noAO) {
          o.visible = false;
          return;
        }
        if (!o.isMesh) return;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        if (
          list.every(
            (m) =>
              !m ||
              m.visible === false ||
              m.colorWrite === false ||
              (m.transparent && (m.opacity < 0.7 || m.depthWrite === false)) ||
              m.transmission > 0,
          )
        )
          o.visible = false;
      });
    };
    composer.addPass(gtao);
    composer.addPass(new ROOM_TOOLS.OutputPass());
    composer.setPixelRatio(ratio);
    composer.setSize(innerWidth, innerHeight);
    LQ.composer = composer;
    LQ.gtao = gtao;
    LQ.ratio = ratio;
    return true;
  } catch (error) {
    console.warn("Ambient occlusion disabled:", error.message);
    LQ.failed = true;
    return false;
  }
}
function setAmbientOcclusion(enabled, remember = true) {
  LQ.on = !!enabled && lightingBuild();
  const b = $("#aoToggle");
  if (b) {
    b.textContent = LQ.on ? "环境光遮蔽：开" : "环境光遮蔽：关";
    b.setAttribute("aria-pressed", String(LQ.on));
  }
  if (remember) navSetting("closed365-ao", enabled ? "on" : "off");
  LQ.slow = LQ.frames = 0;
  sceneDirty = true;
}
function initLighting() {
  if (!renderer || fallbackMode) return;
  LQ.software = lightingSoftwareGPU();
  const plain = renderer.render.bind(renderer);
  renderer.render = function (s, cam) {
    if (
      LQ.on &&
      !LQ.busy &&
      s === scene &&
      cam === camera &&
      renderer.getRenderTarget() === null
    ) {
      if (renderer.getPixelRatio() !== LQ.ratio) {
        LQ.ratio = renderer.getPixelRatio();
        LQ.composer.setPixelRatio(LQ.ratio);
        LQ.composer.setSize(innerWidth, innerHeight);
      }
      lightingApplyEnv(false);
      LQ.busy = true;
      try {
        LQ.composer.render();
      } finally {
        LQ.busy = false;
      }
      lightingGuard(performance.now());
      return;
    }
    if (s === scene) lightingApplyEnv(false);
    plain(s, cam);
  };
  addEventListener("resize", () => LQ.composer?.setSize(innerWidth, innerHeight));
  const b = document.createElement("button");
  b.id = "aoToggle";
  b.onclick = () => setAmbientOcclusion(!LQ.on);
  $("#worldPause .world-pause-small")?.append(b);
  setAmbientOcclusion(lightingDefault(), false);
}
// If the occlusion pass makes the game sluggish on this machine, drop it rather than the frame rate.
// WebGL work is asynchronous, so judge by the interval between consecutive frames, not the submit time.
function lightingGuard(now) {
  const gap = now - (LQ.last || 0);
  LQ.last = now;
  if (gap > 250 || navSetting("closed365-ao") === "on") return;
  LQ.frames++;
  if (gap > 55) LQ.slow++;
  if (LQ.frames >= 90) {
    if (LQ.slow > 60) {
      setAmbientOcclusion(false, false);
      showToast("这台设备渲染较慢，已自动关闭环境光遮蔽以保持流畅（暂停菜单可重新打开）。");
    }
    LQ.frames = LQ.slow = 0;
  }
}
// Time of day and weather, seen from a flat you never leave: the sun climbs from the left of the
// window to the right, its patch crawls across floor and walls, colour warms at the ends of the day,
// and some days are simply overcast. Deterministic per seed + day, so a reload shows the same sky.
function lightingSky() {
  const state = G && phase !== "title" ? G : null,
    h = state ? hour() : 10.5,
    smooth = (a, b, x) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
  const rise = 6.4,
    set = 18.6,
    light = smooth(rise - 0.9, rise + 0.7, h) * (1 - smooth(set - 0.7, set + 0.9, h)),
    arc = Math.min(1, Math.max(0, (h - rise) / (set - rise))),
    elev = Math.sin(arc * Math.PI) * 0.72,
    az = (arc - 0.5) * 2.2;
  const r = typeof fxRand === "function" ? fxRand(env.seed + "-sky-" + (state ? day() : 0))() : 0.5,
    overcast = state && day() > 1 ? r < 0.32 : false,
    hazy = !overcast && r < 0.5;
  const low = 1 - Math.min(1, elev / 0.5);
  return { h, light, elev, az, overcast, hazy, low };
}
// Daylight enters through the window as a soft area source: bright floor and reveals near the glass,
// falling off into the room, with the ceiling lit only by bounce. Replaces the old point-light "bounce".
function lightingWindow() {
  if (!R.ready || !roomRoot || W.store || !ROOM_TOOLS.RectAreaLightUniformsLib) return;
  const state = G && phase !== "title" ? G : null,
    night = state && (hour() < 6 || hour() > 18),
    closed = !!state?.curtains,
    blocked = typeof lvWindowBlocked === "function" && lvWindowBlocked(),
    back = -env.d / 2;
  // Area lights evaluate one-sided in world space; a mirrored (scale.x = -1) room would flip the emitter,
  // so the light lives in the scene and is positioned from the room's world transform.
  let area = LQ.area;
  if (!area) {
    if (!LQ.areaInit) {
      ROOM_TOOLS.RectAreaLightUniformsLib.init();
      LQ.areaInit = true;
    }
    area = LQ.area = new THREE.RectAreaLight("#e8eefa", 1, 2.55, 1.35);
    scene.add(area);
  }
  if (LQ.areaRoom !== roomRoot) {
    LQ.areaRoom = roomRoot;
    roomRoot.updateMatrixWorld(true);
    area.position.copy(roomRoot.localToWorld(new THREE.Vector3(0, 1.72, back + 0.07)));
    area.lookAt(roomRoot.localToWorld(new THREE.Vector3(0, 1.72, back + 3)));
  }
  area.visible = true;
  const S = (LQ.sky = lightingSky()),
    L = S.light;
  // Sky through the glass: blue-grey at night, warm at the ends of the day, flat white when overcast.
  const skyCol = new THREE.Color("#7e93b0").lerp(
    new THREE.Color(S.overcast ? "#e4e8ea" : "#e6edf9").lerp(new THREE.Color("#f6d2a8"), S.overcast ? 0 : S.low * 0.55),
    L,
  );
  area.color.copy(closed ? skyCol.clone().lerp(new THREE.Color("#f2dcc0"), 0.7) : skyCol);
  const skyLum = S.overcast ? 6.2 : 4 + 5 * Math.sin(Math.min(1, S.elev / 0.72) * Math.PI / 2);
  area.intensity = (0.25 + (skyLum - 0.25) * L) * (closed ? 0.3 : 1) * (blocked ? 0.035 : 1);
  // Direct sun: follows the arc, long low beams early and late, none on grey days.
  const mirror = env.mirror ? -1 : 1,
    dist = 7,
    sunScale = S.overcast ? 0.04 : S.hazy ? 0.6 : 1;
  sunLight.position.copy(
    roomRoot.localToWorld(
      new THREE.Vector3(Math.sin(S.az) * Math.cos(S.elev) * dist, 0.6 + Math.sin(Math.max(0.09, S.elev)) * dist, back - Math.cos(S.az) * Math.cos(S.elev) * dist),
    ),
  );
  sunLight.target.position.copy(roomRoot.localToWorld(new THREE.Vector3(0, 0.4, 0.6)));
  sunLight.target.updateMatrixWorld();
  sunLight.color.copy(new THREE.Color("#fff0da").lerp(new THREE.Color("#ffad66"), S.low * 0.85));
  if (!night) sunLight.intensity = (closed ? 0.18 : 3.3) * sunScale * L * (0.55 + 0.45 * (1 - S.low * 0.6)) * (blocked ? 0.02 : 1);
  if (R.city?.material) R.city.material.color.copy(new THREE.Color("#34445c").lerp(new THREE.Color(S.overcast ? "#dde0e2" : "#f3f5f9").lerp(new THREE.Color("#f2c9a0"), S.overcast ? 0 : S.low * 0.4), L));
  if (scene.background?.isColor) {
    scene.background.copy(new THREE.Color("#222c37").lerp(new THREE.Color(S.overcast ? "#c9cdcf" : "#c5ccd0"), L));
    scene.fog?.color.copy(scene.background);
  }
  void mirror;
  // The old bounce point sat right in front of the glass and showed as a hot spot in it; it now
  // stands in for light bounced off the floor onto the ceiling, a metre into the room.
  if (R.windowBounce) {
    R.windowBounce.position.set(0, 2.35, back + 1.5);
    R.windowBounce.distance = 7;
    R.windowBounce.intensity = (0.3 + 1.3 * L) * (closed ? 0.4 : 1) * (blocked ? 0.035 : 1);
  }
  LQ.envScale = (0.1 + 0.2 * L) * (closed ? 0.55 : 1) * (blocked ? 0.25 : 1);
  lightingApplyEnv(true);
  skyLight.intensity = 0.1 + 0.1 * L;
}
// three r160 ignores scene.environmentIntensity (added in r163), so the PMREM room environment was lighting
// every surface at full strength and flattening the room. Scale each material's envMapIntensity instead.
function lightingApplyEnv(force) {
  const now = performance.now();
  if (!force && now - (LQ.envAt || 0) < 900) return;
  LQ.envAt = now;
  const k = W.store || !roomRoot ? 1 : LQ.envScale ?? 1;
  if (LQ.area) LQ.area.visible = !W.store;
  scene.traverse((o) => {
    if (!o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || !("envMapIntensity" in m)) continue;
      if (m.userData.envBase === undefined) m.userData.envBase = m.envMapIntensity;
      // Metals have no diffuse term: they are only their reflections, so dim them far less.
      m.envMapIntensity = m.userData.envBase * (m.metalness > 0.5 ? Math.max(k, Math.min(1, k * 2.4)) : k);
    }
  });
}
const lightingPrevLight = roomLight;
roomLight = function () {
  lightingPrevLight();
  lightingWindow();
};
initLighting();
if (R.ready) roomLight();
