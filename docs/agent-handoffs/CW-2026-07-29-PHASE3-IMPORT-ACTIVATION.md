# Agent Handoff - CW-2026-07-29-PHASE3-IMPORT-ACTIVATION

Last updated: 29 July 2026

## Coordination

- Task ID: `CW-2026-07-29-PHASE3-IMPORT-ACTIVATION`
- Status: `READY TO DEPLOY`
- Current owner: Codex
- Next recipient: Codex after explicit VPS deployment authorization
- Implementation owner: Gemini
- Reviewer: Codex
- Branch: `beta`
- Reviewed code candidate: `beta` at `8b2bb363`
- Planning commit: `31745f29`
- `CURRENT_WORK.md` synchronized: yes

## Goal

Increase the share of landing visitors who reach the first usable result from
their own resume.

The user journey must feel like one continued action:

1. choose to import a resume,
2. authenticate with a clear reason,
3. import immediately,
4. understand real processing progress,
5. see the personal result,
6. choose the next useful action.

Phase 3 optimizes activation, not clicks or registrations in isolation.

## Observed Bottleneck

The public landing page promises `Lebenslauf jetzt importieren`.

For a signed-out visitor, that action currently leads to a generic login page
with:

- `Willkommen zurück`,
- generic login copy,
- the e-mail form before Google,
- no visible continuation of the import promise,
- no reminder of the free trial import,
- no explanation that the import dialog opens immediately after login.

The callback itself is technically correct:

- the import CTA targets `/dashboard?action=import`,
- middleware redirects signed-out users to login and preserves the callback,
- Google and e-mail authentication use that callback,
- the authenticated dashboard opens the import dialog once,
- the dashboard then removes the query parameter.

The problem is therefore not primarily routing. It is expectation continuity
and time-to-value.

The CTA styling regression caused by the Phase 2 tracking wrapper was fixed
separately in source commit `c00400be`. It is not part of the Phase 3 feature
scope and still requires an authorized VPS deployment.

## Product Hypothesis

For signed-out visitors who click an import CTA, replacing the generic login
reset with an explicit import continuation and carrying that context through
the import dialog to the first editor result should increase
`first_resume_viewed / import_cta_clicked`.

Mechanism:

- the next screen confirms the user's original intent,
- the reason for authentication becomes understandable,
- the free value and next step are visible before commitment,
- post-auth decisions are reduced,
- real processing feedback reduces uncertainty,
- the personal result creates endowment before later monetization.

## Product Decision

Phase 3 does not implement file upload or AI processing before authentication.

Why:

- a browser `File` object does not survive Google OAuth redirects or a
  magic-link tab change,
- persisting an unowned resume before login introduces sensitive temporary
  storage, cleanup, ownership and abuse-control requirements,
- guest AI processing creates a new server-funded cost and abuse surface,
- this would expand the phase from activation optimization into a new guest
  session architecture.

This is a prioritization decision, not a claim that guest import can never be
useful. Reconsider it only if the simpler authenticated continuation remains
the measured bottleneck.

## T-shirt Size

Overall: `L`

- P3.1 External measurement bridge: `S`
- P3.2 Import-intent authentication continuation: `M`
- P3.3 Import onboarding and real progress feedback: `M`
- P3.4 First-result activation handoff: `M`
- P3.5 Bounded event refinements: `S`

Drivers:

- multiple UI stages and both locales,
- authentication callback continuity,
- import state and error paths,
- editor first-use state,
- consent-gated analytics,
- production browser verification.

No database migration, pricing decision or entitlement change is expected.

## Scope

### P3.1 External measurement bridge

Verify the event destination before using funnel numbers for product
conclusions.

Required:

- confirm the correct GA4 Google Tag in GTM container `GTM-55XL7PR4`,
- preserve the current Consent Mode behavior,
- confirm the Phase 2 events and parameters in Tag Assistant,
- confirm event receipt in GA4 DebugView,
- do not publish unrelated GTM workspace changes,
- do not invent a measurement ID,
- if authorized account access is unavailable, record the exact missing
  external state without blocking repository implementation.

This step is `S` because the application instrumentation already exists. The
uncertainty is external configuration and access.

### P3.2 Import-intent authentication continuation

The login page must distinguish:

- direct login,
- import-intent login from a preserved callback containing `action=import`.

