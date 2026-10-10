@echo off
rem Forwards the server (REST 8700, MCP 8701) and dashboard (8080) to 127.0.0.1. Close the windows to stop.
rem When a local port is taken, pick others first, for example: set REST_PORT=9700 and set MCP_PORT=9701 and set DASHBOARD_PORT=9080
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
if "%REST_PORT%"=="" set REST_PORT=8700
if "%MCP_PORT%"=="" set MCP_PORT=8701
if "%DASHBOARD_PORT%"=="" set DASHBOARD_PORT=8080
start "garrison-server" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-server %REST_PORT%:8700 %MCP_PORT%:8701
start "garrison-dashboard" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-dashboard %DASHBOARD_PORT%:80
echo [garrison] REST http://127.0.0.1:%REST_PORT%  MCP http://127.0.0.1:%MCP_PORT%/mcp  dashboard http://127.0.0.1:%DASHBOARD_PORT%
