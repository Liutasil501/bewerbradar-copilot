# Agent Handoff – CW-2026-07-28-PHASE1-BASELINE

Last updated: 28 July 2026

## Coordination

- Task ID: `CW-2026-07-28-PHASE1-BASELINE`
- Status: `READY FOR REVIEW`
- Current owner: Codex
- Next recipient: Codex
- Implementation owner: Gemini
- Reviewer: Codex
- Branch: `beta`
- Base branch and commit: `main` at `8691663b`
- Implementation commit(s) under review: none
- `CURRENT_WORK.md` synchronized: yes

## Goal

Create a focused, reviewable Phase 1 release candidate that makes BewerbRadar
Copilot safe and honest enough for later funnel work. Phase 1 removes confirmed
security, privacy, trust and first-import blockers inside this repository. It
does not redesign the full product, pricing or analytics stack.

## Scope

### P1.1 Dependency security

In scope:

- Update only directly relevant production dependencies and lockfile entries
  needed to remove the currently reported critical/high advisories where a
  compatible patch is available.
- At minimum inspect and patch:
  - `next-auth` from `5.0.0-beta.30` to a patched release at or above
    `5.0.0-beta.32`,
  - the related `@auth/core` path through compatible Auth.js/adapter versions,
  - `next` from `16.1.6` to the current compatible patched 16.x release,
  - `drizzle-orm` from `0.45.1` to at least `0.45.2`.
- Inspect remaining critical/high findings after the focused update and record
  which are fixed, transitive, unreachable in this application or deferred.

Constraints:

- Do not perform broad AI SDK, React, database or UI-library major upgrades.
- Do not change authentication providers or plan behavior as a shortcut.
- Preserve Google OAuth and e-mail magic-link login.

Acceptance:

- Magic-link authentication no longer uses the vulnerable Auth.js versions.
- The application type-checks and builds with the focused dependency update.
- The handoff records the before/after audit counts and any justified residual
  findings without claiming that every advisory is exploitable.

### P1.2 Authorization and resource binding

In scope:

- Chat sessions:
  - list sessions only for a resume owned by the current user,
  - create sessions only for a resume owned by the current user,
  - read and delete only sessions whose resume belongs to the current user,
  - when `/api/ai/chat` receives a `sessionId`, bind it to the authenticated
    user and, when supplied, the same `resumeId` before any read or write.
- Interviews:
  - verify an optional `resumeId` belongs to the user before creating an
    interview session,
  - protect interview-report `GET` with session ownership,
  - bind `messageId` to the owned session before marking,
  - bind `roundId` to the owned session before control actions or message
    insertion.

Implementation guidance:

- Prefer repository helpers that return an owned resource or perform a joined
  ownership check instead of duplicating fragile route logic.
- Return `404` for foreign resource IDs where existing routes follow that
  pattern; do not disclose resource existence.
- Do not rely on client paywalls or UUID secrecy.

Acceptance:

- Authenticated user A cannot read, mutate or delete the scoped resources of
  user B even when user A knows the relevant IDs.
- Normal owned-resource behavior remains unchanged.
- Add focused automated coverage if it can be done without introducing a large
  new test framework; otherwise record exact reproducible route-level checks.

### P1.3 Sensitive logging and confirmed React defect

In scope:

- Remove raw AI or resume output from:
  - grammar-check logging,
  - shared JSON-extraction failure logging,
  - resume-parse failure logging.
- Keep useful structured diagnostics such as route name, error class, provider
  and bounded non-sensitive metadata.
- Never log prompts, response bodies, filenames, resume text, e-mail addresses,
  API keys or user identifiers.
- Fix `QrCodeBar` so React hooks are never called conditionally and the
  component still renders nothing when no visible QR data exists.

Acceptance:

- `rg` and changed-file review find no complete or partial resume/AI response
  logging in the changed paths.
- Changed-file ESLint has no `react-hooks/rules-of-hooks` error.
- QR visibility/data changes do not alter hook order.

### P1.4 First Free AI import contract

Desired behavior:

- A newly registered Free user starts with zero resumes.
- The user may perform one server-funded AI import when:
  - the account is Free,
  - the account has zero resumes,
  - `aiImportsCount < 1`.
- A successful funded import increments `aiImportsCount`.
- Deleting the imported resume does not restore the funded import.
- Pro/Premium behavior and BYOK behavior remain unchanged unless an existing
  contradiction must be fixed to preserve this contract.

In scope:

