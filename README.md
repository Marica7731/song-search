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
- GitHub 侧先读取入口稿件的完整合集元数据，跨全部 section 按独立 BVID 计数；不使用页面虚拟列表的可见条数判断合集规模。
- 合集少于 20 个独立 BVID 时只检查规模，不启动候选页面探针，也不覆盖该来源旧文件。达到 20 个后，固定选择稿件播放量最低的 3 个 BVID 抓取 DOM。
- 三个探针都会执行，不随机补位或回退其他 BVID；成功结果仍按解析歌曲数择优，并继续经过来源完整性门禁。
- 普通多 P 视频不具备合集 DOM 时，可在来源配置中设置 `rawDataLoader: "bili-view-api"`，直接读取 B 站 view API 的分 P 标题；目前仅用于 `花丸晴琉` 和 `花鋏キョウ`。
- 探针状态按 `来源文件 + 入口 BV` 保存历史 winner 和当轮播放量，用于异常回退比较，不参与候选排序。
- 同一来源配置的任一入口 BV 失败时，本轮保留已有 `data/<source>.js`，不再用其余入口的部分结果覆盖完整来源。
- 即使所有入口都返回成功，单来源同时减少至少 100 首且回退达到 15% 时也拒绝覆盖；可用 `MIN_SOURCE_DROP_SONGS` 和 `MAX_SOURCE_DROP_RATIO` 调整门禁。
- 仅 GitHub Pages 数据生成使用这套探针逻辑，culua 侧配置和运行方式不受影响。
- 产物：
  - `data/*.js`
  - `data/index.json`（包含文件列表、来源别名和 `sourceProfiles` 头像信息）
  - `reports/github-bv-sampling-state.json`（运行状态文件，不提交）

### 2) GitHub Actions 自动更新
- 工作流：`.github/workflows/update.yml`
- 触发：
  - WDC 每 10 分钟触发一次完整更新，不等待上一轮结束
  - 手动 `workflow_dispatch`
- 行为：
  - 通过 Actions cache 恢复 `reports/github-bv-sampling-state.json`
  - 先运行门禁、多 P API 和标题清洗回归测试
  - 运行 `scripts/update-songs.js`
  - 只检查 `data/*.js` 和 `data/index.json` 是否有变更
  - 更新工作流不设置并发组，每次分发都会完整扫描全部来源；多轮可以重叠
  - 自动提交 `data/*.js data/index.json` 到 `main`；如果抓取期间远端 `main` 已前进，则跳过过期生成结果并以成功结束，下一轮基于最新提交重跑
  - 重叠轮次在可确认的过期或并发写入冲突时跳过写入并成功收敛；如果只有探针状态变化，不触发主分支提交

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

常用运行变量：
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
│                              # BV 探针运行状态，cache 保存，不提交
├─ scripts/
│  ├─ update-songs.js          # 数据抓取与生成脚本
│  ├─ bilibili-page-api.js      # view API 分 P 与合集稿件元数据适配器
│  ├─ bilibili-page-api.test.js # view API 适配器回归测试
│  ├─ bvid-probe-selection.js  # 20-BVID 门槛和最低播放量选择
│  ├─ bvid-probe-selection.test.js # 候选选择回归测试
│  ├─ update-songs-guard.js    # 来源完整性和异常回退门禁
│  ├─ update-songs-guard.test.js # 门禁回归测试
│  ├─ title-cleaning.js        # 保留语义括号后缀的标题清洗规则
│  ├─ check-title-cleaning.js  # 标题清洗回归检查
│  └─ source-profiles.json     # 来源头像与频道覆盖配置
├─ .gitignore                  # 忽略抽样状态文件
├─ deploy/wdc/                 # WDC 每 10 分钟分发器模板
└─ .github/workflows/
   ├─ update.yml               # 歌曲数据更新工作流
   └─ song-growth.yml          # 歌曲总量日报工作流
```

## 维护与发布

- 来源列表和 BV 配置维护在 `scripts/update-songs.js` 的 `SINGER_CONFIGS`；头像与频道信息维护在 `scripts/source-profiles.json`。
- 页面功能修改对应的 HTML 或共享 JS；生成数据不要直接手改。
- 涉及来源时先使用 `UPDATE_SONGS_ONLY` 做定向抓取，核对歌曲数量、分 P 范围和首尾链接，再运行完整更新。
- 推送前执行语法检查、Node 回归测试、分发器测试、标题清洗检查和 `git diff --check`，并通过本地 HTTP 服务检查相关页面。
- `main` 由 GitHub Pages 直接发布。歌曲数据由 WDC 每 10 分钟触发一次完整更新，总量日报由 `song-growth.yml` 维护；并发抓取允许重叠，过期结果或可确认的主分支写入冲突会跳过写入并成功结束。
- WDC 不托管本仓库和 Puppeteer，只保存分发器。分发器部署与验证方法见 [`deploy/wdc/README.md`](./deploy/wdc/README.md)。
- 发布验收同时检查 Action 结果、远端提交和线上页面；仅本地测试通过不代表已经上线。



<!-- SONG_GROWTH_START -->
## 歌曲总量日报

- 最新总曲数：**40587**
- 更新时间（上海时间）：2026/08/31 03:07:17
- 完整页面：[`song-growth.html`](./song-growth.html)

| 日期 | 总曲数 | 较前一日增量 |
|---|---:|---:|
| 2026-08-31 | 40587 | 0 |
| 2026-08-30 | 40587 | 0 |
| 2026-08-29 | 40587 | 0 |
| 2026-08-28 | 40587 | 0 |
| 2026-08-27 | 40587 | <span style="color:#28a745;">+147</span> |
| 2026-08-26 | 40440 | 0 |
| 2026-08-25 | 40440 | <span style="color:#28a745;">+581</span> |
| 2026-08-22 | 39859 | <span style="color:#28a745;">+145</span> |
| 2026-08-21 | 39714 | <span style="color:#28a745;">+2501</span> |
| 2026-08-20 | 37213 | <span style="color:#dc3545;">-1067</span> |
| 2026-08-19 | 38280 | <span style="color:#28a745;">+109</span> |
| 2026-08-18 | 38171 | <span style="color:#dc3545;">-1258</span> |
| 2026-08-17 | 39429 | <span style="color:#dc3545;">-563</span> |
| 2026-08-16 | 39992 | <span style="color:#28a745;">+1345</span> |
<!-- SONG_GROWTH_END -->

