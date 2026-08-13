import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import {
  getConfiguredPriceId,
  hasCompleteStripePriceConfiguration,
  STRIPE_CONFIG,
} from '@/lib/stripe/config';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CheckoutInputSchema } from '@/lib/billing/schema';
import { resolveCheckoutReturnPath } from '@/lib/billing/return-resolver';
import { discoverStripeBillingState } from '@/lib/stripe/subscription-state';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(req);
    const user = await resolveUser(fingerprint);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = CheckoutInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid checkout parameters' }, { status: 400 });
    }

    const { tier, plan, trigger, returnIntent, locale } = parseResult.data;

    if (!hasCompleteStripePriceConfiguration()) {
      console.error('Stripe Checkout unavailable: price configuration is incomplete');
      return NextResponse.json({ error: 'Billing is temporarily unavailable' }, { status: 503 });
    }

    const priceId = getConfiguredPriceId(tier, plan);
    if (!priceId) {
      return NextResponse.json({ error: 'Billing is temporarily unavailable' }, { status: 503 });
    }

    const billingState = await discoverStripeBillingState(user);
    await db.update(users).set(billingState.update).where(eq(users.id, user.id));

    let customerId = billingState.customer?.id || null;
    user.stripeCustomerId = customerId;
    user.subscriptionPlan = billingState.plan;

    if (billingState.plan !== 'free' && customerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/dashboard`,
        ...(STRIPE_CONFIG.portalConfigurationId && {
          configuration: STRIPE_CONFIG.portalConfigurationId,
        }),
      });
      return NextResponse.json({ url: portalSession.url });
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnPath = resolveCheckoutReturnPath(locale, returnIntent);

    const sanitizedReturnIntent = returnIntent
      ? {
          type: returnIntent.type,
          ...(returnIntent.format && { format: returnIntent.format }),
          ...(returnIntent.templateId && { templateId: returnIntent.templateId }),
          ...(returnIntent.featureKey && { featureKey: returnIntent.featureKey }),
          ...(returnIntent.resumeId && { resumeId: returnIntent.resumeId }),
          ...(returnIntent.origin && { origin: returnIntent.origin }),
        }
      : undefined;

    const returnIntentJson = sanitizedReturnIntent ? JSON.stringify(sanitizedReturnIntent) : '';
    const intentQuery = returnIntentJson ? `&returnIntent=${encodeURIComponent(returnIntentJson)}` : '';
    const queryParams = `&tier=${encodeURIComponent(tier)}&billing_period=${encodeURIComponent(plan)}&trigger=${encodeURIComponent(trigger)}${intentQuery}`;

    const successUrl = `${baseUrl}${returnPath}?session_id={CHECKOUT_SESSION_ID}${queryParams}`;
    const cancelUrl = `${baseUrl}${returnPath}?canceled=true${queryParams}`;

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        tier,
        plan,
        trigger,
        returnIntentJson: returnIntentJson || '',
      },
      integration_identifier: 'bewerbradar_checkout_fqzmpkrt',
    };

    if (plan === 'monthly' && STRIPE_CONFIG.coupons.firstMonthDiscount) {
      sessionData.discounts = [{ coupon: STRIPE_CONFIG.coupons.firstMonthDiscount }];
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
