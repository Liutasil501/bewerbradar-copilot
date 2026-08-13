import Stripe from 'stripe';
import { stripe } from './client';
import {
  isPaidSubscriptionStatus,
  resolvePlanFromPriceId,
  type StripePlan,
} from './config';

export interface StripeBillingUser {
  id: string;
  email?: string | null;
  stripeCustomerId?: string | null;
}

export interface DiscoveredStripeBillingState {
  customer: Stripe.Customer | null;
  subscription: Stripe.Subscription | null;
  plan: 'free' | StripePlan;
  update: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    subscriptionStatus: string | null;
    subscriptionPlan: 'free' | StripePlan;
    stripeCurrentPeriodEnd: Date | null;
  };
}

export function getSubscriptionPeriodEnd(
  subscription: Pick<Stripe.Subscription, 'items'>
): Date | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return typeof periodEnd === 'number' ? new Date(periodEnd * 1000) : null;
}

export function resolveSubscriptionPlan(
  subscription?: Pick<Stripe.Subscription, 'status' | 'items'> | null
): 'free' | StripePlan {
  if (!subscription || !isPaidSubscriptionStatus(subscription.status)) return 'free';

  const priceId = subscription.items.data[0]?.price.id;
  return resolvePlanFromPriceId(priceId) || 'free';
}

export function findPaidSubscription(
  subscriptions: Stripe.Subscription[]
): Stripe.Subscription | null {
  return (
    subscriptions.find(
      (subscription) => resolveSubscriptionPlan(subscription) !== 'free'
    ) || null
  );
}

export function buildStripeBillingUpdate(
  customerId: string | null,
  subscription?: Stripe.Subscription | null
): DiscoveredStripeBillingState['update'] {
  const plan = resolveSubscriptionPlan(subscription);

  return {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription?.id || null,
    stripePriceId: subscription?.items.data[0]?.price.id || null,
    subscriptionStatus: subscription?.status || null,
    subscriptionPlan: plan,
    stripeCurrentPeriodEnd: subscription ? getSubscriptionPeriodEnd(subscription) : null,
  };
}

function isDeletedCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer
): customer is Stripe.DeletedCustomer {
  return 'deleted' in customer && customer.deleted === true;
}

function isMissingStripeResource(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === 'resource_missing'
  );
}

async function retrieveStoredCustomer(customerId?: string | null): Promise<Stripe.Customer | null> {
  if (!customerId) return null;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    return isDeletedCustomer(customer) ? null : customer;
  } catch (error) {
    if (isMissingStripeResource(error)) return null;
    throw error;
  }
}

export async function discoverStripeBillingState(
  user: StripeBillingUser
): Promise<DiscoveredStripeBillingState> {
  const storedCustomer = await retrieveStoredCustomer(user.stripeCustomerId);
  const candidates = new Map<string, Stripe.Customer>();

  if (storedCustomer) candidates.set(storedCustomer.id, storedCustomer);

  if (user.email) {
    const matchingCustomers = await stripe.customers.list({ email: user.email, limit: 100 });
    for (const customer of matchingCustomers.data) {
      const metadataUserId = customer.metadata?.userId;
      if (!metadataUserId || metadataUserId === user.id || customer.id === storedCustomer?.id) {
        candidates.set(customer.id, customer);
      }
    }
  }

  const subscriptionsByCustomer = new Map<string, Stripe.Subscription[]>();
  let paidCustomer: Stripe.Customer | null = null;
  let paidSubscription: Stripe.Subscription | null = null;

  for (const customer of candidates.values()) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 100,
    });
    subscriptionsByCustomer.set(customer.id, subscriptions.data);

    const eligibleSubscription = findPaidSubscription(subscriptions.data);

    if (!paidSubscription && eligibleSubscription) {
      paidCustomer = customer;
      paidSubscription = eligibleSubscription;
    }
  }

  const customer =
    paidCustomer ||
    storedCustomer ||
    [...candidates.values()].find((candidate) => candidate.metadata?.userId === user.id) ||
    [...candidates.values()][0] ||
    null;

  const subscription = paidSubscription ||
    (customer ? subscriptionsByCustomer.get(customer.id)?.[0] || null : null);
  const update = buildStripeBillingUpdate(customer?.id || null, subscription);

  return {
    customer,
    subscription,
    plan: update.subscriptionPlan,
    update,
  };
}
