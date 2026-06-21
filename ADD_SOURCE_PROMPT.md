# 来源添加 prompt

用于后续让 AI 添加 `song-search` / `culua.com` 歌切来源时直接复制，避免把 GitHub Pages 和 `culua.com` 的处理方式混用。

```text
请只处理 song-search / culua.com 歌站本体。项目根目录是 C:\Users\终焉\Documents\culua_web_h5，分支是 codex/server-deploy。不要使用旧的 C:\Users\终焉\Documents\New project，也不要碰 FeishuPy、飞书桥接、APP、网络控制台或 relay/proxy 相关逻辑。

工作前先执行：
git rev-parse --show-toplevel
git branch --show-current
git status --short

我要添加来源：
<来源名> <BV号>

GitHub Pages / main：
1. 只有用户明确说要改 GitHub 时才处理。
2. 以 GitHub 云端 main 分支为准，不要相信本地 main 或旧目录。
3. GitHub 侧只改配置，不改抓取逻辑。
4. BV 号大小写必须保持用户给出的原样。

culua.com / codex/server-deploy：
1. 本地配置是 scripts/singer-configs.json。
2. 服务器运行时配置是 /var/lib/song-search/singer-configs.json，且会覆盖本地配置；添加来源时需要先备份再同步。
3. 先用 B 站 view API 查询入口 BV：
   https://api.bilibili.com/x/web-interface/view?bvid=<BV号>
4. 如果 ugc_season.sections 有小节，按小节拆来源时使用 sectionTitle / sectionTitles 精确匹配，并在 others 上加 excludeSectionTitles 避免重复。
5. 如果没有 ugc_season.sections，只是普通多分P BV，不要加 sectionTitle；现有 scripts/update-songs.js 会把入口 BV 本身作为视频并读取 pages。
6. 如果分P标题是 `with 嘉宾 02. 歌名 - 歌手`，应保留现有解析流程，只做兼容性清洗，不要破坏普通 `001. 歌名 - 歌手`；如果末尾只有分隔用的 `-`，清洗掉这个空歌手分隔符。

验证：
- node --check scripts/update-songs.js
- node --check page-directory-widget.js
- node scripts/check-song-library.js
- 发布前记录公网：npm run -s check:live -- --json
- 发布后用 --min-total=<发布前 totalSongs> 防止歌库回退。
- 新来源必须在 https://www.culua.com/api/bootstrap 可见。
- 新来源 data 文件必须可访问，且包含入口 BV。
- 用 /api/search?fields=bvid,source,title,artist&q=<BV号> 验证 BV 命中。

发布：
1. 如果只改页面/CSS/前端脚本，用 docs/culua-server-guide.md 的“保留线上数据”流程。
2. 如果改来源配置，需要同步服务器 /var/lib/song-search/singer-configs.json 后运行：
   ssh culua "sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh"
3. 不要用单纯 git reset + restart 替代来源刷新。

提交：
- 只 stage 本次相关文件。
- 不提交本地旧 data/*.js、data/index.json、缓存、截图、日志。
- commit message 用中文，例如：feat: 新增 <来源名> 歌切来源。
```

## 文件清单

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `ADD_SOURCE_PROMPT.md` | 根目录来源添加提示词 | 固定 GitHub Pages 与 `culua.com` 添加来源的不同流程、BV 分P/合集判断、验证和发布要求 | 与 `docs/add-source-prompt.md` 内容互补；用于新会话快速复制 |
| `docs/add-source-prompt.md` | 详细添加/删除来源提示 | 记录来源新增、删除、runtime 配置和验证细节 | 可作为本 prompt 的扩展说明 |
