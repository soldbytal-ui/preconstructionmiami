import { NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';

/**
 * IndexNow: tells Bing (and the engines that share its index) which pages are new or changed.
 * Runs once a day from a Vercel cron. Google does not take part in IndexNow.
 */
export const dynamic = 'force-dynamic';
const KEY = '7f59048eac59fba688cbe0aa1f096233';
const HOST = 'preconstructionmiami.net';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromCron = req.headers.get('user-agent')?.includes('vercel-cron');
  if (!fromCron && url.searchParams.get('key') !== KEY) return NextResponse.json({ error: 'not allowed' }, { status: 401 });

  const entries = await sitemap();
  const all = url.searchParams.get('all') === '1';
  const since = Date.now() - 2 * 24 * 3600 * 1000;
  const urlList = entries
    .filter((e) => all || (e.lastModified ? new Date(e.lastModified as any).getTime() >= since : false))
    .map((e) => e.url);
  if (!urlList.length) return NextResponse.json({ submitted: 0 });

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  return NextResponse.json({ submitted: urlList.length, status: res.status });
}
