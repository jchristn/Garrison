@echo off
rem Builds Garrison, starts a throwaway server (Sqlite) and one worker with the fake harness, then runs the
rem C#, Python, JavaScript/TypeScript, and Go SDK test harnesses against it. Exits non-zero when any harness fails.
rem Requires dotnet, python, node, curl, and go (or docker) on PATH.
rem
rem Environment overrides:
rem   GARRISON_SDK_REST_PORT (18700), GARRISON_SDK_MCP_PORT (18701), GARRISON_SDK_WORKER_HEALTH_PORT (18710)
rem   GARRISON_SDK_SKIP (comma list of csharp,python,js,go to skip)
setlocal enabledelayedexpansion
set ROOT=%~dp0..
if "%GARRISON_SDK_REST_PORT%"=="" set GARRISON_SDK_REST_PORT=18700
if "%GARRISON_SDK_MCP_PORT%"=="" set GARRISON_SDK_MCP_PORT=18701
if "%GARRISON_SDK_WORKER_HEALTH_PORT%"=="" set GARRISON_SDK_WORKER_HEALTH_PORT=18710
set "SKIPLIST=,%GARRISON_SDK_SKIP%,"
set BASE_URL=http://127.0.0.1:%GARRISON_SDK_REST_PORT%
set ACCESS_KEY=access_garrison_default
set SECRET_KEY=secret_garrison_default_change_me
set WORK=%TEMP%\garrison-sdk-%RANDOM%
set ART=%WORK%\artifacts
set FAILED=0
set R_CS=SKIPPED
set R_PY=SKIPPED
set R_JS=SKIPPED
set R_GO=SKIPPED
set R_CON=SKIPPED
mkdir "%WORK%\server" "%WORK%\worker" "%WORK%\bin"

echo == building solution into %ART%
dotnet build "%ROOT%\src\Garrison.sln" -f net10.0 --artifacts-path "%ART%" -v quiet -nologo > "%WORK%\build.log" 2>&1 || (type "%WORK%\build.log" & echo build failed & exit /b 1)

> "%WORK%\bin\garrison-fake-harness.cmd" echo @dotnet "%ART%\bin\Garrison.FakeHarness\debug_net10.0\garrison-fake-harness.dll" %%*
set DBFILE=%WORK:\=/%/server/garrison.db
> "%WORK%\server\garrison.json" echo { "Rest": { "Hostname": "127.0.0.1", "Port": %GARRISON_SDK_REST_PORT% }, "Mcp": { "Hostname": "127.0.0.1", "Port": %GARRISON_SDK_MCP_PORT% }, "Database": { "Type": "Sqlite", "Filename": "%DBFILE%" }, "Logging": { "ConsoleLogging": true, "MinimumSeverity": 2 }, "Telemetry": { "Enabled": false } }

rem A healthy answer from another process on the same port would test the wrong server, so refuse a port in use.
netstat -ano | findstr ":%GARRISON_SDK_REST_PORT% " | findstr LISTENING > nul && (echo port %GARRISON_SDK_REST_PORT% is in use; set GARRISON_SDK_REST_PORT and GARRISON_SDK_MCP_PORT & exit /b 1)

echo == starting server on %BASE_URL%
set GARRISON_SETTINGS_FILE=%WORK%\server\garrison.json
set GARRISON_TELEMETRY_ENABLE=false
rem Development mode: this throwaway server uses the public default keys and credentials the harnesses expect (SR-08).
set GARRISON_ALLOW_INSECURE_DEFAULTS=true
start "garrison-sdk-server" /B /D "%WORK%\server" dotnet "%ART%\bin\Garrison.Server\debug_net10.0\Garrison.Server.dll" > "%WORK%\server.log" 2>&1
for /L %%i in (1,1,60) do (
  curl -fs "%BASE_URL%/v1.0/api/health" > nul 2>&1 && goto server_ready
  timeout /t 1 /nobreak > nul
)
type "%WORK%\server.log"
echo server did not become healthy & goto fail_exit
:server_ready

