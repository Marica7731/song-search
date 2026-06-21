# culua.com 歌站迁移交接

最后核对日期：2026-04-30

本地项目根目录：`C:\Users\终焉\Documents\culua_web_h5`

部署分支：`codex/server-deploy`

## 迁移结论

- 本地维护目录已经从 GitHub `song-search` 仓库重新 clone 到 `C:\Users\终焉\Documents\culua_web_h5`。
- 当前目录是 Git 仓库根目录，当前分支是 `codex/server-deploy`。
- 不建议从旧目录 `C:\Users\终焉\Documents\New project\song-search` 复制迁移。旧目录不是这次交接的可信来源。
- 本文只覆盖 `culua.com` 歌站本体，不包括 FeishuPy、飞书桥接、APP、网络控制台。
- 不要改动转发接口、relay、proxy 相关逻辑，除非有明确任务要求。

## 当前核对状态

本地 clone 基线：

```text
origin: https://github.com/Marica7731/song-search.git
branch: codex/server-deploy
baseline commit: 18556983 Bust naming tool script cache
```

服务器核对结果：

```text
server path: /var/www/song-search
server branch: codex/server-deploy
server commit: 18556983 Bust naming tool script cache
service: active
```

注意：服务器工作树在核对时不是干净状态，包含刷新生成的数据文件、备份文件、`downloads/`、`runtime/` 和缓存报告。不要把服务器工作树直接当作代码迁移来源。服务器刷新脚本会强制 reset 到 `origin/codex/server-deploy`，临时修改会被覆盖。

## 目标目录

```text
C:\Users\终焉\Documents\culua_web_h5
```

进入项目后先确认根目录：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git rev-parse --show-toplevel
git branch --show-current
git status --short
```

期望：

```text
C:/Users/终焉/Documents/culua_web_h5
codex/server-deploy
```

## 推荐迁移方式

如果需要重新建立目录，先确认目标目录为空或先归档旧目录：

```powershell
Test-Path C:\Users\终焉\Documents\culua_web_h5
Get-ChildItem -Force C:\Users\终焉\Documents\culua_web_h5
```

从 GitHub 重新 clone：

```powershell
cd C:\Users\终焉\Documents
git clone --branch codex/server-deploy https://github.com/Marica7731/song-search.git culua_web_h5
cd C:\Users\终焉\Documents\culua_web_h5
git status --short
git log --oneline -5
```

如果 GitHub 临时不可用，可以从服务器拉 committed 状态：

```powershell
cd C:\Users\终焉\Documents
git clone culua:/var/www/song-search culua_web_h5
cd C:\Users\终焉\Documents\culua_web_h5
git remote set-url origin https://github.com/Marica7731/song-search.git
git fetch origin
git switch codex/server-deploy
git status --short
git log --oneline -5
```

## 不要复制的旧目录内容

```text
C:\Users\终焉\Documents\New project
C:\Users\终焉\Documents\New project\song-search\node_modules
C:\Users\终焉\Documents\New project\song-search\live-*
C:\Users\终焉\Documents\New project\song-search\verify-*
C:\Users\终焉\Documents\New project\song-search\tmp-*
C:\Users\终焉\Documents\New project\song-search\reports\bv-metadata-cache.json
C:\Users\终焉\Documents\New project\song-search\reports\update-songs-meta.json
```

## 核心目录

```text
C:\Users\终焉\Documents\culua_web_h5
C:\Users\终焉\Documents\culua_web_h5\data
C:\Users\终焉\Documents\culua_web_h5\reports
C:\Users\终焉\Documents\culua_web_h5\scripts
C:\Users\终焉\Documents\culua_web_h5\tools
C:\Users\终焉\Documents\culua_web_h5\.github\workflows
```

完整文件清单见 [`docs/file-manifest.md`](./file-manifest.md)。

## 服务器目录

```text
/var/www/song-search                  culua.com 歌站工作目录
/var/www/song-search/data             线上歌库数据
/var/www/song-search/reports          线上报表/缓存
/var/www/song-search/downloads        下载文件目录，不要提交
/var/www/song-search/runtime          运行时目录，不要提交
/usr/local/bin/song-search-refresh.sh 定时/手动刷新脚本
/etc/systemd/system/song-search.service systemd 服务
/root/.secrets/song-search-admin-token 管理 token 文件，只在服务器读取，不写入仓库
```

敏感信息规则：

- 不要把 `/root/.secrets/song-search-admin-token` 写入仓库。
- 不要把 cookie、token、AI key、`.env` 写入代码、文档示例、日志或提交。
- 管理后台 token 只作为运行时输入使用。

## SSH 规则

```text
SSH alias: culua
用户: codex
端口: 38222
sudo: codex 用户可 sudo -n
不要用 root 直连
不要用 22 端口
xtermjs/noVNC 只作为救援入口
```

常用命令：

```powershell
ssh culua
ssh culua "whoami && hostname && pwd"
scp local-file culua:/tmp/local-file
ssh culua "sudo systemctl status song-search.service --no-pager"
```

## 服务器检查命令

```bash
cd /var/www/song-search
git status --short
git branch --show-current
git log --oneline -5

sudo systemctl status song-search.service --no-pager
sudo systemctl is-active song-search.service
sudo journalctl -u song-search.service -n 100 --no-pager

curl -fsS http://127.0.0.1:3230/api/bootstrap
curl -fsS "http://127.0.0.1:3230/api/stats/view?tab=vtuber-source&page=1&pageSize=1"
curl -fsS "https://www.culua.com/api/stats/view?tab=vtuber-source&page=1&pageSize=1"
```

查看刷新脚本：

```bash
sudo sed -n '1,220p' /usr/local/bin/song-search-refresh.sh
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

## 本地开发

