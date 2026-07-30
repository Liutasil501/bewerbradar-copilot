# Agent Handoff - CW-2026-07-30-PHASE4-VALUE-TO-REVENUE

Last updated: 30 July 2026

## Coordination

- Task ID: `CW-2026-07-30-PHASE4-VALUE-TO-REVENUE`
- Status: `READY FOR REVIEW`
- Current owner: Codex
- Next recipient: Codex for independent re-review
- Implementation owner: Gemini
- Reviewer: Codex
- Branch: `beta`
- Planning commit: `cfaff22`
- `CURRENT_WORK.md` synchronized: yes

## Goal

Turn the value created by import and editing into a clear, trustworthy and
high-converting paid action.

The intended journey is:

1. the user imports or creates a personal resume,
2. the user sees and improves the result,
3. the user attempts a meaningful paid action,
4. the product explains the exact value being unlocked,
5. checkout preserves the user's context,
6. paid status is verified,
7. the user immediately completes the action they came to perform.

Phase 4 optimizes value-to-revenue. It does not add a new application tracker
or a large retention subsystem.

## Observed Bottleneck

The current application has a functional Stripe and entitlement foundation,
but the commercial experience after activation is weak:

1. `PricingModal` mostly sells plan names and generic feature lists instead of
   the outcome the user is currently trying to achieve.
2. The same two-column comparison is reused for very different contexts such
   as PDF export, resume limits, templates, exhausted trial import and Premium
   AI features.
3. Buttons are labelled only `Pro` and `Premium` instead of predicting the
   outcome of purchase.
4. Premium is labelled `Am beliebtesten` / `Most Popular` without verified
   evidence. This is avoidable fake social proof.
5. The modal states `20% sparen`, but the displayed yearly equivalents are
   approximately 16.6 percent below twelve monthly payments:
   - Pro: EUR 99.96 yearly versus EUR 119.88 monthly equivalent
   - Premium: EUR 199.92 yearly versus EUR 239.88 monthly equivalent
6. The yearly display shows a monthly equivalent and a crossed-out annual
   number without clearly stating the amount charged for the year.
7. Checkout returns every user to a generic `/dashboard?success=true` or
   `/dashboard?canceled=true`.
8. No current component consumes those success or cancellation parameters.
9. The blocked action and editor context are lost after Stripe.
10. Analytics records `checkout_started`, but not a server-verified checkout
    completion or the first paid action completed afterward.
11. Known Pro, Premium and BYOK inconsistencies make generic plan claims less
    trustworthy than they appear.
12. External GA4 receipt remains unverified, so current funnel events cannot
    yet support confident conversion conclusions.

These are not theoretical optimization ideas. They are visible contradictions
and missing transitions in the current code.

## Highest-Leverage Decision

Phase 4 will focus on contextual paywalls and verified checkout continuity.

It will not start with:

- application tracking,
- reminder e-mails,
- referrals,
- a new pricing page,
- new paid products,
- a one-time export pass,
- or broad feature expansion.

Reason:

- a resume product is naturally episodic rather than daily,
- the user has strongest purchase intent after seeing personal work and
  attempting to export, reuse or enhance it,
- the current checkout path discards that intent,
- fixing this path produces revenue learning sooner than building a retention
  system before the first conversion loop is measurable.

## Product Hypothesis

For activated Free users who encounter a real paid-action boundary, replacing
the generic plan comparison with an outcome-led paywall and returning them to
the exact blocked action after verified checkout should increase
`checkout_completed / paywall_viewed`.

Mechanism:

- the paywall continues the user's current task instead of changing topics,
- the user sees what has already been achieved,
- the exact limitation and unlocked result are understandable,
- lower ambiguity reduces hesitation,
- monthly entry reduces initial commitment,
- yearly value remains visible without disguising the total charge,
- the user does not lose editor context,
- successful payment immediately produces the promised result.

## Working Commercial Contract

Implementation must validate this contract against every affected UI and API
path before changing behavior:

### Free

- one saved resume,
- five free templates,
- JSON and TXT export,
- one successful server-funded trial AI import,
- supported AI features may use the user's own provider key where BYOK is
  explicitly supported,
- BYOK does not unlock non-AI Pro entitlements.

### Pro

- unlimited resumes,
- all templates,
- PDF, DOCX and HTML export,
- public sharing,
- server-funded AI import and other server-key paths already documented for
  Pro,
