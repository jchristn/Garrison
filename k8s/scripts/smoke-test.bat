@echo off
rem Runs the fake-harness smoke test inside the cluster and prints its log.
setlocal
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
kubectl -n %GARRISON_NAMESPACE% delete job garrison-smoke-test --ignore-not-found >nul
kubectl apply -k "%~dp0..\overlays\smoke-test" || exit /b 1
kubectl -n %GARRISON_NAMESPACE% wait --for=condition=complete job/garrison-smoke-test --timeout=300s
set RESULT=%ERRORLEVEL%
kubectl -n %GARRISON_NAMESPACE% logs job/garrison-smoke-test
if not "%RESULT%"=="0" (
  echo [garrison] smoke test failed
  exit /b 1
)
echo [garrison] smoke test passed
endlocal
