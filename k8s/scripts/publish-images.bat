@echo off
setlocal EnableExtensions EnableDelayedExpansion
rem P7.5: native Windows buildx wrapper. Default exports OCI archives; --push publishes.
set "ROOT=%~dp0..\.."
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "([xml](Get-Content '%ROOT%\src\Directory.Build.props')).Project.PropertyGroup.Version ^| Where-Object { $_ } ^| Select-Object -First 1"`) do set "VERSION=%%V"
if not defined VERSION exit /b 1
set "TAG=v%VERSION%"
if not defined GARRISON_IMAGE_NAMESPACE set "GARRISON_IMAGE_NAMESPACE=jchristn77"
if not defined GARRISON_IMAGE_BUILDER set "GARRISON_IMAGE_BUILDER=garrison-publish"
if not defined GARRISON_IMAGE_PLATFORMS set "GARRISON_IMAGE_PLATFORMS=linux/amd64,linux/arm64"
if not defined GARRISON_IMAGE_OUTPUT set "GARRISON_IMAGE_OUTPUT=%ROOT%\artifacts\images\%TAG%"
set "MODE=oci"
set "IMAGES=server worker dashboard"
:args
if "%~1"=="" goto build
if "%~1"=="--push" (set "MODE=push"& shift& goto args)
if "%~1"=="--image" (
  if "%~2"=="" (echo --image requires server, worker, or dashboard& exit /b 2)
  set "IMAGES=%~2"
  shift
  shift
  goto args
)
if "%~1"=="--help" (echo publish-images.bat [--push] [--image server^|worker^|dashboard]& exit /b 0)
echo Unknown argument: %~1
exit /b 2
:build
if "%MODE%"=="push" for /f "delims=" %%S in ('git -C "%ROOT%" status --porcelain --untracked-files^=no') do (echo Commit tracked changes before publishing.& exit /b 1)
for /f "delims=" %%R in ('git -C "%ROOT%" rev-parse HEAD') do set "REVISION=%%R"
docker buildx inspect "%GARRISON_IMAGE_BUILDER%" >nul 2>nul || docker buildx create --name "%GARRISON_IMAGE_BUILDER%" --driver docker-container >nul
if errorlevel 1 exit /b 1
docker buildx inspect "%GARRISON_IMAGE_BUILDER%" --bootstrap >nul
if errorlevel 1 exit /b 1
if not exist "%GARRISON_IMAGE_OUTPUT%" mkdir "%GARRISON_IMAGE_OUTPUT%"
for %%I in (%IMAGES%) do (
  set "CONTEXT=%ROOT%"
  if "%%I"=="server" (set "FILE=%ROOT%\src\Garrison.Server\Dockerfile") else if "%%I"=="worker" (set "FILE=%ROOT%\src\Garrison.Worker\Dockerfile") else if "%%I"=="dashboard" (set "FILE=%ROOT%\dashboard\Dockerfile") else (echo Unknown image: %%I& exit /b 2)
  set OUTPUT=--output "type=oci,dest=%GARRISON_IMAGE_OUTPUT%/garrison-%%I.oci.tar"
  if "%MODE%"=="push" set "OUTPUT=--push"
  docker buildx build --builder "%GARRISON_IMAGE_BUILDER%" --platform "%GARRISON_IMAGE_PLATFORMS%" --file "!FILE!" --tag "%GARRISON_IMAGE_NAMESPACE%/garrison-%%I:%TAG%" --label "org.opencontainers.image.revision=%REVISION%" --metadata-file "%GARRISON_IMAGE_OUTPUT%/garrison-%%I.metadata.json" !OUTPUT! "!CONTEXT!"
  if errorlevel 1 exit /b 1
  if "%MODE%"=="push" docker buildx imagetools inspect "%GARRISON_IMAGE_NAMESPACE%/garrison-%%I:%TAG%"
  if errorlevel 1 exit /b 1
)
exit /b 0
