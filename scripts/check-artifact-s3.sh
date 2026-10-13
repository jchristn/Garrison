#!/usr/bin/env bash
# P12.8: local real S3-compatible storage gate. No provider-account credentials or persistent volumes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-artifact-s3-XXXXXX")"
CONTAINER="garrison-artifact-s3-$$"
LOG_PID=""
cleanup() {
  STATUS=$?
  if [ "$STATUS" != 0 ] && [ -f "$WORK/less3.log" ]; then cp "$WORK/less3.log" /tmp/garrison-artifact-less3-startup.log; chmod 600 /tmp/garrison-artifact-less3-startup.log; fi
  if [ -n "$LOG_PID" ]; then kill "$LOG_PID" >/dev/null 2>&1 || true; fi
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
IMAGE="${GARRISON_TEST_LESS3_IMAGE:-jchristn77/less3:v4.0.0}"
dotnet build src/Test.Automated -f net10.0 -warnaserror >/dev/null
cat > "$WORK/system.json" <<'JSON'
{
  "EnableConsole": false, "ValidateSignatures": true, "AdminApiKey": "artifact-test-admin", "RegionString": "us-west-1",
  "Database": { "Type": "Sqlite", "Filename": "/tmp/less3-test.db" },
  "Webserver": { "Hostname": "*", "Port": 8000 },
  "Storage": { "StorageType": "Disk", "TempDirectory": "/tmp/less3-temp/", "DiskDirectory": "/tmp/less3-disk/" },
  "Logging": { "ConsoleLogging": false, "DiskLogging": false }
}
JSON
docker run -d --rm --name "$CONTAINER" -p 127.0.0.1::8000 -v "$WORK/system.json:/app/system.json:ro" "$IMAGE" >/dev/null
docker logs -f "$CONTAINER" > "$WORK/less3.log" 2>&1 &
LOG_PID=$!
PORT="$(docker port "$CONTAINER" 8000/tcp | cut -d: -f2)"
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
[ "$ready" = 1 ] || { echo 'Temporary Less3 did not become Ready; diagnostic log saved to /tmp/garrison-artifact-less3-startup.log.' >&2; exit 1; }
GARRISON_TEST_S3_ACCESS_KEY=default GARRISON_TEST_S3_SECRET_KEY=default GARRISON_TEST_S3_ENDPOINT="http://127.0.0.1:$PORT" dotnet run --project src/Test.Automated -f net10.0 --no-build -- --artifact-s3-conformance
