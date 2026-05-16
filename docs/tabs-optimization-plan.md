# 全站 Tab 优化方案预览

本文面向 `culua.com` 当前主导航中的六个页面：

```text
首页 | 数据 | BV查重 | 歌名歌手查重 | 命名工具 | 日报
```

本次使用独立 HTML 预览承载信息架构，不替换生产页面；同时已把预览页依赖的后端概览、增长缓存、查重摘要和稳定行标识接入正式服务。

## 功能说明

`tabs-optimization-preview.html` 解决的问题是把分散在六个页面里的优化方向集中成一个可浏览原型，并通过 `/api/tabs/overview` 读取真实后端指标：

- 首页：保留现有服务端分页和导出接口思路，搜索结果增加 `rowId`，行级复制不再用 BV 定位。
- 数据：复用服务端统计聚合缓存，并在全站概览里输出统计摘要、缺失歌手来源和缓存参数。
- BV查重：强化批量输入、解析反馈、分组结果和复制预设；服务端限制未知 BV 的 live fallback 数量。
- 歌名歌手查重：强化宽容匹配、冲突分级和批量复制；服务端识别“歌手疑似不一致”。
- 命名工具：把解析、候选确认、异常修正拆成更清楚的工作台流程；服务端返回候选 summary。
- 日报：把总量、日增、来源贡献和异常回退检查做成可扫读的日报视图；服务端返回 `combinedRows`、`anomalies` 和缓存元信息。

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
| `dup-check-core.js` | 查重共享前端逻辑 | 增加复制预设、安全转义和歌手不一致状态展示 | 被 BV 查重和歌名歌手查重共用 |
| `bili-check-title-artist.js` | 命名工具共享逻辑 | 候选渲染时转义歌名、歌手和来源文本 | 被命名工具页面使用 |
| `docs/tabs-optimization-plan.md` | 本说明文档 | 记录预览页目标、后端能力、使用方式、文件清单和验证方式 | 被 `README.md` 与 `docs/file-manifest.md` 引用 |

## 注意事项

- 预览页仍不是生产入口；真实指标来自 `/api/tabs/overview`，静态文本仅用于说明布局方向。
- 后续真正改造正式页面时，应按页面分批落地，避免一次性重写所有工具页。
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
