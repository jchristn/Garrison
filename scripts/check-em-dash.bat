@echo off
rem Fails when any tracked text file contains an em-dash (U+2014). See WRITING_DOCUMENTS.md.
pushd "%~dp0.."
powershell -NoProfile -Command "$dash=[char]0x2014; $files = git ls-files --cached --others --exclude-standard; $bad=$false; foreach ($f in $files) { if (-not (Test-Path $f)) { continue }; if ($f -match '\.(png|jpg|jpeg|ico|gif|woff2?|ttf|db|zip|tar|gz)$') { continue }; $n=0; foreach ($line in [System.IO.File]::ReadAllLines($f)) { $n++; if ($line.Contains($dash)) { Write-Output ($f + ':' + $n + ': ' + $line); $bad=$true } } }; if ($bad) { Write-Error 'em-dash characters found; rewrite those sentences'; exit 1 } else { Write-Output 'no em-dashes found' }"
set RESULT=%ERRORLEVEL%
popd
exit /b %RESULT%
