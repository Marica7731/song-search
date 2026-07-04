# culua.com 歌站

面向 B 站歌切场景的歌曲检索、查重、命名校验和增长统计工具。

本仓库当前用于 `culua.com` 歌站本体维护。不要把 FeishuPy、飞书桥接、APP、网络控制台或其他产品线改动混进这里。

## 当前维护入口

```text
本地项目根目录：C:\Users\终焉\Documents\culua_web_h5
服务器目录：/var/www/song-search
部署分支：codex/server-deploy
数据更新主线：main
公网地址：https://www.culua.com/
```

进入项目后先确认：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git rev-parse --show-toplevel
git branch --show-current
git status --short
```

## 功能说明

- `index.html`：优化版歌库首页，浏览器标签标题为“歌曲搜索”，支持可搜索来源、来源头像、BV 封面缩略图、服务端分页、搜索范围切换、最近更新时间展示、独特歌曲星标、刷新默认筛选、桌面紧凑复制工具条、桌面自适应多列结果卡、H5 非吸顶紧凑检索栏、H5 缩放/横屏宽度多列结果卡、长字段省略显示、H5 筛选/复制底部弹层、字段点击复制、稳定行级复制、最近页码快速翻页和移动端紧凑结果卡。
- `index-optimized.html`：优化首页的对照文件，与正式首页保持同源，便于后续继续调样式或回看方案。
- `stats.html`：数据统计页，展示来源、歌手、曲目、投稿时间等统计视图，来源分组补充场次、曲数、去重、场均和独特歌曲指标；其中“场次”指去重 BV 号数量，“曲数”指歌曲条目数，“场均”是曲数 / BV 场次，“独特”指全库只出现 1 次且只来自 1 个来源的歌曲。来源筛选已移入左侧栏，使用来源头像、来源名、投稿数和去重数；内容区保留搜索、来源排序和摘要链接数；统计页不再挂右侧目录，避免与左侧来源列表重复。
- `bv-dup-check.html`：BV 批量查重，支持服务端 live fallback 上限、短输入工作区、当前库/结果概览、分组摘要、复制预设、高级复制字段折叠、已收录链接位次选择、复制设置记忆和自适应多列结果卡；状态文案统一为“已收录 / 未收录”。
- `title-artist-dup-check.html`：按“歌名 - 歌手”批量查重，支持歌手疑似不一致分组、复制预设、高级复制字段折叠、已收录链接位次选择、复制设置记忆和自适应多列结果卡；状态文案统一为“已收录 / 未收录”。
- `title-artist-check.html`：命名和校验工具，桌面端拆成左侧“输入与导出”、中间“校验结果”、右侧“目录”三列，支持未命中项改名重查、搜索辅助、带编号纯歌名输入、服务端候选摘要、结果筛选、当前结果复制、待处理项网易云搜索；目录项使用序号加歌名/歌手两行 chip。
- `vocaloid.html`：术力口静态数据页，读取 `vocaloid-songs-2026-06-17/manifest.json`、总表和去重表，复用 `/api/bootstrap` 的来源头像/别名补全；页面标明快照日期并与当前歌库更新时间比较，落后时显示快照滞后天数；展示来源内术力口去重曲目占比、识别依据、命名辅助、歌曲检索和去重歌名。
- `song-growth.html`：歌曲总量日报和增长趋势，读取服务端缓存后的增长数据，支持按全部来源或单个来源分析播放量、曲目、去重歌曲和每曲播放；来源选择器带头像，总览曲线和去重歌曲曲线在桌面端左右并排展示以压缩高度；当日曲目增量和当日去重增量支持悬停或点击查看新增歌曲明细和封面。
- `site-shell.js`：正式工具页共享外壳兜底脚本；正式页面首屏 HTML 已直接包含统一侧边导航，脚本同步当前页高亮，并在 H5 注入当前页胶囊和“页面”展开按钮，避免加载后再搬 DOM 造成旧页面闪烁。
- `admin-singer-config.html`：来源配置后台，管理员用 token 维护运行时配置和触发刷新。
- `tabs-optimization-preview.html`：六个主 tab 的优化方案 HTML 预览，会读取 `/api/tabs/overview` 展示真实后端概览，不替换生产页面。
- `server.js`：统一 Node 服务端，提供静态页面、搜索分页、搜索导出、统计视图、全站 tab 概览、查重/命名摘要、增长缓存、管理刷新和内部 reload；HTML 响应返回 `Cache-Control: no-store`，减少发布后仍看到旧页面的问题。
- `scripts/check-live-song-total.js`：线上歌库回退检查脚本，读取公网 `/api/bootstrap` 和 `/api/search`，用于发布后确认总曲数没有下降、关键 BV 仍可命中。
- `ADD_SOURCE_PROMPT.md`：根目录来源添加提示词，固定 GitHub Pages 与 `culua.com` 的不同添加、验证和发布方式，避免后续上下文过长时混用流程。
- `scripts/source-profiles.json`：来源头像补充配置，可按来源文件名补 `avatarUrl`、`youtubeUrl`、`avatarText`、`accentColor` 和 `statsAvgSortDeferred`；缺失时页面自动显示来源名单字头像。
- `scripts/collect-source-avatars.js`：来源头像采集脚本，从每个来源当前歌库里挑最新 BV，读取 B 站简介中的 YouTube 链接并解析频道头像，写回 `scripts/source-profiles.json` 和 `data/index.json`。
- `tools/check-mobile-artist-cases.js`：移动端歌手标签回归脚本，用多组真实搜索词覆盖短英文、短日文、`from` / `feat.` / 斜杠组合、超长署名和超长角色表等歌手名，检查结果卡在多种宽度下是否过早折叠，以及是否先收边距、缩字号后再截断。

## 在线页面

```text
https://www.culua.com/
https://www.culua.com/m
https://www.culua.com/h5
https://www.culua.com/stats
https://www.culua.com/bv
https://www.culua.com/dup
https://www.culua.com/check
https://www.culua.com/vocaloid
https://www.culua.com/growth
https://www.culua.com/admin-config
```

GitHub Pages 历史入口仍保留：

```text
https://marica7731.github.io/song-search/
```

## 正式页面交互优化

本轮把之前 `tabs-optimization-preview.html` 里的方向落实到正式页面，优化重点是“筛选条件、表格/结果、复制”三条横向能力。

功能说明：

- 首页：排序、页大小、搜索字段和来源都只作用于当前页面会话，刷新或重新访问默认回到全部来源、歌名/歌手、新到旧和 40 条；桌面端复制区为“复制类型下拉 + 复制按钮 + 字段设置”，H5 端改为“复制”底部弹层；结果里的歌名、歌手、合集、来源、BV 和日期可直接点击复制，按“歌名 - 歌手”宽容去重后仅单来源收录的曲目会显示独特歌曲星标。
- 首页 H5：顶部检索栏不吸顶，滑动结果时会随页面一起上移；首屏保留搜索框、搜索按钮、筛选 chips、摘要和结果列表，移动端最近更新时间隐藏以节省空间；来源、排序、搜索范围、页大小进入“筛选”底部弹层；统计卡和桌面复制面板在移动端隐藏；结果卡把来源展示为封面下方“头像 + 来源名”的文本行，日期和 BV 保留居中 meta chips，歌手保持自然宽度的次级 chip，缩略图固定在左侧；当 H5 缩放或横屏让布局宽度进入 701px-980px 时，结果区恢复自适应多列卡片，正常窄屏仍保持单列。
- 首页桌面：结果列表改为自适应多列卡片，复用 H5 的封面、meta chips、歌手 chip 和紧凑图标操作；宽屏会按 1/2、3/4 的自然顺序排卡，歌名、歌手、合集、来源、日期、BV 等长字段统一使用单行省略保持卡片高度稳定，保留所有字段点击复制、编辑稿件、复制链接和打开 B 站入口。
- 首页来源列表：来源数量来自服务端 `/api/bootstrap` 的 `sourceStats.totalSongs`，并兼容旧的 `count/total` 字段，避免单来源数量显示为 0；来源按曲目数从多到少排列。
- 首页媒体展示：来源列表和数据页来源分组会显示来源头像；搜索结果按 BV 显示 B 站封面缩略图，图片缺失时保留原卡片布局。
- 数据页：左侧新增“数据导航”用于切换来源统计、歌曲排行和歌手聚合；来源筛选移到左侧来源列表，头像、别名、投稿数和去重数均来自当前 `sourceProfiles/sourceStats`；来源排序支持曲数、场次、场均、独特、去重，默认按曲数排序；场均排序时会把 `sourceProfiles` 里 `statsAvgSortDeferred=true` 的合集型异常来源排在普通来源之后；“摘要链接数”只控制复制摘要里附带的示例投稿链接数量，不影响统计结果。
- 术力口页：`/vocaloid` 是静态快照页，不新增服务端 API；数据来自 `vocaloid-songs-2026-06-17/`，来源头像和别名从 `/api/bootstrap` 补全。快照日期和当前歌库更新时间会同时显示，若快照旧于当前歌库会标出滞后天数；“来源内占比”使用 `术力口去重曲目 / 当前歌库该来源去重曲目`，避免来源总量越大占比天然越高；“feat/with + 音源理由”只作为命名辅助统计，正式纳入仍依据快照中的 `vocaloidCheck.reasons`。
- 正式页共享资源：`/`、`/stats`、`/bv`、`/dup`、`/check`、`/vocaloid`、`/growth` 均通过统一左侧导航访问；子页面通过带版本号的 `site-theme.css`、`site-shell.js` 加载统一 UI，页面首屏已经是静态共享外壳，避免先显示旧页面再由 JS 套壳。
- 数据页视觉：统一为首页同款侧栏、分段 tab、筛选栏、概览卡和列表卡样式；统计页来源目录固定在左侧栏并显示头像，不再使用右侧目录；BV 查重、歌名查重和命名工具仍按页面需要保留右侧目录列。来源/歌手分组头部使用统计 badge，来源统计、歌曲排行和歌手聚合在桌面端自适应排成多列卡片，歌曲行、场次预览和展开区域同步压缩；H5 下统计 chips 固定在分组头部右上角以减少卡片高度，歌曲行使用“文本区 + 操作区”网格，展开投稿链接限制高度并可滚动。
- BV 查重 / 歌名歌手查重：常用复制预设保留在主操作区，高级字段折叠到“高级复制字段”，并按页面分别保存复制字段、格式和已收录链接位次；复制链接位次支持正数从前取、负数从后取，例如 `1` 取第一条、`-1` 取最后一条，越界会夹到可用范围；来源选择移入左侧栏并显示来源头像、投稿数和去重数；BV 查重页首屏使用短输入工作区，右侧展示当前库、输入、已收录、未收录和未找到概览，目录只保留关键分区；结果区按可用宽度自适应多列卡片，单卡压缩封面、标题、歌手、来源和已收录记录预览，BV 查重单卡默认只展示前 2 条已收录链接并提示剩余数量，且预览区保留稳定高度，已收录 / 未收录 / 未找到 / 歌手疑似不一致使用不同颜色标记；歌名歌手查重页的输入区改为短 placeholder 和独立格式提示，避免空页面显示粗重滚动条。
- 命名工具：输入支持纯歌名、`01. 歌名`、`01. 歌名 - 歌手` 和 `歌名 - 歌手`；桌面端左列集中输入、开始校验、导出、复制当前结果和批量网易云搜索，中列展示候选和修正操作，右列目录定位结果项。候选结果支持“全部 / 已确认 / 需要确认 / 缺歌手 / 待入库 / 未找到”筛选并用颜色区分，筛选按钮本身显示数量，不再额外重复摘要；默认优先使用用户提供的歌手，用户未提供、输入“未确认/未知”、或库中存在更完整且包含用户输入的歌手名时才优先使用库中值；“待入库”用于库里没有歌名但用户已提供有效歌手的结果；选择候选歌手会同步到修正输入框和网易云链接。
- 日报：来源选择器和选项列表都会显示来源头像；选择单来源后，总览图、分析卡、去重曲线和表格同步切换，单来源日期只保留有实际增量的天数；指标文案统一为“每曲播放”，避免“商值”含义不清。
- 数据页 / BV 查重 / 歌名歌手查重 / 命名工具 / 日报：正式入口已接入共享页面外壳，左上角统一为纯文字 `CULUA`；桌面端使用统一宽度的左侧主导航，H5 顶部只保留 `CULUA`、当前页胶囊和“页面”展开按钮，默认不展示横向 tab，且会随页面一起滚走，减少首屏占用。

使用方法：

```text
首页桌面：在复制下拉里选择“本页：歌名 - 歌手”“本页：歌名 - 歌手 + 链接”“本页 TSV”“全部结果”或“自定义字段”，再点“复制”；点“字段”展开自定义字段设置；点结果里的歌名、歌手、合集、来源、BV 或日期可单独复制；分页会显示首页、末页和当前页左右 5 个页码。
首页 H5：点筛选 chip 打开底部弹层修改来源、排序、搜索范围和每页数量；点“复制”打开底部弹层复制当前页的“歌名 - 歌手”“歌名 - 歌手 + 链接”“当前结果 TSV”或自定义字段；单条结果保留图标按钮，顺序为“复制歌名 - 歌手 / 编辑稿件 / 复制链接 / 打开B站”。
数据页：切换 tab、来源、搜索或来源排序只影响当前页面会话；歌曲排行桌面默认显示前 4 个场次预览，H5 默认显示前 2 个，需要完整场次时点“展开全部”或“复制场次”。
统计页来源：来源筛选和来源头像固定在左侧栏，不再显示右侧目录；切换来源、搜索或排序只影响当前统计视图。
查重页：左侧栏切换来源，主内容区批量输入 BV 或“歌名 - 歌手”后分析；BV 查重会在输入区旁显示当前范围和结果概览；结果会按宽度排成多列卡片，卡里的标题、歌手和来源仍可点击复制，封面和链接可打开 B 站；直接点复制预设，需要改字段或链接位次时展开“高级复制字段”，链接位次填 `-1` 可复制最后一条已收录链接。
命名工具：左列输入并校验，校验后在同一列复制当前可见结果，或逐个打开当前可见待处理项的网易云搜索；中列用“已确认 / 需要确认 / 缺歌手 / 待入库 / 未找到”筛选按钮收敛候选列表，右列目录定位具体条目。
日报：切换来源、区间或指标后查看播放量、曲目、去重歌曲或每曲播放分析；“去重歌曲曲线”始终单独显示累计去重和日新增去重，点带头像的来源选择器可切换单来源分析；悬停或点击“当日曲目增量 / 当日去重增量”的数字可查看对应日期的新增歌曲、来源、BV、封面和 B 站链接，可悬停数字只用下方小圆点提示；翻页支持当前页左右 5 个页码并可复制当前表格页。
全站导航：从首页点击“统计 / BV 查重 / 歌名查重 / 命名校验 / 增长日报”会进入统一外壳页面，当前 tab 会高亮；H5 顶部默认只显示当前页，需要切换页面时点“页面”展开导航，数据页用第二行“来源统计 / 歌曲排行 / 歌手聚合”直接切换视图。
```

注意事项：

- 首页和数据页筛选状态不再写入浏览器 `localStorage`；刷新或重新访问时默认回到全部来源、默认搜索范围和默认分页，避免沿用上一次来源或字段。
- 首页 URL 只保留搜索词 `q`；排序、分页、页大小和来源不写入 URL，避免刷新后继续停留在上次筛选。
- 歌手罗马音兼容只用于去重、查重和命名校验的歌手宽容匹配；普通搜索接口按原始假名/汉字/英文文本匹配，不把假名歌手自动转罗马音参与搜索。
- 复制表格均使用 TSV，适合粘贴到表格工具或飞书表格。

## 本地运行

根目录 `package.json` 没有外部依赖，优先使用内置 Node 服务运行：

```powershell
npm start
```

等价命令：

```powershell
node server.js
```

默认端口是 `8080`。如需改端口：

```powershell
$env:PORT='8081'
node server.js
```

本地访问：

```text
http://127.0.0.1:8080/
http://127.0.0.1:8080/index-optimized.html
http://127.0.0.1:8080/tabs-optimization-preview.html
http://127.0.0.1:8080/m
http://127.0.0.1:8080/h5
http://127.0.0.1:8080/stats
http://127.0.0.1:8080/bv
http://127.0.0.1:8080/dup
http://127.0.0.1:8080/check
http://127.0.0.1:8080/vocaloid
http://127.0.0.1:8080/growth
```

不要用 `file://` 判断页面是否正常。依赖 `fetch('data/index.json')` 或 `/api/*` 的页面必须用本地 HTTP 或公网验证。

