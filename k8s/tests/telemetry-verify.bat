@echo off
rem P13.28 telemetry verification: generates traffic across every REST route, MCP, A2A, SSE, WebSocket, and harness
rem type (backed by the fake harness) on a cluster deployed with OBSERVABILITY=1, then asserts through Prometheus, Loki,
rem and Tempo that every entry of the coverage matrix in docs\TELEMETRY.md produced data, and opens every Grafana
rem dashboard in a headless browser to check that no panel shows "No data" or an error.
rem
rem   set OBSERVABILITY=1 && k8s\scripts\deploy-k3s.bat
rem   k8s\tests\telemetry-verify.bat
rem
rem Environment: KUBECONFIG_FILE, CONTEXT, NAMESPACE (garrison), SERVER_PORT (18800), MCP_PORT (18801), GRAFANA_PORT
rem (13000), PROMETHEUS_PORT (19090), LOKI_PORT (13100), TEMPO_PORT (13200), SETTLE_SECONDS (75), BLOCKED_FAIL_SECONDS
rem (30), KUBERNETES_EXECUTOR (auto), HEADLESS_CHECK (1). See k8s\tests\telemetry\verify.mjs.
setlocal
set "TEST_DIR=%~dp0"
set "REPO_DIR=%TEST_DIR%..\.."
where node >nul 2>nul || (echo [telemetry-verify] error: node is required & exit /b 1)
where kubectl >nul 2>nul || (echo [telemetry-verify] error: kubectl is required & exit /b 1)
if not "%HEADLESS_CHECK%"=="0" if not exist "%REPO_DIR%\dashboard\node_modules\playwright" (
  echo [telemetry-verify] installing dashboard dependencies for the headless check
  pushd "%REPO_DIR%\dashboard"
  call npm install --no-audit --no-fund >nul || (popd & exit /b 1)
  call npx playwright install chromium >nul || (popd & exit /b 1)
  popd
)
node "%TEST_DIR%telemetry\verify.mjs" %*
exit /b %ERRORLEVEL%
