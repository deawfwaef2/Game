# v0.18.0-preview — 每种东西都不一样（2026-10-18）

## 视觉自检
- 9-catalog-card：商品卡依次显示描述、橙色特色、用途、厂牌和产地，例如“胜利家乡风味冰糖雪梨罐头”。
- 6-catalog-canned：罐头大小、高矮、颜色各不相同，罐身印着品名。
- 7-catalog-leisure：书有体裁颜色的封面，印着书名和出版社。
- 29-desk-books：
  - 第一次截图发现两个问题：一是占位道具“床边读物”悬空，并和真书重叠；二是旧的书摞会穿进桌上的本子，第二排还浮在空中。
  - 修复后，书按厚度叠成摞，有真书时占位道具隐藏。
- browser 测试曾失败一次，原因是中心射线被本子挡住，这正是上面的穿模问题。修复后通过。

## 自动测试（全部 exit 0）
- simulation：原有断言全部通过，新增的 v0.18 特色断言也全部通过。目录 19,788 种，每局 200 种（1.01%）。
- browser、realism、navigation、smoke、life、audio、live 全部通过。

# v0.17.0-preview — 两万种商品，每局到货 1%（2026-10-18）

## 视觉自检
- tools/qa-catalog.cjs（种子 QA-CATALOG-7）：
  - 罐头和消遣货架上摆着按种子抽到的变体商品，例如“东风军需银耳莲子羹”“雪莲暖身咸鸭蛋”“侦探小说南港谋杀案”。价签写着价格、份数和重量。
  - 到货牌第一次截图不可见，原因是它嵌进了墙里，挪到 x −6.9 后正常显示“本期到货 200 种 / 全国商品目录共 19,998 种”。

## 自动测试（全部 exit 0）
- simulation：
  - 原版 133 种都在；目录 ≥15000 种；每种商品都有用途说明，每种特色都写明了效果。
  - 每家店约 200 种（1.00%）；配给箱的基本货一定有；同一种子结果一致，不同种子差异超过 100 种；每格不超过 20 种。
  - 变体肥皂算作肥皂，并加上自己的加成；精制扫帚生效；麻辣食物减少水分；强化食物增加健康；调味料轮流使用；雪花膏能用，且有每日上限；舒适家居和不同绿植生效；生成的书能读、生成的棋能玩；带有变体商品的存档能通过校验。
  - 365 天策略仍然能赢。
- browser（货架商品数等于 shopStock）、realism、navigation、life、audio、live 全部通过。

# v0.16.0-preview — 听得见、看得清、说得明白（2026-10-18）

## 视觉自检
- 先用 tools/qa-ui.cjs 截了标题页、供销社、货架近景、配给箱、过道和房间，发现三个问题：供销社一片过曝的白，商品只是没有字的方块，屏幕上的字又小又淡。
  - 过曝的原因：店里的环境贴图按满强度照亮了所有表面。已把环境光强度降到约三成，曝光降到0.9，灯光改成暖色。
  - 商品换成了精细模型，配上大价签和大商品卡片。
- tests/artifacts/ui/5-feedback.jpg：洗澡后的结果提示“心情 +2 · 清洁 +28 · 过了 20分钟”。
  - 看截图时发现房间样片的提示和左上角的地址重叠了，屏幕中间的字幕也和对准物品时的提示重叠，都已挪开。
- 店里的绘制调用约337次，同屏约8万个三角形。

## 自动测试（全部 exit 0）
- 新增 tests/audio.cjs：
  - 72段内嵌音频全部能离线解码（其中6首配乐）。
  - 拿起东西、开门、冲马桶、翻书、敲门（正好三下）都会播放对应的声音。
  - 结果提示的内容正确。
  - 屋里有钟声环境音。
  - 声音可以关掉再打开。
  - 没有外部网络请求。
- simulation 新增：
  - 133件商品都有用途说明和数据行。
  - 洗发液、毛巾、剃须刀的效果都生效，剃须刀每天只算一次。
  - 消毒液、食盐、黑胡椒、平底锅、密封罐的效果都生效。
- 以下测试都通过：simulation / audio / life / smoke / browser / realism / navigation / live。
  - live 测试里“结账后进入房间”的等待时间放宽到90秒，因为在软件渲染下店里第一次编译着色器比较慢。

# v0.15.0-preview — 一个说得通的家（2026-10-18）

## 视觉自检
- tests/artifacts/frost.jpg：严寒早晨外层玻璃上的冰花。第一版太稀，加厚了底部的冰带，又加多了冰晶。

