# 文件清单

本文描述 `culua.com` 歌站本体的主要文件。路径均以项目根目录 `C:\Users\终焉\Documents\culua_web_h5` 为基准。

## 根目录页面与共享模块

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `README.md` | 项目入口说明 | 说明功能、运行方式、测试方式、维护边界和文档索引 | 链接 `docs/migration-handoff.md` 与 `docs/file-manifest.md` |
| `.gitignore` | 本地忽略规则 | 忽略运行缓存、日志、临时截图、下载目录、runtime、`.env` | 防止本地开发产物进入后续提交；不取消已跟踪文件 |
| `index.html` | 首页与歌曲检索页 | 按歌名、歌手、合集、来源筛选；分页；复制结果 | 读取 `/api/bootstrap` 或 `data/index.json`，使用 `site-theme.css` |
| `stats.html` | 数据统计页 | 展示来源、歌手、曲目、投稿时间等统计视图 | 优先请求 `/api/stats/view`，服务端不可用时回退本地数据 |
| `bv-dup-check.html` | BV 查重页面 | 接收 BV 列表，输出已存在和未命中的结果 | 依赖 `dup-check-core.js` 与 `artist-match.js` |
| `title-artist-dup-check.html` | 歌名歌手查重页面 | 批量检查“歌名 - 歌手”是否已入库 | 依赖 `dup-check-core.js` 与 `artist-match.js` |
| `title-artist-check.html` | 命名和校验工具 | 校验歌名歌手组合，提供改名重查和搜索辅助 | 依赖 `bili-check-title-artist.js`、`page-directory-widget.js` |
| `bili-check.html` | 旧综合页 | 保留旧版综合检查入口 | 与新拆分页面共享部分解析和查重逻辑 |
| `song-growth.html` | 歌曲总量日报页 | 展示曲库总量、日增、按投稿时间增长 | 由 `scripts/update-song-growth.js` 更新，读取 `reports/song-growth-history.json` |
| `converter.html` | 辅助转换页 | 提供文本或格式转换辅助 | 独立静态页，共用站点样式 |
| `admin-singer-config.html` | 来源配置后台 | 管理员维护来源/BV 配置并触发刷新 | 依赖服务端管理接口、`admin-refresh-control.js` 和 hash token |
| `site-theme.css` | 共享样式 | 页面布局、表格、按钮、状态提示、响应式样式 | 被多个 HTML 页面引用 |
| `page-directory-widget.js` | 页面目录组件 | 生成浮动目录、移动端目录按钮、滚动定位 | 被长页面和校验工具复用 |
| `last-run-badge.js` | 最近更新状态角标 | 读取更新元信息并展示最近刷新时间 | 读取 `/api/update-meta` 或相关后端数据 |
| `admin-refresh-control.js` | 管理刷新控件 | 读取 token、显示刷新状态、触发服务端刷新 | 配合 `admin-singer-config.html` 和 `server.js` 管理接口 |

## 查重与解析逻辑

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `artist-match.js` | 歌手宽容匹配逻辑 | `normalizeString`、假名/罗马音转换、`areArtistsCompatible`、`isSameSong` | 被浏览器页面、`server.js`、`scripts/check-song-library.js` 共用 |
| `dup-check-core.js` | 查重公共逻辑 | 读取歌库、解析 BV 或歌名歌手输入、查重、复制结果、AI 辅助复制 | 被 `bv-dup-check.html` 和 `title-artist-dup-check.html` 复用 |
| `bili-check-title-artist.js` | 命名/校验辅助 | 解析输入、请求标题查询、生成候选歌手、生成校验结果文本 | 被 `title-artist-check.html` 和旧综合页相关流程使用 |

## 服务端

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `server.js` | Node HTTP 服务端 | 静态资源服务、路由别名、`/api/bootstrap`、`/api/stats/view`、查重/命名 API、管理刷新 API、`/internal/reload` | 读取 `data/`、`reports/`、`scripts/singer-configs.json`；调用 `/usr/local/bin/song-search-refresh.sh` |
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

## 服务器外部文件

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `/var/www/song-search` | 服务器工作目录 | 运行 `culua.com` 歌站服务 | 应跟随 `origin/codex/server-deploy` |
| `/usr/local/bin/song-search-refresh.sh` | 服务器刷新脚本 | 拉取部署分支、重建歌库和增长日报、调用 `/internal/reload` | 被定时任务、管理后台或手动命令触发 |
| `/etc/systemd/system/song-search.service` | systemd 服务 | 管理 Node 服务进程和端口 | 服务端默认公网反代到本地 `3230` |
| `/root/.secrets/song-search-admin-token` | 管理 token | 服务器本地读取的管理凭据 | 不进入仓库，不写入文档示例 |
