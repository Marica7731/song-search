# 文件清单

本文描述 `culua.com` 歌站本体的主要文件。路径均以项目根目录 `C:\Users\终焉\Documents\culua_web_h5` 为基准。

## 根目录页面与共享模块

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `README.md` | 项目入口说明 | 说明功能、运行方式、测试方式、维护边界和文档索引 | 链接 `ADD_SOURCE_PROMPT.md`、`docs/migration-handoff.md`、`docs/culua-server-guide.md`、`docs/site-optimization-plan.md`、`docs/tabs-optimization-plan.md`、`docs/file-manifest.md` 与 `docs/add-source-prompt.md` |
| `ADD_SOURCE_PROMPT.md` | 根目录来源添加提示词 | 固定 GitHub Pages 与 `culua.com` 添加来源的不同处理方式、BV 分P/合集判断、runtime 配置同步、发布和验证要求 | 与 `docs/add-source-prompt.md` 互补；新会话添加来源时优先复制本文件 |
| `.gitignore` | 本地忽略规则 | 忽略运行缓存、日志、临时截图、下载目录、runtime、`.env` | 防止本地开发产物进入后续提交；不取消已跟踪文件 |
| `index.html` | 优化版首页与歌曲检索页 | 可搜索来源、来源头像、BV 封面缩略图、搜索范围切换、服务端分页、来源数量展示、来源按曲目数降序排列、刷新默认回到全部来源、最近更新时间展示、筛选偏好记忆、桌面紧凑复制工具条、桌面自适应多列结果卡、H5 非吸顶紧凑检索栏、H5 缩放/横屏宽度多列结果卡、H5 筛选/复制/页面导航底部弹层、移动端紧凑结果卡、封面下方“头像 + 来源名”文本行、日期和 BV 居中 meta chips、自然宽度歌手 chip、结果字段点击复制、单条“歌名 - 歌手”复制、稳定行级复制、B站编辑稿件直达 | 读取 `/api/bootstrap`、`/api/search`；来源头像来自 `sourceProfiles`，缺失时单字兜底，已有头像不叠加首字，全部来源头像文本为 `ALL`；BV 封面来自结果项 `cover` 字段，页面统一转成 160w 展示缩略图并通过 `data-src` 延迟加载；桌面和 H5 结果都把来源作为封面下方的头像加文本展示，日期和 BV 作为居中 meta chips 展示；桌面宽屏和 H5 缩放/横屏的 701px-980px 宽度按自适应列数自然排卡，窄屏单列；H5 顶部检索栏随页面滚动，不占用结果滚动空间；最近更新时间由 `last-run-badge.js` 读取，移动端隐藏该行以节省首屏高度；来源数量优先使用 `sourceStats.totalSongs`；来源选择只保留在当前页面会话，不写入 URL 或本地偏好；行内整行复制使用服务端 `rowId`，并在旧响应缺少 `rowId` 时按当前页临时行号兜底；字段复制使用结果项内的 `data-copy-value`；桌面复制全部调用 `/api/search/export`；H5 复制默认只处理当前页结果；编辑按钮使用 BV 号跳转 B站稿件编辑页；排序、页大小和字段偏好写入浏览器 `localStorage` |
| `index-optimized.html` | 首页优化对照文件 | 与 `index.html` 保持同源，便于后续继续调样式或回看优化方案 | 配合 `docs/site-optimization-plan.md`；正式入口仍是 `index.html` |
| `tabs-optimization-preview.html` | 六个主 tab 的优化方案预览 | 展示首页、数据、BV 查重、歌名歌手查重、命名工具、日报的目标布局、优化优先级、移动端形态和实时后端概览 | 配合 `docs/tabs-optimization-plan.md`；读取 `/api/tabs/overview`，不替换正式页面 |
| `stats.html` | 数据统计页 | 展示来源、歌手、曲目、投稿时间等统计视图，左侧提供来源统计/歌曲排行/歌手聚合的数据导航和带头像来源列表；内容区提供搜索、来源排序和摘要链接数；来源分组显示头像，来源目录同步显示头像，歌曲行和场次预览显示 BV 封面；来源统计可按曲数、场次、场均、独特、去重升降序排序，场均排序会把 `statsAvgSortDeferred` 配置标记的合集型异常来源单独压到末尾；来源统计一次请求全部来源，歌曲排行和歌手聚合继续保留 30 条分页；歌曲排行使用标题区、指标区和场次预览区，来源/歌手分组使用紧凑歌曲行；来源统计、歌曲排行和歌手聚合在桌面端自适应多列排布；提供 `#statsDirectorySlot` 作为右侧目录布局列 | 优先请求 `/api/stats/view`，服务端不可用时回退本地数据；左侧来源列表复用 `fileNames`、`sourceProfiles` 和 `sourceStats`，静态回退时仍可用；接入共享外壳、数据页专用视觉样式和 `page-directory-widget.js` 挂载目录；目录项从来源分组头像读取 `avatarUrl/avatarText/accentColor`；头像、歌曲封面和展开场次封面通过 `data-src` 延迟写入真实地址，隐藏行展开后再触发加载 |
| `bv-dup-check.html` | BV 查重页面 | 接收 BV 列表，输出已收录和未收录结果，提供短输入工作区、当前库/结果概览、复制预设入口、已收录链接位次输入和折叠式高级复制字段；来源选择挂在左侧栏，结果列表自适应多列卡片，目录挂载到右侧布局槽位并只保留关键分区 | 依赖 `dup-check-core.js` 与 `artist-match.js`；服务端 `/api/dup-check` 限制未知 BV live fallback；页面通过带版本号的 `site-theme.css` 和 `dup-check-core.js` 获取 BV 专用概览与卡片布局 |
| `title-artist-dup-check.html` | 歌名歌手查重页面 | 批量检查“歌名 - 歌手”是否已入库，展示歌手疑似不一致分组，提供复制预设入口、已收录链接位次输入、折叠式高级复制字段和更干净的输入区；来源选择挂在左侧栏，结果列表自适应多列卡片，目录挂载到右侧布局槽位 | 依赖 `dup-check-core.js` 与 `artist-match.js`；页面通过带版本号的 `site-theme.css` 获取查重卡片布局 |
| `title-artist-check.html` | 命名和校验工具 | 校验歌名歌手组合，拆成输入与导出、校验结果、目录三块；提供改名重查、搜索辅助、带编号纯歌名输入、已确认/需要确认/缺歌手/待入库/未找到状态筛选、当前可见结果复制、待处理项网易云搜索和右侧目录布局列；目录项使用序号加歌名/歌手两行 chip | 依赖 `bili-check-title-artist.js`；服务端 `/api/title-artist/lookup` 返回 summary；正式页面首屏直接包含共享外壳；目录通过 `#checkDirectorySlot` 挂载，避免浮层覆盖主内容操作按钮；`page-directory-widget.js` 支持目录项 `primary/secondary/badge` 字段 |
| `vocaloid.html` | 术力口静态数据页 | 读取术力口快照 manifest、总表和去重表，展示快照日期、当前歌库日期、来源内术力口去重曲目占比、识别依据、命名辅助、歌曲检索和去重歌名；命名辅助会区分正式识别理由和 `feat/with + 音源理由` 辅助统计 | 读取 `vocaloid-songs-2026-06-17/manifest.json`、`all-vocaloid-songs-2026-06-17.json`、`dedup-vocaloid-songs-2026-06-17.json`；复用 `/api/bootstrap` 的 `fileToAlias/sourceProfiles/sourceStats` 补全来源头像、别名和当前来源去重曲目分母；服务端只通过 `server.js` 增加 `/vocaloid` 静态路由别名 |
| `bili-check.html` | 旧综合页 | 保留旧版综合检查入口 | 与新拆分页面共享部分解析和查重逻辑 |
| `song-growth.html` | 歌曲总量日报页 | 展示曲库总量、日增、去重歌曲数、播放量和按投稿时间增长；总览曲线和“去重歌曲曲线”在桌面端左右并排，去掉大标题以压缩首屏高度；支持切换单指标分析、复制当前区间摘要和当前表格页 TSV | 由 `scripts/update-song-growth.js` 更新；读取 `/api/song-growth` 的 `combinedRows`、`publishUniqueRows`、`anomalies` 和缓存元信息 |
| `converter.html` | 辅助转换页 | 提供文本或格式转换辅助 | 独立静态页，共用站点样式 |
| `admin-singer-config.html` | 来源配置后台 | 管理员维护来源/BV 配置并触发刷新 | 依赖服务端管理接口、`admin-refresh-control.js` 和 hash token |
| `site-theme.css` | 共享样式 | 页面布局、纯文字 `CULUA` 品牌、表格、按钮、状态提示、数据页三栏布局、左侧来源列表、右侧目录列、排行/分组卡片、数据页桌面自适应多列密度布局、H5 非吸顶紧凑导航、H5 当前页胶囊和“页面”展开导航、H5 分组头部右上统计 chips、查重页侧栏来源列表、BV 查重工作区和概览卡、命名工具三模块布局和目录列、查重结果自适应多列封面卡片、统一按钮高度、链接无下划线、延迟图片占位和响应式样式 | 被多个 HTML 页面引用；正式工具页使用版本号查询串加载，避免线上缓存留在旧视觉 |
| `site-shell.js` | 正式工具页共享外壳兜底 | 同步当前页导航高亮；仅在页面没有静态壳层时才回退包裹 DOM，并使用纯文字 `CULUA` 品牌；在 H5 给已有壳层补当前页胶囊和“页面”展开按钮 | 被 `stats.html`、`bv-dup-check.html`、`title-artist-dup-check.html`、`title-artist-check.html`、`vocaloid.html`、`song-growth.html` 以 `defer` 引入；正式页首屏 HTML 已直接包含共享外壳，避免旧页面闪烁 |
| `page-directory-widget.js` | 页面目录组件 | 生成目录、可选目录头像、移动端目录按钮、可关闭抽屉、滚动定位和当前项高亮；支持通过 `mount` 挂载到页面布局列，挂载后桌面目录在保留的右侧列内 sticky 吸顶，未挂载时保持旧的浮动目录行为；目录项可传入 `primary/secondary/badge` 渲染序号加两行 chip | 被长页面、数据页和校验工具复用；数据页来源目录会传入来源头像字段；命名校验目录传入歌名和歌手两行文本 |
| `last-run-badge.js` | 最近更新状态角标 | 读取更新元信息并展示“最近更新”时间，避免暴露 `update-songs` 等技术文案 | 优先读取 `/reports/update-songs-meta.json`，失败时读取 `/api/site-meta`；被首页和各工具页引入 |
| `admin-refresh-control.js` | 管理刷新控件 | 读取 token、显示刷新状态、触发服务端刷新 | 配合 `admin-singer-config.html` 和 `server.js` 管理接口 |

