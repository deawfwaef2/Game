/* Street-view-style accessibility navigation. Local pathfinding, not a map service.
   It drives the same camera at walking speed; it never buys, uses, or teleports resources. */
const N = {
  mode: "free",
  root: null,
  nodes: [],
  grid: null,
  goal: null,
  path: [],
  index: 0,
  walking: false,
  turning: null,
  current: "",
  lastUI: 0,
  lastYaw: Infinity,
  lastPos: new THREE.Vector3(1e6, 0, 1e6),
  choices: {},
  lastLook: 0,
  startKnock: false,
  escape: null,
  distance: 0,
  enabled: !!W.enabled,
};
function navSetting(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {}
  return null;
}
function navPoint(x, z, y = 1.62) {
  const p = new THREE.Vector3(x, y, z);
  roomRoot.updateMatrixWorld(true);
  return roomRoot.localToWorld(p);
}
function navSafePoint(p, radius = 0.75) {
  if (canMove(p.x, p.z)) return p.clone();
  for (let r = 0.035; r <= radius; r += 0.035) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2,
        x = p.x + Math.cos(a) * r,
        z = p.z + Math.sin(a) * r;
      if (canMove(x, z)) return new THREE.Vector3(x, 1.62, z);
    }
  }
  return null;
}
function navLine(a, b) {
  if (!canMove(a.x, a.z) || !canMove(b.x, b.z)) return false;
  const dx = b.x - a.x,
    dz = b.z - a.z,
    rad = 0.19;
  // Analytic segment-vs-expanded-AABB test: sampled lines can miss a tiny corner cut.
  for (const c of colliders) {
    if (!(c.maxY > 0.25 && c.minY < 1.6)) continue;
    let enter = 0,
      leave = 1,
      possible = true;
    for (const [origin, d, min, max] of [
      [a.x, dx, c.minX - rad, c.maxX + rad],
      [a.z, dz, c.minZ - rad, c.maxZ + rad],
    ]) {
      if (Math.abs(d) < 1e-12) {
        if (origin <= min || origin >= max) {
          possible = false;
          break;
        }
        continue;
      }
      let t0 = (min - origin) / d,
        t1 = (max - origin) / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      enter = Math.max(enter, t0);
      leave = Math.min(leave, t1);
      if (enter >= leave) {
        possible = false;
        break;
      }
    }
    if (possible && leave > 1e-9 && enter < 1 - 1e-9 && leave - enter > 1e-9)
      return false;
  }
  return true;
}

