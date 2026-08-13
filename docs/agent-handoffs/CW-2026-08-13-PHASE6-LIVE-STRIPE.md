# Phase 6 - Live Stripe Launch

Task ID: `CW-2026-08-13-PHASE6-LIVE-STRIPE`

## Goal

Move the existing Pro and Premium subscription implementation from Stripe test
mode to a verified live revenue path without changing prices or entitlements.

## Scope

- strict live price configuration,
- fail-closed plan mapping,
- active/trialing-only paid access,
- Stripe Checkout, webhook and customer portal,
- four recurring EUR prices,
- production environment handoff,
- no-charge live smoke test,
- independent review before source publication and deployment.

Stripe Tax remains disabled until an active tax registration and the intended
tax treatment are confirmed. GA4/GTM verification belongs to the next phase.

## External Stripe State

Verified on 13 August 2026:

- restricted live key authentication works,
- two live products exist for Pro and Premium,
- four live recurring EUR prices match the existing product UI,
- the live billing portal configuration is active and default,
- the live webhook endpoint is enabled for checkout completion and subscription
  update/deletion,
- the account currently has no active Stripe Tax registration,
- the restricted key can read the required billing resources and write product,
  price, portal and webhook configuration,
- the restricted key currently cannot create customers because `Customers
  Write` is missing.

No secret values belong in this file.

## Production Environment State

The VPS environment and central Compose definition have been staged with the
required variable names:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO_MONTHLY`
- `STRIPE_PRICE_ID_PRO_YEARLY`
- `STRIPE_PRICE_ID_PREMIUM_MONTHLY`
- `STRIPE_PRICE_ID_PREMIUM_YEARLY`
- `STRIPE_PORTAL_CONFIGURATION_ID`

The environment file is mode `600`, Compose validation passes and backups were
created before the edit. The running container has not been restarted, so the
staged values are not active in the application yet.

## Candidate

- Branch: `codex/phase6-stripe-live`
- Base: `75042d3e8`
- Initial candidate: `5a826979c`
- Corrected candidate: `f8f0ed344`
- Deployment status: `NOT DEPLOYED`

## Implementation Summary

- production no longer falls back to hard-coded test price IDs,
- missing production prices return a controlled billing-unavailable response,
- unknown price IDs never map to Pro,
- paid access is restricted to `active` and `trialing`,
- `past_due`, `unpaid`, `canceled`, `incomplete` and unknown-price
  subscriptions resolve to Free,
- Checkout uses a stable Stripe integration identifier,
- portal sessions use the configured live portal and preserve DE/EN return
  paths,
- Stripe SDK and Stripe.js packages are updated to support the pinned
  `2026-06-24.dahlia` API version,
- Compose passes all live price and portal variables into the app container.
- checkout and portal discard stale test-mode customer IDs during the live-mode
  transition and synchronize negative subscription state back to Free,
- webhook update events retrieve the current subscription before applying it,
- current subscription periods are read from the subscription item for the
  pinned Stripe API version.

## Verification So Far

- TypeScript: passed after the corrective review changes
- focused ESLint: passed after the corrective review changes
- billing tests: 31/31 passed
- Next.js production build: passed, 26/26 pages generated
- production missing-price guard: passed
- strict known/unknown live price mapping: passed
- Stripe products/prices/portal/webhook: verified live
- VPS environment names and permissions: verified
- VPS Compose configuration: valid

## Independent Review

The first review returned NO-GO for stale test-mode customer IDs, missing
negative-state repair, outdated subscription period access and webhook event
ordering. All four findings are corrected in the current worktree and covered
by focused billing tests. The second review confirmed those fixes but found one
remaining delayed-delete ordering case: an old deleted subscription could
overwrite a newer active subscription for the same customer. The next delta
queries current customer subscriptions and preserves a configured active or
trialing replacement before writing Free.

## Open External Gate

Either enable `Customers Write` on the restricted runtime key or explicitly
approve the full live secret as the persistent server credential. Then approve
and run the no-charge sequence:

1. create disposable Stripe customer,
2. create live unpaid Checkout Session,
3. create customer portal session,
4. expire Checkout Session,
5. delete disposable customer.

After that, complete the independent code review. Deployment still requires
explicit authorization in the current request.
