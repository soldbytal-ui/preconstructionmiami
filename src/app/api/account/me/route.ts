import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { accountsReady, currentUser } from '@/lib/account';
import { emailConfigured } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const noStore = { headers: { 'Cache-Control': 'private, no-store' } };
  if (!accountsReady) return NextResponse.json({ ready: false, user: null, follows: [] }, noStore);
  const user = await currentUser();
  if (!user) return NextResponse.json({ ready: true, user: null, follows: [] }, noStore);
  const { data: rows } = await supabaseAdmin
    .from('site_follows')
    .select('projectId, createdAt')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });
  const ids = (rows || []).map((r) => r.projectId);
  let projects: unknown[] = [];
  if (ids.length && new URL(request.url).searchParams.get('full') === '1') {
    const { data } = await supabaseAdmin
      .from('projects')
      .select('id, slug, name, status, priceMin, floors, totalUnits, estCompletion, mainImageUrl, heightM, updatedAt, neighborhood:neighborhoods(name, slug)')
      .in('id', ids);
    const byId = new Map((data || []).map((p: any) => [p.id, p]));
    projects = ids.map((id) => byId.get(id)).filter(Boolean);
  }
  return NextResponse.json({ ready: true, emailReady: emailConfigured, user, follows: ids, projects }, noStore);
}
