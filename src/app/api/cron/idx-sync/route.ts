import { NextResponse } from 'next/server';
import { runSync } from '@/lib/idx/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Pulls changed listings from the MLS feed. Does nothing until the feed is connected.
// Not on a schedule yet: the schedule is added when the feed goes live.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(await runSync());
}
