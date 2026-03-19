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
- 产物：
  - `data/*.js`
  - `data/index.json`

### 2) GitHub Actions 自动更新
- 工作流：`.github/workflows/update.yml`
- 触发：
  - 定时（每小时）
  - 手动 `workflow_dispatch`
- 行为：
  - 运行 `scripts/update-songs.js`
  - 检查 `data/` 是否有变更
  - 自动提交 `data/*.js data/index.json` 到 `main`

## 本地运行

请不要直接用 `file://` 打开页面，`fetch('data/...')` 会被浏览器安全策略限制。

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
├─ scripts/
│  └─ update-songs.js          # 数据抓取与生成脚本
└─ .github/workflows/
   └─ update.yml               # 自动更新工作流
```

## 维护建议
- 数据改动优先改 `scripts/update-songs.js`（尤其是 `SINGER_CONFIGS`）
- 页面功能改动在对应 HTML / JS 模块内进行
- 推送前建议本地用 HTTP 跑一遍关键页面



<!-- SONG_GROWTH_START -->
## 歌曲总量日报

- 最新总曲数：**18819**
- 更新时间（上海时间）：2026/03/19 23:46:15
- 完整页面：[`song-growth.html`](./song-growth.html)

| 日期 | 总曲数 | 较前一日增量 |
|---|---:|---:|
| 2026-03-19 | 18819 | 0 |
<!-- SONG_GROWTH_END -->
