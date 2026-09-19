@echo off
REM CodeBridge web - local dev server, reachable on localhost AND tailnet/LAN
REM Port 3000 is used by Blockbench, so we use 3001.
cd /d "C:\Users\RDP\Documents\Default Project\codebridge-mcp-web"
echo Starting CodeBridge on http://localhost:3001 and http://100.71.26.59:3001 ...
npm.cmd run dev -- -p 3001 -H 0.0.0.0
pause
