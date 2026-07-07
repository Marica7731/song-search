# /stats 歌手聚合页错名与重复候选 2026-07-07

## 命名规则

- 分 P 标题统一使用：`序号. 歌名 - 歌手`
- 编辑入口格式：`https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=<BV>`
- 本文件由 `node scripts/scan-stats-artist-issues.js` 生成，默认读取线上 `/api/all-songs`。

## 数据源

- source: `https://www.culua.com/api/all-songs`
- songs: 33724
- high confidence fixes: 54
- duplicate groups listed: 80

## 高置信待编辑

| BV | P | 来源 | 当前 | 建议修改 | 编辑链接 |
|---|---:|---|---|---|---|
| `BV1owcoz3Ekw` | 57 | 知悠 | `57. だから僕は音楽辞めた - ヨルシカ` | `57. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| `BV1owcoz3Ekw` | 63 | 知悠 | `63. 丸の内サディスティック - 椎名林檎` | `63. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1owcoz3Ekw |
| `BV1zxQpBsEnQ` | 8 | 紅葉丸 | `08. 丸の内サディスティック - 椎名林檎` | `08. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1zxQpBsEnQ |
| `BV1Bjo7B9EPG` | 4 | 紅葉丸 | `04. 丸の内サディスティック - 椎名林檎` | `04. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Bjo7B9EPG |
| `BV1UwwRz4Ef2` | 6 | 戸鎖くくり | `06. 丸の内サディスティック - 椎名林檎` | `06. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UwwRz4Ef2 |
| `BV1V8ZABkEtf` | 1 | なれたん | `01. 丸の内サディスティック - 椎名林檎` | `01. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1V8ZABkEtf |
| `BV1VZwgz3Eqe` | 3 | なれたん | `03. だから僕は音楽をやめた - ヨルシカ` | `03. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1VZwgz3Eqe |
| `BV1vD421n7oj` | 12 | Figaro | `12. 噓月 - ヨルシカ` | `12. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1vD421n7oj |
| `BV14F4m1w7uq` | 3 | Figaro | `03. 丸の内サディスティック - 椎名林檎` | `03. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV14F4m1w7uq |
| `BV1PKhyeiEYa` | 16 | Figaro | `16. 噓月 - ヨルシカ` | `16. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1PKhyeiEYa |
| `BV1rzYUejEuk` | 4 | Figaro | `04. 丸の内サディスティック - 椎名林檎` | `04. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1rzYUejEuk |
| `BV17P16YaEbf` | 13 | Figaro | `13. 噓月 - ヨルシカ` | `13. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV17P16YaEbf |
| `BV1DnCTY9ED4` | 18 | Figaro | `18. 噓月 - ヨルシカ` | `18. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1DnCTY9ED4 |
| `BV1A69zYtE9v` | 17 | Figaro | `17. 噓月 - ヨルシカ` | `17. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1A69zYtE9v |
| `BV1Nxu6zcExA` | 15 | Figaro | `15. 噓月 - ヨルシカ` | `15. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Nxu6zcExA |
| `BV1pwH1zNEKX` | 8 | Figaro | `08. 噓月 - ヨルシカ` | `08. 嘘月 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1pwH1zNEKX |
| `BV1ozpRz9EMG` | 1 | Figaro | `01. 丸の内サディスティック - 椎名林檎` | `01. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ozpRz9EMG |
| `BV1ivkcBiEUE` | 14 | Figaro | `14. 丸の内サディスティック - 椎名林檎` | `14. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ivkcBiEUE |
| `BV1JR6GBvEN1` | 18 | 凛々咲 | `18. 丸の内サディスティック - 椎名林檎` | `18. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1JR6GBvEN1 |
| `BV1XZ7XzNER4` | 6 | 凛々咲 | `06. 丸の内サディスティック - 椎名林檎` | `06. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1XZ7XzNER4 |
| `BV13ixdz4E4j` | 21 | 凛々咲 | `21. 晴れ - ヨルシカ` | `21. 晴る - ヨルシカ`<br>需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13ixdz4E4j |
| `BV1djyxBkEoo` | 1 | 凛々咲 | `01. 丸の内サディスティック - 椎名林檎` | `01. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1djyxBkEoo |
| `BV13c1bBLE8G` | 11 | 凛々咲 | `11. 丸の内サディスティック - 椎名林檎` | `11. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13c1bBLE8G |
| `BV1k1421d7sv` | 3 | 稀羽すう | `03. 丸の内サディスティック - 椎名林檎` | `03. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1k1421d7sv |
| `BV1nw411u7HY` | 3 | 稀羽すう | `03. 丸の内サディスティック - 椎名林檎` | `03. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1nw411u7HY |
| `BV1gx4y1k7jg` | 4 | 稀羽すう | `04. 丸の内サディスティック - 椎名林檎` | `04. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1gx4y1k7jg |
| `BV1T1vtezE33` | 18 | 稀羽すう | `18. 都落ち（落京） - ヨルシカ` | `18. 都落ち - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1T1vtezE33 |
| `BV13y45eWEUm` | 2 | 稀羽すう | `02. 丸の内サディスティック - 椎名林檎` | `02. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13y45eWEUm |
| `BV17iXiYzE26` | 2 | 稀羽すう | `02. 丸の内サディスティック - 椎名林檎` | `02. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV17iXiYzE26 |
| `BV1BqJwzeENe` | 9 | 稀羽すう | `09. 丸の内サディスティック - 椎名林檎` | `09. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1BqJwzeENe |
| `BV1vyzXB6EHN` | 11 | 稀羽すう | `11. 丸の内サディスティック - 椎名林檎` | `11. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1vyzXB6EHN |
| `BV1FJogBzE9V` | 12 | 稀羽すう | `12. だから僕は音楽をやめた - ヨルシカ` | `12. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1FJogBzE9V |
| `BV1mJZwB8EVa` | 5 | 來-Ray- | `05. 丸の内サディスティック - 椎名林檎` | `05. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1mJZwB8EVa |
| `BV1wUZcBQEBo` | 18 | 來-Ray- | `18. 丸の内サディスティック - 椎名林檎` | `18. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1wUZcBQEBo |
| `BV1yTXmBBEG1` | 7 | 音門るき | `07. 丸の内サディスティック - 椎名林檎` | `07. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yTXmBBEG1 |
| `BV1MEP8z4E1J` | 15 | 天ノ譜ステラ | `15. 丸の内サディスティック - 椎名林檎` | `15. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1MEP8z4E1J` | 96 | 天ノ譜ステラ | `96. 丸の内サディスティック - 椎名林檎` | `96. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J |
| `BV1X4wqzjECD` | 55 | 朱名 | `55. 晴れ - ヨルシカ` | `55. 晴る - ヨルシカ`<br>需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1X4wqzjECD |
| `BV1c1QxBuEnn` | 3 | 澄花 | `03. 丸の内サディスティック - 椎名林檎` | `03. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1c1QxBuEnn |
| `BV1ds99BVEiH` | 13 | 澄花 | `13. 火星人（お試し） - ヨルシカ` | `13. 火星人 - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ds99BVEiH |
| `BV1RSL36aEsz` | 6 | 澄花 | `06. ここでキスして - 椎名林檎` | `06. ここでキスして。 - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1RSL36aEsz |
| `BV1QESRBaE6g` | 6 | ロマニードットアイオー | `06. ここでキスして - 椎名林檎` | `06. ここでキスして。 - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1QESRBaE6g |
| `BV19nQUB9EyB` | 1 | 联动 | `01. 丸の内サディスティック - 椎名林檎` | `01. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV19nQUB9EyB |
| `BV19nQUB9EyB` | 7 | 联动 | `07. だから僕は音楽をやめた - ヨルシカ` | `07. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV19nQUB9EyB |
| `BV11GZtBcEsp` | 113 | CULUA | `113. ここでキスして - 椎名林檎` | `113. ここでキスして。 - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV11GZtBcEsp |
| `BV1daVs6eE2r` | 17 | ななし律歌 | `17. 丸の内サディスティック - 椎名林檎` | `17. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1daVs6eE2r |
| `BV1daVs6eE2r` | 18 | ななし律歌 | `18. 丸の内サディスティック - 椎名林檎` | `18. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1daVs6eE2r |
| `BV1jbGq6wEMw` | 7 | 響架 | `07. 丸の内サディスティック - 椎名林檎` | `07. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1jbGq6wEMw |
| `BV1L4J56SEbg` | 16 | 323 | `16. だから僕は音楽をやめた - ヨルシカ` | `16. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1L4J56SEbg |
| `BV1qZQzBqE1s` | 11 | 非常驻妹妹 | `11. 晴れ - ヨルシカ` | `11. 晴る - ヨルシカ`<br>需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。 | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1qZQzBqE1s |
| `BV1VroAB3EBy` | 2 | 非常驻妹妹 | `02. 丸の内サディスティック - 椎名林檎` | `02. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1VroAB3EBy |
| `BV1ReVs6AEmk` | 9 | 非常驻妹妹 | `09. 丸の内サディスティック - 椎名林檎` | `09. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ReVs6AEmk |
| `BV1LJ4m1A7FC` | 101 | 非常驻妹妹 | `101. だから僕は音楽をやめた - ヨルシカ` | `101. だから僕は音楽を辞めた - ヨルシカ` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1LJ4m1A7FC |
| `BV1co7i6QEez` | 16 | 一色イズ | `16. 丸の内サディスティック - 椎名林檎` | `16. 丸ノ内サディスティック - 椎名林檎` | https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1co7i6QEez |

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
63. 丸ノ内サディスティック - 椎名林檎
```

### BV1zxQpBsEnQ

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1zxQpBsEnQ

```text
01. 恋愛裁判 - 40mP
02. さくら - 森山直太朗
03. 風になる - つじあやの
04. ひまわりの約束 - 秦基博
05. 鱗 - 秦基博
06. ロビンソン - スピッツ
07. ドライフラワー - 優里
08. 丸ノ内サディスティック - 椎名林檎
09. ヴィラン - てにをは
10. ラプンツェル - n-buna
11. 時には昔の話を - 加藤登紀子
12. ドン・キホーテのテーマ - 田中マイミ
13. 夏祭り - Whiteberry
14. 晴る - ヨルシカ
```

### BV1Bjo7B9EPG

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1Bjo7B9EPG

```text
01. 鱗 - 秦基博
02. さくら(独唱) - 森山直太朗
03. ドン・キホーテのテーマ - 田中マイミ
04. 丸ノ内サディスティック - 椎名林檎
```

### BV1UwwRz4Ef2

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1UwwRz4Ef2

```text
01. 片っぽ - eill
02. 夜明けと蛍 - n-buna feat. 初音ミク
03. 雨とカプチーノ - ヨルシカ
04. メリュー - n-buna feat. 初音ミク
05. 10月無口な君を忘れる - あたらよ
06. 丸ノ内サディスティック - 椎名林檎
07. I Love You - 尾崎豊
08. OH MY LITTLE GIRL - 尾崎豊
09. ナラタージュ - adieu
10. よるのあと - adieu
11. NIGHT DANCER - imase
12. Flamingo - 米津玄師
13. 死神 - 米津玄師
14. ハレンチ - ちゃんみな
15. Pop Virus - 星野源
16. のうぜんかつら - 安藤裕子
17. オリビアを聴きながら - 杏里
```

### BV1V8ZABkEtf

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1V8ZABkEtf

```text
01. 丸ノ内サディスティック - 椎名林檎
02. 光るなら - Goose house
03. 名前を呼ぶよ - ラックライフ
04. 白日 - King Gnu
05. Good-bye days - YUI for 雨音薫
06. 愛唄 - GReeeeN
07. 手紙 ～拝啓十五の君へ～ - アンジェラ・アキ
08. 愛のかたまり - DOMOTO
09. 炎 - LiSA
10. レオ - 優里
11. 猫 - DISH／／
12. ライオン - May'n&中島愛
13. Unlasting - LiSA
14. Glorious Break - 水樹奈々
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

