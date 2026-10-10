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

REM Port settings: .env values, else the compose.yaml defaults.
set "REST_PORT=8700"
set "MCP_PORT=8701"
set "DASHBOARD_PORT=8080"
set "POSTGRES_PORT=5433"
if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    if /I "%%a"=="GARRISON_REST_PORT" set "REST_PORT=%%b"
    if /I "%%a"=="GARRISON_MCP_PORT" set "MCP_PORT=%%b"
    if /I "%%a"=="GARRISON_DASHBOARD_PORT" set "DASHBOARD_PORT=%%b"
    if /I "%%a"=="GARRISON_POSTGRES_PORT" set "POSTGRES_PORT=%%b"
  )
)

REM When the stack is not running, check its host ports before spending minutes on a build.
set "RUNNING="
for /f %%c in ('docker compose ps -q 2^>nul') do set "RUNNING=1"
if not defined RUNNING (
  set "BUSY="
  for %%p in (%REST_PORT% %MCP_PORT% %DASHBOARD_PORT% %POSTGRES_PORT%) do (
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
echo Update complete.
echo   Dashboard  http://127.0.0.1:%DASHBOARD_PORT%  ^(tenant default, admin@garrison, password password unless you changed it^)
echo   REST, A2A  http://127.0.0.1:%REST_PORT%
echo   MCP        http://127.0.0.1:%MCP_PORT%/mcp
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
