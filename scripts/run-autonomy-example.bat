@echo off
rem Runs the gerbil keeper example (examples\autonomous\gerbil) end to end against a running Garrison server and worker.
rem Runs run-autonomy-example.ps1 (same checks as run-autonomy-example.sh).
rem Usage:   scripts\run-autonomy-example.bat [-Url URL] [-Tenant ID] [-Token TOKEN] [-Email EMAIL] [-Password PASS]
rem                                           [-Variant fake^|claude-code] [-Wait SECONDS] [-Cleanup]
rem Defaults come from GARRISON_URL, GARRISON_TENANT, GARRISON_TOKEN, GARRISON_EMAIL, GARRISON_PASSWORD,
rem GARRISON_VARIANT, and GARRISON_WAIT, else http://127.0.0.1:8700, default, admin@garrison, fake, and 120 seconds.
rem A password or a token is required; nothing secret has a default.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-autonomy-example.ps1" %*
exit /b %ERRORLEVEL%
