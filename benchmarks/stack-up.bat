@echo off
rem Brings up the isolated benchmark stack (counterpart of stack-up.sh): k3d cluster garrison-bench from k3d\cluster.yaml
rem (127.0.0.1:37870, 37871, 37443; kubeconfig in benchmarks\.run\kubeconfig), Garrison images built from the working
rem tree (tag bench-local), and the k8s\ overlay. Never touches your default kubeconfig or another cluster.
rem   benchmarks\stack-up.bat            set BUILD=0 to reuse existing bench-local images
rem   set SERVERS=2 & set ALPHA_WORKERS=3 & benchmarks\stack-up.bat
setlocal
call "%~dp0common.bat" || exit /b 1
call "%~dp0common.bat" :build Test.Benchmark Garrison.FakeHarness || exit /b 1
set KC=kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% -n garrison
k3d cluster list %CLUSTER_NAME% > nul 2>&1 && (echo [bench] k3d cluster %CLUSTER_NAME% exists; reusing it) || (k3d cluster create --config "%BENCH_DIR%\k3d\cluster.yaml" || exit /b 1)
k3d kubeconfig get %CLUSTER_NAME% > "%KUBECONFIG_FILE%" || exit /b 1
if "%BUILD%"=="" set BUILD=1
if "%BUILD%"=="1" (
  echo [bench] building the server and worker images from the working tree
  docker build -q -t jchristn77/garrison-server:%IMAGE_TAG% -f "%REPO_DIR%\src\Garrison.Server\Dockerfile" "%REPO_DIR%" > nul || exit /b 1
  docker build -q -t jchristn77/garrison-worker:%IMAGE_TAG% -f "%REPO_DIR%\src\Garrison.Worker\Dockerfile" "%REPO_DIR%" > nul || exit /b 1
)
for %%i in (garrison-server garrison-worker) do (
  echo [bench] importing jchristn77/%%i:%IMAGE_TAG%
  k3d image import -c %CLUSTER_NAME% jchristn77/%%i:%IMAGE_TAG% > nul || exit /b 1
)
for %%i in (postgres:17 busybox:1.36 curlimages/curl:8.10.1) do (
  docker image inspect %%i > nul 2>&1 && (k3d image import -c %CLUSTER_NAME% %%i > nul 2>&1 || echo [bench] could not import %%i; the cluster will pull it)
)
echo [bench] deploying the benchmark overlay
kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% apply -k "%BENCH_DIR%\k8s" > nul || exit /b 1
if not "%SERVERS%"=="" %KC% scale deployment/garrison-server --replicas %SERVERS% > nul
if not "%ALPHA_WORKERS%"=="" %KC% scale statefulset/garrison-worker --replicas %ALPHA_WORKERS% > nul
if "%BUILD%"=="1" %KC% rollout restart deployment/garrison-server statefulset/garrison-worker statefulset/garrison-worker-beta > nul 2>&1
%KC% rollout status statefulset/garrison-postgres --timeout=300s || exit /b 1
%KC% rollout status deployment/garrison-server --timeout=600s || exit /b 1
%KC% rollout status statefulset/garrison-worker --timeout=600s || exit /b 1
%KC% rollout status statefulset/garrison-worker-beta --timeout=600s || exit /b 1
set ALPHA=0
set BETA=0
for /f %%r in ('%KC% get statefulset garrison-worker -o jsonpath^={.spec.replicas}') do set ALPHA=%%r
for /f %%r in ('%KC% get statefulset garrison-worker-beta -o jsonpath^={.spec.replicas}') do set BETA=%%r
set /a EXPECTED=%ALPHA%+%BETA%
dotnet "%HARNESS_DLL%" wait --url %K3D_URL% --admin-key %ADMIN_KEY% --nodes %EXPECTED% --timeout-seconds 300 || (echo [bench] error: not every worker became Ready & exit /b 1)
%KC% get pods -o wide
echo [bench] bench stack ready at %K3D_URL%
exit /b 0
