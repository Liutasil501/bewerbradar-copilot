# BewerbRadar Copilot – Shared Agent Rules

These rules apply to every AI agent working in this repository.

They define the project bootstrap, autonomy boundaries, Git workflow, quality
requirements, collaboration model and production release process.

Platform and system safety rules always take precedence.

## 1. New Session Bootstrap

A new agent session must not assume knowledge from previous conversations.

Before substantive work:

1. Read this complete `AGENTS.md`.
2. Read the complete authoritative current state in `PROJECT_CONTEXT.md`.
3. Use `docs/PROJECT_MAP.md` to identify the affected subsystem and relevant files.
4. Read `CURRENT_WORK.md`, verify any active branch, commit and deployment
   claims, and read the task-specific file under `docs/agent-handoffs/` for the
   affected active task.
5. For architecture, infrastructure or deployment work, also read:
   - `ARCHITECTURE.md`
   - `DEPLOYMENT.md`
6. Inspect the current repository state:
   - `git status --short --branch`
   - `git log -5 --oneline --decorate`
   - `git diff`
   - `git remote -v` when branches or deployment are relevant
7. Preserve unrelated and uncommitted user or agent changes.
8. Trace the affected behavior end-to-end:
   page/component → store/hook → API route → domain service/provider
   → repository/database.
9. Read only the task-specific implementation files after orientation.
10. If documentation contradicts code, Git state or verified runtime behavior,
   investigate the discrepancy instead of guessing.
11. Never accept another agent’s success statement, commit message or deployment
    claim as proof without independent verification.

## 2. Sources of Truth

Use the following precedence:

1. Current user request and explicit product decisions
2. Platform and system safety requirements
3. This `AGENTS.md`
4. Verified code, Git state and runtime behavior
5. `PROJECT_CONTEXT.md`
6. `CURRENT_WORK.md` for active coordination only
7. `ARCHITECTURE.md`, `DEPLOYMENT.md` and `docs/PROJECT_MAP.md`
8. Feature specifications explicitly marked as active
9. Historical plans, changelogs and the upstream README

`CURRENT_WORK.md` never overrides Git, verified runtime behavior or durable
project documentation. It may be stale and must be corrected when evidence
disagrees.

The existing `README.md`, `README.zh-CN.md`, old plans and historical log entries
may describe upstream JadeAI behavior. They are not authoritative for current
BewerbRadar product rules, billing or deployment.

## 3. Operating Principle and Autonomy

Act autonomously within the requested scope.

Agents may without repeated permission:

- inspect repository files and Git history,
- run read-only diagnostics,
- modify relevant project files,
- add proportional tests and diagnostics,
- run type checks, linting, builds and local smoke tests,
- create commits,
- push non-production branches,
- merge and push `main` when the standing authorization in section 5 applies,
- make small adjacent fixes required for a correct implementation,
- update documentation affected by the change.

Ask the user only when:

- a missing product decision materially changes the outcome,
- scope would expand significantly beyond the request,
- an action is destructive or difficult to reverse,
- secrets, payments, permissions or external accounts are affected,
- a required product or entitlement decision is missing,
- the production runtime would be deployed without explicit authorization in
  the current request.

Do not stop for routine implementation decisions that can be resolved safely
from the repository and current product context.

If the user explicitly authorizes implementation and production deployment
after successful verification in the same request, no second deployment
confirmation is required.

## 4. Repository and Remotes

Primary repository:

- Local workspace: `C:\Games\Dev\JadeAI`
- Product remote: `copilot`
- Product repository: `Liutasil501/bewerbradar-copilot`

Other remotes:

- `origin`: upstream open-source JadeAI repository
- `bewerbradar`: separate BewerbRadar repository

Do not push to `origin` or `bewerbradar` unless the user explicitly requests it.

Do not copy changes into the separate BewerbRadar repository merely because a
similar feature exists there.

## 5. Branch and Collaboration Model

### Production branch

- `main` is the production source branch.
- Do not perform development directly on `main`.
- Do not leave uncommitted development changes on `main`.
- A push to `main` publishes source but does not deploy the VPS.

Standing main-publication authorization from the user:

- Codex may merge and push a low-risk, verified candidate to `main` without
  asking again.
- Codex may merge and push a larger Gemini implementation after independently
  reviewing the complete candidate, resolving release blockers and issuing
  `GO`.
- The exact candidate diff must be understood, proportional checks must pass
  and unrelated commits must not be included.
- Documentation-only changes may be merged after focused documentation checks;
  they do not require an application build.
- A Codex-authored non-trivial application change should not be self-approved
  as equivalent to an independent Gemini → Codex review.
- This standing authorization does not authorize a VPS deployment, destructive
  history changes, database restoration, secret rotation, payment-account
  changes or unresolved product decisions.

### Integration branch

