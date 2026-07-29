# BewerbRadar Copilot – Shared Agent Rules

These rules apply to every AI agent working in this repository. They define the
mandatory shared context, autonomy boundaries, Git workflow, collaboration and
release safety. Platform and system rules always take precedence.

## 1. New Session Bootstrap

A new session must not assume knowledge from earlier conversations.

Before substantive work:

1. Read this complete `AGENTS.md`.
2. Read only the `Session Snapshot` in `PROJECT_CONTEXT.md`.
3. Read `CURRENT_WORK.md`; verify relevant branch, commit and deployment claims.
4. If the task is active, read its linked file under `docs/agent-handoffs/`.
5. Read the relevant task-routing section in `docs/PROJECT_MAP.md`.
6. Read only the task-relevant detailed sections of `PROJECT_CONTEXT.md`.
7. Load specialist guidance when triggered:
   - application, data, security, billing, AI or analytics changes:
     `docs/agent-guides/ENGINEERING.md`
   - review, handoff, main publication or documentation maintenance:
     `docs/agent-guides/REVIEW_AND_RELEASE.md`
   - cross-agent work: `docs/agent-handoffs/README.md`
   - architecture/infrastructure: `ARCHITECTURE.md`
   - VPS deployment: `DEPLOYMENT.md`
8. Inspect current evidence:
   - `git status --short --branch`
   - `git log -5 --oneline --decorate`
   - `git diff`
   - `git remote -v` when branches or deployment matter
9. Preserve unrelated or uncommitted user and agent changes.
10. Trace affected behavior end-to-end when implementation is involved.
11. If docs contradict code, Git or verified runtime behavior, investigate.
12. Never accept another agent's success or deployment claim as proof.

## 2. Sources of Truth

Use this precedence:

1. Current user request and explicit product decisions
2. Platform and system safety requirements
3. This `AGENTS.md` and triggered specialist guide
4. Verified code, Git state and runtime behavior
5. `PROJECT_CONTEXT.md`
6. `CURRENT_WORK.md` for active coordination only
7. `ARCHITECTURE.md`, `DEPLOYMENT.md` and `docs/PROJECT_MAP.md`
8. Feature specifications explicitly marked active
9. Historical plans, changelogs and upstream README files

`CURRENT_WORK.md` may be stale and never overrides verified evidence.

`README.md`, `README.zh-CN.md`, old plans and historical logs may describe
upstream JadeAI. They are not authoritative for current BewerbRadar product
rules, billing or deployment.

## 3. Autonomy

Act autonomously within the requested scope.

Agents may without repeated permission:

- inspect files, Git history and runtime evidence,
- run read-only diagnostics,
- modify relevant project files,
- add proportional tests and diagnostics,
- run type checks, lint, builds and local smoke tests,
- create commits,
- push non-production branches,
- merge and push `main` when section 5 permits it,
- make small adjacent fixes needed for correctness,
- update documentation affected by the change.

Ask the user only when:

- a missing product decision materially changes the outcome,
- scope would expand significantly,
- an action is destructive or difficult to reverse,
- secrets, payments, permissions or external accounts are affected,
- a required entitlement decision is missing,
- the production runtime would be deployed without authorization in the
  current request.

If implementation and production deployment are explicitly authorized in one
request, no second confirmation is required after successful verification.

## 4. Repository and Remotes

- Workspace: `C:\Games\Dev\JadeAI`
- Product remote: `copilot`
- Product repository: `Liutasil501/bewerbradar-copilot`
- `origin`: upstream open-source JadeAI
- `bewerbradar`: separate BewerbRadar repository

Do not push to `origin` or `bewerbradar` unless explicitly requested. Do not
copy changes into the separate BewerbRadar repository merely because a similar
feature exists there.

## 5. Git and Publication

### Main

- `main` is the production source branch.
- Do not develop directly on `main` or leave uncommitted work there.
- A push to `main` publishes source; it does not deploy the VPS.

Standing authorization:

- Codex may merge and push a low-risk verified candidate to `main`.
- Codex may merge and push a larger Gemini implementation after independent
  complete review, resolution of release blockers and a `GO`.
- The exact candidate diff must be understood, proportional checks must pass
  and unrelated commits must not be included.
- Documentation-only changes need focused documentation checks, not an
  application build.
- A non-trivial Codex application change is not self-approved as equivalent to
  an independent Gemini → Codex review.

This authorization excludes VPS deployment, destructive history changes,
database restoration, secret rotation, payment-account changes and unresolved
product decisions.

### Beta and feature branches

- `beta` is the shared non-production integration and review branch.
- Gemini may implement, test, commit and push to `beta`.
- Codex independently reviews the complete candidate on `beta`.
- Verify that `beta` is based on current production history before using it.
- If `beta` is behind or diverged, do not merge blindly; reconcile safely.

Feature branches are encouraged for large, concurrent or risky work. Suggested
names: `gemini/<task>`, `codex/<task>`, `fix/<task>`, `feature/<task>`.

For concurrent work:

