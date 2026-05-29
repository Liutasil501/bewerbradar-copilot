import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { DEFAULT_SECTIONS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumes = await resumeRepository.findAllByUserId(user.id);
    return NextResponse.json(resumes);
  } catch (error) {
    console.error('GET /api/resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, template, language, sections, themeConfig } = body;

    const reqLanguage = language || 'de';
    const defaultTitle = reqLanguage === 'en' ? 'Untitled Resume' : reqLanguage === 'zh' ? '未命名简历' : 'Unbenannter Lebenslauf';

    const resume = await resumeRepository.create({
      userId: user.id,
      title: title || defaultTitle,
      template: template || 'classic',
      language: reqLanguage,
      ...(themeConfig ? { themeConfig } : {}),
    });

    if (resume) {
      if (Array.isArray(sections) && sections.length > 0) {
        // Import mode: use provided sections, ignore original ids
        for (let i = 0; i < sections.length; i++) {
          const s = sections[i];
          await resumeRepository.createSection({
            resumeId: resume.id,
            type: s.type,
            title: s.title,
            sortOrder: i,
            visible: s.visible,
            content: s.content,
          });
        }
      } else {
        // Default mode: create empty sections
        const tSections = await getTranslations({ locale: reqLanguage, namespace: 'sections' });
        for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
          const s = DEFAULT_SECTIONS[i];
          const sectionTitle = tSections(s.type);
          let content: unknown = {};

          if (s.type === 'personal_info') {
            content = { fullName: '', jobTitle: '', email: '', phone: '', location: '' };
          } else if (s.type === 'summary') {
            content = { text: '' };
          } else if (s.type === 'work_experience' || s.type === 'education' || s.type === 'projects' || s.type === 'certifications' || s.type === 'languages' || s.type === 'github' || s.type === 'custom') {
            content = { items: [] };
          } else if (s.type === 'skills') {
            content = { categories: [] };
          }

          await resumeRepository.createSection({
            resumeId: resume.id,
            type: s.type,
            title: sectionTitle,
            sortOrder: i,
            content,
          });
        }
      }

      const fullResume = await resumeRepository.findById(resume.id);
      return NextResponse.json(fullResume, { status: 201 });
    }

    return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
  } catch (error) {
    console.error('POST /api/resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