### BV14F4m1w7uq

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV14F4m1w7uq

```text
01. ひまわりの約束 - 秦基博
02. テルーの唄 - 手嶌葵
03. 丸ノ内サディスティック - 椎名林檎
04. 夏の半券 - みきとP
05. サマータイムレコード - じん
06. rain stops, good-bye - におP
07. 夕立のりぼん - みきとP
08. 晚餐歌 - tuki.
09. 鬼ノ宴 - 友成空
10. 夜明けと蛍 - ナブナ
11. 白ゆき - ナブナ
12. ワールド・ランプシェード - buzzG
13. ウィアートル - rionos
14. のうぜんかつら - 安藤裕子
15. 君が夜の海に還るまで - キタニタツヤ
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

### BV1rzYUejEuk

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1rzYUejEuk

```text
01. 夕立のりぼん - みきとP
02. ツギハギスタッカート - とあ
03. チノカテ - ヨルシカ
04. 丸ノ内サディスティック - 椎名林檎
05. ふうせん - 酸欠少女さユり
06. 花になって - 緑黄色社会
07. 絶頂讃歌 - 和ぬか
08. 月光 - 鬼束ちひろ
09. 家に帰ろう（マイ・スイート・ホーム） - 竹内まりや
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

### BV1ozpRz9EMG

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ozpRz9EMG

```text
01. 丸ノ内サディスティック - 椎名林檎
02. ルージュの伝言 - 松任谷由実
03. やわらかな夜 - orange pekoe
04. 愛の花 - あいみょん
05. 群青日和 - 東京事変
```

### BV1ivkcBiEUE

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ivkcBiEUE

```text
01. たぶん - YOASOBI
02. 泥中に咲く - はりーP
03. さみしいひと - 理芽
04. Avid - SawanoHiroyuki『nZk』：mizuki
05. 金木犀 - くじら
06. ラストリゾート - Ayase
07. HEAVEN - はりーP
08. 愛を伝えたいだとか - あいみょん
09. 僕と花 - サカナクション
10. 怪獣 - サカナクション
11. かたちあるもの - 柴咲コウ
12. フリージア - Uru
13. 星座になれたら - 結束バンド
14. 丸ノ内サディスティック - 椎名林檎
15. 秘密 - 東京事変
16. フライディ・チャイナタウン - 泰葉
17. Snow halation - μ's
18. 回る空うさぎ - Orangestar
19. アスノヨゾラ哨戒班 - Orangestar
20. 火星人 - ヨルシカ
21. 愛のけだもの - 神はサイコロを振らない × キタニタツヤ
```

### BV1JR6GBvEN1

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1JR6GBvEN1

