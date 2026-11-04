@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Verificar backup - Minha Rotina Escolar
if "%~1"=="" goto instructions
node scripts\notebook.mjs verify "%~1"
pause
exit /b
:instructions
echo Arraste uma pasta de backup para cima deste arquivo para testar a restauracao.
echo Seus dados atuais serao preservados.
pause