## 自动测试（全部 exit 0）
- simulation 新增：
  - 每一段邻居故事和每一个可能出现的事件，一年里都至少有一个能发生的时刻（不会卡住）。
  - 蝴蝶和大雾永远不会出现。
  - 深夜的事不会在中午发生；建国日烟花在19点，生日在12点。
  - 前租客随种子变化，一年正常打扫能找全6处痕迹（实测6/6）。
  - 一年能做至少8个梦（实测15个）。
- life 新增：醒来时显示梦里的一句话；严寒早晨玻璃结冰花。
- browser / smoke / realism / navigation（257条路线）/ live 全部通过。外部请求0，JS错误0。

---

# v0.14.0-preview — 会动的身体 / 看得见的天气（2026-10-18）

## 视觉自检（tools/qa-weather.cjs，截图拼在 tests/artifacts/weather.jpg）
- 第一版雨丝和雪花几乎看不出来。改法：雨丝加长加深，外层玻璃加了水珠和水痕贴图；雪花改成叠加混合，尺寸也调过。
- 第一版雪是积在外窗台上的，但从屋里被窗台板挡住，看不到。改成积在外窗框底部、贴着外层玻璃的一道雪，从屋里能看见。
- 第一版雪花在白墙前面像灰色斑点。改成叠加混合以后，在暗处是亮的雪花，在白墙前面看不出来，跟真实情况一样。

## 自动测试（全部 exit 0）
- simulation 新增：5个种子的雨雪天数在30到120天之间（偏暖的种子不下雪）；生日由种子决定，不和其他节日重合。
- life 新增：吃饱后说一次“胃里暖起来了”；下雨的时段窗外确实有雨。
- browser / smoke / realism / navigation（257条路线）/ live 全部通过。外部请求0，JS错误0。

---

# v0.13.0-preview — 用身体感受状态 / 一年里的日子（2026-10-18）

## 视觉自检（真实页面截图，tools/qa-body.cjs）
- 正常：没有任何滤镜、遮罩和文字。
- 又饿又渴：画面褪色发黄，边缘变暗，冒出心里话。
- 筋疲力尽加低落：画面灰而发虚，眼皮半垂。
- 发烧怕冷：四周泛白结霜，带红色脉动。
- 注意：在 SwiftShader 下截图会滞后一帧，脚本先截一张丢掉，再截正式那张。

## 自动测试（全部 exit 0）
- life.cjs 新增：正常时画面没有滤镜；饿了以后有滤镜和带“饿”字的心里话，底部不出现“需要吃饭”。
- simulation（365天胜利）/ browser / smoke / realism / navigation（257路线）/ live 全部通过。

---

# v0.12.0-preview — 性格 / 老房子故障 / 做菜 / 看窗外（2026-10-18）

## 视觉自检
- 日历“这一年”页新增“性格”“家里的毛病”“做过的菜”三行，排版不溢出，跨局结局区仍完整。

## 自动测试（全部 exit 0）
- simulation 新增：每局两种不同性格，并随种子变化；漏风加暖气不热使室温低5°C；胶带封窗、放气钥匙放气、维修套装修滴水；400天里故障偶尔出现、不会一直有；葱花挂面作为单独口味计入；看窗外能得到场景。365天存量策略仍能胜利。
- life.cjs 新增：窗户 Shift+E 看窗外、水槽提示显示滴水故障。
- browser / smoke（商品数133）/ realism / navigation（257路线）/ live 全部通过。

---

# v0.11.0-preview — 每局不同的故事、邻居、项目、目标与结局（2026-10-18）

## 视觉自检
- 窗边挂了620只纸鹤（约21串，多种颜色），在窗口两侧，不挡窗台上的花盆。
- 墙上日历的“这一年”页：小目标进度条、各项统计、跨局结局格子，文字清楚。

## 自动测试（全部 exit 0）
- simulation 新增：不同种子的新闻不同；10个种子里至少6种不同的故事组合；每局3条邻居故事线、5个小目标、39集广播剧；新闻模板全部填好，按日期排序，带搜查预警；纸鹤一张纸折一只；事件持续发生；邻居故事会推进；结局判定。365天存量策略仍能胜利。
- life.cjs 新增：日历“这一年”页、窗边300只纸鹤、园丁结局页和跨局记录。
- browser / smoke（商品数131）/ realism / navigation（257路线）/ live 全部通过。

---

# v0.10.0-preview — 家信 / 广播 / 窗台菜园；删除虫鼠及替代物（2026-10-18）

## 视觉自检
- 窗台上三个陶土盆（葱、挂果的樱桃番茄、豆芽）近景和远景各看一次：盆放在窗台板上，没有穿模，高度合适。
- 床头柜上的信捆（绳子十字捆好）和旁边拆开的信封。
- 第一人称双手拿着第3封信：两页手写，日期标签和翻页提示都清楚。

