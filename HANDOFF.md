# HANDOFF — 闭门365 / THE LAST TENANT

## 不可覆盖的协作约定
- **每次开始编程前先读本文件和新增协作记录。**已有约定不可整体覆盖；阶段记录在文末追加。
- 当前仓库最初为空，无已有代码或其他 agent 的交接文件。当前会话没有可用的多 agent 实时通信工具，不能声称已经与其他 agent 通话。
- 不要重置、强推、覆盖未知来源改动。每次提交前检查 `git status` 与远端；协作冲突优先保留双方工作。
- **根目录 `index.html` 必须始终是可直接双击运行的可玩版本**，不需要 npm、服务端、联网或 CDN。
- 先保存可玩 HTML，再继续优化；每个可玩里程碑重新生成 `Game-playable.zip`，提交并尝试 push GitHub。
- 不要只写源代码、最后才构建。保留最近可玩版本，构建时原子替换入口。
- 工作区合计保持 **128MB 以下**，推荐项目低于 30MB。不要提交 node_modules、缓存、浏览器二进制或大型素材。
- 不把任何访问令牌、密码或其他凭据写入项目、日志、交接文件或提交。仅在临时进程内认证。用户曾在对话贴出令牌，已提醒撤销更换。

## 用户需求 / 不可丢失的偏好
- 中文，第一人称、3D 独立生存游戏质感，偏真实的高层旧公寓。
- 世界观：安德士帝国，异世界 1980 年代 / 近现代；主角犯罪并招惹黑帮，与家人告别后藏匿，躲够 365 天胜利。
- 初始 300 帝国纸币，面值按美元尺度理解；开局进入沉浸式大量商品商店。
- 商品要多样、具备重量、保质期、用途；塑料袋逐袋承重，能拆袋、整理、摆放。
- 种子随机：户型/布局/大小、温度、家具陈旧度、床质量、是否有冰箱；随机停水停电，可发生也可不发生。
- 饥饿、口渴、睡眠、大小便、清洁、精神、疾病持续效果；食物腐败、多样性、吃饭 QTE、日常生活调度。
- 睡觉指定时长 / 读书等推进时间；过度睡眠、重复食物/重复读物、脏乱、疾病降低精神；精神或健康耗尽失败。
- 头发、指甲会长；剪发、剪指甲、洗澡、换衣、洗衣、打扫需要相应工具或水电资源。
- **绝不添加昆虫、蚊子、老鼠，也不添加小汽车 / 小直升机 / 足球等替代干扰物；不恶心玩家。**房间脏乱只按现有清洁、精神与健康规则处理。此项取代下方v0.10之前的历史设想。
- 生存有难度，但避免恶意突然死亡、无法理解的损耗、明显软锁。危险需有提前提示；跳时逐段模拟，接近危急自动中断。
- 允许逐步扩展，根据用户反馈继续优化；不要虚称所有最终构想均已完整完成。

## 架构计划
- `index.html`：打包后的自包含入口，始终可玩。
- `src/`：模块化开发源文件（HTML/CSS/JS）；3D 引擎和程序化纹理本地内嵌。
- `tools/build.py`：生成自包含 HTML 与 ZIP，原子替换。
- `Game-playable.zip`：可以直接解压双击的版本。
- `DESIGN.md`：世界观、机制与平衡说明。
- `README.md`：启动方式、操作、版本边界。
- 存档使用 localStorage，另提供 JSON 导入/导出；沙盒不允许本地存储时必须能继续临时游玩。

## 协作 / 阶段记录（只追加）

### 2026-10-17 / Agent A / 初始化
- 已确认远端仓库为空，分支 main，无已有 handoff。
- 当前优先任务：先保存 v0.0.1 的离线 HTML 基础生存循环与 ZIP，然后升级 3D。
- 尚未确认 GitHub 写权限；必须如实记录每次 push 结果，不能把本地提交当作远端备份。

### 2026-10-17 / Agent A / Checkpoint 1 — v0.0.1
- 已优先生成 `index.html` 和 `Game-playable.zip`，是实际可运行的离线基础循环，不是空白占位。
- 本地提交 `457fa92` **已成功 push origin/main**，远端读回一致。
- 原型保留在 `releases/first-playable-v0.0.1.html`。下一阶段在 src 开发后原子打包，不让根入口出现半成品。
- 已下载 Three.js r160.1，MIT 许可，本地内嵌，不依赖 CDN。
- 正在做 3D 公寓、种子与采购/生存主循环；请勿同时修改 `src/core.js`、`src/scene.js`、`src/ui.js`。

### 2026-10-17 / Agent A / Checkpoint 2 — v0.3.0
- 已原子生成完整自包含3D入口与ZIP：HTML约841KB，ZIP约233KB；项目含本地测试截图约7.4MB，截图被.gitignore排除。
- 已实现129商品、种子房间、第一人称/拖动视角、家具面板、8kg分袋、拆袋、餐食QTE、冷藏计龄、需求与精神、护理、消遣、随机停水电/天气/敲门、抽象几何干扰物、365天结算、本地/JSON存档。
- Playwright实际运行：WebGL启用，540 draw calls / 7430 triangles（初始镜头）；采购89.39、拆袋、进食、接水储水、4h睡眠、读书、存档下载、刷新继续均执行，无JS错误。测试工具整个命令最终超时，属于长WebGL测试/清理等待，**不应宣称全套性能和长周期已验收**。
- 目前视觉截图可用，下一步需提高界面字号、做移动端和file://离线测试、严格验证存档与长周期/危险中断、减少渲染开销。
- 已知原型范围：户型为面积+镜像；摆放按区域；外出/监狱/追杀未实现，门保持锁闭；风险仅记录并影响敲门/后续扩展，不能虚称已有追捕AI。
- `src`当前由Agent A修改；其他agent请先协调，不直接覆盖。初始2D可玩备份仍保留。


### 2026-10-17 / Agent A / Checkpoint 3 — v0.3.1 交付准备
- 补记：Checkpoint 2提交 `2800799` **已成功push origin/main**，不是仅本地保存。
- 本阶段：字号可读性、商品详情、明确桌面摆放、严格存档校验、污染标记、长期独处精神损耗、按实际读书时长奖励、避免部分无意义动作刷精神、手机点击暂停继续、收音机增加实体承托柜，均已更新。
- 3D城市窗户实例化：初始draw calls从540降至128；菜单/面板静态时不持续绘制，缓存阴影。未保证所有低端设备帧率。
- **测试已通过**：135基础模拟断言；一整年实际库存策略到胜利（没有重置需求或生成免费补给）；file://离线启动且外部网络请求0；真实UI采购/搜索/详情/拆袋/QTE/饮水/睡眠/读书；本地存档与JSON导入导出；重新打开继续；390×844手机布局与操作。实际3D活动循环下WASD、鼠标拖动、准星命中水槽、E交互通过。详情见 `tests/RESULTS.md`。
- 早期持续WebGL截图脚本遇到软件GPU超时。稳定回归改为暂停渲染调度来测UI，再单独测试活动3D输入；不能夸大为全平台性能测试。`tests/smoke.cjs`现转到稳定browser脚本。
- 运行资源全部内嵌，根HTML不足1MB，ZIP约240KB。整个 /home/user 当前约17MB，远低于128MB；测试浏览器和依赖放在/tmp，不写入仓库。
- 源文件和提交中已扫描，无凭据类前缀；令牌只用于临时Git认证，不在项目或handoff中保存。
- 当前没有其他agent接手，Agent A的本轮源码改动完成。未来agent先读本文件和DESIGN边界，再改源码，马上执行 `python tools/build.py` 并保存可玩入口/ZIP，测试后阶段提交、push，禁止强推覆盖。
- 本条随v0.3.1代码与可玩产物提交；远端最终发布结果须以git log、远端refs及交付回复为准，不能仅凭本条把本地提交当远端备份。
- 交付前复验：源码已格式化以便后续agent阅读；重新构建后，纯模拟和稳定浏览器回归再次通过。额外强制禁用WebGL，采购、结账、房间操作与拆袋仍可玩，未出现未捕获JS异常。
- ZIP现在也包含 `tests/RESULTS.md`，方便下载包使用者了解原型边界与真实验收范围。
- 仓库地址：https://github.com/deawfwaef2/Game 。空仓库初次浅克隆曾缺少remote.origin.fetch；已配置标准分支追踪。以后若工作区快照不保留.git/config，先恢复不含凭据的origin URL和fetch refspec，再校验远端。所有推送均未使用force。

### 2026-10-17 / Agent A / 用户反馈：必须转向场景内交互
- 用户明确否定现有UI：不喜欢大量面板/列表/点菜单，认为UI不好看。**不是仅换皮，必须把日常操作放回3D世界。**
- 新方向：准星+E拿取/使用、实体手部与物品、开柜门/冰箱门、手持书/日记、在床边调睡眠、少量无背景提示；日常不再弹出管理后台式面板。
- 采购也改为可走动的3D货架，拿商品入篮，到收银台结账；不再默认商品卡片网格。
- 保留必要的主菜单、暂停、存档；旧面板仅允许在WebGL不可用时作为降级，不得成为正常3D游玩的主要操作路径。
- v0.3.1完整备份保存在 `releases/last-known-3d-v0.3.1.html`；新源码每阶段构建和备份，未完成的新入口不替换可玩根文件。
- 当前仍是Agent A单会话，没有与其他agent实时通信。先改日常物理交互，再接3D商店；不覆盖旧交接。

