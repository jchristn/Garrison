@echo off
rem Non-destructive update: re-apply an overlay, restart workloads, wait, and print pod status.
rem Usage: update.bat [minikube^|k3s^|production^|k3s-observability^|minikube-observability]
rem set OBSERVABILITY=1 and update.bat k3s is the same as update.bat k3s-observability.
setlocal
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
set OVERLAY=%1
if "%OVERLAY%"=="" set OVERLAY=k3s
if "%OBSERVABILITY%"=="1" if exist "%~dp0..\overlays\%OVERLAY%-observability" set OVERLAY=%OVERLAY%-observability
kubectl apply -k "%~dp0..\overlays\%OVERLAY%" || exit /b 1
kubectl -n %GARRISON_NAMESPACE% rollout restart deployment/garrison-server deployment/garrison-dashboard statefulset/garrison-worker || exit /b 1
kubectl -n %GARRISON_NAMESPACE% rollout status deployment/garrison-server --timeout=600s
kubectl -n %GARRISON_NAMESPACE% rollout status statefulset/garrison-worker --timeout=900s
kubectl -n %GARRISON_NAMESPACE% rollout status deployment/garrison-dashboard --timeout=300s
kubectl -n %GARRISON_NAMESPACE% get deployment garrison-grafana >nul 2>&1 && (
  for %%d in (garrison-prometheus garrison-loki garrison-tempo garrison-alloy garrison-grafana) do kubectl -n %GARRISON_NAMESPACE% rollout status deployment/%%d --timeout=600s
)
kubectl -n %GARRISON_NAMESPACE% get pods -o wide
endlocal
