#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

TOKEN_FILE="$TMP_DIR/token"
STATUS_FILE="$TMP_DIR/status.json"
CALLS_FILE="$TMP_DIR/calls.log"
FAKE_CURL="$TMP_DIR/curl"
printf 'test-token\n' > "$TOKEN_FILE"

cat > "$FAKE_CURL" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

output_file=''
method='GET'
url=''
args=("$@")
for ((index = 0; index < ${#args[@]}; index++)); do
  if [[ "${args[$index]}" == '-o' ]]; then
    output_file="${args[$((index + 1))]}"
  fi
  if [[ "${args[$index]}" == '-X' ]]; then
    method="${args[$((index + 1))]}"
  fi
  if [[ "${args[$index]}" == https://* ]]; then
    url="${args[$index]}"
  fi
done
[[ -n "$output_file" ]]
printf '%s %s\n' "$method" "$url" >> "$CALLS_FILE"
if [[ "$url" == *'/runs?'* && "${FAKE_ACTIVE_RUN:-false}" == 'true' ]]; then
  printf '{"workflow_runs":[{"id":123,"status":"in_progress","head_branch":"main"}]}' > "$output_file"
  printf '200'
elif [[ "$url" == *'/runs?'* ]]; then
  printf '{"workflow_runs":[]}' > "$output_file"
  printf '200'
elif [[ "$method" != 'POST' || "$url" != *'/dispatches' ]]; then
  printf '{"message":"unexpected request"}' > "$output_file"
  printf '500'
elif [[ "${FAKE_DISPATCH_HTTP_CODE:-204}" != '204' ]]; then
  printf '{"message":"test error"}' > "$output_file"
  printf '%s' "$FAKE_DISPATCH_HTTP_CODE"
else
  : > "$output_file"
  printf '204'
fi
SH
chmod 0755 "$FAKE_CURL"

TOKEN_FILE="$TOKEN_FILE" \
DISABLE_FLAG="$TMP_DIR/disabled" \
STATUS_FILE="$STATUS_FILE" \
CURL_BIN="$FAKE_CURL" \
CALLS_FILE="$CALLS_FILE" \
  bash "$ROOT_DIR/deploy/wdc/v-slice-browser-dispatch.sh"

[[ "$(wc -l < "$CALLS_FILE")" -eq 1 ]]
grep -q '^POST https://api.github.com/repos/Marica7731/song-search/actions/workflows/update.yml/dispatches$' "$CALLS_FILE"

python3 - "$STATUS_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding='utf-8') as handle:
    status = json.load(handle)
assert status['state'] == 'ok', status
assert status['http_code'] == '204', status
assert status['message'] == 'dispatch accepted', status
PY

: > "$CALLS_FILE"
# An active run must not prevent this timer tick from dispatching another run.
FAKE_ACTIVE_RUN=true \
TOKEN_FILE="$TOKEN_FILE" \
DISABLE_FLAG="$TMP_DIR/disabled" \
STATUS_FILE="$STATUS_FILE" \
CURL_BIN="$FAKE_CURL" \
CALLS_FILE="$CALLS_FILE" \
  bash "$ROOT_DIR/deploy/wdc/v-slice-browser-dispatch.sh"

[[ "$(wc -l < "$CALLS_FILE")" -eq 1 ]]
grep -q '^POST https://api.github.com/repos/Marica7731/song-search/actions/workflows/update.yml/dispatches$' "$CALLS_FILE"
python3 - "$STATUS_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    status = json.load(handle)
assert status['state'] == 'ok', status
assert status['http_code'] == '204', status
assert status['message'] == 'dispatch accepted', status
PY

: > "$CALLS_FILE"
if FAKE_DISPATCH_HTTP_CODE=500 \
  TOKEN_FILE="$TOKEN_FILE" \
  DISABLE_FLAG="$TMP_DIR/disabled" \
  STATUS_FILE="$STATUS_FILE" \
  CURL_BIN="$FAKE_CURL" \
  CALLS_FILE="$CALLS_FILE" \
    bash "$ROOT_DIR/deploy/wdc/v-slice-browser-dispatch.sh"; then
  echo 'dispatch failure unexpectedly succeeded' >&2
  exit 1
fi

[[ "$(wc -l < "$CALLS_FILE")" -eq 1 ]]
python3 - "$STATUS_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    status = json.load(handle)
assert status['state'] == 'dispatch_error', status
assert status['http_code'] == '500', status
PY

echo 'DISPATCH_EVERY_TICK_TEST_OK'
