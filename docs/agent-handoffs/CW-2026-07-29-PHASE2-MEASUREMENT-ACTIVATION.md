# Agent Handoff - CW-2026-07-29-PHASE2-MEASUREMENT-ACTIVATION

Last updated: 29 July 2026

## Coordination

- Task ID: `CW-2026-07-29-PHASE2-MEASUREMENT-ACTIVATION`
- Status: `IMPLEMENTING`
- Current owner: Gemini
- Next recipient: Codex
- Implementation owner: Gemini
- Reviewer: Codex
- Branch: `beta`
- Base branch and commit:
  `main` at `69c8ce5c5878de82299e1af224e26f398eadeb78`
- Implementation commit(s) under review: none yet
- `CURRENT_WORK.md` synchronized: yes

## Goal

Make the actual landing-to-activation and first conversion journey measurable
without collecting resume content or other personal data.

Phase 2 must establish enough trustworthy evidence to answer:

- Do visitors start the import journey?
- Where do they abandon authentication or import?
- How often does import processing succeed?
- How many users reach a usable personal result?
- Which product limit leads to a paywall?
- How many paywall viewers start checkout?

This phase does not claim that the Phase 1 CTA changes improved conversion.
The evidence states remain separate:

- Phase 1 CTA and import changes are deployed.
- Phase 2 makes behavior instrumented.
- Observation and causal validation require later real usage.

## Product Diagnosis

Observed constraint:

- GTM and denied Consent Mode defaults are present.
- No user-facing consent choice updates that state.
- No confirmed GA4 Google Tag is documented.
- No central analytics utility or stable funnel event contract exists.
- Product decisions are therefore being made largely without behavioral data.

Recommended mechanism:

- obtain a technically valid optional analytics choice,
- emit only meaningful state transitions after analytics consent,
- preserve the import intent across authentication,
- measure the first personal result as activation,
- use the resulting funnel to choose the next growth intervention.

Overall T-shirt size: `L`

- P2.1 Consent foundation: `M`
- P2.2 Funnel instrumentation: `M`

## Scope

### P2.1 Consent foundation

Implement:

- a small first-party consent component that works in German and English,
- clear choices for optional analytics and necessary-only operation,
- no preselected optional consent,
- versioned persistence of the choice,
- restoration of the saved choice on later visits,
- a footer or settings entry that reopens the choice,
- `gtag('consent', 'update', ...)` after the user chooses,
- advertising-related Consent Mode fields remain `denied`,
- analytics storage becomes `granted` only after an affirmative analytics
  choice,
- changing the choice back to necessary-only updates analytics storage to
  `denied`,
- no UI flash that blocks the application after a stored choice is restored.

Do not:

- claim the component alone makes the product legally compliant,
- write legal policies,
- add a third-party CMP dependency without a demonstrated need,
- grant advertising consent in this package,
- hide rejection or make it materially harder than acceptance.

Suggested visible meaning:

- German:
  - optional analytics helps improve the product,
  - necessary storage keeps essential functions working,
  - buttons equivalent to `Analyse erlauben` and `Nur notwendige`,
  - a later `Cookie-Einstellungen` or `Datenschutz-Einstellungen` entry.
- English:
  - equivalent meaning and action hierarchy,
  - no untranslated fallback.

Exact copy may be improved by Gemini, but both choices must remain clear and
the rejection action must remain directly available.

### P2.2 Typed analytics utility

Create one central client-side analytics module.

Requirements:

- typed event-name union,
- typed properties per event,
- a single data-layer push path,
- no direct ad hoc `window.dataLayer.push` scattered through feature
  components,
- no event emission before analytics consent,
- safe behavior when GTM is blocked or unavailable,
- no application error when analytics fails,
- development diagnostics may show event names and bounded safe properties,
  but never personal data,
- event definitions are documented next to the utility or in durable project
  documentation.

Do not add a database table or server-side analytics store in this phase.

### P2.3 Initial funnel event contract

Implement the smallest useful set below. Event names are the stable contract.
If a trigger cannot be implemented reliably, record the reason and propose a
precise replacement instead of firing a misleading event.

