@echo off
rem Forwards the server (8700 REST, 8701 MCP) and dashboard (8080) to 127.0.0.1. Close the windows to stop.
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
start "garrison-server" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-server 8700:8700 8701:8701
start "garrison-dashboard" kubectl -n %GARRISON_NAMESPACE% port-forward --address 127.0.0.1 svc/garrison-dashboard 8080:80
echo [garrison] REST http://127.0.0.1:8700  MCP http://127.0.0.1:8701/mcp  dashboard http://127.0.0.1:8080