项目根目录：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
```

本项目根目录 `package.json` 没有外部依赖，启动服务：

```powershell
npm start
```

等价命令：

```powershell
node server.js
```

默认端口来自 `server.js`：

```text
PORT=8080
```

如需指定端口：

```powershell
$env:PORT='8081'
node server.js
```

访问入口：

```text
http://127.0.0.1:8080/
http://127.0.0.1:8080/stats
http://127.0.0.1:8080/bv
http://127.0.0.1:8080/dup
http://127.0.0.1:8080/check
http://127.0.0.1:8080/growth
http://127.0.0.1:8080/admin-config
```

不要用 `file://` 判断功能是否正常。依赖 `fetch('data/index.json')` 或 `/api/*` 的页面必须用本地 HTTP 或公网验证。

## 基础检查

```powershell
node --check server.js
node --check dup-check-core.js
node --check artist-match.js
node --check bili-check-title-artist.js
node --check scripts/update-songs.js
node --check scripts/update-song-growth.js
node --check scripts/check-song-library.js
npm run check:library
```

歌库数量检查：

```powershell
node scripts/check-song-library.js --json
```

## 数据更新

新增或调整来源优先修改：

```text
scripts/singer-configs.json
```

然后运行：

```powershell
node scripts/update-songs.js
npm run check:library
node scripts/update-song-growth.js
```

注意：

- BV 号在配置里保持原样，不要强制改大小写。
- 新增 BV 后要核对来源数量、总曲目数量、关键 BV 是否存在。
- `data/*.js` 和 `data/index.json` 是生成物，但当前仓库会跟踪它们。提交前必须确认曲目数量没有异常回退。
- `reports/song-growth-history.json` 是增长日报历史，属于当前跟踪文件。
- `reports/bv-metadata-cache.json` 和 `reports/update-songs-meta.json` 是运行缓存，已被 `.gitignore` 忽略。

## Git 流程

```powershell
git status --short
git diff --stat
git diff --check
git diff -- path/to/file
git add -- path/to/file1 path/to/file2
git diff --cached --stat
git commit -m "docs: 补充歌站迁移交接文档"
git push origin HEAD:codex/server-deploy
```

避免：

```powershell
git add .
git reset --hard
git clean -fdx
```

除非明确知道后果，不要对脏仓库执行：

```powershell
git checkout -- .
git reset --hard origin/xxx
```

## 部署流程

文档、样式或代码改动推送前，先记录公网当前歌库总量，防止发布后回退：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git status --short
git diff --check
$before = (npm run -s check:live -- --json | ConvertFrom-Json).totalSongs
git push origin HEAD:codex/server-deploy
```

服务器正常发布必须使用刷新脚本。不要只 `git reset --hard` 后重启服务，因为仓库里的 `data/*.js` 可能落后于服务器运行时数据，会导致线上歌库短暂回退。

```bash
ssh culua "sudo -n /usr/bin/flock -n /tmp/song-search-refresh.lock /usr/local/bin/song-search-refresh.sh"
```

发布后先做总量和关键 BV 校验：

```powershell
npm run -s check:live -- --min-total=$before --require-bv=BV1xd5g61Egu
```

部署后自验：

```bash
curl -fsS http://127.0.0.1:3230/api/bootstrap
curl -fsS "https://www.culua.com/api/stats/view?tab=vtuber-source&page=1&pageSize=1"
curl -fsSL https://www.culua.com/ | head
curl -fsSL https://www.culua.com/stats | head
curl -fsSL https://www.culua.com/bv | head
curl -fsSL https://www.culua.com/check | head
curl -fsSL https://www.culua.com/growth | head
```

定时任务只作为兜底，不要依赖它修复刚发布后的回退窗口。健康检查：

```bash
ssh culua "systemctl is-active cron && sudo -n crontab -l | grep song-search-refresh && sudo -n journalctl -u cron --since '90 minutes ago' --no-pager | grep song-search-refresh | tail"
```

## 分支约定

```text
codex/server-deploy    culua.com 服务器部署分支
main                   GitHub Actions 数据更新主线
```

注意：

- `main` 和 `codex/server-deploy` 不是同一个用途。
- 不要把 GitHub 数据更新任务和 `culua.com` 服务器部署混成同一个任务。
- 服务器定时脚本会强制 reset 到 `origin/codex/server-deploy`，所以服务器临时改文件会被覆盖。
- 手动发布也必须跑刷新脚本；`reset --hard` 后只重启会把服务器生成的新歌库覆盖成仓库旧数据。

## 维护原则

1. 先确认当前目录是真正项目根目录。
2. 不要在 `C:\Users\����` 这类乱码路径工作。
3. 不要把 FeishuPy、APP、网络控制台改动混进歌站迁移。
4. 不要动转发接口、relay、proxy 相关逻辑，除非用户明确要求。
5. 改页面后必须用本地 HTTP 或公网验证，不要用 `file://` 断言成功。
6. 涉及数据更新，必须核对来源数、曲目数、关键 BV 是否存在。
7. 发布后必须看公网，不只看本机端口。
8. 提交只 stage 本次相关文件，不要提交截图、缓存、临时日志、下载目录。
9. 命令、路径、服务状态要写具体，不要抽象描述。

## 删除旧目录前检查

删除或归档旧目录前，先确认新目录可用：

```powershell
cd C:\Users\终焉\Documents\culua_web_h5
git status --short
git log --oneline -5
git remote -v
npm start
```

确认服务器部署链路能检查：

```powershell
ssh culua "cd /var/www/song-search && git branch --show-current && git log --oneline -1 && sudo systemctl is-active song-search.service"
```

旧目录可以归档，但不要删除：

```text
C:\Users\终焉\Documents\culua_web_h5
```
