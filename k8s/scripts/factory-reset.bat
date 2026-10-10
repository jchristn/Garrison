@echo off
rem DESTRUCTIVE: deletes the Garrison namespace and all data, then reinstalls. Requires typing RESET.
rem Usage: factory-reset.bat [minikube^|k3s^|production^|k3s-observability^|minikube-observability]
rem set OBSERVABILITY=1 selects the -observability variant of minikube and k3s.
setlocal
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
set OVERLAY=%1
if "%OVERLAY%"=="" set OVERLAY=k3s
if "%OBSERVABILITY%"=="1" if exist "%~dp0..\overlays\%OVERLAY%-observability" set OVERLAY=%OVERLAY%-observability
echo This deletes namespace %GARRISON_NAMESPACE% and ALL Garrison data in the current kubectl context.
set /p ANSWER=Type RESET to continue: 
if not "%ANSWER%"=="RESET" (
  echo [garrison] aborted
  exit /b 1
)
kubectl delete namespace %GARRISON_NAMESPACE% --wait=true --ignore-not-found
call "%~dp0generate-secrets.bat" || exit /b 1
kubectl apply -k "%~dp0..\overlays\%OVERLAY%" || exit /b 1
call "%~dp0wait-rollout.bat"
endlocal
