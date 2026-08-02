const DRAFT_PREFIX = 'br_draft_';

export function saveFeatureDraft(featureKey: string, draftData: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${featureKey}`, JSON.stringify(draftData));
  } catch (e) {
    console.error('Failed to save feature draft:', e);
  }
}

export function getFeatureDraft<T>(featureKey: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `${DRAFT_PREFIX}${featureKey}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearFeatureDraft(featureKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${featureKey}`);
  } catch {
    // ignore
  }
}
