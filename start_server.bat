@echo off
title Ruksewana Furniture - Local Web Server
echo ===================================================
echo   Ruksewana Furniture - Local Web Server
echo ===================================================
echo.
echo Starting local web server on http://localhost:8080/ ...
echo Opening your web browser automatically...
echo.
echo [TIP] Keep this window open while testing the website.
echo       Press Ctrl+C to stop the server.
echo ===================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"
pause
