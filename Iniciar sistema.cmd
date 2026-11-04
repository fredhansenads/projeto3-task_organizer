@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Minha Rotina Escolar
node scripts\notebook.mjs start
if errorlevel 1 pause
