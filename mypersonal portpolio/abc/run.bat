@echo off
title Abrar Ahmad - Professional Personal Portfolio
echo =========================================================================
echo  Abrar Ahmad - Professional Personal Portfolio & CMS Platform
echo =========================================================================
echo.
echo Starting application server...
python run.py
if errorlevel 1 (
    echo.
    echo Python execution failed. Please verify Python is installed.
    pause
)