## 数据更新

`data/` 目录由脚本生成，但当前仓库会跟踪 `data/*.js` 和 `data/index.json`。提交前必须确认曲目数量没有异常回退。

本地 `data/` 可能落后公网很多；封存、发布、回退判断必须先查 `https://www.culua.com/api/bootstrap` 或对应 `https://www.culua.com/data/<file>.js`，以线上当前数据为准，再决定是否同步本地生成物。

需要断更但继续展示的来源不要从配置里删除；在 `scripts/singer-configs.json` 和服务器运行时配置中设置 `archived: true`，并保留 `file/alias` 指向既有数据文件。封存来源可以把 `bvids` 置空，从任务入口里移除该人物；刷新脚本会校验对应 `data/<file>.js` 存量文件存在、继续写入索引，但跳过抓取和覆盖旧数据。

新增或调整来源优先修改：

```text
scripts/singer-configs.json
```

然后运行：

```powershell
node scripts/update-songs.js
npm run check:library
node scripts/update-song-growth.js
```

输入与输出：

```text
输入：scripts/singer-configs.json
输入：运行时配置 runtime/singer-configs.json 或 SINGER_CONFIG_RUNTIME_PATH 指向的文件
输出：data/*.js
输出：data/index.json
输出：reports/song-growth-history.json
输出：song-growth.html 和 README.md 的日报段落
```

