@echo off
title MoonCode
cd /d "%~dp0"
echo.
echo  MoonCode - AI Coding Assistant
echo.
echo  [1] Calistir (mooncode)
echo  [2] Kur/derle (npm run build ^+ install)
echo  [3] Web UI ile calistir
echo.
choice /c 123 /n /m "Seciminiz: " /t 10 /d 1
if errorlevel 3 goto web
if errorlevel 2 goto install
if errorlevel 1 goto run
goto run

:run
cd packages\cli
mooncode
pause
exit /b

:web
cd packages\cli
mooncode --web
pause
exit /b

:install
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"
pause
exit /b
