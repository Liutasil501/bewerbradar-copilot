import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { canUseServerFundedAI, type ServerFundedAIFeature } from './access';
import { consumeServerFundedAIRequest } from './server-funded-rate-limit';

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
  usesServerKey?: boolean;
}

interface AIConfigOptions {
  serverFundedFeature?: ServerFundedAIFeature;
}

export function extractAIConfig(
  request: NextRequest,
  user?: { id?: string; subscriptionPlan?: string | null; aiImportsCount?: number | null } | null,
  options?: AIConfigOptions
): AIConfig {
  let provider = request.headers.get('x-provider') || 'openai';
  let apiKey = request.headers.get('x-api-key') || '';
  let baseURL = request.headers.get('x-base-url') || 'https://api.openai.com/v1';
  let model = request.headers.get('x-model') || 'gpt-4o';
  let usesServerKey = false;

  // Auto-detect provider if user API key format doesn't match selected provider header
  if (apiKey) {
    if (apiKey.startsWith('AIzaSy')) {
      provider = 'gemini';
      baseURL = '';
      if (!model || model.startsWith('gpt-') || model.startsWith('claude-')) {
        model = 'gemini-3.1-flash-lite';
      }
    } else if (apiKey.startsWith('sk-ant-')) {
      provider = 'anthropic';
      baseURL = 'https://api.anthropic.com';
      if (!model || model.startsWith('gpt-') || model.startsWith('gemini-')) {
        model = 'claude-sonnet-4-20250514';
      }
    }
  }

  const serverFundedFeature = options?.serverFundedFeature || 'advanced_ai';
  const isEligibleForServerKey = canUseServerFundedAI(user, serverFundedFeature);

  if (!apiKey && isEligibleForServerKey) {
    provider = 'gemini';
    apiKey = process.env.GEMINI_API_KEY || '';
    baseURL = ''; // Use default
    model = 'gemini-3.1-flash-lite';
    usesServerKey = true;

    if (apiKey && user?.id) {
      const rateLimit = consumeServerFundedAIRequest(user.id);
      if (!rateLimit.allowed) {
        throw new AIConfigError('rateLimitExceeded', 429, rateLimit.retryAfterSeconds);
      }
    }
  }

  return { provider, apiKey, baseURL, model, usesServerKey };
}

export function getModel(config: AIConfig, modelOverride?: string) {
  if (!config.apiKey) {
    throw new AIConfigError('apiKeyMissing');
  }
  
  // If Premium Bypass is active, ignore client's model override since they don't own the key
  const modelId = config.usesServerKey ? config.model : (modelOverride || config.model);

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
  constructor(
    message: string,
    public readonly status = 401,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'AIConfigError';
  }
}