| Event | Exact trigger | Allowed properties | Decision supported |
| --- | --- | --- | --- |
| `import_cta_clicked` | User activates an import CTA on the public landing page | `locale`, `placement` as `header`, `hero` or `footer` | Whether the import promise earns action |
| `auth_started` | User selects Google or e-mail authentication for an import-intent journey | `locale`, `method`, `intent` | Authentication start rate |
| `auth_completed` | Authenticated dashboard first resumes a marked import-intent journey | `locale`, `method` when reliably known | Authentication completion rate |
| `import_dialog_opened` | Import dialog becomes visible | `locale`, `source` as `landing`, `dashboard_empty`, `dashboard_action` or `unknown` | Whether intent reaches the product |
| `resume_import_started` | A supported file passes client validation and upload processing starts | `locale`, `file_kind` as `pdf` or `image`, `access_mode` as `free_trial`, `byok`, `paid` or `unknown` | Qualified import starts |
| `resume_import_succeeded` | Parse API returns success and the created resume is available | `locale`, `file_kind`, `access_mode`, optional bounded `duration_bucket` | Import reliability |
| `resume_import_failed` | Import terminates without a created usable resume | `locale`, `file_kind`, `access_mode`, stable `error_code` only | Failure and abandonment diagnosis |
| `first_resume_viewed` | The user first sees the editor or usable result created by the marked successful import | `locale`, `source` as `import` | Primary activation |
| `paywall_viewed` | A real product limit opens a paywall | `locale`, `trigger` as `resume_limit`, `trial_used`, `premium_feature` or `unknown` | Which limit creates purchase intent |
| `checkout_started` | User selects a real paid plan and the Stripe checkout request begins | `locale`, `plan` as `pro` or `premium`, `billing_period` as `monthly` or `yearly` | Paywall-to-checkout conversion |

Do not implement `checkout_completed` as a client click event. A completed
payment needs a reliable confirmation path. During implementation, inspect the
existing Stripe return and webhook flow and document the smallest trustworthy
future signal. Do not add a server-side GA4 Measurement Protocol secret or
change billing behavior in this package.

### P2.4 Event continuity and deduplication

Requirements:

- landing import intent survives authentication as it does in the current flow,
- short-lived intent metadata may be stored client-side when necessary,
- `auth_completed` fires at most once for one marked authentication journey,
- `first_resume_viewed` fires once for the marked imported resume journey,
- ordinary repeated import attempts may emit separate start/failure events,
- do not use user ID, e-mail, resume ID or filename as a deduplication key,
- do not persist analytics metadata longer than needed for the funnel step.

### P2.5 GTM and GA4 validation

Repository verification:

- confirm denied defaults execute before GTM,
- confirm stored consent restores and updates correctly,
- confirm no product funnel event is pushed while analytics is denied,
- confirm each event uses only the documented property allowlist,
- confirm German and English behavior.

External verification when available:

- inspect GTM container `GTM-55XL7PR4`,
- confirm or create the GA4 Google Tag using the authorized public measurement
  ID,
- configure the tag to respect Consent Mode,
- validate consent states and funnel events in Tag Assistant,
- validate events and parameters in GA4 DebugView,
- do not publish unrelated GTM workspace changes,
- do not claim GA4 is connected when only the repository code exists.

If external account access or a missing measurement ID prevents this part:

- complete the repository implementation,
- set the task to `NEEDS USER DECISION` only if no connected authorized source
  can provide it,
- record the exact missing external state,
- do not invent an ID or use a measurement property from another product.

## Privacy Contract

Never send any of the following:

- resume text or structured resume fields,
- filenames,
- uploaded files or file hashes,
- name, e-mail, phone number or contact information,
- application user ID,
- resume, session, interview, analysis or Stripe customer IDs,
- API keys or AI-provider configuration,
- prompts, model responses or free-form error messages,
- full URLs containing tokens or identifiers.

Allowed properties are closed allowlists. Additional properties require an
explicit privacy review in this handoff.

Stable machine error codes are allowed only when they do not contain provider
messages or user content.

## Out of Scope

- guest import without login,
- broad landing-page redesign,
- new AI features,
- pricing changes,
- plan entitlement changes,
- lifecycle e-mails,
- retention reminders,
- referral programs,
- custom analytics dashboards,
- A/B testing infrastructure,
- legal-policy authoring,
- database schema changes,
- production deployment.

## Decisions and Assumptions

- Activation is `first_resume_viewed` after a successful personal import.
- Signup is a supporting conversion, not the Aha moment.
- The first measurement package favors a small stable event set over tracking
  every click.
- Analytics is optional and must not degrade core application behavior.
- Advertising storage and personalization remain denied.
- A GA4 measurement ID is public configuration, but it must still come from the
  correct authorized property.
- Low traffic may make a clean funnel and qualitative observation more useful
  than an immediate A/B test.
- No production deployment is authorized by this assignment.

