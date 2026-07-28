# BewerbRadar Copilot – Production Deployment Runbook

Last verified: 28 July 2026

This runbook describes the verified production topology, release process,
verification and rollback rules for BewerbRadar Copilot.

Read `AGENTS.md` before performing a release. Production changes require
explicit authorization.

## 1. Verified Production Topology

Application:

- public URL: `https://copilot.bewerbradar.de`
- Nginx upstream: `127.0.0.1:3001`
- Compose service: `jadeai`
- container: `reactive_resume-jadeai-1`
- container application port: `3000`
- restart policy: `unless-stopped`

VPS layout:

- application repository: `/var/www/jadeai`
- central Compose project: `/var/www/bewerbradar`
- central Compose file: `/var/www/bewerbradar/compose.yml`
- Docker build context: `/var/www/jadeai`

Persistent application data:

- Docker volume: `reactive_resume_jadeai_data`
- container mount: `/app/data`
- active database: `/app/data/bewerbradar.db`

Git:

- product remote locally: `copilot`
- product repository: `Liutasil501/bewerbradar-copilot`
- production source branch: `main`
- VPS remote name: `origin`
- VPS repository branch: `main`

## 2. Release Truth

A push to GitHub `main` does not automatically deploy the application.

The repository command:

```powershell
pnpm deploy
```

runs `scripts/deploy-vps.ps1`. The script:

1. connects to the VPS over SSH,
2. runs `git pull` in `/var/www/jadeai`,
3. builds the `jadeai` image through the central Compose project,
4. recreates/starts the `jadeai` service,
5. prints matching Docker processes.

The script does not:

- push local commits to GitHub,
- select or merge a release branch,
- run type-check, lint or tests,
- create a database backup,
- verify the exact deployed commit,
- verify migrations,
- perform a feature smoke test,
- roll back on failure.

The current script also does not use a fail-fast remote shell. An earlier
command can fail while a later success message is still printed. Treat its
output as deployment activity, not release verification.

## 3. Branch and Authorization Rules

- `main` is the production source branch.
- Do not develop directly on `main`.
- Do not push or deploy `main` without explicit production authorization.
- `beta` is intended as the integration branch, but it is currently diverged
  from `main` and must not be merged blindly.
- Until `beta` is reconciled, use a feature branch based on current `main` for
  isolated work and review.
- Concurrent agents use separate worktrees or clones.

A technical `GO` from Codex is a release recommendation. It is not permission
to change production.

## 4. Preflight

### 4.1 Inspect the candidate

From the release worktree:

```powershell
git status --short --branch
git log -5 --oneline --decorate
git remote -v
git diff --check
```

Confirm:

- the worktree contains no unrelated changes,
- the branch is based on the intended production history,
- the complete release diff is understood,
- no secrets or generated local data are included,
- the target remote is `copilot`, not upstream `origin`.

Before merging, inspect the exact candidate range:

```powershell
git log --oneline main..RELEASE_BRANCH
git diff --stat main...RELEASE_BRANCH
git diff main...RELEASE_BRANCH
```

Replace `RELEASE_BRANCH` with the reviewed branch name.

### 4.2 Run proportional verification

Common checks:

```powershell
pnpm type-check
pnpm lint
pnpm build
```

Not every documentation or copy-only change requires the full suite. Stronger
checks are required for authentication, authorization, billing, database
migrations, AI access, import/export, sharing, Docker and analytics.

There is currently no established automated unit or end-to-end test suite.
Report exactly which checks ran; do not call a type-check a full test suite.

### 4.3 Review database impact

For every schema change, confirm:

- `src/lib/db/schema.ts` is updated,
- a new migration exists in `drizzle/migrations/`,
- migration journal metadata is committed,
- the Docker image copies the migration,
- existing production data can be upgraded safely,
- a pre-release database backup is planned,
- PostgreSQL parity impact is documented.

Do not recreate or replace the production database as a migration shortcut.

### 4.4 Review environment impact

Document variable names only. Never print or commit values.

Production-relevant groups:

- authentication and Google OAuth,
- Hostinger SMTP,
- application and NextAuth URLs,
- server Gemini key,
- Stripe secret, webhook secret and optional price/coupon IDs,
- optional database selection/path,
- optional GTM container override.

If a new required variable is absent on the VPS, the release is not ready.

## 5. Merge and Push

After independent review and explicit production authorization:

