# Deployment Guide: BewerbRadar Copilot (JadeAI)

To prevent confusion, duplicate deployments, or server downtime, this document defines the exact VPS architecture and the automated deployment process.

---

## 1. Directory Structure & Architecture

On the Hostinger VPS, we run a multi-container Docker Setup. The directories are structured as follows:

1. **`/var/www/bewerbradar`** (Main Project / Turbo-Repo)
   - Contains the Postgres database, Redis, SeaweedFS, and the main BewerbRadar app.
   - Contains the central `compose.yml` file which orchestrates *all* services, including the Copilot (`jadeai`).
2. **`/var/www/jadeai`** (This Repository / Copilot)
   - Contains the source code of the BewerbRadar Copilot (JadeAI).
   - This directory is used by Docker Compose as the relative build context (`../jadeai`) when compiling the Copilot container.

---

## 2. Automated Deployment (One-Click)

Instead of manually connecting via SSH, pulling code, and rebuilding containers, a local deployment script has been created. 

To deploy any changes live:

```bash
pnpm deploy
```
*(Or `npm run deploy` / `yarn deploy` depending on your package manager).*

### What this command does:
1. Pushes code to GitHub (if not already done).
2. Establishes an SSH connection to the Hostinger VPS (`147.93.121.183`) using the SSH key at `C:\Games\Dev\VPS2 NEWST 2028\id_ed25519`.
3. Navigates to `/var/www/jadeai` and runs `git pull` to fetch the latest code.
4. Navigates to `/var/www/bewerbradar` and triggers:
   ```bash
   docker compose build jadeai
   docker compose up -d jadeai
   ```
5. Restarts the container with the newly compiled code in under 2 minutes.

---

## 3. Manual Deployment Steps (In Case of Script Failure)

If the automated script fails, execute these steps manually in your terminal:

```bash
# 1. Connect to VPS
ssh -i "C:\Games\Dev\VPS2 NEWST 2028\id_ed25519" root@147.93.121.183

# 2. Update code in jadeai directory
cd /var/www/jadeai
git pull

# 3. Rebuild and restart the container in the main compose directory
cd /var/www/bewerbradar
docker compose build jadeai
docker compose up -d jadeai

# 4. Check logs to ensure successful startup
docker logs -f reactive_resume-jadeai-1
```
