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
- 搜索框识别输入法合成状态，日文候选确认前不提前刷新结果，合成结束后再执行筛选
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
- 头像源：`scripts/source-profiles.json`（按来源文件名补充头像、YouTube 频道、首字和颜色）
- GitHub 侧采集依赖入口 BV 展开到的小节/合集 BV；每个入口 BV 会单独维护候选池。
- 默认每个入口 BV 随机抽取 3 个候选 BV 抓取 DOM，对比歌曲数量后采用数量更多的结果。
- 普通多 P 视频不具备合集 DOM 时，可在来源配置中设置 `rawDataLoader: "bili-view-api"`，直接读取 B 站 view API 的分 P 标题；目前仅用于 `花丸晴琉` 和 `花鋏キョウ`。
- 有历史成功记录时，上次可靠 winner 固定占用一个抽样名额，其余名额再用于探索，避免 recent 过滤把完整候选排除。
- recent 状态按 `来源文件 + 入口 BV` 记录，优先避开最近几轮抽中过的 BV；候选不足时允许从 recent 中补足。
- 抽样失败时先回退未过滤候选，再回退入口 BV 本身。
- 同一来源配置的任一入口 BV 失败时，本轮保留已有 `data/<source>.js`，不再用其余入口的部分结果覆盖完整来源。
- 即使所有入口都返回成功，单来源同时减少至少 100 首且回退达到 15% 时也拒绝覆盖；可用 `MIN_SOURCE_DROP_SONGS` 和 `MAX_SOURCE_DROP_RATIO` 调整门禁。
- 仅 GitHub Pages 数据生成使用这套抽样逻辑，culua 侧配置和运行方式不受影响。
- 产物：
  - `data/*.js`
  - `data/index.json`（包含文件列表、来源别名和 `sourceProfiles` 头像信息）
  - `reports/github-bv-sampling-state.json`（运行状态文件，不提交）

### 2) GitHub Actions 自动更新
- 工作流：`.github/workflows/update.yml`
- 触发：
  - WDC 每 10 分钟检查一次；仅在没有活动 run 时分发 `workflow_dispatch`
  - 手动 `workflow_dispatch`
- 行为：
  - 通过 Actions cache 恢复 `reports/github-bv-sampling-state.json`
  - 先运行门禁、多 P API 和标题清洗回归测试
  - 运行 `scripts/update-songs.js`
  - 只检查 `data/*.js` 和 `data/index.json` 是否有变更
  - 数据更新与增长日报共用 `song-search-main-writer` 并发组，同一时间只允许一个主分支写任务
  - 自动提交 `data/*.js data/index.json` 到 `main`；如果抓取期间远端 `main` 已前进，则拒绝 rebase 生成文件并等待下一轮基于最新提交重跑
  - 如果只有抽样状态变化，不触发主分支提交

## 本地运行

请不要直接用 `file://` 打开页面，`fetch('data/...')` 会被浏览器安全策略限制。

首次运行先安装脚本依赖：

```bash
cd scripts
npm ci
cd ..
```

在项目根目录运行数据脚本：

```bash
node scripts/update-songs.js
```

只验证单个来源时可使用过滤变量，过滤内容可匹配来源文件名、别名或入口 BV：

```bash
UPDATE_SONGS_ONLY='toka10summer' node scripts/update-songs.js
```

常用抽样变量：
- `GITHUB_BV_SAMPLE_SIZE`：每个入口 BV 的随机抽样数量，默认 `3`
- `GITHUB_BV_RECENT_RUN_WINDOW`：recent 避免重复的轮数，默认 `5`
- `MAX_SOURCE_DROP_RATIO`：允许单来源回退的比例门槛，默认 `0.15`
- `MIN_SOURCE_DROP_SONGS`：触发大幅回退门禁的最少减少曲目数，默认 `100`
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
├─ AGENTS.md                  # 自动化维护边界与验收要求
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
│  ├─ update-songs.js          # 数据抓取与生成脚本
│  ├─ bilibili-page-api.js      # 普通多 P 视频的 view API 适配器
│  ├─ bilibili-page-api.test.js # 多 P API 适配器回归测试
│  ├─ update-songs-guard.js    # 来源完整性和异常回退门禁
│  ├─ update-songs-guard.test.js # 门禁回归测试
│  ├─ title-cleaning.js        # 保留语义括号后缀的标题清洗规则
│  ├─ check-title-cleaning.js  # 标题清洗回归检查
│  └─ source-profiles.json     # 来源头像与频道覆盖配置
├─ .gitignore                  # 忽略抽样状态文件
├─ deploy/wdc/                 # WDC 空闲分发器模板
└─ .github/workflows/
   ├─ update.yml               # 歌曲数据更新工作流
   └─ song-growth.yml          # 歌曲总量日报工作流
```

## 维护与发布

- 来源列表和 BV 配置维护在 `scripts/update-songs.js` 的 `SINGER_CONFIGS`；头像与频道信息维护在 `scripts/source-profiles.json`。
- 页面功能修改对应的 HTML 或共享 JS；生成数据不要直接手改。
- 涉及来源时先使用 `UPDATE_SONGS_ONLY` 做定向抓取，核对歌曲数量、分 P 范围和首尾链接，再运行完整更新。
- 推送前执行语法检查、两组 Node 回归测试、标题清洗检查和 `git diff --check`，并通过本地 HTTP 服务检查相关页面。
- `main` 由 GitHub Pages 直接发布。歌曲数据由 WDC 在没有活动任务时分发 `update.yml`，总量日报由 `song-growth.yml` 维护；两个工作流共用主分支写入并发组。
- WDC 不托管本仓库和 Puppeteer，只保存分发器。分发器部署与验证方法见 [`deploy/wdc/README.md`](./deploy/wdc/README.md)。
- 发布验收同时检查 Action 结果、远端提交和线上页面；仅本地测试通过不代表已经上线。



<!-- SONG_GROWTH_START -->
## 歌曲总量日报

- 最新总曲数：**39859**
- 更新时间（上海时间）：2026/08/22 13:29:50
- 完整页面：[`song-growth.html`](./song-growth.html)

| 日期 | 总曲数 | 较前一日增量 |
|---|---:|---:|
| 2026-08-22 | 39859 | <span style="color:#28a745;">+145</span> |
| 2026-08-21 | 39714 | <span style="color:#28a745;">+2501</span> |
| 2026-08-20 | 37213 | <span style="color:#dc3545;">-1067</span> |
| 2026-08-19 | 38280 | <span style="color:#28a745;">+109</span> |
| 2026-08-18 | 38171 | <span style="color:#dc3545;">-1258</span> |
| 2026-08-17 | 39429 | <span style="color:#dc3545;">-563</span> |
| 2026-08-16 | 39992 | <span style="color:#28a745;">+1345</span> |
| 2026-08-15 | 38647 | <span style="color:#28a745;">+1725</span> |
| 2026-08-14 | 36922 | <span style="color:#dc3545;">-530</span> |
| 2026-08-13 | 37452 | <span style="color:#28a745;">+849</span> |
| 2026-08-11 | 36603 | <span style="color:#dc3545;">-1632</span> |
| 2026-08-10 | 38235 | <span style="color:#28a745;">+2071</span> |
| 2026-08-09 | 36164 | <span style="color:#dc3545;">-1653</span> |
| 2026-08-08 | 37817 | 0 |
<!-- SONG_GROWTH_END -->

