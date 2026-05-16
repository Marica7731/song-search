# 全站 Tab 优化方案预览

本文面向 `culua.com` 当前主导航中的六个页面：

```text
首页 | 数据 | BV查重 | 歌名歌手查重 | 命名工具 | 日报
```

本次先输出独立 HTML 预览，不替换生产页面。预览文件用于确认信息架构、控件密度、移动端形态和后续改造优先级。

## 功能说明

`tabs-optimization-preview.html` 解决的问题是把分散在六个页面里的优化方向集中成一个可浏览原型：

- 首页：保留现有服务端分页和导出接口思路，进一步压缩首屏筛选区，修复行级复制来源错误风险。
- 数据：把统计页从大表格切成概览、榜单、来源明细和异常检查，降低一次渲染 DOM 压力。
- BV查重：强化批量输入、解析反馈、分组结果和复制预设。
- 歌名歌手查重：强化宽容匹配、冲突分级和批量复制。
- 命名工具：把解析、候选确认、异常修正拆成更清楚的工作台流程。
- 日报：把总量、日增、来源贡献和异常回退检查做成可扫读的日报视图。

## 使用方法

启动本地服务：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
node server.js
```

打开预览：

```text
http://127.0.0.1:8080/tabs-optimization-preview.html
```

预览页是静态 HTML，不写入数据、不调用管理接口、不改变线上行为。

## 文件说明

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `tabs-optimization-preview.html` | 六个 tab 的优化原型 | 展示统一导航、每页核心指标、工作台布局、优化优先级和移动端布局 | 只作为方案预览，不替换 `index.html`、`stats.html` 等正式页面 |
| `docs/tabs-optimization-plan.md` | 本说明文档 | 记录预览页目标、使用方式、文件清单和验证方式 | 被 `README.md` 与 `docs/file-manifest.md` 引用 |
| `README.md` | 项目入口说明 | 增加预览页入口和文档索引 | 供后续接手时快速找到方案 |
| `docs/file-manifest.md` | 文件清单 | 增加预览页和本文档的职责说明 | 维持项目结构说明完整 |

## 注意事项

- 预览页不是生产实现，不要把里面的静态示例数据当成真实歌库结果。
- 后续真正改造正式页面时，应按页面分批落地，避免一次性重写所有工具页。
- 首页生产页已经依赖 `/api/search` 和 `/api/search/export`，后续首页优化应继续复用现有服务端接口。
- 查重和命名工具仍应复用 `dup-check-core.js`、`artist-match.js`、`bili-check-title-artist.js`，不要在 HTML 里重写核心匹配逻辑。
- 改正式页面后必须用本地 HTTP 或公网验证，不要用 `file://` 判断成功。

## 测试说明

基础检查：

```powershell
node --check server.js
git diff --check
```

预览页检查：

```powershell
node server.js
```

然后访问：

```text
http://127.0.0.1:8080/tabs-optimization-preview.html
```

需要确认：

- 六个 tab 都能切换。
- 桌面端左侧导航和右侧内容不重叠。
- 手机宽度下导航收为横向滚动，内容卡片不溢出。
- 页面只展示方案和静态示例，不触发刷新、部署或数据写入。
