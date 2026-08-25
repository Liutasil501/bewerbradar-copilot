# BewerbRadar Copilot - Current Work

Last updated: 14 August 2026

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
- `DEPLOYING - NOT YET VERIFIED`
- `VERIFIED LIVE`
- `NEEDS USER DECISION`
- `BLOCKED`

`VERIFIED LIVE` follows the production proof requirements in `AGENTS.md` and
`DEPLOYMENT.md`.

## Active Work

### CW-2026-08-25-GA4-EVENT-TRANSPORT

- Status: `READY TO DEPLOY`
- Goal: Restore consented BewerbRadar product-event delivery to the correct GA4
  property without weakening consent or privacy filtering.
- Implementation owner: Codex
- Reviewer: independent Codex subagent
- Current owner: Codex
- Next recipient: Codex for source publication, deployment and live verification
- Branch: `fix/ga4-event-transport`
- Base commit: `86c495f79`
- Implementation commit: `2a6c7975fd8efb4fe12de78d1c34cfb692adaae0`
- Review result: `GO` for candidate `a848dc3f7`
- Handoff file:
  `docs/agent-handoffs/CW-2026-08-25-GA4-EVENT-TRANSPORT.md`
- Deployment status: `NOT DEPLOYED`

In scope:

- route bounded product events explicitly to `G-6XRD25H13C`,
- preserve the existing consent gate and property allowlists,
- cover the fallback data-layer queue, denied, absent and outdated consent,
  explicit routing and property stripping with focused tests,
- independently review the exact candidate,
- deploy only after approval and verify real event receipt.

Out of scope:

- changing event names or commercial funnel semantics,
- weakening Consent Mode or advertising restrictions,
- adding GTM event tags that could duplicate delivery,
- sending synthetic activation or purchase events to production.

### CW-2026-08-14-PHASE8-TECHNICAL-SEO

- Status: `VERIFIED LIVE`
- Goal: Establish a complete Technical SEO Foundation across metadataBase, canonicals, hreflang, dynamic sitemap.xml, robots.txt, strict noindex for private areas, OpenGraph/Twitter card assets and persuasive localized German/English metadata without generic placeholders.
- Implementation owner: Gemini
- Reviewer: Codex
- Current owner: none
- Next recipient: Phase 8 Search Console and analytics closure
- Branch: `main`
- Base commit: `6e6eb06ab7096b05f5d5c00b9dca54d5a7bcb8c0`
- Review result: `GO` after independent final review. `F-801` through `F-807` are verified closed; Codex directly corrected the remaining `F-805` session race, completed the bilingual `F-806` social image, fixed the HTTP verifier process leak, and removed an unrelated machine-specific push helper in commit `6e8aa74`.
- Handoff file:
  `docs/agent-handoffs/CW-2026-08-14-PHASE8-TECHNICAL-SEO.md`
- Production application commit: `164022a9276fec46158b71f00597f76c5d0177d0`
- Deployment status: `VERIFIED LIVE` on 15 August 2026. The VPS repository, container, public application, SEO endpoints and focused logs were verified after deployment. The authoritative deployed repository SHA is the current `copilot/main` head containing this verification record.

In scope:

- localized German and English metadata without generic placeholders,
- explicit `metadataBase` (`https://copilot.bewerbradar.de`),
- self-referencing canonicals and bidirectional hreflang for `de`, `en`, and `x-default`,
- dynamic `sitemap.xml` with only verified public indexable pages,
- dynamic `robots.txt` disallowing all private paths,
- strict `noindex, nofollow` on private layouts and routes,
- dynamic OpenGraph and Twitter image generators and metadata,
- semantic locale-correct `<html lang>` handling for German and English,
  backups/alerts.
- Implementation owner: Codex
- Reviewer: Gemini
- Current owner: Codex
- Next recipient: Codex
- Branch: `main`
- Base commit: `ba142a4f59a56f49af9cc836fe12b9a2b528c804`
- Implementation commit: `967091a4dc52bd067773cc7be6abc8d0e89e708c`
- Review commit: `22e58d63fd089fd4ed1331c74664f6527b29d139`
- Review result: `GO` for source publication after independent final review
- Handoff file:
  `docs/agent-handoffs/CW-2026-08-13-PHASE7-LAUNCH-CLOSURE.md`
- Deployment status: `VERIFIED LIVE` (Deployed on 14 August 2026 from `main` commit `6e6eb06ab`)

In scope:

- verify the complete GTM/GA4 consent and event path,
- close Stripe Checkout terms, withdrawal presentation and tax-safe runtime
  configuration without inventing a tax registration,
