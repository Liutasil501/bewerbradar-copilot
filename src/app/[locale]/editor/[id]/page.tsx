'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Palette, X, List } from 'lucide-react';
import { useEditor } from '@/hooks/use-editor';
import { useFingerprint } from '@/hooks/use-fingerprint';
import { useIsMobile } from '@/hooks/use-media-query';
import { EditorToolbar } from '@/components/editor/editor-toolbar';
import { EditorSidebar } from '@/components/editor/editor-sidebar';
import { EditorCanvas } from '@/components/editor/editor-canvas';
import { ThemeEditor } from '@/components/editor/theme-editor';
import { EditorPreviewPanel } from '@/components/editor/editor-preview-panel';
import { EditorMobileTabBar } from '@/components/editor/editor-mobile-tab-bar';
import { AIChatBubble } from '@/components/ai/ai-chat-bubble';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { JdAnalysisDialog } from '@/components/editor/jd-analysis-dialog';
import { TranslateDialog } from '@/components/editor/translate-dialog';
import { ExportDialog } from '@/components/editor/export-dialog';
import { ImportDialog } from '@/components/editor/import-dialog';
import { ShareDialog } from '@/components/editor/share-dialog';
import { CoverLetterDialog } from '@/components/editor/cover-letter-dialog';
import { GrammarCheckDialog } from '@/components/editor/grammar-check-dialog';
import { TourOverlay, type TourStepConfig } from '@/components/tour/tour-overlay';
import { useEditorStore } from '@/stores/editor-store';
import { useUIStore } from '@/stores/ui-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useTourStore, hasCompletedTour } from '@/stores/tour-store';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useCheckoutReturn } from '@/hooks/use-checkout-return';

