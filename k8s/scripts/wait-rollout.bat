@echo off
rem Shared rollout wait used by the deploy and reset scripts.
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
kubectl -n %GARRISON_NAMESPACE% rollout status statefulset/garrison-postgres --timeout=300s 2>nul
kubectl -n %GARRISON_NAMESPACE% rollout status deployment/garrison-server --timeout=600s || exit /b 1
kubectl -n %GARRISON_NAMESPACE% rollout status statefulset/garrison-worker --timeout=600s || exit /b 1
kubectl -n %GARRISON_NAMESPACE% rollout status deployment/garrison-dashboard --timeout=300s || exit /b 1
kubectl -n %GARRISON_NAMESPACE% wait --for=condition=complete job/garrison-bootstrap --timeout=300s || echo [garrison] bootstrap Job has not completed; check: kubectl -n %GARRISON_NAMESPACE% logs job/garrison-bootstrap
kubectl -n %GARRISON_NAMESPACE% get deployment garrison-grafana >nul 2>&1 || exit /b 0
for %%d in (garrison-prometheus garrison-loki garrison-tempo garrison-alloy garrison-grafana) do (
  kubectl -n %GARRISON_NAMESPACE% rollout status deployment/%%d --timeout=600s || exit /b 1
)
exit /b 0
