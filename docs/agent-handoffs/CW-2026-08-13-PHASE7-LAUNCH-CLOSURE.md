# Agent Handoff - CW-2026-08-13-PHASE7-LAUNCH-CLOSURE

Last updated: 13 August 2026

## Coordination

- Task ID: `CW-2026-08-13-PHASE7-LAUNCH-CLOSURE`
- Status: `READY FOR REVIEW`
- Current owner: Gemini
- Next recipient: Gemini for independent review
- Implementation owner: Codex
- Reviewer: Gemini
- Branch: `codex/phase7-launch-closure`
- Base branch and commit: `main` at
  `ba142a4f59a56f49af9cc836fe12b9a2b528c804`
- Implementation commit under review:
  `967091a4dc52bd067773cc7be6abc8d0e89e708c`
- `CURRENT_WORK.md` synchronized: yes

## Goal

Close the minimum commercial launch foundation: trustworthy measurement,
conversion-friendly and legally explicit Stripe Checkout, consistent AI
entitlements and cost protection, and recoverable production data with a
minimal availability signal.

## Scope

In scope:

- GA4/GTM container, consent and bounded funnel-event verification.
- Stripe Checkout terms acceptance, withdrawal information and tax-safe
  configuration.
- Central server-side AI access policy for Free, Pro, Premium and BYOK.
- A low-friction server-funded AI abuse guard that does not contradict the
  customer-facing unlimited-plan promise.
- SQLite backup automation, restore verification and minimal production health
  alerting.
- Matching product, architecture, deployment and environment documentation.

Out of scope:

- Legal or tax advice and creation of government/Stripe tax registrations.
- Pricing changes.
- Real card charges.
- Production deployment without current explicit authorization.

## Decisions and Assumptions

- Pro includes resume, template, export, sharing and funded import value.
- Premium includes Pro plus server-funded advanced AI features.
- A valid BYOK key unlocks supported AI features for Free and Pro without
  shifting provider cost to BewerbRadar.
- The one funded Free import remains available only while its persisted counter
  is unused.
- Automatic tax must fail closed until the operator has a real collecting
  registration and confirmed tax-code configuration.
- Measurement changes are not conversion wins until deployed, observed and
  validated.

## Implementation

Summary:

- GTM version 3 publishes the GA4 Google tag for `G-6XRD25H13C`.
- GA4 property and stream now use the BewerbRadar name, the production URL,
  Austria time and EUR. Consented page-view receipt was observed in Realtime.
- Typed product events now use explicit `gtag` event commands while preserving
  consent and the closed property allowlists.
- Checkout localizes Stripe, shows direct AGB and withdrawal links, can require
  the Stripe Terms checkbox after external setup, and keeps automatic tax
  fail-closed behind two readiness flags.
- Server-funded AI access is centralized: Free gets one funded import, Pro
  gets funded imports, Premium gets funded imports plus advanced AI, and BYOK
  remains available without BewerbRadar provider cost.
- App-funded calls have a 20-per-minute per-user burst guard by default. API
  routes return a real `429` and `Retry-After` when it fires.
- Interview creation and AI chat now honor the same Premium-or-BYOK rule.
- LinkedIn photo generation requires authentication, uses the shared app-funded
  burst guard for Premium and no longer returns raw provider errors.
- Deployment creates a verified SQLite online backup before rebuilding and
  installs a daily 14-day-retention systemd timer.
- The public health route checks database readiness and SQLite free space. A
  scheduled GitHub workflow maintains one incident issue until recovery.

Important files:

- `src/app/api/stripe/checkout/route.ts`
- `src/lib/stripe/config.ts`
- `src/lib/ai/provider.ts`
- `src/lib/ai/access.ts`
- `src/lib/ai/server-funded-rate-limit.ts`
- AI API routes and `src/components/ai/ai-chat-bubble.tsx`
- analytics and consent modules
- `scripts/backup-production-sqlite.sh`
- `ops/systemd/`
- `.github/workflows/production-health.yml`

## Verification

Completed:

- Base branch, remote head and clean worktree verified.
- Existing Stripe, analytics and AI provider paths inspected.
- Live Stripe account, four prices, products, webhook and zero tax
  registrations verified read-only.
- GTM version 3 published and GA4 page-view receipt observed.
- TypeScript: passed.
- Focused ESLint across all changed TypeScript files: passed with zero errors
  and zero warnings.
- Node tests: 38/38 passed across analytics, AI access, burst guard and billing.
- Next.js production build: passed, 26/26 static pages generated.
- Shell syntax, PowerShell syntax and `git diff --check`: passed.
- Backup script executed against the production container with an isolated
  temporary destination; SQLite `integrity_check` passed.
- Live legal URLs `/de/agb`, `/de/datenschutz` and `/de/widerruf`: HTTP 200.

Pending:

- Independent Gemini review.
- Post-deployment explicit product-event receipt in GA4 Realtime or DebugView.
- Post-deployment systemd timer and GitHub scheduled-monitor verification.
- A production-safe Checkout redirect smoke test after Stripe Terms setup.

## Database and Environment

- Migrations: none.
- New optional variable names:
  - `STRIPE_TERMS_OF_SERVICE_CONFIGURED`
  - `STRIPE_AUTOMATIC_TAX_ENABLED`
  - `STRIPE_TAX_CONFIGURATION_CONFIRMED`
  - `AI_SERVER_RATE_LIMIT_MAX_REQUESTS`
  - `AI_SERVER_RATE_LIMIT_WINDOW_MS`
  - `HEALTH_MIN_FREE_DISK_MB`
- Production preparation: tax registration remains an external prerequisite for
  enabling automatic tax.

## Risks and Limitations

- Checkout legal controls improve disclosure but do not replace professional
  legal review.
- Stripe Tax without an active collecting registration would silently collect
  nothing, so it must stay disabled until verified.
- External GA4 and VPS evidence cannot be inferred from repository code.
- Stripe's own-account API does not permit public-profile mutation. The user
  must sign into Stripe Dashboard once, set the public AGB and privacy URLs,
  then set `STRIPE_TERMS_OF_SERVICE_CONFIGURED=true` on the VPS.
- Stripe Live currently has zero tax registrations and active products have no
  tax code. Both automatic-tax flags must remain false until that is genuinely
  resolved.
- The VPS root filesystem was at 78 percent usage with about 22 GB free during
  the audit. The new health threshold defaults to 10 GB free.

## Review

- Result: `PENDING`

| ID | Raised by | Severity | Likelihood | Effort | Status | Finding and evidence | Response by | Response or fixing commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-08-13 | Codex | Gemini | REVIEW HANDOFF | Review P7.1-P7.4 independently. Pay special attention to Checkout creation, Premium/BYOK server enforcement, backup target `/app/data/bewerbradar.db`, systemd installation and GA4 consent transport. | `967091a` |

## Next Action

- Owner: Gemini
- Action: independently review the pushed candidate against the base commit.
- XS/S findings may be fixed directly on the candidate branch and reverified.
  M/L findings must be documented with evidence and returned to Codex.
- No merge to `main` and no production deployment before review approval and
  current deployment authorization.
