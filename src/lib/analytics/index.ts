'use client';

import { hasAnalyticsConsent } from './consent';

export type AccessMode = 'free_trial' | 'byok' | 'paid' | 'unknown';
export type FileKind = 'pdf' | 'image' | 'json';
export type DurationBucket = '<3s' | '3-10s' | '>10s';

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
    placement: 'header' | 'hero' | 'cta_bottom' | 'footer';
  };
  auth_started: {
    locale: string;
    method: 'google' | 'email';
    intent: 'import' | 'direct';
  };
  auth_completed: {
    locale: string;
    method?: 'google' | 'email' | 'unknown';
  };
  import_dialog_opened: {
    locale: string;
    source: 'landing' | 'dashboard_empty' | 'dashboard_action' | 'unknown';
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
    error_code: string;
  };
  first_resume_viewed: {
    locale: string;
    source: 'import';
  };
  paywall_viewed: {
    locale: string;
    trigger: 'resume_limit' | 'trial_used' | 'premium_feature' | 'unknown';
  };
  checkout_started: {
    locale: string;
    plan: 'pro' | 'premium';
    billing_period: 'monthly' | 'yearly';
  };
};

export type EventName = keyof AnalyticsEventMap;

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
  checkout_started: ['locale', 'plan', 'billing_period'],
};

/**
 * Central client-side tracking function.
 *
 * Checks optional analytics consent before pushing to window.dataLayer.
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
        sanitizedParams[key] = (params as Record<string, unknown>)[key];
      }
    }

    const payload = {
      event: eventName,
      ...sanitizedParams,
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics Event]', eventName, sanitizedParams);
    }
  } catch {
    // Fail silently so analytics errors never degrade core app functionality
  }
}

export * from './consent';
