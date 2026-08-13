const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;
const MAX_TRACKED_USERS = 10_000;

interface RateLimitEntry {
  timestamps: number[];
  lastSeen: number;
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  __bewerbradarServerAIRateLimits?: Map<string, RateLimitEntry>;
};

const entries =
  globalRateLimitStore.__bewerbradarServerAIRateLimits || new Map<string, RateLimitEntry>();
globalRateLimitStore.__bewerbradarServerAIRateLimits = entries;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export interface ServerFundedRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * A deliberately light burst guard for app-funded AI calls. It protects the
 * shared provider key from loops and simple automation without pretending an
 * "unlimited" paid plan has a hidden daily quota. State is per application
 * process, so this is a cost guardrail rather than a security boundary.
 */
export function consumeServerFundedAIRequest(
  userId: string,
  now = Date.now()
): ServerFundedRateLimitResult {
  const windowMs = positiveInteger(process.env.AI_SERVER_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
  const maxRequests = positiveInteger(
    process.env.AI_SERVER_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_MAX_REQUESTS
  );
  const cutoff = now - windowMs;
  const entry = entries.get(userId) || { timestamps: [], lastSeen: now };
  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > cutoff);
  entry.lastSeen = now;

  if (entry.timestamps.length >= maxRequests) {
    const retryAfterMs = Math.max(1_000, entry.timestamps[0] + windowMs - now);
    entries.set(userId, entry);
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1_000) };
  }

  entry.timestamps.push(now);
  entries.set(userId, entry);

  if (entries.size > MAX_TRACKED_USERS) {
    const staleBefore = now - Math.max(windowMs * 2, 5 * 60_000);
    for (const [key, value] of entries) {
      if (value.lastSeen < staleBefore) entries.delete(key);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetServerFundedAIRateLimitsForTests(): void {
  entries.clear();
}
