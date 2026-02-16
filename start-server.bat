@echo off
title QR Kode Generator Server
color 0A
echo.
echo ============================================================
echo   QR Kode Generator Server
echo ============================================================
echo.
echo Starter serveren...
echo.

cd /d "%~dp0"

REM Tjek om node_modules eksisterer
if not exist "node_modules\" (
    echo Installerer dependencies...
    call npm install
    echo.
)

echo Starter serveren...
echo.
echo Tryk Ctrl+C for at stoppe serveren
echo.
echo ============================================================
echo.

call npm start

pause
