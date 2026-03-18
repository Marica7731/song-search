# song-search

面向 B 站歌切场景的歌曲检索与管理工具，支持：
- 多来源歌曲检索
- 去重与查重
- 歌名-歌手查询/校验
- 统计与排行

## 在线地址
- 主站首页：[https://marica7731.github.io/song-search/](https://marica7731.github.io/song-search/)
- 统计页：[https://marica7731.github.io/song-search/stats.html](https://marica7731.github.io/song-search/stats.html)

## 页面结构（当前）

### 1) 主页面
- `index.html`：歌曲检索、筛选、分页、单条复制、批量复制

### 2) 三个独立模块（已拆分）
- `bv-dup-check.html`：BV 号查重
- `title-artist-dup-check.html`：歌名-歌手查重
- `title-artist-check.html`：歌名-歌手查询/校验（支持改名重查、网易云搜索辅助）

### 3) 其他页面
- `stats.html`：统计与排行
- `converter.html`：数据转换辅助页
- `bili-check.html`：旧综合页（保留）

## 最近更新

### 模块拆分
- 新增 3 个独立页面，便于分模块维护。
- 全站头部已加入模块导航（首页/统计/转换页也可跳转）。

### 查询/校验增强
- 未命中歌曲时，支持“改名重查”。
- 提供网易云搜索跳转辅助人工核对。
- 多候选默认选择来源最多，来源数相同按靠前项。

### index 复制增强
- 增加可选复制字段：歌名、歌手、合集、来源、链接
- 支持“仅复制有歌手”
- 支持“纯文本 / 表格（TSV）”
- 纯文本默认空格分隔，支持自定义分隔符

## 本地运行

请不要直接双击 `html` 用 `file://` 打开。  
页面依赖 `fetch('data/...')`，需通过 HTTP 服务访问。

在项目根目录执行：

```bash
python -m http.server 8000
```

然后访问：
- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/bv-dup-check.html`
- `http://127.0.0.1:8000/title-artist-dup-check.html`
- `http://127.0.0.1:8000/title-artist-check.html`

## 数据与脚本

- `data/index.json`：数据文件索引
- `data/*.js`：分片歌曲数据（当前约 20+ 文件）
- `scripts/update-songs.js`：采集/更新脚本

## GitHub Pages 性能建议（推荐）

当前是“多文件并行加载”。当 `data/*.js` 数量较多时，首次加载会有明显请求开销。  
建议按下面顺序优化：

1. 预构建合并数据  
将 `data/*.js` 合并为单文件（如 `data/all-songs.json`），前端优先加载 1 个请求。

2. 本地缓存  
首屏加载后写入 IndexedDB（或 localStorage），后续读取缓存秒开。

3. 版本号策略  
在 `index.json` 记录 `version/hash`；版本未变直接用缓存，版本变化再拉新数据。

4. 保留降级逻辑  
若单文件加载失败，再回退到旧的分片加载，保证可用性。

## 开发与提交流程

```bash
git add .
git commit -m "your message"
git pull --rebase origin main
git push origin main
```

如果 `push` 被拒绝，通常是远端有新提交，先 `pull --rebase` 再推即可。

