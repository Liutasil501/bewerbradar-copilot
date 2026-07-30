import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PaywallTrigger } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(req);
    const user = await resolveUser(fingerprint);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid session ID' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify ownership: metadata.userId must match user.id OR customer must match user.stripeCustomerId
    const isOwner =
      session.metadata?.userId === user.id ||
      (user.stripeCustomerId && session.customer === user.stripeCustomerId);

    if (!isOwner) {
      return NextResponse.json({ verified: false, error: 'Session ownership mismatch' }, { status: 403 });
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';

    if (!isPaid) {
      return NextResponse.json({ verified: false, status: session.status });
    }

    const getPlanFromPriceId = (priceId: string): 'free' | 'pro' | 'premium' => {
      if (!priceId) return 'free';
      if (priceId === STRIPE_CONFIG.prices.premium.monthly || priceId === STRIPE_CONFIG.prices.premium.yearly) return 'premium';
      if (priceId === STRIPE_CONFIG.prices.pro.monthly || priceId === STRIPE_CONFIG.prices.pro.yearly) return 'pro';
      return 'pro';
    };

    let subPlan: 'free' | 'pro' | 'premium' = (session.metadata?.tier as 'pro' | 'premium') || 'pro';
    let subscriptionId = session.subscription as string;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      subPlan = getPlanFromPriceId(priceId);

      // Synchronously update database so UI gets instant paid status without waiting for webhook
      await db
        .update(users)
        .set({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          subscriptionStatus: subscription.status,
          subscriptionPlan: subPlan,
          stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        })
        .where(eq(users.id, user.id));
    }

    const trigger: PaywallTrigger = (session.metadata?.trigger as PaywallTrigger) || 'unknown';
    const billingPeriod: 'monthly' | 'yearly' = (session.metadata?.plan as 'monthly' | 'yearly') || 'monthly';

    return NextResponse.json({
      verified: true,
      plan: subPlan,
      tier: subPlan,
      billingPeriod,
      trigger,
    });
  } catch (error) {
    console.error('Stripe Session Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