const EDITOR_TOUR_STEPS: TourStepConfig[] = [
  { target: 'sidebar', placement: 'right', i18nKey: 'sidebar' },
  { target: 'preview', placement: 'left', i18nKey: 'preview' },
  { target: 'ai-chat', placement: 'top', i18nKey: 'aiChat' },
  { target: 'export', placement: 'bottom', i18nKey: 'export' },
  { target: 'theme', placement: 'bottom', i18nKey: 'theme' },
];

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const tAct = useTranslations('activation');
  const [showActivationGuidance, setShowActivationGuidance] = useState(false);
  const { isLoading: fpLoading } = useFingerprint();
  const { resume, sections, updateSection, addSection, removeSection, reorderSections } = useEditor(id);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showThemeEditor, toggleThemeEditor, mobileActiveTab } = useEditorStore();
  const { activeModal, openModal, closeModal } = useUIStore();
  const { hydrate, _hydrated } = useSettingsStore();
  const startTour = useTourStore((s) => s.startTour);
  useCheckoutReturn();

  useEffect(() => {
    if (!_hydrated) hydrate();
  }, [_hydrated, hydrate]);

  // Track first_resume_viewed (activation) if arriving from a successful import
  useEffect(() => {
    if (!resume) return;
    if (typeof window === 'undefined') return;

    const importedResumeId = sessionStorage.getItem('br_just_imported');
    if (importedResumeId !== id && importedResumeId !== '1') return;

    const timer = window.setTimeout(() => {
      trackEvent('first_resume_viewed', { locale, source: 'import' });
      setShowActivationGuidance(true);
      sessionStorage.removeItem('br_just_imported');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [resume, id, locale]);

  // Catch unhandled promise rejections (e.g. "Failed to find Server Action")
  // to prevent page crash — show toast instead
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason || '');
      if (msg.includes('Server Action') || msg.includes('AI_RetryError') || msg.includes('AI_APICallError')) {
        e.preventDefault();
        toast.error('操作失败', {
          description: msg.includes('Server Action')
            ? '页面版本已更新，请刷新页面重试'
            : 'AI 服务暂时不可用，请稍后重试',
        });
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  useEffect(() => {
    if (!resume) return;
    if (hasCompletedTour('editor')) return;
    if (window.innerWidth < 768) return;
    const timer = setTimeout(() => startTour('editor', EDITOR_TOUR_STEPS.length), 1000);
    return () => clearTimeout(timer);
  }, [resume, startTour]);

  if (fpLoading || !resume) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorToolbar resumeId={id} />

      {showActivationGuidance && (
        <div className="z-30 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-3 shadow-sm transition-all animate-in slide-in-from-top duration-300">
          <div className="mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  {tAct('guidanceTitle')}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {tAct('guidanceSubtitle')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    ✓ {tAct('stepImported')}
                  </span>
                  <span>&rarr;</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{tAct('stepReview')}</span>
                  <span>&rarr;</span>
                  <span>{tAct('stepDesign')}</span>
                  <span>&rarr;</span>
                  <span>{tAct('stepExport')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  trackEvent('activation_next_step_selected', { locale, action: 'choose_template' });
                  if (!showThemeEditor) toggleThemeEditor();
                  setShowActivationGuidance(false);
                }}
                className="text-xs h-8 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 cursor-pointer"
              >
                <Palette className="mr-1.5 h-3.5 w-3.5" />
                {tAct('btnTemplate')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  trackEvent('activation_next_step_selected', { locale, action: 'review_content' });
                  setShowActivationGuidance(false);
                }}
                className="text-xs h-8 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {tAct('btnReview')}
              </Button>
              <button
                type="button"
                onClick={() => setShowActivationGuidance(false)}
                className="ml-1 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title={tAct('dismiss')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <EditorMobileTabBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: hidden on mobile, shown on desktop */}
        <div className="hidden md:block">
          <EditorSidebar
            sections={sections}
            onAddSection={addSection}
            onReorderSections={reorderSections}
          />
        </div>

        {/* Canvas: always mounted, hidden on mobile when preview tab active */}
        <div className={cn(
          "min-w-0 flex-1 overflow-hidden md:flex-[4]",
          isMobile && mobileActiveTab !== "edit" && "hidden"
        )}>
          <EditorCanvas
            sections={sections}
            onUpdateSection={updateSection}
            onRemoveSection={removeSection}
            onReorderSections={reorderSections}
          />
        </div>

        {showThemeEditor && <ThemeEditor />}

        {/* Preview: always mounted, hidden on mobile when edit tab active */}
        <div className={cn(
          "min-w-0 flex-1 overflow-hidden md:flex-[6]",
          isMobile && mobileActiveTab !== "preview" && "hidden"
        )}>
          <EditorPreviewPanel />
        </div>
      </div>

      {/* Mobile sidebar FAB */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        aria-label="Open sections"
      >
        <List className="h-5 w-5" />
      </button>

      {/* Mobile sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-sm font-semibold">Sections</SheetTitle>
          </SheetHeader>
          <EditorSidebar
            sections={sections}
            onAddSection={(s) => { addSection(s); setSidebarOpen(false); }}
            onReorderSections={reorderSections}
          />
        </SheetContent>
      </Sheet>

      <AIChatBubble resumeId={id} />
      <SettingsDialog />
      <JdAnalysisDialog
        open={activeModal === 'jd-analysis'}
        onOpenChange={(open) => open ? openModal('jd-analysis') : closeModal()}
        resumeId={id}
      />
      <TranslateDialog
        open={activeModal === 'translate'}
        onOpenChange={(open) => open ? openModal('translate') : closeModal()}
        resumeId={id}
      />
      <ExportDialog
        open={activeModal === 'export'}
        onOpenChange={(open) => open ? openModal('export') : closeModal()}
        resumeId={id}
      />
      <ImportDialog
        open={activeModal === 'import'}
        onOpenChange={(open) => open ? openModal('import') : closeModal()}
        resumeId={id}
      />
      <ShareDialog
        open={activeModal === 'share'}
        onOpenChange={(open) => open ? openModal('share') : closeModal()}
        resumeId={id}
      />
      <CoverLetterDialog
        open={activeModal === 'cover-letter'}
        onOpenChange={(open) => open ? openModal('cover-letter') : closeModal()}
        resumeId={id}
      />
      <GrammarCheckDialog
        open={activeModal === 'grammar-check'}
        onOpenChange={(open) => open ? openModal('grammar-check') : closeModal()}
        resumeId={id}
      />
      <TourOverlay tourId="editor" steps={EDITOR_TOUR_STEPS} />
    </div>
  );
}
