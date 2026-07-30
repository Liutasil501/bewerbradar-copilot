import { create } from 'zustand';
import type { PaywallTrigger } from '@/lib/analytics';

export interface ReturnIntent {
  type: 'export' | 'template' | 'share' | 'ai_feature' | 'dashboard_import';
  resumeId?: string;
  format?: 'pdf' | 'docx' | 'html';
  templateId?: string;
  featureKey?: string;
}

export interface PaywallContext {
  trigger: PaywallTrigger;
  format?: 'pdf' | 'docx' | 'html';
  templateId?: string;
  featureKey?: string;
  allowBYOK?: boolean;
  returnIntent?: ReturnIntent;
  description?: string;
}

type ModalType = 'create-resume' | 'delete-resume' | 'export-pdf' | 'settings' | 'jd-analysis' | 'translate' | 'export' | 'import' | 'share' | 'generate-resume' | 'cover-letter' | 'grammar-check' | null;

interface UIStore {
  sidebarOpen: boolean;
  activeModal: ModalType;
  theme: 'light' | 'dark' | 'system';
  settingsTab: string;
  paywallContext: PaywallContext | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSettingsTab: (tab: string) => void;
  setPaywallContext: (context: PaywallContext | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  theme: 'light',
  settingsTab: 'ai',
  paywallContext: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setTheme: (theme) => set({ theme }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setPaywallContext: (context) => set({ paywallContext: context }),
}));
