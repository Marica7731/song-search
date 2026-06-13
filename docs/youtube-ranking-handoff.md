# YouTube 排行页交接说明

## 当前状态

本文只完成 GitHub 编辑通路验证和开发交接说明，尚未实现 YouTube 抓取脚本、静态页面或定时 workflow。

已验证：

- GitHub 仓库可通过 connector 读取和写入。
- 目标发布仓库是 `Marica7731/song-search`。
- 默认发布主线是 `main`，不是 `master`。
- GitHub Pages 已启用，历史入口是 `https://marica7731.github.io/song-search/`。
- 现有 workflow 使用 `GITHUB_TOKEN` 和 `permissions: contents: write` 自动提交到 `main`。
- 本文档分支是 `codex/ytb-ranking-handoff-doc`。

## 仓库与分支

| 项目 | 用途 | 位置 |
| --- | --- | --- |
| GitHub Pages 发布仓库 | 最终新增静态页面、数据文件、定时更新 workflow 的地方 | `https://github.com/Marica7731/song-search` |
| 发布主线 | GitHub Pages / Actions 数据更新主线 | `main` |
| 本地发布仓库路径 | 当前 Windows 设备上的发布仓库 | `C:\Users\终焉\Documents\culua_web_h5` |
| YouTube 插件参考仓库 | 只参考抓取逻辑，不作为发布页面仓库 | `C:\Users\终焉\Documents\Codex\chrome_ytb_plugin` |
| 插件参考分支 | 插件当前工作分支 | `master` |

注意：不要把 `chrome_ytb_plugin` 当成 GitHub Pages 发布仓库。它只用于参考 YouTube 搜索结果页的 DOM 抽取、自动滚动和字段解析逻辑。

## 已确认的 GitHub 信息

- owner/repo：`Marica7731/song-search`
- 远端地址：`https://github.com/Marica7731/song-search.git`
- 默认分支：`main`
- Pages 入口：`https://marica7731.github.io/song-search/`
- 自动提交凭据：优先使用 GitHub Actions 自带的 `GITHUB_TOKEN`
- workflow 权限模式：`permissions: contents: write`

现有 workflow 参考：

- `.github/workflows/update.yml`
- `.github/workflows/song-growth.yml`

这两个 workflow 都是定时运行后检查文件变化，再自动提交到 `main`。YouTube 排行页可以沿用这个模式。

## 插件参考点

参考仓库：`C:\Users\终焉\Documents\Codex\chrome_ytb_plugin`

重点文件：

| 文件 | 用途 | 关键点 |
| --- | --- | --- |
| `src/content.js` | 自动滚动并触发页面结果收集 | `DEFAULT_AUTO_SCROLL_TARGET = 100`，可参考自动滚动停止条件 |
| `src/popup.js` | 插件 UI 调用收集逻辑 | `AUTO_SCROLL_TARGET_COUNT = 100`，`MAX_ITEMS = 1000` |
| `src/extractor.js` | 从 YouTube 搜索结果 DOM 提取视频字段 | `collectFromDocument` 内部 limit 最高 cap 到 `1500` |

实现静态抓取时需要改动逻辑：插件当前会过滤 `即将开始` / upcoming 结果，但新需求的直播页需要展示直播预约和直播，所以排行页抓取脚本不能直接复用该过滤条件。

## 目标页面

计划做 3 个静态页面：

| 页面 | 内容 |
| --- | --- |
| 直播页 | 整合歌枠直播/预约和弾き語り直播/预约 |
| 今日热度页 | 整合今日歌枠热度排行和今日弾き語り热度排行 |
| 本月热度页 | 整合本月歌枠热度排行和本月弾き語り热度排行 |

搜索源：

