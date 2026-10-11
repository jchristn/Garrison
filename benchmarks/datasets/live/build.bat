@echo off
rem Rebuilds benchmarks\datasets\garrison-live.json from benchmarks\datasets\live\sources.json (counterpart of build.sh):
rem Garrison.Benchmark generate --kind live. Extra arguments are passed to generate.
setlocal
call "%~dp0..\..\common.bat" || exit /b 1
call "%~dp0..\..\common.bat" :build Test.Benchmark Garrison.FakeHarness || exit /b 1
dotnet "%HARNESS_DLL%" generate --kind live %*
exit /b %ERRORLEVEL%
