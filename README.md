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

- `index.html`：优化版歌库首页，支持可搜索来源、服务端分页、搜索范围切换、最近更新时间展示、筛选偏好记忆、桌面紧凑复制工具条、H5 筛选/复制底部弹层、字段点击复制、稳定行级复制和移动端紧凑结果卡。
- `index-optimized.html`：优化首页的对照文件，与正式首页保持同源，便于后续继续调样式或回看方案。
- `stats.html`：数据统计页，展示来源、歌手、曲目、投稿时间等统计视图，并记住 tab、来源、搜索词和摘要链接数。
- `bv-dup-check.html`：BV 批量查重，支持服务端 live fallback 上限、分组摘要、复制预设、高级复制字段折叠和复制设置记忆。
- `title-artist-dup-check.html`：按“歌名 - 歌手”批量查重，支持歌手疑似不一致分组、复制预设、高级复制字段折叠和复制设置记忆。
- `title-artist-check.html`：命名和校验工具，支持未命中项改名重查、搜索辅助、服务端候选摘要、结果筛选、当前结果复制和待处理项网易云搜索。
- `song-growth.html`：歌曲总量日报和增长趋势，读取服务端缓存后的增长数据，支持复制区间摘要和当前表格页。
- `site-shell.js`：正式工具页共享外壳兜底脚本；正式页面首屏 HTML 已直接包含统一侧边导航和 H5 顶部导航，脚本只同步当前页高亮，避免加载后再搬 DOM 造成旧页面闪烁。
- `admin-singer-config.html`：来源配置后台，管理员用 token 维护运行时配置和触发刷新。
- `tabs-optimization-preview.html`：六个主 tab 的优化方案 HTML 预览，会读取 `/api/tabs/overview` 展示真实后端概览，不替换生产页面。
- `server.js`：统一 Node 服务端，提供静态页面、搜索分页、搜索导出、统计视图、全站 tab 概览、查重/命名摘要、增长缓存、管理刷新和内部 reload。
- `scripts/check-live-song-total.js`：线上歌库回退检查脚本，读取公网 `/api/bootstrap` 和 `/api/search`，用于发布后确认总曲数没有下降、关键 BV 仍可命中。

## 在线页面

