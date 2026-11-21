export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { collectAgendaItems, fileSuggestions } from '@/lib/agenda-store';

/** Daily agenda watcher. Reads agenda items, matches them to projects, and files suggestions for review. */
export async function GET(req: Request) {
  const fromCron = req.headers.get('user-agent')?.includes('vercel-cron');
  const session = fromCron ? null : await getSession();
  if (!fromCron && session?.role !== 'admin') return NextResponse.json({ error: 'not allowed' }, { status: 401 });
  const { items, sources } = await collectAgendaItems();
  const result = await fileSuggestions(items);
  return NextResponse.json({ sources, ...result });
}
