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

- `index.html`：歌库首页，支持按歌名、歌手、来源、合集搜索，支持分页和复制结果。
- `index-optimized.html`：首页优化原型，使用现有搜索 API 演示新的来源筛选、复制预设和 H5 响应式布局，不替换线上首页。
- `stats.html`：数据统计页，展示来源、歌手、曲目、投稿时间等统计视图。
- `bv-dup-check.html`：BV 批量查重。
- `title-artist-dup-check.html`：按“歌名 - 歌手”批量查重。
- `title-artist-check.html`：命名和校验工具，支持未命中项改名重查和搜索辅助。
- `song-growth.html`：歌曲总量日报和增长趋势。
- `admin-singer-config.html`：来源配置后台，管理员用 token 维护运行时配置和触发刷新。
- `server.js`：统一 Node 服务端，提供静态页面、API、统计视图、管理刷新和内部 reload。

## 在线页面

```text
https://www.culua.com/
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
```

本地服务检查：

```powershell
npm start
```

浏览器访问：

```text
http://127.0.0.1:8080/
http://127.0.0.1:8080/stats
http://127.0.0.1:8080/bv
http://127.0.0.1:8080/check
http://127.0.0.1:8080/growth
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
├─ index-optimized.html             首页优化原型
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
- [文件清单](docs/file-manifest.md)
- [添加来源提示词](docs/add-source-prompt.md)

## 维护注意事项

- 先确认当前目录是真正项目根目录，不要在 `C:\Users\����` 这类乱码路径工作。
- 不要从旧 `C:\Users\终焉\Documents\New project\song-search` 复制文件覆盖本仓库。
- 不要把 GitHub 数据更新任务和 `culua.com` 服务器部署混成同一个任务。
- 不要提交 `downloads/`、`runtime/`、缓存报告、截图、日志、`.env`。
- 改页面后必须用本地 HTTP 或公网验证。
- 涉及数据更新时必须核对来源数、曲目数和关键 BV 是否存在。



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