### 2026-10-17 / Agent A / 交互重构 Checkpoint A（尚未最终版）
- 新增 `src/world.js` / `src/world.css`，构建链已接入。正常WebGL模式撤下旧底部菜单/状态大卡；核心需要仍在core模拟中，不是删掉生存机制。
- 房内物品射线、逐袋/Shift连拆、可开合的冰箱与衣柜、抽屉应急包、拿取/归还/表面摆放、手部/手持食物/书/3D纸质手记、床边滚轮调时长、直接生活动作、极简暂停已接通。
- 模拟135断言/365天库存策略复验通过；真实file://WebGL下射线命中袋子、Shift+E拆完、无日常面板、严格存档通过。冰箱门射线/E/动画、Tab实体手记已实测。
- 构建可玩HTML约963KB，ZIP约269KB，v0.3.1完整备份仍保留。**本阶段采购仍是旧页面，正在下一阶段改成实体3D商店；不要声称整体改版完成。**
- QA依赖与浏览器放/tmp，Debian库已临时补齐。仓库远端无他人更新；此环境未发现GitHub认证，后续push结果必须如实记录。

### 2026-10-17 / Agent A / 交互重构 Checkpoint B — 3D供销社已接通
- Checkpoint A本地提交 `1b1322f` 已保存；push明确因HTTPS缺少用户名/写入认证失败，**尚未同步远端**，远端仍为v0.3.1。已告知用户，不重复无凭据推送，不保存或寻找旧泄漏令牌。
- 新增 `src/store.js`；正常入口已切为可走动商店、十类129实体商品、购物篮、按件拿/退、整套配给箱、机械收银台和实物收据。货架固体批次实例化后保留每个instance的独立射线目标。
- 新的file://实测通过：129商品存在/旧网格隐藏；真实准星射线+E拿大米、R退回；Tab拿起3D收据；E基础箱89.39/83件；E收银台付款回房、9袋、现金210.61；Shift+E拆袋；射线拿饼干、空格吃饭且无旧QTE卡；手持读书有页数进度；无未捕获JS错误。截图见未提交的tests/artifacts。
- 生存135断言与365天库存策略仍通过。补给运输中触发结局时不再强行写回playing。
- README已改为新操作。长期浏览器测试文件仍待更新，不能冒称完整0.4存档/手机回归已完成。下一步：物体/手部小修、摆放持久化/无WebGL/手机/导入导出/活动输入回归、最终验收与本地发布包。

### 2026-10-17 / Agent A / 交互重构 Checkpoint C — v0.4.0 本地交付
- Checkpoint B本地提交为 `4f4e6f5`；至本条时远端仍为v0.3.1 `2bd58ac`。当前环境没有GitHub写入认证，先前push失败已明确报告；没有强推、没有保存或寻找旧令牌。后续恢复认证再正常push本地main/tag，不能把本地tag说成远端已发布。
- 正常WebGL玩法不再开日常面板：129商品的可走动供销社/篮子/收据/配给箱/收银；房内射线拿取与平面摆放、逐袋/连续拆袋、冰箱/衣柜/抽屉动画、手部/食物/杯/书、床边小时、实体手记与腕表、场景内洗换/清洁。旧面板仅保留为无WebGL降级和必要帮助。
- 补齐可辨识的剪刀、指甲刀、牙刷、手电、布料和搪瓷杯；修正冰箱门向外打开，库存换格和冷藏换层；不再让旧桌面占位盒遮住真实摆放物。新增坐标/手持UID安全校验，兼容省略新字段的旧v3。
- **模拟最终PASS144**（新增9断言）；365天实际库存策略再通过，健康100、精神64.65、余512份食物，非任意策略必胜保证。
- **新的完整file://浏览器回归最终约86秒exit0**：129商品/E拿R退/预算/收据/结账、单袋及Shift连拆、真实拿放取回、无模态吃饭、接水储水、烹煮、开冰箱冷藏取回、手持书进度、衣柜换衣、洗衣、排泄、淋浴、床边4h、手记/腕表、本地继续/JSON导出导入/摆放持久化/非法坐标拒绝、地下补给现金2h风险与原位置恢复、390×844触控/无横溢、强制无WebGL降级均通过。外部请求0，未捕获JS错误0。
- `tests/live.cjs` 独立真实RAF检查约22秒exit0：W移动z4.55→4.19009、拖动、E配给/收银自动完成、Shift+E拆袋自动完成、日常面板0、JS错误0。此CI检查将像素比设0.6并关阴影，**不是默认画质或全硬件FPS保证**。
- 浏览器测试不再依赖旧按钮。CI功能回归停RAF后使用同一生产射线/输入/worldFrame/模拟；真实RAF另测。整页WebGL截图曾12s超时，不冒称成功；改为直接Canvas读回PNG已成功且context未丢失。JSON的-0序列化变0用规范化比较；FileReader导入必须await暂停消失，不能仅看本来就为playing的phase。
- 手机曾发现新辅助按钮区域遮住旧E按钮，已修复为viewport锚定与透明容器，真实tap回归通过；不要还原旧quickbar的74px相对偏移。
- `Game-playable.zip`现在包含根HTML以及完整src/tools/tests/文档/许可，不含node_modules、浏览器、QA产物或凭据。这样即使远端写权限缺失，用户仍能下载完整开发成果。
- README、DESIGN与RESULTS均已更新新操作/测试方法/边界；程序化动作/代表性包装/原创书籍片段仍是简化表现，不是刚体沙盒/完整人物动画。外出追捕、监狱、任意搬家具未实现。
- 最终根HTML约1.01MB，含源码ZIP约0.57MB；旧v0.3.1完整HTML仍在releases，阶段本地提交可回退。最终本地提交/tag以git log为准，远端发布另需认证后核实。

### 2026-10-17 / 用户纠正 — 必须一次性采购、靠存量生存
- 用户再次否定v0.4的美术与整体质量：认为仍非常低级、劣质。**不得把现有方块/简陋手部/贴字包装当作已解决视觉问题，不再盲目换皮后宣称完成。**下一轮美术重做前先确认参考游戏/截图或明确视觉标杆。
- 硬规则：**只允许开局准备阶段采购一次；确认进入公寓后，整个本局永久禁止购买/补货，只依赖已持有与开局房内固定资源。**此前添加的地下补给是agent自行扩展，现被用户明确否定，必须删除。
- 本次先做规则修正：核心交易/入库函数、3D商店、门口快捷键、无WebGL降级入口和存档恢复都要封锁；不能只藏按钮。新开一局可重新准备，但继续/导入已有局不能重新开放采购。
- 保留原有供水/电力设施与随机故障，不擅自将这条解释成移除自来水。不得凭借用户没要求的补货系统降低存量挑战。
- 本记录追加，不覆盖过去历史；以上用户纠正优先于旧记录中所有“地下补给可用”的描述。

### 2026-10-17 / Agent A / v0.4.1 一次性采购规则修复（美术未完成）
- 核心新增仅内存存在的准备采购会话；只有title新开局可创建。`beginGame`结账一次后立即销毁会话，`putCartIntoState`仅允许初次结账的同步原子过程调用；重复结账、直接入库、伪造shop阶段均不能追加库存。
- 已删除所有运行时地下补给、配送、加价分支；门口Shift+E、旧resupply动作、3D/降级商店、整套物资与购物车API均拦截游戏开始后的购买请求。新开一局是替换旧局，不是给旧局补货。
- 新存档标记tradeLocked=true；旧v3导入/继续时强制锁定交易，不恢复准备会话；写false试图解锁的存档被拒绝。旧局现有物资不删除，不借迁移追加资源。
- 现有实物提示显示本包与该物品总存量；手记补充可用库存理论热量天数和剩余目标天数。开局收银/收据明确只有一次采购；原基础箱改标短期样例（79天热量，不足一年），不能再推荐它作为365天充分准备。
- **最终159模拟断言通过**，365天YEAR_KIT实际库存策略仍获胜，无补货、无重设需求。新回归覆盖重复结账/直接入库/伪造阶段/旧档迁移/非法解锁/库存按实际消耗减少/新局合法一次采购。
- **新完整浏览器回归约50秒exit0**：3D采购后门口/新旧商店入口/直接结账与入库/套装/旧resupply动作全部无法购买，库存/现金/时间原样不变；原拿放吃喝睡读/存档/手机/离线流程仍通过，外部请求0、JS错误0。
- **另测强制无WebGL**：全年单首次结账正常；随后降级旧入口/改购物车/重复结账/直接入库全部拒绝；导入无tradeLocked的旧v3也保持锁定；无JS错误。
- 已构建自包含HTML与含源码ZIP，旧v0.4可玩入口在releases仅作回退。**用户不认可的美术没有被本补丁重做，不能把本次规则修正称作视觉升级。**下一步请用户确认视觉参考，先做小范围可操作样片验质，避免再盲目堆粗糙模型。

