@echo off
rem The CI gate (counterpart of ci-gate.sh): starts the local stack from the working tree, runs the deterministic subset
rem against the committed baselines in benchmarks\baselines, stops the stack, and exits with the gate's code
rem (0 no regression, 1 regression or error, 3 incomplete). Latency is never compared here.
rem   benchmarks\ci-gate.bat
rem   benchmarks\ci-gate.bat --update      write new baselines (a reviewed change; say why in the commit message)
setlocal
call "%~dp0common.bat" || exit /b 1
call "%~dp0start-bench-server.bat" || (call "%~dp0stop-bench-server.bat" & exit /b 1)
dotnet "%HARNESS_DLL%" ci-gate --url %LOCAL_URL% --stack local --fake-harness "%FAKE_DLL%" --stack-details "local processes from the working tree: 1 server (Sqlite), %LOCAL_ALPHA_WORKERS% alpha + %LOCAL_BETA_WORKERS% beta workers x %WORKER_SLOTS% slots" %*
set CODE=%ERRORLEVEL%
if not "%CODE%"=="0" echo [bench] ci-gate exited %CODE%; server and worker logs are in %LOCAL_DIR%
call "%~dp0stop-bench-server.bat"
exit /b %CODE%
