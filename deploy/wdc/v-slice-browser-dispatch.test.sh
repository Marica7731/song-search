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
if [[ "$url" == *'/runs?'* ]]; then
  if [[ "${FAKE_ACTIVITY_HTTP_CODE:-200}" != '200' ]]; then
    printf '{"message":"test error"}' > "$output_file"
    printf '%s' "$FAKE_ACTIVITY_HTTP_CODE"
  elif [[ "${FAKE_ACTIVITY_MODE:-idle}" == 'active' ]]; then
    printf '{"workflow_runs":[{"id":123,"status":"in_progress","head_branch":"main"}]}' > "$output_file"
    printf '200'
  else
    printf '{"workflow_runs":[]}' > "$output_file"
    printf '200'
  fi
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

[[ "$(wc -l < "$CALLS_FILE")" -eq 2 ]]
grep -q '^GET https://api.github.com/repos/Marica7731/song-search/actions/workflows/update.yml/runs?branch=main&per_page=100$' "$CALLS_FILE"
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
FAKE_ACTIVITY_MODE=active \
TOKEN_FILE="$TOKEN_FILE" \
DISABLE_FLAG="$TMP_DIR/disabled" \
STATUS_FILE="$STATUS_FILE" \
CURL_BIN="$FAKE_CURL" \
CALLS_FILE="$CALLS_FILE" \
  bash "$ROOT_DIR/deploy/wdc/v-slice-browser-dispatch.sh"

[[ "$(wc -l < "$CALLS_FILE")" -eq 1 ]]
grep -q '/runs?' "$CALLS_FILE"
! grep -q '/dispatches' "$CALLS_FILE"
python3 - "$STATUS_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    status = json.load(handle)
assert status['state'] == 'skipped_active_run', status
assert status['http_code'] == '200', status
assert '123 is in_progress' in status['message'], status
PY

: > "$CALLS_FILE"
if FAKE_ACTIVITY_HTTP_CODE=500 \
  TOKEN_FILE="$TOKEN_FILE" \
  DISABLE_FLAG="$TMP_DIR/disabled" \
  STATUS_FILE="$STATUS_FILE" \
  CURL_BIN="$FAKE_CURL" \
  CALLS_FILE="$CALLS_FILE" \
    bash "$ROOT_DIR/deploy/wdc/v-slice-browser-dispatch.sh"; then
  echo 'activity check failure unexpectedly dispatched' >&2
  exit 1
fi

[[ "$(wc -l < "$CALLS_FILE")" -eq 1 ]]
! grep -q '/dispatches' "$CALLS_FILE"
python3 - "$STATUS_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    status = json.load(handle)
assert status['state'] == 'activity_check_error', status
assert status['http_code'] == '500', status
PY

echo 'DISPATCH_ACTIVE_RUN_GUARD_TEST_OK'
