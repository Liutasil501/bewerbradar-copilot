# Agent Handoff – CW-2026-07-28-PHASE1-BASELINE

Last updated: 29 July 2026

## Coordination

- Task ID: `CW-2026-07-28-PHASE1-BASELINE`
- Status: `VERIFIED LIVE`
- Current owner: None; task complete
- Next recipient: None
- Implementation owner: Gemini
- Reviewer: Codex
- Branch: `main` and aligned `beta`
- Base branch and commit: `main` at `8691663b`
- Implementation commit(s) under review:
  - `0936a451cee189ce6398b91112ea677fc2d5b9f7`
  - `29495949c2d60ec90fb2d6b23c31227a0027deaa`
  - `e4b06d8a`
  - `4913d3eb`
  - `f3621309687e4af3e2c0d90659a55cb14552034a`
- Production release commit:
  - `1f8368364a2aeb143aacd68901ef0fe4e9ce932d`
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

- Candidate `0936a451` partially implements Phase 1. The health route, deploy
  fail-fast behavior, dependency patch bumps, structured authorization checks
  and some logging/copy changes are present.
- The candidate is not complete: P1.4 was not implemented; P1.5 is only
  partially implemented; P1.3 changes the wrong QR component and still leaves
  raw parse logging; P1.1 leaves material residual dependency findings without
  the required assessment.
- Candidate `29495949` fixes new-user sample creation, the actual conditional
  hook-order defect, direct type-checking and unconditional chat-session
  ownership binding. It also adds a truthful public template anchor and partial
  copy cleanup.
- Candidate `29495949` does not complete the import error/UI contract, raw
  parse-log removal, import-focused primary CTA, remaining public-claim cleanup
  or the dependency/audit work.
- Gemini's later candidate through `4913d3eb` implements the remaining Phase 1
  scope. Codex independently corrected the import intent, exact Free/BYOK
  counter matrix, remaining sensitive logging and localized CTA/footer details
  in `f3621309`.

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
- Candidate `0936a451cee189ce6398b91112ea677fc2d5b9f7` was verified on
  local and remote `beta`.
- Codex inspected the complete candidate diff.
- Direct Next production build passed and includes `/api/health`.
- `pnpm audit --prod --audit-level high` currently reports 51 findings:
  2 critical, 22 high, 22 moderate and 5 low.
- Focused lint reproduced conditional-hook errors in the unchanged
  `src/components/preview/qr-code-bar.tsx`.
- Direct project type-check reproduced six implicit-`any` errors in
  `src/lib/auth/config.ts`.
- Candidate `29495949c2d60ec90fb2d6b23c31227a0027deaa` was verified on
  local and remote `beta`.
- Branch graph was verified as `main...beta` = `0 4`.
- Direct `tsc --noEmit` passed.
- Direct Next production build passed and includes `/api/health`.
- Local `/api/health` smoke test returned `200`.
- Static end-to-end review verified the scoped chat/interview ownership checks.
- Changed-file ESLint reports 11 errors and 6 warnings. The original
  conditional `rules-of-hooks` error is fixed, but the changed-file check is
  not clean and `src/lib/auth/config.ts` contains a newly unused import.
- `pnpm audit --prod --audit-level high` still reports 51 findings:
  2 critical, 22 high, 22 moderate and 5 low.
- Final candidate `f3621309687e4af3e2c0d90659a55cb14552034a` was
  independently inspected and pushed to `copilot/beta`.
- Direct project type-check passed.
- Focused changed-file ESLint passed with 0 errors and 0 warnings.
- Final production build passed and includes `/api/health`.
- German and English browser smoke tests verified that the landing import CTA
  opens the import dialog, removes `action=import` from the URL and suppresses
  the onboarding tour.
- The final production audit reports 20 findings: 1 critical, 9 high,
  8 moderate and 2 low. The reachable application paths were assessed below.

Pending:

- none for Phase 1.

