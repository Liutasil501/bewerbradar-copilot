'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEMPLATES, FREE_TEMPLATES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';
import { usePaywall } from '@/hooks/use-paywall';
import { TemplateThumbnail } from './template-thumbnail';
import { templateLabelsMap } from '@/lib/template-labels';
import { PricingModal } from '@/components/billing/pricing-modal';

interface CreateResumeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title?: string; template?: string; language?: string }) => Promise<{ id: string } | null | undefined>;
}

export function CreateResumeDialog({ open, onClose, onCreate }: CreateResumeDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<string>('classic');
  const [isCreating, setIsCreating] = useState(false);
  const tBilling = useTranslations('billing');
  const { currentPlan, checkPaywall, showPaywall, setShowPaywall, requiredTier, paywallDescription } = usePaywall();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const resume = await onCreate({ title: title || undefined, template, language: locale });
      if (resume) {
        resetAndClose();
        router.push(`/editor/${resume.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTitle('');
    setTemplate('classic');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>{t('dashboard.createResume')}</DialogTitle>
            <DialogDescription>{t('dashboard.createResumeDescription')}</DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="space-y-4">
              <Input
                placeholder={t('editor.fields.fullName')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('editor.toolbar.template')}
                </p>
                <div className="max-h-[400px] overflow-y-auto pr-1">
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
                          {/* Thumbnail */}
                          <div className="relative bg-zinc-50 p-2 dark:bg-zinc-800/50">
                            <TemplateThumbnail
                              template={tpl}
                              className="mx-auto h-[100px] w-[71px] shadow-sm ring-1 ring-zinc-200/50"
                            />
                            {/* Selected check */}
                            {isSelected && !isLocked && (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            {/* Lock icon */}
                            {isLocked && (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/80 text-white shadow-sm backdrop-blur-sm">
                                <Lock className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          {/* Label */}
                          <div className={cn(
                            'px-2 py-1.5 text-center text-xs font-medium transition-colors flex items-center justify-between gap-1 border-t border-zinc-100 dark:border-zinc-800/50',
                            isSelected
                              ? 'bg-brand-muted text-brand dark:bg-brand-muted dark:text-brand'
                              : 'text-zinc-600 dark:text-zinc-400'
                          )}>
                            <span className="truncate flex-1 text-left">{t(templateLabelsMap[tpl])}</span>
                            {FREE_TEMPLATES.has(tpl) ? (
                              <span className="rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
                                {t('templates.freeBadge')}
                              </span>
                            ) : (
                              <span className="rounded bg-blue-50 px-1 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 shrink-0">
                                {t('templates.proBadge')}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <Button variant="outline" onClick={resetAndClose} className="cursor-pointer">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="cursor-pointer bg-brand hover:bg-brand-hover"
            >
              {isCreating ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <PricingModal open={showPaywall} onOpenChange={setShowPaywall} requiredTier={requiredTier} descriptionOverride={paywallDescription} />
    </>
  );
}