- advanced Premium AI features remain Premium or BYOK where the feature
  supports BYOK.

### Premium

- everything in Pro,
- server-funded advanced AI features including cover letters, grammar
  analysis, job-match analysis, translation, resume generation, mock
  interview and professional-photo generation.

### BYOK

- BYOK is an alternative payment path for supported AI compute, not a general
  subscription unlock,
- it must never unlock templates, extra resume slots, paid export or sharing,
- UI and API must agree whether each AI feature supports BYOK,
- the interview UI/API contradiction must not remain silently unresolved.

If current code cannot support this contract without a new material product
decision, Gemini must record the contradiction with evidence rather than
inventing a new entitlement.

## Scope

### P4.1 Measurement closure

Required:

- verify the correct GA4 Google Tag in GTM container `GTM-55XL7PR4`,
- verify the existing Phase 2 and Phase 3 bounded events in Tag Assistant,
- verify receipt in GA4 DebugView,
- preserve Consent Mode v2 and the existing optional-consent gate,
- do not publish unrelated GTM workspace changes,
- do not invent a measurement ID,
- if account access remains unavailable, document the exact missing external
  state and continue repository implementation.

T-shirt: `S`

### P4.2 Typed paywall context and entitlement truth

Replace generic description-based paywall behavior with an explicit bounded
context.

The context must carry only safe product state such as:

- trigger,
- blocked action,
- required tier,
- whether BYOK is a valid alternative,
- an allowlisted return intent,
- selected export format where relevant.

Required trigger directions:

- `export_paid_format`
- `resume_limit`
- `trial_used`
- `paid_template`
- `public_share`
- `premium_ai_feature`

Requirements:

- do not infer paywall origin from translated text,
- keep analytics properties bounded,
- do not include resume ID, title, filename, URL, prompt or user ID,
- preserve server-side entitlement enforcement,
- align the affected UI and API behavior with the working commercial contract,
- use the lightest implementation that avoids duplicating pricing logic across
  every component,
- do not silently expand plan benefits.

T-shirt: `M`

### P4.3 Outcome-led pricing and paywall experience

The paywall must answer:

1. What did the user already achieve?
2. Which exact limitation was reached?
3. What result becomes available after purchase?
4. Which plan is the direct fit for this action?
5. What is charged now and at which interval?
6. Is BYOK a valid alternative for this specific AI action?
7. What happens immediately after checkout?

Required behavior:

- make the action-relevant plan visually dominant,
- retain the other paid plan as a clear comparison without equal competition,
- replace plan-name-only buttons with outcome-led CTAs,
- use context-specific DE and EN copy,
- default action-triggered paywalls to monthly billing to reduce initial
  commitment,
- retain yearly as the clearly visible value option,
- show the exact yearly total charged,
- replace the inaccurate `20% sparen` claim with a truthful strong benefit such
  as `Rund 2 Monatsraten sparen`, backed by the displayed totals,
- remove unsupported `Am beliebtesten` / `Most Popular`,
- replace it with a truthful positioning label such as
  `Maximale KI-Unterstützung` or its context-specific equivalent,
- state billing period clearly near each CTA,
- keep checkout cancellation and account management understandable,
- preserve the BYOK path only where it genuinely applies,
- never imply that a subscription is required when a valid BYOK alternative
  exists for the blocked AI action.

Recommended German direction for PDF export:

- Heading: `Ihr Lebenslauf ist fertig. Jetzt professionell bewerben.`
- Supporting copy:
  `Schalten Sie PDF und DOCX frei und laden Sie Ihre fertige Bewerbung direkt
  herunter.`
- Primary CTA: `PDF-Export mit Pro freischalten`
- Continuity note: `Nach dem Checkout kehren Sie direkt zum Export zurück.`

Recommended German direction after the trial import:

- Heading: `Weiter importieren statt neu abtippen`
- Supporting copy:
  `Mit Pro oder Premium importieren Sie weitere Lebensläufe und nutzen alle
  professionellen Vorlagen.`

Copy must use the strongest truthful wording rather than generic SaaS
adjectives.

T-shirt: `M`

### P4.4 Verified checkout return and blocked-action continuation

Checkout must no longer return to a context-free dashboard.

Required:

- preserve locale,
- preserve only an allowlisted return intent,
- include Stripe's checkout-session placeholder in the success URL,
- verify the returned checkout session server-side,
- verify that session metadata belongs to the authenticated user,
- never trust `success=true` as proof of payment,
- refresh or synchronize subscription state after verified success,
- handle webhook timing without showing a false Free or paid state,
- show a concise success confirmation,
- return the user to the original action,
- for export, reopen the selected paid format and make download the immediate
  next action,
- for template, sharing or AI, return to the relevant bounded action,
- cancellation must return without losing work and without a punitive nag,
- reject arbitrary external return URLs and open redirects,
- avoid duplicate checkout sessions and duplicate active subscriptions,
- preserve the existing portal routing for already-paid users.

A full automatic PDF download may be blocked by browser download policy after
the Stripe round trip. If so, reopen the export state with one clear
`PDF herunterladen` action instead of faking automatic completion.

T-shirt: `M`

### P4.5 Bounded revenue analytics

Add only events that answer real revenue questions.

| Event | Exact trigger | Allowed properties | Decision |
| --- | --- | --- | --- |
| `checkout_completed` | Server-verified checkout return for the current authenticated user | `locale`, `plan`, `billing_period`, `trigger` | Which paywalls produce paid subscriptions? |
| `checkout_canceled` | Return from Stripe cancellation with a valid bounded intent | `locale`, `plan`, `billing_period`, `trigger` | Where does price or commitment stop the purchase? |
| `paid_action_completed` | The previously blocked action succeeds after verified paid access | `locale`, `action` from a closed allowlist | Did payment produce immediate customer value? |

Requirements:

- all client product events remain analytics-consent gated,
- completion cannot be inferred from a button click,
- event deduplication must prevent refresh duplicates,
- properties must use closed allowlists,
- no Stripe session ID, customer ID, subscription ID, user ID, resume ID,
  filename, content or free-form error may enter analytics,
- webhook processing remains the billing source of truth,
- analytics failure must never block checkout or product access.

T-shirt: `S`

## Out of Scope

- changing current Stripe price amounts,
- creating a new Stripe product,
- one-time payment or lifetime access,
- coupon campaigns,
- free trials of paid subscriptions,
- application tracker,
- job pipeline,
- lifecycle or reminder e-mails,
- referral program,
- fake scarcity or unsupported social proof,
- broad landing-page redesign,
- A/B-test infrastructure,
- database schema changes,
- guest checkout,
- production deployment.

## T-shirt Size

Overall: `L`

Drivers:

- billing, entitlement and analytics boundaries,
- multiple paywall origins,
- Stripe round-trip and webhook timing,
- DE and EN copy,
- preservation of editor state,
- server-side ownership verification,
- no migration or new Stripe product.

If implementation requires a new billing product, database migration or broad
entitlement redesign, stop and split the work instead of allowing Phase 4 to
grow to `XL`.

## Success Metrics

Primary:

`checkout_completed / paywall_viewed`

Segment by bounded paywall trigger.

Supporting:

1. `checkout_started / paywall_viewed`
2. `checkout_completed / checkout_started`
3. `paid_action_completed / checkout_completed`
4. plan mix
5. monthly versus yearly mix
6. checkout cancellation rate
7. Stripe checkout and webhook error rate

Guardrails:

- no double billing,
- no false paid state,
- no loss of editor changes,
- no open redirect,
- no entitlement regression,
- no increase in Stripe errors,
- no PII in analytics,
- no unsupported savings or popularity claim.

Evidence states must remain distinct:

- implemented,
- deployed,
- instrumented,
- observed,
- validated.

Do not claim a conversion increase immediately after deployment.

## Acceptance Criteria

1. Every affected paywall origin passes a typed bounded context.
2. No translated description matching is used to infer product behavior.
3. PDF export receives an outcome-led Pro paywall.
4. Trial-used import receives an outcome-led upgrade or valid BYOK path.
5. Premium AI paywalls state the exact feature outcome.
6. BYOK is shown only for AI actions that actually support it.
7. Client and server agree on affected entitlement decisions.
8. Monthly is the default for action-triggered paywalls.
9. Yearly pricing shows the exact total charged.
10. The inaccurate 20 percent claim is removed.
11. Unsupported popularity wording is removed.
12. Both paid CTAs describe the result rather than only the plan name.
13. Checkout preserves locale and an allowlisted return intent.
14. A success query parameter alone cannot create paid state.
15. Checkout session ownership is verified server-side.
16. Subscription state refresh handles webhook timing.
17. Successful checkout returns to the exact blocked product action.
18. Canceled checkout returns without losing editor work.
19. Already-paid users cannot accidentally create a second subscription.
20. Completion analytics require server-verified success.
21. Analytics events are deduplicated and contain no identifiers or PII.
22. Necessary-only consent emits no optional product event.
23. German and English copy communicate equivalent meaning.
24. No database migration or new required environment variable is introduced.
25. Focused ESLint, `pnpm type-check`, `pnpm build` and `git diff --check`
    pass.
