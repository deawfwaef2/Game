/* Interface, controls and accessible non-WebGL action fallback. */
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) => "E$ " + Number(n).toFixed(2);
let qte = { active: false, uid: null, start: 0, pos: 0, frame: 0 },
  lastFocused = null;
function showToast(text, type = "info") {
  const el = document.createElement("div");
  el.className = "game-toast " + (type === "warn" ? "warn" : "");
  el.textContent = text;
  $("#toastContainer").append(el);
  while ($("#toastContainer").children.length > 3)
    $("#toastContainer").firstChild.remove();
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 350);
  }, 4400);
}
function productArt(it) {
  const palette = {
    staple: ["#bbad79", "#6a6947"],
    canned: ["#a8ad89", "#788163"],
    fresh: ["#8f9b6a", "#5b7552"],
    drink: ["#a8b3a0", "#617b68"],
    hygiene: ["#c2c5a1", "#7b8e6a"],
    clean: ["#a8bd9e", "#607953"],
    medical: ["#c8bea1", "#9a8163"],
    tool: ["#b1b5a1", "#6f7d69"],
    leisure: ["#a4ad87", "#5d7053"],
    furniture: ["#bdac86", "#7e7056"],
  };
  const [a, b] = palette[it.category] || palette.tool;
  let shape = "";
  if (it.kind === "book")
    shape = `<path d="M19 9h40v61H19z" fill="${b}"/><path d="M23 9h3v61h-3z" fill="${a}"/><path d="M29 15h25v48H29z" fill="${a}" opacity=".35"/><path d="M32 28h19m-19 5h16m-16 5h17" stroke="${a}" stroke-width="1"/><path d="M20 65h38v4H20z" fill="#d0c8a6"/>`;
  else if (it.category === "canned")
    shape = `<ellipse cx="40" cy="19" rx="21" ry="7" fill="${a}"/><path d="M19 19v43c0 9 42 9 42 0V19" fill="${b}"/><path d="M20 31h40v23H20z" fill="${a}"/><ellipse cx="40" cy="19" rx="21" ry="7" fill="${a}" stroke="${b}"/><path d="M36 16h9v4h-9z" fill="${b}"/><path d="M28 41h24m-20 5h15" stroke="${b}" stroke-width="1.5"/>`;
  else if (
    it.category === "drink" ||
    ["soap", "shampoo", "dishsoap", "disinfect"].includes(it.id)
  )
    shape = `<path d="M32 10h16v10l9 12v31q0 7-8 7H31q-8 0-8-7V32l9-12Z" fill="${a}"/><rect x="30" y="8" width="20" height="7" rx="2" fill="${b}"/><path d="M24 38h32v19H24z" fill="${b}"/><path d="M32 44h16m-16 5h11" stroke="${a}" stroke-width="1.4"/><path d="M27 30v30" stroke="#eceacb" stroke-width="2" opacity=".18"/>`;
  else if (it.category === "fresh")
    shape = `<ellipse cx="40" cy="46" rx="23" ry="22" fill="${b}"/><ellipse cx="31" cy="41" rx="13" ry="18" fill="${a}"/><path d="M40 25V13m0 5c13-12 19-7 14 1-5 4-11 0-14-1" fill="${a}" stroke="${b}" stroke-width="2"/>`;
  else if (it.category === "medical")
    shape = `<rect x="19" y="15" width="42" height="53" rx="3" fill="${a}"/><path d="M19 23h42" stroke="${b}"/><path d="M35 34h10v8h8v10h-8v8H35v-8h-8V42h8z" fill="${b}"/>`;
  else if (it.category === "furniture")
    shape = `<path d="M16 29h48v11H16zM21 40h5v28h-5zm33 0h5v28h-5z" fill="${b}"/><path d="M22 13h36v18H22z" fill="${a}"/><path d="M25 16h30v12H25z" fill="${b}" opacity=".25"/>`;
  else if (it.category === "staple")
    shape = `<path d="m22 13 8-4h21l8 4-2 11 7 40q0 7-8 7H24q-8 0-8-7l7-40Z" fill="${a}"/><path d="M22 13h37l-2 8H23z" fill="${b}"/><path d="M23 33h34v24H23z" fill="${b}"/><path d="M30 39h20m-20 6h16m-16 5h18" stroke="${a}" stroke-width="1"/><path d="m24 60 6 6m27-6-6 6" stroke="${b}" opacity=".5"/>`;
  else
    shape = `<rect x="18" y="20" width="44" height="45" rx="3" fill="${b}"/><path d="M25 20V10h30v10" fill="none" stroke="${a}" stroke-width="4"/><rect x="23" y="27" width="34" height="29" rx="2" fill="${a}"/><path d="M32 36h16m-8-8v24" stroke="${b}" stroke-width="3"/>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${shape}</svg>`;
}
function updateSeed() {
  currentSeed = $("#seedInput").value.trim() || "ANDERS-1986";
  env = environment(currentSeed);
  $("#seedFacts").innerHTML =
    `<span>${(env.w * env.d).toFixed(0)}㎡ · ${env.mirror ? "反向" : "标准"}户型</span><span>${env.fridge ? "旧冰箱" : "无冰箱"}</span><span>床 ${"Ⅰ".repeat(env.bed)}</span><span>${env.temp}°C</span>`;
  $("#roomCaption").textContent =
    `北区旧公寓 / ${env.floor}层 / ${env.number}室`;
  if (scene && roomRoot?.userData.seed !== currentSeed) buildRoom(env);
}
function updatePhase() {
  releasePointer();
  $("#titleScreen").hidden = phase !== "title";
  $("#shopScreen").hidden = phase !== "shop";
  $("#hud").hidden = phase !== "playing";
  $("#endScreen").hidden = phase !== "end";
  $("#continueButton").disabled = !getSave();
  if (phase === "title") {
    setCinematic();
    $("#pauseBanner").hidden = true;
  }
  if (phase === "playing") $("#pauseBanner").hidden = !paused;
}
function openShop(isRestock = false) {
  restock = isRestock;
  shopCategory = "all";
  shopQuery = "";
  cart = {};
  $("#shopSearch").value = "";
  phase = "shop";
  closePanel();
  releasePointer();
  $("#shopBudgetLabel").textContent = restock ? "剩余纸币" : "可用纸币";
  $("#shopIntroText").textContent = restock
    ? "地下投递：商品加价15%，每单配送费2纸币，抵达需2小时，暴露风险+4。不要把联络当成绝对安全。"
    : "这些物资将在你藏匿前搬入公寓。价格按虚构1980年代平价配给设定，1纸币≈1美元面值。";
  $("#checkoutButton").innerHTML =
    `<span>${restock ? "确认地下补给" : "把物资带回房间"}</span><span>→</span>`;
  $("#catalogCount").textContent = CATALOG.length + "件";
  renderCategories();
  renderCatalog();
  renderReceipt();
  updatePhase();
}
function showProduct(id) {
  const it = DB[id];
  if (!it) return;
  const description =
    it.desc ||
    (it.kind === "food"
      ? it.cook
        ? "需要热源和少量水烹煮。开启包装后注意收纳，搭配不同口味有助于精神。"
        : "可直接食用，按份数消耗。免煮食物适合停电时应急。"
      : it.kind === "book"
        ? "可按页阅读并重读。读完之后，新鲜感与精神收益会逐渐降低。"
        : it.kind === "drink"
          ? "按份取用，及时补水。冲泡饮品需要水和合适热源。"
          : "解包后放入对应生活分区；在家务或个人护理面板中使用。");
  showPanel(
    "product",
    it.name,
    "COOPERATIVE / PRODUCT DETAILS",
    `<div class="product-detail-art">${productArt(it)}</div><div class="stat-grid"><div class="stat-tile"><span>单件价格</span><strong>${it.price.toFixed(2)}<small>纸币</small></strong><p>地下投递另外加价</p></div><div class="stat-tile"><span>单件重量</span><strong>${it.weight}<small>kg</small></strong><p>${it.bulky ? "大件独立包装" : "按8kg承重分袋"}</p></div><div class="stat-tile"><span>${it.kind === "book" ? "总页数" : "份数 / 次数"}</span><strong>${it.kind === "book" ? it.pages : it.servings}</strong><p>${it.life < 9999 ? "常温标示保质期" + it.life + "天" : "可长期保存"}</p></div></div><p class="panel-intro">${description}${it.kcal ? "<br>每份约" + it.kcal + "kcal，包装合计约" + it.kcal * it.servings + "kcal。" : ""}${it.capacity ? "<br>容器容量" + it.capacity + "L，需先在水槽装水。" : ""}</p>${phase === "shop" ? `<button class="full-button gold" data-cart="${it.id}" data-delta="1">加入一件采购单 · ${money(it.price * (restock ? 1.15 : 1))}</button>` : ""}<p class="panel-note">保质期按游戏时间结算；现实中关掉页面不会消耗物资。页面中的药品与健康效果均为虚构游戏机制。</p>`,
  );
}
function renderCategories() {
  $("#categoryList").innerHTML = CATEGORIES.map(
    ([id, name]) =>
      `<button class="category-button ${id === shopCategory ? "active" : ""}" data-category="${id}">${name}<span>${id === "all" ? CATALOG.length : CATALOG.filter((i) => i.category === id).length}</span></button>`,
  ).join("");
}
function renderCatalog() {
  const list = CATALOG.filter(
    (it) =>
      (shopCategory === "all" || it.category === shopCategory) &&
      (!shopQuery ||
        it.name.toLowerCase().includes(shopQuery.toLowerCase()) ||
        (it.desc || "").includes(shopQuery)),
  );
  $("#shopEmpty").hidden = !!list.length;
  $("#catalogGrid").innerHTML = list
    .map((it) => {
      const q = cart[it.id] || 0;
      const meta =
        it.kind === "food"
          ? `${it.servings}份 · ${it.kcal} kcal/份`
          : it.kind === "book"
            ? `${it.pages}页 · 可重读`
            : it.servings > 1
              ? `${it.servings}次用量`
              : "耐用物品";
      return `<article class="product-card ${q ? "in-cart" : ""}" title="${esc(it.desc || it.name)}"><button class="product-art" data-product="${it.id}" aria-label="查看${esc(it.name)}详情">${productArt(it)}</button><h3>${it.name}</h3><div class="product-meta"><span>${it.weight.toFixed(it.weight < 1 ? 2 : 1)}kg</span><span>${meta}</span>${it.life < 9999 ? `<span>${it.life}天${it.cook ? " · 需烹煮" : ""}</span>` : ""}</div><div class="product-footer"><span class="product-price"><small>E$</small>${(it.price * (restock ? 1.15 : 1)).toFixed(2)}</span><div class="qty-control"><button data-cart="${it.id}" data-delta="-1" aria-label="减少${it.name}">−</button><span>${q}</span><button data-cart="${it.id}" data-delta="1" aria-label="添加${it.name}">＋</button></div></div></article>`;
    })
    .join("");
}
function renderReceipt() {
  const s = cartSummary(cart, restock),
    budget = restock ? G.cash : 300;
  $("#shopBudget").innerHTML =
    Math.floor(budget - s.cost) +
    `<small>.${Math.round((budget - s.cost - Math.floor(budget - s.cost)) * 100)
      .toString()
      .padStart(2, "0")}</small>`;
  $("#receiptList").innerHTML = s.count
    ? Object.entries(cart)
        .filter(([id, q]) => q > 0)
        .map(
          ([id, q]) =>
            `<div class="receipt-row"><span>${DB[id].name}</span><small>×${q}</small><strong>${(DB[id].price * q * (restock ? 1.15 : 1)).toFixed(2)}</strong><button data-cart="${id}" data-delta="-1" aria-label="减少${DB[id].name}">−</button></div>`,
        )
        .join("")
    : '<p class="receipt-empty">空空的采购单。<br>先想想，明天需要什么。</p>';
  const warning = [];
  if (s.count && !cart.soap) warning.push("别忘记清洁用品");
  if (s.count && !Object.keys(cart).some((id) => DB[id].kind === "book"))
    warning.push("准备一点精神食粮");
  if (s.days < 12 && s.count) warning.push("热量储备偏少");
  if (s.cost > budget) warning.push("超过可用纸币");
  $("#receiptSummary").innerHTML =
    `<p><span>商品件数 / 总重量</span><b>${s.count}件 / ${s.weight.toFixed(1)}kg</b></p><p><span>袋装 / 大件独立箱</span><b>${s.bags.length}袋 / ${s.crates.length}箱</b></p><p><span>理论热量储备</span><b>约${s.days}天</b></p><p><span>包装费${restock ? "与配送费" : ""}</span><b>${money(s.bags.length * 0.06 + (restock ? 2 : 0))}</b></p>${warning.length ? `<span class="purchase-warning">△ ${warning.join(" · ")}</span>` : ""}`;
  $("#cartTotal").textContent = money(s.cost);
  $(".receipt-total").classList.toggle("over", s.cost > budget);
  $("#checkoutButton").disabled = s.cost > budget || s.count === 0;
}
function changeCart(id, delta) {
  cart[id] = Math.max(0, Math.min(100, (cart[id] || 0) + delta));
  if (!cart[id]) delete cart[id];
  renderCatalog();
  renderReceipt();
}
function applyKit(which) {
  if (Object.keys(cart).length && !confirmInline("replace-kit", which)) return;
  cart = { ...(which === "year" ? YEAR_KIT : STARTER) };
  const budget = restock ? G.cash : 300;
  // Never create an unpayable automatic recommendation. Trim bulk first, not essential tools.
  let safety = 0;
  while (cartSummary(cart, restock).cost > budget && safety++ < 1500) {
    const candidate = Object.keys(cart)
      .filter((id) => cart[id] > 1)
      .sort((a, b) => cart[b] * DB[b].price - cart[a] * DB[a].price)[0];
    if (!candidate) break;
    cart[candidate]--;
  }
  renderCatalog();
  renderReceipt();
  notify(
    which === "year"
      ? "全年清单已加入。只是热量估计，不保证疾病、保质期与精神需求；请检查并自行调整。"
      : "基础清单已加入，仍可自由增减。",
  );
}
let confirmToken = "";
function confirmInline(type, value) {
  const t = type + value;
  if (confirmToken === t) {
    confirmToken = "";
    return true;
  }
  confirmToken = t;
  notify("再次点击以替换当前采购单。", "warn");
  setTimeout(() => {
    if (confirmToken === t) confirmToken = "";
  }, 4000);
  return false;
}
function renderHUD() {
  if (!G) return;
  $("#hudDay").textContent = String(Math.min(365, day())).padStart(3, "0");
  const h = Math.floor(hour()),
    m = Math.floor(G.minute % 60);
  $("#hudClock").textContent =
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} · ${["初春", "暮春", "盛夏", "晚夏", "初秋", "深秋", "入冬", "严冬"][Math.floor((day() - 1) / 46) % 8]}`;
  $("#hudCash").textContent = money(G.cash);
  $("#hudRoomNumber").textContent = "APT. " + env.number;
  $("#hudSeed").textContent = G.seed;
  $("#needsGrid").innerHTML = NEEDS.map(
    ([key, label]) =>
      `<div class="need-cell ${G.stats[key] < 25 ? "danger" : ""}" title="${label}：${Math.round(G.stats[key])}/100，越高越好"><div class="need-label"><span>${label}</span><strong>${Math.round(G.stats[key])}</strong></div><div class="need-track"><span style="width:${clamp(G.stats[key])}%"></span></div></div>`,
  ).join("");
  $("#bodyNeeds").innerHTML =
    `<span class="${G.bladder > 78 ? "urgent" : ""}">小便 ${Math.round(G.bladder)}%</span><span class="${G.bowel > 78 ? "urgent" : ""}">大便 ${Math.round(G.bowel)}%</span><span class="${G.dirt > 60 ? "urgent" : ""}">房间整洁 ${Math.round(100 - G.dirt)}%</span>`;
  $("#serviceBar").innerHTML =
    `<span>室温 ${temperature()}°C</span><span class="${G.power ? "" : "service-warning"}"><i class="service-dot ${G.power ? "" : "off"}"></i>${G.power ? "电力正常" : "停电中"}</span><span class="${G.waterOn ? "" : "service-warning"}"><i class="service-dot ${G.waterOn ? "" : "off"}"></i>${G.waterOn ? "供水正常" : "停水中"}</span>`;
  const buffs = G.illness.map(
    (i) =>
      `<div class="buff-tag warn">${DISEASES[i.id]?.name || "不适"} · 约${Math.ceil(i.remaining / 60)}小时</div>`,
  );
  if (G.pendingKnock)
    buffs.push(
      '<button class="buff-tag warn" data-station="door">门外有人敲门 · 查看</button>',
    );
  if (!G.curtains && hour() > 18)
    buffs.push('<div class="buff-tag warn">夜间开帘 · 暴露风险上升</div>');
  if (G.sleepToday > 9)
    buffs.push('<div class="buff-tag">过度睡眠 · 精神消耗增加</div>');
  if (day() > 30)
    buffs.push('<div class="buff-tag">长期独处 · 留意精神消耗</div>');
  $("#buffs").innerHTML = buffs.join("");
  const warnings = getWarnings();
  $("#hudHint").innerHTML =
    `<span class="hint-line"></span>${countPackages() ? "物资还没拆完。先整理好，再开始生活。" : warnings.length ? warnings.slice(0, 3).join(" · ") : "照顾好今天。远处的365天，会慢慢靠近。"}`;
  $("#hudMotto").textContent = G.pendingKnock
    ? "保持安静。不要急着开门。"
    : day() > 300
      ? "你离自由，已经不远。"
      : "门外的世界，还不属于你。";
}
function renderJournalBadge() {}
function showPanel(type, title, sub, html, wide = false) {
  lastFocused = document.activeElement;
  releasePointer();
  panelType = type;
  $("#panelTitle").textContent = title;
  $("#panelSubtitle").textContent = sub;
  $("#panelBody").innerHTML = html;
  $("#panel").classList.toggle("wide", wide);
  $("#panelLayer").classList.add("visible");
  $("#closePanel").focus({ preventScroll: true });
}
function closePanel() {
  $("#panelLayer").classList.remove("visible");
  panelType = "";
  if (lastFocused && document.contains(lastFocused))
    lastFocused.focus?.({ preventScroll: true });
}
function action(label, description, act, value = "", symbol = "↗") {
  return `<button class="action-card" data-act="${act}" data-value="${esc(value)}"><span class="action-symbol">${symbol}</span><div><strong>${label}</strong><small>${description}</small></div><span>↗</span></button>`;
}
function stationButton(id, name, description, symbol) {
  return `<button class="action-card" data-station="${id}"><span class="action-symbol">${symbol || "⌑"}</span><div><strong>${name}</strong><small>${description}</small></div><span>↗</span></button>`;
}
function openStation(id) {
  if (!G) return;
  if (id === "bags") {
    openBags();
    return;
  }
  if (id === "desk" || id === "sofa" || id === "radio") {
    openLeisure();
    return;
  }
  if (id === "bed") {
    openTime();
    return;
  }
  if (id === "journal") {
    openJournal();
    return;
  }
  if (id === "table" || id === "stove" || id === "fridge") {
    selectedInv = id === "fridge" ? "fridge" : "food";
    openInventory();
    return;
  }
  let title = "",
    subtitle = "",
    html = "";
  if (id === "sink" || id === "kitchen") {
    title = "水槽边的小事。";
    subtitle = "KITCHEN / WATER & ROUTINE";
    html = `<p class="panel-intro">${G.waterOn ? "拧开水龙头，还能听见安稳的水声。" : "楼内暂时停水。储水桶和瓶装水是现在的依靠。"}<br>储水 ${G.tank.toFixed(1)} / ${waterCapacity()}L · 未洗餐具 ${G.dishes}份</p><div class="action-grid">${action("接一杯水喝", "5分钟 · 饮水+50 · 小便压力增加", "drink", "", "◌")}${action("装满储水容器", "8分钟 · 仅供水正常时可用", "fill", "", "♧")}${action("洗手", "3分钟 · 用水0.3L · 清洁+8", "hands", "", "✧")}${action("清洗餐具", "12分钟 · 用水1L，洗洁精可辅助", "dishes", "", "◡")}${action("刷牙", "4分钟 · 需要牙刷和牙膏", "teeth", "", "⌁")}${stationButton("stove", "准备一顿饭", "打开食物物资，选择烹煮或免煮食品", "♨")}</div>`;
  } else if (id === "toilet") {
    title = "照顾身体的需要。";
    subtitle = "BATHROOM / NO DISGUSTING VISUALS";
    html = `<div class="stat-grid"><div class="stat-tile"><span>小便压力</span><strong>${Math.round(G.bladder)}<small>%</small></strong><p>越高越需要处理</p></div><div class="stat-tile"><span>大便压力</span><strong>${Math.round(G.bowel)}<small>%</small></strong><p>不要憋到极限</p></div><div class="stat-tile"><span>卫生纸</span><strong>${amount("paper")}<small>次</small></strong><p>没有时可少量用水</p></div></div><div class="action-grid">${action("小便", "4分钟 · 归零小便压力", "pee", "", "◌")}${action("大便", "10分钟 · 归零大便压力", "poop", "", "◉")}${action("洗手", "3分钟 · 用水0.3L", "hands", "", "✧")}${stationButton("shower", "洗澡与衣物", "顺便打理一下自己", "⌁")}</div><p class="panel-note">所有操作只以文字、数值和干净的场景表现，不出现令人不适的画面。</p>`;
  } else if (id === "shower") {
    title = "把疲惫洗掉一些。";
    subtitle = "BATHROOM / HYGIENE & LAUNDRY";
    html = `<p class="panel-intro">清洁 ${Math.round(G.stats.hygiene)}% · 肥皂 ${amount("soap")}次 · 待洗衣物 ${G.dirtyClothes}套<br>${G.power ? "电力正常，热水器可用。" : "没有电，水温会随室温降低。"}</p><div class="action-grid">${action("洗一个澡", "20分钟 · 用水8L · 肥皂效果更好", "shower", "", "⌁")}${action("手洗衣物", "40分钟 · 用水6L · 需要洗衣粉", "laundry", "", "▧")}${action("换干净衣物", "5分钟 · 需要备用衣物", "change", "", "♧")}${action("刷牙", "4分钟 · 牙刷、牙膏、少量水", "teeth", "", "✧")}</div>`;
  } else if (id === "wardrobe" || id === "mirror") {
    title = "别忘记自己。";
    subtitle = "PERSONAL CARE / AN ORDINARY DAY";
    html = `<div class="stat-grid"><div class="stat-tile"><span>头发长度</span><strong>${G.hair.toFixed(0)}<small>mm</small></strong><p>24mm后开始影响心情</p></div><div class="stat-tile"><span>指甲长度</span><strong>${G.nails.toFixed(1)}<small>mm</small></strong><p>4mm后需要修剪</p></div><div class="stat-tile"><span>衣物清洁</span><strong>${Math.round(G.clothes)}<small>%</small></strong><p>${G.dirtyClothes}套待洗衣物</p></div></div><div class="action-grid">${action("剪指甲", "10分钟 · 需要指甲刀", "nails", "", "⌁")}${action("给自己理发", "25分钟 · 需要理发剪", "hair", "", "✂")}${action("更换衣物", "5分钟 · 备用衣物保持干净", "change", "", "♧")}${action("洗衣服", "40分钟 · 水6L + 洗衣粉", "laundry", "", "▧")}</div>`;
  } else if (id === "trash" || id === "inspect") {
    title = "让房间仍像一个家。";
    subtitle = "HOUSEKEEPING / ABSTRACT LITTLE DISTURBANCES";
    html = `<div class="stat-grid"><div class="stat-tile"><span>房间整洁</span><strong>${Math.round(100 - G.dirt)}<small>%</small></strong><p>脏乱会影响精神</p></div><div class="stat-tile"><span>未洗餐具</span><strong>${G.dishes}<small>份</small></strong><p>清洗后更安心</p></div><div class="stat-tile"><span>待处理包装</span><strong>${G.trash}<small>份</small></strong><p>密封处理，无恶心画面</p></div></div><div class="action-grid">${action("清扫整理", "扫帚/拖把更有效 · 30–45分钟", "clean", "", "⌁")}${action("密封处理垃圾", "10分钟 · 一并丢弃过期物资", "trash", "", "▧")}${action("检查家具", "15分钟 · 概率发现，隐藏总数未知", "inspect", "", "⌕")}${action("清洗餐具", "12分钟 · 用水1L", "dishes", "", "◡")}</div><h3 class="section-label">只用可爱的几何物体表示，不出现真实虫鼠</h3><div class="action-grid">${action(`小汽车 · 已发现${G.found.cars}`, "需要小汽车清理粉 · 每次收纳1个", "clearcars", "", "▰")}${action(`小直升机 · 已发现${G.found.helis}`, "需要方块拍 · 每次收纳1个", "clearhelis", "", "╋")}${action(`小足球 · 已发现${G.found.balls}`, "需要足球收纳夹 · 会留下圆形痕迹", "clearballs", "", "◉")}${action("检查旧抽屉", G.emergencyUsed ? "已经检查过，没有更多物资" : "房东遗留的小量应急品 · 仅一次", "emergency", "", "▣")}</div><p class="panel-note">干扰物只会在脏乱、食物残渣等条件下逐渐出现。没有发现不代表没有，维持清洁比反复搜查更可靠。你不能看到隐藏总数量。</p>`;
  } else if (id === "window") {
    title = "窗外，还是那座城市。";
    subtitle = "WINDOW / A VIEW WITH CONSEQUENCES";
    html = `<p class="panel-intro">楼下的电车仍按时经过。没有人知道你藏在${env.floor}层。<br>窗帘目前${G.curtains ? "已合上" : "已打开"} · 室温 ${temperature()}°C · 暴露风险 ${Math.round(G.suspicion)}%</p><div class="action-grid">${action(G.curtains ? "拉开窗帘" : "合上窗帘", "1分钟 · 夜间开帘会缓慢增加暴露风险", "curtains", "", "▥")}${action("安静地舒展身体", "30分钟 · 精神+9，消耗体力和饮水", "exercise", "", "⌁")}${action("浇一点水给绿植", "8分钟 · 需要绿植和0.2L水", "waterplant", "", "♧")}${action("在窗边等一会儿", "1小时 · 需求会正常消耗", "wait", 1, "◷")}</div><p class="panel-note">风险不会无缘无故变成必死事件。闭帘、低调和少联络可以逐渐降低风险；本版本把真实追捕留作后续扩展。</p>`;
  } else if (id === "door") {
    title = G.pendingKnock ? "有人在门外。" : "门外不安全。";
    subtitle = "ENTRY / KEEP A LOW PROFILE";
    html = `<p class="panel-intro">${G.pendingKnock ? "三声敲门之后，是一小段沉默。你不需要回应。" : "锁扣仍然牢靠。楼道偶尔传来别人的脚步。"}<br>这里没有目击者。最重要的事，是别主动成为一个。</p><div class="action-grid">${action("保持安静，不回应", "15分钟 · 不开门 · 轻微降低风险", "silence", "", "…")}${action("透过猫眼观察", "3分钟 · 不离开房间", "peek", "", "◉")}<button class="action-card" data-ui="resupply"><span class="action-symbol">▣</span><div><strong>地下渠道补给</strong><small>加价15% + 运费2 · 风险+4 · 仅花剩余现金</small></div><span>↗</span></button>${stationButton("bags", "查看门边物资", "拆袋、收纳、检查重量", "▧")}</div><p class="panel-note warn">你的目标是藏满365天，不是赌一次外出。当前版本不允许出门；地下投递同样会留下风险记录，但不会突然宣判死亡。</p>`;
  }
  if (!title) {
    openRoom();
    return;
  }
  showPanel("station:" + id, title, subtitle, html);
}
function openBags() {
  const unopened = G.bags.filter((b) => !b.opened);
  const html = `<p class="panel-intro">门锁好以后，你终于能慢慢整理这批东西。<br>每只塑料袋不超过8kg；大件单独装箱。拆出后才能使用，易坏食物会自动放进冰箱（如果有）。</p><button class="full-button gold" data-unpack="all" ${!unopened.length ? "disabled" : ""}>拆开剩余全部物资 · 约${Math.min(90, unopened.length * 2)}分钟</button><div class="bag-list">${G.bags
    .map((b) => {
      const items = G.inv.filter((i) => i.bag === b.id);
      return `<div class="bag-card ${b.opened ? "opened" : ""}"><h3>${b.crate ? "独立包装箱" : "采购袋"} ${String(b.id + 1).padStart(2, "0")} ${b.opened ? "· 已拆开" : ""}</h3><div class="bag-meter"><span style="width:${Math.min(100, (b.weight / 8) * 100)}%"></span></div><p>${b.weight.toFixed(2)}kg ${b.crate ? "· 大件独立包装" : "/ 8.00kg"}<br>${items
        .slice(0, 3)
        .map((i) => esc(DB[i.id].name.split(" · ")[0]))
        .join(
          "、",
        )}${items.length > 3 ? "等" : ""}</p><button class="small-button" data-unpack="${b.id}" ${b.opened ? "disabled" : ""}>${b.opened ? "已收纳" : "解开袋口 · 2分钟"}</button></div>`;
    })
    .join("")}</div>`;
  showPanel(
    "bags",
    "把生活，一件件安放。",
    "SHOPPING BAGS / MAXIMUM 8 KG EACH",
    html,
    true,
  );
}
function openInventory() {
  const filters = [
    ["all", "全部"],
    ["food", "食物"],
    ["drink", "饮品"],
    ["tools", "用品"],
    ["medical", "药品"],
    ["fridge", "冷藏"],
    ["packed", "未拆袋"],
  ];
  let list = G.inv.filter((b) => b.units > 0);
  if (selectedInv === "packed") list = list.filter((b) => b.packed);
  else if (selectedInv === "food")
    list = list.filter((b) => DB[b.id].kind === "food");
  else if (selectedInv === "drink")
    list = list.filter((b) => DB[b.id].kind === "drink");
  else if (selectedInv === "medical")
    list = list.filter((b) => DB[b.id].category === "medical");
  else if (selectedInv === "fridge")
    list = list.filter((b) => b.location === "fridge");
  else if (selectedInv === "tools")
    list = list.filter(
      (b) =>
        !["food", "drink"].includes(DB[b.id].kind) &&
        DB[b.id].category !== "medical",
    );
  const html = `<div class="inv-toolbar"><div class="inventory-filters">${filters.map(([id, name]) => `<button class="inventory-filter ${selectedInv === id ? "active" : ""}" data-inv-filter="${id}">${name}</button>`).join("")}</div><span class="inv-count">${list.length}批物资 · 储水${G.tank.toFixed(1)}L</span></div>${countPackages() ? '<p class="panel-note warn" style="margin:0 0 17px">仍有未拆采购袋。<button class="text-button" data-station="bags">去解开袋口 ↗</button></p>' : ""}<div class="inv-list">${list
    .map((b) => {
      const it = DB[b.id],
        spoiled = isSpoiled(b) || b.contaminated;
      const location =
        {
          fridge: "冰箱",
          shelf: "储物架",
          table: "桌面",
          room: "房间",
          bag: "采购袋",
        }[b.location] || "储物架";
      const expiry =
        it.life < 9999
          ? spoiled
            ? '<span class="spoiled-label">已过期，不能食用</span>'
            : `剩余约${Math.max(0, Math.floor((it.life - b.age) / (b.location === "fridge" && env.fridge && G.power ? 0.22 : 1)))}天`
          : "耐用 / 可长期存放";
      let actions = "";
      if (b.packed)
        actions = `<button class="small-button" data-unpack="${b.bag}">先拆第${b.bag + 1}袋</button>`;
      else if (spoiled)
        actions = `<button class="small-button danger" data-drop="${esc(b.uid)}">密封丢弃</button>`;
      else {
        if (it.kind === "food" && !it.ingredient)
          actions += `<button class="small-button" data-eat="${esc(b.uid)}">${it.cook ? "烹煮并吃一份" : "吃一份"}</button>`;
        if (it.kind === "drink")
          actions += `<button class="small-button" data-drink="${esc(b.uid)}">${it.brew ? "冲泡一份" : "喝一份"}</button>`;
        if (it.kind === "medicine")
          actions += `<button class="small-button" data-med="${esc(b.uid)}">使用一份</button>`;
        if (it.kind === "book")
          actions += `<button class="small-button" data-book="${it.id}">阅读</button>`;
        if (it.kind === "leisure")
          actions += `<button class="small-button" data-leisure="${it.id}">使用</button>`;
        if (it.kind === "food") {
          actions += `<button class="small-button" data-move="${esc(b.uid)}" data-location="${b.location === "table" ? "shelf" : "table"}">${b.location === "table" ? "收好" : "摆桌面"}</button>`;
          if (env.fridge)
            actions += `<button class="small-button" data-move="${esc(b.uid)}" data-location="${b.location === "fridge" ? "shelf" : "fridge"}">${b.location === "fridge" ? "取出冷藏" : "冷藏"}</button>`;
        }
        if (!actions)
          actions =
            '<span style="font-size:8px;color:#7f996d">解包后已就位 · 在对应家务中使用</span>';
      }
      return `<article class="inv-item ${spoiled ? "spoiled" : ""}"><span class="inv-art">${productArt(it)}</span><div class="inv-item-content"><h3>${it.name}</h3><p>${Math.floor(b.units)}${["food", "drink"].includes(it.kind) ? "份" : it.servings > 1 ? "次" : "件"} · ${location} · ${((it.weight / it.servings) * b.units).toFixed(2)}kg<br>${expiry}${it.cook ? " · 需热源和0.3L水" : ""}${it.ingredient ? " · 烹饪时自动搭配" : ""}${b.contaminated ? " · 可能受污染，请谨慎处理" : ""}</p><div class="inv-actions">${actions}</div></div></article>`;
    })
    .join(
      "",
    )}</div>${!list.length ? '<p class="inventory-empty">这个分类里还没有物资。<br>检查未拆采购袋，或调整分类。</p>' : ""}`;
  showPanel(
    "inventory",
    "有限的物资，漫长的生活。",
    "INVENTORY / KEEP TRACK OF EVERY LITTLE THING",
    html,
    true,
  );
}
function openRoom() {
  showPanel(
    "room",
    "门内，是你全部的世界。",
    "APARTMENT / EVERYDAY ROUTINES",
    `<div class="stat-grid"><div class="stat-tile"><span>房况 / 户型</span><strong>${(env.w * env.d).toFixed(0)}<small>㎡</small></strong><p>${env.mirror ? "反向" : "标准"}布局 · ${env.floor}层</p></div><div class="stat-tile"><span>床垫质量</span><strong>${["", "Ⅰ", "Ⅱ", "Ⅲ"][env.bed]}<small>级</small></strong><p>${env.fridge ? "有旧冰箱" : "没有冰箱"} · 家具${["较完整", "有些陈旧", "明显磨损"][env.wear]}</p></div><div class="stat-tile"><span>室内温度</span><strong>${temperature()}<small>°C</small></strong><p>${G.power ? "供电正常" : "临时停电"} / ${G.waterOn ? "供水正常" : "临时停水"}</p></div></div><div class="action-grid">${stationButton("bags", "门边的采购袋", "解包、收纳与逐袋重量", "▧")}${stationButton("sink", "水槽与料理台", "饮水、储水、洗碗与用餐", "◌")}${stationButton("toilet", "卫生间", "别把身体需要拖到极限", "◉")}${stationButton("bed", "床与睡眠", "选择休息时长，危险会自动中断", "☾")}${stationButton("shower", "淋浴与洗衣", "洗澡、牙齿与换洗衣物", "⌁")}${stationButton("wardrobe", "镜子与衣柜", "头发、指甲、干净的衣服", "♧")}${stationButton("trash", "整理与检查", "打扫、垃圾、几何干扰物", "⌕")}${stationButton("desk", "书桌与消遣", "阅读、日记、纸牌、收音机", "▤")}${stationButton("window", "窗户与天空", "窗帘、温度与安静伸展", "▥")}${stationButton("door", "锁上的入户门", "保持安静、查看与地下补给", "▯")}</div><p class="panel-note">你可以在3D房间里步行靠近家具按 E，也可以在这里直接安排日常。方便操作不会额外惩罚你。</p>`,
    true,
  );
}
function openTime() {
  const warn = getWarnings();
  const html = `<p class="panel-intro">${warn.length ? "现在值得先处理：" + warn.join("、") + "。" : "目前状态尚好。睡眠恢复体力，读书和其他活动更能维持精神。"}<br>同一天睡超过9小时，精神消耗会明显增加。跳时逐5分钟模拟，不是跳过需求。</p><label class="section-label" for="timeHours">这次打算休息多久？</label><div class="time-select"><input id="timeHours" type="range" min="1" max="12" value="8"><output id="timeOutput">8小时</output></div><div class="time-presets">${[1, 4, 6, 8].map((n) => `<button class="${n === 8 ? "active" : ""}" data-hourset="${n}">${n}小时</button>`).join("")}</div><div id="sleepPreview" class="panel-note"></div><button class="full-button gold" id="sleepNow" style="margin-top:18px">躺下来，睡一会儿 ☾</button><h3 class="section-label">不困，只想让时间过去？</h3><div class="action-grid">${action("安静等1小时", "不恢复体力，所有需求照常消耗", "wait", 1, "◷")}${stationButton("desk", "找一本书读", "比一味睡觉更有益于精神", "▤")}</div><p class="panel-note warn">饥饿、饮水、个人需要或健康接近危险时，长时活动会自动提前结束。行动前的预估不保证中途没有随机事件。</p>`;
  showPanel(
    "time",
    "等一场风声过去。",
    "TIME / REST IS NOT THE SAME AS LIVING",
    html,
  );
  updateSleepPreview();
}
function updateSleepPreview() {
  const el = $("#timeHours");
  if (!el || !G) return;
  const h = Number(el.value);
  $("#timeOutput").textContent = h + "小时";
  const food = Math.max(0, G.stats.food - h * 1.8),
    water = Math.max(0, G.stats.water - h * 2.4),
    bladder = Math.min(100, G.bladder + h * 3.6);
  $("#sleepPreview").innerHTML =
    `预计饱腹 ${Math.round(food)}% · 饮水 ${Math.round(water)}% · 小便压力 ${Math.round(bladder)}%<br>${food < 15 || water < 15 || bladder > 90 ? "△ 这次很可能提前醒来，建议先吃饭、喝水和上厕所。" : "体力会按床垫质量恢复；不是无代价快进。"}`;
}
function openLeisure() {
  const list = G.inv.filter(
    (b) =>
      !b.packed && b.units > 0 && ["book", "leisure"].includes(DB[b.id].kind),
  );
  const html = `<p class="panel-intro">你不只是要活着。你还需要一些不像“等待”的时间。<br>书会读完，重读和重复消遣的收益会逐渐降低；换一件事做。</p><div class="action-grid" style="margin-bottom:19px">${action("安静的室内伸展", "30分钟 · 精神+9 · 消耗少量体力", "exercise", "", "⌁")}${action("照料绿植", "8分钟 · 需要绿植和少量水", "waterplant", "", "♧")}</div><div class="leisure-list">${list
    .map((b) => {
      const it = DB[b.id];
      if (it.kind === "book") {
        const progress = G.books[it.id] || { pages: 0, reads: 0 };
        return `<article class="leisure-card"><h3>${it.name}</h3><p>${Math.floor(progress.pages)} / ${it.pages}页 · ${progress.pages >= it.pages ? "已读完，可重读" : "还在第一次阅读"}<br>计划2小时 · 精神收益随新鲜感变化</p><div class="book-progress"><span style="width:${(progress.pages / it.pages) * 100}%"></span></div><button class="small-button" data-book="${it.id}">坐下读一会儿 →</button></article>`;
      }
      return `<article class="leisure-card"><h3>${it.name}</h3><p>已使用 ${G.entertainment[it.id] || 0}次 · 约${it.activity === "radio" ? 1 : 1.5}小时<br>${["radio", "music"].includes(it.activity) ? "需要供电或干电池，保持小音量。" : "安静、安全，慢慢做就好。"}</p><button class="small-button" data-leisure="${it.id}">让自己放松一下 →</button></article>`;
    })
    .join(
      "",
    )}</div>${!list.length ? '<p class="inventory-empty">没有拆出的书或消遣用品。<br>先拆采购袋，伸展身体也能帮助精神。</p>' : ""}`;
  showPanel(
    "leisure",
    "给精神，也留一点口粮。",
    "LEISURE / KEEP SOMETHING TO LOOK FORWARD TO",
    html,
    true,
  );
}
function openCharacter() {
  const meals = ["早餐", "午餐", "晚餐"];
  showPanel(
    "character",
    "你还好吗？",
    "PERSONAL STATUS / THE SMALL THINGS MATTER",
    `<div class="stat-grid">${NEEDS.map(([key, label]) => `<div class="stat-tile"><span>${label}</span><strong>${Math.round(G.stats[key])}<small>/100</small></strong><p>${key === "morale" ? "正向精神指标，越高越好" : key === "health" ? "耗尽将结束生存" : "及时照顾，别拖到红线"}</p></div>`).join("")}</div><p class="panel-intro">今日用餐记录：${meals.map((m) => `${m}${G.meals[day() + "-" + m] ? " ✓" : " —"}`).join(" · ")}<br>今日睡眠 ${G.sleepToday.toFixed(1)}小时 · 头发 ${G.hair.toFixed(0)}mm · 指甲 ${G.nails.toFixed(1)}mm<br>衣物清洁 ${Math.round(G.clothes)}% · 暴露风险 ${Math.round(G.suspicion)}%</p><h3 class="section-label">持续状态</h3>${G.illness.length ? G.illness.map((i) => `<div class="disease-card"><h3>${DISEASES[i.id].name} · 约${Math.ceil(i.remaining / 60)}小时</h3><p>${DISEASES[i.id].desc}</p></div>`).join("") : '<p class="panel-intro">没有持续疾病。保持饮食、清洁与适度活动。</p>'}<div class="action-grid">${stationButton("wardrobe", "个人打理", "剪发、剪指甲、换衣", "♧")}<button class="action-card" data-ui="medicine"><span class="action-symbol">+</span><div><strong>护理用品</strong><small>打开药品分类 · 按对应状态使用</small></div><span>↗</span></button></div><p class="panel-note">这是虚构生存游戏，不是健康建议。精神为正向指标；现实中的抑郁不等于游戏中的失败条件。</p>`,
  );
}
function openJournal() {
  showPanel(
    "journal",
    "把今天，写进手记。",
    "JOURNAL / EVERY DAY YOU ARE STILL HERE",
    `<p class="panel-intro">已隐匿${Math.max(0, day() - 1)}个完整日夜。还有${Math.max(0, 365 - day())}天。<br>种子 ${esc(G.seed)} · 安德士帝国，1986年</p>${G.log.map((l) => `<article class="journal-entry ${esc(l.type)}"><time>第${Math.floor(l.minute / 1440) + 1}天<br>${String(Math.floor((l.minute % 1440) / 60)).padStart(2, "0")}:${String(Math.floor(l.minute % 60)).padStart(2, "0")}</time><p>${esc(l.text)}</p></article>`).join("")}`,
  );
}
function openSave() {
  showPanel(
    "save",
    "房间里的时间，停一下。",
    "SAVE / THIS LIFE IS WORTH KEEPING",
    `<p class="panel-intro">菜单打开时，游戏时间暂停。<br>会自动存档，但推荐定期导出JSON，避免浏览器清理或预览网站中断。</p><div class="save-grid"><button data-ui="save-now">保存到浏览器 <span>↗</span></button><button data-ui="export">导出JSON存档 <span>↗</span></button><label>导入JSON存档 <span>↗</span><input type="file" accept=".json,application/json" class="import-input" hidden></label><button data-ui="help">操作与机制 <span>↗</span></button></div><h3 class="section-label">体验设置</h3><div class="settings-row"><span>鼠标操作：拖动观察，无需锁定也可玩</span><button data-ui="pointer">尝试锁定鼠标</button></div><div class="settings-row"><span>程序化环境低鸣 · 默认关闭</span><button data-ui="sound" id="soundToggle">${soundOn ? "关闭声音" : "开启声音"}</button></div><div class="settings-row"><span>画面阴影（低配置可关闭）</span><button data-ui="shadows">${renderer?.shadowMap.enabled ? "关闭阴影" : "开启阴影"}</button></div><div class="settings-row"><span>返回主菜单不会删除存档</span><button data-ui="title">保存并返回主菜单</button></div><p class="panel-note">页面和所有资源已内嵌。下载根目录index.html可离线双击运行，或下载Game-playable.zip解压游玩。版本 ${VERSION}。</p>`,
  );
}
function openHelp() {
  showPanel(
    "help",
    "一年的生活，从今天开始。",
    "HOW TO PLAY / A FAIR BUT DIFFICULT SURVIVAL",
    `<p class="help-paragraph">你携带300帝国纸币，藏进偏僻高层公寓。采购时看清重量、份数与保质期。目标是存活365天，健康和精神耗尽都会结束本次生活。</p><div class="help-controls"><div><kbd>W A S D</kbd>移动</div><div><kbd>拖动鼠标</kbd>观察</div><div><kbd>E</kbd>靠近家具交互</div><div><kbd>I / Tab</kbd>物资 / 房间</div><div><kbd>B / T</kbd>消遣 / 时间</div><div><kbd>J / Esc</kbd>手记 / 暂停</div></div><h3 class="section-label">第一天，按这个顺序试试</h3><p class="help-paragraph">① 在采购页选「基础清单」或自己配给。<br>② 进房后打开「房间 → 门边采购袋」，拆袋，物资才可用。<br>③ 在水槽接水、装满水壶，提前应对随机停水。<br>④ 吃饭、上厕所、洗澡、换衣与打扫，安排读书或室内活动。<br>⑤ 状态妥当后按T睡觉，可选时长。红线或敲门会中断快进。</p><h3 class="section-label">别把生存当成只填饱肚子</h3><p class="help-paragraph">重复口味、过度睡眠、疾病、脏衣服和混乱都会消耗精神。书会读完，活动也会变得重复。食物会按游戏时间变质，冰箱仅在有电时有效。食用QTE可直接选择「慢慢吃」，多用10分钟即可稳定完成。</p><h3 class="section-label">没有虫鼠，没有恶心画面</h3><p class="help-paragraph">只会出现抽象的小汽车、小直升机和小足球。先检查家具，概率找到，再用对应道具收纳。隐藏数量未知，洁净房间能减少出现。排泄和生病仅用数值与文字呈现。</p><p class="panel-note">手机：左下摇杆移动，按住画面右侧拖动观察，E按钮交互。所有家具也能通过「房间」面板操作。3D不可用时仍可玩核心生存循环。<br>本版本已实现生存与随机事件；真实外出追捕、复杂手动搬家具与完整烹饪配方留作后续迭代，不虚称完整商业成品。</p>`,
  );
}
function refreshPanel() {
  const type = panelType;
  if (type.startsWith("station:")) openStation(type.slice(8));
  else
    ({
      inventory: openInventory,
      bags: openBags,
      room: openRoom,
      character: openCharacter,
      time: openTime,
      journal: openJournal,
      leisure: openLeisure,
    })[type]?.();
}
function beginFoodQTE(uidValue) {
  releasePointer();
  qte = {
    active: true,
    uid: uidValue,
    start: performance.now(),
    pos: 0,
    frame: 0,
  };
  const b = G.inv.find((x) => x.uid === uidValue);
  $("#qteTitle").textContent = b
    ? DB[b.id].name.split(" · ")[0]
    : "好好吃一顿饭。";
  $("#qteLayer").classList.add("visible");
  $("#qteCatch").focus();
  const loop = (now) => {
    if (!qte.active) return;
    qte.pos = (Math.sin((now - qte.start) * 0.0025 - Math.PI / 2) + 1) / 2;
    $("#qteNeedle").style.left = `calc(${qte.pos * 100}% - 2px)`;
    qte.frame = requestAnimationFrame(loop);
  };
  qte.frame = requestAnimationFrame(loop);
}
function finishQTE(slow = false, cancel = false) {
  if (!qte.active) return;
  const id = qte.uid,
    success = slow || (qte.pos >= 0.35 && qte.pos <= 0.65);
  qte.active = false;
  cancelAnimationFrame(qte.frame);
  $("#qteLayer").classList.remove("visible");
  if (!cancel) consumeMeal(id, success, slow);
}
function showEnd() {
  releasePointer();
  $("#endScreen").innerHTML =
    `<main class="end-content"><span class="end-overline">${G.win ? "YOU MADE IT THROUGH THE YEAR" : "EVERY LIFE DESERVES ANOTHER CHANCE"}</span><div class="end-days">${G.win ? "365" : Math.min(365, day())}<small>DAYS</small></div><h1>${G.win ? "门外，终于有了明天。" : "这一次，没能等到明天。"}</h1><p>${esc(G.endReason || "这段生活暂时告一段落。")}<br>${G.win ? "你的房间很小。你守住的生活，很大。" : "记录还在。带上学会的事，再开始一次。"}</p><div class="end-stats"><div><strong>${money(G.cash)}</strong>剩余现金</div><div><strong>${G.log.length}</strong>手记片段</div><div><strong>${esc(G.seed)}</strong>房间种子</div></div><button class="start-button" data-ui="title"><span>回到主菜单</span><span>↗</span></button><div class="end-secondary"><button data-ui="export">导出这段生活</button><button data-ui="journal">看看最后的手记</button></div></main>`;
}
let audioCtx, audioGain;
function toggleAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 60;
      const osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 121;
      audioGain = audioCtx.createGain();
      audioGain.gain.value = 0;
      osc.connect(audioGain);
      osc2.connect(audioGain);
      audioGain.connect(audioCtx.destination);
      osc.start();
      osc2.start();
    }
    audioCtx.resume();
    soundOn = !soundOn;
    audioGain.gain.setTargetAtTime(
      soundOn ? 0.015 : 0,
      audioCtx.currentTime,
      0.4,
    );
    if ($("#soundToggle"))
      $("#soundToggle").textContent = soundOn ? "关闭声音" : "开启声音";
  } catch {
    notify("当前环境不支持音频。");
  }
}
function toTitle() {
  if (G) saveGame(false);
  phase = "title";
  paused = false;
  closePanel();
  finishQTE(false, true);
  $("#seedInput").value = currentSeed;
  env = environment(currentSeed);
  buildRoom(env);
  updatePhase();
}
function uiAction(name) {
  if (name === "help") {
    openHelp();
    return;
  }
  if (name === "title") {
    toTitle();
    return;
  }
  if (name === "sound") {
    toggleAudio();
    return;
  }
  if (name === "pointer") {
    closePanel();
    requestPointer();
    return;
  }
  if (name === "shadows") {
    if (renderer) {
      renderer.shadowMap.enabled = !renderer.shadowMap.enabled;
      sceneDirty = true;
      renderer.shadowMap.needsUpdate = true;
      scene.traverse((o) => {
        if (o.material) o.material.needsUpdate = true;
      });
      openSave();
    }
    return;
  }
  if (!G) return;
  switch (name) {
    case "inventory":
      selectedInv = "all";
      openInventory();
      break;
    case "medicine":
      selectedInv = "medical";
      openInventory();
      break;
    case "room":
      openRoom();
      break;
    case "leisure":
      openLeisure();
      break;
    case "time":
      openTime();
      break;
    case "journal":
      openJournal();
      break;
    case "character":
      openCharacter();
      break;
    case "save":
      openSave();
      break;
    case "save-now":
      saveGame();
      break;
    case "export":
      exportSave();
      break;
    case "resupply":
      openShop(true);
      break;
  }
}
function setupEvents() {
  $("#newGameButton").addEventListener("click", () => {
    updateSeed();
    openShop(false);
  });
  $("#continueButton").addEventListener("click", continueGame);
  let seedTimer;
  $("#seedInput").addEventListener("input", () => {
    clearTimeout(seedTimer);
    seedTimer = setTimeout(updateSeed, 500);
  });
  $("#rerollSeed").addEventListener("click", () => {
    $("#seedInput").value =
      "ANDERS-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    updateSeed();
  });
  $("#shopSearch").addEventListener("input", (e) => {
    shopQuery = e.target.value;
    renderCatalog();
  });
  $("#starterKit").addEventListener("click", () => applyKit("starter"));
  $("#yearKit").addEventListener("click", () => applyKit("year"));
  $("#clearCart").addEventListener("click", () => {
    cart = {};
    renderCatalog();
    renderReceipt();
  });
  $("#checkoutButton").addEventListener("click", beginGame);
  $("#shopBack").addEventListener("click", () => {
    phase = restock ? "playing" : "title";
    restock = false;
    updatePhase();
  });
  $("#viewApartment").addEventListener("click", () => {
    if (G && restock) openRoom();
    else
      showPanel(
        "apartment",
        "你即将住进的地方。",
        "ROOM SURVEY / SEED " + currentSeed,
        `<div class="stat-grid"><div class="stat-tile"><span>面积</span><strong>${(env.w * env.d).toFixed(0)}<small>㎡</small></strong><p>高层偏僻公寓</p></div><div class="stat-tile"><span>起始室温</span><strong>${env.temp}<small>°C</small></strong><p>会受天气影响</p></div><div class="stat-tile"><span>床垫质量</span><strong>${env.bed}<small>/3级</small></strong><p>影响睡眠恢复</p></div></div><p class="panel-intro">${env.fridge ? "有一台仍能运作的旧冰箱。" : "没有冰箱，请少买短保质食物，多准备干粮。"}<br>公寓自带旧锅、基础碗杯、单眼电炉、水槽、卫生间和旧家具，不会因为没买锅就软锁。<br>临时停电停水是可能发生、也可能不发生的随机事件。长储主食、免煮食物、储水壶与清洁用品都值得考虑。</p>`,
      );
  });
  $("#closePanel").addEventListener("click", closePanel);
  $("#panelLayer").addEventListener("click", (e) => {
    if (e.target === $("#panelLayer")) closePanel();
  });
  $("#pauseButton").addEventListener("click", () => {
    paused = false;
    openSave();
  });
  $("#pauseBanner").addEventListener("click", () => {
    paused = false;
    $("#pauseBanner").hidden = true;
  });
  $("#qteCatch").addEventListener("click", () => finishQTE());
  $("#qteSlow").addEventListener("click", () => finishQTE(true));
  $("#qteCancel").addEventListener("click", () => finishQTE(false, true));
  document.addEventListener("click", (e) => {
    let b;
    if ((b = e.target.closest("[data-product]"))) {
      showProduct(b.dataset.product);
      return;
    }
    if ((b = e.target.closest("[data-cart]"))) {
      changeCart(b.dataset.cart, Number(b.dataset.delta));
      return;
    }
    if ((b = e.target.closest("[data-category]"))) {
      shopCategory = b.dataset.category;
      renderCategories();
      renderCatalog();
      return;
    }
    if ((b = e.target.closest("[data-ui]"))) {
      uiAction(b.dataset.ui);
      return;
    }
    if ((b = e.target.closest("[data-station]"))) {
      openStation(b.dataset.station);
      return;
    }
    if ((b = e.target.closest("[data-act]"))) {
      doAction(b.dataset.act, b.dataset.value);
      return;
    }
    if ((b = e.target.closest("[data-inv-filter]"))) {
      selectedInv = b.dataset.invFilter;
      openInventory();
      return;
    }
    if ((b = e.target.closest("[data-unpack]"))) {
      unpackBag(Number(b.dataset.unpack), b.dataset.unpack === "all");
      if (panelType === "inventory") openInventory();
      return;
    }
    if ((b = e.target.closest("[data-eat]"))) {
      prepareFood(b.dataset.eat);
      return;
    }
    if ((b = e.target.closest("[data-drink]"))) {
      actDrink(b.dataset.drink);
      return;
    }
    if ((b = e.target.closest("[data-med]"))) {
      takeMedicine(b.dataset.med);
      return;
    }
    if ((b = e.target.closest("[data-book]"))) {
      doRead(b.dataset.book);
      return;
    }
    if ((b = e.target.closest("[data-leisure]"))) {
      doLeisure(b.dataset.leisure);
      return;
    }
    if ((b = e.target.closest("[data-move]"))) {
      moveItem(b.dataset.move, b.dataset.location);
      return;
    }
    if ((b = e.target.closest("[data-drop]"))) {
      G.inv = G.inv.filter((x) => x.uid !== b.dataset.drop);
      G.trash++;
      advanceTime(2, "clean");
      openInventory();
      return;
    }
    if ((b = e.target.closest("[data-hourset]"))) {
      $("#timeHours").value = b.dataset.hourset;
      $$("[data-hourset]").forEach((x) =>
        x.classList.toggle("active", x === b),
      );
      updateSleepPreview();
      return;
    }
    if (e.target.closest("#sleepNow")) {
      doAction("sleep", $("#timeHours").value);
      return;
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "timeHours") updateSleepPreview();
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches(".import-input")) {
      importSave(e.target.files[0]);
      e.target.value = "";
    }
  });
  document.addEventListener("keydown", (e) => {
    if (typeof handleWorldKey === "function" && handleWorldKey(e)) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
      if (e.code === "Escape") e.target.blur();
      return;
    }
    if (qte.active) {
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) finishQTE();
      }
      if (e.code === "Escape") finishQTE(false, true);
      return;
    }
    if (e.code === "Escape") {
      e.preventDefault();
      if (panelType) {
        closePanel();
        return;
      }
      if (phase === "playing") {
        paused = !paused;
        releasePointer();
        $("#pauseBanner").hidden = !paused;
        return;
      }
    }
    if (phase !== "playing") return;
    if (e.code === "Tab") {
      if (!panelType) {
        e.preventDefault();
        openRoom();
      }
      return;
    }
    const map = {
      KeyI: "inventory",
      KeyB: "leisure",
      KeyT: "time",
      KeyJ: "journal",
    };
    if (map[e.code] && !e.repeat) {
      e.preventDefault();
      if (panelType) closePanel();
      else uiAction(map[e.code]);
      return;
    }
    if (panelType || paused) return;
    if (e.code === "KeyE" && !e.repeat) {
      e.preventDefault();
      doInteract();
      return;
    }
    keys[e.code] = true;
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.code,
      )
    )
      e.preventDefault();
  });
  document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });
  window.addEventListener("blur", () => {
    keys = {};
    dragging = false;
    mobileStick = { active: false, x: 0, y: 0 };
    if (G && phase === "playing") {
      saveGame(false);
      paused = true;
      $("#pauseBanner").hidden = false;
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && G) saveGame(false);
  });
  $("#mobileInteract").addEventListener("click", () => {
    if (targetId) doInteract();
    else openRoom();
  });
  const stick = $("#joystick");
  let stickId = null;
  function resetStick() {
    stickId = null;
    mobileStick = { active: false, x: 0, y: 0 };
    $("#joystick>span").style.transform = "translate(0,0)";
  }
  stick.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    stickId = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    stickMove(e);
  });
  function stickMove(e) {
    if (stickId !== e.pointerId) return;
    const r = stick.getBoundingClientRect(),
      dx = e.clientX - r.left - r.width / 2,
      dy = e.clientY - r.top - r.height / 2,
      dist = Math.hypot(dx, dy),
      scale = dist > 28 ? 28 / dist : 1;
    mobileStick = { active: true, x: (dx * scale) / 28, y: (dy * scale) / 28 };
    $("#joystick>span").style.transform =
      `translate(${dx * scale}px,${dy * scale}px)`;
  }
  stick.addEventListener("pointermove", stickMove);
  stick.addEventListener("pointerup", resetStick);
  stick.addEventListener("pointercancel", resetStick);
  // Tab stays inside modal panels; all operations also work with keyboard only.
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Tab" || !panelType) return;
    const focus = $$(
      "button:not([disabled]),input,select,a[href],label[tabindex]",
      $("#panel"),
    ).filter((el) => el.offsetParent !== null);
    if (!focus.length) return;
    const first = focus[0],
      last = focus.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
window.addEventListener("error", (e) => {
  console.error("Game error:", e.message);
  if ($("#loading")) $("#loading").classList.add("done");
});
$$("[data-version]").forEach((el) => (el.textContent = VERSION));
setupEvents();
updateSeed();
initScene();
updatePhase();
setTimeout(() => $("#loading").classList.add("done"), 300);