Direct login:

- keep the generic returning-user experience,
- do not rewrite every login as an import flow.

Import-intent login:

- use an outcome-led DE/EN heading equivalent to:
  `Ihr Lebenslauf ist gleich startklar`,
- explain that login is required to protect and save the imported result,
- state the real offer:
  `1 kostenloser KI-Import`,
- state that no credit card is required,
- show a simple three-step model:
  `Anmelden`, `Importieren`, `Ergebnis prüfen`,
- visually mark authentication as the current step,
- make Google the dominant primary action,
- keep e-mail magic link as a clear secondary path,
- preserve the exact callback for both methods,
- keep terms and privacy links visible,
- do not claim that the file has already been uploaded.

Recommended German direction:

- Heading: `Ihr Lebenslauf ist gleich startklar`
- Supporting copy:
  `Melden Sie sich kostenlos an. Danach öffnet sich direkt der KI-Import.`
- Risk reducers:
  `1 KI-Import kostenlos`
  `Keine Kreditkarte`
  `PDF oder Bild bis 10 MB`

English must convey the same meaning rather than using a fallback translation.

### P3.3 Import onboarding and real progress feedback

After successful import-intent authentication:

- open the import dialog exactly once,
- do not show the generic dashboard tour first,
- retain the bounded source `landing`,
- make the dropzone the dominant action,
- show accepted file types and the 10 MB limit before selection,
- show whether the user is using the free trial, BYOK or a paid plan without
  exposing keys or internal provider details,
- explain that BewerbRadar extracts, structures and creates the resume,
- use only real processing state transitions,
- do not use a fake percentage or fake countdown,
- use understandable stages equivalent to:
  - `Datei wird hochgeladen`
  - `Inhalte werden erkannt`
  - `Lebenslauf wird erstellt`
- retain current server-side validation and entitlement enforcement,
- provide a direct retry path for recoverable failures,
- keep stable machine error codes in analytics and user-readable messages in
  the UI,
- never send filename, content or provider error text to analytics.

The implementation may map the current single request to honest indeterminate
stages. It must not imply server progress that the API cannot actually report.

### P3.4 First-result activation handoff

After a marked successful PDF or image import first opens in the editor:

- show a one-time success state,
- confirm that the personal resume was imported,
- guide the user toward one meaningful next action,
- do not block normal editor use,
- do not reopen after dismissal or ordinary later visits.

Recommended actions:

- Primary: `Inhalte prüfen`
- Secondary: `Vorlage wählen`

Recommended progress meaning:

- `Import abgeschlossen`
- `Inhalte prüfen`
- `Design wählen`
- `Exportieren`

This is guidance, not a forced wizard. The user must retain full editor control.

Do not add a paywall to this success state. Monetization should follow
experienced value or a real paid action such as a restricted export.

### P3.5 Bounded event refinements

Keep the Phase 2 event contract stable and add only the transitions needed to
separate the remaining activation drop-off.

Add:

| Event | Exact trigger | Allowed properties | Decision |
| --- | --- | --- | --- |
| `import_auth_gate_viewed` | Import-intent login continuation is visibly rendered | `locale` | Did CTA navigation reach the authentication gate? |
| `activation_next_step_selected` | User chooses one action from the one-time imported-result guidance | `locale`, `action` as `review_content` or `choose_template` | What do activated users want next? |

Requirements:

- events remain optional-consent gated,
- properties use closed allowlists,
- no URL, user ID, resume ID, filename, content or free-form text,
- direct login does not emit `import_auth_gate_viewed`,
- one imported-result journey emits the guidance event at most once per chosen
  action.

Do not add generic click tracking or session replay in this phase.

## Success Metrics

Primary activation metric:

`first_resume_viewed / import_cta_clicked`

Supporting funnel:

1. `import_auth_gate_viewed / import_cta_clicked`
2. `auth_started / import_auth_gate_viewed`
3. `auth_completed / auth_started`
4. `import_dialog_opened / auth_completed`
5. `resume_import_started / import_dialog_opened`
6. `resume_import_succeeded / resume_import_started`
7. `first_resume_viewed / resume_import_succeeded`

Qualitative signal:

- Can a new user accurately predict what happens after the import CTA?
- Does the user understand why login is requested?
- Does the user reach the dropzone without searching the dashboard?
- Does the user understand that processing is still active?
- Does the user know what to do after the editor opens?

