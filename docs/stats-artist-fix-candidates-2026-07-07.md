# /stats 歌手聚合页错名与重复候选 2026-07-07

## 命名规则

- 分 P 标题统一使用：`序号. 歌名 - 歌手`
- 编辑入口格式：`https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=<BV>`
- 本文件由 `node scripts/scan-stats-artist-issues.js` 生成，默认读取线上 `/api/all-songs`。

## 数据源

- source: `https://www.culua.com/api/all-songs`
- songs: 33811
- high confidence fixes: 21
- duplicate groups listed: 80
- variant groups listed: 113

## 高置信待编辑

| BV | P | 来源 | 当前 | 建议修改 | 编辑链接 |
|---|---:|---|---|---|---|
| `BV1owcoz3Ekw` | 57 | 知悠 | `57. だから僕は音楽辞めた - ヨルシカ` | `57. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| `BV1VZwgz3Eqe` | 3 | なれたん | `03. だから僕は音楽をやめた - ヨルシカ` | `03. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1VZwgz3Eqe |
| `BV1vD421n7oj` | 12 | Figaro | `12. 噓月 - ヨルシカ` | `12. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1vD421n7oj |
| `BV1PKhyeiEYa` | 16 | Figaro | `16. 噓月 - ヨルシカ` | `16. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1PKhyeiEYa |
| `BV17P16YaEbf` | 13 | Figaro | `13. 噓月 - ヨルシカ` | `13. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV17P16YaEbf |
| `BV1DnCTY9ED4` | 18 | Figaro | `18. 噓月 - ヨルシカ` | `18. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1DnCTY9ED4 |
| `BV1A69zYtE9v` | 17 | Figaro | `17. 噓月 - ヨルシカ` | `17. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1A69zYtE9v |
| `BV1Nxu6zcExA` | 15 | Figaro | `15. 噓月 - ヨルシカ` | `15. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Nxu6zcExA |
| `BV1pwH1zNEKX` | 8 | Figaro | `08. 噓月 - ヨルシカ` | `08. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1pwH1zNEKX |
| `BV13ixdz4E4j` | 21 | 凛々咲 | `21. 晴れ - ヨルシカ` | `21. 晴る - ヨルシカ`<br>需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13ixdz4E4j |
| `BV1T1vtezE33` | 18 | 稀羽すう | `18. 都落ち（落京） - ヨルシカ` | `18. 都落ち - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1T1vtezE33 |
| `BV1FJogBzE9V` | 12 | 稀羽すう | `12. だから僕は音楽をやめた - ヨルシカ` | `12. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1FJogBzE9V |
| `BV1X4wqzjECD` | 55 | 朱名 | `55. 晴れ - ヨルシカ` | `55. 晴る - ヨルシカ`<br>需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1X4wqzjECD |
| `BV1ds99BVEiH` | 13 | 澄花 | `13. 火星人（お試し） - ヨルシカ` | `13. 火星人 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ds99BVEiH |
| `BV1RSL36aEsz` | 6 | 澄花 | `06. ここでキスして - 椎名林檎` | `06. ここでキスして。 - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RSL36aEsz |
| `BV1QESRBaE6g` | 6 | ロマニードットアイオー | `06. ここでキスして - 椎名林檎` | `06. ここでキスして。 - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1QESRBaE6g |
| `BV19nQUB9EyB` | 7 | 联动 | `07. だから僕は音楽をやめた - ヨルシカ` | `07. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV19nQUB9EyB |
| `BV11GZtBcEsp` | 113 | CULUA | `113. ここでキスして - 椎名林檎` | `113. ここでキスして。 - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV1L4J56SEbg` | 16 | 323 | `16. だから僕は音楽をやめた - ヨルシカ` | `16. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1L4J56SEbg |
| `BV1qZQzBqE1s` | 11 | 非常驻妹妹 | `11. 晴れ - ヨルシカ` | `11. 晴る - ヨルシカ`<br>需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qZQzBqE1s |
| `BV1LJ4m1A7FC` | 101 | 非常驻妹妹 | `101. だから僕は音楽をやめた - ヨルシカ` | `101. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LJ4m1A7FC |

## 同一 BV 内同歌名歌手多 P 候选

这些不一定都是错误，耐久回可能重复演唱；但它们最容易在歌手聚合页里暴露错切或错名。

| BV | 页码 | 歌曲 | 来源 | 编辑链接 |
|---|---|---|---|---|
| `BV1RMTN6oEqr` | 6, 21, 31, 41, 42, 48, 91 | `人生に期待をしてはいけない - こはならむ` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1UU411Z7W6` | 9, 22, 33, 36, 85, 148 | `トウキョウ・シャンディ・ランデヴ - MAISONdes` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1B7f8BbEQm` | 29, 39, 52, 110, 160 | `クスシキ - Mrs. GREEN APPLE` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1RMTN6oEqr` | 12, 32, 97, 101, 116 | `10年後の私になら - こはならむ` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1UU411Z7W6` | 3, 19, 81, 110, 149 | `マーシャル・マキシマイザー - 柊マグネタイト` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1UU411Z7W6` | 16, 100, 108, 134, 164 | `晩餐歌 - tuki.` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1aDzEBBE3S` | 4, 11, 20, 35 | `Always - 優莉` | 優莉 yuri | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1aDzEBBE3S |
| `BV1aDzEBBE3S` | 8, 13, 27, 34 | `星に名前を - 優莉` | 優莉 yuri | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1aDzEBBE3S |
| `BV1B7f8BbEQm` | 1, 47, 90, 191 | `Bling-Bang-Bang-Born - Creepy Nuts` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 34, 98, 141, 168 | `青と夏 - Mrs. GREEN APPLE` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 59, 89, 137, 186 | `シルエット - KANA-BOON` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1MEP8z4E1J` | 2, 58, 79, 133 | `First Love - 宇多田ヒカル` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1QMAcz2Eqn` | 20, 21, 22, 37 | `APT. - ROSÉ & Bruno Mars` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1QMAcz2Eqn |
| `BV1RMTN6oEqr` | 20, 39, 51, 75 | `恋してる自分すら愛せるんだ - こはならむ` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1UU411Z7W6` | 1, 8, 32, 41 | `花になって - 緑黄色社会` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1UU411Z7W6` | 10, 83, 106, 136 | `花に亡霊 - ヨルシカ` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1UU411Z7W6` | 71, 114, 146, 158 | `Rising Hope - LiSA` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV16rkuBeEBo` | 20, 21, 25 | `悪魔の子 - ヒグチアイ` | 酢酸 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV16rkuBeEBo |
| `BV1aDzEBBE3S` | 1, 28, 30 | `なないろメモリー - 優莉` | 優莉 yuri | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1aDzEBBE3S |
| `BV1aDzEBBE3S` | 5, 12, 24 | `Dear my friend - 優莉` | 優莉 yuri | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1aDzEBBE3S |
| `BV1aDzEBBE3S` | 10, 29, 36 | `Enter! - 優莉` | 優莉 yuri | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1aDzEBBE3S |
| `BV1b3wPzEEvs` | 17, 26, 43 | `lulu. - Mrs. GREEN APPLE` | 紅葉丸 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1b3wPzEEvs |
| `BV1B7f8BbEQm` | 7, 88, 106 | `きっとビタミン - 音門るき` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 15, 65, 109 | `ライラック - Mrs. GREEN APPLE` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 28, 36, 119 | `Plazma - 米津玄師` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 54, 79, 83 | `花に亡霊 - ヨルシカ` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 70, 139, 196 | `ケセラセラ - Mrs. GREEN APPLE` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1B7f8BbEQm` | 81, 122, 198 | `花占い - Vaundy` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| `BV1DofhBDEVV` | 9, 52, 92 | `怪獣 - サカナクション` | 音門るき | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1DofhBDEVV |
| `BV1iN6LBiEgE` | 20, 43, 83 | `真夜中のドア Stay With Me (シングルver.) - 松原みき` | 凛々咲 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1iN6LBiEgE |
| `BV1MEP8z4E1J` | 1, 46, 116 | `夜もすがら君想ふ - TOKOTOKO(西沢さんP)` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 3, 19, 129 | `ドライフラワー - 優里` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 5, 47, 54 | `たばこ - コレサワ` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 10, 49, 144 | `炎 - LiSA` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 14, 98, 143 | `怪物 - YOASOBI` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 31, 59, 140 | `ただ君に晴れ - ヨルシカ` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 48, 69, 78 | `奏 - スキマスイッチ` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 52, 122, 147 | `愛を伝えたいだとか - あいみょん` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 53, 56, 139 | `曖昧劣情Lover - koyori(電ポルP)` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 68, 76, 148 | `怪獣の花唄 - Vaundy` | 天ノ譜ステラ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1mJZwB8EVa` | 26, 95, 121 | `SPiCa - とくP／初音ミク` | 來-Ray- | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1mJZwB8EVa |
| `BV1RMTN6oEqr` | 2, 53, 54 | `銀河街の悪夢 - SEKAI NO OWARI` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1RMTN6oEqr` | 15, 45, 96 | `有心論 - RADWIMPS` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1RMTN6oEqr` | 22, 58, 112 | `ひとりじゃないんだ - こはならむ` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1RMTN6oEqr` | 66, 76, 110 | `神様の秒針を壊した - こはならむ` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RMTN6oEqr |
| `BV1UU411Z7W6` | 18, 37, 118 | `ブリキノダンス - 日向電工` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1UU411Z7W6` | 64, 79, 147 | `Shouted Serenade - LiSA` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1UU411Z7W6` | 75, 129, 159 | `Catch the Moment - LiSA` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1UU411Z7W6` | 99, 140, 163 | `夜明けと蛍 - n-buna feat. 初音ミク` | 天籠りのん | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| `BV1WFwZzxEiS` | 9, 10, 11 | `櫂 - ヨルシカ` | Figaro | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1WFwZzxEiS |
| `BV1137QzmE1b` | 19, 20 | `Plazma - 米津玄師` | 凛々咲 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1137QzmE1b |
| `BV117P2zwEuq` | 5, 33 | `Buffer - Empty old City` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV117P2zwEuq |
| `BV117P2zwEuq` | 17, 32 | `From Noir - Empty old City` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV117P2zwEuq |
| `BV11B6yBiEuh` | 9, 12 | `オレンジ - 7!!` | むんもっしゅ | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11B6yBiEuh |
| `BV11GZtBcEsp` | 4, 67 | `恋愛裁判 - 40mP` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 5, 75 | `ロミオとシンデレラ - doriko` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 6, 172 | `magnet - 流星P` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 8, 63 | `君の知らない物語 - supercell` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 11, 21 | `ベビ・デビ arrange ver. - CULUA` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 12, 152 | `サターン - ずっと真夜中でいいのに。` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 13, 44 | `正しくなれない - ずっと真夜中でいいのに。` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 15, 47 | `ハレバレ - CULUA` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 23, 119 | `Bling-Bang-Bang-Born - Creepy Nuts` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 26, 164 | `ビビデバ - 星街すいせい` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 28, 126 | `チューイン・ディスコ - 花譜` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 33, 72 | `あいつら全員同窓会 - ずっと真夜中でいいのに。` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 38, 167 | `とても素敵な六月でした - Eight` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 46, 133 | `人間みたいね - キタニタツヤ` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 48, 156 | `またね幻 - ずっと真夜中でいいのに。` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 58, 178 | `優しい彗星 - YOASOBI` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 68, 130 | `サリシノハラ - みきとP` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 73, 187 | `ケッペキショウ - GUMI` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 98, 165 | `メルト - ryo` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV11GZtBcEsp` | 135, 174 | `おやすみ泣き声、さよなら歌姫 - クリープハイプ` | CULUA | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV12mQ3B6EpP` | 3, 4 | `夜明けと蛍 - n-buna` | 深影 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV12mQ3B6EpP |
| `BV12mQ3B6EpP` | 6, 7 | `ゴーストレタッチ - 深影` | 深影 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV12mQ3B6EpP |
| `BV15142167tK` | 3, 11 | `あっぱれ！馬鹿騒ぎ - i☆Ris` | よしか🦍 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV15142167tK |
| `BV153AxzQEVV` | 4, 18 | `Together - あきよしふみえ` | よしか🦍 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV153AxzQEVV |
| `BV15acWzkE5k` | 37, 91 | `Pray - 水樹奈々` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV15acWzkE5k |
| `BV15acWzkE5k` | 39, 45 | `Realize - 玉置成実` | 非常驻妹妹 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV15acWzkE5k |

## 同歌手标题表记变体候选

这些只用于发现可能需要补归一化或人工确认的候选，不等同于需要编辑 B 站标题。

| 歌手 | 分类 | 标题变体 | 计数 | 示例编辑链接 |
|---|---|---|---:|---|
| コレサワ | 标题表记差异，需人工确认 | `たばこ`<br>`タバコ` | 75 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ssw6zLEZE |
| ヨルシカ | 标题表记差异，需人工确认 | `都落ち`<br>`都落ち（落京）` | 56 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GBLZ64EcY |
| DECO*27 | 版本/编曲/声优风险，需人工确认 | `モニタリング`<br>`モニタリング (Best Friend Remix)` | 44 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| M!LK | 标题表记差异，需人工确认 | `好きすぎて滅`<br>`好きすぎて滅！`<br>`好きすぎて滅!` | 39 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1b3wPzEEvs |
| ヨルシカ | 标题表记差异，需人工确认 | `火星人`<br>`火星人（お試し）` | 32 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| NOMELON NOLEMON | 标题表记差异，需人工确认 | `ミッドナイト・リフレクション`<br>`ミッドナイト･リフレクション` | 31 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LdGb6rEsS |
| MAISONdes | 标题表记差异，需人工确认 | `トウキョウ・シャンディ・ランデヴ`<br>`トウキョウ・シャンディ・ランデヴー` | 30 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| Aimer | 标题表记差异，需人工确认 | `RE: I AM`<br>`RE:I AM`<br>`REI AM` | 29 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV16PQ5BqEFv |
| ヨルシカ | 形近字/异体字候选 | `嘘月`<br>`噓月` | 28 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| 小野正利 | 标题表记差异，需人工确认 | `departure`<br>`departure!` | 28 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1gvZABuE16 |
| YUI | 标题表记差异，需人工确认 | `SUMMER SONG`<br>`SUMMERSONG` | 27 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1bdAGz5EDk |
| キタニタツヤ | 标题表记差异，需人工确认 | `ずうっといっしょ`<br>`ずうっといっしょ！`<br>`ずうっといっしょ!` | 26 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1b3wPzEEvs |
| 森山直太朗 | 标题表记差异，需人工确认 | `さくら`<br>`さくら（独唱）`<br>`さくら(独唱)` | 26 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| EasyPop | 标题表记差异，需人工确认 | `ハッピーシンセサイザ`<br>`ハッピーシンセサイザー` | 21 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1icwSzXEYv |
| キタニタツヤ | 标题表记差异，需人工确认 | `ナイトルーティーン`<br>`ナイトルーティン` | 19 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1vD421n7oj |
| シェリル・ノーム starring May'n | 标题表记差异，需人工确认 | `ダイアモンド クレバス`<br>`ダイアモンドクレバス` | 19 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| AiScReam | 标题表记差异，需人工确认 | `愛♡スクリ〜ム!`<br>`愛♡スクリ～ム！`<br>`愛♡スクリ～ム!`<br>`愛♡スクリーム！`<br>`愛♡スクリーム!` | 18 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1R3ZKBHEBf |
| DATEKEN | 标题表记差异，需人工确认 | `蜜月アン・ドゥ・トロワ`<br>`蜜月アンドゥトロワ` | 17 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1D2wozNEb9 |
| DECO*27 | 标题表记差异，需人工确认 | `弱虫モンブラン`<br>`弱虫モンブラン (reloaded)` | 15 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1BNtNzaE9D |
| 本名陽子 | 标题表记差异，需人工确认 | `カントリー・ロード`<br>`カントリーロード` | 15 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1sKE66KEkk |
| Aimer | 标题表记差异，需人工确认 | `Ref：rain`<br>`Ref:rain`<br>`Refrain` | 13 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qHcGzSE44 |
| CUTIE STREET | 标题表记差异，需人工确认 | `かわいいだけじゃだめですか`<br>`かわいいだけじゃだめですか？` | 13 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13vZABuEpK |
| miwa | 标题表记差异，需人工确认 | `ヒカリヘ`<br>`ヒカリへ` | 13 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV12s7c6dEFJ |
| カンザキイオリ | 标题表记差异，需人工确认 | `命に嫌われている`<br>`命に嫌われている。` | 12 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1hF92B7EXa |
| 島谷ひとみ | 标题表记差异，需人工确认 | `Falco -ファルコ-`<br>`Falco-ファルコ`<br>`Falco-ファルコ-` | 12 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qyZiB3ECQ |
| DECO*27 feat. 初音ミク | 版本/编曲/声优风险，需人工确认 | `モニタリング`<br>`モニタリング (Best Friend Remix)` | 11 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yHVB6UEY9 |
| femme fatale | 标题表记差异，需人工确认 | `だいしきゅーだいしゅき`<br>`だいしきゅーだいしゅき（安心院みさデュエット）` | 11 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LP6VBbE7g |
| 凛々咲 | 标题表记差异，需人工确认 | `Re, Future`<br>`Re,Future` | 11 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ZZvFzKEUr |
| 土屋美紀、下屋則子(シェシェ、ミミ) | 假名表记差异，建议归一化不建议改稿 | `闇のBAROQUE -バロック`<br>`闇のBAROQUE -バロック-`<br>`闇のBAROQUE バロック` | 10 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Fk4y1f7vG |
| KEI | 标题表记差异，需人工确认 | `Hello, Worker`<br>`Hello,Worker` | 10 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1uwcGzeE3q |
| しぐれうい | 标题表记差异，需人工确认 | `粛聖!! ロリ神レクイエム☆`<br>`粛聖!!ロリ神レクイエム☆` | 10 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ZTRJBDEc6 |
| すりぃ feat. 鏡音レン | 标题表记差异，需人工确认 | `ラヴィ`<br>`ラヴィ(Lavie)` | 10 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1fPo1BiExH |
| 平野綾 | 标题表记差异，需人工确认 | `冒険でしょでしょ`<br>`冒険でしょでしょ？`<br>`冒険でしょでしょ?` | 10 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qyj66pEED |
| 放課後ティータイム | 标题表记差异，需人工确认 | `U & I`<br>`U&I` | 10 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| ReoNa | 标题表记差异，需人工确认 | `シャル・ウィ・ダンス`<br>`シャル・ウィ・ダンス？` | 9 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1nRwKe7Ens |
| wowaka | 假名表记差异，建议归一化不建议改稿 | `アンノウン・マザーグース`<br>`アンノウンマザーグース` | 9 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yHVB6UEY9 |
| 神戸みゆき | 假名表记差异，建议归一化不建议改稿 | `太陽の楽園～Promised Land`<br>`太陽の楽園~Promised Land`<br>`太陽の楽園～Promised Land～` | 9 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1nx4y1J7r6 |
| 秦基博 | 标题表记差异，需人工确认 | `鱗`<br>`鱗(うろこ)` | 9 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1CsSUBNEX7 |
| 槇原敬之 | 标题表记差异，需人工确认 | `どんなときも`<br>`どんなときも。` | 9 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1wEGD6jEBT |
| MIMI | 标题表记差异，需人工确认 | `今はいいんだよ`<br>`今はいいんだよ。` | 8 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| supercell | 标题表记差异，需人工确认 | `LOVE & ROLL`<br>`LOVE&ROLL` | 8 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1pEDtBrE24 |
| THE ORAL CIGARETTES | 标题表记差异，需人工确认 | `狂乱 Hey Kids!!`<br>`狂乱Hey Kids!!` | 8 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UAdsBXE32 |
| TrySail | 标题表记差异，需人工确认 | `adrenaline!!`<br>`adrenaline!!!` | 8 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1jxZABLEWJ |
| 湊あくあ | 符号表记差异，建议归一化 | `#あくあ色ぱれっと`<br>`#あくあ色パレット` | 8 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1uMvyBbESw |
| サンボマスター | 标题表记差异，需人工确认 | `できっこないを やらなくちゃ`<br>`できっこないをやらなくちゃ` | 7 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1gx4y1k7jg |
| 徳永英明 | 标题表记差异，需人工确认 | `レイニー ブルー`<br>`レイニーブルー` | 7 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1J5P7zrEB3 |
| 片霧烈火 | 标题表记差异，需人工确认 | `why, or why not`<br>`Why, or why not`<br>`why,or why not` | 7 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UJYFzLEbs |
| DECO*27 | 版本/编曲/声优风险，需人工确认 | `シンデレラ`<br>`シンデレラ (Giga First Night Remix)`<br>`シンデレラ(Giga First Night Remix)` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1GHNgz2E9x |
| 星街すいせい | 标题表记差异，需人工确认 | `灼熱にて純情`<br>`灼熱にて純情 (wii-wii-woo)`<br>`灼熱にて純情(wii-wii-woo)` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| LiSA | 标题表记差异，需人工确认 | `Rock Mode`<br>`ROCK-mode` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UU411Z7W6 |
| カンザキイオリ feat.初音ミク | 标题表记差异，需人工确认 | `命に嫌われている`<br>`命に嫌われている。` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1o4EJ6cEs3 |
| クリープハイプ | 标题表记差异，需人工确认 | `ex ダーリン`<br>`exダーリン` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1eKeKzGEhq |
| なとり | 标题表记差异，需人工确认 | `フライデー・ナイト`<br>`フライデーナイト` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1HeDxYVEFk |
| 奥井亜紀 | 标题表记差异，需人工确认 | `Wind Climbing ～風にあそばれて～`<br>`Wind Climbing～風にあそばれて～` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV16PQ5BqEFv |
| 椎名林檎 | 标题表记差异，需人工确认 | `ここでキスして`<br>`ここでキスして。` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13c1bBLE8G |
| μ's | 标题表记差异，需人工确认 | `夏色えがおで1, 2, Jump!`<br>`夏色えがおで1,2,Jump!` | 6 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LCVeeUE5s |
| BUMP OF CHICKEN | 标题表记差异，需人工确认 | `ラフ・メイカー`<br>`ラフメイカー` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1uBVu6LEaf |
| DREAMS COME TRUE | 标题表记差异，需人工确认 | `未来予想図 II`<br>`未来予想図II` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1n1fqBWECg |
| ONE OK ROCK | 标题表记差异，需人工确认 | `完全感覚 Dreamer`<br>`完全感覚Dreamer` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV14eEf6fEez |
| sleep warp | 假名表记差异，建议归一化不建议改稿 | `僕らの浮力、あるいは引力`<br>`僕らの浮力あるいは引力` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1am411m7pp |
| 山下智久 | 标题表记差异，需人工确认 | `愛 テキサス`<br>`愛、テキサス` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV18GdkB6E7p |
| 西野カナ | 标题表记差异，需人工确认 | `会いたくて 会いたくて`<br>`会いたくて会いたくて` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Z6gvzMEtW |
| 超学生 | 标题表记差异，需人工确认 | `ルーム No.4`<br>`ルームNo.4` | 5 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1hrDNBtEm1 |
| ASIAN KUNG-FU GENERATION | 标题表记差异，需人工确认 | `Re:Re`<br>`Re:Re:`<br>`ReRe` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1U4bxeHEkT |
| fripSide | 标题表记差异，需人工确认 | `LEVEL5-Judgelight`<br>`LEVEL5-judgelight-` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1NuNNznEnE |
| Lia | 标题表记差异，需人工确认 | `My Soul, Your Beats!`<br>`My Soul,Your Beats!` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV14GVV6UEsz |
| May'n | 标题表记差异，需人工确认 | `ダイアモンド クレバス`<br>`ダイアモンドクレバス` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1iFQ6BKE7X |
| niki | 标题表记差异，需人工确认 | `-ERROR`<br>`ERROR` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Ym411y75K |
| ビクトリーム(CV:若本規夫) | 假名表记差异，建议归一化不建议改稿 | `ベリーメロン ～私の心をつかんだ良いメロン～`<br>`ベリーメロン～私の心をつかんだ良いメロン～` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1KNwXzmEAV |
| 屋比久知奈 | 标题表记差异，需人工确认 | `どこまでも ~How Far I'll Go~`<br>`どこまでも ～How Far I'll Go～`<br>`どこまでも～How FarI'll Go～` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1o2AxzoEmQ |
| 幾田りら | 假名表记差异，建议归一化不建议改稿 | `Answer`<br>`Answer（1番のみ）` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1PWdHBkEig |
| 桜高軽音部 | 标题表记差异，需人工确认 | `Cagayake! GIRLS`<br>`Cagayake!GIRLS` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV19QGi64E9d |
| 山口百恵 | 标题表记差异，需人工确认 | `プレイバック Part2`<br>`プレイバックPart2` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1hRZPB5EDD |
| 小田和正 | 标题表记差异，需人工确认 | `ラブ・ストーリーは突然に`<br>`ラブストーリーは突然に` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1nK421C7AQ |
| 大塚愛 | 标题表记差异，需人工确认 | `大好きだよ`<br>`大好きだよ。` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1wYGi66ESf |
| 槇原敬之 | 标题表记差异，需人工确认 | `北風 〜君にとどきますように〜`<br>`北風～君にとどきますように` | 4 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV167c2znErj |
| AKINO with bless4 | 假名表记差异，建议归一化不建议改稿 | `君の神話 ～アクエリオン第二章`<br>`君の神話 アクエリオン第二章`<br>`君の神話～アクエリオン第二章` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1X5Tz6DEcz |
| 来源处未提供标准格式歌手 | 假名表记差异，建议归一化不建议改稿 | `エルの楽園 ［→ side：Ａ →］`<br>`エルの楽園 ［→ side：Ｅ →］`<br>`エルの楽園［→ sideE →］` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UVpnzCEpW |
| Boa | 标题表记差异，需人工确认 | `まもりたい 〜White Wishes〜`<br>`まもりたい ～White Wishes～`<br>`まもりたい～White Wishes～` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| CULUA | 标题表记差异，需人工确认 | `てんぺんち`<br>`てんぺんちー` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| Dios/シグナルP feat. 初音ミク・KAITO | 标题表记差异，需人工确认 | `サンドリヨン`<br>`サンドリヨン（Cendrillon）` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1nvRbBWEH4 |
| EGOIST | 标题表记差异，需人工确认 | `BANG!!`<br>`BANG!!!` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1efCTYZEXJ |
| KEI feat. 巡音ルカ | 标题表记差异，需人工确认 | `Hello, Worker`<br>`Hello,Worker` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yt7c69EsQ |
| Sound Horizon | 假名表记差异，建议归一化不建议改稿 | `エルの楽園 ［→ side：A →］`<br>`エルの楽園 ［→ side：E →］`<br>`エルの楽園 ［→ side：Ｅ →］` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV17d19YNEu1 |
| T.M.Revolution | 标题表记差异，需人工确认 | `INVOKE -インヴォーク-`<br>`INVOKE-インヴォーク-` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LJ4m1A7FC |
| シェリル・ノーム starring May'n | 标题表记差异，需人工确认 | `ダイヤモンド クレバス`<br>`ダイヤモンドクレバス` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| ターニャ・デグレチャフ(悠木碧) | 标题表记差异，需人工确认 | `Los! Los! Los!`<br>`Los!！Los！ Los！` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV15DouBbEt1 |
| ビクトリーム(若本規夫) | 假名表记差异，建议归一化不建议改稿 | `ベリーメロン ～私の心をつかんだ良いメロン～`<br>`ベリーメロン～私の心をつかんだ良いメロン～` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yHVB6UEY9 |
| 奥華子 | 标题表记差异，需人工确认 | `楔 -くさび-`<br>`楔-くさび-` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1wrMw6aETT |
| 高橋広樹 | 标题表记差异，需人工确认 | `チチをもげ`<br>`チチをもげ!` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1iTMVzeEhS |
| 菅田将暉 | 标题表记差异，需人工确认 | `ロングホープ・フィリア`<br>`ロングホープフィリア` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ModYBUERM |
| 中森明菜 | 标题表记差异，需人工确认 | `DESIRE -情熱-`<br>`DESIRE 情熱` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1hRZPB5EDD |
| 蝶々P feat.初音ミク | 标题表记差异，需人工确认 | `え!あぁ、そう。`<br>`え？あぁ、そう。` | 3 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1B7f8BbEQm |
| AKB48 | 标题表记差异，需人工确认 | `Everyday カチューシャ`<br>`Everyday、カチューシャ` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LJ4m1A7FC |
| koyori feat. 初音ミク | 标题表记差异，需人工确认 | `独りんぼエンヴィ`<br>`独りんぼエンヴィー` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1dbnszwEyh |
| LiSA | 标题表记差异，需人工确认 | `赤い罠(who loves it?)`<br>`赤い罠(who loves it)` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qkZiBkEaY |
| Mr.Children | 假名表记差异，建议归一化不建议改稿 | `シーソーゲーム 〜勇敢な恋の歌〜`<br>`シーソーゲーム～勇敢な恋の歌～` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1R86NBBECr |
| niki feat.Lily | 标题表记差异，需人工确认 | `-ERROR`<br>`ERROR` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1KNwXzmEAV |
| Vaundy | 标题表记差异，需人工确认 | `タイムパラどックス`<br>`タイムパラドックス` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1NEQBBjEJG |
| シェリル・ノーム | 标题表记差异，需人工确认 | `ダイアモンド クレバス`<br>`ダイアモンドクレバス` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1d6Gn6UEKF |
| シェリル・ノーム starring May'n | 标题表记差异，需人工确认 | `What 'bout my star`<br>`What 'bout my star?` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1WgXBByEDu |
| すとらてぃあ | 标题表记差异，需人工确认 | `Last Tear`<br>`LastTear` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1KSRXBwE2v |
| ビクトリーム | 假名表记差异，建议归一化不建议改稿 | `ベリーメロン ～私の心をつかんだ良いメロン～`<br>`ベリーメロン～私の心をつかんだ良いメロン～` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV199whzeE6R |
| ロマニードットアイオー | 标题表记差异，需人工确认 | `Sunday n'AI'ght`<br>`Sunday n"AI"ght` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1iHQXBzEgU |
| 伊東恵里 | 假名表记差异，建议归一化不建议改稿 | `朝の風景`<br>`朝の風景 (日本語バージョン)` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1pEDtBrE24 |
| 一ノ瀬 トキヤ | 标题表记差异，需人工确认 | `星屑 Shall we dance!`<br>`星屑 Shall we dance?` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1EMiDYTEA7 |
| 宇多田ヒカル | 标题表记差异，需人工确认 | `Can You Keep A Secret`<br>`Can You Keep A Secret？` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yVVe6BE16 |
| 串田アキラ | 标题表记差异，需人工确认 | `キン肉マン Go Fight!`<br>`キン肉マンGo Fight!` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1H8XiYCEVt |
| 古川本舗 | 标题表记差异，需人工确认 | `はなれ ばなれ`<br>`はなれ、ばなれ` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1TzobBBEUD |
| 坂口有望 | 标题表记差异，需人工确认 | `好-じょし`<br>`好-じょし-` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1AZLW61EAP |
| 中島みゆき | 标题表记差异，需人工确认 | `ファイト`<br>`ファイト！` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1VEQ2BEEDZ |
| 不破湊 | 标题表记差异，需人工确认 | `一旦ステイ TONIGHT`<br>`一旦ステイTONIGHT` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1hrDNBtEm1 |
| 凛々咲 | 标题表记差异，需人工确认 | `Re_Re_リスタート`<br>`Re:Re:リスタート` | 2 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1iN6LBiEgE |