### 按合集小节拆分来源

`scripts/update-songs.js` 支持在来源配置里用合集小节标题拆分同一个 B 站合集。适用于 `BV1xucZzxEkZ` 这类“非常驻妹妹”合集里按人物分小节的情况。

配置示例：

```json
{ "bvids": ["BV18xo1BHEkX"], "file": "aimarun", "alias": "あいまるん。", "sectionTitle": "あいまるん。" }
```

字段说明：

- `sectionTitle`：只收录入口 BV 所属合集里标题完全匹配的小节。
- `sectionTitles`：可配置多个要收录的小节标题。
- `excludeSectionTitle` / `excludeSectionTitles`：从合集来源里排除指定小节，避免同一小节同时进入独立来源和“非常驻妹妹”。
- `excludeBvids`：从某个来源的合集展开结果里排除指定 BV，适合单集应归属到其它合集来源的情况。
- `archived`：设置为 `true` 时封存来源；索引和页面仍保留该来源，但 `scripts/update-songs.js` 不再刷新对应 `data/<file>.js`，此时 `bvids` 可为空。

独立合集来源：

```text
BV1tKcZztEw5 羽澄さひろ -> data/hasumisahiro.js
BV1KSRXBwE2v すとらてぃあ-Stratia -> data/stratia.js
BV1sU5S69E8r からくりんね-KarakuRinne -> data/karakurinne.js
BV1LgVc6aEuV 香鳴ハノン -> data/kanaruhanon.js
BV1dE42137AT AZKi -> data/azki.js
BV1CbVk68ESd 透夏 -> data/toka10summer.js
```

