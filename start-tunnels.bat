@echo off
REM CodeBridge tunnels - starts BOTH cloudflared supervisors.
REM   roun-codebridge (dedicated): roun.sryze.cc + dash. + api. -> localhost:3001
REM   elsemail-shared             : elsemail.indevs.in, dash.elsemail, codebridge.elsemail -> :3000/:3001
REM Tokens are read from .tunnel-tokens.ps1 (gitignored - see DEPLOYMENT.md).
cd /d "%~dp0"
if not exist ".tunnel-tokens.ps1" (
  echo .tunnel-tokens.ps1 missing - create it per DEPLOYMENT.md with:
  echo   TUNNEL_TOKEN_ROUN and TUNNEL_TOKEN_ELSEMAIL
  pause
  exit /b 1
)
powershell -ExecutionPolicy Bypass -File "%~dp0start-tunnels.ps1"
timeout /t 5 >nul
