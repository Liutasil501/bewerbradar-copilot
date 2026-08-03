# BewerbRadar Local UI QA Harness

This harness lets an agent inspect authenticated product screens without using
production OAuth, production user data, Stripe subscriptions or live secrets.

It is intended for dashboard, editor, paywall, entitlement and responsive UI
testing.

## Safety Boundary

The QA endpoints work only when all of these conditions are true:

- `NODE_ENV=development`
- `QA_HARNESS_ENABLED=true`
- `AUTH_ENABLED` is not `true`
- `DB_TYPE=sqlite`

Production builds keep the routes closed and return `404`, even if another
variable is configured incorrectly.

The harness uses an isolated SQLite database under `.qa/`. It never changes the
normal local database or production data.

## Start

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-qa.ps1 -State free-fresh -Reset
```

Optional parameters:

- `-State free-fresh|free-used|pro|premium|byok`
- `-Port 3100`
- `-Reset` recreates only `.qa/bewerbradar-qa.db`

The script prints the state-entry URL. Open it in the browser used for QA.

## States

| State | Plan | AI imports | Browser key | Primary use |
| --- | --- | ---: | --- | --- |
| `free-fresh` | Free | 0 | no | first funded AI import and Free gates |
| `free-used` | Free | 1 | no | trial-used and resume-limit paywalls |
| `pro` | Pro | 1 | no | paid resume features and Premium AI upsell |
| `premium` | Premium | 1 | no | unrestricted Premium AI surfaces |
| `byok` | Free | 1 | dummy local key | BYOK UI paths on an existing resume |

Direct state URLs follow this pattern:

```text
http://localhost:3100/api/qa/enter/de/free-fresh
http://localhost:3100/api/qa/enter/en/premium
```

The BYOK state stores only the dummy value
`qa-ui-only-key-do-not-send`. It is sufficient to verify client-side access
and dialogs. Do not submit an actual provider request from this state.

## What This Proves

The harness exercises the real dashboard, editor, API routes, repositories,
plan state and paywall components after user resolution. It is therefore useful
for end-to-end product behavior behind login.

It does not prove:

- Google OAuth initiation or callback behavior,
- a real production user session,
- live Stripe checkout or webhook behavior,
- real provider-key validity,
- production analytics receipt.

Those require their dedicated authorized test paths.

## Reset and Cleanup

Stop the development server normally. Use `-Reset` on the next start when a
clean deterministic database is required. The `.qa/` artifacts are ignored by
Git except for the directory's `.gitignore` file.