## 查重与解析逻辑

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `artist-match.js` | 歌手宽容匹配逻辑 | `normalizeString`、假名/罗马音转换、`areArtistsCompatible`、`isSameSong` | 被浏览器页面、`server.js`、`scripts/check-song-library.js` 共用 |
| `dup-check-core.js` | 查重公共逻辑 | 读取歌库、解析 BV 或歌名歌手输入、查重、分组渲染、来源头像/数量渲染、结果封面与状态颜色渲染、复制预设、按正负位次选择已收录链接、复制设置持久化、AI 辅助复制、安全转义结果文本 | 被 `bv-dup-check.html` 和 `title-artist-dup-check.html` 复用 |
| `bili-check-title-artist.js` | 命名/校验辅助 | 解析纯歌名、带编号纯歌名、带编号歌名歌手和简写歌名歌手输入，请求标题查询，生成候选歌手，按行级结果保存选择，按“已确认/需要确认/缺歌手/待入库/未找到”筛选候选，按用户输入优先并在未提供/未知/库中更详细时优先使用库中值，同步候选选择到修正输入框，生成校验结果文本，只对待处理项打开网易云搜索，安全转义候选内容 | 被 `title-artist-check.html` 和旧综合页相关流程使用 |

## 服务端

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `server.js` | Node HTTP 服务端 | 静态资源服务、HTML no-store 缓存头、路由别名、`/api/bootstrap`、`/api/search`、`/api/search/export`、`/api/tabs/overview`、`/api/stats/view`、查重/命名 API、未知 BV 分P兜底封面、增长缓存、管理刷新 API、`/internal/reload` | 读取 `data/`、`reports/`、`scripts/singer-configs.json`；`/api/stats/view` 对来源统计默认返回全部来源，对排行和歌手聚合保持分页；`/vocaloid` 指向静态 `vocaloid.html`；`/m` 和 `/h5` 指向响应式首页；调用 `/usr/local/bin/song-search-refresh.sh`；HTML 响应禁用浏览器缓存以减少发布后旧页面残留 |
| `package.json` | 根目录 npm 脚本 | `npm start` 启动服务，`npm run check:library` 检查本地歌库，`npm run check:live` 检查公网总量和关键 BV | 无根目录外部依赖；脚本依赖在 `scripts/package.json` |