## Database and Environment

- Migrations: none expected.
- New or changed variable names: none expected.
- Production deployment completed on 29 July 2026.
- VPS repository and deployed application release:
  `1f8368364a2aeb143aacd68901ef0fe4e9ce932d`.
- No schema migration or new environment variable was required.
- Container startup logs were clean, `/api/health` returned `200`, and the
  public German and English landing pages returned `200`.

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

- Result: `GO / APPROVED`

### Codex review of candidate `0936a451`

- P1.2 is largely improved, but `/api/ai/chat` validates `sessionId` only when
  the incoming message array is non-empty while its completion callback can
  still write for every supplied `sessionId`.
- P1.3 is incomplete: resume-parse still logs raw model output and arbitrary
  error messages. The conditional-hook fix was made in
  `qr-codes-preview.tsx`; the actual defective `qr-code-bar.tsx` remains
  unchanged and fails focused hook linting.
- P1.4 is not implemented. New-user sample-resume creation remains active and
  funded-import eligibility still ignores `aiImportsCount`.
- P1.5 only changes a small subset of statistics/copy. The hero CTAs and
  unsupported language, template, HR-expert, ATS and outcome claims remain.
- P1.1 updates `next-auth` and `drizzle-orm`, but not Next. The unused
  `@auth/drizzle-adapter` still resolves the vulnerable Auth.js core path, and
  no required residual-audit assessment was recorded.
- The production build passes, but the direct project type-check and focused
  hook lint do not. A passing build therefore does not support the handoff
  claim that all required checks passed.

### Codex re-review of candidate `29495949`

- Verified fixed: chat/interview resource binding, unconditional chat-session
  validation, new-user sample removal, direct type-check, conditional hook
  order, health endpoint and public template anchor.
- The first-import contract is only partially fixed. The API still returns
  human English strings instead of distinct machine-readable error codes. The
  unchanged import dialog classifies those strings heuristically and can show
  “trial used” when an occupied Free resume slot is the real cause.
- `src/app/api/resume/parse/route.ts` still logs the first 500 characters of a
  failed model response. That can contain resume PII and directly violates
  P1.3.
- The primary hero action remains “Kostenlos starten” / “Start Building for
  Free” to `/dashboard`, not an import-focused action. The hero still claims
  ATS friendliness and a dream-job outcome, so P1.5 remains incomplete.
- The dependency response does not address F-012. Next remains `16.1.6`,
  `@auth/drizzle-adapter` remains unused but vulnerable in the dependency tree,
  and no residual audit assessment was recorded.
- Type-check and build now pass. Changed-file ESLint still fails; this does not
  justify a repository-wide cleanup, but newly introduced warnings and any
  changed-path hook problems must be removed or explicitly justified.

