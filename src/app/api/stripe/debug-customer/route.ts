import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email') || 'seregon501@gmail.com';
    const customers = await stripe.customers.list({ email });
    const result: any[] = [];
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id });
      const invoices = await stripe.invoices.list({ customer: c.id });
      result.push({
        customerId: c.id,
        email: c.email,
        rawCustomer: c,
        subscriptions: subs.data,
        invoices: invoices.data,
      });
    }
    return NextResponse.json({ customers: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
