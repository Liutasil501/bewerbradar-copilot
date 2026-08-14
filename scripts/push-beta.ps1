$ErrorActionPreference = 'Stop'

$sourceKey = 'C:\Games\Dev\.tmp-bewerbradar-github-key\id_ed25519'
$dest = Join-Path $env:TEMP 'github_deploy_ed25519'

Copy-Item -LiteralPath $sourceKey -Destination $dest -Force
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls $dest /inheritance:r | Out-Null
icacls $dest /grant:r "${identity}:(R)" | Out-Null

$sshCmd = "ssh -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=`"C:/Games/Dev/.github_known_hosts`" -i `"$dest`""

Write-Host "Testing SSH connection to GitHub..."
$env:GIT_SSH_COMMAND = $sshCmd
& git push copilot beta

Write-Host "Successfully pushed to copilot/beta!"
