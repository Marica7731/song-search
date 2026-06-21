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

## nginx 短路由

公网短路径先经过 nginx 的 exact location，再落到 Node 或静态文件。新增 `/stats` 这类无后缀页面时，除了改 `server.js` 的 `ROUTE_ALIASES`，还必须同步 `/etc/nginx/sites-available/song-search` 和 `/etc/nginx/sites-enabled/song-search`：

```nginx
location = /vocaloid { try_files /vocaloid.html =404; }
location = /vocaloid/ { return 301 /vocaloid; }
```

改完后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

验证时不要只看 HTTP 200。公网缺 exact location 时会被 `location / { try_files $uri $uri/ /index.html; }` 回退成首页，也会返回 200。必须用无缓存浏览器或 curl 检查页面标题/关键 DOM，例如 `/vocaloid` 应出现 `<title>术力口数据</title>` 和 `vocaloid-kpi`，不能只出现首页的 `歌曲搜索`。

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

## 服务器发布并刷新

正常发布不要只 `git reset --hard` 后重启服务。仓库里的 `data/*.js` 是被跟踪的生成物，可能落后于服务器运行时数据；如果 reset 后只重启，会把线上新歌库短暂回退到仓库旧数据，直到下一次定时刷新才恢复。

发布前先记录公网当前总量：

```powershell
$before = (npm run -s check:live -- --json | ConvertFrom-Json).totalSongs
```

推送部署分支后，在服务器使用刷新脚本完成拉取、重建歌库、增长日报和热 reload：

```powershell
git push origin HEAD:codex/server-deploy
ssh culua "sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh"
npm run -s check:live -- --min-total=$before --require-bv=BV1xd5g61Egu
```

如果本次只改页面、CSS、前端脚本或 `server.js`，并且不想发布仓库里可能落后的 `data/*.js` / `data/index.json`，必须使用“保留线上数据”的代码发布流程。这个流程会短暂 reset 代码，但会立刻把服务器当前生成的数据恢复回去，再重启服务：

```powershell
$before = (npm run -s check:live -- --json | ConvertFrom-Json).totalSongs
git push origin HEAD:codex/server-deploy

@'
set -euo pipefail
cd /var/www/song-search
if pgrep -af 'song-search-refresh|node scripts/update-songs' >/dev/null; then
  echo 'refresh is running, wait for it before code-only deploy'
  exit 1
fi
tar --ignore-failed-read -czf /tmp/song-search-data-keep.tgz \
  data \
  reports/song-growth-history.json \
  reports/update-songs-meta.json
git fetch origin codex/server-deploy
git reset --hard origin/codex/server-deploy
tar -xzf /tmp/song-search-data-keep.tgz
systemctl restart song-search.service
systemctl is-active song-search.service
'@ | ssh culua "sudo -n bash -s"

npm run -s check:live -- --min-total=$before --require-bv=BV1xd5g61Egu
```

发布后如果 `check:live` 的 `totalSongs` 低于 `$before`，不能结束任务；必须先恢复刷新脚本生成的数据，直到公网 `/api/bootstrap` 和 `/api/search` 都不低于发布前总量。

当前刷新脚本核心行为：

```bash
LOCK_PATH="${SONG_SEARCH_REFRESH_LOCK_PATH:-/tmp/song-search-refresh.lock}"
if [[ "${SONG_SEARCH_REFRESH_LOCK_HELD:-0}" != "1" ]]; then
  parent_comm="$(/bin/ps -o comm= -p "${PPID}" 2>/dev/null | /usr/bin/tr -d '[:space:]' || true)"
  if [[ "${parent_comm}" == "flock" ]]; then
    export SONG_SEARCH_REFRESH_LOCK_HELD=1
  else
    exec /usr/bin/flock -n "${LOCK_PATH}" /usr/bin/env SONG_SEARCH_REFRESH_LOCK_HELD=1 "${BASH_SOURCE[0]}" "$@"
  fi
fi
cd /var/www/song-search
git -c safe.directory=/var/www/song-search fetch origin codex/server-deploy
git -c safe.directory=/var/www/song-search reset --hard origin/codex/server-deploy
/usr/bin/node scripts/update-songs.js
/usr/bin/node scripts/update-song-growth.js
/usr/bin/chown -R codex:codex data reports
/usr/bin/curl -fsS http://127.0.0.1:3230/internal/reload >/dev/null
```

说明：