已拆分的小节来源：

```text
BV18xo1BHEkX あいまるん。 -> data/aimarun.js
BV1wHQVBTEU5 ななし律歌 -> data/nanashirikka.js
BV1YtwtzREbp がびのお部屋 -> data/gabinoheya.js
```

验证方式：

```powershell
node --check scripts/update-songs.js
node scripts/update-songs.js
npm run check:library
```

来源头像采集：

```powershell
npm run collect:avatars
```

该命令会按每个来源最新 BV 的简介提取 YouTube 频道或视频链接，解析频道头像后更新 `scripts/source-profiles.json`，并同步 `data/index.json` 里的 `sourceProfiles`。生成链路会兼容来源文件名首尾空格差异；如果简介没有明确 YouTube 链接或频道页无法解析头像，会继续使用来源名单字头像兜底。

移动端歌手标签回归：

```powershell
node tools/check-mobile-artist-cases.js .tmp/artist-cases http://127.0.0.1:8080
```

输入与输出：

```text
输入：歌曲搜索首页（本地或公网，可指向 `/`、`/m`、`/h5`）
输入：脚本内置的真实查询用例与宽度列表（864 / 700 / 560 / 430 / 390 / 360 / 320）
输出：每个用例对应结果卡截图
输出：控制台里的歌手标签宽度、容器宽度、字号、内边距、压缩阶段和是否溢出
```

