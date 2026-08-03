import { NextRequest, NextResponse } from 'next/server';
import { prepareQaState } from '@/lib/qa/prepare-state';
import { isQaHarnessEnabled, parseQaState } from '@/lib/qa/states';

export async function POST(request: NextRequest) {
  if (!isQaHarnessEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { state?: string } | null;
  const state = parseQaState(body?.state || '');

  if (!state) {
    return NextResponse.json({ error: 'Invalid QA state' }, { status: 400 });
  }

  return NextResponse.json(await prepareQaState(state));
}