## 整稿可复制歌单

### BV1owcoz3Ekw

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw

```text
01. 3月9日 - レミオロメン
02. 奏 - スキマスイッチ
03. 水流のロック - 日食なつこ
04. ETERNAL WIND - 森口博子
05. トライアングラー - 坂本真綾
06. オベリスク - シェリル・ノーム starring May'n
07. ETERNAL BLAZE - 水樹奈々
08. サインはB New Arrange Ver. - B小町(ルビー、有馬かな、MEMちょ)
09. 千本桜 - 黒うさP
10. みくみくにしてあげる - ika(feat.初音ミク)
11. エルフ - Ado
12. Butter-Fly - 和田光司
13. 革命道中 On The Way - アイナ・ジ・エンド
14. 瞬き - back number
15. ホシキラ - ランカ・リー＝中島愛
16. いけないボーダーライン - ワルキューレ
17. 一度だけの恋なら - ワルキューレ
18. そうだよ。 - ランカ・リー＝中島愛
19. プラチナ - 坂本真綾
20. promise - 広瀬香美
21. まもりたい ～White Wishes～ - Boa
22. メフィスト - 女王蜂
23. 檄！帝国華撃団 - 横山智佐
24. 御旗のもとに - 巴里華撃団
25. モニタリング - DECO*27
26. Stellar Stellar - 星街すいせい
27. ソワレ - 星街すいせい
28. 灼熱にて純情 - 星街すいせい
29. ビビデバ - 星街すいせい
30. 初音ミクの消失 - cosMo@暴走P feat. 初音ミク
31. ローリンガール - wowaka
32. 六兆年と一夜物語 - kemu
33. 夜明けと蛍 - n-buna
34. 愛言葉Ⅲ - DECO*27
35. メルト - ryo(supercell)
36. JANE DOE - 米津玄師,宇多田ヒカル
37. U - millennium parade × Belle
38. Sincerely - TRUE
39. 花に亡霊 - ヨルシカ
40. CALC. - ジミーサムP
41. 天城越え - 石川さゆり
42. 晩餐歌 - tuki.
43. 回る空うさぎ - Orangestar
44. 忘れじの言の葉 - 未来古代楽団 feat. 安次嶺希和子
45. 貴方の恋人になりたい - チョーキューメイ
46. ベリーメロン - ビクトリーム
47. 満ちてゆく - 藤井風
48. a.m.3：21 - yama
49. そこに空があるから - 江崎稔子
50. 空の欠片 - 池田綾子
51. 僕が死のうと思ったのは - 中島美嘉
52. 今はいいんだよ。 - MIMI
53. キミソラキセキ - EGOIST
54. さくら - 森山直太朗
55. 忘れじの言の葉 - 未来古代楽団 feat. 安次嶺希和子
56. 深海のリトルクライ - sasakure .UK
57. だから僕は音楽を辞めた - ヨルシカ
58. Ghost of a smile - EGOIST
59. 愛が灯る - ロクデナシ
60. セツナトリップ - Last Note.GUMI
61. sakura - NIRGILIS
62. IN MY DREAM - 真行寺恵理
63. 丸の内サディスティック - 椎名林檎
```

