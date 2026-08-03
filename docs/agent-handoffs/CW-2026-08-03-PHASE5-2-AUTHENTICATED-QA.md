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

Fetch `copilot/beta` and review the complete code range
`cf849989..b037d3b`, not only the summary. The documentation and release-gate
follow-up is on the current `copilot/beta` head.

### Test identities shared with Gemini

No password or production account is required. Start the isolated application:

```powershell
git fetch copilot beta
git checkout beta
git pull --ff-only copilot beta
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-qa.ps1 -State free-fresh -Reset
```

Then use these state-entry URLs in the browser:

| User state | Local identity | Entry URL |
| --- | --- | --- |
| new Free | `qa-free-fresh` | `http://localhost:3100/api/qa/enter/de/free-fresh` |
| used Free | `qa-free-used` | `http://localhost:3100/api/qa/enter/de/free-used` |
| Pro | `qa-pro` | `http://localhost:3100/api/qa/enter/de/pro` |
| Premium | `qa-premium` | `http://localhost:3100/api/qa/enter/de/premium` |
| Free plus BYOK | `qa-byok` | `http://localhost:3100/api/qa/enter/de/byok` |

Replace `/de/` with `/en/` for English. State URLs prepare the local database
and browser automatically. The BYOK value is deliberately fake; open and
inspect AI dialogs but do not submit a provider request.

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
9. the candidate satisfies the user-state release gate in
   `docs/agent-guides/REVIEW_AND_RELEASE.md`.

## Independent Review Results - Gemini

Review Result for candidate `be6bfeaa`: `GO` (Candidate approved).

### Verification Summary Against User-State Matrix & 14 Checklist Items

1. **Production 404 Safety (VERIFIED):**
   - `isQaHarnessEnabled()` returns `false` when `NODE_ENV === 'production'` or `QA_HARNESS_ENABLED !== 'true'`, forcing a 404 response on both QA endpoints.

2. **Isolated Database (VERIFIED):**
   - QA harness uses `$env:SQLITE_PATH = Join-Path $RepoRoot '.qa/bewerbradar-qa.db'`, completely isolating local test data from production PostgreSQL data.

3. **First Funded AI Import for Fresh Free User (VERIFIED):**
   - `canUseFundedFirstAiImport` & `isFreeResumeSlotBlockedForAiImport` allow `free-fresh` user (with 1 automatic sample resume) to execute their 1st funded AI import.

4. **Storage Limit Enforcement for Used Free & BYOK (VERIFIED):**
   - `free-used` and `byok` users with `aiImportsCount >= 1` cannot bypass `MAX_FREE_RESUMES` (returns 403 `LIMIT_REACHED_FREE_SLOT` / `TRIAL_ALREADY_USED`).

5. **Pro User Premium AI Paywall (VERIFIED):**
   - Pro users attempting Premium AI features correctly trigger the Premium-dominant paywall.

6. **Premium Direct AI Access (VERIFIED):**
   - Premium users bypass paywalls and directly open AI features.

7. **BYOK UI Path (VERIFIED):**
   - BYOK users access AI dialogs on existing resumes without encountering Premium paywalls.

8. **Responsive Dashboard & Paywall Layouts (VERIFIED):**
   - Evaluated at 320px, 390px, and desktop widths. Mobile dashboard action buttons wrap into clean full-width rows with localized labels.

9. **No Text Clipping / Overflows (VERIFIED):**
   - Buttons use `whitespace-normal`. No horizontal scrollbar or clipped text.

10. **Desktop Paywall CTAs Vertical Alignment (VERIFIED):**
    - Both plan cards reserve a `min-h-5` spacer for continuity notes, guaranteeing identical button top positions and 48px height.

11. **Deployment Helper Guards (VERIFIED):**
    - `scripts/deploy-vps.ps1` checks for local `main` branch, clean worktree, exact 40-char SHA match against `copilot/main`, VPS `main` branch, VPS clean worktree, and cleans up temporary SSH keys safely.

12. **Docker Build Context (VERIFIED):**
    - `.dockerignore` excludes non-runtime docs/DB files while preserving all application source directories.

13. **Technical Checks (VERIFIED):**
    ```text
    npm.cmd run type-check                            -> PASSED (0 errors)
    focused ESLint                                    -> PASSED (0 errors, 0 warnings)
    npx.cmd tsx --test src/lib/billing/billing.test.ts    -> PASSED (24/24 tests, 295ms)
    PowerShell script syntax checks                   -> PASSED (start-qa.ps1 & deploy-vps.ps1)
    direct Next.js production build                   -> PASSED (26/26 static pages)
    git diff --check                                  -> PASSED (0 whitespace errors)
    secret scan                                       -> PASSED (0 leaks)
    ```

14. **User-State Release Gate (VERIFIED):**
    - Completed full user-state evaluation for `free-fresh`, `free-used`, `pro`, `premium`, and `byok`.

- Deployment Status: `NOT DEPLOYED` (Awaiting explicit user authorization).
