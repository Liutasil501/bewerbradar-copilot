# scripts/set-plan.ps1
param(
  [Parameter(Mandatory=$true)][string]$Email,
  [Parameter(Mandatory=$false)][string]$Plan = "premium"
)

$SSH_KEY = "C:\Games\Dev\VPS2 NEWST 2028\id_ed25519"
$VPS_IP = "147.93.121.183"

Write-Host "Updating plan for '$Email' to '$Plan' on VPS..." -ForegroundColor Cyan

$Commands = @"
echo "===> Updating PostgreSQL..."
docker exec -i reactive_resume-postgres-1 psql -U postgres -d postgres -c "UPDATE public.user SET has_active_subscription = true WHERE email ILIKE '%$Email%';"

echo "===> Updating Copilot SQLite..."
docker exec -i reactive_resume-jadeai-1 node -e '
  const Database = require("better-sqlite3");
  const db = new Database("/app/data/bewerbradar.db");
  const res = db.prepare(`UPDATE users SET subscription_plan = \x27$Plan\x27, subscription_status = \x27active\x27 WHERE email LIKE \x27%$Email%\x27`).run();
  console.log("Updated rows:", res.changes);
  console.log("Current user status:", db.prepare(`SELECT email, subscription_plan, subscription_status FROM users WHERE email LIKE \x27%$Email%\x27`).all());
'
"@

$Commands | ssh -o StrictHostKeyChecking=no -i $SSH_KEY root@$VPS_IP "bash"
