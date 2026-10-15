#!/usr/bin/env bash
# Builds Garrison, starts a throwaway server (Sqlite) and one worker with the fake harness, then runs the
# C#, Python, JavaScript/TypeScript, and Go SDK test harnesses against it. Exits non-zero when any harness fails.
#
# Environment overrides:
#   GARRISON_SDK_REST_PORT (18700), GARRISON_SDK_MCP_PORT (18701), GARRISON_SDK_WORKER_HEALTH_PORT (18710)
#   GARRISON_SDK_SKIP (comma list of csharp,python,js,go to skip)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REST_PORT="${GARRISON_SDK_REST_PORT:-18700}"
MCP_PORT="${GARRISON_SDK_MCP_PORT:-18701}"
HEALTH_PORT="${GARRISON_SDK_WORKER_HEALTH_PORT:-18710}"
SKIP="${GARRISON_SDK_SKIP:-}"
BASE_URL="http://127.0.0.1:${REST_PORT}"
ACCESS_KEY="access_garrison_default"
SECRET_KEY="secret_garrison_default_change_me"
ADMIN_KEY="garrisonadmin"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-sdk-XXXXXX")"
ART="$WORK/artifacts"
SERVER_PID=""
WORKER_PID=""
declare -a RESULTS=()
FAILED=0

cleanup() {
  [ -n "$WORKER_PID" ] && kill "$WORKER_PID" 2>/dev/null
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  sleep 1
  [ -n "$WORKER_PID" ] && kill -9 "$WORKER_PID" 2>/dev/null
  [ -n "$SERVER_PID" ] && kill -9 "$SERVER_PID" 2>/dev/null
}
trap cleanup EXIT

skipped() { [[ ",$SKIP," == *",$1,"* ]]; }

echo "== building solution into $ART"
dotnet build "$ROOT/src/Garrison.sln" -f net10.0 --artifacts-path "$ART" -v quiet -nologo > "$WORK/build.log" 2>&1 || { cat "$WORK/build.log" | tail -30; echo "build failed"; exit 1; }

mkdir -p "$WORK/bin" "$WORK/server" "$WORK/worker"
cat > "$WORK/bin/garrison-fake-harness" <<WRAP
#!/usr/bin/env bash
exec dotnet "$ART/bin/Garrison.FakeHarness/debug_net10.0/garrison-fake-harness.dll" "\$@"
WRAP
chmod +x "$WORK/bin/garrison-fake-harness"

cat > "$WORK/server/garrison.json" <<JSON
{
  "Rest": { "Hostname": "127.0.0.1", "Port": $REST_PORT },
  "Mcp": { "Hostname": "127.0.0.1", "Port": $MCP_PORT },
  "Database": { "Type": "Sqlite", "Filename": "$WORK/server/garrison.db" },
  "Logging": { "ConsoleLogging": true, "MinimumSeverity": 2 },
  "Telemetry": { "Enabled": false }
}
JSON

echo "== starting server on $BASE_URL"
(cd "$WORK/server" && GARRISON_SETTINGS_FILE="$WORK/server/garrison.json" GARRISON_TELEMETRY_ENABLE=false \
  exec dotnet "$ART/bin/Garrison.Server/debug_net10.0/Garrison.Server.dll" > "$WORK/server.log" 2>&1) &
SERVER_PID=$!

for i in $(seq 1 60); do
  curl -fs "$BASE_URL/v1.0/api/health" > /dev/null 2>&1 && break
  sleep 1
done
curl -fs "$BASE_URL/v1.0/api/health" > /dev/null || { tail -40 "$WORK/server.log"; echo "server did not become healthy"; exit 1; }
# A healthy answer from another process on the same port (for example a second harness run) would test the wrong
# server; make sure the server started here is the one answering.
kill -0 "$SERVER_PID" 2>/dev/null || { tail -40 "$WORK/server.log"; echo "the harness server exited (port ${REST_PORT} or ${MCP_PORT} in use?); set GARRISON_SDK_REST_PORT and GARRISON_SDK_MCP_PORT"; exit 1; }

