import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { getModel, extractAIConfig, AIConfigError } from '@/lib/ai/provider';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { chatRepository } from '@/lib/db/repositories/chat.repository';
import { getSystemPrompt } from '@/lib/ai/prompts';
import { createExecutableTools } from '@/lib/ai/tools';

const MAX_ROUNDS = 10;
const MAX_MESSAGES = MAX_ROUNDS * 2; // 10 rounds = 20 messages (user + assistant)

export async function POST(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, resumeId, model: modelId, sessionId } = await request.json();

    if (sessionId) {
      const session = await chatRepository.findSession(sessionId);
      if (!session) {
        return new Response('Session not found', { status: 404 });
      }
      const sessionResume = await resumeRepository.findById(session.resumeId);
      if (!sessionResume || sessionResume.userId !== user.id) {
        return new Response('Not found', { status: 404 });
      }
      if (resumeId && session.resumeId !== resumeId) {
        return new Response('Mismatched session and resume', { status: 400 });
      }
    }

    let resumeContext = '';
    if (resumeId) {
      const resume = await resumeRepository.findById(resumeId);
      if (!resume) {
        return new Response('Resume not found', { status: 404 });
      }
      if (resume.userId !== user.id) {
        return new Response('Forbidden', { status: 403 });
      }
      resumeContext = JSON.stringify(resume.sections);
    }

    // Save user message to DB before streaming
    if (sessionId && messages?.length > 0) {

      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const textPart = lastMessage.parts?.find((p: { type: string }) => p.type === 'text');
        const content = textPart?.text || lastMessage.content || '';
        if (content) {
          // First user message in this session → set as session title
          const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
          if (userMessages.length === 1) {
            const title = content.slice(0, 50);
            await chatRepository.updateSessionTitle(sessionId, title);
          }

          await chatRepository.addMessage({
            sessionId,
            role: 'user',
            content,
          });
        }
      }
    }

    const aiConfig = extractAIConfig(request, user);
    const model = getModel(aiConfig, modelId);
    const modelMessages = await convertToModelMessages(messages);

    // Truncate to last N rounds for LLM context
    const truncatedMessages = modelMessages.slice(-MAX_MESSAGES);

    const tools = resumeId ? createExecutableTools(resumeId, aiConfig) : undefined;

    const result = streamText({
      model,
      system: getSystemPrompt(resumeContext),
      messages: truncatedMessages,
      tools,
      stopWhen: tools ? stepCountIs(25) : undefined,
      onFinish: async ({ text, steps }) => {
        if (!sessionId) return;

        // Build ordered parts array preserving the interleaving of text and tool calls
        const orderedParts: ({ type: 'text'; text: string } | { type: 'tool'; toolName: string; args: unknown; result: unknown })[] = [];

        for (const step of steps) {
          if (step.text) {
            orderedParts.push({ type: 'text', text: step.text });
          }
          const tcs = step.toolCalls ?? [];
          const trs = step.toolResults ?? [];
          for (let i = 0; i < tcs.length; i++) {
            const tc = tcs[i] as { toolName: string; input: unknown };
            const tr = trs[i] as { output: unknown } | undefined;
            orderedParts.push({
              type: 'tool',
              toolName: tc.toolName,
              args: tc.input,
              result: tr?.output,
            });
          }
        }

        const fullText = text || '';
        if (fullText || orderedParts.some((p) => p.type === 'tool')) {
          await chatRepository.addMessage({
            sessionId,
            role: 'assistant',
            content: fullText,
            metadata: orderedParts.length > 0 ? { orderedParts } : {},
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof AIConfigError) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }
    console.error('POST /api/ai/chat error: %s', error instanceof Error ? error.name : String(error));
    return new Response('Internal server error', { status: 500 });
  }
}
