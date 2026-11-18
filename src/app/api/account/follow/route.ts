import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { currentUser } from '@/lib/account';

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sign in to follow towers.' }, { status: 401 });
    const { projectId, on } = z.object({ projectId: z.string().min(1).max(60), on: z.boolean() }).parse(await request.json());
    if (on) {
      const { count } = await supabaseAdmin.from('site_follows').select('*', { count: 'exact', head: true }).eq('userId', user.id);
      if ((count || 0) >= 100) return NextResponse.json({ error: 'You can follow up to 100 towers.' }, { status: 400 });
      const { error } = await supabaseAdmin.from('site_follows').upsert({ userId: user.id, projectId }, { onConflict: 'userId,projectId', ignoreDuplicates: true });
      if (error) return NextResponse.json({ error: 'That tower could not be followed.' }, { status: 400 });
    } else {
      await supabaseAdmin.from('site_follows').delete().eq('userId', user.id).eq('projectId', projectId);
    }
    return NextResponse.json({ ok: true, on });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
