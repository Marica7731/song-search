# 来源展示聚合规则

## 规则

- 以整个来源文件为单位统计曲目数，不按单个 BV 判断。
- 原始来源总曲目数小于等于 100 时，不再作为独立展示来源，统一映射到 `others.js`。
- `others.js` 的显示名是“非常驻妹妹”，展示统计会包含自身和所有被合并的小来源。
- 原始 `song.source` 数据文件不改写；服务端保留 `rawSource/rawSourceStats/sourceDisplayMap`。
- 筛选项、来源列表、来源统计大组使用展示来源口径；歌曲卡片、明细行、复制/导出字段中的“来源”必须显示真实原始来源。
- 条目 API 字段约定：`source/rawSource/sourceAlias` 表示真实来源，`displaySource/displaySourceAlias` 表示筛选分组来源。

## 主要入口

- `server.js`：生成 `sourceDisplayMap`、合并后的 `sourceStats/sourceSongMap/files`；筛选和统计分组使用展示来源，搜索、查重、统计明细、增长明细的条目来源保留真实来源并额外返回 `displaySource`。
- `stats.html`：数据页本地 fallback 使用同一规则聚合来源，并把“非常驻妹妹”放在来源列表底部单独区块。
- `vocaloid.html`：术力口快照页按 `/api/bootstrap` 下发的 `sourceDisplayMap/rawSourceStats` 折叠筛选来源，歌曲卡片显示真实来源。
- `song-growth.html`、`index.html`、`index-optimized.html`、`dup-check-core.js`：来源选择列表把“非常驻妹妹”置底；条目展示优先使用真实来源字段。

## 验证

```powershell
npm run check:library
node --check server.js
```

本地 API 验证时，`/api/bootstrap` 应只返回展示来源列表；`sourceStats["others.js"].memberFiles` 应包含所有被合并的小来源；`/api/search?source=others.js` 应返回 `others.js` 自身和被合并来源的歌曲。被合并来源的条目应满足：

```text
source/rawSource/sourceAlias = 真实来源
displaySource/displaySourceAlias = others.js / 非常驻妹妹
```