## 自动测试（全部 exit 0）
- simulation：原有断言加16条新的（信件日期和提前拆、早间新闻和天气预报、每周广播剧、搜查预警窗口、葱的生长与收获、干死、存档校验、不存在虫鼠系统），365天存量策略仍能胜利。
- 新增 life.cjs：在真实3D房间里种葱→收获到手里、拆信→手里出现信纸、收音机字幕；JS错误0，外部请求0。
- browser / smoke（商品数130、新的套餐价格）/ realism / navigation（257路线）/ live 全部通过。

---

# v0.9.0-preview — 时间与天气 / 马桶（2026-10-18）

## 视觉自检
- 同一机位在第3天7:18、10:00、13:30、17:24和第5天阴天11:00各渲染一张：上午光斑落在窗前左侧地板，中午移到窗下与茶几附近；很低的早晚斜阳被40厘米窗洞挡住；阴天没有直射光斑。
- 卫生间视角检查新马桶：座圈、翻盖靠在水箱上、按钮、角阀软管都在正确位置。

## 自动测试（全部 exit 0）
- simulation：159 断言 + 365 天存量策略胜利。
- browser / smoke / realism / navigation（257 路线）/ live 全部通过，外部请求 0、JS 错误 0。

---

# v0.8.0-preview — 真实光照 / 建筑细节（2026-10-17）

## 视觉自检
- `tools/qa-views.cjs` 新增 `QA_AO=on|off`、正则过滤，以及窗户近景、窗台、暖气片、床毯、卫生间门、浴盆、厨房插座等视角；镜像种子 ANDERS-1986 与非镜像种子 D 均已检查，白天和夜晚（22:00）都看过。
- 新工具 `tools/qa-probe.cjs <seed> "<js>"`：在载入的样片里执行表达式、打印结果（用来查材质/光源/射线命中）。
- 发现并修复：环境贴图强度设置在 r160 中无效（全屋被满强度照亮）；GTAO 把不可见交互代理画成亮框；玻璃前点光源产生的高光点；窗格边缘的 AO 颗粒和阴影锯齿；浴盆外壳法线反向；床毯爬上靠背；水槽碗体单面导致看穿到柜体。

## 自动测试（全部 exit 0）
- simulation：159 断言 + 365 天有限库存策略胜利（剩 512 份）。
- browser / smoke：完整生活、存档、手机、无 WebGL 降级通过；外部请求 0、JS 错误 0。
- realism：资源无 fetch、蒙皮手、真实表面放置、样片隔离、无网络 iframe 通过。
- navigation：257 条种子路线全部可达（新增浴盆与卫生间门碰撞体后仍可达）。
- live：真实 RAF 下行走、结账、拆袋通过。
- 另行检查：暂停菜单“环境光遮蔽”按钮开关、记忆设置、GTAO 管线在 SwiftShader 上无报错。

## 仍然只是预览
- SwiftShader 截图不代表真实 GPU 帧率；GTAO 在弱 GPU 上会自动关闭。门边 18 袋时绘制调用仍约 450（袋子网格合并留到后续）。
- 外出/追捕/监狱、任意搬家具仍未实现。

---

# v0.7.0-preview — 写实室内 / 手动拆袋摆放（2026-10-17）

## 视觉自检（这次逐个看过渲染图）
- `tools/qa-views.cjs`对镜像种子ANDERS-1986与非镜像种子D各渲染18个视角：入口全景、厨房、冰箱正/斜/开门、电炉近景、床桌、卫生间、面盆、门边袋子、衣柜沙发、窗、天花板、储物架、袋子近景、已摆放的储物架与冰箱。
- 发现并修复：冰箱朝向（v0.6遗留）、厨房旧铜管/毛巾杆残影（圆角盒参数失真导致没被隐藏）、日历文字镜像、袋子印刷文字左右反、天花板水渍形状呆板、袋子内容物过大顶出袋口、定点模式底部字幕压住下方箭头。
- 镜像/非镜像户型中文字（门牌、袋子、日历、商品）均正向可读。

## 自动测试（全部exit 0）
- simulation：159断言 + 365天有限库存策略胜利（剩512份）。
- browser/smoke：E解开袋子 → E取出一组到手 → 手满拒绝再拿 → 对准储物架隔板R放下（记录位置与姿态）→ 冰箱开门 → 对准隔层R放入 → 再取回；手机tap同样“开袋→取出一组”。外部请求0、JS错误0。
- realism：资源无fetch、蒙皮手、抬杯、真实表面放置、样片不覆盖存档、`sandbox=allow-scripts`无网络iframe中经`window.CLOSED365_SAMPLE`进入样片（替代原独立样片HTML）。
- navigation：257条种子路线全部可达（新冰箱/电炉停靠点）。
- live：真实RAF下E开袋、E取物成功。

