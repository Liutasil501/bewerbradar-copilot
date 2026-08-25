# Agent Handoff - CW-2026-08-25-GA4-EVENT-TRANSPORT

Last updated: 25 August 2026

## Coordination

- Task ID: `CW-2026-08-25-GA4-EVENT-TRANSPORT`
- Status: `READY FOR REVIEW`
- Current owner: independent reviewer
- Next recipient: Codex
- Implementation owner: Codex
- Reviewer: independent Codex subagent
- Branch: `fix/ga4-event-transport`
- Base branch and commit: `main` at `86c495f79`
- Implementation commit under review:
  `2a6c7975fd8efb4fe12de78d1c34cfb692adaae0`
- `CURRENT_WORK.md` synchronized: yes

## Goal

Restore delivery of consented BewerbRadar product events to the correct GA4
property while preserving the existing consent gate, privacy allowlists and
advertising-consent restrictions.

## Scope

In scope:

- add explicit GA4 destination routing to every bounded product event,
- keep denied, absent and outdated consent fail-closed,
- extend focused tests for the real fallback queue shape and privacy filtering,
- verify the production build and live receipt after deployment.

Out of scope:

- changing event names or triggers,
- changing commercial funnel behavior,
- weakening consent,
- adding parallel GTM event tags,
- generating fake activation or purchase events in production.

## Decisions and Assumptions

- The public measurement ID is not a secret and may have a checked-in fallback.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` allows an environment-specific override.
- The existing GTM Google tag continues to own base tag initialization and page
  measurement.
- Explicit `send_to` removes reliance on an externally established default
  destination and avoids a second GA4 event-tag configuration in GTM.

## Implementation

Summary:

- Added the public GA4 destination to sanitized event parameters after the
  closed property allowlist is applied.
- Extended tests for installed and fallback `gtag`, explicit routing, denied,
  absent and outdated consent, and stripping of unexpected properties.
- Documented the environment variable and event-routing architecture.

Important files:

- `.env.example`
- `src/lib/analytics/index.ts`
- `src/lib/analytics/index.test.ts`
- `ARCHITECTURE.md`
- `PROJECT_CONTEXT.md`

## Verification

Completed:

- focused analytics tests: 5/5 passed,
- focused ESLint: passed with zero errors and warnings,
- TypeScript: passed with zero errors,
- `git diff --check`: passed,
- Next.js production build: passed with all 30 routes generated.

The build emitted existing local SQLite migration and duplicate demo-seed log
noise while collecting pages. It completed successfully and this change does
not touch the database.

Pending:

- independent review of the exact committed candidate,
- source publication,
- production deployment,
- consented live receipt of real bounded events in GA4.

## Database and Environment

- Migrations: none
- New or changed variable names: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Production preparation: none required because the current public measurement
  ID remains the fallback; the environment variable is an optional override.

## Risks and Limitations

- A parallel GTM GA4 Event tag for the same event names would create duplicates.
  The current container has only the base Google tag, so no parallel tag is
  added by this candidate.
- Realtime display alone can lag. Final verification should combine the real
  browser flow with GA4 Realtime or DebugView evidence.
- Necessary-only users must continue to emit no optional product events.

## Review

- Result: `PENDING`

| ID | Raised by | Severity | Likelihood | Effort | Status | Finding and evidence | Response by | Response or fixing commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-901 | Codex | Important | High | S | FIXED | Live flow delivered GA4 base events but no bounded product events. The transport had no explicit destination. | Codex | Added explicit `send_to` and focused regression coverage. |

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-08-25 | Codex | Independent reviewer | REVIEW REQUEST | Review the exact candidate for consent, privacy, routing and duplicate-delivery risk. | `2a6c797` |

## Next Action

- Owner: independent reviewer
- Action: review the exact committed candidate and return `GO`, `CONDITIONAL GO` or `NO-GO`.
- Required before transfer: inspect the complete diff and verify focused tests.