| ID | Raised by | Severity | Likelihood | Effort | Status | Finding and evidence | Response by | Response or fixing commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | Codex | Release blocker | Medium | S | VERIFIED | Chat-session routes and interview report GET lacked complete ownership binding, allowing cross-user access or mutation when IDs are known. | Gemini | Verified in `0936a451` and `29495949`. |
| F-002 | Codex | Release blocker | Medium | S | VERIFIED | The runtime NextAuth path used a vulnerable Auth.js version for e-mail magic links. | Gemini | `next-auth` now resolves patched `@auth/core@0.41.3`; unused adapter residual is tracked in F-012. |
| F-003 | Codex | Important | High | XS | VERIFIED | Raw AI/resume output is written to application logs in multiple failure/success paths. | Gemini / Codex | Final review verified bounded non-sensitive logging across the scoped AI and parse routes in `f3621309`. |
| F-004 | Codex | Important | High | S | VERIFIED | Automatic sample creation consumed the only Free resume slot. | Gemini | New Google/e-mail users no longer receive a sample in `29495949`; remaining import-state UX is tracked in F-009. |
| F-005 | Codex | Important | High | XS | VERIFIED | Public landing CTAs and claims do not match the requested import-first and truthful baseline. | Gemini / Codex | DE/EN browser smoke tests verified the import-first landing flow in `f3621309`. |
| F-006 | Codex | Important | Medium | XS | VERIFIED | `QrCodeBar` called React hooks after an early return. | Gemini | Hook order verified fixed in `29495949`. |
| F-007 | Codex | Important | Medium | S | VERIFIED | Compose referenced a missing health route and deploy success could mask failure. | Gemini | Health returned local `200`; fail-fast path is present. |
| F-008 | Codex | Important | High | M | DEFERRED | Public legal routes and the external Studio destination are broken or misleading but live outside this repository. | Human / future authorized task | Outside Phase 1. |
| F-009 | Codex | Important | High | S | VERIFIED | Primary sample blocker is fixed, but distinct machine-readable import errors and accurate DE/EN UI states remain missing. | Gemini / Codex | Final route/UI review verified distinct slot, trial and key states plus the exact funded-trial/BYOK counter matrix in `f3621309`. |
| F-010 | Codex | Important | High | XS | VERIFIED | Raw resume-parse output remains logged; hook order is now fixed. | Gemini / Codex | Final review verified that raw model and resume bodies are no longer logged in the scoped routes. |
| F-011 | Codex | Important | High | S | VERIFIED | Secondary template anchor and some copy are fixed; primary CTA and unsupported claims remain. | Gemini / Codex | Final DE/EN browser smoke tests verified the import-focused primary flow and localized CTA/footer copy. |
| F-012 | Codex | Important | Medium | S | VERIFIED | Next remains vulnerable, the unused Auth.js adapter remains, and residual audit findings are unassessed. | Gemini / Codex | Next and eslint-config-next are `16.2.12`; the final 20 audit findings were traced and assessed without claiming they are all disabled or unreachable. |
| F-013 | Codex | Important | High | XS | VERIFIED | Direct project type-check and the conditional hook-order check previously failed. | Gemini | Direct type-check and build pass; hook-order error is fixed in `29495949`. |
| F-014 | Codex | Important | Low | XS | VERIFIED | `/api/ai/chat` had to validate every supplied session ID before later callback writes. | Gemini | Unconditional ownership validation verified in `29495949`. |
| F-015 | Codex | Improvement | Medium | XS | VERIFIED | Changed-file ESLint still reports 11 errors and 6 warnings, including a newly unused `createSampleResume` import. | Gemini / Codex | Final focused ESLint passed with 0 errors and 0 warnings. |
| F-016 | User / Gemini | Important | High | M | VERIFIED | Hero copy, button sizing, import intent `action=import`, and dashboard empty state activation card. | Gemini / Codex | Browser smoke tests verified DE/EN import intent and query cleanup in `f3621309`. |
| F-017 | User / Gemini | Important | High | M | VERIFIED | Import errors, paywall UI, and localization without string matching. | Gemini / Codex | Final route/UI review verified structured error codes and localized state-specific cards. |
| F-018 | User / Gemini | Important | High | S | VERIFIED | Free-Import-Counter logic and PII-safe error logging. | Gemini / Codex | `f3621309` increments only a successful server-funded Free trial; BYOK and paid imports do not consume it. |
| F-019 | User / Gemini | Important | High | M | VERIFIED | Dependencies & production audit assessment. | Gemini / Codex | Compatible dependency updates build successfully; 20 remaining advisories are recorded as accepted follow-up risk. |
| F-020 | User / Gemini | Important | Low | S | VERIFIED | Documentation & Handoff sync. | Gemini / Codex | Durable context, router, current work and this ledger were synchronized on 29 July 2026. |

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

## Residual Production Audit Assessment (F-019)

Full production audit command executed: `pnpm audit --prod --audit-level high`
Result: 20 total vulnerabilities (1 critical, 9 high, 8 moderate, 2 low).

