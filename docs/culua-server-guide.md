# culua 服务器使用指南

本文给后续 AI 或维护者快速接手 `culua.com` 歌站服务器使用。范围只包含歌站本体，不包含 FeishuPy、飞书桥接、APP、网络控制台或其他项目。

## 首读结论

```text
本地仓库：C:\Users\终焉\Documents\culua_web_h5
GitHub 仓库：https://github.com/Marica7731/song-search.git
公网地址：https://www.culua.com/
SSH alias：culua
服务器工作目录：/var/www/song-search
服务名：song-search.service
服务端口：127.0.0.1:3230
部署分支：codex/server-deploy
GitHub Pages 数据主线：main
```

先确认当前目录是真正的仓库根目录：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git rev-parse --show-toplevel
git branch --show-current
git status -sb
```

期望根目录：

```text
C:/Users/终焉/Documents/culua_web_h5
```

不要在 `C:\Users\����` 这类乱码路径、旧目录 `C:\Users\终焉\Documents\New project\song-search` 或服务器临时目录里直接开发。

## SSH 定位

本机 SSH 配置文件：

```text
C:\Users\终焉\.ssh\config
```

当前可用配置：

```sshconfig
Host culua
  HostName 103.207.68.48
  User codex
  Port 38222
  IdentityFile C:\Users\终焉\.ssh\codex_culua_ed25519
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

连接规则：

- 使用 `ssh culua`，不要 root 直连。
- 使用端口 `38222`，不要用 22 端口。
- `codex` 用户可执行 `sudo -n`。
- xtermjs/noVNC 只作为救援入口。
- 不要把私钥、token、cookie、AI key 写进仓库、日志或交接文档。

连接检查：

```powershell
ssh culua "whoami && hostname && pwd"
ssh culua "sudo -n true && echo sudo-ok"
```

期望：

```text
whoami: codex
hostname: RainYun-o69AzsBK
sudo-ok
```

## 服务器目录

```text
/var/www/song-search                    歌站服务工作目录
/var/www/song-search/data               线上歌库数据
/var/www/song-search/reports            线上报表和缓存
/var/www/song-search/downloads          下载目录，不提交
/var/www/song-search/runtime            运行时目录，不提交
/var/lib/song-search/singer-configs.json 服务器运行时来源配置
/usr/local/bin/song-search-refresh.sh   定时/手动刷新脚本
/etc/systemd/system/song-search.service systemd 服务文件
/root/.secrets/song-search-admin-token  管理 token，只在服务器读取
```

服务器仓库检查：

```bash
cd /var/www/song-search
git remote -v
git branch --show-current
git log --oneline -5
git status --short
```

说明：

- `/var/www/song-search` 应跟随 `origin/codex/server-deploy`。
- 服务器工作树经常会因为数据生成、缓存和备份文件变脏，不要把它当开发源。
- 刷新脚本会执行 `git reset --hard origin/codex/server-deploy`，服务器临时改代码会被覆盖。

## systemd 服务

服务文件：

```bash
sudo sed -n '1,180p' /etc/systemd/system/song-search.service
```

关键配置：

```text
WorkingDirectory=/var/www/song-search
Environment=PORT=3230
ExecStart=/usr/bin/node server.js
Restart=always
User=root
```

常用命令：

```bash
sudo systemctl status song-search.service --no-pager
sudo systemctl is-active song-search.service
sudo systemctl restart song-search.service
sudo journalctl -u song-search.service -n 100 --no-pager
```

## 发布代码

发布前先在本地确认只包含本次相关改动：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git status -sb
git diff --stat
git diff --check
```

如果本地 `codex/server-deploy` 与远端分叉，不要强推。可以从远端部署分支开临时 worktree 做最小提交：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git fetch origin codex/server-deploy
$tmp = "$env:TEMP\song-search-deploy-task"
git worktree add --detach $tmp origin/codex/server-deploy
cd $tmp
```

修改、检查、提交后推到部署分支：

```powershell
git status --short
git diff --check
git add -- path/to/file1 path/to/file2
git diff --cached --stat
git commit -m "fix: 简要说明"
git push origin HEAD:codex/server-deploy
```

不要使用：

```powershell
git push --force
git add .
git reset --hard
git clean -fdx
```

## 服务器拉取并重启

代码改动不涉及歌库数据时，可用快速部署：

```powershell
ssh culua "cd /var/www/song-search && git fetch origin codex/server-deploy && git reset --hard origin/codex/server-deploy && sudo -n systemctl restart song-search.service && sudo -n systemctl is-active song-search.service"
```

涉及来源配置、`data/`、统计、增长日报或需要重建歌库时，使用刷新脚本：

```powershell
ssh culua "sudo -n /usr/local/bin/song-search-refresh.sh"
```

当前刷新脚本核心行为：

