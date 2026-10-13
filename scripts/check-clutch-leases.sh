#!/usr/bin/env bash
# Optional P12.11 real-service gate. Temporary SQLite Clutch, no production credentials or persistent volumes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-clutch-XXXXXX")"
CONTAINER="garrison-clutch-test-$$"
cleanup() {
  STATUS=$?
  if [ "$STATUS" != 0 ]; then docker logs "$CONTAINER" > /tmp/garrison-clutch-startup.log 2>&1 || true; chmod 600 /tmp/garrison-clutch-startup.log; fi
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
dotnet build src/Test.Automated -f net10.0 -warnaserror >/dev/null
cat > "$WORK/clutch.json" <<'JSON'
{
  "NodeId": "garrison-conformance", "Rest": { "Hostname": "*", "Port": 8080 },
  "Database": { "Type": "Sqlite", "FilePath": "/tmp/clutch-test.db" },
  "Lock": { "DefaultLeaseMs": 3000, "MaxLeaseMs": 10000, "MaxHoldMs": 10000 },
  "Telemetry": { "Enabled": false }, "Logging": { "ConsoleLogging": false, "FileLogging": false }
}
JSON
docker run -d --rm --name "$CONTAINER" -p 127.0.0.1::8080 -v "$WORK/clutch.json:/app/clutch.json" "${GARRISON_TEST_CLUTCH_IMAGE:-jchristn77/clutch-server:v0.3.0}" >/dev/null
PORT="$(docker port "$CONTAINER" 8080/tcp | cut -d: -f2)"
ready=0
for _ in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:$PORT/v1.0/api/health" >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
[ "$ready" = 1 ] || { echo 'Temporary Clutch did not become Ready; log saved to /tmp/garrison-clutch-startup.log.' >&2; exit 1; }
GARRISON_TEST_CLUTCH_ENDPOINT="http://127.0.0.1:$PORT" GARRISON_TEST_CLUTCH_ACCESS_KEY=clutch-default-access-key dotnet run --project src/Test.Automated -f net10.0 --no-build -- --clutch-conformance
