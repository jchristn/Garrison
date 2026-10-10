@echo off
setlocal

REM ==========================================================================
REM update.bat - Rebuild the Garrison images and recreate the Docker stack.
REM
REM Non-destructive: named volumes (database, worker workspaces) are preserved.
REM For a destructive reset use docker\factory\reset.bat.
REM
REM Usage:   update.bat            rebuild images from this repository (default)
REM          update.bat --pull     pull the published images named in compose.yaml instead
REM ==========================================================================

set "SCRIPT_DIR=%~dp0"
set "MODE=build"
if /I "%~1"=="--pull" set "MODE=pull"

echo.
echo ==========================================================
echo   Garrison - Update Docker Stack (%MODE%)
echo ==========================================================
echo.

pushd "%SCRIPT_DIR%"

if "%MODE%"=="pull" (
  echo [1/4] Pulling the images named in compose.yaml...
  docker compose pull || goto :fail
) else (
  echo [1/4] Building images, the worker image takes several minutes on the first build...
  docker compose build || goto :fail
)

echo [2/4] Stopping the stack, volumes are preserved...
docker compose down || goto :fail

echo [3/4] Starting the stack...
docker compose up -d || goto :fail

echo [4/4] Container status:
docker compose ps -a

popd
echo.
echo Update complete. Dashboard: http://127.0.0.1:8080  (tenant default, admin@garrison, password)
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