```bash
cd /var/www/song-search
git fetch origin codex/server-deploy
git reset --hard origin/codex/server-deploy
/usr/bin/node scripts/update-songs.js
/usr/bin/node scripts/update-song-growth.js
/usr/bin/curl -fsS http://127.0.0.1:3230/internal/reload >/dev/null
```

如果 SSH 连接中途断开，先查是否仍在后台运行，避免重复启动：

```powershell
ssh culua "pgrep -af 'node scripts/update-songs|song-search-refresh' || true"
```

## 来源配置特殊规则

GitHub Pages 与 `culua.com` 不同：

- GitHub Pages `main`：云端 `scripts/update-songs.js` 内的 `SINGER_CONFIGS` 是配置入口，添加来源时只改配置行，不改抓取逻辑。
- `culua.com` 部署分支：仓库配置是 `scripts/singer-configs.json`。
- `culua.com` 服务器运行时：`/var/lib/song-search/singer-configs.json` 会覆盖仓库配置，添加来源时需要备份并同步运行时配置。

运行时配置备份示例：

```bash
sudo cp /var/lib/song-search/singer-configs.json /var/lib/song-search/singer-configs.json.bak-$(date +%Y%m%d%H%M%S)
```

新增来源前先查 B 站接口：

```powershell
node -e "fetch('https://api.bilibili.com/x/web-interface/view?bvid=BV号',{headers:{'User-Agent':'Mozilla/5.0'}}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j.data.ugc_season?.sections||[],null,2)))"
```

注意：

- BV 号大小写保持用户给的原样。
- 如果 BV 已在 `BV1xucZzxEkZ` 的“非常驻妹妹”合集小节里，`culua.com` 通常能从 `others` 自动扫到，可先公网验证再决定是否改配置。
- 如果拆独立来源，用 `sectionTitle` / `sectionTitles` 精确匹配小节标题，并在 `others.excludeSectionTitles` 排除对应小节，避免重复收录。
- 如果是独立合集或普通合集，不要乱加 `sectionTitle`。

## 发布后验证

服务器本机：

```bash
cd /var/www/song-search
/usr/bin/node scripts/check-song-library.js
sudo systemctl is-active song-search.service
curl -fsS http://127.0.0.1:3230/api/bootstrap >/dev/null
curl -fsS "http://127.0.0.1:3230/api/stats/view?tab=vtuber-source&page=1&pageSize=1" >/dev/null
```

公网：

```bash
curl -fsS "https://www.culua.com/api/stats/view?tab=vtuber-source&page=1&pageSize=1" >/dev/null
curl -fsSL https://www.culua.com/ | head
curl -fsSL https://www.culua.com/stats | head
curl -fsSL https://www.culua.com/bv | head
curl -fsSL https://www.culua.com/check | head
curl -fsSL https://www.culua.com/growth | head
```

检查关键 BV 是否入库：

```powershell
@'
const url = 'https://www.culua.com/data/others.js?v=check';
const bvid = 'BV号';
const text = await (await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })).text();
console.log({ status: text.includes(bvid), bytes: text.length });
'@ | node --input-type=module -
```

验证结果要写清楚：

```text
service: active
check-song-library: files=?, totalSongs=?, uniqueSongs=?
public bootstrap: ok
public stats: ok
关键 data 文件包含入口 BV: true
```

## 常见故障

### SSH 能断但任务仍在跑

先查进程：

```powershell
ssh culua "pgrep -af 'node scripts/update-songs|song-search-refresh' || true"
```

如果仍在跑，等待完成后看日志：

```powershell
ssh culua "tail -n 160 /var/log/song-search-refresh.log"
```

### 服务器工作树很脏

这是常态。只要刷新脚本能 reset 到 `origin/codex/server-deploy`，不要手动清理 `downloads/`、`runtime/`、`reports/bv-metadata-cache.json`、备份文件或生成数据。

### 公网没有变化

依次检查：

```bash
cd /var/www/song-search
git log --oneline -1
sudo systemctl is-active song-search.service
curl -fsS http://127.0.0.1:3230/internal/reload
curl -fsS https://www.culua.com/api/bootstrap
```

如果是来源数据，确认 `/var/lib/song-search/singer-configs.json` 是否已经同步。

## 文件说明

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `docs/culua-server-guide.md` | culua 服务器使用指南 | 固定 SSH alias、服务器目录、部署命令、刷新脚本、验证方式和安全边界 | 供后续 AI 接手服务器、推送部署分支和发布歌站代码时首读 |
| `docs/migration-handoff.md` | 迁移交接文档 | 记录本地目录、分支、服务器目录和迁移风险 | 本指南复用其路径、SSH 和部署规则 |
| `docs/add-source-prompt.md` | 添加来源提示词 | 说明 GitHub main 与 `culua.com` 添加来源的不同方式 | 来源任务优先配合本指南使用 |
| `README.md` | 项目入口说明 | 汇总功能、运行、验证、文档入口 | 链接本指南 |