function navBuildGrid() {
  const bounds = worldBounds(),
    step = 0.18,
    minX = -bounds.w / 2 + 0.25,
    minZ = -bounds.d / 2 + 0.25;
  const cols = Math.floor((bounds.w - 0.5) / step) + 1,
    rows = Math.floor((bounds.d - 0.5) / step) + 1,
    free = new Uint8Array(cols * rows);
  for (let z = 0; z < rows; z++)
    for (let x = 0; x < cols; x++)
      free[z * cols + x] = canMove(minX + x * step, minZ + z * step) ? 1 : 0;
  return { cols, rows, step, minX, minZ, free };
}
function navCellPoint(index, g = N.grid) {
  return new THREE.Vector3(
    g.minX + (index % g.cols) * g.step,
    1.62,
    g.minZ + Math.floor(index / g.cols) * g.step,
  );
}
function navCell(p) {
  const g = N.grid,
    x = Math.round((p.x - g.minX) / g.step),
    z = Math.round((p.z - g.minZ) / g.step),
    candidates = [];
  for (let dz = -3; dz <= 3; dz++)
    for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx,
        zz = z + dz;
      if (xx < 0 || zz < 0 || xx >= g.cols || zz >= g.rows) continue;
      const i = zz * g.cols + xx;
      if (!g.free[i]) continue;
      const point = navCellPoint(i);
      candidates.push({ i, point, d: point.distanceToSquared(p) });
    }
  candidates.sort((a, b) => a.d - b.d);
  return candidates.find((c) => navLine(p, c.point))?.i ?? -1;
}
class NavHeap {
  constructor() {
    this.a = [];
  }
  push(item) {
    const a = this.a;
    let i = a.length;
    a.push(item);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= item.f) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.a,
      first = a[0],
      last = a.pop();
    if (a.length) {
      let i = 0;
      while (true) {
        let c = i * 2 + 1;
        if (c >= a.length) break;
        if (c + 1 < a.length && a[c + 1].f < a[c].f) c++;
        if (a[c].f >= last.f) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = last;
    }
    return first;
  }
}
function navPlan(from, to) {
  if (!N.grid) return null;
  let start = from.clone(),
    escape = null;
  if (!canMove(start.x, start.z)) {
    // Recover only tiny overlaps from old saves / floating point spawn boundaries.
    escape = navSafePoint(start, 0.09);
    if (!escape) return null;
    start = escape;
  }
  if (!canMove(to.x, to.z)) return null;
  if (navLine(start, to))
    return { points: [...(escape ? [escape] : []), to.clone()], escape };
  const g = N.grid,
    s = navCell(start),
    end = navCell(to);
  if (s < 0 || end < 0) return null;
  const count = g.free.length,
    cost = new Float64Array(count);
  cost.fill(Infinity);
  const prev = new Int32Array(count);
  prev.fill(-1);
  const seen = new Uint8Array(count),
    open = new NavHeap();
  const ex = end % g.cols,
    ez = Math.floor(end / g.cols),
    h = (i) => Math.hypot((i % g.cols) - ex, Math.floor(i / g.cols) - ez);
  cost[s] = 0;
  open.push({ i: s, f: h(s) });
  while (open.a.length) {
    const { i } = open.pop();
    if (seen[i]) continue;
    seen[i] = 1;
    if (i === end) break;
    const x = i % g.cols,
      z = Math.floor(i / g.cols);
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const xx = x + dx,
          zz = z + dz;
        if (xx < 0 || zz < 0 || xx >= g.cols || zz >= g.rows) continue;
        const j = zz * g.cols + xx;
        if (!g.free[j] || seen[j]) continue;
        if (dx && dz && (!g.free[z * g.cols + xx] || !g.free[zz * g.cols + x]))
          continue;
        const c = cost[i] + (dx && dz ? Math.SQRT2 : 1);
        if (c >= cost[j]) continue;
        cost[j] = c;
        prev[j] = i;
        open.push({ i: j, f: c + h(j) });
      }
  }
  if (!seen[end]) return null;
  const path = [];
  let i = end;
  while (i !== s && i >= 0) {
    path.push(navCellPoint(i));
    i = prev[i];
  }
  path.push(navCellPoint(s));
  path.reverse();
  path.push(to.clone());
  const smooth = [...(escape ? [escape] : [])];
  let anchor = start,
    k = 0;
  while (k < path.length) {
    let far = k;
    while (far + 1 < path.length && navLine(anchor, path[far + 1])) far++;
    smooth.push(path[far]);
    anchor = path[far];
    k = far + 1;
  }
  return { points: smooth, escape };
}
function navRefreshLayout() {
  navStop(false);
  N.root = roomRoot;
  N.nodes = [];
  N.current = "";
  N.grid = navBuildGrid();
  const add = (id, name, x, z, target, focus) => {
    const desired = worldIsShopping()
      ? new THREE.Vector3(x, 1.62, z)
      : navPoint(x, z);
    const point = navSafePoint(desired);
    if (!point) return;
    N.nodes.push({
      id,
      name,
      point,
      target,
      focus: focus
        ? worldIsShopping()
          ? new THREE.Vector3(...focus)
          : navPoint(focus[0], focus[2], focus[1])
        : null,
    });
  };
  if (worldIsShopping()) {
    add("shop-entry", "商店入口", 0, 4.55, null, [0, 1.2, 0]);
    add("checkout", "收银台", -2.8, 3.1, "shopCheckout", [-3, 1.16, 4.58]);
    add("kits", "开局配给单", -5.2, 1.6, "kit:starter", [-5.2, 0.32, 3.243]);
    add(
      "year-plan",
      "全年配给单",
      -3.72,
      1.6,
      "kit:year",
      [-3.72, 0.32, 3.243],
    );
    const bays = [
      ["staple", "主食货架", -5.15, -5.35],
      ["canned", "罐头货架", -2.58, -5.35],
      ["fresh", "鲜食货架", 0, -5.35],
      ["drink", "饮品货架", 2.58, -5.35],
      ["hygiene", "护理货架", 5.15, -5.35],
      ["clean", "清洁货架", -4.85, -0.3],
      ["tool", "工具货架", -2.45, -0.3],
      ["medical", "药品货架", 2.45, -0.3],
      ["leisure", "读物货架", 4.85, -0.3],
    ];
    for (const [id, name, x, z] of bays)
      add(id, name, x, z + 1.28, null, [x, 1.1, z + 0.18]);
    add("furniture", "大件货架", 5.05, 2.78, null, [6.35, 1.1, 2.78]);
  } else {
    const w = env.w,
      d = env.d,
      b = -d / 2,
      f = d / 2;
    add("entry", "门口", -0.3, f - 1.15, "door", [-0.35, 1.55, f - 0.14]);
    add("center", "房间中央", -0.05, 0.12, null, [-0.28, 1.25, b + 0.6]);
    add("bed", "床边", -w / 2 + 1.93, -0.15, "bed", [
      -w / 2 + 0.9,
      0.55,
      -0.25,
    ]);
    add("desk", "书桌", -0.25, b + 1.62, "desk", [-0.55, 0.85, b + 0.71]);
    add("kitchen", "厨房水槽", w / 2 - 1.4, b + 1.75, "sink", [
      w / 2 - 1.59,
      0.95,
      b + 0.57,
    ]);
    add("stove", "电炉", w / 2 - 0.62, b + 1.55, "stove", [
      w / 2 - 0.36,
      0.95,
      b + 0.4,
    ]);
    add("pantry", "储物架", w / 2 - 1.35, 0.2, "pantry", [
      w / 2 - 0.24,
      0.92,
      0.41,
    ]);
    if (env.fridge)
      // Stand in front of the door (it faces into the room), slightly off the hinge side.
      add("fridge", "冰箱前", w / 2 - 1.55, -0.62, "fridge", [
        w / 2 - 0.41,
        0.95,
        -0.72,
      ]);
    add("bath", "卫生间", w / 2 - 1.1, f - 1.35, "toilet", [
      w / 2 - 0.49,
      0.48,
      f - 0.55,
    ]);
    add("wardrobe", "衣柜前", -w / 2 + 1.65, f - 1.6, "wardrobe", [
      -w / 2 + 1.65,
      0.9,
      f - 0.66,
    ]);
    add("sofa", "沙发边", -w / 2 + 1.55, f - 1.2, "sofa", [
      -w / 2 + 0.6,
      0.55,
      f - 1.14,
    ]);
  }
  N.lastYaw = Infinity;
  navRender(true);
}
function navStop(message = false) {
  const was = N.walking;
  N.walking = false;
  N.path = [];
  N.goal = null;
  N.turning = null;
  N.escape = null;
  if (message && was)
    showToast(typeof message === "string" ? message : "已停下，仍在当前位置。");
  N.lastYaw = Infinity;
  N.lastUI = 0;
}
function navSetMode(mode, remember = true) {
  if (!N.enabled) return false;
  navStop(false);
  N.mode = mode === "street" ? "street" : "free";
  releasePointer();
  if (remember) navSetting("closed365-navigation", N.mode);
  document.body.classList.toggle("nav-street", N.mode === "street");
  navRender(true);
  return true;
}
function navGo(id) {
  if (
    !N.enabled ||
    N.mode !== "street" ||
    !worldVisible() ||
    paused ||
    panelType ||
    W.busy ||
    W.glance
  )
    return false;
  if (N.root !== roomRoot) navRefreshLayout();
  const node = N.nodes.find((x) => x.id === id);
  if (!node) return false;
  const plan = navPlan(camera.position, node.point);
  if (!plan) {
    showToast("这条路线被家具挡住了，试试另一个箭头，或切回自由行走。", "warn");
    return false;
  }
  N.goal = node;
  N.path = plan.points;
  N.escape = plan.escape;
  N.index = 0;
  N.walking = true;
  N.turning = null;
  N.startKnock = !!G?.pendingKnock;
  N.startWarning = phase === "playing" ? safeReason("idle") : "";
  keys = {};
  mobileStick = { active: false, x: 0, y: 0 };
  N.lastUI = 0;
  sceneDirty = true;
  navRender(true);
  return true;
}
function navAim(node) {
  const focus = node.focus;
  if (!focus) return;
  const dx = focus.x - camera.position.x,
    dz = focus.z - camera.position.z;
  N.turning = {
    yaw: Math.atan2(-dx, -dz),
    pitch: clamp(
      Math.atan2(focus.y - camera.position.y, Math.hypot(dx, dz)),
      -1.2,
      1.2,
    ),
  };
}
function navAngle(a, b) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}
function navFrame(now, dt) {
  if (!N.enabled) return;
  const visible = worldVisible();
  if (N.root !== roomRoot && roomRoot) navRefreshLayout();
  if (N.walking) {
    if (!visible || paused || panelType || W.busy || W.glance || G?.ended) {
      navStop(false);
    } else if (phase === "playing" && !N.startKnock && G?.pendingKnock) {
      navStop("门外传来声音，先停下了。你可以再选方向。");
    } else if (phase === "playing" && !N.startWarning && safeReason("idle")) {
      navStop("身体需要照顾，先停下。可以再选箭头走向生活设施。");
    } else {
      let remaining = Math.min(dt, 0.1) * 1.24 * (G?.illness?.some((i) => i.id === "sprain") ? 0.82 : 1);
      while (remaining > 0 && N.index < N.path.length) {
        const p = N.path[N.index],
          dx = p.x - camera.position.x,
          dz = p.z - camera.position.z,
          distance = Math.hypot(dx, dz);
        if (distance < 0.008) {
          camera.position.x = p.x;
          camera.position.z = p.z;
          N.index++;
          continue;
        }
        const step = Math.min(remaining, distance),
          x = camera.position.x + (dx / distance) * step,
          z = camera.position.z + (dz / distance) * step;
        const escaping = N.escape && N.index === 0;
        if (!canMove(x, z) && !escaping) {
          navStop("前面有家具，已安全停下。");
          break;
        }
        camera.position.x = x;
        camera.position.z = z;
        remaining -= step;
        if (now - N.lastLook > 1200) {
          const yaw = Math.atan2(-dx, -dz);
          lookYaw += navAngle(lookYaw, yaw) * Math.min(1, dt * 3.5);
          lookPitch = THREE.MathUtils.damp(lookPitch, -0.065, 3, dt);
        }
        if (step >= distance - 0.001) N.index++;
      }
      if (N.walking && N.index >= N.path.length) {
        const goal = N.goal;
        N.walking = false;
        N.path = [];
        N.goal = null;
        N.current = goal.id;
        N.escape = null;
        navAim(goal);
        N.lastYaw = Infinity;
      }
      sceneDirty = true;
    }
  }
  if (N.turning && !paused && worldVisible() && !W.busy) {
    if (now - N.lastLook < 500) N.turning = null;
    else {
      const dy = navAngle(lookYaw, N.turning.yaw),
        dp = N.turning.pitch - lookPitch;
      lookYaw += dy * Math.min(1, dt * 7);
      lookPitch += dp * Math.min(1, dt * 7);
      if (Math.abs(dy) + Math.abs(dp) < 0.008) N.turning = null;
      sceneDirty = true;
    }
  }
  if (camera && N.mode === "street" && visible) {
    camera.rotation.set(lookPitch, lookYaw, 0);
    camera.position.y = worldEyeHeight();
  }
  if (now - N.lastUI > 200) navRender();
}
function navRender(force = false) {
  const modeButton = $("#navModeToggle");
  if (!modeButton) return;
  const visible = N.enabled && worldVisible() && !paused && !panelType;
  modeButton.hidden = !visible;
  modeButton.textContent =
    N.mode === "street" ? "定点移动 ⇄ 自由" : "自由行走 ⇄ 定点";
  modeButton.setAttribute("aria-pressed", String(N.mode === "street"));
  const active = visible && N.mode === "street" && !W.busy && !W.glance;
  $("#navEdges").hidden = !active;
  $("#navJourney").hidden = !(visible && N.walking);
  if (N.walking) {
    let d = 0,
      p = camera.position;
    for (let i = N.index; i < N.path.length; i++) {
      d += Math.hypot(N.path[i].x - p.x, N.path[i].z - p.z);
      p = N.path[i];
    }
    $("#navJourney span").textContent =
      `走向${N.goal.name} · ${d.toFixed(1)}米`;
  }
  const now = performance.now();
  N.lastUI = now;
  if (!active) return;
  if (
    !force &&
    !N.walking &&
    Math.abs(navAngle(N.lastYaw, lookYaw)) < 0.14 &&
    camera.position.distanceToSquared(N.lastPos) < 0.01
  )
    return;
  if (N.walking) {
    for (const b of $$("#navEdges button")) b.disabled = true;
    return;
  }
  N.lastYaw = lookYaw;
  N.lastPos.copy(camera.position);
  const forward = new THREE.Vector3(-Math.sin(lookYaw), 0, -Math.cos(lookYaw)),
    right = new THREE.Vector3(Math.cos(lookYaw), 0, -Math.sin(lookYaw));
  const sectors = { up: [], right: [], down: [], left: [] };
  for (const node of N.nodes) {
    const v = node.point.clone().sub(camera.position);
    v.y = 0;
    const d = v.length();
    if (d < 0.36) continue;
    const angle = Math.atan2(v.dot(right), v.dot(forward));
    const dir =
      Math.abs(angle) < Math.PI / 4
        ? "up"
        : angle >= Math.PI / 4 && angle < Math.PI * 0.75
          ? "right"
          : angle <= -Math.PI / 4 && angle > -Math.PI * 0.75
            ? "left"
            : "down";
    sectors[dir].push({ node, score: d * (node.id === "center" ? 0.85 : 1) });
  }
  N.choices = {};
  for (const dir of Object.keys(sectors)) {
    const list = sectors[dir].sort((a, b) => a.score - b.score);
    let node = null;
    for (const candidate of list.slice(0, 5)) {
      if (navPlan(camera.position, candidate.node.point)) {
        node = candidate.node;
        break;
      }
    }
    N.choices[dir] = node?.id || null;
    const b = $(`#navEdges [data-nav="${dir}"]`);
    b.disabled = !node;
    b.querySelector("small").textContent = node?.name || "无通路";
    b.setAttribute(
      "aria-label",
      node ? "自动走到" + node.name : "这个方向没有通路",
    );
  }
}
function initNavigation() {
  if (!N.enabled) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `<button id="navModeToggle" hidden title="V 切换自由行走/定点移动" aria-pressed="false"></button>
  <nav id="navEdges" hidden aria-label="定点移动方向"><button data-nav="up" class="nav-up"><b>↑</b><small>前方</small></button><button data-nav="left" class="nav-left"><b>←</b><small>左侧</small></button><button data-nav="right" class="nav-right"><b>→</b><small>右侧</small></button><button data-nav="down" class="nav-down"><b>↓</b><small>后方</small></button></nav>
  <div id="navJourney" hidden role="status"><span></span><button aria-label="停下自动行走">停</button></div>`,
  );
  $("#navModeToggle").onclick = () => {
    navSetMode(N.mode === "street" ? "free" : "street");
    showToast(
      N.mode === "street"
        ? "点四边箭头自动走路；拖动画面仍可环顾。V可切回自由行走。"
        : "自由行走：WASD或左侧摇杆，位置不会重置。",
    );
  };
  $$("#navEdges button").forEach(
    (b) => (b.onclick = () => navGo(N.choices[b.dataset.nav])),
  );
  $("#navJourney button").onclick = () => navStop(true);
  const saved = navSetting("closed365-navigation"),
    mobile = matchMedia("(pointer:coarse), (max-width:700px)").matches;
  navSetMode(
    saved === "street" || (!saved && mobile) ? "street" : "free",
    false,
  );
}
const navOldFreeMovement = freeMovement,
  navOldFrame = worldFrame,
  navOldLook = lookBy,
  navOldKey = handleWorldKey,
  navOldPause = worldPause,
  navOldTitle = toTitle,
  navOldLoad = loadState,
  navOldInteract = worldInteract;