### BV1VZwgz3Eqe

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1VZwgz3Eqe

```text
01. Rain - 秦基博
02. Way Back Home - SHAUN
03. だから僕は音楽を辞めた - ヨルシカ
04. 星になる - Islet feat.倚水
05. lulu. - Mrs. GREEN APPLE
06. Just Be Friends - Dixie Flatline
07. たぶん - YOASOBI
08. アドレナ - YOASOBI
09. 花になって - 緑黄色社会
10. ハナノイロ - nano.RIPE
11. ツキミソウ - Novelbright
12. さよーならまたいつか！ - 米津玄師
13. DUET - ZICO & 幾田りら
14. 幾億光年 - Omoinotake
15. マイ フレンド - ZARD
16. サインはB - B小町
17. Give a reason - 林原めぐみ
18. 花束 - back number
19. 花の塔 - さユり
20. 優しさの理由 - ChouCho
21. ルンがピカッと光ったら - ワルキューレ
22. 恋文 - Every Little Thing
```

### BV1vD421n7oj

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1vD421n7oj

```text
01. 月のワルツ - 諫山実生
02. いのちの名前 - 木村弓
03. いつも何度でも - 木村弓
04. テルーの唄 - 手嶌葵
05. 君をのせて - 井上あずみ
06. 六月は雨上がりの街を書く - ヨルシカ
07. 愛藍傘 - エキゾチックかまたに
08. 晚餐歌 - tuki.
09. 心做し - 蝶々P
10. 春泥棒 - ヨルシカ
11. 都落ち - ヨルシカ
12. 嘘月 - ヨルシカ
13. サーカスナイト - 七尾旅人
14. テロメアの産声 - Heavenz
15. 雨宙寫眞 - 澤田 空海理
16. 花に亡霊 - ヨルシカ
17. 砂糖玉の月 - やなぎなぎ
18. Currant - 春野
19. 明けない夜のリリィ - 傘村トータ
20. 蜜月アン・ドゥ・トロワ - DATEKEN
21. 深昏睡 - 春野
22. 夜間飛行 - 藍色にしもん
23. ナイトルーティーン - キタニタツヤ
24. 私が明日死ぬなら - キタニタツヤ
25. それがあなたの幸せとしても - Heavenz
26. 朝を呑む - バルーン
```

