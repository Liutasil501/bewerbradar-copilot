interface FirstAiImportInput {
  subscriptionPlan: string | null | undefined;
  aiImportsCount: number | null | undefined;
  hasUserApiKey: boolean;
}

interface FreeResumeSlotInput extends FirstAiImportInput {
  existingResumeCount: number;
  maxFreeResumes: number;
}

export function canUseFundedFirstAiImport({
  subscriptionPlan,
  aiImportsCount,
  hasUserApiKey,
}: FirstAiImportInput): boolean {
  const isFreePlan = !subscriptionPlan || subscriptionPlan === 'free';

  return isFreePlan && (aiImportsCount ?? 0) < 1 && !hasUserApiKey;
}

export function isFreeResumeSlotBlockedForAiImport({
  existingResumeCount,
  maxFreeResumes,
  ...access
}: FreeResumeSlotInput): boolean {
  const isFreePlan = !access.subscriptionPlan || access.subscriptionPlan === 'free';

  return (
    isFreePlan &&
    existingResumeCount >= maxFreeResumes &&
    !(
      existingResumeCount === maxFreeResumes &&
      canUseFundedFirstAiImport(access)
    )
  );
}
