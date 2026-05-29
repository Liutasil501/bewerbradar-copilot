import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(req);
    const user = await resolveUser(fingerprint);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, plan } = await req.json(); // tier: 'pro' | 'premium', plan: 'monthly' | 'yearly'
    
    if (!['pro', 'premium'].includes(tier) || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid tier or plan selected' }, { status: 400 });
    }

    const priceId = STRIPE_CONFIG.prices[tier as 'pro' | 'premium'][plan as 'monthly' | 'yearly'];

    let customerId = user.stripeCustomerId;

    // Create a new customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    const sessionData: any = {
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        tier,
        plan,
      },
    };

    // Apply first-month discount coupon if it's the monthly plan
    if (plan === 'monthly' && STRIPE_CONFIG.coupons.firstMonthDiscount) {
      sessionData.discounts = [{ coupon: STRIPE_CONFIG.coupons.firstMonthDiscount }];
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
