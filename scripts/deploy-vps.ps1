param(
  [string]$SshKeyPath = $env:BEWERBRADAR_SSH_KEY,
  [string]$VpsHost = $(if ($env:BEWERBRADAR_VPS_HOST) { $env:BEWERBRADAR_VPS_HOST } else { '147.93.121.183' }),
  [string]$ReleaseSha = '',
  [string]$PublicUrl = 'https://copilot.bewerbradar.de/de'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent
$WorkspaceRoot = Split-Path $RepoRoot -Parent
$TempKeyDirectory = Join-Path $WorkspaceRoot '.tmp-bewerbradar-deploy-key'
$TempKeyPath = Join-Path $TempKeyDirectory 'id_ed25519'
$SshStateDirectory = Join-Path $WorkspaceRoot '.bewerbradar-ssh'
$KnownHostsPath = Join-Path $SshStateDirectory 'known_hosts'

function Resolve-DeployKey {
  param([string]$ConfiguredPath)

  $candidates = @(
    $ConfiguredPath,
    $(if ($env:USERPROFILE) { Join-Path $env:USERPROFILE 'OneDrive\API\VPS2 NEWST 2028\id_ed25519' }),
    'C:\Games\Dev\VPS2 NEWST 2028\id_ed25519'
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return [System.IO.Path]::GetFullPath($candidate)
    }
  }

  throw 'No SSH deploy key was found. Set BEWERBRADAR_SSH_KEY to the private key path.'
}

function Invoke-CheckedGit {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  $output = & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
  return $output
}

if ((Invoke-CheckedGit branch --show-current).Trim() -ne 'main') {
  throw 'Production deployment must run from the local main branch.'
}

if ((Invoke-CheckedGit status --short)) {
  throw 'Production deployment requires a clean local worktree.'
}

if (-not $ReleaseSha) {
  $ReleaseSha = (Invoke-CheckedGit rev-parse HEAD).Trim()
}

if ($ReleaseSha -notmatch '^[0-9a-f]{40}$') {
  throw 'ReleaseSha must be a full 40-character Git SHA.'
}

$remoteMainLine = (Invoke-CheckedGit ls-remote copilot refs/heads/main | Select-Object -First 1)
$remoteMainSha = ($remoteMainLine -split '\s+')[0]
if ($remoteMainSha -ne $ReleaseSha) {
  throw "Local release SHA does not match copilot/main. Local: $ReleaseSha Remote: $remoteMainSha"
}

$sourceKey = Resolve-DeployKey $SshKeyPath

if (-not (Test-Path -LiteralPath $TempKeyDirectory)) {
  New-Item -ItemType Directory -Path $TempKeyDirectory | Out-Null
}
if (-not (Test-Path -LiteralPath $SshStateDirectory)) {
  New-Item -ItemType Directory -Path $SshStateDirectory | Out-Null
}

Copy-Item -LiteralPath $sourceKey -Destination $TempKeyPath -Force
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls $TempKeyPath /inheritance:r | Out-Null
icacls $TempKeyPath /grant:r "${identity}:(R)" | Out-Null

$sshArguments = @(
  '-o', 'BatchMode=yes',
  '-o', 'StrictHostKeyChecking=accept-new',
  '-o', "UserKnownHostsFile=$KnownHostsPath",
  '-i', $TempKeyPath,
  "root@$VpsHost",
  'bash'
)

$remoteCommands = @'
set -e

echo "===> 1. Verifying VPS repository"
cd /var/www/jadeai
if [ "$(git branch --show-current)" != "main" ]; then
  echo "VPS repository is not on main."
  exit 19
fi

unexpected_changes="$(git status --porcelain | grep -v '^?? .pnpm-store/$' || true)"
if [ -n "$unexpected_changes" ]; then
  echo "Unexpected VPS worktree changes detected:"
  echo "$unexpected_changes"
  exit 20
fi

git fetch origin main
git pull --ff-only origin main

actual_sha="$(git rev-parse HEAD)"
if [ "$actual_sha" != "__RELEASE_SHA__" ]; then
  echo "VPS SHA mismatch. Expected __RELEASE_SHA__, found $actual_sha"
  exit 21
fi

echo "===> 2. Creating a verified pre-deployment database backup"
install -m 0755 /var/www/jadeai/scripts/backup-production-sqlite.sh /usr/local/sbin/bewerbradar-db-backup
/usr/local/sbin/bewerbradar-db-backup

echo "===> 3. Building and restarting jadeai"
cd /var/www/bewerbradar
docker compose build jadeai
docker compose up -d jadeai

echo "===> 4. Waiting for application health"
healthy=0
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3001/api/health >/dev/null; then
    healthy=1
    break
  fi
  sleep 2
done

if [ "$healthy" != "1" ]; then
  docker compose ps jadeai
  docker logs --since 10m --tail 200 reactive_resume-jadeai-1 2>&1
  exit 22
fi

echo "===> 5. Installing the daily backup timer"
install -m 0644 /var/www/jadeai/ops/systemd/bewerbradar-db-backup.service /etc/systemd/system/bewerbradar-db-backup.service
install -m 0644 /var/www/jadeai/ops/systemd/bewerbradar-db-backup.timer /etc/systemd/system/bewerbradar-db-backup.timer
systemctl daemon-reload
systemctl enable --now bewerbradar-db-backup.timer

echo "===> 6. Verifying public endpoint"
curl -fsS -o /dev/null "__PUBLIC_URL__"

echo "===> 7. Final state"
cd /var/www/jadeai
echo "BRANCH=$(git branch --show-current)"
echo "SHA=$(git rev-parse HEAD)"
cd /var/www/bewerbradar
docker compose ps jadeai
systemctl --no-pager status bewerbradar-db-backup.timer | head -12
docker logs --since 10m --tail 80 reactive_resume-jadeai-1 2>&1
echo "DEPLOYMENT_STATUS=VERIFIED_LIVE"
'@

$remoteCommands = $remoteCommands.Replace('__RELEASE_SHA__', $ReleaseSha)
$remoteCommands = $remoteCommands.Replace('__PUBLIC_URL__', $PublicUrl)
$remoteCommands = $remoteCommands -replace "`r", ''

Write-Host "Deploying BewerbRadar release $ReleaseSha..." -ForegroundColor Cyan

try {
  $remoteCommands | & ssh @sshArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Deployment failed with exit code $LASTEXITCODE"
  }
} finally {
  if (Test-Path -LiteralPath $TempKeyPath) {
    icacls $TempKeyPath /grant:r "${identity}:(F)" | Out-Null
  }
  if (Test-Path -LiteralPath $TempKeyDirectory) {
    Remove-Item -LiteralPath $TempKeyDirectory -Recurse -Force
  }
}