### 2026-10-17 / 用户视觉方向确认与写实样片阶段
- 用户在澄清选项中明确选择“你自行按写实旧公寓重做”：真实比例、细节物件、自然光、可信手部与动作，先做一个可操作房间样片，不能继续用方块/贴字凑效果。
- 一次性采购修复已本地提交 `81ac4bc` / tag v0.4.1；本轮push再因HTTPS缺少用户名失败，远端仍v0.3.1；不再无凭据重试。
- 现在只推进写实房间样片（仍需用户验质），不承诺所有129商品和全部生活动画都已换成同等质量。保留完整规则版回退；不动已封锁的采购规则。
- 写实资源只选择可再分发的CC0/MIT资产，下载/工具放tmp，加工后小体积资源离线内嵌；根HTML继续双击可用，整个持久工作区128MB上限不变。

### 2026-10-17 / 写实房间样片 Checkpoint A（待最终回归与验质）
- 已接入CC0真实几何/PBR的旧沙发、床、木桌、柜架、随身听、罐头；MIT WebXR通用人手是可蒙皮骨骼网格，不是方块手。墙/地板/布料有实际漫反射、法线、粗糙贴图。
- `src/realism.js`只叠加场景和视觉动作，不改库存/生存计算；一次采购硬锁仍在core。重做金属水槽和中空杯、布帘、接触阴影与窗光。城市和画框是生成的远景/装饰贴图，房间自身是真正实时3D。
- 实际WebGL Canvas房间/手持杯已出帧，约150calls/7.8万tri，健康库存存档验证正常，未捕获JS错误0；这不是全硬件FPS保证，也不是用户已认可质量。
- 模型手的原始掌面在YZ，不是XY；手指屈曲轴为Z，左右符号相反，整体翻到第一人称再握持。保留这个坐标约定，不能改回先前导致指头穿入杯口的错误姿态。
- 已新增不写正式存档的独立样片入口；样片通过合法开局YEAR清单扣款，并拆好现有袋子，进入后同样不能采购。返回主菜单恢复之前游戏对象；导入正式存档退出样片模式。此隔离仍待专门自动回归。
- glTF图像改成data URI并强制TextureLoader，避免ImageBitmapLoader.fetch(blob)在离线文件/无网络iframe被拦；所有资源内嵌，运行无外部网络依赖。原规则版回退见releases/before-realism-v0.4.1.html。
- 新增vendor addons匹配Three r160.1，只用已有全局THREE，未重复打包引擎。许可与来源见src/assets/manifest.json与WEBXR-HANDS-LICENSE.txt。

### 2026-10-17 / v0.5.0-preview 写实房间样片 Checkpoint B — 可操作交付
- 写实模型阶段已本地提交`b374cae`。当前源码/根HTML/独立样片/离线ZIP均可用，最终提交与tag以git log为准；未再尝试无凭据push，远端仍v0.3.1。
- 最终新模型完整浏览器回归约68秒exit0，涵盖原生活/物资/柜门/存档/390×844触控/无WebGL降级，外部请求0、未捕获JS错误0；159模拟断言与365天封闭库存策略仍通过。
- `tests/realism.cjs`完整通过：真实蒙皮手(25骨骼)、抬杯位移与倾转、双手书籍、样片所有买入口拒绝、库存/现金/时钟不因拒绝交易而变化、真实床面摆放、正式存档不被样片覆盖、回标题恢复原G、读正式档退出样片。
- 同测试让fetch直接失败仍加载成功；又在opaque iframe（allow-scripts、无allow-same-origin、connect-src none、img-src data）里实际自动进入样片且存档格式有效。不是把file://通过当作iframe也通过。
- `tests/live.cjs`实际RAF再通过：W移动约0.38m、拖动、取配给、结账、Shift拆袋均自动完成；无日常面板/JS错误。测试降像素比和关阴影，不冒充默认画质FPS。
- 修正新模型的交互盒被旧“透明材质跳过”规则忽略：代理材质只关颜色/深度写入，作为交互体积；放置R则重新射线真实几何，避免食物悬浮在床上方。单测使用确实在2.4m摆放范围内的床垫面，不把旧模型坐标硬套为新模型表面。
- 实际WebGL房间与手持杯PNG已重新读回/查看，约150calls/77910tri，37textures，context正常；QA产物见tests/artifacts/realism-*-first.png。清理了旧中间截图以保留128MB限额，历史可玩版本仍在releases/git，handoff原记录未删除。
- `写实房间样片.html`为独立自包含入口，会自动进入已完成一次合法YEAR采购的演示，不写正式存档。`index.html`是正常准备采购/存档入口，标题也可进入同一样片。
- ZIP为了避免重复两份约11MB自包含文件，只收index（含样片按钮）与完整源码/加工资源/构建/测试/许可。运行依然不需安装/服务器/联网，构建才需要Python和Node。
- 已给墙色/木料/柜面加入种子墙色与磨损差异；床质量/面积/镜像/冰箱/温度仍用原种子机制。没有为了样片允许补货或重置生存需求。
- README/DESIGN/RESULTS已明确：这是房间视觉方向样片，**用户尚未认可最终质量**；商店、部分包装、部分家务动作、全身人物/完整刚体/外出追捕仍未同等完成，后续不能再把所有UI/美术称为已解决。
- 本条前持久常规文件约96MB，预计最终Git新增后约124MB；最终以du输出确认小于128MB。已很接近上限！下次编程先清理QA产物/缓存或在tmp安全整理Git对象，不能直接再增加多份大ZIP/HTML历史而超过限额。

### 2026-10-17 / 用户反馈与本轮方向：窗外、老式相机、街景式便捷移动
- 用户认为窗外仍粗糙，要求画风更老式、有老式相机感觉；新增可切换模式：保留自由第一人称，另提供类似街景的定点/路线移动，屏幕四边箭头点一下自动走到对应位置，优先手机方便操作。不是要接入真实地图服务。
- 用户要求同步仓库；本轮仅用临时进程认证，已将此前未同步的main补推到`828330c`，并发布本地已有v0.4.0/v0.4.1/v0.5.0-preview标签，远端读回一致。凭据不写文件、配置、交接或输出；已提醒撤销对话中暴露的密钥。
- 修改前已读完整handoff、核对工作树干净、fetch远端。先在tmp安全压缩Git对象并完整fsck，未删除提交/标签/历史，解除工作区接近128MB上限的问题；不可用强推或删旧handoff解决空间。
- 本轮新便捷移动只负责沿无碰撞路线走路/转向，不自动购买/吃东西/开门、不新增补给、不跳过生存时间。暂停/切换模式/存读档/新局要安全停步，仍保留离线单HTML与原物资规则。
- 补记空间整理：/tmp是约1GB的tmpfs，首次Git重打包因/tmp满失败，原仓库从未替换且fsck正常；清理本agent的临时npm缓存/失败拷贝后，改在同盘/var/tmp完成压缩并用renameat2原子交换对象目录，完整fsck通过，没有丢历史，也没有让工作区临时突破128MB。

### 2026-10-17 / 街景移动与胶片窗外 Checkpoint A
- 新增`navigation.js/css`：自由第一人称和定点移动随时切换，手机默认定点，桌面默认自由，设置独立保存。四边箭头按当前视向显示可达站点，点后按正常步速自动走路，到达转向物件；可停步，不瞬移、不自动使用/购买。
- 使用与自由行走相同的canMove障碍，加0.18m栅格A*与视线简化，避免穿过家具/隔墙。暂停、切模式、读档、回标题、动作/新敲门会安全停止；已在警报下主动选择的新路线仍允许，避免困在远处无法去处理需求。
- 新增`city-film.js/css`：窗外六栋分层3D楼体、窗框/台檐、25阳台/屋顶天线，远处才使用更换后的天际线；近景有位移视差。旧窗格贴图归一化对齐真实框/台，低模批次实例化；背景相机far从70扩大到240，避免远景132m被裁掉。
- 默认轻微褪色/暖调/细颗粒/暗角，不加模糊降清晰度；暂停有“胶片画面”开关，减少动态偏好会停止颗粒动画。UI文字不套canvas滤镜，保留清晰可读。
- 第一轮新完整浏览器回归通过（并行测试约122s），外部请求0、JS错误0。新导航测试通过：手机箭头真实tap、自由切换不挪位置、到点物件射线、暂停/读档停止、真实RAF行走消耗正常游戏时间，24种子/9种尺寸/正反布局257条站点路线全部可达且安全。
- 本条又补充全年配给单站点，方便手机只靠箭头+E完成正确的一次性开局规划；短期样例仍不足一年，不能当作充分物资。
- 拍摄QA改用低分辨率CDP compositor readback，已成功检查包含实际胶片CSS和导航按钮的完整页面；Canvas单独读回必须render与toDataURL在同一evaluate中，跨task读回会黑，并非游戏黑屏。旧原型大页面截图超时不代表新方法失败。
- 为严格保持128MB上限，新`tools/safe_checkpoint.py`在/var/tmp复制完整Git元数据，提交/压缩/fsck后原子交换，避免新大HTML/ZIP的松散对象瞬间把工作区撑爆；保留全部refs/标签/历史，不保存认证。
- 新增全年单站点后，真实手机“走到全年单→E登记→走收银→E付款”发现采样式路线简化会漏掉极小擦角，导致安全停步；未放宽碰撞，而改为线段与0.19m扩张AABB的解析相交检测。最新导航回归约42s再次全通过：14商店站点可达，整条采购链路改用真实tap，257户型站点路线安全，外部请求/JS错误均0。

