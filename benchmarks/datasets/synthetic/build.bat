@echo off
rem Rebuilds benchmarks\datasets\synthetic-fleet.json from benchmarks\datasets\synthetic\sources.json (counterpart of build.sh):
rem Garrison.Benchmark generate --kind synthetic. Extra arguments are passed to generate.
setlocal
call "%~dp0..\..\common.bat" || exit /b 1
call "%~dp0..\..\common.bat" :build Test.Benchmark Garrison.FakeHarness || exit /b 1
dotnet "%HARNESS_DLL%" generate --kind synthetic %*
exit /b %ERRORLEVEL%
