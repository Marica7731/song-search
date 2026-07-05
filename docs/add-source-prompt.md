# 添加歌切来源提示词

用于以后交给 AI 继续添加来源时复制。核心目标是避免把 GitHub Pages 数据更新主线和 `culua.com` 服务器部署方式混用。

```text
请只处理 song-search / culua.com 歌站本体，不要碰 FeishuPy、飞书桥接、APP、网络控制台，也不要动 relay/proxy 相关逻辑。

工作前先确认项目根目录是 C:\Users\终焉\Documents\culua_web_h5，分支是 codex/server-deploy，并检查 git status。

我要添加来源：
<来源名> <BV号>

GitHub Pages / main 侧：
1. 以 GitHub 云端 main 分支为准，不要相信本地 main 或旧目录。
2. GitHub main 不读取 `scripts/singer-configs.json`。来源入口在 `scripts/update-songs.js` 的内联 `SINGER_CONFIGS`。
3. GitHub main 的运行方式是 Puppeteer 打开 B 站网页，从入口 BV 页面解析候选合集 BV 并抽样；添加来源就是补入口 BV 配置，不要改成接口展开流程。
4. 不要改 GitHub main 的抓取代码逻辑，不要触发 workflow，除非用户明确要求。
5. BV 号大小写必须保持用户给出的原样。

culua.com / codex/server-deploy 侧：
1. 本地只在 C:\Users\终焉\Documents\culua_web_h5 修改。
2. 来源配置优先改 scripts/singer-configs.json。
3. culua.com 的运行方式是读取 JSON 配置，调用 B 站 view API 展开合集、分 P 和封面；不要照搬 GitHub 的网页抽样逻辑。
4. 先用 B 站 view API 查询入口 BV 是否属于 ugc_season.sections。
5. 如果入口 BV 属于合集小节，新增来源时加 sectionTitle 为接口返回的小节标题；同时在 非常驻妹妹 / others 上加 excludeSectionTitles，避免重复收录。
6. 如果入口 BV 已经拆成独立合集，或只是独立 BV / 普通合集，不要乱加 sectionTitle；如果之前加过 sectionTitle，要移除并同步清理 others 的排除项。
7. 服务器运行时配置 /var/lib/song-search/singer-configs.json 也要备份后同步同样的来源配置。
8. 推送或通过 GitHub connector 更新 codex/server-deploy 后，运行 `sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh` 发布。

验证：
- node --check scripts/update-songs.js
- node scripts/check-song-library.js
- 服务器刷新输出必须显示新来源成功生成。
- 公网 https://www.culua.com/api/bootstrap 必须包含新 data 文件和 alias。
- 公网 https://www.culua.com/data/<file>.js 必须可访问，并包含入口 BV。

提交：
- 只提交本次相关文件。
- commit message 用中文，例如 feat: 新增 <来源名> 歌切来源。
- 如果只处理 GitHub main，就只提交 `main:scripts/update-songs.js` 的来源配置；不要混入 `codex/server-deploy` 的文档、JSON 配置或服务器发布。
- 如果只处理 culua.com，就提交 `codex/server-deploy` 的 JSON 配置和必要文档；不要混入 GitHub main 的数据更新提交。
```

## 删除来源提示

删除来源时同样要区分两端：

- 如果只是断更封存、网页仍需可见，不走删除流程。保留配置项、`data/<file>.js` 和 `data/index.json` 入口，在 GitHub 配置与服务器运行时配置中设置 `archived: true`，保留 `file/alias`；`bvids` 可置空以移出正式刷新任务，让刷新脚本跳过抓取但保留历史数据。
- GitHub Pages / `main`：以云端 `main` 为准，删除 `scripts/update-songs.js` 里的对应 `SINGER_CONFIGS` 配置项；如果旧数据文件已经被跟踪，也要同步删除 `data/<file>.js` 并从 `data/index.json` 移除对应文件和别名，避免旧页面继续加载残留来源。
- `culua.com` / `codex/server-deploy`：删除 `scripts/singer-configs.json` 配置项、`data/<file>.js` 和 `data/index.json` 中对应索引；服务器运行时 `/var/lib/song-search/singer-configs.json` 也要先备份再删除同一项。
- 发布必须走 `sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh`，让服务器重新生成数据并 reload 服务；不要裸跑刷新脚本，避免和 cron 同时写数据。
- 验证必须确认公网 `/api/bootstrap` 不再包含该 alias/file，`/api/search?q=<BV号>` 命中为 0，且旧 `/data/<file>.js` 不再可访问。

## 文件说明

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `docs/add-source-prompt.md` | 后续添加来源的交接提示词 | 固定 GitHub main 与 `culua.com` 部署分支的不同处理方式、验证方式和提交要求 | 由 `README.md` 和 `docs/file-manifest.md` 引用，用于减少后续混改风险 |