- use separate worktrees or clones and separate branches,
- do not edit the same files concurrently without coordination,
- never switch branches in a shared dirty worktree,
- register active branches in `CURRENT_WORK.md`,
- link non-trivial tasks to `docs/agent-handoffs/<task-id>.md`,
- communicate through committed and pushed handoff state.

Never force-push, rewrite shared history or rebase a branch another agent uses
without explicit agreement.

## 6. Roles and Agent Communication

Gemini/Antigravity is normally the implementation and visual-iteration agent.
Codex is normally the independent reviewer and release gate. The user may
change these roles for any task.

Choose the lightest workflow that matches scope and risk.

Use one agent for:

- text and documentation,
- small styling changes,
- contained local UI corrections,
- clear `XS` and `S` fixes,
- low-risk configuration without production, billing, entitlement, secret or
  migration impact.

Use Gemini plus Codex for:

- complete features spanning multiple layers,
- authentication or authorization,
- databases or migrations,
- Stripe, pricing or entitlements,
- AI access or server-funded cost logic,
- resume import or export,
- analytics consent,
- major landing-page, onboarding or activation flows,
- deployment, infrastructure or other production-critical changes.

For two-agent work:

1. Codex defines goal, scope, acceptance criteria and realistic risks.
2. Gemini implements and self-checks the candidate on `beta` or a feature
   branch.
3. Codex performs one complete independent review.
4. Codex may fix remaining `XS` or `S` findings directly when the correction is
   unambiguous, stays within the reviewed scope and does not create a new
   product decision.
5. `M` or `L` findings, ambiguous fixes and material scope changes return to
   Gemini.
6. After direct fixes, Codex reruns proportional checks and inspects the final
   candidate diff.
7. Avoid repeated handoff loops when no material issue remains.

If a direct reviewer fix grows beyond `S`, crosses a sensitive boundary or
changes the intended behavior materially, stop and restore independent review
by returning it to Gemini or assigning another reviewer.

Gemini must not declare its own work production-ready without independent
review, claim code is live without runtime proof, or use unsupported statements
such as “100% perfect.”

Codex reviews the complete candidate, runs proportional checks, may make small
unambiguous fixes on a non-production branch and returns `GO`, `CONDITIONAL GO`
or `NO-GO`. A Codex `GO` can authorize source publication under section 5, not
VPS deployment.

`CURRENT_WORK.md` is the concise task index. Detailed Gemini ↔ Codex messages
belong in the linked handoff file.

Use a one-writer baton:

1. current owner implements or reviews,
2. owner updates the board and handoff,
3. owner commits and pushes,
4. owner assigns the next recipient and stops editing,
5. recipient fetches and verifies before continuing.

Do not make the user relay technical messages. Repository files do not wake an
idle agent; a user action or automation still has to start the recipient.

Either agent may challenge the other's finding. Role does not decide facts.
Evidence, impact, realistic likelihood, blast radius and relative effort do.
Read `docs/agent-handoffs/README.md` for the complete challenge protocol.

## 7. Global Product and Safety Invariants

For application work, `docs/agent-guides/ENGINEERING.md` is mandatory.

Always preserve these invariants:

- production currently uses SQLite,
- schema changes require a checked-in migration and upgrade review,
- production authentication is enabled,
- protected routes require server-side authentication and ownership checks,
- UI paywalls are not security boundaries,
- German and English localization must remain intact,
- user API keys, secrets, resumes and other PII must never enter logs,
  analytics, commits or documentation,
- resume uploads remain in memory unless persistence is explicitly required,
- do not silently change pricing or subscription entitlements,
- do not assume PostgreSQL parity.

## 8. Quality, Documentation and Handoffs

Verification is proportional to risk. Stronger checks apply to authentication,
authorization, database migrations, billing, AI access, import/export, sharing,
deployment and analytics consent. A styling or documentation change does not
need the full application suite.

Inspect the final diff and report exact checks. Do not imply that automated
tests passed when only type-checking or a build ran; no established automated
unit or end-to-end suite currently exists.

Durable behavior changes require matching documentation updates. Keep
`CURRENT_WORK.md` small, remove completed entries and rely on Git history.
Documentation must be UTF-8 and contain no secrets or personal data.

For reviews, handoffs, documentation maintenance and release work, read
`docs/agent-guides/REVIEW_AND_RELEASE.md`.

Every implementation handoff reports:

- goal,
- branch and pushed commit,
- important files,
- exact verification,
- migrations and environment impact,
- risks and limitations,
- one deployment status: `NOT DEPLOYED`,
  `DEPLOYING – NOT YET VERIFIED` or `VERIFIED LIVE`.

Never use `VERIFIED LIVE` without production evidence.

## 9. Release Boundary

Main publication and VPS deployment are separate actions.

Before publishing `main`, confirm the standing authorization, review the exact
candidate diff, exclude unrelated commits, check migrations/environment needs
and complete proportional verification.

Before VPS deployment, require explicit authorization in the current request,
confirm the exact authorized `main` commit and follow `DEPLOYMENT.md`.

After deployment, verify the VPS commit, container, focused logs, public
application and changed behavior before reporting `VERIFIED LIVE`.
