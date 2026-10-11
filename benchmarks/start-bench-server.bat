@echo off
rem Starts the local benchmark stack from the working tree: Garrison.Server (Release, Sqlite) and worker processes on two
rem lanes (alpha and beta) with only the fake harness on their PATH, under benchmarks\.run\local (wiped on every start).
rem The committed bench settings (config\garrison-bench.json) are copied in fresh each time. Counterpart of
rem start-bench-server.sh; stop it with stop-bench-server.bat.
rem   set LOCAL_ALPHA_WORKERS=2 & set WORKER_SLOTS=8 & benchmarks\start-bench-server.bat
setlocal
call "%~dp0common.bat" || exit /b 1
curl -fs "%LOCAL_URL%/v1.0/api/health" > nul 2>&1 && (echo [bench] error: something already answers on %LOCAL_URL%; run stop-bench-server.bat first & exit /b 1)
call "%~dp0common.bat" :build Garrison.Server Garrison.Worker Garrison.FakeHarness Test.Benchmark || exit /b 1
if not exist "%SERVER_DLL%" (echo [bench] error: missing %SERVER_DLL% & exit /b 1)
if exist "%LOCAL_DIR%" rmdir /s /q "%LOCAL_DIR%"
mkdir "%LOCAL_DIR%\server" "%LOCAL_DIR%\bin"
copy /y "%BENCH_DIR%\config\garrison-bench.json" "%LOCAL_DIR%\server\garrison.json" > nul
> "%LOCAL_DIR%\bin\garrison-fake-harness.cmd" echo @dotnet "%FAKE_DLL%" %%*

echo [bench] starting the server on %LOCAL_URL%
set "GARRISON_SETTINGS_FILE=%LOCAL_DIR%\server\garrison.json"
set "GARRISON_ADMIN_API_KEY=%ADMIN_KEY%"
start "garrison-bench-server" /B /D "%LOCAL_DIR%\server" dotnet "%SERVER_DLL%" > "%LOCAL_DIR%\server.log" 2>&1
dotnet "%HARNESS_DLL%" wait --url %LOCAL_URL% --admin-key %ADMIN_KEY% --nodes 0 --timeout-seconds 90 > nul || (echo [bench] error: the server did not become ready & type "%LOCAL_DIR%\server.log" & exit /b 1)

set INDEX=1
for /L %%n in (1,1,%LOCAL_ALPHA_WORKERS%) do call :worker alpha %%n
for /L %%n in (1,1,%LOCAL_BETA_WORKERS%) do call :worker beta %%n
set /a EXPECTED=%INDEX%-1
dotnet "%HARNESS_DLL%" wait --url %LOCAL_URL% --admin-key %ADMIN_KEY% --nodes %EXPECTED% --timeout-seconds 120 || (echo [bench] error: not every worker became Ready & exit /b 1)
echo [bench] local stack ready: %LOCAL_URL%, %EXPECTED% workers (logs in %LOCAL_DIR%); stop with benchmarks\stop-bench-server.bat
exit /b 0

:worker
set LANE=%1
set N=%2
set "DIR=%LOCAL_DIR%\worker-%LANE%-%N%"
mkdir "%DIR%"
set /a HEALTH=%LOCAL_HEALTH_BASE%+%INDEX%
set /a METRICS=%LOCAL_METRICS_BASE%+%INDEX%
set "GARRISON_WORKER_SERVER_URL=%LOCAL_URL%"
set "GARRISON_WORKER_NODE_NAME=bench-%LANE%-%N%"
set "GARRISON_WORKER_LABELS=garrison.io/pool=default,bench.garrison.io/lane=%LANE%"
set "GARRISON_WORKER_HEALTH_PORT=%HEALTH%"
set "GARRISON_WORKER_PROMETHEUS_PORT=%METRICS%"
set "GARRISON_WORKER_WORK_ROOT=%DIR%\workspaces"
set "GARRISON_WORKER_MAX_CONCURRENT_RUNS=%WORKER_SLOTS%"
rem The fake harness is the only harness the workers can find: PATH is the wrapper directory plus system directories.
set "SAVED_PATH=%PATH%"
set "PATH=%LOCAL_DIR%\bin;%SystemRoot%\system32;%ProgramFiles%\dotnet"
start "garrison-bench-worker-%LANE%-%N%" /B /D "%DIR%" dotnet "%WORKER_DLL%" > "%LOCAL_DIR%\worker-%LANE%-%N%.log" 2>&1
set "PATH=%SAVED_PATH%"
set /a INDEX=%INDEX%+1
exit /b 0
