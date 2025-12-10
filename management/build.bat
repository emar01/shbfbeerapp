@echo off
REM Wrapper för att köra build.ps1 utan execution policy problem
powershell -ExecutionPolicy Bypass -File "%~dp0build.ps1" %*
