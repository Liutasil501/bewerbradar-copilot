import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizePaywallTrigger, sanitizeReturnIntent } from '@/lib/billing/schema';

export async function POST(req: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(req);
    const user = await resolveUser(fingerprint);

    if (!user) {
      return NextResponse.json({ verified: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ verified: false, error: 'Missing or invalid session ID' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 1. Ownership check: metadata.userId MUST match user.id AND (if customer exists) customer MUST match user.stripeCustomerId
    const metadataUserIdMatch = session.metadata?.userId === user.id;
    const customerMatch = !user.stripeCustomerId || !session.customer || session.customer === user.stripeCustomerId;

    if (!metadataUserIdMatch || !customerMatch) {
      return NextResponse.json({ verified: false, error: 'Session ownership mismatch' }, { status: 403 });
    }

    // 2. Mode check: Session MUST be subscription mode with a valid subscription ID
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
    if (session.mode !== 'subscription' || !subscriptionId) {
      return NextResponse.json({ verified: false, error: 'Not a valid subscription session' }, { status: 400 });
    }

    // 3. Active Subscription Status check: Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const activeStatuses = ['active', 'trialing'];

    if (!activeStatuses.includes(subscription.status)) {
      return NextResponse.json(
        { verified: false, status: subscription.status, error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    // 4. Strict Price Mapping Check: Fail closed on unknown prices!
    const priceId = subscription.items.data[0]?.price.id;
    let subPlan: 'pro' | 'premium' | null = null;

    if (priceId === STRIPE_CONFIG.prices.pro.monthly || priceId === STRIPE_CONFIG.prices.pro.yearly) {
      subPlan = 'pro';
    } else if (
      priceId === STRIPE_CONFIG.prices.premium.monthly ||
      priceId === STRIPE_CONFIG.prices.premium.yearly
    ) {
      subPlan = 'premium';
    }

    if (!subPlan || !priceId) {
      return NextResponse.json({ verified: false, error: 'Unknown or unconfigured price ID' }, { status: 400 });
    }

    // 5. Synchronize DB ONLY after ALL verification conditions have passed
    await db
      .update(users)
      .set({
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: subPlan,
        stripeCurrentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
      })
      .where(eq(users.id, user.id));

    const trigger = sanitizePaywallTrigger(session.metadata?.trigger);
    const returnIntent = sanitizeReturnIntent(session.metadata?.returnIntentJson);
    const billingPeriod: 'monthly' | 'yearly' = session.metadata?.plan === 'yearly' ? 'yearly' : 'monthly';

    return NextResponse.json({
      verified: true,
      plan: subPlan,
      tier: subPlan,
      billingPeriod,
      trigger,
      returnIntent,
    });
  } catch (error) {
    console.error('Stripe Session Verification Error:', error);
    return NextResponse.json({ verified: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