## 仍然只是预览
- 软件渲染（SwiftShader）截图不代表手机FPS；门边18袋时绘制调用约450。
- 外出/追捕/监狱、任意搬家具仍未实现。

---

# v0.6.0-preview — 街景移动 / 胶片外景（2026-10-17）

## 已跑通的新模式
- 手机真实tap：走到全年配给单→E登记→走到收银→E付款，14商店站点均可达；不会替玩家自动买。
- 公寓床/桌/水槽/电炉/储物架/冰箱/卫生间/衣柜/沙发/入口路线，沿原碰撞规则普通速度行走，到点转向实物。
- 24种子、9种尺寸、正反布局共257条站点路线，未发现不可达或不安全路径点。
- 真实四边按钮tap、自由模式恢复移动、模式切换位置不变、手机E/使用按钮无遮挡、途中暂停/读档/新敲门停步，主动警报下再次走路不软锁。
- 真实RAF下走路会推进原游戏时钟，不是瞬移或不计生存时间。
- 同模式检查外部请求0、JS错误0；159基础模拟与365天有限库存策略仍通过。原始完整生活/存档/手机/降级回归也通过。

## 外景/画面验证方式
- 千余窗格/25阳台为批次几何，立面贴图、远处全景仍是图像；不是整座城市可探索。
- 外景独立射线层，保留房内选择；胶片效果无blur/低分辨率滤镜，可关闭。
- 低分辨率CDP完整页面JPEG已成功读回/查看，含实际CSS胶片效果与导航UI；Canvas只代表未经CSS处理的3D底图，且必须render与toDataURL同一个evaluate执行。
- 这些测试不等于所有手机默认画质FPS达标，也不等于用户已认可美术。

---

# v0.5.0-preview 写实房间样片验收（2026-10-17）

## 规则仍是一次采购后封闭生存
159模拟断言与365天YEAR库存策略通过；没有依靠补货胜利。新模型未替换库存/疾病/生理模拟。

## 已执行的检查
- 新模型版本完整`tests/browser.cjs`exit0：3D商店/拿放/拆袋/吃喝/炉具/冷藏/读书/洗换/卫生/床/手记/腕表/存档/手机/无WebGL降级继续通过；游戏开始后所有已知采购入口均拒绝，外部请求0、JS错误0。
- 新`tests/realism.cjs`约43秒exit0：封闭库存、25关节蒙皮手、抬杯位移与倾转、双手书籍、R落在真实床面而非交互盒、样片不覆盖本地存档、返回标题恢复原G、导入正式档退出样片。
- 同测试强制`fetch`失败仍加载所有模型/纹理，且在`sandbox=allow-scripts`、无same-origin、`connect-src none / img-src data:`的iframe中自动进入可操作样片，存档校验通过。
- 当前`tests/live.cjs`约27秒exit0：真实RAF下移动、拖动、取清单、结账、连续拆袋自动完成；无日常面板/JS错误。CI只降低像素比/关闭阴影，没有重置生存状态。
- Canvas直接读回可操作房间/手持杯的实际WebGL图像，非生成的房间效果图。截图为QA产物，不是覆盖式画面或性能保证。

## 不代表什么
商店/全部129包装/所有家务动作还没同等重做；手是通用VR蒙皮+程序化屈指，不是完整人物/动捕。图形质量仍需用户验收。测试并不证明默认画质下所有硬件FPS，也不证明原型已达到最终美术标准。

---

# v0.4.1 当前验收口径（2026-10-17）

用户明确纠正：只能开局采购一次，进入公寓后禁止购买/补货。下方v0.4.0的“地下补给通过”是被否定的历史行为，不能作为当前功能。

本次是规则修复，不是视觉交付；当前美术被用户否定，视觉重做尚未完成。159项模拟断言与365天封闭库存策略通过。完整浏览器回归约50秒exit0，新增门口、新旧商店、重复结账、直接入库、套装、旧resupply请求均拒绝；库存、现金与时间不变，网络请求0、JS错误0。另测强制无WebGL的首次结账正常、随后所有旧入口不能补货，旧v3导入也保持锁定。

---

# 历史测试记录 — v0.4.0 / 2026-10-17

## 正常模式已改为实物交互
这不是用旧按钮测试冒充新版本。`tests/browser.cjs`已重写，正常3D流程通过生产射线、真实键盘/触控事件和同一生存模拟完成，不调用旧库存/家具/时间面板。

### 模拟：144断言与实际库存365天策略
- 原有135断言继续通过；新增合法摆放/手持UID、非有限坐标、越界高度/位置/旋转、非法UID、运输触发结局不被覆盖等9项。
- 全年策略继续从YEAR_KIT真实库存运行，不重设需求、不生成免费资源；第366天索引到达胜利，9524次循环，1004餐/664次饮水/330次休息，健康100、精神约64.65、余512份食物。
- 这只证明存在可行策略，不保证任意采购或玩法都能获胜。

