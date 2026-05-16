# 全站 Tab 优化方案预览

本文面向 `culua.com` 当前主导航中的六个页面：

```text
首页 | 数据 | BV查重 | 歌名歌手查重 | 命名工具 | 日报
```

本次先用独立 HTML 预览承载信息架构，同时已把预览页依赖的后端概览、增长缓存、查重摘要和稳定行标识接入正式服务。当前正式页面也已经开始按“筛选条件、表格/结果、复制”三条横向能力落地优化。

2026-05-16 后续补齐：`/stats`、`/bv`、`/dup`、`/check`、`/growth` 已接入共享页面外壳，正式入口不再只显示旧的文字导航页面；这些正式页现在通过同一批带版本号的共享 UI 资源加载，且首屏 HTML 已直接包含统一壳层，不再依赖 `site-shell.js` 加载后搬 DOM；`/stats` 进一步移除了旧目录浮层和技术化更新文案，统一为首页同款分段 tab、筛选栏、概览卡和列表卡视觉。

## 功能说明

`tabs-optimization-preview.html` 解决的问题是把分散在六个页面里的优化方向集中成一个可浏览原型，并通过 `/api/tabs/overview` 读取真实后端指标：

- 首页：保留现有服务端分页和导出接口思路，搜索结果增加 `rowId`，行级复制不再用 BV 定位。
- 数据：复用服务端统计聚合缓存，并在全站概览里输出统计摘要、缺失歌手来源和缓存参数。
- BV查重：强化批量输入、解析反馈、分组结果和复制预设；服务端限制未知 BV 的 live fallback 数量。
- 歌名歌手查重：强化宽容匹配、冲突分级和批量复制；服务端识别“歌手疑似不一致”。
- 命名工具：把解析、候选确认、异常修正拆成更清楚的工作台流程；服务端返回候选 summary。
- 日报：把总量、日增、来源贡献和异常回退检查做成可扫读的日报视图；服务端返回 `combinedRows`、`anomalies` 和缓存元信息。

## 已落地正式页面能力

| 页面 | 筛选条件 | 表格/结果 | 复制 |
|---|---|---|---|
| 首页 | 记住来源、排序、页大小和搜索字段，URL 参数优先 | 行级复制改用稳定 `rowId`，歌名、歌手、合集、来源、BV 和日期恢复字段点击复制 | 复制区收敛为下拉类型、复制按钮和字段设置，字段、格式、分隔符、复制类型和自定义面板展开状态可记忆 |
| 数据 | 记住 tab、来源、关键词和摘要链接数 | 刷新后回到同一统计视图，接入统一侧栏/H5 顶部导航 | 原有摘要/列表复制继续使用当前视图设置 |
| BV 查重 | 保留全部/非重复筛选 | 高级复制字段折叠，减少主流程干扰，接入统一侧栏/H5 顶部导航 | 复制字段、格式、重复链接位次按 BV 页面保存 |
| 歌名歌手查重 | 保留全部/非重复筛选 | 高级复制字段折叠，歌手不一致状态继续展示，接入统一侧栏/H5 顶部导航 | 复制字段和格式按歌名歌手页面保存 |
| 命名工具 | 新增全部/需要确认/未找到筛选，并用颜色区分异常级别 | 结果区与当前筛选同步，接入静态统一侧栏/H5 顶部导航；同名多行按行级 key 保存选择，避免互相覆盖；候选歌手选择会同步到修正输入框和网易云链接 | 复制收敛为一个“复制”按钮，仅复制当前可见结果；批量网易云只打开当前可见的待处理项 |
| 日报 | 复制摘要跟随当前区间和指标视图 | 表格复制当前分页，接入统一侧栏/H5 顶部导航 | 新增区间摘要和当前表格页 TSV 复制 |

## 已落地后端能力

| 接口 | 作用 | 主要输出 |
|---|---|---|
| `GET /api/tabs/overview` | 六个主 tab 的实时后端概览 | `tabs.home`、`tabs.stats`、`tabs.bv`、`tabs.titleArtistDup`、`tabs.naming`、`tabs.growth` |
| `GET /api/search` | 首页分页搜索 | 每条结果新增 `rowId`、`sourceAlias`、`bvid` |
| `GET /api/song-growth` | 日报数据 | `combinedRows`、`anomalies`、`cache` |
| `POST /api/dup-check` | BV / 歌名歌手查重 | `summary`、`copyPresets`、`liveFallback` |
| `POST /api/title-artist/lookup` | 命名工具候选查询 | `summary.total`、`passed`、`needsReview`、`noResult`、`ambiguous` |

