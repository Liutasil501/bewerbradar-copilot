# BewerbRadar Copilot – Current Work

Last updated: 28 July 2026

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

### CW-2026-07-28-PHASE1-BASELINE

- Status: `CHANGES REQUESTED`
- Goal: Create a reviewable Phase 1 release candidate that removes confirmed
  security, privacy, trust and first-import blockers inside BewerbRadar Copilot.
- Implementation owner: Gemini
- Reviewer: Codex
- Current owner: Gemini
- Next recipient: Codex
- Branch: `beta`
- Base: `8691663b`
- Handoff file:
  `docs/agent-handoffs/CW-2026-07-28-PHASE1-BASELINE.md`
- Production impact: Application, authentication, AI import, public landing
  copy and release diagnostics are affected.
- Deployment required: Yes after independent review and separate explicit
  authorization; no deployment is authorized by this task assignment.

In scope:

- patch directly relevant vulnerable production dependencies without broad
  major-version upgrades,
- close confirmed chat and interview ownership gaps,
- remove raw AI/resume output from logs,
- repair the conditional React-hook defect in the QR preview,
- make the promised first Free AI import true for newly registered users and
  enforce it with `aiImportsCount`,
- remove or correct unsupported Copilot landing claims and make the template
  CTA truthful,
- add the missing health route and make the deploy script fail fast.

Out of scope:

- production deployment, main publication or VPS mutation,
- legal-text authoring, DNS/Nginx changes, closing VPS ports or backup setup,
- CMP/GA4/funnel-event implementation,
- pricing-tier redesign, guest import or long-term retention features,
- repository-wide lint cleanup or unrelated refactors.

Decisions and assumptions:

- new accounts must no longer receive a sample resume that consumes the only
  Free slot,
- an eligible Free account needs both zero resumes and
  `aiImportsCount < 1` for the server-funded import,
- deleting an imported resume must not restore the funded trial,
- no concurrency-hardening project is required beyond a small obvious fix;
  realistic proportional protection is sufficient,
- German and English behavior and copy stay aligned.

Verification completed:

- task base and branch alignment verified: `beta...main` = `0 0`,
- worktree was clean before task registration,
- candidate commit `0936a451cee189ce6398b91112ea677fc2d5b9f7` is present
  on local and remote `beta`,
- Codex reviewed the complete candidate diff,
- the production build passed and includes `/api/health`,
- the current production audit reports 51 findings:
  2 critical, 22 high, 22 moderate and 5 low.

Verification pending:

- focused tests or reproducible route checks for ownership and import rules,
- successful changed-file ESLint for the affected paths,
- successful project type-check,
- completion of the missing Phase 1 implementation,
- final Codex re-review of the corrected `beta` candidate.

Database and environment impact:

- no schema change is expected,
- no new environment variable is expected,
- existing `ai_imports_count` must be reused.

Risks or blockers:

- candidate `0936a451` is incomplete: the first-import contract, the actual
  conditional-hook component and material landing-page claims/CTAs were not
  fixed,
- raw resume/AI output can still reach logs,
- direct project type-check and focused hook linting currently fail,
- the dependency update leaves an unused vulnerable Auth.js adapter path,
- `/api/ai/chat` does not validate every supplied `sessionId` before later
  writes,
- public legal pages and the misleading external `studio.bewerbradar.de` route
  are confirmed blockers outside this repository and remain for a separate
  authorized infrastructure/legal task.

Next action:

- Owner: Gemini
- Action: Correct the review findings recorded in the linked handoff on `beta`,
  record exact verification results and residual audit findings, commit and
  push the complete candidate, then set `READY FOR REVIEW` and transfer
  ownership to Codex. Do not deploy.