echo "== starting worker"
(cd "$WORK/worker" && PATH="$WORK/bin:$PATH" \
  GARRISON_WORKER_SERVER_URL="$BASE_URL" GARRISON_WORKER_NODE_NAME="sdk-harness-worker" \
  GARRISON_WORKER_HEALTH_PORT="$HEALTH_PORT" GARRISON_WORKER_WORK_ROOT="$WORK/worker/workspaces" \
  GARRISON_WORKER_MAX_CONCURRENT_RUNS=4 GARRISON_WORKER_TELEMETRY_ENABLE=false \
  exec dotnet "$ART/bin/Garrison.Worker/debug_net10.0/Garrison.Worker.dll" > "$WORK/worker.log" 2>&1) &
WORKER_PID=$!

READY=0
for i in $(seq 1 60); do
  if curl -fs -H "x-api-key: $ADMIN_KEY" "$BASE_URL/v1.0/api/nodes" 2>/dev/null | grep -q '"status":"Ready"'; then READY=1; break; fi
  sleep 1
done
[ "$READY" = "1" ] || { tail -40 "$WORK/worker.log"; echo "worker did not register"; exit 1; }
echo "== server and worker ready"

record() { RESULTS+=("$1: $2"); [ "$2" = "PASS" ] || FAILED=1; }

if ! skipped csharp; then
  echo "== C# harness"
  if dotnet run --project "$ROOT/sdk/csharp/Garrison.Sdk.Test" -f net10.0 --artifacts-path "$WORK/sdk-csharp" -- "$BASE_URL" "$ACCESS_KEY" "$SECRET_KEY"; then record csharp PASS; else record csharp FAIL; fi
fi

if ! skipped python; then
  echo "== Python harness"
  python3 -m venv "$WORK/venv" && "$WORK/venv/bin/pip" install -q -e "$ROOT/sdk/python" > "$WORK/pip.log" 2>&1
  if "$WORK/venv/bin/python" "$ROOT/sdk/python/test_harness.py" "$BASE_URL" "$ACCESS_KEY" "$SECRET_KEY"; then record python PASS; else record python FAIL; fi
fi

if ! skipped js; then
  echo "== JavaScript/TypeScript harness"
  if (cd "$ROOT/sdk/js" && npm install --silent > "$WORK/npm.log" 2>&1 && npm run --silent build >> "$WORK/npm.log" 2>&1 && node test-harness.mjs "$BASE_URL" "$ACCESS_KEY" "$SECRET_KEY"); then record js PASS; else record js FAIL; fi
fi

if ! skipped go; then
  echo "== Go harness"
  GO_URL="http://host.docker.internal:${REST_PORT}"
  if command -v go > /dev/null 2>&1; then
    if (cd "$ROOT/sdk/go" && go run ./cmd/testharness "$BASE_URL" "$ACCESS_KEY" "$SECRET_KEY"); then record go PASS; else record go FAIL; fi
  elif command -v docker > /dev/null 2>&1; then
    if docker run --rm -v "$ROOT/sdk/go:/src" -w /src -e GOFLAGS=-mod=mod golang:1.23 go run ./cmd/testharness "$GO_URL" "$ACCESS_KEY" "$SECRET_KEY"; then record go PASS; else record go FAIL; fi
  else
    record go "SKIPPED (no go or docker)"
  fi
fi

if [ -z "$SKIP" ]; then
  echo "== interactive SDK console smoke checks"
  if GARRISON_SDK_ACCESS_KEY="$ACCESS_KEY" GARRISON_SDK_SECRET_KEY="$SECRET_KEY" GARRISON_CONSOLE_LOG_DIR="$WORK/consoles" \
      "$WORK/venv/bin/python" "$ROOT/scripts/verify-sdk-consoles.py" --base-url "$BASE_URL" --python "$WORK/venv/bin/python"; then record consoles PASS; else record consoles FAIL; fi
fi

echo
echo "== SDK harness summary"
for r in "${RESULTS[@]}"; do echo "  $r"; done
if [ "$FAILED" != "0" ]; then echo "logs: $WORK"; exit 1; fi
exit 0
