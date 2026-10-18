/* 闭门365 · v0.15 a home that makes sense. Things only happen when they could really happen: rain stories when
   it actually rains, the factory whistle at knocking-off time, "late at night" at night, fireworks in the evening.
   Plus the traces a previous tenant left in the flat (one seeded life of four, found bit by bit while you clean,
   mend and look out of the window), and dreams when you wake from a proper sleep. Pure game logic; runs in tests. */
const LH = { say: "" };
// When can a line about the outside world plausibly happen? Checked against the real clock, season and weather.
function lhHour() {
  return (G.minute / 60) % 24;
}
function lhDry() {
  return typeof lrPrecip !== "function" || !lrPrecip();
}
function lhDay() {
  const h = lhHour();
  return h >= 7 && h < 18.5;
}
function lhNight() {
  const h = lhHour();
  return h >= 21.5 || h < 5;
}
function lhRainedRecently() {
  if (typeof lrPrecip !== "function") return false;
  for (let k = 1; k <= 3; k++) if (lrPrecip(G.minute - k * 60) === "rain") return true;
  return false;
}
const LH_RULES = [
  [/蝴蝶|电影票|身高线|梦见/, () => false], // no insects; tenant traces and dreams have their own systems now
  [/大雾/, () => false], // the window cannot show fog, so the journal must not claim it
  [/下起了雨/, () => typeof lrPrecip === "function" && lrPrecip() === "rain"],
  [/雷声/, () => typeof lrPrecip === "function" && lrPrecip() === "rain" && lrOutdoor() > 8],
  [/天空特别蓝/, () => lhDay() && !lifeWeather(day()).overcast && !lifeWeather(day()).hazy],
  [/彩虹/, () => lhDay() && lhDry() && lhRainedRecently()],
  [/汽笛.*下班/, () => lhHour() >= 16.5 && lhHour() < 18.5],
  [/敲了十二下/, () => (lhHour() >= 11.9 && lhHour() < 12.6) || lhHour() >= 23.9 || lhHour() < 0.6],
  [/夜里|整夜|深夜|半夜/, () => lhNight()],
  [/球赛/, () => lhHour() >= 18 && lhHour() < 22],
  [/晒被子|晾/, () => lhHour() >= 9 && lhHour() < 15 && lhDry() && !lifeWeather(day()).overcast],
  [/风筝/, () => lhDay() && lhDry() && lrOutdoor() > 6],
  [/麻雀|一群鸟/, () => lhDay() && lhDry()],
  [/人字/, () => (day() >= 140 && day() <= 190) || (day() >= 290 && day() <= 330)],
  [/烤红薯/, () => lrOutdoor() < 10],
  [/暖气管/, () => lrOutdoor() < 12],
  [/一下午/, () => lhHour() >= 14 && lhHour() < 19],
  [/修自行车|纸飞机/, () => lhDay() && lhDry()],
  [/邮递员/, () => lhHour() >= 8 && lhHour() < 17],
  [/电车/, () => lhHour() >= 5.5 && lhHour() < 23.5],
  [/剁饺子馅|扫地|晒太阳/, () => lhHour() >= 8 && lhHour() < 19],
  [/唱歌|二胡|打碎|吵架|练琴|琴声连起来|练了两个小时/, () => lhHour() >= 8 && lhHour() < 22],
  [/早上|咕咕声/, () => lhHour() >= 5.5 && lhHour() < 10],
  [/傍晚|下班/, () => lhHour() >= 16.5 && lhHour() < 20],
  [/今晚|晚上|十点/, () => lhHour() >= 19 && lhHour() < 23.5],
  [/一天没有|一整天的/, () => lhHour() >= 17 && lhHour() < 22],
  [/搬走/, () => lhDay()],
];
// Exact moments for lines that mention two times of day (checked first; they decide on their own).
const LH_EXACT = [
  [/响了一整夜。早上/, () => lhHour() >= 5.5 && lhHour() < 10],
  [/搬了一整天/, () => lhHour() >= 16 && lhHour() < 20.5],
];
function lhOk(text) {
  for (const [re, ok] of LH_EXACT) if (re.test(text)) return ok();
  for (const [re, ok] of LH_RULES) if (re.test(text) && !ok()) return false;
  return true;
}
// Only offer pool events whose moment is right; neighbour stories wait for the right hour instead of being skipped.
lmPoolEvent = function () {
  const L = G.life,
    d = day();
  const pool = LM_EVENTS.map((e, i) => i).filter((i) => (!L.seen[i] || d - L.seen[i] > 40) && lhOk(LM_EVENTS[i][0]));
  if (!pool.length) return false;
  const i = pool[Math.floor(rngNext(G) * pool.length)];
  L.seen[i] = d;
  logEvent(LM_EVENTS[i][0], LM_EVENTS[i][1] < 0 ? "normal" : "good");
  lmApply(LM_EVENTS[i][1]);
  return true;
};
lmChainStep = function () {
  const L = G.life;
  for (const [id, c] of Object.entries(L.chains || {})) {
    const chain = LM_CHAINS.find((x) => x.id === id);
    if (!chain || c.step >= chain.steps.length || day() < c.next || !lhOk(chain.steps[c.step])) continue;
    logEvent(chain.steps[c.step], "story");
    c.step++;
    c.next = day() + 12 + Math.floor(rngNext(G) * 30);
    lmApply(c.step === chain.steps.length ? 6 : 2);
    return true;
  }
  return false;
};

