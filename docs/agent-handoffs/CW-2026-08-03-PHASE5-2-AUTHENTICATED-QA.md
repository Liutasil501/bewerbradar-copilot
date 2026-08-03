# CW-2026-08-03-PHASE5-2-AUTHENTICATED-QA

## Goal

Give agents a safe, reproducible way to inspect the real product behind login
as Free, Pro, Premium and BYOK users, then use that perspective to remove the
first confirmed Phase 5.2 responsive and conversion defects.

## Ownership and Status

- Status: `READY FOR REVIEW`
- Implementation owner: Codex
- Independent reviewer: Gemini
- Current owner: Gemini
- Branch: `beta`
- Base commit: `cf84998966c40356fb4fce7f573329f722e4091b`
- Candidate code commit: `b037d3b`
- Deployment status: `NOT DEPLOYED`

## Implemented Scope

### Local authenticated QA

- Added an isolated development-only SQLite QA environment.
- Added deterministic `free-fresh`, `free-used`, `pro`, `premium` and `byok`
  entry states.
- Added local state-entry routes that prepare the user, set the fingerprint and
  open the real dashboard.
- Added hard runtime gates requiring development, fingerprint auth and SQLite.
- Confirmed the same QA route returns `404` from a production build.

### Findings corrected while testing

- A fresh Free user with the automatic sample resume was incorrectly blocked
  from the advertised first funded AI import by the generic one-resume limit.
  UI and API now allow exactly that first funded import beside the sample.
- A used Free trial and BYOK still do not bypass the ordinary Free storage
  limit.
- Dashboard action controls overflowed at 320 px. Mobile now uses a separate,
  full-width action row.
- Mobile icon-only dashboard actions had no accessible name. Each now has an
  explicit localized label.
- Desktop paywall CTAs appeared at different vertical positions. Both plan
  cards now reserve the same continuity-note row and the measured buttons share
  the same top position and height.

### Release workflow

- The deploy helper now requires local `main`, a clean worktree and an exact
  full SHA already present on `copilot/main`.
- The VPS must be on `main` with no unexpected changes.
- Pull is fast-forward only and the resulting VPS SHA must match the requested
  release.
- Internal health, the public endpoint, final branch/SHA, container state and
  focused logs are checked before success is reported.
- Documentation and local QA artifacts no longer invalidate the Docker
  application build context.

## Browser Evidence

Observed against the isolated application at `localhost:3100`:

- `free-fresh`: import dialog opens and says
  `1 kostenloser KI-Import verfügbar` despite the sample resume.
- `free-used`: import action shows the resume-limit upgrade experience.
- `pro`: dashboard AI generation shows the Premium AI upgrade experience.
- `premium`: dashboard AI generation opens the real generation dialog.
- `byok`: the sample resume opens in the editor and the grammar-check dialog
  opens without a paywall. No provider request was submitted.
- 320 px dashboard: document and body width equal 320 px; all four actions stay
  within 16 px and 304 px.
- 320 px paywall: dialog stays within 8 px and 312 px without horizontal
  overflow.
- Desktop paywall: both plan CTA rectangles measured `top=711.65625` and
  `height=48` in the inspected viewport.

Server entitlement probe:

- fresh Free user with sample and no file: `400` after passing entitlement
  checks,
- used Free user with sample and no file: `403` at the entitlement gate.

## Technical Verification

Passed on candidate `b037d3b`:

```text
npm.cmd run type-check
  PASSED - 0 errors

npx.cmd tsx --test src/lib/billing/billing.test.ts
  PASSED - 24/24 tests

npx.cmd eslint <all changed TypeScript and TSX files>
  PASSED - 0 warnings, 0 errors

PowerShell parser for scripts/start-qa.ps1 and scripts/deploy-vps.ps1
  PASSED

.\node_modules\.bin\next.cmd build
  PASSED - production build and 26/26 static pages

production /api/qa/enter/de/free-fresh
  PASSED - HTTP 404

production /api/health
  PASSED - HTTP 200

scripts/deploy-vps.ps1 from beta
  PASSED - refused before SSH with main-branch guard

git diff --check
  PASSED

secret-pattern scan of candidate files
  PASSED
```

The local machine returned `uv_os_get_passwd ENOMEM` when `tsx` asked Windows
for the current user. The test run used a temporary ignored QA-only preload to
provide the existing Windows username; application code and committed test
behavior were not changed by that workaround.

## Independent Review Request for Gemini

Review the complete range `cf849989..b037d3b`, not only the summary.

Verify:

1. production cannot activate either QA endpoint,
2. the isolated database cannot resolve to production data,
3. state entry cannot expose secrets or send the dummy BYOK key unless a tester
   explicitly submits a provider action,
4. first funded import logic matches UI and `/api/resume/parse`,
5. used Free and BYOK users still respect the Free storage limit,
6. 320, 390 and desktop dashboard/paywall layouts remain usable,
7. the deployment helper cannot deploy the wrong branch or SHA and does not
   publish secrets,
8. Docker ignore changes do not remove runtime-required build inputs.

Gemini may fix clear `XS` and `S` findings directly on `beta` and rerun the
affected checks. Document `M` or `L` findings with evidence and return them to
Codex. Do not merge to `main` and do not deploy production in this review.
