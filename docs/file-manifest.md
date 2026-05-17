# 文件清单

本文描述 `culua.com` 歌站本体的主要文件。路径均以项目根目录 `C:\Users\终焉\Documents\culua_web_h5` 为基准。

## 根目录页面与共享模块

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `README.md` | 项目入口说明 | 说明功能、运行方式、测试方式、维护边界和文档索引 | 链接 `docs/migration-handoff.md`、`docs/culua-server-guide.md`、`docs/site-optimization-plan.md`、`docs/tabs-optimization-plan.md`、`docs/file-manifest.md` 与 `docs/add-source-prompt.md` |
| `.gitignore` | 本地忽略规则 | 忽略运行缓存、日志、临时截图、下载目录、runtime、`.env` | 防止本地开发产物进入后续提交；不取消已跟踪文件 |
| `index.html` | 优化版首页与歌曲检索页 | 可搜索来源、搜索范围切换、服务端分页、来源数量展示、筛选偏好记忆、桌面紧凑复制工具条、H5 筛选/复制/页面导航底部弹层、移动端紧凑结果卡、来源/歌手视觉分层、结果字段点击复制、稳定行级复制、B站编辑稿件直达 | 读取 `/api/bootstrap`、`/api/search`；来源数量优先使用 `sourceStats.totalSongs`；行内整行复制使用服务端 `rowId`；字段复制使用结果项内的 `data-copy-value`；桌面复制全部调用 `/api/search/export`；H5 复制默认只处理当前页结果；编辑按钮使用 BV 号跳转 B站稿件编辑页；本地偏好写入浏览器 `localStorage` |
| `index-optimized.html` | 首页优化对照文件 | 与 `index.html` 保持同源，便于后续继续调样式或回看优化方案 | 配合 `docs/site-optimization-plan.md`；正式入口仍是 `index.html` |
| `tabs-optimization-preview.html` | 六个主 tab 的优化方案预览 | 展示首页、数据、BV 查重、歌名歌手查重、命名工具、日报的目标布局、优化优先级、移动端形态和实时后端概览 | 配合 `docs/tabs-optimization-plan.md`；读取 `/api/tabs/overview`，不替换正式页面 |
| `stats.html` | 数据统计页 | 展示来源、歌手、曲目、投稿时间等统计视图，左侧提供来源统计/歌曲排行/歌手聚合的数据导航，并记住 tab、来源、关键词和摘要链接数；歌曲排行使用标题区、指标区和场次预览区，来源/歌手分组使用紧凑歌曲行 | 优先请求 `/api/stats/view`，服务端不可用时回退本地数据；接入共享外壳和数据页专用视觉样式；本地视图偏好写入浏览器 `localStorage` |
| `bv-dup-check.html` | BV 查重页面 | 接收 BV 列表，输出已存在和未命中的结果，提供复制预设入口和折叠式高级复制字段 | 依赖 `dup-check-core.js` 与 `artist-match.js`；服务端 `/api/dup-check` 限制未知 BV live fallback |
| `title-artist-dup-check.html` | 歌名歌手查重页面 | 批量检查“歌名 - 歌手”是否已入库，展示歌手疑似不一致分组，提供复制预设入口、折叠式高级复制字段和更干净的输入区 | 依赖 `dup-check-core.js` 与 `artist-match.js` |
| `title-artist-check.html` | 命名和校验工具 | 校验歌名歌手组合，提供改名重查、搜索辅助、已确认/需要确认/缺歌手/待入库/未找到状态筛选、当前可见结果复制和待处理项网易云搜索 | 依赖 `bili-check-title-artist.js`；服务端 `/api/title-artist/lookup` 返回 summary；正式页面首屏直接包含共享外壳 |
| `bili-check.html` | 旧综合页 | 保留旧版综合检查入口 | 与新拆分页面共享部分解析和查重逻辑 |
| `song-growth.html` | 歌曲总量日报页 | 展示曲库总量、日增、按投稿时间增长，支持复制当前区间摘要和当前表格页 TSV | 由 `scripts/update-song-growth.js` 更新；读取 `/api/song-growth` 的 `combinedRows`、`anomalies` 和缓存元信息 |
| `converter.html` | 辅助转换页 | 提供文本或格式转换辅助 | 独立静态页，共用站点样式 |
| `admin-singer-config.html` | 来源配置后台 | 管理员维护来源/BV 配置并触发刷新 | 依赖服务端管理接口、`admin-refresh-control.js` 和 hash token |
| `site-theme.css` | 共享样式 | 页面布局、纯文字 `culua.com` 品牌、表格、按钮、状态提示、数据页排行/分组卡片、H5 紧凑导航和响应式样式 | 被多个 HTML 页面引用；正式工具页使用版本号查询串加载，避免线上缓存留在旧视觉 |
| `site-shell.js` | 正式工具页共享外壳兜底 | 同步当前页导航高亮；仅在页面没有静态壳层时才回退包裹 DOM，并使用纯文字 `culua.com` 品牌 | 被 `stats.html`、`bv-dup-check.html`、`title-artist-dup-check.html`、`title-artist-check.html`、`song-growth.html` 以 `defer` 引入；正式页首屏 HTML 已直接包含共享外壳，避免旧页面闪烁 |
| `page-directory-widget.js` | 页面目录组件 | 生成浮动目录、移动端目录按钮、滚动定位 | 被长页面和校验工具复用 |
| `last-run-badge.js` | 最近更新状态角标 | 读取更新元信息并展示“最近更新”时间，避免暴露 `update-songs` 等技术文案 | 读取 `/api/update-meta` 或相关后端数据 |
| `admin-refresh-control.js` | 管理刷新控件 | 读取 token、显示刷新状态、触发服务端刷新 | 配合 `admin-singer-config.html` 和 `server.js` 管理接口 |