```text
01. 夜に駆ける - YOASOBI
02. けーたいみしてよ - MAISONdes feat. はしメロ・maeshima soshi
03. ラヴィ - すりぃ feat. 鏡音レン
04. ヴァンパイア - DECO*27 feat. 初音ミク
05. アニマル - DECO*27 feat. 初音ミク
06. Overdose - なとり
07. HELP!! - Kobo Kanaeru
08. 真夜中のドア～stay with me - 松原みき
09. フライディ・チャイナタウン - 泰葉
10. Shape of My Heart - Sting
11. Stand by Me - Ben E. King
12. 紅蓮華 - LiSA
13. unravel - TK from 凛として時雨
14. 悪魔の子 - ヒグチアイ
15. 晴る - ヨルシカ
16. Anytime Anywhere - milet
17. September - Earth, Wind & Fire
18. 丸ノ内サディスティック - 椎名林檎
19. 1/2 - 川本真琴
20. シンデレラボーイ - Saucy Dog
21. ビビデバ - 星街すいせい
22. みちづれ - 星街すいせい
23. again - YUI
24. Rolling star - YUI
25. ギターと孤独と蒼い惑星 - 結束バンド
26. God knows... - 涼宮ハルヒ（平野綾）
27. 裸の心 - あいみょん
28. ヒカリヘ - miwa
29. ミカヅキ - さユり
30. Good-bye days - YUI for 雨音薫
31. サマータイムレコード - じん feat. IA
32. 1925 - T-POCKET feat. 初音ミク
33. 弱虫モンブラン - DECO*27 feat. GUMI
34. エンヴィーベイビー - Kanaria feat. GUMI
35. 8番出口 - EO feat. 鏡音リン
36. ボッカデラベリタ - 柊キライ feat. flower
37. からくりピエロ - 40mP feat. 初音ミク
38. シリョクケンサ - 40mP feat. GUMI
39. さよーならまたいつか! - 米津玄師
40. メランコリック - Junky feat. 鏡音リン
41. 酔いどれ知らず - Kanaria feat. GUMI
42. 吉原ラメント - 亜沙 feat. 重音テト
43. ロミオとシンデレラ - doriko feat. 初音ミク
44. 白い雪のプリンセスは - のぼる↑ feat. 初音ミク
45. 天ノ弱 - 164 feat. GUMI
46. Calc. - ジミーサムP feat. 初音ミク
47. ネバーフィクション - Kanaria feat. 星街すいせい
48. レクイエム - Kanaria feat. 星街すいせい
49. 酔いどれ知らず - Kanaria feat. GUMI
50. エンヴィーベイビー - Kanaria feat. GUMI
51. KING - Kanaria feat. GUMI
52. ソワレ - 星街すいせい
53. ビビデバ - 星街すいせい
54. Fly Me to the Moon - Kaye Ballard
55. ミカヅキ - さユり
56. 月光 - 鬼束ちひろ
57. 晩餐歌 - tuki.
58. 若者のすべて - フジファブリック
59. めぐる季節 - 井上あずみ
60. ルージュの伝言 - 松任谷由実
61. 風になる - つじあやの
62. 星座になれたら - 結束バンド
63. Overdose - なとり
64. SWEET MEMORIES - 松田聖子
65. ドライフラワー - 優里
66. 別の人の彼女になったよ - wacci
67. First Love - 宇多田ヒカル
68. Take Me Home, Country Roads - John Denver
69. Let It Be - The Beatles
70. Pretender - Official髭男dism
71. 心做し - 蝶々P feat. GUMI
72. 楓 - スピッツ
73. なんでもないや - RADWIMPS
74. パラレルナイト - 凛々咲
75. わたしの一番かわいいところ - FRUITS ZIPPER
76. 全方向美少女 - 乃紫
77. 食虫植物 - 理芽
78. 晩餐歌 - tuki.
79. 怪獣の花唄 - Vaundy
80. オトナブルー - 新しい学校のリーダーズ
81. POP STAR - 平井堅
82. ケセラセラ - Mrs. GREEN APPLE
83. 炉心融解 - iroha(sasaki) feat. 鏡音リン
84. マトリョシカ - ハチ feat. 初音ミク・GUMI
85. メルト - ryo(supercell) feat. 初音ミク
86. カタオモイ - Aimer
87. 蝶々結び - Aimer
88. ルビーの指環 - 寺尾聰
89. 壊れかけのRadio - 徳永英明
90. It's My Life - Talk Talk
91. Numb - Linkin Park
92. はいよろこんで - こっちのけんと
93. さよならエレジー - 菅田将暉
94. KICK BACK - 米津玄師
95. 怪物 - YOASOBI
96. 花になって - 緑黄色社会
97. ブルーバード - いきものがかり
98. Butter-Fly - 和田光司
```

### BV1XZ7XzNER4

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1XZ7XzNER4

```text
01. 1925 - 冨田悠斗(とみー／T-POCKET)
02. Lemon - 米津玄師
03. アイネクライネ - 米津玄師
04. いかないで - 想太
05. FLY ME TO THE MOON - Bart Howard & Kaye Ballard
06. 丸ノ内サディスティック - 椎名林檎
07. 春を告げる - yama
08. 星間飛行 - ランカ・リー=中島愛
09. 小夜子 - みきとP
10. シャルル - バルーン
11. 帝国少女 - R Sound Design
12. サウダージ - ポルノグラフィティ
13. ルパン三世のテーマ - 大野雄二
14. Just Be Friends - Dixie Flatline
15. 秒針を噛む - ずっと真夜中でいいのに。
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

### BV1djyxBkEoo

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1djyxBkEoo

```text
01. 丸ノ内サディスティック - 椎名林檎
02. 本能 - 椎名林檎
03. Departures～あなたにおくるアイの歌～ - EGOIST
04. ラブ・イズ・オーバー - 欧陽菲菲
05. 異邦人 - 久保田早紀
06. 恋におちて -Fall in love- - 小林明子
07. One more time, One more chance - 山崎まさよし
08. 会いたい - ちゅうでぃー
09. 夜明けと蛍 - n-buna feat. 初音ミク
10. ルピーの指輪 - 寺尾聰
11. Story - AI
12. たばこ - コレサワ
13. feel my soul - YUI
14. はじめてのチュウ - あんしんパパ
```

### BV13c1bBLE8G

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13c1bBLE8G

```text
01. サリシノパラ - みきとP feat. 初音ミク
02. きゅうくらりん - いよわ feat. 可不
03. SWEET MEMORIES - 松田聖子
04. 流星群 - コブクロ
05. 月光 - 鬼束ちひろ
06. エィリアンズ - きのホ。 feat. 初音ミク
07. 弱虫モンブラン - DECO*27
08. 妄想感傷代償連盟 - DECO*27
09. ギブス - Sheena Ringo
10. ここでキスして。 - 椎名林檎
11. 丸ノ内サディスティック - 椎名林檎
12. 本能 - 椎名林檎
13. Bad Day - Daniel Powter
14. カタオモイ - Aimer
15. さよならミッドナイト - 大柴広己
16. 夜明けと蛍 - n-buna feat. 初音ミク
17. 怪獣 - サカナクション
18. Wherever you are - ONE OK ROCK
```

### BV1k1421d7sv

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1k1421d7sv

```text
01. 東京レトロ - すこっぷ
02. 東京ブギウギ - 笠置シヅ子
03. 丸ノ内サディスティック - 椎名林檎
04. 長く短い祭 - 椎名林檎
05. 雨傘 - TOKIO
06. トウキョウ・シャンディ・ランデヴ - MAISONdes
07. 大阪LOVER - DREAMS COME TRUE
08. 夜空ノムコウ - SMAP
09. オレンジ - 逢坂大河(釘宮理恵),櫛枝実乃梨(堀江由衣),川嶋亜美(喜多村英梨)
10. メリッサ - ポルノグラフィティ
11. ガーデン - 藤井風
12. 津軽海峡・冬景色 - 石川さゆり
13. ノーダウト - Official髭男dism
14. きらきら武士 - レキシ
15. 犬かキャットかで死ぬまで喧嘩しよう！ - Official髭男dism
```

### BV1nw411u7HY

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1nw411u7HY

```text
01. (恋は)百年戦争 - 相対性理論
02. ヴィーナスとジーザス - やくしまるえつこ
03. 丸ノ内サディスティック - 椎名林檎
04. CHE.R.RY - YUI
05. 忘れてやらない - 結束バンド
06. 雨とカプチーノ - ヨルシカ
07. ノーチラス - ヨルシカ
08. ブレーメン - ヨルシカ
09. again - YUI
10. キラキラ - aiko
11. メロンソーダ - aiko
12. ヒッチコック - ヨルシカ
13. エイリアンズ - キリンジ
14. One more time, One more chance - 山崎まさよし
15. ひまわりの約束 - 秦基博
16. 世界はそれを愛と呼ぶんだぜ - サンボマスター
```

### BV1gx4y1k7jg

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1gx4y1k7jg

```text
01. チェリー - スピッツ
02. 空も飛べるはず - スピッツ
03. 恋 - 星野源
04. 丸ノ内サディスティック - 椎名林檎
05. CHE.R.RY - YUI
06. SAKURA - いきものがかり
07. うるわしきひと - いきものがかり
08. できっこないをやらなくちゃ - サンボマスター
09. ラブ・ストーリーは突然に - 小田和正
10. 恋愛裁判 - 40mP
11. メランコリック - Junky
12. 純情スカート - 40mP
13. シャルル - バルーン
14. ダーリン - 須田景凪
15. デスぺレート feat. LOLUET - TeddyLoid&Giga
16. damn - 藤井風
17. 花 - 藤井風
18. 晩餐歌 - tuki.
19. 若者のすべて - フジファブリック
20. Good-bye days - YUI
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

