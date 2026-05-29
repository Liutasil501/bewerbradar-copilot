import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build_only', {
  apiVersion: '2025-12-19.acacia' as any, // Using any to bypass strict literal check for compatibility
  appInfo: {
    name: 'BewerbRadar Copilot',
    version: '0.1.0',
  },
});
