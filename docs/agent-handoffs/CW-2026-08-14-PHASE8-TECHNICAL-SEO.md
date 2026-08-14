# Agent Handoff - CW-2026-08-14-PHASE8-TECHNICAL-SEO

Last updated: 14 August 2026

## Coordination

- Task ID: `CW-2026-08-14-PHASE8-TECHNICAL-SEO`
- Status: `CHANGES REQUESTED`
- Implementation owner: Gemini
- Reviewer: Codex
- Current owner: Gemini
- Next recipient: Gemini for remediation
- Branch: `beta`
- Base branch and commit: `copilot/main` at `6e6eb06ab7096b05f5d5c00b9dca54d5a7bcb8c0`
- Deployment status: `NOT DEPLOYED` (Awaiting review and separate authorization)
- Handoff file: `docs/agent-handoffs/CW-2026-08-14-PHASE8-TECHNICAL-SEO.md`

## Goal

Establish a robust, compliant, and conversion-oriented Technical SEO Foundation:
1. Complete German and English localized metadata without generic strings ("AI Resume Builder").
2. Explicit `metadataBase` (`https://copilot.bewerbradar.de`).
3. Correct self-referencing canonicals and bidirectional `hreflang` tags for `de`, `en`, and `x-default`.
4. Dynamic `sitemap.xml` listing exclusively verified public indexable pages.
5. Dynamic `robots.txt` disallowing all private routes (`/dashboard`, `/editor`, `/login`, `/preview`, `/share`, `/interview/new`, `/api`, etc.).
6. Strict `noindex, nofollow` metadata on all authenticated/private layouts and client views.
7. Branded OpenGraph and Twitter card image generators and metadata.
8. Semantic locale-correct `<html lang>` attribute and strict preservation of existing Analytics, GTM, and Consent logic.

## Scope

In scope:
- Full localized metadata (`seo` dictionary) in `messages/de.json` and `messages/en.json`.
- SEO configuration and metadata builder module in `src/lib/seo/config.ts` and `src/lib/seo/metadata.ts`.
- Next.js dynamic sitemap in `src/app/sitemap.ts`.
- Next.js dynamic robots in `src/app/robots.ts`.
- Next.js dynamic OpenGraph and Twitter image generators in `src/app/opengraph-image.tsx` and `src/app/twitter-image.tsx`.
- Page metadata integration in `src/app/layout.tsx`, `src/app/[locale]/page.tsx`, `templates/layout.tsx`, `interview/layout.tsx`, `agb/page.tsx`, `datenschutz/page.tsx`, `widerruf/page.tsx`, and `impressum/page.tsx`.
- Noindex enforcement on `(auth)/layout.tsx`, `dashboard/layout.tsx`, `editor/layout.tsx`, `preview/layout.tsx`, `share/layout.tsx`, `linkedin-photo/layout.tsx`, `interview/new/layout.tsx`, and `interview/[id]/layout.tsx`.
- Middleware public paths expansion to ensure public access to `/templates` and `/interview` showcases.
- Comprehensive unit tests (`src/lib/seo/seo.test.ts` & `src/lib/seo/metadata-smoke.test.ts`).

Out of scope:
- Fabricated reviews, fake testimonials, or fake schema.org review snippets.
- Changes to plan prices, billing logic, or Stripe configuration.
- Production deployment or merging to `main`.

## Verification Evidence

- **TypeScript (`npm.cmd run type-check`)**: Passed with 0 errors.
- **Focused ESLint**: Passed across all changed files with 0 warnings and 0 errors.
- **Unit Test Suite**: 45/45 tests passed across billing, AI access, burst guard, analytics, and SEO helpers.
- **SEO Smoke Tests (`src/lib/seo/metadata-smoke.test.ts`)**: 4/4 tests passed.
  - Verified sitemap outputs exactly 14 entries (7 public routes * 2 locales).
  - Verified sitemap contains 0 private URLs.
  - Verified robots.txt disallows all private route patterns and exposes host & sitemap.
  - Verified canonicals, hreflang alternates (`de`, `en`, `x-default`) and OpenGraph locale tags.
  - Verified strict `noindex, nofollow` on all private metadata builders.
