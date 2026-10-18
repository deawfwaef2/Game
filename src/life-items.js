/* 闭门365 · v0.16 every item has a clear, real use.
   1. ITEM_USE: a plain explanation for each of the 133 products (shown on the big card in the shop and on the
      item in the room). Every sentence describes what the code really does.
   2. Small real effects for the things that used to be only scenery: shampoo, towel, razor, comb, sponge,
      disinfectant, gloves, salt, pepper, pan, bowl, opener, cup, thermometer, lamp, rug, socks, blackout curtain,
      alarm clock, lighter and storage jars. Nothing is hidden: the feedback chips show every change. */
const ITEM_USE = {
  rice: "最便宜、最耐放的主食。在电炉上煮，一袋够吃很久。",
  oats: "煮一碗燕麦粥。有白砂糖时会自动做成甜口。",
  pasta: "煮通心面。换着口味吃，能减轻吃腻带来的心情下降。",
  flour: "加水和面，烙成面饼。",
  cornmeal: "煮玉米糊。有白砂糖时会自动做成甜口。",
  beans: "煮红豆汤，有饱腹感。有白砂糖时会自动做成甜口。",
  lentils: "煮扁豆汤，熟得快，口味和米面不同。",
  buckwheat: "煮荞麦饭，换个口味。",
  noodles: "煮挂面，快手的一餐。",
  crackers: "不用煮，开袋就能吃。停电停水时的好帮手。",
  hardtack: "压缩口粮不用煮，热量高、几乎不会坏，是停电时最可靠的储备。",
  bread: "黑麦面包直接吃，几天内就会变质，先吃它。",
  potato: "煮土豆，热量足。放在阴凉处能放很久。",
  sweetpotato: "煮红薯，口味偏甜。有白砂糖时会自动做成甜口。",
  oil: "配料，不能单独吃。每次煮饭自动用一份，让这顿饭的饱腹多一截。",
  peanut: "直接挖着吃，热量很高，能顶饿。",
  nuts: "开袋即食的零食，热量高、耐放。",
  raisins: "开袋即食，甜，耐放。",
  sugar: "配料。煮燕麦、玉米粉、红豆、红薯时自动加一点，变成新的甜口菜，心情更好。",
  chocolate: "一小块就让人高兴，心情 +5。留着在难熬的日子吃。",
  biscuit: "开袋即食的小点心，心情 +2。",
  jam: "直接吃或配饼干，甜，心情 +2。",
  pork: "午餐肉罐头，开罐即食，有肉。有开罐器时打开更利落，心情 +1。",
  fish: "沙丁鱼罐头，开罐即食，耐放好几年。",
  tuna: "金枪鱼罐头，开罐即食，清淡的蛋白质。",
  beef: "土豆炖牛肉罐头，一罐就是像样的一顿。",
  bakedbeans: "番茄焗豆罐头，开罐即食，口味和主食不同。",
  peas: "青豆罐头，蔬菜，和主食轮换口味。",
  tomato: "番茄罐头，蔬菜，开罐即食。",
  corncan: "甜玉米罐头，开罐即食。",
  mushroom: "蘑菇罐头，换个口味。",
  peach: "黄桃罐头，甜，心情 +4。",
  pineapple: "菠萝罐头，甜，心情 +4。",
  soup: "浓缩蔬菜汤，开罐就能喝。",
  milkpowder: "冲一杯奶粉喝，有蛋白质，耐放。",
  carrot: "胡萝卜生吃就行，放进冰箱能保存得更久。",
  cabbage: "卷心菜生吃就行，放进冰箱能保存得更久。",
  onion: "洋葱。和米饭、面条等主食一起煮时，自动做成“洋葱××”这样的新菜。",
  apple: "红苹果，直接吃，心情 +3。放冰箱更耐放。",
  orange: "橙子，直接吃，心情 +3。",
  banana: "香蕉，直接吃，心情 +3。熟得很快，先吃。",
  egg: "鸡蛋要煮熟。有平底锅时，煮熟的饭菜心情再 +1。",
  cheese: "硬奶酪直接吃，蛋白质。放冰箱能保存很久。",
  sausage: "烟熏香肠直接吃，有肉。放冰箱更耐放。",
  milk: "鲜牛奶，水分 +12。必须放冰箱，很快会坏。",
  yogurt: "酸奶，心情 +2。必须放冰箱。",
  water: "瓶装水，直接喝，停水时救急。",
  waterlarge: "5升封装饮用水，停水时的主要储备。",
  tea: "冲一杯红茶，要用热水（有电，或有燃料炉）。用自己的水杯喝心情再 +1。",
  coffee: "速溶咖啡提神，体力 +8。要用热水。",
  cocoa: "可可，热乎乎的，心情 +4。要用热水。",
  juice: "苹果汁，直接喝，心情 +3。",
  soda: "柠檬汽水，直接喝，心情 +3。",
  herbal: "草本茶，心情 +4，晚上喝也不影响睡。要用热水。",
  salt: "调味料。每次煮饭自动用一点，这顿饭心情 +1。",
  pepper: "调味料。每次煮饭自动用一点，这顿饭心情 +1。",
  spice: "混合香料。连着吃同一种口味时自动用上，心情 +3，抵消吃腻。",
  soap: "洗澡时用。有肥皂：清洁 +55；只用清水：清洁 +28。",
  shampoo: "洗澡时自动用一份：清洁再 +6，心情 +1。",
  toothbrush: "刷牙必需（还要牙膏）。刷牙：清洁 +8，心情 +1。",
  toothpaste: "刷牙必需（还要牙刷）。每次刷牙用一份。",
  paper: "上大号时用。没有卫生纸只能用水冲洗，心情 −1。",
  towel: "洗完澡擦干，心情 +2；停电的冷天洗澡不再着凉难受。",
  shirt: "换洗衣物。在衣柜前换衣服：衣物恢复干净，心情 +4。",
  underwear: "换洗内衣，算两套干净衣物，能多撑几天再洗。",
  socks: "厚袜子。屋里低于14°C时，脚不冷，心情下降变慢。",
  sweater: "冷天穿上，体感温度 +4°C，也不容易着凉感冒。",
  nailclip: "指甲长了就剪（剪指甲需要它）。剪完心情 +3。",
  scissors: "对着镜子剪头发（需要它）。头发太长会让心情慢慢变差。",
  razor: "洗澡时顺便刮胡子，每天一次，心情 +2。",
  comb: "洗手洗脸时顺手梳头，每天一次，心情 +1。",
  detergent: "手洗衣服必需。每洗一次用一份。",
  dishsoap: "洗碗时用，碗洗得更干净。",
  broom: "扫地：屋子脏乱 −35，30分钟。没有扫帚只能徒手收拾，效果差得多。",
  mop: "拖地，效果和扫帚一样好。有一样就够了。",
  trashbag: "倒垃圾时用一只，把垃圾和变质食物密封好。",
  sponge: "洗碗时用海绵，屋子再干净一点（脏乱再 −4）。",
  disinfect: "打扫时用一份：脏乱再 −10，健康 +1。",
  gloves: "打扫、洗碗、洗衣时戴上，手和身上不被弄脏（清洁 +2）。",
  aspirin: "发烧时吃：病程缩短约12小时，健康 +2。",
  digest: "肠胃不适时吃：病程缩短约12小时，健康 +2。",
  coldmed: "感冒时吃：病程缩短约12小时，健康 +2。",
  vitamin: "每天一片：健康 +3，心情 +1。没病也可以吃。",
  bandage: "生病时用来护理，任何病都能缩短约12小时。",
  thermometer: "生病时先量体温再用药，用药效果更好（健康再 +3）。",
  firstaid: "家庭护理盒：任何病都能用，缩短约12小时。",
  pot: "公寓已有一口旧锅；新锅煮饭更快，每顿省10分钟。",
  pan: "平底锅。煮熟的饭菜心情 +1。",
  bowl: "搪瓷碗。吃饭像样一点，心情 +0.5，桌上也少弄脏一点。",
  cup: "自己的水杯。冲茶、咖啡、可可时心情再 +1。",
  bottle: "5升水壶。在水槽接满，停水时就有水喝、做饭。",
  canister: "15升储水桶。在水槽接满，停水时能撑好几天。",
  jar: "密封罐。放米面干粮，干粮变质速度慢四分之一。",
  opener: "开罐器。吃罐头时开得利落，心情 +1。",
  lighter: "点蜡烛时用，一下就着，心情 +1。",
  candle: "停电的夜里点一根，能亮6小时，黑暗不再让心情变差。",
  flashlight: "停电停水时检修更快：剩余故障时间缩短到约30分钟（没有手电约1小时）。",
  battery: "停电时收音机和磁带要用电池，每次用一节。",
  stove: "停电时也能煮饭、烧水（每顿烧一块固体燃料）。",
  fuel: "便携燃料炉的燃料，停电时每煮一顿用一块。",
  repair: "修水龙头滴水、马桶漏水、门锁松动；停电停水时也能缩短故障时间。",
  notebook: "在桌前写日记和回忆录，心情 +9。写满十二章是一个目标。",
  novel1: "读小说打发时间，心情 +12。读完再读，感觉会淡。",
  novel2: "读小说，心情 +12。",
  novel3: "侦探小说，心情 +11。",
  poetry: "诗集，心情 +10。",
  history: "读帝国历史，心情 +10。",
  science: "科普书，心情 +10。",
  travel: "画册，看看远方，心情 +13。",
  cookbook: "菜谱，心情 +10。",
  cards: "一个人玩接龙打发时间，心情 +8。玩多了会腻，换着玩。",
  chess: "自己和自己下棋，心情 +10。",
  puzzle: "500片拼图，慢慢拼完，心情 +11。拼完会拆了重拼。",
  pencil: "画画写字，心情 +8。",
  radio: "收听新闻、音乐和每周的广播剧，心情 +10。停电时要电池。",
  tape: "放夜间爵士磁带听，心情 +12。停电时要电池。",
  plant: "一盆绿植，每天浇水心情 +4，平时也让心情下降慢一点。",
  origami: "折纸鹤，一小时六到十只。每三十只挂一串在窗边，折满一千只能许一个愿。",
  ducttape: "冷天窗缝漏风时，拿着胶带封窗，室温回升约2°C。一卷能封四次。",
  radkey: "暖气片进了空气不热时，拿着它给暖气片放气。",
  pots: "花盆和土，摆在窗台上，可以种葱、豆芽、樱桃番茄。",
  scallion: "插进窗台的湿土里，约九天能剪第一茬葱，剪了还会再长。",
  mungseed: "铺在湿土上，四天出一盆豆芽，每天要浇水。",
  tomatoseed: "约五十天开花结果，之后每隔几天能摘一把。要阳光和15°C以上。",
  blanket: "睡觉时盖上，夜里体感温度 +4°C。",
  pillow: "新枕头，睡得更好，每小时睡眠多恢复一些体力。",
  rug: "铺在地上。屋里低于16°C时脚下不冰，心情下降变慢。",
  fan: "热天开风扇（要有电），室温降2°C。",
  heater: "冷天开电暖器（要有电），室温升4°C。",
  shelf: "多一个收纳架，物资摆得开、找得到。",
  curtain: "加厚遮光窗帘：拉上时外面更看不见屋里，外人对你的注意消退得更快；睡觉也更沉，体力恢复更多。",
  clock: "机械闹钟。按时醒来，起床时心情 +1。",
  lamp: "暖光台灯。有电的晚上（18点后）心情下降变慢，夜里读书心情再 +1。",
};
// The shop card / room hint: a plain-language data line generated from the item fields.
function itemFacts(it) {
  if (!it) return "";
  const out = [];
  if (it.kind === "food") {
    out.push(`${it.servings}份`);
    if (!it.ingredient) out.push(`每份饱腹约+${Math.round(it.kcal / 24)}`);
    if (it.water) out.push(`水分+${it.water}`);
    out.push(it.cook ? "需要煮（耗0.3L水）" : "免煮");
  } else if (it.kind === "drink") {
    out.push(`${it.servings}份`, `每份水分+${it.water}`);
    if (it.brew) out.push("需要热水");
  } else if (it.kind === "book") out.push(`${it.pages}页`, "每次读2小时");
  else if (it.servings > 1) out.push(`可用${it.servings}次`);
  else out.push("耐用品");
  if (it.life < 9999) out.push(it.life >= 365 ? `可存${(it.life / 365).toFixed(it.life % 365 ? 1 : 0)}年` : `常温${it.life}天就坏`);
  out.push(`${it.weight}kg`);
  return out.join(" · ");
}
function itemUse(it) {
  return (it && (ITEM_USE[it.id] || it.desc)) || "";
}