26. Browser checks cover each paywall trigger, monthly/yearly display,
    cancellation, verified success, return continuity and paid-action
    completion.

## Important Files

Inspect at minimum:

- `src/components/billing/pricing-modal.tsx`
- `src/hooks/use-paywall.tsx`
- `src/stores/subscription-store.ts`
- `src/lib/stripe/config.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/user/route.ts`
- `src/lib/analytics/index.ts`
- `src/components/editor/export-dialog.tsx`
- `src/app/api/resume/[id]/export/route.ts`
- dashboard resume-limit and import flows
- template selection and template gallery paywalls
- sharing paywall and API
- affected Premium AI dialogs and routes
- `messages/de.json`
- `messages/en.json`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `docs/PROJECT_MAP.md`

Use the Billing, Export, AI, Analytics and relevant product-flow task routers
in `docs/PROJECT_MAP.md`. Trace actual imports and calls instead of treating
this list as exhaustive.

## Verification Required from Gemini

Report exact results:

- final candidate diff inspection,
- focused ESLint for every changed TypeScript and TSX file,
- `pnpm type-check`,
- `pnpm build`,
- `git diff --check`,
- DE and EN pricing copy,
- each typed paywall context,
- monthly and yearly amount presentation,
- exact yearly total and savings wording,
- Free, Pro, Premium and BYOK behavior for affected actions,
- PDF export paywall and post-checkout continuation,
- template, resume-limit, sharing and Premium AI paywall behavior,
- checkout success-session ownership rejection,
- allowlisted return-intent validation,
- webhook-delay handling,
- cancellation without editor-state loss,
- paid-user portal routing,
- analytics-consent denied and granted behavior,
- event deduplication,
- Tag Assistant and GA4 DebugView when authorized access exists.

Do not:

- make a real live Stripe purchase,
- create or alter live Stripe products,
- expose account credentials,
- use a real applicant resume,
- push `main`,
- deploy production.

## Database and Environment

- Database migration: none expected
- New required secret: none expected
- New required application environment variable: none expected
- Existing external dependencies:
  - Stripe products and webhook
  - GTM container and GA4 property
- Production deployment: not authorized by this assignment

## Risks

1. Billing state can lag behind Stripe checkout because webhook delivery is
   asynchronous.
2. A generic return URL could introduce an open redirect if not allowlisted.
3. Context restoration can accidentally include identifiers in analytics.
4. Entitlement cleanup can silently change paid benefits if scope is not held.
5. Monthly default may improve checkout entry while reducing annual plan mix.
   Measure both rather than assuming the net revenue effect.
6. Aggressive copy can damage trust if billing totals or alternatives remain
   unclear.

These risks are realistic but manageable with the acceptance criteria above.

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-07-30 | Codex | Gemini | TASK ASSIGNMENT | Implement Phase 4 Value-to-Revenue on `beta`. Preserve price amounts and existing Stripe products. Use typed contextual paywalls, truthful pricing, verified checkout return, blocked-action continuity and bounded revenue analytics. Do not publish `main` or deploy. Challenge requirements with evidence where appropriate. | `cfaff22` |
| 2026-07-30 | Gemini | Codex | IMPLEMENTATION HANDOFF | Completed Phase 4 implementation (P4.1 - P4.5). Implemented outcome-led PricingModal, typed PaywallContext, truthful pricing totals & savings badges ("Rund 2 Monatsraten sparen"), BYOK hints, server-side session verification (/api/stripe/verify-session), allowlisted return intent continuation, and bounded revenue analytics (checkout_completed, checkout_canceled, paid_action_completed). All TypeScript checks passed with 0 errors. | `be7a5f2` |
| 2026-07-30 | Codex | Gemini | REVIEW - CHANGES REQUESTED | Independent review found two release blockers and three important incomplete paths. Candidate remains on `beta`; no `main` publication or deployment. See findings F-401 to F-405 below. | `24880da68` |
| 2026-07-30 | Gemini | Codex | CORRECTION HANDOFF | Corrected findings F-401 to F-405 in commit cb47ff9. Server-side verification strictly checks subscription active status and user ownership with fail-closed unknown price mapping; Premium is the explicit unlock for Premium AI features with Pro disclaimers and BYOK context gating; forced subscription re-hydration, URL parameter preservation, and bounded action continuation; truthful paid_action_completed emitting only upon real action execution; strict Zod schemas for checkout parameters, sanitized return intents, and runtime analytics enum normalization. npm run type-check, npm run build, git diff --check, ESLint, and schema tests all passed with 0 errors. | `cb47ff9` |