- root crontab 会以 root 身份执行刷新脚本，而 `/var/www/song-search` 主要由 `codex` 维护；Git 可能因为 `dubious ownership` 拒绝 `fetch/reset`。刷新脚本里的两条 git 命令必须带 `-c safe.directory=/var/www/song-search`。
- 手动发布也必须使用 `/usr/bin/flock -n /tmp/song-search-refresh.lock`。不要裸跑 `/usr/local/bin/song-search-refresh.sh`，否则可能和 20 分钟 cron 同时写 `data/`，造成线上总量短暂回退。
- 刷新脚本生成 `data/` 和 `reports/` 后会把归属修回 `codex:codex`，避免后续 `codex` 用户部署或检查时被 root 生成物卡住。

只有在明确做紧急进程恢复、且确认不执行 `git reset --hard` 时，才单独重启服务：

```powershell
ssh culua "sudo -n systemctl restart song-search.service && sudo -n systemctl is-active song-search.service"
```

如果 SSH 连接中途断开，先查是否仍在后台运行，避免重复启动：

```powershell
ssh culua "pgrep -af 'node scripts/update-songs|song-search-refresh' || true"
```

定时任务健康检查：

```powershell
ssh culua "systemctl is-active cron; sudo -n crontab -l | grep song-search-refresh; sudo -n journalctl -u cron --since '90 minutes ago' --no-pager | grep song-search-refresh | tail"
ssh culua "cd /var/www/song-search && stat -c '%y %n' reports/update-songs-meta.json data/index.json && cat reports/update-songs-meta.json"
ssh culua "sudo -n tail -n 260 /var/log/song-search-refresh.log | grep -n '任务结束\|song total=\|dubious ownership\|fatal' || true"
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
npm run -s check:live -- --min-total=25785 --require-bv=BV1xd5g61Egu
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
check-live-song-total: totalSongs>=发布前总量, 关键 BV matched>0
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

如果刚发布后总量下降，优先判断是否执行过 `git reset --hard` 后只重启服务。立即运行：

```powershell
ssh culua "sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh"
npm run -s check:live -- --min-total=<发布前总量> --require-bv=BV1xd5g61Egu
```

### 定时任务触发但更新时间不变

如果页面显示的最近更新长时间停住，先分三层确认：

```powershell
ssh culua "date; systemctl is-active cron; sudo -n crontab -l | grep song-search-refresh"
ssh culua "sudo -n journalctl -u cron --since '3 hours ago' --no-pager | grep song-search-refresh | tail -n 20"
ssh culua "sudo -n tail -n 120 /var/log/song-search-refresh.log | grep -n 'dubious ownership\|fatal\|任务结束\|song total=' || true"
```

如果 cron 日志持续出现 `CMD (/usr/bin/flock ... song-search-refresh.sh)`，但 `reports/update-songs-meta.json` 没更新，并且刷新日志出现 `fatal: detected dubious ownership in repository at '/var/www/song-search'`，说明是 root cron 触发了脚本但 Git 拒绝 root 操作该仓库。修复方式是让 `/usr/local/bin/song-search-refresh.sh` 的两条 git 命令保持：

```bash
git -c safe.directory=/var/www/song-search fetch origin codex/server-deploy
git -c safe.directory=/var/www/song-search reset --hard origin/codex/server-deploy
```

修完后用同一把锁手动跑一次并确认 meta 更新时间：

```powershell
ssh culua "sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh && cd /var/www/song-search && cat reports/update-songs-meta.json"
```

## 文件说明

| 文件路径 | 文件用途 | 主要职责 | 与其他文件的关系 |
|---|---|---|---|
| `docs/culua-server-guide.md` | culua 服务器使用指南 | 固定 SSH alias、服务器目录、部署命令、刷新脚本、验证方式和安全边界 | 供后续 AI 接手服务器、推送部署分支和发布歌站代码时首读 |
| `docs/migration-handoff.md` | 迁移交接文档 | 记录本地目录、分支、服务器目录和迁移风险 | 本指南复用其路径、SSH 和部署规则 |
| `docs/add-source-prompt.md` | 添加来源提示词 | 说明 GitHub main 与 `culua.com` 添加来源的不同方式 | 来源任务优先配合本指南使用 |
| `scripts/check-live-song-total.js` | 线上歌库回退检查脚本 | 校验公网总曲数和关键 BV 命中情况 | 发布前后配合刷新脚本使用，避免 reset/restart 造成数据回退 |
| `README.md` | 项目入口说明 | 汇总功能、运行、验证、文档入口 | 链接本指南 |
