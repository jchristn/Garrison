@echo off
rem Forwards the server (REST 8700, MCP 8701) and dashboard (8080) to 127.0.0.1, plus Grafana (3000), Prometheus
rem (9090), Loki (3100), and Tempo (3200) when the observability stack is deployed. Close the windows to stop.
rem When a local port is taken, pick others first, for example: set REST_PORT=9700 and set MCP_PORT=9701 and
rem set DASHBOARD_PORT=9080 and set GRAFANA_PORT=3001 (also PROMETHEUS_PORT, LOKI_PORT, TEMPO_PORT)
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
if "%REST_PORT%"=="" set REST_PORT=8700
if "%MCP_PORT%"=="" set MCP_PORT=8701
if "%DASHBOARD_PORT%"=="" set DASHBOARD_PORT=8080
if "%GRAFANA_PORT%"=="" set GRAFANA_PORT=3000
if "%PROMETHEUS_PORT%"=="" set PROMETHEUS_PORT=9090
if "%LOKI_PORT%"=="" set LOKI_PORT=3100
if "%TEMPO_PORT%"=="" set TEMPO_PORT=3200
start "garrison-server" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-server %REST_PORT%:8700 %MCP_PORT%:8701
start "garrison-dashboard" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-dashboard %DASHBOARD_PORT%:80
echo [garrison] REST http://127.0.0.1:%REST_PORT%  MCP http://127.0.0.1:%MCP_PORT%/mcp  dashboard http://127.0.0.1:%DASHBOARD_PORT%
kubectl -n %GARRISON_NAMESPACE% get service garrison-grafana >nul 2>&1 || goto :eof
start "garrison-grafana" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-grafana %GRAFANA_PORT%:3000
start "garrison-prometheus" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-prometheus %PROMETHEUS_PORT%:9090
start "garrison-loki" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-loki %LOKI_PORT%:3100
start "garrison-tempo" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-tempo %TEMPO_PORT%:3200
echo [garrison] Grafana http://127.0.0.1:%GRAFANA_PORT% ^(admin^)  Prometheus http://127.0.0.1:%PROMETHEUS_PORT%  Loki http://127.0.0.1:%LOKI_PORT%  Tempo http://127.0.0.1:%TEMPO_PORT%
