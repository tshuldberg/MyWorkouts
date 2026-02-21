import { NextResponse } from 'next/server';

// Stripe webhook handler for subscription lifecycle events
// TODO: Validate Stripe signature, parse event, update subscriptions table
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  // TODO: Verify webhook signature with STRIPE_WEBHOOK_SECRET
  // TODO: Parse the event and handle:
  //   - customer.subscription.created
  //   - customer.subscription.updated
  //   - customer.subscription.deleted
  //   - invoice.payment_succeeded
  //   - invoice.payment_failed

  console.log('Stripe webhook received:', body.slice(0, 100));

  return NextResponse.json({ received: true });
}
