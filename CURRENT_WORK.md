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

### CW-2026-07-28-WORKFLOW

- Status: `APPROVED`
- Goal: Make cross-agent review more evidence-based and efficient, reduce
  mandatory session context without deleting knowledge, and reconcile `beta`
  safely with current `main`.
- Implementation owner: Codex
- Reviewer: User; Gemini may challenge through the handoff
- Current owner: Codex
- Next recipient: User
- Branch: `codex/workflow-optimization`
- Base: `main` at `6da520dc`
- Handoff file: `docs/agent-handoffs/CW-2026-07-28-WORKFLOW.md`
- Production impact: none unless a later VPS deployment is explicitly requested
- Deployment required: no

In scope:

- task-aware project-context loading,
- explicit right to challenge review findings,
- realistic likelihood/impact/effort assessment,
- safe `beta` reconciliation without a blind merge.

Out of scope:

- application feature changes,
- fixing existing application findings,
- VPS deployment.

Next action:

- Owner: Codex
- Action: Publish the verified documentation candidate to `main`, fast-forward
  `beta` to that commit and then close this temporary task entry.

For a new entry, copy
`docs/agent-handoffs/CURRENT_WORK_TEMPLATE.md` under `Active Work`.