freeMovement = function (dt) {
  if (!N.enabled || N.mode !== "street") return navOldFreeMovement(dt);
  const oldKeys = keys,
    oldStick = mobileStick;
  keys = {};
  mobileStick = { active: false, x: 0, y: 0 };
  try {
    return navOldFreeMovement(dt);
  } finally {
    keys = oldKeys;
    mobileStick = oldStick;
  }
};
worldFrame = function (now, dt) {
  navFrame(now, dt);
  navOldFrame(now, dt);
};
lookBy = function (dx, dy) {
  if (dx || dy) N.lastLook = performance.now();
  return navOldLook(dx, dy);
};
handleWorldKey = function (e) {
  if (
    N.enabled &&
    e.code === "KeyV" &&
    worldVisible() &&
    !paused &&
    !panelType &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
  ) {
    e.preventDefault();
    if (!e.repeat) navSetMode(N.mode === "street" ? "free" : "street");
    return true;
  }
  return navOldKey(e);
};
worldPause = function (open = !W.pauseOpen) {
  if (open) navStop(false);
  return navOldPause(open);
};
toTitle = function () {
  navStop(false);
  return navOldTitle();
};
loadState = function (s) {
  navStop(false);
  return navOldLoad(s);
};
worldInteract = function (shift = false) {
  if (N.walking) navStop(false);
  return navOldInteract(shift);
};
initNavigation();
