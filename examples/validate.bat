@echo off
rem Checks a Garrison install end to end with the quick start agents. Runs validate.ps1 (same checks as validate.sh).
rem Usage:   examples\validate.bat [-Url URL] [-McpUrl URL] [-Tenant ID] [-Email EMAIL] [-Password PASS]
rem                                [-Agents "planner coder echo"] [-Delegator NAME] [-Delegate NAME] [-Wait SECONDS] [-SkipDelegation]
rem Defaults come from GARRISON_URL, GARRISON_MCP_URL, GARRISON_TENANT, GARRISON_EMAIL, and GARRISON_PASSWORD,
rem else http://127.0.0.1:8700, port 8701 on the same host, default, admin@garrison, password.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0validate.ps1" %*
exit /b %ERRORLEVEL%
