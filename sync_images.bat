@echo off
title Ruksewana Furniture - Image Synchronizer
echo ===================================================
echo   Ruksewana Furniture - Image Synchronizer
echo ===================================================
echo.
echo Scanning all images/ folders and updating website pages...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync_images.ps1"
echo.
echo ===================================================
echo Synchronization complete!
echo You can now refresh your browser (F5) to see changes.
echo ===================================================
pause
