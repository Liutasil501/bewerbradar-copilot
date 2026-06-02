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
        created: new Date(c.created * 1000).toISOString(),
        subscriptions: subs.data.map(s => ({
          id: s.id,
          status: s.status,
          priceId: s.items.data[0]?.price.id,
          currentPeriodEnd: new Date(s.current_period_end * 1000).toISOString(),
        })),
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          amount: inv.amount_due / 100,
          status: inv.status,
          pdf: inv.invoice_pdf,
        })),
      });
    }
    return NextResponse.json({ customers: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
