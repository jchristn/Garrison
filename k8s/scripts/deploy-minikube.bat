@echo off
rem Deploys Garrison to minikube. See deploy-minikube.sh for details.
setlocal
if "%GARRISON_TAG%"=="" set GARRISON_TAG=v0.1.0-alpha
set K8S=%~dp0..
set REPO=%~dp0..\..
minikube status >nul 2>&1 || minikube start --cpus=4 --memory=8g || exit /b 1
if not "%SKIP_BUILD%"=="1" (
  pushd "%REPO%"
  minikube image build -t jchristn77/garrison-server:%GARRISON_TAG% -f src/Garrison.Server/Dockerfile . || exit /b 1
  minikube image build -t jchristn77/garrison-worker:%GARRISON_TAG% -f src/Garrison.Worker/Dockerfile . || exit /b 1
  popd
  pushd "%REPO%\dashboard"
  minikube image build -t jchristn77/garrison-dashboard:%GARRISON_TAG% . || exit /b 1
  popd
)
call "%~dp0generate-secrets.bat" || exit /b 1
kubectl apply -k "%K8S%\overlays\minikube" || exit /b 1
call "%~dp0wait-rollout.bat" || exit /b 1
for /f %%i in ('minikube ip') do set IP=%%i
echo [garrison] dashboard: http://%IP%:30880
echo [garrison] REST API:  http://%IP%:30870
echo [garrison] MCP:       http://%IP%:30871/mcp
endlocal
