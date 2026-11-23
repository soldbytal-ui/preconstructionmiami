import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600;

/**
 * Towers that have a detailed model: the volumes traced from filed drawings, with their real
 * outlines, base and top heights. The map draws these as glass buildings when you select or approach them.
 */
export async function GET() {
  const { data } = await supabase.from('projects').select('id, slug, massing').not('massing->filed', 'is', null).limit(200);
  const out: Record<string, unknown> = {};
  for (const p of (data || []) as any[]) {
    const vols = (p.massing?.filed?.volumes || []).filter((v: any) => Array.isArray(v.ring) && v.ring.length >= 4 && v.topM > v.baseM);
    if (!vols.length) continue;
    const ring = (vols.find((v: any) => v.kind !== 'podium') || vols[0]).ring as [number, number][];
    const n = ring.length - 1;
    out[p.id] = {
      id: p.id, slug: p.slug,
      center: [ring.slice(0, n).reduce((a, q) => a + q[0], 0) / n, ring.slice(0, n).reduce((a, q) => a + q[1], 0) / n],
      volumes: vols.map((v: any) => ({ ring: v.ring, baseM: v.baseM, topM: v.topM, kind: v.kind === 'podium' ? 'podium' : 'tower' })),
      colors: p.massing?.colors || {},
      podiumWall: p.massing?.podiumStyle?.wall || null,
      source: p.massing?.filed?.source || null,
    };
  }
  return NextResponse.json(out);
}
