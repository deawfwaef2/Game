/* 闭门365 — original game data, fictional 1980s subsidized prices. */
const VERSION = "0.15.0-preview";
const CATEGORIES = [
  ["all", "全部物资"],
  ["staple", "主食与干粮"],
  ["canned", "罐头与蛋白"],
  ["fresh", "新鲜食材"],
  ["drink", "饮水与饮品"],
  ["hygiene", "洗护与衣物"],
  ["clean", "清洁与防护"],
  ["medical", "药品与护理"],
  ["tool", "生活工具"],
  ["leisure", "书籍与消遣"],
  ["furniture", "小件家居"],
];
const CATALOG = [];
function food(
  id,
  name,
  price,
  weight,
  servings,
  kcal,
  life,
  category = "staple",
  extra = {},
) {
  CATALOG.push({
    id,
    name,
    price,
    weight,
    servings,
    kcal,
    life,
    category,
    kind: "food",
    ...extra,
  });
}
function item(id, name, price, weight, category, uses = 1, extra = {}) {
  CATALOG.push({
    id,
    name,
    price,
    weight,
    servings: uses,
    category,
    kind: "tool",
    life: 9999,
    ...extra,
  });
}
food("rice", "帝国配给大米 · 5kg", 4.4, 5, 25, 720, 730, "staple", {
  cook: true,
  flavor: "grain",
  desc: "25份，需加水烹煮。低价长储主食。",
});
food("oats", "原味燕麦 · 1kg", 0.95, 1, 10, 380, 540, "staple", {
  cook: true,
  flavor: "oat",
});
food("pasta", "通心面 · 1kg", 1.1, 1, 8, 450, 730, "staple", {
  cook: true,
  flavor: "pasta",
});
food("flour", "小麦粉 · 2kg", 1.65, 2, 12, 600, 540, "staple", {
  cook: true,
  flavor: "wheat",
});
food("cornmeal", "黄金玉米粉 · 2kg", 1.6, 2, 12, 590, 540, "staple", {
  cook: true,
  flavor: "corn",
});
food("beans", "干红豆 · 1kg", 1.15, 1, 8, 425, 730, "staple", {
  cook: true,
  flavor: "bean",
});
food("lentils", "红扁豆 · 1kg", 1.1, 1, 8, 440, 730, "staple", {
  cook: true,
  flavor: "lentil",
});
food("buckwheat", "荞麦米 · 1kg", 1.3, 1, 8, 430, 540, "staple", {
  cook: true,
  flavor: "buckwheat",
});
food("noodles", "鸡蛋挂面 · 500g", 0.65, 0.5, 4, 450, 365, "staple", {
  cook: true,
  flavor: "noodle",
});
food("crackers", "咸味苏打饼 · 500g", 0.85, 0.5, 5, 420, 365, "staple", {
  flavor: "cracker",
});
food("hardtack", "压缩口粮 · 1kg", 1.75, 1, 8, 500, 1095, "staple", {
  flavor: "ration",
  desc: "无需烹煮。停电时的可靠储备。",
});
food("bread", "黑麦面包", 0.45, 0.45, 3, 350, 5, "fresh", { flavor: "bread" });
food("potato", "土豆 · 2kg", 0.85, 2, 8, 200, 30, "fresh", {
  cook: true,
  flavor: "potato",
});
food("sweetpotato", "红薯 · 1kg", 0.6, 1, 4, 230, 21, "fresh", {
  cook: true,
  flavor: "sweetpotato",
});
food("oil", "葵花籽油 · 1L", 1.8, 0.93, 40, 205, 540, "staple", {
  flavor: "oil",
  ingredient: true,
  desc: "烹饪配料，搭配主食，不可直接当饭吃。",
});
food("peanut", "花生酱 · 500g", 1.15, 0.55, 12, 250, 365, "staple", {
  flavor: "peanut",
});
food("nuts", "混合坚果 · 500g", 1.75, 0.5, 10, 300, 180, "staple", {
  flavor: "nut",
});
food("raisins", "葡萄干 · 300g", 0.8, 0.3, 6, 150, 365, "staple", {
  flavor: "raisin",
});
food("sugar", "白砂糖 · 1kg", 0.7, 1, 40, 100, 1095, "staple", {
  flavor: "sugar",
  ingredient: true,
});
food("chocolate", "黑巧克力 · 100g", 0.6, 0.1, 2, 270, 365, "staple", {
  flavor: "chocolate",
  joy: 5,
});
food("biscuit", "黄油小饼干 · 300g", 0.7, 0.3, 5, 280, 180, "staple", {
  flavor: "biscuit",
  joy: 2,
});
food("jam", "草莓果酱 · 400g", 0.85, 0.55, 8, 135, 365, "staple", {
  flavor: "jam",
  joy: 2,
});
food("pork", "午餐肉罐头", 0.75, 0.38, 2, 390, 1095, "canned", {
  flavor: "pork",
  protein: true,
});
food("fish", "沙丁鱼罐头", 0.6, 0.22, 1, 340, 1095, "canned", {
  flavor: "fish",
  protein: true,
});
food("tuna", "盐水金枪鱼罐头", 0.8, 0.22, 1, 210, 1095, "canned", {
  flavor: "tuna",
  protein: true,
});
food("beef", "土豆炖牛肉罐头", 0.9, 0.55, 2, 310, 1095, "canned", {
  flavor: "beef",
  protein: true,
});
food("bakedbeans", "番茄焗豆罐头", 0.45, 0.45, 2, 250, 1095, "canned", {
  flavor: "bakedbean",
  protein: true,
});
food("peas", "青豆罐头", 0.4, 0.4, 2, 170, 1095, "canned", {
  flavor: "pea",
  vegetable: true,
});
food("tomato", "番茄罐头", 0.4, 0.45, 2, 100, 730, "canned", {
  flavor: "tomato",
  vegetable: true,
});
food("corncan", "甜玉米罐头", 0.45, 0.4, 2, 210, 730, "canned", {
  flavor: "corncan",
  vegetable: true,
});
food("mushroom", "蘑菇罐头", 0.55, 0.35, 2, 80, 730, "canned", {
  flavor: "mushroom",
  vegetable: true,
});
food("peach", "黄桃罐头", 0.65, 0.5, 2, 240, 730, "canned", {
  flavor: "peach",
  joy: 4,
});
food("pineapple", "菠萝罐头", 0.65, 0.5, 2, 220, 730, "canned", {
  flavor: "pineapple",
  joy: 4,
});
food("soup", "浓缩蔬菜汤", 0.5, 0.4, 2, 180, 730, "canned", {
  flavor: "soup",
  vegetable: true,
});
food("milkpowder", "全脂奶粉 · 500g", 1.85, 0.5, 10, 250, 365, "canned", {
  flavor: "milkpowder",
  protein: true,
});
food("carrot", "胡萝卜 · 1kg", 0.45, 1, 5, 90, 18, "fresh", {
  flavor: "carrot",
  vegetable: true,
});
food("cabbage", "卷心菜 · 1kg", 0.4, 1, 5, 60, 12, "fresh", {
  flavor: "cabbage",
  vegetable: true,
});
food("onion", "黄洋葱 · 1kg", 0.35, 1, 5, 80, 40, "fresh", {
  cook: true,
  flavor: "onion",
  vegetable: true,
});
food("apple", "红苹果 · 1kg", 0.7, 1, 5, 110, 20, "fresh", {
  flavor: "apple",
  joy: 3,
});
food("orange", "橙子 · 1kg", 0.75, 1, 5, 90, 16, "fresh", {
  flavor: "orange",
  joy: 3,
});
food("banana", "香蕉 · 500g", 0.4, 0.5, 3, 150, 5, "fresh", {
  flavor: "banana",
  joy: 3,
});
food("egg", "鸡蛋 · 6枚", 0.65, 0.4, 3, 160, 10, "fresh", {
  cook: true,
  flavor: "egg",
  protein: true,
});
food("cheese", "硬奶酪 · 250g", 0.85, 0.28, 4, 250, 18, "fresh", {
  flavor: "cheese",
  protein: true,
});
food("sausage", "烟熏香肠 · 400g", 1.1, 0.42, 4, 300, 12, "fresh", {
  flavor: "sausage",
  protein: true,
});
food("milk", "鲜牛奶 · 1L", 0.55, 1.05, 4, 155, 3, "fresh", {
  flavor: "milk",
  water: 12,
  protein: true,
});
food("yogurt", "原味酸奶 · 500g", 0.65, 0.55, 2, 210, 5, "fresh", {
  flavor: "yogurt",
  joy: 2,
});
item("water", "瓶装饮用水 · 2L", 0.28, 2, "drink", 4, {
  kind: "drink",
  water: 38,
  liters: 2,
});
item("waterlarge", "封装饮用水 · 5L", 0.55, 5, "drink", 10, {
  kind: "drink",
  water: 38,
  liters: 5,
});
item("tea", "红茶 · 30包", 0.8, 0.08, "drink", 30, {
  kind: "drink",
  water: 28,
  joy: 3,
  brew: true,
});
item("coffee", "速溶咖啡 · 20份", 1.3, 0.12, "drink", 20, {
  kind: "drink",
  water: 18,
  joy: 3,
  energy: 8,
  brew: true,
});
item("cocoa", "可可粉 · 15份", 1.05, 0.25, "drink", 15, {
  kind: "drink",
  water: 22,
  joy: 4,
  brew: true,
});
item("juice", "苹果汁 · 1L", 0.6, 1.05, "drink", 4, {
  kind: "drink",
  water: 32,
  joy: 3,
  life: 120,
});
item("soda", "柠檬汽水 · 330ml", 0.22, 0.35, "drink", 1, {
  kind: "drink",
  water: 25,
  joy: 3,
  life: 365,
});
item("herbal", "草本茶 · 20包", 0.75, 0.06, "drink", 20, {
  kind: "drink",
  water: 30,
  joy: 4,
  brew: true,
});
item("salt", "食盐 · 500g", 0.18, 0.5, "tool", 100, { kind: "seasoning" });
item("pepper", "黑胡椒 · 40g", 0.35, 0.08, "tool", 30, { kind: "seasoning" });
item("spice", "混合香料 · 50份", 0.55, 0.1, "tool", 50, {
  kind: "seasoning",
  desc: "烹调时自动少量使用，减轻重复口味的精神惩罚。",
});
item("soap", "洗浴肥皂 · 1块", 0.3, 0.12, "hygiene", 15, {
  kind: "consumable",
});
item("shampoo", "洗发液 · 300ml", 0.8, 0.35, "hygiene", 20, {
  kind: "consumable",
});
item("toothbrush", "软毛牙刷", 0.3, 0.02, "hygiene");
item("toothpaste", "薄荷牙膏", 0.45, 0.12, "hygiene", 40, {
  kind: "consumable",
});
item("paper", "卷筒卫生纸 · 4卷", 0.65, 0.4, "hygiene", 80, {
  kind: "consumable",
});
item("towel", "棉质毛巾", 0.85, 0.22, "hygiene");
item("shirt", "棉质换洗衬衫", 2.2, 0.3, "hygiene");
item("underwear", "棉质内衣 · 2套", 1.8, 0.22, "hygiene");
item("socks", "厚棉袜 · 3双", 0.9, 0.15, "hygiene");
item("sweater", "羊毛套头衫", 4.2, 0.7, "hygiene", 1, { warm: 4 });
item("nailclip", "折叠指甲刀", 0.7, 0.04, "hygiene");
item("scissors", "小号理发剪", 1.1, 0.12, "hygiene");
item("razor", "安全剃须刀", 0.85, 0.08, "hygiene");
item("comb", "木质梳子", 0.2, 0.04, "hygiene");
item("detergent", "洗衣粉 · 500g", 0.65, 0.5, "clean", 30, {
  kind: "consumable",
});
item("dishsoap", "洗洁精 · 400ml", 0.65, 0.45, "clean", 40, {
  kind: "consumable",
});
item("broom", "木柄扫帚", 1.3, 0.55, "clean");
item("mop", "棉线拖把", 1.75, 0.8, "clean");
item("trashbag", "垃圾袋 · 30只", 0.6, 0.2, "clean", 30, {
  kind: "consumable",
});
item("sponge", "清洁海绵 · 3块", 0.3, 0.04, "clean", 12, {
  kind: "consumable",
});
item("disinfect", "表面消毒液", 0.8, 0.5, "clean", 15, { kind: "consumable" });
item("gloves", "橡胶手套", 0.55, 0.08, "clean");
item("aspirin", "退热止痛片 · 12片", 0.75, 0.03, "medical", 12, {
  kind: "medicine",
  treat: "fever",
});
item("digest", "胃肠护理片 · 10片", 0.9, 0.04, "medical", 10, {
  kind: "medicine",
  treat: "stomach",
});
item("coldmed", "感冒缓解片 · 10片", 0.85, 0.03, "medical", 10, {
  kind: "medicine",
  treat: "cold",
});
item("vitamin", "复合维生素 · 30片", 1.2, 0.06, "medical", 30, {
  kind: "medicine",
  treat: "vitamin",
});
item("bandage", "护理绷带 · 5卷", 0.6, 0.08, "medical", 5, {
  kind: "medicine",
  treat: "rest",
});
item("thermometer", "玻璃体温计", 0.75, 0.05, "medical");
item("firstaid", "家庭应急护理盒", 2.2, 0.35, "medical", 8, {
  kind: "medicine",
  treat: "all",
});
item("pot", "带盖小铝锅", 2.5, 0.7, "tool", 1, {
  desc: "公寓已有旧锅；新锅让烹饪更省时。",
});
item("pan", "平底煎锅", 2.1, 0.8, "tool");
item("bowl", "搪瓷碗", 0.4, 0.2, "tool");
item("cup", "带盖水杯", 0.5, 0.2, "tool");
item("bottle", "空水壶 · 容量5L", 1.1, 0.35, "tool", 1, {
  capacity: 5,
  desc: "在水槽装水，为随机停水准备。",
});
item("canister", "储水桶 · 容量15L", 2.6, 0.65, "tool", 1, { capacity: 15 });
item("jar", "密封储物罐", 0.75, 0.3, "tool", 1, {
  desc: "解包后启用密封存放，干粮更耐放、不易受潮。",
});
item("opener", "手动开罐器", 0.65, 0.06, "tool");
item("lighter", "打火机", 0.35, 0.04, "tool", 40, { kind: "consumable" });
item("candle", "长燃蜡烛 · 6根", 0.65, 0.4, "tool", 24, {
  kind: "consumable",
  desc: "停电时在桌上点亮，降低黑暗带来的精神损耗。",
});
item("flashlight", "手电筒", 1.75, 0.22, "tool", 1, {
  desc: "停电的夜里照亮配电箱和水管，检修更快。",
});
item("battery", "干电池 · 4节", 0.7, 0.12, "tool", 24, { kind: "consumable" });
item("stove", "便携燃料炉", 4.2, 1.3, "tool", 1, {
  desc: "停电时用燃料块烹饪。",
});
item("fuel", "固体燃料 · 12块", 1.2, 0.5, "tool", 12, { kind: "consumable" });
item("repair", "水电维修小套装", 2.1, 0.65, "tool", 5, {
  kind: "consumable",
  desc: "修水龙头滴水、马桶水箱漏水、门锁松动；没有这些问题时，可缩短一次停电或停水。",
});
item("notebook", "硬皮日记本", 0.55, 0.15, "leisure", 1, {
  kind: "leisure",
  activity: "write",
  joy: 9,
});
item("novel1", "小说《北境来信》", 1.1, 0.3, "leisure", 1, {
  kind: "book",
  pages: 260,
  joy: 12,
});
item("novel2", "小说《无人经过的春天》", 1.15, 0.32, "leisure", 1, {
  kind: "book",
  pages: 300,
  joy: 12,
});
item("novel3", "侦探集《最后一班电车》", 1.0, 0.28, "leisure", 1, {
  kind: "book",
  pages: 220,
  joy: 11,
});
item("poetry", "诗集《远处的河》", 0.75, 0.18, "leisure", 1, {
  kind: "book",
  pages: 180,
  joy: 10,
});
item("history", "《安德士简史》", 1.2, 0.4, "leisure", 1, {
  kind: "book",
  pages: 360,
  joy: 10,
});
item("science", "《日常物理》", 1.0, 0.35, "leisure", 1, {
  kind: "book",
  pages: 280,
  joy: 10,
});
item("travel", "画册《没有边界的路》", 1.4, 0.5, "leisure", 1, {
  kind: "book",
  pages: 240,
  joy: 13,
});
item("cookbook", "《一口锅的365天》", 0.9, 0.25, "leisure", 1, {
  kind: "book",
  pages: 200,
  joy: 10,
});
item("cards", "旧纸牌", 0.45, 0.08, "leisure", 1, {
  kind: "leisure",
  activity: "cards",
  joy: 8,
});
item("chess", "木质棋盘", 1.2, 0.5, "leisure", 1, {
  kind: "leisure",
  activity: "chess",
  joy: 10,
});
item("puzzle", "帝国风景拼图 · 500片", 1.3, 0.45, "leisure", 1, {
  kind: "leisure",
  activity: "puzzle",
  joy: 11,
});
item("pencil", "铅笔与橡皮", 0.25, 0.04, "leisure", 1, {
  kind: "leisure",
  activity: "draw",
  joy: 8,
});
item("radio", "便携收音机", 3.5, 0.65, "leisure", 1, {
  kind: "leisure",
  activity: "radio",
  joy: 10,
  desc: "可用电力或干电池。调低音量，别招来关注。",
});
item("tape", "音乐磁带 · 夜间爵士", 0.9, 0.08, "leisure", 1, {
  kind: "leisure",
  activity: "music",
  joy: 12,
});
item("plant", "耐阴绿植", 1.4, 1.2, "furniture", 1, {
  kind: "furniture",
  joy: 1,
});
item("origami", "彩色折纸 · 300张", 0.55, 0.35, "leisure", 300, {
  kind: "leisure",
  activity: "craft",
  joy: 4,
  desc: "一小时能折六到十只纸鹤。每三十只串成一串，挂在窗边；折满一千只据说能许一个愿。",
});
item("ducttape", "布基胶带 · 1卷", 0.45, 0.2, "tool", 4, {
  kind: "consumable",
  desc: "冷天窗缝漏风时，手拿胶带对着窗户封好，室温回升约2°C。一卷能封四次。",
});
item("radkey", "暖气放气钥匙", 0.2, 0.03, "tool", 1, {
  desc: "暖气片进了空气不热时，拿着它给暖气片放气。",
});
item("pots", "陶土花盆与培养土 · 3套", 1.6, 4.5, "furniture", 1, {
  kind: "furniture",
  desc: "摆在窗台上，三个盆位。葱、豆芽、樱桃番茄都能种。",
});
item("scallion", "葱头 · 8个（可种）", 0.35, 0.4, "fresh", 8, {
  kind: "seed",
  desc: "插进湿土，九天左右能剪第一茬，剪了还会再长，一棵能剪六次。",
});
item("mungseed", "发芽绿豆 · 500g", 0.4, 0.5, "staple", 8, {
  kind: "seed",
  desc: "每次抓一把铺在湿土上，四天出一盆豆芽。不需要阳光，但每天要浇水。",
});
item("tomatoseed", "樱桃番茄种子 · 1包", 0.25, 0.02, "tool", 6, {
  kind: "seed",
  desc: "约五十天开花结果，之后每隔几天能摘一把。需要阳光和15°C以上的温度。",
});
item("blanket", "厚羊毛毯", 3.2, 1.6, "furniture", 1, {
  kind: "furniture",
  warm: 4,
});
item("pillow", "新枕头", 1.5, 0.6, "furniture", 1, {
  kind: "furniture",
  bed: 1,
});
item("rug", "编织小地毯", 2.6, 2, "furniture", 1, { kind: "furniture" });
item("fan", "小型电风扇", 4.8, 2.6, "furniture", 1, { kind: "furniture" });
item("heater", "电暖器", 6.5, 3.8, "furniture", 1, { kind: "furniture" });
item("shelf", "自装收纳架", 5.5, 9, "furniture", 1, {
  kind: "furniture",
  bulky: true,
});
item("curtain", "加厚遮光窗帘", 2.8, 1.1, "furniture", 1, {
  kind: "furniture",
});
item("clock", "机械闹钟", 1.6, 0.3, "furniture", 1, { kind: "furniture" });
item("lamp", "暖光台灯", 2.8, 0.9, "furniture", 1, { kind: "furniture" });
const DB = Object.fromEntries(CATALOG.map((i) => [i.id, i]));
const NEEDS = [
  ["food", "饱腹", "bowl"],
  ["water", "饮水", "drop"],
  ["energy", "体力", "moon"],
  ["morale", "精神", "heart"],
  ["hygiene", "清洁", "spark"],
  ["health", "健康", "plus"],
];
const STARTER = {
  rice: 5,
  oats: 3,
  pasta: 3,
  lentils: 3,
  crackers: 2,
  fish: 8,
  bakedbeans: 8,
  peas: 4,
  tomato: 4,
  peach: 3,
  peanut: 2,
  oil: 2,
  waterlarge: 2,
  tea: 1,
  spice: 1,
  soap: 2,
  paper: 2,
  shirt: 1,
  underwear: 1,
  detergent: 1,
  dishsoap: 1,
  broom: 1,
  trashbag: 1,
  nailclip: 1,
  scissors: 1,
  toothbrush: 1,
  toothpaste: 1,
  bottle: 1,
  jar: 1,
  candle: 1,
  flashlight: 1,
  battery: 1,
  aspirin: 1,
  digest: 1,
  vitamin: 1,
  novel1: 1,
  novel2: 1,
  poetry: 1,
  notebook: 1,
  cards: 1,
  radio: 1,
  blanket: 1,
};
const YEAR_KIT = {
  pots: 1,
  scallion: 1,
  mungseed: 1,
  rice: 20,
  oats: 25,
  pasta: 22,
  cornmeal: 15,
  lentils: 15,
  beans: 12,
  oil: 10,
  peanut: 10,
  fish: 10,
  bakedbeans: 12,
  tomato: 8,
  peas: 8,
  peach: 4,
  tea: 2,
  spice: 3,
  waterlarge: 1,
  soap: 3,
  paper: 4,
  shirt: 1,
  underwear: 1,
  detergent: 1,
  dishsoap: 2,
  broom: 1,
  trashbag: 2,
  nailclip: 1,
  scissors: 1,
  toothbrush: 1,
  toothpaste: 2,
  bottle: 1,
  jar: 1,
  candle: 1,
  aspirin: 1,
  digest: 1,
  vitamin: 1,
  novel1: 1,
  novel2: 1,
  novel3: 1,
  poetry: 1,
  notebook: 1,
  cards: 1,
  pencil: 1,
  blanket: 1,
};
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngNext(obj) {
  let t = (obj.rng += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  obj.rng = obj.rng >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function environment(seed) {
  const r = { rng: hashSeed(seed) },
    rand = () => rngNext(r);
  const w = 6.6 + Math.floor(rand() * 3) * 0.65,
    d = 5.8 + Math.floor(rand() * 3) * 0.5;
  return {
    seed,
    w,
    d,
    mirror: rand() > 0.5,
    fridge: rand() > 0.27,
    bed: 1 + Math.floor(rand() * 3),
    wear: Math.floor(rand() * 3),
    temp: Math.round(10 + rand() * 18),
    floor: 14 + Math.floor(rand() * 9),
    number: 1806 + Math.floor(rand() * 83),
    wall: Math.floor(rand() * 3),
    view: Math.floor(rand() * 3),
    rng: r.rng,
  };
}
function packCart(cart) {
  const bags = [],
    crates = [];
  for (const [id, qty] of Object.entries(cart)) {
    const it = DB[id];
    if (!it) continue;
    for (let n = 0; n < qty; n++) {
      if (it.bulky || it.weight > 8) {
        crates.push({ items: { [id]: 1 }, weight: it.weight });
        continue;
      }
      let b = bags.find((x) => x.weight + it.weight <= 8.00001);
      if (!b) {
        b = { items: {}, weight: 0 };
        bags.push(b);
      }
      b.items[id] = (b.items[id] || 0) + 1;
      b.weight = Math.round((b.weight + it.weight) * 10000) / 10000;
    }
  }
  return { bags, crates, total: [...bags, ...crates] };
}
function cartSummary(cart) {
  const p = packCart(cart),
    cost = Object.entries(cart).reduce(
      (a, [id, q]) => a + (DB[id]?.price || 0) * q,
      0,
    );
  const packaging = p.bags.length * 0.06;
  const kcal = Object.entries(cart).reduce(
    (a, [id, q]) => a + (DB[id]?.kcal || 0) * (DB[id]?.servings || 0) * q,
    0,
  );
  return {
    ...p,
    cost: Math.round((cost + packaging) * 100) / 100,
    kcal,
    days: Math.floor(kcal / 2000),
    weight: p.total.reduce((s, b) => s + b.weight, 0),
    count: Object.values(cart).reduce((s, q) => s + q, 0),
  };
}
const DISEASES = {
  cold: { name: "着凉", desc: "体力消耗增加；温暖、睡眠与对症护理能缓解。" },
  stomach: {
    name: "消化不适",
    desc: "饮水消耗增快、精神缓慢下降，注意食物与卫生。",
  },
  fever: { name: "低热", desc: "健康与体力缓慢下降，需休息、补水或对症护理。" },
};
