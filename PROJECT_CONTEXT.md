# BewerbRadar Copilot – Current Project Context

Last verified: 28 July 2026

This file describes the authoritative current product and production state.
It is not a historical changelog.

For operating rules, read `AGENTS.md`.
For file routing, read `docs/PROJECT_MAP.md`.
For technical flows, read `ARCHITECTURE.md`.
For production releases, read `DEPLOYMENT.md`.

## 1. Product Identity

Product name:

- BewerbRadar Copilot

Origin:

- Forked from the open-source JadeAI project
- Adapted for BewerbRadar
- German translation and productization are ongoing
- Upstream Chinese and English assumptions may still exist in older files

Primary application:

- `https://copilot.bewerbradar.de`

Local repository:

- `C:\Games\Dev\JadeAI`

Primary GitHub repository:

- `Liutasil501/bewerbradar-copilot`
- local remote name: `copilot`

Related repositories:

- `Liutasil501/bewerbradar`: separate BewerbRadar project
- `twwch/JadeAI`: upstream open-source project, remote name `origin`

Do not treat the upstream README as authoritative for BewerbRadar billing,
localization, deployment or production behavior.

## 2. Current Product Capabilities

The Copilot currently provides:

- resume dashboard,
- drag-and-drop resume editor,
- 50 visual templates,
- live resume preview,
- configurable theme and layout,
- automatic saving,
- undo and redo,
- PDF, DOCX, HTML, TXT and JSON export,
- public resume sharing with optional password,
- PDF and image resume import,
- JSON backup import,
- AI resume generation,
- AI resume chat with executable editing tools,
- cover-letter generation,
- grammar and writing analysis,
- job-description match analysis,
- resume translation,
- mock interview simulation and reports,
- AI LinkedIn/professional photo generation,
- German and English UI,
- Google and e-mail authentication,
- Stripe subscription management.

## 3. Localization

Supported UI locales:

- `de`
- `en`

Default locale:

- `de` through `.env.example`
- application routing falls back to the configured default locale

Translation files:

- `messages/de.json`
- `messages/en.json`

Chinese is not a supported current UI locale.

Older code, README content, plans and fallback strings may still contain
Chinese text. New work must not reintroduce untranslated Chinese UI.

## 4. Production Authentication

Production configuration:

- `AUTH_ENABLED=true`

Production login methods:

- Google OAuth
- E-mail magic link using Nodemailer and Hostinger SMTP

Local fallback mode:

- When `AUTH_ENABLED=false`, browser fingerprint authentication is used.

Middleware behavior:

Public page paths:

- landing page
- login
- public share links

Protected page paths include:

- dashboard
- templates
- editor
- interview
- LinkedIn photo
- authenticated preview routes

API routes are not protected by middleware. Every API route must perform its
own user, ownership and plan checks.

New OAuth or e-mail users receive a prebuilt sample resume through
`createSampleResume()`.

## 5. Production Data Storage

The Copilot uses SQLite in production.

Reason:

- `DB_TYPE` is not set in the production container
- application default is SQLite
- `SQLITE_PATH` is not set
- application runtime default is `./data/bewerbradar.db`

Active production database:

- container path: `/app/data/bewerbradar.db`
- Docker volume: `reactive_resume_jadeai_data`
- mount path: `/app/data`

The volume also contains older `jade.db` files. They must not be deleted until
their history and relevance have been explicitly confirmed.

SQLite behavior:

- WAL mode
- foreign keys enabled
- migrations run from `drizzle/migrations`
- application data survives container rebuilds through the Docker volume

The PostgreSQL service running in the broader stack is not the Copilot’s active
production database.

PostgreSQL support exists in code but is not currently at full schema parity
with SQLite. It must not be described as production-ready without a dedicated
review.

## 6. Main Data Model

Important SQLite tables:

- `users`
- `auth_accounts`
- `verification_tokens`
- `resumes`
- `resume_sections`
- `chat_sessions`
- `chat_messages`
- `resume_shares`
- `jd_analyses`
- `grammar_checks`
- `interview_sessions`
- `interview_rounds`
- `interview_messages`
- `interview_reports`

Important user billing fields:

- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `stripeCurrentPeriodEnd`
- `subscriptionStatus`
- `subscriptionPlan`
- `aiImportsCount`

Current subscription plans:

- `free`
- `pro`
- `premium`

## 7. Current Freemium and Paywall Behavior