### BV13y45eWEUm

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV13y45eWEUm

```text
01. 悪魔の子 - ヒグチアイ
02. 丸ノ内サディスティック - 椎名林檎
03. ANIMA - ReoNa
04. メフィスト - 女王蜂
05. 名前のない怪物 - EGOIST
06. NIGHT DANCER - imase
07. 長く短い祭 - 椎名林檎
08. 公然の秘密 - 椎名林檎
09. READY!! - 765PRO ALLSTARS
10. 祝福 - YOASOBI
11. ねぇ - Perfume
12. PONPONPON - きゃりーぱみゅぱみゅ
13. 真生活 - 案山子
14. 燈 - 崎山蒼志
15. さよーならまたいつか！ - 米津玄師
16. Ready To Party - 稀羽すう
```

### BV17iXiYzE26

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV17iXiYzE26

```text
01. ノーダウト - Official髭男dism
02. 丸ノ内サディスティック - 椎名林檎
03. 秒針を噛む - ずっと真夜中でいいのに。
04. 祝福 - YOASOBI
05. 幾億光年 - Omoinotake
06. ベテルギウス - 優里
07. Subtitle - Official髭男dism
08. 願い - Sumika
09. One more time, One more chance - 山崎まさよし
10. 悪魔の子 - ヒグチアイ
11. だから僕は音楽を辞めた - ヨルシカ
12. 春泥棒 - ヨルシカ
13. 怪物 - YOASOBI
14. 透明人間 - 東京事変
```

### BV1BqJwzeENe

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1BqJwzeENe

```text
01. Lemon - 米津玄師
02. オレンジ - 逢坂大河(cv.釘宮理恵)、櫛枝実乃梨(cv.堀江由衣)、川嶋亜美(cv.喜多村英梨)
03. チェリー - スピッツ
04. CHE.R.RY - YUI
05. 名前の無い怪物 - EGOIST
06. 地獄で何が悪い - 星野源
07. supernova - 春野と雄之助
08. 静かなる逆襲 - 椎名林檎
09. 丸ノ内サディスティック - 椎名林檎
10. 愛を伝えたいだとか - あいみょん
11. 風になる - つじあやの
12. テルーの唄 - 手嶌葵
13. 少女レイ - みきとP
14. できっこないを やらなくちゃ - サンボマスター
15. 世界はそれを愛と呼ぶんだぜ - サンボマスター
16. 犬かキャットかで死ぬまでケンカしよう - Official髭男dism
```

### BV1vyzXB6EHN

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1vyzXB6EHN

