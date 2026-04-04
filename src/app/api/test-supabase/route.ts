import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: featured, error: fErr } = await supabase
    .from('projects')
    .select('name')
    .eq('featured', true)
    .limit(3);

  const { data: all, error: aErr } = await supabase
    .from('projects')
    .select('name')
    .limit(3);

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(-30),
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-10),
    featured: { count: featured?.length, error: fErr?.message, names: featured?.map(p => p.name) },
    all: { count: all?.length, error: aErr?.message, names: all?.map(p => p.name) },
  });
}
