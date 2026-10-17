/* 闭门365 · v0.11 variety and replay value. Everything here is decided by the run's seed, so two runs differ:
   - which gang you crossed, its boss, the districts in the news, the order of mid-year events and the ending verdict;
   - which neighbours you overhear (3 of 6 long storylines through the walls) and a pool of everyday building events;
   - which radio play airs first; five personal goals for the year;
   - long hobby projects: paper cranes that hang by the window, a memoir in the notebook, 500-piece puzzles;
   - multiple endings and a cross-run record (endings found, goals reached) kept in localStorage. */
const LM_GANGS = [
  { g: "灰鸦会", b: "老鸦", why: "你替灰鸦会管过一本账，后来那本账不见了" },
  { g: "黑潮帮", b: "船长", why: "你在码头看见了不该看的货，还被人看见了" },
  { g: "金蛇会", b: "七爷", why: "你在金蛇会的牌桌上赢了一笔不该赢的钱" },
  { g: "铁桥会", b: "白先生", why: "你拒绝替铁桥会顶罪，还把他们的人送进了警署" },
];
const LM_DISTRICTS = ["西岭区", "北桥区", "旧城区", "港湾区", "东坡区", "钟楼区", "南闸区"];
const LM_NEWS_OPEN = [
  [1, "港区三号仓库昨夜起火。帝国警署称，火灾可能与“{G}”的账目纠纷有关。"],
  [4, "警署宣布成立专案组，专门调查{G}。市民提供线索可拨打热线。"],
  [9, "据报道，{G}正在城中四处打听一个人的下落。警方提醒：陌生人敲门不要开。", 1],
];
const LM_NEWS_MID = [
  ["电力公司通知：{D}线路老化，近期可能出现短时停电，请市民备好照明。"],
  ["专案组查封了{G}经营的三家地下赌场，带走二十余人。"],
  ["{D}多栋旧楼出现自称“查水表”的人挨户敲门。供水公司表示近期没有上门安排。", 1],
  ["副食品价格小幅上涨。市政府表示，粮油供应充足，不必抢购。"],
  ["{G}的二号人物在码头被捕。警方称这是专案组成立以来最大的进展。"],
  ["{D}供水管道检修，个别楼栋可能间歇停水，请提前储水。"],
  ["码头一带昨夜发生冲突。据悉{G}内部出现分裂。"],
  ["专案组公布了一批{G}的账本复印件，涉及多名商人与官员。"],
  ["{D}有居民反映，深夜有人在楼道里挨层查看门牌。警方已加强巡逻。", 1],
  ["帝国议会通过《证人保护条例》修正案，愿意作证者可获得新身份。"],
  ["{G}旗下运输公司被吊销执照，城南两座仓库被贴上封条。"],
  ["一名{G}成员向警方自首，并交出了一把仓库钥匙。"],
  ["{G}残余人员据传在{D}重新聚集，警方提醒高层住户夜间关好门窗。", 1],
  ["“{B}”的下落成谜，有传闻称他已经离开帝国。"],
  ["边境检查站加强检查。警方表示，“{B}”仍在国内的可能性很大。"],
  ["{D}一栋公寓楼昨夜有人假冒邮差敲门，被巡警当场带走。", 1],
  ["{G}在{D}的一处据点被端，警方缴获大量借据。"],
  ["一位匿名市民把{G}的放债名单寄到了报社。报社表示将交给警方。"],
  ["{G}的律师团宣布集体辞职。"],
  ["{D}的居民自发成立夜间巡逻队，挨家挨户提醒关好门窗。"],
  ["市电台收到大量来信，询问{G}案的进展。专案组表示“快了”。"],
  ["{G}的一名会计在火车站被拦下，随身带着两只皮箱。"],
  ["有人在{D}张贴寻人启事，照片模糊。警方提醒：不要理会来路不明的寻人启事。", 1],
  ["“{B}”的情妇向警方提供了一处海边别墅的地址。"],
];
const LM_NEWS_END = [
  [[290, "“{B}”在北方边境小镇被捕。消息传出后，码头工人自发放了鞭炮。"], [328, "{G}剩余在逃人员大多已投案。警方称组织“基本瓦解”。"], [358, "宣判：“{B}”被判终身监禁，{G}被依法取缔，其全部债务关系一律无效。"]],
  [[285, "“{B}”在海边别墅被包围，最终投降。"], [330, "庭审中，“{B}”当庭认罪，并供出了{G}的全部账目。"], [358, "宣判：{G}被宣布为非法组织，所有成员的追债行为一律无效。"]],
  [[300, "{G}内讧，“{B}”被手下出卖，交给了警方。"], [334, "帝国检察院宣布，对{G}案中的被胁迫者不予追究。"], [358, "宣判：“{B}”被判二十五年。{G}的旧账被当众销毁。"]],
];
const LM_SERIAL_B = [
  "午夜邮差老周，只在半夜十二点送信。",
  "第一封信寄给一位老裁缝，信是他二十年前的自己写的。",
  "老周送信从不敲门，只把信从门缝塞进去。",
  "一个小女孩每天半夜守在门口，想看看邮差的脸。",
  "老周的邮包里有一封信，地址写的是他自己家。",
  "他不敢拆。他把那封信送了整整一个月，每晚都送回邮包里。",
  "小女孩终于等到了他。她问：叔叔，你给自己送过信吗？",
  "老周拆开了信。是他已经过世的妻子写的。",
  "信里只有一句话：记得吃早饭。",
  "老周第一次在白天出了门，去了早点铺。",
  "早点铺的老板娘说，你妻子以前每天都来，买两份。",
  "老周在邮包里放了一封自己的信，寄往“以后”。",
  "大结局：小女孩长大后当了邮差。她只在早上送信。",
];
// Long neighbour storylines heard through walls and the hallway.
const LM_CHAINS = [
  { id: "piano", name: "楼上的琴声", steps: [
    "楼上有人在练琴，一个音一个音地按，经常按错。听起来是个孩子。",
    "楼上的孩子今天练了两个小时，同一段反反复复。你发现自己在跟着数拍子。",
    "楼上的琴声连起来了，是一首简单的圆舞曲。你听完才发现自己在笑。",
    "楼上传来大人的声音：“下个月就要比赛了。”琴声一直响到很晚。",
    "楼上整整一天没有琴声。傍晚，你听见楼道里有人兴奋地说：“第二名！”",
    "深夜，楼上轻轻弹了一首很慢的曲子，是你小时候学过的。你坐在床边听完了。",
  ] },
  { id: "elders", name: "对门的老夫妻", steps: [
    "对门的老两口在门口拌嘴，为了一把伞该谁拿。最后是老太太赢了。",
    "对门飘来炖肉的香味。老头在楼道里说：“四十年了，你还记得我爱吃这个。”",
    "半夜，对门的门开了又关，有很急的脚步声下楼。后来就安静了。",
    "对门一连几天没有动静。你有点担心，又不能去敲门。",
    "楼道里传来老太太的声音：“慢点，慢点，到家了。”对门的灯又亮了。",
    "对门的收音机开得很大，在放老歌。老两口跟着唱，唱得都不在调上。",
  ] },
  { id: "baby", name: "楼下的新住户", steps: [
    "楼下搬来了一对年轻夫妻，搬了一整天，楼梯上全是笑声。",
    "楼下的小夫妻在吵架，吵到一半，突然一起笑了。",
    "夜里，楼下传来婴儿的哭声。一整夜，断断续续。",
    "楼下的婴儿又在哭，有人一直在轻轻哼歌。你不知不觉也跟着哼。",
    "楼下的孩子会叫“妈妈”了，全家人在楼道里欢呼。",
    "楼下的一家要搬走了。你听见那个孩子在楼道里说：“再见，房子。”",
  ] },
  { id: "tenant", name: "隔壁的房客", steps: [
    "隔壁住着一个很安静的人。你只在深夜听见他的打字机声。",
    "隔壁的打字机响了一整夜。早上，你听见他把一沓纸塞进了炉子。",
    "有人敲隔壁的门，敲了很久。隔壁一点声音也没有。你屏住了呼吸——他也是。",
    "墙上传来三下很轻的敲击声。停了一会儿，又是三下。你犹豫了很久，也敲了三下。",
    "每天晚上十点，隔壁都会敲三下。你也敲三下。这成了你们之间唯一的对话。",
    "今晚隔壁敲的不是三下，是很多下，节奏很欢快。第二天，打字机声没有了，门开着。",
  ] },
  { id: "cat", name: "楼道里的猫", steps: [
    "楼道里有猫在叫，叫得很委屈。有孩子的声音说：“别怕，给你吃的。”",
    "楼道里的猫每天傍晚都来，孩子们给它取名叫“煤球”。",
    "这几天没有听见煤球的叫声，孩子们在楼道里到处找。",
    "楼道里传来一阵细细的叫声——不止一只。孩子们尖叫：“煤球生小猫了！”",
    "孩子们在楼道里给小猫们取名字，争了一下午。",
    "小猫们被邻居们一只一只领回了家。煤球还是每天傍晚来，在你门口坐一会儿。",
  ] },
  { id: "pigeon", name: "窗台上的鸽子", steps: [
    "一只灰鸽子落在窗外的铁皮檐上，歪着头往屋里看。",
    "那只鸽子又来了，还带来了另一只。它们在檐上晒太阳。",
    "早上，窗外传来咕咕声。两只鸽子在对面屋檐下衔着树枝飞来飞去。",
    "对面屋檐下的鸽子窝里，多了两个小小的灰脑袋。",
    "小鸽子们在练飞，在两栋楼之间摇摇晃晃。你在窗帘后面替它们捏了一把汗。",
    "鸽子一家在天上绕了一大圈，落在你的窗外，待了一会儿，又飞走了。",
  ] },
];
const LM_EVENTS = [
  ["楼下有人在修自行车，叮叮当当一下午。", 0],
  ["窗外下起了雨，雨点打在铁皮檐上，很好听。", 2],
  ["远处传来电车的铃声，一辆接一辆。城市照常运转。", 1],
  ["暖气管里咣当响了几声，像有人在里面走路。", -1],
  ["楼上的人家在剁饺子馅，剁了半个钟头。你突然很饿。", -1],
  ["一阵风把窗户吹得咯咯响。你检查了一遍插销。", 0],
  ["楼道里有人在唱歌，唱的是老电影里的插曲。", 2],
  ["对面楼有人在阳台上晒被子，拍打被子的声音传了过来。", 1],
  ["窗外有孩子在放风筝，风筝飘到了你窗口的高度。", 3],
  ["楼下有人打碎了一个碗，然后是一阵很长的叹气。", 0],
  ["隔壁楼有人在拉二胡，拉得断断续续，但很认真。", 1],
  ["今天的天空特别蓝。你在窗帘缝里看了很久。", 3],
  ["楼道里飘来烤红薯的味道。你咽了一下口水。", -1],
  ["远处工厂的汽笛响了，下班了。", 0],
  ["楼下的邮递员在喊某个人的名字，喊了好几遍，没人应。", -1],
  ["夜里突然很安静，安静得能听见自己的心跳。", -2],
  ["有人在楼道里数楼梯，一、二、三……数到你这层停了一下，又继续往上数。", -2],
  ["窗外有一群鸟飞过，排成了一个歪歪扭扭的人字。", 2],
  ["对面楼有一扇窗子整夜亮着灯。你猜那个人也睡不着。", 0],
  ["一只蝴蝶撞在窗玻璃上，停了一会儿，飞走了。", 2],
  ["楼下传来收音机里的球赛，进球的时候整栋楼都在喊。", 3],
  ["有人在楼道里吵架，为了谁家的鞋放在了门口。", -1],
  ["你在抽屉缝里找到一张旧电影票，是上一个租客留下的。", 1],
  ["你发现墙上有一道铅笔画的身高线，旁边写着“小明 七岁”。", 1],
  ["窗外的电线上落满了麻雀，叽叽喳喳。", 1],
  ["雷声从远处滚过来，屋里的灯闪了一下，又亮了。", -1],
  ["楼下的老式挂钟敲了十二下。你数完了才发现自己在数。", 0],
  ["一个纸飞机从楼上飞下来，经过你的窗口。", 2],
  ["楼道里有人在扫地，扫到你门口时，动作放轻了。", 0],
  ["你梦见了家里的厨房。醒来时，好像还能闻到葱花的味道。", 1],
  ["窗外起了大雾，对面的楼都看不见了。整个世界只剩你的屋子。", -1],
  ["天边有一道很淡的彩虹，只出现了一分钟。", 4],
];
const LM_CHAPTERS = ["离家那天", "第一个夜晚", "父亲的手", "妹妹的自行车", "我欠下的东西", "这间屋子", "窗外的城市", "母亲的厨房", "我害怕的事", "我学会的事", "如果能重来", "回家以后"];
const LM_GOALS = [
  { id: "garden", t: "收获15次自己种的菜", need: "pots", f: (L) => [L.harvests, 15] },
  { id: "cranes300", t: "折满300只纸鹤", need: "origami", f: (L) => [L.cranes, 300] },
  { id: "cranes1000", t: "折满一千只纸鹤", need: "origami", f: (L) => [L.cranes, 1000] },
  { id: "memoir", t: "写完回忆录的十二章", need: "notebook", f: (L) => [Math.floor(L.memoir / 20), 12] },
  { id: "puzzle", t: "拼完两次500片拼图", need: "puzzle", f: (L) => [L.puzzles, 2] },
  { id: "patient", t: "拆开10封信，一封都不提前", f: (L) => [L.early ? 0 : L.letters, 10] },
  { id: "listener", t: "听完20集广播剧", need: "radio", f: (L) => [L.serial, 20] },
  { id: "news", t: "听到20条新闻", need: "radio", f: (L) => [L.news, 20] },
  { id: "fit", t: "做60次伸展锻炼", f: (L) => [L.ex, 60] },
  { id: "tidy", t: "100天睡前房间都很整洁", f: (L) => [L.cleanDays, 100] },
  { id: "cheer", t: "150天保持好心情", f: (L) => [L.happyDays, 150] },
  { id: "books", t: "读完4本书", f: () => [Object.entries(G.books || {}).filter(([id, b]) => DB[id] && b.pages >= DB[id].pages).length, 4] },
];
const LM_ENDINGS = [
  { id: "garden", t: "窗台上的春天", hint: "收获很多次自己种的菜", ok: (L) => L.harvests >= 20 },
  { id: "cranes", t: "千羽鹤", hint: "折满一千只纸鹤", ok: (L) => L.cranes >= 1000 },
  { id: "memoir", t: "写下这一年", hint: "写完整本回忆录", ok: (L) => L.memoir >= 240 },
  { id: "patient", t: "守约的人", hint: "拆开全部家信，一封都不提前", ok: (L) => L.letters >= 16 && !L.early },
  { id: "listener", t: "老听众", hint: "听完两部广播剧", ok: (L) => L.serial >= 39 },
  { id: "puzzle", t: "拼图的人", hint: "拼完三次拼图", ok: (L) => L.puzzles >= 3 },
  { id: "home", t: "归港", hint: "撑过365天", ok: () => true },
];
const LM_RECORD_KEY = "closed365-records-v1";
const LM = { seed: null, gang: LM_GANGS[0] };
function lmRand(tag) {
  let s = lifeHash(String(G.seed) + "-" + tag) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function lmShuffle(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Rebuild the run's news, radio plays and gang from the seed (pure function of G.seed).
function lmSetup() {
  if (!G || LM.seed === G.seed) return;
  LM.seed = G.seed;
  const r = lmRand("story");
  LM.gang = LM_GANGS[Math.floor(r() * LM_GANGS.length)];
  const D = lmShuffle(LM_DISTRICTS, r),
    fill = (t, k) => t.replace(/\{G\}/g, LM.gang.g).replace(/\{B\}/g, LM.gang.b).replace(/\{D\}/g, D[k % D.length]);
  const end = LM_NEWS_END[Math.floor(r() * LM_NEWS_END.length)],
    mid = lmShuffle(LM_NEWS_MID, r).slice(0, 19),
    first = 14,
    last = end[0][0] - 10;
  const news = LM_NEWS_OPEN.map(([d, t, a], k) => ({ d, t: fill(t, k), alert: !!a }));
  mid.forEach(([t, a], k) => news.push({ d: Math.round(first + ((last - first) * k) / (mid.length - 1) + (r() - 0.5) * 4), t: fill(t, k + 1), alert: !!a }));
  end.forEach(([d, t], k) => news.push({ d, t: fill(t, k) }));
  news.sort((a, b) => a.d - b.d);
  LIFE_NEWS.length = 0;
  LIFE_NEWS.push(...news);
  const A = LIFE_SERIAL_A.map((t, i) => ({ t, name: "雾港旅馆", ep: i + 1, of: LIFE_SERIAL_A.length })),
    B = LM_SERIAL_B.map((t, i) => ({ t, name: "午夜邮差", ep: i + 1, of: LM_SERIAL_B.length })),
    plays = r() < 0.5 ? [...A, ...B] : [...B, ...A];
  LIFE_SERIAL.length = 0;
  LIFE_SERIAL.push(...plays.map((p) => p.t));
  LIFE_SERIAL_META.length = 0;
  LIFE_SERIAL_META.push(...plays);
}
function lmEnsure() {
  if (!G || !G.life) return;
  const L = G.life;
  for (const [k, v] of Object.entries({ cranes: 0, memoir: 0, puzzles: 0, pieces: 0, ex: 0, cleanDays: 0, happyDays: 0, chains: null, goals: null, goalsDone: [], seen: {}, ending: "" }))
    if (L[k] === undefined) L[k] = v;
  lmSetup();
  if (!L.chains) {
    const r = lmRand("chains");
    L.chains = {};
    lmShuffle(LM_CHAINS.map((c) => c.id), r).slice(0, 3).forEach((id, k) => (L.chains[id] = { step: 0, next: 3 + k * 5 + Math.floor(r() * 6) }));
  }
  if (!L.goals && G.inv.length) {
    const owned = new Set(G.inv.map((b) => b.id)),
      r = lmRand("goals");
    L.goals = lmShuffle(LM_GOALS.filter((g) => !g.need || owned.has(g.need)), r).slice(0, 5).map((g) => g.id);
  }
}
const lmBaseEnsure = lifeEnsure;
lifeEnsure = function () {
  lmBaseEnsure();
  lmEnsure();
};
function lmRecords() {
  try {
    const r = JSON.parse(localStorage.getItem(LM_RECORD_KEY) || "null");
    if (r && typeof r === "object") return { runs: r.runs | 0, wins: r.wins | 0, best: r.best | 0, endings: Array.isArray(r.endings) ? r.endings : [], goals: Array.isArray(r.goals) ? r.goals : [] };
  } catch (e) {}
  return { runs: 0, wins: 0, best: 0, endings: [], goals: [] };
}
function lmSaveRecords(r) {
  try {
    localStorage.setItem(LM_RECORD_KEY, JSON.stringify(r));
  } catch (e) {}
}
function lmGoalRows() {
  lifeEnsure();
  return (G.life.goals || []).map((id) => {
    const g = LM_GOALS.find((x) => x.id === id);
    const [cur, max] = g.f(G.life);
    return { id, t: g.t, cur: Math.min(cur, max), max, done: G.life.goalsDone.includes(id) };
  });
}
function lmCheckGoals() {
  for (const row of lmGoalRows()) {
    if (row.done || row.cur < row.max) continue;
    G.life.goalsDone.push(row.id);
    G.stats.morale = clamp(G.stats.morale + 8);
    logEvent(`完成了今年的小目标：${row.t}。`, "good");
    notify("小目标达成：" + row.t, "good");
    const rec = lmRecords();
    if (!rec.goals.includes(row.id)) rec.goals.push(row.id);
    lmSaveRecords(rec);
  }
}
/* ---------- Events ---------- */
function lmApply(m) {
  if (m) G.stats.morale = clamp(G.stats.morale + m);
}
function lmChainStep() {
  const L = G.life;
  for (const [id, c] of Object.entries(L.chains || {})) {
    const chain = LM_CHAINS.find((x) => x.id === id);
    if (!chain || c.step >= chain.steps.length || day() < c.next) continue;
    logEvent(chain.steps[c.step], "story");
    c.step++;
    c.next = day() + 12 + Math.floor(rngNext(G) * 30);
    lmApply(c.step === chain.steps.length ? 6 : 2);
    return true;
  }
  return false;
}
function lmPoolEvent() {
  const L = G.life,
    d = day();
  const pool = LM_EVENTS.map((e, i) => i).filter((i) => !L.seen[i] || d - L.seen[i] > 40);
  if (!pool.length) return false;
  const i = pool[Math.floor(rngNext(G) * pool.length)];
  L.seen[i] = d;
  logEvent(LM_EVENTS[i][0], LM_EVENTS[i][1] < 0 ? "normal" : "good");
  lmApply(LM_EVENTS[i][1]);
  return true;
}
const lmBase = { randomEvent, dailyUpdate, doLeisure, doAction, endGame };
randomEvent = function () {
  lifeEnsure();
  if (G.pendingKnock || lifeAlertActive()) return lmBase.randomEvent();
  if (lmChainStep()) return;
  if (rngNext(G) < 0.5 && lmPoolEvent()) return;
  return lmBase.randomEvent();
};
dailyUpdate = function () {
  lifeEnsure();
  const L = G.life;
  if (G.dirt < 25) L.cleanDays++;
  if (G.stats.morale >= 65) L.happyDays++;
  lmBase.dailyUpdate();
  if (day() === 2) logEvent(`${LM.gang.why}。从今天起，${LM.gang.g}的人在找你。`, "story");
  lmCheckGoals();
};
doAction = function (action, value) {
  const r = lmBase.doAction(action, value);
  if (action === "exercise" && G) {
    lifeEnsure();
    G.life.ex++;
  }
  return r;
};
/* ---------- Hobby projects ---------- */
doLeisure = function (id) {
  if (!G || !has(id)) return lmBase.doLeisure(id);
  lifeEnsure();
  const L = G.life;
  if (id === "origami") {
    const n = Math.min(Math.ceil(amount("origami")), 6 + Math.floor(rngNext(G) * 5)),
      before = L.cranes;
    use("origami", n);
    const el = advanceTime(60, "leisure");
    L.cranes += n;
    G.stats.morale = clamp(G.stats.morale + 4 * (el / 60) + (Math.floor(L.cranes / 100) > Math.floor(before / 100) ? 6 : 0));
    logEvent(
      Math.floor(L.cranes / 100) > Math.floor(before / 100)
        ? `第${Math.floor(L.cranes / 100) * 100}只纸鹤。窗边的纸鹤串又多了几串。`
        : `折了${n}只纸鹤，一共${L.cranes}只了。${L.cranes >= 1000 ? "据说一千只能许一个愿。" : ""}`,
      "good",
    );
    lmCheckGoals();
    saveGame(false);
    return;
  }
  const r = lmBase.doLeisure(id);
  if (id === "notebook") {
    const ch = Math.floor(L.memoir / 20);
    L.memoir += 6 + Math.floor(rngNext(G) * 5);
    if (Math.floor(L.memoir / 20) > ch && ch < LM_CHAPTERS.length) {
      G.stats.morale = clamp(G.stats.morale + 6);
      logEvent(`回忆录写完了第${ch + 1}章《${LM_CHAPTERS[ch]}》。`, "good");
    }
  }
  if (id === "puzzle") {
    L.pieces += 45 + Math.floor(rngNext(G) * 30);
    if (L.pieces >= 500) {
      L.pieces = 0;
      L.puzzles++;
      G.stats.morale = clamp(G.stats.morale + 12);
      logEvent(`拼完了第${L.puzzles}次。看了一会儿，又把它拆散装回了盒子。`, "good");
    } else logEvent(`拼图拼到了${L.pieces}/500片。`, "normal");
  }
  lmCheckGoals();
  return r;
};
/* ---------- Endings and records ---------- */
function lmEnding() {
  lifeEnsure();
  return G.win ? LM_ENDINGS.find((e) => e.ok(G.life)) : { id: "lost", t: "未完的一年", hint: "" };
}
endGame = function (win, reason) {
  if (G && !G.ended) {
    G.win = win;
    const e = lmEnding();
    G.life.ending = e.id;
    const rec = lmRecords();
    rec.runs++;
    if (win) rec.wins++;
    rec.best = Math.max(rec.best, win ? 365 : day());
    if (win && !rec.endings.includes(e.id)) rec.endings.push(e.id);
    lmSaveRecords(rec);
  }
  return lmBase.endGame(win, reason);
};
