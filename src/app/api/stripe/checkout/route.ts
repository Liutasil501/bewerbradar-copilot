import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { CheckoutInputSchema } from '@/lib/billing/schema';

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

    const priceId = STRIPE_CONFIG.prices[tier][plan];

    const getPlanFromPriceId = (pId: string): 'free' | 'pro' | 'premium' => {
      if (!pId) return 'free';
      if (pId === STRIPE_CONFIG.prices.premium.monthly || pId === STRIPE_CONFIG.prices.premium.yearly) return 'premium';
      if (pId === STRIPE_CONFIG.prices.pro.monthly || pId === STRIPE_CONFIG.prices.pro.yearly) return 'pro';
      return 'pro';
    };

    let customerId = user.stripeCustomerId;
    let activeSub: Stripe.Subscription | null = null;

    if (user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 10,
      });

      let activeCustomer: Stripe.Customer | null = null;
      let fallbackCustomer: Stripe.Customer | null = null;

      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        const activeOrTrialingSub = subscriptions.data.find(
          (sub) => sub.status === 'active' || sub.status === 'trialing'
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
          const subPriceId = activeSub.items.data[0]?.price.id;
          updateData.stripeSubscriptionId = activeSub.id;
          updateData.stripePriceId = subPriceId;
          updateData.subscriptionStatus = activeSub.status;
          updateData.subscriptionPlan = getPlanFromPriceId(subPriceId);
          updateData.stripeCurrentPeriodEnd = new Date(
            (activeSub as unknown as { current_period_end: number }).current_period_end * 1000
          );
        }

        const needsUpdate =
          user.stripeCustomerId !== customerId ||
          (activeSub && user.stripeSubscriptionId !== activeSub.id) ||
          (activeSub && user.subscriptionPlan === 'free');

        if (needsUpdate) {
          await db.update(users).set(updateData).where(eq(users.id, user.id));
          user.stripeCustomerId = customerId;
          if (activeSub) {
            user.subscriptionPlan = updateData.subscriptionPlan as 'pro' | 'premium';
          }
        }
      }
    }

    if ((user.subscriptionPlan !== 'free' || activeSub) && customerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/dashboard`,
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
    const targetLocale = locale === 'en' ? 'en' : 'de';
    const returnPath =
      returnIntent?.type && ['export', 'template', 'share', 'ai_feature'].includes(returnIntent.type) && returnIntent.resumeId
        ? `/${targetLocale}/editor/${encodeURIComponent(returnIntent.resumeId)}`
        : `/${targetLocale}/dashboard`;

    const sanitizedReturnIntent = returnIntent
      ? {
          type: returnIntent.type,
          ...(returnIntent.format && { format: returnIntent.format }),
          ...(returnIntent.templateId && { templateId: returnIntent.templateId }),
          ...(returnIntent.featureKey && { featureKey: returnIntent.featureKey }),
          ...(returnIntent.resumeId && { resumeId: returnIntent.resumeId }),
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
