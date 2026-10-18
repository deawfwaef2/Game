/* 闭门365 · v0.17 a vast, messy cooperative catalogue.
   The 133 original goods stay as the "national standard" range. On top of them this file grows a fixed catalogue
   of many thousands of real-feeling products: hundreds of product lines (grains, tins, pickles, sweets, teas,
   soaps, brooms, candles, medicines, books, games, blankets, plants…) × factories/brands × pack sizes × a
   character trait (spicy, light, fortified, clearance, army-stock, home-style, imported, economy…).
   Every trait changes real numbers and is explained in plain words.
   The catalogue itself is the same in every run (saves stay valid); the SEED decides which ~200 of them this
   run's shop happens to carry — roughly 1% of everything. The basics the ration crates need are always there. */
const CG = { rng: 0 };
function cgR() {
  return rngNext(CG);
}
function cgPick(a) {
  return a[Math.floor(cgR() * a.length)];
}
function cgSample(a, n) {
  const c = a.slice(),
    out = [];
  while (c.length && out.length < n) out.push(c.splice(Math.floor(cgR() * c.length), 1)[0]);
  return out;
}
const cgMoney = (v) => Math.max(0.05, Math.round(v * 20) / 20);
const CG_BRANDS = {
  food: ["红星", "北极星", "长城", "金鹰", "丰收", "海燕", "黎明", "向阳", "松鹤", "雪莲", "牡丹", "前进", "东风", "群众", "胜利", "和平", "白桦", "铁塔", "老码头", "南港", "北境", "河谷", "山城", "金穗", "绿洲", "冰川"],
  drink: ["清泉", "北冰洋", "海鸥", "白鹤", "山泉", "碧螺", "红磨坊", "南湖", "天鹅", "云岭", "老树", "雪峰"],
  care: ["白鸽", "蜂花", "友谊", "百雀", "雪花", "海鸥", "茉莉", "上海风", "芳草", "灯塔", "郁金香", "黄河", "春蕾"],
  clean: ["白猫", "活力", "立白", "灯塔", "雪山", "工农", "劳动", "金鱼", "红旗", "大桥", "蓝天"],
  tool: ["永久", "工农", "红旗", "钢城", "铁牛", "老虎", "飞跃", "前进", "建设", "国营五金", "双喜", "北方"],
  med: ["国营第一制药", "北岸药厂", "白云山", "同仁", "红十字", "长青", "康乐", "南岭制药", "黎明药业"],
  home: ["友谊", "凤凰", "牡丹", "春风", "百花", "红棉", "金鹿", "幸福", "海棠", "向日葵", "梅花"],
  fun: ["新华", "人民", "少年", "百花", "群星", "东方", "长江", "黄河", "未来", "启明"],
};
const CG_MAKER = { food: "食品厂", drink: "饮料厂", care: "日化厂", clean: "日化厂", tool: "五金厂", med: "", home: "轻工社", fun: "出版社" };
/* Food lines: key|名称|category|look|kg|servings|kcal|life|cook|price|flavor|tags
   tags: p protein, v vegetable, jN joy, wN water, eN energy, hN health, tN thirst, mN warmth, s sweet group, k snack group, g grain group, c canned group, f fresh group, d drink group, ing ingredient */
