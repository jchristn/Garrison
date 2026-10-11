#!/usr/bin/env bash
# P13.28 telemetry verification: generates traffic across every REST route, MCP, A2A, SSE, WebSocket, and harness type
# (backed by the fake harness, so no credentials are needed) on a cluster deployed with OBSERVABILITY=1, then asserts
# through Prometheus, Loki, and Tempo that every entry of the coverage matrix in docs/TELEMETRY.md produced data, and
# opens every Grafana dashboard in a headless browser to check that no panel shows "No data" or an error.
#
#   OBSERVABILITY=1 K3D_CLUSTER=garrison-telemetry k8s/scripts/deploy-k3s.sh --build   # or any observability deploy
#   k8s/tests/telemetry-verify.sh
#
# Environment (see k8s/tests/telemetry/verify.mjs for the full list):
#   KUBECONFIG_FILE, CONTEXT   which cluster to check (default: kubectl's current kubeconfig and context)
#   NAMESPACE                  garrison
#   SERVER_PORT (18800), MCP_PORT (18801), GRAFANA_PORT (13000), PROMETHEUS_PORT (19090), LOKI_PORT (13100),
#   TEMPO_PORT (13200)         local ports for the port-forwards; they avoid the port-forward.sh defaults
#   SETTLE_SECONDS (75), BLOCKED_FAIL_SECONDS (30), KUBERNETES_EXECUTOR (auto), HEADLESS_CHECK (1)
#
# Needs node 22 or later and kubectl; the headless check uses Playwright from dashboard/node_modules (npm install in
# dashboard/, then npx playwright install chromium). Results go to k8s/tests/results/<time>-telemetry-verify.json.
set -euo pipefail
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${TEST_DIR}/../.." && pwd)"
command -v node >/dev/null 2>&1 || { echo "[telemetry-verify] error: node is required" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "[telemetry-verify] error: kubectl is required" >&2; exit 1; }
if [ "${HEADLESS_CHECK:-1}" = "1" ] && [ ! -d "${REPO_DIR}/dashboard/node_modules/playwright" ]; then
  echo "[telemetry-verify] installing dashboard dependencies for the headless check"
  (cd "${REPO_DIR}/dashboard" && npm install --no-audit --no-fund >/dev/null && npx playwright install chromium >/dev/null)
fi
exec node "${TEST_DIR}/telemetry/verify.mjs" "$@"
