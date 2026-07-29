# BewerbRadar Copilot – Current Work

Last updated: 29 July 2026

This file is the shared operational board for active Gemini, Codex and human
work.

It answers:

- What is being worked on now?
- Who owns implementation and review?
- Which branch contains the work?
- What has been verified?
- What is the next action and who owns it?

It is not:

- a product specification,
- a permanent changelog,
- a replacement for Git,
- a replacement for `PROJECT_CONTEXT.md`,
- proof that a commit or deployment exists.

Every branch, commit and deployment statement in this file must be verified
against Git or the runtime before it is trusted.

## Operating Rules

1. Read this file during the new-session bootstrap.
2. Add one active entry per independent branch or release candidate.
3. Use a stable task ID such as `CW-2026-07-28-DOCS`.
4. The implementation owner updates their entry before work, at handoff and
   after material scope or risk changes.
5. The reviewer updates the review result and next action.
6. Every non-trivial cross-agent task links to a task-specific file under
   `docs/agent-handoffs/`.
7. Use the task-specific handoff file for Gemini ↔ Codex messages, findings,
   responses and ownership transfer. Do not turn this board into a chat log.
8. Agents working concurrently edit only their own task entry where practical.
9. Never include secrets, credentials, API keys, production environment values,
   resume content or other personal data.
10. Verify branch and commit claims with Git. If they disagree, Git wins and
   this file must be corrected.
11. Do not append an unlimited history. Remove an entry after it is merged and
   its required deployment is verified, or after it is explicitly abandoned.
12. Git history and task-specific handoffs preserve completed work.

## Status Vocabulary

Use exactly one status per task:

- `PLANNED`
- `IMPLEMENTING`
- `READY FOR REVIEW`
- `CHANGES REQUESTED`
- `APPROVED`
- `READY TO DEPLOY`
- `DEPLOYING – NOT YET VERIFIED`
- `VERIFIED LIVE`
- `NEEDS USER DECISION`
- `BLOCKED`

`VERIFIED LIVE` follows the production proof requirements in `AGENTS.md` and
# BewerbRadar Copilot – Current Work

Last updated: 29 July 2026

This file is the shared operational board for active Gemini, Codex and human
work.

It answers:

- What is being worked on now?
- Who owns implementation and review?
- Which branch contains the work?
- What has been verified?
- What is the next action and who owns it?

It is not:

- a product specification,
- a permanent changelog,
- a replacement for Git,
- a replacement for `PROJECT_CONTEXT.md`,
- proof that a commit or deployment exists.

Every branch, commit and deployment statement in this file must be verified
against Git or the runtime before it is trusted.

## Operating Rules

1. Read this file during the new-session bootstrap.
2. Add one active entry per independent branch or release candidate.
3. Use a stable task ID such as `CW-2026-07-28-DOCS`.
4. The implementation owner updates their entry before work, at handoff and
   after material scope or risk changes.
5. The reviewer updates the review result and next action.
6. Every non-trivial cross-agent task links to a task-specific file under
   `docs/agent-handoffs/`.
7. Use the task-specific handoff file for Gemini ↔ Codex messages, findings,
   responses and ownership transfer. Do not turn this board into a chat log.
8. Agents working concurrently edit only their own task entry where practical.
9. Never include secrets, credentials, API keys, production environment values,
   resume content or other personal data.
10. Verify branch and commit claims with Git. If they disagree, Git wins and
    this file must be corrected.
11. Do not append an unlimited history. Remove an entry after it is merged and
    its required deployment is verified, or after it is explicitly abandoned.
12. Git history and task-specific handoffs preserve completed work.

## Status Vocabulary

Use exactly one status per task:

- `PLANNED`
- `IMPLEMENTING`
- `READY FOR REVIEW`
- `CHANGES REQUESTED`
- `APPROVED`
- `READY TO DEPLOY`
- `DEPLOYING – NOT YET VERIFIED`
- `VERIFIED LIVE`
- `NEEDS USER DECISION`
- `BLOCKED`

`VERIFIED LIVE` follows the production proof requirements in `AGENTS.md` and
`DEPLOYMENT.md`.

## Active Work

### CW-2026-07-29-PHASE2-MEASUREMENT-ACTIVATION

- Status: `CHANGES REQUESTED`
- Goal: Make the landing-to-activation funnel observable without collecting
  resume content or other personal data, then use that evidence for the next
  conversion decision.
- Implementation owner: Gemini
- Reviewer: Codex
- Current owner: Gemini
- Next recipient: Gemini
- Branch: `beta`
- Base: `69c8ce5c5878de82299e1af224e26f398eadeb78`
- Handoff file:
  `docs/agent-handoffs/CW-2026-07-29-PHASE2-MEASUREMENT-ACTIVATION.md`
- Production impact: Consent UI, GTM consent updates and analytics events across
  landing, authentication, import, activation, paywall and checkout entry.
- Deployment required: Yes after independent review and separate explicit
  authorization. No VPS deployment is authorized by this task assignment.

In scope:

- P2.1 user-facing analytics consent choice in German and English,
- versioned persistence and later reopening of the consent choice,
- Consent Mode v2 updates while keeping advertising consent denied,
- P2.2 typed and privacy-bounded data-layer utility,
- the smallest useful landing-to-activation and conversion event funnel,
- Tag Assistant and GA4 DebugView when the connected external
  configuration is available,
- durable analytics documentation after implementation.

Out of scope:

- guest import without authentication,
- broad landing redesign or new AI features,
- pricing or entitlement changes,
- lifecycle e-mails and long-term retention automation,
- legal-text authoring or claims of legal compliance,
- a custom analytics dashboard,
- production deployment.

Decisions and assumptions:

- Phase 2 starts with measurement because the largest current uncertainty is
  where real users abandon the journey.
- Activation means a user sees the usable result of their own successful
  import. Registration alone is not activation.
- Optional product analytics events are emitted only after analytics consent.
- Advertising consent remains denied in this package.
- No event may include resume content, filename, contact information, e-mail,
  user ID, resume ID, API key, prompt, provider response or free-form error.
- T-shirt size: `L` for Phase 2 overall, split into `M` consent foundation and
  `M` funnel instrumentation.

Verification completed:

- Gemini and Codex independently confirmed that `pnpm type-check`,
  changed-file ESLint, `pnpm build` and `git diff --check` pass.
- Codex tested the production build at `http://localhost:3099/de`.
- The browser test reproduced a server-render failure on the public landing page
  because event handlers were added to server components.

Verification pending:

- correction and re-review of findings `F-001` through `F-008` in the task
  handoff,
- complete German and English browser flows after the landing-page runtime
  blocker is fixed,
- external Tag Assistant / GA4 DebugView live stream inspection (requires external GTM/GA4 credential access).

Database and environment impact:

- no database migration expected,
- no secret added to the repository.

Risks or blockers:

- Release blocker: the public landing page currently fails during server
  rendering in the production build.
- Several event properties currently diverge from the stable contract and would
  produce misleading funnel data.
- Durable analytics documentation still describes the pre-Phase-2 state.

Next action:

- Owner: Gemini
- Action: Resolve the open review findings in
  `docs/agent-handoffs/CW-2026-07-29-PHASE2-MEASUREMENT-ACTIVATION.md` on
  `beta`, rerun the required verification, and hand the result back to Codex.
  Do not push to `main` or deploy to VPS.
