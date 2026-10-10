# CodeBridge 24/7 supervisor - keeps BOTH alive forever, restarts on crash:
#   1) Next.js prod server (:3001)
#   2) cloudflared tunnel (roun-codebridge)
# Run via Task Scheduler (AtStartup + AtLogOn) AND/OR manually.
# Logs: prod-server.log, tunnel-roun.log (same folder).

$here = $PSScriptRoot
. "$here\.tunnel-tokens.ps1"

Write-Output "$(Get-Date -Format o) [supervisor] starting (dir=$here)"

# --- Next.js prod server job ---
$serverJob = Start-Job -Name "codebridge-server" -ScriptBlock {
  param($here)
  Set-Location $here
  $log = Join-Path $here "prod-server.log"
  while ($true) {
    Add-Content $log "$(Get-Date -Format o) [server] starting next start :3001"
    & npx.cmd next start -p 3001 -H 0.0.0.0 *>> $log
    Add-Content $log "$(Get-Date -Format o) [server] exited (code $LASTEXITCODE), restarting in 3s"
    Start-Sleep -Seconds 3
  }
} -ArgumentList $here

# --- cloudflared tunnel job ---
$tunnelJob = Start-Job -Name "codebridge-tunnel" -ScriptBlock {
  param($here, $token)
  Set-Location $here
  $env:TUNNEL_TOKEN = $token
  $log = Join-Path $here "tunnel-roun.log"
  $exe = Join-Path $here "cloudflared.exe"
  while ($true) {
    Add-Content $log "$(Get-Date -Format o) [tunnel] starting cloudflared run"
    & $exe tunnel --no-autoupdate run *>> $log
    Add-Content $log "$(Get-Date -Format o) [tunnel] exited (code $LASTEXITCODE), restarting in 3s"
    Start-Sleep -Seconds 3
  }
} -ArgumentList $here, $env:TUNNEL_TOKEN_ROUN

Write-Output "$(Get-Date -Format o) [supervisor] jobs: server=$($serverJob.Id) tunnel=$($tunnelJob.Id)"
# Stay alive forever so Task Scheduler sees a running task; jobs die with us.
while ($true) {
  Start-Sleep -Seconds 30
  foreach ($j in @($serverJob, $tunnelJob)) {
    if ($j.State -ne "Running") {
      Add-Content (Join-Path $here "supervisor.log") "$(Get-Date -Format o) [supervisor] job $($j.Name) state=$($j.State) - resuming"
      Resume-Job $j -ErrorAction SilentlyContinue
    }
  }
}
