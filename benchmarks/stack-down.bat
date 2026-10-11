@echo off
rem Deletes the benchmark k3d cluster (garrison-bench) and its kubeconfig (counterpart of stack-down.sh): the full reset
rem of the k3d stack. Reports in benchmarks\results are kept. Nothing else is touched.
setlocal
call "%~dp0common.bat" || exit /b 1
k3d cluster list %CLUSTER_NAME% > nul 2>&1 && (k3d cluster delete %CLUSTER_NAME% || exit /b 1) || echo [bench] no k3d cluster named %CLUSTER_NAME%
if exist "%KUBECONFIG_FILE%" del /q "%KUBECONFIG_FILE%"
exit /b 0
