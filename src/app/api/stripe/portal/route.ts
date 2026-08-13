import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  hasCompleteStripePriceConfiguration,
  isPaidSubscriptionStatus,
  resolvePlanFromPriceId,
  STRIPE_CONFIG,
} from '@/lib/stripe/config';
import Stripe from 'stripe';

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

    let customerId = user.stripeCustomerId;

    if (user.email) {
      // Fetch up to 10 customers matching the email to look for active subscriptions
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 10,
      });

      let activeCustomer: Stripe.Customer | null = null;
      let activeSub: Stripe.Subscription | null = null;
      let fallbackCustomer: Stripe.Customer | null = null;

      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        // Find if this customer has any active or trialing subscription
        const activeOrTrialingSub = subscriptions.data.find((sub) =>
          isPaidSubscriptionStatus(sub.status)
        );

        if (activeOrTrialingSub) {
          activeCustomer = customer as Stripe.Customer;
          activeSub = activeOrTrialingSub;
          break;
        }

        if (!fallbackCustomer || customer.id === user.stripeCustomerId) {
          fallbackCustomer = customer as Stripe.Customer;
        }
      }

      const chosenCustomer = activeCustomer || fallbackCustomer;

      if (chosenCustomer) {
        customerId = chosenCustomer.id;

        const updateData: Record<string, unknown> = {
          stripeCustomerId: customerId,
        };

        if (activeSub) {
          const priceId = activeSub.items.data[0]?.price.id;
          updateData.stripeSubscriptionId = activeSub.id;
          updateData.stripePriceId = priceId;
          updateData.subscriptionStatus = activeSub.status;
          updateData.subscriptionPlan = resolvePlanFromPriceId(priceId) || 'free';
          updateData.stripeCurrentPeriodEnd = new Date(((activeSub as unknown) as { current_period_end: number }).current_period_end * 1000);
        }

        const needsUpdate =
          user.stripeCustomerId !== customerId ||
          (activeSub && user.stripeSubscriptionId !== activeSub.id) ||
          (activeSub && user.subscriptionPlan === 'free');

        if (needsUpdate) {
          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, user.id));
        }
      }
    }

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