1. update the release branch from current `main` safely,
2. resolve conflicts on the release branch,
3. rerun affected checks,
4. merge the reviewed candidate into `main` without unrelated commits,
5. push `main` to `copilot`,
6. record the exact release commit SHA.

Do not force-push shared branches. Do not rewrite production history.

A push completes source publication only. The application remains on the
previous VPS commit until the deployment step runs.

## 6. Deploy

### Preferred helper

After the authorized release commit is present on `copilot/main`:

```powershell
pnpm deploy
```

Do not stop at the script's success text. Continue with every applicable
verification step in section 7.

### Manual equivalent

If the helper fails, connect to the VPS and use the verified directories:

```bash
cd /var/www/jadeai
git status --short --branch
git fetch origin main
git pull --ff-only origin main

cd /var/www/bewerbradar
docker compose build jadeai
docker compose up -d jadeai
```

Before pulling, inspect any unexpected VPS changes. The untracked
`/var/www/jadeai/.pnpm-store/` directory is known; do not delete it merely to
make `git status` empty.

Do not use a non-fast-forward pull, hard reset or destructive cleanup as an
automatic repair.

## 7. Verify Production

### 7.1 Exact commit

On the VPS:

```bash
cd /var/www/jadeai
git branch --show-current
git rev-parse HEAD
git status --short --branch
```

The SHA must exactly match the authorized release commit.

### 7.2 Container state

From `/var/www/bewerbradar`:

```bash
docker compose ps jadeai
docker ps --filter name=reactive_resume-jadeai-1
docker logs --since 10m reactive_resume-jadeai-1
```

Check for:

- running container,
- application startup,
- database migration errors,
- missing environment variables,
- authentication/provider failures,
- repeated restarts,
- new runtime exceptions.

The current production service has no useful Docker health status. The
repository Compose file references `/api/health`, but that route does not
currently exist. Do not report healthcheck success unless the route and the
active production Compose definition have been corrected.

### 7.3 Public smoke test

At minimum:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://copilot.bewerbradar.de/de
```

Then test the changed behavior through the public application. Examples:

- landing or analytics: inspect live HTML and browser events,
- authentication: complete the relevant login/callback flow,
- database change: exercise a route that reads the changed table/column,
- import: use an allowed test document without real PII,
- export: download and inspect the target format,
- Stripe: use the appropriate test/live-safe verification path,
- sharing: test authorization plus public token behavior.

Public-page availability alone does not prove that authenticated APIs, database
migrations or billing behavior work.

## 8. Deployment Status Language

Use exactly one status in a handoff:

- `NOT DEPLOYED`
- `DEPLOYING – NOT YET VERIFIED`
- `VERIFIED LIVE`

Use `VERIFIED LIVE` only when:

1. the VPS SHA matches the authorized release,
2. the container is running,
3. focused logs were inspected,
4. the public application responds,
5. the changed behavior was tested.

Committing or pushing documentation is not a production deployment. If the VPS
was not updated, its status is `NOT DEPLOYED`, even when no deployment is
necessary for that documentation change.

## 9. Rollback

### Preferred rollback

For an application-code regression:

1. identify the last known-good production SHA,
2. create a normal revert commit in the product repository,
3. review the revert and database implications,
4. push the revert to `copilot/main`,
5. deploy it through the normal process,
6. verify the exact SHA and affected behavior.

This preserves shared history and leaves the VPS on `main`.

### Emergency runtime rollback

An emergency rollback directly on the VPS requires explicit authorization.
Record the current bad SHA and the target known-good SHA first. A detached
known-good build can restore service temporarily, but it must be followed by a
proper repository revert so production does not remain detached from the
source-of-truth branch.

### Database warning

Application rollback does not automatically undo database migrations.

Before rolling back a schema-affecting release:

- determine whether the old code can read the upgraded schema,
- prefer backward-compatible migrations,
- use the verified pre-release backup only when data restoration is truly
  necessary,
- never overwrite the volume without an explicit recovery plan.

## 10. Release Handoff

Every release handoff includes:

### Goal

What changed and why?

### Branch and Commit

- reviewed branch,
- release commit SHA,
- pushed remote.

### Files

Important changed files.

### Verification

Exact commands and results.

### Database and Environment

- migrations,
- backup,
- variable additions,
- VPS preparation.

### Risks

- known limitations,
- behavior not tested,
- follow-up decisions.

### Deployment Status

One exact status from section 8.