### BV1PKhyeiEYa

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1PKhyeiEYa

```text
01. 星間飛行 - 中島愛
02. 新時代 - Ado
03. 残酷な天使のテーゼ - 高橋洋子
04. One Last Kiss - 宇多田ヒカル
05. センチメンタルクライシス - halca
06. コネクト - ClariS
07. 空色デイズ - 中川翔子
08. 正しくなれない - ずっと真夜中でいいのに。
09. フリージア - Uru
10. 月光浴 - ヨルシカ
11. 晴る - ヨルシカ
12. Avid - SawanoHiroyuki[nZk]mizuki
13. ウィアートル - rionos
14. スピラーレ - 牧野由依
15. はるのとなり - 佐々木恵梨
16. 嘘月 - ヨルシカ
```

### BV17P16YaEbf

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV17P16YaEbf

```text
01. 風を食む - ヨルシカ
02. W/X/Y - Tani Yuuki
03. うたかた花火 - supercell
04. クリスマスソング - back number
05. 雪の華 - 中島美嘉
06. from Y to Y - ジミーサムP
07. のうぜんかつら - 安藤裕子
08. ハロ／ハワユ - ナノウ
09. This Love - Angela Aki
10. サクラ色 - Angela Aki
11. 晚餐歌 - tuki.
12. [Short Ver.] 裸の心 - あいみょん
13. 嘘月 - ヨルシカ
14. 君が夜の海に還るまで - キタニタツヤ
15. nuit - 春野
16. 深昏睡 - 春野
17. 人間みたいね - キタニタツヤ
18. 月光 - 鬼束ちひろ
19. 靴の花火 - ヨルシカ
20. ヒッチコック - ヨルシカ
```

