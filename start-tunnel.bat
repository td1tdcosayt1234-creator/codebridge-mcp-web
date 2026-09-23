@echo off
REM CodeBridge - Cloudflare Quick Tunnel (public URL for GitHub cloud runners)
REM Exposes local http://localhost:3001 as https://<random>.trycloudflare.com
REM NOTE: URL changes on every restart -> update WEB_URL secret in builder repo.
cd /d "%~dp0"
if not exist cloudflared.exe (
  echo cloudflared.exe missing - download:
  echo https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  pause
  exit /b 1
)
echo Starting Cloudflare tunnel for http://localhost:3001 ...
cloudflared.exe tunnel --url http://localhost:3001 >> tunnel.log 2>&1
pause
