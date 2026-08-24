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
args=("$@")
for ((index = 0; index < ${#args[@]}; index++)); do
  if [[ "${args[$index]}" == '-o' ]]; then
    output_file="${args[$((index + 1))]}"
  fi
done
[[ -n "$output_file" ]] && : > "$output_file"
printf '%s\n' "$*" >> "$CALLS_FILE"
printf '204'
SH
chmod 0755 "$FAKE_CURL"

for _ in 1 2; do
  TOKEN_FILE="$TOKEN_FILE" \
  DISABLE_FLAG="$TMP_DIR/disabled" \
  STATUS_FILE="$STATUS_FILE" \
  CURL_BIN="$FAKE_CURL" \
  CALLS_FILE="$CALLS_FILE" \
    bash "$ROOT_DIR/deploy/wdc/v-slice-browser-dispatch.sh"
done

[[ "$(wc -l < "$CALLS_FILE")" -eq 2 ]]
grep -q -- '-X POST' "$CALLS_FILE"
[[ "$(grep -F -c 'actions/workflows/update.yml/dispatches' "$CALLS_FILE")" -eq 2 ]]
[[ "$(grep -F -c '{"ref":"main"}' "$CALLS_FILE")" -eq 2 ]]
! grep -q '/runs' "$CALLS_FILE"
! grep -q 'inputs' "$CALLS_FILE"

python3 - "$STATUS_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding='utf-8') as handle:
    status = json.load(handle)
assert status['state'] == 'ok', status
assert status['http_code'] == '204', status
assert status['message'] == 'dispatch accepted', status
PY

echo 'DISPATCH_EVERY_RUN_TEST_OK'
