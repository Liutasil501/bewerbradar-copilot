import { create } from 'zustand';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

interface SubscriptionStore {
  plan: SubscriptionPlan;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  plan: 'free',
  isLoading: true,
  isHydrated: false,
  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });
    try {
      const fp = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
      const res = await fetch('/api/user', {
        headers: fp ? { 'x-fingerprint': fp } : {},
      });
      if (res.ok) {
        const user = await res.json();
        if (user && user.subscriptionPlan) {
          set({ plan: user.subscriptionPlan as SubscriptionPlan });
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
