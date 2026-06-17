# Culua 术力口歌曲整理 2026-06-17

数据来源：https://www.culua.com/api/search 云端分页结果。生成时没有读取本地 data/*.js 存量文件。

## 结果

- 云端总歌曲数：29904
- 云端去重歌曲数：5925
- 本次判定术力口歌曲条目：4285
- 本次判定术力口去重曲名：824
- 覆盖来源：48
- 生成时间：2026-06-17T15:26:08.058Z

## 文件说明

| 文件 | 说明 |
|---|---|
| `all-vocaloid-songs-2026-06-17.json` | 全部术力口条目，保留云端返回的全部字段，并追加 `pubdateFormatted`、`ctimeFormatted`、`normalizedTitle`、`vocaloidCheck`。 |
| `all-vocaloid-songs-2026-06-17.csv` | 全部术力口条目的 CSV 版，便于筛选和复制。 |
| `source-summary.csv` | 按来源汇总条目数、去重曲名数和对应文件路径。 |
| `sources/*.json` | 每个来源一个 JSON 文件，保留全部字段和核对理由。 |
| `sources-csv/*.csv` | 每个来源一个 CSV 文件，字段与总 CSV 一致。 |
| `sources-md/*.md` | 每个来源一个 Markdown 文件，按上传时间从新到旧排列；每条含可读摘要和完整字段 JSON。 |
| `sources-md/README.md` | Markdown 来源索引，可直接按来源打开对应文件。 |
| `audit-ambiguous-excluded.csv` | 仅合集/视频标题有术力口上下文、但歌名/歌手没有直接证据的排除审计项。 |
| `manifest.json` | 数据来源、抓取参数、判定规则和文件清单。 |

## 判定口径

- 正式结果只采信歌名/歌手字段，不用本地存量数据。
- 不再做同曲名传播，避免 `月光` 这类重名歌曲误纳入。
- 英文音源名按边界核对，已剔除 `Mayumi Gojo` 被 `MAYU` 子串误匹配的情况。
- 命中初音、鏡音、巡音、GUMI、IA、可不、重音テト、VOCALOID、ボカロ等音源/术力口词会直接纳入。
- 只写 P 主时，要求 P 主是歌手主署名，避免把“作曲参与但歌曲本身不是术力口”的条目误收。

## 来源 Top 20

| 来源 | source 文件 | 条目数 | 去重曲名 |
|---|---|---:|---:|
| Figaro | figaro.js | 706 | 168 |
| 非常驻妹妹 | others.js | 419 | 255 |
| 來-Ray- | ray.js | 342 | 239 |
| よしか🦍 | yoshika.js | 316 | 90 |
| 凛々咲 | ririsya.js | 278 | 104 |
| 紅葉丸 | momijimaru.js | 251 | 169 |
| 稀羽すう | suu_usuwa.js | 245 | 99 |
| むんもっしゅ | MunMosh.js | 188 | 68 |
| CULUA | culua.js | 139 | 96 |
| なれたん | naraetan.js | 97 | 59 |
| 天籠りのん | linon.js | 90 | 36 |
| 茨むあん | ibaramuan.js | 85 | 79 |
| 明日夢かなえ | asuyumekanae.js | 79 | 53 |
| 音門るき | otomoneruki.js | 78 | 42 |
| 知悠 | chiyutori .js | 64 | 42 |
| 天ノ譜ステラ | stella.js | 62 | 41 |
| はるこたつぶとん倶楽部 | kotatsu.js | 57 | 40 |
| 朱名 | shuna.js | 56 | 45 |
| nayuta | nayuta.js | 52 | 31 |
| 澄花 | sumica.js | 51 | 22 |

## 去重文件

- `dedup-vocaloid-songs-2026-06-17.csv`：按规范化曲名去重，一行一个曲目，`links_newest_first` 内多链接按上传时间从新到旧排列。
- `dedup-vocaloid-songs-2026-06-17.xlsx`：同内容表格版，已设置列宽、冻结表头、链接列换行。
- `dedup-vocaloid-songs-2026-06-17.json`：去重后的结构化数据。

## 按来源 Markdown

- `sources-md/README.md`：按来源列出所有 Markdown 文件。
- `sources-md/yoshika.md` 等：每个来源独立文件，不与其他来源混合。
- 文件内条目按上传时间从新到旧排列；每条保留歌名、歌手、上传时间、链接、BV、合集、UP、时长、播放、判定理由，并提供完整字段 JSON。