## 查重与解析逻辑

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `artist-match.js` | 歌手宽容匹配逻辑 | `normalizeString`、假名/罗马音转换、`areArtistsCompatible`、`isSameSong` | 被浏览器页面、`server.js`、`scripts/check-song-library.js` 共用 |
| `dup-check-core.js` | 查重公共逻辑 | 读取歌库、解析 BV 或歌名歌手输入、查重、分组渲染、复制预设、复制设置持久化、AI 辅助复制、安全转义结果文本 | 被 `bv-dup-check.html` 和 `title-artist-dup-check.html` 复用 |
| `bili-check-title-artist.js` | 命名/校验辅助 | 解析输入、请求标题查询、生成候选歌手、按行级结果保存选择、按“已确认/需要确认/缺歌手/待入库/未找到”筛选候选、按用户输入优先并在未提供/未知/库中更详细时优先使用库中值、同步候选选择到修正输入框、生成校验结果文本、只对待处理项打开网易云搜索、安全转义候选内容 | 被 `title-artist-check.html` 和旧综合页相关流程使用 |

## 服务端

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `server.js` | Node HTTP 服务端 | 静态资源服务、路由别名、`/api/bootstrap`、`/api/search`、`/api/search/export`、`/api/tabs/overview`、`/api/stats/view`、查重/命名 API、增长缓存、管理刷新 API、`/internal/reload` | 读取 `data/`、`reports/`、`scripts/singer-configs.json`；`/m` 和 `/h5` 指向响应式首页；调用 `/usr/local/bin/song-search-refresh.sh` |
| `package.json` | 根目录 npm 脚本 | `npm start` 启动服务，`npm run check:library` 检查歌库 | 无根目录外部依赖；脚本依赖在 `scripts/package.json` |

## 数据与报告

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `data/*.js` | 分来源歌曲数据 | 每个文件向 `window.SONG_DATA` 注入对应来源歌曲 | 由 `scripts/update-songs.js` 生成，页面和服务端读取 |
| `data/index.json` | 歌库索引 | 记录数据文件列表、来源、总量等索引信息 | 由 `scripts/update-songs.js` 生成，首页和服务端启动时读取 |
| `reports/song-growth-history.json` | 增长历史 | 保存曲库总量和增长统计历史 | 由 `scripts/update-song-growth.js` 更新，被 `song-growth.html` 和 README 日报读取 |
| `reports/bv-metadata-cache.json` | BV 元数据缓存 | 缓存 B 站接口结果，降低重复请求 | 运行缓存，已忽略，不应提交 |
| `reports/update-songs-meta.json` | 更新元信息 | 记录最近刷新时间和结果 | 运行缓存，已忽略，不应提交 |

