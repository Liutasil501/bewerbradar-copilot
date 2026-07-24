import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
  isPremiumBypass?: boolean;
}

export function extractAIConfig(
  request: NextRequest,
  user?: { subscriptionPlan?: string | null } | null,
  options?: { allowFreeTrial?: boolean }
): AIConfig {
  let provider = request.headers.get('x-provider') || 'openai';
  let apiKey = request.headers.get('x-api-key') || '';
  let baseURL = request.headers.get('x-base-url') || 'https://api.openai.com/v1';
  let model = request.headers.get('x-model') || 'gpt-4o';
  let isPremiumBypass = false;

  // Premium/Pro Bypass & Free Trial Import: If no user-provided key, and user is pro/premium OR eligible for 1 free trial import
  const isEligibleForServerKey =
    user?.subscriptionPlan === 'premium' ||
    user?.subscriptionPlan === 'pro' ||
    (options?.allowFreeTrial && user?.subscriptionPlan === 'free');

  if (!apiKey && isEligibleForServerKey) {
    provider = 'gemini';
    apiKey = process.env.GEMINI_API_KEY || '';
    baseURL = ''; // Use default
    model = 'gemini-3.1-flash-lite';
    isPremiumBypass = true;
  }

  return { provider, apiKey, baseURL, model, isPremiumBypass };
}

export function getModel(config: AIConfig, modelOverride?: string) {
  if (!config.apiKey) {
    throw new AIConfigError('apiKeyMissing');
  }
  
  // If Premium Bypass is active, ignore client's model override since they don't own the key
  const modelId = config.isPremiumBypass ? config.model : (modelOverride || config.model);

  switch (config.provider) {
    case 'anthropic': {
      const p = createAnthropic({ apiKey: config.apiKey, baseURL: config.baseURL || undefined });
      return p(modelId);
    }
    case 'gemini': {
      const p = createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseURL || undefined });
      return p(modelId);
    }
    default: {
      const p = createOpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
      return p.chat(modelId);
    }
  }
}

/**
 * Returns providerOptions for JSON mode — only applicable to OpenAI-compatible providers.
 */
export function getJsonProviderOptions(config: AIConfig) {
  if (config.provider === 'openai') {
    return { openai: { response_format: { type: 'json_object' as const } } };
  }
  return {} as Record<string, never>;
}

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIConfigError';
  }
}
