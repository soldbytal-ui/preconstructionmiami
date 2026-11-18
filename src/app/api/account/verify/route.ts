import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyUserToken } from '@/lib/auth';
import { accountsReady, startSession, SITE } from '@/lib/account';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const s = accountsReady ? verifyUserToken(token, 'link') : null;
  if (!s) return NextResponse.redirect(`${SITE}/account?link=expired`);
  const { data: user } = await supabaseAdmin.from('site_users').select('id, emailVerifiedAt').eq('id', s.uid).maybeSingle();
  if (!user) return NextResponse.redirect(`${SITE}/account?link=expired`);
  const now = new Date().toISOString();
  await supabaseAdmin
    .from('site_users')
    .update(user.emailVerifiedAt ? { lastSeenAt: now } : { emailVerifiedAt: now, lastSeenAt: now })
    .eq('id', user.id);
  await startSession(user.id);
  return NextResponse.redirect(`${SITE}/account${user.emailVerifiedAt ? '' : '?confirmed=1'}`);
}
