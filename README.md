# song-search

面向 B 站歌切场景的歌曲检索与管理工具。

## 在线页面
- 首页：`/index.html`
- 统计：`/stats.html`
- BV 号查重：`/bv-dup-check.html`
- 歌名-歌手查重：`/title-artist-dup-check.html`
- 歌名-歌手查询/校验：`/title-artist-check.html`
- 旧综合页（保留）：`/bili-check.html`

> 站点地址（GitHub Pages）：  
> [https://marica7731.github.io/song-search/](https://marica7731.github.io/song-search/)

## 当前功能概览

### 查询与筛选
- `index.html` 支持按歌名/歌手/合集/来源搜索
- 支持来源筛选、分页、快速跳页
- 支持单条复制与批量复制

### 批量复制（index）
- 可选字段：歌名、歌手、合集、来源、链接
- 支持“仅复制有歌手”
- 支持“纯文本 / 表格（TSV）”
- 纯文本默认空格分隔，可自定义分隔符

### 三个独立模块
- `bv-dup-check.html`：按 BV 号批量查重
- `title-artist-dup-check.html`：按“歌名 - 歌手”批量查重
- `title-artist-check.html`：歌名-歌手查询/校验
  - 未命中项支持改名重查
  - 提供网易云搜索辅助链接
  - 默认选择来源最多项（并列取靠前）

## 数据更新机制（重要）

`data/` 目录**不是手工维护**，由脚本自动生成。

### 1) 本地更新脚本
- 脚本：`scripts/update-songs.js`
- 配置源：脚本内 `SINGER_CONFIGS`（BV 列表、文件名、别名）
- GitHub 侧采集依赖入口 BV 展开到的小节/合集 BV；每个入口 BV 会单独维护候选池。
- 默认每个入口 BV 随机抽取 2 个候选 BV 抓取 DOM，对比歌曲数量后采用数量更多的结果。
- recent 状态按 `来源文件 + 入口 BV` 记录，优先避开最近几轮抽中过的 BV；候选不足时允许从 recent 中补足。
- 抽样失败时先回退未过滤候选，再回退入口 BV 本身。
- 仅 GitHub Pages 数据生成使用这套抽样逻辑，culua 侧配置和运行方式不受影响。
- 产物：
  - `data/*.js`
  - `data/index.json`
  - `reports/github-bv-sampling-state.json`（运行状态文件，不提交）

### 2) GitHub Actions 自动更新
- 工作流：`.github/workflows/update.yml`
- 触发：
  - 雨云每 20 分钟分发 `workflow_dispatch`
  - 手动 `workflow_dispatch`
- 行为：
  - 通过 Actions cache 恢复 `reports/github-bv-sampling-state.json`
  - 运行 `scripts/update-songs.js`
  - 只检查 `data/*.js` 和 `data/index.json` 是否有变更
  - 多个分发任务可并行执行，不再等待上一轮完成
  - 自动提交 `data/*.js data/index.json` 到 `main`，推送前会 rebase 最新主分支并重试，降低并行任务互相顶掉的概率
  - 如果只有抽样状态变化，不触发主分支提交

## 本地运行

请不要直接用 `file://` 打开页面，`fetch('data/...')` 会被浏览器安全策略限制。

在项目根目录运行数据脚本：

```bash
node scripts/update-songs.js
```

只验证单个来源时可使用过滤变量，过滤内容可匹配来源文件名、别名或入口 BV：

```powershell
$env:UPDATE_SONGS_ONLY='toka10summer'
node scripts/update-songs.js
```

常用抽样变量：
- `GITHUB_BV_SAMPLE_SIZE`：每个入口 BV 的随机抽样数量，默认 `2`
- `GITHUB_BV_RECENT_RUN_WINDOW`：recent 避免重复的轮数，默认 `5`
- `UPDATE_SONGS_ONLY`：本地调试用来源过滤，workflow 不设置

在项目根目录启动 HTTP 服务：

```bash
python -m http.server 8000
```

然后访问：
- `http://127.0.0.1:8000/index.html`

## 目录说明

```text
song-search/
├─ index.html
├─ stats.html
├─ converter.html
├─ bili-check.html
├─ bv-dup-check.html
├─ title-artist-dup-check.html
├─ title-artist-check.html
├─ dup-check-core.js
├─ bili-check-title-artist.js
├─ data/                       # 自动生成数据
├─ reports/
│  ├─ song-growth-history.json  # 歌曲总量日报历史
│  └─ github-bv-sampling-state.json
│                              # BV 抽样运行状态，cache 保存，不提交
├─ scripts/
│  └─ update-songs.js          # 数据抓取与生成脚本
├─ .gitignore                  # 忽略抽样状态文件
└─ .github/workflows/
   └─ update.yml               # 自动更新工作流
```

## 文件清单（本次相关）

| 文件路径 | 文件用途 | 主要函数或模块职责 | 与其他文件的关系 |
|---|---|---|---|
| `scripts/update-songs.js` | GitHub Pages 歌曲数据生成脚本 | `processEntryBvid` 负责入口 BV 候选刷新、抽样、fallback 与胜者选择；`parseRawDataToSongs` 负责 DOM 结果转歌曲；`loadSamplingState` / `saveSamplingState` 负责状态读写 | 读取脚本内 `SINGER_CONFIGS`，写入 `data/*.js`、`data/index.json` 和运行态 `reports/github-bv-sampling-state.json` |
| `.github/workflows/update.yml` | 自动更新工作流 | 每 20 分钟或手动运行脚本；恢复/保存 BV 抽样状态；允许并行运行；只在数据文件变化时提交，推送前 rebase 最新 `main` 并重试 | 调用 `scripts/update-songs.js`，提交 `data/*.js data/index.json` 到 `main` |
| `.gitignore` | 本地和 workflow 的非提交文件规则 | 忽略 `reports/github-bv-sampling-state.json` | 配合 workflow cache，让 recent 状态保留但不刷主分支提交 |
| `README.md` | 项目说明和维护说明 | 说明随机抽样规则、运行方式、测试方法和文件清单 | 作为 GitHub 侧维护入口文档 |

## 维护建议
- 数据改动优先改 `scripts/update-songs.js`（尤其是 `SINGER_CONFIGS`）
- 页面功能改动在对应 HTML / JS 模块内进行
- 推送前建议本地用 HTTP 跑一遍关键页面
- 推送前建议执行：
  - `node --check scripts/update-songs.js`
  - `node scripts/update-songs.js`
  - `git diff --check`



<!-- SONG_GROWTH_START -->
## 歌曲总量日报

- 最新总曲数：**30579**
- 更新时间（上海时间）：2026/06/29 17:00:08
- 完整页面：[`song-growth.html`](./song-growth.html)

| 日期 | 总曲数 | 较前一日增量 |
|---|---:|---:|
| 2026-06-29 | 30579 | <span style="color:#dc3545;">-1451</span> |
| 2026-06-28 | 32030 | <span style="color:#28a745;">+305</span> |
| 2026-06-27 | 31725 | <span style="color:#28a745;">+195</span> |
| 2026-06-26 | 31530 | <span style="color:#28a745;">+102</span> |
| 2026-06-25 | 31428 | <span style="color:#28a745;">+471</span> |
| 2026-06-24 | 30957 | <span style="color:#28a745;">+41</span> |
| 2026-06-23 | 30916 | <span style="color:#28a745;">+73</span> |
| 2026-06-22 | 30843 | <span style="color:#28a745;">+95</span> |
| 2026-06-21 | 30748 | <span style="color:#28a745;">+328</span> |
| 2026-06-20 | 30420 | <span style="color:#28a745;">+443</span> |
| 2026-06-19 | 29977 | 0 |
| 2026-06-18 | 29977 | <span style="color:#28a745;">+181</span> |
| 2026-06-17 | 29796 | <span style="color:#28a745;">+125</span> |
| 2026-06-16 | 29671 | <span style="color:#28a745;">+203</span> |
<!-- SONG_GROWTH_END -->

