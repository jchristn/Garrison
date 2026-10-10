@echo off
rem DESTRUCTIVE: deletes the Garrison namespace and all data, then reinstalls. Requires typing RESET.
rem Usage: factory-reset.bat [minikube^|k3s^|production]
setlocal
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
set OVERLAY=%1
if "%OVERLAY%"=="" set OVERLAY=k3s
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