### 新的完整浏览器回归：exit 0
- **file://单HTML离线启动，外部请求0，未捕获JS错误0。**
- 可走动商店有129个独立商品目标；旧商品网格隐藏，WASD/鼠标拖动响应。
- 准星射线+E拿大米、R退回，预算不足拒绝拿取；Tab拿起实体收据，无G的新开局也能显示。
- 真实E取基础箱（83件、89.39纸币），收银台E付款，回房现金210.61、9袋。
- E逐袋/Shift+E连拆；射线拿取饼干，R摆到桌面，再次E拿起。用空格吃饭，消耗所选批次一份；无旧QTE卡或日常面板。
- 水槽接水喝与装满5L储水；主食未经烹煮不能直接吃，到炉边E烹煮后可吃。
- 冰箱门向外开合，R放入冷藏，随后能射线取回。
- 拿书阅读有页数进度；衣柜打开后换衣、洗衣盆洗衣、大小便、花洒、床边调整4h并睡眠、实体手记翻页和腕表通过。
- 物品坐标经JSON导出/本地重开继续/文件导入仍保留；非法坐标拒绝。旧v3数据可省略新字段。
- 地下补给货架交易实际消耗现金和2h、增加风险，回到原公寓位置，不冒充已实现外出地图。
- 390×844触控模拟：无横向溢出，实体配给箱、收银、拆袋、手记翻页、暂停/继续均通过。
- 强制让Canvas拒绝WebGL，旧降级采购/结账/房间/拆袋仍可玩。

### 独立真实活动RAF检查：exit 0
`tests/live.cjs`不停止动画调度，实际W移动（z 4.55→4.19009）、拖动视角、射线/E配给、收银自动完成、Shift+E拆袋自动完成；日常面板0、JS错误0。
为了使软件GPU CI稳定，单独此检查将像素比例降至0.6并关闭阴影；不修改游戏时间、健康或其他生存数值。**这不是默认画质的帧率保证。**

## 图形与测试限制
- 在头顶/书桌视角已人工查看商店、房间和手持书的真实渲染。直接从WebGL画布读回PNG成功，context未丢失。
- 软件GPU下停止RAF再调用整页截图，曾在12s超时；该次不能算截图通过。改用同步画布读回可检查3D物体，功能回归与截图分开报告。
- 功能回归为避免CI合成卡死，停止RAF后用生产`worldFrame`手动结束动作；射线、输入处理、库存和模拟均是发布代码。另有上面的真实RAF检查补充，不能混同为全平台性能测试。
- 手机是Chromium触控视口模拟，不是所有iOS/Android硬件实测。Firefox/Safari、长期真实游玩、更多种子全年策略仍待扩大。
- 摆放不是刚体重力/堆叠；人物/吃喝/家务是简化程序化动画，书仅有原创片段；外出追捕、监狱和自由搬家具未实现。
- GitHub写入认证缺失，本轮阶段提交保存在本地；远端仍是v0.3.1，未谎称同步。新版离线ZIP附带完整模块化源码与测试。

---

# 历史记录 — v0.3.1 / 2026-10-17（不作为0.4新交互验收）

## 已通过

### 纯模拟 `node tests/simulation.cjs`
- 135项基础断言：商品数据、ID唯一、份数、100种种子可重复、冰箱/温度差异、逐袋≤8kg、不丢包、全年热量在300纸币内。
- 存档JSON往返、缺字段/错误环境/原型ID/注入式UID拒绝。
- 危险睡眠自动中断、睡眠恢复、冰箱减缓计龄与断电失效、准确消耗选定食物份数。
- 无法用反复剪短指甲或清扫已经干净的地板刷精神；读书中断按实际时长奖励。
- 三类几何干扰物发现后清理、疾病不叠重复状态、休息缩短持续时间。
- 365天胜利、健康耗尽失败、精神耗尽失败。
- 另运行一整年资源策略测试：从实际YEAR_KIT库存开始，没有重设生存数值、没有凭空补给，成功到达胜利。约9524次策略循环、1004餐、664次饮水、330次休息；期末仍有实际物资。**这只证明存在可行策略，不保证任意清单必胜，也不等于难度已完美平衡。**

### 真实浏览器 `tests/browser.cjs`
- Chromium，Three.js实际创建WebGL场景，无JS异常。
- **file://直接打开单文件HTML，外部网络请求为0**。
- 真实按钮流程：采购→商品搜索→详情→结账→全部拆袋→选食物→慢吃QTE→接水→储水→4小时睡眠→阅读。
- 行动后WebGL context未丢失。
- 文件来源localStorage存档、JSON下载、新页面重新打开继续、JSON文件导入均通过。
- 390×844手机视口：无横向溢出，采购、结账、拆袋、点击暂停提示继续通过。
- 主菜单与商店手机截图已人工查看；截图仅本地QA，不进入发行ZIP。

