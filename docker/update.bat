@echo off
setlocal enabledelayedexpansion

REM ==========================================================================
REM update.bat - Rebuild the Garrison images and recreate the Docker stack.
REM
REM Non-destructive: named volumes (database, worker workspaces) are preserved.
REM First, env-secrets.ps1 makes sure .env holds every key and password the stack
REM requires, generating random values for any that can safely be created.
REM For a destructive reset use docker\factory\reset.bat.
REM
REM Usage:   update.bat                   rebuild images from this repository (default)
REM          update.bat --pull            pull the published images named in compose.yaml instead
REM          update.bat --observability   also run the observability profile (Prometheus, Loki, Tempo, Grafana,
REM                                       Alloy) with compose.observability.yaml; combines with --pull
REM ==========================================================================

set "SCRIPT_DIR=%~dp0"
set "MODE=build"
set "OBSERVABILITY=0"
for %%a in (%*) do (
  if /I "%%~a"=="--pull" set "MODE=pull"
  if /I "%%~a"=="--observability" set "OBSERVABILITY=1"
)
set "COMPOSE=docker compose -f compose.yaml"
if "%OBSERVABILITY%"=="1" set "COMPOSE=docker compose -f compose.yaml -f compose.observability.yaml --profile observability"

echo.
echo ==========================================================
echo   Garrison - Update Docker Stack (%MODE%)
echo ==========================================================
echo.

pushd "%SCRIPT_DIR%"

REM Keys, passwords, and seeded credentials: compose.yaml has no defaults for them (SR-08).
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%env-secrets.ps1"
if errorlevel 1 (
  popd
  endlocal
  exit /b 1
)

REM Port settings: .env values, else the compose.yaml defaults.
set "REST_PORT=8700"
set "MCP_PORT=8701"
set "DASHBOARD_PORT=8080"
set "POSTGRES_PORT=5433"
set "GRAFANA_PORT=3000"
set "PROMETHEUS_PORT=9090"
set "LOKI_PORT=3100"
set "TEMPO_PORT=3200"
if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    if /I "%%a"=="GARRISON_REST_PORT" set "REST_PORT=%%b"
    if /I "%%a"=="GARRISON_MCP_PORT" set "MCP_PORT=%%b"
    if /I "%%a"=="GARRISON_DASHBOARD_PORT" set "DASHBOARD_PORT=%%b"
    if /I "%%a"=="GARRISON_POSTGRES_PORT" set "POSTGRES_PORT=%%b"
    if /I "%%a"=="GARRISON_GRAFANA_PORT" set "GRAFANA_PORT=%%b"
    if /I "%%a"=="GARRISON_PROMETHEUS_PORT" set "PROMETHEUS_PORT=%%b"
    if /I "%%a"=="GARRISON_LOKI_PORT" set "LOKI_PORT=%%b"
    if /I "%%a"=="GARRISON_TEMPO_PORT" set "TEMPO_PORT=%%b"
  )
)

REM When the stack is not running, check its host ports before spending minutes on a build.
set "RUNNING="
for /f %%c in ('docker compose ps -q 2^>nul') do set "RUNNING=1"
if not defined RUNNING (
  set "BUSY="
  set "CHECK_PORTS=%REST_PORT% %MCP_PORT% %DASHBOARD_PORT% %POSTGRES_PORT%"
  if "%OBSERVABILITY%"=="1" set "CHECK_PORTS=%REST_PORT% %MCP_PORT% %DASHBOARD_PORT% %POSTGRES_PORT% %GRAFANA_PORT% %PROMETHEUS_PORT% %LOKI_PORT% %TEMPO_PORT%"
  for %%p in (!CHECK_PORTS!) do (
    netstat -an | findstr /R /C:"127\.0\.0\.1:%%p .*LISTENING" /C:"0\.0\.0\.0:%%p .*LISTENING" >nul && (
      echo Port %%p on 127.0.0.1 is already in use.
      set "BUSY=1"
    )
  )
  if defined BUSY (
    echo Pick free ports in docker\.env ^(copy .env.example if you have not^), for example GARRISON_REST_PORT=9700, then run this again.
    popd
    endlocal
    exit /b 1
  )
)

if "%MODE%"=="pull" (
  echo [1/4] Pulling the images named in compose.yaml...
  %COMPOSE% pull || goto :fail
) else (
  echo [1/4] Building images, the worker image takes several minutes on the first build...
  REM --pull refreshes the base images, so a rebuild picks up runtime and OS security fixes.
  %COMPOSE% build --pull || goto :fail
)

echo [2/4] Stopping the stack, volumes are preserved...
docker compose -f compose.yaml --profile observability down || goto :fail

echo [3/4] Starting the stack...
%COMPOSE% up -d || goto :fail

echo [4/4] Container status:
%COMPOSE% ps -a

popd
echo.
echo Update complete.
echo   Dashboard  http://127.0.0.1:%DASHBOARD_PORT%  ^(tenant default, admin@garrison, GARRISON_ADMIN_PASSWORD from .env^)
echo   REST, A2A  http://127.0.0.1:%REST_PORT%
echo   MCP        http://127.0.0.1:%MCP_PORT%/mcp
if "%OBSERVABILITY%"=="1" echo   Grafana    http://127.0.0.1:%GRAFANA_PORT%  ^(admin, GARRISON_GRAFANA_PASSWORD from .env^)
if "%OBSERVABILITY%"=="1" echo   Prometheus http://127.0.0.1:%PROMETHEUS_PORT%
echo The garrison-bootstrap container is meant to exit with code 0 once it has created the sample agents.
echo.
endlocal
exit /b 0

:fail
popd
echo.
echo Update FAILED. See the output above.
echo.
endlocal
exit /b 1