```text
01. calling - Team halcyon
02. 思い出とペトリコール - 稀羽すう
03. ワールドイズマイン - ryo
04. 弱虫モンブラン (reloaded) - DECO*27
05. melt bitter - さとうもか
06. 115万キロのフィルム - Official髭男dism
07. ただ君に晴れ - ヨルシカ
08. 琥珀色の街、上海蟹の朝 - くるり
09. 異端なスター - Official髭男dism
10. 幾億光年 - Omoinotake
11. 丸ノ内サディスティック - 椎名林檎
12. 燈 - 崎山蒼志
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

### BV1mJZwB8EVa

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1mJZwB8EVa

```text
01. LUVORATORRRRRY! - GUMI
02. ピーチティー - ≒JOY
03. KING - Kanaria
04. ninelie - Aimer with chelly
05. 丸ノ内サディスティック - 椎名林檎
06. magnet - 流星P
07. 7 - 梅とら feat. LOLUET
08. Calc. - ジミーサムP
09. Whisper Whisper Whisper - Azari／v flower／歌愛ユキ
10. Lockdown(feat. NEONA) - PIKASONIC&Tatsunoshin&Neona
11. brilliant - niki
12. 翡翠のまち - メル／初音ミク
13. シャンティ - 青柳冬弥
14. 月光 - はるまきごはん
15. 三冬月。雨と0時 - 初音ミク／キョータ
16. ラブ&デストロイ - YUUKI MIYAKE／GUMI
17. ライアーダンス - DECO*27
18. ロミオとシンデレラ - doriko／初音ミク
19. エルヴァイオレット - 廉
20. 命に嫌われている - カンザキイオリ
21. ラピスレコード - 廉
22. 出来心 - Kotoha
23. ロンリーユニバース - Aqu3ra
24. ByeBye-Lover - samfree／巡音ルカ
25. 海蛍 - 香椎モイミ／花隈千冬
26. SPiCa - とくP／初音ミク
27. jewel - 梅とら
28. 心象カスケード - Freodore
29. セパレイト - ポリスピカデリー
30. ラブ&デストロイ - YUUKI MIYAKE
31. LadyLike - KIRA GUMI
32. リコレクションエンドロウル - ツミキ
33. ナイトダイバー - ファイルーズあい
34. 夜のピエロ - Ado
35. 青と夏 - Mrs. GREEN APPLE
36. とても素敵な六月でした - Eight
37. 怪獣 - サカナクション
38. ライカ - yamada
39. Calc. - ジミーサムP
40. end tree - 164
41. 独奏 - YASUHIRO
42. 夜に駆ける - YOASOBI
43. Beyond the way - Giga
44. イレヴンス - ポリスピカデリー
45. Rising Hope - LiSA
46. 限りなく灰色へ - すりぃ
47. ヴァニタス - 青栗鼠(feat.歌愛ユキ)
48. All Alone With You - EGOIST
49. ド屑 - なきそ
50. メリュー - n-buna feat.初音ミク
51. tear - DATEKEN
52. 東京テディベア - Neru
53. 夜もすがら君想ふ - 西沢さんP feat.GUMI
54. Hello, Worker - KEI
55. Beat Eater - ポリスピカデリー
56. 幽霊東京 - Ayase
57. ARROW - niki
58. ソラゴト - 明透
59. スロウリー - 明透
60. 深淵 - ヰ世界情緒
61. ラズライト - *Luna
62. ルーマー - ポリスピカデリー
63. エピローグ - *Luna
64. 他人事の音がする - あめのむらくもP
65. ワーワーワールド - Mitchie M
66. 花色 - KAITO
67. 深海アクアリウム - Misumi
68. 水星都市計画 - R Sound Design
69. 天使を見たんだ - なつめ千秋 feat. GUMI
70. シュガーソングとビターステップ - UNISON SQUARE GARDEN
71. アイネクライネ-piano.ver- - 米津玄師
72. カメレオン - すりぃ
73. ヘッジホッグ - Hedgehog
74. Mirror - Ado
75. アシンメトリー - なつめ千秋 feat. 鏡音レン
76. Brave Shine - Aimer
77. 福寿草 - ぐにょ feat. 初音ミク
78. Sugar Guitar - ポリスピカデリー
79. 夕空センチメンタル - エキゾチックかまたに feat. 初音ミク Dark
80. 背景、夏に溺れる - n-buna feat. 初音ミク
81. 花降らし - n-buna feat. 初音ミク
82. 銀河録 - はるまきごはん feat. 初音ミク
83. 白ゆき - n-buna feat. 初音ミク V3 Dark
84. 初恋日記 - 香椎モイミ feat. 音街ウナ
85. Rabbit - john
86. フラジール - nulut feat. GUMI
87. お呪い - なきそ feat. 花隈千冬
88. 虚ろを扇ぐ - 獅子志司 feat. 初音ミク
89. 命のユースティティア - Neru feat. 鏡音レン
90. 馬と鹿に謝って - Δ feat. v flower
91. 地球最後の告白を - kemu feat. GUMI
92. ロンリーユニバース - Aqu3ra feat. 初音ミク, flower
93. 流星少女 - れるりり feat. GUMI & 鳴花ヒメ
94. 花色 - 香椎モイミ feat. KAITO
95. SPiCa -acoustic arrange.ver- - とくP feat. 初音ミク
96. Before the Dawn - milet
97. アイディスマイル - とあ feat. 初音ミク, 鏡音リン
98. 路地裏ユニバース - 一之瀬ユウ feat. MAYU
99. レテノール - R Sound Design feat. 初音ミク
100. FOCUS - KIRA feat. GUMI
101. L愛KE - 梅とら feat. 初音ミク
102. イレヴンス - ポリスピカデリー feat. 初音ミク
103. ナツノカゼ御来光 - ぷす feat. 初音ミク
104. 恋をしたような - EasyPop feat. 巡音ルカ, 初音ミク
105. カガリビト - millstones feat. 初音ミク
106. 怪獣 - サカナクション
107. Blood - Azari
108. 7 - 梅とら feat. LOLUET
109. Beat_Eater - ポリスピカデリー feat. 初音ミク
110. 雨音ぺトリコール - koyuki feat. 初音ミク
111. Jewel - 梅とら feat. 初音ミク
112. メアの教育 - 清水コウ
113. アイソトープ - syudou feat. 初音ミク
114. ラピスレコード - 廉 feat. 星界
115. ユアライト - エキゾチックかまたに feat. 初音ミク
116. 紫色の向日葵 - 香椎モイミ feat. 羽累
117. ライカ - 長瀬有花
118. 牆壁 - Orangestar feat. IA
119. 海蛍 - 香椎モイミ feat. 花隈千冬
120. Subtitle - Official髭男dism
121. SPiCa (Acoustic ver.) - とくP feat. 初音ミク
122. GLAMOROUS SKY - NANA starring 中島美嘉
123. Starry map - 霜月はるか
124. ダヴィンチの告白 - 666 feat. GUMI
125. Reunion - ClariS
126. ANIMAる - 梅とら
127. 愛Dee - Mitchie M feat. 初音ミク, 巡音ルカ
128. ヨヒラ - n-buna feat. 初音ミク
129. ナーヴ・インパルス - ポリスピカデリー feat. 闇音レンリ
130. プラトニック・ラヴ - メル feat. IA
131. プラネテス - キタニタツヤ
132. エリカの憂い - ヰ世界情緒
133. ハナレバナシ - とあ
134. 虎視眈々 - 梅とら
135. 夜もすがら君想ふ - 西沢さんP feat.GUMI
136. Awake Now - 雄之助
137. プロローグ - Uru
138. ノルア・ドルア・ビー - すりぃ feat.鏡音レン
139. ヴァニタス - 青栗鼠(feat.歌愛ユキ)
140. 出来心 - Kotoha
141. よるをおよぐ - 西島尊大／初音ミク
142. Ur-Style - DATEKEN
143. サラバイサラバイ - とあ
144. 例えば、今此処に置かれた花に - 164
145. Perfect World - Lisa Monika YK
146. 小夜子 - みきとP
147. RE: I AM - Aimer
148. ラプンツェル - n-buna
149. S・K・Y - ライブP
150. ハイドアンド・シーク - 19 iku
151. Bye-Bye Lover - samfree
152. Beautiful World - 宇多田ヒカル
153. Magnetic - ILLIT
154. プラチナ - 坂本真綾
155. Never Grow Up - ちゃんみな
156. Rem - フヲルテ
157. ハートアラモード - DECO*27
158. Mr.Wonder - takamatt
159. 消えてしまえたならいいのに、なんて - エキゾチックかまたに
160. シネマ - Ayase
161. リコレクションエンドロウル - ツミキ
162. Orca - いるかアイス
163. 世界を壊している - Neru
164. チーズケーキクライシス - 西沢さんP
165. 記憶の水槽 - キタニタツヤ
166. magnet - minato／流星P
167. Boi - ポリスピカデリー
168. 撫でんな - 柊マグネタイト
169. サラマンダー - DECO*27
170. ストリーミングハート - DECO*27
171. シンデレラ(Giga First Night Remix) - DECO*27
172. ラグトレイン - 稲葉曇
173. シニヨンの兵隊 - しーくん
174. 不完全な処遇 - GUMI
175. ストロボ - YAMADA
176. ホワイトハッピー - MARETU
177. 晩餐歌 - tuki.
178. more than words - 羊文学
179. 悪魔の子 - ヒグチアイ
180. ハートブレイク≒ブルース - ケダルイ
181. ワールド・ランプシェード - GUMI
182. シリョクケンサ - GUMI
183. キドアイラク - GUMI
184. フィクサー - ぬゆり
185. さかさシンドローム - 19 iku
186. magic city - 電ポルP
187. ディナーベル - はるまきごはん
188. crack - keeno
```

### BV1wUZcBQEBo

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1wUZcBQEBo

```text
01. センチメンタルな愛慕心 - なつめ千秋
02. 春嵐 - john feat. 初音ミク
03. ダーリンダンス - かいりきベア feat. 初音ミク
04. だから僕は音楽を辞めた - ヨルシカ
05. アウトサイダー - Eve feat. 初音ミク
06. このピアノでお前を8759632145回ぶん殴る - SLAVE.V-V-R feat. 猫村いろは
07. セイシュンライナー - 蝶々P feat. 初音ミク
08. ELECT - niki
09. シャンティ - wotaku feat. KAITO
10. ゼロ距離恋愛 - れるりり feat. 鳴花ヒメ
11. ラヴィ - すりぃ feat. 鏡音レン
12. 唯々なりレイデエ - koyori(電ポルP) feat. 初音ミク
13. Look at Me Now - スダンナユズユリー
14. 朱色の砂浜 - みきとP feat. GUMI
15. バスケットワーム - MI8k feat. GUMI
16. プラネテス - キタニタツヤ
17. 夜空色シンパシズム - emon(Tes.) feat. 初音ミク
18. 丸ノ内サディスティック - 椎名林檎
19. MOTHER - 奥華子×96猫
20. 天ノ弱 - 164 feat. GUMI
21. 雨とペトラ - バルーン feat. flower
22. 一心不乱 - 梅とら feat. 巡音ルカ, 初音ミク, GUMI
23. Gimme×Gimme - 八王子P × Giga feat. 初音ミク, 鏡音リン
24. GETCHA! - Giga & KIRA feat. 初音ミク & GUMI
25. シネマ - Ayase feat. 初音ミク
26. レゾンデイトル・カレイドスコウプ - ツミキ feat. 初音ミク
27. ビビデバ - 星街すいせい
28. 濫觴生命 - Orangestar feat. IA
29. 愛を伝えたいだとか - あいみょん
30. コバルトメモリーズ - はるまきごはん feat. 初音ミク
31. SPiCa -acoustic arrange.ver- - とくP feat. 初音ミク
32. ライカ - yamada feat. 初音ミク
33. 海蛍 - 香椎モイミ feat. 花隈千冬
34. 光彩 - めろくる feat. 初音ミク
35. Black Board - 一之瀬ユウ feat. 初音ミク
36. 少年少女モラトリアムサヴァイヴ - TOKOTOKO(西沢さんP) feat. GUMI
37. ディスペア - ユリイ・カノン feat. 裏命
38. ラッシャイナ - 柊マグネタイト feat. 可不
39. エメラルドシティ - TOKOTOKO(西沢さんP) feat. MAYU
40. ラブ&デストロイ - MI8k feat. GUMI
41. 花瓶に触れた - バルーン feat. flower
42. パメラ - バルーン feat. flower
43. アイデンティティ - Kanaria feat. GUMI×初音ミク
44. 君の脈で踊りたかった - ピコン feat. 初音ミク
45. メルト - ryo feat. 初音ミク
46. 地球最後の告白を acoustic ver - kemu feat. GUMI
47. No Logic - ジミーサムP feat. 巡音ルカ
48. ハウトゥー世界征服 - Neru feat. 鏡音リン & 鏡音レン
49. 木星のビート - ナユタン星人 feat. 初音ミク
50. METEOR - T.M.Revolution
51. 飛行少女 - 國蛋GorDoN
52. 劇場愛歌 - n-buna feat. miki
53. 白ゆき - n-buna feat. 初音ミク
54. アイラ - n-buna feat. GUMI
55. The Sweet Loop - 香椎モイミ
56. ミルクパズル - wotaku feat. KAITO
57. GENTLE - 香椎モイミ feat. 初音ミク
58. 初恋日記 - 香椎モイミ
59. ヘッジホッグ - Noz.
60. GLAMOROUS SKY - 中島美嘉
61. 出来心 - ポリスピカデリー
62. Blood - Azari
63. ピーチティー - なつめ千秋
64. miss you - ツカダタカシゲ
65. プラネテス - seiza
66. 7 - 梅とら
67. ninelie - Aimer
68. Beat Eater - ポリスピカデリー
69. ルカルカ★ナイトフィーバー - samfree
70. she - keeno
71. もしも一人残されて、世界が嘘じゃないなら - n.k
72. my crash - 香椎モイミ
73. 天誅 - 香椎モイミ
74. 限りなく灰色へ - すりぃ
75. G4L - Giga
76. ソラゴト - asu
77. スロウリー - asu
78. シエレトワール - 蝶々P
79. 命ばっかり - ぬゆり
80. brilliant - niki
81. L愛KE - 梅とら
82. 曖昧さ回避 - ポリスピカデリー
83. CH4NGE - Giga
84. 三冬月。雨と０時 - キョータ
85. ラピスレコード - 廉
86. 白い雪のプリンセスは - のぼる↑
87. カガリビト - millstones
88. 月光 - はるまきごはん
89. 侵蝕 - niki
90. Stay - The Kid LAROI, Justin Bieber
91. STYX HELIX - MYTH&ROID
92. 晴天前夜 - ウォルピスカーター
93. 雨音ノイズ - 40mP
94. Flavor Of Life - 宇多田ヒカル
95. soundless voice - ひとしずくP
96. シャルル - バルーン
97. 明日世界が滅ぶなら - プロペリン
98. 転校前夜 - risou
99. ELECT - niki
100. 絶え間なく藍色 - 獅子志司
101. 虚ろを扇ぐ - 獅子志司
102. マインドキャッスル - 廉
103. 酔いどれ知らず - Kanaria
104. アスノヨゾラ哨戒班 - Orangestar
105. ロミオとシンデレラ - doriko
106. 彼岸薔薇 - iPPei
107. Jewel - 梅とら
108. Shadow Shadow - Azari feat. v flower
109. 月陽-ツキアカリ- - みきとP feat. GUMI
110. 革命道中 - アイナ・ジ・エンド
111. アバウト - ヤバス&初音ミク
112. 月光 - はるまきごはん
113. 水死体にもどらないで - いよわ feat. 初音ミク, v flower
114. シニカル・シニカル - 吐息 feat. Such
115. 紫色の向日葵 - 香椎モイミ feat. 羽累
116. ソラゴト - 明透
117. 威風堂々 - 梅とら feat. 巡音ルカ, 初音ミク, GUMI, IA, 鏡音リン
118. セパレイト - ポリスピカデリー
119. アイボリー - Aqu3ra
120. 右肩の蝶 - のりP
121. 侵蝕 - niki
122. Beyond the way - Giga
123. さよならエレジー - 菅田将暉
124. 夜のピエロ - Ado
125. モニタリング - DECO*27
126. Pretender - Official髭男dism
127. 君が好きだと叫びたい - BAAD
128. KILLER B - 梅とら
129. グラーヴェ - niki
130. ライラック - Mrs. GREEN APPLE
131. アイソトープ - r-906
132. ECHO - Crusher-P
133. アイシテ - とあ
134. 三日月ステップ - r-906
135. 少女レイ - みきとP
```

### BV1yTXmBBEG1

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1yTXmBBEG1

```text
01. シャルル - flower
02. 幽霊東京 - Ayase feat. 初音ミク
03. 夜撫でるメノウ - Ayase feat. 初音ミク
04. よるのあと - adieu
05. Soranji - Mrs. GREEN APPLE
06. 366日 - HY
07. 丸ノ内サディスティック - 椎名林檎
08. アイネクライネ - 米津玄師
09. ライラック - Mrs. GREEN APPLE
10. 最高到達点 - SEKAI NO OWARI
11. 夜明けと蛍 - n-buna
12. 美しい鰭 - スピッツ
13. 君の知らない物語 - supercell
14. レオ - 優里
15. 踊り子 - Vaundy
16. 春を告げる - yama
17. なんでもないや(movie ver.) - 上白石萌音
18. ブラック★ロックシューター - supercell
```

### BV1MEP8z4E1J

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1MEP8z4E1J

```text
01. 夜もすがら君想ふ - TOKOTOKO(西沢さんP)
02. First Love - 宇多田ヒカル
03. ドライフラワー - 優里
04. カタオモイ - Aimer
05. たばこ - コレサワ
06. 変わらないもの - 奥華子
07. rain stops, good-bye - におP
08. ロミオとシンデレラ - doriko
09. ワールドイズマイン - ryo
10. 炎 - LiSA
11. なんでもないや - RADWIMPS
12. からくりピエロ - 40mP
13. さよならメモリーズ - supercell
14. 怪物 - YOASOBI
15. 丸ノ内サディスティック - 椎名林檎
16. 主演 - 天ノ譜ステラ
17. LOSER - 米津玄師(ハチ)
18. 天ノ弱 - 164
19. ドライフラワー - 優里
20. 夜咄ディセイブ - じん(自然の敵P)
21. ネトゲ廃人シュプレヒコール - さつき が てんこもり
22. シザーハンズ - Nem
23. パンダヒーロー - 米津玄師(ハチ)
24. 罪と罰 - 椎名林檎
25. トリノコシティ - 40mP
26. 小夜子 - みきとP
27. 夜明けと蛍 - n-buna
28. 少女レイ - みきとP
29. ハッピーシンセサイザ - EasyPop
30. ウミユリ海底譚 - n-buna
31. ただ君に晴れ - ヨルシカ
32. 君の知らない物語 - supercell
33. ANIMA - ReoNa
34. ハートシェイカー・ドキュメンタリー - 天ノ譜ステラ
35. ファンサ - HoneyWorks
36. ギラギラ - Ado
37. Departures ～あなたにおくるアイの歌～ - EGOIST
38. 死ぬのがいいわ - 藤井風
39. 晩餐歌 - tuki.
40. 花瓶に触れた - 須田景凪(バルーン)
41. from Y to Y - ジミーサムP
42. 側にいて - 阿部真央
43. となりのトトロ - 井上あずみ
44. 最後の雨 - 中西保志
45. 堕天ダンス - 天ノ譜ステラ
46. 夜もすがら君想ふ - TOKOTOKO(西沢さんP)
47. たばこ - コレサワ
48. 奏 - スキマスイッチ
49. 炎 - LiSA
50. ウタカタララバイ - Ado
51. ハウっちゃう - 天ノ譜ステラ
52. 愛を伝えたいだとか - あいみょん
53. 曖昧劣情Lover - koyori(電ポルP)
54. たばこ - コレサワ
55. 心做し - 蝶々P
56. 曖昧劣情Lover - koyori(電ポルP)
57. メフィスト - 女王蜂
58. First Love - 宇多田ヒカル
59. ただ君に晴れ - ヨルシカ
60. パート・オブ・ユア・ワールド - Disney
61. A Whole New World - Disney
62. いのちの名前 - 木村弓
63. 小夜子 - みきとP
64. カブトムシ - aiko
65. カタオモイ - Aimer
66. Snow halation - μ's
67. secret base〜君がくれたもの〜 - ZONE
68. 怪獣の花唄 - Vaundy
69. 奏 - スキマスイッチ
70. Wherever you are - ONE OK ROCK
71. glow - keeno
72. Kawaii Kaiwai - PiKi
73. Step and a step - NiziU
74. アタシは問題作 - Ado
75. トウキョウ・シャンディ・ランデヴ - MAISONdes
76. 怪獣の花唄 - Vaundy
77. 主演 - 天ノ譜ステラ
78. 奏 - スキマスイッチ
79. First Love - 宇多田ヒカル
80. コブラ - 前野曜子
81. さよならミッドナイト - 大柴広己(もじゃ)
82. Story - AI
83. センパイ。 - HoneyWorks meets TrySail
84. 今好きになる。 - HoneyWorks
85. 告白予行練習 - HoneyWorks
86. 太陽系デスコ - ナユタン星人
87. きゅうくらりん - いよわ
88. 初恋の絵本 - HoneyWorks
89. ロミオとシンデレラ - doriko
90. from Y to Y - ジミーサムP
91. ワールドイズマイン - ryo
92. 恋愛サーキュレーション - 千石撫子(花澤香菜)
93. sweets parade - 髏々宮カルタ(花澤香菜)
94. 白金ディスコ - 阿良々木月火(井口裕香)
95. ファンサ - HoneyWorks
96. 丸ノ内サディスティック - 椎名林檎
97. Kawaii Kaiwai - PiKi
98. 怪物 - YOASOBI
99. ウタカタララバイ - Ado
100. わたしのアール - 和田たけあき(くらげP)
101. キセキ - GRe4N BOYZ(GReeeeN)
102. 幽霊東京 - Ayase
103. 紅蓮華 - LiSA
104. only my railgun - fripSide
105. God knows... - 涼宮ハルヒ(平野綾)
106. Butter-Fly - 和田光司
107. Fire◎Flower - halyosy
108. 裏表ラバーズ - wowaka(現実逃避P)
109. magnet - minato(流星P)
110. 花になって - 緑黄色社会
111. メフィスト - 女王蜂
112. モニタリング - DECO*27
113. secret base〜君がくれたもの〜 - ZONE
114. glow - keeno
115. ハイドアンド・シーク - 19's Sound Factory
116. 夜もすがら君想ふ - TOKOTOKO(西沢さんP)
117. パンダヒーロー - ハチ
118. ブリキノダンス - 日向電工
119. 砂の惑星 - ハチ
120. ネトゲ廃人シュプレヒコール - さつき が てんこもり
121. 嘘 - シド
122. 愛を伝えたいだとか - あいみょん
123. 私は最強 - Ado
124. Love so sweet - 嵐
125. 夜明けと蛍 - n-buna
126. 夜咄ディセイブ - じん(自然の敵P)
127. アイロニ - すこっぷ
128. 晩餐歌 - tuki.
129. ドライフラワー - 優里
130. アイネクライネ - 米津玄師
131. フォニイ - ツミキ
132. 名前のない怪物 - EGOIST
133. First Love - 宇多田ヒカル
134. ギラギラ - Ado
135. アイロニ - すこっぷ
136. only my railgun - fripSide
137. 一度だけの恋なら - ワルキューレ
138. A Whole New World - Disney
139. 曖昧劣情Lover - koyori(電ポルP)
140. ただ君に晴れ - ヨルシカ
141. ダイアモンド クレバス - シェリル・ノーム starring May'n
142. rain stops, good-bye - におP
143. 怪物 - YOASOBI
144. 炎 - LiSA
145. サムライハート(Some Like It Hot!!) - SPYAIR
146. プライド革命 - CHiCO with HoneyWorks
147. 愛を伝えたいだとか - あいみょん
148. 怪獣の花唄 - Vaundy
149. 心拍数♯0822 - 蝶々P
150. 夕立のりぼん - みきとP
151. サリシノハラ - みきとP
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

