@echo off
REM Stops the CloudShift AI frontend (port 3000) and backend (port 8000) started by CloudShift.bat
title CloudShift AI - Stop
echo  Stopping CloudShift AI...
powershell -NoProfile -Command "$stopped=0; foreach($port in 3000,8000){ Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop; $stopped++ } catch {} } }; if($stopped){ Write-Host '  CloudShift AI has been stopped.' } else { Write-Host '  CloudShift AI was not running.' }"
timeout /t 3 >nul
