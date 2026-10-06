@echo off
title Ruksewana Furniture - Live Auto-Watcher
echo ===================================================
echo   Ruksewana Furniture - Live Folder Watcher
echo ===================================================
echo.
echo Watching: images\
echo.
echo [INFO] Whenever you copy, drag-and-drop, rename,
echo        or delete an image in any category folder,
echo        the website will be updated AUTOMATICALLY!
echo.
echo [TIP]  Keep this window open or minimized while working.
echo        Press Ctrl+C to stop.
echo ===================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\watch_images.ps1"
pause