说明：脚本优先使用 Playwright 自带浏览器；如果本机没有装对应运行时，会自动回退到系统 Chrome 或 Edge。页面端歌手标签采用“默认样式 -> 收边距 -> 缩字号 -> 最后截断”的顺序处理，回归脚本会同时校验这条链路。

注意：

- BV 号在配置里保持原样，不要强制改大小写。
- `CULUA` 已经作为单独来源使用 `BV11GZtBcEsp`；`非常驻妹妹` 不再保留会重复扫到同一批内容的 `BV1r1RsYDEvB`，否则会把约 441 首歌重复计入生成结果。
- 来源头像在 `scripts/source-profiles.json` 里补充；没有头像 URL 时自动使用来源名首个有效字符生成单字头像；已有头像时不再叠加首字，全部来源使用 `ALL` 作为兜底头像文本；`statsAvgSortDeferred=true` 可把合集型异常来源在数据页场均排序中单独压到末尾；数据页的页面目录会同步显示来源头像，便于在长列表里快速定位来源。
- B 站封面缩略图来自 view API 的 `pic` 字段，并在 `scripts/update-songs.js` 生成数据时写入歌曲记录的 `cover` 字段；生成脚本和页面展示都统一使用 160w 缩略图，首页和数据页会先写占位图，等图片接近视口或展开后才请求真实地址。
- `sectionTitle` 按 B 站接口返回的小节标题完全匹配，改名或空格差异会影响收录。
- 没有 `ugc_season.sections` 的普通多分P BV 不需要 `sectionTitle`；抓取脚本会把入口 BV 本身作为视频并读取 `pages`。
- `with 嘉宾 02. 歌名 - 歌手` 这类分P标题会先清掉 `with 嘉宾 + 序号` 前缀，再沿用普通 `歌名 - 歌手` 解析；如果末尾只有分隔用的 `-`，会去掉这个空歌手分隔符。
- `reports/bv-metadata-cache.json` 和 `reports/update-songs-meta.json` 是运行缓存，不提交。
- 服务器管理 token、cookie、AI key、`.env` 不写入仓库。