### 2026-10-17 / v0.6.0-preview 最终验收与发布准备
- 新模式阶段提交`56971a1`已push到main并远端读回一致，本轮不再是“缺权限未同步”；最终提交/tag另见git log和远端refs。认证始终仅临时进程，仓库无凭据。
- 最终代码再跑：159模拟断言/365天有限库存策略通过；原完整browser生活/存档/手机/降级回归通过（与另一GPU测试并行约146s）；realism封闭库存/骨骼手/样片隔离/禁止fetch/opaque无联网iframe通过（并行约115s）。时长是软件GPU测试负载，不是FPS保证。
- 最新navigation回归约56s exit0：14商店站点、手机真实tap全年单→收银链路、所有公寓生活站点、物件到达朝向、自由模式恢复运动、切换不挪位置、手机交互按钮未被覆盖、暂停/读档停步、模式和胶片偏好刷新后保留、继续存档不自行走旧路线、真实RAF行走推进原时钟、敲门安全停步/主动后续路线均通过。
- 24种子、9种尺寸、正反户型257条站点路线全部可达，路径点使用原canMove安全。解析AABB简化避免商店极小擦角；没有放宽碰撞或瞬移脱困。
- 独立样片现在默认展示定点移动（不强制写正式偏好）；主入口桌面默认自由、手机默认定点，右上按钮/V随时切。样片仍不覆盖正式存档；常规游戏开始后始终不可补货。
- 最终外景改为普通低面盒体实例而非每根窗框圆角细分，近窗检查约64calls/11.8万tri，代替早期不必要的82万tri；保留6栋/默认种子1341窗格/25阳台与实际远近位移。这个数字依镜头/种子变化，不保证所有设备默认帧率。
- README/DESIGN/RESULTS/暂停帮助均已更新两模式、V、途中停、胶片开关、外景范围和局限；没有称全城可探索、每扇窗有室内、全量美术已完成。完整页面CDP截图在tests/artifacts仅作QA，不随离线ZIP发。
- /tmp是小tmpfs，浏览器cache已移到/var/tmp并在旧/tmp路径用符号链接兼容测试；开发依赖/浏览器不在持久工作区。下次做大版本仍先检查128MB，Git检查点用同盘/var/tmp打包+原子交换，避免松散大二进制瞬时超限。
- 安全注意：Git的GIT_CURL_VERBOSE即使值为0也会开启详细日志；后续认证进程应删除该变量而不是赋0。该次输出中的Authorization已经被Git脱敏，没有密钥写进文件/提交；最终同步只打印返回码和refs。

### 2026-10-17 / v0.7.0-preview 写实室内 + 手动拆袋摆放
- 用户否定v0.6：冰箱朝向错误、整体仍低级、要求最大化拟真、**不要自动放置**。本轮按此改。
- 新模块`src/interior.js`（模板标记INTERIOR，在CITY_FILM之后）：包装roomDecorate/worldProduct/syncWorldRoom/roomLight/worldFrame。资源加载可能早于此脚本解析，所以末尾若`R.ready`立即`interiorApply()`。
- RoundedBoxGeometry的parameters是1×1×1，interiorApply先按包围盒改写parameters再识别旧部件。
- 交互：`worldTakeFromBag`（E开袋、E取一组、手满拒绝）、`worldPutBack`只放到瞄准的稳定平面；`worldPutBack(false)`不再“放回原处”。测试改用`qaDrop()`清手。
- 样片入口改为`index.html#sample`（或iframe里`window.CLOSED365_SAMPLE=true`）；不再生成`写实房间样片.html`；ZIP改到`dist/`（gitignore）并作为Release附件。
- 视觉QA：`tools/qa-views.cjs [seed] [filter]`；`tools/qa-hud.cjs`抓带HUD的CDP截图。**注意：读取刚生成的图片必须等生成命令结束后再读，不要并行。**
- 新资源：Poly Haven CC0 模型（电炉、搪瓷锅、吊灯、挂钟、扫帚、簸箕）与贴图（地砖、长墙砖、油毡）；墙纸/地毯/胡桃木贴皮为本项目生成贴图，manifest已登记。

### 2026-10-17 / v0.8.0-preview 真实光照 + 建筑细节
- 用户要求“继续大师级，真实系”。本轮新增两个模块：`src/fixtures.js`（模板标记 FIXTURES，在 INTERIOR 之后）和 `src/lighting.js`（标记 LIGHTING，最后）。均包装 roomDecorate/roomLight，并在 `R.ready` 时自应用。
- **重要发现**：three r160 没有 `scene.environmentIntensity`（r163 才有），旧代码设置它无效，PMREM 环境一直满强度。`lightingApplyEnv` 每约 0.9 秒按材质缩放 `envMapIntensity`（基准存在 `material.userData.envBase`；金属缩得少；商店保持 1）。新增材质会在下一次遍历时被处理。
- 窗户面光源 `RectAreaLight` 放在 scene 里（不在 roomRoot 下），因为镜像房 scale.x=-1 会翻转单面面光源；roomRoot 更换时重新定位。旧的 windowBounce 点光源移到房间内 1.5 米、高 2.35 米做天花板反射，否则会在玻璃里出现高光点。
- GTAO：`ROOM_TOOLS` 现在包含 EffectComposer/RenderPass/GTAOPass/OutputPass/RectAreaLightUniformsLib（`tools/bundle-vendor.cjs` 从 /var/tmp/closed365-qa 打包，addon 源码在 `src/vendor/addons/`）。`renderer.render` 被包装，只有主场景+主相机且渲染到屏幕时走 composer。`gtao.overrideVisibility` 被替换：Points/Line/Sprite、`userData.noAO`、不可见/透明（opacity<0.7 或 depthWrite=false）/colorWrite=false 的网格不进 AO 的法线深度缓冲。新加的深窄缝隙（外层窗扇、窗洞）标记 noAO，避免颗粒。
- 默认值：localStorage `closed365-ao` = on/off；未设置时桌面开、触屏或软件渲染（SwiftShader/llvmpipe）关。所以无头测试默认 AO 关；视觉 QA 用 `QA_AO=on`。
- fixtures 识别旧部件：`fxHide` 按网格真实尺寸+位置隐藏旧窗框条/窗台；暖气按“含≥8个 CapsuleGeometry 的 Group”隐藏；水槽下的整块柜体按射线命中后拆成带空腔的 5 个盒子。浴盆、门扇往 `colliders` 推了世界坐标 AABB；导航 257 路线复测通过。
- 洗衣盆（laundry）的位置被移进浴盆里（y=0.16）；shower 交互组保留，旧子网格隐藏，浴盆挂在它下面，所以 E 洗澡/洗衣的交互不变。
- 未做：袋子网格合并（性能），马桶盖造型仍是 v0.7 的简单圆片。

### 2026-10-18 / v0.9.0-preview 时间与天气 + 马桶
- **用户最新指示：“家里蹲，不要出门，继续完成我的目的”。** 游戏方向是全程待在屋里；外出/追捕/监狱不是待办，不要再列为“未实现的计划”，也不要加入任何外出玩法。
- v0.8 已推送并发布（main 9f8320e，tag v0.8.0-preview，Release 415915240 带 Game-playable.zip）。
- `lighting.js` 新增 `lightingSky()`：日出6.4/日落18.6，按钟点算太阳高度/方位（roomRoot 局部空间，窗在 -z），平滑的 light 系数驱动面光源、太阳、窗外远景、背景和雾的颜色。天气用 `fxRand(seed+"-sky-"+day)`：<0.32 阴天，<0.5 薄雾；第1天强制晴。realism 原来的二元昼夜（hour<6||>18）仍控制吊灯/台灯；夜里不覆盖太阳强度。syncRoom 每10游戏分钟调用一次 roomLight，所以太阳随之移动。
- `fixtures.js` 新增 `fxToilet`（隐藏 toilet 组里除交互代理外的旧网格，用 fxLoft/fxEllipse 重建），以及 `fxEllipse`/`fxShift` 两个辅助函数。
- QA 环境（/var/tmp）会被清空：重装命令 `cd /var/tmp/closed365-qa && npm i playwright esbuild three@0.160.1`，`PLAYWRIGHT_BROWSERS_PATH=/var/tmp/closed365-browsers npx playwright install --only-shell chromium`，`sudo -n node node_modules/playwright/cli.js install-deps chromium`。
- safe_checkpoint 会把整个 /home/user 算进 127MB 限额（包括 .npm 和 dist），提交前先删 /home/user/.npm 和 dist。`.gitattributes` 已对 src/vendor 和 index.html 关闭空白检查。