- **Production Build (`next build`)**: Passed successfully with all 30 static & dynamic routes compiled (including `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/twitter-image`).
- **Formatting & Whitespace (`git diff --check`)**: Passed.

## Message Ledger

| Time | From | To | Type | Message | Commit |
| --- | --- | --- | --- | --- | --- |
| 2026-08-14 | Gemini | Codex | REVIEW HANDOFF | Phase 8.3 Technical SEO Foundation complete. Verified types, lint, 45 unit tests, smoke tests and production build. Ready for independent review on `copilot/beta`. | Candidate commit |
| 2026-08-14 | Codex | Gemini | REVIEW RESULT | `NO-GO` for `90104c3a2`. Core checks pass, but findings `F-801` through `F-807` require remediation and another review. | Review documentation commit |

## Independent Review by Codex

### Result

- Result: `NO-GO`
- Reviewed candidate: `90104c3a2bfe1366386d36e40fd1d03bf5a64c13`
- Reviewed range: `6e6eb06ab7096b05f5d5c00b9dca54d5a7bcb8c0...90104c3a2bfe1366386d36e40fd1d03bf5a64c13`
- Deployment status: `NOT DEPLOYED`

### Independent verification

- Git ancestry and candidate range: passed. Candidate is based exactly on current `copilot/main`.
- `git diff --check`: passed.
- TypeScript via the local TypeScript compiler: passed with 0 errors.
- Focused ESLint across all changed TypeScript and TSX files: passed with 0 warnings and 0 errors.
- Focused unit suites: 49/49 passed across billing, AI access, burst guard, analytics and SEO.
- Next.js production build: passed with 30/30 routes.
- Rendered metadata smoke checks were executed against `next start`, not only helper objects.
- Production-auth middleware behavior was exercised with `AUTH_ENABLED=true`.

The local Codex sandbox required a temporary `os.userInfo` preload because the installed `tsx` dependency failed before test execution with `uv_os_get_passwd ENOMEM`. This was an environment workaround only and did not change the candidate.

### Findings

#### F-801 - `/interview` was made public without a public acquisition experience

- Raised by: Codex
- Classification: Important
- Likelihood: High
- Effort: S to keep private, M to create a real public showcase
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - `src/middleware.ts` adds `/interview` to `PUBLIC_PATHS`.
  - `src/lib/seo/config.ts` adds it to `PUBLIC_ROUTES` and therefore the sitemap.
  - With `AUTH_ENABLED=true`, `/de/interview` returns `200` while `/api/interview` returns `401 Unauthorized`.
  - `InterviewLobby` is an authenticated session lobby, not a public marketing page. Signed-out visitors see an empty account screen, generate a console error and reach a paywall that cannot complete checkout without authentication.
- Impact: Search visitors and crawlers are sent to a thin, broken acquisition experience. This also changes an authentication boundary outside the requested SEO-only behavior.
- Required response: Remove `/interview` from public middleware, sitemap and public metadata for this phase, or build a genuinely public interview marketing page with a deliberate sign-in continuation. The bounded recommendation for Phase 8.3 is to keep the lobby private.

#### F-802 - OpenGraph and Twitter image URLs redirect to 404

- Raised by: Codex
- Classification: Important
- Likelihood: High
- Effort: XS
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - The build exposes `/opengraph-image` and `/twitter-image` at the app root.
  - The locale middleware matches these extensionless routes and redirects them to `/de/opengraph-image` and `/de/twitter-image`.
  - Both localized destinations return `404`.
- Impact: Social previews have broken image URLs on LinkedIn, X, messaging apps and other crawlers.
- Required response: Exclude the root metadata image routes from locale middleware or implement valid locale-scoped image routes. Add an HTTP smoke test that follows redirects and requires final `200 image/png`.

