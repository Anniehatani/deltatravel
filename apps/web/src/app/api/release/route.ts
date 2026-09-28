import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      service: 'delta-travel-web',
      commit: process.env.RENDER_GIT_COMMIT ?? null,
      environment: process.env.NODE_ENV ?? null,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