### 2026-10-18 / v0.10.0-preview 家信、广播、窗台菜园；删除虫鼠及替代物
- **用户最新指示：不要虫子老鼠，连方块/小汽车/小直升机/足球这类替代物也不要，不要让玩家恶心；想办法让游戏有趣，让人愿意玩完365天。** 这条取代了 HANDOFF 第22行的旧约束：干扰物系统已经整体删除（core 里的 hidden/found/pestTraces、inspect、clearPest，data 里的 carpowder/swatter/balltrap，scene 的 pestRoot，ui/world 的入口和文案）。以后不要以任何形式加回来。旧存档里的这些字段由 lifeEnsure 删除；validateSave 不再要求它们存在。
- 新文件（build.py 列表和 template 里的标记都在 LIGHTING 之后）：
  - `src/life-text.js`：信件、新闻、广播剧文本。
  - `src/life.js`：核心逻辑，能在 node 里跑，simulation 会加载它。包装了 validateSave、freshState、loadState、hourlyUpdate、dailyUpdate、randomEvent、doLeisure。lifeWeather 与 lighting.js 的天空随机数完全一致。
  - `src/life-world.js`：3D 部分。包装了 syncWorldRoom、syncRoom、worldTargetInfo、worldInteract、worldUpdatePaper、worldProduct。花盆在窗台板上（y 1.012，z 为 back+0.125，x 为 0.62/0.86/1.10）。信捆放在 "inspect" 床头柜顶上（用包围盒算位置）。字幕元素是 #lifeCaption。
- 状态保存在 G.life = {letters, early, news, serial, serialDay, heardAlert, garden[3], harvests}。收获时会生成一个物资批次并直接放进手里（worldEquip），遵守“不自动摆放”的规则。产物 greens/sprouts/cherrytom 只写进 DB，不进 CATALOG，所以商店不卖。
- 测试：新增 tests/life.cjs；商品数改为130；入门套餐价85.74；全年套餐剩余现金214.26；样片未拆件数104。
- 后续可做：手记里加一页“这一年”的进度；拼图/棋盘进度做成桌上看得见的变化；季节温度曲线；可以在家里做的手工。

### 2026-10-18 / v0.11.0-preview 每局不同 + 不腻 + 值得再玩
- 用户要求：内容更丰富、更多，不让玩家腻，并且有重复可玩性。
- 新文件 `src/life-more.js`（加载顺序在 life.js 之后、life-world.js 之前；simulation 也会加载它）：
  - 帮派、城区、新闻顺序、结局走向都由种子生成（lmSetup 会就地改写 LIFE_NEWS / LIFE_SERIAL / LIFE_SERIAL_META 这几个数组）。
  - LM_CHAINS：6条邻居故事线，每局抽3条。LM_EVENTS：32种小事件，40天内不重复。
  - 项目：origami 走 doLeisure；notebook 写回忆录；puzzle 记片数。
  - LM_GOALS：每局抽5个小目标。LM_ENDINGS：7种结局。跨局记录存在 localStorage 的 closed365-records-v1。
  - 包装了 lifeEnsure、randomEvent、dailyUpdate、doAction（统计伸展次数）、doLeisure、endGame。
- life-world.js 新增：
  - 纸鹤：InstancedMesh，每串30只，最多32串，挂在窗口两侧，深度分两排。
  - 日历（"journal"）按 E 打开 glance "year" 页（lwYearPage）。
  - showEnd 包装：在结局页插入 .life-ending 结局块。
- 新商品 origami（共131件）。life-text 中 LIFE_SERIAL_A 是《雾港旅馆》原文，LIFE_SERIAL 是本局播放顺序。

### 2026-10-18 / v0.12.0-preview 日常真实感
- 用户要求（重复并补充）：内容更丰富、不腻、能重复玩；要真实，不要有违和感；玩家只能待在家里。
- 新文件 `src/life-real.js`，最后加载，simulation 也会加载它：
  - LR_TRAITS：10种性格，每局抽两种，存在 G.life.traits。
  - LR_FAULTS：drip / cistern / draft / radiator / lock，存在 G.life.faults。temperature 已包装，会扣掉漏风和暖气不热的温度。
  - doAction 处理 repair（先修故障）、seal（用 ducttape）、bleed（用 radkey）。world.js 的手持动作表里已加入 ducttape 和 radkey。
  - consumeMeal 加配菜：做法是临时改写 DB 里该主食的 flavor/name/joy，再调用原函数，finally 中复原。做过的菜存在 G.life.dishes。
  - lrWatch：窗户 Shift+E 看窗外。worldTargetInfo 会在对应物体的提示里附上故障说明。
- core 里遗留的“几何污染”文案改成了“包装破损受潮”。注意：新商品 id 不能用 tape，已经被音乐磁带占用了。
- 工作区容量：.git 每提交一次增加约3.5MB（index.html 的增量）。推送后在本地把仓库重新收缩成浅克隆（见下一条）。
- （v0.12 发布后补记）本地已重新收缩成浅克隆：`git fetch --depth 1 origin main`，删掉本地标签，`git reflog expire --expire=now --all && git gc --prune=now`。.git 从48MB降到21MB，工作区约54MB。远端的完整历史和全部标签都还在。以后每次推送完都可以照做一遍。

### 2026-10-18 / v0.13.0-preview 身体反馈
- 用户要求：饿了、渴了最好是状态真的到了才有提示，并且要有画面效果；不要让游戏变得复杂繁琐；继续丰富内容、提高重复可玩性、保持真实、只能待在家里。
- 新文件 `src/life-body.js`，最后加载，只在浏览器里运行：
  - 每120ms执行一次 lbTick：在 renderer.domElement 上加 CSS 滤镜，叠加 #bodyFx 渐变层和 #bodyLids 眼皮，显示 #bodyLine 心里话。
  - lbTargets() 返回各项强度（0到1）。LB_LINES / LB_HIGH 是各状态的阈值和对应的话。
  - worldRenderHUD 已包装：#worldCondition 只显示敲门、停电、停水。
  - 截图时 toDataURL 拿不到 CSS 效果，所以 qa-views 不受影响；要看效果用 tools/qa-body.cjs。
- life-real.js 新增 LR_DAYS（固定日子的事件）和第一场雪（G.life.snow）。

### 2026-10-18 / v0.14.0-preview 身体动作和天气
- 用户再次强调同样的要求，并补充说明：128MB的限制指的是Arena工作区，GitHub上的文件大小无所谓（推送后仍然把本地仓库重新浅克隆，让工作区保持在50多MB）。
- life-real.js：
  - lrOutdoor(d)：室外温度。
  - lrPrecip(minute)：返回 "rain"、"snow" 或 null，只在 lifeWeather 判定为阴天的日子里出现，按种子决定。
  - 今年第一场雪改到 hourlyUpdate 里，在开始下雪的时候记一笔。
  - 生日存在 G.life.birthday，由种子决定。
  - 在窗边看街时，下雨或下雪会用对应的画面。
- life-body.js：
  - LB_RELIEF：状态恢复时说的话，带滞后，并有一道暖光（第5层 i.g）。
  - LB_THOUGHTS：闲下来时偶尔冒出的念头，用过的记在 G.life.thoughts。
  - lbMotion：通过 canvas 的 CSS transform 做发抖和摇晃。
  - lbGrowl / lbHeartbeat / lbRainSound：只在 soundOn 打开时发声。
  - lbPrecipMesh：在 GPU 上画雨丝（LineSegments）和雪花（叠加混合的 Points），挂在 roomRoot 下，位置 (0,1.72,back)。
  - lbWetGlass：外层玻璃上的水珠，位置 z=back-0.235。
  - lbSnowCover：外窗框底部的积雪，位置 z=back-0.25，y 约1.07。
  - 这些都从包装过的 worldFrame 里驱动。
- 查看天气效果用 tools/qa-weather.cjs [rain|snow]。

