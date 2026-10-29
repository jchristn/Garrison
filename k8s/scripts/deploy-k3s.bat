@echo off
rem Deploys Garrison to the current kubectl context (K3S). Use --build to build images and import them into the
rem K3S container named by K3S_CONTAINER (K3S in Docker), or the k3d cluster named by K3D_CLUSTER. See deploy-k3s.sh for details.
rem set OBSERVABILITY=1 to deploy overlays\k3s-observability (Prometheus, Loki, Tempo, Grafana, Alloy). Observability
rem images are pulled by K3S; k3d image import them first if Docker already has them.
setlocal
if "%GARRISON_TAG%"=="" set GARRISON_TAG=v0.2.0
set K8S=%~dp0..
set REPO=%~dp0..\..
if "%1"=="--build" (
  docker build -t jchristn77/garrison-server:%GARRISON_TAG% -f "%REPO%\src\Garrison.Server\Dockerfile" "%REPO%" || exit /b 1
  docker build -t jchristn77/garrison-worker:%GARRISON_TAG% -f "%REPO%\src\Garrison.Worker\Dockerfile" "%REPO%" || exit /b 1
  docker build -t jchristn77/garrison-dashboard:%GARRISON_TAG% -f "%REPO%\dashboard\Dockerfile" "%REPO%" || exit /b 1
  if not "%K3D_CLUSTER%"=="" (
    for %%i in (garrison-server garrison-worker garrison-dashboard) do (
      k3d image import -c %K3D_CLUSTER% jchristn77/%%i:%GARRISON_TAG% || exit /b 1
    )
    goto :imported
  )
  if "%K3S_CONTAINER%"=="" (
    echo [garrison] set K3D_CLUSTER to the k3d cluster name, or K3S_CONTAINER to the K3S container name, to import images
    exit /b 1
  )
  for %%i in (garrison-server garrison-worker garrison-dashboard) do (
    docker save jchristn77/%%i:%GARRISON_TAG% -o "%TEMP%\%%i.tar" || exit /b 1
    docker cp "%TEMP%\%%i.tar" %K3S_CONTAINER%:/tmp/%%i.tar || exit /b 1
    docker exec %K3S_CONTAINER% ctr images import /tmp/%%i.tar || exit /b 1
    docker exec %K3S_CONTAINER% rm -f /tmp/%%i.tar
    del /q "%TEMP%\%%i.tar"
  )
)
:imported
call "%~dp0generate-secrets.bat" || exit /b 1
set OVERLAY=k3s
if "%OBSERVABILITY%"=="1" set OVERLAY=k3s-observability
echo [garrison] applying overlays\%OVERLAY%
kubectl apply -k "%K8S%\overlays\%OVERLAY%" || exit /b 1
call "%~dp0wait-rollout.bat" || exit /b 1
if "%OBSERVABILITY%"=="1" echo [garrison] Grafana: run port-forward.bat, then open http://127.0.0.1:3000 ^(user admin, password from GARRISON_GRAFANA_PASSWORD or the one generate-secrets printed^)
echo [garrison] add "127.0.0.1 garrison.local" to your hosts file, then open http://garrison.local
echo [garrison] when K3S runs in Docker with -p 127.0.0.1:8080:80, use http://garrison.local:8080, or run port-forward.bat
endlocal
