# WDC 可回滚部署

本目录只保存 `www.culua.com` 的非敏感部署模板。真实 DNS 目标、证书私钥、管理 Token、Cookie、SSH 配置和运行时环境值不得写入 Git。

## 文件

- `song-search.service`：从 `/srv/culua-web/current` 启动 Node 服务；运行时环境单独放在 `/etc/song-search/song-search.env`。
- `song-search.nginx.conf`：只接管 `www.culua.com`，不声明 default server；同时保留站点 API、短路由和既有 `/feishu-bridge/` 兼容入口。
- `song-search-refresh.sh`：只在当前 release 内重建运行时数据并重启服务，不执行 `git reset`，避免绕过 release/rollback 门禁。
- `song-search-refresh.service`：oneshot 刷新单元；复用 `/tmp/song-search-refresh.lock`，已有刷新占锁时安全跳过本轮。
- `song-search-refresh.timer`：每小时 10、30、50 分触发刷新，与保留作回滚的旧源站错峰，并在重启后补一次错过的调度。

## 目录约定

```text
/srv/culua-web/releases/<commit>/   不可变代码 release，运行时数据在激活后可刷新
/srv/culua-web/current              指向当前 release 的符号链接
/srv/culua-web/previous             指向切换前 release 的符号链接
/var/lib/song-search/               运行时来源配置
/root/.secrets/                     运行时管理凭据，仅服务器 root 可读
/etc/nginx/certs/culua.com/         TLS 证书与私钥，仅服务器 root 可读
```

## 发布门禁

1. 从 `codex/server-deploy` 的不可变 commit 构建 release，不从源站脏工作树复制代码。
2. 只把源站当前的 `data/`、`reports/`、`vocaloid-songs-latest/`、`downloads/`、`runtime/` 和运行时来源配置覆盖到候选 release；备份文件、缓存垃圾与 `.git` 不进入 release。
3. 管理凭据和 TLS 私钥只能通过 SSH 加密流直接传到 WDC，禁止经过仓库、终端输出或普通临时文件。
4. 安装配置后先运行 `nginx -t`，再启动 `song-search.service`。
5. 切 DNS 前必须在 WDC 本机验证首页、`/api/health`、`/api/bootstrap`、关键短路由和 `/feishu-bridge/health`，再用 Host 头验证 nginx。
6. Cloudflare 更新必须比较旧记录后再写，仅修改 `www.culua.com` 的目标；旧源站和旧记录值保留为回滚依据。
7. 公网切换后再次验证 HTTPS、健康接口、关键页面、总歌曲数和指定 BV；任何一项失败都回滚 DNS 与 `current` 链接。
8. 安装并启用 `song-search-refresh.timer`，用 `systemctl list-timers` 确认下次触发时间；至少执行一次真实 oneshot，确认刷新完成、主服务仍 active、总量不低于切换基线。

## 回滚原则

回滚时先把 `current` 原子切回 `previous`，重启服务并验证 WDC 本机；若公网已切换，再把 Cloudflare 记录恢复为切换前值。不要删除旧 release 或停止旧源站，直到用户确认稳定窗口结束。

## 测试

```bash
npm run check:secrets
node --check server.js
node --check scripts/check-sensitive-files.js
bash -n deploy/wdc/song-search-refresh.sh
systemd-analyze verify deploy/wdc/song-search-refresh.service deploy/wdc/song-search-refresh.timer
systemd-analyze calendar '*-*-* *:10/20:00'
```

nginx 模板必须在 WDC 上通过 `nginx -t`；本地测试不能替代真实 Host 头和公网验收。
