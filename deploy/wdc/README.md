# WDC GitHub 分发器

本目录保存“v切片仓库 模拟浏览器版”的非敏感 systemd 模板。WDC 只负责检查并触发 GitHub Actions，Puppeteer 抓取仍在 GitHub Actions runner 中执行；不要把老站仓库、数据目录或浏览器环境复制到 WDC。

## 文件

- `v-slice-browser-dispatch.sh`：查询 `update.yml` 的运行状态，仅在没有 queued/in-progress 任务时发送 `workflow_dispatch`。
- `v-slice-browser-dispatch.service`：带 `flock` 和 60 秒超时的 oneshot 服务。
- `v-slice-browser-dispatch.timer`：每 10 分钟检查一次；检查不等于每 10 分钟强制启动新工作流。

## 服务器路径

```text
/usr/local/bin/v-slice-browser-dispatch.sh
/etc/systemd/system/v-slice-browser-dispatch.service
/etc/systemd/system/v-slice-browser-dispatch.timer
/etc/v-slice-browser/github-dispatch-token
/etc/v-slice-browser/disabled
/var/lib/v-slice-browser-dispatch/status.json
```

Token 只能通过 SSH 加密流单独迁移，文件权限必须是 `0600 root:root`，不得写入 Git、终端输出、journal 或状态 JSON。运行日志使用 systemd journal，不迁移雨云历史日志。

## 发布与验证

1. 在 WDC 安装脚本、service 和 timer，先执行 `bash -n` 与 `systemd-analyze verify`。
2. 迁入 Token 后手动启动一次 service，状态应为 `ok` 且 GitHub 出现一个新 run。
3. 在该 run 仍活动时再次启动 service，状态应为 `skipped_active`，且不能产生第二个 run。
4. 以上验证通过后才启用 timer，并停用雨云 cron/分发器。
5. 用 `systemctl list-timers`、状态 JSON 和 GitHub run ID 共同验收；只看到 HTTP 204 不算完整验证。

本分发器保留仓库 slug `song-search`，以维持现有 GitHub Pages 地址。仓库中文标识通过 GitHub description 维护为“v切片仓库 模拟浏览器版”。