### BV1DnCTY9ED4

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1DnCTY9ED4

```text
01. パレード - ヨルシカ
02. 六月は雨上がりの街を書く - ヨルシカ
03. 憂一乗 - ヨルシカ
04. 都落ち - ヨルシカ
05. 月光浴 - ヨルシカ
06. 第一夜 - ヨルシカ
07. 忘れてください - ヨルシカ
08. 夜明けと蛍 - ナブナ
09. 白ゆき - ナブナ
10. 雨とカプチーノ - ヨルシカ
11. アルジャーノン - ヨルシカ
12. 靴の花火 - ヨルシカ
13. 花に亡霊 - ヨルシカ
14. 左右盲 - ヨルシカ
15. ノーチラス - ヨルシカ
16. 風を食む - ヨルシカ
17. チノカテ - ヨルシカ
18. 嘘月 - ヨルシカ
```

### BV1A69zYtE9v

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1A69zYtE9v

```text
01. 都落ち - ヨルシカ
02. 花に亡霊 - ヨルシカ
03. 靴の花火 - ヨルシカ
04. 藍二乗 - ヨルシカ
05. 憂一乗 - ヨルシカ
06. 雨とカプチーノ - ヨルシカ
07. 左右盲 - ヨルシカ
08. パレード - ヨルシカ
09. アルジャーノン - ヨルシカ
10. 第一夜 - ヨルシカ
11. 忘れてください - ヨルシカ
12. 風を食む - ヨルシカ
13. 春泥棒 - ヨルシカ
14. ヒッチコック - ヨルシカ
15. ノーチラス - ヨルシカ
16. いさな - ヨルシカ
17. 嘘月 - ヨルシカ
```

### BV1Nxu6zcExA

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Nxu6zcExA

```text
01. 都落ち - ヨルシカ
02. チノカテ - ヨルシカ
03. 六月は雨上がりの街を書く - ヨルシカ
04. 忘れてください - ヨルシカ
05. 月に吠える - ヨルシカ
06. 夜行 - ヨルシカ
07. パレード - ヨルシカ
08. 藍二乗 - ヨルシカ
09. 憂一乗 - ヨルシカ
10. 第一夜 - ヨルシカ
11. ノーチラス - ヨルシカ
12. 靴の花火 - ヨルシカ
13. 左右盲 - ヨルシカ
14. アルジャーノン - ヨルシカ
15. 嘘月 - ヨルシカ
16. 斜陽 - ヨルシカ
17. いさな - ヨルシカ
```

### BV1pwH1zNEKX

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1pwH1zNEKX

```text
01. 月光 - 鬼束ちひろ
02. 月に吠える - ヨルシカ
03. 月のワルツ - 諫山実生
04. 回る空うさぎ - Orangestar
05. 月のしずく - 柴咲コウ
06. 怪獣 - サカナクション
07. 斜陽 - ヨルシカ
08. 嘘月 - ヨルシカ
09. 月光浴 - ヨルシカ
10. 星の消えた夜に - Aimer
11. ポラリス - Aimer
12. orion - 米津玄師
13. ベテルギウス - 優里
14. 月光ステージ - GYARI
15. テロメアの産声 - Heavenz
```

### BV13ixdz4E4j

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13ixdz4E4j

```text
01. プルーパード - いきものがかり
02. ウィーアー！ - きただにひろし
03. departure! - 小野正利
04. DAN DAN 心魅かれてく - FIELD OF VIEW
05. キミがいれば - いおり
06. Pray - Tommy heavenly6
07. Drawing days - SPLAY
08. カサブタ - 千綿ヒデノリ
09. Bling-Bang-Bang-Born - Creepy Nuts
10. 廻廻奇譚 - Eve
11. Cry baby - Official髭男dism
12. 悪魔の子 - ヒグチアイ
13. 紅蓮華 - LiSA
14. 残響散歌 - Aimer
15. again - YUI
16. Rolling star - YUI
17. そばかす - JUDY AND MARY
18. ミックスナッツ - Official髭男dism
19. 花になって - 緑黄色社会
20. shout baby - 緑黄色社会
21. 晴る - ヨルシカ
22. IRIS OUT - 米津玄師
23. KICK BACK - 米津玄師
24. チチをもげ！ - パルコ・フォルゴレ(高橋広樹)
```

### BV1T1vtezE33

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1T1vtezE33

```text
01. シンデレラボーイ - Saucy Dog
02. 祝福 - YOASOBI
03. 灼熱スイッチ - 雀が原中学卓球部
04. 少女レイ - みきとP
05. バレリーコ - みきとP
06. サリシノハラ - みきとP
07. ないものねだり - KANA-BOON
08. Laughter - Official髭男dism
09. シャルル - バルーン
10. ダーリン - 須田景凪
11. 雨とカプチーノ - ヨルシカ
12. 悪魔の子 - ヒグチアイ
13. again - YUI
14. まつり - 藤井風
15. ただ声一つ - ロクデナシ
16. 生きる - 水野あつ
17. またあした - 想太
18. 都落ち - ヨルシカ
19. さよーならまたいつか! - 米津玄師
```

### BV1FJogBzE9V

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1FJogBzE9V

```text
01. ただ君に晴れ - ヨルシカ
02. ray - BUMP OF CHICKEN
03. SUN - 星野源
04. Lemon - 米津玄師
05. ドライフラワー - 優里
06. 思い出とペトリコール - 稀羽すう
07. (恋は)百年戦争 - 相対性理論
08. 恋 - 星野源
09. カブトムシ - aiko
10. 115万キロのフィルム - Official髭男dism
11. melt bitter - さとうもか
12. だから僕は音楽を辞めた - ヨルシカ
13. ライラック - Mrs. GREEN APPLE
14. Love so sweet - 嵐
15. CHE.R.RY - YUI
16. Rolling star - YUI
17. 燈 - 崎山蒼志
18. 満ちてゆく - 藤井風
19. First Love - 宇多田ヒカル
20. 地球儀 - 米津玄師
21. 踊り子 - Vaundy
22. カタオモイ - Aimer
23. seaglass - 稀羽すう
```

### BV1X4wqzjECD

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1X4wqzjECD