### 独立3D输入检查
- 960×640实际运行渲染循环时，按A移动：x从0到-0.405。
- 鼠标实际拖动后yaw=-0.39，视角改变。
- 准星射线识别水槽，实际按E后打开对应交互面板。
- 无JS异常。

## 性能改进
- 窗外城市数百扇窗改用InstancedMesh，初始视角draw calls由540降至128。
- 阴影缓存，静态菜单/面板不持续渲染3D；游戏活动视角约30fps目标。
- 实际帧率取决于设备。未宣称所有手机/浏览器都完成性能验收。

## CI截图注意
软件GPU的Chromium在持续渲染WebGL并截取多层backdrop-filter页面时出现过截图/重载超时。稳定浏览器回归在初始3D创建后停止渲染调度器，继续执行**相同的生产UI和生存逻辑**，并手动验证行动后的WebGL渲染；另有活动渲染循环下的真实移动/鼠标/E键检查。不要把早期截图脚本超时误报成测试通过，或隐藏这个测试方法区别。

## 后续仍应补充
- Firefox/Safari、不同Android/iOS设备实机性能。
- 玩家体验下的365天难度、操作重复度和乐趣平衡。
- 更多种子下的完整一年策略测试。
- 真实外出追捕、完整自由摆放与复杂配方尚未实现，不在本轮验收范围。

### 降级复验
强制让Canvas拒绝所有WebGL上下文后，游戏正确显示降级场景；实际采购、结账、房间面板、全部拆袋均可运行，未捕获JS错误为0。源码格式化后也重新通过模拟与浏览器回归。


# v0.19.0-preview — hidden-clock chapter mode (2026-10-18)

## Chapter regression
- `node tests/levels.cjs`: **56 assertions pass**. Covers deterministic progressive catalogue, original goods, all chapter clocks, nightly one-press rule across midnight, wrong-action penalties, each level's distinct correct trigger/reward, timepiece/battery/drift/outage behavior, save validation, chapter completion, star and unlock persistence.
- `node tests/simulation.cjs`: **162 assertions pass**; the existing 365-day resource policy still wins at day 366. Classic catalogue remains 19,788 goods / 200 seed-stock goods (1.01%).
- `tests/levels-browser.cjs`: **pass** in actual WebGL/file:// Chromium. Chapter picker shows six rooms, only the first locked-state opens; chapter shop order book searches the 1/6 starter tranche and sells a wristwatch and battery; checkout returns to the room; HUD has no date, clock or remaining-day value; physical bell fixture exists. External requests 0, JavaScript errors 0.

## Existing browser regressions
- `tests/browser.cjs`: all physical shop/room controls, single purchase, old-v3 save compatibility, no-WebGL fallback, and 390×844 touch route passed; external requests 0, JavaScript errors 0.
- `tests/realism.cjs`: offline model/hand/action/placement and sample return/import/opaque iframe passed.
- `tests/navigation.cjs`: 14 waypoints, touch arrows, movement-mode switch, pause/load, 257 seeded routes (no missing routes), external requests 0, JavaScript errors 0.
- `tests/audio.cjs`: 72/72 embedded clips decode; action feedback, room clock ambience, triple knocks, and sound controls pass.

## Boundaries
- The 1,000-day chapter is a hidden nominal countdown; successful chapter-specific actions shorten it. It is not a claim that 1,000 real-world days pass.
- Clocks have gameplay state and 3D item forms; labels are read via T. They are not individually animated to-the-second face hands.
- Walkable shelves show up to 20 samples per category; all currently unlocked goods are searchable in the order book. Every generated product line is unlocked only by chapter progression.
- Free furniture rearrangement, outside gameplay and gifts remain absent.

# v0.19.1-preview — stocked chapter shop and upper-left needs HUD (2026-10-18)

## Changes validated
- Fixed the chapter shelf sampler: `SHOP_CATS` is a list of category strings, so destructuring each string had reduced categories to their first character and left all 3D shelves empty. The sampler now iterates category IDs directly; chapter one places **200 products across all ten bays**.
- Added a persistent upper-left survival panel during play: six primary needs bars plus bladder, bowel, and room-cleanliness indicators. It does not reveal date, clock, or hidden remaining days; it is hidden while shopping.
- Added a clearly labeled top-right **Browse all products** button to chapter shopping. It opens the searchable order book from anywhere in the shop; the initial chapter offers 3,066 products.
- Added an AI-generated, locally embedded 1986 cooperative-shop hero image to the order book, restyled catalogue cards, and documented the asset in `src/assets/manifest.json`. No CDN/network dependency was introduced.