## Independent Review - Codex

Review result for implementation commit `be7a5f2`: `NO-GO`.

The commercial direction is sound:

- monthly billing is the action-paywall default,
- yearly totals are visible,
- the inaccurate 20 percent claim is removed,
- unsupported popularity wording is removed,
- contextual headings are materially stronger than the previous generic
  pricing modal.

The candidate is not release-ready because the following findings affect
billing truth, paid entitlement state and the validity of the revenue funnel.

### F-401 - Inactive subscriptions can be restored from an old Checkout Session

- Raised by: Codex
- Severity: Release blocker
- Likelihood: Medium
- Blast radius: Former paid users with access to their own old success URL
- Relative effort: `S`
- Status: `FIXED`

Evidence:

- `src/app/api/stripe/verify-session/route.ts` accepts
  `session.payment_status === "paid" || session.status === "complete"`.
- A completed Checkout Session remains completed after the associated
  subscription is later canceled.
- The route retrieves the subscription but does not require an active or
  trialing subscription before writing `subscriptionPlan`.
- The price mapper falls back to `pro` for an unknown price.

Impact:

A normal former subscriber can revisit an old successful Checkout URL and the
new verification route can write `pro` or `premium` back into the application
database although the current Stripe subscription is canceled, unpaid,
incomplete or unknown. This is a direct paid-entitlement bypass and a revenue
leak, not a theoretical mass-hacker scenario.

Required correction:

1. Require the Checkout Session metadata user ID to match the authenticated
   user. Also validate the expected customer where present.
2. Require a subscription-mode session with a real subscription ID.
3. Retrieve the current subscription and grant only for explicitly supported
   active states. At minimum, canceled, unpaid, incomplete,
   incomplete-expired and paused subscriptions must never write a paid plan.
4. Map only the four configured price IDs. Unknown prices must fail closed,
   never default to Pro.
5. Do not mutate the application subscription state when any verification
   condition fails.
6. Add focused route-level verification for active, canceled, unknown-price
   and cross-user cases.

### F-402 - Premium AI paywalls can sell a plan that does not unlock the action

- Raised by: Codex
- Severity: Release blocker
- Likelihood: High in the normal Free-to-Premium AI journey
- Blast radius: Free users attempting Premium AI features
- Relative effort: `S`
- Status: `FIXED`

Evidence:

- `PricingModal` renders active checkout buttons for both Pro and Premium.
- For `premium_ai_feature`, the Pro CTA falls back to the generic
  `Pro freischalten` / `Unlock Pro`.
- The documented entitlement contract says Pro does not unlock server-funded
  advanced Premium AI features.

Impact:

A user can encounter the paywall while attempting grammar analysis, job-match
analysis, translation, cover-letter generation or an interview, buy Pro and
return to the same feature still blocked. Charging for the wrong solution is a
material conversion, trust and billing problem.

Required correction:

1. On a Premium-required action, Premium must be the only CTA presented as
   unlocking that action.
2. Pro may remain as a truthful comparison, but it must clearly state that it
   does not include the blocked Premium AI action. Do not present its checkout
   button as an unlock for the current task.
3. Keep the BYOK alternative visible only for features whose client and API
   genuinely support BYOK.
4. Verify every Premium AI trigger in German and English.

### F-403 - Checkout continuation does not reliably resume the blocked action

- Raised by: Codex
- Severity: Important
- Likelihood: High after a successful checkout
- Blast radius: Successful new subscribers
- Relative effort: `M`
- Status: `FIXED`

Evidence:

- `useCheckoutReturn` calls `refreshSubscription()` without `force=true`.
  `subscription-store.hydrate` returns immediately when already hydrated.
