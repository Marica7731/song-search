# 歌曲标题去重异常候选扫描 2026-06-25

## 数据源与方法

- 数据源：`https://www.culua.com/api/all-songs?source=all`
- 查询时间：2026-06-25
- 线上规模：31,320 条投稿歌曲，现行去重总数 6,114。
- 扫描基准：使用当前 `artist-match.js` 的 `normalizeSongTitleKey()` 作为现行标题 key，因此已上线的 `フクロウ` 特化不会再被重复计入候选。
- 扫描目标：
  - 高置信符号差异：同一歌手下，去掉空格、波浪线、标点、括号符号后标题一致，但现行标题 key 仍拆成多个。
  - 需人工确认差异：包含 `ver`、`acoustic`、`piano`、`guitar`、`short`、`movie`、`feat`、声优/CV、括号附注等版本或说明词，可能是真实不同版本。

## 结论

- 高置信符号差异候选：134 组。
- 版本/附注类人工确认候选：11 组。
- 建议下一步不要做全局“忽略所有标点”的归一化。更稳妥的做法是先建立标题 canonical 白名单，把高置信符号差异逐组收敛；版本/附注类只列清单，不自动合并。

## 高置信符号差异候选

| # | 现行 unique key 数 | 总出现 | 标题 / 歌手 / 出现 |
|---|---:|---:|---|
| 1 | 4 | 46 | `secret base ～君がくれたもの～` / ZONE / 18；`secret base～君がくれたもの～` / ZONE / 13；`secret base 〜君がくれたもの〜` / ZONE / 7；`secret base〜君がくれたもの〜` / ZONE / 3；`secret base〜君がくれたもの` / ZONE / 1；`secret base～君がくれたもの` / ZONE / 1 |
| 2 | 4 | 38 | `Departures ～あなたにおくるアイの歌～` / EGOIST / 27；`Departures 〜あなたにおくるアイの歌〜` / EGOIST / 5；`Departures〜あなたにおくるアイの歌〜` / EGOIST / 2；`Departures 〜あなたにおくるアイの歌` / EGOIST / 1；`Departures～あなたにおくるアイの歌～` / EGOIST / 1；`Departures~あなたにおくるアイの歌~` / EGOIST / 1 |
| 3 | 3 | 33 | `渡月橋～君想ふ～` / 倉木麻衣 / 19；`渡月橋 ～君 想ふ～` / 倉木麻衣 / 6；`渡月橋 〜君 想ふ〜` / 倉木麻衣 / 6；`渡月橋～君 想ふ～` / 倉木麻衣 / 2 |
| 4 | 3 | 30 | `rain stops, good-bye` / におP / 27；`rain stops,good-bye` / におP / 2；`rain stops, good -bye` / におP / 1 |
| 5 | 3 | 25 | `RE: I AM` / Aimer / 16；`RE:I AM` / Aimer / 8；`REI AM` / Aimer / 1 |
| 6 | 3 | 23 | `ANGELUS -アンジェラス` / 島谷ひとみ / 21；`ANGELUS-アンジェラス` / 島谷ひとみ / 1；`ANGELUS -アンジェラス-` / 島谷ひとみ / 1 |
| 7 | 3 | 22 | `AXIA～ダイスキでダイキライ` / ワルキューレ / 16；`AXIA ～ダイスキでダイキライ～` / ワルキューレ / 2；`AXIA～ダイスキでダイキライ～` / ワルキューレ / 2；`AXIA ~ダイスキでダイキライ~` / ワルキューレ / 1；`AXIA〜ダイスキでダイキライ〜` / ワルキューレ / 1 |
| 8 | 3 | 17 | `Don't say "lazy"` / 桜高軽音部 / 8；`Don't say lazy` / 桜高軽音部 / 6；`Don't say “lazy”` / 桜高軽音部 / 2；`Don't say"lazy"` / 桜高軽音部 / 1 |
| 9 | 3 | 15 | `津軽海峡・冬景色` / 石川さゆり / 11；`津軽海峡冬景色` / 石川さゆり / 3；`津軽海峡･冬景色` / 石川さゆり / 1 |
| 10 | 3 | 15 | `手紙 〜拝啓 十五の君へ〜` / アンジェラ・アキ / 6；`手紙～拝啓 十五の君へ～` / アンジェラ・アキ / 4；`手紙 ～拝啓十五の君へ～` / アンジェラ・アキ / 2；`手紙～拝啓  十五の君へ～` / アンジェラ・アキ / 1；`手紙～拝啓　十五の君へ～` / アンジェラ・アキ / 1；`手紙 ～拝啓 十五の君へ～` / アンジェラ・アキ / 1 |
| 11 | 3 | 12 | `ワンルーム・オール・ザット・ジャズ` / DATEKEN / 10；`ワンルームオールザットジャズ` / DATEKEN / 1；`ワンルーム・オール・ザット・ジャズ!` / DATEKEN / 1 |
| 12 | 3 | 11 | `サムライハート(Some Like It Hot!!)` / SPYAIR / 8；`サムライハート(Some Like It Hot！)` / SPYAIR / 1；`サムライハート(Some Like it Hot!!)` / SPYAIR / 1；`サムライハート(SomeLikeItHot!!)` / SPYAIR / 1 |
| 13 | 3 | 10 | `闇のBAROQUE -バロック-` / 土屋美紀、下屋則子（シェシェ、ミミ） / 3；`闇のBAROQUE -バロック-` / 土屋美紀、下屋則子(シェシェ、ミミ) / 2；`闇のBAROQUE -バロック` / 土屋美紀、下屋則子（シェシェ、ミミ） / 2；`闇のBAROQUE バロック` / 土屋美紀、下屋則子（シェシェ、ミミ） / 2 |
| 14 | 3 | 8 | `Dear. Mr「F」` / ずっと真夜中でいいのに。 / 6；`Dear Mr 『F』` / ずっと真夜中でいいのに。 / 1；`Dear Mr 「F」` / ずっと真夜中でいいのに。 / 1 |
| 15 | 3 | 7 | `寝・逃・げでリセット` / 柊つかさ(福原香織) / 5；`寝逃げでリセット!` / 柊つかさ(福原香織) / 1；`寝・逃・げでリセット！` / 柊つかさ(福原香織) / 1 |
| 16 | 3 | 6 | `HELLO ～Paradise Kiss～` / YUI / 3；`Hello ～ Paradise Kiss` / YUI / 1；`Hello ～ Paradise Kiss～` / YUI / 1；`HELLO 〜Paradise Kiss〜` / YUI / 1 |
| 17 | 3 | 4 | `灼熱にて純情 (wii-wii-woo)` / 星街すいせい / 2；`灼熱にて純情(wii-wii-woo)` / 星街すいせい / 1；`灼熱にて純情wii-wii-woo` / 星街すいせい / 1 |
| 18 | 3 | 3 | `ReRe` / ASIAN KUNG-FU GENERATION / 1；`Re:Re:` / ASIAN KUNG-FU GENERATION / 1；`Re:Re` / ASIAN KUNG-FU GENERATION / 1 |
| 19 | 2 | 63 | `Butter-Fly` / 和田光司 / 61；`Butter fly` / 和田光司 / 1；`Butter-fly` / 和田光司 / 1 |
| 20 | 2 | 57 | `おジャ魔女カーニバル!!` / MAHO堂 / 51；`おジャ魔女カーニバル！！` / MAHO堂 / 5；`おジャ魔女カーニバル` / MAHO堂 / 1 |
| 21 | 2 | 55 | `IRIS OUT` / 米津玄師 / 48；`IRISOUT` / 米津玄師 / 5；`IRIS　OUT` / 米津玄師 / 1；`Iris out` / 米津玄師 / 1 |
| 22 | 2 | 40 | `NIGHT DANCER` / imase / 15；`Night Dancer` / imase / 14；`NIGHTDANCER` / imase / 11 |
| 23 | 2 | 39 | `Overdose` / なとり / 34；`overdose` / なとり / 4；`over dose` / なとり / 1 |
| 24 | 2 | 38 | `言って。` / ヨルシカ / 34；`言って` / ヨルシカ / 4 |
| 25 | 2 | 38 | `さよーならまたいつか！` / 米津玄師 / 32；`さよーならまたいつか!` / 米津玄師 / 5；`さよーならまたいつか` / 米津玄師 / 1 |