### 2026-10-18 / v0.15.0-preview 时间和天气合理性、前租客、梦、冰花
- 新文件 `src/life-home.js`，加载顺序在 life-real 之后、life-body 之前；simulation 也会加载它。
  - lhOk(text)：用 LH_EXACT（先判断）和 LH_RULES（正则加条件）检查当前钟点、季节、天气是否允许这句话出现。lmPoolEvent 和 lmChainStep 都已重写为先过 lhOk；邻居故事的某一步时机不对时会等待，不会跳过。
  - 新增文本时，如果写了钟点或天气，要在 LH_RULES 里加对应规则；simulation 会检查每一句一年里至少有一个可以发生的时刻。
  - 固定日子和生日改在 hourlyUpdate 里按 LH_DAY_HOUR 指定的钟点触发；life-real 的 dailyUpdate 不再记录它们。
  - LH_TENANTS：4种前租客，每种6处痕迹。G.life.tenant 和 G.life.tenantBits 记录进度；第 i 处要到第 5+40i 天之后才可能出现，两处之间至少隔18天。触发途径：doAction 的 clean/laundry/dishes、lrFix、lrWatch。
  - LH_DREAMS：做过的梦记在 G.life.dreams，睡满240分钟以上有40%概率做梦。
  - LH.say：要轻声显示的一句话，由 life-body 的 lbCheckLines 优先显示。
- core.js randomEvent：冷暖天气按季节决定，冬天不再出现“热浪”。
- life-body.js：lbFrostGlass/lbFrost 在外层玻璃内侧（z=back-0.198）画冰花。
- tools/qa-weather.cjs 的参数可以是 rain、snow 或 frost。
- /var/tmp 被清空过一次，已按记录重新安装 QA 环境（npm、chromium 和 install-deps）。

### 2026-10-18 / v0.16.0-preview 声音、大字、动作反馈、物品用途、供销社重做
- 声音素材在 src/audio/*.mp3（72个，单声道，共约3.6MB）。
  - 用 tools/encode-audio.py 从 /var/tmp/snd 里的 CC0 原始素材包重新生成，来源见 src/audio/CREDITS.md。
  - build.py 会把它们编码成 base64，写成 `const AUDIO_DATA`。
  - HTML 的体积上限已提高到 32MB，当前约 22.4MB。
- src/audio.js（最后加载），主要内容：
  - AU 对象；auPlay 播放一次性音效；auLoop 播放可调音量的循环音。
  - 配乐由 auMusicTick 控制：标题页、供销社、房间各有一组曲子，曲子之间安静90–240秒。
  - auRadio 播放收音机音乐。
  - AU_ACTIONS 把动作的 label/kind 对应到开始、循环、节奏和结束时的声音，通过包装 worldStart 和 worldFinishAction 实现。
  - 原来的 worldSfx 蜂鸣改为按频率对应到真实录音。
  - 包装 logEvent，让敲门和打雷发出声音。
  - 在 worldFrame 里处理脚步声和屋里的环境音（钟声、街道、雨），lbRainSound 改为空函数。
  - auFeedback：在 worldFinishAction 前后比较各项状态，显示结果提示（#auChips）。
  - 设置存在 localStorage 的 closed365-audio-v1 里；暂停菜单里的音量滑条用 MutationObserver 插进去。
- src/life-items.js（life-home 之后加载，simulation 也加载它）：
  - ITEM_USE 是133件商品的用途说明；itemFacts、itemUse 生成显示用的文字。
  - 通过包装 simulate、doAction、consumeMeal、actDrink、takeMedicine、doRead，给原来只是摆设的物品加上真实效果。
  - **改动任何效果时，要同时改 ITEM_USE 里对应的说明。**
- src/store-real.js（audio 之前加载）：
  - 包装 worldBuildStore：先把商品放进 SR.pending，等合批（worldBatchShop）结束后，再用 srModel 生成精细模型。必须这样做，因为 RoundedBox 不能参与合批。
  - 小件商品用 InstancedMesh 并排摆2–3件。
  - srTags 生成价签，srLight 调灯光（envMapIntensity 改为原来的三成，曝光0.9）。
  - #shopCard 是商品卡片。
  - SR_EFFECT 给房间里对准家具时的提示加一行效果说明。
- CSS：所有 px 字号按对照表放大（5–8→13，9→14，10→15，11→16，12→17，13→18，14→19，15–16→20，17–28 各加4）。world.css 末尾加了一层提高可读性的样式。#worldSubtitle 挪到了上方。
- tools/qa-ui.cjs 已修好：货架和过道的镜头位置改对了；进入房间前先 reload 并等待袋子出现。新增 tools/qa-feedback.cjs。

# v0.17.0-preview — 两万种商品，每局到货 1%（2026-10-18）
- 新增 src/catalog-gen.js：在构建时拼接到 data.js 后面（DATA 标记）。simulation 也加载它。
  - 用固定种子生成约 2 万种商品，生成的商品带 gen:true、line（产品线）、trait（特色）、maker（厂名，印在标签上）、look（借用哪件原版商品的外形）。功能性的变体还带 base（对应的原版 id）。
  - shopStock(seed)：每个分类先放入 STARTER 和 YEAR_KIT 用到的商品，再按种子随机补到 20 种，共 200 种。种子用 currentSeed。
  - cgUse(it) 生成用途说明。itemUse 的顺序是 ITEM_USE → desc → cgUse。
- core.js 的 has、amount、use 改为用 isItem 匹配（b.id===id 或 DB[b.id].base===id）。use() 会把实际用掉的 id 记进 USED_LOG。
- 新增 src/life-catalog.js（life-items 之后加载）：
  - 食物的 health、thirst、warmth、energy 生效。
  - lcSeason：煮饭时轮流使用调味料。
  - 消耗品用掉时，bonus 生效一次；耐用工具取同类里最好的一件（lcBest）。
  - 每小时的舒适度有上限 0.24。
  - 暖水瓶：停电时每天可以冲一次热饮。
  - doCare：自我照顾用品，有每日次数限制。
  - 包装 worldUseHeld（kind care 和 seasoning）和 worldProduct（look 在 I_SPEC 里没有外形时，借用原版外形）。
- 其他文件的改动：
  - world.js：手持物品的动作表加上 acts[it.base] 回退。
  - interior.js：iProduct 的外形回退到 I_SPEC[look]；标签上的厂名改用 it.maker。
  - store.js 和 ui.js：货架和旧版商店列表都改为 shopStock()。左墙挂了一块到货牌（x −6.9）。
- 有专门代码路径的商品没有做变体：origami、pots、种子、ducttape、radkey、radio、puzzle、notebook、tape。
- tools/qa-catalog.cjs：截罐头货架、消遣货架和到货牌。

## v0.18.0-preview（2026-10-18）：不同质化、修简陋、更真实
- catalog-gen.js：
  - 新增表：CG_NOTE（产品线|特色标记|描述）、CG_FX_TEXT、CG_BRAND_STYLE、CG_MAKE、CG_BOOK_FX，以及 book 用的 CG_PACK。
  - cgFinish 给每件商品写 note/fx/pass/lineBonus/lineText/brandNote/shape。cgParts 返回 {note, fx, use, brand, prov}。
  - 新增植物组和单一规格标记 o；口琴、笛子的活动是 play。目录 19,788 种。
- life-catalog.js 末尾的 v0.18 区块：
  - 食物特色：lcFoodFx / lcCure / lcSide。
  - 被动物品：lcPassive，按每个 base/line 取最优；舒适上限 0.18/h。
  - 包装了这些函数：consumeMeal、lcSeason、actDrink、addDisease（维C）、simulate（耐饥、睡眠、舒适）、doRead（按体裁）、doLeisure（needRadio、噪音、手工成品 G.life.made 等）。
  - 灰尘、加分等结果都限制在 0–100。
- store-real.js：srUseRows 逐行显示描述、特色、用途、厂牌、产地。
- interior.js：
  - 外形取 I_SPEC[id]，其次 it.shape，再次书的形状，最后 I_SPEC[look]。
  - book 外形：书页块、书脊、硬封皮，iBookCover 用 canvas 画封面；iBookSize 按开本定尺寸。
  - 注意：已有一个 iShade(opacity)，书用的新函数叫 iBookShade。
- life-catalog.js 的 worldProduct 包装：有 shape 的生成品不再改走 look，否则会变回原版罐头模型。
- world.js：书桌上的书按真实厚度分 5 摞叠放；有真书时隐藏占位道具“床边读物”。scene.js 把占位书放低到桌面上。
- 测试：
  - simulation 新增 v0.18 断言：解暑、姜茶治感冒、配菜、回忆只触发一次、耐饥、咖啡和小米粥对睡眠的影响、维C、吊兰、磁带需要收音机、口琴的噪音、织围巾、侦探小说、传记、菜谱、厂牌差价、存档校验。
  - tools/qa-catalog.cjs 新增 9-catalog-card（加参数 nosign 可跳过到货牌）。tools/qa-views.cjs 新增 29-desk-books。


## v0.19.0-preview — 章节模式：没有第几天（2026-10-18）
- 读取并沿用原有 HANDOFF；本次只追加本节。经典365天模式保留，新增章节簿入口；第一章开放，逐关解锁。`README.md`、`DESIGN.md` 与 `tests/RESULTS.md` 已更新。
- 新增 `src/levels.js`，在模板最后加载；`tools/build.py` 已接入 `/* LEVELS */` 与语法检查。`src/template.html` 新增章节CTA；原 `#newGameButton` 变为经典模式入口。`src/data.js` 版本0.19.0-preview。
- 六章基础天数60/90/120/180/365/1000，关卡内日期/钟点/HUD剩余天数/手记时间戳隐藏。机关奖励与惩罚保存在 `G.level`；正确或错误不会立即提示，结局页揭晓总天数、触发数和星级。
- 机关均为固定房间设施、不可购买：23:00–01:00电铃；随机墙内敲击后20分钟回敲；20:30–22:00收听夜间短波；雨天18:00–20:00用打火机烧账本页；11:50–12:10拉落地钟，机芯每周需要上弦；千日章组合前述机关。屋内封窗章节会遮光。
- 章节店不是按种子抽1%：完整目录订货簿可搜索当前已开放商品。初始开放全部原版目录 + 章节钟表 + 约1/6生成产品线，每章通关开放下一批，最后全开。实体货架仍只摆样品，目录内商品都可下单；每章预算不同且仍只采购一次。
- 新增章节专用计时商品：机械腕表/闹钟/挂钟、需电池石英表/日期钟、停电归零的插电钟、撕页日历、半小时沙漏。手动上弦/换电池/撕页；故障或漂移会造成不准读数。时钟按T查看，只有物品拆包可用时才能读。
- 屋内场景依章节种子变化，新增墙面按钮、补墙板、账本、落地钟/天线等3D物件；level2/6封窗的窗光在灯光层一起衰减。新增订单簿overlay与无WebGL的章节物件降级操作。
- 已新增 `tests/levels.cjs`、`tests/levels-browser.cjs`。最近结果：levels 56断言通过；simulation 162断言与365天策略通过；browser/realism/navigation/audio/levels-browser均通过，外部请求0、JS错误0。截图人工查看路径 `tests/artifacts/levels/{01-title,02-chapter-book,03-order-book,04-hidden-clock-room}.jpg`。
- `dist/`由构建生成，但不得留在Arena工作区快照；最终应删除dist和临时截图后核查总量≤128MB。根 `index.html` 必须保持最新可双击离线版本。
- GitHub安全：用户在本轮对话再次粘贴了PAT。它未被写入任何文件、配置、命令历史或提交；**本轮未对GitHub推送**。交付时提醒用户立即撤销已贴出的PAT，如需发布请用新凭据/安全连接方式。


