@echo off
rem The standard suite, one round (counterpart of run-baseline.sh): validate, ingest and e2e on every committed dataset,
rem routing, load with the direct-invocation floor (closed loop) and open loop, and on the k3d stack also the scale-out
rem sweep and the resilience scenarios. Further arguments are forwarded to every measuring command. Exits with the worst
rem exit code (3 when any run was incomplete).
rem   benchmarks\run-baseline.bat round1
rem   set BENCH_STACK=local & benchmarks\run-baseline.bat local1
rem Environment: BENCH_STACK (k3d), DURATION (20), WARMUP (5), CONCURRENCY (1,4,8,16), RATES (20,40,60,80),
rem SCALE_WORKERS (1,2,3), REPEAT (3).
setlocal enabledelayedexpansion
if "%~1"=="" (echo usage: benchmarks\run-baseline.bat ^<round label^> [options forwarded to every command] & exit /b 1)
set LABEL=%~1
call "%~dp0common.bat" || exit /b 1
call "%~dp0common.bat" :build Test.Benchmark Garrison.FakeHarness || exit /b 1
call "%~dp0common.bat" :stackargs
shift
set FORWARD=
:collect
if "%~1"=="" goto start
set FORWARD=%FORWARD% %1
shift
goto collect
:start
if "%DURATION%"=="" set DURATION=20
if "%WARMUP%"=="" set WARMUP=5
if "%CONCURRENCY%"=="" set CONCURRENCY=1,4,8,16
if "%RATES%"=="" set RATES=20,40,60,80
if "%SCALE_WORKERS%"=="" set SCALE_WORKERS=1,2,3
if "%REPEAT%"=="" set REPEAT=3
set WORST=0
set H=dotnet "%HARNESS_DLL%"
call :step %H% validate
for %%d in (synthetic-fleet garrison-live) do call :step %H% ingest %STACK_ARGS% --dataset benchmarks/datasets/%%d.json --label %LABEL% %FORWARD%
call :step %H% routing %STACK_ARGS% --dataset benchmarks/datasets/synthetic-fleet.json --label %LABEL% %FORWARD%
for %%d in (synthetic-fleet garrison-live) do call :step %H% e2e %STACK_ARGS% --dataset benchmarks/datasets/%%d.json --repeat %REPEAT% --label %LABEL% %FORWARD%
call :step %H% load %STACK_ARGS% --arms garrison,direct --concurrency "%CONCURRENCY%" --duration-seconds %DURATION% --warmup-seconds %WARMUP% --label %LABEL% %FORWARD%
call :step %H% load %STACK_ARGS% --mode open --rates "%RATES%" --duration-seconds %DURATION% --warmup-seconds %WARMUP% --label %LABEL%-open %FORWARD%
if /i not "%BENCH_STACK%"=="local" (
  set ALPHA=2
  for /f %%r in ('kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% -n garrison get statefulset garrison-worker -o jsonpath^={.spec.replicas}') do set ALPHA=%%r
  call :step %H% load %STACK_ARGS% --scale-workers "%SCALE_WORKERS%" --concurrency 24 --delay-ms 100 --duration-seconds %DURATION% --warmup-seconds %WARMUP% --label %LABEL%-scale %FORWARD%
  kubectl --kubeconfig "%KUBECONFIG_FILE%" --context %CONTEXT% -n garrison scale statefulset/garrison-worker --replicas !ALPHA! > nul
  call :step %H% resilience %STACK_ARGS% --label %LABEL% %FORWARD%
)
echo [bench] round %LABEL% finished (worst exit code %WORST%); reports in benchmarks\results
exit /b %WORST%

:step
echo [bench] == %*
%*
set CODE=%ERRORLEVEL%
if "%CODE%"=="3" (set WORST=3) else if not "%CODE%"=="0" if not "%WORST%"=="3" set WORST=%CODE%
exit /b 0
