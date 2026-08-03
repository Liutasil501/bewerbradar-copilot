param(
  [ValidateSet('free-fresh', 'free-used', 'pro', 'premium', 'byok')]
  [string]$State = 'free-fresh',
  [ValidateRange(1024, 65535)]
  [int]$Port = 3100,
  [switch]$Reset
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent
$QaDirectory = Join-Path $RepoRoot '.qa'
$DatabasePath = Join-Path $QaDirectory 'bewerbradar-qa.db'
$NextExecutable = Join-Path $RepoRoot 'node_modules\.bin\next.cmd'

if (-not (Test-Path -LiteralPath $NextExecutable)) {
  throw 'Next.js is not installed. Run the project dependency installation first.'
}

if (-not (Test-Path -LiteralPath $QaDirectory)) {
  New-Item -ItemType Directory -Path $QaDirectory | Out-Null
}

if ($Reset) {
  $allowedPrefix = [System.IO.Path]::GetFullPath($QaDirectory) + [System.IO.Path]::DirectorySeparatorChar
  foreach ($suffix in @('', '-wal', '-shm')) {
    $target = [System.IO.Path]::GetFullPath("$DatabasePath$suffix")
    if (-not $target.StartsWith($allowedPrefix)) {
      throw "Unsafe QA reset path: $target"
    }
    if (Test-Path -LiteralPath $target) {
      Remove-Item -LiteralPath $target -Force
    }
  }
}

$env:AUTH_ENABLED = 'false'
$env:QA_HARNESS_ENABLED = 'true'
$env:DB_TYPE = 'sqlite'
$env:SQLITE_PATH = $DatabasePath
$env:NEXT_PUBLIC_APP_URL = "http://localhost:$Port"

$QaUrl = "http://localhost:$Port/api/qa/enter/de/$State"

Write-Host 'Starting isolated BewerbRadar QA environment...' -ForegroundColor Cyan
Write-Host "Database: $DatabasePath"
Write-Host "State URL: $QaUrl" -ForegroundColor Green
Write-Host 'Production OAuth, production data and Stripe subscriptions are not used.'

Push-Location $RepoRoot
try {
  & $NextExecutable dev --turbopack -p $Port
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
