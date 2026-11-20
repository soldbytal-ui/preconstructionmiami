export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { emailFromToken, suppress } from '@/lib/unsubscribe';

/** Also answers one-click unsubscribe (RFC 8058) posts from mail clients. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let e = url.searchParams.get('e'); let t = url.searchParams.get('t');
  if (!e || !t) { const body = await request.json().catch(() => ({})); e = body.e; t = body.t; }
  const email = emailFromToken(e, t);
  if (!email) return NextResponse.json({ error: 'This unsubscribe link is not valid.' }, { status: 400 });
  await suppress(email);
  return NextResponse.json({ success: true });
}
