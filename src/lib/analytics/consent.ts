'use client';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const COOKIE_CONSENT_KEY = 'br_cookie_consent';
export const CONSENT_VERSION = 1;

export interface CookieConsentState {
  analytics: boolean;
  version: number;
  timestamp: number;
}

/**
 * Reads the stored cookie consent decision from localStorage.
 * Returns null if no decision has been saved or if the version is outdated.
 */
export function getStoredConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.analytics === 'boolean' && parsed.version === CONSENT_VERSION) {
      return parsed as CookieConsentState;
    }
  } catch {
    // Fail gracefully on localStorage/JSON error
  }
  return null;
}

/**
 * Returns true only if the user has explicitly granted optional analytics consent.
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getStoredConsent();
  return consent !== null && consent.analytics === true;
}

/**
 * Updates Google Consent Mode v2 via gtag / dataLayer.
 * Advertising consent fields always remain 'denied'.
 */
export function applyConsentToGtag(analyticsGranted: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    const consentPayload = {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    };

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', consentPayload);
    } else {
      window.dataLayer.push(['consent', 'update', consentPayload]);
    }
  } catch {
    // Fail gracefully if GTM / dataLayer is blocked
  }
}

/**
 * Saves the user's consent choice to localStorage, updates Google Consent Mode v2,
 * and notifies active listeners.
 */
export function saveConsent(analyticsGranted: boolean): CookieConsentState {
  const state: CookieConsentState = {
    analytics: analyticsGranted,
    version: CONSENT_VERSION,
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
    } catch {
      // Fail gracefully if localStorage is unavailable
    }

    applyConsentToGtag(analyticsGranted);

    try {
      window.dispatchEvent(new CustomEvent('br_consent_updated', { detail: state }));
    } catch {
      // Ignore event dispatch errors
    }
  }

  return state;
}