## 后端接口说明

本轮全站 tab 优化新增或强化了这些生产接口：

```text
GET  /api/search              搜索结果包含 rowId、sourceAlias、bvid；首页行内复制按 rowId 定位，并兼容旧响应缺少 rowId 时的前端临时行号
GET  /api/tabs/overview       六个主 tab 的实时概览，供优化预览页和后续总览页使用
GET  /api/song-growth         返回 combinedRows、sourceRows、sourceUniqueRows、publishUniqueRows、anomalies、cache；combinedRows 包含 uniqueSongTotal/uniqueSongDelta，sourceRows 供单来源总览分析使用，并按 SONG_GROWTH_CACHE_TTL_MS 缓存
GET  /api/song-growth/details 按 source/date/type 懒加载日报新增歌曲明细；type=songs 返回当日曲目增量明细，type=unique 返回当日去重增量明细，结果包含封面、来源、BV 和链接
POST /api/dup-check           返回 summary、copyPresets、liveFallback，并限制 BV live fallback 数量
POST /api/title-artist/lookup 返回 summary，统计通过、需确认、未找到和多候选数量
```

可选环境变量：

```text
BV_LIVE_FALLBACK_MAX_PER_REQUEST  单次 BV 查重最多实时查询多少个未知 BV，默认 12
SONG_GROWTH_CACHE_TTL_MS          日报接口缓存时间，默认 60000
```

