@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Backup - Minha Rotina Escolar
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-notebook.ps1" backup
pause
