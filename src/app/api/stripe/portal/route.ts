import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getUserIdFromRequest, resolveUser } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(req);
    const user = await resolveUser(fingerprint);

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'Unauthorized or no customer ID' }, { status: 401 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
