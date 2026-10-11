@echo off
rem Builds the harness (Release) and runs one Garrison.Benchmark command. Measuring commands (ingest, routing, e2e,
rem load, resilience) are pointed at the stack chosen by BENCH_STACK (k3d by default, or local) unless you pass --url.
rem   benchmarks\bench.bat validate
rem   benchmarks\bench.bat e2e --label try1
rem   set BENCH_STACK=local & benchmarks\bench.bat routing
setlocal
call "%~dp0common.bat" || exit /b 1
call "%~dp0common.bat" :build Test.Benchmark Garrison.FakeHarness || exit /b 1
set COMMAND=%~1
if "%COMMAND%"=="" set COMMAND=help
set STACK_ARGS=
set NEEDS_STACK=0
for %%c in (ingest routing e2e load resilience) do if /i "%COMMAND%"=="%%c" set NEEDS_STACK=1
echo %* | findstr /C:"--url " > nul && set NEEDS_STACK=0
if "%NEEDS_STACK%"=="1" call "%~dp0common.bat" :stackargs
shift
set REST=
:collect
if "%~1"=="" goto run
set REST=%REST% %1
shift
goto collect
:run
dotnet "%HARNESS_DLL%" %COMMAND% %STACK_ARGS% %REST%
exit /b %ERRORLEVEL%