### BV1c1QxBuEnn

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1c1QxBuEnn

```text
01. 変わらないもの - 奥華子
02. 盗作 - ヨルシカ
03. 丸ノ内サディスティック - 椎名林檎
04. ギブス - 椎名林檎
05. そういう好き - wacci
06. 弱虫モンブラン - DECO*27
07. 三時のキス - ロクデナシ
08. 春の歌 - スピッツ
09. アルジャーノン - ヨルシカ
10. 栞 - クリープハイプ
11. exダーリン - クリープハイプ
12. アイネクライネ - 米津玄師
13. シャルル - バルーン
14. カブトムシ - aiko
15. 声 - 羊文学
16. ヒカルイノチ - Kitri
17. きにぴ - 澄花
18. ちょっと待って！ - 澄花
19. 泣き虫上等 - 澄花
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
01. 丸ノ内サディスティック - 椎名林檎
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

### BV1daVs6eE2r

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1daVs6eE2r

```text
01. ただ君に晴れ - ヨルシカ
02. チェリーポップ - DECO*27
03. First Love - 宇多田ヒカル
04. Beautiful World - 宇多田ヒカル
05. 天ノ弱 - 164
06. 小夜子 - みきとP
07. 素敵なしゅうまつを！ - キタニタツヤ
08. 悪魔の踊り方 - キタニタツヤ
09. 偽物人間40号 - ¿?
10. KING - Kanaria
11. 神っぽいな - ピノキオピー
12. マーシャル・マキシマイザー - 柊マグネタイト
13. 何度でも - DREAMS COME TRUE
14. Story - AI
15. ギブス - 椎名林檎
16. 本能 - 椎名林檎
17. 丸ノ内サディスティック - 椎名林檎
18. 丸ノ内サディスティック - 椎名林檎
19. 会いたくて会いたくて - 西野カナ
```

### BV1jbGq6wEMw

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1jbGq6wEMw

```text
01. 裏切りの夕焼け - Theatre Brook
02. コンプリケイション - ROOKiEZ is PUNK'D
03. 流れ星～Shooting Star～ - HOME MADE 家族
04. ラブソング - なとり
05. Overdose - なとり
06. セレナーデ - なとり
07. 丸ノ内サディスティック - 椎名林檎
08. おとなの掟 - Doughnuts Hole
09. Duty Friend - NIKIIE
10. 晩餐歌 - tuki.
11. 奏 - スキマスイッチ
12. 世界が終るまでは… - WANDS
13. damn - 藤井風
14. え？あぁ、そう。 - 蝶々P feat. 初音ミク
15. 混沌ブギ - jon-YAKITORY feat. 初音ミク
16. ラヴィ - すりぃ feat. 鏡音レン
17. ブリキノダンス - 日向電工 feat. 初音ミク
18. マトリョシカ - ハチ feat. 初音ミク,GUMI
19. ネトゲ廃人シュプレヒコール - さつき が てんこもり feat. 初音ミク
20. Mr.Music - れるりり,ロンチーノ=ペペ,かごめP feat. 初音ミク,巡音ルカ,鏡音リン,鏡音レン,GUMI,歌愛ユキ
21. Honto - sumika
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

