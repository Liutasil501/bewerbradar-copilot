import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { canUseServerFundedAI } from './access';
import {
  consumeServerFundedAIRequest,
  resetServerFundedAIRateLimitsForTests,
} from './server-funded-rate-limit';

describe('server-funded AI entitlement matrix', () => {
  it('funds exactly the first Free resume import', () => {
    assert.equal(
      canUseServerFundedAI({ subscriptionPlan: 'free', aiImportsCount: 0 }, 'resume_import'),
      true
    );
    assert.equal(
      canUseServerFundedAI({ subscriptionPlan: 'free', aiImportsCount: 1 }, 'resume_import'),
      false
    );
  });

  it('funds imports but not advanced AI for Pro', () => {
    assert.equal(canUseServerFundedAI({ subscriptionPlan: 'pro' }, 'resume_import'), true);
    assert.equal(canUseServerFundedAI({ subscriptionPlan: 'pro' }, 'advanced_ai'), false);
  });

  it('funds all AI features for Premium', () => {
    assert.equal(canUseServerFundedAI({ subscriptionPlan: 'premium' }, 'resume_import'), true);
    assert.equal(canUseServerFundedAI({ subscriptionPlan: 'premium' }, 'advanced_ai'), true);
  });
});

describe('server-funded AI burst guard', () => {
  afterEach(() => {
    delete process.env.AI_SERVER_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.AI_SERVER_RATE_LIMIT_WINDOW_MS;
    resetServerFundedAIRateLimitsForTests();
  });

  it('rejects only after the configured burst allowance is consumed', () => {
    process.env.AI_SERVER_RATE_LIMIT_MAX_REQUESTS = '2';
    process.env.AI_SERVER_RATE_LIMIT_WINDOW_MS = '60000';

    assert.equal(consumeServerFundedAIRequest('user-1', 1_000).allowed, true);
    assert.equal(consumeServerFundedAIRequest('user-1', 2_000).allowed, true);
    const rejected = consumeServerFundedAIRequest('user-1', 3_000);
    assert.equal(rejected.allowed, false);
    assert.equal(rejected.retryAfterSeconds, 58);
  });

  it('does not share limits between users', () => {
    process.env.AI_SERVER_RATE_LIMIT_MAX_REQUESTS = '1';
    assert.equal(consumeServerFundedAIRequest('user-a', 1_000).allowed, true);
    assert.equal(consumeServerFundedAIRequest('user-b', 1_000).allowed, true);
  });
});
