@echo off
rem Builds and pushes all three Garrison images. Usage: build-all.bat ^<tag^>
if "%~1"=="" (
  echo usage: %~nx0 ^<tag^>
  exit /b 2
)
call "%~dp0build-server.bat" %1 || exit /b 1
call "%~dp0build-worker.bat" %1 || exit /b 1
call "%~dp0build-dashboard.bat" %1 || exit /b 1
