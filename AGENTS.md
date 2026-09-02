# AGENTS.md

本文件约束本仓库中的自动化维护工作。它描述长期有效的边界和验收方式，不记录单次任务过程。

## 仓库职责

- 本仓库 `Marica7731/song-search` 是“v切片仓库 模拟浏览器版”，`main` 同时承载 GitHub Pages 页面和 GitHub Actions 生成的数据。
- 新站接口版位于独立私有仓库，不要在本仓库混入其服务端代码、部署文件、数据库或运行态数据。
- WDC 只通过 `deploy/wdc/` 中的 systemd 分发器每 10 分钟触发一次 `update.yml`；不要在 WDC 克隆老站或运行 Puppeteer。

## 修改边界

- `data/*.js` 和 `data/index.json` 是生成产物。来源调整应修改 `scripts/update-songs.js` 中的 `SINGER_CONFIGS` 或 `scripts/source-profiles.json`，再由脚本生成数据。
- `reports/github-bv-sampling-state.json` 是不提交的探针状态；不得提交缓存、日志、Cookie、Token、二维码、浏览器配置或其他运行态文件。
- README 中 `SONG_GROWTH` 标记之间的内容由 `scripts/update-song-growth.js` 更新，人工编辑时保留标记。
- 文档只维护当前功能、架构、运行和发布方法，不追加任务流水、日期式交接记录或“本次修改”清单。

## 来源与标题

- 新增或修正来源时，核对 BVID、分 P 总数、首尾页标题、来源账号和视频可访问性；第三方转载不得写成官方来源。
- 普通多 P 视频只有在合集 DOM 不适用且 view API 页数完整时，才使用 `rawDataLoader: "bili-view-api"`。
- 合集规模按完整元数据中的独立 BVID 计数：少于 20 个时不启动候选页面探针；达到 20 个后只探针稿件播放量最低的 3 个 BVID，不做随机或失败补位。
- 单个入口失败时必须保留该来源旧文件，不能用部分结果覆盖完整来源；候选必须覆盖旧文件全部 `BV + 分P` 身份，异常大幅减少也必须经过 `update-songs-guard.js` 门禁。
- `ALLOW_SOURCE_SHRINK=1` 只允许人工确认删除旧身份后的本地单次运行使用，GitHub workflow 不得设置该变量。
- B 站 view API 请求不得重新加入会触发 HTTP 412 的伪浏览器 `User-Agent`；本轮 `0/N` 来源成功时必须以失败退出，不能只因旧文件得到保留就把 Action 标成成功。
- 标题清洗只能删除明确的格式噪声。方括号、圆括号、日文书名号及 `side:A` 等有语义后缀必须保留并增加回归用例。
- 输入框改动要保留 `compositionstart`、`compositionend` 和 `input` 的组合输入语义，并用 Windows 日语 IME 做真实浏览器验证。

## 本地工作流

- 正式工作目录使用 `G:\codex-work`，从 WSL 操作对应的 `/mnt/g/codex-work`；开始前确认 repo root、分支和工作区状态。
- 安装脚本依赖：`cd scripts && npm ci`。
- 定向验证来源：`UPDATE_SONGS_ONLY='<文件名、别名或 BVID>' node scripts/update-songs.js`。
- 页面必须通过本地 HTTP 服务打开，不使用 `file://`。
- 提交前至少执行：

```bash
node --check scripts/update-songs.js
node --check scripts/bilibili-page-api.js
node --check scripts/bvid-probe-selection.js
node --test scripts/update-songs-guard.test.js scripts/bilibili-page-api.test.js scripts/bvid-probe-selection.test.js
node scripts/check-title-cleaning.js
bash deploy/wdc/v-slice-browser-dispatch.test.sh
git diff --check
```

涉及抓取逻辑或来源数据时，再执行相关来源的定向真实更新并检查生成链接范围。

## 提交与发布

- 只暂存本次任务相关文件，使用清晰的中文 commit message；不得覆盖或清理用户的无关改动。
- 直接推送 `main` 前由 `update.yml` 检查远端 HEAD；如果抓取期间 `main` 已前进，本轮跳过过期生成结果并以成功结束，下一轮基于最新提交重跑。不要另建周期调度。
- 数据更新由 WDC 每 10 分钟触发一次完整 `workflow_dispatch`；允许抓取任务重叠，过期结果和可确认的并发写入冲突都跳过写入并成功收敛，真实网络、权限或脚本错误仍须失败。
- 发布完成需要同时检查目标 Action、远端 `main`、GitHub Pages HTTP 状态和实际页面数据。只看到本地测试通过或分发接口 HTTP 204 不算上线完成。
