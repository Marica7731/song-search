#!/usr/bin/env bash
set -euo pipefail

TOKEN_FILE="${TOKEN_FILE:-/etc/v-slice-browser/github-dispatch-token}"
DISABLE_FLAG="${DISABLE_FLAG:-/etc/v-slice-browser/disabled}"
STATUS_FILE="${STATUS_FILE:-/var/lib/v-slice-browser-dispatch/status.json}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"
REPOSITORY="Marica7731/song-search"
WORKFLOW="update.yml"
DISPATCH_URL="https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW}/dispatches"

write_status() {
  local state="$1"
  local message="$2"
  local http_code="${3:-}"
  /usr/bin/python3 - "$STATUS_FILE" "$state" "$message" "$http_code" "$WORKFLOW" "$REPOSITORY" <<'PY'
import json
import os
import sys
from datetime import datetime

path, state, message, http_code, workflow, repository = sys.argv[1:]
os.makedirs(os.path.dirname(path), mode=0o755, exist_ok=True)
payload = {
    "time": datetime.now().astimezone().isoformat(timespec="seconds"),
    "state": state,
    "message": message,
    "http_code": http_code,
    "workflow": workflow,
    "repo": repository,
}
temporary = f"{path}.tmp-{os.getpid()}"
with open(temporary, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)
    handle.write("\n")
os.replace(temporary, path)
PY
}

if [[ -f "$DISABLE_FLAG" ]]; then
  write_status "disabled" "dispatch disabled by $DISABLE_FLAG"
  exit 0
fi

if [[ ! -s "$TOKEN_FILE" ]]; then
  write_status "waiting_token" "missing or empty token: $TOKEN_FILE"
  exit 10
fi

TOKEN="$(/usr/bin/tr -d '\r\n' < "$TOKEN_FILE")"
if [[ -z "$TOKEN" ]]; then
  write_status "waiting_token" "empty token: $TOKEN_FILE"
  exit 11
fi

dispatch_file="$(/usr/bin/mktemp)"
trap '/usr/bin/rm -f "$dispatch_file"' EXIT

if ! dispatch_code="$("$CURL_BIN" -sS --connect-timeout 10 --max-time 30 \
  -o "$dispatch_file" -w '%{http_code}' -X POST \
  -H 'Accept: application/vnd.github+json' \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$DISPATCH_URL" \
  -d '{"ref":"main"}')"; then
  write_status "dispatch_error" "workflow dispatch request failed" "000"
  exit 21
fi

if [[ "$dispatch_code" == "204" ]]; then
  write_status "ok" "dispatch accepted" "$dispatch_code"
  exit 0
fi

response="$(/usr/bin/tr -d '\r' < "$dispatch_file" | /usr/bin/head -c 800)"
write_status "dispatch_error" "dispatch failed: $response" "$dispatch_code"
exit 21