- Stop automatic sample-resume creation for new Google and magic-link users.
- Reuse the existing `ai_imports_count` field; do not add a new schema field.
- Enforce the funded-trial eligibility server-side before calling Gemini.
- Return distinct machine-readable errors for:
  - Free resume-slot limit,
  - funded import already used,
  - missing user API key where BYOK is required.
- Make the import UI display accurate German and English copy for those states.

Existing accounts:

- Do not delete or rewrite existing resumes automatically.
- An existing Free user whose slot is occupied remains subject to the
  one-resume limit.
- Do not build a migration solely to clean the seven current accounts.

Proportional abuse handling:

- A simple atomic or transactional eligibility/increment improvement may be
  added if it is small and clear.
- Do not turn rare concurrent-import timing into a large locking or queueing
  project.

Acceptance:

- A fresh account can immediately complete exactly one funded import.
- A second funded import remains blocked even after deleting the first
  imported resume.
- The UI no longer says the trial was used when the real cause is merely an
  occupied resume slot.
- No database migration is introduced unless Gemini finds and documents a real
  schema requirement.

### P1.5 Truthful public Copilot landing

In scope:

- Keep the primary action focused on importing an existing resume; use clear
  German and English copy.
- Do not implement guest upload in Phase 1. Authentication may still happen
  before upload.
- Make the secondary template CTA truthful without a login surprise, for
  example by scrolling to the already public landing template section.
- Remove or replace unsupported claims, including:
  - “thousands of applicants/interviews,”
  - “no registration required,”
  - “100% free,”
  - template/language/export counts that do not match verified behavior,
  - unverified HR-expert, ATS-guarantee or outcome claims.
- Preserve the current responsive visual design unless a small CTA sizing
  adjustment is needed.

Acceptance:

- Every public CTA target matches its visible promise.
- German and English landing copy stay semantically aligned.
- No fabricated social proof or absolute outcome guarantee remains.

External blockers, not to implement in this repository:

- `https://bewerbradar.de/impressum`,
  `https://bewerbradar.de/datenschutz` and
  `https://bewerbradar.de/agb` currently return the same homepage.
- The public BewerbRadar site advertises `studio.bewerbradar.de` as a resume
  product while that host returns Basic Auth for “Database Studio Admin”.
- Legal wording about AI-provider data processing requires an authorized legal
  and infrastructure task; do not invent legal text.

### P1.6 Health and deploy-script correctness

In scope:

- Add a minimal public `/api/health` route compatible with the repository
  Compose healthcheck.
- It must not expose secrets, configuration or personal data.
- Choose a lightweight response that proves the application process is
  responsive; add a database check only if it is safe and fast.
- Make `scripts/deploy-vps.ps1` and its remote bash fail immediately when pull,
  directory change, build, restart or verification fails.
- Do not print a success message after a failed step.
- Preserve the distinction between source publication and VPS deployment.

Acceptance:

- Local build exposes `/api/health` with a `200` success response.
- A deliberately failing deploy subcommand causes a non-zero script result in
  an isolated/local test; do not run a real deployment for this check.
- No VPS command, port change, backup change or production deployment is part
  of this task.

## Out of Scope

- Main publication or production deployment.
- VPS firewall, Docker port, backup, Nginx, DNS or certificate changes.
- Legal-text authoring or external BewerbRadar repository changes.
- CMP, consent update, GA4 configuration or funnel events.
- Sitemap, SEO content program or paid acquisition.
- Pricing-tier consolidation, price changes or new Stripe products.
- Guest import.
- Application tracker or long-term retention features.
- Repository-wide lint cleanup.
- Unrelated refactors and broad package modernization.

## Decisions and Assumptions

- Phase 1 optimizes for a safe and honest baseline, not feature volume.
- Existing `MAX_FREE_RESUMES = 1` and five Free templates remain unchanged.
- Existing prices and Pro/Premium entitlements remain unchanged.
- The automatic sample resume is removed for future accounts because it
  contradicts the promised first import and consumes the only Free slot.
- Current production data remains untouched.
- Risk is evaluated proportionally. Confirmed cross-user authorization gaps
  and raw PII logging are important even with low traffic; rare concurrent
  Free-import timing is not a reason for an architectural rewrite.
- German and English must remain aligned.

## Implementation

Summary:

- Pending Gemini implementation.

Important starting points:

