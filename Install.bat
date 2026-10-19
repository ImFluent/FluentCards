@echo off
setlocal
rem ============================================================
rem  FluentCards - installer helper
rem  1. Copies this folder's path to the clipboard
rem  2. Opens your browser's Extensions page
rem  Then: turn on "Developer mode" -> "Load unpacked" -> Ctrl+V
rem ============================================================

set "HERE=%~dp0"
if "%HERE:~-1%"=="\" set "HERE=%HERE:~0,-1%"
echo %HERE%| clip

echo.
echo   FluentCards - install
echo   ---------------------
echo   The folder below is now on your clipboard:
echo.
echo     %HERE%
echo.

rem  Prefer Chrome; fall back to Edge only if Chrome is missing.
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto chrome
set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto chrome
set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto chrome

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto edge
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto edge

echo   No Chrome or Edge found. Open chrome://extensions or edge://extensions
echo   yourself, then follow the 3 steps printed above.
pause
goto end

:edge
start "" "%EDGE%" edge://extensions
goto steps

:chrome
start "" "%CHROME%" --no-first-run --new-window "chrome://extensions"
goto steps

:steps
echo   Do this in the page that just opened:
echo.
echo     0. If Chrome showed a "What's New" tab instead, press Ctrl+T
echo        and type  chrome://extensions  in the address bar.
echo     1. Turn ON  "Developer mode"  (top right)
echo     2. Click  "Load unpacked"  (top left)
echo     3. Press Ctrl+V and hit Enter  (picks this folder)
echo.
echo   Done? The lightning-bolt icon is now in your toolbar.
echo.
pause
:end
