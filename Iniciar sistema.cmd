@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Minha Rotina Escolar
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-notebook.ps1" start
if errorlevel 1 pause
