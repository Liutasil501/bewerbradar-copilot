'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  normalizeImportErrorCode,
  trackEvent,
  type AccessMode,
  type AnalyticsImportErrorCode,
  type DurationBucket,
  type ImportDialogSource,
} from '@/lib/analytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileText,
  Image as ImageIcon,
  Check,
  Lock,
  Sparkles,
  Crown,
} from 'lucide-react';
import { TEMPLATES, FREE_TEMPLATES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getAIHeaders } from '@/stores/settings-store';
import { usePaywall } from '@/hooks/use-paywall';
import { useUIStore } from '@/stores/ui-store';
import { TemplateThumbnail } from './template-thumbnail';
import { templateLabelsMap } from '@/lib/template-labels';
import { PricingModal } from '@/components/billing/pricing-modal';

interface ImportJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ImportDialogSource;
}

type ImportState = 'idle' | 'importing' | 'success' | 'error';
type ImportErrorCode = AnalyticsImportErrorCode | null;
type FileType = 'json' | 'pdf' | 'image';

const ACCEPTED_EXTENSIONS = '.json,.pdf,.png,.jpg,.jpeg,.webp';
const ACCEPTED_TYPES = ['application/json', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

function getHeaders() {
  const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
  return {
    'Content-Type': 'application/json',
    ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
  };
}

export function ImportJsonDialog({ open, onOpenChange, source }: ImportJsonDialogProps) {
  const t = useTranslations('import');
  const tBilling = useTranslations('billing');
  const tBase = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const openModal = useUIStore((s) => s.openModal);
  const { currentPlan, checkPaywall, showPaywall, setShowPaywall, requiredTier, paywallDescription } = usePaywall();

  const [state, setState] = useState<ImportState>('idle');
  const [errorCode, setErrorCode] = useState<ImportErrorCode>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [template, setTemplate] = useState<string>('classic');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parseStage, setParseStage] = useState<'uploading' | 'extracting' | 'building'>('uploading');

  const hasUserKey = Boolean(getAIHeaders()['x-ai-api-key']);
  const accessMode: AccessMode = hasUserKey
    ? 'byok'
    : currentPlan === 'pro' || currentPlan === 'premium'
    ? 'paid'
    : 'free_trial';

  useEffect(() => {
    if (open) {
      setState('idle');
      setErrorCode(null);
      setErrorMessage('');
      setSelectedFile(null);
      setFileType(null);
      setTemplate('classic');
      setParseStage('uploading');

      trackEvent('import_dialog_opened', { locale, source });
    }
  }, [open, locale, source]);

  const handleFileSelect = useCallback((file: File) => {
    setErrorMessage('');
    setErrorCode(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (file.type === 'application/json' || ext === 'json') {
      setSelectedFile(file);
      setFileType('json');
      setState('idle');
    } else if (file.type === 'application/pdf' || ext === 'pdf') {
      setSelectedFile(file);
      setFileType('pdf');
      setState('idle');
    } else if (ACCEPTED_TYPES.includes(file.type) || ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      setSelectedFile(file);
      setFileType('image');
      setState('idle');
    } else {
      setSelectedFile(null);
      setFileType(null);
      setState('error');
      setErrorCode('PARSE_FAILED');
      setErrorMessage(t('invalidFormat'));
    }
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!selectedFile || !fileType) return;

    setState('importing');
    setParseStage('uploading');
    setErrorMessage('');
    setErrorCode(null);

    setTimeout(() => setParseStage('extracting'), 1000);
    setTimeout(() => setParseStage('building'), 3200);

    const hasUserKey = Boolean(getAIHeaders()['x-ai-api-key']);
    const access_mode: AccessMode = hasUserKey
      ? 'byok'
      : currentPlan === 'pro' || currentPlan === 'premium'
      ? 'paid'
      : 'free_trial';

    if (fileType !== 'json') {
      trackEvent('resume_import_started', { locale, file_kind: fileType, access_mode });
    }
    const startTime = Date.now();

    try {
      let newResume: { id: string };

      if (fileType === 'json') {
        const text = await selectedFile.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data.sections)) {
          throw new Error(t('invalidFormat'));
        }

        const res = await fetch('/api/resume', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            title: data.title || 'Imported Resume',
            template: data.template || 'classic',
            themeConfig: data.themeConfig,
            sections: data.sections,
          }),
        });

        if (!res.ok) throw new Error(t('error'));
        newResume = await res.json();
      } else {
        const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('template', template);

        const res = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}), ...getAIHeaders() },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const code = normalizeImportErrorCode(
            data.code ?? (data.error === 'apiKeyMissing' ? 'API_KEY_MISSING' : 'PARSE_FAILED')
          );
          setErrorCode(code);
          setState('error');
          setErrorMessage(data.error || t('error'));
          trackEvent('resume_import_failed', {
            locale,
            file_kind: fileType,
            access_mode,
            error_code: code || 'PARSE_FAILED',
          });
          return;
        }

        newResume = await res.json();
      }

      const durationMs = Date.now() - startTime;
      const duration_bucket: DurationBucket =
        durationMs < 3000 ? '<3s' : durationMs <= 10000 ? '3-10s' : '>10s';

      if (fileType !== 'json') {
        trackEvent('resume_import_succeeded', {
          locale,
          file_kind: fileType,
          access_mode,
          duration_bucket,
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('br_just_imported', '1');
        }
      }

      setState('success');
      setTimeout(() => {
        onOpenChange(false);
        router.push(`/editor/${newResume.id}`);
      }, 1000);
    } catch (err: unknown) {
      setState('error');
      setErrorCode('PARSE_FAILED');
      const message = err instanceof Error ? err.message : String(err);

      if (fileType !== 'json') {
        trackEvent('resume_import_failed', {
          locale,
          file_kind: fileType,
          access_mode,
          error_code: 'PARSE_FAILED',
        });
      }

      if (err instanceof SyntaxError) {
        setErrorMessage(t('invalidFormat'));
      } else {
        setErrorMessage(message || t('error'));
      }
    }
  }, [selectedFile, fileType, template, onOpenChange, router, t, locale, currentPlan]);

  const isLoading = state === 'importing';

  // Render appropriate file icon
  const getFileIcon = () => {
    if (fileType === 'json') return <FileJson className="mb-3 h-8 w-8 text-green-500" />;
    if (fileType === 'pdf') return <FileText className="mb-3 h-8 w-8 text-green-500" />;
    if (fileType === 'image') return <ImageIcon className="mb-3 h-8 w-8 text-green-500" />;
    return <Upload className="mb-3 h-8 w-8 text-zinc-400" />;
  };

  const getFileLabel = () => {
    if (fileType === 'json') return t('detectJson');
    if (fileType === 'pdf') return t('detectPdf');
    if (fileType === 'image') return t('detectImage');
    return t('selectFile');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onOpenChange(false); }}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-brand" />
                {t('title')}
              </DialogTitle>
              <Badge variant="outline" className={cn("text-[11px] py-0.5 shrink-0", accessMode === 'byok' ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300" : accessMode === 'paid' ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "border-brand/30 bg-brand/5 text-brand dark:bg-brand/10 dark:text-brand")}>
                {accessMode === 'byok' ? t('byokAccess') : accessMode === 'paid' ? t('paidAccess') : t('freeTrialAccess')}
              </Badge>
            </div>
            <DialogDescription className="mt-1">{t('dashboardDescription')}</DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
            {(state === 'idle' || (state === 'error' && selectedFile)) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  selectedFile ? 'cursor-default' : 'cursor-pointer',
                  isDragging
                    ? 'border-brand bg-brand-muted dark:bg-brand-muted'
                    : selectedFile
                      ? 'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/20'
                      : 'border-zinc-300 hover:border-brand hover:bg-brand-muted/30 dark:border-zinc-600 dark:hover:border-brand dark:hover:bg-brand-muted/10'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={!!selectedFile}
                />
                {getFileIcon()}
                <p className="max-w-full truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedFile ? selectedFile.name : getFileLabel()}
                </p>
                {selectedFile ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFileType(null);
                    }}
                    className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    {tBase('common.delete')}
                  </button>
                ) : (
                  <p className="mt-1 text-xs text-zinc-400">{t('dragHint')}</p>
                )}
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                {errorCode === 'LIMIT_REACHED_FREE_SLOT' && (
                  <div className="w-full max-w-md mx-auto rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 via-brand/10 to-transparent p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('errors.limitReachedFreeSlotTitle')}
                    </h4>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {t('errors.limitReachedFreeSlotText')}
                    </p>
                    <div className="mt-5 flex justify-center">
                      <Button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          setShowPaywall(true);
                        }}
                        className="bg-brand hover:bg-brand/90 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm cursor-pointer"
                      >
                        <Crown className="mr-1.5 h-4 w-4" />
                        {t('errors.viewPlans')}
                      </Button>
                    </div>
                  </div>
                )}

                {errorCode === 'TRIAL_ALREADY_USED' && (
                  <div className="w-full max-w-md mx-auto rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 via-brand/10 to-transparent p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('errors.trialAlreadyUsedTitle')}
                    </h4>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {t('errors.trialAlreadyUsedText')}
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          setShowPaywall(true);
                        }}
                        className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm cursor-pointer"
                      >
                        <Crown className="mr-1.5 h-4 w-4" />
                        {t('errors.viewPlans')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          openModal('settings');
                        }}
                        className="w-full sm:w-auto text-xs cursor-pointer"
                      >
                        {t('errors.enterApiKey')}
                      </Button>
                    </div>
                  </div>
                )}

                {errorCode === 'API_KEY_MISSING' && (
                  <div className="w-full max-w-md mx-auto rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 via-brand/10 to-transparent p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('errors.apiKeyMissingTitle')}
                    </h4>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {t('errors.apiKeyMissingText')}
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          setShowPaywall(true);
                        }}
                        className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm cursor-pointer"
                      >
                        <Crown className="mr-1.5 h-4 w-4" />
                        {t('errors.viewPlans')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          openModal('settings');
                        }}
                        className="w-full sm:w-auto text-xs cursor-pointer"
                      >
                        {t('errors.enterApiKey')}
                      </Button>
                    </div>
                  </div>
                )}

                {errorCode === 'API_KEY_INVALID' && (
                  <div className="w-full max-w-md mx-auto rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 via-brand/10 to-transparent p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('errors.apiKeyInvalidTitle')}
                    </h4>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {t('errors.apiKeyInvalidText')}
                    </p>
                    <div className="mt-5 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          openModal('settings');
                        }}
                        className="w-full sm:w-auto text-xs cursor-pointer"
                      >
                        {t('errors.enterApiKey')}
                      </Button>
                    </div>
                  </div>
                )}

                {(!errorCode || errorCode === 'PARSE_FAILED') && (
                  <>
                    <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {errorMessage || t('error')}
                    </p>
                  </>
                )}
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileType(null);
                      setState('idle');
                      setErrorCode(null);
                      setErrorMessage('');
                    }}
                    className="mt-3 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 cursor-pointer"
                  >
                    {tBase('common.back')}
                  </button>
                )}
              </div>
            )}

            {state === 'importing' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="mb-4 h-9 w-9 animate-spin text-brand" />
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {fileType === 'json'
                    ? t('importing')
                    : parseStage === 'uploading'
                    ? t('stageUploading')
                    : parseStage === 'extracting'
                    ? t('stageExtracting')
                    : t('stageBuilding')}
                </p>
                {fileType !== 'json' && (
                  <div className="mt-6 flex items-center justify-center gap-3 text-xs font-medium text-zinc-400">
                    <span className={cn("flex items-center gap-1.5", parseStage === 'uploading' ? "font-bold text-brand" : "text-zinc-500")}>
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", parseStage === 'uploading' ? "bg-brand text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300")}>1</span>
                      {t('stageUploading').replace('...', '')}
                    </span>
                    <span>&rarr;</span>
                    <span className={cn("flex items-center gap-1.5", parseStage === 'extracting' ? "font-bold text-brand" : parseStage === 'building' ? "text-zinc-500" : "text-zinc-400")}>
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", parseStage === 'extracting' ? "bg-brand text-white" : parseStage === 'building' ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300")}>2</span>
                      {t('stageExtracting').replace('...', '')}
                    </span>
                    <span>&rarr;</span>
                    <span className={cn("flex items-center gap-1.5", parseStage === 'building' ? "font-bold text-brand" : "text-zinc-400")}>
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", parseStage === 'building' ? "bg-brand text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300")}>3</span>
                      {t('stageBuilding').replace('...', '')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {state === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="mb-3 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('success')}
                </p>
              </div>
            )}

            {/* Template Selector for PDF/Images */}
            {state === 'idle' && selectedFile && fileType !== 'json' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('templateSelect')}
                </p>
                <div className="max-h-[260px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {TEMPLATES.map((tpl) => {
                      const isSelected = template === tpl;
                      const isLocked = currentPlan === 'free' && !FREE_TEMPLATES.has(tpl);
                      return (
                        <button
                          key={tpl}
                          type="button"
                          className={cn(
                            'group/tpl relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200',
                            isSelected
                              ? 'border-brand shadow-md shadow-brand/10'
                              : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600',
                            isLocked && 'opacity-70 hover:opacity-100'
                          )}
                          onClick={() => {
                            if (isLocked) {
                              checkPaywall('pro', () => setTemplate(tpl), { description: tBilling('limitTemplatesDesc') });
                            } else {
                              setTemplate(tpl);
                            }
                          }}
                        >
                          <div className="relative bg-zinc-50 p-2 dark:bg-zinc-800/50">
                            <TemplateThumbnail
                              template={tpl}
                              className="mx-auto h-[90px] w-[64px] shadow-sm ring-1 ring-zinc-200/50"
                            />
                            {isSelected && !isLocked && (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            {isLocked && (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/80 text-white shadow-sm backdrop-blur-sm">
                                <Lock className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            'px-2 py-1.5 text-center text-[10px] font-medium transition-colors flex items-center justify-between gap-1 border-t border-zinc-100 dark:border-zinc-800/50',
                            isSelected
                              ? 'bg-brand-muted text-brand dark:bg-brand-muted dark:text-brand'
                              : 'text-zinc-600 dark:text-zinc-400'
                          )}>
                            <span className="truncate flex-1 text-left">{tBase(templateLabelsMap[tpl])}</span>
                            {FREE_TEMPLATES.has(tpl) ? (
                              <span className="rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
                                {tBase('templates.freeBadge')}
                              </span>
                            ) : (
                              <span className="rounded bg-blue-50 px-1 py-0.5 text-[8px] font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 shrink-0">
                                {tBase('templates.proBadge')}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800 flex-shrink-0">
            {(state === 'idle' || state === 'error') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                  disabled={isLoading}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isLoading || state === 'error'}
                  className="cursor-pointer bg-brand hover:bg-brand-hover"
                >
                  {fileType === 'json' ? t('importBtn') : t('uploadAndParse')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PricingModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        requiredTier={requiredTier}
        descriptionOverride={paywallDescription}
        analyticsTrigger={
          errorCode === 'TRIAL_ALREADY_USED'
            ? 'trial_used'
            : errorCode === 'LIMIT_REACHED_FREE_SLOT'
              ? 'resume_limit'
              : undefined
        }
      />
    </>
  );
}
