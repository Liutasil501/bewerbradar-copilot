# Agent Handoffs

This directory is the task-specific communication channel between Gemini,
Codex and human collaborators.

`CURRENT_WORK.md` is the small index of active work. Each non-trivial active
task links to one handoff file in this directory.

## What This Solves

The handoff file lets agents exchange:

- implementation context,
- decisions and assumptions,
- exact branch and verification state,
- review findings,
- responses and fixes,
- ownership of the next action.

The user does not need to copy one agent's report into the other agent's chat.

The file does not wake or schedule an idle agent. A user action or future
automation still has to start the recipient. Once started, the recipient reads
`AGENTS.md`, `CURRENT_WORK.md` and the linked handoff file without asking the
user to repeat the context.

## One-Writer Ownership

Every task has a current owner and next recipient.

- The current owner may change implementation and handoff state.
- The next recipient waits until the current owner has committed and pushed.
- On transfer, the sender stops editing the candidate branch.
- The recipient fetches the remote branch, verifies the stated commit and then
  becomes the current owner.

This baton model prevents Gemini and Codex from editing the same branch and
handoff file concurrently.

## Normal Workflow

1. The implementer creates or selects a non-production branch.
2. The implementer copies `CURRENT_WORK_TEMPLATE.md` into `CURRENT_WORK.md`.
3. The implementer copies `TEMPLATE.md` to
   `docs/agent-handoffs/<task-id>.md`.
4. The implementer records scope, decisions, files, verification and risks.
5. The implementer commits and pushes, sets `READY FOR REVIEW`, assigns Codex
   as next recipient and stops editing.
6. Codex fetches the branch and independently verifies the complete candidate.
7. Codex records one result:
   - `GO`
   - `CONDITIONAL GO`
   - `NO-GO`
8. Codex classifies every required correction by impact, likelihood and
   relative effort before choosing the next owner.
9. For unambiguous `XS` or `S` corrections inside the reviewed scope:
   - Codex keeps the baton,
   - records the finding and direct-fix decision,
   - fixes the candidate on the non-production branch,
   - reruns proportional verification,
   - records the fixing commit and final result.
10. If a correction grows beyond `S`, crosses a sensitive boundary, requires a
    product decision or materially changes behavior:
   - set `CHANGES REQUESTED`,
   - assign Gemini as next recipient,
   - record actionable findings and evidence,
   - commit and push,
   - stop editing.
11. For approval:
   - set `APPROVED`,
   - merge/push `main` when the standing authorization in `AGENTS.md` applies,
   - otherwise set `NEEDS USER DECISION`.
12. After the authorized merge and any required verified deployment:
    - remove the task from `CURRENT_WORK.md`,
    - remove the active handoff file,
    - rely on Git history for the completed record.

A direct reviewer fix does not become independently reviewed merely because the
reviewer tested it. This shortcut is accepted only for bounded `XS` and `S`
corrections. Material reviewer-authored changes require a fresh independent
review or return to the implementation owner.

## Communication Rules

- Communicate evidence and decisions, not conversational filler.
- Each unresolved finding gets a stable ID such as `F-001`.
- Record the finding author in `Raised by` and the responding agent or human in
  `Response by`.
- Responses reference the finding ID and the fixing commit.
- Either agent may challenge the other's conclusion.
- Do not mark a finding resolved without verification.
- Do not claim a push, merge or deployment without checking it.
- Use `NEEDS USER DECISION` only for a real product, authority or external-state
  decision that agents cannot resolve safely.
- Never put secrets, credentials, environment values, API keys, resume content
  or other personal data in a handoff.

## Challenge and Risk Protocol

Reviewer role does not make Codex automatically correct. Implementation
ownership does not make Gemini's success claim proof.

For each material finding, record:

- evidence or reproduction,
- concrete impact,
- realistic likelihood,
- affected data/users or blast radius,
- relative fix effort.

Likelihood:

- `Low`: requires unusual timing, knowledge or conditions.
- `Medium`: plausible in normal or moderately adversarial use.
- `High`: likely in ordinary use or easily triggered.

Relative effort:

- `XS`: local, obvious change with focused verification.
- `S`: small multi-file fix or focused test work.
- `M`: cross-layer change requiring broader verification.
- `L`: architectural, migration-heavy or multi-day work.

Finding response status:

- `ACCEPTED`
- `DISPUTED`
- `FIXED`
- `DEFERRED`
- `VERIFIED`
- `WITHDRAWN`

A `DISPUTED` response includes counter-evidence, not preference. Codex
reproduces or checks that evidence and then confirms, downgrades or withdraws
the finding.

Risk decisions consider impact × realistic likelihood × blast radius in
relation to fix effort. Low-impact theoretical abuse is not automatically a
release blocker. Serious authorization, privacy, billing, secret, migration or
data-loss impact is not dismissed merely because few attackers are expected.

## Branch Rule

The handoff file travels with the candidate branch. A message is not delivered
until it is committed and pushed.

If the candidate branch and handoff disagree, verified Git state wins.