## 脚本

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `scripts/singer-configs.json` | 来源/BV 配置 | 配置来源别名、文件名、入口 BV；可用 `sectionTitle` / `sectionTitles` 收录指定合集小节，用 `excludeSectionTitle` / `excludeSectionTitles` 排除指定小节 | `scripts/update-songs.js` 的主要输入；服务器也可用 `/var/lib/song-search/singer-configs.json` 覆盖运行时配置 |
| `scripts/update-songs.js` | 歌库抓取生成脚本 | 读取来源配置、拉取 B 站元数据、解析分 P、按合集小节过滤来源、生成 `data/*.js` 和 `data/index.json` | 服务器刷新脚本、GitHub Actions、本地数据更新都会调用 |
| `scripts/update-song-growth.js` | 增长日报生成脚本 | 读取歌库数据，更新 `reports/song-growth-history.json`、`song-growth.html` 和 README 日报段落 | GitHub Actions `song-growth.yml` 调用 |
| `scripts/check-song-library.js` | 歌库检查脚本 | 统计数据文件数、总曲数、去重曲数、缺失歌手数 | 本地提交前和数据更新后验证使用 |
| `scripts/package.json` | 脚本依赖定义 | 声明 `cheerio`、`puppeteer` 等抓取依赖 | 只服务 `scripts/` 下的数据抓取脚本 |
| `scripts/package-lock.json` | 脚本依赖锁定 | 锁定 `scripts/package.json` 的依赖版本 | 与 `scripts/package.json` 配套 |
| `scripts/node_modules/` | 已跟踪的脚本依赖目录 | 当前仓库历史中已经包含的依赖文件 | 不建议在普通任务中清理；新增依赖应先确认策略 |

## 工具与自动化

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `tools/serve-local.js` | 本地静态服务辅助 | 启动轻量本地 HTTP 服务 | 用于需要静态文件服务的页面验证 |
| `tools/take-live-screenshots.js` | 页面截图辅助 | 打开线上或本地页面并截图 | 用于页面改动后的视觉核对 |
| `.github/workflows/update.yml` | 自动更新歌库工作流 | 定时或手动运行 `scripts/update-songs.js`，把数据提交到 `main` | 不等同于 `culua.com` 服务器部署流程 |
| `.github/workflows/song-growth.yml` | 增长日报工作流 | 定时或手动运行 `scripts/update-song-growth.js` | 更新 README、`song-growth.html`、增长历史 |

## 文档

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `docs/migration-handoff.md` | 迁移交接文档 | 记录本地目录、服务器目录、部署流程和风险边界 | 新会话接手前先读 |
| `docs/culua-server-guide.md` | culua 服务器使用指南 | 固定 SSH alias、服务器目录、部署命令、刷新脚本、验证方式和安全边界 | 供后续 AI 接手服务器、推送部署分支和发布歌站代码时首读 |
| `docs/site-optimization-plan.md` | 首页优化方案 | 记录当前首页性能观察、已落实内容、后续重构路线和 H5 访问建议 | 配合 `index.html` 和 `index-optimized.html` 做后续评审 |
| `docs/tabs-optimization-plan.md` | 全站 Tab 优化方案预览 | 记录六个主 tab 的预览目标、已落地后端能力、使用方式、文件说明、注意事项和测试方式 | 配合 `tabs-optimization-preview.html` 确认下一阶段正式页面改造方向 |
| `docs/file-manifest.md` | 文件清单 | 说明主要文件用途、职责和相互关系 | 被 README 引用 |
| `docs/add-source-prompt.md` | 添加来源提示词 | 固定 GitHub main 和 `culua.com` 部署分支的不同添加方式、验证方式和提交要求 | 供后续 AI 添加来源时复制使用，避免混用代码路径 |

## 服务器外部文件

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `/var/www/song-search` | 服务器工作目录 | 运行 `culua.com` 歌站服务 | 应跟随 `origin/codex/server-deploy` |
| `/usr/local/bin/song-search-refresh.sh` | 服务器刷新脚本 | 拉取部署分支、重建歌库和增长日报、调用 `/internal/reload` | 被定时任务、管理后台或手动命令触发 |
| `/etc/systemd/system/song-search.service` | systemd 服务 | 管理 Node 服务进程和端口 | 服务端默认公网反代到本地 `3230` |
| `/root/.secrets/song-search-admin-token` | 管理 token | 服务器本地读取的管理凭据 | 不进入仓库，不写入文档示例 |
