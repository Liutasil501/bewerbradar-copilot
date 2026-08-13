import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { hasCompleteStripePriceConfiguration } from '@/lib/stripe/config';
import {
  buildStripeBillingUpdate,
  findPaidSubscription,
  resolveSubscriptionPlan,
} from '@/lib/stripe/subscription-state';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 });
  }

  if (!hasCompleteStripePriceConfiguration()) {
    console.error('Stripe Webhook unavailable: price configuration is incomplete');
    return NextResponse.json({ error: 'Stripe price configuration not set' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature found' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown signature error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const userId = session.metadata?.userId;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : null;
        const customerId = typeof session.customer === 'string' ? session.customer : null;

        if (!userId || !subscriptionId || !customerId) {
          console.error('Checkout session missing required billing ownership data:', session.id);
          return NextResponse.json({ error: 'Checkout ownership data is incomplete' }, { status: 500 });
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subPlan = resolveSubscriptionPlan(subscription);

        if (subPlan === 'free') {
          console.error('Checkout completed without an active configured subscription:', session.id);
          return NextResponse.json({ error: 'Subscription is not eligible' }, { status: 500 });
        }

        await db
          .update(users)
          .set(buildStripeBillingUpdate(customerId, subscription))
          .where(eq(users.id, userId));

        break;
      }
      
      case 'customer.subscription.updated': {
        const eventSubscription = event.data.object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(eventSubscription.id);
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        await db
          .update(users)
          .set(buildStripeBillingUpdate(customerId, subscription))
          .where(eq(users.stripeCustomerId, customerId));

        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof deletedSubscription.customer === 'string'
            ? deletedSubscription.customer
            : deletedSubscription.customer.id;
        const currentSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 100,
        });
        const subscription =
          findPaidSubscription(currentSubscriptions.data) ||
          currentSubscriptions.data.find(
            (candidate) => candidate.id !== deletedSubscription.id
          ) ||
          deletedSubscription;

        await db
          .update(users)
          .set(buildStripeBillingUpdate(customerId, subscription))
          .where(eq(users.stripeCustomerId, customerId));

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
