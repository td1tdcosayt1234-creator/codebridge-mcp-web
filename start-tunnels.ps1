# CodeBridge tunnels launcher - reads tokens from .tunnel-tokens.ps1 (gitignored)
# and starts both cloudflared supervisors minimized.
. "$PSScriptRoot\.tunnel-tokens.ps1"

$here = $PSScriptRoot
$jobs = @(
  @{ Name = "roun-codebridge"; Token = $env:TUNNEL_TOKEN_ROUN;     Log = "tunnel-roun.log" },
  @{ Name = "elsemail-shared"; Token = $env:TUNNEL_TOKEN_ELSEMAIL; Log = "tunnel-elsemail.log" }
)

foreach ($j in $jobs) {
  if (-not $j.Token) { Write-Host "SKIP $($j.Name): token missing in .tunnel-tokens.ps1"; continue }
  Start-Process powershell -ArgumentList @(
    "-ExecutionPolicy", "Bypass",
    "-File", "$here\tunnel-supervisor.ps1",
    "-Token", $j.Token,
    "-LogFile", "$here\$($j.Log)"
  ) -WindowStyle Minimized
  Write-Host "started supervisor: $($j.Name) -> $($j.Log)"
}
