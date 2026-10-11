@echo off
rem Stops the local benchmark stack started by start-bench-server.bat (counterpart of stop-bench-server.sh): every
rem process listening on the local stack's REST port and worker health ports.
setlocal
call "%~dp0common.bat" || exit /b 1
for %%p in (%LOCAL_REST_PORT% 37811 37812 37813 37814 37815 37816 37817 37818 37819) do (
  for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p " ^| findstr LISTENING') do taskkill /F /PID %%i > nul 2>&1
)
echo [bench] local stack stopped
exit /b 0
