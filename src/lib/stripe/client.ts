import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build_only', {
  apiVersion: '2026-06-24.dahlia',
  appInfo: {
    name: 'BewerbRadar Copilot',
    version: '0.1.0',
  },
});

