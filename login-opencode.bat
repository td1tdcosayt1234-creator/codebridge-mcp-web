@echo off
set XDG_DATA_HOME=%~dp0data\opencode-home
opencode auth login
echo.
echo Done. Restart the game server afterwards.
pause
