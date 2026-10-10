@echo off
rem Creates the Garrison Secrets with random values. Existing garrison-secrets and garrison-node-credential are kept
rem unless --force is given. Optional harness credentials are read from the environment:
rem ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN, OPENAI_API_KEY, MUX_BASE_URL, MUX_MODEL, MUX_API_KEY, MUX_ADAPTER_TYPE,
rem and CODEX_AUTH_JSON_FILE (path to a Codex auth.json)
setlocal enabledelayedexpansion
if "%GARRISON_NAMESPACE%"=="" set GARRISON_NAMESPACE=garrison
set FORCE=0
if "%1"=="--force" set FORCE=1

kubectl get namespace %GARRISON_NAMESPACE% >nul 2>&1 || kubectl create namespace %GARRISON_NAMESPACE% >nul

set RAND=powershell -NoProfile -Command "$b=New-Object byte[] 64; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ([Convert]::ToBase64String($b) -replace '[^A-Za-z0-9]','').Substring(0,
set KEY32=powershell -NoProfile -Command "$b=New-Object byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)"

set CREATE=1
kubectl -n %GARRISON_NAMESPACE% get secret garrison-secrets >nul 2>&1 && set CREATE=0
if "%FORCE%"=="1" set CREATE=1
if "%CREATE%"=="1" (
  for /f %%v in ('%RAND%20)"') do set ADMIN_PASSWORD=%%v
  for /f %%v in ('%KEY32%') do set MASTER_KEY=%%v
  for /f %%v in ('%RAND%48)"') do set SIGNING_KEY=%%v
  for /f %%v in ('%RAND%40)"') do set ADMIN_API_KEY=%%v
  for /f %%v in ('%RAND%32)"') do set DB_PASSWORD=%%v
  for /f %%v in ('%RAND%32)"') do set DEFAULT_ACCESS=%%v
  for /f %%v in ('%RAND%48)"') do set DEFAULT_SECRET=%%v
  kubectl -n %GARRISON_NAMESPACE% create secret generic garrison-secrets --from-literal=master-key=!MASTER_KEY! --from-literal=signing-key=!SIGNING_KEY! --from-literal=admin-api-key=!ADMIN_API_KEY! --from-literal=admin-password=!ADMIN_PASSWORD! --from-literal=db-password=!DB_PASSWORD! --from-literal=default-access-key=access_!DEFAULT_ACCESS! --from-literal=default-secret-key=secret_!DEFAULT_SECRET! --dry-run=client -o yaml | kubectl apply -f - >nul
  echo [garrison] created secret garrison-secrets
  echo [garrison] WARNING: the administrator password is shown once. Store it now.
  echo [garrison]   admin user: admin@garrison.local
  echo [garrison]   admin password: !ADMIN_PASSWORD!
) else (
  echo [garrison] secret garrison-secrets exists; keeping it ^(use --force to rotate^)
)

set CREATE=1
kubectl -n %GARRISON_NAMESPACE% get secret garrison-node-credential >nul 2>&1 && set CREATE=0
if "%FORCE%"=="1" set CREATE=1
if "%CREATE%"=="1" (
  for /f %%v in ('%RAND%32)"') do set NODE_ACCESS=%%v
  for /f %%v in ('%RAND%48)"') do set NODE_SECRET=%%v
  kubectl -n %GARRISON_NAMESPACE% create secret generic garrison-node-credential --from-literal=access-key=access_!NODE_ACCESS! --from-literal=secret-key=secret_!NODE_SECRET! --dry-run=client -o yaml | kubectl apply -f - >nul
  echo [garrison] created secret garrison-node-credential
)

set ARGS=
for %%k in (ANTHROPIC_API_KEY CLAUDE_CODE_OAUTH_TOKEN OPENAI_API_KEY MUX_BASE_URL MUX_MODEL MUX_API_KEY MUX_ADAPTER_TYPE) do (
  if not "!%%k!"=="" (
    set ARGS=!ARGS! --from-literal=%%k=!%%k!
    echo [garrison] harness credential %%k: provided
  )
)
if not "%CODEX_AUTH_JSON_FILE%"=="" (
  if exist "%CODEX_AUTH_JSON_FILE%" (
    set ARGS=!ARGS! --from-file=CODEX_AUTH_JSON="%CODEX_AUTH_JSON_FILE%"
    echo [garrison] harness credential CODEX_AUTH_JSON: provided from %CODEX_AUTH_JSON_FILE%
  ) else (
    echo [garrison] CODEX_AUTH_JSON_FILE %CODEX_AUTH_JSON_FILE% not found; skipping
  )
)
if not "!ARGS!"=="" (
  kubectl -n %GARRISON_NAMESPACE% create secret generic garrison-harness-credentials !ARGS! --dry-run=client -o yaml | kubectl apply -f - >nul
  echo [garrison] updated secret garrison-harness-credentials
) else (
  echo [garrison] no harness credentials in the environment; only the smoke-test agent will be runnable
)
endlocal
