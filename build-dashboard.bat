@echo off
rem Builds and pushes the multi-arch jchristn77/garrison-dashboard image with Docker Build Cloud, then pulls it back locally.
rem Usage: build-dashboard.bat ^<tag^>   (for example v0.2.0)
setlocal
if "%~1"=="" (
  echo usage: %~nx0 ^<tag^>
  exit /b 2
)
set TAG=%~1
set IMAGE_NAME=jchristn77/garrison-dashboard
set DOCKERFILE_PATH=dashboard/Dockerfile
set BUILD_CONTEXT=dashboard
if "%BUILDER%"=="" set BUILDER=cloud-jchristn77-jchristn77
if "%PLATFORMS%"=="" set PLATFORMS=linux/amd64,linux/arm64/v8
pushd "%~dp0"
docker buildx build --builder %BUILDER% --platform %PLATFORMS% -f %DOCKERFILE_PATH% -t %IMAGE_NAME%:%TAG% -t %IMAGE_NAME%:latest --push %BUILD_CONTEXT% || (popd & exit /b 1)
docker pull %IMAGE_NAME%:%TAG%
docker pull %IMAGE_NAME%:latest
popd
echo built and pushed %IMAGE_NAME%:%TAG%
endlocal