echo == starting worker
set PATH=%WORK%\bin;%PATH%
set GARRISON_WORKER_SERVER_URL=%BASE_URL%
set GARRISON_WORKER_NODE_NAME=sdk-harness-worker
set GARRISON_WORKER_HEALTH_PORT=%GARRISON_SDK_WORKER_HEALTH_PORT%
set GARRISON_WORKER_WORK_ROOT=%WORK%\worker\workspaces
set GARRISON_WORKER_MAX_CONCURRENT_RUNS=4
set GARRISON_WORKER_TELEMETRY_ENABLE=false
set GARRISON_WORKER_MCP_TESTS_ENABLED=true
start "garrison-sdk-worker" /B /D "%WORK%\worker" dotnet "%ART%\bin\Garrison.Worker\debug_net10.0\Garrison.Worker.dll" > "%WORK%\worker.log" 2>&1
for /L %%i in (1,1,60) do (
  curl -fs -H "x-api-key: garrisonadmin" "%BASE_URL%/v1.0/api/nodes" 2>nul | findstr /C:"\"status\":\"Ready\"" > nul && goto worker_ready
  timeout /t 1 /nobreak > nul
)
type "%WORK%\worker.log"
echo worker did not register & goto fail_exit
:worker_ready
echo == server and worker ready

if not "!SKIPLIST:,csharp,=!"=="!SKIPLIST!" goto after_csharp
echo == C# harness
dotnet run --project "%ROOT%\sdk\csharp\Garrison.Sdk.Test" -f net10.0 --artifacts-path "%WORK%\sdk-csharp" -- %BASE_URL% %ACCESS_KEY% %SECRET_KEY% && (set R_CS=PASS) || (set R_CS=FAIL& set FAILED=1)
:after_csharp

rem The console smoke checks use this virtual environment, so it is created unless the Python harness is skipped.
if not "!SKIPLIST:,python,=!"=="!SKIPLIST!" goto after_python
echo == Python harness
python -m venv "%WORK%\venv" && "%WORK%\venv\Scripts\pip" install -q -e "%ROOT%\sdk\python" > "%WORK%\pip.log" 2>&1
"%WORK%\venv\Scripts\python" "%ROOT%\sdk\python\test_harness.py" %BASE_URL% %ACCESS_KEY% %SECRET_KEY% && (set R_PY=PASS) || (set R_PY=FAIL& set FAILED=1)
:after_python

if not "!SKIPLIST:,js,=!"=="!SKIPLIST!" goto after_js
echo == JavaScript/TypeScript harness
pushd "%ROOT%\sdk\js"
call npm install --silent > "%WORK%\npm.log" 2>&1 && call npm run --silent build >> "%WORK%\npm.log" 2>&1 && node test-harness.mjs %BASE_URL% %ACCESS_KEY% %SECRET_KEY% && (set R_JS=PASS) || (set R_JS=FAIL& set FAILED=1)
popd
:after_js

if not "!SKIPLIST:,go,=!"=="!SKIPLIST!" goto after_go
echo == Go harness
where go > nul 2>&1 && goto go_local
where docker > nul 2>&1 && goto go_docker
set R_GO=SKIPPED (no go or docker)
goto after_go
:go_local
pushd "%ROOT%\sdk\go"
go run ./cmd/testharness %BASE_URL% %ACCESS_KEY% %SECRET_KEY% && (set R_GO=PASS) || (set R_GO=FAIL& set FAILED=1)
popd
goto after_go
:go_docker
docker run --rm -v "%ROOT%\sdk\go:/src" -w /src -e GOFLAGS=-mod=mod golang:1.23 go run ./cmd/testharness http://host.docker.internal:%GARRISON_SDK_REST_PORT% %ACCESS_KEY% %SECRET_KEY% && (set R_GO=PASS) || (set R_GO=FAIL& set FAILED=1)
:after_go

if not "%GARRISON_SDK_SKIP%"=="" goto after_consoles
echo == interactive SDK console smoke checks
set GARRISON_SDK_ACCESS_KEY=%ACCESS_KEY%
set GARRISON_SDK_SECRET_KEY=%SECRET_KEY%
set GARRISON_CONSOLE_LOG_DIR=%WORK%\consoles
"%WORK%\venv\Scripts\python" "%ROOT%\scripts\verify-sdk-consoles.py" --base-url %BASE_URL% --python "%WORK%\venv\Scripts\python" && (set R_CON=PASS) || (set R_CON=FAIL& set FAILED=1)
:after_consoles

echo.
echo == SDK harness summary
echo   csharp: %R_CS%
echo   python: %R_PY%
echo   js: %R_JS%
echo   go: %R_GO%
echo   consoles: %R_CON%
call :stop
if not "%FAILED%"=="0" (echo logs: %WORK% & exit /b 1)
exit /b 0

:fail_exit
call :stop
exit /b 1

:stop
taskkill /F /FI "WINDOWTITLE eq garrison-sdk-worker*" > nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%GARRISON_SDK_REST_PORT% " ^| findstr LISTENING') do taskkill /F /PID %%p > nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%GARRISON_SDK_WORKER_HEALTH_PORT% " ^| findstr LISTENING') do taskkill /F /PID %%p > nul 2>&1
exit /b 0
