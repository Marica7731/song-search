#!/usr/bin/env bash
set -euo pipefail

LOCK_PATH="/tmp/song-search-refresh.lock"
CURRENT_PATH="/srv/culua-web/current"
UPDATE_TIMEOUT_SECONDS="${UPDATE_TIMEOUT_SECONDS:-3600}"
VOCALOID_TIMEOUT_SECONDS="${VOCALOID_TIMEOUT_SECONDS:-900}"
GROWTH_TIMEOUT_SECONDS="${GROWTH_TIMEOUT_SECONDS:-600}"
SERVICE="song-search.service"

parent_comm="$(/bin/ps -o comm= -p "${PPID}" 2>/dev/null | /usr/bin/tr -d '[:space:]' || true)"
if [[ "${parent_comm}" != "flock" ]]; then
  exec /usr/bin/flock -n "${LOCK_PATH}" "${BASH_SOURCE[0]}" "$@"
fi

RELEASE_PATH="$(readlink -f "${CURRENT_PATH}")"
if [[ ! -L "${CURRENT_PATH}" || ! "${RELEASE_PATH}" =~ ^/srv/culua-web/releases/[0-9a-f]{40}$ || ! -f "${RELEASE_PATH}/server.js" ]]; then
  echo "current release is not valid" >&2
  exit 1
fi

EXPECTED_COMMIT="${RELEASE_PATH##*/}"
ACTUAL_COMMIT="$(git -C "${RELEASE_PATH}" rev-parse HEAD)"
if [[ "${ACTUAL_COMMIT}" != "${EXPECTED_COMMIT}" ]]; then
  echo "current release commit does not match its directory" >&2
  exit 1
fi

cd "${RELEASE_PATH}"
/usr/bin/timeout "${UPDATE_TIMEOUT_SECONDS}" /usr/bin/node scripts/update-songs.js
/usr/bin/timeout "${VOCALOID_TIMEOUT_SECONDS}" /usr/bin/node scripts/update-vocaloid-snapshot.js --source local
/usr/bin/timeout "${GROWTH_TIMEOUT_SECONDS}" /usr/bin/node scripts/update-song-growth.js

/usr/bin/systemctl restart "${SERVICE}"
/usr/bin/systemctl is-active --quiet "${SERVICE}"
echo "song-search refresh complete"
