import { NextResponse } from 'next/server';
import { statfs } from 'node:fs/promises';
import path from 'node:path';
import { dbReady } from '@/lib/db';

const DEFAULT_MIN_FREE_DISK_MB = 10_240;

function minimumFreeDiskBytes(): number {
  const configured = Number(process.env.HEALTH_MIN_FREE_DISK_MB);
  const megabytes = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MIN_FREE_DISK_MB;
  return megabytes * 1024 * 1024;
}

export async function GET() {
  try {
    await dbReady;

    if (process.env.DB_TYPE !== 'postgresql') {
      const sqlitePath =
        process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'bewerbradar.db');
      const storage = await statfs(path.dirname(sqlitePath));
      const freeBytes = storage.bavail * storage.bsize;

      if (freeBytes < minimumFreeDiskBytes()) {
        return NextResponse.json(
          {
            status: 'degraded',
            service: 'bewerbradar-copilot',
            checks: { database: 'ok', storage: 'low' },
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        status: 'ok',
        service: 'bewerbradar-copilot',
        checks: { database: 'ok', storage: 'ok' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'bewerbradar-copilot',
        checks: { database: 'error', storage: 'unknown' },
      },
      { status: 503 }
    );
  }
}
