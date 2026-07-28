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

- Status: `READY FOR REVIEW`
- Goal: Create a reviewable Phase 1 release candidate that removes confirmed
  security, privacy, trust and first-import blockers inside BewerbRadar Copilot.
- Implementation owner: Gemini
- Reviewer: Codex
- Current owner: Codex
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

- branch graph verified: `main...beta` with no main-only commits,
- worktree clean,
- direct `tsc --noEmit` / `pnpm type-check` passed (0 errors),
- changed-file ESLint passed (0 errors, 0 warnings),
- production build `pnpm build` passed (4.3s compilation),
- production audit `pnpm audit --prod --audit-level high` run and fully assessed,
- F-001 through F-020 all implemented and marked `FIXED`.

Verification pending:

- independent final Codex re-review of the release candidate on `beta`.

Database and environment impact:

- no schema change required,
- no new environment variable required,
- existing `ai_imports_count` reused cleanly.

Risks or blockers:

- none blocking `beta` candidate review.

Next action:

- Owner: Codex
- Action: Perform independent re-review of candidate on `beta`. Do not deploy to VPS.
