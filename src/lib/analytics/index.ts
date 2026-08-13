'use client';

import { hasAnalyticsConsent } from './consent';
import { sanitizePaywallTrigger } from '@/lib/billing/schema';

export type AccessMode = 'free_trial' | 'byok' | 'paid' | 'unknown';
export type FileKind = 'pdf' | 'image';
export type DurationBucket = '<3s' | '3-10s' | '>10s';
export type ImportCtaPlacement = 'header' | 'hero' | 'footer';
export type ImportDialogSource = 'landing' | 'dashboard_empty' | 'dashboard_action' | 'unknown';
export type PaywallTrigger =
  | 'export_paid_format'
  | 'resume_limit'
  | 'trial_used'
  | 'paid_template'
  | 'public_share'
  | 'premium_ai_feature'
  | 'premium_feature'
  | 'unknown';
export type AuthMethod = 'google' | 'email';
export type AuthIntent = 'import' | 'direct';
export type AnalyticsImportErrorCode =
  | 'LIMIT_REACHED_FREE_SLOT'
  | 'TRIAL_ALREADY_USED'
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'PARSE_FAILED';

const ANALYTICS_IMPORT_ERROR_CODES: readonly AnalyticsImportErrorCode[] = [
  'LIMIT_REACHED_FREE_SLOT',
  'TRIAL_ALREADY_USED',
  'API_KEY_MISSING',
  'API_KEY_INVALID',
  'PARSE_FAILED',
];

const AUTH_JOURNEY_KEY = 'br_auth_journey';
const AUTH_JOURNEY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Event contract for BewerbRadar Copilot activation & conversion funnel.
 *
 * Privacy Contract:
 * - NO resume content, title, summary, or structured section text
 * - NO filenames, file hashes, or file paths
 * - NO name, email, phone, or PII
 * - NO application user ID, resume ID, session ID, interview ID, analysis ID, or Stripe customer ID
 * - NO API keys or AI provider configurations
 * - NO prompts, LLM responses, or free-form error messages
 * - NO full URLs containing tokens or identifiers
 */
export type AnalyticsEventMap = {
  import_cta_clicked: {
    locale: string;
    placement: ImportCtaPlacement;
  };
  auth_started: {
    locale: string;
    method: AuthMethod;
    intent: AuthIntent;
  };
  auth_completed: {
    locale: string;
    method?: AuthMethod | 'unknown';
  };
  import_dialog_opened: {
    locale: string;
    source: ImportDialogSource;
  };
  resume_import_started: {
    locale: string;
    file_kind: FileKind;
    access_mode: AccessMode;
  };
  resume_import_succeeded: {
    locale: string;
    file_kind: FileKind;
    access_mode: AccessMode;
    duration_bucket?: DurationBucket;
  };
  resume_import_failed: {
    locale: string;
    file_kind: FileKind;
    access_mode: AccessMode;
    error_code: AnalyticsImportErrorCode;
  };
  first_resume_viewed: {
    locale: string;
    source: 'import';
  };
  paywall_viewed: {
    locale: string;
    trigger: PaywallTrigger;
  };
  checkout_started: {
    locale: string;
    plan: 'pro' | 'premium';
    billing_period: 'monthly' | 'yearly';
    trigger?: PaywallTrigger;
  };
  checkout_completed: {
    locale: string;
    plan: 'pro' | 'premium';
    billing_period: 'monthly' | 'yearly';
    trigger: PaywallTrigger;
  };
  checkout_canceled: {
    locale: string;
    plan: 'pro' | 'premium';
    billing_period: 'monthly' | 'yearly';
    trigger: PaywallTrigger;
  };
  paid_action_completed: {
    locale: string;
    action: 'export_paid_format' | 'resume_limit' | 'trial_used' | 'paid_template' | 'public_share' | 'premium_ai_feature';
  };
  import_auth_gate_viewed: {
    locale: string;
  };
  activation_next_step_selected: {
    locale: string;
    action: 'review_content' | 'choose_template';
  };
};

export type EventName = keyof AnalyticsEventMap;

export function normalizeImportErrorCode(value: unknown): AnalyticsImportErrorCode {
  return typeof value === 'string' &&
    ANALYTICS_IMPORT_ERROR_CODES.includes(value as AnalyticsImportErrorCode)
    ? (value as AnalyticsImportErrorCode)
    : 'PARSE_FAILED';
}