## 数据与报告

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `data/*.js` | 分来源歌曲数据 | 每个文件向 `window.SONG_DATA` 注入对应来源歌曲，歌曲记录可带 BV 封面缩略图 `cover` | 由 `scripts/update-songs.js` 生成，页面和服务端读取 |
| `data/index.json` | 歌库索引 | 记录数据文件列表、来源、来源头像 profile、总量等索引信息 | 由 `scripts/update-songs.js` 生成，首页和服务端启动时读取 |
| `reports/song-growth-history.json` | 增长历史 | 保存曲库总量和增长统计历史 | 由 `scripts/update-song-growth.js` 更新，被 `song-growth.html` 和 README 日报读取 |
| `reports/bv-metadata-cache.json` | BV 元数据缓存 | 缓存 B 站接口结果，降低重复请求 | 运行缓存，已忽略，不应提交 |
| `reports/update-songs-meta.json` | 更新元信息 | 记录最近刷新时间和结果 | 运行缓存，已忽略，不应提交 |
| `vocaloid-songs-2026-06-17/manifest.json` | 术力口快照清单 | 记录快照生成时间、分类器规则、总表/去重表路径、匹配投稿数、去重歌名数和覆盖来源数 | 被 `vocaloid.html` 读取，用来标明快照日期和数据口径 |
| `vocaloid-songs-2026-06-17/all-vocaloid-songs-2026-06-17.json` | 术力口总表 | 保存所有命中的术力口投稿，包含歌名、歌手、来源、BV、封面、发布时间和 `vocaloidCheck.reasons` | 被 `vocaloid.html` 的来源占比、识别依据、命名辅助和歌曲检索使用 |
| `vocaloid-songs-2026-06-17/dedup-vocaloid-songs-2026-06-17.json` | 术力口去重表 | 按规范化歌名聚合术力口歌曲，包含出现次数、来源数、歌手变体、最新投稿和识别理由 | 被 `vocaloid.html` 的去重歌名列表和快照概览使用 |

