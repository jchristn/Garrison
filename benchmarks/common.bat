@echo off
rem Shared settings for the benchmark scripts (benchmarks\*.bat), the counterpart of common.sh.
rem   call "%~dp0common.bat"                         set the variables below
rem   call "%~dp0common.bat" :build <project> ...    build projects under src\ in Release (skipped when NO_BUILD=1)
rem   call "%~dp0common.bat" :stackargs              set STACK_ARGS for the stack chosen by BENCH_STACK (k3d or local)
rem Port block 37xxx on 127.0.0.1: k3d REST 37870, MCP 37871, API 37443; local REST 37800, MCP 37801, Prometheus 37464,
rem worker health 37811 and up, worker metrics 37821 and up.
set "BENCH_DIR=%~dp0"
if "%BENCH_DIR:~-1%"=="\" set "BENCH_DIR=%BENCH_DIR:~0,-1%"
for %%i in ("%BENCH_DIR%\..") do set "REPO_DIR=%%~fi"
set "RUN_DIR=%BENCH_DIR%\.run"
set "BUILD_DIR=%RUN_DIR%\build"
set "LOCAL_DIR=%RUN_DIR%\local"
set CLUSTER_NAME=garrison-bench
set CONTEXT=k3d-garrison-bench
set "KUBECONFIG_FILE=%RUN_DIR%\kubeconfig"
set IMAGE_TAG=bench-local
set K3D_URL=http://127.0.0.1:37870
set LOCAL_REST_PORT=37800
set LOCAL_URL=http://127.0.0.1:37800
set LOCAL_HEALTH_BASE=37810
set LOCAL_METRICS_BASE=37820
set ADMIN_KEY=garrison-benchmark-admin-key-not-for-production
set "HARNESS_DLL=%BUILD_DIR%\bin\Test.Benchmark\release_net10.0\Garrison.Benchmark.dll"
set "SERVER_DLL=%BUILD_DIR%\bin\Garrison.Server\release_net10.0\Garrison.Server.dll"
set "WORKER_DLL=%BUILD_DIR%\bin\Garrison.Worker\release_net10.0\Garrison.Worker.dll"
set "FAKE_DLL=%BUILD_DIR%\bin\Garrison.FakeHarness\release_net10.0\garrison-fake-harness.dll"
if "%LOCAL_ALPHA_WORKERS%"=="" set LOCAL_ALPHA_WORKERS=1
if "%LOCAL_BETA_WORKERS%"=="" set LOCAL_BETA_WORKERS=1
if "%WORKER_SLOTS%"=="" set WORKER_SLOTS=4
if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"
if "%~1"==":build" goto build
if "%~1"==":stackargs" goto stackargs
exit /b 0

:build
shift
if "%NO_BUILD%"=="1" exit /b 0
:build_loop
if "%~1"=="" exit /b 0
echo [bench] building %~1 (Release)
dotnet build "%REPO_DIR%\src\%~1" -c Release -f net10.0 --artifacts-path "%BUILD_DIR%" -v quiet -nologo > "%RUN_DIR%\build-%~1.log" 2>&1 || (type "%RUN_DIR%\build-%~1.log" & echo [bench] error: build of %~1 failed & exit /b 1)
shift
goto build_loop

:stackargs
if /i "%BENCH_STACK%"=="local" (
  set STACK_ARGS=--url %LOCAL_URL% --stack local --fake-harness "%FAKE_DLL%" --stack-details "local processes from the working tree: 1 server (Sqlite), %LOCAL_ALPHA_WORKERS% alpha + %LOCAL_BETA_WORKERS% beta workers x %WORKER_SLOTS% slots"
  exit /b 0
)
set SERVERS=?
set ALPHA=?
set BETA=?
for /f %%r in ('kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% -n garrison get deployment garrison-server -o jsonpath^={.spec.replicas} 2^>nul') do set SERVERS=%%r
for /f %%r in ('kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% -n garrison get statefulset garrison-worker -o jsonpath^={.spec.replicas} 2^>nul') do set ALPHA=%%r
for /f %%r in ('kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% -n garrison get statefulset garrison-worker-beta -o jsonpath^={.spec.replicas} 2^>nul') do set BETA=%%r
set STACK_ARGS=--url %K3D_URL% --stack k3d --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% --fake-harness "%FAKE_DLL%" --stack-details "k3d %CLUSTER_NAME% (rancher/k3s:v1.31.4-k3s1, 3 GB node): %SERVERS% server(s) on PostgreSQL 17, %ALPHA% alpha + %BETA% beta workers x 4 slots"
exit /b 0
