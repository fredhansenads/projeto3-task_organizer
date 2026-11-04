@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Backup - Minha Rotina Escolar
node scripts\notebook.mjs backup
pause