export function rememberImportAuthJourney(method: AuthMethod, intent: AuthIntent): void {
  if (typeof window === 'undefined' || intent !== 'import' || !hasAnalyticsConsent()) return;

  try {
    localStorage.setItem(
      AUTH_JOURNEY_KEY,
      JSON.stringify({ method, intent, timestamp: Date.now() })
    );
  } catch {
    // Analytics continuity must never block authentication.
  }
}

export function discardImportAuthJourney(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(AUTH_JOURNEY_KEY);
  } catch {
    // Analytics cleanup must never block authentication.
  }
}

export function consumeImportAuthJourney(): AuthMethod | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(AUTH_JOURNEY_KEY);
    localStorage.removeItem(AUTH_JOURNEY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const isValidMethod = parsed?.method === 'google' || parsed?.method === 'email';
    const isFresh =
      typeof parsed?.timestamp === 'number' &&
      parsed.timestamp <= Date.now() &&
      Date.now() - parsed.timestamp <= AUTH_JOURNEY_TTL_MS;

    return parsed?.intent === 'import' && isValidMethod && isFresh
      ? parsed.method
      : null;
  } catch {
    try {
      localStorage.removeItem(AUTH_JOURNEY_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }
    return null;
  }
}

/**
 * Closed property allowlist per event for strict privacy compliance.
 */
const ALLOWED_PROPERTIES: Record<EventName, readonly string[]> = {
  import_cta_clicked: ['locale', 'placement'],
  auth_started: ['locale', 'method', 'intent'],
  auth_completed: ['locale', 'method'],
  import_dialog_opened: ['locale', 'source'],
  resume_import_started: ['locale', 'file_kind', 'access_mode'],
  resume_import_succeeded: ['locale', 'file_kind', 'access_mode', 'duration_bucket'],
  resume_import_failed: ['locale', 'file_kind', 'access_mode', 'error_code'],
  first_resume_viewed: ['locale', 'source'],
  paywall_viewed: ['locale', 'trigger'],
  checkout_started: ['locale', 'plan', 'billing_period', 'trigger'],
  checkout_completed: ['locale', 'plan', 'billing_period', 'trigger'],
  checkout_canceled: ['locale', 'plan', 'billing_period', 'trigger'],
  paid_action_completed: ['locale', 'action'],
  import_auth_gate_viewed: ['locale'],
  activation_next_step_selected: ['locale', 'action'],
};

/**
 * Central client-side tracking function.
 *
 * Checks optional analytics consent before sending a GA4 event through gtag.
 * Enforces strict property allowlists to guarantee zero PII or user content.
 */
export function trackEvent<K extends EventName>(eventName: K, params: AnalyticsEventMap[K]): void {
  if (typeof window === 'undefined') return;

  // Enforce consent gating: No events emitted if analytics consent is denied or unselected
  if (!hasAnalyticsConsent()) return;

  try {
    const allowlist = ALLOWED_PROPERTIES[eventName] || [];
    const sanitizedParams: Record<string, unknown> = {};

    for (const key of allowlist) {
      if (key in params && (params as Record<string, unknown>)[key] !== undefined) {
        const val = (params as Record<string, unknown>)[key];
        if (key === 'trigger') {
          sanitizedParams[key] = sanitizePaywallTrigger(val);
        } else if (key === 'plan') {
          sanitizedParams[key] = val === 'premium' ? 'premium' : 'pro';
        } else if (key === 'billing_period') {
          sanitizedParams[key] = val === 'yearly' ? 'yearly' : 'monthly';
        } else if (key === 'action' && eventName === 'paid_action_completed') {
          const allowedActions = [
            'export_paid_format',
            'resume_limit',
            'trial_used',
            'paid_template',
            'public_share',
            'premium_ai_feature',
          ];
          if (typeof val === 'string' && allowedActions.includes(val)) {
            sanitizedParams[key] = val;
          } else {
            // Discard invalid completion action completely - never fall back to export_paid_format
            return;
          }
        } else {
          sanitizedParams[key] = val;
        }
      }
    }

    // The GTM container owns the base Google tag. Product events must use the
    // gtag command format so the Google tag forwards them to GA4. A plain
    // dataLayer object alone only wakes matching GTM custom-event triggers.
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, sanitizedParams);
      return;
    }

    // Keep events queued during the short window before the consent bootstrap
    // has installed gtag. Mirror Google's command queue shape exactly.
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    window.gtag('event', eventName, sanitizedParams);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics Event]', eventName, sanitizedParams);
    }
  } catch {
    // Fail silently so analytics errors never degrade core app functionality
  }
}

export * from './consent';
