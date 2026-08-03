import 'server-only';
import { eq } from 'drizzle-orm';
import { db, dbReady } from '@/lib/db';
import { userRepository } from '@/lib/db/repositories/user.repository';
import { users } from '@/lib/db/schema';
import { getQaFingerprint, QA_STATES, type QaState } from './states';

export async function prepareQaState(state: QaState) {
  await dbReady;

  const fingerprint = getQaFingerprint(state);
  const profile = QA_STATES[state];
  const user = await userRepository.upsertByFingerprint(fingerprint);

  if (!user) {
    throw new Error('Unable to prepare QA user');
  }

  await db
    .update(users)
    .set({
      subscriptionPlan: profile.plan,
      subscriptionStatus: profile.subscriptionStatus,
      aiImportsCount: profile.aiImportsCount,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    state,
    fingerprint,
    plan: profile.plan,
    aiImportsCount: profile.aiImportsCount,
    hasByok: profile.hasByok,
  };
}
