@echo off
REM CodeBridge - one-click boot: production server + Cloudflare Quick Tunnel
REM Run this file. Keep the window open. Tunnel URL shows below.
cd /d "%~dp0"
if not exist cloudflared.exe (
  echo Downloading cloudflared...
  powershell -Command "Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile cloudflared.exe"
)
if not exist .env (
  echo .env missing - copy from .env.example first!
  pause
  exit /b 1
)
if not exist .next (
  echo First boot - building...
  call npm.cmd run build
)
echo Starting production server on http://localhost:3001 ...
start "codebridge-server" cmd /c "npm.cmd run start -- -p 3001 -H 0.0.0.0 >> prod-server.log 2>&1"
:waitport
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if errorlevel 1 goto waitport
echo Server UP. Starting Cloudflare tunnel (public URL below, changes each restart)...
cloudflared.exe tunnel --url http://localhost:3001
pause
