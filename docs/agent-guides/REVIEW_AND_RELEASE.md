# Review and Release Guide

Read this guide for independent reviews, release decisions, implementation
handoffs, main publication, production deployment or durable documentation
changes.

The shared rules in `AGENTS.md` remain authoritative. For cross-agent work,
also read `docs/agent-handoffs/README.md`.

## Review Standard

Never accept another agent's success statement, commit message, deployment
claim or `CURRENT_WORK.md` entry as proof. Verify the relevant code, Git state
and runtime evidence independently.

Review the complete candidate diff, not only the files named in a handoff.
Distinguish:

- `GO`: technically ready for the reviewed release scope
- `CONDITIONAL GO`: ready only when listed conditions are met
- `NO-GO`: release blockers remain

Classify findings realistically:

- Release blocker
- Important
- Improvement
- Acceptable residual risk

Gemini and Codex may challenge each other's findings. Neither agent is correct
merely because of role. Code, reproducible behavior and verified runtime
evidence decide factual disputes.

For every material finding, record:

- evidence or reproduction,
- concrete impact,
- realistic likelihood,
- affected users/data or blast radius,
- relative fix effort: `XS`, `S`, `M` or `L`.

The challenged agent may accept, dispute, fix or propose deferral. A dispute
requires counter-evidence, not preference. The reviewer must check the response
and may confirm, downgrade or withdraw the finding.

Use `Release blocker` only when the candidate creates an unacceptable realistic
risk such as data loss, authorization bypass, billing corruption, failed
production migration, secret exposure or reproducible outage.

A low-impact theoretical edge case is not a blocker merely because it is
possible. Conversely, one cross-user privacy breach can be serious without a
mass attack.

## Reviewer Remediation Boundary

The review should close the candidate efficiently, not create an automatic
handoff loop for every finding.

Codex may directly correct a finding when all of these conditions hold:

- effort is `XS` or `S`,
- the required behavior is unambiguous,
- the fix remains inside the reviewed scope,
- no new product, entitlement, pricing or architecture decision is introduced,
- the correction does not expand into a material sensitive-area change,
- proportional verification can cover the resulting diff.

Return the candidate to Gemini when:

- any required correction is `M` or `L`,
- intended behavior is ambiguous,
- scope expands materially,
- the fix requires a migration, entitlement decision or architectural change,
- the reviewer would become the primary author of a non-trivial application
  change.

After a direct correction, Codex records the finding, response, fixing commit
and exact verification. The original implementation received independent
review; the reviewer-authored correction did not. This is an accepted
efficiency tradeoff only for bounded `XS` and `S` work.

Use one complete independent review followed by at most one direct small-fix
pass where practical. Do not bounce a candidate between agents for cosmetic or
mechanical leftovers.

## Proportional Verification

Typical checks:

- focused tests for changed behavior,
- `pnpm type-check`,
- changed-file ESLint or `pnpm lint`,
- `pnpm build`,
- focused browser or API smoke tests,
- final Git diff inspection,
- migration verification,
- production checks after deployment.

Documentation-only changes require focused documentation and Git checks, not an
application build.

Stronger verification is required for authentication, authorization, database
migrations, Stripe, AI-provider access, import/export, sharing, deployment,
Docker, analytics and consent.

Do not imply that automated tests passed when only type-checking or a build ran.
The project currently has no established automated unit or end-to-end suite.

## Documentation Maintenance

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
cross-agent work. Remove the active file after completion; Git history
preserves the exchange.

Do not append unlimited chronological notes to authoritative documents. Move
historical notes into a separate changelog or `docs/history/`.

All documentation must be UTF-8.

## Implementation Handoff

Every implementation handoff includes:

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

## Main Publication

Before publishing `main`:

1. confirm that the standing authorization in `AGENTS.md` applies,
2. verify the exact `main...release-candidate` diff,
3. ensure no unrelated commits are included,
4. verify migrations and environment requirements,
5. establish a rollback point for risky releases,
6. run the required proportional checks.

A push to `main` publishes source; it does not deploy the VPS.

## VPS Deployment

Before deploying:

1. confirm explicit deployment authorization in the current request,
2. confirm the exact authorized `main` commit,
3. follow `DEPLOYMENT.md`.

After deployment:

1. verify the VPS Git commit,
2. verify the container is running,
3. inspect focused logs,
4. verify the public application,
5. test the changed behavior,
6. report the release as live only after those checks.