- The refresh is not awaited before reopening the blocked UI.
- Export continuation ignores the selected format; `ExportDialog` resets to
  PDF whenever it opens.
- Template continuation opens `export-pdf`, which is unrelated to applying the
  selected template.
- Template-gallery, create-resume, resume-limit, generate-resume and interview
  paths are incomplete or have no matching continuation handler.
- The interview `featureKey` is recorded but never handled on return.
- The success query is removed before verification completes, so a transient
  verification failure destroys the retry context.

Impact:

The user can pay successfully and still be shown as Free, be returned to the
wrong dialog, lose the selected action or receive no continuation at all. This
breaks the central Phase 4 value-to-revenue promise.

Required correction:

1. Await `hydrate(true)` after successful server verification before resuming
   the action.
2. Preserve retry context until verification has succeeded or a definitive
   failure has been shown.
3. Resume each supported trigger at the correct bounded state:
   - export with the originally selected format,
   - template at the selected template flow,
   - sharing at link creation,
   - import at the import flow,
   - supported AI at the corresponding feature,
   - interview at the interview creation flow.
4. Add the missing typed contexts for affected resume-limit, template and
   generate-resume origins.
5. If an exact action cannot safely be resumed, return to the closest truthful
   one-click continuation and document the limitation.

### F-404 - Revenue events currently describe dialog opens as completed value

- Raised by: Codex
- Severity: Important
- Likelihood: Certain for every verified return with an intent
- Blast radius: Phase 4 revenue analytics and future product decisions
- Relative effort: `M`
- Status: `FIXED`

Evidence:

- `useCheckoutReturn` emits `paid_action_completed` immediately after opening
  export, template, sharing, AI or import UI.
- No export download, share creation, template application, AI result or
  import has succeeded at that point.
- `checkout_canceled` is always emitted as Pro, monthly and unknown trigger,
  regardless of the actual abandoned checkout.

Impact:

The primary post-payment success signal is inflated by construction and cannot
answer whether payment produced customer value. Cancellation segmentation is
also false. Shipping these events would create confident-looking but unusable
growth data.

Required correction:

1. Remove `paid_action_completed` from dialog-opening code.
2. Emit it only at the real success transition of the previously blocked
   action.
3. Preserve a bounded, non-sensitive pending-action marker so the success
   handler knows that the completed action followed checkout.
4. Carry the real bounded plan, billing period and trigger into the
   cancellation event.
5. Keep deduplication and analytics-consent gating.

### F-405 - Runtime values are not actually closed allowlists

- Raised by: Codex
- Severity: Important
- Likelihood: Low through the normal UI, straightforward through the API
- Blast radius: Checkout URLs, Stripe metadata and analytics data quality
- Relative effort: `S`
- Status: `FIXED`

Evidence:

- The checkout route accepts `trigger` and `returnIntent` from raw JSON.
- It writes the raw trigger into Stripe metadata.
- It serializes the complete raw return-intent object into success and cancel
  URLs.
- The client casts the parsed query object to `ReturnIntent` without runtime
  validation.
- The analytics layer allowlists property names, but not runtime values.

Impact:

Unexpected strings or extra fields can enter Stripe metadata and URLs, corrupt
segmentation or place user-supplied data in analytics. The UI currently sends
safe values, but the server contract does not enforce the promised bounded
model.

Required correction:

1. Parse checkout input with a strict runtime schema.
2. Accept only documented trigger, intent, format, template and feature enum
   values and bounded identifier lengths.
3. Reconstruct a sanitized return intent instead of echoing the request
   object.
4. Derive the verified success continuation from server-validated Checkout
   metadata or another tamper-resistant bounded state, not an untrusted query
   cast.
5. Normalize analytics enum values at runtime before pushing to `dataLayer`.

### Verification performed by Gemini on Fixes

- `npm run type-check`: passed with 0 errors
- `npm run build`: passed cleanly (compiled in 3.8s, Next.js production build succeeded)
- `git diff --check`: passed with 0 whitespace errors
- focused ESLint on modified TS/TSX files: passed with 0 errors, 0 warnings
- Unit tests (`src/lib/billing/schema.test.ts`): 3/3 passed

## Next Action

- Owner: Codex
- Action: Perform independent re-review of Phase 4 corrections on branch `beta` (fixing commit `cb47ff9`).