## 测试说明

基础语法检查：

```powershell
node --check server.js
node --check page-directory-widget.js
node --check dup-check-core.js
node --check artist-match.js
node --check bili-check-title-artist.js
node --check scripts/update-songs.js
node --check scripts/update-song-growth.js
node --check scripts/check-song-library.js
```

歌库检查：

```powershell
npm run check:library
node scripts/check-song-library.js --json
npm run check:live -- --min-total=25785 --require-bv=BV1xd5g61Egu
```

`check:live` 默认检查 `https://www.culua.com`。发布前可先用 `npm run check:live -- --json` 记录当前 `totalSongs`，发布刷新后再用 `--min-total=<发布前总量>` 防止线上数据回退。

本地服务检查：

```powershell
npm start
```

浏览器访问：

```text
http://127.0.0.1:8080/
http://127.0.0.1:8080/tabs-optimization-preview.html
http://127.0.0.1:8080/stats
http://127.0.0.1:8080/bv
http://127.0.0.1:8080/dup
http://127.0.0.1:8080/check
http://127.0.0.1:8080/vocaloid
http://127.0.0.1:8080/growth
```

数据页 UI 检查：

```text
http://127.0.0.1:8080/stats
桌面宽度 >= 1280px：右侧目录应在独立列内 sticky，主内容不能被遮挡，页面不应有横向滚动。
390px H5：右侧目录应隐藏为“目录”按钮，抽屉可打开/关闭；目录列表滚动到底部时最后一项必须完整露出；分组头部、歌曲行、长歌手/原唱字段和展开投稿链接不应横向溢出。
680px - 1279px 窄屏/手机浏览器 PC 模式：来源统计、歌曲排行和歌手聚合列表应按可用宽度自适应多列，不能固定为松散单列。
```

