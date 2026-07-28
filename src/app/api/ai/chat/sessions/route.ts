import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { chatRepository } from '@/lib/db/repositories/chat.repository';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';

export async function GET(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) return new Response('Unauthorized', { status: 401 });

    const resumeId = request.nextUrl.searchParams.get('resumeId');
    if (!resumeId) return new Response('Missing resumeId', { status: 400 });

    const resume = await resumeRepository.findById(resumeId);
    if (!resume || resume.userId !== user.id) {
      return new Response('Not found', { status: 404 });
    }

    const sessions = await chatRepository.findSessionsByResumeId(resumeId);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error(
      'GET /api/ai/chat/sessions error: %s',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { resumeId } = await request.json();
    if (!resumeId) return new Response('Missing resumeId', { status: 400 });

    const resume = await resumeRepository.findById(resumeId);
    if (!resume || resume.userId !== user.id) {
      return new Response('Not found', { status: 404 });
    }

    const reqLanguage = request.headers.get('x-next-intl-locale') || 'de';
    const { getTranslations } = await import('next-intl/server');
    const t = await getTranslations({ locale: reqLanguage, namespace: 'common' });
    const title = t('newChat');

    const session = await chatRepository.createSession({ resumeId, title });
    return NextResponse.json({ session });
  } catch (error) {
    console.error(
      'POST /api/ai/chat/sessions error: %s',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return new Response('Internal server error', { status: 500 });
  }
}
