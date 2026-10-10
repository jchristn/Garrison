@echo off
rem Non-destructive update: re-apply an overlay, restart workloads, wait, and print pod status.
rem Usage: update.bat [minikube^|k3s^|production]
setlocal
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
set OVERLAY=%1
if "%OVERLAY%"=="" set OVERLAY=k3s
kubectl apply -k "%~dp0..\overlays\%OVERLAY%" || exit /b 1
kubectl -n %GARRISON_NAMESPACE% rollout restart deployment/garrison-server deployment/garrison-dashboard statefulset/garrison-worker || exit /b 1
kubectl -n %GARRISON_NAMESPACE% rollout status deployment/garrison-server --timeout=600s
kubectl -n %GARRISON_NAMESPACE% rollout status statefulset/garrison-worker --timeout=900s
kubectl -n %GARRISON_NAMESPACE% rollout status deployment/garrison-dashboard --timeout=300s
kubectl -n %GARRISON_NAMESPACE% get pods -o wide
endlocal