接口检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/api/tabs/overview
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/api/song-growth
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8080/api/search?page=1&pageSize=1"
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8080/api/stats/view?tab=vtuber-source&page=1&pageSize=1"
```

数据页指标口径检查：

```text
/api/stats/view?tab=vtuber-source 返回的来源分组应包含 bvCount。
/api/stats/view?tab=vtuber-source 不带 pageSize 时应默认返回全部来源，页面来源统计不能只停在前 30 个来源。
页面来源分组 chip 应显示：场次 = bvCount，曲数 = totalCount，场均 = totalCount / bvCount。
页面来源排序默认 sort=songs-desc；也应支持 bvid-desc、avg-desc、avg-asc、solo-desc、unique-desc。
场均排序时，`sourceProfiles` 里 `statsAvgSortDeferred=true` 的来源应始终排在普通来源之后；当前包含接力、花丸晴琉、來-Ray-、朱名、非常驻妹妹。
独特歌曲只应在同一宽容去重歌曲全库出现 1 次且来源数为 1 时成立；同一来源重复多次演唱不再标为独特。
不要再把歌曲条目 totalCount 标成“场次”。
```

公网部署后检查：

```bash
curl -fsS "https://www.culua.com/api/stats/view?tab=vtuber-source&page=1&pageSize=1"
curl -fsSL https://www.culua.com/ | head
curl -fsSL https://www.culua.com/stats | head
curl -fsSL https://www.culua.com/bv | head
curl -fsSL https://www.culua.com/check | head
curl -fsSL https://www.culua.com/growth | head
```

## 项目结构说明

```text
culua_web_h5/
├─ index.html                       首页和歌曲检索
├─ index-optimized.html             首页优化对照文件
├─ tabs-optimization-preview.html   六个主 tab 的优化方案预览
├─ stats.html                       数据统计页
├─ bv-dup-check.html                BV 查重
├─ title-artist-dup-check.html      歌名歌手查重
├─ title-artist-check.html          命名和校验工具
├─ song-growth.html                 增长日报页
├─ admin-singer-config.html         来源配置后台
├─ server.js                        Node 服务端和 API
├─ site-theme.css                   共享样式
├─ dup-check-core.js                查重公共逻辑
├─ artist-match.js                  歌手宽容匹配逻辑
├─ bili-check-title-artist.js       标题歌手解析/校验辅助
├─ data/                            自动生成歌库数据
├─ reports/                         增长历史和运行缓存
├─ scripts/                         数据抓取、增长日报、歌库检查脚本
├─ tools/                           本地服务和截图辅助工具
├─ docs/                            迁移交接和文件清单
└─ .github/workflows/               GitHub 自动更新任务
```

完整说明：

- [迁移交接](docs/migration-handoff.md)
- [culua 服务器使用指南](docs/culua-server-guide.md)
- [首页优化方案](docs/site-optimization-plan.md)
- [全站 Tab 优化方案预览](docs/tabs-optimization-plan.md)
- [文件清单](docs/file-manifest.md)
- [添加来源提示词](docs/add-source-prompt.md)

## 维护注意事项

- 先确认当前目录是真正项目根目录，不要在 `C:\Users\����` 这类乱码路径工作。
- 不要从旧 `C:\Users\终焉\Documents\New project\song-search` 复制文件覆盖本仓库。
- 不要把 GitHub 数据更新任务和 `culua.com` 服务器部署混成同一个任务。
- 不要提交 `downloads/`、`runtime/`、缓存报告、截图、日志、`.env`。
- 改页面后必须用本地 HTTP 或公网验证。
- `culua.com` 正常发布必须跑服务器刷新脚本，不要只 `git reset --hard` 后重启；否则会把线上新生成的歌库覆盖回仓库里的旧数据。
- 服务器 `/usr/local/bin/song-search-refresh.sh` 应保持服务在线刷新：更新数据时不长时间停止 `song-search.service`，成功后调用 `/internal/reload`，失败时重启服务兜底；脚本内应保留 `timeout`，避免定时任务卡住导致 502。
- 涉及数据或部署时必须核对来源数、曲目数和关键 BV 是否存在，推荐用 `npm run check:live -- --min-total=<发布前总量> --require-bv=BV1xd5g61Egu`。
- 只改页面、CSS、前端脚本或 `server.js` 时，不要发布仓库里的旧 `data/`。按 `docs/culua-server-guide.md` 的“保留线上数据”代码发布流程，先备份服务器当前 `data/`，reset 代码后立刻恢复数据，再重启并做 `check:live` 前后总量对比。



<!-- SONG_GROWTH_START -->
## 歌曲总量日报

- 最新总曲数：**21190**
- 更新时间（上海时间）：2026/04/03 08:03:19
- 最新库收录日增：**+279**
- 最新按投稿时间日增：**+80**
- 完整页面：[`song-growth.html`](./song-growth.html)

口径说明：
- `库收录增长`：按你的站点实际抓取入库时间统计
- `按投稿时间增长`：按歌曲 `pubdate` 统计真实投稿时间增长

库收录增长近 14 天：

| 日期 | 总曲数 | 较前一日增量 |
|---|---:|---:|
| 2026-04-03 | 21190 | <span style="color:#28a745;">+279</span> |
| 2026-04-02 | 20911 | 0 |
| 2026-04-01 | 20911 | <span style="color:#28a745;">+48</span> |
| 2026-03-31 | 20863 | <span style="color:#28a745;">+102</span> |
| 2026-03-30 | 20761 | <span style="color:#28a745;">+161</span> |
| 2026-03-29 | 20600 | <span style="color:#28a745;">+139</span> |
| 2026-03-28 | 20461 | <span style="color:#28a745;">+275</span> |
| 2026-03-27 | 20186 | <span style="color:#28a745;">+146</span> |
| 2026-03-26 | 20040 | <span style="color:#28a745;">+104</span> |
| 2026-03-25 | 19936 | <span style="color:#28a745;">+210</span> |
| 2026-03-24 | 19726 | <span style="color:#28a745;">+107</span> |
| 2026-03-23 | 19619 | <span style="color:#28a745;">+187</span> |
| 2026-03-22 | 19432 | <span style="color:#28a745;">+135</span> |
| 2026-03-21 | 19297 | <span style="color:#28a745;">+213</span> |
<!-- SONG_GROWTH_END -->

