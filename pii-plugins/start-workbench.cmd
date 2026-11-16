@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-workbench.ps1" %*
if errorlevel 1 (
  echo.
  echo Workbench did not start. Read the error above, then press any key to close.
  pause >nul
  exit /b 1
)
