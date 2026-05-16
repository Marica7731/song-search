# culua.com 首页优化方案

本文面向 `culua.com` 歌站首页搜索体验优化。当前数据量约 2.5 万首、30 到 40 个来源，已有 `/api/bootstrap` 和 `/api/search` 分页接口。建议先做 UI 与交互重构，再补服务端导出接口，避免一次性大改影响查重、统计和后台配置。

## 当前观察

- 线上首页已经优先走服务端 `/api/search`，分页返回数据。`pageSize=20` 时响应约 10 到 13KB，不是每次搜索都把 2 万多条完整写入页面。
- `/api/bootstrap` 返回来源、别名和统计，约 4 到 5KB，适合做首屏初始化。
- 当前 `复制全部搜索结果` 会请求 `pageSize=10000`，结果大时会拉一个很大的 JSON，再在前端拼复制文本。这是最需要拆出去的重负载路径。
- 来源选择、搜索字段、复制字段现在都以较多单选框/复选框平铺，桌面端占首屏，移动端更拥挤。
- 页面视觉和控件仍偏“脚本工具”，高频动作不够集中：搜索、来源筛选、排序、复制是同一工作流，但分散在多排控件。

## 重构目标

1. 首屏只保留高频路径：关键词、来源、排序、复制预设。
2. 查询始终服务端分页，页面只渲染当前页。
3. 复制动作从“字段平铺”改为“预设优先 + 高级自定义”。
4. 来源从大列表/单选改成可搜索 combobox，适配 40 个左右来源。
5. 移动端使用同一个 H5 版布局或 `/m` 路由，不再让桌面控件自然挤压。
6. 复制全部大结果改为服务端导出或分批流式拉取，避免前端一次接收巨大 JSON。

## 推荐成熟方案

| 问题 | 推荐方案 | 说明 |
|---|---|---|
| 2 万多条数据搜索 | 服务端分页搜索 | 继续使用 `/api/search`，默认 `pageSize=40`，输入防抖和 AbortController 取消旧请求 |
| 大结果复制 | 新增 `/api/search/export` | 服务端直接返回 text/tsv，前端不用收大 JSON 再拼接 |
| 40 个来源选择 | combobox / command palette | 来源可输入过滤，显示来源名和数量，不再平铺单选 |
| 搜索字段 | 默认 title+artist，其他字段收进“范围”菜单 | 降低首屏复杂度，保留高级搜索能力 |
| 复制字段 | 复制预设 | 高频预设如“歌名 - 歌手”“歌名 - 歌手 链接”“TSV”，自定义字段折叠 |
| 长列表渲染 | 当前页分页即可；若改本地全量模式再加虚拟列表 | 现接口已分页，不需要先上虚拟滚动 |
| 移动端 | 响应式 H5 或 `/m` 重定向 | 搜索栏 sticky，结果卡片化，筛选进底部抽屉 |

## 分阶段落地

### 第一阶段：不动服务端，先换首页外壳

- 新增一个新首页原型，例如 `index-optimized.html`。
- 继续调用：
  - `/api/bootstrap`
  - `/api/search`
- 保留现有搜索语法和排序。
- 来源筛选改为可搜索来源列表。
- 复制改为预设 + 高级自定义。
- 移动端用 CSS 改成卡片结果和 sticky 搜索栏。

### 第二阶段：补导出接口

新增接口：

```text
GET /api/search/export?q=&source=&fields=title,artist,link&format=text|tsv&separator=%20&validArtistOnly=1&sort=pubdate_desc
```

服务端复用 `handleSearch` 的过滤和排序逻辑，但直接输出文本：

- `Content-Type: text/plain; charset=utf-8`
- `Content-Disposition: attachment; filename="culua-search.tsv"` 可选
- 可限制最大导出数或返回异步任务状态。

这样“复制全部结果”不再请求 `pageSize=10000` 的大 JSON。

### 第三阶段：H5 访问方案

两种方式都可行：

1. 单页响应式：`/` 同时服务桌面和手机，CSS 用 `@media (max-width: 720px)` 切换为 H5 布局。
2. 独立 H5：新增 `/m` 或 `/h5`，服务器按 UA 或视口提示跳转。

建议先做单页响应式，稳定后再考虑 `/m`。如果做重定向，服务端可在 `server.js` 里对 `/` 判断移动 UA：

```js
const ua = req.headers['user-agent'] || '';
if (pathname === '/' && /Android|iPhone|iPad|Mobile/i.test(ua)) {
  res.writeHead(302, { Location: '/m' });
  res.end();
  return;
}
```

注意不要强制所有移动端跳转，最好保留“桌面版”入口或 query 参数。

## 原型文件

已提供：

```text
index-optimized.html
```

本地预览：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
node server.js
```

访问：

```text
http://127.0.0.1:8080/index-optimized.html
```

该文件只作为原型，不替换现有 `index.html`。

## 文件说明

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `docs/site-optimization-plan.md` | 首页优化方案 | 总结当前瓶颈、成熟替代方案、重构路线和 H5 方案 | 配合 `index-optimized.html` 做后续重构评审 |
| `index-optimized.html` | 优化版首页原型 | 使用现有 `/api/bootstrap` 和 `/api/search` 展示新的搜索、来源筛选、复制和移动端布局 | 不替换生产首页，可本地 HTTP 预览 |