/* ---------- Dated days at the right hour ---------- */
const LH_DAY_HOUR = { 30: 18, 45: 19, 80: 14, 120: 10, 150: 8, 215: 23, 216: 9, 262: 7, 300: 6, 330: 10 };
const LH_COLDEST_MILD = "冬天最冷的几天。暖气片摸上去只是温的，你把毛衣领子拉到了下巴。";

/* ---------- The previous tenant ---------- */
const LH_TENANTS = [
  {
    id: "watch",
    who: "一位独居的老钟表匠",
    bits: [
      "地板缝里卡着一颗比米粒还小的螺丝，在灯下亮了一下。是手表上的。",
      "窗框内侧有一排很小的铅笔字：“6:12、6:10、6:07……”有人在这里记过每天日出的时间。",
      "抽屉底下垫着一张信纸，开头写着“儿子：港口那边冷不冷”，后面一个字也没有写。",
      "柜门内侧贴着一张发黄的单子：“修好的表——邮递员老周一块、楼下小姑娘一块、自己的，还没修。”",
      "暖气片后面掉着一张照片：一个男孩骑在一辆大自行车上，咧着嘴，缺了一颗门牙。背面写着“小树，九岁”。",
      "床板下面压着一张纸条，字很工整：“给下一个住这里的人：屋子会响，但不会塌。日子也是。”",
    ],
    end: "你把那张纸条重新压回床板下面。等你走的时候，下一个人也会读到它。",
  },
  {
    id: "boy",
    who: "一个母亲带着她的儿子",
    bits: [
      "门框背面有一道一道铅笔画的横线，旁边写着“小明 五岁”“小明 六岁”。",
      "床底的墙脚上有一个蜡笔画的太阳，画得很圆，旁边还有一个歪歪扭扭的“家”字。",
      "缝隙里塞着一张购物单，是孩子的笔迹：“盐、火柴、妈妈的药，找回来的钱买一颗糖。”",
      "镜子背后夹着一张明信片，盖着海港的邮戳：“等我回来，带你们去看海。——爸爸”",
      "柜子侧板上刻着一行小字：“今天妈妈哭了。我把我的糖给她了。”",
      "门框最上面那道线写着：“小明 十二岁。搬新家啦！再见，旧房子！”字写得很大，一直写到了门框外面。",
    ],
    end: "你在门框上比了比自己。那道写着十二岁的线，只到你的胸口。",
  },
  {
    id: "teacher",
    who: "一位退休的语文老师",
    bits: [
      "抽屉角落里有一小截粉笔头，捏一下，手指就白了。",
      "柜子里垫着一张学生写的贺卡：“老师，我考上了。您说过的，字要一笔一画写。”",
      "柜子侧面用铅笔写着一首小诗，最后一句是：“窗子很小，天很大。”",
      "一张对折的名单，三十几个名字，有几个名字后面画了小星星，有一个后面写着“要多关心”。",
      "窗台的缝里卡着一支红笔，笔帽上咬满了牙印。",
      "床头的墙上有一行很淡的字：“这间屋子的冬天很长，可春天每年都来，我数过。”",
    ],
    end: "你突然很想把这一年也写下来，一笔一画地写。",
  },
  {
    id: "tram",
    who: "一对开夜班电车的年轻夫妻",
    bits: [
      "柜子里有一个旧电车票夹，铁的，还能咔嗒咔嗒地按。",
      "柜门内侧钉着一张发黄的排班表，有一格画了个圈，写着“结婚纪念日——换班！”",
      "窗台下面刻着两个名字：“阿勇 + 秀兰”，中间的加号被人描过很多遍。",
      "暖气片后面掉着半张合影，只剩一个穿制服的姑娘，笑得眼睛都看不见了。",
      "床板缝里有一张电车票根，背面写着：“末班车，你又给我留了座。”",
      "抽屉底下压着一张纸条：“我们搬去南边了。愿你在这间屋子里，也有人给你留一盏灯。”",
    ],
    end: "夜里电车开过的时候，你会想起他们。也许他们还在南边开着车。",
  },
];
const LH_WHERE = { clean: "收拾屋子的时候，", dishes: "洗碗的时候，", fix: "修东西的时候，", watch: "站在窗边的时候，", nails: "", laundry: "洗衣服的时候，" };
function lhRand(tag) {
  let s = lifeHash(String(G.seed) + "-" + tag) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function lhEnsure() {
  if (!G || !G.life) return;
  const L = G.life;
  if (typeof L.tenant !== "string" || !LH_TENANTS.some((t) => t.id === L.tenant)) L.tenant = LH_TENANTS[Math.floor(lhRand("tenant")() * LH_TENANTS.length)].id;
  if (typeof L.tenantBits !== "number") L.tenantBits = 0;
  if (!Array.isArray(L.dreams)) L.dreams = [];
}
const lhPrevEnsure = lifeEnsure;
lifeEnsure = function () {
  lhPrevEnsure();
  lhEnsure();
};
function lhTenant() {
  lifeEnsure();
  return LH_TENANTS.find((t) => t.id === G.life.tenant);
}
// The traces turn up across the whole year, one at a time, while doing ordinary things.
function lhFindTrace(how, chance) {
  lifeEnsure();
  const L = G.life,
    t = lhTenant(),
    i = L.tenantBits;
  if (i >= t.bits.length || day() < 5 + i * 40 || day() - (L.tenantAt || 0) < 18 || rngNext(G) > chance) return false;
  L.tenantBits++;
  L.tenantAt = day();
  const last = L.tenantBits === t.bits.length;
  logEvent((LH_WHERE[how] || "") + "你发现：" + t.bits[i] + (i === 0 ? `（这屋子以前住过${t.who}。）` : "") + (last ? t.end : ""), "story");
  G.stats.morale = clamp(G.stats.morale + (last ? 8 : 3));
  LH.say = last ? t.end : "以前住在这里的人，留下了一点东西。";
  return true;
}

/* ---------- Dreams ---------- */
const LH_DREAMS = {
  hungry: ["梦见妈在厨房里炸油饼，满屋子都是香味。你伸手去拿，就醒了。", "梦见一张长长的桌子，上面摆满了菜，可是每一盘都够不着。"],
  cold: ["梦见自己在雪地里走，怎么也走不到那扇亮着灯的窗户。", "梦见小时候发烧，爸背着你去医院，他的背很暖。"],
  alert: ["梦见楼道里有脚步声，一层一层往上走，停在了你的门口。你屏住呼吸，醒了。", "梦见有人在街上喊你的名字，你想答应，又不敢。"],
  good: ["梦见和小禾在河边骑车，她骑得飞快，回头冲你笑。", "梦见自己推开门，外面是夏天，楼下的人都在跟你打招呼。", "梦见全家坐在一起吃年夜饭，爸破天荒地给你夹了一筷子菜。"],
  letter: ["梦见小禾坐在你的旧床上写信，一边写一边念给你听。", "梦见妈在灯下把信折好，塞进一个旧书包里。"],
  any: [
    "梦见自己在一列很长的电车上，车一直开，一直没有到站。",
    "梦见一间和这里一模一样的屋子，只是窗外是海。",
    "梦见自己又回到了那天的码头，但这一次，你转身走了。",
    "梦见楼上的琴声变成了雨，落在你的脸上。",
    "梦见自己在数日历上的刻痕，数着数着，日历变成了一本书。",
    "梦见一个看不清脸的人递给你一把钥匙，说：“到时候了。”",
    "梦见自己在学校里，老师在讲台上点名，点到你的时候，你答了一声“到”。",
    "梦见小时候住的那条街，下着雨，有人在卖糖葫芦。",
    "什么也没梦见。睡得很沉，醒来时窗外的光已经换了方向。",
    "梦见窗台上的葱长得比人还高，你顺着它爬了出去。",
  ],
};
function lhDream(slept) {
  lifeEnsure();
  const L = G.life;
  if (slept < 240 || rngNext(G) > 0.4) return;
  const s = G.stats,
    pools = [];
  if (lifeAlertActive()) pools.push("alert");
  if (s.food < 40) pools.push("hungry");
  if (temperature() < 13) pools.push("cold");
  if ((L.letters || 0) > 0 && rngNext(G) < 0.4) pools.push("letter");
  if (s.morale > 65 && rngNext(G) < 0.5) pools.push("good");
  pools.push("any");
  for (const p of pools) {
    const left = LH_DREAMS[p].map((t, i) => p + i).filter((k) => !L.dreams.includes(k));
    if (!left.length) continue;
    const k = left[Math.floor(rngNext(G) * left.length)],
      text = LH_DREAMS[p][+k.slice(p.length)];
    L.dreams.push(k);
    logEvent("醒来以前，你" + text, "story");
    G.stats.morale = clamp(G.stats.morale + (p === "alert" ? -2 : p === "good" || p === "letter" ? 3 : 1));
    LH.say = text.length > 26 ? text.slice(0, text.search(/[。，]/) + 1 || 26) : text;
    return;
  }
}

/* ---------- Hooks ---------- */
const lhBase = { doAction, hourlyUpdate, lrFix, lrWatch };
doAction = function (action, value) {
  const before = G ? G.minute : 0,
    r = lhBase.doAction(action, value);
  if (!G || G.ended) return r;
  if (action === "sleep") lhDream(G.minute - before);
  else if (action === "clean") lhFindTrace("clean", 0.5);
  else if (action === "laundry") lhFindTrace("laundry", 0.2);
  else if (action === "dishes") lhFindTrace("dishes", 0.12);
  return r;
};
lrFix = function (id) {
  const r = lhBase.lrFix(id);
  lhFindTrace("fix", 0.9);
  return r;
};
lrWatch = function () {
  const r = lhBase.lrWatch();
  lhFindTrace("watch", 0.12);
  return r;
};
// Dated days are told at their hour (fireworks in the evening, birdsong at dawn), not at midnight.
hourlyUpdate = function () {
  lhBase.hourlyUpdate();
  if (!G || G.ended || day() < 3) return;
  const h = Math.floor(lhHour()),
    d = day();
  if (G.life.birthday === d && h === 12) {
    logEvent(LR_BIRTHDAY, "story");
    G.stats.morale = clamp(G.stats.morale - 1);
    LH.say = "今天是你的生日。";
  }
  for (const [dd, t] of LR_DAYS)
    if (dd === d && (LH_DAY_HOUR[dd] ?? 9) === h) {
      logEvent(dd === 262 && lrOutdoor(d) > -2 ? LH_COLDEST_MILD : t, "story");
      G.stats.morale = clamp(G.stats.morale + 3);
      LH.say = (dd === 262 && lrOutdoor(d) > -2 ? LH_COLDEST_MILD : t).split("。")[0] + "。";
    }
};