```text
01. 青春のとびら - いきものがかり
02. KIRA★KIRA★TRAIN - いきものがかり
03. 熱情のスペクトラム - いきものがかり
04. 宿命 - Official髭男dism
05. again - YUI
06. It's all right - YUI
07. Rolling star - YUI
08. 晴る - ヨルシカ
09. Best Friend - Kiroro
10. どんなときも - 槇原敬之
11. Rising Hope - LiSA
12. 遠く遠く - 槇原敬之
13. 長い間 - Kiroro
14. ちっぽけな愛のうた - 大原櫻子
15. 明日への手紙 - 手嶌葵
16. 虹 - 手嶌葵
17. 奇跡の星 - 手嶌葵
18. テルーの歌 - 手嶌葵
19. アイ - 秦基博
20. ひまわりの約束 - 秦基博
21. 僕らをつなぐもの - 秦基博
22. 時には昔の話を - 加藤登紀子
23. 愛し君へ - 森山直太朗
24. やさしさで溢れるように - JUJU
25. 卒業写真 - 松任谷由実
26. やさしさに包まれたなら - 松任谷由実
27. 風になる - つじあやの
28. ハナミズキ - 一青窈
29. ヒューマノイド - ずっと真夜中でいいのに。
30. 糸 - 中島みゆき
31. and I．．． - ももちひろこ
32. ロビンソン - スピッツ
33. 雪の華 - 中島美嘉
34. orion - 米津玄師
35. ノーチラス - ヨルシカ
36. 靴の花火 - ヨルシカ
37. 蒼のエーテル - ランカ・リー=中島愛
38. そうだよ。 - ランカ・リー=中島愛
39. ホシキラ - ランカ・リー=中島愛
40. 心の花を咲かせよう - いきものがかり
41. ムーンライト伝説 - DALI
42. I remember you - YUI
43. おどるポンポコリン - B.B.クィーンズ
44. ハム太郎とっとこうた - ハムちゃんず
45. 夢をかなえてドラえもん - mao
46. ドラえもんのうた - 大杉久美子
47. アンパンマンのマーチ - ドリーミング
48. アンパンマンたいそう - ドリーミング
49. SUMMER SONG - YUI
50. 手のひらを太陽に - 宮城まり子 & ビクター児童合唱団
51. 信じる - 合唱曲
52. 怪獣のバラード - 合唱曲
53. 翼をください - 合唱曲
54. 雨とカプチーノ - ヨルシカ
55. 晴る - ヨルシカ
56. 八月、某、月明かり - ヨルシカ
57. 雲と幽霊 - ヨルシカ
58. 心に穴が空いた - ヨルシカ
59. 準透明少年 - ヨルシカ
60. 花に亡霊 - ヨルシカ
61. パレード - ヨルシカ
62. ヒッチコック - ヨルシカ
63. 負け犬にアンコールはいらない - ヨルシカ
64. ラプンツェル - ヨルシカ
65. 夜明けと蛍 - ヨルシカ
66. だから僕は音楽を辞めた - ヨルシカ
67. KICK BACK - 米津玄師
68. ピースサイン - 米津玄師
69. 残響散歌 - Aimer
70. 紅蓮華 - LiSA
71. アイドル - YOASOBI
72. 魂のルフラン - 高橋洋子
73. 私は最強 - Ado
74. 新時代 - Ado
75. 君の知らない物語 - supercell
76. うたかた花火 - supercell
77. The Bravery - supercell
78. V.I.P - シド
79. Cry Baby - Official髭男dism
80. プライド革命 - CHiCO with HoneyWorks
81. 怪物 - YOASOBI
82. Catch the Moment - LiSA
83. シルシ - LiSA
84. only my railgun - fripSide
85. secret base～君がくれたもの～ - ZONE
86. Snow halation - μ's
87. 星間飛行 - ランカ・リー=中島愛
88. めざせポケモンマスター - 松本梨香
89. おジャ魔女カーニバル!! - MAHO堂
90. 勇気100% - 光GENJI
91. unravel - TK from 凛として時雨
92. 花の塔 - さユり
93. アイのシナリオ - CHiCO with HoneyWorks
94. CQCQ - 神様、僕は気づいてしまった
95. アイネクライネ - 米津玄師
96. メトロノーム - 米津玄師
97. 三日月 - 絢香
98. 平行線 - さユり
99. Iʼll be - YUI
100. Good-bye days - YUI for 雨音 薫
101. トゥインクル - Junky feat. 鏡音リン
102. 赤い糸 - コブクロ
103. Zoetrope - やなぎなぎ
104. カブトムシ - aiko
105. アナタノオト - ランカ・リー=中島愛
106. 高嶺の花子さん - back number
107. わたがし - back number
108. カタオモイ - Aimer
109. 晩餐歌 - tuki.
110. 花になって - 緑黄色社会
111. ありがとう - いきものがかり
112. 名前のない怪物 - EGOIST
113. 群青 - YOASOBI
114. 愛唄 - GReeeeN
115. キセキ - GReeeeN
116. 奏 - スキマスイッチ
117. 長い間 - Kiroro
118. Best Friend - Kiroro
119. Wherever you are - ONE OK ROCK
120. 気まぐれロマンティック - いきものがかり
121. 怪獣の花唄 - Vaundy
122. ギラギラ - Ado
123. 千本桜 - 黒うさP
124. チェリー - スピッツ
125. 空も飛べるはず - スピッツ
126. ロビンソン - スピッツ
127. 瞳 - 大原櫻子
128. すずめ - RADWIMPS
129. なんでもないや - RADWIMPS
130. 春を告げる - yama
131. GLORIA - YUI
132. ギブス - 椎名林檎
133. マリーゴールド - あいみょん
134. 愛を伝えたいだとか - あいみょん
135. 君はロックを聴かない - あいみょん
136. 素直 - 槇原敬之
137. 桜色舞うころ - 中島美嘉
138. 僕が死のうと思ったのは - 中島美嘉
139. Subtitle - Official髭男dism
140. シャルル - バルーン feat. v flower
141. アスノヨゾラ哨戒班 - Orangestar feat. IA
142. 神っぽいな - ピノキオピー feat. 初音ミク
143. 酔いどれ知らず - Kanaria feat. GUMI
144. ド屑 - なきそ feat. 歌愛ユキ
145. 脳漿炸裂ガール - れるりり feat. 初音ミク,GUMI
146. 脱法ロック - Neru feat. 鏡音レン
147. セツナトリップ - Last Note. feat. GUMI
148. いーあるふぁんくらぶ - みきとP feat. GUMI,鏡音リン
149. 吉原ラメント - 重音テト
150. ブリキノダンス - 日向電工 feat. 初音ミク
151. 嗚呼、素晴らしきニャン生 - Nem feat. GUMI,鏡音レン
152. チェチェ・チェック・ワンツー - 和田たけあき(くらげP) feat. 結月ゆかり
153. 変わらないもの - 奥華子
154. ガーネット - 奥華子
155. 初恋 - 奥華子
156. M - PRINCESS PRINCESS
157. I LOVE YOU - 尾崎豊
158. 眩しいDNAだけ - ずっと真夜中でいいのに。
159. 初めての恋が終わる時 - supercell
160. 雪の華 - 中島美嘉
161. 藍二乗 - ヨルシカ
162. 恋愛写真 - 大塚愛
163. プラネタリウム - 大塚愛
164. ユキトキ - やなぎなぎ
165. Lemon - 米津玄師
166. orion - 米津玄師
167. 北風 〜君にとどきますように〜 - 槇原敬之
168. タユムコトナキナガレノナカデ - いきものがかり
169. 月とあたしと冷蔵庫 - いきものがかり
170. Perfect Day - supercell
171. ドライフラワー - 優里
172. さくら（独唱） - 森山直太朗
173. 朧月夜～祈り - 中島美嘉
174. 風の谷のナウシカ - 安田成美
175. いのちの名前 - 木村弓
176. 踊 - Ado
177. 唱 - Ado
178. いけないボーダーライン - ワルキューレ
179. どんなときも。 - 槇原敬之
180. シル・ヴ・プレジデント - P丸様。
181. 風と未来 - いきものがかり
182. 負け犬にアンコールはいらない - ヨルシカ
183. ビビデバ - 星街すいせい
184. 丸ノ内サディスティック - 椎名林檎
185. シンデレラボーイ - Saucy Dog
186. タマシイレボリューション - Superfly
187. 愛をこめて花束を - Superfly
188. 手紙 〜拝啓 十五の君へ〜 - アンジェラ・アキ
```

### BV1ds99BVEiH

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ds99BVEiH

```text
01. 恋人失格 - コレサワ
02. ノーチラス - ヨルシカ
03. くらべられっ子 - ツユ
04. SAKURA - いきものがかり
05. 花降らし - n-buna
06. 366日 - HY
07. コントラスト - TOMOO
08. あたしが死んだら - コレサワ
09. 三日月 - 絢香
10. シャルル - バルーン
11. 女の子は泣かない - 片平里菜
12. チノカテ - ヨルシカ
13. 火星人 - ヨルシカ
14. 晩餐歌 - tuki.
15. ぷんぷん - コレサワ
16. 秘密 - aiko
17. カタオモイ - Aimer
18. 夜撫でるメノウ - Ayase
19. ナイトルーティーン - キタニタツヤ
20. Family Song - 星野源
21. 人として - SUPER BEAVER
22. 澄花原创 - 澄花
```

### BV1RSL36aEsz

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RSL36aEsz

```text
01. コントラスト - TOMOO
02. たばこ - コレサワ
03. Burning - 羊文学
04. 歩く - ヨルシカ
05. 又三郎 - ヨルシカ
06. ここでキスして。 - 椎名林檎
07. スピカ - ロクデナシ
08. ブルーベリー・ナイツ - マカロニえんぴつ
09. 花の塔 - さユり
10. 変わらないもの - 奥華子
11. ブラック★ロックシューター - supercell
12. 桃源郷 - シャイトープ
13. ドライフラワー - 優里
14. ヒカレイノチ - Kitri
15. 晴る - ヨルシカ
16. カブトムシ - aiko
17. 果てしない二人 - aiko
18. 左右盲 - ヨルシカ
19. メイクミー - 澄花
```

### BV1QESRBaE6g

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1QESRBaE6g

```text
01. 愛を伝えたいだとか - あいみょん
02. 星座になれたら - 結束バンド
03. Sunday n”AI”ght - ロマニードットアイオー with BT
04. アイノカタチ - MISIA
05. ミッドナイト・リフレクション - NOMELON NOLEMON
06. ここでキスして。 - 椎名林檎
07. おやすみ泣き声、さよなら歌姫 - クリープハイプ
08. カタオモイ - Aimer
09. 春 - 阿部真央
10. 斜陽 - ヨルシカ
11. シャルル - バルーン
12. ギターと孤独と蒼い惑星 - 結束バンド
13. 泣イテイイヨ - ロマニードットアイオー
```

### BV19nQUB9EyB

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV19nQUB9EyB

```text
01. 丸の内サディスティック - 椎名林檎
02. ビビデバ - 星街すいせい
03. 本能 - 椎名林檎
04. 悪魔の子 - ヒグチアイ
05. JANE DOE - 米津玄師,宇多田ヒカル
06. トウキョウ・シャンディ・ランデヴ - MAISONdes
07. だから僕は音楽を辞めた - ヨルシカ
08. 憂、燦々 - クリープハイプ
09. 藍二乗 - ヨルシカ
```

### BV11GZtBcEsp

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp

```text
01. ルカルカ★ナイトフィーバー - 巡音ルカ samfree
02. フレンズ - ステファニー
03. God knows... - 涼宮ハルヒ(平野綾)
04. 恋愛裁判 - 40mP
05. ロミオとシンデレラ - doriko
06. magnet - 流星P
07. 右肩の蝶 - のりぴー
08. 君の知らない物語 - supercell
09. 世界は恋に落ちている - CHiCO with HoneyWorks
10. 初恋サイダー - Buono!
11. ベビ・デビ arrange ver. - CULUA
12. サターン - ずっと真夜中でいいのに。
13. 正しくなれない - ずっと真夜中でいいのに。
14. 夜に駆ける - YOASOBI
15. ハレバレ - CULUA
16. 水流のロック - 日食なつこ
17. 足りない - DUSTCELL
18. デマデーモン - CULUA
19. チルドレンレコード - じん
20. てんぺんちー - CULUA
21. ベビ・デビ - CULUA
22. 好きすぎて滅! - M!LK
23. Bling-Bang-Bang-Born - Creepy Nuts
24. モエチャッカファイア - まふまふ
25. ヒステリックナイトガール - Such
26. ビビデバ - 星街すいせい
27. トウキョウ・シャンディ・ランデヴー - MAISONdes
28. チューイン・ディスコ - 花譜
29. ロキ - みきとP
30. マーシャル・マキシマイザー - 柊マグネタイト
31. テトリス - 重音テト
32. GO! GO! MANIAC - 放課後ティータイム
33. あいつら全員同窓会 - ずっと真夜中でいいのに。
34. 歌よ - Belle
35. Ghost of a smile - EGOIST
36. asphyxia - Cö shu Nie
37. All Alone With You - EGOIST
38. とても素敵な六月でした - Eight
39. 天ノ弱 - 164
40. あなたの夜が明けるまで - 傘村トータ
41. カナデトモスソラ - 25時、ナイトコードで。
42. 贖罪 - 傘村トータ
43. Planetes - EGOIST
44. 正しくなれない - ずっと真夜中でいいのに。
45. 限りなく灰色へ - 25時、ナイトコードで。
46. 人間みたいね - キタニタツヤ
47. ハレバレ - CULUA
48. またね幻 - ずっと真夜中でいいのに。
49. 言霊 - V.W.P
50. 命に嫌われている - カンザキイオリ
51. 群青 - YOASOBI
52. Luna say maybe - 月村手毬
53. 泥中に咲く - ウォルピスカーター
54. 打上花火 - DAOKO x 米津玄師
55. ヒカリヘ - miwa
56. 君がくれた夏 - 家入レオ
57. アポリア - ヨルシカ
58. 優しい彗星 - YOASOBI
59. ベテルギウス - 優里
60. なんでもないや - RADWIMPS
61. アイネクライネ - 米津玄師
62. SAD SONG - ちゃんみな
63. 君の知らない物語 - supercell
64. 蝶々結び - Aimer
65. 夜明けの歌 - M2U x ダズビー
66. トリノコシティ - 40mP
67. 恋愛裁判 - 40mP
68. サリシノハラ - みきとP
69. 蹴っ飛ばした毛布 - ずっと真夜中でいいのに。
70. だから僕は音楽を辞めた - ヨルシカ
71. キメラ - 1e1
72. あいつら全員同窓会 - ずっと真夜中でいいのに。
73. ケッペキショウ - GUMI
74. ドーナツホール - 米津玄師
75. ロミオとシンデレラ - doriko
76. 都落ち - ヨルシカ
77. メランコリック - Junky feat.鏡音リン
78. 社会距離 - 40mP
79. Boi - ポリスピカデリー
80. ヴィラン - てにをは
81. 二息歩行 - DECO*27
82. 延命治療 - Neru
83. 生きるってなんだよ - 葵木ゴウ
84. 比較症候群 - 葵木ゴウ
85. Q - 椎名もた
86. アストロノーツ - 椎名もた
87. 死んでしまったのだろうか - Guiano
88. 猛独が襲う - 一二三
89. ロストワンの号哭 - Neru
90. ハウトゥー世界征服 - Neru
91. インタビュア - クワガタP
92. 思想犯 - ヨルシカ
93. The hole - King Gnu
94. 君の脈で踊りたかった - ピコン
95. Refrain - Aimer
96. 痛いよ - 清竜人
97. ハロ／ハワユ - ナノウ
98. メルト - ryo
99. 心拍数♯0822 - 蝶々P
100. 雛鳥 - 花譜
101. ロンリーユニバース - Aqu3ra
102. プロポーズ - なとり
103. 地獄先生 - 相対性理論
104. (恋は)百年戦争 - 相対性理論
105. ヨワネハキ - MAISONdes
106. melt bitter - さとうもか
107. 貴方の恋人になりたい - チョーキューメイ
108. 寄り酔い - 和ぬか
109. Hello ～ Paradise Kiss - YUI
110. CHE.R.RY - YUI
111. 不便な可愛げ - ジェニーハイ
112. 華奢なリップ - ジェニーハイ
113. ここでキスして。 - 椎名林檎
114. うまぴょい伝説 - ウマ娘
115. マジLOVE1000% - ST☆RISH
116. マジLOVE2000% - ST☆RISH
117. 好きすぎて滅 - M!LK
118. アイドル - YOASOBI
119. Bling-Bang-Bang-Born - Creepy Nuts
120. ヒプノシスマイク -Division Battle Anthem - Division All Stars  [2026-01-29]  [zaDTmo
121. CH4NGE - Giga
122. G4L - Giga
123. 低血ボルト - ずっと真夜中でいいのに。
124. 脳裏上のクラッカー - ずっと真夜中でいいのに。
125. シュガーソングとビターステップ - UNISON SQUARE GARDEN
126. チューイン・ディスコ - 花譜×ツミキ
127. サマータイムレコード - じん
128. ウミユリ海底譚 - n-buna
129. わたしのアール - 和田たけあき
130. サリシノハラ - みきとP
131. ヒッチコック - ヨルシカ
132. 君が夜の海に還るまで - キタニタツヤ
133. 人間みたいね - キタニタツヤ
134. 君の神様になりたい。 - カンザキイオリ
135. おやすみ泣き声、さよなら歌姫 - クリープハイプ
136. 忘れてください - ヨルシカ
137. 白日 - King Gnu
138. 晚餐歌 - tuki.
139. 雨き声殘響 - Orangestar
140. 魂のルフラン - 高橋洋子
141. KICK BACK - 米津玄師
142. IRIS OUT - 米津玄師
143. 怪物 - YOASOBI
144. ウタカタララバイ - Ado
145. I beg you - Aimer
146. ないない - ReoNa
147. 聖少女領域 - ALI PROJECT
148. 禁じられた遊び - ALI PROJECT
149. Fallen - EGOIST
150. 名前のない怪物 - EGOIST
151. JANE DOE - 宇多田ヒカル、米津玄師
152. サターン - ずっと真夜中でいいのに。
153. ヒバナ - DECO*27
154. ゴーストルール - DECO*27
155. GLORIA - YUI
156. またね幻 - ずっと真夜中でいいのに。
157. ローリンガール - wowaka
158. アメヲマツ、 - 美波
159. value - Ado
160. 心という名前の不可解 - Ado
161. Dear. Mr「F」 - ずっと真夜中でいいのに。
162. モニタリング - DECO*27
163. おちゃめ機能 - ゴジマジP
164. ビビデバ - 星街すいせい
165. メルト - ryo
166. 勇者 - YOASOBI
167. とても素敵な六月でした - Eight
168. あの夏が飽和する。 - カンザキイオリ
169. LOSER - 米津玄師
170. ロスタイムメモリー - じん
171. 惡魔の子 - ヒグチアイ
172. magnet - 流星P
173. てんぺんち - kaaruutaasoo
174. おやすみ泣き声、さよなら歌姫 - クリープハイプ
175. wherever you are - ONE OK ROCK
176. Departures 〜あなたにおくるアイの歌〜 - EGOIST
177. 思いを巡らす100の事象 - EGOIST
178. 優しい彗星 - YOASOBI
179. ピエロ - KEI
180. 回る空うさぎ - Orangestar
181. 夜明けと蛍 - ナブナ
182. 生きる - 水野あつ
183. 今はいいんだよ。 - MIMI
184. 星の消えた夜に - Aimer
185. 背景、夏に溺れる - ナブナ
186. 心做し - 蝶々P
187. ケッペキショウ - GUMI
188. エンパープル - はるまきごはん
189. パラサイト - DECO*27
190. Who! - Azari
191. 猫の食卓 - きくお
192. 大女優さん - いよわ
193. 化孵化 - sasakure UK
194. 琥珀の身体 - HIMEHINA
195. レッド・パージ！！！ - P.I.N.A.
196. 世界寿命と最後の一日 - スズム
197. 三日月ステップ - r-906
198. あわよくばきみの眷属になりたいな - Peg
199. 二息步行 - DECO*27
200. 少しの自信があったら、 - CULUA
```

### BV1L4J56SEbg

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1L4J56SEbg

```text
01. ロビンソン - スピッツ
02. 美しい鰭 - スピッツ
03. マリーゴールド - あいみょん
04. 明日、春が来たら - 松たか子
05. ルージュの伝言 - 松任谷由実
06. 風になる - つじあやの
07. Beautiful World - 宇多田ヒカル
08. First Love - 宇多田ヒカル
09. 蜜月アン・ドゥ・トロワ - DATEKEN feat.鏡音リン
10. 恋するフォーチュンクッキー - AKB48
11. 会いたかった - AKB48
12. 忘れじの言の葉 - 安次嶺希和子
13. 明日への手紙 - 手嶌葵
14. 森の小さなレストラン - 手嶌葵
15. 夢をかなえてドラえもん - mao
16. だから僕は音楽を辞めた - ヨルシカ
17. 花に亡霊 - ヨルシカ
18. 東京ミッドナイト - milkyTrap
19. 世界の約束 - 倍賞千恵子
20. カフェオーレのうた - きっかレン
```

