import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyStripeSubscriptionSession } from '@/lib/billing/verify';

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
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

    if (session.mode !== 'subscription' || !subscriptionId) {
      return NextResponse.json({ verified: false, error: 'Not a valid subscription session' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Call production verification logic
    const verification = verifyStripeSubscriptionSession(
      { id: user.id, stripeCustomerId: user.stripeCustomerId },
      {
        mode: session.mode,
        customer: typeof session.customer === 'string' ? session.customer : null,
        subscription: subscriptionId,
        metadata: session.metadata as Record<string, string | undefined>,
      },
      {
        status: subscription.status,
        items: {
          data: subscription.items.data.map((item) => ({
            price: { id: item.price.id },
          })),
        },
      }
    );

    if (!verification.verified) {
      const statusCode = verification.error === 'Session ownership mismatch' ? 403 : 400;
      return NextResponse.json(verification, { status: statusCode });
    }

    // Synchronize DB ONLY after verification passes
    await db
      .update(users)
      .set({
        stripeCustomerId: verification.customerId || (session.customer as string),
        stripeSubscriptionId: verification.subscriptionId,
        stripePriceId: verification.priceId,
        subscriptionStatus: verification.status,
        subscriptionPlan: verification.plan,
        stripeCurrentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Stripe Session Verification Error:', error);
    return NextResponse.json({ verified: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