## v0.19.1-preview — 修复空货架、重做订货簿、需求条回左上角（2026-10-18）
- 用户反馈章节商店没有物品、UI不好看，并要求加入图片与更真实的呈现；需求条应继续显示且放在左上角。
- 根因：`SHOP_CATS` 实际为分类字符串数组，旧代码 `for (const [category] of SHOP_CATS)` 每次只取首字符，导致关卡实体货架过滤不到任何产品。已改成直接遍历分类ID。第一关现在实体摆出**200个样品，十个分类各有货**；浏览器确认 `lvPhysicalCatalog().length === W.shopProducts.length === 200`。
- 章节供销社右上角新增「浏览全部商品」快捷入口，打开全国订货簿；开局第一章显示3,066件已开放商品，可搜索、加入采购篮并结账。
- 订货簿重做为旧纸目录风格，加入本地嵌入的1986供销社生成图片和较清楚的商品卡；不调用外部图片/CDN。`src/assets/manifest.json`已登记该项目生成图。
- 正常游戏HUD新增左上角生活状态卡：饱腹、饮水、体力、精神、清洁、健康六条动态需求条，并显示膀胱、肠道和房间整洁；购物时隐藏，关卡内仍不出现日期/钟点/剩余天数。
- 版本号升级为`0.19.1-preview`。`node tests/levels.cjs` 60断言通过；经典模拟162断言和365天策略通过；levels-browser、browser、realism、navigation、audio全通过，外部请求0、JS错误0；音频72/72解码。
- QA截图：`tests/artifacts/levels/05-shop-shelves.jpg`、`03-order-book.jpg`、`04-hidden-clock-room.jpg`。Screenshot overlay可用`QA_SCREENSHOTS=1`；为避开软件GPU截图超时，仅在截图时临时关闭backdrop blur。
- 本地保持完全离线；本轮没有推送GitHub或发布ZIP。用户本轮再次粘贴了PAT，未使用、未保存到任何文件/配置/提交；交付时提醒用户立即撤销。

## v0.20.0-preview — 章节难度、味觉疲劳与模糊标期（2026-10-18）
- 在沿用既有六章/固定机关/隐藏时间规则的基础上，章节簿加入「宽裕、标准、拮据」三档。预算倍率依次为1.20、1.00、0.82；各章卡片显示本档预算。难度也调整机关时间窗（1.45、1.00、0.60）、误触代价（0.72、1.00、1.50）和味觉疲劳积累（0.72、1.00、1.30）。经典365天预算与原有短期重复口味惩罚未变。
- `G.level` 新增经过验证且存档兼容的 `difficulty` / `taste` 字段。章节吃喝时按风味、商品特征、口感词条和厂牌累积暴露；相似商品共享相同词条；30个游戏日半衰期缓慢消退；精神减少仍走既有零值失败条件。烹饪自动消耗的配料/配菜也参与疲劳。
- `catalog-gen.js` 在已有生成目录末尾追加12条专门食品/饮品/调味线，不扰动既有种子产品线分配：酸梅汤粉、焙大麦茶、姜枣茶、现磨豆浆、芝麻汤圆、风干鱿鱼、干香菇、油豆皮、海苔脆片、老姜糖、玫瑰红腐乳、脆口酸萝卜；都使用现有实际游戏效果接口，目录现为19,800件，第一章开放3,068件。
- 每件易腐商品现在有清晰、模糊或无日期标记。商品详情/目录/货架提示/库存卡不会再泄露模糊或无标期物品的精确天数；`b.age`、冰箱、供电和 `isSpoiled()` 仍按内部准确保质期运行，变质时明确显示已不能食用。
- `scene.js` 本来就会在未暂停、未忙碌的活跃游戏中自然推进空闲时间；没有改动时间系统，也没有加入离线耗时。导航回归仍报告 `liveClock:true`。
- 验证：`node tests/levels.cjs` 89断言通过；`node tests/simulation.cjs` 162断言通过，经典全年策略仍在第366日胜利。`tests/levels-browser.cjs`、`tests/browser.cjs`、`tests/realism.cjs`、`tests/navigation.cjs`、`tests/audio.cjs` 全通过：文件离线网络请求0、JS错误0；导航覆盖257种种子；72/72音频可解码。软件GPU截图临时人工检查了新的章节难度选择器，截图/测试产物已清理。
- `python3 tools/build.py` 生成最新单文件 `index.html`（22,855,124字节）与临时`dist/Game-playable.zip`；QA后删除`dist/`和截图，保持根`index.html`为最新离线可玩版。构建前后源码通过语法与diff whitespace检查；工作区约71MB。
- GitHub安全：不使用、不保存、不回显用户此前粘贴的PAT；应立即撤销该token。GitHub connector不可用，本版尚未推送或发布。若要尝试推送，必须使用不带该PAT的安全认证路径。

## v0.21.0-preview — 商品模型、标期信息与垃圾循环（2026-10-18）
- `src/catalog-gen.js` 给12条自定义食品/饮品/调味线补上专属包装规格；`src/interior.js` 为生成商品按产品线/厂牌/规格做确定性尺寸、封口、纸盒/袋装/玻璃罐/易拉罐/瓶盖变化，易拉罐有卷封与拉环；袋装鲜食展示内容轮廓。`src/ui.js` 的商品卡图标按产品形状/类别显示更多区别。均为离线程序化几何与Canvas纹理，不加外链。
- `expiryPublicLabel` / `expiryInventoryLabel` 现在让玩家能看到清晰标期；无生产日期或字迹模糊批次显示名义保质期范围和已存放时间，但继续隐藏批次精确余期/日期。`isSpoiled(b)`仍使用`b.age >= DB[b.id].life`，冰箱年龄倍率、断电处理不变；货架准星文字也显示相同保质信息。
- `G.waste`按包装、餐厨残渣、其他丢弃物计数。首次使用批次计一次包装；每顿饭产一份残渣；丢弃整批物资记为其他废弃物。家务页列出分项，浴室垃圾桶附近按总量出现扎口袋；垃圾动作统一清除垃圾与过期物资。章节每日超过12份逐渐降低整洁，经典模式只记录。无虫鼠、无恶心画面。
- 旧v3存档允许缺少`waste`并把旧`trash`作为包装迁移；存档校验确保新分类和总数一致。经典365日、300纸币、单次采购、无补货、不自动摆放、机关固定与隐藏章节时间保持不变。
- 回归结果：`tests/levels.cjs` 98断言；`tests/simulation.cjs` 165断言（经典全年资源策略仍于第366日胜利）。浏览器 `levels-browser`、`browser`、`realism`、`navigation`、`audio` 全通过；`browser`含商品图标差异、第一次吃饭即生成包装/残渣与可见垃圾袋、模糊批次货架提示；导航257种种子、`liveClock:true`；外部请求0、JS错误0；音频72/72解码。
- 一次软件GPU浏览器重跑在主菜单按钮点击时超时，单独交互检查成功，整套复跑通过。货架保质期测试最初把5天保质的面包年龄设为6天，程序正确显示已变质；修正测试夹具至2天后完整回归通过。
- 手动复核临时QA图`tests/artifacts/v021-products.png`及`v021-waste.png`：新包装轮廓可区分，垃圾袋位于垃圾桶附近；这些截图只用于本地QA，打包/提交前删除。`python3 tools/build.py`当前离线单文件为22,874,204字节，已生成临时`dist/Game-playable.zip`；最终重建并清除`dist/`与`tests/artifacts/`。
- Git只读检查：`git ls-remote`显示GitHub `main`仍在公开v0.18提交`92bebdcd15749bfae9d452ca611256802323fdb7`，未见v0.20或v0.21标签；此时尚未推送。先完成本地检查点，再仅用无令牌的安全认证尝试推送；禁止使用用户粘贴的PAT、禁止放宽SSH host-key验证。提醒用户撤销此前贴出的PAT。

