@echo off
setlocal

REM ==========================================================================
REM reset.bat - Reset the Garrison Docker stack to factory defaults.
REM
REM DESTRUCTIVE: removes the containers and every named volume (the Postgres
REM database with all agents, runs, secrets, and users, the worker
REM workspaces, and the observability data: Prometheus, Loki, Tempo, Grafana,
REM and Alloy), then rebuilds the images and starts a fresh stack that seeds
REM tenant default, admin@garrison / password, and the sample agents again.
REM
REM Usage:   reset.bat             reset, rebuild, and start
REM          reset.bat --no-start  reset only; start later with update.bat
REM ==========================================================================

set "SCRIPT_DIR=%~dp0"
set "DOCKER_DIR=%SCRIPT_DIR%.."
set "START=1"
if /I "%~1"=="--no-start" set "START=0"

echo.
echo ==========================================================
echo   Garrison - Reset to Factory Defaults
echo ==========================================================
echo.
echo WARNING: This is DESTRUCTIVE. The Garrison containers and all Docker volumes
echo (the database with every agent, run, secret, and user, and the worker
echo workspaces) will be deleted.
echo.
set /p "CONFIRM=Type 'RESET' to confirm: "
echo.

if not "%CONFIRM%"=="RESET" (
  echo Aborted. No changes were made.
  endlocal
  exit /b 1
)

pushd "%DOCKER_DIR%"

echo [1/3] Stopping containers and removing volumes...
REM The observability profile is named so its containers and volumes are removed too.
docker compose -f compose.yaml --profile observability down -v --remove-orphans || goto :fail

if "%START%"=="0" (
  popd
  echo.
  echo Factory reset complete. Start the stack with: docker\update.bat
  endlocal
  exit /b 0
)

echo [2/3] Building images and starting a fresh stack...
docker compose build || goto :fail
docker compose up -d || goto :fail

echo [3/3] Container status:
docker compose ps -a

popd
echo.
echo Factory reset complete. Dashboard: http://127.0.0.1:8080  (tenant default, admin@garrison, password)
echo.
endlocal
exit /b 0

:fail
popd
echo.
echo Reset FAILED. See the output above.
echo.
endlocal
exit /b 1
