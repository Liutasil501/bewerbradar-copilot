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
6. Agents working concurrently edit only their own task entry where practical.
7. Never include secrets, credentials, API keys, production environment values,
   resume content or other personal data.
8. Verify branch and commit claims with Git. If they disagree, Git wins and
   this file must be corrected.
9. Do not append an unlimited history. Remove an entry after it is merged and
   its required deployment is verified, or after it is explicitly abandoned.
10. Git history and implementation handoffs preserve completed work.

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
- `BLOCKED`

`VERIFIED LIVE` follows the production proof requirements in `AGENTS.md` and
`DEPLOYMENT.md`.

## Active Work

### CW-2026-07-28-DOCS

- Status: `READY FOR REVIEW`
- Goal: Complete the shared agent documentation and add a lightweight
  cross-agent current-work board.
- Implementation owner: Codex
- Reviewer: User; optional Gemini cross-check
- Branch: `codex/docs-architecture`
- Base: `main` at `d6436bfc`
- Production impact: none
- Deployment required: no

In scope:

- add `CURRENT_WORK.md`,
- connect the board to session bootstrap, source-of-truth, concurrency,
  maintenance and handoff rules in `AGENTS.md`,
- add the board to `docs/PROJECT_MAP.md`.

Out of scope:

- application-code fixes,
- `beta` reconciliation,
- production deployment,
- custom instructions outside the repository.

Verification completed:

- documentation diff checked for whitespace errors,
- UTF-8 checked without replacement characters,
- Markdown code fences checked for balance,
- concrete repository references checked against the working tree,
- production Git/container state checked read-only where needed.

Known findings outside this documentation change:

- AI chat-session ownership checks are incomplete,
- some AI error/debug paths can log raw model output,
- `beta` remains diverged and requires deliberate reconciliation.

Next action:

- Owner: User or independent reviewer
- Action: Review the documentation branch and decide whether to merge it into
  `main`.

## New Task Template

Copy this section under `Active Work` and replace every placeholder.

```markdown
### CW-YYYY-MM-DD-SHORT-NAME

- Status: `PLANNED`
- Goal:
- Implementation owner:
- Reviewer:
- Branch:
- Base:
- Production impact:
- Deployment required:

In scope:

-

Out of scope:

-

Decisions and assumptions:

-

Verification completed:

-

Verification pending:

-

Database and environment impact:

-

Risks or blockers:

-

Next action:

- Owner:
- Action:
```
