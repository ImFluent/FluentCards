@echo off
setlocal
rem ============================================================
rem  FluentCards - opens the flashcard app as its own window.
rem  Works after the extension has been installed (see Install.bat).
rem  The extension ID is fixed by the "key" inside manifest.json,
rem  so it never changes between installs or folders.
rem ============================================================

set "EXTID=hkinaldgmhkdllanjiachngcnadiloio"
set "APPURL=chrome-extension://%EXTID%/app.html"

rem  Prefer Chrome; fall back to Edge only if Chrome is missing.
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto runchrome
set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto runchrome
set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto runchrome

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto run
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto run

echo Neither Chrome nor Edge was found on this computer.
pause
goto end

:run
start "" "%EDGE%" --app=%APPURL%
goto end

:runchrome
start "" "%CHROME%" --app=%APPURL%
goto end

:end
