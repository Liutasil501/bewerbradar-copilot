import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  hasCompleteStripePriceConfiguration,
  STRIPE_CONFIG,
} from '@/lib/stripe/config';
import { discoverStripeBillingState } from '@/lib/stripe/subscription-state';

export async function POST(req: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(req);
    const user = await resolveUser(fingerprint);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasCompleteStripePriceConfiguration()) {
      console.error('Stripe Portal unavailable: price configuration is incomplete');
      return NextResponse.json({ error: 'Billing is temporarily unavailable' }, { status: 503 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const locale = rawBody?.locale === 'en' ? 'en' : 'de';

    const billingState = await discoverStripeBillingState(user);
    await db.update(users).set(billingState.update).where(eq(users.id, user.id));

    let customerId = billingState.customer?.id || null;

    // If still missing (e.g. user has no Stripe customer yet), create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      // Cache customerId in the database
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id));
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/dashboard`,
      ...(STRIPE_CONFIG.portalConfigurationId && {
        configuration: STRIPE_CONFIG.portalConfigurationId,
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