/* ---------- Real effects ---------- */
function liDaily(key) {
  if (!G) return false;
  G.life ??= {};
  G.life.itemDay ??= {};
  if (G.life.itemDay[key] === day()) return false;
  G.life.itemDay[key] = day();
  return true;
}
const liBase = { simulate, doAction, consumeMeal, actDrink, takeMedicine, doRead };
simulate = function (minutes, context) {
  liBase.simulate(minutes, context);
  if (!G || G.ended) return;
  const h = minutes / 60,
    s = G.stats,
    t = temperature(),
    hr = hour();
  if (has("rug") && t < 16) s.morale = clamp(s.morale + 0.04 * h);
  if (has("socks") && t < 14) s.morale = clamp(s.morale + 0.04 * h);
  if (has("lamp") && G.power && hr >= 18 && context !== "sleep") s.morale = clamp(s.morale + 0.05 * h);
  if (has("curtain") && G.curtains) {
    G.suspicion = Math.max(0, G.suspicion - 0.25 * h);
    if (context === "sleep") s.energy = clamp(s.energy + 0.6 * h);
  }
  if (has("jar"))
    for (const b of G.inv) {
      const it = DB[b.id];
      if (it?.category === "staple" && it.life < 9999 && !b.packed && b.location !== "fridge") b.age -= (minutes / 1440) * 0.25;
    }
};
doAction = function (action, value) {
  const m0 = G?.minute,
    pre = G && action === "sleep" ? G.minute : 0;
  const r = liBase.doAction(action, value);
  if (!G || G.ended || G.minute === m0) return r;
  const s = G.stats;
  if (action === "shower") {
    if (has("shampoo")) {
      use("shampoo");
      s.hygiene = clamp(s.hygiene + 6);
      s.morale = clamp(s.morale + 1);
    }
    if (has("towel")) s.morale = clamp(s.morale + (!G.power && temperature() < 16 ? 4 : 2));
    if (has("razor") && liDaily("razor")) s.morale = clamp(s.morale + 2);
  } else if (action === "hands") {
    if (has("comb") && liDaily("comb")) s.morale = clamp(s.morale + 1);
  } else if (action === "clean") {
    if (has("disinfect")) {
      use("disinfect");
      G.dirt = Math.max(0, G.dirt - 10);
      s.health = clamp(s.health + 1);
    }
    if (has("gloves")) s.hygiene = clamp(s.hygiene + 2);
  } else if (action === "dishes") {
    if (has("sponge")) G.dirt = Math.max(0, G.dirt - 4);
    if (has("gloves")) s.hygiene = clamp(s.hygiene + 2);
  } else if (action === "laundry") {
    if (has("gloves")) s.hygiene = clamp(s.hygiene + 2);
  } else if (action === "candle") {
    if (has("lighter")) s.morale = clamp(s.morale + 1);
  } else if (action === "sleep") {
    if (has("clock") && G.minute - pre >= 180) s.morale = clamp(s.morale + 1);
  }
  return r;
};
consumeMeal = function (uidValue, success = true, slow = false) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    units = b?.units,
    m0 = G?.minute;
  const r = liBase.consumeMeal(uidValue, success, slow);
  if (!G || !it || G.minute === m0 || (b.units === units && G.inv.includes(b))) return r;
  const s = G.stats;
  let joy = 0;
  if (it.cook) {
    if (has("salt")) {
      use("salt");
      joy += 1;
    }
    if (has("pepper")) {
      use("pepper");
      joy += 1;
    }
    if (has("pan")) joy += 1;
  }
  if (has("bowl")) {
    joy += 0.5;
    G.dirt = Math.max(0, G.dirt - 0.5);
  }
  if (it.category === "canned" && has("opener")) joy += 1;
  if (joy) s.morale = clamp(s.morale + joy);
  return r;
};
actDrink = function (uidValue) {
  const b = uidValue !== "tap" && G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    m0 = G?.minute;
  const r = liBase.actDrink(uidValue);
  if (G && it?.brew && G.minute !== m0 && has("cup")) G.stats.morale = clamp(G.stats.morale + 1);
  return r;
};
takeMedicine = function (uidValue) {
  const b = G?.inv.find((x) => x.uid === uidValue),
    it = b && DB[b.id],
    m0 = G?.minute;
  const r = liBase.takeMedicine(uidValue);
  if (G && it && it.treat !== "vitamin" && G.minute !== m0 && has("thermometer")) G.stats.health = clamp(G.stats.health + 3);
  return r;
};
doRead = function (id) {
  const m0 = G?.minute;
  const r = liBase.doRead(id);
  const hr = G ? hour() : 12;
  if (G && G.minute !== m0 && has("lamp") && G.power && (hr >= 18 || hr < 6)) G.stats.morale = clamp(G.stats.morale + 1);
  return r;
};