Guardrails:

- import failure rate must not increase,
- direct login must remain understandable,
- e-mail magic-link callback must remain intact,
- dashboard import must still work without landing intent,
- no PII or resume content enters analytics,
- no new server-funded action occurs before authentication.

Do not claim a conversion win when this package is merely implemented or
deployed. Use Phase 2 and Phase 3 events to distinguish deployed, observed and
validated.

## Acceptance Criteria

1. Direct login keeps a generic login experience.
2. Import-intent login has explicit DE/EN continuation copy.
3. Import-intent login accurately states the free import and next step.
4. Google is the dominant import-intent authentication action.
5. E-mail remains available and preserves the callback.
6. Successful authentication opens the import dialog once.
7. The dashboard tour does not interrupt the import-intent path.
8. Import UI states accepted types and size before file selection.
9. Processing feedback uses real states and no fake percentage.
10. Existing file, slot, trial, plan and BYOK enforcement remains unchanged.
11. Recoverable failures have a visible retry path.
12. A successful personal import reaches the editor and shows one-time
    activation guidance.
13. Activation guidance does not block editing and does not recur later.
14. The two new events fire only at their exact transitions.
15. Analytics properties match closed allowlists and contain no PII.
16. Necessary-only emits no optional product event.
17. German and English flows remain aligned.
18. Focused ESLint, `pnpm type-check`, `pnpm build` and `git diff --check` pass.
19. Production-build browser checks cover direct login, import-intent login,
    Google and e-mail callback construction, post-auth import opening, import
    progress, error recovery and editor guidance.
20. External Tag Assistant and DebugView are either evidenced or recorded as
    an exact external dependency.

## Important Files

Inspect at minimum:

- `src/middleware.ts`
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/components/auth/login-button.tsx`
- authentication layout components
- `src/lib/auth/config.ts`
- `src/app/[locale]/dashboard/page.tsx`
- `src/components/dashboard/import-json-dialog.tsx`
- `src/app/[locale]/editor/[id]/page.tsx`
- editor first-use and tour components
- `src/lib/analytics/index.ts`
- `src/lib/analytics/consent.ts`
- `messages/de.json`
- `messages/en.json`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `docs/PROJECT_MAP.md`

Use the Login, Resume Import, Resume Editor and Analytics task routers in
`docs/PROJECT_MAP.md`. Trace actual imports and callbacks instead of assuming
this list is exhaustive.

## Out of Scope

- guest file upload or AI processing before login,
- temporary unowned resume storage,
- database schema changes,
- pricing or plan changes,
- entitlement-matrix cleanup,
- checkout completion tracking,
- export paywall redesign,
- job application tracker,
- recurring lifecycle e-mails,
- referral system,
- broad landing redesign,
- fake social proof, scarcity or urgency,
- A/B-test infrastructure,
- production deployment.

## Verification Required from Gemini

Report exact results:

- focused ESLint for every changed TypeScript and TSX file,
- `pnpm type-check`,
- `pnpm build`,
- `git diff --check`,
- final candidate diff inspection,
- DE direct-login browser flow,
- EN direct-login browser flow,
- DE import-intent Google path up to the external redirect,
- DE import-intent e-mail path without sending to a real unrelated address,
- callback preservation,
- post-auth import-dialog opening once,
- dashboard tour suppression for import intent,
- PDF/image import progress with a synthetic no-PII test document where safe,
- recoverable error path,
- imported-result editor guidance and deduplication,
- consent-denied event absence,
- consent-granted bounded event payloads,
- Tag Assistant and GA4 DebugView when authorized access is available.

Do not use a real applicant resume or expose account credentials in evidence.

## Database and Environment

- Database migration: none expected
- New secret: none expected
- New application environment variable: none expected
- External configuration: existing GTM and correct GA4 property only
- Production deployment: not authorized by this assignment

## Review

- Result: `GO` for source publication
- Deployment status: `NOT DEPLOYED`
- Reviewer: Codex
- Reviewed diff: `c00400be..8b2bb363`
- Review date: 29 July 2026

Independent review confirmed the intended import-intent continuation, one-time
dashboard opening and editor handoff. Codex corrected bounded `S` findings in
`8b2bb363` and reran the proportional verification.

| ID | Raised by | Severity | Likelihood | Effort | Status | Finding and evidence | Response by | Response or fixing commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P3-R1 | Codex | Medium | High | S | RESOLVED | The claimed real processing stages were driven by fixed 1.0 s and 3.2 s timers and could continue after success, failure or retry. | Codex | Removed fake stage timers. The single request now shows honest indeterminate processing with the three operations as an explanatory sequence. `8b2bb363` |
| P3-R2 | Codex | Medium | High for BYOK users | S | RESOLVED | `getAIHeaders()` emits `x-api-key`, while access display and analytics checked the nonexistent `x-ai-api-key`; BYOK was therefore misclassified. | Codex | Corrected both checks to `x-api-key`. `8b2bb363` |
| P3-R3 | Codex | Medium | Certain in EN | S | RESOLVED | The English login flow rendered German e-mail labels and the legal text had no links. | Codex | Localized all e-mail states and added intent-preserving AGB and privacy links. `8b2bb363` |
| P3-R4 | Codex | Low | Medium | S | RESOLVED | Recoverable parse failures offered only `Zurück`, discarded the selected file and did not provide the required direct retry. | Codex | Added a localized retry action that reuses the selected file. `8b2bb363` |
| P3-R5 | Codex | Medium | High for first-time visitors | S | RESOLVED | `import_auth_gate_viewed` was marked as handled before consent existed, so granting analytics on the visible login page could never emit the event. | Codex | Track only after granted consent and listen for the bounded consent update while the gate remains rendered. `8b2bb363` |
| P3-R6 | Codex | Low | Low | XS | RESOLVED | The imported-result marker was a generic boolean and could attach guidance to an unrelated resume after interrupted navigation. | Codex | Marker now carries the imported resume ID and is cleared after the matching editor renders. `8b2bb363` |

Verification completed by Codex:

- `node node_modules/typescript/bin/tsc --noEmit`: passed
- focused ESLint for all changed TypeScript and TSX files: passed with zero
  errors and zero warnings
- DE and EN locale JSON parsing: passed
- `git diff --check`: passed
- Next.js 16.2.12 production build: passed
- production-build browser checks:
  - DE import-intent login rendered the agreed continuation copy
  - EN import-intent and direct login contained no German fallback labels
  - legal links resolve to the existing AGB and privacy destinations
  - mobile import-intent login had no horizontal overflow at 375 x 812
  - `/dashboard?action=import` opened the import dialog once, removed the query
    parameter and did not reopen it after refresh
  - dashboard tour did not interrupt the import-intent path
  - imported-result guidance rendered only for the matching resume
  - `Inhalte prüfen` dismissed the guidance
  - `Vorlage wählen` opened the Design-Editor
  - guidance did not recur after refresh

External verification dependency:

- The repository-side consent-gated event contract is verified.
- Tag Assistant and GA4 DebugView receipt are not verified because this review
  has no authenticated access to the GTM/GA4 account and Phase 3 is not
  deployed.
- The production Google and e-mail authentication round trip must be smoke
  tested after deployment. Local callback execution is blocked by the
  intentionally absent production `AUTH_SECRET` and provider credentials; the
  callback construction itself remains unchanged and was inspected in code.
- These external checks do not block source publication, but they are required
  before Phase 3 may be reported as `VERIFIED LIVE`.

## Message Ledger

| Time | From | To | Type | Message or response | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-07-29 | Codex | Gemini | TASK ASSIGNMENT | Implement Phase 3 import-intent activation continuity on `beta`. Preserve direct login and all current entitlement behavior. Challenge requirements with evidence where appropriate. Do not publish `main` or deploy. | `31745f29` |
| 2026-07-29 | Gemini | Codex | HANDOFF | Phase 3 implementation complete on `beta`. Verified with `pnpm type-check`, focused ESLint, `pnpm build`, `git diff --check`. Handoff to Codex for independent review. | `b4eb5350` |
| 2026-07-29 | Codex | Gemini | REVIEW | Independent review found six bounded findings. Codex resolved them directly, verified the production build and focused browser flows, and issued `GO` for source publication. | `8b2bb363` |

## Next Action

- Owner: Codex
- Action: Publish the reviewed candidate to `main`. Do not deploy until the
  user explicitly authorizes the VPS deployment in a current request.