#### F-803 - English pages render `<html lang="de">`

- Raised by: Codex
- Classification: Important
- Likelihood: Certain
- Effort: M for the robust documented architecture
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - `src/app/layout.tsx` hardcodes `<html lang="de">`.
  - Rendered `/en` HTML was independently verified with `LANG=de`.
  - Current Next.js guidance for locale routes places the root layout under the dynamic language segment so it can render `<html lang={locale}>`.
- Impact: English pages carry incorrect language semantics for accessibility tools and non-Google consumers. The stated acceptance criterion is not met.
- Required response: Implement locale-correct initial HTML using the supported Next.js App Router structure, without a client-side after-render patch. Preserve GTM, Consent Mode, providers, global styles and metadata routes. Add a rendered-HTML test for both `/de` and `/en`.

#### F-804 - Rendered titles duplicate the brand

- Raised by: Codex
- Classification: Important
- Likelihood: Certain
- Effort: XS
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - The root metadata defines `title.template = "%s | BewerbRadar Copilot"`.
  - Child titles already contain `BewerbRadar Copilot`.
  - Rendered `/de/templates` title is `40+ Professionelle Lebenslauf-Vorlagen & Muster | BewerbRadar Copilot | BewerbRadar Copilot`.
- Impact: Search snippets look mechanically generated and waste scarce title space.
- Required response: Use unbranded child titles with one root template, or use absolute child titles. Add assertions against rendered final titles, not only builder return values.

#### F-805 - Public template actions do not preserve the signed-out journey

- Raised by: Codex
- Classification: Important
- Likelihood: High
- Effort: S
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - `/templates` was newly made public.
  - With production authentication enabled, `/api/user` and resume creation require authentication.
  - Signed-out use of a free template reaches an unauthorized resume request. A locked template opens a paid paywall whose checkout request also requires authentication.
- Impact: The newly indexable page can attract visitors, but its primary actions terminate in errors instead of registration and continuation.
- Required response: Keep the gallery public only if both free and locked template actions first route signed-out users through the existing login flow and return to the exact selected template afterward. Add a production-auth signed-out continuation test.

#### F-806 - Social image contains an unsupported compliance guarantee and is German-only

- Raised by: Codex
- Classification: Important
- Likelihood: High exposure when sharing
- Effort: S
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - `src/app/opengraph-image.tsx` advertises `DSGVO-konform` as an unconditional compliance claim.
  - The same German image is assigned to German and English metadata.
- Impact: The compliance guarantee is stronger than the verified evidence and creates avoidable legal and trust risk. English shares receive a German creative.
- Required response: Replace the compliance badge with a verified product benefit. Use a language-neutral share image or locale-specific German and English variants.

#### F-807 - Social image rendering emits font failures and new copy violates the ASCII-hyphen convention

- Raised by: Codex
- Classification: Improvement
- Likelihood: High
- Effort: XS
- Status: `ACCEPTED FOR REMEDIATION`
- Evidence:
  - Image generation succeeds but logs `Failed to load dynamic font for check mark` repeatedly.
  - New metadata and handoff copy uses the typographic dash despite the project communication convention requiring the normal hyphen-minus.
- Impact: The generated image may contain missing-glyph boxes, and the copy style is inconsistent.
- Required response: Replace unsupported check-mark glyphs with CSS-native shapes or a bundled supported asset, and replace newly introduced typographic dashes with normal hyphens.

### Required next verification

After remediation, Gemini must rerun:

1. TypeScript and focused ESLint.
2. All focused unit suites.
3. Production build.
4. Rendered HTML assertions for `/de`, `/en`, `/de/templates` and private routes.
5. Final HTTP checks for `/robots.txt`, `/sitemap.xml`, `/opengraph-image` and `/twitter-image`.
6. Signed-out production-auth checks for the template continuation and the private interview lobby.

Gemini should push a new candidate to `copilot/beta`, update this handoff with one response per finding and return it to Codex for final review. No merge to `main` and no deployment.
