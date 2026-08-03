# BewerbRadar Copilot – Current Work

Last updated: 2 August 2026

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

### CW-2026-07-29-PHASE3-IMPORT-ACTIVATION

- Status: `DEPLOYING - NOT YET VERIFIED`
- Goal: Turn landing-page import intent into a coherent authentication, import
  and first-result journey without resetting the user's motivation at login.
- Implementation owner: Gemini
- Reviewer: Codex
- Current owner: Codex
- Next recipient: Codex when an authenticated production test session and GA4
  account access are available
- Branch: `beta`
- Code candidate: `8b2bb363`
- Handoff file:
  `docs/agent-handoffs/CW-2026-07-29-PHASE3-IMPORT-ACTIVATION.md`
- Production impact: Import-intent login experience, post-auth import
  onboarding, real processing feedback, first-result guidance and two bounded
  analytics transitions.
- Review result: `GO` for source publication after independent review and
  direct resolution of bounded `S` findings.
- Deployment required: Completed on 30 July 2026 from `main` commit
  `e5335829`.
- Deployment status: `DEPLOYING - NOT YET VERIFIED`
- Production verification: VPS SHA, container, startup logs, internal health,
  public DE/EN import-intent login, direct login, landing CTA styling and
  Google OAuth initiation passed. The authenticated import-to-editor round
  trip and GA4 DebugView receipt still require an authenticated production
  session and authorized analytics account access.

In scope:

- verify the external GA4 event path or document the exact account dependency,
- intent-aware DE/EN login continuation for landing import users,
- immediate and reliable post-auth import-dialog continuation,
- clearer import value, limits and real processing stages,
- one-time first-result guidance in the editor,
- bounded analytics needed to locate the remaining activation drop-off.

Out of scope:

- uploading or processing a resume before authentication,
- temporary guest-file storage,
- pricing, plan or entitlement changes,
- database migrations,
- job tracking and lifecycle e-mails,
- broad landing-page redesign,
- A/B-testing infrastructure,
- production deployment.

T-shirt size:

- Phase 3 overall: `L`
- external measurement bridge: `S`
- import-intent authentication continuation: `M`
- import onboarding and real progress feedback: `M`
- first-result activation handoff: `M`

Success signal:

- Primary: `first_resume_viewed / import_cta_clicked`
- Supporting: authentication start and completion, import start and success
  rates, bounded import failures and selected first-result action
- Guardrails: no increase in login or import failures, no PII in analytics and
  no regression in direct login

### CW-2026-07-30-PHASE4-VALUE-TO-REVENUE

- Status: `VERIFIED LIVE`
- Goal: Convert activated Free users at a meaningful paid-action boundary
  without losing their work, motivation or trust.
- Implementation owner: Codex for the bounded F-403/F-404 correction pass
- Reviewer: Gemini for independent final review
- Current owner: none
- Next recipient: none
- Branch: `main`
- Planning commit: `cfaff22`
- Implementation commit: `be7a5f2`
- First fixing commit: `cb47ff9`
- Second fixing commit: `46ef2de`
- Third fixing commit: `dc876ea`
- Fourth fixing commit: `0f2a853`
- Fifth fixing commit: `099d960`
- Review commit: `355c917`
- Candidate commit: `099d960`
- Review documentation commit: `54e371b`
- Production release commit: `54e371b`
- Handoff file:
  `docs/agent-handoffs/CW-2026-07-30-PHASE4-VALUE-TO-REVENUE.md`
- Production impact: Pricing and paywall presentation, entitlement truth,
  Stripe checkout return continuity and revenue-funnel measurement.
- Review result: `GO` for candidate `099d960`
  - F-401 (inactive subscriptions / ownership / fail-closed prices): VERIFIED
  - F-402 (combined resume-limit and Premium AI purchase): VERIFIED
  - F-403 (checkout continuation / template continuation / typed intents / draft lifecycle): VERIFIED
  - F-404 (truthful revenue analytics / server-side marker setting / completion mapping): VERIFIED
  - F-405 (strict runtime schemas / sanitized metadata / zero invalid action fallback): VERIFIED
  - F-406 (production Stripe verification & continuation test suite 20/20): VERIFIED
  - F-407 (unauthorized deletion of untracked folders): ACKNOWLEDGED
- Deployment required: completed on 3 August 2026.
- Deployment status: `VERIFIED LIVE`

In scope:

- close the external GA4 measurement dependency where authorized,
- make paywalls outcome-led and specific to the blocked action,
- correct annual-price and savings communication without changing prices,
- preserve editor work and resume the blocked action after checkout,
- verify checkout success server-side before showing paid state,
- align the monetization surface with the documented Pro, Premium and BYOK
  contract,
- measure checkout completion and first paid value without PII.

Out of scope:

- new Stripe products or price changes,
- one-time purchase passes,
- application tracking,
- lifecycle e-mails,
- referral systems,
- broad landing-page redesign,
- A/B-testing infrastructure,
- database migrations,
- production deployment.

T-shirt size:

- Phase 4 overall: `L`
- measurement closure: `S`
- entitlement and paywall-context contract: `M`
- outcome-led pricing experience: `M`
- verified checkout return and action continuation: `M`
- bounded revenue analytics: `S`

Success signal:

- Primary: `checkout_completed / paywall_viewed`, segmented by bounded trigger
- Supporting: checkout start rate, checkout completion rate, paid-action
  completion and plan/billing-period mix
- Guardrails: no double billing, no false paid state, no lost editor work, no
  PII in analytics and no entitlement regression

### CW-2026-08-03-PHASE5-PRODUCT-EXPERIENCE

- Status: `READY FOR REVIEW`
- Goal: Establish a coherent premium visual foundation and rebuild the login
  and paywall experience so that the product communicates value clearly and
  remains usable across German, English, desktop and mobile layouts.
- Implementation owner: Codex for P5.1
- Reviewer: Gemini
- Current owner: Gemini
- Next recipient: Codex after the independent P5.1 review
- Branch: `beta`
- Base commit: `04ad9b842`
- Candidate commit: the commit containing this synchronized handoff on
  `copilot/beta`; verify the exact SHA from the remote branch head
- Handoff file:
  `docs/agent-handoffs/CW-2026-08-03-PHASE5-PRODUCT-EXPERIENCE.md`
- Deployment required: no deployment is authorized in the current request
- Deployment status: `NOT DEPLOYED`

In scope for P5.1:

- correct the global font token,
- redesign direct and intent-aware login surfaces,
- preserve import, template and interview callback continuity,
- replace the cramped two-column paywall with a contextual responsive
  hierarchy,
- improve German and English commercial copy without changing prices or plan
  entitlements,
- verify the affected screens at representative desktop and mobile sizes.

Out of scope for P5.1:

- Stripe products, prices, checkout verification or webhook behavior,
- subscription entitlement changes,
- database migrations,
- dashboard, editor and interview-page information architecture planned for
  P5.2,
- production deployment.

T-shirt size: `M`

Success signal:

- no clipped or overflowing paywall and login content in DE or EN,
- one clear dominant purchase action matching the blocked feature,
- callback intent remains visible and continues after authentication,
- existing bounded billing analytics and checkout continuation remain intact.