- centralize Free, Pro, Premium and BYOK AI access rules plus a realistic
  server-funded abuse guard,
- establish recoverable production-data backups and minimal health alerting,
- update durable product, architecture and deployment documentation.

Out of scope:

- legal or tax advice,
- creating a tax registration or business registration,
- changing plan prices,
- charging a real payment method during verification,
- production deployment without separate authorization.

T-shirt sizes:

- P7.1 GA4/GTM verification: `S`
- P7.2 Stripe checkout, terms, tax and withdrawal: `M`
- P7.3 Entitlements and AI cost logic: `M`
- P7.4 Backups and minimum production alerts: `M`

Open decision boundary:

- Stripe automatic tax remains disabled until a real collecting registration
  and the applicable product tax code are confirmed. The code may expose a
  fail-closed environment switch, but must not imply tax collection without
  that external state.

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

- Status: `COMPLETED`
- Goal: Establish a coherent premium visual foundation and rebuild the login
  and paywall experience so that the product communicates value clearly and
  remains usable across German, English, desktop and mobile layouts.
- Implementation owner: Codex for P5.1
- Reviewer: Gemini for independent review
- Current owner: none
- Next recipient: Phase 5.2 implementation owner
- Release branch: `main`
- Integration branch: `beta`
- Base commit: `04ad9b842`
- Candidate commit: `59a298cbc`
- Handoff file:
  `docs/agent-handoffs/CW-2026-08-03-PHASE5-PRODUCT-EXPERIENCE.md`
- Review result: `GO` for candidate `59a298cbc` (All 8 focus areas verified, 20/20 billing tests pass, build 25/25 pages static generation)
- Release commit: the `copilot/main` head containing the synchronized production
  verification in this file
- Deployment authorization: explicitly granted by the user on 3 August 2026
- Deployment status: `VERIFIED LIVE`

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

### CW-2026-08-03-PHASE5-2-AUTHENTICATED-QA

- Status: `READY TO DEPLOY`
- Goal: Give agents a safe real-product view behind login and use it to remove
  confirmed responsive, conversion and entitlement defects before broader
  Phase 5.2 work.
- Implementation owner: Codex
- Reviewer: Gemini for independent final review
- Current owner: Codex after explicit deployment authorization
- Next recipient: Codex after explicit deployment authorization
- Branch: `beta`
- Base commit: `cf84998966c40356fb4fce7f573329f722e4091b`
- Implementation commit: `b037d3bc0`
- Reviewed candidate head: `be6bfeaa479330cdaeeb02bd6474903dae14b8a1`
- Gemini review commits: `db681ded2`, `6e901c28c`
- Main publication: verified on `copilot/main`; the authoritative release SHA
  is the current remote main head containing this status update.
- Handoff file:
  `docs/agent-handoffs/CW-2026-08-03-PHASE5-2-AUTHENTICATED-QA.md`
- Production impact: Development-only authenticated QA harness, first funded
  Free AI import, narrow-mobile dashboard actions, paywall CTA alignment and
  safer deterministic deployment.
- Review result: `GO` for candidate `be6bfeaa` after Gemini review and Codex
  verification of the review commits. All 14 checklist items verified, 24/24
  billing tests passed, production build passed, QA routes returned 404 in the
  production runtime and QA database isolation was verified.
- Release gate: Completed user-state release matrix for free-fresh, free-used, pro, premium, byok.
- Deployment required: yes for the user-facing and entitlement corrections,
  only after independent review, main publication and explicit authorization.
- Deployment status: `NOT DEPLOYED`

In scope:

- deterministic local Free, Pro, Premium and BYOK user states,
- production hard-disable of all QA endpoints,
- actual first Free AI import despite the automatic sample resume,
- 320 px dashboard overflow and accessible icon actions,
- desktop paywall CTA alignment,
- exact-SHA, fail-fast release helper and build-context improvements,
- browser, entitlement, type, lint, unit and production-build verification.

Out of scope:

- real Google OAuth callback verification,
- live Stripe checkout or webhook execution,
- real AI provider calls from the dummy BYOK state,
- production deployment,
- the broader editor, navigation and interview redesign still planned for
  later Phase 5.2 slices.

T-shirt size: `M`

Success signal:

- a new agent can reach and inspect authenticated product states without
  production credentials or data,
- the advertised first AI import reaches the import dialog and server access
  path,
- no horizontal overflow at 320 px on the corrected dashboard and paywall,
- production QA routes remain `404`,
- releases cannot silently deploy the wrong branch or commit.
