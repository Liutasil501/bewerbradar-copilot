import type {
  ReturnIntent,
  PaywallTrigger,
  ReturnIntentType,
  TemplateOrigin,
} from './schema';

const PENDING_INTENT_KEY = 'br_pending_checkout_intent';
const INTENT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface StoredPendingIntent {
  intent: ReturnIntent;
  trigger: PaywallTrigger;
  createdAt: number;
}

export interface ConsumeIntentResult {
  matched: boolean;
  trigger?: PaywallTrigger;
  intent?: ReturnIntent;
}

export function setPendingCheckoutIntent(intent: ReturnIntent, trigger: PaywallTrigger): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const payload: StoredPendingIntent = {
      intent,
      trigger,
      createdAt: Date.now(),
    };
    sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to set pending checkout intent:', e);
  }
}

export function consumePendingCheckoutIntent(
  expectedAction: ReturnIntentType,
  expectedFeatureKey?: string,
  expectedOrigin?: TemplateOrigin
): ConsumeIntentResult {
  if (typeof sessionStorage === 'undefined') return { matched: false };
  try {
    const raw = sessionStorage.getItem(PENDING_INTENT_KEY);
    if (!raw) return { matched: false };

    const parsed: StoredPendingIntent = JSON.parse(raw);
    const isExpired = Date.now() - parsed.createdAt > INTENT_TTL_MS;

    if (isExpired) {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
      return { matched: false };
    }

    const { intent, trigger } = parsed;
    const actionMatches = intent.type === expectedAction;
    const featureMatches = !expectedFeatureKey || intent.featureKey === expectedFeatureKey;
    const originMatches = !expectedOrigin || intent.origin === expectedOrigin;

    if (actionMatches && featureMatches && originMatches) {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
      return { matched: true, trigger, intent };
    }

    return { matched: false };
  } catch {
    try {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
    } catch {
      // ignore
    }
    return { matched: false };
  }
}

export function clearPendingCheckoutIntent(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_INTENT_KEY);
  } catch {
    // ignore
  }
}
