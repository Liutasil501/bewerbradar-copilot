# scripts/deploy-vps.ps1
Write-Host "Starting deployment to Hostinger VPS (BewerbRadar Copilot)..." -ForegroundColor Cyan

$SSH_KEY = "C:\Games\Dev\VPS2 NEWST 2028\id_ed25519"
$VPS_IP = "147.93.121.183"

$Commands = @'
echo "===> 1. Pulling latest code changes..."
cd /var/www/jadeai
git pull

echo "===> 2. Building and restarting Docker container..."
cd /var/www/bewerbradar
docker compose build jadeai
docker compose up -d jadeai

echo "===> 3. Verifying running container..."
docker ps | grep jadeai

echo "===> Deployment completed successfully!"
'@

$Commands = $Commands -replace "`r", ""
$Commands | ssh -o StrictHostKeyChecking=no -i $SSH_KEY root@$VPS_IP "bash"