const CG_FOOD = `
xiangmi|香米|staple|rice|5|25|730|720|1|5.2|grain|g
nuomi|糯米|staple|rice|2|10|720|600|1|2.6|sticky|g j1
xiaomi|小米|staple|buckwheat|1|6|690|500|1|1.2|millet|g h1
gaoliang|高粱米|staple|buckwheat|1|6|680|540|1|1.0|sorghum|g
yimi|薏米|staple|lentils|1|6|650|540|1|1.6|barley|g h1
cumi|糙米|staple|rice|2|10|700|400|1|2.0|brownrice|g h1
fuqiang|富强粉|staple|flour|2|10|720|300|1|1.4|wheat|g
quanmai|全麦粉|staple|flour|2|10|680|240|1|1.5|wholewheat|g h1
lvdou|绿豆|staple|beans|1|6|650|600|1|1.3|mungbean|g h1
huangdou|黄豆|staple|beans|1|6|720|600|1|1.1|soy|g p
candou|蚕豆|staple|beans|1|6|660|540|1|1.2|broadbean|g p
mianpian|燕麦片|staple|oats|1|8|620|420|1|1.5|oatflake|g
fangbianmian|方便面·红烧牛肉|staple|noodles|0.6|5|560|240|0|1.6|instantbeef|k j1
fbmian2|方便面·海鲜|staple|noodles|0.6|5|540|240|0|1.6|instantsea|k j1
fbmian3|方便面·酸辣|staple|noodles|0.6|5|550|240|0|1.6|instantsour|k j1 t3
fbmian4|方便面·葱香排骨|staple|noodles|0.6|5|560|240|0|1.6|instantrib|k j1
longxu|龙须面|staple|noodles|0.5|5|560|540|1|0.8|thinnoodle|g
daoxiao|刀削面|staple|noodles|0.5|5|580|300|1|0.9|knifenoodle|g
qiaomaimian|荞麦面|staple|noodles|0.5|5|540|400|1|0.9|sobanoodle|g h1
fensi|粉丝|staple|noodles|0.3|4|500|720|1|0.7|glassnoodle|g
hefen|干河粉|staple|noodles|0.5|5|540|400|1|0.9|ricenoodle|g
mianjin|烤麸|staple|beans|0.3|4|380|300|1|0.8|gluten|p
gjgan|压缩干粮·芝麻|staple|hardtack|1|10|780|1400|0|2.0|rationsesame|k
gjgan2|军用口粮饼|staple|hardtack|1|10|800|1800|0|1.9|rationarmy|k
taosu|桃酥|staple|biscuit|0.4|4|520|90|0|1.0|taosu|k j2 s
mahua|麻花|staple|biscuit|0.4|4|540|90|0|1.0|mahua|k j2 s
shaqima|沙琪玛|staple|biscuit|0.4|4|520|120|0|1.2|shaqima|k j2 s
dangao|鸡蛋糕|staple|biscuit|0.3|3|420|20|0|1.0|eggcake|k j3 s
yuebing|月饼|staple|biscuit|0.4|4|620|60|0|2.2|mooncake|k j4 s
binggan2|奶油夹心饼干|staple|crackers|0.4|4|540|240|0|1.2|cream|k j2 s
binggan3|葱油饼干|staple|crackers|0.4|4|520|240|0|1.0|scallioncracker|k j1
binggan4|全麦消化饼|staple|crackers|0.4|4|500|240|0|1.1|digestive|k h1
hongzao|红枣|staple|raisins|0.5|5|420|360|0|1.3|jujube|k j2 s h1
hetao|核桃|staple|nuts|0.5|5|600|300|0|2.4|walnut|k p h1
guazi|五香瓜子|staple|nuts|0.4|5|480|240|0|0.9|seeds|k j2 t2
huasheng|花生米|staple|nuts|0.5|5|560|240|0|1.0|peanutkernel|k p
xingren|杏仁|staple|nuts|0.3|4|520|300|0|2.6|almond|k p j1
lizi|糖炒板栗|staple|nuts|0.5|4|420|20|0|1.4|chestnut|k j3 s
guofu|什锦果脯|staple|raisins|0.4|5|400|300|0|1.4|candiedfruit|k j3 s
naitang|奶糖|staple|chocolate|0.3|10|120|360|0|1.2|milkcandy|k j2 s
shuiguotang|水果硬糖|staple|chocolate|0.3|12|100|540|0|0.8|fruitcandy|k j2 s
sutang|花生酥糖|staple|chocolate|0.3|8|160|240|0|1.0|peanutbrittle|k j2 s
zhimahu|黑芝麻糊|staple|cocoa|0.4|10|260|360|0|1.4|sesamepaste|k j2 s m2
ouqfen|藕粉|staple|cocoa|0.4|10|220|360|0|1.3|lotusroot|k j2 s m2
mifen|米粉糊|staple|cocoa|0.4|10|240|300|0|1.0|ricecereal|k m1
fengmi|蜂蜜|staple|jam|0.5|20|120|1000|0|2.2|honey|j3 s
heitang|红糖|staple|sugar|0.5|20|80|720|0|0.6|brownsugar|ing s m1
bingtang|冰糖|staple|sugar|0.5|20|80|1000|0|0.7|rocksugar|ing s
jiangyou|酱油|staple|oil|0.5|30|20|540|0|0.6|soysauce|ing
cu|陈醋|staple|oil|0.5|30|10|720|0|0.6|vinegar|ing
zhimayou|小磨香油|staple|oil|0.25|25|90|360|0|1.2|sesameoil|ing j1
caiyou|菜籽油|staple|oil|1|40|90|360|0|1.6|rapeoil|o
zhuyou|猪油|staple|oil|0.5|25|110|180|0|1.0|lard|o j1
zhimajiang|芝麻酱|staple|peanut|0.4|10|300|300|0|1.4|tahini|k p
lajiang|辣椒酱|staple|jam|0.3|15|60|360|0|0.8|chili|ing j1 t3
doubanjiang|豆瓣酱|staple|jam|0.5|20|60|540|0|0.8|beanpaste|ing j1 t2
furu|红腐乳|canned|jam|0.3|12|80|360|0|0.7|furu|j1 t2 p
zhacai|榨菜|canned|jam|0.3|8|40|360|0|0.5|zhacai|v j1 t3
luobogan|萝卜干|canned|jam|0.3|8|50|300|0|0.5|driedradish|v j1 t3
paocai|泡菜|canned|jam|0.5|8|40|240|0|0.7|pickle|v j1 t2
suanbaicai|酸菜|canned|jam|0.5|6|50|180|0|0.6|sourcabbage|v t2
meicai|梅干菜|canned|raisins|0.3|6|60|360|0|0.8|meicai|v t2
xiandan|咸鸭蛋|canned|jam|0.5|6|190|60|0|1.2|saltedegg|p t3
pidan|松花蛋|canned|jam|0.4|6|180|60|0|1.2|centuryegg|p
hongshaorou|红烧肉罐头|canned|beef|0.4|2|520|900|0|2.4|braisedpork|p j3
meicaikourou|梅菜扣肉罐头|canned|beef|0.4|2|540|900|0|2.6|meicaipork|p j3
huiguorou|回锅肉罐头|canned|beef|0.4|2|500|900|0|2.4|twicepork|p j2 t2
jirou|红烧鸡块罐头|canned|beef|0.4|2|420|900|0|2.2|chicken|p j2
yaroutin|酱鸭罐头|canned|beef|0.4|2|460|900|0|2.4|duck|p j2
lingyu|豆豉鲮鱼罐头|canned|fish|0.25|2|380|1200|0|1.8|dace|p j2 t2
fengweiyu|凤尾鱼罐头|canned|fish|0.2|2|320|1200|0|1.9|anchovy|p j2
qingyu|茄汁鲭鱼罐头|canned|fish|0.4|2|400|1200|0|1.7|mackerel|p
yutou|红烧带鱼罐头|canned|fish|0.3|2|380|1100|0|2.0|hairtail|p j2
babaozhou|八宝粥罐头|canned|soup|0.36|1|330|540|0|0.9|babao|k j2 s m1
yinergeng|银耳莲子羹|canned|soup|0.36|1|220|540|0|1.0|tremella|j2 s h1
lvdoutang|绿豆汤罐头|canned|soup|0.36|1|200|540|0|0.8|mungsoup|w10 j1
jitang|鸡汤罐头|canned|soup|0.4|2|260|900|0|1.6|chickensoup|p m3 h1
luobotang|萝卜排骨汤|canned|soup|0.4|2|300|900|0|1.6|ribsoup|p m3 v
juzi|糖水橘子罐头|canned|peach|0.4|2|200|900|0|1.0|mandarin|j4 s w6
lizhi|荔枝罐头|canned|peach|0.4|2|220|900|0|1.6|lychee|j5 s w6
shanzha|山楂罐头|canned|peach|0.4|2|210|900|0|1.0|hawthorn|j4 s
xueli|冰糖雪梨罐头|canned|peach|0.4|2|200|900|0|1.1|pear|j4 s w8
yingtao|樱桃罐头|canned|peach|0.4|2|230|900|0|1.8|cherry|j5 s
longyan|桂圆罐头|canned|peach|0.4|2|240|900|0|1.6|longan|j4 s
qingdou2|五香毛豆罐头|canned|peas|0.4|2|260|900|0|0.9|edamame|v p
zhusun|油焖笋罐头|canned|peas|0.4|2|180|900|0|1.1|bamboo|v j1
mogu2|香菇罐头|canned|mushroom|0.4|2|160|900|0|1.3|shiitake|v j1
jiaobai|茭白罐头|canned|peas|0.4|2|120|900|0|0.9|wildrice|v
huotui|火腿肠|canned|sausage|0.4|5|260|180|0|1.4|hamstick|p j2
laxiang|腊肠|canned|sausage|0.5|5|320|120|0|2.2|lapcheong|p j3
rousong|肉松|canned|raisins|0.2|6|180|180|0|1.8|floss|p j3
niurougan|牛肉干|canned|raisins|0.2|5|220|240|0|2.6|jerky|p j3 t2
xiaoyugan|香辣小鱼干|canned|raisins|0.2|5|160|240|0|1.4|fishsnack|p j2 t3
lianru|炼乳|canned|milkpowder|0.4|10|130|540|0|1.2|condensed|j3 s
mairujing|麦乳精|canned|milkpowder|0.5|15|140|540|0|2.2|malted|j3 s e2
doufen|豆奶粉|canned|milkpowder|0.5|15|130|420|0|1.4|soymilk|p
tudou2|新土豆|fresh|potato|2|10|560|60|1|1.0|newpotato|g
yutou2|芋头|fresh|potato|1|5|480|40|1|0.9|taro|g
shanyao|山药|fresh|sweetpotato|1|5|420|40|1|1.1|yam|g h1
nangua|老南瓜|fresh|cabbage|2|8|300|90|1|0.9|pumpkin|v s
dongua|冬瓜|fresh|cabbage|2|8|120|60|1|0.8|wintermelon|v w4
baicai|大白菜|fresh|cabbage|2|8|140|45|0|0.7|napa|v
qincai|芹菜|fresh|carrot|0.5|4|60|10|0|0.5|celery|v
bocai|菠菜|fresh|carrot|0.5|3|60|6|0|0.6|spinach|v h1
qiezi|茄子|fresh|sweetpotato|1|4|120|10|1|0.7|eggplant|v
fanqie|西红柿|fresh|apple|1|5|90|10|0|0.9|tomatofresh|v w6 j1
huanggua|黄瓜|fresh|carrot|1|5|70|10|0|0.7|cucumber|v w8
lajiao|青椒|fresh|apple|0.5|4|60|14|0|0.6|pepper|v t1
dasuan|大蒜|fresh|onion|0.3|10|20|120|0|0.5|garlic|ing
shengjiang|生姜|fresh|onion|0.3|10|20|60|0|0.5|ginger|ing m1
li|鸭梨|fresh|apple|1|5|200|40|0|1.0|duckpear|j3 w6
taozi|水蜜桃|fresh|orange|1|5|200|8|0|1.4|peach2|j4 w6
putao|葡萄|fresh|banana|1|5|220|10|0|1.6|grape|j4 w5
xigua|西瓜|fresh|cabbage|4|10|220|20|0|1.4|watermelon|j4 w12
juzi2|蜜橘|fresh|orange|1|6|220|30|0|1.2|tangerine|j3 w5
shiliu|石榴|fresh|apple|1|4|200|40|0|1.6|pomegranate|j4
shizi|柿饼|fresh|raisins|0.5|5|300|90|0|1.4|persimmon|j3 s
dofu|豆腐|fresh|cheese|0.5|3|240|4|0|0.6|tofu|p
dofugan|豆腐干|fresh|cheese|0.4|4|260|20|0|0.8|driedtofu|p
xianroumian|鲜肉|fresh|sausage|0.5|3|420|4|1|2.4|freshpork|p j3
jidan2|土鸡蛋|fresh|egg|0.6|8|150|28|1|1.6|farmegg|p j1
yadan|鸭蛋|fresh|egg|0.6|6|170|28|1|1.3|duckegg|p
suannai2|老酸奶|fresh|yogurt|0.5|4|180|12|0|1.2|thickyogurt|j3 p
doujiang|鲜豆浆|fresh|milk|1|4|130|3|0|0.5|soymilkfresh|p w10
mantou|白面馒头|fresh|bread|1|8|320|5|0|0.8|mantou|g
huajuan|花卷|fresh|bread|1|8|340|5|0|0.9|huajuan|g j1
shaobing|芝麻烧饼|fresh|bread|0.6|6|360|6|0|0.9|shaobing|g j2
youtiao|油条|fresh|bread|0.5|5|380|2|0|0.7|youtiao|g j2
lieba|大列巴|fresh|bread|1.2|10|380|14|0|1.6|lieba|g j2
`;
const CG_DRINK = `
lvcha|绿茶|tea|25|0|1.6|green|j3 b
molihua|茉莉花茶|tea|25|0|1.4|jasmine|j4 b
wulong|乌龙茶|tea|25|0|2.2|oolong|j4 b e2
puer|普洱茶饼|tea|40|0|3.2|puer|j4 b
juhua|菊花茶|herbal|20|0|1.2|chrysanthemum|j3 b h1
damai|大麦茶|herbal|30|0|0.9|barleytea|j2 b
gouqi|枸杞|herbal|20|0|1.6|goji|j2 b h1
jianghong|姜枣茶|herbal|15|0|1.4|gingertea|j3 b m3
ningmengcha|柠檬茶|herbal|20|0|1.4|lemontea|j3 b
kafei2|雀巢式速溶咖啡|coffee|20|0|3.2|nescafe|j3 b e8
kafeidou|咖啡粉|coffee|25|0|3.6|groundcoffee|j4 b e10
keke2|热可可|cocoa|15|0|1.8|hotcocoa|j4 b m2
juzifen|橘子粉|juice|20|0|1.2|orangepowder|j3 s
suanmei|酸梅汤粉|juice|15|0|1.0|plumdrink|j3 s
qishui|橘子汽水|soda|1|0|0.4|orangesoda|j3 s
qishui2|山楂汽水|soda|1|0|0.4|hawsoda|j3 s
qishui3|酸梅汽水|soda|1|0|0.4|plumsoda|j3 s
kele|可乐|soda|1|0|0.6|cola|j4 s e2
guozhi|山楂汁|juice|4|0|1.1|hawjuice|j3
guozhi2|葡萄汁|juice|4|0|1.4|grapejuice|j3
yezhi|椰子汁|juice|1|0|0.6|coconut|j3
kuangquan|矿泉水 · 1.5L|water|1|0|0.5|mineral|l1.5
kuangquan2|山泉水 · 10L|waterlarge|1|0|1.6|spring|l10
chunjing|纯净水 · 4L|waterlarge|1|0|0.9|purified|l4
`;
// Non-food lines with a mechanical base. key|名称|base|category|look|price|weight|uses|group|extras
const CG_GOODS = `
xiangzao|香皂|soap|hygiene|soap|0.45|0.12|1|care|
yaozao|硫磺药皂|soap|hygiene|soap|0.4|0.12|1|care|h
fzao|肥皂（洗衣用）|detergent|clean|soap|0.3|0.25|3|clean|
xifa2|洗发膏|shampoo|hygiene|shampoo|0.9|0.25|12|care|
xifa3|去屑洗发水|shampoo|hygiene|shampoo|1.2|0.3|14|care|
hufa|护发素|shampoo|hygiene|shampoo|1.1|0.3|12|care|
yagao2|药物牙膏|toothpaste|hygiene|toothpaste|0.6|0.15|30|care|h
yagao3|水果味牙膏|toothpaste|hygiene|toothpaste|0.5|0.15|30|care|
yashua2|硬毛牙刷|toothbrush|hygiene|toothbrush|0.35|0.03|1|care|
weisheng2|草纸 · 大包|paper|hygiene|paper|1.2|1.6|12|care|
weisheng3|卷纸 · 10卷|paper|hygiene|paper|2.0|1.4|10|care|
maojin2|枕巾|towel|hygiene|towel|1.2|0.25|1|home|
maojin3|浴巾|towel|hygiene|towel|2.4|0.6|1|home|
chenshan2|的确良衬衫|shirt|hygiene|shirt|3.2|0.3|1|home|
chenshan3|劳动布工作服|shirt|hygiene|shirt|4.0|0.7|1|home|
neiyi2|秋衣秋裤|underwear|hygiene|underwear|2.6|0.5|2|home|w
wazi2|羊毛袜 · 2双|socks|hygiene|socks|1.6|0.15|2|home|w
maoyi2|手织毛衣|sweater|hygiene|sweater|7.5|0.7|1|home|w
maoyi3|棉背心|sweater|hygiene|sweater|3.2|0.4|1|home|w
zhijiadao2|指甲锉套装|nailclip|hygiene|nailclip|0.9|0.08|1|tool|
tifudao|剃须刀片 · 10片|razor|hygiene|razor|0.8|0.05|10|tool|
shuzi2|牛角梳|comb|hygiene|comb|0.9|0.05|1|home|
xiyifen2|加酶洗衣粉|detergent|clean|detergent|1.0|0.5|12|clean|
xiyifen3|皂粉|detergent|clean|detergent|0.8|0.5|10|clean|
xijie2|洗洁精 · 大桶|dishsoap|clean|dishsoap|1.4|1.0|40|clean|
xijie3|碱面|dishsoap|clean|detergent|0.4|0.5|30|clean|
saozhou2|高粱扫帚|broom|clean|broom|1.4|0.6|1|tool|
saozhou3|鸡毛掸子|broom|clean|broom|0.8|0.2|1|tool|
tuoba2|海绵拖把|mop|clean|mop|2.2|1.0|1|tool|
lajidai2|厚垃圾袋 · 20只|trashbag|clean|trashbag|0.6|0.3|20|clean|
haimian2|钢丝球 · 4个|sponge|clean|sponge|0.4|0.1|4|clean|
haimian3|丝瓜络|sponge|clean|sponge|0.3|0.05|3|clean|
xiaodu2|84消毒液|disinfect|clean|disinfect|0.8|0.5|12|clean|
xiaodu3|来苏水|disinfect|clean|disinfect|0.9|0.5|12|clean|h
shoutao2|劳保线手套|gloves|clean|gloves|0.4|0.1|1|tool|
tuire2|安乃近片|aspirin|medical|aspirin|0.9|0.05|10|med|
tuire3|退烧冲剂|aspirin|medical|aspirin|1.0|0.1|8|med|
weiyao2|健胃消食片|digest|medical|digest|0.8|0.05|12|med|
weiyao3|黄连素|digest|medical|digest|0.6|0.04|12|med|
ganmao2|板蓝根冲剂|coldmed|medical|coldmed|0.9|0.2|10|med|
ganmao3|感冒清热颗粒|coldmed|medical|coldmed|1.1|0.2|10|med|
ganmao4|川贝枇杷膏|coldmed|medical|coldmed|1.6|0.3|10|med|
weisheng4|鱼肝油丸|vitamin|medical|vitamin|1.6|0.1|60|med|h
weisheng5|维生素C片|vitamin|medical|vitamin|0.9|0.05|50|med|h
bengdai2|创可贴 · 50片|bandage|medical|bandage|0.8|0.05|10|med|
bengdai3|纱布药棉包|bandage|medical|bandage|1.1|0.2|6|med|
tiwenji2|水银体温计|thermometer|medical|thermometer|0.8|0.02|1|med|
jijiu2|红十字药箱|firstaid|medical|firstaid|8.5|1.2|8|med|
guo2|铝饭盒|pot|tool|pot|1.6|0.4|1|tool|
guo3|小砂锅|pot|tool|pot|2.0|1.2|1|tool|
pingdi2|铸铁平底锅|pan|tool|pan|3.4|1.6|1|tool|
wan2|蓝边瓷碗 · 2只|bowl|tool|bowl|0.9|0.5|1|home|
wan3|木碗|bowl|tool|bowl|0.7|0.15|1|home|
beizi2|搪瓷缸|cup|tool|cup|0.9|0.3|1|home|
beizi3|玻璃杯|cup|tool|cup|0.5|0.2|1|home|
baowenping|竹壳暖水瓶|cup|tool|cup|3.2|1.4|1|home|t
shuitong2|塑料水桶 · 10L|canister|tool|canister|1.6|0.6|1|tool|c10
shuitong3|铁皮水桶 · 12L|canister|tool|canister|2.2|1.6|1|tool|c12
shuihu2|军用水壶 · 1.5L|bottle|tool|bottle|1.4|0.4|1|tool|c1.5
shuihu3|大塑料桶 · 25L|canister|tool|canister|3.6|1.4|1|tool|c25
mifenguan|铁皮米缸|jar|tool|jar|2.2|1.4|1|tool|
mifenguan2|玻璃储物罐 · 3只|jar|tool|jar|1.8|1.2|1|tool|
kaiguan2|多用开罐刀|opener|tool|opener|0.8|0.1|1|tool|
huochai|火柴 · 10盒|lighter|tool|lighter|0.3|0.2|10|tool|
huoji2|煤油打火机|lighter|tool|lighter|1.6|0.08|20|tool|
lazhu2|红蜡烛 · 10根|candle|tool|candle|0.6|0.6|10|tool|
lazhu3|白蜡烛 · 6根|candle|tool|candle|0.4|0.4|6|tool|
meiyoudeng|煤油马灯|candle|tool|candle|4.4|1.6|12|tool|
shoudian2|长筒手电|flashlight|tool|flashlight|2.4|0.5|1|tool|
shoudian3|充电手电|flashlight|tool|flashlight|3.6|0.4|1|tool|
dianchi2|一号电池 · 2节|battery|tool|battery|0.5|0.3|2|tool|
dianchi3|五号电池 · 8节|battery|tool|battery|1.2|0.2|8|tool|
gutiran2|酒精块 · 20块|fuel|tool|fuel|1.6|0.6|20|tool|
gutiran3|蜂窝煤式燃料饼|fuel|tool|fuel|1.2|1.2|10|tool|
wujin|家用五金工具包|repair|tool|repair|3.8|1.6|3|tool|
dianlu2|酒精炉|stove|tool|stove|2.6|0.7|1|tool|
mianbei|新棉被|blanket|furniture|blanket|9.5|3.2|1|home|w
maotanzi|毛巾被|blanket|furniture|blanket|4.6|1.0|1|home|
tanzi2|电热毯|blanket|furniture|blanket|6.8|1.4|1|home|w
zhentou2|荞麦皮枕头|pillow|furniture|pillow|2.2|1.4|1|home|
zhentou3|乳胶枕|pillow|furniture|pillow|4.8|0.9|1|home|
ditan2|草编蒲团|rug|furniture|rug|1.2|0.6|1|home|
ditan3|羊毛脚垫|rug|furniture|rug|3.4|1.0|1|home|
chuanglian2|碎花布窗帘|curtain|furniture|curtain|2.2|0.8|1|home|
naozhong2|双铃马蹄表|clock|furniture|clock|2.4|0.4|1|home|
naozhong3|小座钟|clock|furniture|clock|4.2|1.2|1|home|
taideng2|绿罩台灯|lamp|furniture|lamp|3.8|1.2|1|home|
taideng3|蘑菇小夜灯|lamp|furniture|lamp|1.6|0.4|1|home|
fengshan2|台式摇头扇|fan|furniture|fan|8.4|2.6|1|home|
nuanqi2|油汀取暖器|heater|furniture|heater|14.0|5.6|1|home|
diaolan|吊兰|plant|furniture|plant|0.9|0.8|1|home|
luhui|芦荟|plant|furniture|plant|0.8|0.7|1|home|
wenzhu|文竹|plant|furniture|plant|1.2|0.6|1|home|
xianrenzhang|仙人掌|plant|furniture|plant|0.5|0.5|1|home|
junzilan|君子兰|plant|furniture|plant|3.6|1.6|1|home|
fugui|发财树|plant|furniture|plant|2.8|2.4|1|home|
jiugui|绿萝|plant|furniture|plant|0.7|0.6|1|home|
`;
// Self-care goods used straight from the hand. key|名称|category|look|price|weight|uses|minutes|effects (hyg/mor/hp/en/cold)|use text
const CG_CARE = `
xuehuagao|雪花膏|hygiene|yogurt|0.6|0.1|30|2|hyg2 mor2|擦脸擦手，香香的。
hushou|蛤蜊油护手霜|hygiene|soap|0.3|0.05|30|1|hyg1 mor1 hp0.3|冬天手不干裂。
runchun|润唇膏|hygiene|toothpaste|0.4|0.02|40|1|mor1|嘴唇不干。
qingliangyou|清凉油|medical|soap|0.3|0.03|40|1|mor1 en3|抹在太阳穴上，提神，体力+3。
fengyoujing|风油精|medical|vitamin|0.4|0.05|40|1|mor1 en2 hp0.3|闻一闻，头不那么沉。
honghuayou|红花油|medical|vitamin|0.6|0.05|30|3|hp1.5 mor1|揉一揉酸痛的肩膀，健康+1.5。
yanyaoshui|眼药水|medical|vitamin|0.5|0.02|30|1|hp0.5 mor1|眼睛不干涩。
paojiaoyan|泡脚药包 · 10包|hygiene|tea|1.2|0.3|10|20|hyg4 mor4 en3 cold|热水泡脚，冷天格外舒服（冷天心情再+3）。
reshuidai|热水袋|furniture|sponge|1.4|0.4|999|3|mor2 cold|灌上热水抱在怀里，冷天心情+5。
erbai|耳塞 · 10对|hygiene|toothbrush|0.4|0.02|10|1|en4 mor1|塞上耳塞小憩一会儿，体力+4。
yanzhao|丝绸眼罩|hygiene|socks|1.2|0.05|999|1|en3|闭眼休息一会儿，体力+3。
mianmo|珍珠霜|hygiene|yogurt|1.4|0.1|20|3|hyg2 mor3|仔细护理一次，心情+3。
xiangshui|花露水|hygiene|vitamin|0.8|0.2|40|1|hyg2 mor2|洗完澡拍一点，清清爽爽。
shuxuan|木梳按摩器|hygiene|toothbrush|0.6|0.1|999|5|mor2 hp0.3|按按头皮，放松一下。
kuaiban|健身拉力器|leisure|cards|2.8|1.2|999|15|mor4 hp1 en-4|拉几组，心情+4、健康+1，体力−4。
yaling|小哑铃 · 一对|leisure|cards|3.2|4.0|999|15|mor4 hp1.2 en-5|举几组，心情+4、健康+1.2，体力−5。
pushan|蒲扇|furniture|cards|0.4|0.1|999|5|mor1 hot|扇一扇，热天（高于24°C）心情再+3。
tiaosheng|跳绳|leisure|cards|0.5|0.2|999|10|mor3 hp1 en-4|在屋里轻轻跳（会让楼下听见？只是原地踏跳），心情+3、健康+1。
`;
// Leisure lines played from the hand (doLeisure). key|名称|activity|look|price|weight|joy
const CG_FUN = `
xiangqi|中国象棋|chess|cards|1.4|0.6|10
weiqi|围棋|chess|cards|2.6|1.4|11
tiaoqi|跳棋|chess|cards|1.0|0.5|8
junqi|军棋|chess|cards|0.9|0.4|8
moshu|魔方|puzzlebox|cards|1.2|0.15|9
jiulianhuan|九连环|puzzlebox|cards|0.6|0.1|8
huarongdao|华容道|puzzlebox|cards|0.8|0.2|9
qiqiaoban|七巧板|puzzlebox|cards|0.4|0.1|7
puke2|扑克牌|cards|cards|0.4|0.1|8
puke3|塔罗牌|cards|cards|1.6|0.15|8
gupai|骨牌|cards|cards|1.8|0.6|9
zhiwan|空竹|cards|cards|0.9|0.3|7
kouqin|口琴|music|cards|2.4|0.2|11
dizi|竹笛|music|cards|1.2|0.15|10
cidai2|磁带·民歌精选|music|cards|1.2|0.08|11
cidai3|磁带·古典钢琴|music|cards|1.4|0.08|12
cidai4|磁带·流行金曲|music|cards|1.4|0.08|12
cidai5|磁带·相声专辑|music|cards|1.2|0.08|11
cidai6|磁带·轻音乐|music|cards|1.2|0.08|11
cidai7|磁带·戏曲选段|music|cards|1.2|0.08|10
maoxian|毛线与毛衣针|craft|socks|1.6|0.5|9
shizi2|十字绣|craft|cards|1.4|0.3|9
jianzhi|剪纸红纸|craft|cards|0.4|0.2|7
moxing|木制模型套件|craft|puzzle|2.6|0.8|11
huace|速写本|draw|cards|0.8|0.4|8
shuicai|水彩颜料|draw|cards|1.6|0.4|9
maobi|毛笔与墨汁|draw|cards|1.4|0.5|9
youhua|蜡笔 · 24色|draw|cards|0.7|0.3|8
tianzi|填字游戏本|draw|cards|0.4|0.2|7
shudu|数字谜题集|draw|cards|0.4|0.2|7
jiyou|集邮册|craft|cards|1.8|0.4|8
pintu2|拼图·故宫雪景 1000片|craft|puzzle|2.4|0.9|12
pintu3|拼图·北境森林 300片|craft|puzzle|1.2|0.5|9
pintu4|拼图·海港 750片|craft|puzzle|1.8|0.7|11
`;
const CG_FOOD_TRAITS = {
  std: ["", 1, {}, ""],
  premium: ["特级", 1.35, { joy: 1.5 }, "特级品：心情再+1.5"],
  spicy: ["麻辣", 1.05, { joy: 1, thirst: 5 }, "麻辣：心情+1，但每吃一份水分−5"],
  light: ["清淡", 1, { health: 0.4, joy: -0.5 }, "清淡少盐：每份健康+0.4，但没那么香（心情−0.5）"],
  energy: ["高能", 1.15, { kcalX: 1.3 }, "高能配方：每份热量高三成"],
  fortified: ["强化", 1.2, { health: 0.8 }, "营养强化：每份健康+0.8"],
  sweet: ["甜味", 1.05, { joy: 1.5 }, "甜口：心情+1.5"],
  clearance: ["临期", 0.55, { lifeX: 0.3 }, "临期特价：便宜近一半，但只剩三成保质期"],
  army: ["军需", 0.95, { lifeX: 2.2, joy: -1 }, "军需库存：保质期翻倍，但口味单调（心情−1）"],
  home: ["家乡风味", 1.4, { joy: 2 }, "家乡风味：吃着想家，心情+2"],
  coarse: ["粗粮", 0.9, { kcalX: 0.88, health: 0.5 }, "粗粮：热量略低，每份健康+0.5"],
  instant: ["速食", 1.2, { cook: false }, "速食：不用煮，停电也能吃"],
  warm: ["暖身", 1.1, { warmth: 3 }, "暖身：天冷（低于15°C）时吃，心情再+3"],
  imported: ["进口", 1.8, { joy: 2.5 }, "进口货：少见的味道，心情+2.5"],
};
const CG_FOOD_POOL = {
  g: ["std", "premium", "coarse", "army", "clearance", "home", "instant", "fortified", "energy"],
  c: ["std", "premium", "spicy", "light", "army", "clearance", "home", "warm", "imported"],
  k: ["std", "sweet", "spicy", "premium", "clearance", "imported", "energy", "home"],
  f: ["std", "premium", "clearance", "home", "light"],
  d: ["std", "premium", "imported", "clearance", "sweet", "warm", "fortified"],
};
const CG_GOOD_TRAITS = {
  std: ["", 1, {}, ""],
  premium: ["精制", 1.4, { mor: 1 }, "精制：用着舒服，每次心情+1"],
  economy: ["简装", 0.7, { mor: -0.5 }, "简装：便宜三成，用着差一点（每次心情−0.5）"],
  durable: ["加厚", 1.25, { usesX: 1.5 }, "加厚耐用：能多用一半次数"],
  scented: ["香型", 1.1, { mor: 1 }, "带香味：每次心情+1"],
  medicated: ["药用", 1.15, { hp: 0.5 }, "药用：每次健康+0.5"],
  gentle: ["温和", 1.1, { hyg: 3 }, "温和配方：清洁再+3"],
  strong: ["强效", 1.2, { dirt: 5, hyg: 2 }, "强效：屋子再干净一点（脏乱−5）"],
  imported: ["进口", 1.8, { mor: 1.5, hyg: 2 }, "进口货：心情+1.5，清洁+2"],
  cozy: ["舒适", 1.3, { comfort: 0.04 }, "舒适：放在屋里，心情下降更慢"],
  warm: ["保暖", 1.3, { comfort: 0.06, cold: true }, "保暖：屋里低于13°C时，心情下降更慢"],
  old: ["旧货", 0.5, { mor: -0.3 }, "旧货：半价，但看着有点旧（每次心情−0.3）"],
};
const CG_GOOD_POOL = {
  care: ["std", "premium", "economy", "scented", "medicated", "gentle", "imported"],
  clean: ["std", "economy", "durable", "strong", "scented", "imported"],
  tool: ["std", "premium", "economy", "durable", "old"],
  med: ["std", "premium", "economy"],
  home: ["std", "premium", "economy", "cozy", "warm", "old"],
};
const CG_SIZES = [
  ["小包装", 0.5, 0.58],
  ["", 1, 1],
  ["家庭装", 2, 1.82],
];
const CG_SIZE_SHORT = ["小", "", "大"];
const CG_EXTRA = {}; // generated id -> use text parts are rebuilt on demand
function cgParseTags(s) {
  const o = { joy: 0 };
  for (const t of (s || "").split(/\s+/).filter(Boolean)) {
    if (t === "p") o.protein = true;
    else if (t === "v") o.vegetable = true;
    else if (t === "ing") o.ingredient = true;
    else if (t === "b") o.brew = true;
    else if (t === "o") o.oil = true;
    else if (t === "s") o.sweet = true;
    else if (/^[gckf]$/.test(t)) o.group = t;
    else if (/^j/.test(t)) o.joy = +t.slice(1);
    else if (/^w/.test(t)) o.water = +t.slice(1);
    else if (/^e/.test(t)) o.energy = +t.slice(1);
    else if (/^h/.test(t)) o.health = +t.slice(1) * 0.4;
    else if (/^t/.test(t)) o.thirst = +t.slice(1);
    else if (/^m/.test(t)) o.warmth = +t.slice(1);
    else if (/^l/.test(t)) o.liters = +t.slice(1);
  }
  return o;
}
function cgAdd(o) {
  if (DB[o.id]) return;
  o.gen = true;
  CATALOG.push(o);
  DB[o.id] = o;
}
function cgBuild() {
  CG.rng = hashSeed("anders-cooperative-catalogue-1986");
  // Foods
  for (const line of CG_FOOD.trim().split("\n")) {
    const [key, name, category, look, kg, serv, kcal, life, cook, price, flavor, tags] = line.split("|");
    const t = cgParseTags(tags),
      group = t.group || (category === "fresh" ? "f" : category === "canned" ? "c" : "g"),
      brands = cgSample(CG_BRANDS.food, 7),
      traits = cgSample(CG_FOOD_POOL[group], 4);
    brands.forEach((brand, bi) => {
      const bf = 0.85 + cgR() * 0.4;
      CG_SIZES.forEach(([sname, sx, px], si) => {
        if (category === "fresh" && si === 0) return;
        traits.forEach((tr, ti) => {
          if (tr === "instant" && (cook !== "1" || !["rice", "noodles", "oats", "buckwheat", "flour"].includes(look))) return;
          const [tn, tp, mod] = CG_FOOD_TRAITS[tr];
          const servings = Math.max(1, Math.round(+serv * sx)),
            weight = +(+kg * sx).toFixed(2),
            cookOK = mod.cook === false ? false : cook === "1";
          const it = {
            id: `${key}.${bi}${si}${ti}`,
            name: `${brand}${tn ? tn : ""}${name}${sname ? " · " + sname : ""}`,
            price: cgMoney(+price * px * tp * bf),
            weight,
            servings,
            kcal: Math.round(+kcal * (mod.kcalX || 1)),
            life: Math.max(2, Math.min(3000, Math.round(+life * (mod.lifeX || 1)))),
            category,
            kind: "food",
            look,
            flavor,
            maker: brand + CG_MAKER.food,
            trait: tr,
            line: key,
          };
          if (cookOK) it.cook = true;
          if (t.protein) it.protein = true;
          if (t.vegetable) it.vegetable = true;
          if (t.oil) {
            it.ingredient = true;
            it.base = "oil";
          }
          if (t.ingredient) {
            it.kind = "seasoning";
            it.category = category === "fresh" ? "fresh" : "staple";
          }
          const joy = (t.joy || 0) + (mod.joy || 0);
          if (joy) it.joy = Math.round(joy * 10) / 10;
          if (t.water) it.water = t.water;
          if (t.energy) it.energy = t.energy;
          const hp = (t.health || 0) + (mod.health || 0);
          if (hp) it.health = Math.round(hp * 10) / 10;
          const th = (t.thirst || 0) + (mod.thirst || 0);
          if (th) it.thirst = th;
          const wm = (t.warmth || 0) + (mod.warmth || 0);
          if (wm) it.warmth = wm;
          if (it.kind === "seasoning") {
            it.season = Math.max(0.5, Math.min(2.5, (it.joy || 0) + 0.8));
            delete it.joy;
          }
          cgAdd(it);
        });
      });
    });
  }
  // Drinks
  for (const line of CG_DRINK.trim().split("\n")) {
    const [key, name, look, serv, , price, flavor, tags] = line.split("|");
    const t = cgParseTags(tags),
      base = DB[look],
      brands = cgSample(CG_BRANDS.drink, 7),
      traits = cgSample(CG_FOOD_POOL.d, 4);
    brands.forEach((brand, bi) => {
      const bf = 0.85 + cgR() * 0.4;
      CG_SIZES.forEach(([sname, sx, px], si) => {
        if (t.liters && si !== 1) return;
        traits.forEach((tr, ti) => {
          if (t.liters && !["std", "premium", "clearance"].includes(tr)) return;
          const [tn, tp, mod] = CG_FOOD_TRAITS[tr];
          const it = {
            id: `${key}.${bi}${si}${ti}`,
            name: `${brand}${tn}${name}${sname ? " · " + sname : ""}`,
            price: cgMoney(+price * px * tp * bf),
            weight: +((base?.weight || 0.3) * (t.liters ? t.liters / (base?.liters || 1) : sx)).toFixed(2),
            servings: t.liters ? Math.max(1, Math.round(t.liters * 2)) : Math.max(1, Math.round(+serv * sx)),
            category: "drink",
            kind: "drink",
            life: Math.max(5, Math.round((base?.life || 365) * (mod.lifeX || 1))),
            look,
            flavor,
            water: t.liters ? 38 : base?.water || 25,
            maker: brand + CG_MAKER.drink,
            trait: tr,
            line: key,
          };
          if (t.liters) it.liters = t.liters;
          if (t.brew) it.brew = true;
          const joy = (t.joy || 0) + (mod.joy || 0);
          if (joy) it.joy = Math.round(joy * 10) / 10;
          if (t.energy) it.energy = t.energy;
          const hp = (t.health || 0) + (mod.health || 0);
          if (hp) it.health = Math.round(hp * 10) / 10;
          const wm = (t.warmth || 0) + (mod.warmth || 0);
          if (wm) it.warmth = wm;
          cgAdd(it);
        });
      });
    });
  }
  // Goods with a mechanical base
  for (const line of CG_GOODS.trim().split("\n")) {
    const [key, name, base, category, look, price, weight, uses, group, ex] = line.split("|");
    const b = DB[base];
    if (!b) continue;
    const pool = CG_GOOD_POOL[group] || CG_GOOD_POOL.tool,
      brands = cgSample(CG_BRANDS[group === "med" ? "med" : group === "clean" ? "clean" : group === "care" ? "care" : group === "home" ? "home" : "tool"], 7),
      traits = cgSample(pool, 4),
      consumable = +uses > 1;
    brands.forEach((brand, bi) => {
      const bf = 0.85 + cgR() * 0.4;
      [0, 1, 2].forEach((si) => {
        if (!consumable && si !== 1) return;
        const [sname, sx, px] = CG_SIZES[si];
        traits.forEach((tr, ti) => {
          if ((tr === "durable" || tr === "economy") && !consumable && group !== "tool" && group !== "home") return;
          if ((tr === "cozy" || tr === "warm") && category !== "furniture" && !/w/.test(ex)) return;
          const [tn, tp, mod] = CG_GOOD_TRAITS[tr];
          const it = {
            id: `${key}.${bi}${si}${ti}`,
            name: `${brand}${tn}${name}${sname && consumable ? " · " + sname : ""}`,
            price: cgMoney(+price * (consumable ? px : 1) * tp * bf),
            weight: +(+weight * (consumable ? sx : 1)).toFixed(2),
            servings: Math.max(1, Math.round(+uses * (consumable ? sx : 1) * (mod.usesX || 1))),
            category,
            kind: b.kind,
            life: b.life,
            base,
            look,
            maker: brand + (group === "med" ? "" : CG_MAKER[group] || ""),
            trait: tr,
            line: key,
          };
          if (b.treat) it.treat = b.treat;
          if (b.capacity) it.capacity = b.capacity;
          const cap = (ex || "").match(/c([\d.]+)/);
          if (cap) it.capacity = +cap[1];
          if (b.activity) it.activity = b.activity;
          if (b.bulky) it.bulky = true;
          const bonus = {};
          if (mod.mor) bonus.morale = mod.mor;
          if (mod.hp || /h/.test(ex || "")) bonus.health = (mod.hp || 0) + (/h/.test(ex || "") ? 0.5 : 0);
          if (mod.hyg) bonus.hygiene = mod.hyg;
          if (mod.dirt) bonus.dirt = mod.dirt;
          if (Object.keys(bonus).length) it.bonus = bonus;
          if (mod.comfort) it.comfort = mod.comfort;
          if (mod.cold || /w/.test(ex || "")) it.coldComfort = true;
          if (/t/.test(ex || "")) it.thermos = true;
          if (/n/.test(ex || "")) it.noPower = true;
          cgAdd(it);
        });
      });
    });
  }
  // Self-care goods
  for (const line of CG_CARE.trim().split("\n")) {
    const [key, name, category, look, price, weight, uses, min, eff, text] = line.split("|");
    const care = { min: +min, text };
    for (const e of eff.split(/\s+/)) {
      const m = e.match(/^([a-z]+)(-?[\d.]+)?$/);
      if (!m) continue;
      const k = { hyg: "hygiene", mor: "morale", hp: "health", en: "energy" }[m[1]];
      if (k) care[k] = +m[2];
      if (m[1] === "cold") care.cold = true;
      if (m[1] === "hot") care.hot = true;
    }
    const brands = cgSample(CG_BRANDS[category === "medical" ? "med" : category === "leisure" ? "fun" : "care"], 7),
      traits = cgSample(["std", "premium", "economy", "scented", "imported"], 3);
    brands.forEach((brand, bi) => {
      const bf = 0.85 + cgR() * 0.4;
      traits.forEach((tr, ti) => {
        const [tn, tp, mod] = CG_GOOD_TRAITS[tr];
        cgAdd({
          id: `${key}.${bi}1${ti}`,
          name: `${brand}${tn}${name}`,
          price: cgMoney(+price * tp * bf),
          weight: +weight,
          servings: +uses >= 999 ? 1 : +uses,
          reusable: +uses >= 999,
          category,
          kind: "care",
          life: 9999,
          look,
          care: { ...care, morale: (care.morale || 0) + (mod.mor || 0), hygiene: (care.hygiene || 0) + (mod.hyg || 0), health: (care.health || 0) + (mod.hp || 0) },
          maker: brand + (category === "medical" ? "" : category === "leisure" ? "体育用品厂" : CG_MAKER.care),
          trait: tr,
          line: key,
        });
      });
    });
  }
  // Leisure lines
  for (const line of CG_FUN.trim().split("\n")) {
    const [key, name, activity, look, price, weight, joy] = line.split("|");
    const brands = cgSample(CG_BRANDS.fun, 6),
      traits = cgSample(["std", "premium", "economy", "old"], 3);
    brands.forEach((brand, bi) => {
      traits.forEach((tr, ti) => {
        const [tn, tp, mod] = CG_GOOD_TRAITS[tr];
        cgAdd({
          id: `${key}.${bi}1${ti}`,
          name: `${brand}${tn}${name}`,
          price: cgMoney(+price * tp * (0.85 + cgR() * 0.4)),
          weight: +weight,
          servings: 1,
          category: "leisure",
          kind: "leisure",
          life: 9999,
          look,
          activity,
          joy: Math.max(4, +joy + (mod.mor || 0) * 2),
          maker: brand + "文体用品社",
          trait: tr,
          line: key,
        });
      });
    });
  }
  cgBooks();
}
// Books: a few thousand titles from word lists. Each title is its own read (its own boredom).
const CG_BOOK = {
  kinds: [
    ["小说", 220, 360, 11, ["{p}的{n}", "{a}的{n}", "{n}与{n2}", "最后的{n}", "{s}来信", "{p}往事", "{n}在{p}"]],
    ["侦探小说", 180, 300, 11, ["{p}谋杀案", "{n}之谜", "第{k}个{n}", "{p}的{n}失踪了", "午夜{n}", "{n}背后的人"]],
    ["冒险小说", 200, 340, 12, ["穿越{p}", "{p}探险记", "寻找{n}", "{n}号远航", "{p}以北"]],
    ["科幻小说", 200, 340, 12, ["{k}号星球", "{n}纪元", "来自{p}的信号", "时间{n}", "地下{n}"]],
    ["诗集", 120, 200, 10, ["{s}的{n}", "{a}{n}", "给{p}的诗", "{n}集"]],
    ["散文集", 160, 260, 10, ["{p}笔记", "{s}散记", "{a}日子", "窗外的{n}"]],
    ["传记", 260, 420, 10, ["{name}传", "{name}的一生", "我的{n}岁月"]],
    ["科普", 180, 320, 10, ["{n}的秘密", "趣味{sci}", "{sci}十万个为什么", "日常{sci}"]],
    ["连环画", 50, 90, 7, ["{p}的{n}", "小英雄{name}", "{n}的故事", "{a}{n}"]],
    ["杂志合订本", 90, 160, 8, ["《{mag}》{y}年合订本"]],
    ["外语读本", 200, 300, 9, ["北境语{k}册", "南港语入门", "简易{lang}读物"]],
    ["棋谱", 120, 220, 9, ["象棋残局{k}例", "围棋定式{k}题", "{name}对局集"]],
    ["菜谱", 140, 220, 9, ["家常{dish}", "一个人的{dish}", "{s}菜谱"]],
  ],
  p: ["北岸", "南港", "白桦镇", "老码头", "河谷", "雪原", "灯塔", "钟楼", "旧城", "边境", "山城", "第三街", "铁路桥", "海湾", "草原", "盐湖", "松林", "电车站", "红砖楼", "伏尔加街", "麦田", "北方", "远方", "冬宫"],
  n: ["信", "河", "雪", "灯", "钟声", "列车", "玫瑰", "黄昏", "影子", "花园", "钥匙", "风", "船", "月亮", "火车票", "手风琴", "白鸽", "邮差", "怀表", "地图", "旧照片", "灯塔", "麦穗", "星星", "雨", "森林", "窗子", "门"],
  n2: ["海", "城", "梦", "光", "路", "歌", "人", "夜"],
  a: ["沉默", "遥远", "温暖", "漫长", "寂静", "破碎", "明亮", "失落", "安静", "无名", "金色", "蓝色", "最初", "迟到"],
  s: ["春天", "夏夜", "秋日", "冬天", "清晨", "雨季", "雪夜", "五月", "十月", "新年"],
  k: ["七", "九", "十三", "四十", "一百", "三", "五", "十二", "二十一"],
  name: ["安娜", "伊万", "老周", "李明", "瓦西里", "小梅", "张伯", "叶莲娜", "王铁", "柳芭", "阿廖沙", "陈默"],
  sci: ["物理", "化学", "天文", "生物", "地理", "数学", "气象", "机械"],
  mag: ["大众电影", "故事会", "读者文摘", "科学画报", "无线电", "旅行家", "青年文学", "棋艺", "家庭医生", "集邮"],
  y: ["1979", "1980", "1981", "1982", "1983", "1984", "1985"],
  lang: ["北境语", "南港语", "海岛语"],
  dish: ["面食", "素菜", "腌菜", "汤羹", "点心", "一锅炖"],
};
function cgFill(tpl) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => cgPick(CG_BOOK[k]));
}
function cgBooks() {
  const seen = new Set();
  let made = 0,
    tries = 0;
  while (made < 2600 && tries < 30000) {
    tries++;
    const [kind, pmin, pmax, joy, tpls] = cgPick(CG_BOOK.kinds),
      t = cgFill(cgPick(tpls)),
      title = t.startsWith("《") ? t : `《${t}》`;
    if (seen.has(title)) continue;
    seen.add(title);
    const pages = Math.round((pmin + cgR() * (pmax - pmin)) / 10) * 10,
      ed = cgR(),
      edition = ed < 0.15 ? ["精装", 1.6, 1] : ed < 0.3 ? ["旧书", 0.5, -1] : ed < 0.4 ? ["插图本", 1.3, 1.5] : ["", 1, 0],
      brand = cgPick(CG_BRANDS.fun);
    cgAdd({
      id: `bk.${made}`,
      name: `${kind}${title}${edition[0] ? " · " + edition[0] : ""}`,
      price: cgMoney((0.5 + pages / 400) * edition[1] * (0.8 + cgR() * 0.4)),
      weight: +(0.15 + pages / 1200).toFixed(2),
      servings: 1,
      category: "leisure",
      kind: "book",
      life: 9999,
      pages,
      joy: Math.max(5, joy + edition[2] + Math.round((cgR() - 0.5) * 2)),
      maker: brand + CG_MAKER.fun,
      look: "novel1",
      genre: kind,
      trait: edition[0] ? { 精装: "hard", 旧书: "old", 插图本: "illus" }[edition[0]] : "std",
      line: "bk-" + kind,
    });
    made++;
  }
}
cgBuild();
const CATALOG_CORE = new Set([...Object.keys(STARTER), ...Object.keys(YEAR_KIT)]);