## Regression results
- `node tests/levels.cjs`: **60 chapter assertions pass**, including 200 starter shelf samples and all ten stocked categories.
- `node tests/simulation.cjs`: **162 deterministic assertions pass**; classic 365-day strategy still wins on day 366.
- `tests/levels-browser.cjs`: chapter shelves, browse button, populated order book, checkout, hidden clock and six needs bars pass; **0 external requests, 0 JS errors**.
- `tests/browser.cjs`: all classic physical shop/room/purchase/save/touch/no-WebGL regressions pass; **0 external requests, 0 JS errors**.
- `tests/realism.cjs`, `tests/navigation.cjs`, and `tests/audio.cjs`: pass; navigation audited 257 seeded routes, audio decoded **72/72** embedded clips; **0 external requests, 0 JS errors**.
- Manually inspected `tests/artifacts/levels/05-shop-shelves.jpg` (200 physical samples), `03-order-book.jpg` (photo header and catalogue), and `04-hidden-clock-room.jpg` (upper-left needs panel). Overlay screenshots are opt-in with `QA_SCREENSHOTS=1`; the QA screenshot path disables backdrop blur only during capture to avoid software-GPU timeout.

# v0.20.0-preview — chapter difficulty, palate fatigue, and uncertain expiry (2026-10-18)

## Pure simulation
- `node tests/levels.cjs`: **89 chapter assertions pass**. Covers three budget multipliers and actual checkout cash, easy/strict timing windows, scaled wrong-action penalties, save validation for bounded palate exposure, shared trait boredom and 30-day half-life, unmarked/blurred labels with exact hidden spoilage, and 12 differentiated new food lines. Existing chapter-specific fixtures and clear/unlock flow still pass.
- `node tests/simulation.cjs`: **162 deterministic assertions pass**. The classic 365-day resource policy still wins at day 366; its original short-window same-flavor penalty remains. Catalogue is **19,800 goods**, with 200 classic seed-stock goods.

## Browser / offline regressions
- `tests/levels-browser.cjs`: passes the three difficulty controls, selected standard state, chapter-specific budget display, 3D stock/order book, checkout, hidden clock and needs HUD; **0 external requests, 0 JS errors**.
- `tests/browser.cjs`: classic shop, purchasing, placement, save/import, mobile route and no-WebGL fallback pass; **0 external requests, 0 JS errors**.
- `tests/realism.cjs`: offline models/hands/placement/sample save isolation and opaque no-network iframe pass.
- `tests/navigation.cjs`: 14 shop stops, touch arrows, pause/load, and 257 seeded routes pass; reports **`liveClock:true`**, **0 external requests**, **0 JS errors**.
- `tests/audio.cjs`: **72/72** embedded clips decode; sound controls/actions pass.
- `QA_SCREENSHOTS=1 ... node tests/levels-browser.cjs` passed; manually inspected updated chapter picker (three difficulty cards and per-chapter budget). Temporary screenshots were removed.

## Build / boundaries
- `python3 tools/build.py` generated offline `index.html` at **22,855,124 bytes** and a temporary ZIP in `dist/`; `dist/` and QA artifacts were removed after verification. Workspace measured about **71 MB**.
- `scene.js` already advances idle time during active play. This update does not add offline time advancement. Pause/panels/busy actions continue to suppress idle time.
- Uncertain/missing expiry is only a public label; internal spoilage age, refrigeration and power effects are unchanged. Trait fatigue and difficulty are chapter-only; classic mode keeps its 365-day rules and 300-paper budget.

# v0.21.0-preview — distinct package models, visible shelf life, waste cycle (2026-10-18)

## Pure simulation
- `node tests/levels.cjs`: **98 assertions pass**. Unmarked and blurred labels show a nominal range and storage time without exposing exact batch dates/remaining life; internal exact spoilage still triggers. Also checks 12 custom food shapes, once-per-batch packaging, meal scraps, chapter-only overflow tidiness, classic no-penalty behavior, and disposal.
- `node tests/simulation.cjs`: **165 deterministic assertions pass**. Waste save integrity is checked; unsupported categories and inconsistent totals are rejected; old saves without categorized waste migrate their legacy trash count. Classic 365-day policy still wins on day 366.

