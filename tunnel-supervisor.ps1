# CodeBridge tunnel supervisor - keeps cloudflared alive, restarts on exit
param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$LogFile
)
$exe = Join-Path $PSScriptRoot "cloudflared.exe"
while ($true) {
  $env:TUNNEL_TOKEN = $Token
  & $exe tunnel --no-autoupdate run *>> $LogFile
  Write-Output "$(Get-Date -Format o) cloudflared exited (code $LASTEXITCODE), restarting in 3s" >> $LogFile
  Start-Sleep -Seconds 3
}
