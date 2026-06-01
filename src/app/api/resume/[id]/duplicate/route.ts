import { NextRequest, NextResponse } from 'next/server';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { MAX_FREE_RESUMES } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await resumeRepository.findById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (resume.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.subscriptionPlan === 'free') {
      const existingResumes = await resumeRepository.findAllByUserId(user.id);
      if (existingResumes.length >= MAX_FREE_RESUMES) {
        return NextResponse.json({ error: `Free plan is limited to ${MAX_FREE_RESUMES} resume(s)` }, { status: 403 });
      }
    }

    // Get translation for " (Copy)" suffix based on user locale
    const reqLanguage = request.headers.get('x-next-intl-locale') || 'de';
    const { getTranslations } = await import('next-intl/server');
    const t = await getTranslations({ locale: reqLanguage, namespace: 'common' });
    const copySuffix = t('copySuffix');
    const titleOverride = `${resume.title}${copySuffix}`;

    const duplicated = await resumeRepository.duplicate(id, user.id, titleOverride);
    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error('POST /api/resume/[id]/duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