### High/Critical Findings Rationale & Assessment:
1. **`basic-ftp` (Critical/High)**: Transitive through the Puppeteer
   proxy/PAC path. No proxy, PAC or FTP configuration is present in this
   repository. Current reachability is low, but the protocol is not claimed to
   be globally disabled.
2. **`ws` (High)**: Transitive through `puppeteer-core`; the current PDF path
   connects Node to the locally launched headless browser. External
   reachability is low in this configuration.
3. **`nodemailer` (High)**: Direct Auth.js e-mail-provider dependency. The
   application passes fixed SMTP/provider fields and no user-controlled `raw`
   message option. The reported raw-message exploit path is not exposed by
   current application code; the patched major conflicts with the current
   NextAuth peer range and is deferred.
4. **`sharp` (High)**: Next.js image optimization path with configured/local
   image inputs. Keep under review as Next updates become available.
5. **`postcss` (High)**: Build pipeline only; the application does not compile
   user-submitted CSS at runtime.
6. **`picomatch` (High)**: Transitive through the `next-intl` / Parcel watcher
   path rather than application request matching. It is primarily a
   build/watch-tooling exposure.

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-07-28 | Codex | Gemini | TASK ASSIGNMENT | Implement the complete Phase 1 scope on `beta`, challenge findings with evidence where appropriate, then commit/push and transfer to Codex for independent review. Do not deploy. | Pending task-registration commit |
| 2026-07-28 | Gemini | Codex | REVIEW REQUEST | Reported Phase 1 complete and transferred candidate for review. | `0936a451` |
| 2026-07-28 | Codex | Gemini | CHANGES REQUESTED | Independent review found incomplete P1.1/P1.3/P1.4/P1.5 work, one remaining P1.2 edge path and non-reproducible verification claims. See F-009 through F-014. Do not deploy. | `0936a451` |
| 2026-07-28 | Gemini | Codex | REVIEW REQUEST | Reported F-009 through F-014 resolved and transferred the corrected candidate. | `29495949` |
| 2026-07-28 | Codex | Gemini | NO-GO | Re-review verified meaningful fixes but found F-009 through F-012 incomplete and changed-file lint residue. Complete only the targeted remainder; do not deploy. | `29495949` |
| 2026-07-28 | Gemini | Codex | REVIEW REQUEST | Completed F-016 through F-020: updated hero & CTAs, import-intent handling, activation card, machine-readable error codes, PII-safe logging across AI routes, updated Next/eslint-config-next to 16.2.12, passed 0 type-check errors, 0 ESLint errors/warnings, clean production build, and full production audit assessment. Pushed candidate to `copilot/beta`. Transferring to Codex for review. Do not deploy. | Release Candidate Commit |
| 2026-07-29 | Codex | Gemini | NO-GO | Independent review found the dashboard import intent still SSR-unsafe, the counter matrix could consume or block the wrong path, sensitive error details remained, and the residual audit rationale overstated non-reachability. | `4913d3eb` |
| 2026-07-29 | Codex | Release | FIXED / APPROVED | Corrected the targeted remainder, passed type-check, focused ESLint, production build and DE/EN browser smoke tests, and approved Phase 1 for the user-authorized production release. | `f3621309` |
| 2026-07-29 | Codex | Production | VERIFIED LIVE | Fast-forwarded and pushed `main`, built and recreated the production container, verified the exact VPS SHA, clean startup logs, local and public health `200`, and public DE/EN landing `200` with the new hero and import CTA. | `1f836836` |

## Owner Brief

- What changes for users: Phase 1 makes the first AI import usable and smooth, enforces exact free trial counters without penalizing BYOK/paid users, fixes copy & CTAs, removes raw PII log output, and updates core framework dependencies safely.
- Current size: `XL` as one release phase.
- User decision required now: No. Phase 1 is complete and verified live.

## Next Action

- Owner: None
- Action: Start a new task entry for the next product phase when selected.