### v0.21 publication outcome
- Safe local checkpoint succeeded: release commit `d3ba4eefa35017a3296ade36452ba0a2d3cc2fab`, annotated tag `v0.21.0-preview`; working tree was clean at checkpoint. A prior safe-checkpoint attempt refused to exchange Git metadata because `/home/user/.npm` inflated the whole-home projection; moving that excluded generated cache temporarily out of the workspace allowed the safety-margin check to pass. The cache is retained under `/var/tmp/closed365-npm-cache` for restoration/cleanup.
- Requested push was attempted **without any token**. Strict SSH correctly stopped at missing verified `github.com` host key; no host-key verification was bypassed or added blindly. A second HTTPS attempt used an empty HOME and disabled credential helpers, and failed because no username was available. No remote changes occurred; post-attempt `git ls-remote` still showed `main` at `92bebdcd15749bfae9d452ca611256802323fdb7` and no v0.21 tag.
- No SSH key/agent or known GitHub host entry was present. Continue only after the user configures an authorized credential and verified host key; never use the pasted PAT. The PAT was not used, stored, or echoed; user should revoke it.

## v0.22.0-preview — immersive chapter archive and mechanism mini-games (2026-10-19)
- Read the existing HANDOFF before work and appended this section; earlier history is retained.
- Added an archival six-chapter picker with distinct local cover illustrations. The UI uses less scanline texture and shorter cards; all six fit in the 1440×900 screenshot. Locked chapters now show their unlock status and budget clearly without an overlaid lock banner.
- Added offline `src/level-minigames.js` after `levels.js` in `src/template.html` and `tools/build.py`: bell timing, wall sequence memory, radio tuning, flame timing, pendulum timing, crank sequence. Difficulty scales skill windows; chapter six is harder. `lvTryAt()` remains the separate hidden time/cue/weather/fixture gate; the minigame itself pauses hidden time, reveals no date or remaining days, and cancel adds no attempt. A radio mini-game browser check validates completion callback.
- Updated `src/data.js` to `0.22.0-preview`; README/DESIGN/RESULTS and this HANDOFF document the change. `tools/build.py` output now labels the ZIP as local rather than implying upload to a GitHub release.
- Validation after the final UI/CSS edits: `node tests/levels.cjs` 108; `node tests/simulation.cjs` 165; `tests/levels-browser.cjs` pass (offline art, all six cards/budgets, cancellation, hidden gate, radio completion; 0 external requests, 0 JS errors); classic `browser.cjs` pass on retry; `realism`, `navigation` (257 seeded routes, `liveClock:true`), `audio` (72/72 clips), and `life` all pass. `git diff --check`, JS syntax, and manifest JSON checks pass. Browser screenshots inspected: `tests/artifacts/levels/02-chapter-book.jpg`, `05-wall-mini-game.jpg`.
- Build from final game sources: offline root `index.html` 24,273,575 bytes; temporary local ZIP 30,770,828 bytes. The ZIP is in `dist/`; test screenshots are in `tests/artifacts/`. Remove both generated directories before final workspace-size check, retaining source chapter art and root `index.html`.
- Local safe checkpoint created: commit `8bf9ac939d652ffbe8e8fc341147d210a8b65675`, annotated tag `v0.22.0-preview`, via `tools/safe_checkpoint.py`. Projected workspace after compacting was 85,553,152 bytes; `dist/` and `tests/artifacts/` were removed, root `index.html` retained. The release checkpoint was clean.
- No remote URL is configured in the current clone (`git remote -v` is empty), so no push was attempted this turn. If the user later requests publishing, first configure an authorized remote/credential and verify GitHub's host key; never use the previously pasted PAT. Remind the user to revoke that PAT.

### 2026-10-19 / Agent A / v0.23.0-preview — extreme survival, food safety and QTEs
- Continued from the v0.22 local source without using a credential. Added the extreme-only chapter profile while preserving classic defaults and existing three chapter profiles; kept the one-time checkout, fixed chapter fixtures, hidden clocks, no restocking/gifts/automatic placement, and offline assets.
- Final extreme planning uses 103% of the measured 1,420.8 kcal/day baseline (1,463 kcal/day), six distinct shelf-stable flavors, the actual non-food YEAR_KIT, E$0.02/day care, mechanism goods, plus a 6% modeled reserve. Budgets: E$64 / 80 / 87 / 98 / 157 / 429. `tests/RESULTS.md` holds the six full-run costs, days, calorie remainders, medicines and stars.
- Food/medicine quality and price descriptions, foodborne illness, cutting/hand injury and sprain care, per-5m environment-driven fall QTEs, and four waste categories including explicit `capWaste` metadata are documented. Cap regression verifies bottled drinks count but tea bags/powder pouches do not. No pests or stand-ins were added.
- Final pure-simulation checks: levels **111**, survival **42**, classic simulation **165**, plus all six full extreme chapter runs pass. Browser checks: `levels-browser` (chapter/QTE; 0 external requests, 0 JS errors), classic physical `browser` (0/0), `navigation` (257 routes, `liveClock:true`, 0/0), `realism`, `audio` (72/72), `life`, and live RAF (checkout/unpack, no panels/errors) pass. The first navigation live-clock rerun failed its assertion; the test was made deterministic by choosing a longer real route and disabling fall chance only in that isolated timing check, while fall QTEs remain covered in `levels-browser`; final navigation test passes.
- Updated README, DESIGN and RESULTS; stale pest-stand-in claim was removed from current design text. Built `index.html` from the latest source; remove `dist/` and `tests/artifacts/` after packaging and verify the workspace stays below 128 MB. Local package only.
- `git remote -v` was empty at initial v0.23 handoff; **no push had yet been attempted** at that point. Never use, store or repeat any PAT pasted by the user; remind them to revoke it immediately. Do not weaken SSH host verification.

### 2026-10-19 / GitHub publication authorization — pending push
- User requested publication. GitHub connector is unsupported here; installed the official GitHub CLI temporarily under `/var/tmp` after SHA-256 verification. Device-flow authorization returned `repo`, `gist`, and `read:org` scopes rather than the requested narrow scope; local auth files were deleted and that credential was not used. A later token-exchange attempt failed with a network connection reset.
- The user pasted another PAT during this process; it was not used, saved, or echoed. The user was told to revoke every PAT pasted in this conversation immediately. No token is stored in the repository.
- User authorized a repository-specific SSH deploy key. A temporary ED25519 key pair is outside the workspace; only its public key was shown, and the user confirmed adding it to `deawfwaef2/Game` with write access. GitHub's ED25519 SSH host fingerprint was checked against the official `api.github.com/meta`; strict `ssh -T` authentication succeeded as `deawfwaef2/Game`.
- `origin` was configured as `git@github.com:deawfwaef2/Game.git`; a strict-host-verified fetch showed remote `main` at `92bebdc` was an ancestor of local `main` at `0df059c`. The v0.23 release was then committed and pushed by fast-forward; see the completion entry below.

### 2026-10-19 / GitHub publication completed — v0.23.0-preview
- Commit `e7f853b760da8f67c5467aa6e8737dbcbc5b0f50` (`v0.23.0-preview: extreme survival and safety incidents`) was pushed to `origin/main` without force. The push advances the public branch from v0.18 and includes the previously local v0.19–v0.22 history plus v0.23.
- Annotated tag `v0.23.0-preview` was pushed. A strict-host-verified `git ls-remote` confirmed `refs/heads/main` and the peeled v0.23 tag both resolve to the commit above. No GitHub Release or ZIP asset was created; the verified offline `index.html` is committed at repository root.
- The temporary private deploy key and helper files are to be deleted locally after this documentation commit; ask the user to remove the corresponding temporary Deploy Key from GitHub repo settings now. PATs pasted in chat were never used, stored or echoed and must be revoked immediately. The temporary GitHub CLI local auth files were deleted; the account may still list its OAuth app authorization for user-side revocation.
