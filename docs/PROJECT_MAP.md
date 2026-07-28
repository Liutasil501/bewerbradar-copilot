# BewerbRadar Copilot – Project Map and Task Router

This document tells a new agent where functionality lives and which complete
path must be reviewed for each task.

It is an index, not a substitute for reading the relevant implementation.

## 1. Repository Root

### Authoritative operational documents

- `AGENTS.md`
  Agent operating rules, autonomy, branches, review and release.

- `PROJECT_CONTEXT.md`
  Current product, billing, production and infrastructure state.

- `CURRENT_WORK.md`
  Short-lived coordination board for active tasks, branches, owners, review
  status, verification and next action. Verify every claim against Git.

- `docs/agent-handoffs/`
  Task-specific Gemini ↔ Codex implementation handoffs, review findings,
  responses and ownership transfer. Start from `TEMPLATE.md`.

- `ARCHITECTURE.md`
  Current technical architecture and data flows.

- `DEPLOYMENT.md`
  Production deployment and rollback runbook.

### Product and historical documents

- `README.md`
  Primarily upstream JadeAI documentation. Partially outdated for BewerbRadar.

- `README.zh-CN.md`
  Upstream Chinese documentation. Not authoritative.

- `FEATURE-IDEAS.md`
  Possible ideas, not committed product scope.

- `docs/superpowers/specs/`
  Feature specifications. Check whether the specification is still active.

- `docs/superpowers/plans/`
  Historical implementation plans. Never assume they reflect current code.

### Runtime and tooling

- `package.json`
  Commands and dependencies.

- `next.config.ts`
  Next.js standalone output and external server packages.

- `Dockerfile`
  Multi-stage production image.

- `compose.yml`
  Local/broader stack definition.

- `.env.example`
  Public environment-variable template.

- `drizzle.config.ts`
  SQLite migration generation.

- `drizzle-pg.config.ts`
  PostgreSQL migration generation.

- `drizzle/migrations/`
  Production-relevant SQLite migrations.

- `drizzle/pg-migrations/`
  PostgreSQL migrations; not production authority.

- `scripts/`
  Deployment, export CSS and maintenance scripts.

## 2. Application Routes

### `src/app/layout.tsx`

Global root layout:

- global metadata,
- global CSS,
- Google Consent Mode defaults,
- Google Tag Manager,
- initial brand hydration.

Review this file for:

- analytics,
- consent,
- global scripts,
- metadata,
- application-wide providers.

### `src/app/[locale]/layout.tsx`

Locale-level providers:

- NextAuth session,
- runtime auth configuration,
- next-intl translations,
- theme provider,
- brand provider,
- tooltips,
- toast notifications.

### User-facing pages

- `src/app/[locale]/page.tsx`
  Marketing landing page.

- `src/app/[locale]/(auth)/login/page.tsx`
  Google and e-mail login.

- `src/app/[locale]/dashboard/page.tsx`
  Resume dashboard and primary creation/import actions.

- `src/app/[locale]/templates/page.tsx`
  Template gallery, preview and template paywall.

- `src/app/[locale]/editor/[id]/page.tsx`
  Main resume editor.

- `src/app/[locale]/preview/[id]/page.tsx`
  Resume preview.

- `src/app/[locale]/share/[token]/page.tsx`
  Public shared-resume view.

- `src/app/[locale]/interview/page.tsx`
  Interview history/lobby.

- `src/app/[locale]/interview/new/page.tsx`
  Interview setup.

- `src/app/[locale]/interview/[id]/page.tsx`
  Interview room.

- `src/app/[locale]/interview/[id]/report/page.tsx`
  Interview report.

- `src/app/[locale]/linkedin-photo/page.tsx`
  AI professional-photo interface.

### Middleware

- `src/middleware.ts`

Responsibilities:

- locale routing,
- public-path identification,
- OAuth-mode page protection,
- login redirects.

API routes are deliberately skipped by middleware and must secure themselves.

## 3. API Routes

### Resume lifecycle

- `src/app/api/resume/route.ts`
  List and create resumes; Free limits and template enforcement.

- `src/app/api/resume/[id]/route.ts`
  Read, update and delete; ownership enforcement.

