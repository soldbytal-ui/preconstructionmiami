export const dynamic = 'force-dynamic';
// One request a minute to the source, so a run that reads two meetings takes about three minutes
export const maxDuration = 300;

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { collectAgendaItems, fileSuggestions } from '@/lib/agenda-store';

/** Daily agenda watcher. Reads agenda items, matches them to projects, and files suggestions for review. */
export async function GET(req: Request) {
  const fromCron = req.headers.get('user-agent')?.includes('vercel-cron');
  const session = fromCron ? null : await getSession();
  if (!fromCron && session?.role !== 'admin') return NextResponse.json({ error: 'not allowed' }, { status: 401 });
  // The button in the admin reads one meeting; the daily run reads two
  const { items, sources, note } = await collectAgendaItems(fromCron ? 2 : 1);
  const result = await fileSuggestions(items);
  return NextResponse.json({ sources, note, ...result });
}