```text
https://www.culua.com/
https://www.culua.com/m
https://www.culua.com/h5
https://www.culua.com/stats
https://www.culua.com/bv
https://www.culua.com/dup
https://www.culua.com/check
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

- 首页：来源、排序、页大小、搜索字段会保存在浏览器本地；桌面端复制区为“复制类型下拉 + 复制按钮 + 字段设置”，H5 端改为“复制”底部弹层；自定义复制字段、格式、分隔符、复制类型和展开状态都会记忆；结果里的歌名、歌手、合集、来源、BV 和日期可直接点击复制。
- 首页 H5：首屏只保留搜索框、搜索按钮、筛选 chips、摘要和结果列表；来源、排序、搜索范围、页大小进入“筛选”底部弹层；统计卡和桌面复制面板在移动端隐藏；结果卡把来源淡化为 meta、歌手强化为次级标题，普通卡片高度控制在 120 到 150px 区间。
- 首页来源列表：来源数量来自服务端 `/api/bootstrap` 的 `sourceStats.totalSongs`，并兼容旧的 `count/total` 字段，避免单来源数量显示为 0。
- 数据页：左侧新增“数据导航”用于切换来源统计、歌曲排行和歌手聚合；来源筛选保留在内容区作为筛选条件；会记住当前 tab、来源筛选、关键词和摘要链接数，刷新后继续停留在同一工作视图。
- 正式页共享资源：`/`、`/stats`、`/bv`、`/dup`、`/check`、`/growth` 均通过 `last-run-badge.js` 展示最近歌库更新时间；子页面通过带版本号的 `site-theme.css`、`site-shell.js` 加载统一 UI，页面首屏已经是静态共享外壳，避免先显示旧页面再由 JS 套壳。
- 数据页视觉：已移除旧右侧目录浮层和技术化更新文案，统一为首页同款侧栏、分段 tab、筛选栏、概览卡和列表卡样式；歌曲排行改为“标题/歌手、指标、场次预览”三段式卡片，来源/歌手分组改为紧凑歌曲行，长合集名在桌面和 H5 都有截断兜底。
- BV 查重 / 歌名歌手查重：常用复制预设保留在主操作区，高级字段折叠到“高级复制字段”，并按页面分别保存复制字段、格式和重复链接位次；歌名歌手查重页的输入区改为短 placeholder 和独立格式提示，避免空页面显示粗重滚动条。
- 命名工具：候选结果支持“全部 / 已确认 / 需要确认 / 缺歌手 / 待入库 / 未找到”筛选并用颜色区分；默认优先使用用户提供的歌手，用户未提供、输入“未确认/未知”、或库中存在更完整且包含用户输入的歌手名时才优先使用库中值；“待入库”用于库里没有歌名但用户已提供有效歌手的结果；选择候选歌手会同步到修正输入框和网易云链接；复制按钮只复制当前可见结果；批量网易云只打开当前可见的待处理项，并可在有用户输入歌手时勾选“不带歌手”。
- 日报：新增“复制摘要”和“复制当前表格”，摘要按当前区间和当前指标视图生成，表格复制当前分页 TSV。
- 数据页 / BV 查重 / 歌名歌手查重 / 命名工具 / 日报：正式入口已接入共享页面外壳，左上角统一为纯文字 `culua.com`；桌面端使用左侧主导航，H5 使用紧凑顶部横向导航，并隐藏重复说明标签和数据页内部重复 tab，减少首屏占用。

使用方法：

```text
首页桌面：在复制下拉里选择“本页：歌名 - 歌手”“本页：歌名 - 歌手 + 链接”“本页 TSV”“全部结果”或“自定义字段”，再点“复制”；点“字段”展开自定义字段设置；点结果里的歌名、歌手、合集、来源、BV 或日期可单独复制。
首页 H5：点筛选 chip 打开底部弹层修改来源、排序、搜索范围和每页数量；点“复制”打开底部弹层复制当前页的“歌名 - 歌手”“歌名 - 歌手 + 链接”“当前结果 TSV”或自定义字段；单条结果保留图标按钮，顺序为“编辑稿件 / 复制链接 / 打开B站”。
数据页：切换 tab、来源或搜索后，刷新保留当前视图；歌曲排行桌面默认显示前 4 个场次预览，H5 默认显示前 2 个，需要完整场次时点“展开全部”或“复制场次”。
查重页：直接点复制预设；需要改字段时展开“高级复制字段”。
命名工具：校验后用“已确认 / 需要确认 / 缺歌手 / 待入库 / 未找到”筛选按钮收敛结果，点“复制”复制当前可见结果；需要外部查找时只对待处理项逐个打开网易云搜索。
日报：切换区间或指标后复制摘要；翻页后复制当前表格页。
全站导航：从首页点击“统计 / BV 查重 / 歌名查重 / 命名校验 / 增长日报”会进入统一外壳页面，当前 tab 会高亮；H5 顶部导航可横滑，数据页用第二行“来源统计 / 歌曲排行 / 歌手聚合”直接切换视图。
```

注意事项：

- 这些偏好只写入浏览器 `localStorage`，不写入服务器、不影响其他用户。
- URL 查询参数优先级高于首页本地记忆，便于分享指定搜索结果。
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
http://127.0.0.1:8080/growth
```

不要用 `file://` 判断页面是否正常。依赖 `fetch('data/index.json')` 或 `/api/*` 的页面必须用本地 HTTP 或公网验证。

## 数据更新

`data/` 目录由脚本生成，但当前仓库会跟踪 `data/*.js` 和 `data/index.json`。提交前必须确认曲目数量没有异常回退。

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

独立合集来源：

```text
BV1tKcZztEw5 羽澄さひろ -> data/hasumisahiro.js
BV1KSRXBwE2v すとらてぃあ-Stratia -> data/stratia.js
BV1sU5S69E8r からくりんね-KarakuRinne -> data/karakurinne.js
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

注意：

- BV 号在配置里保持原样，不要强制改大小写。
- `sectionTitle` 按 B 站接口返回的小节标题完全匹配，改名或空格差异会影响收录。
- `reports/bv-metadata-cache.json` 和 `reports/update-songs-meta.json` 是运行缓存，不提交。
- 服务器管理 token、cookie、AI key、`.env` 不写入仓库。

## 后端接口说明

本轮全站 tab 优化新增或强化了这些生产接口：

```text
GET  /api/search              搜索结果现在包含 rowId、sourceAlias、bvid，行内复制按 rowId 定位
GET  /api/tabs/overview       六个主 tab 的实时概览，供优化预览页和后续总览页使用
GET  /api/song-growth         返回 combinedRows、anomalies、cache，并按 SONG_GROWTH_CACHE_TTL_MS 缓存
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
http://127.0.0.1:8080/check
http://127.0.0.1:8080/growth
```

接口检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/api/tabs/overview
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/api/song-growth
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8080/api/search?page=1&pageSize=1"
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
- 涉及数据或部署时必须核对来源数、曲目数和关键 BV 是否存在，推荐用 `npm run check:live -- --min-total=<发布前总量> --require-bv=BV1xd5g61Egu`。



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