### BV1VroAB3EBy

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1VroAB3EBy

```text
01. キャラクター - 緑黄色社会
02. 丸ノ内サディスティック - 椎名林檎
03. スパークル - 幾田りら
04. イエスタデイ - Official髭男dism
05. 蝶々結び - Aimer
06. フォニイ - ツミキ
07. 変わらないもの - 奥華子
08. I wanna see you - 阿部真央
09. 星座になれたら - 結束バンド
10. Sincerely - TRUE
11. ray - BUMP OF CHICKEN
12. 徒桜 - 蓮花
13. キミソラキセキ - EGOIST
14. 名前のない怪物 - EGOIST
15. Fire◎Flower - halyosy feat. 鏡音レン
16. 点描の唄 - Mrs. GREEN APPLE
17. ケセラセラ - Mrs. GREEN APPLE
18. ダンスホール - Mrs. GREEN APPLE
19. はいよろこんで - こっちのけんと
20. Everything - MISIA
21. ライラック - 美波
22. 夜に駆ける - YOASOBI
23. 曲名はまだないです - Aogumo
24. Pray - Tommy heavenly6
25. 明日への手紙 - 手嶌葵
26. たばこ - コレサワ
27. フィナーレ。 - eill
28. Departures ～あなたにおくるアイの歌～ - EGOIST
29. 地球最後の告白を - kemu feat.GUMI
30. ハレ晴れユカイ - 涼宮ハルヒ(平野綾)×長門有希(茅原実里)×朝比奈みくる(後藤邑子)
31. Don't say "lazy" - 桜高軽音部
32. キセキ - GReeeeN
33. GO!!! - FLOW
34. ハルモニア - RYTHEM
35. うたかた花火 - supercell
36. my sweet heart - 小松里賀
37. 新時代 - Ado
38. 炎 - LiSA
39. 逆光 - Ado
40. 秒針を噛む - ずっと真夜中でいいのに。
41. お願いマッスル - 紗倉ひびき(ファイルーズあい)&街雄鳴造(石川界人)
42. 残響散歌 - Aimer
43. 散歩の邪魔 - いよわ
44. 咲かせや咲かせ - EGOIST
```

