export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!rateLimit(`pw:${session.id}`, 6, 15 * 60_000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
    }

    const { current, next } = await request.json();
    if (typeof current !== 'string' || typeof next !== 'string' || next.length < 12 || next.length > 200) {
      return NextResponse.json({ error: 'New password must be at least 12 characters.' }, { status: 400 });
    }

    const { data: agent } = await supabase.from('agents').select('id, passwordHash').eq('id', session.id).single();
    if (!agent || !(await verifyPassword(current, agent.passwordHash))) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 403 });
    }

    const { error } = await supabase.from('agents').update({ passwordHash: await hashPassword(next) }).eq('id', session.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