## 版本/附注类人工确认候选

这些候选不建议直接自动合并。它们可能只是符号差异，也可能代表不同编曲、版本、演唱语境或补充说明。

| # | 现行 unique key 数 | 总出现 | 标题 / 歌手 / 出现 |
|---|---:|---:|---|
| 1 | 3 | 11 | `真夜中のドア〜stay with me` / 松原みき / 5；`真夜中のドア Stay With Me (シングルver.)` / 松原みき / 2；`真夜中のドア～stay with me` / 松原みき / 2；`真夜中のドア〜Stay With Me` / 松原みき / 1；`真夜中のドア 〜Stay With Me` / 松原みき / 1 |
| 2 | 2 | 39 | `Overdose` / なとり / 34；`overdose` / なとり / 4；`over dose` / なとり / 1 |
| 3 | 2 | 3 | `DANZEN!ふたりはプリキュア (ver.MaxHeart)` / 五條真由美 / 2；`DANZEN！ふたりはプリキュア(Ver.Max Heart)` / 五條真由美 / 1 |
| 4 | 2 | 3 | `SPiCa -acoustic arrange.ver-` / とくP feat. 初音ミク / 2；`SPiCa (Acoustic ver.)` / とくP feat. 初音ミク / 1 |
| 5 | 2 | 3 | `青と夏(アコースティックver.)` / Mrs. GREEN APPLE / 2；`青と夏(acoustic cover)` / Mrs. GREEN APPLE / 1 |
| 6 | 2 | 3 | `ray(超かぐや姫!Version)` / かぐや,月見ヤチヨ / 2；`ray (超かぐや姫！ Version)` / かぐや,月見ヤチヨ / 1 |
| 7 | 2 | 2 | `シンデレラ (Giga First Night Remix)` / DECO*27 / 1；`シンデレラ(Giga First Night Remix)` / DECO*27 / 1 |
| 8 | 2 | 2 | `なんでもないや(movie ver.)` / 上白石萌音 / 1；`なんでもないや (Movie Ver.)` / 上白石萌音 / 1 |
| 9 | 2 | 2 | `一番の宝物(Yui ver.)` / Girls Dead Monster / 1；`一番の宝物 (Yui ver.)` / Girls Dead Monster / 1 |
| 10 | 2 | 2 | `紋白蝶 feat.石原慎也` / 東京スカパラダイスオーケストラ / 1；`紋白蝶 feat.石原慎也 (Saucy Dog)` / 東京スカパラダイスオーケストラ / 1 |
| 11 | 2 | 2 | `Butter-Fly ～tri.Version～` / 和田光司 / 1；`Butter-Fly~tri.Version~` / 和田光司 / 1 |

## 建议实现策略

1. 短期：增加 `TITLE_CANONICAL_ALIASES` 白名单，只覆盖上方高置信符号差异组；不要把 `normalizeSongTitleKey()` 改成全局忽略所有标点。
2. 中期：把扫描脚本固化为维护工具，输出 `compactKey -> variants`，每次发布前列出新增候选。
3. 高风险候选：`ver`、`acoustic`、`movie ver.`、`feat`、`声優/CV`、`short`、`piano/guitar`、`remix` 等只做人工确认，不进入默认自动合并。
4. 验证门槛：每批新增 alias 后，至少验证全库总数变化、目标搜索页去重数、`フクロウ` 仍为 `47 / 1`，并双端同步。