### BV1ReVs6AEmk

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1ReVs6AEmk

```text
01. ラプンツェル - n-buna feat. 初音ミク
02. 斜陽 - ヨルシカ
03. シンデレラボーイ - Saucy Dog
04. 雨とカプチーノ - ヨルシカ
05. ダーリン - 須田景凪
06. ダーリン - Mrs. GREEN APPLE
07. 美しい鰭 - スピッツ
08. サリシノハラ - みきとP feat. 初音ミク
09. 丸ノ内サディスティック - 椎名林檎
10. 罪と罰 - 椎名林檎
11. おやすみ泣き声、さよなら歌姫 - クリープハイプ
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

### BV1co7i6QEez

编辑链接：https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=BV1co7i6QEez

```text
01. Lemon - 米津玄師
02. 炎 - LiSA
03. 花に亡霊 - ヨルシカ
04. さよならエレジー - 菅田将暉
05. あぶく - ヨルシカ
06. Ham - ずっと真夜中でいいのに。
07. 正しくなれない - ずっと真夜中でいいのに。
08. 恋人ごっこ - マカロニえんぴつ
09. ハルカ - YOASOBI
10. プラネタリウム - 大塚愛
11. 黒毛和牛上塩タン焼680円 - 大塚愛
12. ヒトリノ夜 - ポルノグラフィティ
13. ダーリン - Mrs. GREEN APPLE
14. やさしさで溢れるように - JUJU
15. 永遠のあくる日 - Ado
16. 丸ノ内サディスティック - 椎名林檎
17. 独りんぼエンヴィー - koyori(電ポルP) feat. 初音ミク
18. ヒッチコック - ヨルシカ
19. 天体観測 - BUMP OF CHICKEN
20. メリュー - n-buna feat. 初音ミク
21. メルト - ryo(supercell) feat. 初音ミク
22. 晴る - ヨルシカ
23. 花の塔 - さユり
```