## 使用方法

启动本地服务：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
node server.js
```

打开预览：

```text
http://127.0.0.1:8080/tabs-optimization-preview.html
```

预览页会调用 `/api/tabs/overview` 读取真实概览数据，但不写入数据、不调用管理接口、不改变线上行为。

## 文件说明

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `tabs-optimization-preview.html` | 六个 tab 的优化原型 | 展示统一导航、每页核心指标、工作台布局、优化优先级、移动端布局和实时后端概览 | 只作为方案预览，不替换 `index.html`、`stats.html` 等正式页面 |
| `server.js` | 后端接口 | 增加 `/api/tabs/overview`、搜索 `rowId`、日报缓存、查重摘要和命名摘要 | 支撑正式页面和预览页 |
| `index.html` | 首页正式页面 | 记住筛选条件与自定义复制设置，复制工具条收敛为下拉选择，继续使用 `rowId` 做整行复制，并恢复结果字段点击复制 | 读取 `/api/search` 和 `/api/search/export` |
| `stats.html` | 数据正式页面 | 记住 tab、来源、搜索词和摘要链接数 | 读取 `/api/stats/view`，复制摘要仍基于当前视图 |
| `bv-dup-check.html` / `title-artist-dup-check.html` | 两个查重正式页面 | 折叠高级复制字段，常用复制预设保留在主区域 | 共用 `dup-check-core.js` |
| `dup-check-core.js` | 查重共享前端逻辑 | 增加复制预设、安全转义、复制设置持久化和歌手不一致状态展示 | 被 BV 查重和歌名歌手查重共用 |
| `title-artist-check.html` / `bili-check-title-artist.js` | 命名工具正式页面与共享逻辑 | 增加彩色结果筛选、单一当前结果复制、待处理项网易云批量搜索、候选歌手同步和行级选择 key，并转义候选文本 | 被命名工具页面使用 |
| `song-growth.html` | 日报正式页面 | 增加当前区间摘要复制和当前表格页 TSV 复制 | 读取 `/api/song-growth` |
| `site-shell.js` / `site-theme.css` | 正式页面共享外壳 | 为五个非首页正式页提供统一品牌侧栏、当前页高亮、H5 横向导航、长文本兜底和表单边界控制；`site-shell.js` 只做高亮和无静态壳层时的兜底 | 被 `stats.html`、`bv-dup-check.html`、`title-artist-dup-check.html`、`title-artist-check.html`、`song-growth.html` 引入 |
| `docs/tabs-optimization-plan.md` | 本说明文档 | 记录预览页目标、后端能力、使用方式、文件清单和验证方式 | 被 `README.md` 与 `docs/file-manifest.md` 引用 |

## 注意事项

- 预览页仍不是生产入口；真实指标来自 `/api/tabs/overview`，静态文本仅用于说明布局方向。
- 正式页面优化优先做低风险交互层能力，避免一次性重写所有工具页。
- 首页生产页已经依赖 `/api/search` 和 `/api/search/export`，后续首页优化应继续复用现有服务端接口。
- 查重和命名工具仍应复用 `dup-check-core.js`、`artist-match.js`、`bili-check-title-artist.js`，不要在 HTML 里重写核心匹配逻辑。
- `BV_LIVE_FALLBACK_MAX_PER_REQUEST` 默认 12，用于避免一次查重大量未知 BV 时连续打 B 站接口。
- `SONG_GROWTH_CACHE_TTL_MS` 默认 60000，用于降低日报接口重复聚合开销。
- 改正式页面后必须用本地 HTTP 或公网验证，不要用 `file://` 判断成功。

## 测试说明

基础检查：

```powershell
node --check server.js
node --check dup-check-core.js
node --check bili-check-title-artist.js
git diff --check
```

预览页检查：

```powershell
node server.js
```

然后访问：

```text
http://127.0.0.1:8080/tabs-optimization-preview.html
```

需要确认：

- 六个 tab 都能切换。
- 桌面端左侧导航和右侧内容不重叠。
- 手机宽度下导航收为横向滚动，内容卡片不溢出。
- 页面能显示 `/api/tabs/overview` 返回的真实总曲数、来源数和日报缓存状态。
- 页面不触发刷新、部署或数据写入。