### BV1qZQzBqE1s

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qZQzBqE1s

```text
01. ヒッチコック - ヨルシカ
02. 貴方の恋人になりたい - チョーキューメイ
03. ノーチラス - ヨルシカ
04. 雨とカプチーノ - ヨルシカ
05. アポリア - ヨルシカ
06. Sincerely - TRUE
07. 脳裏上のクラッカー - ずっと真夜中でいいのに。
08. だってアタシのヒーロー。 - LiSA
09. プラチナ - 坂本真綾
10. 瞳の欠片 - FictionJunction YUUKA
11. 晴る - ヨルシカ
12. courage - 戸松遥
13. Honey sweet tea time - 放課後ティータイム
14. 創聖のアクエリオン - AKINO
15. 夢灯籠 - RADWIMPS
16. 月光 - 鬼束ちひろ
17. ひとりごつ - ハチワレ
```

### BV1LJ4m1A7FC

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LJ4m1A7FC

```text
01. 完全感覚Dreamer - ONE OK ROCK
02. この木なんの木 - ヒデ夕樹・朝礼志
03. 花に亡霊 - ヨルシカ
04. アイドル - YOASOBI
05. 香水 - 瑛人
06. 決戦は金曜日 - DREAMS COME TRUE
07. 新時代 - Ado
08. 勇気100% - 光GENJI
09. 桜 - コブクロ
10. 元気を出して - 竹内まりや
11. フォニィ - ツミキ
12. アイワナムチュー - MAISONdes
13. 花 - ORANGE RANGE
14. One Night Carnival - 氣志團
15. 君はロックを聴かない - あいみょん
16. LA・LA・LA LOVE SONG - 久保田利伸
17. Hey Hey おおきに毎度あり - SMAP
18. 千の風になって - 秋川雅史
19. 愛をとりもどせ!! - クリスタルキング
20. 富士サファリパークCMソング - 串田アキラ
21. わたしの一番かわいいところ - FRUITS ZIPPER
22. 3月9日 - レミオロメン
23. 桜花爛漫 - KEYTALK
24. 死ぬな! - こっちのけんと
25. 奏 - スキマスイッチ
26. H@ppy Together!!! - 林ももこ
27. Best Friend - 西野カナ
28. ミュージック・アワー - ポルノグラフィティ
29. 灼熱にて純情 (wii-wii-woo) - 星街すいせい
30. GO!!! - FLOW
31. もっと - aiko
32. だいしきゅーだいしゅき - Femme fatale
33. HOT LIMIT - T.M.Revolution
34. 剣戟の舞 - 紅月
35. ガッチャマンの歌 - 子門真人
36. ちゅきちゅきブリザード - なにわ男子
37. ブリキノダンス - 日向電工
38. 千本桜 - 黒うさP
39. 千の夜をこえて - Aqua Timez
40. if... - DA PUMP
41. スーパースターになったら - back number
42. メリッサ - ポルノグラフィティ
43. 水平線 - back number
44. 君をのせて - 井上あずみ
45. Secret of my heart - 倉木麻衣
46. 罪と夏 - SUPER EIGHT
47. 青と夏 - Mrs, GREEN APPLE
48. Loveletter - aiko
49. 夢見る少女じゃいられない - 相川七瀬
50. 夜もすがら君想ふ - TOKOTOKO(西沢さん)
51. ダイナマイト - SMAP
52. ブルーバード - いきものがかり
53. 唱 - Ado
54. シャルル - バルーンP
55. 冬と春 - back number
56. 愛 テキサス - 山下智久
57. アゲハ蝶 - ポルノグラフィティ
58. ベテルギウス - 優里
59. さくらんぼ - 大塚愛
60. 夢見る隙間 - aiko
61. 愛のうた - 倖田來未
62. 蝶々結び - Aimer
63. 上海ハニー - ORANGE RANGE
64. チャンカパーナ - NEWS
65. NEW ERA - SixTONES
66. あなたの恋人になりたいのです - 阿部真央
67. オレンジ - GReeeeN
68. うっせぇわ - Ado
69. ウタカタララバイ - Ado
70. JAPONICA STYLE - SixTONES
71. ないものねだり - KANA-BOON
72. もう恋なんてしない - 槇原敬之
73. 白雪姫 - Flower
74. BREAK OUT - 東方神起
75. 夏祭り - Whiteberry
76. SOUL SOUP - Official髭男dism
77. ハートキャッチ☆パラダイス - 工藤真由
78. ラブストーリーは突然に - 小田和正
79. キミシダイ列車 - ONE OK ROCK
80. きまぐれロマンティック - いきものがかり
81. からくりピエロ - 40mP
82. again - YUI
83. かくれんぼ - AliA
84. 春泥棒 - ヨルシカ
85. どんなときも - 槇原敬之
86. Runner - 爆風スランプ
87. 笑顔 - いきものがかり
88. SAYONARAベイベー - 加藤ミリヤ
89. 阿修羅ちゃん - Ado
90. オドループ - フレデリック
91. 夢花火 - 萌水団
92. ultra soul - B'z
93. まちぶせ - 石川ひとみ
94. ちゅきちゅきハリケーン - なにわ男子
95. INVOKE-インヴォーク- - T.M.Revolution
96. ハナミズキ - 一青窈
97. 別の人の彼女になったよ - wacci
98. レディメイド - Ado
99. キューティーハニー - 倖田來未
100. 負けないで - ZARD
101. だから僕は音楽を辞めた - ヨルシカ
102. 神のまにまに - れるりり
103. 翡翠のまち - メル
104. キャットラビング - 香椎モイミ
105. クィホーティ - エイハブ
106. YONAKI - みきとP
107. ベノム - かいりきベア
108. RUN - BTS
109. NoNoNo - Apink
110. Smile Flower - SEVENTEEN
111. 私の思春期 - 赤頬思春期
112. Like OOH-AHH - TWICE
113. LOVE SCENARIO - iKON
114. AS IF IT'S YOUR LAST - BLACKPINK
115. 野菜シスターズ - AKB48
116. 愛のしるし - PUFFY
117. パッ - 西野カナ
118. パンぱんだ - SUPER EIGHT
119. ステキな日曜日～Gyu Gyuグッディ！ - 芦田愛菜
120. #あくあ色パレット - 湊あくあ
121. V.I.P - シド
122. 世界が終わるまでは - WANDS
123. Catch You Catch Me - グミ
124. YUME日和 - 島谷ひとみ
125. プライド革命 - CHiCO with HoneyWorks
126. 勇者 - YOASOBI
127. Snow fairy - FUNKIST
128. マクロス - 藤原誠
129. さよならの夏 - 手嶌葵
130. ORION - 中島美嘉
131. I LOVE YOU - 尾崎豊
132. チキンライス - 浜田雅功と槇原敬之
133. 晩餐歌 - tuki.
134. 70億にただ1つの奇跡 - ACE COLLECTION
135. ドラマツルギー - Eve
136. LOSER - 米津玄師
137. BANDAGE - Ayumu Imazu
138. スターマイン - Da-iCE
139. ビビデバ - 星街すいせい
140. 君の彼氏になりたい。 - Snow Man
141. NAVIGATOR - SixTONES
142. OCEAN - 東方神起
143. Smile Flower - SEVEN TEEN
144. Choosey　Lover - 東方神起
145. 愛してない - Acid Black Cherry
146. 富士サファリパークCMソング - 串田アキラ
147. 君のすきなうた - UVERworld
148. Everyday カチューシャ - AKB48
149. ちゅきちゅきハリケーン - なにわ男子
150. 左右盲 - ヨルシカ
151. Rolling star - YUI
152. 紋白蝶 feat.石原慎也 (Saucy Dog) - 東京スカパラダイスオーケストラ
153. Catch You Catch Me - グミ
154. 空も飛べるはず - スピッツ
155. パンぱんだ - (SUPER EIGHT)横山裕  丸山隆平
156. しらんけど - WEST.
157. 愛のしるし - PUFFY
158. ドコノコノキノコ - 横山だいすけ、三谷たくみ
159. RUN - BTS
160. 天体観測 - BUMP OF CHIKEN
161. 裸の心 - あいみょん
162. ジャンキーナイトタウンオーケストラ - すりぃ
163. 超めでたいソング ～こんなに幸せでいいのかな？ - FRUITS ZIPPER
164. 桜花爛漫 - KEYTALK
165. Borelo - 東方神起
166. 最後の雨 - 中西保志
167. ちゅきちゅきブリザード - なにわ男子
168. ビビデバ - 星街すいせい
169. ソワレ - 星街すいせい
170. 大阪ロマネスク - SUPER EIGHT
171. 君が代 - 国家
172. Nagisa - imase
173. 春雷 - 米津玄師
174. 妄想感傷代償連盟 - DECO*27
175. 唱 - Ado
176. TREE OF LIFE - 東方神起
177. 創聖のアクエリオン - AKINO
178. マジジョテッペンブルース - AKB48
179. 高嶺の花子さん - back number
180. マクロス - 藤原誠
181. 翡翠のまち - メル
182. #あくあ色パレット - 湊あくあ
183. 酔いどれ知らず - Kanaria
184. 君に届け - lumpool
185. いけないボーダーライン - ワルキューレ
186. 天城越え - 石川さゆり
187. Ginger - TOMOO
188. Runner - 爆風スランプ
189. ハルジオン - YOASOBI
190. ハレンチ - ちゃんみな
191. Love in the Ice - 東方神起
192. 五線紙 - 東方神起
```