- `package.json`
- `pnpm-lock.yaml`
- `src/lib/auth/config.ts`
- `src/lib/auth/helpers.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/chat/sessions/route.ts`
- `src/app/api/ai/chat/sessions/[sessionId]/route.ts`
- `src/lib/db/repositories/chat.repository.ts`
- `src/app/api/interview/route.ts`
- `src/app/api/interview/[id]/report/route.ts`
- `src/app/api/interview/[id]/mark/route.ts`
- `src/app/api/interview/[id]/control/route.ts`
- `src/lib/db/repositories/interview.repository.ts`
- `src/app/api/ai/grammar-check/route.ts`
- `src/lib/ai/extract-json.ts`
- `src/app/api/resume/parse/route.ts`
- `src/components/preview/qr-code-bar.tsx`
- `src/components/dashboard/import-json-dialog.tsx`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/cta-section.tsx`
- `messages/de.json`
- `messages/en.json`
- `src/app/layout.tsx`
- `compose.yml`
- `scripts/deploy-vps.ps1`

## Verification

Completed:

- Codex final audit established the confirmed starting findings.
- `beta` and `main` both pointed to `8691663b` before task creation.
- Worktree was clean before task creation.

Pending:

- Inspect the complete implementation diff.
- Focused authorization/import checks.
- Changed-file ESLint.
- `pnpm type-check`.
- `pnpm build`.
- `pnpm audit --prod`.
- Codex independent review of `main...beta`.

## Database and Environment

- Migrations: none expected.
- New or changed variable names: none expected.
- Production preparation: dependency rebuild and ordinary application
  deployment will eventually be required after review; not authorized now.

## Risks and Limitations

- Auth and dependency updates require broader regression verification than a
  copy-only change.
- Removing sample creation changes first-use behavior and must be reflected in
  the dashboard empty state.
- Legal pages, the public Studio route, public VPS ports and automated backups
  remain external follow-up work.
- The repository-wide ESLint baseline is noisy; Phase 1 must not attempt to
  clear unrelated historical findings.

## Review

- Result: `PENDING`

| ID | Raised by | Severity | Likelihood | Effort | Status | Finding and evidence | Response by | Response or fixing commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | Codex | Release blocker | Medium | S | ACCEPTED | Chat-session routes and interview report GET lack complete ownership binding, allowing cross-user access or mutation when IDs are known. | Gemini | Pending |
| F-002 | Codex | Release blocker | Medium | S | Auth.js magic-link versions are affected by the Unicode normalization account-takeover advisory; e-mail magic link is enabled. | Gemini | Pending |
| F-003 | Codex | Important | High | XS | Raw AI/resume output is written to application logs in multiple failure/success paths. | Gemini | Pending |
| F-004 | Codex | Important | High | S | Automatic sample creation consumes the only Free resume slot and contradicts the promised first funded import. | Gemini | Pending |
| F-005 | Codex | Important | High | XS | Public landing CTAs and claims do not match the actual login requirement, user count or plan limitations. | Gemini | Pending |
| F-006 | Codex | Important | Medium | XS | `QrCodeBar` calls React hooks after an early return and can change hook order. | Gemini | Pending |
| F-007 | Codex | Important | Medium | S | Compose references a missing health route and the deploy script can print success after an earlier failure. | Gemini | Pending |
| F-008 | Codex | Important | High | M | Public legal routes and the external Studio destination are broken or misleading but live outside this repository. | Human / future authorized task | DEFERRED outside Phase 1 implementation |

Allowed severity:

- Release blocker
- Important
- Improvement
- Acceptable residual risk

Allowed response status:

- `ACCEPTED`
- `DISPUTED`
- `FIXED`
- `DEFERRED`
- `VERIFIED`
- `WITHDRAWN`

Relative effort:

- `XS`
- `S`
- `M`
- `L`

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-07-28 | Codex | Gemini | TASK ASSIGNMENT | Implement the complete Phase 1 scope on `beta`, challenge findings with evidence where appropriate, then commit/push and transfer to Codex for independent review. Do not deploy. | Pending task-registration commit |

## Next Action

- Owner: Gemini
- Action: Fetch `copilot/beta`, read this handoff and the mandatory project
  guides, set the task to `IMPLEMENTING`, implement the complete scope, record
  exact verification and residual risks, commit and push `beta`, then set
  `READY FOR REVIEW` with Codex as current owner/next recipient.
- Required before transfer:
  - complete candidate committed and pushed,
  - `CURRENT_WORK.md` and this file synchronized,
  - exact checks and results recorded,
  - no production deployment,
  - no unrelated changes.