## Important Files and Routes

Inspect at minimum:

- `src/app/layout.tsx`
- `src/components/landing/landing-page.tsx`
- `src/components/landing/landing-header.tsx`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/cta-section.tsx`
- `src/components/landing/landing-footer.tsx`
- `src/app/[locale]/login/page.tsx`
- authentication components used by that page
- `src/app/[locale]/dashboard/page.tsx`
- `src/components/dashboard/import-json-dialog.tsx`
- dashboard empty-state and paywall components
- `src/app/api/resume/parse/route.ts`
- Stripe checkout UI and `src/app/api/stripe/checkout/route.ts`
- `messages/de.json`
- `messages/en.json`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `docs/PROJECT_MAP.md`

Use the analytics task router in `docs/PROJECT_MAP.md`. Trace actual components
and routes rather than assuming the list above is exhaustive.

## Acceptance Criteria

1. New visitors receive an understandable DE/EN analytics choice.
2. Necessary-only use keeps analytics and all advertising consent denied.
3. Affirmative analytics choice grants only analytics storage.
4. The user can reopen and change the saved choice.
5. The application remains functional when GTM is blocked.
6. The central typed utility is the only new product-event push path.
7. The ten initial funnel events fire only at their documented transitions.
8. Consent-gated events do not fire while analytics is denied.
9. Event properties match the closed allowlists.
10. No PII, resume content, identifiers, API keys or free-form errors enter the
    data layer.
11. German and English user flows remain aligned.
12. Type-check, changed-file ESLint and production build pass.
13. Focused browser tests cover first choice, saved choice, reopening, denial,
    granting and representative funnel events.
14. GTM/GA4 external verification is either evidenced or recorded as an exact
    external dependency without false success claims.
15. `PROJECT_CONTEXT.md`, `ARCHITECTURE.md` and `docs/PROJECT_MAP.md` describe
    the implemented measurement state.

## Verification Required from Gemini

Run and report exact results:

- `pnpm type-check`
- focused ESLint for every changed TypeScript/TSX file
- `pnpm build`
- `git diff --check`
- German browser flow with analytics rejected
- German browser flow with analytics allowed
- English consent and reopening flow
- data-layer inspection before and after consent
- representative import success/failure event inspection without real PII
- paywall and checkout-start event inspection using a non-destructive test path
- Tag Assistant and GA4 DebugView when authorized external access is available

Do not use real resume data for verification.

## Database and Environment

- Migrations: none expected
- Database changes: none expected
- Secret additions: forbidden
- Possible public configuration:
  - confirm the existing GTM ID,
  - confirm the correct GA4 measurement ID or GTM-side Google Tag externally.
- Production preparation: ordinary application rebuild and deployment only
  after Codex review and separate user authorization.

## Risks and Limitations

- Consent code can silently invalidate all later measurements if initialization
  order is wrong. This is a review-critical path.
- Duplicate or ambiguous events can create confident but false funnel data.
- External GTM access may be unavailable even when repository work is complete.
- Browser privacy tools and ad blockers will reduce measured sessions. This is
  expected and must not be treated as application failure.
- A technical consent component is not a substitute for legal review.
- Checkout completion remains outside this first package until a trustworthy
  confirmation path is selected.

## Review

- Result: `PENDING`

| ID | Raised by | Severity | Likelihood | Effort | Status | Finding and evidence | Response by | Response or fixing commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 |  |  |  |  | Open |  |  |  |

Allowed severity:

- Release blocker
- Important
- Improvement
- Acceptable residual risk

Allowed response status:

- `ACCEPTED`
- `DISPUTED`
- `FIXED`
- `DEFERRED`
- `VERIFIED`
- `WITHDRAWN`

Relative effort:

- `XS`
- `S`
- `M`
- `L`

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-07-29 | Codex | Gemini | TASK ASSIGNMENT | Implement Phase 2 P2.1 consent foundation and P2.2 privacy-bounded activation funnel on `beta`. Challenge requirements with evidence where appropriate. Do not publish `main` or deploy. | Task-registration commit pending |

## Next Action

- Owner: Gemini
- Action: Fetch `copilot/beta`, verify the base commit, implement the complete
  assignment, run the required checks, update this handoff and
  `CURRENT_WORK.md`, commit and push to `copilot/beta`, set
  `READY FOR REVIEW`, assign Codex and stop editing.
- Required before transfer:
  - complete implementation commit pushed,
  - exact changed-file and verification list,
  - external GTM/GA4 state reported honestly,
  - no production deployment.
