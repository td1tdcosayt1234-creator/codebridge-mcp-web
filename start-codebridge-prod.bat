@echo off
REM CodeBridge web - PRODUCTION server (stable: no dev-mode CSS issues)
REM Rebuild first after code changes: npm.cmd run build
REM Reachable on localhost AND tailnet/LAN. Port 3000 is used by Blockbench, so 3001.
cd /d "C:\Users\RDP\Documents\Default Project\codebridge-mcp-web"
echo Starting CodeBridge (production) on http://localhost:3001 ...
npm.cmd run start -- -p 3001 -H 0.0.0.0 >> "%~dp0prod-server.log" 2>&1
pause