| 分组 | 关键词 | URL |
| --- | --- | --- |
| live | 歌枠 | `https://www.youtube.com/results?search_query=%E6%AD%8C%E6%9E%A0&sp=CAASAkAB` |
| live | 弾き語り | `https://www.youtube.com/results?search_query=%E5%BC%BE%E3%81%8D%E8%AA%9E%E3%82%8A&sp=CAASAkAB` |
| today | 歌枠 | `https://www.youtube.com/results?search_query=%E6%AD%8C%E6%9E%A0&sp=CAMSBAgCGAI%253D` |
| today | 弾き語り | `https://www.youtube.com/results?search_query=%E5%BC%BE%E3%81%8D%E8%AA%9E%E3%82%8A&sp=CAMSBAgCGAI%253D` |
| month | 歌枠 | `https://www.youtube.com/results?search_query=%E6%AD%8C%E6%9E%A0&sp=CAMSBggEEAEYAg%253D%253D` |
| month | 弾き語り | `https://www.youtube.com/results?search_query=%E5%BC%BE%E3%81%8D%E8%AA%9E%E3%82%8A&sp=CAMSBggEEAEYAg%253D%253D` |

## 建议实现文件清单

| 文件路径 | 文件用途 | 主要职责 | 与其他文件关系 |
| --- | --- | --- | --- |
| `scripts/update-youtube-ranking.js` | YouTube 排行数据抓取脚本 | 用 Playwright 打开 6 个搜索 URL，滚动加载，抽取视频/直播/预约字段，生成静态 JSON | 被 GitHub Actions 调用，输出到 `reports/` 或 `data/` |
| `data/youtube-ranking.json` | 排行数据 | 保存 `live`、`today`、`month` 三组结果和更新时间 | 被前端页面读取 |
| `youtube-ranking.html` | 排行入口页 | 提供三个视图入口或默认展示直播页 | 读取 `data/youtube-ranking.json` |
| `youtube-ranking-live.html` | 直播/预约页 | 展示歌枠和弾き語り直播结果 | 读取同一个 JSON 的 `live` 分组 |
| `youtube-ranking-today.html` | 今日热度页 | 展示今日歌枠和弾き語り结果 | 读取同一个 JSON 的 `today` 分组 |
| `youtube-ranking-month.html` | 本月热度页 | 展示本月歌枠和弾き語り结果 | 读取同一个 JSON 的 `month` 分组 |
| `.github/workflows/youtube-ranking.yml` | 定时更新任务 | 安装 Node/Playwright，运行抓取脚本，提交数据和页面变更 | 参考现有 workflow 的 `GITHUB_TOKEN` 自动提交模式 |
| `docs/youtube-ranking-handoff.md` | 本交接文档 | 记录链接、路径、分支、实现边界和验证步骤 | 给换设备开发时使用 |

## 推荐配置

建议先用环境变量控制抓取规模：

```text
YTB_RANKING_TARGET=300
YTB_RANKING_LIMIT=1000
YTB_RANKING_LOCALE=ja-JP
YTB_RANKING_REGION=JP
```

默认抓取条数建议先设为 `300`。插件虽然自动滚动目标是 `100`，但它已有 `1000`/`1500` 的收集上限设计，静态脚本可以从一开始做成可配置。

## 测试说明

本阶段仅验证 GitHub 编辑通路和文档交接，未验证 YouTube 抓取实现。

换设备后建议按顺序验证：

```powershell
git clone https://github.com/Marica7731/song-search.git
cd song-search
git switch -c codex/ytb-ranking-pages origin/main
node --version
npm --version
```

实现抓取脚本后再验证：

```powershell
npm install
node scripts/update-youtube-ranking.js
```

预期输出：

- 生成或更新 `data/youtube-ranking.json`
- 结果中包含 6 个搜索源
- 每个结果保留 YouTube 页面展示顺序
- 直播页保留预约和直播，不误删 upcoming 结果

## 注意事项

- 不要把 `master` 当作发布仓库分支；`master` 只属于插件参考仓库。
- 发布仓库当前主线是 `main`。
- 不要提交临时截图、日志、缓存目录、`.env` 或 Playwright 浏览器缓存。
- 不要把个人 YouTube cookie 写入仓库。若未来必须使用登录态，只能放 GitHub Secrets。
- v1 优先无登录公开抓取；遇到 consent、captcha 或地区差异时，再决定是否加 cookie/secret。
- YouTube 搜索结果顺序视为排行依据，前端不要自行重排。

## 下一步

1. 在发布仓库 `Marica7731/song-search` 从 `origin/main` 新建实现分支。
2. 参考插件的 DOM 抽取逻辑，但保留直播预约项。
3. 新增 Playwright 抓取脚本、JSON 输出、3 个静态页面和定时 workflow。
4. 本地跑通脚本和页面后，再提交实现 PR。
