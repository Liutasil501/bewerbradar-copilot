const crypto = require('crypto');

// The dummy secret we put in .env.local
const secret = 'whsec_dummy_secret_for_local_dev_you_need_stripe_cli';

// The payload for a checkout session completion
const payload = {
  id: 'evt_test_123',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      object: 'checkout.session',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
      metadata: {
        userId: '1', // Default user id
        tier: 'premium',
        plan: 'monthly'
      }
    }
  }
};

const payloadString = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1000);

// Stripe signature format: t=<timestamp>,v1=<signature>
const signedPayload = `${timestamp}.${payloadString}`;
const signature = crypto
  .createHmac('sha256', secret)
  .update(signedPayload)
  .digest('hex');
const stripeSignature = `t=${timestamp},v1=${signature}`;

async function runTest() {
  console.log('Sending mock webhook to http://localhost:3000/api/stripe/webhook ...');
  try {
    // Note: Node 18+ has built-in fetch
    const response = await fetch('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature
      },
      body: payloadString
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error sending webhook:', err.message);
  }
}

runTest();