## 脚本

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `scripts/singer-configs.json` | 来源/BV 配置 | 配置来源别名、文件名、入口 BV；可用 `sectionTitle` / `sectionTitles` 收录指定合集小节，用 `excludeSectionTitle` / `excludeSectionTitles` 排除指定小节，用 `excludeBvids` 排除指定合集展开 BV；`archived=true` 可封存来源并保留历史数据可见，此时 `bvids` 可为空 | `scripts/update-songs.js` 的主要输入；服务器也可用 `/var/lib/song-search/singer-configs.json` 覆盖运行时配置 |
| `scripts/source-profiles.json` | 来源头像补充配置 | 按来源文件名补充 `avatarUrl`、`youtubeUrl`、`avatarText`、`accentColor`、`statsAvgSortDeferred`；缺失时由脚本生成来源名单字头像；`statsAvgSortDeferred=true` 的来源在数据页场均排序中排在普通来源之后 | `scripts/update-songs.js` 读取后写入 `data/index.json` 的 `sourceProfiles`；页面和服务端通过 `/api/bootstrap` 使用 |
| `scripts/collect-source-avatars.js` | 来源头像采集脚本 | 读取 `data/*.js` 找每个来源最新 BV，调用 B 站 view API 获取简介，提取 YouTube 频道/视频链接，解析频道头像，支持 `--write` 写回 `scripts/source-profiles.json`、`--update-index` 同步 `data/index.json`、`--report` 输出采集报告 | 可通过 `npm run collect:avatars` 运行；不改变歌曲数据，只更新来源 profile 配置和当前索引中的 `sourceProfiles` |
| `scripts/update-songs.js` | 歌库抓取生成脚本 | 读取来源配置、来源头像配置、拉取 B 站元数据、解析分 P、按合集小节过滤来源、兼容普通多分P BV 和 `with 嘉宾 + 序号` 分P标题、写入 160w BV 封面缩略图、生成 `data/*.js` 和 `data/index.json`；遇到 `archived=true` 的来源允许空 `bvids`，只校验存量 `data/<file>.js` 并跳过刷新 | 服务器刷新脚本、GitHub Actions、本地数据更新都会调用 |
| `scripts/update-song-growth.js` | 增长日报生成脚本 | 读取歌库数据和去重歌曲数，更新 `reports/song-growth-history.json`、`song-growth.html` 和 README 日报段落 | GitHub Actions `song-growth.yml` 调用 |
| `scripts/check-song-library.js` | 歌库检查脚本 | 统计数据文件数、总曲数、去重曲数、缺失歌手数 | 本地提交前和数据更新后验证使用 |
| `scripts/check-live-song-total.js` | 线上歌库回退检查脚本 | 读取公网 `/api/bootstrap` 和 `/api/search`，校验 `totalSongs` 不低于指定值、指定 BV 至少命中一条 | 发布前后和线上故障排查使用，避免只重启服务导致歌库回退 |
| `scripts/package.json` | 脚本依赖定义 | 声明 `cheerio`、`puppeteer` 等抓取依赖 | 只服务 `scripts/` 下的数据抓取脚本 |
| `scripts/package-lock.json` | 脚本依赖锁定 | 锁定 `scripts/package.json` 的依赖版本 | 与 `scripts/package.json` 配套 |
| `scripts/node_modules/` | 已跟踪的脚本依赖目录 | 当前仓库历史中已经包含的依赖文件 | 不建议在普通任务中清理；新增依赖应先确认策略 |

## 工具与自动化

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `tools/serve-local.js` | 本地静态服务辅助 | 启动轻量本地 HTTP 服务 | 用于需要静态文件服务的页面验证 |
| `tools/take-live-screenshots.js` | 页面截图辅助 | 打开线上或本地页面并截图 | 用于页面改动后的视觉核对 |
| `tools/check-mobile-artist-cases.js` | 移动端歌手标签回归脚本 | 用真实搜索词覆盖短英文、短日文、`from`、`feat.`、斜杠组合、超长署名和超长角色表等歌手名，在多种窄宽度下检查歌手标签是否过早折叠，并验证“收边距 -> 缩字号 -> 截断”的压缩链路，输出卡片截图与宽度日志 | 直接验证 `index.html` 的响应式结果卡布局，可对本地 `/`、`/m`、`/h5` 或公网页面运行 |
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
