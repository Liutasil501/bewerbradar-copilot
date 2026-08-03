export const QA_STATES = {
  'free-fresh': {
    plan: 'free',
    subscriptionStatus: null,
    aiImportsCount: 0,
    hasByok: false,
  },
  'free-used': {
    plan: 'free',
    subscriptionStatus: null,
    aiImportsCount: 1,
    hasByok: false,
  },
  pro: {
    plan: 'pro',
    subscriptionStatus: 'active',
    aiImportsCount: 1,
    hasByok: false,
  },
  premium: {
    plan: 'premium',
    subscriptionStatus: 'active',
    aiImportsCount: 1,
    hasByok: false,
  },
  byok: {
    plan: 'free',
    subscriptionStatus: null,
    aiImportsCount: 1,
    hasByok: true,
  },
} as const;

export type QaState = keyof typeof QA_STATES;

export function parseQaState(value: string): QaState | null {
  return value in QA_STATES ? (value as QaState) : null;
}

export function getQaFingerprint(state: QaState): string {
  return `qa-${state}`;
}

export function isQaHarnessEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.QA_HARNESS_ENABLED === 'true' &&
    process.env.AUTH_ENABLED !== 'true' &&
    (process.env.DB_TYPE || 'sqlite') === 'sqlite'
  );
}