## Browser / visual / offline regressions
- `tests/levels-browser.cjs`: chapter picker, progression lock, searchable order book, checkout, hidden clock and room fixture pass; **0 external requests, 0 JS errors**.
- `tests/browser.cjs`: physical shop, one-time purchase, manual placement, meal, categorized package/scrap creation, visible waste bag, unmarked batch shelf-life focus hint, old-v3 save, mobile and no-WebGL fallback pass; **0 external requests, 0 JS errors**. A title-button timeout happened once during a run; isolated interaction and full retry passed.
- `tests/realism.cjs`: imported mesh/PBR, 25-joint hands, animated cup, placement, sample isolation and opaque offline iframe pass.
- `tests/navigation.cjs`: 14 shop stops, apartment routes, touch arrows, pause/load and **257 seeded routes** pass; `liveClock:true`, **0 external requests, 0 JS errors**.
- `tests/audio.cjs`: **72/72** embedded clips decode; feedback, effects, knocks, ambience and sound toggle pass.
- QA-only screenshots of varied 3D packaged products and tied waste bags were manually inspected; screenshots are removed after QA.

## Build / boundaries
- `python3 tools/build.py`: self-contained offline `index.html`, **22,874,204 bytes**, with temporary ZIP under `dist/`. The final workspace cleanup removes `dist/` and `tests/artifacts/`; root `index.html` remains the deliverable.
- No offline time progression, automatic inventory placement, additional pest/disgust mechanics, restocking, gifts, or purchasable chapter mechanisms were added. Chapter overflow penalty is exclusive to chapter mode; classic 365-day rules remain unchanged.

## Publication check
- Local checkpoint: `d3ba4eefa35017a3296ade36452ba0a2d3cc2fab`, annotated `v0.21.0-preview`.
- No-token push attempts were safely blocked: strict SSH lacked a verified GitHub host key; HTTPS with credential helpers disabled had no username. No verification bypass, token use, or remote mutation. A read-only post-check confirmed remote `main` remains at v0.18 commit `92bebdcd15749bfae9d452ca611256802323fdb7` and v0.21 is not on the remote.

# v0.22.0-preview — immersive chapter archive and short mechanism games (2026-10-19)

## Gameplay / visual checks
- Six separate chapter cover illustrations load from embedded `data:image/jpeg` assets in the offline build. The chapter archive shows all six cards at the 1440×900 QA viewport; lower-row cards fit in view, and locked cards retain readable status and budget without the former overlay.
- `tests/levels-browser.cjs`: chapter picker art/lock status/budgets, order-book checkout, hidden-clock room, timing challenge, cancellation, and radio-tuning continuation pass. A clean timing-game result does not bypass the hidden trigger; cancel adds no attempt and the mini-game pauses the hidden simulation. **0 external requests, 0 JS errors**.
- Manually inspected `tests/artifacts/levels/02-chapter-book.jpg` and `05-wall-mini-game.jpg`; reduced scanlines and card height are legible, and the memory-game controls/status fit the viewport.

## Regression results
- `node tests/levels.cjs`: **108 assertions pass**; `node tests/simulation.cjs`: **165 deterministic assertions pass**, including the classic 365-day policy.
- `tests/browser.cjs`: all physical-world, shop, placement, purchase-lock, save/import, touch and no-WebGL tests pass. First invocation hit a 15-second title-button click timeout under software GPU; retry with a 30-second action timeout passed. **0 external requests, 0 JS errors**.
- `tests/realism.cjs`, `tests/navigation.cjs`, `tests/audio.cjs`, and `tests/life.cjs` pass. Navigation covers **257 seeded routes** and reports `liveClock:true`; audio decodes **72/72** clips. No JS errors or external requests reported.

## Build / boundaries
- `python3 tools/build.py` built self-contained offline `index.html` (**24,273,575 bytes**) and local `dist/Game-playable.zip` (**30,770,828 bytes**) after the visual refinements. The generated ZIP and QA screenshots are temporary; keep the root HTML build, but remove `dist/` and `tests/artifacts/` after any packaging/checkpoint step to respect the 128 MB workspace cap.
- Local generated illustrations remain source assets; no external styles, images, fonts, scripts, or network calls were added. The challenge UI does not show date, clock or hidden days; successful hand-skill only proceeds to the unchanged `lvTryAt()` secret checks. Chapters retain their fixed mechanisms, budgets, penalties, unlock flow and star-by-speed scoring; classic mode is unchanged.
- `tools/build.py` now describes ZIP creation as a **local build**, not a GitHub upload.
- Local safe checkpoint created: commit `8bf9ac939d652ffbe8e8fc341147d210a8b65675`, annotated tag `v0.22.0-preview`. `tools/safe_checkpoint.py` compacted/verified repository metadata and reported a projected workspace of 85,553,152 bytes; `dist/` and `tests/artifacts/` were removed while root `index.html` was retained.
- No remote URL is configured in the current clone (`git remote -v` is empty), so no push was attempted. For a future publish, configure authorized credentials and verify GitHub's host key; do not use the previously pasted PAT, and remind the user to revoke it.
