# Engineering Guardrails

Read this guide before changing application code, data flows, authentication,
authorization, billing, AI-provider behavior, analytics, privacy-sensitive
behavior or database/runtime integration.

The shared rules in `AGENTS.md` remain authoritative.

## Architecture Boundaries

- Keep product logic out of low-level `src/components/ui/`.
- Keep database access in repositories where practical.
- Enforce authentication, ownership and plan restrictions server-side.
- Treat UI paywalls as user experience, not security boundaries.
- Preserve German and English localization.
- Do not reintroduce untranslated Chinese UI or fallback strings.
- Avoid unnecessary new dependencies.
- Reuse established stores, repositories, schemas and components.
- Keep changes focused and explain meaningful adjacent refactors.
- Do not silently change subscription entitlements or pricing.
- Trace affected behavior end-to-end:
  page/component → store/hook → API route → domain service/provider →
  repository/database.

## Database

Production currently uses SQLite.

Relevant files:

- `src/lib/db/schema.ts`
- `src/lib/db/adapters/sqlite.ts`
- `src/lib/db/repositories/`
- `drizzle/migrations/`

A database schema change is incomplete without:

1. schema update,
2. checked-in Drizzle migration,
3. compatibility review for existing production data,
4. adapter review,
5. Docker/runtime packaging review,
6. verification against an upgraded existing database when risk warrants it.

Do not assume PostgreSQL parity. The PostgreSQL schema and migrations currently
lag behind the production SQLite schema and require explicit review.

Do not delete, replace or recreate a production database as a migration
shortcut.

## Authentication and Authorization

Production has `AUTH_ENABLED=true`.

Supported production authentication:

- Google OAuth
- e-mail magic link via Nodemailer

When OAuth is disabled locally, fingerprint mode is used.

For authenticated data:

- verify the current user in every protected API route,
- verify resource ownership,
- enforce plan restrictions server-side,
- do not rely only on middleware or client UI,
- do not expose user data through debug routes.

Public routes and shared resumes require special scrutiny because they bypass
normal authenticated navigation.

## AI Providers and User API Keys

Supported providers:

- OpenAI-compatible
- Anthropic
- Google Gemini

User-provided API keys:

- are stored in browser `localStorage`,
- are not persisted in the application database,
- are transmitted to the BewerbRadar backend in request headers for AI calls,
- must never be logged, added to analytics or committed.

The server-side Gemini key is used only for plan and feature paths allowed by
the current provider and entitlement logic.

Changes to AI access must review both:

- client-side paywall behavior,
- server-side provider and entitlement behavior.

## Privacy and Sensitive Data

Resume content is sensitive personal data.

Never send resume content, filenames, e-mail addresses, phone numbers, uploaded
documents or user identifiers to analytics.

Never expose or print:

- API keys,
- OAuth secrets,
- Stripe secrets,
- SMTP credentials,
- SSH private keys,
- production environment files,
- complete database contents.

Do not add secret values to documentation. Document variable names only.

Do not log complete resumes, uploaded document contents, API keys or other PII.

Uploaded resume files should remain in memory unless persistent storage is an
explicit product requirement.

## Risk-Based Verification

Verification must be proportional to risk.

Typical checks:

- `pnpm type-check`
- ESLint for changed files or `pnpm lint`
- `pnpm build`
- focused browser or API smoke tests
- inspection of the final Git diff
- database migration verification
- production verification after an authorized deployment

Not every text or styling change requires the full suite.

Stronger verification is required for:

- authentication and authorization,
- database schema and migrations,
- Stripe and subscriptions,
- AI-provider access,
- resume import and export,
- sharing,
- deployment and Docker,
- analytics and consent.

There is currently no established automated unit or end-to-end test suite. Do
not imply that automated tests passed when only type-checking or a build ran.