/* ---------- Plain-language use text for generated goods ---------- */
const CG_BOOK_TRAIT = { hard: "精装：更耐读，心情多一点", old: "旧书：半价，书页发黄（心情少一点）", illus: "插图本：有很多插画，心情多一点" };
function cgUse(it) {
  if (!it?.gen) return "";
  const parts = [];
  if (it.kind === "seasoning") {
    parts.push(`调味料，不能单独吃。每顿煮的饭会自动用一点（几种调料轮流用），这顿饭心情+${it.season}。`);
    if (it.thirst) parts.push(`辣：那顿饭水分−${it.thirst}。`);
  } else if (it.kind === "food") {
    if (it.ingredient) parts.push("食用油：煮饭时自动用一勺，这顿饭更顶饱。");
    else parts.push(it.cook ? "在电炉上煮熟再吃。" : "不用煮，打开就能吃，停电也行。");
    if (it.protein) parts.push("有蛋白质。");
    if (it.vegetable) parts.push("蔬菜，和主食轮换口味。");
    if (it.life <= 14 && it.category === "fresh") parts.push("很快会坏，放冰箱能多放几倍时间。");
  } else if (it.kind === "drink") {
    parts.push(it.liters ? `${it.liters}升饮用水，停水时救急。` : it.brew ? `用热水冲着喝（要有电或燃料炉），每杯水分+${it.water}。` : `打开直接喝，每份水分+${it.water}，不用烧水。`);
    if (it.energy) parts.push(`提神，体力+${it.energy}。`);
  } else if (it.kind === "care") {
    parts.push(`拿在手里使用：${it.care.text}${it.reusable ? "可以反复用。" : `能用${it.servings}次。`}`);
  } else if (it.kind === "book") {
    parts.push(`${it.genre}，${it.pages}页。拿在手里读，每次2小时，心情+${it.joy}。每本书单独计算新鲜感，书越多越不腻。`);
  } else if (it.kind === "leisure" && !it.base) {
    const act = { chess: "一个人摆棋局", puzzlebox: "动脑筋解开它", cards: "一个人玩一会儿", music: "听一会儿（停电时要电池）", craft: "慢慢做手工", draw: "画画、写写、填填" }[it.activity] || "打发时间";
    parts.push(`拿在手里使用：${act}，一个半小时，心情+${it.joy}。和别的消遣轮换着玩，不容易腻。`);
  } else if (it.base) {
    parts.push(typeof ITEM_USE !== "undefined" && ITEM_USE[it.base] ? ITEM_USE[it.base] : "");
    if (it.capacity && it.base !== "bottle" && it.capacity !== DB[it.base]?.capacity) parts.push(`容量${it.capacity}升。`);
    if (it.thermos) parts.push("暖水瓶：停电时也能冲一次热饮（每天一次）。");
    if (it.noPower) parts.push("不用电也能扇。");
  }
  const tr = it.kind === "book" ? CG_BOOK_TRAIT[it.trait] : (it.kind === "food" || it.kind === "drink" ? CG_FOOD_TRAITS : CG_GOOD_TRAITS)[it.trait]?.[3];
  if (tr) parts.push(tr + "。");
  if (it.thirst && it.kind !== "seasoning" && !/每吃一份水分/.test(tr || "")) parts.push(`偏咸偏辣，每份水分−${it.thirst}。`);
  if (it.warmth && !/暖身/.test(tr || "")) parts.push(`热乎乎的，冷天心情再+${it.warmth}。`);
  if (it.health && !/健康/.test(tr || "")) parts.push(`每份健康+${it.health}。`);
  if (it.coldComfort && !/保暖/.test(tr || "")) parts.push("天冷时格外有用。");
  return parts.filter(Boolean).join("");
}

