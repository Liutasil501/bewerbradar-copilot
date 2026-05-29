import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature found' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    const getPlanFromPriceId = (priceId: string): 'free' | 'pro' | 'premium' => {
      if (!priceId) return 'free';
      if (priceId === STRIPE_CONFIG.prices.premium.monthly || priceId === STRIPE_CONFIG.prices.premium.yearly) return 'premium';
      if (priceId === STRIPE_CONFIG.prices.pro.monthly || priceId === STRIPE_CONFIG.prices.pro.yearly) return 'pro';
      return 'pro'; // default fallback if paid
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId) {
          console.error('Checkout session missing userId metadata:', session.id);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const subPlan = getPlanFromPriceId(priceId);

        await db
          .update(users)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            subscriptionPlan: subPlan,
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          })
          .where(eq(users.id, userId));

        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        
        let subPlan = getPlanFromPriceId(priceId);
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          subPlan = 'free'; // downgrade if canceled
        }

        await db
          .update(users)
          .set({
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            subscriptionPlan: subPlan,
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          })
          .where(eq(users.stripeCustomerId, customerId));

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