- `src/app/api/resume/[id]/duplicate/route.ts`
  Duplicate with plan limits.

### Import

- `src/app/api/resume/parse/route.ts`
  PDF/image parsing, size/type checks, AI extraction and resume creation.

### Export

- `src/app/api/resume/[id]/export/route.ts`
  JSON, TXT, HTML, DOCX and PDF export plus server-side plan enforcement.

- `src/app/api/resume/[id]/export/builders.ts`
  HTML generation.

- `src/app/api/resume/[id]/export/docx.ts`
  DOCX generation.

- `src/app/api/resume/[id]/export/plain-text.ts`
  TXT generation.

- `src/app/api/resume/[id]/export/templates/`
  Export-specific template renderers.

### Sharing

- `src/app/api/resume/[id]/share/route.ts`
  Legacy/single share settings.

- `src/app/api/resume/[id]/shares/route.ts`
  Multi-share creation and listing.

- `src/app/api/resume/[id]/shares/[shareId]/route.ts`
  Individual share management.

- `src/app/api/share/[token]/route.ts`
  Public share access.

### AI

- `src/app/api/ai/chat/route.ts`
  Streaming assistant with executable resume tools.

- `src/app/api/ai/chat/sessions/`
  Persistent chat sessions and messages.

- `src/app/api/ai/generate-resume/route.ts`
  Generate a complete new resume.

- `src/app/api/ai/cover-letter/route.ts`
  Cover-letter generation.

- `src/app/api/ai/grammar-check/route.ts`
  Grammar and writing analysis.

- `src/app/api/ai/grammar-check/history/route.ts`
  Grammar history.

- `src/app/api/ai/jd-analysis/route.ts`
  Job-description match analysis.

- `src/app/api/ai/jd-analysis/history/route.ts`
  JD-analysis history.

- `src/app/api/ai/translate/route.ts`
  Resume translation.

- `src/app/api/ai/models/route.ts`
  Provider model discovery.

### Interviews

- `src/app/api/interview/route.ts`
  Interview listing and Premium-only creation.

- `src/app/api/interview/[id]/route.ts`
  Session read/update/delete.

- `src/app/api/interview/[id]/chat/route.ts`
  Interview conversation.

- `src/app/api/interview/[id]/control/route.ts`
  Pause, resume, skip, hint and round control.

- `src/app/api/interview/[id]/mark/route.ts`
  Mark questions/messages.

- `src/app/api/interview/[id]/report/route.ts`
  Report generation and retrieval.

- `src/app/api/interview/[id]/report/export/route.ts`
  Report export.

- `src/app/api/interview/history/stats/route.ts`
  Historical score statistics.

### Billing

- `src/app/api/stripe/checkout/route.ts`
  Checkout and self-healing subscription lookup.

- `src/app/api/stripe/portal/route.ts`
  Billing portal and subscription repair.

- `src/app/api/stripe/webhook/route.ts`
  Signed Stripe event synchronization.

### User and auth

- `src/app/api/auth/[...nextauth]/route.ts`
  NextAuth handlers.

- `src/app/api/user/route.ts`
  User profile.

- `src/app/api/user/settings/route.ts`
  Non-secret user settings.

### Other

- `src/app/api/linkedin-photo/route.ts`
  Gemini image generation.

- `src/app/api/github/repo/route.ts`
  GitHub repository metadata for resume sections.

## 4. Components by Feature

### Landing and conversion