/* ---------- This run's shop: ~1% of the catalogue, chosen by the seed ---------- */
const SHOP_CATS = ["staple", "canned", "fresh", "drink", "hygiene", "clean", "tool", "medical", "leisure", "furniture"];
const SHOP_PER_CAT = 20;
const CG_SHOP_CACHE = {};
function cgSeed() {
  try {
    return currentSeed || (G && G.seed) || "ANDERS-1986";
  } catch {
    return "ANDERS-1986";
  }
}
// Originals that need special code paths stay out of the random pool unless a kit needs them.
function shopStock(seed) {
  seed = seed || cgSeed();
  if (CG_SHOP_CACHE[seed]) return CG_SHOP_CACHE[seed];
  const r = { rng: hashSeed("shop|" + seed) },
    rand = () => rngNext(r),
    out = [];
  for (const cat of SHOP_CATS) {
    const core = CATALOG.filter((it) => it.category === cat && CATALOG_CORE.has(it.id));
    const pool = CATALOG.filter((it) => it.category === cat && !CATALOG_CORE.has(it.id));
    const picked = [...core],
      lines = new Set(core.map((it) => it.line || it.id));
    let guard = 0;
    while (picked.length < SHOP_PER_CAT && guard++ < 4000) {
      const it = pool[Math.floor(rand() * pool.length)];
      const ln = it.line || it.id;
      if (lines.has(ln) && guard < 3000) continue;
      lines.add(ln);
      picked.push(it);
    }
    out.push(...picked);
  }
  CG_SHOP_CACHE[seed] = out;
  return out;
}
const CG_STOCK_IDS = {};
function inShopStock(id, seed) {
  seed = seed || cgSeed();
  CG_STOCK_IDS[seed] ??= new Set(shopStock(seed).map((it) => it.id));
  return CG_STOCK_IDS[seed].has(id);
}