This section describes the currently implemented behavior, including known
inconsistencies.

### Free

Current enforced limits:

- maximum 1 resume,
- access to 5 free templates:
  - classic
  - modern
  - minimal
  - professional
  - two-column
- JSON and TXT export,
- no public sharing,
- no PDF, DOCX or HTML export through normal API enforcement.

AI resume import:

- PDF, PNG, JPG and WebP up to 10 MB,
- server Gemini key can be used for Free users,
- import is allowed while the user has fewer than 1 resume,
- `aiImportsCount` is incremented after successful AI import,
- the counter currently tracks usage but does not enforce a one-time limit.

Because new users receive a sample resume, the sample currently consumes the
single Free resume slot. A Free user must delete or otherwise replace it before
creating/importing another resume.

### Pro

Current intended and implemented core benefits:

- unlimited resumes,
- all templates,
- PDF, DOCX and HTML export,
- public sharing,
- server Gemini key eligibility in the shared AI provider layer.

Some AI feature UIs still explicitly request Premium even though the shared
server provider accepts Pro. This is a known inconsistency.

### Premium

Current intended benefits:

- everything in Pro,
- AI cover letters,
- AI grammar analysis,
- AI job-match analysis,
- AI translation,
- AI resume generation,
- mock interview,
- AI LinkedIn/professional photo,
- server Gemini key without user BYOK requirement.

### BYOK

Users may configure their own:

- OpenAI-compatible key and base URL,
- Anthropic key,
- Gemini key.

Keys are:

- stored in browser `localStorage`,
- cached separately for each provider,
- not stored in the database,
- transmitted to the BewerbRadar backend through AI request headers.

## 8. Known Entitlement Inconsistencies

The following must be resolved before treating the plan matrix as final:

1. The import paywall copy still says “1 kostenloser Test-Import”, although
   current server logic allows repeated Free imports as long as the user remains
   under the one-resume limit.

2. The Free sample resume consumes the only resume slot and therefore blocks an
   immediate first import until it is deleted.

3. Several Premium AI dialogs enforce Premium only in the UI, while their API
   routes primarily rely on AI-key availability rather than an explicit
   Premium plan check.

4. The shared AI provider allows Pro users to use the server Gemini key, but
   some client dialogs still block Pro users behind a Premium paywall.

5. Interview UI offers a BYOK override, but the interview creation API requires
   `subscriptionPlan === premium`.

6. Client and server entitlement behavior must be unified before marketing
   claims are finalized.

## 9. Stripe

Stripe endpoints:

- `/api/stripe/checkout`
- `/api/stripe/portal`
- `/api/stripe/webhook`

Supported paid tiers:

- Pro monthly/yearly
- Premium monthly/yearly

Displayed prices:

- Pro monthly: €9.99
- Pro annual equivalent: €8.33/month
- Premium monthly: €19.99
- Premium annual equivalent: €16.66/month

Price IDs may be overridden by environment variables. Checked-in fallback IDs
currently exist and must be verified when Stripe products change.

Stripe self-healing behavior:

- checkout and portal search Stripe customers by user e-mail,
- active/trialing subscriptions may repair local customer and subscription
  fields,
- paid users are redirected to the billing portal instead of creating a second
  subscription.

The webhook synchronizes checkout completion and subscription changes.

Required production variables include:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Optional Stripe variables:

- `STRIPE_PRICE_ID_PRO_MONTHLY`
- `STRIPE_PRICE_ID_PRO_YEARLY`
- `STRIPE_PRICE_ID_PREMIUM_MONTHLY`
- `STRIPE_PRICE_ID_PREMIUM_YEARLY`
- `STRIPE_COUPON_FIRST_MONTH`

## 10. AI Architecture

Supported providers:

- OpenAI-compatible
- Anthropic
- Gemini

User keys are automatically detected where possible:

- `AIzaSy...` → Gemini
- `sk-ant-...` → Anthropic

Server-key model:

- Gemini
- current server bypass model: `gemini-3.1-flash-lite`

Server Gemini key is supplied through:

- `GEMINI_API_KEY`

Resume parsing behavior:

- text PDFs are extracted with MuPDF,
- scanned PDFs are rendered page-by-page into images,
- images are sent to the selected model,
- generated data is mapped into the resume section schema,
- uploaded files are handled in memory and are not intentionally persisted.

## 11. Analytics

Google Tag Manager container:

- `GTM-55XL7PR4`

Implementation:

- loaded globally through `src/app/layout.tsx`,
- Consent Mode v2 defaults are set before GTM,
- initial defaults:
  - `analytics_storage: denied`
  - `ad_storage: denied`
  - `ad_user_data: denied`
  - `ad_personalization: denied`

Verified production state on 28 July 2026:

- GTM container ID is present in live HTML,
- consent defaults are present in live HTML.

Still required:

- Consent Management Platform or custom cookie banner,
- consent updates after user choice,
- GA4 measurement ID and Google Tag inside GTM,
- funnel event definitions,
- Tag Assistant validation,
- GA4 DebugView validation,
- privacy review of event parameters.

Resume content, filenames, e-mail addresses and other PII must never be sent to
analytics.

## 12. Production Topology

Verified domains:

### `bewerbradar.de`

- static landing site,
- served from `/var/www/bewerbradar-landing`.

### `copilot.bewerbradar.de`

- this application,
- Nginx proxies to `127.0.0.1:3001`,
- Docker maps `127.0.0.1:3001` to container port `3000`.

### `studio.bewerbradar.de`

- Drizzle Studio,
- Nginx proxies to port `4983`,
- protected by HTTP Basic Authentication.

### `db.bewerbradar.de`

An additional Nginx configuration proxies to port `4983` over HTTP without the
same visible Basic Authentication block.

This is not an approved public interface. Verify DNS and either secure or
remove the route.

Broader running services include:

- PostgreSQL
- Redis
- SeaweedFS

The Copilot does not currently use PostgreSQL, Redis or SeaweedFS for its main
application data.

## 13. Docker Runtime

Production service:

- Compose service: `jadeai`
- Container: `reactive_resume-jadeai-1`
- Image: locally built `reactive_resume-jadeai`
- Restart policy: `unless-stopped`
- volume: `reactive_resume_jadeai_data:/app/data`

Build context:

- `/var/www/jadeai`

Central Compose project:

- `/var/www/bewerbradar/compose.yml`

Application repository on VPS:

- `/var/www/jadeai`

Production branch:

- `main`

## 14. Production Environment Contract

Required or production-relevant variables:

- `AUTH_SECRET`
- `AUTH_ENABLED`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_URL`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Optional:

- `APP_NAME`
- `DEFAULT_LOCALE`
- `NEXT_PUBLIC_GTM_ID`
- Stripe price variables
- Stripe coupon variable
- `DB_TYPE`
- `SQLITE_PATH`
- `DATABASE_URL`

Never document environment values or secrets in Git.

## 15. Current Git and Release State

Verified on 28 July 2026:

- GitHub `copilot/main`: `d8ec95f9`
- VPS repository branch: `main`
- live VPS/application commit: `ec39f6f4`
- production container is running
- documentation commits `ca8cb7dc` and `d8ec95f9` are not deployed on the
  VPS; they do not change the application runtime and require no standalone
  production deployment

Current branch warning:

- `beta` is diverged:
  - 5 commits only on `beta`
  - 41 commits only on `main`
- current `beta` must not be merged into `main` without reconciliation

Before the normal Gemini → beta → Codex → main workflow begins, the branch state
must be reconciled safely.

## 16. Known Technical and Operational Debt

1. The upstream README contains outdated language and product claims.
2. PostgreSQL schema does not fully mirror current SQLite billing fields.
3. SQLite adapter catches migration failures and may continue startup.
4. There is no established automated unit or end-to-end test suite.
5. Repository `compose.yml` references `/api/health`, but no such API route
   currently exists.
6. Production Compose currently reports no health status for the Copilot.
7. Paywall and BYOK behavior is not fully consistent across UI and API.
8. Some Chinese error or fallback strings remain in editor code.
9. `db.bewerbradar.de` may expose Drizzle Studio without the protection used
    by `studio.bewerbradar.de`.
10. PostgreSQL is publicly bound on port 5432 in the broader stack and requires
    firewall and credential review.
11. Deployment script does not fail fast and may print success after an earlier
    command failed.
12. Two historical SQLite database names exist in the production volume.
13. Consent Mode is present, but no user-facing consent mechanism is connected.
14. AI chat-session routes do not consistently verify that a supplied resume
    or session belongs to the current user before listing, reading, creating or
    deleting session data.
15. Some AI error/debug paths log raw model output. That output may contain
    resume content and must be removed or redacted.