- `beta` is the shared non-production integration and review branch.
- Gemini may implement, test, commit and push to `beta`.
- Codex independently reviews the complete release candidate on `beta`.
- Before using `beta`, verify that it is based on the current production history.
- If `beta` is behind or diverged from `main`, do not merge it blindly.
  Report the divergence and create a safe reconciliation plan.

### Feature branches

Feature branches based on a healthy `beta` are allowed and encouraged when:

- work is large,
- multiple agents work concurrently,
- the change spans risky systems,
- a clean rollback boundary is useful.

Suggested naming:

- `gemini/<task>`
- `codex/<task>`
- `fix/<task>`
- `feature/<task>`

### Concurrent work

When Gemini and Codex work at the same time:

- use separate Git worktrees or separate repository clones,
- use separate branches,
- do not edit the same files concurrently without coordination,
- never switch branches in a shared dirty working tree,
- register each active branch in `CURRENT_WORK.md`,
- link each non-trivial task to `docs/agent-handoffs/<task-id>.md`,
- update only the owned task entry where practical,
- communicate through commits and the task-specific handoff file.

Never force-push, rewrite shared history or rebase a branch used by another
agent without explicit agreement.

### Agent-to-agent communication

`CURRENT_WORK.md` is the active-task index. It must stay concise.

Detailed Gemini ↔ Codex communication belongs in the task-specific handoff file
described by `docs/agent-handoffs/README.md`.

Use a one-writer baton:

1. the current owner implements or reviews,
2. the current owner updates the handoff and `CURRENT_WORK.md`,
3. the current owner commits and pushes,
4. the current owner assigns the next recipient and stops editing,
5. the recipient fetches and verifies the pushed state before continuing.

Gemini normally hands `READY FOR REVIEW` work to Codex. Codex returns
`CHANGES REQUESTED` with evidence or marks the task `APPROVED`.

Do not ask the user to relay technical messages between agents. Ask the user
only for a real decision or authority boundary. Repository files do not wake an
idle agent; the user or an automation must still start the recipient.

## 6. Normal Agent Roles

### Gemini / Antigravity

Gemini is normally the primary implementation agent.

Gemini may:

- explore and implement the requested feature,
- perform visual and browser-based iteration,
- run proportional tests,
- commit and push non-production changes,
- prepare the implementation handoff.

Gemini must not:

- declare its own work production-ready without independent review,
- push or deploy `main` without authorization,
- claim that code is live without verifying production,
- use unsupported phrases such as “100% perfect” or invent conversion results.

### Codex

Codex is normally the independent reviewer and release-gate agent.

Codex may:

- inspect the complete release diff,
- run additional tests and browser checks,
- audit architecture, security, privacy, billing and migrations,
- make small unambiguous fixes on a non-production branch,
- return significant issues to Gemini,
- issue `GO`, `CONDITIONAL GO` or `NO-GO`.

A Codex `GO` may permit main publication under the standing rules in section 5.
It does not authorize a VPS deployment.

The user may change these roles for any task.

## 7. Implementation Standards

Agents have freedom to choose implementation details, but must preserve the
project’s architectural boundaries.

General rules:

- Keep product logic out of low-level `src/components/ui/`.
- Keep database access in repositories where practical.
- Enforce authentication, ownership and plan restrictions server-side.
- UI paywalls are user experience, not security boundaries.
- Preserve German and English localization.
- Do not reintroduce untranslated Chinese UI or fallback strings.
- Avoid unnecessary new dependencies.
- Reuse established stores, repositories, schemas and components.
- Keep changes focused and explain meaningful adjacent refactors.
- Do not silently change subscription entitlements or pricing.
- Do not log complete resumes, uploaded document contents, API keys or PII.

## 8. Database Rules

Production currently uses SQLite.

Relevant files:

- `src/lib/db/schema.ts`
- `src/lib/db/adapters/sqlite.ts`
- `src/lib/db/repositories/`
- `drizzle/migrations/`

A database schema change is incomplete without:

1. schema update,
2. checked-in Drizzle migration,
3. compatibility review for existing production data,
4. adapter review,
5. Docker/runtime packaging review,
6. verification against an upgraded existing database when risk warrants it.

Do not assume PostgreSQL parity. The PostgreSQL schema and migrations currently
lag behind the production SQLite schema and require explicit review.

Do not delete, replace or recreate a production database as a migration shortcut.

## 9. Authentication and Authorization Rules

Production has `AUTH_ENABLED=true`.

Supported production authentication:

- Google OAuth
- E-mail magic link via Nodemailer

When OAuth is disabled locally, fingerprint mode is used.

For authenticated data:

- verify the current user in every protected API route,
- verify resource ownership,
- enforce plan restrictions server-side,
- do not rely only on middleware or client UI,
- do not expose user data through debug routes.

Public routes and shared resumes require special scrutiny because they bypass
normal authenticated navigation.

## 10. AI and User API Keys

Supported providers:

- OpenAI-compatible
- Anthropic
- Google Gemini

User-provided API keys:

- are stored in browser `localStorage`,
- are not persisted in the application database,
- are transmitted to the BewerbRadar backend in request headers for AI calls,
- must never be logged, added to analytics or committed.

The server-side Gemini key is used only for plan/feature paths allowed by the
current provider and entitlement logic.

Changes to AI access must review both:

- client-side paywall behavior,
- server-side provider and entitlement behavior.

## 11. Quality Requirements

Verification must be proportional to risk.

Typical checks:

- `pnpm type-check`
- ESLint for changed files or `pnpm lint`
- `pnpm build`
- focused browser or API smoke tests
- inspection of the final Git diff
- database migration verification
- production verification after deployment

Not every text or styling change requires the full suite.

Stronger verification is required for:

- authentication,
- authorization,
- database schema and migrations,
- Stripe and subscriptions,
- AI-provider access,
- resume import and export,
- sharing,
- deployment and Docker,
- analytics and consent.

There is currently no established automated unit or end-to-end test suite.
Do not imply that automated tests passed when only type-checking or a build ran.

## 12. Privacy and Sensitive Data

Resume content is sensitive personal data.

Never send resume content, filenames, e-mail addresses, phone numbers, uploaded
documents or user identifiers to analytics.

Never expose or print:

- API keys,
- OAuth secrets,
- Stripe secrets,
- SMTP credentials,
- SSH private keys,
- production environment files,
- complete database contents.

Do not add secret values to documentation. Document variable names only.

Uploaded resume files should remain in memory unless persistent storage is an
explicit product requirement.

## 13. Documentation Maintenance

Update documentation when durable behavior changes.

Update `PROJECT_CONTEXT.md` for:

- product entitlements,
- authentication behavior,
- database/runtime choices,
- external integrations,
- analytics state,
- production topology,
- important known constraints.

Update `ARCHITECTURE.md` for:

- data flows,
- module boundaries,
- storage architecture,
- authentication architecture,
- AI-provider architecture.

Update `DEPLOYMENT.md` for:

- branches,
- server directories,
- commands,
- environment requirements,
- verification or rollback procedures.

Update `docs/PROJECT_MAP.md` when important files or subsystems move.

Update `CURRENT_WORK.md` when:

- an active task starts,
- ownership, branch, scope or status changes,
- work becomes ready for review,
- review requests changes or approves the candidate,
- deployment starts or is verified,
- an active entry is completed or abandoned.

Keep `CURRENT_WORK.md` operational and small. Remove finished entries instead
of turning it into a chronological log.

Create and maintain `docs/agent-handoffs/<task-id>.md` for non-trivial
cross-agent work. Remove the active file after completion; Git history preserves
the exchange.

Do not append unlimited chronological notes to authoritative documents.
Move historical notes into a separate changelog or `docs/history/`.

All documentation must be UTF-8.

## 14. Implementation Handoff

Every implementation handoff must include:

### Goal

What was requested and implemented?

### Branch and Commit

- branch
- commit SHA
- remote pushed to

### Files

Important files changed.

### Verification

Exact commands and results.

### Database and Environment

- migrations
- environment-variable additions
- production preparation required

### Risks

- known limitations
- untested behavior
- follow-up decisions

### Deployment Status

Use exactly one:

- `NOT DEPLOYED`
- `DEPLOYING – NOT YET VERIFIED`
- `VERIFIED LIVE`

Never use `VERIFIED LIVE` without checking production.

Before handoff:

1. synchronize the corresponding `CURRENT_WORK.md` entry,
2. update the task-specific handoff with actual scope, verification, findings,
   risks and next owner,
3. commit and push both with the implementation or review.

The pushed commit SHA remains authoritative. The commit containing a handoff
does not need to embed its own SHA recursively.

## 15. Review Result

Codex review ends with one result:

- `GO`: technically ready for the reviewed release scope
- `CONDITIONAL GO`: ready only when listed conditions are met
- `NO-GO`: release blockers remain

Findings should be classified realistically:

- Release blocker
- Important
- Improvement
- Acceptable residual risk

Do not inflate theoretical edge cases, but do not minimize real data,
authorization, billing or deployment risks.

## 16. Production Release

Before main publication:

1. confirm that the standing main-publication authorization applies to the
   merge/push,
2. verify the exact `main...release-candidate` diff,
3. ensure no unrelated commits are included,
4. verify migrations and environment requirements,
5. establish a rollback point for risky releases,
6. run the required quality checks.

Before VPS deployment:

1. confirm explicit deployment authorization in the current request,
2. confirm the exact authorized `main` commit,
3. follow `DEPLOYMENT.md`.

Main publication and production deployment are separate actions.

After VPS deployment:

1. verify the VPS Git commit,
2. verify the container is running,
3. inspect focused logs,
4. verify the public application,
5. test the changed behavior,
6. report the release as live only after those checks.

Follow `DEPLOYMENT.md` for the concrete runbook.