- `src/components/landing/landing-page.tsx`
- `src/components/landing/landing-header.tsx`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/features-section.tsx`
- `src/components/landing/template-showcase-section.tsx`
- `src/components/landing/stats-section.tsx`
- `src/components/landing/cta-section.tsx`
- `src/components/landing/landing-footer.tsx`

### Dashboard

- `src/components/dashboard/create-resume-dialog.tsx`
- `src/components/dashboard/generate-resume-dialog.tsx`
- `src/components/dashboard/import-json-dialog.tsx`
- `src/components/dashboard/resume-grid.tsx`
- `src/components/dashboard/resume-card.tsx`
- `src/components/dashboard/resume-list-item.tsx`
- `src/components/dashboard/template-thumbnail.tsx`

### Editor

- `src/components/editor/editor-toolbar.tsx`
- `src/components/editor/editor-sidebar.tsx`
- `src/components/editor/editor-canvas.tsx`
- `src/components/editor/editor-preview-panel.tsx`
- `src/components/editor/editor-mobile-tab-bar.tsx`
- `src/components/editor/theme-editor.tsx`
- `src/components/editor/section-wrapper.tsx`
- `src/components/editor/sections/`
- `src/components/editor/fields/`
- `src/components/editor/dnd/`

Feature dialogs:

- export
- share
- cover letter
- grammar check
- JD analysis
- translation
- import

### Resume preview and templates

- `src/components/preview/resume-preview.tsx`
- `src/components/preview/templates/`
- `src/components/preview/utils.ts`

Preview templates and export templates are separate implementations. Template
changes may need updates in both locations.

### AI

- `src/components/ai/ai-chat-bubble.tsx`
- `src/components/ai/ai-chat-panel.tsx`
- `src/components/ai/ai-input.tsx`
- `src/components/ai/ai-message.tsx`
- `src/components/ai/ai-suggestion.tsx`

### Billing

- `src/components/billing/pricing-modal.tsx`

### Settings

- `src/components/settings/settings-dialog.tsx`

### Interviews

- `src/components/interview/`

This directory contains setup, interviewer selection, conversation, controls,
history comparison and report rendering.

### Shared UI

- `src/components/ui/`

Keep this directory reusable and free of BewerbRadar billing or product logic.

## 5. Client State

### `src/stores/resume-store.ts`

- current resume,
- sections,
- autosave,
- dirty/saving state,
- template/title updates.

### `src/stores/editor-store.ts`

- editor selection,
- drag state,
- AI panel state,
- theme editor,
- zoom,
- undo/redo,
- mobile edit/preview tab.

### `src/stores/settings-store.ts`

- AI provider,
- browser-local API keys,
- base URL,
- model,
- autosave configuration,
- server synchronization of non-secret settings.

### `src/stores/subscription-store.ts`

- current `free`, `pro` or `premium` plan,
- hydration from `/api/user`.

### `src/stores/interview-store.ts`

- active interview client state.

### `src/stores/ui-store.ts`

- active global modal and settings tab.

### `src/stores/tour-store.ts`

- onboarding-tour progress.

## 6. Hooks

- `src/hooks/use-auth.ts`
  OAuth/fingerprint auth state.

- `src/hooks/use-fingerprint.ts`
  local fingerprint generation and persistence.

- `src/hooks/use-resume.ts`
  dashboard resume operations.

- `src/hooks/use-editor.ts`
  editor loading and store integration.

- `src/hooks/use-ai-chat.ts`
  AI chat transport, tool-result refresh and session integration.

- `src/hooks/use-paywall.tsx`
  client-side plan and optional BYOK checks.

- `src/hooks/use-pdf-export.ts`
  export workflow.

- `src/hooks/use-interview-chat.ts`
  interview chat transport.

## 7. Core Libraries

### AI

- `src/lib/ai/provider.ts`
  AI header extraction, provider detection and server-key selection.

- `src/lib/ai/prompts.ts`
  resume assistant prompt.

- `src/lib/ai/tools.ts`
  executable resume editing tools.

- `src/lib/ai/*-schema.ts`
  Zod input/output schemas.

- `src/lib/ai/extract-json.ts`
  resilient model JSON extraction.

### Authentication

- `src/lib/auth/config.ts`
  NextAuth providers, adapter and callbacks.

- `src/lib/auth/helpers.ts`
  user/session/fingerprint resolution.

### Database

- `src/lib/db/index.ts`
  active adapter selection.

- `src/lib/db/schema.ts`
  SQLite schema and runtime table definitions.

- `src/lib/db/pg-schema.ts`
  PostgreSQL migration schema.

- `src/lib/db/adapters/sqlite.ts`
- `src/lib/db/adapters/postgresql.ts`

Repositories:

- user
- resume
- share
- chat
- analysis
- interview

### Billing

- `src/lib/stripe/client.ts`
- `src/lib/stripe/config.ts`

### Resume and export

- `src/lib/constants.ts`
  templates, free templates and limits.

- `src/lib/pdf/`
  Chromium PDF generation and export CSS.

- `src/lib/template-labels.ts`
  translation-key mapping for templates.

- `src/lib/db/sample-resume.ts`
  sample resume created for new users.

## 8. Localization

- `messages/de.json`
- `messages/en.json`
- `src/i18n/config.ts`
- `src/i18n/routing.ts`
- `src/i18n/request.ts`

Any new visible copy must be reviewed in both languages.

Hardcoded visible strings require special scrutiny.

## 9. Task Routing

### Landing page or conversion

Inspect:

1. `src/app/[locale]/page.tsx`
2. `src/components/landing/`
3. `src/middleware.ts`
4. target routes of every CTA
5. `messages/de.json`
6. `messages/en.json`
7. analytics events and consent behavior

### Login or onboarding

Inspect:

1. `src/middleware.ts`
2. login page and login button
3. `src/lib/auth/config.ts`
4. `src/lib/auth/helpers.ts`
5. `src/lib/db/repositories/user.repository.ts`
6. `src/lib/db/sample-resume.ts`
7. dashboard first-use behavior
8. callback URLs in both locales

### Resume import

Inspect:

1. dashboard import dialog
2. dashboard resume-limit wrapper
3. `/api/resume/parse`
4. `/api/resume`
5. AI provider
6. parse schema and mapping
7. user and resume repositories
8. `MAX_FREE_RESUMES`
9. Free sample resume behavior
10. import copy and paywall copy
11. privacy and upload size/type handling

### Resume editor

Inspect:

1. editor page
2. `use-editor`
3. resume store
4. editor store
5. resume detail API
6. relevant section/field component
7. preview renderer
8. export renderer when presentation changes
9. German and English labels

### Template work

Inspect:

1. `src/lib/constants.ts`
2. template label map
3. both translation files
4. dashboard thumbnail implementation
5. preview template
6. export template
7. template gallery
8. create/import dialogs
9. Free template restrictions

### AI feature

Inspect:

1. feature UI and paywall
2. feature API route
3. `src/lib/ai/provider.ts`
4. input/output schema
5. user plan
6. BYOK headers
7. server-key eligibility
8. ownership checks
9. PII handling
10. error translations

### Billing or plan change

Inspect every layer:

1. plan description translations
2. pricing modal
3. `use-paywall`
4. subscription store
5. dashboard limits
6. template limits
7. export restrictions
8. sharing restrictions
9. AI UI restrictions
10. API-side restrictions
11. Stripe configuration
12. checkout
13. portal
14. webhook
15. database user fields

Do not change plan behavior in only one layer.

### Database change

Inspect:

1. SQLite schema
2. affected repositories
3. SQLite adapter
4. checked-in migration
5. migration journal metadata
6. Dockerfile migration copies
7. active production database filename
8. existing data compatibility
9. PostgreSQL parity impact
10. backup requirement

### Authentication or security

Inspect:

1. middleware
2. auth configuration
3. auth helpers
4. API route authentication
5. ownership checks
6. public routes
7. share routes
8. session and callback behavior
9. user creation and sample resume
10. sensitive logs

### Export

Inspect:

1. export dialog
2. paywall
3. export API
4. builder
5. target format implementation
6. preview/export template parity
7. Chromium configuration
8. Docker fonts
9. Free vs paid format enforcement

### Interview

Inspect:

1. interview pages
2. interview components
3. interview store and hook
4. interview API routes
5. repository
6. schema
7. AI prompts and report schema
8. Premium enforcement
9. BYOK inconsistency
10. report export

### Analytics

Inspect:

1. root layout
2. cookie banner/CMP
3. data-layer utility
4. CTA and funnel components
5. GTM configuration
6. Tag Assistant
7. GA4 DebugView
8. consent state
9. absence of PII

### Deployment

Inspect:

1. Git status and branch graph
2. reviewed release diff
3. `package.json`
4. deploy script
5. Dockerfile
6. production Compose file
7. database migrations
8. environment requirements
9. live VPS commit
10. container status and logs
11. public smoke test
