import { create } from 'zustand';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

interface SubscriptionStore {
  plan: SubscriptionPlan;
  aiImportsCount: number;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: (force?: boolean) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  plan: 'free',
  aiImportsCount: 0,
  isLoading: true,
  isHydrated: false,
  hydrate: async (force = false) => {
    if (get().isHydrated && !force) return;
    set({ isLoading: true });
    try {
      const fp = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
      const res = await fetch('/api/user', {
        headers: fp ? { 'x-fingerprint': fp } : {},
      });
      if (res.ok) {
        const user = await res.json();
        if (user) {
          set({
            ...(user.subscriptionPlan && {
              plan: user.subscriptionPlan as SubscriptionPlan,
            }),
            aiImportsCount:
              typeof user.aiImportsCount === 'number' ? user.aiImportsCount : 0,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load subscription status', e);
    } finally {
      set({ isLoading: false, isHydrated: true });
    }
  },
}));


if (typeof window !== 'undefined') {
  useSubscriptionStore.getState().hydrate();
}
